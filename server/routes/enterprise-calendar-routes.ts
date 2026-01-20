/**
 * Enterprise Calendar Routes
 * API endpoints for Enterprise users to manage their calendar connections
 */

import { Express } from "express";
import { db } from "../db";
import { calendarSyncCredentials, users } from "@shared/schema-sqlite";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { unifiedCalendarService } from "../services/unified-calendar-service";
import { calendarConflictResolver } from "../services/calendar-conflict-resolver";
import { calendarProviderRegistry, registerBuiltInProviders } from "../lib/calendar-provider-registry";
import { GoogleCalendarSync } from "../lib/google-calendar-sync";
import { highlevelCalendarSync } from "../lib/highlevel-calendar-sync";
import { calendarSyncScheduler } from "../services/calendar-sync-scheduler";

/**
 * Get current user ID from request
 */
async function getUserId(req: any): Promise<string | null> {
  // Try to get from query params
  if (req.query.userId) {
    return req.query.userId as string;
  }
  
  // Try to get from headers
  const email = req.headers['x-user-email'] || req.query.email;
  if (email) {
    try {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email as string))
        .limit(1);
      
      if (user) {
        return user.id;
      }
      
      console.warn(`User not found for email: ${email}, using email as userId`);
      return email as string;
    } catch (error) {
      console.error("Error looking up user:", error);
      return email as string;
    }
  }
  
  return null;
}

/**
 * Check if user is Enterprise or Super Admin
 */
async function checkEnterpriseAccess(req: any): Promise<{ userId: string; isEnterprise: boolean } | null> {
  const userId = await getUserId(req);
  if (!userId) {
    return null;
  }

  try {
    const [user] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return null;
    }

    const isEnterprise = user.role === 'ENTERPRISE' || user.role === 'SUPER_ADMIN';
    return { userId, isEnterprise };
  } catch (error) {
    console.error("Error checking user access:", error);
    return null;
  }
}

/**
 * Register Enterprise calendar routes
 */
export function registerEnterpriseCalendarRoutes(app: Express): void {
  // Initialize provider registry on first route access
  let providersInitialized = false;
  const initProviders = async () => {
    if (!providersInitialized) {
      await registerBuiltInProviders();
      providersInitialized = true;
    }
  };

  /**
   * List user's calendar connections
   * GET /api/enterprise/calendar/connections
   */
  app.get("/api/enterprise/calendar/connections", async (req, res) => {
    try {
      const access = await checkEnterpriseAccess(req);
      if (!access || !access.isEnterprise) {
        return res.status(403).json({ error: "Enterprise access required" });
      }

      const connections = await db
        .select()
        .from(calendarSyncCredentials)
        .where(eq(calendarSyncCredentials.userId, access.userId))
        .orderBy(calendarSyncCredentials.createdAt);

      res.json({
        connections: connections.map(conn => ({
          id: conn.id,
          provider: conn.provider,
          connectionName: conn.connectionName,
          calendarId: conn.calendarId,
          isActive: conn.isActive,
          syncEnabled: conn.syncEnabled,
          syncDirection: conn.syncDirection,
          lastSyncAt: conn.lastSyncAt,
          createdAt: conn.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching calendar connections:", error);
      res.status(500).json({ error: "Failed to fetch connections" });
    }
  });

  /**
   * Add new calendar connection
   * POST /api/enterprise/calendar/connections
   */
  app.post("/api/enterprise/calendar/connections", async (req, res) => {
    try {
      const access = await checkEnterpriseAccess(req);
      if (!access || !access.isEnterprise) {
        return res.status(403).json({ error: "Enterprise access required" });
      }

      const { provider, connectionName, calendarId, providerConfig, syncDirection } = req.body;

      if (!provider) {
        return res.status(400).json({ error: "Provider is required" });
      }

      await initProviders();

      // Validate provider
      if (!calendarProviderRegistry.has(provider)) {
        return res.status(400).json({ error: `Provider ${provider} is not supported` });
      }

      // Validate configuration
      const validation = calendarProviderRegistry.validateProviderConfig(provider, providerConfig || {});
      if (!validation.valid) {
        return res.status(400).json({ error: "Invalid configuration", errors: validation.errors });
      }

      // Handle OAuth providers (Google, Outlook)
      if (provider === 'google') {
        const googleSync = new GoogleCalendarSync();
        const authUrl = await googleSync.authenticate(access.userId);
        return res.json({ authUrl, requiresOAuth: true });
      }

      // For non-OAuth providers, store credentials directly
      const connectionId = nanoid();
      await db.insert(calendarSyncCredentials).values({
        id: connectionId,
        userId: access.userId,
        provider,
        connectionName: connectionName || `${provider} Calendar`,
        calendarId: calendarId || null,
        providerConfig: providerConfig ? JSON.stringify(providerConfig) : null,
        refreshToken: null, // Will be set after OAuth for OAuth providers
        syncEnabled: true,
        syncDirection: syncDirection || 'bidirectional',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      res.json({
        success: true,
        connection: {
          id: connectionId,
          provider,
          connectionName: connectionName || `${provider} Calendar`,
        },
      });
    } catch (error) {
      console.error("Error creating calendar connection:", error);
      res.status(500).json({ error: "Failed to create connection" });
    }
  });

  /**
   * Update calendar connection
   * PUT /api/enterprise/calendar/connections/:id
   */
  app.put("/api/enterprise/calendar/connections/:id", async (req, res) => {
    try {
      const access = await checkEnterpriseAccess(req);
      if (!access || !access.isEnterprise) {
        return res.status(403).json({ error: "Enterprise access required" });
      }

      const { id } = req.params;
      const { connectionName, calendarId, providerConfig, isActive, syncEnabled, syncDirection } = req.body;

      // Verify connection belongs to user
      const [existing] = await db
        .select()
        .from(calendarSyncCredentials)
        .where(
          and(
            eq(calendarSyncCredentials.id, id),
            eq(calendarSyncCredentials.userId, access.userId)
          )
        )
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: "Connection not found" });
      }

      // Update connection
      await db
        .update(calendarSyncCredentials)
        .set({
          connectionName: connectionName !== undefined ? connectionName : existing.connectionName,
          calendarId: calendarId !== undefined ? calendarId : existing.calendarId,
          providerConfig: providerConfig ? JSON.stringify(providerConfig) : existing.providerConfig,
          isActive: isActive !== undefined ? isActive : existing.isActive,
          syncEnabled: syncEnabled !== undefined ? syncEnabled : existing.syncEnabled,
          syncDirection: syncDirection || existing.syncDirection,
          updatedAt: new Date(),
        })
        .where(eq(calendarSyncCredentials.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating calendar connection:", error);
      res.status(500).json({ error: "Failed to update connection" });
    }
  });

  /**
   * Delete calendar connection
   * DELETE /api/enterprise/calendar/connections/:id
   */
  app.delete("/api/enterprise/calendar/connections/:id", async (req, res) => {
    try {
      const access = await checkEnterpriseAccess(req);
      if (!access || !access.isEnterprise) {
        return res.status(403).json({ error: "Enterprise access required" });
      }

      const { id } = req.params;

      // Verify connection belongs to user
      const [existing] = await db
        .select()
        .from(calendarSyncCredentials)
        .where(
          and(
            eq(calendarSyncCredentials.id, id),
            eq(calendarSyncCredentials.userId, access.userId)
          )
        )
        .limit(1);

      if (!existing) {
        return res.status(404).json({ error: "Connection not found" });
      }

      // Disconnect provider if needed
      if (existing.provider === 'google') {
        const googleSync = new GoogleCalendarSync();
        await googleSync.disconnect(access.userId);
      }

      // Delete connection
      await db
        .delete(calendarSyncCredentials)
        .where(eq(calendarSyncCredentials.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting calendar connection:", error);
      res.status(500).json({ error: "Failed to delete connection" });
    }
  });

  /**
   * Test calendar connection
   * POST /api/enterprise/calendar/connections/:id/test
   */
  app.post("/api/enterprise/calendar/connections/:id/test", async (req, res) => {
    try {
      const access = await checkEnterpriseAccess(req);
      if (!access || !access.isEnterprise) {
        return res.status(403).json({ error: "Enterprise access required" });
      }

      const { id } = req.params;

      // Get connection
      const [connection] = await db
        .select()
        .from(calendarSyncCredentials)
        .where(
          and(
            eq(calendarSyncCredentials.id, id),
            eq(calendarSyncCredentials.userId, access.userId)
          )
        )
        .limit(1);

      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }

      // Test connection based on provider
      let testResult = { success: false, message: '' };

      if (connection.provider === 'google') {
        try {
          const googleSync = new GoogleCalendarSync();
          const startDate = new Date();
          const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          await googleSync.pullEvents(access.userId, startDate, endDate);
          testResult = { success: true, message: 'Connection successful' };
        } catch (error) {
          testResult = { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
        }
      } else if (connection.provider === 'highlevel') {
        try {
          const config = connection.providerConfig
            ? (typeof connection.providerConfig === 'string' ? JSON.parse(connection.providerConfig) : connection.providerConfig)
            : {};
          
          if (!config.apiKey || !config.locationId) {
            testResult = { success: false, message: 'API Key and Location ID required' };
          } else {
            // Test by fetching calendars
            await highlevelCalendarSync.getCalendars(access.userId);
            testResult = { success: true, message: 'Connection successful' };
          }
        } catch (error) {
          testResult = { success: false, message: error instanceof Error ? error.message : 'Connection failed' };
        }
      } else {
        testResult = { success: false, message: 'Provider not yet supported for testing' };
      }

      res.json(testResult);
    } catch (error) {
      console.error("Error testing calendar connection:", error);
      res.status(500).json({ error: "Failed to test connection" });
    }
  });

  /**
   * Get unified calendar view for Enterprise user
   * GET /api/enterprise/calendar/unified
   */
  app.get("/api/enterprise/calendar/unified", async (req, res) => {
    try {
      const access = await checkEnterpriseAccess(req);
      if (!access || !access.isEnterprise) {
        return res.status(403).json({ error: "Enterprise access required" });
      }

      const startDate = req.query.startDate 
        ? new Date(req.query.startDate as string)
        : new Date();
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const sources = req.query.sources
        ? (req.query.sources as string).split(',') as any[]
        : undefined;

      const events = await unifiedCalendarService.aggregateEvents({
        startDate,
        endDate,
        userId: access.userId,
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
   * Trigger manual sync
   * POST /api/enterprise/calendar/sync
   */
  app.post("/api/enterprise/calendar/sync", async (req, res) => {
    try {
      const access = await checkEnterpriseAccess(req);
      if (!access || !access.isEnterprise) {
        return res.status(403).json({ error: "Enterprise access required" });
      }

      const { source } = req.body; // Optional: sync specific source

      const result = await calendarSyncScheduler.syncUserCalendars(access.userId, source);

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
   * Get setup instructions for a provider
   * GET /api/enterprise/calendar/instructions/:provider
   */
  app.get("/api/enterprise/calendar/instructions/:provider", async (req, res) => {
    try {
      const access = await checkEnterpriseAccess(req);
      if (!access || !access.isEnterprise) {
        return res.status(403).json({ error: "Enterprise access required" });
      }

      const { provider } = req.params;

      await initProviders();

      const providerConfig = calendarProviderRegistry.getProviderConfig(provider as any);
      if (!providerConfig) {
        return res.status(404).json({ error: "Provider not found" });
      }

      // Get detailed instructions
      const { getProviderInstructions } = await import('../data/calendar-setup-instructions');
      const instructions = getProviderInstructions(provider as any);

      res.json({
        provider: providerConfig,
        instructions,
      });
    } catch (error) {
      console.error("Error fetching instructions:", error);
      res.status(500).json({ error: "Failed to fetch instructions" });
    }
  });

  /**
   * Get available calendar providers
   * GET /api/enterprise/calendar/providers
   */
  app.get("/api/enterprise/calendar/providers", async (req, res) => {
    try {
      const access = await checkEnterpriseAccess(req);
      if (!access || !access.isEnterprise) {
        return res.status(403).json({ error: "Enterprise access required" });
      }

      await initProviders();

      const providers = calendarProviderRegistry.getAll().map(p => p.getConfig());

      res.json({ providers });
    } catch (error) {
      console.error("Error fetching providers:", error);
      res.status(500).json({ error: "Failed to fetch providers" });
    }
  });
}
