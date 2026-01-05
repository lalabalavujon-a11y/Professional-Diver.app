import { useState, useEffect } from 'react';

export type UnitsPreference = 'imperial' | 'metric' | 'mixed';

const PREFERENCE_CHANGE_EVENT = 'unitsPreferenceChanged';

/**
 * Custom hook to access and manage units preference across the platform
 * Synced with localStorage and profile settings
 * 
 * @returns The current units preference
 * 
 * @example
 * ```tsx
 * const unitsPreference = useUnitsPreference();
 * // Use unitsPreference to display measurements
 * ```
 */
export function useUnitsPreference(): UnitsPreference {
  const [unitsPreference, setUnitsPreference] = useState<UnitsPreference>(() => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        const prefs = JSON.parse(stored);
        if (prefs.unitsPreference) return prefs.unitsPreference;
      }
    } catch {
      // Error parsing, use default
    }
    return 'metric';
  });

  // Listen for changes to localStorage (sync across tabs/windows)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userPreferences' && e.newValue) {
        try {
          const prefs = JSON.parse(e.newValue);
          if (prefs.unitsPreference) {
            setUnitsPreference(prefs.unitsPreference);
          }
        } catch {
          // Error parsing, ignore
        }
      }
    };

    // Listen for custom events (same-tab updates)
    const handleCustomChange = () => {
      try {
        const stored = localStorage.getItem('userPreferences');
        if (stored) {
          const prefs = JSON.parse(stored);
          if (prefs.unitsPreference) {
            setUnitsPreference(prefs.unitsPreference);
          }
        }
      } catch {
        // Error parsing, ignore
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(PREFERENCE_CHANGE_EVENT, handleCustomChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(PREFERENCE_CHANGE_EVENT, handleCustomChange);
    };
  }, []);

  return unitsPreference;
}

/**
 * Helper function to notify all components of a units preference change
 * This should be called after updating the preference in localStorage
 */
export function notifyUnitsPreferenceChange() {
  window.dispatchEvent(new Event(PREFERENCE_CHANGE_EVENT));
}

