import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["USER", "ADMIN", "SUPER_ADMIN", "PARTNER_ADMIN", "LIFETIME", "AFFILIATE"]);
export const questionTypeEnum = pgEnum("question_type", ["MULTIPLE_CHOICE", "TRUE_FALSE", "SHORT_ANSWER"]);
export const examTypeEnum = pgEnum("exam_type", ["QUIZ", "EXAM", "PRACTICE"]);
export const certificationStatusEnum = pgEnum("certification_status", ["NOT_STARTED", "IN_PROGRESS", "COMPLETED", "EXPIRED"]);
export const subscriptionTypeEnum = pgEnum("subscription_type", ["TRIAL", "MONTHLY", "ANNUAL", "LIFETIME"]);
export const clientStatusEnum = pgEnum("client_status", ["ACTIVE", "PAUSED", "CANCELLED"]);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name"),
  password: text("password"), // Hashed password (nullable for OAuth users)
  role: roleEnum("role").default("USER").notNull(),
  subscriptionType: subscriptionTypeEnum("subscription_type").default("TRIAL").notNull(),
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

// Email campaign tracking to prevent duplicate sends
export const emailCampaigns = pgTable("email_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  campaignType: text("campaign_type").notNull(), // 'follow_up', 'testimonial_promo', 'thank_you', etc.
  emailNumber: integer("email_number"), // For follow-up emails (1-7)
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  status: text("status").default("sent").notNull(), // 'sent', 'failed', 'bounced'
  metadata: json("metadata"), // Additional data like subscription type, engagement level, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Testimonials submitted by users
export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name"),
  writtenTestimonial: text("written_testimonial"),
  videoUrl: text("video_url"), // URL to uploaded video
  videoStoragePath: text("video_storage_path"), // Path in object storage
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected', 'featured'
  freeMonthAwarded: boolean("free_month_awarded").default(false),
  freeMonthAwardedAt: timestamp("free_month_awarded_at"),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
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
  // Media content fields - stored as JSON arrays
  videos: json("videos").default([]), // Array of { id, title, url, description, duration, thumbnail, order }
  documents: json("documents").default([]), // Array of { id, title, url, type, size, description, order }
  embeds: json("embeds").default([]), // Array of { id, type, url, title, description, order } - YouTube, Vimeo, etc.
  links: json("links").default([]), // Array of { id, url, title, description, order }
  images: json("images").default([]), // Array of { id, url, alt, caption, order }
  audio: json("audio").default([]), // Array of { id, url, title, description, duration, order }
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

export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  subscriptionType: subscriptionTypeEnum("subscription_type").default("TRIAL").notNull(),
  status: clientStatusEnum("status").default("ACTIVE").notNull(),
  subscriptionDate: timestamp("subscription_date").defaultNow().notNull(),
  monthlyRevenue: integer("monthly_revenue").default(0).notNull(), // Revenue in cents (e.g., 2500 for $25.00)
  notes: text("notes"),
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

// Behavior Analytics Tables
export const userBehaviorEvents = pgTable("user_behavior_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(), // 'page_view', 'click', 'action', 'error', 'performance', 'engagement'
  eventCategory: text("event_category"), // 'navigation', 'content', 'quiz', 'admin', 'dashboard'
  eventName: text("event_name").notNull(), // Specific event name
  pagePath: text("page_path"), // URL path
  metadata: json("metadata").default({}), // Additional event data
  sessionId: text("session_id"), // Session identifier
  userAgent: text("user_agent"), // Browser/client info
  ipAddress: text("ip_address"), // User IP (hashed for privacy)
  duration: integer("duration"), // Time spent in milliseconds
  performance: json("performance").default({}), // Performance metrics
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const behaviorInsights = pgTable("behavior_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  insightType: text("insight_type").notNull(), // 'performance', 'usability', 'engagement', 'error', 'recommendation'
  category: text("category").notNull(), // 'whats_working', 'needs_improvement', 'critical_issue', 'opportunity'
  title: text("title").notNull(),
  description: text("description").notNull(),
  severity: text("severity").default("medium"), // 'low', 'medium', 'high', 'critical'
  affectedUsers: integer("affected_users").default(0),
  impact: text("impact"), // Description of impact
  recommendations: json("recommendations").default([]), // Array of improvement recommendations
  metrics: json("metrics").default({}), // Supporting metrics/data
  status: text("status").default("active"), // 'active', 'resolved', 'archived'
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const behaviorAnalytics = pgTable("behavior_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: timestamp("date").defaultNow().notNull(),
  metricType: text("metric_type").notNull(), // 'daily_summary', 'user_engagement', 'performance', 'error_rate'
  metricData: json("metric_data").notNull(), // Aggregated metric data
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  attempts: many(attempts),
  progress: many(userProgress),
  createdInvites: many(invites),
  certificates: many(certificates),
  scenarioAttempts: many(scenarioAttempts),
  learningPaths: many(learningPaths),
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

export const userBehaviorEventsRelations = relations(userBehaviorEvents, ({ one }) => ({
  user: one(users, {
    fields: [userBehaviorEvents.userId],
    references: [users.id],
  }),
}));

export const behaviorInsightsRelations = relations(behaviorInsights, ({ one }) => ({
  resolvedByUser: one(users, {
    fields: [behaviorInsights.resolvedBy],
    references: [users.id],
  }),
}));

export const behaviorAnalyticsRelations = relations(behaviorAnalytics, ({ one }) => ({
  user: one(users, {
    fields: [behaviorAnalytics.userId],
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

export const insertTrackSchema = createInsertSchema(tracks).omit({
  id: true,
  createdAt: true,
});

// Base schema from drizzle
const baseInsertLessonSchema = createInsertSchema(lessons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Override JSON fields to accept arrays/objects properly
// drizzle-zod may generate schemas that don't handle JSON columns correctly
export const insertLessonSchema = baseInsertLessonSchema.extend({
  videos: z.any().optional(),
  documents: z.any().optional(),
  embeds: z.any().optional(),
  links: z.any().optional(),
  images: z.any().optional(),
  audio: z.any().optional(),
  objectives: z.any().optional(),
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
export type UserBehaviorEvent = typeof userBehaviorEvents.$inferSelect;
export type BehaviorInsight = typeof behaviorInsights.$inferSelect;
export type BehaviorAnalytic = typeof behaviorAnalytics.$inferSelect;
