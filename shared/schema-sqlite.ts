import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

// Helper function to generate UUIDs for SQLite
const generateId = () => nanoid();

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(generateId),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role", { enum: ["USER", "ADMIN", "SUPER_ADMIN", "LIFETIME", "AFFILIATE", "ENTERPRISE"] }).default("USER").notNull(),
  subscriptionType: text("subscription_type", { enum: ["TRIAL", "MONTHLY", "ANNUAL", "LIFETIME"] }).default("TRIAL").notNull(),
  subscriptionTier: text("subscription_tier", { enum: ["DIVER", "COMPANY", "SERVICE_PROVIDER"] }), // New: DIVER, COMPANY, SERVICE_PROVIDER
  entityType: text("entity_type", { enum: ["INDIVIDUAL", "COMPANY", "SERVICE_PROVIDER"] }).default("INDIVIDUAL").notNull(), // INDIVIDUAL, COMPANY, SERVICE_PROVIDER
  networkAccessTier: text("network_access_tier", { enum: ["DIVER", "COMPANY", "SERVICE_PROVIDER"] }), // Network platform access tier (synced with subscriptionTier)
  platformAccess: text("platform_access", { mode: "json" }).default({ training: true, network: false }), // JSON: { training: boolean, network: boolean }
  trialExpiresAt: integer("trial_expires_at", { mode: "timestamp" }),
  subscriptionStatus: text("subscription_status", { enum: ["ACTIVE", "PAUSED", "CANCELLED"] }).default("ACTIVE").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  affiliateCode: text("affiliate_code").unique(),
  referredBy: text("referred_by"), // affiliate code of referrer
  commissionRate: integer("commission_rate").default(0), // percentage (50 = 50%)
  totalEarnings: integer("total_earnings").default(0), // in cents
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const accounts = sqliteTable("accounts", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(generateId),
  sessionToken: text("session_token").notNull().unique(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const verificationTokens = sqliteTable("verification_tokens", {
  id: text("id").primaryKey().$defaultFn(generateId),
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: integer("expires", { mode: "timestamp" }).notNull(),
});

export const invites = sqliteTable("invites", {
  id: text("id").primaryKey().$defaultFn(generateId),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  createdByUserId: text("created_by_user_id").references(() => users.id),
});

export const aiTutors = sqliteTable("ai_tutors", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  specialty: text("specialty"),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const tracks = sqliteTable("tracks", {
  id: text("id").primaryKey().$defaultFn(generateId),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary"),
  aiTutorId: text("ai_tutor_id").references(() => aiTutors.id),
  difficulty: text("difficulty").default("beginner").notNull(), // beginner, intermediate, advanced
  estimatedHours: integer("estimated_hours").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  isPublished: integer("is_published", { mode: "boolean" }).default(false).notNull(),
});

export const lessons = sqliteTable("lessons", {
  id: text("id").primaryKey().$defaultFn(generateId),
  trackId: text("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").default(0).notNull(),
  content: text("content").notNull(),
  objectives: text("objectives").default("[]"), // Learning objectives array as JSON string
  estimatedMinutes: integer("estimated_minutes").default(30),
  isRequired: integer("is_required", { mode: "boolean" }).default(true).notNull(),
  podcastUrl: text("podcast_url"), // Podcast audio file URL
  podcastDuration: integer("podcast_duration"), // Duration in seconds
  notebookLmUrl: text("notebook_lm_url"), // Notebook LM integration URL
  pdfUrl: text("pdf_url"), // PDF content file URL
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const quizzes = sqliteTable("quizzes", {
  id: text("id").primaryKey().$defaultFn(generateId),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  timeLimit: integer("time_limit").default(30), // in minutes
  examType: text("exam_type", { enum: ["QUIZ", "EXAM", "PRACTICE"] }).default("QUIZ").notNull(),
  passingScore: integer("passing_score").default(70), // percentage
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey().$defaultFn(generateId),
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  options: text("options").notNull(), // JSON string of options
  correctAnswer: text("correct_answer").notNull(),
  order: integer("order").default(0),
});

export const userProgress = sqliteTable("user_progress", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: text("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  completedAt: integer("completed_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  score: integer("score"), // Quiz score if applicable
  timeSpent: integer("time_spent"), // Time spent on lesson in minutes
});

export const quizAttempts = sqliteTable("quiz_attempts", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  timeSpent: integer("time_spent"), // Time spent in minutes
  completedAt: integer("completed_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  answers: text("answers"), // JSON string of user answers
});

export const learningPaths = sqliteTable("learning_paths", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  suggestedTracks: text("suggested_tracks").notNull(), // JSON string of track IDs with order and reasoning
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const clients = sqliteTable("clients", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }), // Optional foreign key to users
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"), // Phone number for communications
  subscriptionType: text("subscription_type", { enum: ["TRIAL", "MONTHLY", "ANNUAL", "LIFETIME"] }).default("TRIAL").notNull(),
  status: text("status", { enum: ["ACTIVE", "PAUSED", "CANCELLED", "SPONSOR"] }).default("ACTIVE").notNull(),
  subscriptionDate: integer("subscription_date", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  monthlyRevenue: integer("monthly_revenue").default(0), // in cents
  partnerStatus: text("partner_status", { enum: ["NONE", "PENDING", "ACTIVE", "INACTIVE"] }).default("NONE").notNull(),
  conversionDate: integer("conversion_date", { mode: "timestamp" }), // When user became partner
  highlevelContactId: text("highlevel_contact_id"), // HighLevel contact ID for sync
  notes: text("notes"),
  calendlyEventUri: text("calendly_event_uri"), // Reference to Calendly event
  lastBookingTime: integer("last_booking_time", { mode: "timestamp" }), // Most recent booking time
  bookingCount: integer("booking_count").default(0).notNull(), // Number of bookings
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Client Tags for GHL-like tagging system
export const clientTags = sqliteTable("client_tags", {
  id: text("id").primaryKey().$defaultFn(generateId),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  tagName: text("tag_name").notNull(),
  color: text("color").default("#3b82f6"), // Hex color for UI display
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }), // Who created the tag
});

// Communication history for all client interactions
export const communications = sqliteTable("communications", {
  id: text("id").primaryKey().$defaultFn(generateId),
  clientId: text("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["email", "phone", "sms", "whatsapp", "note"] }).notNull(),
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull(),
  subject: text("subject"), // For emails
  content: text("content").notNull(), // Message body/content
  status: text("status", { enum: ["sent", "delivered", "read", "failed", "answered", "missed"] }).default("sent").notNull(),
  duration: integer("duration"), // For phone calls in seconds
  metadata: text("metadata"), // JSON string for additional data (e.g., email headers, call recordings, etc.)
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }), // Who initiated the communication
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const widgetLocations = sqliteTable("widget_locations", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  locationName: text("location_name"), // Optional label for the location
  isCurrentLocation: integer("is_current_location", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const widgetPreferences = sqliteTable("widget_preferences", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  timezone: text("timezone").notNull().default("UTC"),
  clockType: text("clock_type", { enum: ["digital", "analog"] }).notNull().default("digital"),
  enableWeather: integer("enable_weather", { mode: "boolean" }).default(false).notNull(),
  enableTides: integer("enable_tides", { mode: "boolean" }).default(false).notNull(),
  enableMoonPhase: integer("enable_moon_phase", { mode: "boolean" }).default(false).notNull(),
  enableNavigation: integer("enable_navigation", { mode: "boolean" }).default(false).notNull(),
  enableAis: integer("enable_ais", { mode: "boolean" }).default(false).notNull(),
  weatherAlertsEnabled: integer("weather_alerts_enabled", { mode: "boolean" }).default(true).notNull(),
  tideAlertsEnabled: integer("tide_alerts_enabled", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const navigationWaypoints = sqliteTable("navigation_waypoints", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const navigationRoutes = sqliteTable("navigation_routes", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  waypointIds: text("waypoint_ids").notNull(), // JSON string of waypoint IDs in order
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Medical Facilities Tables
export const medicalFacilities = sqliteTable("medical_facilities", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  type: text("type", { enum: ["A_E", "CRITICAL_CARE", "DIVING_DOCTOR", "HYPERBARIC"] }).notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  city: text("city"),
  country: text("country").notNull(),
  region: text("region"),
  phone: text("phone"),
  emergencyPhone: text("emergency_phone"),
  email: text("email"),
  website: text("website"),
  specialties: text("specialties").default("[]"), // JSON string array of specialty strings
  services: text("services").default("[]"), // JSON string array of service strings
  isAvailable24h: integer("is_available_24h", { mode: "boolean" }).default(false).notNull(),
  notes: text("notes"),
  isVerified: integer("is_verified", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const userMedicalFacilitySelections = sqliteTable("user_medical_facility_selections", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  facilityId: text("facility_id").notNull().references(() => medicalFacilities.id, { onDelete: "cascade" }),
  isPrimary: integer("is_primary", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Equipment Maintenance Tables
export const equipmentTypes = sqliteTable("equipment_types", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  description: text("description"),
  defaultMaintenanceInterval: text("default_maintenance_interval"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const equipmentItems = sqliteTable("equipment_items", {
  id: text("id").primaryKey().$defaultFn(generateId),
  equipmentTypeId: text("equipment_type_id").notNull().references(() => equipmentTypes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  serialNumber: text("serial_number"),
  manufacturer: text("manufacturer"),
  model: text("model"),
  purchaseDate: integer("purchase_date", { mode: "timestamp" }),
  status: text("status", { enum: ["OPERATIONAL", "MAINTENANCE", "RETIRED", "RESERVED", "DECOMMISSIONED"] }).default("OPERATIONAL").notNull(),
  location: text("location"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const maintenanceSchedules = sqliteTable("maintenance_schedules", {
  id: text("id").primaryKey().$defaultFn(generateId),
  equipmentTypeId: text("equipment_type_id").notNull().references(() => equipmentTypes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  intervalType: text("interval_type", { enum: ["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "HOURS", "CUSTOM"] }).notNull(),
  intervalValue: integer("interval_value"), // e.g., 6 for "every 6 months", 500 for "every 500 hours"
  checklist: text("checklist"), // JSON string of checklist items
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const maintenanceTasks = sqliteTable("maintenance_tasks", {
  id: text("id").primaryKey().$defaultFn(generateId),
  equipmentItemId: text("equipment_item_id").notNull().references(() => equipmentItems.id, { onDelete: "cascade" }),
  maintenanceScheduleId: text("maintenance_schedule_id").notNull().references(() => maintenanceSchedules.id, { onDelete: "cascade" }),
  scheduledDate: integer("scheduled_date", { mode: "timestamp" }).notNull(),
  completedDate: integer("completed_date", { mode: "timestamp" }),
  status: text("status", { enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "OVERDUE", "CANCELLED"] }).default("SCHEDULED").notNull(),
  assignedTo: text("assigned_to").references(() => users.id),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const maintenanceLogs = sqliteTable("maintenance_logs", {
  id: text("id").primaryKey().$defaultFn(generateId),
  maintenanceTaskId: text("maintenance_task_id").references(() => maintenanceTasks.id, { onDelete: "set null" }),
  equipmentItemId: text("equipment_item_id").notNull().references(() => equipmentItems.id, { onDelete: "cascade" }),
  performedBy: text("performed_by").notNull().references(() => users.id),
  performedDate: integer("performed_date", { mode: "timestamp" }).notNull(),
  checklistResults: text("checklist_results"), // JSON string
  notes: text("notes"),
  partsReplaced: text("parts_replaced"), // JSON string
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const equipmentUseLogs = sqliteTable("equipment_use_logs", {
  id: text("id").primaryKey().$defaultFn(generateId),
  equipmentItemId: text("equipment_item_id").notNull().references(() => equipmentItems.id, { onDelete: "cascade" }),
  useType: text("use_type", { enum: ["BEFORE_USE", "AFTER_USE"] }).notNull(),
  logDate: integer("log_date", { mode: "timestamp" }).notNull(),
  performedBy: text("performed_by").notNull().references(() => users.id),
  condition: text("condition", { enum: ["EXCELLENT", "GOOD", "FAIR", "POOR"] }).notNull(),
  defects: text("defects"), // JSON string
  notes: text("notes"),
  hoursUsed: real("hours_used"),
  location: text("location"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Support Tickets Table
export const supportTickets = sqliteTable("support_tickets", {
  id: text("id").primaryKey().$defaultFn(generateId),
  ticketId: text("ticket_id").notNull().unique(), // Human-readable ticket ID like PDT-1234567890
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }), // Optional - may not have account
  email: text("email").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  priority: text("priority", { enum: ["low", "medium", "high", "urgent"] }).default("medium").notNull(),
  status: text("status", { enum: ["pending", "in_progress", "completed", "closed", "cancelled"] }).default("pending").notNull(),
  assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" }), // Admin user who handles it
  assignedToLaura: integer("assigned_to_laura", { mode: "boolean" }).default(false).notNull(), // Whether Laura is handling it
  response: text("response"), // Admin/Laura response
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Operations Calendar Tables
export const operationsCalendar = sqliteTable("operations_calendar", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  operationDate: integer("operation_date", { mode: "timestamp" }).notNull(),
  startTime: text("start_time"), // Optional time string like "09:00"
  endTime: text("end_time"), // Optional time string like "17:00"
  location: text("location"),
  type: text("type", { enum: ["DIVE", "INSPECTION", "MAINTENANCE", "TRAINING", "OTHER"] }).default("DIVE").notNull(),
  status: text("status", { enum: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] }).default("SCHEDULED").notNull(),
  color: text("color").default("#8b5cf6"), // Purple default color
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const calendarShareLinks = sqliteTable("calendar_share_links", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  shareToken: text("share_token").notNull().unique(), // Unique token for share link
  isPublic: integer("is_public", { mode: "boolean" }).default(false).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }), // Optional expiration
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Calendar Sync Credentials Table
export const calendarSyncCredentials = sqliteTable("calendar_sync_credentials", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: ["google", "outlook", "apple", "highlevel", "calendly", "custom"] }).notNull(),
  refreshToken: text("refresh_token"), // Encrypted - nullable for providers that don't use OAuth
  calendarId: text("calendar_id"), // Specific calendar ID (e.g., Google Calendar ID, HighLevel Location ID)
  providerConfig: text("provider_config", { mode: "json" }), // JSON object for provider-specific configuration
  connectionName: text("connection_name"), // User-friendly name for the connection
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(), // Enable/disable connection
  syncEnabled: integer("sync_enabled", { mode: "boolean" }).default(true).notNull(),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  syncDirection: text("sync_direction", { enum: ["bidirectional", "pull", "push"] }).default("bidirectional").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// External Calendar Event Mapping Table
export const externalCalendarEvents = sqliteTable("external_calendar_events", {
  id: text("id").primaryKey().$defaultFn(generateId),
  operationId: text("operation_id").references(() => operationsCalendar.id, { onDelete: "cascade" }),
  externalEventId: text("external_event_id").notNull(), // ID from Google/Outlook/Apple
  provider: text("provider", { enum: ["google", "outlook", "apple"] }).notNull(),
  syncedAt: integer("synced_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Unified Calendar Tables
export const unifiedCalendarEvents = sqliteTable("unified_calendar_events", {
  id: text("id").primaryKey().$defaultFn(generateId),
  source: text("source", { enum: ["internal", "calendly", "google", "highlevel"] }).notNull(),
  sourceId: text("source_id").notNull(),
  title: text("title").notNull(),
  startTime: integer("start_time", { mode: "timestamp" }).notNull(),
  endTime: integer("end_time", { mode: "timestamp" }).notNull(),
  description: text("description"),
  location: text("location"),
  attendees: text("attendees", { mode: "json" }), // JSON array of {email, name}
  metadata: text("metadata", { mode: "json" }).notNull(), // JSON object with sync status, clientId, etc.
  color: text("color"),
  allDay: integer("all_day", { mode: "boolean" }).default(false).notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const calendarSyncStatus = sqliteTable("calendar_sync_status", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  source: text("source", { enum: ["internal", "calendly", "google", "highlevel"] }).notNull(),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  syncStatus: text("sync_status", { enum: ["success", "failed", "in_progress"] }),
  errorMessage: text("error_message"),
  eventsSynced: integer("events_synced").default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const calendarConflicts = sqliteTable("calendar_conflicts", {
  id: text("id").primaryKey().$defaultFn(generateId),
  type: text("type", { enum: ["time_overlap", "duplicate", "resource"] }).notNull(),
  severity: text("severity", { enum: ["low", "medium", "high"] }).notNull(),
  eventIds: text("event_ids", { mode: "json" }).notNull(), // JSON array of unified event IDs
  detectedAt: integer("detected_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  resolution: text("resolution", { enum: ["local_wins", "remote_wins", "newest_wins", "manual"] }),
  resolvedBy: text("resolved_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const calendarSyncLogs = sqliteTable("calendar_sync_logs", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  source: text("source", { enum: ["internal", "calendly", "google", "highlevel"] }).notNull(),
  operation: text("operation", { enum: ["pull", "push", "sync", "aggregate"] }).notNull(),
  status: text("status", { enum: ["success", "failed", "partial"] }).notNull(),
  eventsProcessed: integer("events_processed").default(0),
  errors: text("errors", { mode: "json" }), // JSON array of error messages
  duration: integer("duration"), // Duration in milliseconds
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Feature Management Tables
export const featureDefinitions = sqliteTable("feature_definitions", {
  id: text("id").primaryKey(), // e.g., "operations_center"
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // Operations, Admin, Content, Integrations, etc.
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const roleFeatureDefaults = sqliteTable("role_feature_defaults", {
  id: text("id").primaryKey().$defaultFn(generateId),
  role: text("role", { enum: ["USER", "ADMIN", "SUPER_ADMIN", "LIFETIME", "AFFILIATE", "ENTERPRISE"] }).notNull(),
  featureId: text("feature_id").notNull().references(() => featureDefinitions.id, { onDelete: "cascade" }),
  enabled: integer("enabled", { mode: "boolean" }).default(false).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const userFeatureOverrides = sqliteTable("user_feature_overrides", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  featureId: text("feature_id").notNull().references(() => featureDefinitions.id, { onDelete: "cascade" }),
  enabled: integer("enabled", { mode: "boolean" }), // null = use role default, true/false = override
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const globalFeatureFlags = sqliteTable("global_feature_flags", {
  id: text("id").primaryKey().$defaultFn(generateId),
  featureId: text("feature_id").notNull().unique().references(() => featureDefinitions.id, { onDelete: "cascade" }),
  enabled: integer("enabled", { mode: "boolean" }).default(true).notNull(),
  description: text("description"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedBy: text("updated_by"), // email of Super Admin who made change
});

export const documentationSections = sqliteTable("documentation_sections", {
  id: text("id").primaryKey().$defaultFn(generateId),
  sectionId: text("section_id").notNull().unique(), // matches existing section IDs like 'platform-overview'
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  subsections: text("subsections").default("[]"), // JSON array of subsections
  relatedLinks: text("related_links").default("[]"), // JSON array of links
  keywords: text("keywords").default("[]"), // JSON array of strings
  version: integer("version").default(1).notNull(),
  lastUpdated: integer("last_updated", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedBy: text("updated_by").default("laura"), // 'laura' | 'admin' | 'system'
  changeType: text("change_type"), // 'content' | 'feature' | 'api' | 'schema' | 'ai'
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const documentationChanges = sqliteTable("documentation_changes", {
  id: text("id").primaryKey().$defaultFn(generateId),
  sectionId: text("section_id").notNull(),
  changeType: text("change_type").notNull(), // 'content' | 'feature' | 'api' | 'schema' | 'ai'
  description: text("description"),
  oldContent: text("old_content"),
  newContent: text("new_content"),
  detectedAt: integer("detected_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  processedAt: integer("processed_at", { mode: "timestamp" }),
  status: text("status").default("pending"), // 'pending' | 'reviewed' | 'published' | 'rejected'
  processedBy: text("processed_by"), // 'laura' | 'admin'
  metadata: text("metadata").default("{}"), // JSON object with additional context
});

export const documentationVersions = sqliteTable("documentation_versions", {
  id: text("id").primaryKey().$defaultFn(generateId),
  sectionId: text("section_id").notNull(),
  version: integer("version").notNull(),
  content: text("content").notNull(), // Full content snapshot
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  createdBy: text("created_by").notNull(), // 'laura' | 'admin' | 'system'
});

// GPT Access Tokens Table
export const gptAccessTokens = sqliteTable("gpt_access_tokens", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  isRevoked: integer("is_revoked", { mode: "boolean" }).default(false).notNull(),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
  revokedReason: text("revoked_reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  invites: many(invites),
  userProgress: many(userProgress),
  quizAttempts: many(quizAttempts),
  learningPaths: many(learningPaths),
  widgetLocations: many(widgetLocations),
  widgetPreferences: one(widgetPreferences),
  navigationWaypoints: many(navigationWaypoints),
  navigationRoutes: many(navigationRoutes),
  medicalFacilitySelections: many(userMedicalFacilitySelections),
  assignedMaintenanceTasks: many(maintenanceTasks),
  performedMaintenanceLogs: many(maintenanceLogs),
  equipmentUseLogs: many(equipmentUseLogs),
  supportTickets: many(supportTickets),
  assignedSupportTickets: many(supportTickets),
  operationsCalendar: many(operationsCalendar),
  calendarShareLinks: many(calendarShareLinks),
  calendarSyncCredentials: many(calendarSyncCredentials),
  featureOverrides: many(userFeatureOverrides),
  gptAccessTokens: many(gptAccessTokens),
}));

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  lessons: many(lessons),
  aiTutor: one(aiTutors, {
    fields: [tracks.aiTutorId],
    references: [aiTutors.id],
  }),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  track: one(tracks, {
    fields: [lessons.trackId],
    references: [tracks.id],
  }),
  quizzes: many(quizzes),
  userProgress: many(userProgress),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [quizzes.lessonId],
    references: [lessons.id],
  }),
  questions: many(questions),
  attempts: many(quizAttempts),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  lesson: one(lessons, {
    fields: [userProgress.lessonId],
    references: [lessons.id],
  }),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, {
    fields: [quizAttempts.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [quizAttempts.quizId],
    references: [quizzes.id],
  }),
}));

export const learningPathsRelations = relations(learningPaths, ({ one }) => ({
  user: one(users, {
    fields: [learningPaths.userId],
    references: [users.id],
  }),
}));

export const widgetLocationsRelations = relations(widgetLocations, ({ one }) => ({
  user: one(users, {
    fields: [widgetLocations.userId],
    references: [users.id],
  }),
}));

export const widgetPreferencesRelations = relations(widgetPreferences, ({ one }) => ({
  user: one(users, {
    fields: [widgetPreferences.userId],
    references: [users.id],
  }),
}));

export const navigationWaypointsRelations = relations(navigationWaypoints, ({ one }) => ({
  user: one(users, {
    fields: [navigationWaypoints.userId],
    references: [users.id],
  }),
}));

export const navigationRoutesRelations = relations(navigationRoutes, ({ one }) => ({
  user: one(users, {
    fields: [navigationRoutes.userId],
    references: [users.id],
  }),
}));

export const medicalFacilitiesRelations = relations(medicalFacilities, ({ many }) => ({
  userSelections: many(userMedicalFacilitySelections),
}));

export const userMedicalFacilitySelectionsRelations = relations(userMedicalFacilitySelections, ({ one }) => ({
  user: one(users, {
    fields: [userMedicalFacilitySelections.userId],
    references: [users.id],
  }),
  facility: one(medicalFacilities, {
    fields: [userMedicalFacilitySelections.facilityId],
    references: [medicalFacilities.id],
  }),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  tags: many(clientTags),
  communications: many(communications),
  user: one(users, {
    fields: [clients.userId],
    references: [users.id],
  }),
}));

export const clientTagsRelations = relations(clientTags, ({ one }) => ({
  client: one(clients, {
    fields: [clientTags.clientId],
    references: [clients.id],
  }),
  creator: one(users, {
    fields: [clientTags.createdBy],
    references: [users.id],
  }),
}));

export const communicationsRelations = relations(communications, ({ one }) => ({
  client: one(clients, {
    fields: [communications.clientId],
    references: [clients.id],
  }),
  creator: one(users, {
    fields: [communications.createdBy],
    references: [users.id],
  }),
}));

// Equipment Relations
export const equipmentTypesRelations = relations(equipmentTypes, ({ many }) => ({
  equipmentItems: many(equipmentItems),
  maintenanceSchedules: many(maintenanceSchedules),
}));

export const equipmentItemsRelations = relations(equipmentItems, ({ one, many }) => ({
  equipmentType: one(equipmentTypes, {
    fields: [equipmentItems.equipmentTypeId],
    references: [equipmentTypes.id],
  }),
  maintenanceTasks: many(maintenanceTasks),
  maintenanceLogs: many(maintenanceLogs),
  useLogs: many(equipmentUseLogs),
}));

export const maintenanceSchedulesRelations = relations(maintenanceSchedules, ({ one, many }) => ({
  equipmentType: one(equipmentTypes, {
    fields: [maintenanceSchedules.equipmentTypeId],
    references: [equipmentTypes.id],
  }),
  maintenanceTasks: many(maintenanceTasks),
}));

export const maintenanceTasksRelations = relations(maintenanceTasks, ({ one, many }) => ({
  equipmentItem: one(equipmentItems, {
    fields: [maintenanceTasks.equipmentItemId],
    references: [equipmentItems.id],
  }),
  maintenanceSchedule: one(maintenanceSchedules, {
    fields: [maintenanceTasks.maintenanceScheduleId],
    references: [maintenanceSchedules.id],
  }),
  assignedUser: one(users, {
    fields: [maintenanceTasks.assignedTo],
    references: [users.id],
  }),
  maintenanceLogs: many(maintenanceLogs),
}));

export const maintenanceLogsRelations = relations(maintenanceLogs, ({ one }) => ({
  equipmentItem: one(equipmentItems, {
    fields: [maintenanceLogs.equipmentItemId],
    references: [equipmentItems.id],
  }),
  maintenanceTask: one(maintenanceTasks, {
    fields: [maintenanceLogs.maintenanceTaskId],
    references: [maintenanceTasks.id],
  }),
  performedByUser: one(users, {
    fields: [maintenanceLogs.performedBy],
    references: [users.id],
  }),
}));

export const equipmentUseLogsRelations = relations(equipmentUseLogs, ({ one }) => ({
  equipmentItem: one(equipmentItems, {
    fields: [equipmentUseLogs.equipmentItemId],
    references: [equipmentItems.id],
  }),
  performedByUser: one(users, {
    fields: [equipmentUseLogs.performedBy],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ one }) => ({
  user: one(users, {
    fields: [supportTickets.userId],
    references: [users.id],
  }),
  assignedUser: one(users, {
    fields: [supportTickets.assignedTo],
    references: [users.id],
  }),
}));

export const operationsCalendarRelations = relations(operationsCalendar, ({ one }) => ({
  user: one(users, {
    fields: [operationsCalendar.userId],
    references: [users.id],
  }),
}));

export const calendarShareLinksRelations = relations(calendarShareLinks, ({ one }) => ({
  user: one(users, {
    fields: [calendarShareLinks.userId],
    references: [users.id],
  }),
}));

export const calendarSyncCredentialsRelations = relations(calendarSyncCredentials, ({ one }) => ({
  user: one(users, {
    fields: [calendarSyncCredentials.userId],
    references: [users.id],
  }),
}));

export const externalCalendarEventsRelations = relations(externalCalendarEvents, ({ one }) => ({
  operation: one(operationsCalendar, {
    fields: [externalCalendarEvents.operationId],
    references: [operationsCalendar.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrackSchema = createInsertSchema(tracks).omit({
  id: true,
  createdAt: true,
});

export const insertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertInviteSchema = createInsertSchema(invites).omit({
  id: true,
  createdAt: true,
});

export const insertAttemptSchema = createInsertSchema(quizAttempts).omit({
  id: true,
  completedAt: true,
});

export const insertWidgetLocationSchema = createInsertSchema(widgetLocations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWidgetPreferencesSchema = createInsertSchema(widgetPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNavigationWaypointSchema = createInsertSchema(navigationWaypoints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNavigationRouteSchema = createInsertSchema(navigationRoutes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMedicalFacilitySchema = createInsertSchema(medicalFacilities).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserMedicalFacilitySelectionSchema = createInsertSchema(userMedicalFacilitySelections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEquipmentTypeSchema = createInsertSchema(equipmentTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEquipmentItemSchema = createInsertSchema(equipmentItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceScheduleSchema = createInsertSchema(maintenanceSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceTaskSchema = createInsertSchema(maintenanceTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceLogSchema = createInsertSchema(maintenanceLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEquipmentUseLogSchema = createInsertSchema(equipmentUseLogs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  ticketId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientTagSchema = createInsertSchema(clientTags).omit({
  id: true,
  createdAt: true,
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({
  id: true,
  createdAt: true,
});

export const insertOperationsCalendarSchema = createInsertSchema(operationsCalendar).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarShareLinkSchema = createInsertSchema(calendarShareLinks).omit({
  id: true,
  shareToken: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarSyncCredentialsSchema = createInsertSchema(calendarSyncCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertExternalCalendarEventSchema = createInsertSchema(externalCalendarEvents).omit({
  id: true,
  syncedAt: true,
});

export const insertDocumentationSectionSchema = createInsertSchema(documentationSections).omit({
  id: true,
  createdAt: true,
  lastUpdated: true,
});

export const insertDocumentationChangeSchema = createInsertSchema(documentationChanges).omit({
  id: true,
  detectedAt: true,
});

export const insertDocumentationVersionSchema = createInsertSchema(documentationVersions).omit({
  id: true,
  createdAt: true,
});

// ============================================
// FEATURE UPDATE LOG - Track all feature deployments
// ============================================
export const featureUpdateLog = sqliteTable("feature_update_log", {
  id: text("id").primaryKey().$defaultFn(generateId),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").default("FEATURE").notNull(), // FEATURE, BUGFIX, ENHANCEMENT, SECURITY, PERFORMANCE, UI_UX
  status: text("status").default("DEPLOYED").notNull(), // PLANNED, IN_PROGRESS, TESTING, DEPLOYED, ROLLED_BACK
  version: text("version"),
  commitHash: text("commit_hash"),
  pullRequestUrl: text("pull_request_url"),
  affectedComponents: text("affected_components", { mode: "json" }).default("[]"),
  technicalDetails: text("technical_details"),
  breakingChanges: integer("breaking_changes", { mode: "boolean" }).default(false).notNull(),
  deployedBy: text("deployed_by").references(() => users.id),
  plannedAt: integer("planned_at", { mode: "timestamp" }),
  startedAt: integer("started_at", { mode: "timestamp" }),
  testedAt: integer("tested_at", { mode: "timestamp" }),
  deployedAt: integer("deployed_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertFeatureUpdateLogSchema = createInsertSchema(featureUpdateLog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================
// SMART BUILD SYSTEM - Strategic App Building
// ============================================
export const smartBuildProjects = sqliteTable("smart_build_projects", {
  id: text("id").primaryKey().$defaultFn(generateId),
  name: text("name").notNull(),
  description: text("description").notNull(),
  targetPlatform: text("target_platform").notNull(),
  currentPhase: text("current_phase").default("PLANNING").notNull(), // PLANNING, EXECUTION, TESTING, COMPLETE, ON_HOLD
  overallProgress: integer("overall_progress").default(0).notNull(),
  estimatedCost: integer("estimated_cost"),
  actualCost: integer("actual_cost"),
  costSavings: integer("cost_savings"),
  startDate: integer("start_date", { mode: "timestamp" }),
  targetDate: integer("target_date", { mode: "timestamp" }),
  completedDate: integer("completed_date", { mode: "timestamp" }),
  createdBy: text("created_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const smartBuildFeatures = sqliteTable("smart_build_features", {
  id: text("id").primaryKey().$defaultFn(generateId),
  projectId: text("project_id").notNull().references(() => smartBuildProjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  priority: text("priority").default("MEDIUM").notNull(), // CRITICAL, HIGH, MEDIUM, LOW
  phase: text("phase").default("PLANNING").notNull(),
  order: integer("order").default(0).notNull(),
  planDetails: text("plan_details"),
  planApprovedAt: integer("plan_approved_at", { mode: "timestamp" }),
  planApprovedBy: text("plan_approved_by").references(() => users.id),
  executionNotes: text("execution_notes"),
  codeChanges: text("code_changes", { mode: "json" }).default("[]"),
  executionStartedAt: integer("execution_started_at", { mode: "timestamp" }),
  executionCompletedAt: integer("execution_completed_at", { mode: "timestamp" }),
  testCases: text("test_cases", { mode: "json" }).default("[]"),
  testResults: text("test_results", { mode: "json" }).default("[]"),
  testPassRate: integer("test_pass_rate"),
  testStartedAt: integer("test_started_at", { mode: "timestamp" }),
  testCompletedAt: integer("test_completed_at", { mode: "timestamp" }),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  costEstimate: integer("cost_estimate"),
  actualCost: integer("actual_cost"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const smartBuildLogs = sqliteTable("smart_build_logs", {
  id: text("id").primaryKey().$defaultFn(generateId),
  projectId: text("project_id").references(() => smartBuildProjects.id, { onDelete: "cascade" }),
  featureId: text("feature_id").references(() => smartBuildFeatures.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  details: text("details"),
  metadata: text("metadata", { mode: "json" }).default("{}"),
  performedBy: text("performed_by").references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const insertSmartBuildProjectSchema = createInsertSchema(smartBuildProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmartBuildFeatureSchema = createInsertSchema(smartBuildFeatures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmartBuildLogSchema = createInsertSchema(smartBuildLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Track = typeof tracks.$inferSelect;
export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Invite = typeof invites.$inferSelect;
export type InsertInvite = z.infer<typeof insertInviteSchema>;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Client = typeof clients.$inferSelect;
export type AITutor = typeof aiTutors.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type LearningPath = typeof learningPaths.$inferSelect;
export type WidgetLocation = typeof widgetLocations.$inferSelect;
export type InsertWidgetLocation = z.infer<typeof insertWidgetLocationSchema>;
export type WidgetPreferences = typeof widgetPreferences.$inferSelect;
export type InsertWidgetPreferences = z.infer<typeof insertWidgetPreferencesSchema>;
export type NavigationWaypoint = typeof navigationWaypoints.$inferSelect;
export type InsertNavigationWaypoint = z.infer<typeof insertNavigationWaypointSchema>;
export type NavigationRoute = typeof navigationRoutes.$inferSelect;
export type InsertNavigationRoute = z.infer<typeof insertNavigationRouteSchema>;
export type MedicalFacility = typeof medicalFacilities.$inferSelect;
export type InsertMedicalFacility = z.infer<typeof insertMedicalFacilitySchema>;
export type UserMedicalFacilitySelection = typeof userMedicalFacilitySelections.$inferSelect;
export type InsertUserMedicalFacilitySelection = z.infer<typeof insertUserMedicalFacilitySelectionSchema>;
export type EquipmentType = typeof equipmentTypes.$inferSelect;
export type InsertEquipmentType = z.infer<typeof insertEquipmentTypeSchema>;
export type EquipmentItem = typeof equipmentItems.$inferSelect;
export type InsertEquipmentItem = z.infer<typeof insertEquipmentItemSchema>;
export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type InsertMaintenanceSchedule = z.infer<typeof insertMaintenanceScheduleSchema>;
export type MaintenanceTask = typeof maintenanceTasks.$inferSelect;
export type InsertMaintenanceTask = z.infer<typeof insertMaintenanceTaskSchema>;
export type MaintenanceLog = typeof maintenanceLogs.$inferSelect;
export type InsertMaintenanceLog = z.infer<typeof insertMaintenanceLogSchema>;
export type EquipmentUseLog = typeof equipmentUseLogs.$inferSelect;
export type InsertEquipmentUseLog = z.infer<typeof insertEquipmentUseLogSchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type ClientTag = typeof clientTags.$inferSelect;
export type InsertClientTag = z.infer<typeof insertClientTagSchema>;
export type Communication = typeof communications.$inferSelect;
export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;
export type OperationsCalendar = typeof operationsCalendar.$inferSelect;
export type InsertOperationsCalendar = z.infer<typeof insertOperationsCalendarSchema>;
export type CalendarShareLink = typeof calendarShareLinks.$inferSelect;
export type InsertCalendarShareLink = z.infer<typeof insertCalendarShareLinkSchema>;
export type CalendarSyncCredentials = typeof calendarSyncCredentials.$inferSelect;
export type InsertCalendarSyncCredentials = z.infer<typeof insertCalendarSyncCredentialsSchema>;
export type ExternalCalendarEvent = typeof externalCalendarEvents.$inferSelect;
export type InsertExternalCalendarEvent = z.infer<typeof insertExternalCalendarEventSchema>;
export type FeatureDefinition = typeof featureDefinitions.$inferSelect;
export type RoleFeatureDefault = typeof roleFeatureDefaults.$inferSelect;
export type UserFeatureOverride = typeof userFeatureOverrides.$inferSelect;
export type GlobalFeatureFlag = typeof globalFeatureFlags.$inferSelect;
export type DocumentationSection = typeof documentationSections.$inferSelect;
export type InsertDocumentationSection = z.infer<typeof insertDocumentationSectionSchema>;
export type DocumentationChange = typeof documentationChanges.$inferSelect;
export type InsertDocumentationChange = z.infer<typeof insertDocumentationChangeSchema>;
export type DocumentationVersion = typeof documentationVersions.$inferSelect;
export type InsertDocumentationVersion = z.infer<typeof insertDocumentationVersionSchema>;
export type GptAccessToken = typeof gptAccessTokens.$inferSelect;
export type InsertGptAccessToken = z.infer<typeof insertGptAccessTokenSchema>;
export type ContentGenerationLog = typeof contentGenerationLogs.$inferSelect;
export type InsertContentGenerationLog = typeof contentGenerationLogs.$inferInsert;

// Feature Update Log Types
export type FeatureUpdateLog = typeof featureUpdateLog.$inferSelect;
export type InsertFeatureUpdateLog = z.infer<typeof insertFeatureUpdateLogSchema>;

// Smart Build Types
export type SmartBuildProject = typeof smartBuildProjects.$inferSelect;
export type InsertSmartBuildProject = z.infer<typeof insertSmartBuildProjectSchema>;
export type SmartBuildFeature = typeof smartBuildFeatures.$inferSelect;
export type InsertSmartBuildFeature = z.infer<typeof insertSmartBuildFeatureSchema>;
export type SmartBuildLog = typeof smartBuildLogs.$inferSelect;
export type InsertSmartBuildLog = z.infer<typeof insertSmartBuildLogSchema>;
