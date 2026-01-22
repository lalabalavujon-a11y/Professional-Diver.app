import { db } from "../db";
import { salvageWrecks, salvageOperations, crewMembers } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import type { InsertSalvageWreck, SalvageWreck } from "@shared/schema";

/**
 * Get all salvage wrecks with optional filters
 */
export async function getAllWrecks(filters?: {
  status?: string;
  hullType?: string;
}) {
  let query = db.select().from(salvageWrecks);

  const conditions = [];
  if (filters?.status) {
    conditions.push(eq(salvageWrecks.status, filters.status as any));
  }
  if (filters?.hullType) {
    conditions.push(eq(salvageWrecks.hullType, filters.hullType as any));
  }

  if (conditions.length > 0) {
    query = db.select().from(salvageWrecks).where(and(...conditions));
  }

  return query.orderBy(desc(salvageWrecks.createdAt));
}

/**
 * Get a single wreck by ID
 */
export async function getWreckById(id: string) {
  const [wreck] = await db
    .select()
    .from(salvageWrecks)
    .where(eq(salvageWrecks.id, id))
    .limit(1);

  if (!wreck) {
    return null;
  }

  // Get related operations
  const operations = await db
    .select()
    .from(salvageOperations)
    .where(eq(salvageOperations.wreckId, id))
    .orderBy(desc(salvageOperations.startTime));

  return {
    ...wreck,
    operations,
  };
}

/**
 * Create a new wreck
 */
export async function createWreck(data: InsertSalvageWreck) {
  const [wreck] = await db
    .insert(salvageWrecks)
    .values({
      ...data,
      updatedAt: new Date(),
    })
    .returning();

  return wreck;
}

/**
 * Update a wreck
 */
export async function updateWreck(id: string, data: Partial<InsertSalvageWreck>) {
  const [wreck] = await db
    .update(salvageWrecks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(salvageWrecks.id, id))
    .returning();

  return wreck;
}

/**
 * Delete a wreck (soft delete by setting status to on-hold)
 */
export async function deleteWreck(id: string) {
  const [wreck] = await db
    .update(salvageWrecks)
    .set({
      status: "on-hold" as any,
      updatedAt: new Date(),
    })
    .where(eq(salvageWrecks.id, id))
    .returning();

  return wreck;
}

/**
 * Get progress for a specific wreck
 */
export async function getWreckProgress(id: string) {
  const wreck = await getWreckById(id);
  if (!wreck) {
    return null;
  }

  // Calculate progress from operations
  const operations = await db
    .select()
    .from(salvageOperations)
    .where(eq(salvageOperations.wreckId, id));

  const totalProgress = operations.reduce((sum, op) => sum + (op.progressPercentage || 0), 0);
  const avgProgress = operations.length > 0 ? totalProgress / operations.length : 0;

  return {
    wreckProgress: wreck.progressPercentage || 0,
    operationsProgress: avgProgress,
    totalOperations: operations.length,
    completedOperations: operations.filter(op => op.progressPercentage === 100).length,
  };
}

/**
 * Assign crew to a wreck
 */
export async function assignCrewToWreck(wreckId: string, crewMemberIds: string[]) {
  // Verify crew members exist
  const crew = await db
    .select()
    .from(crewMembers)
    .where(sql`${crewMembers.id} IN ${sql`(${crewMemberIds.join(',')})`}`);

  if (crew.length !== crewMemberIds.length) {
    throw new Error("One or more crew members not found");
  }

  // Update wreck with assigned crew
  const [wreck] = await db
    .update(salvageWrecks)
    .set({
      assignedCrewId: crewMemberIds[0], // Primary crew member
      updatedAt: new Date(),
    })
    .where(eq(salvageWrecks.id, wreckId))
    .returning();

  return wreck;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  const allWrecks = await db.select().from(salvageWrecks);

  const stats = {
    total: allWrecks.length,
    pending: allWrecks.filter(w => w.status === "pending").length,
    inProgress: allWrecks.filter(w => w.status === "in-progress").length,
    completed: allWrecks.filter(w => w.status === "completed").length,
    onHold: allWrecks.filter(w => w.status === "on-hold").length,
    totalEstimatedValue: allWrecks.reduce((sum, w) => sum + (w.estimatedValue || 0), 0),
    totalActualCost: allWrecks.reduce((sum, w) => sum + (w.actualCost || 0), 0),
    averageProgress: allWrecks.length > 0
      ? allWrecks.reduce((sum, w) => sum + (w.progressPercentage || 0), 0) / allWrecks.length
      : 0,
  };

  return stats;
}

/**
 * Create a salvage operation
 */
export async function createSalvageOperation(wreckId: string, operationData: {
  operationType: string;
  description: string;
  startTime: Date;
  crewMembers?: string[];
  equipmentUsed?: string[];
  weatherConditions?: any;
  notes?: string;
}) {
  const [operation] = await db
    .insert(salvageOperations)
    .values({
      wreckId,
      ...operationData,
      crewMembers: operationData.crewMembers || [],
      equipmentUsed: operationData.equipmentUsed || [],
      updatedAt: new Date(),
    })
    .returning();

  return operation;
}
