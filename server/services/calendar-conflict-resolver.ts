/**
 * Calendar Conflict Detection and Resolution Engine
 * Detects and resolves conflicts between calendar events from different sources
 */

import { db } from "../db";
import { calendarConflicts } from "@shared/schema-sqlite";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { ConflictResolution } from "../lib/calendar-sync-manager";
import type { UnifiedCalendarEvent } from "./unified-calendar-service";

export type ConflictType = 'time_overlap' | 'duplicate' | 'resource';
export type ConflictSeverity = 'low' | 'medium' | 'high';

export interface CalendarConflict {
  id: string;
  type: ConflictType;
  events: UnifiedCalendarEvent[];
  severity: ConflictSeverity;
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: ConflictResolution;
  resolvedBy?: string;
}

export class CalendarConflictResolver {
  /**
   * Detect all conflicts in a set of events
   */
  async detectConflicts(events: UnifiedCalendarEvent[]): Promise<CalendarConflict[]> {
    const conflicts: CalendarConflict[] = [];

    // Detect time overlaps
    const timeOverlaps = this.detectTimeOverlaps(events);
    conflicts.push(...timeOverlaps);

    // Detect duplicates
    const duplicates = this.detectDuplicates(events);
    conflicts.push(...duplicates);

    // Detect resource conflicts (same location/time)
    const resourceConflicts = this.detectResourceConflicts(events);
    conflicts.push(...resourceConflicts);

    // Store conflicts in database
    for (const conflict of conflicts) {
      await this.storeConflict(conflict);
    }

    return conflicts;
  }

  /**
   * Detect time overlap conflicts
   */
  private detectTimeOverlaps(events: UnifiedCalendarEvent[]): CalendarConflict[] {
    const conflicts: CalendarConflict[] = [];
    const sortedEvents = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    for (let i = 0; i < sortedEvents.length; i++) {
      for (let j = i + 1; j < sortedEvents.length; j++) {
        const event1 = sortedEvents[i];
        const event2 = sortedEvents[j];

        // Check if events overlap
        if (this.eventsOverlap(event1, event2)) {
          // Skip if events are from the same source (not a conflict)
          if (event1.source === event2.source) {
            continue;
          }

          const severity = this.calculateOverlapSeverity(event1, event2);
          
          conflicts.push({
            id: nanoid(),
            type: 'time_overlap',
            events: [event1, event2],
            severity,
            detectedAt: new Date(),
          });
        }

        // If event2 starts after event1 ends, no need to check further
        if (event2.startTime.getTime() > event1.endTime.getTime()) {
          break;
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect duplicate events (same time + similar attendees/title)
   */
  private detectDuplicates(events: UnifiedCalendarEvent[]): CalendarConflict[] {
    const conflicts: CalendarConflict[] = [];
    const seen = new Map<string, UnifiedCalendarEvent[]>();

    for (const event of events) {
      // Create a key based on time window and primary attendee or title
      const timeKey = `${event.startTime.getTime()}-${event.endTime.getTime()}`;
      const attendeeKey = event.attendees?.[0]?.email || '';
      const titleKey = event.title.toLowerCase().substring(0, 50); // First 50 chars
      const key = `${timeKey}-${attendeeKey}-${titleKey}`;

      if (!seen.has(key)) {
        seen.set(key, [event]);
      } else {
        const existing = seen.get(key)!;
        
        // Check if this is truly a duplicate (same time, similar title/attendees, different source)
        const isDuplicate = existing.some((e) => {
          const timeMatch = Math.abs(e.startTime.getTime() - event.startTime.getTime()) < 5 * 60 * 1000; // 5 min
          const titleSimilarity = this.calculateStringSimilarity(e.title, event.title) > 0.8;
          const attendeeMatch = e.attendees?.[0]?.email === event.attendees?.[0]?.email;
          const differentSource = e.source !== event.source;

          return timeMatch && (titleSimilarity || attendeeMatch) && differentSource;
        });

        if (isDuplicate) {
          existing.push(event);
          conflicts.push({
            id: nanoid(),
            type: 'duplicate',
            events: [...existing],
            severity: 'medium',
            detectedAt: new Date(),
          });
        } else {
          existing.push(event);
        }
      }
    }

    return conflicts;
  }

  /**
   * Detect resource conflicts (same location at overlapping times)
   */
  private detectResourceConflicts(events: UnifiedCalendarEvent[]): CalendarConflict[] {
    const conflicts: CalendarConflict[] = [];
    const locationGroups = new Map<string, UnifiedCalendarEvent[]>();

    // Group events by location
    for (const event of events) {
      if (!event.location) continue;

      const location = event.location.toLowerCase().trim();
      if (!locationGroups.has(location)) {
        locationGroups.set(location, []);
      }
      locationGroups.get(location)!.push(event);
    }

    // Check for overlaps within each location group
    for (const [location, locationEvents] of locationGroups) {
      if (locationEvents.length < 2) continue;

      const sortedEvents = [...locationEvents].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      for (let i = 0; i < sortedEvents.length; i++) {
        for (let j = i + 1; j < sortedEvents.length; j++) {
          const event1 = sortedEvents[i];
          const event2 = sortedEvents[j];

          if (this.eventsOverlap(event1, event2)) {
            // Skip if same source
            if (event1.source === event2.source) continue;

            conflicts.push({
              id: nanoid(),
              type: 'resource',
              events: [event1, event2],
              severity: 'high', // Resource conflicts are typically high severity
              detectedAt: new Date(),
            });
          }

          // Early exit if no overlap possible
          if (event2.startTime.getTime() > event1.endTime.getTime()) {
            break;
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * Check if two events overlap in time
   */
  private eventsOverlap(event1: UnifiedCalendarEvent, event2: UnifiedCalendarEvent): boolean {
    return (
      event1.startTime < event2.endTime &&
      event2.startTime < event1.endTime
    );
  }

  /**
   * Calculate severity of time overlap
   */
  private calculateOverlapSeverity(event1: UnifiedCalendarEvent, event2: UnifiedCalendarEvent): ConflictSeverity {
    const overlapStart = new Date(Math.max(event1.startTime.getTime(), event2.startTime.getTime()));
    const overlapEnd = new Date(Math.min(event1.endTime.getTime(), event2.endTime.getTime()));
    const overlapDuration = overlapEnd.getTime() - overlapStart.getTime();
    
    const event1Duration = event1.endTime.getTime() - event1.startTime.getTime();
    const event2Duration = event2.endTime.getTime() - event2.startTime.getTime();
    const minDuration = Math.min(event1Duration, event2Duration);

    // Calculate overlap percentage
    const overlapPercentage = (overlapDuration / minDuration) * 100;

    if (overlapPercentage > 80) {
      return 'high'; // Almost complete overlap
    } else if (overlapPercentage > 50) {
      return 'medium'; // Significant overlap
    } else {
      return 'low'; // Minor overlap
    }
  }

  /**
   * Calculate string similarity (simple Jaccard similarity)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.toLowerCase().split(/\s+/));
    const words2 = new Set(str2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter((x) => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Store conflict in database
   */
  private async storeConflict(conflict: CalendarConflict): Promise<void> {
    try {
      await db.insert(calendarConflicts).values({
        id: conflict.id,
        type: conflict.type,
        severity: conflict.severity,
        eventIds: JSON.stringify(conflict.events.map((e) => e.id)),
        detectedAt: conflict.detectedAt,
        createdAt: conflict.detectedAt,
        updatedAt: conflict.detectedAt,
      });
    } catch (error) {
      console.error('Error storing conflict:', error);
      // Don't throw - conflicts can be detected again
    }
  }

  /**
   * Get unresolved conflicts
   */
  async getUnresolvedConflicts(userId?: string): Promise<CalendarConflict[]> {
    try {
      const results = await db
        .select()
        .from(calendarConflicts)
        .where(eq(calendarConflicts.resolvedAt, null as any))
        .orderBy(calendarConflicts.detectedAt);

      // Note: In a full implementation, we'd fetch the actual events from unified_calendar_events
      // For now, return conflicts with event IDs
      return results.map((row) => ({
        id: row.id,
        type: row.type as ConflictType,
        events: [], // Would be populated from event IDs
        severity: row.severity as ConflictSeverity,
        detectedAt: row.detectedAt,
        resolvedAt: row.resolvedAt || undefined,
        resolution: row.resolution as ConflictResolution | undefined,
        resolvedBy: row.resolvedBy || undefined,
      }));
    } catch (error) {
      console.error('Error fetching unresolved conflicts:', error);
      return [];
    }
  }

  /**
   * Resolve a conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    resolvedBy: string
  ): Promise<void> {
    try {
      await db
        .update(calendarConflicts)
        .set({
          resolution,
          resolvedBy,
          resolvedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(calendarConflicts.id, conflictId));
    } catch (error) {
      console.error('Error resolving conflict:', error);
      throw error;
    }
  }

  /**
   * Auto-resolve conflicts based on strategy
   */
  async autoResolveConflicts(
    conflicts: CalendarConflict[],
    strategy: ConflictResolution
  ): Promise<number> {
    let resolved = 0;

    for (const conflict of conflicts) {
      // Only auto-resolve low and medium severity conflicts
      if (conflict.severity === 'high') {
        continue; // Require manual resolution
      }

      try {
        await this.resolveConflict(conflict.id, strategy, 'system');
        resolved++;
      } catch (error) {
        console.error(`Error auto-resolving conflict ${conflict.id}:`, error);
      }
    }

    return resolved;
  }

  /**
   * Apply conflict resolution to events
   */
  applyResolution(
    conflict: CalendarConflict,
    resolution: ConflictResolution
  ): UnifiedCalendarEvent[] {
    if (conflict.events.length < 2) {
      return conflict.events;
    }

    const [event1, event2] = conflict.events;

    switch (resolution) {
      case ConflictResolution.LOCAL_WINS:
        // Keep internal events, remove external
        return conflict.events.filter((e) => e.source === 'internal');

      case ConflictResolution.REMOTE_WINS:
        // Keep external events, remove internal
        return conflict.events.filter((e) => e.source !== 'internal');

      case ConflictResolution.NEWEST_WINS:
        // Keep the most recently updated event
        const event1Updated = event1.metadata.lastSyncedAt || event1.startTime;
        const event2Updated = event2.metadata.lastSyncedAt || event2.startTime;
        return event1Updated > event2Updated ? [event1] : [event2];

      case ConflictResolution.MANUAL:
        // Return all events for manual review
        return conflict.events;

      default:
        return conflict.events;
    }
  }
}

export const calendarConflictResolver = new CalendarConflictResolver();
