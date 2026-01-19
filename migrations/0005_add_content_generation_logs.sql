-- Migration: Add content generation logs table
-- Tracks PDF and podcast generation history for audit and debugging

-- PostgreSQL version
-- Create content_generation_logs table
CREATE TABLE IF NOT EXISTS "content_generation_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "lesson_id" varchar REFERENCES "lessons"("id") ON DELETE SET NULL,
  "track_id" varchar REFERENCES "tracks"("id") ON DELETE SET NULL,
  "content_type" varchar NOT NULL, -- 'pdf' | 'podcast'
  "status" varchar NOT NULL, -- 'pending' | 'processing' | 'completed' | 'failed'
  "source_type" varchar, -- 'lesson_content' | 'pdf_content' | 'gamma_template'
  "source_url" text, -- PDF URL if podcast from PDF
  "generated_url" text, -- Result PDF/podcast URL
  "error_message" text,
  "duration_seconds" integer,
  "file_size_bytes" integer,
  "started_at" timestamp DEFAULT now() NOT NULL,
  "completed_at" timestamp,
  "user_id" varchar REFERENCES "users"("id") ON DELETE SET NULL,
  "metadata" json -- Additional info (word count, page count, etc.)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "content_generation_logs_lesson_id_idx" ON "content_generation_logs"("lesson_id");
CREATE INDEX IF NOT EXISTS "content_generation_logs_track_id_idx" ON "content_generation_logs"("track_id");
CREATE INDEX IF NOT EXISTS "content_generation_logs_content_type_idx" ON "content_generation_logs"("content_type");
CREATE INDEX IF NOT EXISTS "content_generation_logs_status_idx" ON "content_generation_logs"("status");
CREATE INDEX IF NOT EXISTS "content_generation_logs_started_at_idx" ON "content_generation_logs"("started_at");
CREATE INDEX IF NOT EXISTS "content_generation_logs_user_id_idx" ON "content_generation_logs"("user_id");

-- Add comments for documentation
COMMENT ON TABLE "content_generation_logs" IS 'Audit log for PDF and podcast generation operations';
COMMENT ON COLUMN "content_generation_logs"."content_type" IS 'Type of content: pdf or podcast';
COMMENT ON COLUMN "content_generation_logs"."status" IS 'Generation status: pending, processing, completed, or failed';
COMMENT ON COLUMN "content_generation_logs"."source_type" IS 'Source of generation: lesson_content, pdf_content, or gamma_template';
COMMENT ON COLUMN "content_generation_logs"."source_url" IS 'URL of source material (e.g., PDF URL for podcast generation)';
COMMENT ON COLUMN "content_generation_logs"."generated_url" IS 'URL of generated content (PDF or podcast file)';
COMMENT ON COLUMN "content_generation_logs"."metadata" IS 'Additional metadata: word count, page count, etc.';
