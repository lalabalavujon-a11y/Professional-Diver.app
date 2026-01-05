import { useState, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

export interface GPSPosition {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number | null;
  altitudeAccuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
}

export interface GPSOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface GPSHookReturn {
  getCurrentPosition: (options?: GPSOptions) => Promise<GPSPosition>;
  isGettingGPS: boolean;
  error: string | null;
}

/**
 * GPS Hook - Works on both web and native Capacitor platforms
 * 
 * This hook provides a unified interface for accessing GPS location
 * that works seamlessly across web browsers and native mobile apps.
 */
export function useGPS(): GPSHookReturn {
  const [isGettingGPS, setIsGettingGPS] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = useCallback(
    async (options: GPSOptions = {}): Promise<GPSPosition> => {
      setIsGettingGPS(true);
      setError(null);

      const {
        enableHighAccuracy = true,
        timeout = 10000,
        maximumAge = 0,
      } = options;

      try {
        // Check if we're running on a native platform
        const isNative = Capacitor.isNativePlatform();

        if (isNative) {
          // Use Capacitor Geolocation API for native platforms
          try {
            // Check permissions first
            const permissionStatus = await Geolocation.checkPermissions();
            
            // Request permissions if not already granted
            if (permissionStatus.location !== 'granted') {
              // Request permissions (handles both 'prompt' and 'denied' cases)
              const requestStatus = await Geolocation.requestPermissions();
              if (requestStatus.location !== 'granted') {
                throw new Error('Location permission denied. Please enable location access in your device settings.');
              }
            }

            // Get current position using Capacitor
            const position = await Geolocation.getCurrentPosition({
              enableHighAccuracy,
              timeout,
              maximumAge,
            });

            setIsGettingGPS(false);

            return {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              altitude: position.coords.altitude ?? null,
              altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
              heading: position.coords.heading ?? null,
              speed: position.coords.speed ?? null,
              timestamp: position.timestamp,
            };
          } catch (capError: any) {
            setIsGettingGPS(false);
            
            let errorMessage = 'Failed to get location';
            if (capError.message) {
              errorMessage = capError.message;
            } else if (capError.code === 1 || capError.code === 'PERMISSION_DENIED') {
              errorMessage = 'Location access denied. Please enable location permissions in your device settings.';
            } else if (capError.code === 2 || capError.code === 'POSITION_UNAVAILABLE') {
              errorMessage = 'Location information unavailable. Please ensure GPS is enabled on your device.';
            } else if (capError.code === 3 || capError.code === 'TIMEOUT') {
              errorMessage = 'Location request timed out. Please try again.';
            }
            
            setError(errorMessage);
            throw new Error(errorMessage);
          }
        } else {
          // Use browser Geolocation API for web platforms
          return new Promise<GPSPosition>((resolve, reject) => {
            if (!navigator.geolocation) {
              setIsGettingGPS(false);
              const errorMsg = 'Geolocation is not supported by your browser.';
              setError(errorMsg);
              reject(new Error(errorMsg));
              return;
            }

            navigator.geolocation.getCurrentPosition(
              (position) => {
                setIsGettingGPS(false);
                resolve({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                  accuracy: position.coords.accuracy,
                  altitude: position.coords.altitude ?? null,
                  altitudeAccuracy: position.coords.altitudeAccuracy ?? null,
                  heading: position.coords.heading ?? null,
                  speed: position.coords.speed ?? null,
                  timestamp: position.timestamp,
                });
              },
              (geoError) => {
                setIsGettingGPS(false);
                let errorMessage = 'Failed to get location';
                switch (geoError.code) {
                  case geoError.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please enable location permissions in your browser settings.';
                    break;
                  case geoError.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable.';
                    break;
                  case geoError.TIMEOUT:
                    errorMessage = 'Location request timed out.';
                    break;
                }
                setError(errorMessage);
                reject(new Error(errorMessage));
              },
              {
                enableHighAccuracy,
                timeout,
                maximumAge,
              }
            );
          });
        }
      } catch (err: any) {
        setIsGettingGPS(false);
        const errorMessage = err.message || 'Failed to get location';
        setError(errorMessage);
        throw err;
      }
    },
    []
  );

  return {
    getCurrentPosition,
    isGettingGPS,
    error,
  };
}

