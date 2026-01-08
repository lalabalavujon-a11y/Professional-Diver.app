CREATE TYPE "public"."contact_type" AS ENUM('CLIENT', 'CLIENT_REP', 'VTS', 'HARBOUR_MASTER', 'DIVING_DOCTOR', 'A_E', 'CRITICAL_CARE', 'POLICE', 'FIRE', 'AMBULANCE', 'SHIPPING', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."dive_operation_status" AS ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD');--> statement-breakpoint
CREATE TYPE "public"."dive_phase" AS ENUM('PRE_DIVE', 'DIVE', 'POST_DIVE', 'STANDBY', 'DECOMPRESSION');--> statement-breakpoint
CREATE TYPE "public"."diver_role" AS ENUM('DIVER_1', 'DIVER_2', 'STANDBY_DIVER', 'TENDER', 'SUPERVISOR', 'LST', 'DMT', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."hazard_likelihood" AS ENUM('RARE', 'UNLIKELY', 'POSSIBLE', 'LIKELY', 'ALMOST_CERTAIN');--> statement-breakpoint
CREATE TYPE "public"."hazard_severity" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');--> statement-breakpoint
CREATE TYPE "public"."hazard_status" AS ENUM('IDENTIFIED', 'ASSESSED', 'MITIGATED', 'RESOLVED', 'MONITORING');--> statement-breakpoint
CREATE TYPE "public"."hazard_type" AS ENUM('ENVIRONMENTAL', 'EQUIPMENT', 'OPERATIONAL', 'PERSONNEL', 'STRUCTURAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."medical_facility_type" AS ENUM('A_E', 'CRITICAL_CARE', 'DIVING_DOCTOR', 'HYPERBARIC');--> statement-breakpoint
CREATE TYPE "public"."partner_status" AS ENUM('NONE', 'PENDING', 'ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."permit_status" AS ENUM('PENDING', 'ISSUED', 'EXPIRED', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."permit_type" AS ENUM('DIVE_PERMIT', 'HOTWORKS', 'ENVIRONMENTAL', 'SAFETY', 'OTHER');--> statement-breakpoint
ALTER TYPE "public"."role" ADD VALUE 'ENTERPRISE';--> statement-breakpoint
CREATE TABLE "cas_evac_drills" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" varchar NOT NULL,
	"drill_date" timestamp NOT NULL,
	"scenario" text NOT NULL,
	"participants" json DEFAULT '[]'::json,
	"outcomes" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_project_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" varchar NOT NULL,
	"report_date" timestamp NOT NULL,
	"report_data" json NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dive_operation_contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" varchar NOT NULL,
	"contact_type" "contact_type" NOT NULL,
	"name" text NOT NULL,
	"organization" text,
	"phone" text,
	"email" text,
	"vhf_channel" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dive_operation_hazards" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" varchar NOT NULL,
	"hazard_type" "hazard_type" NOT NULL,
	"description" text NOT NULL,
	"severity" "hazard_severity" NOT NULL,
	"likelihood" "hazard_likelihood" NOT NULL,
	"mitigation" text,
	"status" "hazard_status" DEFAULT 'IDENTIFIED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dive_operation_permits" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" varchar NOT NULL,
	"permit_type" "permit_type" NOT NULL,
	"permit_number" text,
	"issued_by" text,
	"issue_date" timestamp,
	"expiry_date" timestamp,
	"status" "permit_status" DEFAULT 'PENDING' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dive_operations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"title" text NOT NULL,
	"client_id" varchar,
	"location" text,
	"planned_date" timestamp,
	"status" "dive_operation_status" DEFAULT 'PLANNED' NOT NULL,
	"supervisor_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dive_plans" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" varchar NOT NULL,
	"max_depth" real,
	"bottom_time" integer,
	"decompression_profile" json DEFAULT '[]'::json,
	"gas_mixtures" json DEFAULT '[]'::json,
	"equipment" json DEFAULT '[]'::json,
	"risk_assessment" json DEFAULT '{}'::json,
	"is_night_ops" boolean DEFAULT false NOT NULL,
	"night_ops_considerations" json DEFAULT '{}'::json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dive_team_members" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'DIVER',
	"age" integer,
	"experience_years" integer,
	"phone" text,
	"email" text,
	"certifications" json DEFAULT '[]'::json,
	"medical_runout_dates" json DEFAULT '[]'::json,
	"competencies" json DEFAULT '[]'::json,
	"emergency_contact" json DEFAULT '{}'::json,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dive_team_rosters" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" varchar NOT NULL,
	"phase" "dive_phase" NOT NULL,
	"diver_role" "diver_role" NOT NULL,
	"team_member_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feature_definitions" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "medical_facilities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "medical_facility_type" NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"address" text,
	"city" text,
	"country" text NOT NULL,
	"region" text,
	"phone" text,
	"emergency_phone" text,
	"email" text,
	"website" text,
	"specialties" json DEFAULT '[]'::json,
	"services" json DEFAULT '[]'::json,
	"is_available_24h" boolean DEFAULT false NOT NULL,
	"notes" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navigation_routes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"waypoint_ids" json NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navigation_waypoints" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"name" text NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rams_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" varchar NOT NULL,
	"title" text NOT NULL,
	"document_data" json NOT NULL,
	"linked_hazard_ids" json DEFAULT '[]'::json,
	"signatures" json DEFAULT '[]'::json,
	"pdf_data" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_feature_defaults" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "role" NOT NULL,
	"feature_id" varchar NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shipping_info" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" varchar NOT NULL,
	"vessel_name" text,
	"vessel_type" text,
	"eta" timestamp,
	"etd" timestamp,
	"contact" json DEFAULT '{}'::json,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_box_talks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" varchar NOT NULL,
	"talk_date" timestamp NOT NULL,
	"topics" json DEFAULT '[]'::json,
	"attendees" json DEFAULT '[]'::json,
	"presenter" text NOT NULL,
	"sign_offs" json DEFAULT '[]'::json,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_feature_overrides" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"feature_id" varchar NOT NULL,
	"enabled" boolean,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_medical_facility_selections" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"facility_id" varchar NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "welfare_records" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_id" varchar NOT NULL,
	"record_date" timestamp NOT NULL,
	"accommodation" json DEFAULT '{}'::json,
	"meals" json DEFAULT '{}'::json,
	"rest_periods" json DEFAULT '[]'::json,
	"health_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widget_locations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"location_name" text,
	"is_current_location" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "widget_preferences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"clock_type" text DEFAULT 'digital' NOT NULL,
	"enable_weather" boolean DEFAULT false NOT NULL,
	"enable_tides" boolean DEFAULT false NOT NULL,
	"enable_moon_phase" boolean DEFAULT false NOT NULL,
	"enable_navigation" boolean DEFAULT false NOT NULL,
	"enable_ais" boolean DEFAULT false NOT NULL,
	"weather_alerts_enabled" boolean DEFAULT true NOT NULL,
	"tide_alerts_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "widget_preferences_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "user_id" varchar;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "partner_status" "partner_status" DEFAULT 'NONE' NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "conversion_date" timestamp;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "highlevel_contact_id" text;--> statement-breakpoint
ALTER TABLE "cas_evac_drills" ADD CONSTRAINT "cas_evac_drills_operation_id_dive_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."dive_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_project_reports" ADD CONSTRAINT "daily_project_reports_operation_id_dive_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."dive_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_project_reports" ADD CONSTRAINT "daily_project_reports_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dive_operation_contacts" ADD CONSTRAINT "dive_operation_contacts_operation_id_dive_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."dive_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dive_operation_hazards" ADD CONSTRAINT "dive_operation_hazards_operation_id_dive_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."dive_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dive_operation_permits" ADD CONSTRAINT "dive_operation_permits_operation_id_dive_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."dive_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dive_operations" ADD CONSTRAINT "dive_operations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dive_operations" ADD CONSTRAINT "dive_operations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dive_operations" ADD CONSTRAINT "dive_operations_supervisor_id_dive_team_members_id_fk" FOREIGN KEY ("supervisor_id") REFERENCES "public"."dive_team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dive_plans" ADD CONSTRAINT "dive_plans_operation_id_dive_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."dive_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dive_team_members" ADD CONSTRAINT "dive_team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dive_team_rosters" ADD CONSTRAINT "dive_team_rosters_operation_id_dive_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."dive_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dive_team_rosters" ADD CONSTRAINT "dive_team_rosters_team_member_id_dive_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."dive_team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navigation_routes" ADD CONSTRAINT "navigation_routes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navigation_waypoints" ADD CONSTRAINT "navigation_waypoints_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rams_documents" ADD CONSTRAINT "rams_documents_operation_id_dive_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."dive_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rams_documents" ADD CONSTRAINT "rams_documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_feature_defaults" ADD CONSTRAINT "role_feature_defaults_feature_id_feature_definitions_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."feature_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shipping_info" ADD CONSTRAINT "shipping_info_operation_id_dive_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."dive_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_box_talks" ADD CONSTRAINT "tool_box_talks_operation_id_dive_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."dive_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_overrides" ADD CONSTRAINT "user_feature_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_feature_overrides" ADD CONSTRAINT "user_feature_overrides_feature_id_feature_definitions_id_fk" FOREIGN KEY ("feature_id") REFERENCES "public"."feature_definitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_medical_facility_selections" ADD CONSTRAINT "user_medical_facility_selections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_medical_facility_selections" ADD CONSTRAINT "user_medical_facility_selections_facility_id_medical_facilities_id_fk" FOREIGN KEY ("facility_id") REFERENCES "public"."medical_facilities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "welfare_records" ADD CONSTRAINT "welfare_records_operation_id_dive_operations_id_fk" FOREIGN KEY ("operation_id") REFERENCES "public"."dive_operations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_locations" ADD CONSTRAINT "widget_locations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "widget_preferences" ADD CONSTRAINT "widget_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;