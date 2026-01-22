import { Express } from "express";
import { db } from "../db";
import { salvageWrecks, salvageOperations } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { z } from "zod";
import {
  getAllWrecks,
  getWreckById,
  createWreck,
  updateWreck,
  deleteWreck,
  getWreckProgress,
  assignCrewToWreck,
  getDashboardStats,
  createSalvageOperation,
} from "../services/salvage-service";

/**
 * Register salvage operation routes
 */
export function registerSalvageRoutes(app: Express): void {
  // Get all wrecks with optional filters
  app.get("/api/salvage/wrecks", async (req, res) => {
    try {
      const { status, hullType } = req.query;
      const filters: any = {};
      if (status) filters.status = status;
      if (hullType) filters.hullType = hullType;

      const wrecks = await getAllWrecks(filters);
      res.json(wrecks);
    } catch (error) {
      console.error("Error fetching wrecks:", error);
      res.status(500).json({ error: "Failed to fetch wrecks" });
    }
  });

  // Get specific wreck by ID
  app.get("/api/salvage/wrecks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const wreck = await getWreckById(id);

      if (!wreck) {
        return res.status(404).json({ error: "Wreck not found" });
      }

      res.json(wreck);
    } catch (error) {
      console.error("Error fetching wreck:", error);
      res.status(500).json({ error: "Failed to fetch wreck" });
    }
  });

  // Create new wreck
  app.post("/api/salvage/wrecks", async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        location: z.object({
          lat: z.number(),
          lng: z.number(),
        }),
        hullType: z.enum(["metal", "fiberglass"]),
        status: z.enum(["pending", "in-progress", "completed", "on-hold"]).optional(),
        estimatedValue: z.number().int().positive().optional(),
        actualCost: z.number().int().positive().optional(),
        estimatedDuration: z.number().int().positive().optional(),
        equipmentRequired: z.array(z.string()).optional(),
        notes: z.string().optional(),
        photos: z.array(z.string()).optional(),
        progressPercentage: z.number().int().min(0).max(100).optional(),
      });

      const parsed = schema.parse(req.body);
      const wreck = await createWreck(parsed);

      res.status(201).json(wreck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating wreck:", error);
      res.status(500).json({ error: "Failed to create wreck" });
    }
  });

  // Update wreck
  app.put("/api/salvage/wrecks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const schema = z.object({
        name: z.string().min(1).optional(),
        location: z.object({
          lat: z.number(),
          lng: z.number(),
        }).optional(),
        hullType: z.enum(["metal", "fiberglass"]).optional(),
        status: z.enum(["pending", "in-progress", "completed", "on-hold"]).optional(),
        estimatedValue: z.number().int().positive().optional(),
        actualCost: z.number().int().positive().optional(),
        estimatedDuration: z.number().int().positive().optional(),
        assignedCrewId: z.string().optional(),
        equipmentRequired: z.array(z.string()).optional(),
        notes: z.string().optional(),
        photos: z.array(z.string()).optional(),
        progressPercentage: z.number().int().min(0).max(100).optional(),
        startDate: z.string().datetime().optional(),
        completionDate: z.string().datetime().optional(),
      });

      const parsed = schema.parse(req.body);
      
      // Convert date strings to Date objects if present
      if (parsed.startDate) {
        parsed.startDate = new Date(parsed.startDate) as any;
      }
      if (parsed.completionDate) {
        parsed.completionDate = new Date(parsed.completionDate) as any;
      }

      const wreck = await updateWreck(id, parsed);

      if (!wreck) {
        return res.status(404).json({ error: "Wreck not found" });
      }

      res.json(wreck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating wreck:", error);
      res.status(500).json({ error: "Failed to update wreck" });
    }
  });

  // Delete wreck (soft delete)
  app.delete("/api/salvage/wrecks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const wreck = await deleteWreck(id);

      if (!wreck) {
        return res.status(404).json({ error: "Wreck not found" });
      }

      res.json({ message: "Wreck deleted successfully", wreck });
    } catch (error) {
      console.error("Error deleting wreck:", error);
      res.status(500).json({ error: "Failed to delete wreck" });
    }
  });

  // Get wreck progress
  app.get("/api/salvage/wrecks/:id/progress", async (req, res) => {
    try {
      const { id } = req.params;
      const progress = await getWreckProgress(id);

      if (!progress) {
        return res.status(404).json({ error: "Wreck not found" });
      }

      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // Assign crew to wreck
  app.post("/api/salvage/wrecks/:id/assign-crew", async (req, res) => {
    try {
      const { id } = req.params;
      const schema = z.object({
        crewMemberIds: z.array(z.string()).min(1),
      });

      const { crewMemberIds } = schema.parse(req.body);
      const wreck = await assignCrewToWreck(id, crewMemberIds);

      res.json(wreck);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error assigning crew:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to assign crew" });
    }
  });

  // Get dashboard statistics
  app.get("/api/salvage/stats", async (req, res) => {
    try {
      const stats = await getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Create salvage operation
  app.post("/api/salvage/wrecks/:id/operations", async (req, res) => {
    try {
      const { id } = req.params;
      const schema = z.object({
        operationType: z.string().min(1),
        description: z.string().min(1),
        startTime: z.string().datetime(),
        endTime: z.string().datetime().optional(),
        crewMembers: z.array(z.string()).optional(),
        equipmentUsed: z.array(z.string()).optional(),
        weatherConditions: z.any().optional(),
        progressPercentage: z.number().int().min(0).max(100).optional(),
        notes: z.string().optional(),
        photos: z.array(z.string()).optional(),
      });

      const parsed = schema.parse(req.body);
      const operation = await createSalvageOperation(id, {
        ...parsed,
        startTime: new Date(parsed.startTime),
        endTime: parsed.endTime ? new Date(parsed.endTime) : undefined,
      });

      res.status(201).json(operation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating operation:", error);
      res.status(500).json({ error: "Failed to create operation" });
    }
  });

  // Get operations for a wreck
  app.get("/api/salvage/wrecks/:id/operations", async (req, res) => {
    try {
      const { id } = req.params;
      const operations = await db
        .select()
        .from(salvageOperations)
        .where(eq(salvageOperations.wreckId, id))
        .orderBy(desc(salvageOperations.startTime));

      res.json(operations);
    } catch (error) {
      console.error("Error fetching operations:", error);
      res.status(500).json({ error: "Failed to fetch operations" });
    }
  });
}
