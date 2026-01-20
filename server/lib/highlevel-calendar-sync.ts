/**
 * HighLevel Calendar Sync Implementation
 * Integrates with GoHighLevel Calendar/Appointment API
 * 
 * Requires:
 * - GHL_API_KEY environment variable
 * - GHL_LOCATION_ID environment variable
 */

import { CalendarSyncProvider, SyncEvent, SyncResult } from './calendar-sync-manager';
import { highlevelService } from '../highlevel-service';

interface HighLevelCalendar {
  id: string;
  name: string;
  userId?: string;
}

interface HighLevelAppointment {
  id: string;
  calendarId: string;
  contactId?: string;
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
  location?: string;
  assignedUserId?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class HighLevelCalendarSync implements CalendarSyncProvider, CalendarProvider {
  provider = 'highlevel' as const;
  private baseUrl = 'https://rest.gohighlevel.com/v1';
  private defaultApiKey: string | undefined;
  private defaultLocationId: string | undefined;

  constructor() {
    this.defaultApiKey = process.env.GHL_API_KEY;
    this.defaultLocationId = process.env.GHL_LOCATION_ID;
  }

  /**
   * Get user-specific API key and location ID from database, or use defaults
   */
  private async getUserConfig(userId: string): Promise<{ apiKey: string; locationId: string; calendarId?: string }> {
    try {
      const credentials = await db
        .select()
        .from(calendarSyncCredentials)
        .where(
          and(
            eq(calendarSyncCredentials.userId, userId),
            eq(calendarSyncCredentials.provider, 'highlevel')
          )
        )
        .limit(1);

      if (credentials.length > 0 && credentials[0].providerConfig) {
        const config = typeof credentials[0].providerConfig === 'string'
          ? JSON.parse(credentials[0].providerConfig)
          : credentials[0].providerConfig;

        if (config.apiKey && config.locationId) {
          return {
            apiKey: config.apiKey,
            locationId: config.locationId,
            calendarId: credentials[0].calendarId || config.calendarId,
          };
        }
      }
    } catch (error) {
      console.error('Error fetching user HighLevel config:', error);
    }

    // Fall back to default/global config
    if (!this.defaultApiKey || !this.defaultLocationId) {
      throw new Error('HighLevel API key or location ID not configured');
    }

    return {
      apiKey: this.defaultApiKey,
      locationId: this.defaultLocationId,
    };
  }

  /**
   * Get authenticated headers for HighLevel API
   */
  private getHeaders(apiKey: string) {
    return {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Version': '2021-07-28',
    };
  }

  /**
   * Check if HighLevel is available (globally or for user)
   */
  isAvailable(userId?: string): boolean {
    if (userId) {
      // Check if user has config - will be validated when fetching config
      // For now, return true if default config exists or user might have config
      return true;
    }
    return !!this.defaultApiKey && !!this.defaultLocationId;
  }

  /**
   * Get provider configuration
   */
  getConfig(): CalendarProviderConfig {
    return {
      provider: 'highlevel',
      name: 'GoHighLevel',
      description: 'Sync with your GoHighLevel calendar/appointments',
      requiresOAuth: false,
      requiredFields: ['apiKey', 'locationId'],
      optionalFields: ['calendarId'],
      instructionsUrl: '/enterprise/calendar/instructions/highlevel',
    };
  }

  /**
   * Validate configuration
   */
  validateConfig(config: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!config.apiKey || typeof config.apiKey !== 'string') {
      errors.push('API Key is required');
    }

    if (!config.locationId || typeof config.locationId !== 'string') {
      errors.push('Location ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Authenticate with HighLevel (uses API key, no OAuth needed)
   */
  async authenticate(userId: string): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('HighLevel API key or location ID not configured');
    }
    // HighLevel uses API key authentication, no OAuth flow needed
    // Return a success indicator
    return 'authenticated';
  }

  /**
   * Get all calendars for the location
   */
  async getCalendars(userId?: string): Promise<HighLevelCalendar[]> {
    try {
      const config = userId ? await this.getUserConfig(userId) : {
        apiKey: this.defaultApiKey!,
        locationId: this.defaultLocationId!,
      };

      if (!config.apiKey || !config.locationId) {
        return [];
      }

      const response = await fetch(`${this.baseUrl}/calendars/`, {
        method: 'GET',
        headers: this.getHeaders(config.apiKey),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HighLevel API error fetching calendars:', errorText);
        throw new Error(`HighLevel API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      return result.calendars || [];
    } catch (error) {
      console.error('Error fetching HighLevel calendars:', error);
      return [];
    }
  }

  /**
   * Pull events from HighLevel calendar
   */
  async pullEvents(userId: string, startDate: Date, endDate: Date): Promise<SyncEvent[]> {
    try {
      const config = await this.getUserConfig(userId);

      // Get calendar events (appointments)
      const response = await fetch(
        `${this.baseUrl}/calendars/events?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
        {
          method: 'GET',
          headers: this.getHeaders(config.apiKey),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('HighLevel API error fetching events:', errorText);
        throw new Error(`HighLevel API error: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const appointments: HighLevelAppointment[] = result.events || result.appointments || [];

      return appointments.map((appointment) => ({
        id: appointment.id,
        title: appointment.title || 'HighLevel Appointment',
        start: new Date(appointment.startTime),
        end: new Date(appointment.endTime || new Date(new Date(appointment.startTime).getTime() + 60 * 60 * 1000)),
        description: appointment.description,
        location: appointment.location,
        allDay: false, // HighLevel appointments are typically timed events
      }));
    } catch (error) {
      console.error('Error pulling HighLevel calendar events:', error);
      throw error;
    }
  }

  /**
   * Push events to HighLevel calendar
   */
  async pushEvents(userId: string, events: SyncEvent[]): Promise<SyncResult> {
    if (!this.isAvailable()) {
      return {
        success: false,
        synced: 0,
        errors: ['HighLevel not configured'],
        provider: 'highlevel',
      };
    }

    const errors: string[] = [];
    let synced = 0;

    try {
      // Get default calendar (first calendar or primary)
      const calendars = await this.getCalendars();
      if (calendars.length === 0) {
        return {
          success: false,
          synced: 0,
          errors: ['No HighLevel calendars found'],
          provider: 'highlevel',
        };
      }

      const calendarId = calendars[0].id;

      for (const event of events) {
        try {
          const appointmentData: any = {
            calendarId,
            title: event.title,
            startTime: event.start.toISOString(),
            endTime: event.end.toISOString(),
          };

          if (event.description) {
            appointmentData.description = event.description;
          }

          if (event.location) {
            appointmentData.location = event.location;
          }

          const response = await fetch(`${this.baseUrl}/calendars/events/appointments`, {
            method: 'POST',
            headers: this.getHeaders(config.apiKey),
            body: JSON.stringify(appointmentData),
          });

          if (!response.ok) {
            const errorText = await response.text();
            errors.push(`Failed to create appointment "${event.title}": ${errorText}`);
            console.error(`Error creating HighLevel appointment:`, errorText);
            continue;
          }

          synced++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to sync event "${event.title}": ${errorMsg}`);
          console.error(`Error syncing event to HighLevel:`, error);
        }
      }

      return {
        success: errors.length === 0,
        synced,
        errors,
        provider: 'highlevel',
      };
    } catch (error) {
      console.error('Error pushing events to HighLevel:', error);
      throw error;
    }
  }

  /**
   * Sync bidirectionally with HighLevel
   */
  async sync(userId: string, localEvents: SyncEvent[], startDate: Date, endDate: Date): Promise<SyncResult> {
    try {
      // Pull remote events
      const remoteEvents = await this.pullEvents(userId, startDate, endDate);

      // Merge local and remote events
      const allEvents = [...localEvents, ...remoteEvents];

      // Push local events that don't exist remotely
      const eventsToPush = localEvents.filter((local) => {
        return !remoteEvents.some((remote) => {
          // Simple matching: same time and similar title
          const timeMatch = Math.abs(local.start.getTime() - remote.start.getTime()) < 5 * 60 * 1000; // 5 minutes
          const titleMatch = local.title.toLowerCase().includes(remote.title.toLowerCase()) ||
                            remote.title.toLowerCase().includes(local.title.toLowerCase());
          return timeMatch && titleMatch;
        });
      });

      const pushResult = await this.pushEvents(userId, eventsToPush);

      return {
        success: pushResult.success,
        synced: pushResult.synced + remoteEvents.length,
        errors: pushResult.errors,
        provider: 'highlevel',
      };
    } catch (error) {
      console.error('Error syncing HighLevel calendar:', error);
      throw error;
    }
  }

  /**
   * Disconnect HighLevel (removes user's credentials from database)
   */
  async disconnect(userId: string): Promise<void> {
    try {
      // Remove user's HighLevel credentials from database
      await db
        .delete(calendarSyncCredentials)
        .where(
          and(
            eq(calendarSyncCredentials.userId, userId),
            eq(calendarSyncCredentials.provider, 'highlevel')
          )
        );
      console.log(`HighLevel calendar disconnected for user ${userId}`);
    } catch (error) {
      console.error('Error disconnecting HighLevel calendar:', error);
      throw error;
    }
  }

  /**
   * Get appointment by ID
   */
  async getAppointment(appointmentId: string, userId?: string): Promise<HighLevelAppointment | null> {
    try {
      const config = userId ? await this.getUserConfig(userId) : {
        apiKey: this.defaultApiKey!,
        locationId: this.defaultLocationId!,
      };

      if (!config.apiKey) {
        return null;
      }

      const response = await fetch(`${this.baseUrl}/calendars/events/appointments/${appointmentId}`, {
        method: 'GET',
        headers: this.getHeaders(config.apiKey),
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      return result.appointment || result;
    } catch (error) {
      console.error('Error fetching HighLevel appointment:', error);
      return null;
    }
  }

  /**
   * Update appointment
   */
  async updateAppointment(appointmentId: string, updates: Partial<HighLevelAppointment>, userId?: string): Promise<boolean> {
    try {
      const config = userId ? await this.getUserConfig(userId) : {
        apiKey: this.defaultApiKey!,
        locationId: this.defaultLocationId!,
      };

      if (!config.apiKey) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/calendars/events/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: this.getHeaders(config.apiKey),
        body: JSON.stringify(updates),
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating HighLevel appointment:', error);
      return false;
    }
  }
}

export const highlevelCalendarSync = new HighLevelCalendarSync();
