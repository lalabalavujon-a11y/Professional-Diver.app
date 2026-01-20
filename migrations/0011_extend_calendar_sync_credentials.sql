-- Extend calendar_sync_credentials table for flexible calendar connections
-- Supports per-user calendar IDs, custom configurations, and multiple provider types

-- First, create the table if it doesn't exist (for new installations)
CREATE TABLE IF NOT EXISTS "calendar_sync_credentials" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" text NOT NULL,
  "refresh_token" text,
  "sync_enabled" integer NOT NULL DEFAULT 1,
  "last_sync_at" timestamp,
  "sync_direction" text NOT NULL DEFAULT 'bidirectional',
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns if they don't exist
ALTER TABLE "calendar_sync_credentials" ADD COLUMN IF NOT EXISTS "calendar_id" text;
ALTER TABLE "calendar_sync_credentials" ADD COLUMN IF NOT EXISTS "provider_config" text; -- JSON string
ALTER TABLE "calendar_sync_credentials" ADD COLUMN IF NOT EXISTS "connection_name" text;
ALTER TABLE "calendar_sync_credentials" ADD COLUMN IF NOT EXISTS "is_active" integer NOT NULL DEFAULT 1;

-- Update provider enum constraint to include new providers
-- Note: SQLite doesn't support ALTER TABLE for CHECK constraints easily, so we'll handle this in application code
-- For PostgreSQL, we would use: ALTER TABLE ... DROP CONSTRAINT ... ADD CONSTRAINT ...

-- Make refresh_token nullable (for providers that don't use OAuth)
-- SQLite doesn't support changing column nullability directly, but new inserts will work

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_calendar_sync_credentials_user_id" ON "calendar_sync_credentials"("user_id");
CREATE INDEX IF NOT EXISTS "idx_calendar_sync_credentials_provider" ON "calendar_sync_credentials"("provider");
CREATE INDEX IF NOT EXISTS "idx_calendar_sync_credentials_is_active" ON "calendar_sync_credentials"("is_active");
CREATE INDEX IF NOT EXISTS "idx_calendar_sync_credentials_user_provider" ON "calendar_sync_credentials"("user_id", "provider");

-- Update existing records to have default values
UPDATE "calendar_sync_credentials" 
SET "is_active" = 1 
WHERE "is_active" IS NULL;

UPDATE "calendar_sync_credentials" 
SET "connection_name" = provider || ' Calendar'
WHERE "connection_name" IS NULL;
