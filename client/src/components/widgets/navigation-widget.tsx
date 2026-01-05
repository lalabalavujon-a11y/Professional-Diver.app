import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useGPS } from '@/hooks/use-gps';
import { Compass, MapPin, Navigation, Plus, Trash2, Route, X, AlertCircle, Loader2 } from 'lucide-react';
import { getLocationDetails } from '@/utils/locations';

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

import { Badge } from '@/components/ui/badge';

interface NavigationWaypoint {
  id: string;
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NavigationRoute {
  id: string;
  userId: string;
  name: string;
  waypointIds: string[] | { [key: string]: any }; // Can be array or JSON string
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface WidgetLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  locationName: string | null;
  isCurrentLocation: boolean;
}

interface NavigationWidgetProps {
  latitude?: number;
  longitude?: number;
}

export default function NavigationWidget({ latitude, longitude }: NavigationWidgetProps) {
  const [waypointDialogOpen, setWaypointDialogOpen] = useState(false);
  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [selectedWaypoint, setSelectedWaypoint] = useState<NavigationWaypoint | null>(null);
  const [newWaypointName, setNewWaypointName] = useState('');
  const [newWaypointLat, setNewWaypointLat] = useState('');
  const [newWaypointLon, setNewWaypointLon] = useState('');
  const [newWaypointDesc, setNewWaypointDesc] = useState('');
  const [newRouteName, setNewRouteName] = useState('');
  const [selectedRouteWaypoints, setSelectedRouteWaypoints] = useState<string[]>([]);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { getCurrentPosition, isGettingGPS } = useGPS();

  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

  // Get widget location
  const { data: widgetLocation, refetch } = useQuery<WidgetLocation | null>({
    queryKey: ['/api/widgets/location', userEmail],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/widgets/location?email=${encodeURIComponent(userEmail)}`);
        if (response.status === 404) {
          console.log('No saved location found');
          return null;
        }
        if (!response.ok) {
          console.error('Failed to fetch widget location:', response.status, response.statusText);
          return null;
        }
        const data = await response.json();
        console.log('Widget location loaded:', data);
        return data;
      } catch (error) {
        console.error('Error fetching widget location:', error);
        return null;
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
    
  const { data: waypoints = [], isLoading: waypointsLoading } = useQuery<NavigationWaypoint[]>({
    queryKey: ['/api/navigation/waypoints', userEmail],
    queryFn: async () => {
      const response = await fetch(`/api/navigation/waypoints?email=${encodeURIComponent(userEmail)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch waypoints');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch routes
  const { data: routes = [], isLoading: routesLoading } = useQuery<NavigationRoute[]>({
    queryKey: ['/api/navigation/routes', userEmail],
    queryFn: async () => {
      const response = await fetch(`/api/navigation/routes?email=${encodeURIComponent(userEmail)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch routes');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  // Create waypoint mutation
  const createWaypointMutation = useMutation({
    mutationFn: async (data: { name: string; latitude: number; longitude: number; description?: string }) => {
      const response = await fetch('/api/navigation/waypoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, ...data }),
      });
      if (!response.ok) {
        throw new Error('Failed to create waypoint');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/navigation/waypoints', userEmail] });
      toast({ title: "Waypoint created", description: "Waypoint has been added successfully." });
      setWaypointDialogOpen(false);
      resetWaypointForm();
    },
  });

  // Delete waypoint mutation
  const deleteWaypointMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/navigation/waypoints/${id}?email=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete waypoint');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/navigation/waypoints', userEmail] });
      queryClient.invalidateQueries({ queryKey: ['/api/navigation/routes', userEmail] });
      toast({ title: "Waypoint deleted", description: "Waypoint has been removed." });
    },
  });

  // Create route mutation
  const createRouteMutation = useMutation({
    mutationFn: async (data: { name: string; waypointIds: string[]; description?: string }) => {
      const response = await fetch('/api/navigation/routes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, ...data }),
      });
      if (!response.ok) {
        throw new Error('Failed to create route');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/navigation/routes', userEmail] });
      toast({ title: "Route created", description: "Route has been created successfully." });
      setRouteDialogOpen(false);
      resetRouteForm();
    },
  });

  // Delete route mutation
  const deleteRouteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/navigation/routes/${id}?email=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete route');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/navigation/routes', userEmail] });
      toast({ title: "Route deleted", description: "Route has been removed." });
    },
  });

  const resetWaypointForm = () => {
    setNewWaypointName('');
    setNewWaypointLat(currentLat !== undefined ? currentLat.toString() : '');
    setNewWaypointLon(currentLon !== undefined ? currentLon.toString() : '');
    setNewWaypointDesc('');
    setSelectedWaypoint(null);
  };

  const resetRouteForm = () => {
    setNewRouteName('');
    setSelectedRouteWaypoints([]);
  };

  const handleCreateWaypoint = () => {
    const lat = parseFloat(newWaypointLat);
    const lon = parseFloat(newWaypointLon);

    if (!newWaypointName.trim()) {
      toast({ title: "Name required", description: "Please enter a waypoint name.", variant: "destructive" });
      return;
    }

    if (isNaN(lat) || isNaN(lon)) {
      toast({ title: "Invalid coordinates", description: "Please enter valid latitude and longitude.", variant: "destructive" });
      return;
    }

    createWaypointMutation.mutate({
      name: newWaypointName,
      latitude: lat,
      longitude: lon,
      description: newWaypointDesc || undefined,
    });
  };

  const handleCreateRoute = () => {
    if (!newRouteName.trim()) {
      toast({ title: "Name required", description: "Please enter a route name.", variant: "destructive" });
      return;
    }

    if (selectedRouteWaypoints.length < 2) {
      toast({ title: "Invalid route", description: "Please select at least 2 waypoints.", variant: "destructive" });
      return;
    }

    createRouteMutation.mutate({
      name: newRouteName,
      waypointIds: selectedRouteWaypoints,
      description: undefined,
    });
  };

  // Handle GPS location request for widget location
  const handleGetGPS = async () => {
    console.log('GPS button clicked in NavigationWidget');
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

  const useCurrentLocation = () => {
    if (currentLat === undefined || currentLon === undefined) {
      toast({ title: "No location", description: "Please set a widget location first.", variant: "destructive" });
      return;
    }
    setNewWaypointLat(currentLat.toString());
    setNewWaypointLon(currentLon.toString());
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg">Navigation</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current location */}
        <div className="p-3 bg-slate-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="text-xs text-slate-500 mb-1">Current Location</div>
              <div className="text-xs font-semibold text-slate-900 mb-1">
                {widgetLocation?.locationName || 'No location set'}
              </div>
              <div className="text-xs font-mono text-slate-700 leading-tight">
                {decimalToDMS(currentLat, true)}
              </div>
              <div className="text-xs font-mono text-slate-700 leading-tight">
                {decimalToDMS(currentLon, false)}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Decimal: {currentLat.toFixed(6)}, {currentLon.toFixed(6)}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetGPS}
              disabled={isGettingGPS}
              title="Get GPS Location (Click to update)"
              className="ml-2 border-blue-300 hover:bg-blue-100"
            >
              {isGettingGPS ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-blue-600" />
                  <span className="text-xs">Getting...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-xs">GPS</span>
                </>
              )}
            </Button>
          </div>
        </div>{/* Simple map placeholder */}
        {currentLat !== undefined && currentLon !== undefined && (
          <div className="w-full h-48 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center relative overflow-hidden">
            <>
              {/* Map placeholder with coordinates */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-slate-100">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-slate-700">
                      {currentLat.toFixed(4)}, {currentLon.toFixed(4)}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {waypoints.length} waypoint{waypoints.length !== 1 ? 's' : ''} • {routes.length} route{routes.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                {/* Waypoints as dots */}
                {waypoints.map((wp) => (
                  <div
                    key={wp.id}
                    className="absolute w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-sm"
                    style={{
                      left: `${50 + (wp.longitude - currentLon) * 1000}%`,
                      top: `${50 - (wp.latitude - currentLat) * 1000}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                    title={wp.name}
                  />
                ))}
              </div>
              <div className="absolute bottom-2 right-2 text-xs text-slate-500 bg-white/80 px-2 py-1 rounded">
                Map view (enhance with Leaflet/OpenSeaMap)
              </div>
            </>
          </div>
        )}

        {/* Waypoints section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Waypoints</Label>
            <Dialog open={waypointDialogOpen} onOpenChange={setWaypointDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" onClick={resetWaypointForm}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Waypoint</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="wp-name">Name *</Label>
                    <Input
                      id="wp-name"
                      value={newWaypointName}
                      onChange={(e) => setNewWaypointName(e.target.value)}
                      placeholder="e.g., Dive Site A"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wp-lat">Latitude *</Label>
                      <Input
                        id="wp-lat"
                        type="number"
                        step="any"
                        value={newWaypointLat}
                        onChange={(e) => setNewWaypointLat(e.target.value)}
                        placeholder="-90 to 90"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wp-lon">Longitude *</Label>
                      <Input
                        id="wp-lon"
                        type="number"
                        step="any"
                        value={newWaypointLon}
                        onChange={(e) => setNewWaypointLon(e.target.value)}
                        placeholder="-180 to 180"
                      />
                    </div>
                  </div>
                  {currentLat !== undefined && currentLon !== undefined && (
                    <Button type="button" variant="outline" size="sm" onClick={useCurrentLocation} className="w-full">
                      <Navigation className="w-4 h-4 mr-2" />
                      Use Current Location
                    </Button>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="wp-desc">Description (Optional)</Label>
                    <Input
                      id="wp-desc"
                      value={newWaypointDesc}
                      onChange={(e) => setNewWaypointDesc(e.target.value)}
                      placeholder="Additional notes"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setWaypointDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateWaypoint} disabled={createWaypointMutation.isPending}>
                    {createWaypointMutation.isPending ? 'Creating...' : 'Create Waypoint'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {waypointsLoading ? (
            <div className="text-sm text-slate-400">Loading waypoints...</div>
          ) : waypoints.length === 0 ? (
            <div className="text-sm text-slate-400 py-4 text-center">No waypoints yet</div>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {waypoints.map((wp) => (
                <div key={wp.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-900 truncate">{wp.name}</div>
                    <div className="text-xs text-slate-600">
                      {wp.latitude.toFixed(4)}, {wp.longitude.toFixed(4)}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteWaypointMutation.mutate(wp.id)}
                    disabled={deleteWaypointMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Routes section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Routes</Label>
            <Dialog open={routeDialogOpen} onOpenChange={setRouteDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" onClick={resetRouteForm} disabled={waypoints.length < 2}>
                  <Route className="w-4 h-4 mr-1" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Route</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="route-name">Route Name *</Label>
                    <Input
                      id="route-name"
                      value={newRouteName}
                      onChange={(e) => setNewRouteName(e.target.value)}
                      placeholder="e.g., Dive Site Circuit"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Select Waypoints (at least 2) *</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border rounded p-2">
                      {waypoints.length === 0 ? (
                        <div className="text-sm text-slate-400 py-4 text-center">No waypoints available</div>
                      ) : (
                        waypoints.map((wp) => (
                          <div key={wp.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`route-wp-${wp.id}`}
                              checked={selectedRouteWaypoints.includes(wp.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedRouteWaypoints([...selectedRouteWaypoints, wp.id]);
                                } else {
                                  setSelectedRouteWaypoints(selectedRouteWaypoints.filter((id) => id !== wp.id));
                                }
                              }}
                              className="rounded border-slate-300"
                            />
                            <Label htmlFor={`route-wp-${wp.id}`} className="flex-1 cursor-pointer text-sm">
                              {wp.name} ({wp.latitude.toFixed(4)}, {wp.longitude.toFixed(4)})
                            </Label>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRouteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateRoute} disabled={createRouteMutation.isPending}>
                    {createRouteMutation.isPending ? 'Creating...' : 'Create Route'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          {routesLoading ? (
            <div className="text-sm text-slate-400">Loading routes...</div>
          ) : routes.length === 0 ? (
            <div className="text-sm text-slate-400 py-4 text-center">No routes yet</div>
          ) : (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {routes.map((route) => {
                const waypointIds = Array.isArray(route.waypointIds)
                  ? route.waypointIds
                  : typeof route.waypointIds === 'string'
                  ? JSON.parse(route.waypointIds)
                  : [];
                return (
                  <div key={route.id} className="flex items-center justify-between p-2 bg-slate-50 rounded border text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">{route.name}</div>
                      <div className="text-xs text-slate-600">{waypointIds.length} waypoints</div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteRouteMutation.mutate(route.id)}
                      disabled={deleteRouteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

