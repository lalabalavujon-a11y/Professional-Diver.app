import { Cloud, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUnitsPreference } from '@/hooks/use-units-preference';
import { formatTemperature } from '@/lib/units-converter';

interface CompactWeatherWidgetProps {
  timezone: string;
  latitude?: number;
  longitude?: number;
}

export default function CompactWeatherWidget({ timezone, latitude, longitude }: CompactWeatherWidgetProps) {
  const unitsPreference = useUnitsPreference();
  
  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

  const { data: weatherData, isLoading, isError } = useQuery({
    queryKey: ['weather', timezone, latitude, longitude, userEmail],
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch weather data');
      }
      return response.json();
    },
    staleTime: 15 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200 animate-pulse">
        <Cloud className="w-4 h-4 text-blue-300 flex-shrink-0" />
        <div className="h-4 w-12 bg-blue-200 rounded"></div>
      </div>
    );
  }

  if (isError || !weatherData) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
        <div className="text-xs text-yellow-700">N/A</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200">
      <Cloud className="w-4 h-4 text-blue-500 flex-shrink-0" />
      <div className="flex flex-col">
        <div className="text-sm font-semibold text-slate-900 leading-tight">
          {formatTemperature(weatherData.temperature, unitsPreference)}
        </div>
        <div className="text-xs text-slate-600 leading-tight">{weatherData.condition}</div>
      </div>
    </div>
  );
}

