/**
 * Super Admin Calendar Setup Routes
 * API endpoints for Super Admins to manage their calendar connections
 */

import { Express } from "express";
import { db } from "../db";
import { calendarSyncCredentials, users } from "@shared/schema-sqlite";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import { GoogleCalendarSync } from "../lib/google-calendar-sync";
import { calendarProviderRegistry, registerBuiltInProviders } from "../lib/calendar-provider-registry";

/**
 * Get current user ID from request
 */
async function getUserId(req: any): Promise<string | null> {
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
      
      return email as string;
    } catch (error) {
      console.error("Error looking up user:", error);
      return email as string;
    }
  }
  
  return null;
}

/**
 * Check if user is Super Admin
 */
async function checkSuperAdminAccess(req: any): Promise<{ userId: string } | null> {
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

    if (!user || user.role !== 'SUPER_ADMIN') {
      return null;
    }

    return { userId };
  } catch (error) {
    console.error("Error checking user access:", error);
    return null;
  }
}

/**
 * Register Super Admin calendar setup routes
 */
export function registerAdminCalendarSetupRoutes(app: Express): void {
  // Initialize provider registry on first route access
  let providersInitialized = false;
  const initProviders = async () => {
    if (!providersInitialized) {
      await registerBuiltInProviders();
      providersInitialized = true;
    }
  };

  /**
   * List Super Admin's calendar connections
   * GET /api/admin/calendar/setup/connections
   */
  app.get("/api/admin/calendar/setup/connections", async (req, res) => {
    try {
      const access = await checkSuperAdminAccess(req);
      if (!access) {
        return res.status(403).json({ error: "Super Admin access required" });
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
   * Add new calendar connection for Super Admin
   * POST /api/admin/calendar/setup/connections
   */
  app.post("/api/admin/calendar/setup/connections", async (req, res) => {
    try {
      const access = await checkSuperAdminAccess(req);
      if (!access) {
        return res.status(403).json({ error: "Super Admin access required" });
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
        refreshToken: null,
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
   * PUT /api/admin/calendar/setup/connections/:id
   */
  app.put("/api/admin/calendar/setup/connections/:id", async (req, res) => {
    try {
      const access = await checkSuperAdminAccess(req);
      if (!access) {
        return res.status(403).json({ error: "Super Admin access required" });
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
   * DELETE /api/admin/calendar/setup/connections/:id
   */
  app.delete("/api/admin/calendar/setup/connections/:id", async (req, res) => {
    try {
      const access = await checkSuperAdminAccess(req);
      if (!access) {
        return res.status(403).json({ error: "Super Admin access required" });
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
   * POST /api/admin/calendar/setup/connections/:id/test
   */
  app.post("/api/admin/calendar/setup/connections/:id/test", async (req, res) => {
    try {
      const access = await checkSuperAdminAccess(req);
      if (!access) {
        return res.status(403).json({ error: "Super Admin access required" });
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
          const { highlevelCalendarSync } = await import('../lib/highlevel-calendar-sync');
          const config = connection.providerConfig
            ? (typeof connection.providerConfig === 'string' ? JSON.parse(connection.providerConfig) : connection.providerConfig)
            : {};
          
          if (!config.apiKey || !config.locationId) {
            testResult = { success: false, message: 'API Key and Location ID required' };
          } else {
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
}
