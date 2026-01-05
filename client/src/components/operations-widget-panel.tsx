import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Cloud, 
  Waves, 
  Moon, 
  Compass, 
  Ship,
  MapPin,
  Settings,
  Anchor,
  FileText
} from 'lucide-react';
import ClockWidget from './widgets/clock-widget';
import WeatherWidget from './widgets/weather-widget';
import TidesWidget from './widgets/tides-widget';
import MoonPhaseWidget from './widgets/moon-phase-widget';
import NavigationWidget from './widgets/navigation-widget';
import CompactAISWidget from './widgets/compact-ais-widget';
import WorldPortsWidget from './widgets/world-ports-widget';
import NoticesToMarinersWidget from './widgets/notices-to-mariners-widget';
import LocationSelector from './widgets/location-selector';
import WidgetSettings from './widgets/widget-settings';

interface WidgetLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  locationName: string | null;
  isCurrentLocation: boolean;
}

interface WidgetPreferences {
  timezone: string;
  clockType: 'digital' | 'analog';
  enableWeather: boolean;
  enableTides: boolean;
  enableMoonPhase: boolean;
  enableNavigation?: boolean;
  enableAIS?: boolean;
}

interface OperationsWidgetPanelProps {
  collapsed?: boolean;
  onCollapseChange?: (collapsed: boolean) => void;
}

export default function OperationsWidgetPanel({ collapsed: controlledCollapsed, onCollapseChange }: OperationsWidgetPanelProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const setCollapsed = onCollapseChange || setInternalCollapsed;

  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

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

  // Fetch user preferences
  const { data: preferences } = useQuery<WidgetPreferences>({
    queryKey: ['/api/users/preferences'],
    queryFn: async () => {
      const storedPrefs = localStorage.getItem('userPreferences');
      if (storedPrefs) {
        try {
          return JSON.parse(storedPrefs);
        } catch {
          return {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            clockType: 'digital' as const,
            enableWeather: false,
            enableTides: false,
            enableMoonPhase: false,
            enableNavigation: false,
            enableAIS: false,
          };
        }
      }
      return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        clockType: 'digital' as const,
        enableWeather: false,
        enableTides: false,
        enableMoonPhase: false,
        enableNavigation: false,
        enableAIS: false,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const prefs = preferences || {
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    clockType: 'digital' as const,
    enableWeather: false,
    enableTides: false,
    enableMoonPhase: false,
    enableNavigation: false,
    enableAIS: false,
  };

  if (collapsed) {
    return (
      <div className="flex flex-col items-center h-full bg-slate-50 border-l border-slate-200 w-12 py-4 gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(false)}
          className="h-8 w-8"
          title="Expand Widget Panel"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-full w-px" />
        <div className="flex flex-col gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Clock">
            <Clock className="h-4 w-4" />
          </Button>
          {prefs.enableWeather && (
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Weather">
              <Cloud className="h-4 w-4" />
            </Button>
          )}
          {prefs.enableTides && (
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Tides">
              <Waves className="h-4 w-4" />
            </Button>
          )}
          {prefs.enableMoonPhase && (
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Moon Phase">
              <Moon className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Navigation">
            <Compass className="h-4 w-4" />
          </Button>
          {prefs.enableAIS && (
            <Button variant="ghost" size="icon" className="h-8 w-8" title="AIS Ships">
              <Ship className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" title="World Ports">
            <Anchor className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Notices to Mariners">
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200 w-80">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-white">
        <h3 className="font-semibold text-sm text-slate-900">Operational Planning</h3>
        <div className="flex items-center gap-1">
          <WidgetSettings 
            trigger={
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(true)}
            className="h-7 w-7"
            title="Collapse Panel"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Scrollable Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Location Selector */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <LocationSelector />
            </CardContent>
          </Card>

          <Separator />

          {/* Time & Environment Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Time & Environment
            </h4>
            
            {/* Clock - Always visible */}
            <ClockWidget 
              timezone={prefs.timezone} 
              clockType={prefs.clockType} 
            />

            {/* Weather */}
            {prefs.enableWeather && (
              <WeatherWidget 
                timezone={prefs.timezone}
                latitude={widgetLocation?.latitude}
                longitude={widgetLocation?.longitude}
              />
            )}

            {/* Tides */}
            {prefs.enableTides && (
              <TidesWidget 
                timezone={prefs.timezone}
                latitude={widgetLocation?.latitude}
                longitude={widgetLocation?.longitude}
              />
            )}

            {/* Moon Phase */}
            {prefs.enableMoonPhase && (
              <MoonPhaseWidget 
                timezone={prefs.timezone}
                latitude={widgetLocation?.latitude}
                longitude={widgetLocation?.longitude}
              />
            )}
          </div>

          <Separator />

          {/* Navigation Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Navigation & Traffic
            </h4>

            {/* Navigation Widget - Always visible */}
            <NavigationWidget 
              latitude={widgetLocation?.latitude}
              longitude={widgetLocation?.longitude}
            />

            {/* AIS Ship Finder */}
            {prefs.enableAIS && (
              <CompactAISWidget 
                latitude={widgetLocation?.latitude}
                longitude={widgetLocation?.longitude}
              />
            )}
          </div>

          <Separator />

          {/* Operations & Ports Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Operations & Ports
            </h4>

            {/* World Ports Widget - Always visible */}
            <WorldPortsWidget />

            {/* Notices to Mariners Widget - Always visible */}
            <NoticesToMarinersWidget 
              latitude={widgetLocation?.latitude}
              longitude={widgetLocation?.longitude}
            />
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

