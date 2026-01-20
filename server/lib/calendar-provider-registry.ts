/**
 * Calendar Provider Registry
 * Extensible system for registering and managing calendar providers
 */

import { CalendarSyncProvider, SyncEvent, SyncResult } from './calendar-sync-manager';

export type CalendarProviderType = 'google' | 'outlook' | 'apple' | 'highlevel' | 'calendly' | 'custom';

export interface CalendarProviderConfig {
  provider: CalendarProviderType;
  name: string;
  description: string;
  icon?: string;
  requiresOAuth: boolean;
  requiredFields: string[];
  optionalFields: string[];
  instructionsUrl?: string;
}

export interface CalendarProvider extends CalendarSyncProvider {
  provider: CalendarProviderType;
  getConfig(): CalendarProviderConfig;
  validateConfig(config: Record<string, any>): { valid: boolean; errors: string[] };
}

class CalendarProviderRegistry {
  private providers = new Map<CalendarProviderType, CalendarProvider>();

  /**
   * Register a calendar provider
   */
  register(provider: CalendarProvider): void {
    this.providers.set(provider.provider, provider);
    console.log(`[Calendar Provider Registry] Registered provider: ${provider.provider}`);
  }

  /**
   * Get a provider by type
   */
  get(providerType: CalendarProviderType): CalendarProvider | undefined {
    return this.providers.get(providerType);
  }

  /**
   * Get all registered providers
   */
  getAll(): CalendarProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get provider configuration
   */
  getProviderConfig(providerType: CalendarProviderType): CalendarProviderConfig | undefined {
    const provider = this.providers.get(providerType);
    return provider?.getConfig();
  }

  /**
   * Validate provider configuration
   */
  validateProviderConfig(
    providerType: CalendarProviderType,
    config: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const provider = this.providers.get(providerType);
    if (!provider) {
      return { valid: false, errors: [`Provider ${providerType} not found`] };
    }
    return provider.validateConfig(config);
  }

  /**
   * Check if provider is registered
   */
  has(providerType: CalendarProviderType): boolean {
    return this.providers.has(providerType);
  }

  /**
   * Get list of available provider types
   */
  getAvailableProviders(): CalendarProviderType[] {
    return Array.from(this.providers.keys());
  }
}

// Singleton instance
export const calendarProviderRegistry = new CalendarProviderRegistry();

/**
 * Register built-in providers
 */
export async function registerBuiltInProviders(): Promise<void> {
  try {
    // Register Google Calendar
    const { GoogleCalendarSync } = await import('./google-calendar-sync');
    const googleProvider = new GoogleCalendarSync();
    calendarProviderRegistry.register(googleProvider as any);

    // Register HighLevel
    const { highlevelCalendarSync } = await import('./highlevel-calendar-sync');
    if (highlevelCalendarSync && highlevelCalendarSync.isAvailable()) {
      calendarProviderRegistry.register(highlevelCalendarSync as any);
    }

    // Register Outlook (when implemented)
    // const { OutlookCalendarSync } = await import('./outlook-calendar-sync');
    // calendarProviderRegistry.register(new OutlookCalendarSync());

    // Register Apple Calendar (when implemented)
    // const { AppleCalendarSync } = await import('./apple-calendar-sync');
    // calendarProviderRegistry.register(new AppleCalendarSync());

    console.log('[Calendar Provider Registry] Built-in providers registered');
  } catch (error) {
    console.error('[Calendar Provider Registry] Error registering providers:', error);
  }
}
