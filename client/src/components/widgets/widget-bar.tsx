import { useQuery } from '@tanstack/react-query';
import ClockWidget from './clock-widget';
import WeatherWidget from './weather-widget';
import TidesWidget from './tides-widget';
import MoonPhaseWidget from './moon-phase-widget';
import NavigationWidget from './navigation-widget';
import LocationSelector from './location-selector';
import WidgetSettings from './widget-settings';
import { useAutoGPSSync } from '@/hooks/use-auto-gps-sync';

interface WidgetPreferences {
  timezone: string;
  clockType: 'digital' | 'analog';
  enableWeather: boolean;
  enableTides: boolean;
  enableMoonPhase: boolean;
  enableNavigation?: boolean;
  enableAIS?: boolean;
}

interface WidgetLocation {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  locationName: string | null;
  isCurrentLocation: boolean;
  createdAt: string;
  updatedAt: string;
}

// Default preferences (fallback)
const defaultPreferences: WidgetPreferences = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  clockType: 'digital',
  enableWeather: false,
  enableTides: false,
  enableMoonPhase: false,
  enableNavigation: false,
  enableAIS: false,
};

export default function WidgetBar() {
  // Get user email from localStorage
  const userEmail = typeof window !== 'undefined' 
    ? (localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com')
    : 'lalabalavu.jon@gmail.com';

  // Fetch widget location
  const { data: widgetLocation } = useQuery<WidgetLocation | null>({
    queryKey: ['/api/widgets/location', userEmail],
    queryFn: async () => {
      const response = await fetch(`/api/widgets/location?email=${encodeURIComponent(userEmail)}`);
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch widget location');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Fetch user preferences - for now using localStorage as fallback
  // In production, this would fetch from an API endpoint
  const { data: preferences } = useQuery<WidgetPreferences>({
    queryKey: ['/api/users/preferences'],
    queryFn: async () => {
      // Try to get from localStorage (set by profile settings)
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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const prefs = preferences || defaultPreferences;
  const defaultTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Auto-sync GPS position (PRIMARY location source)
  const { currentPosition, nearestLocation, isSyncing } = useAutoGPSSync({
    enabled: true, // Enable automatic GPS syncing
    updateInterval: 60000, // Update every minute
    autoSave: true, // Automatically save to backend
    onLocationUpdate: (position) => {
      console.log('GPS position updated:', position);
    },
  });

  // Use GPS position if available (PRIMARY), otherwise fall back to saved location (SECONDARY)
  const activeLocation = currentPosition 
    ? { latitude: currentPosition.latitude, longitude: currentPosition.longitude }
    : widgetLocation;

  // Determine which widgets to show
  const widgets = [];
  
  // Clock is always shown (default widget)
  widgets.push(
    <ClockWidget key="clock" timezone={prefs.timezone} clockType={prefs.clockType} />
  );

  if (prefs.enableWeather) {
    widgets.push(
      <WeatherWidget 
        key="weather" 
        timezone={prefs.timezone} 
        latitude={activeLocation?.latitude}
        longitude={activeLocation?.longitude}
      />
    );
  }

  if (prefs.enableTides) {
    widgets.push(
      <TidesWidget 
        key="tides" 
        timezone={prefs.timezone} 
        latitude={activeLocation?.latitude}
        longitude={activeLocation?.longitude}
      />
    );
  }

  if (prefs.enableMoonPhase) {
    widgets.push(
      <MoonPhaseWidget 
        key="moon" 
        timezone={prefs.timezone} 
        latitude={activeLocation?.latitude}
        longitude={activeLocation?.longitude}
      />
    );
  }

  if (prefs.enableNavigation) {
    widgets.push(
      <NavigationWidget 
        key="navigation" 
        latitude={activeLocation?.latitude}
        longitude={activeLocation?.longitude}
      />
    );
  }

  // Don't render if no widgets
  if (widgets.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      {/* Location selector and settings header */}
      <div className="flex items-center justify-between mb-4 gap-2">
        <LocationSelector />
        <WidgetSettings />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {widgets}
      </div>
    </div>
  );
}

