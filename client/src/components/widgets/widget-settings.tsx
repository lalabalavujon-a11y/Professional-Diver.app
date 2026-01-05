import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Settings, MapPin, Clock } from 'lucide-react';
import LocationSelector from './location-selector';

interface WidgetPreferences {
  timezone: string;
  clockType: 'digital' | 'analog';
  enableWeather: boolean;
  enableTides: boolean;
  enableMoonPhase: boolean;
  enableNavigation?: boolean;
  enableAIS?: boolean;
}

interface WidgetSettingsProps {
  trigger?: React.ReactNode;
  onSave?: (preferences: WidgetPreferences) => void;
}

const defaultPreferences: WidgetPreferences = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  clockType: 'digital',
  enableWeather: false,
  enableTides: false,
  enableMoonPhase: false,
  enableNavigation: false,
  enableAIS: false,
};

export default function WidgetSettings({ trigger, onSave }: WidgetSettingsProps) {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<WidgetPreferences>(defaultPreferences);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load preferences from localStorage
  useQuery<WidgetPreferences>({
    queryKey: ['/api/users/preferences'],
    queryFn: async () => {
      const storedPrefs = localStorage.getItem('userPreferences');
      if (storedPrefs) {
        try {
          const parsed = JSON.parse(storedPrefs);
          setPreferences({ ...defaultPreferences, ...parsed });
          return parsed;
        } catch {
          return defaultPreferences;
        }
      }
      return defaultPreferences;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleToggle = (key: keyof WidgetPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      // Invalidate preferences query to trigger re-render
      queryClient.invalidateQueries({ queryKey: ['userPreferences'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/preferences'] });
      toast({
        title: "Settings saved",
        description: "Widget preferences have been saved successfully.",
      });
      
      if (onSave) {
        onSave(preferences);
      }
      
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preferences.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    // Reset to saved preferences
    const storedPrefs = localStorage.getItem('userPreferences');
    if (storedPrefs) {
      try {
        const parsed = JSON.parse(storedPrefs);
        setPreferences({ ...defaultPreferences, ...parsed });
      } catch {
        setPreferences(defaultPreferences);
      }
    } else {
      setPreferences(defaultPreferences);
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>{trigger}</DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Widget Settings
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Widget Settings</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="location" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="location">Location</TabsTrigger>
            <TabsTrigger value="widgets">Widgets</TabsTrigger>
          </TabsList>

          <TabsContent value="location" className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Widget Location</h3>
              <p className="text-sm text-slate-600 mb-4">
                Set the location for all widgets (weather, tides, moon phases, navigation). 
                All widgets will use this location for their data.
              </p>
              <LocationSelector 
                trigger={
                  <Button variant="outline" className="w-full">
                    <MapPin className="w-4 h-4 mr-2" />
                    Configure Location
                  </Button>
                }
              />
            </div>
          </TabsContent>

          <TabsContent value="widgets" className="space-y-4 mt-4">
            <div>
              <h3 className="text-sm font-medium mb-4">Widget Settings</h3>
              
              <div className="space-y-4">
                {/* Clock Type Selector */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="clockType" className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Clock Type
                    </Label>
                    <p className="text-xs text-slate-500">
                      Digital or analog display
                    </p>
                  </div>
                  <Select 
                    value={preferences.clockType} 
                    onValueChange={(value: 'digital' | 'analog') => {
                      setPreferences(prev => ({ ...prev, clockType: value }));
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="digital">Digital</SelectItem>
                      <SelectItem value="analog">Analog</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Clock is always enabled */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="clock" className="text-sm font-medium">
                      Clock Widget
                    </Label>
                    <p className="text-xs text-slate-500">
                      Always enabled
                    </p>
                  </div>
                  <Switch id="clock" checked={true} disabled />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="weather" className="text-sm font-medium">
                      Weather
                    </Label>
                    <p className="text-xs text-slate-500">
                      Current weather conditions
                    </p>
                  </div>
                  <Switch
                    id="weather"
                    checked={preferences.enableWeather}
                    onCheckedChange={() => handleToggle('enableWeather')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="tides" className="text-sm font-medium">
                      Tides
                    </Label>
                    <p className="text-xs text-slate-500">
                      Tide levels and times
                    </p>
                  </div>
                  <Switch
                    id="tides"
                    checked={preferences.enableTides}
                    onCheckedChange={() => handleToggle('enableTides')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="moon" className="text-sm font-medium">
                      Moon Phase
                    </Label>
                    <p className="text-xs text-slate-500">
                      Current moon phase
                    </p>
                  </div>
                  <Switch
                    id="moon"
                    checked={preferences.enableMoonPhase}
                    onCheckedChange={() => handleToggle('enableMoonPhase')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="navigation" className="text-sm font-medium">
                      Navigation
                    </Label>
                    <p className="text-xs text-slate-500">
                      Nautical charts and planning
                    </p>
                  </div>
                  <Switch
                    id="navigation"
                    checked={preferences.enableNavigation || false}
                    onCheckedChange={() => handleToggle('enableNavigation')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="ais" className="text-sm font-medium">
                      AIS Ship Finder
                    </Label>
                    <p className="text-xs text-slate-500">
                      Real-time vessel tracking (synced to your location)
                    </p>
                  </div>
                  <Switch
                    id="ais"
                    checked={preferences.enableAIS || false}
                    onCheckedChange={() => handleToggle('enableAIS')}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

