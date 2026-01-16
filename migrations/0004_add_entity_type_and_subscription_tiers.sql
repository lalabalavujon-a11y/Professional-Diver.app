-- Migration: Add entity type and subscription tier fields
-- Adds support for unified pricing tiers and cross-platform access

-- Create new enums
CREATE TYPE "public"."entity_type" AS ENUM('INDIVIDUAL', 'COMPANY', 'SERVICE_PROVIDER');
CREATE TYPE "public"."subscription_tier" AS ENUM('DIVER', 'COMPANY', 'SERVICE_PROVIDER');

-- Add new columns to users table
ALTER TABLE "users" 
  ADD COLUMN IF NOT EXISTS "subscription_tier" "subscription_tier",
  ADD COLUMN IF NOT EXISTS "entity_type" "entity_type" DEFAULT 'INDIVIDUAL' NOT NULL,
  ADD COLUMN IF NOT EXISTS "network_access_tier" "subscription_tier",
  ADD COLUMN IF NOT EXISTS "platform_access" json DEFAULT '{"training": true, "network": false}'::json;

-- Create index on subscription_tier for faster queries
CREATE INDEX IF NOT EXISTS "users_subscription_tier_idx" ON "users"("subscription_tier");
CREATE INDEX IF NOT EXISTS "users_entity_type_idx" ON "users"("entity_type");
CREATE INDEX IF NOT EXISTS "users_network_access_tier_idx" ON "users"("network_access_tier");

-- Migrate existing subscriptions to DIVER tier (backward compatibility)
-- All existing MONTHLY, ANNUAL, and LIFETIME subscriptions default to DIVER tier
UPDATE "users" 
SET 
  "subscription_tier" = 'DIVER',
  "network_access_tier" = 'DIVER',
  "platform_access" = '{"training": true, "network": false}'::json
WHERE 
  "subscription_tier" IS NULL 
  AND "subscription_type" IN ('MONTHLY', 'ANNUAL', 'LIFETIME')
  AND "subscription_status" = 'ACTIVE';

-- Set network access for active subscriptions (will be controlled by global feature flag)
-- For now, set network to false - will be enabled via feature flags
UPDATE "users"
SET
  "platform_access" = jsonb_set(
    COALESCE("platform_access"::jsonb, '{"training": true, "network": false}'::jsonb),
    '{network}',
    'false'::jsonb
  )
WHERE "platform_access" IS NULL OR "platform_access"::jsonb->>'network' IS NULL;

-- Set entity type based on role (if applicable)
-- ENTERPRISE role users default to COMPANY entity type
UPDATE "users"
SET "entity_type" = 'COMPANY'
WHERE "role" = 'ENTERPRISE' AND "entity_type" = 'INDIVIDUAL';

-- Add comments for documentation
COMMENT ON COLUMN "users"."subscription_tier" IS 'Subscription tier: DIVER ($19.99), COMPANY ($49.99), or SERVICE_PROVIDER ($79.99)';
COMMENT ON COLUMN "users"."entity_type" IS 'Entity type: INDIVIDUAL, COMPANY, or SERVICE_PROVIDER - determines default tier';
COMMENT ON COLUMN "users"."network_access_tier" IS 'Network platform access tier - synced with subscription_tier';
COMMENT ON COLUMN "users"."platform_access" IS 'JSON object: {training: boolean, network: boolean} - controls platform access';
