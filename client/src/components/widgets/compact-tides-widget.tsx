import { Waves, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useUnitsPreference } from '@/hooks/use-units-preference';
import { formatTideLevel } from '@/lib/units-converter';

interface CompactTidesWidgetProps {
  timezone: string;
  latitude?: number;
  longitude?: number;
}

export default function CompactTidesWidget({ timezone, latitude, longitude }: CompactTidesWidgetProps) {
  const unitsPreference = useUnitsPreference();
  
  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

  const { data: tidesData, isLoading, isError } = useQuery({
    queryKey: ['tides', timezone, latitude, longitude, userEmail],
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tides data');
      }
      return response.json();
    },
    staleTime: 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 rounded-lg border border-cyan-200 animate-pulse">
        <Waves className="w-4 h-4 text-cyan-300 flex-shrink-0" />
        <div className="h-4 w-12 bg-cyan-200 rounded"></div>
      </div>
    );
  }

  if (isError || !tidesData) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg border border-yellow-200">
        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
        <div className="text-xs text-yellow-700">N/A</div>
      </div>
    );
  }

  // Format current level based on units preference
  // API returns currentLevel in meters
  const currentLevelMeters = tidesData.currentLevel ?? 1.0;
  const formattedLevel = formatTideLevel(currentLevelMeters, unitsPreference);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-50 rounded-lg border border-cyan-200">
      <Waves className="w-4 h-4 text-cyan-500 flex-shrink-0" />
      <div className="flex flex-col">
        <div className="text-sm font-semibold text-slate-900 leading-tight">{formattedLevel}</div>
        <div className="text-xs text-slate-600 leading-tight">{tidesData.currentTrend || 'N/A'}</div>
      </div>
    </div>
  );
}

