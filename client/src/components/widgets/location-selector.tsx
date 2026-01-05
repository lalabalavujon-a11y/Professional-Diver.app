import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectLabel, SelectGroup } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useGPS } from '@/hooks/use-gps';
import { fetchPorts, combineLocations, timezonesToLocations, getLocationDetails, type LocationOption } from '@/utils/locations';
import { timezones } from '@/utils/timezones';
import { MapPin, Navigation, Loader2, AlertCircle, X } from 'lucide-react';
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
      const response = await fetch(`/api/widgets/location?email=${encodeURIComponent(userEmail)}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch widget location');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Initialize form with current location when dialog opens
  useEffect(() => {
    if (isOpen && currentLocation) {
      setLatitude(currentLocation.latitude.toString());
      setLongitude(currentLocation.longitude.toString());
      setLocationName(currentLocation.locationName || '');
    } else if (isOpen && !currentLocation) {
      // Reset form if no location
      setLatitude('');
      setLongitude('');
      setLocationName('');
      setAddressSearch('');
    }
  }, [isOpen, currentLocation]);

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
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to save location:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || errorData.details || 'Failed to save location');
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
      
      setLatitude(position.latitude.toString());
      setLongitude(position.longitude.toString());
      setLocationName('Current Location');
      
      // Auto-save GPS location
      saveLocationMutation.mutate({
        latitude: position.latitude,
        longitude: position.longitude,
        locationName: 'Current Location',
        isCurrentLocation: true,
      });
    } catch (error: any) {
      toast({
        title: "Location error",
        description: error.message || 'Failed to get location',
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

  // Validate and save location
  const handleSave = () => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
      toast({
        title: "Invalid coordinates",
        description: "Please enter valid latitude and longitude values.",
        variant: "destructive",
      });
      return;
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      toast({
        title: "Invalid coordinates",
        description: "Latitude must be between -90 and 90, longitude between -180 and 180.",
        variant: "destructive",
      });
      return;
    }

    saveLocationMutation.mutate({
      latitude: lat,
      longitude: lon,
      locationName: locationName || undefined,
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
              {/* Current location display */}
              {currentLocation && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-slate-900">
                          {currentLocation.locationName || 'Saved Location'}
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                        </div>
                        {currentLocation.isCurrentLocation && (
                          <div className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <Navigation className="w-3 h-3" />
                            Current Location
                          </div>
                        )}
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
                          setLatitude(locationDetails.latitude.toString());
                          setLongitude(locationDetails.longitude.toString());
                          setLocationName(locationDetails.name);
                          
                          // Auto-save the selected location
                          saveLocationMutation.mutate({
                            latitude: locationDetails.latitude,
                            longitude: locationDetails.longitude,
                            locationName: locationDetails.name,
                            isCurrentLocation: false,
                          });
                        }
                      } catch (error) {
                        console.error('Error fetching location details:', error);
                        toast({
                          title: "Error",
                          description: "Failed to load location details",
                          variant: "destructive",
                        });
                      }
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
                disabled={saveLocationMutation.isPending || !latitude || !longitude}
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

