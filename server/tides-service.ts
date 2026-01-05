/**
 * Tides Service - Integrates with Stormglass.io API
 * Provides tide data with caching and error handling
 */

interface TideData {
  currentLevel: number;
  currentLevelFormatted: string;
  currentTrend: 'Rising' | 'Falling';
  nextHigh: {
    time: Date;
    level: number;
  };
  nextLow: {
    time: Date;
    level: number;
  };
  location: string;
}

interface CacheEntry {
  data: TideData;
  timestamp: number;
}

interface StormglassResponse {
  data: Array<{
    time: string;
    type: 'high' | 'low';
    height: number;
  }>;
  meta: {
    requestCount: number;
  };
}

// In-memory cache
const tidesCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Get tide data for a location
 * @param lat Latitude
 * @param lon Longitude
 * @param timezone Timezone string
 * @returns Tide data or null if error
 */
export async function getTideData(
  lat: number,
  lon: number,
  timezone: string
): Promise<TideData | null> {
  const apiKey = process.env.STORMGLASS_API_KEY;

  if (!apiKey) {
    console.warn('Stormglass API key not configured');
    return null;
  }

  // Create cache key from coordinates
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;

  // Check cache
  const cached = tidesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const now = new Date();
    const end = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now

    const url = `https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lon}&start=${Math.floor(now.getTime() / 1000)}&end=${Math.floor(end.getTime() / 1000)}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error('Stormglass API: Invalid API key');
        return null;
      }
      if (response.status === 429) {
        console.warn('Stormglass API: Rate limit exceeded, using cache if available');
        if (cached) {
          return cached.data;
        }
        return null;
      }
      throw new Error(`Tides API error: ${response.status} ${response.statusText}`);
    }

    const data: StormglassResponse = await response.json();

    if (!data.data || data.data.length === 0) {
      console.warn('No tide data available for location');
      return null;
    }

    // Find current trend and next high/low
    const nowTimestamp = now.getTime();
    const futureTides = data.data.filter(tide => new Date(tide.time).getTime() > nowTimestamp);
    
    if (futureTides.length < 2) {
      console.warn('Insufficient tide data');
      return null;
    }

    const nextHigh = futureTides.find(t => t.type === 'high');
    const nextLow = futureTides.find(t => t.type === 'low');

    if (!nextHigh || !nextLow) {
      console.warn('Could not find next high/low tide');
      return null;
    }

    // Determine current trend (simplified - would need current level for accuracy)
    const highTime = new Date(nextHigh.time).getTime();
    const lowTime = new Date(nextLow.time).getTime();
    const currentTrend = highTime < lowTime ? 'Rising' : 'Falling';

    // Estimate current level (simplified - in production, use actual current level)
    const estimatedLevel = currentTrend === 'Rising' 
      ? (nextLow.height + nextHigh.height) / 2
      : (nextHigh.height + nextLow.height) / 2;

    const tideData: TideData = {
      currentLevel: estimatedLevel,
      currentLevelFormatted: `${estimatedLevel.toFixed(1)} ft`,
      currentTrend,
      nextHigh: {
        time: new Date(nextHigh.time),
        level: nextHigh.height,
      },
      nextLow: {
        time: new Date(nextLow.time),
        level: nextLow.height,
      },
      location: timezone.split('/').pop()?.replace('_', ' ') || 'Unknown',
    };

    // Update cache
    tidesCache.set(cacheKey, {
      data: tideData,
      timestamp: Date.now(),
    });

    return tideData;
  } catch (error) {
    console.error('Error fetching tide data:', error);
    
    // Return cached data if available
    if (cached) {
      console.warn('Using stale cache due to error');
      return cached.data;
    }
    
    return null;
  }
}

/**
 * Convert timezone to approximate coordinates
 * Uses the same mapping as weather service
 */
export function timezoneToCoordinates(timezone: string): { lat: number; lon: number } | null {
  // Import the same mapping as weather service for consistency
  const timezoneMap: Record<string, { lat: number; lon: number }> = {
    'UTC': { lat: 51.4779, lon: 0.0 },
    // North America - Eastern
    'America/New_York': { lat: 40.7128, lon: -74.0060 },
    'America/Toronto': { lat: 43.6532, lon: -79.3832 },
    'America/Montreal': { lat: 45.5017, lon: -73.5673 },
    'America/Detroit': { lat: 42.3314, lon: -83.0458 },
    'America/Miami': { lat: 25.7617, lon: -80.1918 },
    'America/Boston': { lat: 42.3601, lon: -71.0589 },
    'America/Atlanta': { lat: 33.7490, lon: -84.3880 },
    'America/Bogota': { lat: 4.7110, lon: -74.0721 },
    'America/Lima': { lat: -12.0464, lon: -77.0428 },
    'America/Caracas': { lat: 10.4806, lon: -66.9036 },
    'America/Santiago': { lat: -33.4489, lon: -70.6693 },
    // North America - Central
    'America/Chicago': { lat: 41.8781, lon: -87.6298 },
    'America/Mexico_City': { lat: 19.4326, lon: -99.1332 },
    'America/Dallas': { lat: 32.7767, lon: -96.7970 },
    'America/Houston': { lat: 29.7604, lon: -95.3698 },
    // North America - Mountain
    'America/Denver': { lat: 39.7392, lon: -104.9903 },
    'America/Phoenix': { lat: 33.4484, lon: -112.0740 },
    'America/Calgary': { lat: 51.0447, lon: -114.0719 },
    // North America - Pacific
    'America/Los_Angeles': { lat: 34.0522, lon: -118.2437 },
    'America/Vancouver': { lat: 49.2827, lon: -123.1207 },
    'America/San_Francisco': { lat: 37.7749, lon: -122.4194 },
    'America/Seattle': { lat: 47.6062, lon: -122.3321 },
    // North America - Alaska & Hawaii
    'America/Anchorage': { lat: 61.2181, lon: -149.9003 },
    'Pacific/Honolulu': { lat: 21.3099, lon: -157.8581 },
    // South America
    'America/Sao_Paulo': { lat: -23.5505, lon: -46.6333 },
    'America/Rio_de_Janeiro': { lat: -22.9068, lon: -43.1729 },
    'America/Buenos_Aires': { lat: -34.6037, lon: -58.3816 },
    'America/Montevideo': { lat: -34.9011, lon: -56.1645 },
    // Europe - Western
    'Europe/London': { lat: 51.5074, lon: -0.1278 },
    'Europe/Dublin': { lat: 53.3498, lon: -6.2603 },
    'Europe/Lisbon': { lat: 38.7223, lon: -9.1393 },
    'Europe/Madrid': { lat: 40.4168, lon: -3.7038 },
    'Europe/Paris': { lat: 48.8566, lon: 2.3522 },
    'Europe/Rome': { lat: 41.9028, lon: 12.4964 },
    'Europe/Berlin': { lat: 52.5200, lon: 13.4050 },
    'Europe/Amsterdam': { lat: 52.3676, lon: 4.9041 },
    'Europe/Brussels': { lat: 50.8503, lon: 4.3517 },
    'Europe/Vienna': { lat: 48.2082, lon: 16.3738 },
    'Europe/Zurich': { lat: 47.3769, lon: 8.5417 },
    'Europe/Stockholm': { lat: 59.3293, lon: 18.0686 },
    'Europe/Copenhagen': { lat: 55.6761, lon: 12.5683 },
    'Europe/Oslo': { lat: 59.9139, lon: 10.7522 },
    'Europe/Helsinki': { lat: 60.1699, lon: 24.9384 },
    'Europe/Warsaw': { lat: 52.2297, lon: 21.0122 },
    'Europe/Prague': { lat: 50.0755, lon: 14.4378 },
    'Europe/Budapest': { lat: 47.4979, lon: 19.0402 },
    'Europe/Athens': { lat: 37.9838, lon: 23.7275 },
    'Europe/Bucharest': { lat: 44.4268, lon: 26.1025 },
    'Europe/Moscow': { lat: 55.7558, lon: 37.6173 },
    'Europe/Kiev': { lat: 50.4501, lon: 30.5234 },
    'Europe/Istanbul': { lat: 41.0082, lon: 28.9784 },
    // Middle East
    'Asia/Dubai': { lat: 25.2048, lon: 55.2708 },
    'Asia/Riyadh': { lat: 24.7136, lon: 46.6753 },
    'Asia/Tehran': { lat: 35.6892, lon: 51.3890 },
    'Asia/Jerusalem': { lat: 31.7683, lon: 35.2137 },
    'Asia/Baghdad': { lat: 33.3152, lon: 44.3661 },
    // Central Asia
    'Asia/Karachi': { lat: 24.8607, lon: 67.0011 },
    'Asia/Kabul': { lat: 34.5553, lon: 69.2075 },
    'Asia/Tashkent': { lat: 41.2995, lon: 69.2401 },
    // South Asia
    'Asia/Kolkata': { lat: 19.0760, lon: 72.8777 },
    'Asia/Delhi': { lat: 28.6139, lon: 77.2090 },
    'Asia/Dhaka': { lat: 23.8103, lon: 90.4125 },
    'Asia/Colombo': { lat: 6.9271, lon: 79.8612 },
    // Southeast Asia
    'Asia/Bangkok': { lat: 13.7563, lon: 100.5018 },
    'Asia/Singapore': { lat: 1.3521, lon: 103.8198 },
    'Asia/Jakarta': { lat: -6.2088, lon: 106.8456 },
    'Asia/Manila': { lat: 14.5995, lon: 120.9842 },
    'Asia/Ho_Chi_Minh': { lat: 10.8231, lon: 106.6297 },
    'Asia/Kuala_Lumpur': { lat: 3.1390, lon: 101.6869 },
    // East Asia
    'Asia/Shanghai': { lat: 31.2304, lon: 121.4737 },
    'Asia/Beijing': { lat: 39.9042, lon: 116.4074 },
    'Asia/Hong_Kong': { lat: 22.3193, lon: 114.1694 },
    'Asia/Taipei': { lat: 25.0330, lon: 121.5654 },
    'Asia/Tokyo': { lat: 35.6762, lon: 139.6503 },
    'Asia/Seoul': { lat: 37.5665, lon: 126.9780 },
    // Australia & Pacific
    'Australia/Sydney': { lat: -33.8688, lon: 151.2093 },
    'Australia/Melbourne': { lat: -37.8136, lon: 144.9631 },
    'Australia/Brisbane': { lat: -27.4698, lon: 153.0251 },
    'Australia/Perth': { lat: -31.9505, lon: 115.8605 },
    'Australia/Adelaide': { lat: -34.9285, lon: 138.6007 },
    'Pacific/Auckland': { lat: -36.8485, lon: 174.7633 },
    'Pacific/Fiji': { lat: -18.1416, lon: 178.4419 },
    // Africa
    'Africa/Cairo': { lat: 30.0444, lon: 31.2357 },
    'Africa/Johannesburg': { lat: -26.2041, lon: 28.0473 },
    'Africa/Cape_Town': { lat: -33.9249, lon: 18.4241 },
    'Africa/Lagos': { lat: 6.5244, lon: 3.3792 },
    'Africa/Nairobi': { lat: -1.2921, lon: 36.8219 },
    'Africa/Casablanca': { lat: 33.5731, lon: -7.5898 },
    'Africa/Tunis': { lat: 36.8065, lon: 10.1815 },
    'Africa/Algiers': { lat: 36.7538, lon: 3.0588 },
    'Africa/Accra': { lat: 5.6037, lon: -0.1870 },
    'Africa/Addis_Ababa': { lat: 9.1450, lon: 38.7667 },
    // Atlantic
    'Atlantic/Reykjavik': { lat: 64.1466, lon: -21.9426 },
  };

  return timezoneMap[timezone] || null;
}

