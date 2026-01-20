import { google } from 'googleapis';
import { CalendarSyncProvider, SyncEvent, SyncResult, ConflictResolution } from './calendar-sync-manager';
import { db } from '../db';
import { calendarSyncCredentials, externalCalendarEvents } from '@shared/schema-sqlite';
import { eq, and } from 'drizzle-orm';
import type { CalendarProviderConfig } from './calendar-provider-registry';

/**
 * Google Calendar Sync Implementation
 * 
 * Requires:
 * - GOOGLE_CLIENT_ID environment variable
 * - GOOGLE_CLIENT_SECRET environment variable
 * - GOOGLE_REDIRECT_URI environment variable (e.g., https://yourdomain.com/api/operations-calendar/google/callback)
 */
export class GoogleCalendarSync implements CalendarSyncProvider, CalendarProvider {
  provider = 'google' as const;

  private getOAuth2Client() {
    return new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/operations-calendar/google/callback'
    );
  }

  /**
   * Get authenticated calendar client for a user
   */
  private async getAuthenticatedClient(userId: string, calendarId?: string) {
    // Get credentials from database
    const credentials = await db
      .select()
      .from(calendarSyncCredentials)
      .where(
        and(
          eq(calendarSyncCredentials.userId, userId),
          eq(calendarSyncCredentials.provider, 'google')
        )
      )
      .limit(1);

    if (credentials.length === 0 || !credentials[0].refreshToken) {
      throw new Error('Google Calendar not connected. Please authenticate first.');
    }

    const oauth2Client = this.getOAuth2Client();
    oauth2Client.setCredentials({
      refresh_token: credentials[0].refreshToken,
    });

    // Refresh access token if needed
    try {
      const { credentials: newCredentials } = await oauth2Client.refreshAccessToken();
      oauth2Client.setCredentials(newCredentials);
    } catch (error) {
      console.error('Error refreshing Google access token:', error);
      throw new Error('Failed to refresh Google Calendar access token. Please re-authenticate.');
    }

    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  /**
   * Get calendar ID for user (from credentials or default to 'primary')
   */
  private async getCalendarId(userId: string): Promise<string> {
    const credentials = await db
      .select()
      .from(calendarSyncCredentials)
      .where(
        and(
          eq(calendarSyncCredentials.userId, userId),
          eq(calendarSyncCredentials.provider, 'google')
        )
      )
      .limit(1);

    if (credentials.length > 0 && credentials[0].calendarId) {
      return credentials[0].calendarId;
    }

    return 'primary'; // Default to primary calendar
  }

  async authenticate(userId: string): Promise<string> {
    const oauth2Client = this.getOAuth2Client();
    
    // Generate auth URL
    const scopes = ['https://www.googleapis.com/auth/calendar'];
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId, // Pass userId in state for callback
      prompt: 'consent', // Force consent to get refresh token
    });
    
    return authUrl;
  }

  async pullEvents(userId: string, startDate: Date, endDate: Date): Promise<SyncEvent[]> {
    try {
      const calendar = await this.getAuthenticatedClient(userId);

      // Fetch events from primary calendar
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500, // Google Calendar API limit
      });

      const events = response.data.items || [];

      return events.map((event) => {
        const start = event.start?.dateTime 
          ? new Date(event.start.dateTime)
          : event.start?.date 
          ? new Date(event.start.date + 'T00:00:00')
          : new Date();
        
        const end = event.end?.dateTime
          ? new Date(event.end.dateTime)
          : event.end?.date
          ? new Date(event.end.date + 'T23:59:59')
          : new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour

        return {
          id: event.id || '',
          title: event.summary || 'Untitled Event',
          start,
          end,
          description: event.description || undefined,
          location: event.location || undefined,
          allDay: !!event.start?.date, // All-day events use date instead of dateTime
        };
      });
    } catch (error) {
      console.error('Error pulling Google Calendar events:', error);
      throw error;
    }
  }

  async pushEvents(userId: string, events: SyncEvent[]): Promise<SyncResult> {
    try {
      const calendar = await this.getAuthenticatedClient(userId);
      const errors: string[] = [];
      let synced = 0;

      for (const event of events) {
        try {
          // Check if event already exists in Google Calendar
          const existingMapping = await db
            .select()
            .from(externalCalendarEvents)
            .where(
              and(
                eq(externalCalendarEvents.provider, 'google'),
                // We need to find by operationId or create a mapping
              )
            )
            .limit(1);

          const googleEvent: any = {
            summary: event.title,
            description: event.description,
            location: event.location,
          };

          if (event.allDay) {
            // All-day event
            const dateStr = event.start.toISOString().split('T')[0];
            googleEvent.start = { date: dateStr };
            googleEvent.end = { date: dateStr };
          } else {
            // Timed event
            googleEvent.start = { dateTime: event.start.toISOString(), timeZone: 'UTC' };
            googleEvent.end = { dateTime: event.end.toISOString(), timeZone: 'UTC' };
          }

          const calendarId = await this.getCalendarId(userId);
          
          if (existingMapping.length > 0 && existingMapping[0].externalEventId) {
            // Update existing event
            await calendar.events.update({
              calendarId,
              eventId: existingMapping[0].externalEventId,
              requestBody: googleEvent,
            });
          } else {
            // Create new event
            const created = await calendar.events.insert({
              calendarId,
              requestBody: googleEvent,
            });

            // Store mapping (would need operationId - this is a simplified version)
            // In full implementation, we'd link to operationsCalendar.id
          }

          synced++;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`Failed to sync event "${event.title}": ${errorMsg}`);
          console.error(`Error syncing event to Google Calendar:`, error);
        }
      }

      return {
        success: errors.length === 0,
        synced,
        errors,
        provider: 'google',
      };
    } catch (error) {
      console.error('Error pushing events to Google Calendar:', error);
      throw error;
    }
  }

  async sync(userId: string, localEvents: SyncEvent[], startDate: Date, endDate: Date): Promise<SyncResult> {
    try {
      // Pull remote events
      const remoteEvents = await this.pullEvents(userId, startDate, endDate);

      // Merge local and remote events (simple merge - conflict resolution handled separately)
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
        provider: 'google',
      };
    } catch (error) {
      console.error('Error syncing Google Calendar:', error);
      throw error;
    }
  }

  async disconnect(userId: string): Promise<void> {
    try {
      // Remove credentials from database
      await db
        .delete(calendarSyncCredentials)
        .where(
          and(
            eq(calendarSyncCredentials.userId, userId),
            eq(calendarSyncCredentials.provider, 'google')
          )
        );

      // Remove external event mappings
      await db
        .delete(externalCalendarEvents)
        .where(eq(externalCalendarEvents.provider, 'google'));

      console.log(`Google Calendar disconnected for user ${userId}`);
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(code: string, userId: string): Promise<{ refreshToken: string; accessToken: string }> {
    const oauth2Client = this.getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      throw new Error('No refresh token received. Please re-authenticate with consent.');
    }
    
    return {
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token || '',
    };
  }
}







