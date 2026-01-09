import { useState, useEffect, useRef, useCallback } from 'react';
import { useGPS, GPSPosition } from './use-gps';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

interface AutoGPSSyncOptions {
  enabled?: boolean;
  updateInterval?: number; // milliseconds between GPS updates
  autoSave?: boolean; // automatically save to backend
  onLocationUpdate?: (position: GPSPosition) => void;
}

interface NearestLocation {
  type: 'port' | 'harbor' | 'marina' | 'city' | 'town' | 'location';
  name: string;
  distance: number; // in km
  latitude: number;
  longitude: number;
}

export function useAutoGPSSync(options: AutoGPSSyncOptions = {}) {
  const {
    enabled = true,
    updateInterval = 60000, // 1 minute default
    autoSave = true,
    onLocationUpdate,
  } = options;

  const { getCurrentPosition, isGettingGPS } = useGPS();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [currentPosition, setCurrentPosition] = useState<GPSPosition | null>(null);
  const [nearestLocation, setNearestLocation] = useState<NearestLocation | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedPositionRef = useRef<{ lat: number; lon: number } | null>(null);
  const retryCountRef = useRef<number>(0);
  const errorShownThisSessionRef = useRef<boolean>(false);
  const MAX_RETRIES = 3;

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Find nearest location (port, harbor, marina, city)
  const findNearestLocation = useCallback(async (lat: number, lon: number): Promise<NearestLocation | null> => {
    try {
      // Try to find nearest port first
      const portsResponse = await fetch(`/api/ports?lat=${lat}&lon=${lon}&radiusKm=50`);
      if (portsResponse.ok) {
        const portsData = await portsResponse.json();
        if (portsData.ports && portsData.ports.length > 0) {
          const nearestPort = portsData.ports[0]; // API should return sorted by distance
          return {
            type: 'port',
            name: nearestPort.name || 'Unknown Port',
            distance: nearestPort.distance || calculateDistance(lat, lon, nearestPort.latitude, nearestPort.longitude),
            latitude: nearestPort.latitude,
            longitude: nearestPort.longitude,
          };
        }
      }

      // Fallback: Use reverse geocoding to find city/town
      try {
        const geocodeResponse = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          if (geocodeData.name) {
            let locationType: NearestLocation['type'] = 'location';
            if (geocodeData.type === 'city') {
              locationType = 'city';
            } else if (geocodeData.type === 'town') {
              locationType = 'town';
            }
            return {
              type: locationType,
              name: geocodeData.name,
              distance: 0,
              latitude: lat,
              longitude: lon,
            };
          }
        }
      } catch (error) {
        console.log('Reverse geocoding not available');
      }

      return null;
    } catch (error) {
      console.error('Error finding nearest location:', error);
      return null;
    }
  }, [calculateDistance]);

  // Save GPS position to backend
  const saveGPSPosition = useCallback(async (position: GPSPosition) => {
    if (!autoSave) return;

    const userEmail = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
    
    try {
      // Check if position has changed significantly (more than 100m)
      if (lastSavedPositionRef.current) {
        const distance = calculateDistance(
          lastSavedPositionRef.current.lat,
          lastSavedPositionRef.current.lon,
          position.latitude,
          position.longitude
        );
        if (distance < 0.1) { // Less than 100m, skip save
          return;
        }
      }

      // Find nearest location
      const nearest = await findNearestLocation(position.latitude, position.longitude);
      
      const response = await fetch('/api/widgets/location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          latitude: position.latitude,
          longitude: position.longitude,
          locationName: nearest?.name || 'GPS Location',
          isCurrentLocation: true,
        }),
      });

      if (response.ok) {
        lastSavedPositionRef.current = {
          lat: position.latitude,
          lon: position.longitude,
        };
        
        // Invalidate location query to refresh widgets
        queryClient.invalidateQueries({ queryKey: ['/api/widgets/location', userEmail] });
        
        if (nearest) {
          setNearestLocation(nearest);
        }
      }
    } catch (error) {
      console.error('Error saving GPS position:', error);
    }
  }, [autoSave, findNearestLocation, calculateDistance, queryClient]);

  // Update GPS position with retry logic
  const updatePositionWithRetry = useCallback(async (retryAttempt: number = 0): Promise<void> => {
    // Only check isSyncing for initial attempts (not retries - retries are part of the same sync cycle)
    if (retryAttempt === 0) {
      if (isGettingGPS || isSyncing) return;
      setIsSyncing(true);
    }

    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000, // Accept cached position up to 30 seconds old
      });

      // Success: reset retry count and clear error flag
      retryCountRef.current = 0;
      setCurrentPosition(position);
      
      if (onLocationUpdate) {
        onLocationUpdate(position);
      }

      await saveGPSPosition(position);
      setIsSyncing(false);
    } catch (error: any) {
      console.error('Error updating GPS position:', error);
      
      // Don't retry or show errors for permission denials (user explicitly denied)
      if (error.message?.includes('permission') || error.message?.includes('denied')) {
        setIsSyncing(false);
        return; // Silent fail for permission errors
      }

      // Retry with exponential backoff
      if (retryAttempt < MAX_RETRIES) {
        const delay = Math.pow(2, retryAttempt) * 1000; // 1s, 2s, 4s
        retryCountRef.current = retryAttempt + 1;
        // Keep isSyncing true during retry delay, then try again
        setTimeout(async () => {
          try {
            await updatePositionWithRetry(retryAttempt + 1);
          } catch {
            // If retry also fails, isSyncing will be handled in the catch block
            setIsSyncing(false);
          }
        }, delay);
        // Don't set isSyncing to false here - wait for retry to complete
      } else {
        // All retries exhausted - show error only once per session
        setIsSyncing(false);
        if (!errorShownThisSessionRef.current) {
          errorShownThisSessionRef.current = true;
          toast({
            title: 'GPS Update Failed',
            description: 'Location services are unavailable. Please check your device settings or network connection.',
            variant: 'destructive',
          });
        }
      }
    }
  }, [isGettingGPS, isSyncing, getCurrentPosition, onLocationUpdate, saveGPSPosition, toast]);

  // Update GPS position (wrapper for backward compatibility)
  const updatePosition = useCallback(async () => {
    await updatePositionWithRetry(0);
  }, [updatePositionWithRetry]);

  // Start watching GPS position
  useEffect(() => {
    if (!enabled) {
      // Clean up any existing watchers
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // Initial position
    updatePosition();

    // Set up interval for periodic updates
    intervalRef.current = setInterval(() => {
      updatePosition();
    }, updateInterval);

    // Also use watchPosition for real-time updates (if supported)
    if (navigator.geolocation && navigator.geolocation.watchPosition) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const gpsPosition: GPSPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude ?? null,
            altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
            heading: position.coords.heading ?? null,
            speed: position.coords.speed ?? null,
            timestamp: position.timestamp,
          };
          
          setCurrentPosition(gpsPosition);
          if (onLocationUpdate) {
            onLocationUpdate(gpsPosition);
          }
          saveGPSPosition(gpsPosition);
        },
        (error) => {
          console.error('GPS watch error:', error);
          // Don't show errors for watchPosition - it's passive monitoring
          // The interval-based updatePosition will handle retries and error display
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (watchIdRef.current && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [enabled, updateInterval, updatePositionWithRetry, onLocationUpdate, saveGPSPosition]);

  return {
    currentPosition,
    nearestLocation,
    isSyncing: isSyncing || isGettingGPS,
    updatePosition,
    enabled,
  };
}

