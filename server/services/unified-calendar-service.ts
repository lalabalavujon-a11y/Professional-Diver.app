/**
 * Unified Calendar Service
 * Aggregates events from all calendar sources (Internal CRM, Calendly, Google, HighLevel)
 * and provides a unified view with conflict detection and resolution
 */

import { db } from "../db";
import { operationsCalendar, unifiedCalendarEvents, calendarSyncCredentials } from "@shared/schema-sqlite";
import { eq, and, gte, lte } from "drizzle-orm";
import { calendlyService, type ExtractedBookingData } from "../calendly-service";
import { SyncEvent } from "../lib/calendar-sync-manager";
import { nanoid } from "nanoid";

export type CalendarSource = 'internal' | 'calendly' | 'google' | 'highlevel';

export interface UnifiedCalendarEvent {
  id: string;
  source: CalendarSource;
  sourceId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  location?: string;
  attendees?: Array<{ email: string; name?: string }>;
  metadata: {
    clientId?: string;
    eventUri?: string;
    calendarId?: string;
    syncStatus: 'synced' | 'pending' | 'conflict';
    lastSyncedAt?: Date;
    userId?: string;
    eventType?: string;
    status?: string;
  };
  color?: string;
  allDay?: boolean;
}

export interface CalendarAggregationOptions {
  startDate: Date;
  endDate: Date;
  userId?: string;
  sources?: CalendarSource[];
}

export class UnifiedCalendarService {
  /**
   * Aggregate events from all sources and normalize to unified format
   */
  async aggregateEvents(options: CalendarAggregationOptions): Promise<UnifiedCalendarEvent[]> {
    const { startDate, endDate, userId, sources } = options;
    const allEvents: UnifiedCalendarEvent[] = [];

    // Fetch from internal CRM calendar
    if (!sources || sources.includes('internal')) {
      const internalEvents = await this.fetchInternalEvents(startDate, endDate, userId);
      allEvents.push(...internalEvents);
    }

    // Fetch from Calendly (via webhook data stored in clients table)
    // Note: Calendly events are shared across users, but we can filter by user's clients if needed
    if (!sources || sources.includes('calendly')) {
      const calendlyEvents = await this.fetchCalendlyEvents(startDate, endDate, userId);
      allEvents.push(...calendlyEvents);
    }

    // Fetch from Google Calendar (if connected)
    if (!sources || sources.includes('google')) {
      try {
        const googleEvents = await this.fetchGoogleEvents(startDate, endDate, userId);
        allEvents.push(...googleEvents);
      } catch (error) {
        console.warn('Error fetching Google Calendar events:', error);
        // Continue with other sources
      }
    }

    // Fetch from HighLevel (if connected)
    if (!sources || sources.includes('highlevel')) {
      try {
        const highlevelEvents = await this.fetchHighLevelEvents(startDate, endDate, userId);
        allEvents.push(...highlevelEvents);
      } catch (error) {
        console.warn('Error fetching HighLevel calendar events:', error);
        // Continue with other sources
      }
    }

    // Deduplicate events (same time + similar attendees)
    const deduplicated = this.deduplicateEvents(allEvents);

    // Store events in unified_calendar_events table for persistence
    await this.storeUnifiedEvents(deduplicated, userId);

    return deduplicated.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * Store unified events in database
   */
  private async storeUnifiedEvents(events: UnifiedCalendarEvent[], userId?: string): Promise<void> {
    try {
      for (const event of events) {
        // Check if event already exists
        const existing = await db
          .select()
          .from(unifiedCalendarEvents)
          .where(
            and(
              eq(unifiedCalendarEvents.source, event.source),
              eq(unifiedCalendarEvents.sourceId, event.sourceId)
            )
          )
          .limit(1);

        // Convert dates to timestamps for SQLite compatibility
        const startTime = event.startTime instanceof Date ? event.startTime : new Date(event.startTime);
        const endTime = event.endTime instanceof Date ? event.endTime : new Date(event.endTime);

        const eventData: any = {
          id: event.id,
          source: event.source,
          sourceId: event.sourceId,
          title: event.title,
          startTime: startTime,
          endTime: endTime,
          description: event.description || null,
          location: event.location || null,
          attendees: event.attendees ? JSON.stringify(event.attendees) : null,
          metadata: JSON.stringify(event.metadata),
          color: event.color || null,
          allDay: event.allDay || false,
          userId: userId || null,
          updatedAt: new Date(),
        };

        if (existing.length > 0) {
          // Update existing
          await db
            .update(unifiedCalendarEvents)
            .set(eventData)
            .where(eq(unifiedCalendarEvents.id, event.id));
        } else {
          // Insert new
          await db.insert(unifiedCalendarEvents).values({
            ...eventData,
            createdAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error('Error storing unified events:', error);
      // Don't throw - storage is non-critical for aggregation
    }
  }

  /**
   * Get unified calendar view for a user
   */
  async getUnifiedCalendar(userId: string, startDate: Date, endDate: Date): Promise<UnifiedCalendarEvent[]> {
    return this.aggregateEvents({
      startDate,
      endDate,
      userId,
    });
  }

  /**
   * Detect conflicts in events (delegates to conflict resolver)
   */
  async detectConflicts(events: UnifiedCalendarEvent[]): Promise<any[]> {
    const { calendarConflictResolver } = await import('./calendar-conflict-resolver');
    return calendarConflictResolver.detectConflicts(events);
  }

  /**
   * Validate calendar connection configuration
   */
  async validateCalendarConnection(
    userId: string,
    provider: CalendarSource,
    config: Record<string, any>
  ): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const { calendarProviderRegistry, registerBuiltInProviders } = await import('../lib/calendar-provider-registry');
      await registerBuiltInProviders();

      if (!calendarProviderRegistry.has(provider)) {
        return {
          valid: false,
          errors: [`Provider ${provider} is not supported`],
        };
      }

      return calendarProviderRegistry.validateProviderConfig(provider, config);
    } catch (error) {
      console.error('Error validating calendar connection:', error);
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
      };
    }
  }

  /**
   * Fetch events from internal CRM calendar
   */
  private async fetchInternalEvents(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<UnifiedCalendarEvent[]> {
    try {
      const conditions: any[] = [
        gte(operationsCalendar.operationDate, startDate),
        lte(operationsCalendar.operationDate, endDate),
      ];

      if (userId) {
        conditions.push(eq(operationsCalendar.userId, userId));
      }

      const results = await db
        .select()
        .from(operationsCalendar)
        .where(and(...conditions));

      return results.map((op) => {
        const startTime = this.parseOperationDateTime(op.operationDate, op.startTime);
        const endTime = this.parseOperationDateTime(op.operationDate, op.endTime || op.startTime || '17:00');

        return {
          id: `internal-${op.id}`,
          source: 'internal' as CalendarSource,
          sourceId: op.id,
          title: op.title,
          startTime,
          endTime,
          description: op.description || undefined,
          location: op.location || undefined,
          metadata: {
            userId: op.userId || userId,
            eventType: op.type,
            status: op.status,
            syncStatus: 'synced',
          },
          color: op.color || '#8b5cf6',
          allDay: !op.startTime && !op.endTime,
        };
      });
    } catch (error) {
      console.error('Error fetching internal calendar events:', error);
      return [];
    }
  }

  /**
   * Fetch Calendly events from clients table
   */
  private async fetchCalendlyEvents(
    startDate: Date,
    endDate: Date
  ): Promise<UnifiedCalendarEvent[]> {
    try {
      // Guard: db.execute is not available in SQLite (better-sqlite3)
      if (typeof (db as any).execute !== 'function') {
        console.warn('db.execute not available; skipping Calendly fetch (SQLite mode)');
        return [];
      }

      // Query clients that have Calendly bookings in the date range
      const results = await db.execute(`
        SELECT 
          id, name, email, calendly_event_uri, last_booking_time, 
          booking_count, notes, partner_status
        FROM clients
        WHERE last_booking_time IS NOT NULL
          AND last_booking_time >= $1
          AND last_booking_time <= $2
          AND calendly_event_uri IS NOT NULL
      `, [
        startDate.toISOString(),
        endDate.toISOString(),
      ]);

      // Handle both PostgreSQL (results.rows) and direct array results
      const rows = Array.isArray(results) ? results : (results.rows || []);
      return rows.map((client: any) => {
        const bookingTime = new Date(client.last_booking_time);
        const endTime = new Date(bookingTime.getTime() + 60 * 60 * 1000); // Default 1 hour duration

        // Extract event name from notes if available
        const notes = client.notes || '';
        const eventNameMatch = notes.match(/Event: (.+)/);
        const eventName = eventNameMatch ? eventNameMatch[1] : 'Calendly Meeting';

        return {
          id: `calendly-${client.id}`,
          source: 'calendly' as CalendarSource,
          sourceId: client.calendly_event_uri,
          title: `${eventName} - ${client.name}`,
          startTime: bookingTime,
          endTime,
          description: `Calendly booking with ${client.name} (${client.email})`,
          attendees: [{ email: client.email, name: client.name }],
          metadata: {
            clientId: client.id,
            eventUri: client.calendly_event_uri,
            syncStatus: 'synced',
            lastSyncedAt: bookingTime,
          },
          color: '#3b82f6', // Blue for Calendly
          allDay: false,
        };
      });
    } catch (error) {
      console.error('Error fetching Calendly events:', error);
      return [];
    }
  }

  /**
   * Get user's calendar connections
   */
  async getUserCalendarConnections(userId: string): Promise<Array<{ provider: string; calendarId?: string; isActive: boolean }>> {
    try {
      const connections = await db
        .select()
        .from(calendarSyncCredentials)
        .where(
          and(
            eq(calendarSyncCredentials.userId, userId),
            eq(calendarSyncCredentials.isActive, true),
            eq(calendarSyncCredentials.syncEnabled, true)
          )
        );

      return connections.map(conn => ({
        provider: conn.provider,
        calendarId: conn.calendarId || undefined,
        isActive: conn.isActive,
      }));
    } catch (error) {
      console.error('Error fetching user calendar connections:', error);
      return [];
    }
  }

  /**
   * Fetch Google Calendar events (only if user has connected Google Calendar)
   */
  private async fetchGoogleEvents(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<UnifiedCalendarEvent[]> {
    if (!userId) {
      return [];
    }

    try {
      // Check if user has Google Calendar connected
      const connections = await this.getUserCalendarConnections(userId);
      const hasGoogleConnection = connections.some(c => c.provider === 'google');
      
      if (!hasGoogleConnection) {
        return []; // User hasn't connected Google Calendar
      }

      const { GoogleCalendarSync } = await import('../lib/google-calendar-sync');
      const googleSync = new GoogleCalendarSync();
      
      const syncEvents = await googleSync.pullEvents(userId, startDate, endDate);
      
      return syncEvents.map((event) => ({
        id: `google-${event.id}`,
        source: 'google' as CalendarSource,
        sourceId: event.id,
        title: event.title,
        startTime: event.start,
        endTime: event.end,
        description: event.description,
        location: event.location,
        metadata: {
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          userId,
        },
        color: '#dc2626', // Red for Google
        allDay: event.allDay || false,
      }));
    } catch (error) {
      console.warn('Error fetching Google Calendar events:', error);
      return [];
    }
  }

  /**
   * Fetch HighLevel calendar events (only if user has connected HighLevel)
   */
  private async fetchHighLevelEvents(
    startDate: Date,
    endDate: Date,
    userId?: string
  ): Promise<UnifiedCalendarEvent[]> {
    if (!userId) {
      return [];
    }

    try {
      // Check if user has HighLevel connected
      const connections = await this.getUserCalendarConnections(userId);
      const hasHighLevelConnection = connections.some(c => c.provider === 'highlevel');
      
      if (!hasHighLevelConnection) {
        return []; // User hasn't connected HighLevel
      }

      const { highlevelCalendarSync } = await import('../lib/highlevel-calendar-sync');
      
      if (!highlevelCalendarSync.isAvailable(userId)) {
        return [];
      }

      const syncEvents = await highlevelCalendarSync.pullEvents(userId, startDate, endDate);
      
      return syncEvents.map((event) => ({
        id: `highlevel-${event.id}`,
        source: 'highlevel' as CalendarSource,
        sourceId: event.id,
        title: event.title,
        startTime: event.start,
        endTime: event.end,
        description: event.description,
        location: event.location,
        metadata: {
          syncStatus: 'synced',
          lastSyncedAt: new Date(),
          userId,
        },
        color: '#10b981', // Green for HighLevel
        allDay: event.allDay || false,
      }));
    } catch (error) {
      console.warn('Error fetching HighLevel calendar events:', error);
      return [];
    }
  }

  /**
   * Deduplicate events based on time and attendees
   */
  private deduplicateEvents(events: UnifiedCalendarEvent[]): UnifiedCalendarEvent[] {
    const seen = new Map<string, UnifiedCalendarEvent>();

    for (const event of events) {
      // Create a key based on time window and primary attendee
      const timeKey = `${event.startTime.getTime()}-${event.endTime.getTime()}`;
      const attendeeKey = event.attendees?.[0]?.email || '';
      const key = `${timeKey}-${attendeeKey}`;

      if (!seen.has(key)) {
        seen.set(key, event);
      } else {
        // Merge similar events, keeping the one with more metadata
        const existing = seen.get(key)!;
        if (event.metadata.syncStatus === 'synced' && existing.metadata.syncStatus !== 'synced') {
          seen.set(key, event);
        } else if (event.attendees && event.attendees.length > (existing.attendees?.length || 0)) {
          seen.set(key, event);
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Merge similar events intelligently
   */
  mergeEvents(events: UnifiedCalendarEvent[]): UnifiedCalendarEvent[] {
    return this.deduplicateEvents(events);
  }

  /**
   * Parse operation date and time into a Date object
   */
  private parseOperationDateTime(operationDate: Date, timeString?: string | null): Date {
    const date = new Date(operationDate);
    
    if (!timeString) {
      // If no time specified, default to start of day
      date.setHours(0, 0, 0, 0);
      return date;
    }

    // Parse time string (format: "HH:MM" or "HH:MM:SS")
    const timeParts = timeString.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1] || '0', 10);

    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Normalize event from Calendly booking data
   */
  normalizeCalendlyEvent(bookingData: ExtractedBookingData, clientId?: string): UnifiedCalendarEvent {
    const startTime = new Date(bookingData.startTime);
    const endTime = new Date(bookingData.endTime);

    return {
      id: `calendly-${nanoid()}`,
      source: 'calendly',
      sourceId: bookingData.eventUri,
      title: `${bookingData.eventName} - ${bookingData.name}`,
      startTime,
      endTime,
      description: `Calendly booking: ${bookingData.eventName}`,
      attendees: [{ email: bookingData.email, name: bookingData.name }],
      metadata: {
        clientId,
        eventUri: bookingData.eventUri,
        syncStatus: bookingData.canceled ? 'pending' : 'synced',
        lastSyncedAt: new Date(),
      },
      color: '#3b82f6',
      allDay: false,
    };
  }

  /**
   * Normalize event from Google Calendar SyncEvent
   */
  normalizeGoogleEvent(syncEvent: SyncEvent, externalEventId: string): UnifiedCalendarEvent {
    return {
      id: `google-${nanoid()}`,
      source: 'google',
      sourceId: externalEventId,
      title: syncEvent.title,
      startTime: syncEvent.start,
      endTime: syncEvent.end,
      description: syncEvent.description,
      location: syncEvent.location,
      metadata: {
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
      },
      color: '#dc2626', // Red for Google
      allDay: syncEvent.allDay || false,
    };
  }

  /**
   * Normalize event from HighLevel appointment
   */
  normalizeHighLevelEvent(appointment: any): UnifiedCalendarEvent {
    const startTime = new Date(appointment.startTime || appointment.start_time);
    const endTime = new Date(appointment.endTime || appointment.end_time || startTime.getTime() + 60 * 60 * 1000);

    return {
      id: `highlevel-${appointment.id || nanoid()}`,
      source: 'highlevel',
      sourceId: appointment.id || appointment.eventId,
      title: appointment.title || appointment.name || 'HighLevel Appointment',
      startTime,
      endTime,
      description: appointment.description || appointment.notes,
      location: appointment.location,
      attendees: appointment.attendees?.map((a: any) => ({
        email: a.email || a.contactEmail,
        name: a.name || a.contactName,
      })),
      metadata: {
        calendarId: appointment.calendarId,
        syncStatus: 'synced',
        lastSyncedAt: new Date(),
      },
      color: '#10b981', // Green for HighLevel
      allDay: appointment.allDay || false,
    };
  }
}

export const unifiedCalendarService = new UnifiedCalendarService();
