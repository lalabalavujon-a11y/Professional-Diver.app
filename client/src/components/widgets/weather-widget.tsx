import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Cloud, AlertCircle } from 'lucide-react';
import { useUnitsPreference } from '@/hooks/use-units-preference';
import { formatTemperature } from '@/lib/units-converter';

interface WeatherWidgetProps {
  timezone: string;
  latitude?: number;
  longitude?: number;
}

interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  location: string;
  icon?: string;
}

export default function WeatherWidget({ timezone, latitude, longitude }: WeatherWidgetProps) {
  const unitsPreference = useUnitsPreference();
  
  // Get user email for API call
  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

  const { data: weatherData, isLoading, isError } = useQuery<WeatherData>({
    queryKey: ['/api/weather', timezone, latitude, longitude, userEmail],
    queryFn: async () => {
      const params = new URLSearchParams({
        timezone: timezone,
        email: userEmail,
      });
      
      if (latitude !== undefined && longitude !== undefined) {
        params.append('lat', latitude.toString());
        params.append('lon', longitude.toString());
      }

      const response = await fetch(`/api/weather?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weather data');
      }
      return response.json();
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: true, // Always enabled, will use saved location if lat/lon not provided
  });

  // Fallback data if API fails or is not configured
  const fallbackData: WeatherData = {
    temperature: 20,
    condition: 'Partly Cloudy',
    description: 'Weather data unavailable',
    humidity: 0,
    windSpeed: 0,
    location: timezone.split('/').pop()?.replace('_', ' ') || 'Unknown',
  };

  const displayData = weatherData || fallbackData;
  const showError = isError && !weatherData;

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Cloud className="w-5 h-5 text-blue-500" />
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-1">Weather</div>
            {isLoading ? (
              <div className="text-sm text-slate-400">Loading...</div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-900">
                    {formatTemperature(displayData.temperature, unitsPreference)}
                  </span>
                  <span className="text-sm text-slate-600">
                    {displayData.condition}
                  </span>
                  {showError && (
                    <div title="API not configured">
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {displayData.location}
                  {displayData.windSpeed !== undefined && displayData.windSpeed > 0 && (
                    <span className="ml-2">• {displayData.windSpeed} mph wind</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

