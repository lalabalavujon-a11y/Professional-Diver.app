-- Create enums for sponsor system
CREATE TYPE "public"."sponsor_tier" AS ENUM('BRONZE', 'SILVER', 'GOLD', 'TITLE', 'FOUNDING');
CREATE TYPE "public"."sponsor_status" AS ENUM('PENDING', 'ACTIVE', 'INACTIVE', 'CANCELLED');
CREATE TYPE "public"."placement_type" AS ENUM('HOMEPAGE_STRIP', 'ABOVE_FOLD', 'IN_APP_TILE', 'RESOURCE_PAGE', 'PARTNER_DIRECTORY', 'FEATURED_PARTNER');
CREATE TYPE "public"."asset_type" AS ENUM('LOGO', 'DESCRIPTION', 'CTA_TEXT', 'BRAND_GUIDELINES');
CREATE TYPE "public"."event_type" AS ENUM('IMPRESSION', 'CLICK', 'CTA_CLICK', 'CONVERSION');

-- Sponsors table
CREATE TABLE "sponsors" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"contact_name" text,
	"category" text,
	"tier" "sponsor_tier" DEFAULT 'BRONZE' NOT NULL,
	"status" "sponsor_status" DEFAULT 'PENDING' NOT NULL,
	"exclusivity_category" text,
	"start_date" timestamp,
	"end_date" timestamp,
	"monthly_fee" integer DEFAULT 0 NOT NULL,
	"stripe_subscription_id" text,
	"stripe_customer_id" text,
	"landing_url" text,
	"description" text,
	"promo_code" text,
	"cta_text" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Sponsor placements table
CREATE TABLE "sponsor_placements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" varchar NOT NULL,
	"placement_type" "placement_type" NOT NULL,
	"placement_location" text,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Sponsor assets table
CREATE TABLE "sponsor_assets" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" varchar NOT NULL,
	"asset_type" "asset_type" NOT NULL,
	"asset_url" text,
	"asset_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Sponsor events table (tracking)
CREATE TABLE "sponsor_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" varchar NOT NULL,
	"placement_id" varchar,
	"event_type" "event_type" NOT NULL,
	"user_id" varchar,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"metadata" json,
	"timestamp" timestamp DEFAULT now() NOT NULL
);

-- Sponsor reports table
CREATE TABLE "sponsor_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sponsor_id" varchar NOT NULL,
	"report_month" varchar NOT NULL,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"ctr" real DEFAULT 0 NOT NULL,
	"cta_conversions" integer DEFAULT 0 NOT NULL,
	"placement_breakdown" json,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	"report_data" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Sponsor inquiries table
CREATE TABLE "sponsor_inquiries" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"category" text,
	"budget_range" text,
	"goals" text,
	"message" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "sponsor_placements" ADD CONSTRAINT "sponsor_placements_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "sponsors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sponsor_assets" ADD CONSTRAINT "sponsor_assets_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "sponsors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sponsor_events" ADD CONSTRAINT "sponsor_events_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "sponsors"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sponsor_events" ADD CONSTRAINT "sponsor_events_placement_id_sponsor_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "sponsor_placements"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "sponsor_reports" ADD CONSTRAINT "sponsor_reports_sponsor_id_sponsors_id_fk" FOREIGN KEY ("sponsor_id") REFERENCES "sponsors"("id") ON DELETE cascade ON UPDATE no action;

-- Create indexes for performance
CREATE INDEX "sponsors_status_idx" ON "sponsors"("status");
CREATE INDEX "sponsors_tier_idx" ON "sponsors"("tier");
CREATE INDEX "sponsors_category_idx" ON "sponsors"("category");
CREATE INDEX "sponsor_placements_sponsor_id_idx" ON "sponsor_placements"("sponsor_id");
CREATE INDEX "sponsor_placements_is_active_idx" ON "sponsor_placements"("is_active");
CREATE INDEX "sponsor_events_sponsor_id_idx" ON "sponsor_events"("sponsor_id");
CREATE INDEX "sponsor_events_timestamp_idx" ON "sponsor_events"("timestamp");
CREATE INDEX "sponsor_reports_sponsor_id_idx" ON "sponsor_reports"("sponsor_id");
CREATE INDEX "sponsor_reports_report_month_idx" ON "sponsor_reports"("report_month");
