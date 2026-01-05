/**
 * MED OPS / Emergency OPS Component
 * 
 * Provides access to emergency medical facilities worldwide:
 * - A&E (Accident & Emergency)
 * - Critical Care units
 * - Diving Doctors
 * - Hyperbaric chambers
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  HeartPulse, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Navigation,
  CheckCircle,
  Star,
  AlertCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGPS } from "@/hooks/use-gps";
import { apiRequest } from "@/lib/queryClient";

type MedicalFacilityType = 'A_E' | 'CRITICAL_CARE' | 'DIVING_DOCTOR' | 'HYPERBARIC';

interface MedicalFacility {
  id: string;
  name: string;
  type: MedicalFacilityType;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country: string;
  region?: string;
  phone?: string;
  emergencyPhone?: string;
  email?: string;
  website?: string;
  specialties?: string[];
  services?: string[];
  isAvailable24h: boolean;
  notes?: string;
  isVerified: boolean;
  distanceKm?: number;
}

export default function MedOpsApp() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getCurrentPosition } = useGPS();
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<MedicalFacilityType[]>([]);
  const [radiusKm, setRadiusKm] = useState<number>(200);
  const [searchCountry, setSearchCountry] = useState<string>('');

  // Get user's email for API calls
  const userEmail = typeof window !== 'undefined' ? localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com' : '';

  // Fetch medical facilities
  const { data: facilitiesData, isLoading } = useQuery({
    queryKey: ['/api/medical-facilities', selectedLocation, selectedTypes, radiusKm, searchCountry],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedLocation) {
        params.append('lat', selectedLocation.lat.toString());
        params.append('lon', selectedLocation.lon.toString());
        params.append('radiusKm', radiusKm.toString());
      }
      if (selectedTypes.length > 0) {
        params.append('types', selectedTypes.join(','));
      }
      if (searchCountry) {
        params.append('country', searchCountry);
      }
      params.append('email', userEmail);

      const response = await fetch(`/api/medical-facilities?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch medical facilities');
      return response.json();
    },
    enabled: true,
  });

  // Fetch user's selected facilities
  const { data: userFacilitiesData } = useQuery({
    queryKey: ['/api/medical-facilities/user-selections'],
    queryFn: async () => {
      const response = await fetch(`/api/medical-facilities/user-selections?email=${userEmail}`);
      if (!response.ok) throw new Error('Failed to fetch user facilities');
      return response.json();
    },
  });

  // Add facility to user selections
  const addFacilityMutation = useMutation({
    mutationFn: async ({ facilityId, isPrimary }: { facilityId: string; isPrimary: boolean }) => {
      return await apiRequest('POST', '/api/medical-facilities/user-selections', {
        facilityId,
        isPrimary,
        email: userEmail,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medical-facilities/user-selections'] });
      toast({
        title: "Facility Added",
        description: "Medical facility has been added to your selections.",
      });
    },
  });

  // Remove facility from user selections
  const removeFacilityMutation = useMutation({
    mutationFn: async (facilityId: string) => {
      return await apiRequest('DELETE', `/api/medical-facilities/user-selections/${facilityId}?email=${userEmail}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/medical-facilities/user-selections'] });
      toast({
        title: "Facility Removed",
        description: "Medical facility has been removed from your selections.",
      });
    },
  });

  // Get user's current location
  const handleGetLocation = async () => {
    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
      
      setSelectedLocation({
        lat: position.latitude,
        lon: position.longitude,
      });
      
      toast({
        title: "Location Updated",
        description: "Using your current location to find nearby facilities.",
      });
    } catch (error: any) {
      toast({
        title: "Location Error",
        description: error.message || "Unable to get your location. Please enter coordinates manually.",
        variant: "destructive",
      });
    }
  };

  const facilities: MedicalFacility[] = facilitiesData?.facilities || [];
  const userFacilities: MedicalFacility[] = userFacilitiesData?.facilities || [];
  const userFacilityIds = new Set(userFacilities.map(f => f.id));

  const getTypeLabel = (type: MedicalFacilityType): string => {
    switch (type) {
      case 'A_E': return 'A&E';
      case 'CRITICAL_CARE': return 'Critical Care';
      case 'DIVING_DOCTOR': return 'Diving Doctor';
      case 'HYPERBARIC': return 'Hyperbaric';
      default: return type;
    }
  };

  const getTypeColor = (type: MedicalFacilityType): string => {
    switch (type) {
      case 'A_E': return 'bg-red-100 text-red-800';
      case 'CRITICAL_CARE': return 'bg-orange-100 text-orange-800';
      case 'DIVING_DOCTOR': return 'bg-blue-100 text-blue-800';
      case 'HYPERBARIC': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>Location Selection</span>
          </CardTitle>
          <CardDescription>
            Select a location to find nearest medical facilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                placeholder="e.g., 51.5074"
                value={selectedLocation?.lat || ''}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value);
                  if (!isNaN(lat)) {
                    setSelectedLocation({ lat, lon: selectedLocation?.lon || 0 });
                  } else if (e.target.value === '') {
                    setSelectedLocation(null);
                  }
                }}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                placeholder="e.g., -0.1278"
                value={selectedLocation?.lon || ''}
                onChange={(e) => {
                  const lon = parseFloat(e.target.value);
                  if (!isNaN(lon) && selectedLocation) {
                    setSelectedLocation({ lat: selectedLocation.lat, lon });
                  }
                }}
              />
            </div>
            <Button onClick={handleGetLocation} variant="outline">
              <Navigation className="w-4 h-4 mr-2" />
              Use My Location
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="radius">Search Radius (km)</Label>
              <Input
                id="radius"
                type="number"
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseFloat(e.target.value) || 200)}
                min={10}
                max={1000}
              />
            </div>
            <div>
              <Label htmlFor="country">Country (Optional)</Label>
              <Input
                id="country"
                type="text"
                placeholder="e.g., United Kingdom"
                value={searchCountry}
                onChange={(e) => setSearchCountry(e.target.value)}
              />
            </div>
            <div>
              <Label>Facility Types</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {(['A_E', 'CRITICAL_CARE', 'DIVING_DOCTOR', 'HYPERBARIC'] as MedicalFacilityType[]).map((type) => (
                  <Button
                    key={type}
                    variant={selectedTypes.includes(type) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setSelectedTypes(prev =>
                        prev.includes(type)
                          ? prev.filter(t => t !== type)
                          : [...prev, type]
                      );
                    }}
                  >
                    {getTypeLabel(type)}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Facilities Display */}
      <Tabs defaultValue="nearby" className="space-y-4">
        <TabsList>
          <TabsTrigger value="nearby">
            Nearby Facilities {facilities.length > 0 && `(${facilities.length})`}
          </TabsTrigger>
          <TabsTrigger value="selected">
            My Selected Facilities {userFacilities.length > 0 && `(${userFacilities.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nearby" className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-slate-600">Loading medical facilities...</p>
              </CardContent>
            </Card>
          ) : facilities.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No facilities found. Try adjusting your search criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {facilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  isSelected={userFacilityIds.has(facility.id)}
                  onAdd={() => addFacilityMutation.mutate({ facilityId: facility.id, isPrimary: false })}
                  onRemove={() => removeFacilityMutation.mutate(facility.id)}
                  getTypeLabel={getTypeLabel}
                  getTypeColor={getTypeColor}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="selected" className="space-y-4">
          {userFacilities.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Star className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No facilities selected. Add facilities from the "Nearby Facilities" tab.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {userFacilities.map((facility) => (
                <FacilityCard
                  key={facility.id}
                  facility={facility}
                  isSelected={true}
                  onAdd={() => {}}
                  onRemove={() => removeFacilityMutation.mutate(facility.id)}
                  getTypeLabel={getTypeLabel}
                  getTypeColor={getTypeColor}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface FacilityCardProps {
  facility: MedicalFacility;
  isSelected: boolean;
  onAdd: () => void;
  onRemove: () => void;
  getTypeLabel: (type: MedicalFacilityType) => string;
  getTypeColor: (type: MedicalFacilityType) => string;
}

function FacilityCard({ facility, isSelected, onAdd, onRemove, getTypeLabel, getTypeColor }: FacilityCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center space-x-2">
              <HeartPulse className="w-5 h-5 text-red-600" />
              <span>{facility.name}</span>
              {facility.isVerified && (
                <Badge variant="secondary" className="ml-2">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center space-x-4">
                <Badge className={getTypeColor(facility.type)}>
                  {getTypeLabel(facility.type)}
                </Badge>
                {facility.isAvailable24h && (
                  <Badge variant="outline" className="flex items-center">
                    <Clock className="w-3 h-3 mr-1" />
                    24/7 Available
                  </Badge>
                )}
                {facility.distanceKm !== undefined && (
                  <span className="text-sm text-slate-600">
                    {facility.distanceKm.toFixed(1)} km away
                  </span>
                )}
              </div>
            </CardDescription>
          </div>
          <div>
            {isSelected ? (
              <Button variant="outline" size="sm" onClick={onRemove}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Selected
              </Button>
            ) : (
              <Button variant="default" size="sm" onClick={onAdd}>
                <Star className="w-4 h-4 mr-2" />
                Add
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-start space-x-2 text-sm">
              <MapPin className="w-4 h-4 text-slate-500 mt-0.5" />
              <div>
                {facility.address && <div>{facility.address}</div>}
                {facility.city && <div>{facility.city}</div>}
                <div>{facility.region && `${facility.region}, `}{facility.country}</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            {facility.emergencyPhone && (
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="w-4 h-4 text-red-600" />
                <a href={`tel:${facility.emergencyPhone}`} className="text-red-600 hover:underline font-medium">
                  {facility.emergencyPhone} (Emergency)
                </a>
              </div>
            )}
            {facility.phone && !facility.emergencyPhone && (
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="w-4 h-4 text-slate-600" />
                <a href={`tel:${facility.phone}`} className="text-slate-700 hover:underline">
                  {facility.phone}
                </a>
              </div>
            )}
            {facility.email && (
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="w-4 h-4 text-slate-600" />
                <a href={`mailto:${facility.email}`} className="text-slate-700 hover:underline">
                  {facility.email}
                </a>
              </div>
            )}
            {facility.website && (
              <div className="flex items-center space-x-2 text-sm">
                <Globe className="w-4 h-4 text-slate-600" />
                <a href={facility.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Website
                </a>
              </div>
            )}
          </div>
        </div>

        {facility.specialties && facility.specialties.length > 0 && (
          <div>
            <Label className="text-xs text-slate-600">Specialties</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {facility.specialties.map((specialty, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {facility.services && facility.services.length > 0 && (
          <div>
            <Label className="text-xs text-slate-600">Services</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {facility.services.map((service, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {service}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {facility.notes && (
          <div className="text-sm text-slate-600 italic">
            {facility.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

