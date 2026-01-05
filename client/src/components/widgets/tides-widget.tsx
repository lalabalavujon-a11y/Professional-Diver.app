import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Waves, AlertCircle } from 'lucide-react';
import { useUnitsPreference } from '@/hooks/use-units-preference';
import { formatTideLevel } from '@/lib/units-converter';

interface TidesWidgetProps {
  timezone: string;
  latitude?: number;
  longitude?: number;
}

interface TideData {
  currentLevel: number;
  currentLevelFormatted: string;
  currentTrend: 'Rising' | 'Falling';
  nextHigh: {
    time: string;
    level: number;
  };
  nextLow: {
    time: string;
    level: number;
  };
  location: string;
}

export default function TidesWidget({ timezone, latitude, longitude }: TidesWidgetProps) {
  const unitsPreference = useUnitsPreference();
  
  // Get user email for API call
  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

  const { data: tideData, isLoading, isError } = useQuery<TideData>({
    queryKey: ['/api/tides', timezone, latitude, longitude, userEmail],
    queryFn: async () => {
      const params = new URLSearchParams({
        timezone: timezone,
        email: userEmail,
      });
      
      if (latitude !== undefined && longitude !== undefined) {
        params.append('lat', latitude.toString());
        params.append('lon', longitude.toString());
      }

      const response = await fetch(`/api/tides?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tide data');
      }
      return response.json();
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: true, // Always enabled, will use saved location if lat/lon not provided
  });

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  };

  // Fallback data if API fails or is not configured
  const now = new Date();
  const fallbackHigh = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const fallbackLow = new Date(now.getTime() + 12 * 60 * 60 * 1000);

  const fallbackData = {
    currentLevel: 1.0, // meters
    currentTrend: 'Rising' as const,
    nextHigh: { time: fallbackHigh.toISOString(), level: 4.5 },
    nextLow: { time: fallbackLow.toISOString(), level: 1.8 },
  };

  const displayData = tideData || fallbackData;
  const showError = isError && !tideData;
  
  // Format current level based on units preference
  // API returns currentLevel in meters, or we use fallback value
  const currentLevelMeters = displayData.currentLevel ?? 1.0;
  const formattedLevel = formatTideLevel(currentLevelMeters, unitsPreference);

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Waves className="w-5 h-5 text-cyan-500" />
          <div className="flex-1">
            <div className="text-xs text-slate-500 mb-1">Tides</div>
            {isLoading ? (
              <div className="text-sm text-slate-400">Loading...</div>
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-slate-900">
                    {formattedLevel}
                  </span>
                  <span className="text-sm text-slate-600">
                    {displayData.currentTrend}
                  </span>
                  {showError && (
                    <div title="API not configured">
                      <AlertCircle className="w-3 h-3 text-amber-500" />
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  High: {formatTime(displayData.nextHigh.time)} | Low: {formatTime(displayData.nextLow.time)}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

