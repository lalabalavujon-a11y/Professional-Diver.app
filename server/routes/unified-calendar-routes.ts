/**
 * Unified Calendar Routes
 * API endpoints for Super Admin unified calendar view
 */

import { Express } from "express";
import { unifiedCalendarService } from "../services/unified-calendar-service";
import { calendarConflictResolver } from "../services/calendar-conflict-resolver";
import { ConflictResolution } from "../lib/calendar-sync-manager";
import { db } from "../db";
import { calendarSyncStatus, calendarSyncLogs, calendarConflicts, users } from "@shared/schema-sqlite";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * Get current user ID from request
 */
async function getUserId(req: any): Promise<string | null> {
  // Try to get from query params (for shared calendars)
  if (req.query.userId) {
    return req.query.userId as string;
  }
  
  // Try to get from headers (for authenticated requests)
  const email = req.headers['x-user-email'] || req.query.email;
  if (email) {
    try {
      // Look up user by email
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email as string))
        .limit(1);
      
      if (user) {
        return user.id;
      }
      
      // If user not found, use email as fallback (for development)
      console.warn(`User not found for email: ${email}, using email as userId`);
      return email as string;
    } catch (error) {
      console.error("Error looking up user:", error);
      // Fallback to email for development
      return email as string;
    }
  }
  
  return null;
}

/**
 * Register unified calendar routes
 */
export function registerUnifiedCalendarRoutes(app: Express): void {
  /**
   * Get unified calendar view
   * GET /api/admin/calendar/unified
   */
  app.get("/api/admin/calendar/unified", async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date();
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default: 30 days ahead

      const sources = req.query.sources
        ? (req.query.sources as string).split(',') as any[]
        : undefined;

      const events = await unifiedCalendarService.aggregateEvents({
        startDate,
        endDate,
        userId,
        sources,
      });

      // Detect conflicts
      const conflicts = await calendarConflictResolver.detectConflicts(events);

      res.json({
        events,
        conflicts: conflicts.length,
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error fetching unified calendar:", error);
      res.status(500).json({ error: "Failed to fetch unified calendar" });
    }
  });

  /**
   * List all events with filters
   * GET /api/admin/calendar/events
   */
  app.get("/api/admin/calendar/events", async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date();
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const source = req.query.source as string | undefined;
      const sources = source ? [source] : undefined;

      const events = await unifiedCalendarService.aggregateEvents({
        startDate,
        endDate,
        userId,
        sources,
      });

      res.json({ events });
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  /**
   * Get detected conflicts
   * GET /api/admin/calendar/conflicts
   */
  app.get("/api/admin/calendar/conflicts", async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const unresolved = req.query.resolved === 'false';
      
      let conflicts;
      if (unresolved) {
        conflicts = await calendarConflictResolver.getUnresolvedConflicts(userId);
      } else {
        const allConflicts = await db
          .select()
          .from(calendarConflicts)
          .orderBy(calendarConflicts.detectedAt);
        conflicts = allConflicts.map((row) => ({
          id: row.id,
          type: row.type,
          severity: row.severity,
          eventIds: typeof row.eventIds === 'string' ? JSON.parse(row.eventIds) : row.eventIds,
          detectedAt: row.detectedAt,
          resolvedAt: row.resolvedAt || undefined,
          resolution: row.resolution || undefined,
          resolvedBy: row.resolvedBy || undefined,
        }));
      }

      res.json({ conflicts });
    } catch (error) {
      console.error("Error fetching conflicts:", error);
      res.status(500).json({ error: "Failed to fetch conflicts" });
    }
  });

  /**
   * Resolve a conflict
   * POST /api/admin/calendar/conflicts/:id/resolve
   */
  app.post("/api/admin/calendar/conflicts/:id/resolve", async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { id } = req.params;
      const { resolution } = req.body;

      if (!resolution || !Object.values(ConflictResolution).includes(resolution)) {
        return res.status(400).json({ error: "Invalid resolution strategy" });
      }

      await calendarConflictResolver.resolveConflict(id, resolution, userId);

      res.json({ success: true, message: "Conflict resolved" });
    } catch (error) {
      console.error("Error resolving conflict:", error);
      res.status(500).json({ error: "Failed to resolve conflict" });
    }
  });

  /**
   * Trigger manual sync
   * POST /api/admin/calendar/sync
   */
  app.post("/api/admin/calendar/sync", async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { source } = req.body; // Optional: sync specific source

      // Import sync scheduler
      const { calendarSyncScheduler } = await import("../services/calendar-sync-scheduler");
      
      const result = await calendarSyncScheduler.syncUserCalendars(userId, source);

      res.json({
        success: true,
        result,
      });
    } catch (error) {
      console.error("Error triggering sync:", error);
      res.status(500).json({ error: "Failed to trigger sync" });
    }
  });

  /**
   * Get calendar analytics
   * GET /api/admin/calendar/analytics
   */
  app.get("/api/admin/calendar/analytics", async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const events = await unifiedCalendarService.aggregateEvents({
        startDate,
        endDate,
        userId,
      });

      // Calculate analytics
      const eventsBySource = events.reduce((acc, event) => {
        acc[event.source] = (acc[event.source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get sync status
      const syncStatuses = await db
        .select()
        .from(calendarSyncStatus)
        .where(eq(calendarSyncStatus.userId, userId));

      // Get conflict counts
      const conflictCounts = await db.execute(`
        SELECT 
          severity,
          COUNT(*) as count
        FROM calendar_conflicts
        WHERE detected_at >= $1 AND detected_at <= $2
        GROUP BY severity
      `, [startDate.toISOString(), endDate.toISOString()]);

      // Get sync logs for success rate
      const syncLogs = await db
        .select()
        .from(calendarSyncLogs)
        .where(
          and(
            gte(calendarSyncLogs.createdAt, startDate),
            lte(calendarSyncLogs.createdAt, endDate)
          )
        );

      const successCount = syncLogs.filter(log => log.status === 'success').length;
      const totalSyncs = syncLogs.length;
      const successRate = totalSyncs > 0 ? (successCount / totalSyncs) * 100 : 0;

      res.json({
        eventsBySource,
        totalEvents: events.length,
        syncStatuses: syncStatuses.map(s => ({
          source: s.source,
          lastSyncAt: s.lastSyncAt,
          syncStatus: s.syncStatus,
          eventsSynced: s.eventsSynced,
        })),
        conflicts: {
          total: conflictCounts.rows.reduce((sum: number, row: any) => sum + parseInt(row.count), 0),
          bySeverity: conflictCounts.rows.reduce((acc: any, row: any) => {
            acc[row.severity] = parseInt(row.count);
            return acc;
          }, {}),
        },
        syncMetrics: {
          successRate,
          totalSyncs,
          successfulSyncs: successCount,
        },
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        },
      });
    } catch (error) {
      console.error("Error fetching calendar analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  /**
   * Get agent status
   * GET /api/admin/calendar/agents/status
   */
  app.get("/api/admin/calendar/agents/status", async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Import agent orchestrator
      const { calendarAgentOrchestrator } = await import("../agents/calendar-agent-orchestrator");
      
      const status = await calendarAgentOrchestrator.getStatus();

      res.json(status);
    } catch (error) {
      console.error("Error fetching agent status:", error);
      res.status(500).json({ error: "Failed to fetch agent status" });
    }
  });
}
