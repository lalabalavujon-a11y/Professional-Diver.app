import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, pgEnum, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for sponsor system
export const sponsorTierEnum = pgEnum("sponsor_tier", ["BRONZE", "SILVER", "GOLD", "TITLE", "FOUNDING"]);
export const sponsorStatusEnum = pgEnum("sponsor_status", ["PENDING", "ACTIVE", "INACTIVE", "CANCELLED"]);
export const placementTypeEnum = pgEnum("placement_type", [
  "HOMEPAGE_STRIP",
  "ABOVE_FOLD",
  "IN_APP_TILE",
  "RESOURCE_PAGE",
  "PARTNER_DIRECTORY",
  "FEATURED_PARTNER"
]);
export const assetTypeEnum = pgEnum("asset_type", ["LOGO", "DESCRIPTION", "CTA_TEXT", "BRAND_GUIDELINES"]);
export const eventTypeEnum = pgEnum("event_type", ["IMPRESSION", "CLICK", "CTA_CLICK", "CONVERSION"]);

// Sponsors table
export const sponsors = pgTable("sponsors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactName: text("contact_name"),
  category: text("category"), // e.g., "helmets", "suits", "contractor", "training", "insurance"
  tier: sponsorTierEnum("tier").default("BRONZE").notNull(),
  status: sponsorStatusEnum("status").default("PENDING").notNull(),
  exclusivityCategory: text("exclusivity_category"), // Category for exclusivity (null if no exclusivity)
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  monthlyFee: integer("monthly_fee").default(0).notNull(), // in pence/cents
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  landingUrl: text("landing_url"), // Sponsor's landing page URL
  description: text("description"), // Short description for display
  promoCode: text("promo_code"), // Optional promo code for tracking
  ctaText: text("cta_text"), // CTA button text (e.g., "Get 10% off", "Book a demo")
  notes: text("notes"), // Internal notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sponsor placements table
export const sponsorPlacements = pgTable("sponsor_placements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id, { onDelete: "cascade" }),
  placementType: placementTypeEnum("placement_type").notNull(),
  placementLocation: text("placement_location"), // Specific location identifier (e.g., "homepage_above_fold", "resource_equipment")
  order: integer("order").default(0).notNull(), // Display order
  isActive: boolean("is_active").default(true).notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  metadata: json("metadata"), // Additional placement-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sponsor assets table
export const sponsorAssets = pgTable("sponsor_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id, { onDelete: "cascade" }),
  assetType: assetTypeEnum("asset_type").notNull(),
  assetUrl: text("asset_url"), // URL to uploaded asset
  assetData: json("asset_data"), // Additional asset metadata (dimensions, format, etc.)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sponsor events table (tracking)
export const sponsorEvents = pgTable("sponsor_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id, { onDelete: "cascade" }),
  placementId: varchar("placement_id").references(() => sponsorPlacements.id, { onDelete: "set null" }),
  eventType: eventTypeEnum("event_type").notNull(),
  userId: varchar("user_id"), // Optional: user who triggered event
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  metadata: json("metadata"), // Additional event data (destination_url, etc.)
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Sponsor reports table
export const sponsorReports = pgTable("sponsor_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sponsorId: varchar("sponsor_id").notNull().references(() => sponsors.id, { onDelete: "cascade" }),
  reportMonth: varchar("report_month").notNull(), // Format: "YYYY-MM"
  impressions: integer("impressions").default(0).notNull(),
  clicks: integer("clicks").default(0).notNull(),
  ctr: real("ctr").default(0).notNull(), // Click-through rate (percentage)
  ctaConversions: integer("cta_conversions").default(0).notNull(),
  placementBreakdown: json("placement_breakdown"), // Breakdown by placement type
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
  sentAt: timestamp("sent_at"), // When report was emailed to sponsor
  reportData: json("report_data"), // Full report data (for PDF generation)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sponsor inquiries table (for partner inquiry form submissions)
export const sponsorInquiries = pgTable("sponsor_inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  contactEmail: text("contact_email").notNull(),
  category: text("category"),
  budgetRange: text("budget_range"), // e.g., "£450-£800", "£800-£2,000"
  goals: text("goals"), // "awareness", "leads", "recruitment"
  message: text("message"),
  status: text("status").default("PENDING").notNull(), // PENDING, CONTACTED, CONVERTED, REJECTED
  notes: text("notes"), // Internal notes
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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
