-- Migration: Add content generation logs table (SQLite version)
-- Tracks PDF and podcast generation history for audit and debugging

-- SQLite version
-- Create content_generation_logs table
CREATE TABLE IF NOT EXISTS "content_generation_logs" (
  "id" text PRIMARY KEY,
  "lesson_id" text REFERENCES "lessons"("id") ON DELETE SET NULL,
  "track_id" text REFERENCES "tracks"("id") ON DELETE SET NULL,
  "content_type" text NOT NULL, -- 'pdf' | 'podcast'
  "status" text NOT NULL, -- 'pending' | 'processing' | 'completed' | 'failed'
  "source_type" text, -- 'lesson_content' | 'pdf_content' | 'gamma_template'
  "source_url" text, -- PDF URL if podcast from PDF
  "generated_url" text, -- Result PDF/podcast URL
  "error_message" text,
  "duration_seconds" integer,
  "file_size_bytes" integer,
  "started_at" integer NOT NULL, -- Unix timestamp
  "completed_at" integer, -- Unix timestamp
  "user_id" text REFERENCES "users"("id") ON DELETE SET NULL,
  "metadata" text -- JSON string for additional info (word count, page count, etc.)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "content_generation_logs_lesson_id_idx" ON "content_generation_logs"("lesson_id");
CREATE INDEX IF NOT EXISTS "content_generation_logs_track_id_idx" ON "content_generation_logs"("track_id");
CREATE INDEX IF NOT EXISTS "content_generation_logs_content_type_idx" ON "content_generation_logs"("content_type");
CREATE INDEX IF NOT EXISTS "content_generation_logs_status_idx" ON "content_generation_logs"("status");
CREATE INDEX IF NOT EXISTS "content_generation_logs_started_at_idx" ON "content_generation_logs"("started_at");
CREATE INDEX IF NOT EXISTS "content_generation_logs_user_id_idx" ON "content_generation_logs"("user_id");
