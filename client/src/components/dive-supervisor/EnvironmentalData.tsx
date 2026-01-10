/**
 * Environmental Data Component
 * 
 * Displays tides, weather, and wind data for dive operations
 * Integrates with existing weather and tides services
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Cloud,
  Waves,
  Wind,
  RefreshCw,
  MapPin,
  Calendar,
  Thermometer,
  Droplets
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface EnvironmentalDataProps {
  operationId: string | null;
  onOperationSelect: (id: string | null) => void;
}

export default function EnvironmentalData({ operationId, onOperationSelect }: EnvironmentalDataProps) {
  const { toast } = useToast();
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [timezone, setTimezone] = useState<string>("UTC");

  // Fetch operations
  const { data: operations = [] } = useQuery({
    queryKey: ["/api/dive-supervisor/operations"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/operations?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch operations');
      return response.json();
    },
  });

  // Get operation location
  useEffect(() => {
    if (operationId) {
      const operation = operations.find((op: any) => op.id === operationId);
      if (operation?.location) {
        // In a real implementation, this would parse location or fetch coordinates
        // For now, we'll use a default or get from user's saved location
        fetchUserLocation();
      } else {
        fetchUserLocation();
      }
    } else {
      fetchUserLocation();
    }
  }, [operationId, operations]);

  const fetchUserLocation = async () => {
    try {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/widget-locations?email=${email}`);
      if (response.ok) {
        const data = await response.json();
        if (data.locations && data.locations.length > 0) {
          const currentLocation = data.locations.find((loc: any) => loc.isCurrentLocation) || data.locations[0];
          setLocation({ lat: currentLocation.latitude, lon: currentLocation.longitude });
        }
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  // Fetch environmental data
  const { data: environmentalData, isLoading, refetch } = useQuery({
    queryKey: ["/api/dive-supervisor/environmental-data", location?.lat, location?.lon, timezone],
    queryFn: async () => {
      if (!location) throw new Error('Location not available');
      const response = await fetch(
        `/api/dive-supervisor/environmental-data?lat=${location.lat}&lon=${location.lon}&timezone=${timezone}`
      );
      if (!response.ok) throw new Error('Failed to fetch environmental data');
      return response.json();
    },
    enabled: !!location,
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing",
      description: "Environmental data is being updated",
    });
  };

  if (!operationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>Choose an operation to view environmental data</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={operationId || "none"}
              onValueChange={(value) => onOperationSelect(value === "none" ? null : value)}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select Operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select Operation</SelectItem>
                {operations.map((op: any) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Environmental Data</h2>
          <p className="text-sm text-muted-foreground">
            Tides, weather, and wind conditions for dive operations
          </p>
        </div>
        <div className="flex space-x-2">
          <Select
            value={operationId}
            onValueChange={(value) => onOperationSelect(value)}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operations.map((op: any) => (
                <SelectItem key={op.id} value={op.id}>
                  {op.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {!location && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Location not available. Please set a location in widget settings.</p>
          </CardContent>
        </Card>
      )}

      {location && isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading environmental data...</p>
          </CardContent>
        </Card>
      )}

      {location && environmentalData && (
        <>
          {/* Weather Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Cloud className="w-5 h-5" />
                <span>Weather Conditions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {environmentalData.weather ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <Thermometer className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="text-sm text-muted-foreground">Temperature</div>
                      <div className="text-2xl font-bold">
                        {environmentalData.weather.temperature}°C
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Cloud className="w-8 h-8 text-gray-600" />
                    <div>
                      <div className="text-sm text-muted-foreground">Conditions</div>
                      <div className="text-lg font-semibold">
                        {environmentalData.weather.conditions || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Droplets className="w-8 h-8 text-cyan-600" />
                    <div>
                      <div className="text-sm text-muted-foreground">Humidity</div>
                      <div className="text-lg font-semibold">
                        {environmentalData.weather.humidity ? `${environmentalData.weather.humidity}%` : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Weather data not available</p>
              )}
            </CardContent>
          </Card>

          {/* Wind Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wind className="w-5 h-5" />
                <span>Wind Conditions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {environmentalData.weather?.wind ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Wind Speed</div>
                    <div className="text-2xl font-bold">
                      {environmentalData.weather.wind.speed || "N/A"}
                      {environmentalData.weather.wind.speed && (
                        <span className="text-lg text-muted-foreground ml-1">mph</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Wind Direction</div>
                    <div className="text-2xl font-bold">
                      {environmentalData.weather.wind.direction || "N/A"}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Wind data not available</p>
              )}
            </CardContent>
          </Card>

          {/* Tide Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Waves className="w-5 h-5" />
                <span>Tide Times & Current</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {environmentalData.tides ? (
                <div className="space-y-4">
                  {environmentalData.tides.today && (
                    <div>
                      <div className="text-sm font-semibold mb-2">Today's Tides</div>
                      <div className="grid grid-cols-2 gap-4">
                        {environmentalData.tides.today.map((tide: any, idx: number) => (
                          <div key={idx} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant={tide.type === "HIGH" ? "default" : "secondary"}>
                                {tide.type}
                              </Badge>
                              <div className="text-sm font-medium">
                                {tide.time ? format(new Date(tide.time), "HH:mm") : "N/A"}
                              </div>
                            </div>
                            {tide.height && (
                              <div className="text-sm text-muted-foreground">
                                Height: {tide.height}m
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {environmentalData.tides.current && (
                    <div>
                      <div className="text-sm font-semibold mb-2">Current Status</div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline">
                          {environmentalData.tides.current.state || "N/A"}
                        </Badge>
                        {environmentalData.tides.current.nextChange && (
                          <div className="text-sm text-muted-foreground">
                            Next change: {format(new Date(environmentalData.tides.current.nextChange), "HH:mm")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Tide data not available</p>
              )}
            </CardContent>
          </Card>

          {/* Location Info */}
          {location && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>
                    Location: {location.lat.toFixed(4)}°N, {location.lon.toFixed(4)}°W
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}







