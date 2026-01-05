import { Express } from "express";
import { db } from "../db";
import { 
  equipmentTypes,
  equipmentItems,
  maintenanceSchedules,
  maintenanceTasks,
  maintenanceLogs,
  equipmentUseLogs,
  type InsertEquipmentType,
  type InsertEquipmentItem,
  type InsertMaintenanceSchedule,
  type InsertMaintenanceTask,
  type InsertMaintenanceLog,
  type InsertEquipmentUseLog,
} from "@shared/schema-sqlite";
import { eq, and, or, desc, asc, gte, lte, sql } from "drizzle-orm";
import { z } from "zod";

export function registerEquipmentRoutes(app: Express): void {
  // Equipment Types Routes
  app.get("/api/equipment/types", async (_req, res) => {
    try {
      const types = await db.select().from(equipmentTypes).orderBy(equipmentTypes.name);
      res.json(types);
    } catch (error) {
      console.error("Error fetching equipment types:", error);
      res.status(500).json({ error: "Failed to fetch equipment types" });
    }
  });

  app.post("/api/equipment/types", async (req, res) => {
    try {
      const input = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        defaultMaintenanceInterval: z.string().optional(),
      });

      const parsed = input.parse(req.body);
      const [type] = await db
        .insert(equipmentTypes)
        .values({
          name: parsed.name,
          description: parsed.description ?? null,
          defaultMaintenanceInterval: parsed.defaultMaintenanceInterval ?? null,
        })
        .returning();

      res.status(201).json(type);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating equipment type:", error);
      res.status(500).json({ error: "Failed to create equipment type" });
    }
  });

  // Equipment Items Routes
  app.get("/api/equipment/items", async (req, res) => {
    try {
      const { typeId, status } = req.query;
      let query = db.select().from(equipmentItems).orderBy(equipmentItems.name);

      if (typeId) {
        query = db
          .select()
          .from(equipmentItems)
          .where(eq(equipmentItems.equipmentTypeId, typeId as string))
          .orderBy(equipmentItems.name);
      }

      if (status) {
        const conditions = [eq(equipmentItems.status, status as string)];
        if (typeId) {
          conditions.push(eq(equipmentItems.equipmentTypeId, typeId as string));
        }
        query = db
          .select()
          .from(equipmentItems)
          .where(and(...conditions))
          .orderBy(equipmentItems.name);
      }

      const items = await query;
      
      // Fetch equipment types for each item
      const itemsWithTypes = await Promise.all(
        items.map(async (item) => {
          const [type] = await db
            .select()
            .from(equipmentTypes)
            .where(eq(equipmentTypes.id, item.equipmentTypeId));
          return { ...item, equipmentType: type };
        })
      );

      res.json(itemsWithTypes);
    } catch (error) {
      console.error("Error fetching equipment items:", error);
      res.status(500).json({ error: "Failed to fetch equipment items" });
    }
  });

  app.get("/api/equipment/items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [item] = await db
        .select()
        .from(equipmentItems)
        .where(eq(equipmentItems.id, id));

      if (!item) {
        return res.status(404).json({ error: "Equipment item not found" });
      }

      const [type] = await db
        .select()
        .from(equipmentTypes)
        .where(eq(equipmentTypes.id, item.equipmentTypeId));

      // Fetch related data
      const tasks = await db
        .select()
        .from(maintenanceTasks)
        .where(eq(maintenanceTasks.equipmentItemId, id))
        .orderBy(desc(maintenanceTasks.scheduledDate));

      const useLogs = await db
        .select()
        .from(equipmentUseLogs)
        .where(eq(equipmentUseLogs.equipmentItemId, id))
        .orderBy(desc(equipmentUseLogs.logDate))
        .limit(50);

      res.json({
        ...item,
        equipmentType: type,
        maintenanceTasks: tasks,
        useLogs,
      });
    } catch (error) {
      console.error("Error fetching equipment item:", error);
      res.status(500).json({ error: "Failed to fetch equipment item" });
    }
  });

  app.post("/api/equipment/items", async (req, res) => {
    try {
      const input = z.object({
        equipmentTypeId: z.string().min(1),
        name: z.string().min(1),
        serialNumber: z.string().optional(),
        manufacturer: z.string().optional(),
        model: z.string().optional(),
        purchaseDate: z.string().optional(),
        status: z.enum(["OPERATIONAL", "MAINTENANCE", "RETIRED", "RESERVED", "DECOMMISSIONED"]).optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      });

      const parsed = input.parse(req.body);
      const [item] = await db
        .insert(equipmentItems)
        .values({
          equipmentTypeId: parsed.equipmentTypeId,
          name: parsed.name,
          serialNumber: parsed.serialNumber ?? null,
          manufacturer: parsed.manufacturer ?? null,
          model: parsed.model ?? null,
          purchaseDate: parsed.purchaseDate ? new Date(parsed.purchaseDate) : null,
          status: parsed.status ?? "OPERATIONAL",
          location: parsed.location ?? null,
          notes: parsed.notes ?? null,
        })
        .returning();

      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating equipment item:", error);
      res.status(500).json({ error: "Failed to create equipment item" });
    }
  });

  app.post("/api/equipment/items/bulk", async (req, res) => {
    try {
      const input = z.object({
        items: z.array(
          z.object({
            equipmentTypeId: z.string().min(1),
            name: z.string().min(1),
            serialNumber: z.string().optional(),
            manufacturer: z.string().optional(),
            model: z.string().optional(),
            purchaseDate: z.string().optional(),
            status: z.enum(["OPERATIONAL", "MAINTENANCE", "RETIRED", "RESERVED", "DECOMMISSIONED"]).optional(),
            location: z.string().optional(),
            notes: z.string().optional(),
          })
        ),
      });

      const parsed = input.parse(req.body);
      const created: any[] = [];
      const errors: any[] = [];

      for (const item of parsed.items) {
        try {
          const [createdItem] = await db
            .insert(equipmentItems)
            .values({
              equipmentTypeId: item.equipmentTypeId,
              name: item.name,
              serialNumber: item.serialNumber ?? null,
              manufacturer: item.manufacturer ?? null,
              model: item.model ?? null,
              purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : null,
              status: item.status ?? "OPERATIONAL",
              location: item.location ?? null,
              notes: item.notes ?? null,
            })
            .returning();
          created.push(createdItem);
        } catch (error: any) {
          errors.push({ item, error: error.message });
        }
      }

      res.status(201).json({
        created: created.length,
        errors: errors.length,
        items: created,
        errorDetails: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error bulk creating equipment items:", error);
      res.status(500).json({ error: "Failed to bulk create equipment items" });
    }
  });

  app.put("/api/equipment/items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const input = z.object({
        equipmentTypeId: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        serialNumber: z.string().optional(),
        manufacturer: z.string().optional(),
        model: z.string().optional(),
        purchaseDate: z.string().optional(),
        status: z.enum(["OPERATIONAL", "MAINTENANCE", "RETIRED", "RESERVED", "DECOMMISSIONED"]).optional(),
        location: z.string().optional(),
        notes: z.string().optional(),
      });

      const parsed = input.parse(req.body);
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (parsed.equipmentTypeId) updateData.equipmentTypeId = parsed.equipmentTypeId;
      if (parsed.name) updateData.name = parsed.name;
      if (parsed.serialNumber !== undefined) updateData.serialNumber = parsed.serialNumber ?? null;
      if (parsed.manufacturer !== undefined) updateData.manufacturer = parsed.manufacturer ?? null;
      if (parsed.model !== undefined) updateData.model = parsed.model ?? null;
      if (parsed.purchaseDate !== undefined) {
        updateData.purchaseDate = parsed.purchaseDate ? new Date(parsed.purchaseDate) : null;
      }
      if (parsed.status) updateData.status = parsed.status;
      if (parsed.location !== undefined) updateData.location = parsed.location ?? null;
      if (parsed.notes !== undefined) updateData.notes = parsed.notes ?? null;

      const [item] = await db
        .update(equipmentItems)
        .set(updateData)
        .where(eq(equipmentItems.id, id))
        .returning();

      if (!item) {
        return res.status(404).json({ error: "Equipment item not found" });
      }

      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating equipment item:", error);
      res.status(500).json({ error: "Failed to update equipment item" });
    }
  });

  // Maintenance Schedules Routes
  app.get("/api/equipment/schedules", async (req, res) => {
    try {
      const { typeId } = req.query;
      let query = db.select().from(maintenanceSchedules).orderBy(maintenanceSchedules.name);

      if (typeId) {
        query = db
          .select()
          .from(maintenanceSchedules)
          .where(eq(maintenanceSchedules.equipmentTypeId, typeId as string))
          .orderBy(maintenanceSchedules.name);
      }

      const schedules = await query;
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching maintenance schedules:", error);
      res.status(500).json({ error: "Failed to fetch maintenance schedules" });
    }
  });

  app.post("/api/equipment/schedules", async (req, res) => {
    try {
      const input = z.object({
        equipmentTypeId: z.string().min(1),
        name: z.string().min(1),
        intervalType: z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "HOURS", "CUSTOM"]),
        intervalValue: z.number().int().positive().optional(),
        checklist: z.string().optional(),
      });

      const parsed = input.parse(req.body);
      const [schedule] = await db
        .insert(maintenanceSchedules)
        .values({
          equipmentTypeId: parsed.equipmentTypeId,
          name: parsed.name,
          intervalType: parsed.intervalType,
          intervalValue: parsed.intervalValue ?? null,
          checklist: parsed.checklist ?? null,
        })
        .returning();

      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating maintenance schedule:", error);
      res.status(500).json({ error: "Failed to create maintenance schedule" });
    }
  });

  // Maintenance Tasks Routes
  app.get("/api/equipment/tasks", async (req, res) => {
    try {
      const { status, itemId, upcoming } = req.query;
      let query = db.select().from(maintenanceTasks).orderBy(asc(maintenanceTasks.scheduledDate));

      const conditions = [];
      if (status) {
        conditions.push(eq(maintenanceTasks.status, status as string));
      }
      if (itemId) {
        conditions.push(eq(maintenanceTasks.equipmentItemId, itemId as string));
      }
      if (upcoming === "true") {
        const today = new Date();
        conditions.push(gte(maintenanceTasks.scheduledDate, today));
      }

      if (conditions.length > 0) {
        query = db
          .select()
          .from(maintenanceTasks)
          .where(and(...conditions))
          .orderBy(asc(maintenanceTasks.scheduledDate));
      }

      const tasks = await query;
      
      // Fetch related equipment items
      const tasksWithEquipment = await Promise.all(
        tasks.map(async (task) => {
          const [item] = await db
            .select()
            .from(equipmentItems)
            .where(eq(equipmentItems.id, task.equipmentItemId));
          return { ...task, equipmentItem: item };
        })
      );

      res.json(tasksWithEquipment);
    } catch (error) {
      console.error("Error fetching maintenance tasks:", error);
      res.status(500).json({ error: "Failed to fetch maintenance tasks" });
    }
  });

  app.post("/api/equipment/tasks", async (req, res) => {
    try {
      const input = z.object({
        equipmentItemId: z.string().min(1),
        maintenanceScheduleId: z.string().min(1),
        scheduledDate: z.string(),
        assignedTo: z.string().optional(),
        notes: z.string().optional(),
      });

      const parsed = input.parse(req.body);
      const [task] = await db
        .insert(maintenanceTasks)
        .values({
          equipmentItemId: parsed.equipmentItemId,
          maintenanceScheduleId: parsed.maintenanceScheduleId,
          scheduledDate: new Date(parsed.scheduledDate),
          status: "SCHEDULED",
          assignedTo: parsed.assignedTo ?? null,
          notes: parsed.notes ?? null,
        })
        .returning();

      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating maintenance task:", error);
      res.status(500).json({ error: "Failed to create maintenance task" });
    }
  });

  app.post("/api/equipment/tasks/:id/complete", async (req, res) => {
    try {
      const { id } = req.params;
      const input = z.object({
        checklistResults: z.string().optional(),
        notes: z.string().optional(),
        partsReplaced: z.string().optional(),
        performedBy: z.string().min(1),
      });

      const parsed = input.parse(req.body);
      const completedDate = new Date();

      // Update task status
      const [task] = await db
        .update(maintenanceTasks)
        .set({
          status: "COMPLETED",
          completedDate,
          updatedAt: new Date(),
        })
        .where(eq(maintenanceTasks.id, id))
        .returning();

      if (!task) {
        return res.status(404).json({ error: "Maintenance task not found" });
      }

      // Create maintenance log
      const [log] = await db
        .insert(maintenanceLogs)
        .values({
          maintenanceTaskId: id,
          equipmentItemId: task.equipmentItemId,
          performedBy: parsed.performedBy,
          performedDate: completedDate,
          checklistResults: parsed.checklistResults ?? null,
          notes: parsed.notes ?? null,
          partsReplaced: parsed.partsReplaced ?? null,
        })
        .returning();

      res.json({ task, log });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error completing maintenance task:", error);
      res.status(500).json({ error: "Failed to complete maintenance task" });
    }
  });

  // Equipment Use Logs Routes
  app.get("/api/equipment/use-logs", async (req, res) => {
    try {
      const { itemId, useType } = req.query;
      let query = db.select().from(equipmentUseLogs).orderBy(desc(equipmentUseLogs.logDate));

      const conditions = [];
      if (itemId) {
        conditions.push(eq(equipmentUseLogs.equipmentItemId, itemId as string));
      }
      if (useType) {
        conditions.push(eq(equipmentUseLogs.useType, useType as string));
      }

      if (conditions.length > 0) {
        query = db
          .select()
          .from(equipmentUseLogs)
          .where(and(...conditions))
          .orderBy(desc(equipmentUseLogs.logDate));
      }

      const logs = await query;
      res.json(logs);
    } catch (error) {
      console.error("Error fetching use logs:", error);
      res.status(500).json({ error: "Failed to fetch use logs" });
    }
  });

  app.post("/api/equipment/use-logs", async (req, res) => {
    try {
      const input = z.object({
        equipmentItemId: z.string().min(1),
        useType: z.enum(["BEFORE_USE", "AFTER_USE"]),
        logDate: z.string(),
        performedBy: z.string().min(1),
        condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "POOR"]),
        defects: z.string().optional(),
        notes: z.string().optional(),
        hoursUsed: z.number().optional(),
        location: z.string().optional(),
      });

      const parsed = input.parse(req.body);
      const [log] = await db
        .insert(equipmentUseLogs)
        .values({
          equipmentItemId: parsed.equipmentItemId,
          useType: parsed.useType,
          logDate: new Date(parsed.logDate),
          performedBy: parsed.performedBy,
          condition: parsed.condition,
          defects: parsed.defects ?? null,
          notes: parsed.notes ?? null,
          hoursUsed: parsed.hoursUsed ?? null,
          location: parsed.location ?? null,
        })
        .returning();

      res.status(201).json(log);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating use log:", error);
      res.status(500).json({ error: "Failed to create use log" });
    }
  });

  // Upcoming Maintenance Dashboard Route
  app.get("/api/equipment/upcoming-maintenance", async (req, res) => {
    try {
      const { days = 30 } = req.query;
      const daysNum = parseInt(days as string, 10);
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + daysNum);

      const tasks = await db
        .select()
        .from(maintenanceTasks)
        .where(
          and(
            or(
              eq(maintenanceTasks.status, "SCHEDULED"),
              eq(maintenanceTasks.status, "IN_PROGRESS"),
              eq(maintenanceTasks.status, "OVERDUE")
            ),
            gte(maintenanceTasks.scheduledDate, today),
            lte(maintenanceTasks.scheduledDate, futureDate)
          )
        )
        .orderBy(asc(maintenanceTasks.scheduledDate));

      // Fetch overdue tasks
      const overdueTasks = await db
        .select()
        .from(maintenanceTasks)
        .where(
          and(
            or(
              eq(maintenanceTasks.status, "SCHEDULED"),
              eq(maintenanceTasks.status, "IN_PROGRESS")
            ),
            lte(maintenanceTasks.scheduledDate, today)
          )
        )
        .orderBy(asc(maintenanceTasks.scheduledDate));

      // Fetch equipment items for tasks
      const tasksWithEquipment = await Promise.all(
        [...tasks, ...overdueTasks].map(async (task) => {
          const [item] = await db
            .select()
            .from(equipmentItems)
            .where(eq(equipmentItems.id, task.equipmentItemId));
          return { ...task, equipmentItem: item };
        })
      );

      res.json({
        upcoming: tasksWithEquipment.filter((t) => tasks.some((task) => task.id === t.id)),
        overdue: tasksWithEquipment.filter((t) => overdueTasks.some((task) => task.id === t.id)),
      });
    } catch (error) {
      console.error("Error fetching upcoming maintenance:", error);
      res.status(500).json({ error: "Failed to fetch upcoming maintenance" });
    }
  });
}
