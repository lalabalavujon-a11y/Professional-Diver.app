import { sql } from "drizzle-orm";
import { pgTable, varchar, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Affiliate program tables
export const affiliates = pgTable("affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  affiliateCode: varchar("affiliate_code").notNull().unique(),
  commissionRate: integer("commission_rate").default(50), // 50% commission
  totalReferrals: integer("total_referrals").default(0),
  totalEarnings: integer("total_earnings").default(0), // in cents
  monthlyEarnings: integer("monthly_earnings").default(0), // current month in cents
  isActive: boolean("is_active").default(true),
  referralLink: text("referral_link").notNull(),
  paypalEmail: text("paypal_email"),
  bankDetails: text("bank_details"), // encrypted bank details for payouts
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id, { onDelete: "cascade" }),
  referredUserId: varchar("referred_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  affiliateCode: varchar("affiliate_code").notNull(),
  subscriptionType: text("subscription_type").notNull(), // MONTHLY, ANNUAL, LIFETIME
  monthlyValue: integer("monthly_value").notNull(), // subscription value in cents
  commissionEarned: integer("commission_earned").notNull(), // in cents
  status: text("status").default("ACTIVE").notNull(), // ACTIVE, CANCELLED, EXPIRED
  firstPaymentDate: timestamp("first_payment_date"),
  lastPaymentDate: timestamp("last_payment_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const commissionPayments = pgTable("commission_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateId: varchar("affiliate_id").notNull().references(() => affiliates.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // in cents
  paymentMethod: text("payment_method").notNull(), // PAYPAL, BANK_TRANSFER, STRIPE
  paymentReference: text("payment_reference"),
  paymentStatus: text("payment_status").default("PENDING").notNull(), // PENDING, COMPLETED, FAILED
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const affiliateClicks = pgTable("affiliate_clicks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  affiliateCode: varchar("affiliate_code").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrerUrl: text("referrer_url"),
  landingPage: text("landing_page"),
  converted: boolean("converted").default(false),
  convertedUserId: varchar("converted_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertAffiliateSchema = createInsertSchema(affiliates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCommissionPaymentSchema = createInsertSchema(commissionPayments).omit({
  id: true,
  createdAt: true,
});

export const insertAffiliateClickSchema = createInsertSchema(affiliateClicks).omit({
  id: true,
  createdAt: true,
});

// Types
export type Affiliate = typeof affiliates.$inferSelect;
export type InsertAffiliate = z.infer<typeof insertAffiliateSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type CommissionPayment = typeof commissionPayments.$inferSelect;
export type InsertCommissionPayment = z.infer<typeof insertCommissionPaymentSchema>;
export type AffiliateClick = typeof affiliateClicks.$inferSelect;
export type InsertAffiliateClick = z.infer<typeof insertAffiliateClickSchema>;