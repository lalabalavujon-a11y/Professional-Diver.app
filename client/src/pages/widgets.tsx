import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageSection } from "@/components/ui/page-header";
import RoleBasedNavigation from "@/components/role-based-navigation";
import { useAutoGPSSync } from "@/hooks/use-auto-gps-sync";
import {
  Clock,
  Cloud,
  Waves,
  Moon,
  Compass,
  Ship,
  Anchor,
  FileText,
  Calendar,
} from "lucide-react";
import ClockWidget from "@/components/widgets/clock-widget";
import WeatherWidget from "@/components/widgets/weather-widget";
import TidesWidget from "@/components/widgets/tides-widget";
import MoonPhaseWidget from "@/components/widgets/moon-phase-widget";
import NavigationWidget from "@/components/widgets/navigation-widget";
import CompactAISWidget from "@/components/widgets/compact-ais-widget";
import WorldPortsWidget from "@/components/widgets/world-ports-widget";
import NoticesToMarinersWidget from "@/components/widgets/notices-to-mariners-widget";
import OperationsCalendarWidget from "@/components/widgets/operations-calendar-widget";

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

const defaultPreferences: WidgetPreferences = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  clockType: 'digital',
  enableWeather: false,
  enableTides: false,
  enableMoonPhase: false,
  enableNavigation: true,
  enableAIS: false,
};

type WidgetId = 'clock' | 'weather' | 'tides' | 'moon' | 'navigation' | 'ais' | 'world-ports' | 'notices-to-mariners' | 'operations-calendar';

interface WidgetConfig {
  id: WidgetId;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  requiresPreference?: keyof WidgetPreferences;
  alwaysAvailable?: boolean;
}

export const availableWidgets: WidgetConfig[] = [
  {
    id: 'clock',
    title: 'Clock',
    description: 'Digital and analog clock with timezone support',
    icon: <Clock className="w-8 h-8 text-blue-600" />,
    color: 'blue',
    alwaysAvailable: true,
  },
  {
    id: 'weather',
    title: 'Weather',
    description: 'Real-time weather conditions and forecasts',
    icon: <Cloud className="w-8 h-8 text-cyan-600" />,
    color: 'cyan',
    requiresPreference: 'enableWeather',
  },
  {
    id: 'tides',
    title: 'Tides',
    description: 'Tide predictions and tidal information',
    icon: <Waves className="w-8 h-8 text-teal-600" />,
    color: 'teal',
    requiresPreference: 'enableTides',
  },
  {
    id: 'moon',
    title: 'Moon Phase',
    description: 'Current moon phase and lunar calendar',
    icon: <Moon className="w-8 h-8 text-indigo-600" />,
    color: 'indigo',
    requiresPreference: 'enableMoonPhase',
  },
  {
    id: 'navigation',
    title: 'Navigation',
    description: 'GPS coordinates and location information',
    icon: <Compass className="w-8 h-8 text-green-600" />,
    color: 'green',
    alwaysAvailable: true,
  },
  {
    id: 'ais',
    title: 'AIS Ships',
    description: 'Automatic Identification System ship tracking',
    icon: <Ship className="w-8 h-8 text-purple-600" />,
    color: 'purple',
    requiresPreference: 'enableAIS',
  },
  {
    id: 'world-ports',
    title: 'World Ports',
    description: 'Global port database and information',
    icon: <Anchor className="w-8 h-8 text-orange-600" />,
    color: 'orange',
    alwaysAvailable: true,
  },
  {
    id: 'notices-to-mariners',
    title: 'Notices to Mariners',
    description: 'Maritime safety notices and navigational warnings',
    icon: <FileText className="w-8 h-8 text-red-600" />,
    color: 'red',
    alwaysAvailable: true,
  },
  {
    id: 'operations-calendar',
    title: 'Operations Calendar',
    description: 'Operations scheduling and calendar management',
    icon: <Calendar className="w-8 h-8 text-slate-600" />,
    color: 'slate',
    alwaysAvailable: true,
  },
];

export default function Widgets() {
  const [location, setLocation] = useLocation();
  const [selectedWidget, setSelectedWidget] = useState<WidgetId | null>(null);
  const widgetContentRef = useRef<HTMLDivElement>(null);

  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

  // Auto-sync GPS position (PRIMARY location source)
  const { currentPosition, nearestLocation } = useAutoGPSSync({
    enabled: true,
    updateInterval: 60000,
    autoSave: true,
  });

  // Fetch widget location (SECONDARY fallback)
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

  // Use GPS position if available (PRIMARY), otherwise fall back to saved location (SECONDARY)
  const activeLocation = currentPosition 
    ? { latitude: currentPosition.latitude, longitude: currentPosition.longitude }
    : widgetLocation;

  // Fetch user preferences
  const { data: preferences } = useQuery<WidgetPreferences>({
    queryKey: ['userPreferences'],
    queryFn: async () => {
      const storedPrefs = localStorage.getItem('userPreferences');
      if (storedPrefs) {
        try {
          return JSON.parse(storedPrefs);
        } catch {
          return defaultPreferences;
        }
      }
      return defaultPreferences;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const prefs = preferences || defaultPreferences;

  // Handle URL parameters for direct widget access
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const widgetParam = params.get('widget') as WidgetId | null;
    if (widgetParam && availableWidgets.some(w => w.id === widgetParam)) {
      setSelectedWidget(widgetParam);
    } else {
      setSelectedWidget(null);
    }
  }, [location]);

  // Update URL when widget is selected
  const handleWidgetClick = (widgetId: WidgetId) => {
    setSelectedWidget(widgetId);
    const newUrl = `${window.location.pathname}?widget=${widgetId}`;
    window.history.pushState({}, '', newUrl);
  };

  // Get available widgets based on preferences
  const getAvailableWidgets = () => {
    return availableWidgets.filter(widget => {
      if (widget.alwaysAvailable) return true;
      if (widget.requiresPreference) {
        return prefs[widget.requiresPreference] === true;
      }
      return true;
    });
  };

  const visibleWidgets = getAvailableWidgets();

  // Render selected widget content
  const renderWidgetContent = (widgetId: WidgetId) => {
    switch (widgetId) {
      case 'clock':
        return <ClockWidget timezone={prefs.timezone} clockType={prefs.clockType} />;
      case 'weather':
        return (
          <WeatherWidget
            timezone={prefs.timezone}
            latitude={activeLocation?.latitude}
            longitude={activeLocation?.longitude}
          />
        );
      case 'tides':
        return (
          <TidesWidget
            timezone={prefs.timezone}
            latitude={activeLocation?.latitude}
            longitude={activeLocation?.longitude}
          />
        );
      case 'moon':
        return (
          <MoonPhaseWidget
            timezone={prefs.timezone}
            latitude={activeLocation?.latitude}
            longitude={activeLocation?.longitude}
          />
        );
      case 'navigation':
        return (
          <NavigationWidget
            latitude={activeLocation?.latitude}
            longitude={activeLocation?.longitude}
          />
        );
      case 'ais':
        return (
          <CompactAISWidget
            latitude={activeLocation?.latitude}
            longitude={activeLocation?.longitude}
          />
        );
      case 'world-ports':
        return <WorldPortsWidget />;
      case 'notices-to-mariners':
        return (
          <NoticesToMarinersWidget
            latitude={activeLocation?.latitude}
            longitude={activeLocation?.longitude}
          />
        );
      case 'operations-calendar':
        return <OperationsCalendarWidget timezone={prefs.timezone} />;
      default:
        return null;
    }
  };

  return (
    <>
      <RoleBasedNavigation />
      <div className="min-h-screen bg-background" data-sidebar-content="true">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
          {selectedWidget ? (
            <div className="space-y-4">
              <Button
                onClick={() => {
                  setSelectedWidget(null);
                  const newUrl = window.location.pathname;
                  window.history.pushState({}, '', newUrl);
                }}
                variant="outline"
                className="mb-4"
              >
                ← Back to Widgets
              </Button>
              <div ref={widgetContentRef}>
                <PageSection
                  title={availableWidgets.find(w => w.id === selectedWidget)?.title || selectedWidget}
                  className="space-y-6"
                >
                  {renderWidgetContent(selectedWidget)}
                </PageSection>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <PageHeader
                title="Widgets"
                description="Access operational widgets and tools for diving professionals"
                icon={Compass}
              />

              {/* Grid of Widget Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleWidgets.map((widget) => (
                  <Card
                    key={widget.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleWidgetClick(widget.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-lg ${
                          widget.color === 'blue' ? 'bg-blue-100' :
                          widget.color === 'cyan' ? 'bg-cyan-100' :
                          widget.color === 'teal' ? 'bg-teal-100' :
                          widget.color === 'indigo' ? 'bg-indigo-100' :
                          widget.color === 'green' ? 'bg-green-100' :
                          widget.color === 'purple' ? 'bg-purple-100' :
                          widget.color === 'orange' ? 'bg-orange-100' :
                          widget.color === 'red' ? 'bg-red-100' :
                          'bg-slate-100'
                        }`}>
                          {widget.icon}
                        </div>
                        {widget.requiresPreference && !prefs[widget.requiresPreference] && (
                          <Badge variant="secondary" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="mt-4">{widget.title}</CardTitle>
                      <CardDescription>{widget.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full">
                        Open {widget.title}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {visibleWidgets.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    No widgets are currently enabled. Enable widgets in your preferences to see them here.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

