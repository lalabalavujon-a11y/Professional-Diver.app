import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["USER", "ADMIN", "SUPER_ADMIN", "LIFETIME", "AFFILIATE", "ENTERPRISE"]);
export const questionTypeEnum = pgEnum("question_type", ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]);
export const examTypeEnum = pgEnum("exam_type", ["QUIZ", "EXAM", "PRACTICE"]);
export const certificationStatusEnum = pgEnum("certification_status", ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "EXPIRED"]);
export const subscriptionTypeEnum = pgEnum("subscription_type", ["TRIAL", "MONTHLY", "ANNUAL", "LIFETIME"]);
export const clientStatusEnum = pgEnum("client_status", ["ACTIVE", "PAUSED", "CANCELLED"]);
export const entityTypeEnum = pgEnum("entity_type", ["INDIVIDUAL", "COMPANY", "SERVICE_PROVIDER"]);
export const subscriptionTierEnum = pgEnum("subscription_tier", ["DIVER", "COMPANY", "SERVICE_PROVIDER", "ENTERPRISE"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: roleEnum("role").default("USER").notNull(),
  subscriptionType: subscriptionTypeEnum("subscription_type").default("TRIAL").notNull(),
  subscriptionTier: subscriptionTierEnum("subscription_tier"), // New: DIVER, COMPANY, SERVICE_PROVIDER
  entityType: entityTypeEnum("entity_type").default("INDIVIDUAL").notNull(), // INDIVIDUAL, COMPANY, SERVICE_PROVIDER
  networkAccessTier: subscriptionTierEnum("network_access_tier"), // Network platform access tier (synced with subscriptionTier)
  platformAccess: json("platform_access").default({ training: true, network: false }), // JSON: { training: boolean, network: boolean }
  trialExpiresAt: timestamp("trial_expires_at"),
  subscriptionStatus: clientStatusEnum("subscription_status").default("ACTIVE").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  affiliateCode: varchar("affiliate_code").unique(),
  referredBy: varchar("referred_by"), // affiliate code of referrer
  commissionRate: integer("commission_rate").default(0), // percentage (50 = 50%)
  totalEarnings: integer("total_earnings").default(0), // in cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const accounts = pgTable("accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionToken: text("session_token").notNull().unique(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(),
  token: text("token").notNull().unique(),
  expires: timestamp("expires").notNull(),
});

export const invites = pgTable("invites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdByUserId: varchar("created_by_user_id").references(() => users.id),
});

export const tracks = pgTable("tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary"),
  aiTutorId: varchar("ai_tutor_id").references(() => aiTutors.id),
  difficulty: text("difficulty").default("beginner").notNull(), // beginner, intermediate, advanced
  estimatedHours: integer("estimated_hours").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublished: boolean("is_published").default(false).notNull(),
});

export const lessons = pgTable("lessons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trackId: varchar("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").default(0).notNull(),
  content: text("content").notNull(),
  objectives: json("objectives").default([]), // Learning objectives array
  estimatedMinutes: integer("estimated_minutes").default(30),
  isRequired: boolean("is_required").default(true).notNull(),
  podcastUrl: text("podcast_url"), // Podcast audio file URL
  podcastDuration: integer("podcast_duration"), // Duration in seconds
  notebookLmUrl: text("notebook_lm_url"), // Notebook LM integration URL
  pdfUrl: text("pdf_url"), // PDF content file URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const quizzes = pgTable("quizzes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  timeLimit: integer("time_limit").default(30), // in minutes
  examType: examTypeEnum("exam_type").default("QUIZ").notNull(),
  passingScore: integer("passing_score").default(70), // percentage
  maxAttempts: integer("max_attempts").default(3),
  showFeedback: boolean("show_feedback").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  type: questionTypeEnum("type").default("MULTIPLE_CHOICE").notNull(),
  prompt: text("prompt").notNull(),
  options: json("options").default([]), // For multiple choice: ["a", "b", "c", "d"], for true/false: ["true", "false"]
  correctAnswer: text("correct_answer").notNull(), // For MC: "a", for T/F: "true"/"false", for SA: expected answer
  explanation: text("explanation"), // Detailed feedback explanation
  points: integer("points").default(1).notNull(),
  order: integer("order").default(0).notNull(),
});

export const attempts = pgTable("attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizId: varchar("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  maxScore: integer("max_score").notNull(),
  percentage: integer("percentage").notNull(),
  passed: boolean("passed").notNull(),
  timeSpent: integer("time_spent"), // in seconds
  answers: json("answers").notNull(), // Detailed answer tracking
  feedback: json("feedback").default([]), // Question-by-question feedback
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const userProgress = pgTable("user_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  timeSpent: integer("time_spent").default(0), // in minutes
  completionRate: integer("completion_rate").default(0), // percentage 0-100
  lastAccessedAt: timestamp("last_accessed_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

// New tables for enhanced functionality
export const aiTutors = pgTable("ai_tutors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  specialty: text("specialty").notNull(), // "NDT", "Diver Medic", "Commercial Dive Supervisor", etc.
  description: text("description").notNull(),
  personality: json("personality").default({}), // AI personality traits and teaching style
  knowledgeBase: json("knowledge_base").default([]), // Specialized knowledge topics
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const practiceScenarios = pgTable("practice_scenarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").notNull().references(() => lessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  scenario: json("scenario").notNull(), // Detailed scenario data
  expectedActions: json("expected_actions").default([]), // Expected user responses
  difficulty: text("difficulty").default("intermediate").notNull(),
  estimatedMinutes: integer("estimated_minutes").default(15),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const certificates = pgTable("certificates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  trackId: varchar("track_id").notNull().references(() => tracks.id, { onDelete: "cascade" }),
  status: certificationStatusEnum("status").default("NOT_STARTED").notNull(),
  progress: integer("progress").default(0), // percentage 0-100
  finalScore: integer("final_score"),
  issuedAt: timestamp("issued_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const scenarioAttempts = pgTable("scenario_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scenarioId: varchar("scenario_id").notNull().references(() => practiceScenarios.id, { onDelete: "cascade" }),
  userActions: json("user_actions").notNull(), // User's actions during scenario
  score: integer("score").notNull(),
  feedback: text("feedback"), // AI tutor feedback
  timeSpent: integer("time_spent"), // in seconds
  completedAt: timestamp("completed_at").defaultNow().notNull(),
});

export const partnerStatusEnum = pgEnum("partner_status", ["NONE", "PENDING", "ACTIVE", "INACTIVE"]);

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }), // Optional foreign key to users
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  subscriptionType: subscriptionTypeEnum("subscription_type").default("TRIAL").notNull(),
  status: clientStatusEnum("status").default("ACTIVE").notNull(),
  subscriptionDate: timestamp("subscription_date").defaultNow().notNull(),
  monthlyRevenue: integer("monthly_revenue").default(0).notNull(), // Revenue in cents (e.g., 2500 for $25.00)
  partnerStatus: partnerStatusEnum("partner_status").default("NONE").notNull(),
  conversionDate: timestamp("conversion_date"), // When user became partner
  highlevelContactId: text("highlevel_contact_id"), // HighLevel contact ID for sync
  notes: text("notes"),
  calendlyEventUri: text("calendly_event_uri"), // Reference to Calendly event
  lastBookingTime: timestamp("last_booking_time"), // Most recent booking time
  bookingCount: integer("booking_count").default(0).notNull(), // Number of bookings
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const learningPaths = pgTable("learning_paths", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  userProfile: json("user_profile").notNull(), // Store user's profile data
  suggestedTracks: json("suggested_tracks").notNull(), // Array of track IDs with order and reasoning
  confidence: integer("confidence").default(0), // AI confidence score 0-100
  reasoning: text("reasoning"), // AI explanation for the suggestions
  status: text("status").default("ACTIVE").notNull(), // ACTIVE, COMPLETED, PAUSED
  progress: integer("progress").default(0), // Overall progress percentage
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const contentGenerationLogs = pgTable("content_generation_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  lessonId: varchar("lesson_id").references(() => lessons.id, { onDelete: "set null" }),
  trackId: varchar("track_id").references(() => tracks.id, { onDelete: "set null" }),
  contentType: varchar("content_type").notNull(), // 'pdf' | 'podcast'
  status: varchar("status").notNull(), // 'pending' | 'processing' | 'completed' | 'failed'
  sourceType: varchar("source_type"), // 'lesson_content' | 'pdf_content' | 'gamma_template'
  sourceUrl: text("source_url"), // PDF URL if podcast from PDF
  generatedUrl: text("generated_url"), // Result PDF/podcast URL
  errorMessage: text("error_message"),
  durationSeconds: integer("duration_seconds"),
  fileSizeBytes: integer("file_size_bytes"),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  metadata: json("metadata"), // Additional info (word count, page count, etc.)
});

export const widgetLocations = pgTable("widget_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  locationName: text("location_name"), // Optional label for the location
  isCurrentLocation: boolean("is_current_location").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const widgetPreferences = pgTable("widget_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  timezone: text("timezone").notNull().default("UTC"),
  clockType: text("clock_type", { enum: ["digital", "analog"] }).notNull().default("digital"),
  enableWeather: boolean("enable_weather").default(false).notNull(),
  enableTides: boolean("enable_tides").default(false).notNull(),
  enableMoonPhase: boolean("enable_moon_phase").default(false).notNull(),
  enableNavigation: boolean("enable_navigation").default(false).notNull(),
  enableAis: boolean("enable_ais").default(false).notNull(),
  weatherAlertsEnabled: boolean("weather_alerts_enabled").default(true).notNull(),
  tideAlertsEnabled: boolean("tide_alerts_enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const navigationWaypoints = pgTable("navigation_waypoints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const navigationRoutes = pgTable("navigation_routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  waypointIds: json("waypoint_ids").notNull(), // Array of waypoint IDs in order
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Calendar Sync Credentials Table
export const calendarSyncCredentials = pgTable("calendar_sync_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: varchar("provider", { enum: ["google", "outlook", "apple", "highlevel", "calendly", "custom"] }).notNull(),
  refreshToken: text("refresh_token"), // Encrypted - nullable for providers that don't use OAuth
  calendarId: text("calendar_id"), // Specific calendar ID (e.g., Google Calendar ID, HighLevel Location ID)
  providerConfig: json("provider_config"), // JSON object for provider-specific configuration
  connectionName: text("connection_name"), // User-friendly name for the connection
  isActive: boolean("is_active").default(true).notNull(), // Enable/disable connection
  syncEnabled: boolean("sync_enabled").default(true).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  syncDirection: varchar("sync_direction", { enum: ["bidirectional", "pull", "push"] }).default("bidirectional").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Unified Calendar Tables
export const unifiedCalendarEvents = pgTable("unified_calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: varchar("source", { enum: ["internal", "calendly", "google", "highlevel"] }).notNull(),
  sourceId: text("source_id").notNull(),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  description: text("description"),
  location: text("location"),
  attendees: json("attendees"), // JSON array of {email, name}
  metadata: json("metadata").notNull(), // JSON object with sync status, clientId, etc.
  color: text("color"),
  allDay: boolean("all_day").default(false).notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarSyncStatus = pgTable("calendar_sync_status", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  source: varchar("source", { enum: ["internal", "calendly", "google", "highlevel"] }).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  syncStatus: varchar("sync_status", { enum: ["success", "failed", "in_progress"] }),
  errorMessage: text("error_message"),
  eventsSynced: integer("events_synced").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarConflicts = pgTable("calendar_conflicts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { enum: ["time_overlap", "duplicate", "resource"] }).notNull(),
  severity: varchar("severity", { enum: ["low", "medium", "high"] }).notNull(),
  eventIds: json("event_ids").notNull(), // JSON array of unified event IDs
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
  resolution: varchar("resolution", { enum: ["local_wins", "remote_wins", "newest_wins", "manual"] }),
  resolvedBy: varchar("resolved_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarSyncLogs = pgTable("calendar_sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  source: varchar("source", { enum: ["internal", "calendly", "google", "highlevel"] }).notNull(),
  operation: varchar("operation", { enum: ["pull", "push", "sync", "aggregate"] }).notNull(),
  status: varchar("status", { enum: ["success", "failed", "partial"] }).notNull(),
  eventsProcessed: integer("events_processed").default(0),
  errors: json("errors"), // JSON array of error messages
  duration: integer("duration"), // Duration in milliseconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const medicalFacilityTypeEnum = pgEnum("medical_facility_type", ["A_E", "CRITICAL_CARE", "DIVING_DOCTOR", "HYPERBARIC"]);

// Dive Supervisor Control Enums
export const diveOperationStatusEnum = pgEnum("dive_operation_status", ["PLANNED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ON_HOLD"]);
export const contactTypeEnum = pgEnum("contact_type", ["CLIENT", "CLIENT_REP", "VTS", "HARBOUR_MASTER", "DIVING_DOCTOR", "A_E", "CRITICAL_CARE", "POLICE", "FIRE", "AMBULANCE", "SHIPPING", "OTHER"]);
export const permitTypeEnum = pgEnum("permit_type", ["DIVE_PERMIT", "HOTWORKS", "ENVIRONMENTAL", "SAFETY", "OTHER"]);
export const permitStatusEnum = pgEnum("permit_status", ["PENDING", "ISSUED", "EXPIRED", "REVOKED"]);
export const divePhaseEnum = pgEnum("dive_phase", ["PRE_DIVE", "DIVE", "POST_DIVE", "STANDBY", "DECOMPRESSION"]);
export const diverRoleEnum = pgEnum("diver_role", ["DIVER_1", "DIVER_2", "STANDBY_DIVER", "TENDER", "SUPERVISOR", "LST", "DMT", "OTHER"]);
export const hazardTypeEnum = pgEnum("hazard_type", ["ENVIRONMENTAL", "EQUIPMENT", "OPERATIONAL", "PERSONNEL", "STRUCTURAL", "OTHER"]);
export const hazardSeverityEnum = pgEnum("hazard_severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const hazardLikelihoodEnum = pgEnum("hazard_likelihood", ["RARE", "UNLIKELY", "POSSIBLE", "LIKELY", "ALMOST_CERTAIN"]);
export const hazardStatusEnum = pgEnum("hazard_status", ["IDENTIFIED", "ASSESSED", "MITIGATED", "RESOLVED", "MONITORING"]);

export const medicalFacilities = pgTable("medical_facilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: medicalFacilityTypeEnum("type").notNull(),
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
  specialties: json("specialties").default([]), // Array of specialty strings
  services: json("services").default([]), // Array of service strings (e.g., ["Hyperbaric Chamber", "24/7 Emergency"])
  isAvailable24h: boolean("is_available_24h").default(false).notNull(),
  notes: text("notes"),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userMedicalFacilitySelections = pgTable("user_medical_facility_selections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  facilityId: varchar("facility_id").notNull().references(() => medicalFacilities.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Dive Supervisor Control Tables
export const diveTeamMembers = pgTable("dive_team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role").default("DIVER"), // SUPERVISOR, DIVER, etc.
  age: integer("age"),
  experienceYears: integer("experience_years"), // Years of diving experience
  phone: text("phone"),
  email: text("email"),
  certifications: json("certifications").default([]), // Array of certification objects
  medicalRunoutDates: json("medical_runout_dates").default([]), // Array of {type, date} objects
  competencies: json("competencies").default([]), // Array of competency objects
  emergencyContact: json("emergency_contact").default({}), // Emergency contact info
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const diveOperations = pgTable("dive_operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  clientId: varchar("client_id").references(() => clients.id, { onDelete: "set null" }),
  location: text("location"),
  plannedDate: timestamp("planned_date"),
  status: diveOperationStatusEnum("status").default("PLANNED").notNull(),
  supervisorId: varchar("supervisor_id").references(() => diveTeamMembers.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const diveOperationContacts = pgTable("dive_operation_contacts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationId: varchar("operation_id").notNull().references(() => diveOperations.id, { onDelete: "cascade" }),
  contactType: contactTypeEnum("contact_type").notNull(),
  name: text("name").notNull(),
  organization: text("organization"),
  phone: text("phone"),
  email: text("email"),
  vhfChannel: text("vhf_channel"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const diveOperationPermits = pgTable("dive_operation_permits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationId: varchar("operation_id").notNull().references(() => diveOperations.id, { onDelete: "cascade" }),
  permitType: permitTypeEnum("permit_type").notNull(),
  permitNumber: text("permit_number"),
  issuedBy: text("issued_by"),
  issueDate: timestamp("issue_date"),
  expiryDate: timestamp("expiry_date"),
  status: permitStatusEnum("status").default("PENDING").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const diveTeamRosters = pgTable("dive_team_rosters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationId: varchar("operation_id").notNull().references(() => diveOperations.id, { onDelete: "cascade" }),
  phase: divePhaseEnum("phase").notNull(),
  diverRole: diverRoleEnum("diver_role").notNull(),
  teamMemberId: varchar("team_member_id").references(() => diveTeamMembers.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const divePlans = pgTable("dive_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationId: varchar("operation_id").notNull().references(() => diveOperations.id, { onDelete: "cascade" }),
  maxDepth: real("max_depth"), // in meters
  bottomTime: integer("bottom_time"), // in minutes
  decompressionProfile: json("decompression_profile").default([]), // Array of decompression stops
  gasMixtures: json("gas_mixtures").default([]), // Array of gas mixture objects
  equipment: json("equipment").default([]), // Array of equipment IDs or names
  riskAssessment: json("risk_assessment").default({}), // Risk assessment data
  isNightOps: boolean("is_night_ops").default(false).notNull(),
  nightOpsConsiderations: json("night_ops_considerations").default({}), // Night ops specific considerations
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const dailyProjectReports = pgTable("daily_project_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationId: varchar("operation_id").notNull().references(() => diveOperations.id, { onDelete: "cascade" }),
  reportDate: timestamp("report_date").notNull(),
  reportData: json("report_data").notNull(), // Full form data as JSON
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Enhanced Dive Supervisor Control Tables
export const casEvacDrills = pgTable("cas_evac_drills", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationId: varchar("operation_id").notNull().references(() => diveOperations.id, { onDelete: "cascade" }),
  drillDate: timestamp("drill_date").notNull(),
  scenario: text("scenario").notNull(),
  participants: json("participants").default([]), // Array of participant objects
  outcomes: text("outcomes"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const toolBoxTalks = pgTable("tool_box_talks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationId: varchar("operation_id").notNull().references(() => diveOperations.id, { onDelete: "cascade" }),
  talkDate: timestamp("talk_date").notNull(),
  topics: json("topics").default([]), // Array of topic strings
  attendees: json("attendees").default([]), // Array of attendee objects
  presenter: text("presenter").notNull(),
  signOffs: json("sign_offs").default([]), // Array of sign-off objects
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const diveOperationHazards = pgTable("dive_operation_hazards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationId: varchar("operation_id").notNull().references(() => diveOperations.id, { onDelete: "cascade" }),
  hazardType: hazardTypeEnum("hazard_type").notNull(),
  description: text("description").notNull(),
  severity: hazardSeverityEnum("severity").notNull(),
  likelihood: hazardLikelihoodEnum("likelihood").notNull(),
  mitigation: text("mitigation"),
  status: hazardStatusEnum("status").default("IDENTIFIED").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const welfareRecords = pgTable("welfare_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationId: varchar("operation_id").notNull().references(() => diveOperations.id, { onDelete: "cascade" }),
  recordDate: timestamp("record_date").notNull(),
  accommodation: json("accommodation").default({}), // Accommodation details
  meals: json("meals").default({}), // Meal planning information
  restPeriods: json("rest_periods").default([]), // Array of rest period objects
  healthNotes: text("health_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const shippingInfo = pgTable("shipping_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationId: varchar("operation_id").notNull().references(() => diveOperations.id, { onDelete: "cascade" }),
  vesselName: text("vessel_name"),
  vesselType: text("vessel_type"),
  eta: timestamp("eta"), // Estimated time of arrival
  etd: timestamp("etd"), // Estimated time of departure
  contact: json("contact").default({}), // Contact information
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RAMS (Risk Assessment and Method Statement)
export const ramsDocuments = pgTable("rams_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  operationId: varchar("operation_id").notNull().references(() => diveOperations.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  documentData: json("document_data").notNull(), // Full RAMS document content
  linkedHazardIds: json("linked_hazard_ids").default([]), // Array of hazard IDs from diveOperationHazards
  signatures: json("signatures").default([]), // Array of {teamMemberId, name, signature, date, status}
  pdfData: text("pdf_data"), // Base64 encoded PDF if imported
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Feature Management Tables
export const featureDefinitions = pgTable("feature_definitions", {
  id: varchar("id").primaryKey(), // e.g., "operations_center"
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // Operations, Admin, Content, Integrations, etc.
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const roleFeatureDefaults = pgTable("role_feature_defaults", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: roleEnum("role").notNull(),
  featureId: varchar("feature_id").notNull().references(() => featureDefinitions.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userFeatureOverrides = pgTable("user_feature_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  featureId: varchar("feature_id").notNull().references(() => featureDefinitions.id, { onDelete: "cascade" }),
  enabled: boolean("enabled"), // null = use role default, true/false = override
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const globalFeatureFlags = pgTable("global_feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  featureId: varchar("feature_id").notNull().unique().references(() => featureDefinitions.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").default(true).notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by"), // email of Super Admin who made change
});

export const featureDefinitionsRelations = relations(featureDefinitions, ({ many, one }) => ({
  roleDefaults: many(roleFeatureDefaults),
  userOverrides: many(userFeatureOverrides),
  globalFlag: one(globalFeatureFlags, {
    fields: [featureDefinitions.id],
    references: [globalFeatureFlags.featureId],
  }),
}));

export const roleFeatureDefaultsRelations = relations(roleFeatureDefaults, ({ one }) => ({
  feature: one(featureDefinitions, {
    fields: [roleFeatureDefaults.featureId],
    references: [featureDefinitions.id],
  }),
}));

export const userFeatureOverridesRelations = relations(userFeatureOverrides, ({ one }) => ({
  user: one(users, {
    fields: [userFeatureOverrides.userId],
    references: [users.id],
  }),
  feature: one(featureDefinitions, {
    fields: [userFeatureOverrides.featureId],
    references: [featureDefinitions.id],
  }),
}));

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  attempts: many(attempts),
  progress: many(userProgress),
  createdInvites: many(invites),
  certificates: many(certificates),
  scenarioAttempts: many(scenarioAttempts),
  learningPaths: many(learningPaths),
  widgetLocations: many(widgetLocations),
  widgetPreferences: one(widgetPreferences),
  navigationWaypoints: many(navigationWaypoints),
  navigationRoutes: many(navigationRoutes),
  medicalFacilitySelections: many(userMedicalFacilitySelections),
  diveTeamMembers: many(diveTeamMembers),
  diveOperations: many(diveOperations),
  dailyProjectReports: many(dailyProjectReports),
  featureOverrides: many(userFeatureOverrides),
}));

export const aiTutorsRelations = relations(aiTutors, ({ many }) => ({
  tracks: many(tracks),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  createdBy: one(users, {
    fields: [invites.createdByUserId],
    references: [users.id],
  }),
}));

export const tracksRelations = relations(tracks, ({ one, many }) => ({
  lessons: many(lessons),
  aiTutor: one(aiTutors, {
    fields: [tracks.aiTutorId],
    references: [aiTutors.id],
  }),
  certificates: many(certificates),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  track: one(tracks, {
    fields: [lessons.trackId],
    references: [tracks.id],
  }),
  quizzes: many(quizzes),
  progress: many(userProgress),
  practiceScenarios: many(practiceScenarios),
}));

export const practiceScenariosRelations = relations(practiceScenarios, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [practiceScenarios.lessonId],
    references: [lessons.id],
  }),
  attempts: many(scenarioAttempts),
}));

export const scenarioAttemptsRelations = relations(scenarioAttempts, ({ one }) => ({
  user: one(users, {
    fields: [scenarioAttempts.userId],
    references: [users.id],
  }),
  scenario: one(practiceScenarios, {
    fields: [scenarioAttempts.scenarioId],
    references: [practiceScenarios.id],
  }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, {
    fields: [certificates.userId],
    references: [users.id],
  }),
  track: one(tracks, {
    fields: [certificates.trackId],
    references: [tracks.id],
  }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  lesson: one(lessons, {
    fields: [quizzes.lessonId],
    references: [lessons.id],
  }),
  questions: many(questions),
  attempts: many(attempts),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [questions.quizId],
    references: [quizzes.id],
  }),
}));

export const attemptsRelations = relations(attempts, ({ one }) => ({
  user: one(users, {
    fields: [attempts.userId],
    references: [users.id],
  }),
  quiz: one(quizzes, {
    fields: [attempts.quizId],
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

// Dive Supervisor Control Relations
export const diveTeamMembersRelations = relations(diveTeamMembers, ({ one, many }) => ({
  user: one(users, {
    fields: [diveTeamMembers.userId],
    references: [users.id],
  }),
  operationsAsSupervisor: many(diveOperations),
  rosterAssignments: many(diveTeamRosters),
}));

export const diveOperationsRelations = relations(diveOperations, ({ one, many }) => ({
  user: one(users, {
    fields: [diveOperations.userId],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [diveOperations.clientId],
    references: [clients.id],
  }),
  supervisor: one(diveTeamMembers, {
    fields: [diveOperations.supervisorId],
    references: [diveTeamMembers.id],
  }),
  contacts: many(diveOperationContacts),
  permits: many(diveOperationPermits),
  rosters: many(diveTeamRosters),
  divePlans: many(divePlans),
  dailyProjectReports: many(dailyProjectReports),
  casEvacDrills: many(casEvacDrills),
  toolBoxTalks: many(toolBoxTalks),
  hazards: many(diveOperationHazards),
  welfareRecords: many(welfareRecords),
  shippingInfo: many(shippingInfo),
  ramsDocuments: many(ramsDocuments),
}));

export const diveOperationContactsRelations = relations(diveOperationContacts, ({ one }) => ({
  operation: one(diveOperations, {
    fields: [diveOperationContacts.operationId],
    references: [diveOperations.id],
  }),
}));

export const diveOperationPermitsRelations = relations(diveOperationPermits, ({ one }) => ({
  operation: one(diveOperations, {
    fields: [diveOperationPermits.operationId],
    references: [diveOperations.id],
  }),
}));

export const diveTeamRostersRelations = relations(diveTeamRosters, ({ one }) => ({
  operation: one(diveOperations, {
    fields: [diveTeamRosters.operationId],
    references: [diveOperations.id],
  }),
  teamMember: one(diveTeamMembers, {
    fields: [diveTeamRosters.teamMemberId],
    references: [diveTeamMembers.id],
  }),
}));

export const divePlansRelations = relations(divePlans, ({ one }) => ({
  operation: one(diveOperations, {
    fields: [divePlans.operationId],
    references: [diveOperations.id],
  }),
}));

export const dailyProjectReportsRelations = relations(dailyProjectReports, ({ one }) => ({
  operation: one(diveOperations, {
    fields: [dailyProjectReports.operationId],
    references: [diveOperations.id],
  }),
  creator: one(users, {
    fields: [dailyProjectReports.createdBy],
    references: [users.id],
  }),
}));

// Enhanced Dive Supervisor Control Relations
export const casEvacDrillsRelations = relations(casEvacDrills, ({ one }) => ({
  operation: one(diveOperations, {
    fields: [casEvacDrills.operationId],
    references: [diveOperations.id],
  }),
}));

export const toolBoxTalksRelations = relations(toolBoxTalks, ({ one }) => ({
  operation: one(diveOperations, {
    fields: [toolBoxTalks.operationId],
    references: [diveOperations.id],
  }),
}));

export const diveOperationHazardsRelations = relations(diveOperationHazards, ({ one }) => ({
  operation: one(diveOperations, {
    fields: [diveOperationHazards.operationId],
    references: [diveOperations.id],
  }),
}));

export const welfareRecordsRelations = relations(welfareRecords, ({ one }) => ({
  operation: one(diveOperations, {
    fields: [welfareRecords.operationId],
    references: [diveOperations.id],
  }),
}));

export const shippingInfoRelations = relations(shippingInfo, ({ one }) => ({
  operation: one(diveOperations, {
    fields: [shippingInfo.operationId],
    references: [diveOperations.id],
  }),
}));

export const ramsDocumentsRelations = relations(ramsDocuments, ({ one }) => ({
  operation: one(diveOperations, {
    fields: [ramsDocuments.operationId],
    references: [diveOperations.id],
  }),
  creator: one(users, {
    fields: [ramsDocuments.createdBy],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiTutorSchema = createInsertSchema(aiTutors).omit({
  id: true,
  createdAt: true,
});

export const insertPracticeScenarioSchema = createInsertSchema(practiceScenarios).omit({
  id: true,
  createdAt: true,
});

export const insertCertificateSchema = createInsertSchema(certificates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScenarioAttemptSchema = createInsertSchema(scenarioAttempts).omit({
  id: true,
  completedAt: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Dive Supervisor Control Insert Schemas
export const insertDiveTeamMemberSchema = createInsertSchema(diveTeamMembers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiveOperationSchema = createInsertSchema(diveOperations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiveOperationContactSchema = createInsertSchema(diveOperationContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiveOperationPermitSchema = createInsertSchema(diveOperationPermits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiveTeamRosterSchema = createInsertSchema(diveTeamRosters).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDivePlanSchema = createInsertSchema(divePlans).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDailyProjectReportSchema = createInsertSchema(dailyProjectReports).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Enhanced Dive Supervisor Control Insert Schemas
export const insertCasEvacDrillSchema = createInsertSchema(casEvacDrills).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertToolBoxTalkSchema = createInsertSchema(toolBoxTalks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiveOperationHazardSchema = createInsertSchema(diveOperationHazards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWelfareRecordSchema = createInsertSchema(welfareRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShippingInfoSchema = createInsertSchema(shippingInfo).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRamsDocumentSchema = createInsertSchema(ramsDocuments).omit({
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
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
});

export const insertAttemptSchema = createInsertSchema(attempts).omit({
  id: true,
  completedAt: true,
});

export const insertInviteSchema = createInsertSchema(invites).omit({
  id: true,
  createdAt: true,
  usedAt: true,
});

export const insertFeatureDefinitionSchema = createInsertSchema(featureDefinitions).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertRoleFeatureDefaultSchema = createInsertSchema(roleFeatureDefaults).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserFeatureOverrideSchema = createInsertSchema(userFeatureOverrides).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGlobalFeatureFlagSchema = createInsertSchema(globalFeatureFlags).omit({
  id: true,
  updatedAt: true,
});

// ============================================
// FEATURE UPDATE LOG - Track all feature deployments
// ============================================
export const featureUpdateStatusEnum = pgEnum("feature_update_status", ["PLANNED", "IN_PROGRESS", "TESTING", "DEPLOYED", "ROLLED_BACK"]);
export const featureUpdateCategoryEnum = pgEnum("feature_update_category", ["FEATURE", "BUGFIX", "ENHANCEMENT", "SECURITY", "PERFORMANCE", "UI_UX"]);

export const featureUpdateLog = pgTable("feature_update_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: featureUpdateCategoryEnum("category").default("FEATURE").notNull(),
  status: featureUpdateStatusEnum("status").default("DEPLOYED").notNull(),
  version: text("version"), // e.g., "1.0.3"
  commitHash: text("commit_hash"),
  pullRequestUrl: text("pull_request_url"),
  affectedComponents: json("affected_components").default([]), // Array of component names
  technicalDetails: text("technical_details"),
  breakingChanges: boolean("breaking_changes").default(false).notNull(),
  deployedBy: varchar("deployed_by").references(() => users.id),
  plannedAt: timestamp("planned_at"),
  startedAt: timestamp("started_at"),
  testedAt: timestamp("tested_at"),
  deployedAt: timestamp("deployed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFeatureUpdateLogSchema = createInsertSchema(featureUpdateLog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ============================================
// SMART BUILD SYSTEM - Strategic App Building
// ============================================
export const smartBuildPhaseEnum = pgEnum("smart_build_phase", ["PLANNING", "EXECUTION", "TESTING", "COMPLETE", "ON_HOLD"]);
export const smartBuildPriorityEnum = pgEnum("smart_build_priority", ["CRITICAL", "HIGH", "MEDIUM", "LOW"]);

export const smartBuildProjects = pgTable("smart_build_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  targetPlatform: text("target_platform").notNull(), // web, mobile, desktop, api
  currentPhase: smartBuildPhaseEnum("current_phase").default("PLANNING").notNull(),
  overallProgress: integer("overall_progress").default(0).notNull(), // 0-100
  estimatedCost: integer("estimated_cost"), // in cents
  actualCost: integer("actual_cost"), // in cents
  costSavings: integer("cost_savings"), // calculated savings
  startDate: timestamp("start_date"),
  targetDate: timestamp("target_date"),
  completedDate: timestamp("completed_date"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const smartBuildFeatures = pgTable("smart_build_features", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => smartBuildProjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull(),
  priority: smartBuildPriorityEnum("priority").default("MEDIUM").notNull(),
  phase: smartBuildPhaseEnum("phase").default("PLANNING").notNull(),
  order: integer("order").default(0).notNull(),
  // PLAN phase
  planDetails: text("plan_details"),
  planApprovedAt: timestamp("plan_approved_at"),
  planApprovedBy: varchar("plan_approved_by").references(() => users.id),
  // EXECUTE phase
  executionNotes: text("execution_notes"),
  codeChanges: json("code_changes").default([]), // Array of file paths changed
  executionStartedAt: timestamp("execution_started_at"),
  executionCompletedAt: timestamp("execution_completed_at"),
  // TEST phase
  testCases: json("test_cases").default([]), // Array of test descriptions
  testResults: json("test_results").default([]), // Array of test results
  testPassRate: integer("test_pass_rate"), // 0-100
  testStartedAt: timestamp("test_started_at"),
  testCompletedAt: timestamp("test_completed_at"),
  // Metrics
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  costEstimate: integer("cost_estimate"), // in cents
  actualCost: integer("actual_cost"), // in cents
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const smartBuildLogs = pgTable("smart_build_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").references(() => smartBuildProjects.id, { onDelete: "cascade" }),
  featureId: varchar("feature_id").references(() => smartBuildFeatures.id, { onDelete: "cascade" }),
  action: text("action").notNull(), // PLAN_CREATED, EXECUTION_STARTED, TEST_PASSED, etc.
  details: text("details"),
  metadata: json("metadata").default({}),
  performedBy: varchar("performed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
export type Attempt = typeof attempts.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Invite = typeof invites.$inferSelect;
export type InsertInvite = z.infer<typeof insertInviteSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type AiTutor = typeof aiTutors.$inferSelect;
export type InsertAiTutor = z.infer<typeof insertAiTutorSchema>;
export type PracticeScenario = typeof practiceScenarios.$inferSelect;
export type InsertPracticeScenario = z.infer<typeof insertPracticeScenarioSchema>;
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type ScenarioAttempt = typeof scenarioAttempts.$inferSelect;
export type InsertScenarioAttempt = z.infer<typeof insertScenarioAttemptSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;
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

// Dive Supervisor Control Types
export type DiveTeamMember = typeof diveTeamMembers.$inferSelect;
export type InsertDiveTeamMember = z.infer<typeof insertDiveTeamMemberSchema>;
export type DiveOperation = typeof diveOperations.$inferSelect;
export type InsertDiveOperation = z.infer<typeof insertDiveOperationSchema>;
export type DiveOperationContact = typeof diveOperationContacts.$inferSelect;
export type InsertDiveOperationContact = z.infer<typeof insertDiveOperationContactSchema>;
export type DiveOperationPermit = typeof diveOperationPermits.$inferSelect;
export type InsertDiveOperationPermit = z.infer<typeof insertDiveOperationPermitSchema>;
export type DiveTeamRoster = typeof diveTeamRosters.$inferSelect;
export type InsertDiveTeamRoster = z.infer<typeof insertDiveTeamRosterSchema>;
export type DivePlan = typeof divePlans.$inferSelect;
export type InsertDivePlan = z.infer<typeof insertDivePlanSchema>;
export type DailyProjectReport = typeof dailyProjectReports.$inferSelect;
export type InsertDailyProjectReport = z.infer<typeof insertDailyProjectReportSchema>;

// Enhanced Dive Supervisor Control Types
export type CasEvacDrill = typeof casEvacDrills.$inferSelect;
export type InsertCasEvacDrill = z.infer<typeof insertCasEvacDrillSchema>;
export type ToolBoxTalk = typeof toolBoxTalks.$inferSelect;
export type InsertToolBoxTalk = z.infer<typeof insertToolBoxTalkSchema>;
export type DiveOperationHazard = typeof diveOperationHazards.$inferSelect;
export type InsertDiveOperationHazard = z.infer<typeof insertDiveOperationHazardSchema>;
export type WelfareRecord = typeof welfareRecords.$inferSelect;
export type InsertWelfareRecord = z.infer<typeof insertWelfareRecordSchema>;
export type ShippingInfo = typeof shippingInfo.$inferSelect;
export type InsertShippingInfo = z.infer<typeof insertShippingInfoSchema>;
export type RamsDocument = typeof ramsDocuments.$inferSelect;
export type InsertRamsDocument = z.infer<typeof insertRamsDocumentSchema>;
export type FeatureDefinition = typeof featureDefinitions.$inferSelect;
export type InsertFeatureDefinition = z.infer<typeof insertFeatureDefinitionSchema>;
export type RoleFeatureDefault = typeof roleFeatureDefaults.$inferSelect;
export type InsertRoleFeatureDefault = z.infer<typeof insertRoleFeatureDefaultSchema>;
export type UserFeatureOverride = typeof userFeatureOverrides.$inferSelect;
export type InsertUserFeatureOverride = z.infer<typeof insertUserFeatureOverrideSchema>;
export type GlobalFeatureFlag = typeof globalFeatureFlags.$inferSelect;
export type InsertGlobalFeatureFlag = z.infer<typeof insertGlobalFeatureFlagSchema>;

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
