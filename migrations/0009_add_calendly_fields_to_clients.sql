-- Add Calendly integration fields to clients table
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "calendly_event_uri" text;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "last_booking_time" timestamp;
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "booking_count" integer DEFAULT 0 NOT NULL;
