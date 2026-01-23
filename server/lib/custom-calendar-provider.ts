/**
 * Custom Calendar Provider Template
 * Base class for custom calendar integrations (iCal, CalDAV, custom APIs)
 */

import { CalendarSyncProvider, SyncEvent, SyncResult } from './calendar-sync-manager';
import type { CalendarProviderConfig } from './calendar-provider-registry';

export interface CustomCalendarConfig {
  type: 'ical' | 'caldav' | 'api';
  url?: string;
  serverUrl?: string;
  username?: string;
  password?: string;
  calendarPath?: string;
  apiKey?: string;
  apiEndpoint?: string;
  authMethod?: 'basic' | 'bearer' | 'oauth';
  [key: string]: any; // Allow additional custom fields
}

/**
 * Base class for custom calendar providers
 */
export abstract class CustomCalendarProvider implements CalendarSyncProvider {
  abstract provider: 'custom';
  protected config: CustomCalendarConfig;

  constructor(config: CustomCalendarConfig) {
    this.config = config;
  }

  /**
   * Get provider configuration
   */
  abstract getConfig(): CalendarProviderConfig;

  /**
   * Validate configuration
   */
  abstract validateConfig(config: Record<string, any>): { valid: boolean; errors: string[] };

  /**
   * Authenticate with the provider
   */
  abstract authenticate(userId: string): Promise<string>;

  /**
   * Pull events from external calendar
   */
  abstract pullEvents(userId: string, startDate: Date, endDate: Date): Promise<SyncEvent[]>;

  /**
   * Push events to external calendar
   */
  abstract pushEvents(userId: string, events: SyncEvent[]): Promise<SyncResult>;

  /**
   * Sync bidirectionally
   */
  async sync(userId: string, localEvents: SyncEvent[], startDate: Date, endDate: Date): Promise<SyncResult> {
    try {
      const remoteEvents = await this.pullEvents(userId, startDate, endDate);
      const pushResult = await this.pushEvents(userId, localEvents);

      return {
        success: pushResult.success,
        synced: pushResult.synced + remoteEvents.length,
        errors: pushResult.errors,
        provider: 'custom',
      };
    } catch (error) {
      console.error('Error syncing custom calendar:', error);
      throw error;
    }
  }
}

/**
 * iCal Feed Provider
 * Reads events from an iCal feed URL
 */
export class ICalFeedProvider extends CustomCalendarProvider {
  provider = 'custom' as const;

  getConfig(): CalendarProviderConfig {
    return {
      provider: 'custom',
      name: 'iCal Feed',
      description: 'Connect to a calendar using an iCal feed URL',
      requiresOAuth: false,
      requiredFields: ['url'],
      optionalFields: [],
      instructionsUrl: '/enterprise/calendar/instructions/custom',
    };
  }

  validateConfig(config: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.url || typeof config.url !== 'string') {
      errors.push('iCal feed URL is required');
    } else if (!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
      errors.push('iCal feed URL must be a valid HTTP/HTTPS URL');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async authenticate(userId: string): Promise<string> {
    // iCal feeds don't require authentication
    return 'authenticated';
  }

  async pullEvents(userId: string, startDate: Date, endDate: Date): Promise<SyncEvent[]> {
    try {
      // Fetch iCal feed
      const response = await fetch(this.config.url!);
      if (!response.ok) {
        throw new Error(`Failed to fetch iCal feed: ${response.statusText}`);
      }

      const icalText = await response.text();

      // Parse iCal (would need an iCal parser library like 'ical.js' or 'node-ical')
      // For now, return empty array - full implementation would parse the iCal format
      console.warn('iCal parsing not yet implemented - requires ical.js library');
      return [];

      // Example with ical.js (if installed):
      // const ical = require('ical.js');
      // const jcalData = ical.parse(icalText);
      // const comp = new ical.Component(jcalData);
      // const vevents = comp.getAllSubcomponents('vevent');
      // return vevents.map(vevent => this.parseVEvent(vevent));
    } catch (error) {
      console.error('Error fetching iCal feed:', error);
      throw error;
    }
  }

  async pushEvents(userId: string, events: SyncEvent[]): Promise<SyncResult> {
    // iCal feeds are typically read-only
    return {
      success: false,
      synced: 0,
      errors: ['iCal feeds are read-only - cannot push events'],
      provider: 'custom',
    };
  }

  async disconnect(userId: string): Promise<void> {
    // No cleanup needed for iCal feeds
  }
}

/**
 * CalDAV Provider
 * Connects to a CalDAV server (e.g., iCloud, ownCloud, Nextcloud)
 */
export class CalDAVProvider extends CustomCalendarProvider {
  provider = 'custom' as const;

  getConfig(): CalendarProviderConfig {
    return {
      provider: 'custom',
      name: 'CalDAV',
      description: 'Connect to a CalDAV server (iCloud, ownCloud, Nextcloud, etc.)',
      requiresOAuth: false,
      requiredFields: ['serverUrl', 'username', 'password'],
      optionalFields: ['calendarPath'],
      instructionsUrl: '/enterprise/calendar/instructions/custom',
    };
  }

  validateConfig(config: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.serverUrl || typeof config.serverUrl !== 'string') {
      errors.push('CalDAV server URL is required');
    }

    if (!config.username || typeof config.username !== 'string') {
      errors.push('Username is required');
    }

    if (!config.password || typeof config.password !== 'string') {
      errors.push('Password is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async authenticate(userId: string): Promise<string> {
    // Test CalDAV connection
    try {
      const testUrl = `${this.config.serverUrl}/.well-known/caldav`;
      const response = await fetch(testUrl, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
        },
      });

      if (!response.ok) {
        throw new Error('CalDAV authentication failed');
      }

      return 'authenticated';
    } catch (error) {
      console.error('CalDAV authentication error:', error);
      throw new Error('Failed to authenticate with CalDAV server');
    }
  }

  async pullEvents(userId: string, startDate: Date, endDate: Date): Promise<SyncEvent[]> {
    try {
      // CalDAV PROPFIND request to get calendar events
      // This is a simplified version - full CalDAV implementation would use proper CalDAV client library
      const calendarPath = this.config.calendarPath || '/';
      const caldavUrl = `${this.config.serverUrl}${calendarPath}`;

      const response = await fetch(caldavUrl, {
        method: 'REPORT',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64')}`,
          'Content-Type': 'application/xml',
          'Depth': '1',
        },
        body: `<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop>
    <D:getetag/>
    <C:calendar-data/>
  </D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="${startDate.toISOString()}" end="${endDate.toISOString()}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>`,
      });

      if (!response.ok) {
        throw new Error(`CalDAV request failed: ${response.statusText}`);
      }

      // Parse CalDAV XML response and extract iCal data
      // Full implementation would parse XML and iCal data
      console.warn('CalDAV parsing not yet fully implemented - requires CalDAV client library');
      return [];
    } catch (error) {
      console.error('Error fetching CalDAV events:', error);
      throw error;
    }
  }

  async pushEvents(userId: string, events: SyncEvent[]): Promise<SyncResult> {
    // CalDAV PUT request to create/update events
    // Full implementation would convert events to iCal format and PUT to CalDAV server
    console.warn('CalDAV push not yet fully implemented');
    return {
      success: false,
      synced: 0,
      errors: ['CalDAV push not yet implemented'],
      provider: 'custom',
    };
  }

  async disconnect(userId: string): Promise<void> {
    // No cleanup needed for CalDAV
  }
}

/**
 * Custom API Provider
 * Connects to a custom calendar API endpoint
 */
export class CustomAPIProvider extends CustomCalendarProvider {
  provider = 'custom' as const;

  getConfig(): CalendarProviderConfig {
    return {
      provider: 'custom',
      name: 'Custom API',
      description: 'Connect to a custom calendar API endpoint',
      requiresOAuth: false,
      requiredFields: ['apiEndpoint'],
      optionalFields: ['apiKey', 'authMethod'],
      instructionsUrl: '/enterprise/calendar/instructions/custom',
    };
  }

  validateConfig(config: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.apiEndpoint || typeof config.apiEndpoint !== 'string') {
      errors.push('API endpoint URL is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  async authenticate(userId: string): Promise<string> {
    // Test API connection
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        if (this.config.authMethod === 'bearer') {
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        } else {
          headers['X-API-Key'] = this.config.apiKey;
        }
      }

      const response = await fetch(this.config.apiEndpoint!, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('API authentication failed');
      }

      return 'authenticated';
    } catch (error) {
      console.error('Custom API authentication error:', error);
      throw new Error('Failed to authenticate with custom API');
    }
  }

  async pullEvents(userId: string, startDate: Date, endDate: Date): Promise<SyncEvent[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        if (this.config.authMethod === 'bearer') {
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        } else {
          headers['X-API-Key'] = this.config.apiKey;
        }
      }

      const url = new URL(this.config.apiEndpoint!);
      url.searchParams.append('startDate', startDate.toISOString());
      url.searchParams.append('endDate', endDate.toISOString());

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Map API response to SyncEvent format
      // Assumes API returns array of events with standard fields
      return (data.events || data || []).map((event: any) => ({
        id: event.id || event.eventId,
        title: event.title || event.name,
        start: new Date(event.startTime || event.start || event.startDate),
        end: new Date(event.endTime || event.end || event.endDate),
        description: event.description,
        location: event.location,
        allDay: event.allDay || false,
      }));
    } catch (error) {
      console.error('Error fetching custom API events:', error);
      throw error;
    }
  }

  async pushEvents(userId: string, events: SyncEvent[]): Promise<SyncResult> {
    const errors: string[] = [];
    let synced = 0;

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        if (this.config.authMethod === 'bearer') {
          headers['Authorization'] = `Bearer ${this.config.apiKey}`;
        } else {
          headers['X-API-Key'] = this.config.apiKey;
        }
      }

      for (const event of events) {
        try {
          const response = await fetch(this.config.apiEndpoint!, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              title: event.title,
              startTime: event.start.toISOString(),
              endTime: event.end.toISOString(),
              description: event.description,
              location: event.location,
              allDay: event.allDay,
            }),
          });

          if (!response.ok) {
            errors.push(`Failed to sync event "${event.title}"`);
            continue;
          }

          synced++;
        } catch (error) {
          errors.push(`Error syncing event "${event.title}": ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return {
        success: errors.length === 0,
        synced,
        errors,
        provider: 'custom',
      };
    } catch (error) {
      console.error('Error pushing events to custom API:', error);
      throw error;
    }
  }

  async disconnect(userId: string): Promise<void> {
    // No cleanup needed for custom API
  }
}
