-- Add unified calendar tables for aggregating events from all sources
-- Supports Internal CRM, Calendly, Google Calendar, and HighLevel

-- Unified Calendar Events Table
CREATE TABLE IF NOT EXISTS "unified_calendar_events" (
  "id" text PRIMARY KEY NOT NULL,
  "source" text NOT NULL CHECK ("source" IN ('internal', 'calendly', 'google', 'highlevel')),
  "source_id" text NOT NULL,
  "title" text NOT NULL,
  "start_time" timestamp NOT NULL,
  "end_time" timestamp NOT NULL,
  "description" text,
  "location" text,
  "attendees" text, -- JSON array of {email, name}
  "metadata" text NOT NULL, -- JSON object with sync status, clientId, etc.
  "color" text,
  "all_day" integer NOT NULL DEFAULT 0,
  "user_id" text REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Calendar Sync Status Table
CREATE TABLE IF NOT EXISTS "calendar_sync_status" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "source" text NOT NULL CHECK ("source" IN ('internal', 'calendly', 'google', 'highlevel')),
  "last_sync_at" timestamp,
  "sync_status" text CHECK ("sync_status" IN ('success', 'failed', 'in_progress')),
  "error_message" text,
  "events_synced" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Calendar Conflicts Table
CREATE TABLE IF NOT EXISTS "calendar_conflicts" (
  "id" text PRIMARY KEY NOT NULL,
  "type" text NOT NULL CHECK ("type" IN ('time_overlap', 'duplicate', 'resource')),
  "severity" text NOT NULL CHECK ("severity" IN ('low', 'medium', 'high')),
  "event_ids" text NOT NULL, -- JSON array of unified event IDs
  "detected_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" timestamp,
  "resolution" text CHECK ("resolution" IN ('local_wins', 'remote_wins', 'newest_wins', 'manual')),
  "resolved_by" text REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Calendar Sync Logs Table
CREATE TABLE IF NOT EXISTS "calendar_sync_logs" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "source" text NOT NULL CHECK ("source" IN ('internal', 'calendly', 'google', 'highlevel')),
  "operation" text NOT NULL CHECK ("operation" IN ('pull', 'push', 'sync', 'aggregate')),
  "status" text NOT NULL CHECK ("status" IN ('success', 'failed', 'partial')),
  "events_processed" integer NOT NULL DEFAULT 0,
  "errors" text, -- JSON array of error messages
  "duration" integer, -- Duration in milliseconds
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_unified_calendar_events_user_id" ON "unified_calendar_events"("user_id");
CREATE INDEX IF NOT EXISTS "idx_unified_calendar_events_source" ON "unified_calendar_events"("source");
CREATE INDEX IF NOT EXISTS "idx_unified_calendar_events_start_time" ON "unified_calendar_events"("start_time");
CREATE INDEX IF NOT EXISTS "idx_unified_calendar_events_end_time" ON "unified_calendar_events"("end_time");
CREATE INDEX IF NOT EXISTS "idx_calendar_sync_status_user_source" ON "calendar_sync_status"("user_id", "source");
CREATE INDEX IF NOT EXISTS "idx_calendar_conflicts_resolved" ON "calendar_conflicts"("resolved_at");
CREATE INDEX IF NOT EXISTS "idx_calendar_sync_logs_created_at" ON "calendar_sync_logs"("created_at");
