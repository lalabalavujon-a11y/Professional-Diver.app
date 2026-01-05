import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Compass, MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { getLocationDetails } from '@/utils/locations';
import { useGPS } from '@/hooks/use-gps';

interface CompactNavigationWidgetProps {
  latitude?: number;
  longitude?: number;
}

interface WidgetLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  locationName: string | null;
  isCurrentLocation: boolean;
}

// Convert decimal degrees to Degrees, Minutes, Seconds format
function decimalToDMS(decimal: number, isLatitude: boolean): string {
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesFloat = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesFloat);
  const seconds = (minutesFloat - minutes) * 60;

  // Determine direction (N/S for latitude, E/W for longitude)
  const direction = isLatitude
    ? decimal >= 0 ? 'N' : 'S'
    : decimal >= 0 ? 'E' : 'W';

  return `${degrees}° ${minutes}' ${seconds.toFixed(1)}" ${direction}`;
}

export default function CompactNavigationWidget({ latitude, longitude }: CompactNavigationWidgetProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getCurrentPosition, isGettingGPS } = useGPS();

  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

  // Always fetch widget location to get the latest data
  const { data: widgetLocation, isLoading, refetch } = useQuery<WidgetLocation | null>({
    queryKey: ['/api/widgets/location', userEmail],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/widgets/location?email=${encodeURIComponent(userEmail)}`);
        if (response.status === 404) {
          console.log('No saved location found, using default');
          return null;
        }
        if (!response.ok) {
          console.error('Failed to fetch widget location:', response.status, response.statusText);
          return null; // Return null instead of throwing to use default
        }
        const data = await response.json();
        console.log('Widget location loaded:', data);
        return data;
      } catch (error) {
        console.error('Error fetching widget location:', error);
        return null; // Return null to use default location
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 1, // Only retry once
  });


  // Get location preference from Profile Settings (ports/cities) - SECONDARY fallback
  const { data: locationPreference } = useQuery({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      const storedPrefs = localStorage.getItem('userPreferences');
      if (storedPrefs) {
        try {
          const prefs = JSON.parse(storedPrefs);
          return prefs.location || prefs.timezone || null;
        } catch {
          return null;
        }
      }
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Get coordinates from location preference (port/city) - SECONDARY fallback
  const { data: preferenceCoordinates } = useQuery({
    queryKey: ['locationPreferenceCoordinates', locationPreference],
    queryFn: async () => {
      if (!locationPreference) return null;
      return await getLocationDetails(locationPreference);
    },
    enabled: !!locationPreference,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  // Default location (Southampton, UK - River Test swinging grounds)
  const DEFAULT_LAT = 50.9097;
  const DEFAULT_LON = -1.4044;

  // Use provided coordinates first, then widget location (no default fallback)
  // Priority: 1) Provided props, 2) GPS/widgetLocation (PRIMARY), 3) Location preference port/city (SECONDARY), 4) Default
  const currentLat = latitude !== undefined 
    ? latitude 
    : (widgetLocation?.latitude !== undefined && widgetLocation?.isCurrentLocation)
      ? widgetLocation.latitude  // GPS takes priority (PRIMARY)
      : (widgetLocation?.latitude !== undefined)
        ? widgetLocation.latitude  // Saved widget location
        : (preferenceCoordinates?.latitude !== undefined)
          ? preferenceCoordinates.latitude  // Port/City preference (SECONDARY fallback)
          : DEFAULT_LAT;

  const currentLon = longitude !== undefined 
    ? longitude 
    : (widgetLocation?.longitude !== undefined && widgetLocation?.isCurrentLocation)
      ? widgetLocation.longitude  // GPS takes priority (PRIMARY)
      : (widgetLocation?.longitude !== undefined)
        ? widgetLocation.longitude  // Saved widget location
        : (preferenceCoordinates?.longitude !== undefined)
          ? preferenceCoordinates.longitude  // Port/City preference (SECONDARY fallback)
          : DEFAULT_LON;

  // Ensure currentLat and currentLon are always numbers (fallback to defaults if undefined)
  const safeLat = typeof currentLat === 'number' && !isNaN(currentLat) ? currentLat : DEFAULT_LAT;
  const safeLon = typeof currentLon === 'number' && !isNaN(currentLon) ? currentLon : DEFAULT_LON;


  const hasSetLocation = widgetLocation !== null && widgetLocation !== undefined;

  // Handle GPS location request
  const handleGetGPS = async () => {
    console.log('GPS button clicked');
    try {
      console.log('Requesting GPS location...');
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
      
      console.log('GPS position received:', position.latitude, position.longitude);
      
      // Save GPS location to backend
      const response = await fetch('/api/widgets/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          latitude: position.latitude,
          longitude: position.longitude,
          locationName: 'Current Location',
          isCurrentLocation: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to save location:', errorData);
        throw new Error(errorData.error || 'Failed to save location');
      }

      const savedLocation = await response.json();
      console.log('Location saved:', savedLocation);

      // Invalidate queries to refresh
      await queryClient.invalidateQueries({ queryKey: ['/api/widgets/location', userEmail] });
      await queryClient.invalidateQueries({ queryKey: ['/api/weather'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/tides'] });
      
      // Force a refetch
      await queryClient.refetchQueries({ queryKey: ['/api/widgets/location', userEmail] });
      // Also manually refetch this component's query
      await refetch();

      toast({
        title: "Location updated",
        description: `GPS location saved: ${position.latitude.toFixed(4)}, ${position.longitude.toFixed(4)}`,
      });
    } catch (error: any) {
      console.error('Error getting/saving GPS location:', error);
      toast({
        title: "Location error",
          description: error.message || 'Failed to get location.',
        variant: "destructive",
      });
      // Refresh to show default location
      queryClient.invalidateQueries({ queryKey: ['/api/widgets/location', userEmail] });
    }
  };

  if (isLoading && !hasSetLocation && latitude === undefined && longitude === undefined) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200 animate-pulse">
        <Compass className="w-4 h-4 text-blue-300 flex-shrink-0" />
        <div className="h-4 w-16 bg-blue-200 rounded"></div>
      </div>
    );
  }

  const latDMS = decimalToDMS(safeLat, true);
  const lonDMS = decimalToDMS(safeLon, false);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
      <Compass className="w-4 h-4 text-blue-500 flex-shrink-0" />
      <div className="flex flex-col min-w-0 flex-1">
        <div className="text-xs font-semibold text-slate-900 leading-tight">
          <MapPin className="w-3 h-3 inline mr-1" />
          {widgetLocation?.locationName || 'No location set'}
        </div>
          <div className="text-[10px] text-slate-600 leading-tight font-mono" title={`Latitude: ${safeLat.toFixed(6)}°`}>
            {latDMS}
          </div>
          <div className="text-[10px] text-slate-600 leading-tight font-mono" title={`Longitude: ${safeLon.toFixed(6)}°`}>
            {lonDMS}
          </div>
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={handleGetGPS}
        disabled={isGettingGPS}
        className="h-7 w-7 flex-shrink-0 border-blue-300 hover:bg-blue-100"
        title="Get GPS Location (Click to update)"
      >
        {isGettingGPS ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
        ) : (
          <Navigation className="w-3.5 h-3.5 text-blue-600" />
        )}
      </Button>
    </div>
  );
}

