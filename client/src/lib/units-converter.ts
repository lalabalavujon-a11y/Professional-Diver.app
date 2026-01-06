import { UnitsPreference } from '@/hooks/use-units-preference';

/**
 * Utility functions for converting and formatting measurements
 * based on the user's units preference
 */

// Temperature conversion functions
const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9 / 5) + 32;
};

const fahrenheitToCelsius = (fahrenheit: number): number => {
  return (fahrenheit - 32) * 5 / 9;
};

// Length/Distance conversion functions (meters to feet)
const metersToFeet = (meters: number): number => {
  return meters * 3.28084;
};

const feetToMeters = (feet: number): number => {
  return feet / 3.28084;
};

// Pressure conversion functions
const barToPsi = (bar: number): number => {
  return bar * 14.5038;
};

const psiToBar = (psi: number): number => {
  return psi / 14.5038;
};

/**
 * Format temperature based on units preference
 * @param celsius - Temperature in Celsius
 * @param unitsPreference - User's units preference
 * @param showBoth - Whether to show both units (for mixed mode)
 * @returns Formatted temperature string
 */
export function formatTemperature(
  celsius: number,
  unitsPreference: UnitsPreference,
  showBoth: boolean = false
): string {
  switch (unitsPreference) {
    case 'imperial':
      const fahrenheit = celsiusToFahrenheit(celsius);
      return `${Math.round(fahrenheit)}°F`;
    case 'mixed':
      const f = celsiusToFahrenheit(celsius);
      return `${Math.round(celsius)}°C / ${Math.round(f)}°F`;
    case 'metric':
    default:
      return `${Math.round(celsius)}°C`;
  }
}

/**
 * Format depth/length based on units preference
 * @param meters - Depth/length in meters
 * @param unitsPreference - User's units preference
 * @param showBoth - Whether to show both units (for mixed mode)
 * @returns Formatted depth/length string
 */
export function formatDepth(
  meters: number,
  unitsPreference: UnitsPreference,
  showBoth: boolean = false
): string {
  switch (unitsPreference) {
    case 'imperial':
      const feet = metersToFeet(meters);
      return `${feet.toFixed(1)} ft`;
    case 'mixed':
      const ft = metersToFeet(meters);
      return `${meters.toFixed(1)} m / ${ft.toFixed(1)} ft`;
    case 'metric':
    default:
      return `${meters.toFixed(1)} m`;
  }
}

/**
 * Format pressure based on units preference
 * @param bar - Pressure in bar
 * @param unitsPreference - User's units preference
 * @param showBoth - Whether to show both units (for mixed mode)
 * @returns Formatted pressure string
 */
export function formatPressure(
  bar: number,
  unitsPreference: UnitsPreference,
  showBoth: boolean = false
): string {
  switch (unitsPreference) {
    case 'imperial':
      const psi = barToPsi(bar);
      return `${psi.toFixed(1)} psi`;
    case 'mixed':
      const p = barToPsi(bar);
      return `${bar.toFixed(1)} bar / ${p.toFixed(1)} psi`;
    case 'metric':
    default:
      return `${bar.toFixed(1)} bar`;
  }
}

/**
 * Format tide level based on units preference
 * @param meters - Tide level in meters
 * @param unitsPreference - User's units preference
 * @returns Formatted tide level string
 */
export function formatTideLevel(
  meters: number,
  unitsPreference: UnitsPreference
): string {
  switch (unitsPreference) {
    case 'imperial':
      const feet = metersToFeet(meters);
      return `${feet.toFixed(2)} ft`;
    case 'mixed':
      const ft = metersToFeet(meters);
      return `${meters.toFixed(2)} m (${ft.toFixed(2)} ft)`;
    case 'metric':
    default:
      return `${meters.toFixed(2)} m`;
  }
}

/**
 * Parse depth string and return value in meters
 * Handles both "45m" and "45 m" formats
 */
export function parseDepthToMeters(depthString: string): number {
  const match = depthString.match(/(\d+\.?\d*)\s*(m|ft|feet|meter|meters)?/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2]?.toLowerCase();
  
  if (unit === 'ft' || unit === 'feet') {
    return feetToMeters(value);
  }
  return value; // Assume meters if no unit specified
}

/**
 * Format depth from string (handles "45m" format)
 * @param depthString - Depth string like "45m" or "12m"
 * @param unitsPreference - User's units preference
 * @returns Formatted depth string
 */
export function formatDepthFromString(
  depthString: string,
  unitsPreference: UnitsPreference
): string {
  const meters = parseDepthToMeters(depthString);
  return formatDepth(meters, unitsPreference);
}



