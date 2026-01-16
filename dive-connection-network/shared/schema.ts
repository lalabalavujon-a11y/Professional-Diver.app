/**
 * Dive Connection Network - Database Schema
 * 
 * Schema for the Dive Connection Network platform that connects
 * divers, dive companies, and service providers.
 * 
 * This schema is designed to work alongside the Professional Diver Training app
 * with shared authentication and subscription management.
 */

import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const networkEntityTypeEnum = pgEnum("network_entity_type", ["DIVER", "COMPANY", "SERVICE_PROVIDER"]);
export const connectionStatusEnum = pgEnum("connection_status", ["PENDING", "ACCEPTED", "REJECTED", "BLOCKED"]);
export const messageStatusEnum = pgEnum("message_status", ["SENT", "DELIVERED", "READ"]);
export const jobStatusEnum = pgEnum("job_status", ["DRAFT", "ACTIVE", "PAUSED", "FILLED", "EXPIRED", "CANCELLED"]);
export const applicationStatusEnum = pgEnum("application_status", ["PENDING", "REVIEWED", "SHORTLISTED", "REJECTED", "ACCEPTED", "WITHDRAWN"]);

/**
 * Network Users Table
 * Links to Training app users via email or userId
 */
export const networkUsers = pgTable("network_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  trainingUserId: varchar("training_user_id"), // FK to Training app users.id (optional for now)
  entityType: networkEntityTypeEnum("entity_type").notNull(),
  tier: networkEntityTypeEnum("tier").notNull(), // DIVER, COMPANY, or SERVICE_PROVIDER
  subscriptionStatus: text("subscription_status", { enum: ["ACTIVE", "PAUSED", "CANCELLED"] }).default("ACTIVE").notNull(),
  profileComplete: boolean("profile_complete").default(false).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  lastActiveAt: timestamp("last_active_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Diver Profiles Table
 */
export const diverProfiles = pgTable("diver_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => networkUsers.id, { onDelete: "cascade" }).unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  location: text("location"), // City, Country
  latitude: real("latitude"),
  longitude: real("longitude"),
  certifications: json("certifications").default([]), // Array of certification objects
  experience: integer("experience_years"), // Years of experience
  specialties: json("specialties").default([]), // Array of specialty strings
  hourlyRate: integer("hourly_rate"), // In cents
  availability: text("availability", { enum: ["AVAILABLE", "BUSY", "UNAVAILABLE"] }).default("AVAILABLE"),
  portfolio: json("portfolio").default([]), // Array of portfolio items
  resumeUrl: text("resume_url"),
  profileImageUrl: text("profile_image_url"),
  rating: real("rating").default(0), // Average rating 0-5
  reviewCount: integer("review_count").default(0),
  connectionCount: integer("connection_count").default(0),
  jobApplicationCount: integer("job_application_count").default(0),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Company Profiles Table
 */
export const companyProfiles = pgTable("company_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => networkUsers.id, { onDelete: "cascade" }).unique(),
  companyName: text("company_name").notNull(),
  legalName: text("legal_name"),
  industry: text("industry"), // e.g., "Commercial Diving", "Marine Construction"
  description: text("description"),
  location: text("location"), // Headquarters location
  latitude: real("latitude"),
  longitude: real("longitude"),
  website: text("website"),
  logoUrl: text("logo_url"),
  employeeCount: text("employee_count"), // e.g., "10-50", "50-200"
  foundedYear: integer("founded_year"),
  specialties: json("specialties").default([]), // Array of specialty strings
  certifications: json("certifications").default([]), // Company certifications
  activeJobPostings: integer("active_job_postings").default(0),
  totalJobPostings: integer("total_job_postings").default(0),
  rating: real("rating").default(0), // Average rating 0-5
  reviewCount: integer("review_count").default(0),
  isPublic: boolean("is_public").default(true).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Service Provider Profiles Table
 */
export const serviceProviderProfiles = pgTable("service_provider_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => networkUsers.id, { onDelete: "cascade" }).unique(),
  businessName: text("business_name").notNull(),
  legalName: text("legal_name"),
  description: text("description"),
  services: json("services").default([]), // Array of service objects
  serviceCategories: json("service_categories").default([]), // Array of category strings
  location: text("location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  website: text("website"),
  logoUrl: text("logo_url"),
  certifications: json("certifications").default([]),
  portfolio: json("portfolio").default([]),
  pricing: json("pricing").default({}), // Pricing structure object
  availability: text("availability", { enum: ["AVAILABLE", "BUSY", "UNAVAILABLE"] }).default("AVAILABLE"),
  rating: real("rating").default(0),
  reviewCount: integer("review_count").default(0),
  connectionCount: integer("connection_count").default(0),
  isPublic: boolean("is_public").default(true).notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(), // Premium placement
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Job Postings Table
 */
export const jobPostings = pgTable("job_postings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: varchar("company_id").notNull().references(() => companyProfiles.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull(),
  requirements: json("requirements").default([]), // Array of requirement strings
  certifications: json("certifications").default([]), // Required certifications
  location: text("location").notNull(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  salaryMin: integer("salary_min"), // In cents
  salaryMax: integer("salary_max"), // In cents
  salaryCurrency: text("salary_currency").default("USD"),
  employmentType: text("employment_type", { enum: ["FULL_TIME", "PART_TIME", "CONTRACT", "TEMPORARY"] }),
  status: jobStatusEnum("status").default("DRAFT").notNull(),
  applicationCount: integer("application_count").default(0),
  viewCount: integer("view_count").default(0),
  isFeatured: boolean("is_featured").default(false).notNull(),
  postedAt: timestamp("posted_at"),
  expiresAt: timestamp("expires_at"),
  filledAt: timestamp("filled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Job Applications Table
 */
export const jobApplications = pgTable("job_applications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobId: varchar("job_id").notNull().references(() => jobPostings.id, { onDelete: "cascade" }),
  diverId: varchar("diver_id").notNull().references(() => diverProfiles.id, { onDelete: "cascade" }),
  coverLetter: text("cover_letter"),
  resumeUrl: text("resume_url"),
  status: applicationStatusEnum("status").default("PENDING").notNull(),
  appliedAt: timestamp("applied_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Connections Table
 * Network connections between users
 */
export const connections = pgTable("connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => networkUsers.id, { onDelete: "cascade" }),
  toUserId: varchar("to_user_id").notNull().references(() => networkUsers.id, { onDelete: "cascade" }),
  connectionType: text("connection_type", { enum: ["DIVER_TO_DIVER", "DIVER_TO_COMPANY", "COMPANY_TO_DIVER", "DIVER_TO_PROVIDER", "PROVIDER_TO_DIVER", "COMPANY_TO_PROVIDER", "PROVIDER_TO_COMPANY"] }).notNull(),
  status: connectionStatusEnum("status").default("PENDING").notNull(),
  message: text("message"), // Optional connection message
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Messages Table
 * Direct messaging between users
 */
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => networkUsers.id, { onDelete: "cascade" }),
  toUserId: varchar("to_user_id").notNull().references(() => networkUsers.id, { onDelete: "cascade" }),
  conversationId: varchar("conversation_id"), // Group messages in conversations
  content: text("content").notNull(),
  status: messageStatusEnum("status").default("SENT").notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Reviews Table
 * Reviews and ratings between users
 */
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewerId: varchar("reviewer_id").notNull().references(() => networkUsers.id, { onDelete: "cascade" }),
  revieweeId: varchar("reviewee_id").notNull().references(() => networkUsers.id, { onDelete: "cascade" }),
  reviewType: text("review_type", { enum: ["DIVER_REVIEW", "COMPANY_REVIEW", "PROVIDER_REVIEW", "JOB_REVIEW"] }).notNull(),
  rating: integer("rating").notNull(), // 1-5
  title: text("title"),
  content: text("content"),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Network Subscriptions Table
 * Tracks Network-specific subscription data (synced with Training app)
 */
export const networkSubscriptions = pgTable("network_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => networkUsers.id, { onDelete: "cascade" }).unique(),
  tier: networkEntityTypeEnum("tier").notNull(),
  trainingSubscriptionId: varchar("training_subscription_id"), // Reference to Training app subscription
  stripeSubscriptionId: text("stripe_subscription_id"), // Stripe subscription ID (shared with Training)
  status: text("status", { enum: ["ACTIVE", "PAUSED", "CANCELLED"] }).default("ACTIVE").notNull(),
  syncedAt: timestamp("synced_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const networkUsersRelations = relations(networkUsers, ({ one, many }) => ({
  diverProfile: one(diverProfiles),
  companyProfile: one(companyProfiles),
  serviceProviderProfile: one(serviceProviderProfiles),
  subscription: one(networkSubscriptions),
  connectionsFrom: many(connections, { relationName: "fromUser" }),
  connectionsTo: many(connections, { relationName: "toUser" }),
  messagesFrom: many(messages, { relationName: "fromUser" }),
  messagesTo: many(messages, { relationName: "toUser" }),
  reviewsGiven: many(reviews, { relationName: "reviewer" }),
  reviewsReceived: many(reviews, { relationName: "reviewee" }),
}));

export const diverProfilesRelations = relations(diverProfiles, ({ one, many }) => ({
  user: one(networkUsers, {
    fields: [diverProfiles.userId],
    references: [networkUsers.id],
  }),
  jobApplications: many(jobApplications),
}));

export const companyProfilesRelations = relations(companyProfiles, ({ one, many }) => ({
  user: one(networkUsers, {
    fields: [companyProfiles.userId],
    references: [networkUsers.id],
  }),
  jobPostings: many(jobPostings),
}));

export const serviceProviderProfilesRelations = relations(serviceProviderProfiles, ({ one }) => ({
  user: one(networkUsers, {
    fields: [serviceProviderProfiles.userId],
    references: [networkUsers.id],
  }),
}));

export const jobPostingsRelations = relations(jobPostings, ({ one, many }) => ({
  company: one(companyProfiles, {
    fields: [jobPostings.companyId],
    references: [companyProfiles.id],
  }),
  applications: many(jobApplications),
}));

export const jobApplicationsRelations = relations(jobApplications, ({ one }) => ({
  job: one(jobPostings, {
    fields: [jobApplications.jobId],
    references: [jobPostings.id],
  }),
  diver: one(diverProfiles, {
    fields: [jobApplications.diverId],
    references: [diverProfiles.id],
  }),
}));

export const connectionsRelations = relations(connections, ({ one }) => ({
  fromUser: one(networkUsers, {
    fields: [connections.fromUserId],
    references: [networkUsers.id],
    relationName: "fromUser",
  }),
  toUser: one(networkUsers, {
    fields: [connections.toUserId],
    references: [networkUsers.id],
    relationName: "toUser",
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  fromUser: one(networkUsers, {
    fields: [messages.fromUserId],
    references: [networkUsers.id],
    relationName: "fromUser",
  }),
  toUser: one(networkUsers, {
    fields: [messages.toUserId],
    references: [networkUsers.id],
    relationName: "toUser",
  }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  reviewer: one(networkUsers, {
    fields: [reviews.reviewerId],
    references: [networkUsers.id],
    relationName: "reviewer",
  }),
  reviewee: one(networkUsers, {
    fields: [reviews.revieweeId],
    references: [networkUsers.id],
    relationName: "reviewee",
  }),
}));

export const networkSubscriptionsRelations = relations(networkSubscriptions, ({ one }) => ({
  user: one(networkUsers, {
    fields: [networkSubscriptions.userId],
    references: [networkUsers.id],
  }),
}));

// Insert Schemas
export const insertNetworkUserSchema = createInsertSchema(networkUsers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiverProfileSchema = createInsertSchema(diverProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCompanyProfileSchema = createInsertSchema(companyProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceProviderProfileSchema = createInsertSchema(serviceProviderProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({
  id: true,
  appliedAt: true,
  updatedAt: true,
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNetworkSubscriptionSchema = createInsertSchema(networkSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type NetworkUser = typeof networkUsers.$inferSelect;
export type InsertNetworkUser = z.infer<typeof insertNetworkUserSchema>;
export type DiverProfile = typeof diverProfiles.$inferSelect;
export type InsertDiverProfile = z.infer<typeof insertDiverProfileSchema>;
export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;
export type ServiceProviderProfile = typeof serviceProviderProfiles.$inferSelect;
export type InsertServiceProviderProfile = z.infer<typeof insertServiceProviderProfileSchema>;
export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type Connection = typeof connections.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type NetworkSubscription = typeof networkSubscriptions.$inferSelect;
export type InsertNetworkSubscription = z.infer<typeof insertNetworkSubscriptionSchema>;
