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
  password: text("password"), // Hashed password (nullable for OAuth users)
  role: text("role", { enum: ["USER", "ADMIN", "SUPER_ADMIN", "PARTNER_ADMIN", "LIFETIME", "AFFILIATE"] }).default("USER").notNull(),
  subscriptionType: text("subscription_type", { enum: ["TRIAL", "MONTHLY", "ANNUAL", "LIFETIME"] }).default("TRIAL").notNull(),
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

// Email campaign tracking to prevent duplicate sends
export const emailCampaigns = sqliteTable("email_campaigns", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  campaignType: text("campaign_type").notNull(), // 'follow_up', 'testimonial_promo', 'thank_you', etc.
  emailNumber: integer("email_number"), // For follow-up emails (1-7)
  sentAt: integer("sent_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  status: text("status").default("sent").notNull(), // 'sent', 'failed', 'bounced'
  metadata: text("metadata", { mode: "json" }), // Additional data like subscription type, engagement level, etc.
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Testimonials submitted by users
export const testimonials = sqliteTable("testimonials", {
  id: text("id").primaryKey().$defaultFn(generateId),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  name: text("name"),
  writtenTestimonial: text("written_testimonial"),
  videoUrl: text("video_url"), // URL to uploaded video
  videoStoragePath: text("video_storage_path"), // Path in object storage
  status: text("status").default("pending").notNull(), // 'pending', 'approved', 'rejected', 'featured'
  freeMonthAwarded: integer("free_month_awarded", { mode: "boolean" }).default(false),
  freeMonthAwardedAt: integer("free_month_awarded_at", { mode: "timestamp" }),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  approvedBy: text("approved_by").references(() => users.id),
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
  // Media content fields - stored as JSON strings
  videos: text("videos").default("[]"), // JSON array of { id, title, url, description, duration, thumbnail, order }
  documents: text("documents").default("[]"), // JSON array of { id, title, url, type, size, description, order }
  embeds: text("embeds").default("[]"), // JSON array of { id, type, url, title, description, order } - YouTube, Vimeo, etc.
  links: text("links").default("[]"), // JSON array of { id, url, title, description, order }
  images: text("images").default("[]"), // JSON array of { id, url, alt, caption, order }
  audio: text("audio").default("[]"), // JSON array of { id, url, title, description, duration, order }
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
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  subscriptionType: text("subscription_type", { enum: ["TRIAL", "MONTHLY", "ANNUAL", "LIFETIME"] }).default("TRIAL").notNull(),
  status: text("status", { enum: ["ACTIVE", "PAUSED", "CANCELLED"] }).default("ACTIVE").notNull(),
  subscriptionDate: integer("subscription_date", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  monthlyRevenue: integer("monthly_revenue").default(0), // in cents
  notes: text("notes"),
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

export const clientsRelations = relations(clients, ({}) => ({}));

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
