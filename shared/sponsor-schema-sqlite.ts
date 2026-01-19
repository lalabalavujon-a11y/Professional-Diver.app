import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { nanoid } from "nanoid";

// Helper function to generate UUIDs for SQLite
const generateId = () => nanoid();

// Sponsors table
export const sponsors = sqliteTable("sponsors", {
  id: text("id").primaryKey().$defaultFn(generateId),
  companyName: text("company_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactName: text("contact_name"),
  category: text("category"), // e.g., "helmets", "suits", "contractor", "training", "insurance"
  tier: text("tier", { enum: ["BRONZE", "SILVER", "GOLD", "TITLE", "FOUNDING"] }).default("BRONZE").notNull(),
  status: text("status", { enum: ["PENDING", "ACTIVE", "INACTIVE", "CANCELLED"] }).default("PENDING").notNull(),
  exclusivityCategory: text("exclusivity_category"), // Category for exclusivity (null if no exclusivity)
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  monthlyFee: integer("monthly_fee").default(0).notNull(), // in pence/cents
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  landingUrl: text("landing_url"), // Sponsor's landing page URL
  description: text("description"), // Short description for display
  promoCode: text("promo_code"), // Optional promo code for tracking
  ctaText: text("cta_text"), // CTA button text (e.g., "Get 10% off", "Book a demo")
  notes: text("notes"), // Internal notes
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Sponsor placements table
export const sponsorPlacements = sqliteTable("sponsor_placements", {
  id: text("id").primaryKey().$defaultFn(generateId),
  sponsorId: text("sponsor_id").notNull().references(() => sponsors.id, { onDelete: "cascade" }),
  placementType: text("placement_type", {
    enum: ["HOMEPAGE_STRIP", "ABOVE_FOLD", "IN_APP_TILE", "RESOURCE_PAGE", "PARTNER_DIRECTORY", "FEATURED_PARTNER"]
  }).notNull(),
  placementLocation: text("placement_location"), // Specific location identifier
  order: integer("order").default(0).notNull(), // Display order
  isActive: integer("is_active", { mode: "boolean" }).default(true).notNull(),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  metadata: text("metadata", { mode: "json" }), // Additional placement-specific data
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Sponsor assets table
export const sponsorAssets = sqliteTable("sponsor_assets", {
  id: text("id").primaryKey().$defaultFn(generateId),
  sponsorId: text("sponsor_id").notNull().references(() => sponsors.id, { onDelete: "cascade" }),
  assetType: text("asset_type", { enum: ["LOGO", "DESCRIPTION", "CTA_TEXT", "BRAND_GUIDELINES"] }).notNull(),
  assetUrl: text("asset_url"), // URL to uploaded asset
  assetData: text("asset_data", { mode: "json" }), // Additional asset metadata
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Sponsor events table (tracking)
export const sponsorEvents = sqliteTable("sponsor_events", {
  id: text("id").primaryKey().$defaultFn(generateId),
  sponsorId: text("sponsor_id").notNull().references(() => sponsors.id, { onDelete: "cascade" }),
  placementId: text("placement_id").references(() => sponsorPlacements.id, { onDelete: "set null" }),
  eventType: text("event_type", { enum: ["IMPRESSION", "CLICK", "CTA_CLICK", "CONVERSION"] }).notNull(),
  userId: text("user_id"), // Optional: user who triggered event
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  metadata: text("metadata", { mode: "json" }), // Additional event data
  timestamp: integer("timestamp", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Sponsor reports table
export const sponsorReports = sqliteTable("sponsor_reports", {
  id: text("id").primaryKey().$defaultFn(generateId),
  sponsorId: text("sponsor_id").notNull().references(() => sponsors.id, { onDelete: "cascade" }),
  reportMonth: text("report_month").notNull(), // Format: "YYYY-MM"
  impressions: integer("impressions").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  ctr: real("ctr").default(0).notNull(), // Click-through rate (percentage)
  ctaConversions: integer("cta_conversions").default(0).notNull(),
  placementBreakdown: text("placement_breakdown", { mode: "json" }), // Breakdown by placement type
  generatedAt: integer("generated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  sentAt: integer("sent_at", { mode: "timestamp" }), // When report was emailed to sponsor
  reportData: text("report_data", { mode: "json" }), // Full report data (for PDF generation)
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Sponsor inquiries table (for partner inquiry form submissions)
export const sponsorInquiries = sqliteTable("sponsor_inquiries", {
  id: text("id").primaryKey().$defaultFn(generateId),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  category: text("category"),
  budgetRange: text("budget_range"), // e.g., "£450-£800", "£800-£2,000"
  goals: text("goals"), // "awareness", "leads", "recruitment"
  message: text("message"),
  status: text("status").default("PENDING").notNull(), // PENDING, CONTACTED, CONVERTED, REJECTED
  notes: text("notes"), // Internal notes
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// Relations
export const sponsorsRelations = relations(sponsors, ({ many }) => ({
  placements: many(sponsorPlacements),
  assets: many(sponsorAssets),
  events: many(sponsorEvents),
  reports: many(sponsorReports),
}));

export const sponsorPlacementsRelations = relations(sponsorPlacements, ({ one, many }) => ({
  sponsor: one(sponsors, {
    fields: [sponsorPlacements.sponsorId],
    references: [sponsors.id],
  }),
  events: many(sponsorEvents),
}));

export const sponsorAssetsRelations = relations(sponsorAssets, ({ one }) => ({
  sponsor: one(sponsors, {
    fields: [sponsorAssets.sponsorId],
    references: [sponsors.id],
  }),
}));

export const sponsorEventsRelations = relations(sponsorEvents, ({ one }) => ({
  sponsor: one(sponsors, {
    fields: [sponsorEvents.sponsorId],
    references: [sponsors.id],
  }),
  placement: one(sponsorPlacements, {
    fields: [sponsorEvents.placementId],
    references: [sponsorPlacements.id],
  }),
}));

export const sponsorReportsRelations = relations(sponsorReports, ({ one }) => ({
  sponsor: one(sponsors, {
    fields: [sponsorReports.sponsorId],
    references: [sponsors.id],
  }),
}));

// Zod schemas for validation
export const insertSponsorSchema = createInsertSchema(sponsors);
export const insertSponsorPlacementSchema = createInsertSchema(sponsorPlacements);
export const insertSponsorAssetSchema = createInsertSchema(sponsorAssets);
export const insertSponsorEventSchema = createInsertSchema(sponsorEvents);
export const insertSponsorReportSchema = createInsertSchema(sponsorReports);
export const insertSponsorInquirySchema = createInsertSchema(sponsorInquiries);

// Type exports
export type Sponsor = typeof sponsors.$inferSelect;
export type NewSponsor = typeof sponsors.$inferInsert;
export type SponsorPlacement = typeof sponsorPlacements.$inferSelect;
export type NewSponsorPlacement = typeof sponsorPlacements.$inferInsert;
export type SponsorAsset = typeof sponsorAssets.$inferSelect;
export type NewSponsorAsset = typeof sponsorAssets.$inferInsert;
export type SponsorEvent = typeof sponsorEvents.$inferSelect;
export type NewSponsorEvent = typeof sponsorEvents.$inferInsert;
export type SponsorReport = typeof sponsorReports.$inferSelect;
export type NewSponsorReport = typeof sponsorReports.$inferInsert;
export type SponsorInquiry = typeof sponsorInquiries.$inferSelect;
export type NewSponsorInquiry = typeof sponsorInquiries.$inferInsert;
