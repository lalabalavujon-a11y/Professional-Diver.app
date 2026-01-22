import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// SQLite version of schema for development
// Note: SQLite doesn't support enums, so we use text with constraints

export const salvageWrecks = sqliteTable("salvage_wrecks", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  location: text("location", { mode: "json" }).notNull(), // { lat: number, lng: number }
  hullType: text("hull_type", { enum: ["metal", "fiberglass"] }).notNull(),
  status: text("status", { enum: ["pending", "in-progress", "completed", "on-hold"] }).default("pending").notNull(),
  estimatedValue: integer("estimated_value"), // in cents
  actualCost: integer("actual_cost"), // in cents
  estimatedDuration: integer("estimated_duration"), // in days
  startDate: integer("start_date", { mode: "timestamp" }),
  completionDate: integer("completion_date", { mode: "timestamp" }),
  assignedCrewId: text("assigned_crew_id"),
  equipmentRequired: text("equipment_required", { mode: "json" }).default("[]"),
  notes: text("notes"),
  photos: text("photos", { mode: "json" }).default("[]"),
  progressPercentage: integer("progress_percentage").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const vessels = sqliteTable("vessels", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  imoNumber: text("imo_number").unique(),
  vesselType: text("vessel_type"),
  arrivalDate: integer("arrival_date", { mode: "timestamp" }),
  departureDate: integer("departure_date", { mode: "timestamp" }),
  location: text("location", { mode: "json" }),
  hullCleaningStatus: text("hull_cleaning_status", { enum: ["scheduled", "in-progress", "completed", "cancelled"] }).default("scheduled").notNull(),
  assignedDivers: text("assigned_divers", { mode: "json" }).default("[]"),
  clientName: text("client_name"),
  contactInfo: text("contact_info", { mode: "json" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const crewMembers = sqliteTable("crew_members", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").unique(),
  role: text("role", { enum: ["diver", "barge-operator", "boat-operator", "supervisor"] }).notNull(),
  qualifications: text("qualifications", { mode: "json" }).default("[]"),
  certifications: text("certifications", { mode: "json" }).default("[]"),
  availability: integer("availability", { mode: "boolean" }).default(true).notNull(),
  assignedToWreckId: text("assigned_to_wreck_id"),
  phoneNumber: text("phone_number"),
  emergencyContact: text("emergency_contact", { mode: "json" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  client: text("client").notNull(),
  value: integer("value").notNull(),
  currency: text("currency").default("USD").notNull(),
  status: text("status", { enum: ["bid", "pending", "active", "completed", "cancelled"] }).default("bid").notNull(),
  bidDate: integer("bid_date", { mode: "timestamp" }),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  documents: text("documents", { mode: "json" }).default("[]"),
  complianceRecords: text("compliance_records", { mode: "json" }).default("[]"),
  description: text("description"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const salvageOperations = sqliteTable("salvage_operations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  wreckId: text("wreck_id").notNull().references(() => salvageWrecks.id, { onDelete: "cascade" }),
  operationType: text("operation_type").notNull(),
  description: text("description").notNull(),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }),
  crewMembers: text("crew_members", { mode: "json" }).default("[]"),
  equipmentUsed: text("equipment_used", { mode: "json" }).default("[]"),
  weatherConditions: text("weather_conditions", { mode: "json" }),
  progressPercentage: integer("progress_percentage").default(0),
  notes: text("notes"),
  photos: text("photos", { mode: "json" }).default("[]"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
