/**
 * Unified location selector - combines timezones (cities) and ports
 * This allows users to select either a city/timezone or a specific port
 */

import { timezones, type TimezoneOption } from './timezones';

export interface LocationOption {
  value: string;
  label: string;
  type: 'city' | 'port-primary' | 'port-secondary';
  timezone?: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  region?: string;
}

export interface PortLocation {
  value: string; // Format: "port:{portId}"
  label: string;
  type: 'port-primary' | 'port-secondary';
  timezone: string;
  latitude: number;
  longitude: number;
  country: string;
  region: string;
}

/**
 * Fetch ports from the API
 */
export async function fetchPorts(): Promise<PortLocation[]> {
  try {
    const response = await fetch('/api/ports');
    if (!response.ok) {
      console.error('Failed to fetch ports');
      return [];
    }
    const data = await response.json();
    // API returns { ports: [...] }
    const ports = data.ports || [];
    return ports.map((port: any) => ({
      value: `port:${port.id}`,
      label: `${port.name} (${port.type}) - ${port.country}`,
      type: port.type === 'Primary' ? 'port-primary' : 'port-secondary',
      timezone: port.timezone,
      latitude: port.latitude,
      longitude: port.longitude,
      country: port.country,
      region: port.region,
    }));
  } catch (error) {
    console.error('Error fetching ports:', error);
    return [];
  }
}

/**
 * Convert timezones to location options
 */
export function timezonesToLocations(timezones: TimezoneOption[]): LocationOption[] {
  return timezones.map(tz => ({
    value: tz.value,
    label: tz.label,
    type: 'city' as const,
    timezone: tz.value,
    country: tz.region,
    region: tz.region,
  }));
}

/**
 * Combine cities and ports into a single sorted list
 * Ports are grouped by type (Primary first, then Secondary), then cities
 */
export function combineLocations(cities: LocationOption[], ports: PortLocation[]): LocationOption[] {
  const primaryPorts = ports.filter(p => p.type === 'port-primary');
  const secondaryPorts = ports.filter(p => p.type === 'port-secondary');
  
  // Sort ports by name
  const sortedPrimaryPorts = [...primaryPorts].sort((a, b) => a.label.localeCompare(b.label));
  const sortedSecondaryPorts = [...secondaryPorts].sort((a, b) => a.label.localeCompare(b.label));
  
  // Sort cities by label
  const sortedCities = [...cities].sort((a, b) => a.label.localeCompare(b.label));
  
  // Combine: Primary Ports, Secondary Ports, then Cities
  return [
    ...sortedPrimaryPorts,
    ...sortedSecondaryPorts,
    ...sortedCities,
  ];
}

/**
 * Get location details from a location value
 * Handles both timezone values (e.g., "America/New_York") and port values (e.g., "port:1")
 */
export async function getLocationDetails(value: string): Promise<{
  timezone: string;
  latitude: number;
  longitude: number;
  name: string;
} | null> {
  if (value.startsWith('port:')) {
    // It's a port
    const portId = value.replace('port:', '');
    try {
      const response = await fetch(`/api/ports?id=${portId}`);
      if (!response.ok) {
        console.error('Port API error:', response.status, response.statusText);
        return null;
      }
      const data = await response.json();
      // Handle both array response and { ports: [...] } response
      let port = null;
      if (Array.isArray(data)) {
        port = data[0];
      } else if (data.ports && Array.isArray(data.ports) && data.ports.length > 0) {
        port = data.ports[0];
      } else if (data && typeof data === 'object' && data.latitude && data.longitude) {
        // Single port object
        port = data;
      }
      
      if (port && port.latitude && port.longitude) {
        return {
          timezone: port.timezone || 'UTC',
          latitude: port.latitude,
          longitude: port.longitude,
          name: port.name || portId,
        };
      }
      console.error('Port data invalid:', data);
      return null;
    } catch (error) {
      console.error('Error fetching port details:', error);
      return null;
    }
  } else {
    // It's a timezone/city - use the timezone-to-coordinates mapping
    const { getTimezoneCoordinates } = await import('./timezones');
    const coords = getTimezoneCoordinates(value);
    if (coords) {
      const tzOption = timezones.find(tz => tz.value === value);
      return {
        timezone: value,
        latitude: coords.lat,
        longitude: coords.lon,
        name: tzOption?.label || value,
      };
    }
    return null;
  }
}

