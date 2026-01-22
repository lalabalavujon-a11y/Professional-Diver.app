import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const wreckStatusEnum = pgEnum("wreck_status", ["pending", "in-progress", "completed", "on-hold"]);
export const hullTypeEnum = pgEnum("hull_type", ["metal", "fiberglass"]);
export const vesselStatusEnum = pgEnum("vessel_status", ["scheduled", "in-progress", "completed", "cancelled"]);
export const crewRoleEnum = pgEnum("crew_role", ["diver", "barge-operator", "boat-operator", "supervisor"]);
export const projectStatusEnum = pgEnum("project_status", ["bid", "pending", "active", "completed", "cancelled"]);

// Salvage Wrecks - Primary table for 34 shipwrecks
export const salvageWrecks = pgTable("salvage_wrecks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  location: json("location").notNull(), // { lat: number, lng: number }
  hullType: hullTypeEnum("hull_type").notNull(),
  status: wreckStatusEnum("status").default("pending").notNull(),
  estimatedValue: integer("estimated_value"), // in cents
  actualCost: integer("actual_cost"), // in cents
  estimatedDuration: integer("estimated_duration"), // in days
  startDate: timestamp("start_date"),
  completionDate: timestamp("completion_date"),
  assignedCrewId: varchar("assigned_crew_id"), // Reference to crew member or team
  equipmentRequired: json("equipment_required").default([]), // Array of equipment IDs or names
  notes: text("notes"),
  photos: json("photos").default([]), // Array of photo URLs
  progressPercentage: integer("progress_percentage").default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Vessels - Foreign going vessels for hull cleaning
export const vessels = pgTable("vessels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  imoNumber: varchar("imo_number").unique(),
  vesselType: text("vessel_type"),
  arrivalDate: timestamp("arrival_date"),
  departureDate: timestamp("departure_date"),
  location: json("location"), // { lat: number, lng: number }
  hullCleaningStatus: vesselStatusEnum("hull_cleaning_status").default("scheduled").notNull(),
  assignedDivers: json("assigned_divers").default([]), // Array of crew member IDs
  clientName: text("client_name"),
  contactInfo: json("contact_info"), // { email, phone, etc }
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Crew Members - Operations team
export const crewMembers = pgTable("crew_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").unique(),
  role: crewRoleEnum("role").notNull(),
  qualifications: json("qualifications").default([]), // Array of qualification objects
  certifications: json("certifications").default([]), // Array of certification objects with expiry dates
  availability: boolean("availability").default(true).notNull(),
  assignedToWreckId: varchar("assigned_to_wreck_id").references(() => salvageWrecks.id),
  phoneNumber: text("phone_number"),
  emergencyContact: json("emergency_contact"), // { name, phone, relationship }
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects - Project and bid management
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  client: text("client").notNull(),
  value: integer("value").notNull(), // in cents
  currency: text("currency").default("USD").notNull(),
  status: projectStatusEnum("status").default("bid").notNull(),
  bidDate: timestamp("bid_date"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  documents: json("documents").default([]), // Array of document URLs/metadata
  complianceRecords: json("compliance_records").default([]), // Array of compliance documents
  description: text("description"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Salvage Operations - Operation logs and tracking
export const salvageOperations = pgTable("salvage_operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  wreckId: varchar("wreck_id").notNull().references(() => salvageWrecks.id, { onDelete: "cascade" }),
  operationType: text("operation_type").notNull(), // e.g., "survey", "dismantling", "removal"
  description: text("description").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  crewMembers: json("crew_members").default([]), // Array of crew member IDs
  equipmentUsed: json("equipment_used").default([]), // Array of equipment IDs or names
  weatherConditions: json("weather_conditions"), // { wind, waves, visibility, etc }
  progressPercentage: integer("progress_percentage").default(0), // 0-100
  notes: text("notes"),
  photos: json("photos").default([]), // Array of photo URLs
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const salvageWrecksRelations = relations(salvageWrecks, ({ many }) => ({
  operations: many(salvageOperations),
}));

export const salvageOperationsRelations = relations(salvageOperations, ({ one }) => ({
  wreck: one(salvageWrecks, {
    fields: [salvageOperations.wreckId],
    references: [salvageWrecks.id],
  }),
}));

// Insert schemas with Zod validation
export const insertSalvageWreckSchema = createInsertSchema(salvageWrecks, {
  name: z.string().min(1, "Name is required"),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  hullType: z.enum(["metal", "fiberglass"]),
  status: z.enum(["pending", "in-progress", "completed", "on-hold"]).optional(),
  estimatedValue: z.number().int().positive().optional(),
  actualCost: z.number().int().positive().optional(),
  estimatedDuration: z.number().int().positive().optional(),
  progressPercentage: z.number().int().min(0).max(100).optional(),
});

export const insertVesselSchema = createInsertSchema(vessels, {
  name: z.string().min(1, "Name is required"),
  imoNumber: z.string().optional(),
  hullCleaningStatus: z.enum(["scheduled", "in-progress", "completed", "cancelled"]).optional(),
});

export const insertCrewMemberSchema = createInsertSchema(crewMembers, {
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  role: z.enum(["diver", "barge-operator", "boat-operator", "supervisor"]),
  availability: z.boolean().optional(),
});

export const insertProjectSchema = createInsertSchema(projects, {
  name: z.string().min(1, "Name is required"),
  client: z.string().min(1, "Client is required"),
  value: z.number().int().positive(),
  currency: z.string().default("USD"),
  status: z.enum(["bid", "pending", "active", "completed", "cancelled"]).optional(),
});

export const insertSalvageOperationSchema = createInsertSchema(salvageOperations, {
  wreckId: z.string().min(1, "Wreck ID is required"),
  operationType: z.string().min(1, "Operation type is required"),
  description: z.string().min(1, "Description is required"),
  startTime: z.date(),
  progressPercentage: z.number().int().min(0).max(100).optional(),
});

// Type exports
export type SalvageWreck = typeof salvageWrecks.$inferSelect;
export type InsertSalvageWreck = typeof salvageWrecks.$inferInsert;
export type Vessel = typeof vessels.$inferSelect;
export type InsertVessel = typeof vessels.$inferInsert;
export type CrewMember = typeof crewMembers.$inferSelect;
export type InsertCrewMember = typeof crewMembers.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;
export type SalvageOperation = typeof salvageOperations.$inferSelect;
export type InsertSalvageOperation = typeof salvageOperations.$inferInsert;
