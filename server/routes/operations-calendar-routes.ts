import { Express } from "express";
import { db } from "../db";
import { 
  operationsCalendar,
  calendarShareLinks,
  users,
  type InsertOperationsCalendar,
  type InsertCalendarShareLink,
} from "@shared/schema-sqlite";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { generateICalFromOperations } from "../lib/ical-generator";
import { parseICalFile } from "../lib/ical-parser";
import multer from "multer";

/**
 * Ensure operations calendar tables exist
 * This is needed for SQLite development
 */
async function ensureOperationsCalendarTables(): Promise<void> {
  try {
    // Use db.execute like SRS routes do
    await db.execute(`
      CREATE TABLE IF NOT EXISTS operations_calendar (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        title text NOT NULL,
        description text,
        operation_date integer NOT NULL,
        start_time text,
        end_time text,
        location text,
        type text NOT NULL DEFAULT 'DIVE',
        status text NOT NULL DEFAULT 'SCHEDULED',
        color text DEFAULT '#8b5cf6',
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS calendar_share_links (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        share_token text NOT NULL UNIQUE,
        is_public integer NOT NULL DEFAULT 0,
        expires_at integer,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // Create indexes for better performance
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_operations_calendar_user_id ON operations_calendar(user_id)
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_operations_calendar_operation_date ON operations_calendar(operation_date)
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_calendar_share_links_user_id ON calendar_share_links(user_id)
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_calendar_share_links_share_token ON calendar_share_links(share_token)
    `);
    
    // Calendar Sync Credentials Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS calendar_sync_credentials (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        provider text NOT NULL,
        refresh_token text NOT NULL,
        sync_enabled integer NOT NULL DEFAULT 1,
        last_sync_at integer,
        sync_direction text NOT NULL DEFAULT 'bidirectional',
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    
    // External Calendar Event Mapping Table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS external_calendar_events (
        id text PRIMARY KEY NOT NULL,
        operation_id text,
        external_event_id text NOT NULL,
        provider text NOT NULL,
        synced_at integer NOT NULL,
        FOREIGN KEY (operation_id) REFERENCES operations_calendar(id) ON DELETE CASCADE
      )
    `);
    
    // Create indexes for sync tables
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_calendar_sync_credentials_user_id ON calendar_sync_credentials(user_id)
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_external_calendar_events_operation_id ON external_calendar_events(operation_id)
    `);
    
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_external_calendar_events_external_id ON external_calendar_events(external_event_id)
    `);
    
    console.log("✅ Operations calendar tables ensured");
  } catch (error) {
    console.error("Error ensuring operations calendar tables:", error);
    // Don't throw - tables might already exist or be managed by migrations
  }
}

/**
 * Get current user ID from request
 * Looks up user by email and returns their ID
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

export function registerOperationsCalendarRoutes(app: Express): void {
  console.log("🔧 Registering Operations Calendar routes...");
  
  // Ensure tables exist (for SQLite development)
  ensureOperationsCalendarTables().catch(console.error);
  
  // Test endpoint to verify routes are registered
  app.get("/api/operations-calendar/test", (_req, res) => {
    res.json({ message: "Operations Calendar routes are working!" });
  });
  
  // Operations Calendar Routes
  
  // Get all operations for a user (or shared calendar)
  app.get("/api/operations-calendar", async (req, res) => {
    console.log("📅 GET /api/operations-calendar called", { 
      query: req.query, 
      email: req.query.email || req.headers['x-user-email'],
      path: req.path 
    });
    try {
      const userId = await getUserId(req);
      console.log("📅 User ID resolved:", userId);
      const { shareToken, startDate, endDate } = req.query;
      
      let query = db.select().from(operationsCalendar);
      
      // If share token is provided, get operations from that user's calendar
      if (shareToken) {
        const [shareLink] = await db
          .select()
          .from(calendarShareLinks)
          .where(eq(calendarShareLinks.shareToken, shareToken as string));
        
        if (!shareLink) {
          return res.status(404).json({ error: "Share link not found" });
        }
        
        // Check if share link is expired
        if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
          return res.status(410).json({ error: "Share link has expired" });
        }
        
        query = query.where(eq(operationsCalendar.userId, shareLink.userId));
      } else if (userId) {
        query = query.where(eq(operationsCalendar.userId, userId));
      } else {
        console.log("📅 No userId found, returning 401");
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Filter by date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        query = query.where(
          and(
            gte(operationsCalendar.operationDate, start),
            lte(operationsCalendar.operationDate, end)
          )
        );
      }
      
      const operations = await query.orderBy(desc(operationsCalendar.operationDate));
      console.log("📅 Returning operations:", operations.length);
      res.json(operations);
    } catch (error) {
      console.error("❌ Error fetching operations:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ 
        error: "Failed to fetch operations",
        message: errorMessage
      });
    }
  });
  
  console.log("✅ Operations Calendar routes registered at /api/operations-calendar");
  
  // Get a single operation
  app.get("/api/operations-calendar/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = await getUserId(req);
      
      const [operation] = await db
        .select()
        .from(operationsCalendar)
        .where(eq(operationsCalendar.id, id));
      
      if (!operation) {
        return res.status(404).json({ error: "Operation not found" });
      }
      
      // Check if user has access (owner or via share link)
      if (operation.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(operation);
    } catch (error) {
      console.error("Error fetching operation:", error);
      res.status(500).json({ error: "Failed to fetch operation" });
    }
  });
  
  // Create a new operation
  app.post("/api/operations-calendar", async (req, res) => {
    try {
      console.log("Creating operation, request body:", req.body);
      const userId = await getUserId(req);
      console.log("User ID:", userId);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const input = z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        operationDate: z.union([z.string(), z.date(), z.coerce.date()]),
        startTime: z.string().optional().nullable(),
        endTime: z.string().optional().nullable(),
        location: z.string().optional().nullable(),
        type: z.enum(["DIVE", "INSPECTION", "MAINTENANCE", "TRAINING", "OTHER"]).optional(),
        status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
        color: z.string().optional(),
      });
      
      let parsed;
      try {
        parsed = input.parse(req.body);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.error("Validation error:", validationError.errors);
          return res.status(400).json({ 
            error: "Invalid data", 
            details: validationError.errors,
            received: req.body
          });
        }
        throw validationError;
      }
      
      // Convert date string to Date object if needed
      let operationDate: Date;
      if (parsed.operationDate instanceof Date) {
        operationDate = parsed.operationDate;
      } else if (typeof parsed.operationDate === 'string') {
        operationDate = new Date(parsed.operationDate);
        // Check if date is valid
        if (isNaN(operationDate.getTime())) {
          return res.status(400).json({ error: "Invalid date format", received: parsed.operationDate });
        }
      } else {
        return res.status(400).json({ error: "Invalid date format", received: parsed.operationDate });
      }
      
      console.log("Inserting operation with data:", {
        userId,
        title: parsed.title,
        operationDate: operationDate.toISOString(),
        type: parsed.type ?? "DIVE",
      });
      
      try {
        const [operation] = await db
          .insert(operationsCalendar)
          .values({
            userId,
            title: parsed.title,
            description: parsed.description ?? null,
            operationDate,
            startTime: parsed.startTime ?? null,
            endTime: parsed.endTime ?? null,
            location: parsed.location ?? null,
            type: parsed.type ?? "DIVE",
            status: parsed.status ?? "SCHEDULED",
            color: parsed.color ?? "#8b5cf6",
          })
          .returning();
        
        console.log("Operation created successfully:", operation);
        res.status(201).json(operation);
      } catch (dbError) {
        console.error("Database insert error:", dbError);
        throw dbError;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating operation:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ 
        error: "Failed to create operation",
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      });
    }
  });
  
  // Update an operation
  app.put("/api/operations-calendar/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Check if operation exists and user owns it
      const [existing] = await db
        .select()
        .from(operationsCalendar)
        .where(eq(operationsCalendar.id, id));
      
      if (!existing) {
        return res.status(404).json({ error: "Operation not found" });
      }
      
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const input = z.object({
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        operationDate: z.string().or(z.date()).optional(),
        startTime: z.string().optional(),
        endTime: z.string().optional(),
        location: z.string().optional(),
        type: z.enum(["DIVE", "INSPECTION", "MAINTENANCE", "TRAINING", "OTHER"]).optional(),
        status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
        color: z.string().optional(),
      });
      
      const parsed = input.parse(req.body);
      
      const updateData: any = {
        updatedAt: new Date(),
      };
      
      if (parsed.title !== undefined) updateData.title = parsed.title;
      if (parsed.description !== undefined) updateData.description = parsed.description ?? null;
      if (parsed.operationDate !== undefined) {
        updateData.operationDate = parsed.operationDate instanceof Date 
          ? parsed.operationDate 
          : new Date(parsed.operationDate);
      }
      if (parsed.startTime !== undefined) updateData.startTime = parsed.startTime ?? null;
      if (parsed.endTime !== undefined) updateData.endTime = parsed.endTime ?? null;
      if (parsed.location !== undefined) updateData.location = parsed.location ?? null;
      if (parsed.type !== undefined) updateData.type = parsed.type;
      if (parsed.status !== undefined) updateData.status = parsed.status;
      if (parsed.color !== undefined) updateData.color = parsed.color;
      
      const [updated] = await db
        .update(operationsCalendar)
        .set(updateData)
        .where(eq(operationsCalendar.id, id))
        .returning();
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating operation:", error);
      res.status(500).json({ error: "Failed to update operation" });
    }
  });
  
  // Delete an operation
  app.delete("/api/operations-calendar/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Check if operation exists and user owns it
      const [existing] = await db
        .select()
        .from(operationsCalendar)
        .where(eq(operationsCalendar.id, id));
      
      if (!existing) {
        return res.status(404).json({ error: "Operation not found" });
      }
      
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await db
        .delete(operationsCalendar)
        .where(eq(operationsCalendar.id, id));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting operation:", error);
      res.status(500).json({ error: "Failed to delete operation" });
    }
  });
  
  // Share Links Routes
  
  // Get share links for a user
  app.get("/api/operations-calendar/share-links", async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const shareLinks = await db
        .select()
        .from(calendarShareLinks)
        .where(eq(calendarShareLinks.userId, userId))
        .orderBy(desc(calendarShareLinks.createdAt));
      
      res.json(shareLinks);
    } catch (error) {
      console.error("Error fetching share links:", error);
      res.status(500).json({ error: "Failed to fetch share links" });
    }
  });
  
  // Create a new share link
  app.post("/api/operations-calendar/share-links", async (req, res) => {
    try {
      console.log("Creating share link, request body:", req.body);
      const userId = await getUserId(req);
      console.log("User ID for share link:", userId);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const input = z.object({
        isPublic: z.boolean().optional(),
        expiresAt: z.string().or(z.date()).optional(),
      });
      
      const parsed = input.parse(req.body);
      
      // Generate unique share token
      const shareToken = nanoid(32);
      
      console.log("Inserting share link with data:", {
        userId,
        shareToken,
        isPublic: parsed.isPublic ?? false,
      });
      
      try {
        const [shareLink] = await db
          .insert(calendarShareLinks)
          .values({
            userId,
            shareToken,
            isPublic: parsed.isPublic ?? false,
            expiresAt: parsed.expiresAt 
              ? (parsed.expiresAt instanceof Date ? parsed.expiresAt : new Date(parsed.expiresAt))
              : null,
          })
          .returning();
        
        console.log("Share link created successfully:", shareLink);
        res.status(201).json(shareLink);
      } catch (dbError) {
        console.error("Database insert error for share link:", dbError);
        throw dbError;
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating share link:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ 
        error: "Failed to create share link",
        message: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      });
    }
  });
  
  // Delete a share link
  app.delete("/api/operations-calendar/share-links/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // Check if share link exists and user owns it
      const [existing] = await db
        .select()
        .from(calendarShareLinks)
        .where(eq(calendarShareLinks.id, id));
      
      if (!existing) {
        return res.status(404).json({ error: "Share link not found" });
      }
      
      if (existing.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await db
        .delete(calendarShareLinks)
        .where(eq(calendarShareLinks.id, id));
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting share link:", error);
      res.status(500).json({ error: "Failed to delete share link" });
    }
  });
  
  // Get embed code for a share link
  app.get("/api/operations-calendar/share-links/:id/embed", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      const [shareLink] = await db
        .select()
        .from(calendarShareLinks)
        .where(eq(calendarShareLinks.id, id));
      
      if (!shareLink) {
        return res.status(404).json({ error: "Share link not found" });
      }
      
      if (shareLink.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const baseUrl = req.protocol + "://" + req.get("host");
      const shareUrl = `${baseUrl}/operations-calendar/shared/${shareLink.shareToken}`;
      const embedCode = `<iframe src="${shareUrl}" width="100%" height="600" frameborder="0" style="border: 1px solid #e5e7eb; border-radius: 8px;"></iframe>`;
      
      res.json({
        shareUrl,
        embedCode,
        shareToken: shareLink.shareToken,
      });
    } catch (error) {
      console.error("Error generating embed code:", error);
      res.status(500).json({ error: "Failed to generate embed code" });
    }
  });

  // iCal Export endpoint
  app.get("/api/operations-calendar/export/ical", async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { startDate, endDate } = req.query;
      
      let query = db.select().from(operationsCalendar).where(eq(operationsCalendar.userId, userId));
      
      // Filter by date range if provided
      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        query = query.where(
          and(
            gte(operationsCalendar.operationDate, start),
            lte(operationsCalendar.operationDate, end)
          )
        );
      }
      
      const operations = await query.orderBy(desc(operationsCalendar.operationDate));
      
      // Generate iCal content
      const email = req.headers['x-user-email'] || req.query.email || '';
      const calendarName = `Operations Calendar${email ? ` - ${email}` : ''}`;
      const icalContent = generateICalFromOperations(operations as any[], calendarName, 'UTC');
      
      // Set response headers for file download
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="operations-calendar.ics"`);
      res.send(icalContent);
    } catch (error) {
      console.error("Error exporting iCal:", error);
      res.status(500).json({ error: "Failed to export calendar" });
    }
  });

  // iCal Import endpoint
  const upload = multer({ storage: multer.memoryStorage() });
  
  app.post("/api/operations-calendar/import/ical", upload.single('file'), async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Parse the iCal file
      const icalContent = req.file.buffer.toString('utf-8');
      const parsedEvents = parseICalFile(icalContent);

      // Convert parsed events to operations and insert them
      const insertedOperations = [];
      for (const event of parsedEvents) {
        // Format date for database
        const operationDate = event.startDate;
        
        // Extract time if not all-day
        let startTime: string | null = null;
        let endTime: string | null = null;
        if (!event.allDay) {
          startTime = `${event.startDate.getHours().toString().padStart(2, '0')}:${event.startDate.getMinutes().toString().padStart(2, '0')}`;
          endTime = `${event.endDate.getHours().toString().padStart(2, '0')}:${event.endDate.getMinutes().toString().padStart(2, '0')}`;
        }

        try {
          const [operation] = await db
            .insert(operationsCalendar)
            .values({
              userId,
              title: event.title,
              description: event.description || null,
              operationDate,
              startTime,
              endTime,
              location: event.location || null,
              type: event.type,
              status: 'SCHEDULED',
              color: '#8b5cf6',
            })
            .returning();
          
          insertedOperations.push(operation);
        } catch (insertError) {
          console.error(`Error inserting operation ${event.title}:`, insertError);
          // Continue with other operations even if one fails
        }
      }

      res.json({
        success: true,
        imported: insertedOperations.length,
        total: parsedEvents.length,
        operations: insertedOperations,
      });
    } catch (error) {
      console.error("Error importing iCal:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ 
        error: "Failed to import calendar",
        message: errorMessage
      });
    }
  });

  // Calendar Sync Routes
  
  // Get sync status
  app.get("/api/operations-calendar/sync/status", async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // TODO: Fetch sync credentials from database
      // For now, return empty status
      res.json({
        google: { connected: false },
        outlook: { connected: false },
        apple: { connected: false },
      });
    } catch (error) {
      console.error("Error fetching sync status:", error);
      res.status(500).json({ error: "Failed to fetch sync status" });
    }
  });

  // Google Calendar OAuth initiation
  app.get("/api/operations-calendar/google/auth", async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // TODO: Implement Google OAuth flow
      res.status(501).json({ error: "Google Calendar sync not yet implemented. Please use iCal export/import." });
    } catch (error) {
      console.error("Error initiating Google auth:", error);
      res.status(500).json({ error: "Failed to initiate Google authentication" });
    }
  });

  // Outlook Calendar OAuth initiation
  app.get("/api/operations-calendar/outlook/auth", async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // TODO: Implement Outlook OAuth flow
      res.status(501).json({ error: "Outlook Calendar sync not yet implemented. Please use iCal export/import." });
    } catch (error) {
      console.error("Error initiating Outlook auth:", error);
      res.status(500).json({ error: "Failed to initiate Outlook authentication" });
    }
  });

  // Apple Calendar connection
  app.post("/api/operations-calendar/apple/connect", async (req, res) => {
    try {
      const userId = await getUserId(req);
      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }
      
      // TODO: Implement Apple CalDAV connection
      res.status(501).json({ error: "Apple Calendar sync not yet implemented. Please use iCal export/import." });
    } catch (error) {
      console.error("Error connecting Apple calendar:", error);
      res.status(500).json({ error: "Failed to connect Apple calendar" });
    }
  });
}

