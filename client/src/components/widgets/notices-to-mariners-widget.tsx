import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Info, AlertCircle, FileText, MapPin, Calendar, Loader2 } from 'lucide-react';

interface WidgetLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  locationName: string | null;
  isCurrentLocation: boolean;
}

interface NoticeToMariners {
  id: string;
  number: string;
  title: string;
  type: 'NAVIGATION' | 'SAFETY' | 'CHART' | 'TIDAL' | 'GENERAL';
  severity: 'CRITICAL' | 'WARNING' | 'INFORMATION';
  location: string;
  latitude?: number;
  longitude?: number;
  date: string;
  expiresAt?: string;
  description: string;
  affectedCharts?: string[];
  affectedAreas?: string[];
}

// Mock notices data - in production, this would be fetched from an API based on location
const mockNotices: NoticeToMariners[] = [
  {
    id: '1',
    number: 'NM-2025-001',
    title: 'Temporary Channel Closure - Dredging Operations',
    type: 'NAVIGATION',
    severity: 'CRITICAL',
    location: 'Southampton, UK',
    latitude: 50.863714,
    longitude: -1.425028,
    date: '2025-01-15',
    expiresAt: '2025-02-15',
    description: 'Dredging operations will temporarily close the main shipping channel from 0600 to 1800 UTC daily. Vessels are advised to use alternative routes.',
    affectedCharts: ['BA 2456', 'BA 2457'],
    affectedAreas: ['Main Channel', 'Approach Channel']
  },
  {
    id: '2',
    number: 'NM-2025-002',
    title: 'New Wreck Marked - Unlit Buoy',
    type: 'SAFETY',
    severity: 'WARNING',
    location: 'English Channel',
    latitude: 50.7,
    longitude: -1.2,
    date: '2025-01-10',
    description: 'A new wreck has been discovered and marked with an unlit yellow buoy at position 50°42.0\'N 001°12.0\'W. Mariners are advised to navigate with caution.',
    affectedCharts: ['BA 2456'],
  },
  {
    id: '3',
    number: 'NM-2025-003',
    title: 'Chart Correction - Depth Changes',
    type: 'CHART',
    severity: 'INFORMATION',
    location: 'Portsmouth Harbour',
    latitude: 50.8198,
    longitude: -1.0880,
    date: '2025-01-08',
    description: 'Updated depth soundings have been recorded in Portsmouth Harbour. Depths in the main channel have changed by up to 0.5m. New chart edition available.',
    affectedCharts: ['BA 2045', 'BA 2046'],
  },
  {
    id: '4',
    number: 'NM-2025-004',
    title: 'Tidal Stream Changes - Survey Results',
    type: 'TIDAL',
    severity: 'INFORMATION',
    location: 'Isle of Wight',
    latitude: 50.6944,
    longitude: -1.2986,
    date: '2025-01-05',
    description: 'Recent survey indicates changes in tidal stream patterns around the Isle of Wight. Maximum flow rates have increased by approximately 0.5 knots during spring tides.',
    affectedCharts: ['BA 2456'],
  },
  {
    id: '5',
    number: 'NM-2025-005',
    title: 'Temporary Traffic Separation Scheme Modification',
    type: 'NAVIGATION',
    severity: 'WARNING',
    location: 'Dover Strait',
    latitude: 51.0153,
    longitude: 1.3721,
    date: '2025-01-12',
    expiresAt: '2025-03-12',
    description: 'TSS modification in effect due to ongoing maintenance work. Eastbound traffic lane temporarily shifted 0.5 nautical miles north.',
    affectedCharts: ['BA 2450', 'BA 2451'],
    affectedAreas: ['Dover Strait TSS']
  },
  {
    id: '6',
    number: 'NM-2025-006',
    title: 'New Port Facility - Pilot Boarding Area',
    type: 'GENERAL',
    severity: 'INFORMATION',
    location: 'Southampton',
    latitude: 50.863714,
    longitude: -1.425028,
    date: '2025-01-14',
    description: 'New pilot boarding area established at position 50°54.5\'N 001°24.0\'W. All vessels requiring pilotage should contact Southampton VTS on VHF Channel 12.',
    affectedCharts: ['BA 2456'],
  },
  {
    id: '7',
    number: 'NM-2025-007',
    title: 'Underwater Cable Installation - Exclusion Zone',
    type: 'SAFETY',
    severity: 'WARNING',
    location: 'Off Brighton',
    latitude: 50.8225,
    longitude: -0.1372,
    date: '2025-01-20',
    expiresAt: '2025-02-20',
    description: 'Temporary exclusion zone established for underwater cable installation. Area marked with yellow buoys. No anchoring or trawling permitted.',
    affectedCharts: ['BA 2047'],
    affectedAreas: ['2nm radius from 50°49.3\'N 000°08.2\'W']
  },
  {
    id: '8',
    number: 'NM-2025-008',
    title: 'Light Character Change - Harbour Entrance',
    type: 'NAVIGATION',
    severity: 'INFORMATION',
    location: 'Portsmouth',
    latitude: 50.8198,
    longitude: -1.0880,
    date: '2025-01-18',
    description: 'Portsmouth Harbour entrance light character changed from Fl.R.3s to Fl.R.2s. Light remains visible range 10 nautical miles.',
    affectedCharts: ['BA 2045'],
  },
];

interface NoticesToMarinersWidgetProps {
  latitude?: number;
  longitude?: number;
}

export default function NoticesToMarinersWidget({ latitude, longitude }: NoticesToMarinersWidgetProps) {
  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

  // Get widget location to determine which notices to show
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

  // Fetch notices from API
  const locationToUse = widgetLocation || (latitude && longitude ? { latitude, longitude } : null);
  
  const { data: noticesResponse, isLoading, isError } = useQuery<{ notices: NoticeToMariners[] }>({
    queryKey: ['/api/notices-to-mariners', locationToUse?.latitude, locationToUse?.longitude, userEmail],
    queryFn: async () => {
      const params = new URLSearchParams({
        email: userEmail,
      });
      
      if (locationToUse?.latitude && locationToUse?.longitude) {
        params.append('lat', locationToUse.latitude.toString());
        params.append('lon', locationToUse.longitude.toString());
      }

      const response = await fetch(`/api/notices-to-mariners?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notices');
      }
      return response.json();
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
    enabled: true,
  });

  const relevantNotices = noticesResponse?.notices || mockNotices;
  const showError = isError && !noticesResponse;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'WARNING':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getSeverityBadgeVariant = (severity: string): "destructive" | "default" | "secondary" => {
    switch (severity) {
      case 'CRITICAL':
        return 'destructive';
      case 'WARNING':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'NAVIGATION':
        return 'bg-blue-100 text-blue-800';
      case 'SAFETY':
        return 'bg-red-100 text-red-800';
      case 'CHART':
        return 'bg-purple-100 text-purple-800';
      case 'TIDAL':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-600" />
          Notices to Mariners
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-sm text-slate-500 flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin" />
                Loading notices...
              </div>
            ) : showError ? (
              <div className="text-center py-8 text-sm text-amber-600 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Using offline data
              </div>
            ) : relevantNotices.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500">
                No notices available for your location
              </div>
            ) : (
              relevantNotices.map(notice => {
                const expired = isExpired(notice.expiresAt);
                
                return (
                  <div
                    key={notice.id}
                    className={`border rounded-lg p-3 hover:bg-slate-50 transition-colors ${
                      notice.severity === 'CRITICAL' ? 'border-red-200 bg-red-50/30' : 
                      notice.severity === 'WARNING' ? 'border-amber-200' : 
                      'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-2 flex-1">
                        {getSeverityIcon(notice.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-sm text-slate-900">{notice.title}</h4>
                            <Badge variant={getSeverityBadgeVariant(notice.severity)} className="text-xs">
                              {notice.severity}
                            </Badge>
                            <Badge className={`text-xs ${getTypeBadgeColor(notice.type)}`}>
                              {notice.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-600 mb-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>{notice.number}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span>{notice.location}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(notice.date)}</span>
                            </div>
                            {notice.expiresAt && (
                              <div className={`flex items-center gap-1 ${expired ? 'text-red-600' : ''}`}>
                                <Calendar className="w-3 h-3" />
                                <span>Expires: {formatDate(notice.expiresAt)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-700 mb-2 leading-relaxed">
                      {notice.description}
                    </div>
                    
                    {(notice.affectedCharts || notice.affectedAreas) && (
                      <div className="mt-2 pt-2 border-t border-slate-200 space-y-1">
                        {notice.affectedCharts && notice.affectedCharts.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium text-slate-600">Affected Charts: </span>
                            <span className="text-slate-700">{notice.affectedCharts.join(', ')}</span>
                          </div>
                        )}
                        {notice.affectedAreas && notice.affectedAreas.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium text-slate-600">Affected Areas: </span>
                            <span className="text-slate-700">{notice.affectedAreas.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
        <div className="px-4 py-2 border-t bg-slate-50 text-xs text-slate-600">
          Location: {widgetLocation?.locationName || (locationToUse ? 'Current Location' : 'Global')} • {relevantNotices.length} notice(s)
        </div>
      </CardContent>
    </Card>
  );
}

