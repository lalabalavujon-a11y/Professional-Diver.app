import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useGPS } from '@/hooks/use-gps';
import { useAutoGPSSync } from '@/hooks/use-auto-gps-sync';
import { fetchPorts, combineLocations, timezonesToLocations, getLocationDetails, type LocationOption } from '@/utils/locations';
import { timezones } from '@/utils/timezones';
import { MapPin, Navigation, Loader2, AlertCircle, X, Radio } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface WidgetLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  locationName: string | null;
  isCurrentLocation: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LocationSelectorProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export default function LocationSelector({ open: controlledOpen, onOpenChange, trigger }: LocationSelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');
  const [addressSearch, setAddressSearch] = useState<string>('');
  const [selectedLocationValue, setSelectedLocationValue] = useState<string>('');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getCurrentPosition, isGettingGPS } = useGPS();
  
  // Auto-sync GPS (PRIMARY location source)
  const { currentPosition, nearestLocation, isSyncing } = useAutoGPSSync({
    enabled: true,
    updateInterval: 60000,
    autoSave: true,
  });

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  // Get user email from localStorage
  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

  // Fetch ports and combine with cities
  const { data: ports = [] } = useQuery({
    queryKey: ['ports'],
    queryFn: fetchPorts,
    staleTime: 60 * 60 * 1000, // Cache for 1 hour
  });

  const cities = timezonesToLocations(timezones);
  const locationOptions = combineLocations(cities, ports);

  // Fetch current widget location
  const { data: currentLocation, isLoading } = useQuery<WidgetLocation>({
    queryKey: ['/api/widgets/location', userEmail],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/widgets/location?email=${encodeURIComponent(userEmail)}`);
        if (response.status === 404) {
          // 404 is expected if no location is set - return null gracefully
          return null;
        }
        if (!response.ok) {
          console.error('Failed to fetch widget location:', response.status, response.statusText);
          return null; // Return null instead of throwing
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching widget location:', error);
        return null; // Return null on error
      }
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: false, // Don't retry on 404
  });

  // Initialize form with current location when dialog opens
  useEffect(() => {
    if (isOpen) {
      if (currentLocation) {
        console.log('Initializing form with current location:', currentLocation);
        setLatitude(currentLocation.latitude.toString());
        setLongitude(currentLocation.longitude.toString());
        setLocationName(currentLocation.locationName || '');
        setSelectedLocationValue(''); // Reset dropdown selection
      } else {
        // Reset form if no location
        console.log('No current location, resetting form');
        setLatitude('');
        setLongitude('');
        setLocationName('');
        setAddressSearch('');
        setSelectedLocationValue('');
      }
    }
  }, [isOpen, currentLocation]);

  // Debug: Log when coordinates change
  useEffect(() => {
    if (isOpen) {
      const latStr = latitude?.trim() || '';
      const lonStr = longitude?.trim() || '';
      const isValid = latStr && lonStr && !isNaN(parseFloat(latStr)) && !isNaN(parseFloat(lonStr));
      console.log('Coordinates changed:', { latitude, longitude, isValid });
    }
  }, [latitude, longitude, isOpen]);

  // Save location mutation
  const saveLocationMutation = useMutation({
    mutationFn: async (data: { latitude: number; longitude: number; locationName?: string; isCurrentLocation?: boolean }) => {
      console.log('Saving location:', { email: userEmail, ...data });
      const response = await fetch('/api/widgets/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          ...data,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('Failed to save location:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          requestData: { email: userEmail, ...data }
        });
        const errorMessage = errorData.error || errorData.details || errorData.message || `Failed to save location (${response.status})`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Location saved successfully:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/widgets/location', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['/api/weather'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tides'] });
      queryClient.invalidateQueries({ queryKey: ['/api/moon-phase'] });
      toast({
        title: "Location saved",
        description: "Widget location has been updated successfully.",
      });
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save location",
        variant: "destructive",
      });
    },
  });

  // Get current GPS location
  const handleGetCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
      
      console.log('GPS position received:', position);
      
      // Populate fields but don't auto-save - let user click Save button
      setLatitude(position.latitude.toString());
      setLongitude(position.longitude.toString());
      setLocationName('Current Location');
      
      console.log('GPS fields populated - latitude:', position.latitude, 'longitude:', position.longitude);
    } catch (error: any) {
      console.error('GPS error:', error);
      const errorMessage = error?.message || error?.code || 'Unknown error';
      toast({
        title: "GPS Location Error",
        description: errorMessage === 'Unknown error' 
          ? 'Please enable location permissions in your browser settings and try again' 
          : errorMessage,
        variant: "destructive",
      });
    }
  };

  // Handle address search (simple geocoding - can be enhanced with a geocoding API)
  const handleSearchAddress = async () => {
    if (!addressSearch.trim()) {
      toast({
        title: "Address required",
        description: "Please enter an address to search.",
        variant: "destructive",
      });
      return;
    }

    // For now, just show a message that this feature needs a geocoding API
    // In production, this would call a geocoding service
    toast({
      title: "Address search",
      description: "Address geocoding requires a geocoding API key. Please enter coordinates manually or use GPS.",
    });
  };

  // Validate coordinates
  const isValidCoordinates = () => {
    const latStr = latitude?.trim() || '';
    const lonStr = longitude?.trim() || '';
    
    // Check if both fields have values
    if (!latStr || !lonStr) {
      return false;
    }
    
    // Parse as numbers
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    
    // Check if parsing was successful and values are finite
    if (isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) {
      return false;
    }
    
    // Check valid ranges
    if (lat < -90 || lat > 90) {
      return false;
    }
    if (lon < -180 || lon > 180) {
      return false;
    }
    
    return true;
  };

  // Validate and save location
  const handleSave = () => {
    if (!isValidCoordinates()) {
      toast({
        title: "Invalid coordinates",
        description: "Please enter valid latitude and longitude values.",
        variant: "destructive",
      });
      return;
    }

    const lat = parseFloat(latitude.trim());
    const lon = parseFloat(longitude.trim());

    // Double-check the values are valid numbers
    if (isNaN(lat) || isNaN(lon) || !isFinite(lat) || !isFinite(lon)) {
      toast({
        title: "Invalid coordinates",
        description: "Please enter valid numeric values for latitude and longitude.",
        variant: "destructive",
      });
      return;
    }

    console.log('Saving location with values:', { lat, lon, locationName });

    saveLocationMutation.mutate({
      latitude: lat,
      longitude: lon,
      locationName: locationName?.trim() || undefined,
      isCurrentLocation: false,
    });
  };

  const handleCancel = () => {
    setIsOpen(false);
    // Reset form to current location
    if (currentLocation) {
      setLatitude(currentLocation.latitude.toString());
      setLongitude(currentLocation.longitude.toString());
      setLocationName(currentLocation.locationName || '');
    }
  };

  return (
    <>
      {trigger ? (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>{trigger}</DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Configure Widget Location</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* GPS Auto-Sync Section (PRIMARY) */}
              <div className="border-2 border-green-200 bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <Radio className="w-4 h-4" />
                  Current GPS Location (Auto-Sync)
                </h4>
                {currentPosition ? (
                  <div className="text-sm space-y-1">
                    <div className="font-mono text-green-800">
                      {currentPosition.latitude.toFixed(6)}, {currentPosition.longitude.toFixed(6)}
                    </div>
                    {nearestLocation && (
                      <div className="text-green-700">
                        📍 Nearest {nearestLocation.type}: <strong>{nearestLocation.name}</strong> ({nearestLocation.distance.toFixed(1)}km away)
                      </div>
                    )}
                    {isSyncing && (
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Updating...
                      </div>
                    )}
                    <div className="text-xs text-green-600 mt-2">
                      Widgets automatically sync with this location
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-green-700">
                    Waiting for GPS signal... {isSyncing && <span className="ml-2">🔄</span>}
                  </div>
                )}
              </div>

              {/* Manual Input Section (SECONDARY - For Search & Planning) */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Manual Location (For Search & Planning)
                </h4>
                <p className="text-xs text-slate-600 mb-4">
                  Use this to search for locations, plan routes, or set a specific location for widgets.
                </p>

              {/* Current saved location display */}
              {currentLocation && !currentLocation.isCurrentLocation && (
                <Card className="mb-4">
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">
                          {currentLocation.locationName || 'Saved Location'}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Location Selector Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="location-select">Select Location</Label>
                <Select
                  value={selectedLocationValue}
                  onValueChange={async (value) => {
                    setSelectedLocationValue(value);
                    if (value) {
                      try {
                        const locationDetails = await getLocationDetails(value);
                        if (locationDetails) {
                          console.log('Location details loaded:', locationDetails);
                          // Ensure coordinates are valid numbers
                          const lat = Number(locationDetails.latitude);
                          const lon = Number(locationDetails.longitude);
                          
                          if (isNaN(lat) || isNaN(lon)) {
                            throw new Error('Invalid coordinates from location details');
                          }
                          
                          // Preserve full precision when setting coordinates
                          setLatitude(lat.toFixed(6));
                          setLongitude(lon.toFixed(6));
                          setLocationName(locationDetails.name || '');
                          console.log('Fields updated - latitude:', lat.toFixed(6), 'longitude:', lon.toFixed(6), 'from location:', locationDetails);
                        } else {
                          toast({
                            title: "Error",
                            description: "Failed to load location details. Please try again or enter coordinates manually.",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        console.error('Error fetching location details:', error);
                        toast({
                          title: "Error",
                          description: error instanceof Error ? error.message : "Failed to load location details",
                          variant: "destructive",
                        });
                      }
                    } else {
                      // Clear fields if no selection
                      setLatitude('');
                      setLongitude('');
                      setLocationName('');
                    }
                  }}
                  disabled={saveLocationMutation.isPending}
                >
                  <SelectTrigger id="location-select">
                    <SelectValue placeholder="Select a port or city..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectGroup>
                      <SelectLabel>Primary Ports</SelectLabel>
                      {locationOptions
                        .filter(loc => loc.type === 'port-primary')
                        .map((loc) => (
                          <SelectItem key={loc.value} value={loc.value}>
                            {loc.label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Secondary Ports</SelectLabel>
                      {locationOptions
                        .filter(loc => loc.type === 'port-secondary')
                        .map((loc) => (
                          <SelectItem key={loc.value} value={loc.value}>
                            {loc.label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Cities</SelectLabel>
                      {locationOptions
                        .filter(loc => loc.type === 'city')
                        .map((loc) => (
                          <SelectItem key={loc.value} value={loc.value}>
                            {loc.label}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              {/* GPS button */}
              <div>
                <Button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isGettingGPS || saveLocationMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  {isGettingGPS ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Getting location...
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 mr-2" />
                      Use Current Location (GPS)
                    </>
                  )}
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
                </div>
              </div>

              {/* Manual coordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="-90 to 90"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    disabled={saveLocationMutation.isPending}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="-180 to 180"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    disabled={saveLocationMutation.isPending}
                  />
                </div>
              </div>

              {/* Location name */}
              <div className="space-y-2">
                <Label htmlFor="locationName">Location Name (Optional)</Label>
                <Input
                  id="locationName"
                  placeholder="e.g., Dive Site, Marina, etc."
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  disabled={saveLocationMutation.isPending}
                />
              </div>

              {/* Address search (optional, for future enhancement) */}
              {/* <div className="space-y-2">
                <Label htmlFor="addressSearch">Search by Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="addressSearch"
                    placeholder="Enter address..."
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    disabled={saveLocationMutation.isPending}
                  />
                  <Button
                    type="button"
                    onClick={handleSearchAddress}
                    disabled={saveLocationMutation.isPending}
                    variant="outline"
                  >
                    Search
                  </Button>
                </div>
              </div> */}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={saveLocationMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                disabled={saveLocationMutation.isPending || !isValidCoordinates()}
              >
                {saveLocationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 mr-2" />
                    Save Location
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : (
        // Standalone display without dialog trigger
        <div className="flex items-center gap-2 text-sm">
          {currentLocation ? (
            <>
              <MapPin className="w-4 h-4 text-slate-500" />
              <span className="text-slate-600">
                {currentLocation.locationName || `${currentLocation.latitude.toFixed(4)}, ${currentLocation.longitude.toFixed(4)}`}
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-slate-600">No location set</span>
            </>
          )}
        </div>
      )}
    </>
  );
}

