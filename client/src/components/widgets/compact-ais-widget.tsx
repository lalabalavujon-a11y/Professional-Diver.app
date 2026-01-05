import { useQuery } from '@tanstack/react-query';
import { Ship, AlertCircle, RefreshCw } from 'lucide-react';

interface CompactAISWidgetProps {
  latitude?: number;
  longitude?: number;
}

interface AISVessel {
  mmsi: string;
  name: string;
  latitude: number;
  longitude: number;
  speed: number;
  course: number;
  shipType: string;
  distance?: number; // Distance in nautical miles
}

interface WidgetLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  locationName: string | null;
  isCurrentLocation: boolean;
}

// Calculate distance between two coordinates (Haversine formula) in nautical miles
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function CompactAISWidget({ latitude, longitude }: CompactAISWidgetProps) {
  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

  // Default location (Southampton, UK - Current Location)
  const DEFAULT_LAT = 50.863714;
  const DEFAULT_LON = -1.425028;

  // Fetch widget location
  const { data: widgetLocation } = useQuery<WidgetLocation | null>({
    queryKey: ['/api/widgets/location', userEmail],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/widgets/location?email=${encodeURIComponent(userEmail)}`);
        if (response.status === 404) {
          return null;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch widget location');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching widget location:', error);
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const currentLat = latitude !== undefined ? latitude : (widgetLocation?.latitude !== undefined ? widgetLocation.latitude : DEFAULT_LAT);
  const currentLon = longitude !== undefined ? longitude : (widgetLocation?.longitude !== undefined ? widgetLocation.longitude : DEFAULT_LON);

  // Fetch AIS data (using a free/public AIS API or mock data)
  const { data: aisData, isLoading, refetch } = useQuery<AISVessel[]>({
    queryKey: ['/api/ais/vessels', currentLat, currentLon],
    queryFn: async () => {
      try {
        // Try to fetch from backend API
        const response = await fetch(`/api/ais/vessels?lat=${currentLat}&lon=${currentLon}&radius=10`);
        if (response.ok) {
          const data = await response.json();
          // Calculate distances for each vessel
          return data.vessels?.map((vessel: AISVessel) => ({
            ...vessel,
            distance: calculateDistance(currentLat, currentLon, vessel.latitude, vessel.longitude),
          })).sort((a: AISVessel, b: AISVessel) => (a.distance || 999) - (b.distance || 999)) || [];
        }
        
        // Fallback to mock/demo data if API not available
        return generateMockAISData(currentLat, currentLon);
      } catch (error) {
        console.error('Error fetching AIS data:', error);
        // Return mock data on error
        return generateMockAISData(currentLat, currentLon);
      }
    },
    staleTime: 30 * 1000, // Refresh every 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
    enabled: !!currentLat && !!currentLon,
  });

  // Generate mock AIS data for demonstration
  const generateMockAISData = (lat: number, lon: number): AISVessel[] => {
    const vessels: AISVessel[] = [];
    const shipNames = ['Ocean Explorer', 'Sea Breeze', 'Maritime Star', 'Coastal Voyager', 'Harbor Master'];
    const shipTypes = ['Cargo', 'Tanker', 'Container', 'Fishing', 'Passenger'];

    for (let i = 0; i < 3; i++) {
      // Generate random position within 5 NM radius
      const distance = Math.random() * 5;
      const bearing = Math.random() * 360;
      const offsetLat = (distance / 60) * Math.cos(bearing * Math.PI / 180);
      const offsetLon = (distance / (60 * Math.cos(lat * Math.PI / 180))) * Math.sin(bearing * Math.PI / 180);

      const vesselLat = lat + offsetLat;
      const vesselLon = lon + offsetLon;
      const vesselDistance = calculateDistance(lat, lon, vesselLat, vesselLon);

      vessels.push({
        mmsi: String(230000000 + i),
        name: shipNames[i % shipNames.length],
        latitude: vesselLat,
        longitude: vesselLon,
        speed: Math.random() * 15 + 5,
        course: Math.random() * 360,
        shipType: shipTypes[i % shipTypes.length],
        distance: vesselDistance,
      });
    }

    return vessels.sort((a, b) => (a.distance || 999) - (b.distance || 999));
  };

  const nearestVessel = aisData && aisData.length > 0 ? aisData[0] : null;
  const vesselCount = aisData?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 rounded-lg border border-cyan-200 animate-pulse">
        <Ship className="w-4 h-4 text-cyan-300 flex-shrink-0" />
        <div className="h-4 w-12 bg-cyan-200 rounded"></div>
      </div>
    );
  }

  if (!nearestVessel) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
        <Ship className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <div className="text-xs text-slate-600">No vessels</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 rounded-lg border border-cyan-200 group">
      <Ship className="w-4 h-4 text-cyan-500 flex-shrink-0" />
      <div className="flex flex-col min-w-0">
        <div className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
          {nearestVessel.name || 'Unknown'}
        </div>
        <div className="text-[10px] text-slate-600 leading-tight">
          {nearestVessel.distance ? `${nearestVessel.distance.toFixed(1)} NM` : 'Nearby'} • {vesselCount} vessel{vesselCount !== 1 ? 's' : ''}
        </div>
      </div>
      <button
        onClick={() => refetch()}
        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
        title="Refresh AIS data"
      >
        <RefreshCw className="w-3 h-3 text-cyan-600" />
      </button>
    </div>
  );
}

