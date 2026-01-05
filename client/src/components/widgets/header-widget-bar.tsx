import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import CompactClockWidget from './compact-clock-widget';
import CompactWeatherWidget from './compact-weather-widget';
import CompactTidesWidget from './compact-tides-widget';
import CompactMoonPhaseWidget from './compact-moon-phase-widget';
import CompactNavigationWidget from './compact-navigation-widget';
import CompactAISWidget from './compact-ais-widget';
import { GripVertical } from 'lucide-react';

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
};

type WidgetKey = 'clock' | 'weather' | 'tides' | 'moon' | 'navigation' | 'ais';

interface DraggableWidget {
  key: WidgetKey;
  component: React.ReactNode;
}

export default function HeaderWidgetBar() {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [widgetOrder, setWidgetOrder] = useState<WidgetKey[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('headerWidgetOrder');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Use default order
        }
      }
    }
    return ['clock', 'weather', 'tides', 'moon', 'navigation', 'ais'];
  });

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
    staleTime: 5 * 60 * 1000,
  });

  const prefs = preferences || defaultPreferences;

  // Build all available widgets
  const availableWidgets: Record<WidgetKey, React.ReactNode | null> = {
    clock: <CompactClockWidget key="clock" timezone={prefs.timezone} clockType={prefs.clockType} />,
    weather: prefs.enableWeather ? (
      <CompactWeatherWidget 
        key="weather" 
        timezone={prefs.timezone} 
        latitude={widgetLocation?.latitude}
        longitude={widgetLocation?.longitude}
      />
    ) : null,
    tides: prefs.enableTides ? (
      <CompactTidesWidget 
        key="tides" 
        timezone={prefs.timezone} 
        latitude={widgetLocation?.latitude}
        longitude={widgetLocation?.longitude}
      />
    ) : null,
    moon: prefs.enableMoonPhase ? <CompactMoonPhaseWidget key="moon" timezone={prefs.timezone} /> : null,
    navigation: <CompactNavigationWidget 
      key="navigation" 
      latitude={widgetLocation?.latitude}
      longitude={widgetLocation?.longitude}
    />,
    ais: prefs.enableAIS ? (
      <CompactAISWidget 
        key="ais" 
        latitude={widgetLocation?.latitude}
        longitude={widgetLocation?.longitude}
      />
    ) : null,
  };

  // Filter to only enabled/available widgets
  const enabledKeys = Object.keys(availableWidgets).filter(
    key => availableWidgets[key as WidgetKey] !== null
  ) as WidgetKey[];

  // Build current order: use saved order for enabled widgets, append any new ones
  const buildCurrentOrder = (): WidgetKey[] => {
    const currentOrder: WidgetKey[] = [];
    const seen = new Set<WidgetKey>();
    
    // Add widgets from saved order that are still enabled
    widgetOrder.forEach(key => {
      if (enabledKeys.includes(key) && !seen.has(key)) {
        currentOrder.push(key);
        seen.add(key);
      }
    });

    // Add any enabled widgets not in saved order
    enabledKeys.forEach(key => {
      if (!seen.has(key)) {
        currentOrder.push(key);
      }
    });

    return currentOrder;
  };

  const currentOrder = buildCurrentOrder();

  // Update order state when preferences change, but preserve saved order if valid
  useEffect(() => {
    const savedOrder = typeof window !== 'undefined' 
      ? (() => {
          try {
            const saved = localStorage.getItem('headerWidgetOrder');
            return saved ? JSON.parse(saved) : null;
          } catch {
            return null;
          }
        })()
      : null;

    if (savedOrder && Array.isArray(savedOrder) && savedOrder.length > 0) {
      // Validate saved order against enabled widgets
      const validSavedOrder = savedOrder.filter((key: WidgetKey) => enabledKeys.includes(key));
      const newKeys = enabledKeys.filter(key => !validSavedOrder.includes(key));
      if (newKeys.length > 0 || validSavedOrder.length !== widgetOrder.length) {
        const mergedOrder = [...validSavedOrder, ...newKeys];
        setWidgetOrder(mergedOrder);
      }
    } else if (currentOrder.length > 0 && widgetOrder.length === 0) {
      // Initialize order if not set
      setWidgetOrder(currentOrder);
    }
  }, [prefs.enableWeather, prefs.enableTides, prefs.enableMoonPhase, enabledKeys.join(',')]);

  // Create draggable widgets array from current order
  const draggableWidgets: DraggableWidget[] = currentOrder.map(key => ({
    key,
    component: availableWidgets[key],
  }));

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...currentOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);
    
    setWidgetOrder(newOrder);
    if (typeof window !== 'undefined') {
      localStorage.setItem('headerWidgetOrder', JSON.stringify(newOrder));
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (draggableWidgets.length === 0) {
    return null;
  }

  return (
    <div className="hidden lg:flex items-center gap-2 flex-1 justify-center max-w-3xl mx-4">
      {draggableWidgets.map((widget, index) => (
        <div
          key={widget.key}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onDragEnd={handleDragEnd}
          className={`flex items-center gap-1 relative ${
            draggedIndex === index ? 'opacity-50' : ''
          } ${
            dragOverIndex === index ? 'scale-105 transition-transform' : ''
          }`}
          style={{ cursor: 'grab' }}
        >
          <GripVertical className="w-3 h-3 text-slate-400 opacity-0 hover:opacity-100 transition-opacity cursor-grab" />
          {widget.component}
        </div>
      ))}
    </div>
  );
}

