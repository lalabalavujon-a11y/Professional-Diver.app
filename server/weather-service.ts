/**
 * Weather Service - Integrates with OpenWeatherMap API
 * Provides weather data with caching and error handling
 */

interface WeatherData {
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  location: string;
  icon?: string;
}

interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

// In-memory cache (simple implementation)
const weatherCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Get weather data for a location
 * @param lat Latitude
 * @param lon Longitude
 * @param timezone Timezone string (for location name)
 * @returns Weather data or null if error
 */
export async function getWeatherData(
  lat: number,
  lon: number,
  timezone: string
): Promise<WeatherData | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    const error: any = new Error('OpenWeatherMap API key not configured');
    error.code = 'WEATHER_API_KEY_MISSING';
    error.statusCode = 503;
    throw error;
  }

  // Create cache key from coordinates (rounded to 2 decimal places)
  const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)}`;

  // Check cache
  const cached = weatherCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 401) {
        const error: any = new Error('OpenWeatherMap API: Invalid API key');
        error.code = 'WEATHER_API_KEY_INVALID';
        error.statusCode = 401;
        throw error;
      }
      if (response.status === 429) {
        console.warn('OpenWeatherMap API: Rate limit exceeded, using cache if available');
        if (cached) {
          return cached.data; // Return stale cache if rate limited
        }
        const error: any = new Error('OpenWeatherMap API: Rate limit exceeded');
        error.code = 'WEATHER_RATE_LIMIT';
        error.statusCode = 429;
        throw error;
      }
      const error: any = new Error(`Weather API error: ${response.status} ${response.statusText}`);
      error.code = 'WEATHER_API_ERROR';
      error.statusCode = response.status;
      throw error;
    }

    const data = await response.json();

    // API returns temperature in Fahrenheit (because units=imperial)
    // Convert to Celsius for consistent storage (widget will format based on user preference)
    const tempFahrenheit = data.main.temp;
    const tempCelsius = (tempFahrenheit - 32) * 5 / 9;

    // Transform API response to our format
    const weatherData: WeatherData = {
      temperature: Math.round(tempCelsius * 10) / 10, // Round to 1 decimal place
      condition: data.weather[0].main,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind?.speed || 0), // Wind speed in mph (imperial units)
      location: data.name || timezone.split('/').pop()?.replace('_', ' ') || 'Unknown',
      icon: data.weather[0].icon,
    };

    // Update cache
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now(),
    });

    return weatherData;
  } catch (error: any) {
    console.error('Error fetching weather data (XC Weather App):', error);
    
    // If it's a known error with code, re-throw it
    if (error.code) {
      throw error;
    }
    
    // Return cached data if available (even if stale) for network errors
    const err = error as any;
    if (cached && (err?.name === 'TypeError' || String(err?.message ?? '').includes('fetch'))) {
      console.warn('Using stale cache due to network error');
      return cached.data;
    }
    
    // For other errors, wrap and throw
    const wrappedError: any = new Error(error.message || 'Failed to fetch weather data');
    wrappedError.code = 'WEATHER_FETCH_ERROR';
    wrappedError.statusCode = 500;
    wrappedError.originalError = error;
    throw wrappedError;
  }
}

/**
 * Convert timezone to approximate coordinates
 * This is a simple approximation - for production, use a proper geocoding service
 */
export function timezoneToCoordinates(timezone: string): { lat: number; lon: number } | null {
  // Common timezone to coordinate mappings (approximate)
  const timezoneMap: Record<string, { lat: number; lon: number }> = {
    'America/New_York': { lat: 40.7128, lon: -74.0060 },
    'America/Chicago': { lat: 41.8781, lon: -87.6298 },
    'America/Denver': { lat: 39.7392, lon: -104.9903 },
    'America/Los_Angeles': { lat: 34.0522, lon: -118.2437 },
    'Europe/London': { lat: 51.5074, lon: -0.1278 },
    'Europe/Paris': { lat: 48.8566, lon: 2.3522 },
    'Asia/Tokyo': { lat: 35.6762, lon: 139.6503 },
    'Asia/Shanghai': { lat: 31.2304, lon: 121.4737 },
    'Australia/Sydney': { lat: -33.8688, lon: 151.2093 },
    'UTC': { lat: 51.4779, lon: 0.0 }, // Greenwich
  };

  return timezoneMap[timezone] || null;
}

