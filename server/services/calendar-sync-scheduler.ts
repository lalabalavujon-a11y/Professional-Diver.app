/**
 * Calendar Sync Scheduler
 * Handles periodic synchronization of calendars from all sources
 */

import { db } from "../db";
import { calendarSyncStatus, calendarSyncLogs } from "@shared/schema-sqlite";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { GoogleCalendarSync } from "../lib/google-calendar-sync";
import { highlevelCalendarSync } from "../lib/highlevel-calendar-sync";
import { unifiedCalendarService } from "./unified-calendar-service";
import { calendarSyncCredentials } from "@shared/schema-sqlite";

export type CalendarSource = 'internal' | 'calendly' | 'google' | 'highlevel';

interface SyncResult {
  source: CalendarSource;
  success: boolean;
  eventsSynced: number;
  errors: string[];
}

export class CalendarSyncScheduler {
  /**
   * Sync all calendars for a user
   */
  async syncUserCalendars(userId: string, specificSource?: CalendarSource): Promise<SyncResult[]> {
    const results: SyncResult[] = [];
    const sources: CalendarSource[] = specificSource 
      ? [specificSource]
      : ['google', 'highlevel']; // Calendly is webhook-driven, internal is always in sync

    for (const source of sources) {
      try {
        const result = await this.syncSource(userId, source);
        results.push(result);
      } catch (error) {
        console.error(`Error syncing ${source} for user ${userId}:`, error);
        results.push({
          source,
          success: false,
          eventsSynced: 0,
          errors: [error instanceof Error ? error.message : String(error)],
        });
      }
    }

    return results;
  }

  /**
   * Sync a specific source
   */
  private async syncSource(userId: string, source: CalendarSource): Promise<SyncResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let eventsSynced = 0;

    try {
      // Update sync status to in_progress
      await this.updateSyncStatus(userId, source, 'in_progress', null, 0);

      // Calculate date range (last 7 days to next 30 days)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      if (source === 'google') {
        const googleSync = new GoogleCalendarSync();
        
        // Check if user has Google Calendar connected
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

        if (credentials.length === 0) {
          return {
            source,
            success: true,
            eventsSynced: 0,
            errors: ['Google Calendar not connected'],
          };
        }

        // Pull events from Google
        const events = await googleSync.pullEvents(userId, startDate, endDate);
        eventsSynced = events.length;

        // Store sync log
        await this.logSync(userId, source, 'pull', 'success', eventsSynced, [], Date.now() - startTime);

      } else if (source === 'highlevel') {
        if (!highlevelCalendarSync.isAvailable()) {
          return {
            source,
            success: true,
            eventsSynced: 0,
            errors: ['HighLevel not configured'],
          };
        }

        // Pull events from HighLevel
        const events = await highlevelCalendarSync.pullEvents(userId, startDate, endDate);
        eventsSynced = events.length;

        // Store sync log
        await this.logSync(userId, source, 'pull', 'success', eventsSynced, [], Date.now() - startTime);
      }

      // Update sync status to success
      await this.updateSyncStatus(userId, source, 'success', null, eventsSynced);

      return {
        source,
        success: true,
        eventsSynced,
        errors,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);

      // Update sync status to failed
      await this.updateSyncStatus(userId, source, 'failed', errorMessage, eventsSynced);

      // Store sync log
      await this.logSync(userId, source, 'sync', 'failed', eventsSynced, errors, Date.now() - startTime);

      return {
        source,
        success: false,
        eventsSynced,
        errors,
      };
    }
  }

  /**
   * Update sync status in database
   */
  private async updateSyncStatus(
    userId: string,
    source: CalendarSource,
    status: 'success' | 'failed' | 'in_progress',
    errorMessage: string | null,
    eventsSynced: number
  ): Promise<void> {
    try {
      // Check if status record exists
      const existing = await db
        .select()
        .from(calendarSyncStatus)
        .where(
          and(
            eq(calendarSyncStatus.userId, userId),
            eq(calendarSyncStatus.source, source)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing
        await db
          .update(calendarSyncStatus)
          .set({
            syncStatus: status,
            errorMessage,
            eventsSynced,
            lastSyncAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(calendarSyncStatus.id, existing[0].id));
      } else {
        // Create new
        await db.insert(calendarSyncStatus).values({
          id: nanoid(),
          userId,
          source,
          syncStatus: status,
          errorMessage,
          eventsSynced,
          lastSyncAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error updating sync status:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Log sync operation
   */
  private async logSync(
    userId: string | null,
    source: CalendarSource,
    operation: 'pull' | 'push' | 'sync' | 'aggregate',
    status: 'success' | 'failed' | 'partial',
    eventsProcessed: number,
    errors: string[],
    duration: number
  ): Promise<void> {
    try {
      await db.insert(calendarSyncLogs).values({
        id: nanoid(),
        userId,
        source,
        operation,
        status,
        eventsProcessed,
        errors: JSON.stringify(errors),
        duration,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error('Error logging sync operation:', error);
      // Don't throw - logging is non-critical
    }
  }

  /**
   * Start periodic sync job (should be called on server startup)
   */
  startPeriodicSync(intervalMinutes: number = 30): void {
    // Use node-cron if available, otherwise use setInterval
    try {
      const cron = require('node-cron');
      
      // Run every 30 minutes
      cron.schedule(`*/${intervalMinutes} * * * *`, async () => {
        console.log(`[Calendar Sync] Starting periodic sync at ${new Date().toISOString()}`);
        
        // Guard: db.execute is not available in SQLite (better-sqlite3)
        if (typeof (db as any).execute !== 'function') {
          console.warn('[Calendar Sync] db.execute not available; skipping sync (SQLite mode)');
          return;
        }

        // Get all users with connected calendars
        const usersWithCalendars = await db.execute(`
          SELECT DISTINCT user_id 
          FROM calendar_sync_credentials
          WHERE sync_enabled = 1
        `);

        // Handle both PostgreSQL (results.rows) and direct array results
        const rows = Array.isArray(usersWithCalendars) ? usersWithCalendars : (usersWithCalendars.rows || []);
        for (const row of rows as any[]) {
          try {
            await this.syncUserCalendars(row.user_id);
          } catch (error) {
            console.error(`Error syncing calendars for user ${row.user_id}:`, error);
          }
        }
      });

      console.log(`[Calendar Sync] Periodic sync scheduled every ${intervalMinutes} minutes`);
    } catch (error) {
      console.warn('node-cron not available, using setInterval for calendar sync');
      
      setInterval(async () => {
        console.log(`[Calendar Sync] Starting periodic sync at ${new Date().toISOString()}`);
        
        // Guard: db.execute is not available in SQLite (better-sqlite3)
        if (typeof (db as any).execute !== 'function') {
          console.warn('[Calendar Sync] db.execute not available; skipping sync (SQLite mode)');
          return;
        }

        // Get all users with connected calendars
        const usersWithCalendars = await db.execute(`
          SELECT DISTINCT user_id 
          FROM calendar_sync_credentials
          WHERE sync_enabled = 1
        `);

        // Handle both PostgreSQL (results.rows) and direct array results
        const rows = Array.isArray(usersWithCalendars) ? usersWithCalendars : (usersWithCalendars.rows || []);
        for (const row of rows as any[]) {
          try {
            await this.syncUserCalendars(row.user_id);
          } catch (error) {
            console.error(`Error syncing calendars for user ${row.user_id}:`, error);
          }
        }
      }, intervalMinutes * 60 * 1000);
    }
  }
}

export const calendarSyncScheduler = new CalendarSyncScheduler();
