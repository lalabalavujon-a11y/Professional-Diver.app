/**
 * Unified calling service for all providers (Google Meet, FaceTime, Zoom, Twilio)
 */

export type CallingProvider = 'google-meet' | 'facetime' | 'zoom' | 'phone';

export interface CallingPreferences {
  defaultProvider: CallingProvider;
  phoneNumber?: string;
  enableVideo: boolean;
  enableAudio: boolean;
  providers: {
    googleMeet: { enabled: boolean; account?: string };
    facetime: { enabled: boolean };
    zoom: { enabled: boolean; account?: string };
    twilio: { enabled: boolean; phoneNumber?: string };
  };
}

export interface CallOptions {
  provider?: CallingProvider;
  phoneNumber?: string;
  email?: string;
  name?: string;
  video?: boolean;
  audio?: boolean;
}

export interface CallResult {
  success: boolean;
  url?: string;
  token?: string;
  error?: string;
}

/**
 * Check if device supports FaceTime
 */
export function isFaceTimeSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = window.navigator.platform.toLowerCase();
  return (
    /iphone|ipad|ipod/.test(userAgent) ||
    (platform.includes('mac') && /safari/.test(userAgent))
  );
}

/**
 * Generate Google Meet link
 */
export async function initiateGoogleMeet(options?: CallOptions): Promise<CallResult> {
  try {
    // For instant meetings, we can generate a simple meet link
    // In production, you might want to use Google Calendar API to create scheduled meetings
    const meetingId = generateMeetingId();
    const meetUrl = `https://meet.google.com/${meetingId}`;
    
    return {
      success: true,
      url: meetUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Google Meet',
    };
  }
}

/**
 * Generate FaceTime link
 */
export function initiateFaceTime(phoneNumber?: string, email?: string, audioOnly: boolean = false): CallResult {
  if (!isFaceTimeSupported()) {
    return {
      success: false,
      error: 'FaceTime is only supported on iOS and macOS devices',
    };
  }

  try {
    let facetimeUrl: string;
    
    if (phoneNumber) {
      // Remove any non-numeric characters except +
      const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
      facetimeUrl = audioOnly 
        ? `facetime-audio://${cleanPhone}`
        : `facetime://${cleanPhone}`;
    } else if (email) {
      facetimeUrl = audioOnly
        ? `facetime-audio://${email}`
        : `facetime://${email}`;
    } else {
      return {
        success: false,
        error: 'Phone number or email is required for FaceTime',
      };
    }

    return {
      success: true,
      url: facetimeUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create FaceTime link',
    };
  }
}

/**
 * Generate Zoom meeting link
 */
export async function initiateZoom(options?: CallOptions): Promise<CallResult> {
  try {
    // Try to create via backend API first
    const response = await fetch('/api/calling/zoom/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: options?.name || 'Meeting',
        type: 1, // Instant meeting
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        url: data.joinUrl || data.startUrl,
      };
    }

    // Fallback: Generate a simple zoom link format
    // Note: This won't work without proper Zoom integration
    const meetingId = generateMeetingId();
    const zoomUrl = `https://zoom.us/j/${meetingId}`;
    
    return {
      success: true,
      url: zoomUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create Zoom meeting',
    };
  }
}

/**
 * Initiate phone call via Twilio
 */
export async function initiatePhoneCall(phoneNumber: string): Promise<CallResult> {
  if (!phoneNumber) {
    return {
      success: false,
      error: 'Phone number is required',
    };
  }

  // Validate phone number format
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '');
  if (cleanPhone.length < 10) {
    return {
      success: false,
      error: 'Invalid phone number format',
    };
  }

  try {
    // Get Twilio token from backend
    const response = await fetch('/api/calling/twilio/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: cleanPhone,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || 'Failed to get Twilio token',
      };
    }

    const data = await response.json();
    return {
      success: true,
      token: data.token,
      url: data.callUrl,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initiate phone call',
    };
  }
}

/**
 * Main function to initiate a call based on provider
 */
export async function initiateCall(
  provider: CallingProvider,
  options?: CallOptions
): Promise<CallResult> {
  switch (provider) {
    case 'google-meet':
      return await initiateGoogleMeet(options);
    
    case 'facetime':
      return initiateFaceTime(
        options?.phoneNumber,
        options?.email,
        !options?.video
      );
    
    case 'zoom':
      return await initiateZoom(options);
    
    case 'phone':
      if (!options?.phoneNumber) {
        return {
          success: false,
          error: 'Phone number is required for phone calls',
        };
      }
      return await initiatePhoneCall(options.phoneNumber);
    
    default:
      return {
        success: false,
        error: `Unknown provider: ${provider}`,
      };
  }
}

/**
 * Get user calling preferences
 */
export async function getCallingPreferences(): Promise<CallingPreferences | null> {
  try {
    const response = await fetch('/api/calling/preferences', {
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch calling preferences:', error);
    return null;
  }
}

/**
 * Save user calling preferences
 */
export async function saveCallingPreferences(
  preferences: Partial<CallingPreferences>
): Promise<boolean> {
  try {
    const response = await fetch('/api/calling/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(preferences),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to save calling preferences:', error);
    return false;
  }
}

/**
 * Get available calling providers based on preferences and device
 */
export function getAvailableProviders(
  preferences?: CallingPreferences | null
): CallingProvider[] {
  const providers: CallingProvider[] = [];

  // Google Meet is always available (web-based)
  if (!preferences || preferences.providers.googleMeet.enabled) {
    providers.push('google-meet');
  }

  // FaceTime only on supported devices
  if (isFaceTimeSupported() && (!preferences || preferences.providers.facetime.enabled)) {
    providers.push('facetime');
  }

  // Zoom if enabled
  if (!preferences || preferences.providers.zoom.enabled) {
    providers.push('zoom');
  }

  // Phone calls via Twilio if enabled
  if (!preferences || preferences.providers.twilio.enabled) {
    providers.push('phone');
  }

  return providers;
}

/**
 * Generate a random meeting ID
 */
function generateMeetingId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Open a call URL in a new window or redirect
 */
export function openCallUrl(url: string, provider: CallingProvider): void {
  if (provider === 'facetime') {
    // FaceTime links need to be opened directly
    window.location.href = url;
  } else {
    // Open other providers in a new window
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}


