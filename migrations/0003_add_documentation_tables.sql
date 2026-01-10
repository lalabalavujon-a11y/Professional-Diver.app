-- Migration: Add documentation tables for dynamic support documents
-- This migration adds tables for storing and tracking documentation sections

CREATE TABLE IF NOT EXISTS "documentation_sections" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "section_id" TEXT NOT NULL UNIQUE,
  "category" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "subsections" TEXT DEFAULT '[]',
  "related_links" TEXT DEFAULT '[]',
  "keywords" TEXT DEFAULT '[]',
  "version" INTEGER DEFAULT 1 NOT NULL,
  "last_updated" INTEGER,
  "updated_by" TEXT DEFAULT 'laura',
  "change_type" TEXT,
  "is_active" INTEGER DEFAULT 1 NOT NULL,
  "created_at" INTEGER DEFAULT (unixepoch()) NOT NULL
);

CREATE TABLE IF NOT EXISTS "documentation_changes" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "section_id" TEXT NOT NULL,
  "change_type" TEXT NOT NULL,
  "description" TEXT,
  "old_content" TEXT,
  "new_content" TEXT,
  "detected_at" INTEGER DEFAULT (unixepoch()) NOT NULL,
  "processed_at" INTEGER,
  "status" TEXT DEFAULT 'pending',
  "processed_by" TEXT,
  "metadata" TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS "documentation_versions" (
  "id" TEXT PRIMARY KEY NOT NULL,
  "section_id" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "created_at" INTEGER DEFAULT (unixepoch()) NOT NULL,
  "created_by" TEXT NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_documentation_sections_category" ON "documentation_sections"("category");
CREATE INDEX IF NOT EXISTS "idx_documentation_sections_section_id" ON "documentation_sections"("section_id");
CREATE INDEX IF NOT EXISTS "idx_documentation_sections_active" ON "documentation_sections"("is_active");
CREATE INDEX IF NOT EXISTS "idx_documentation_changes_status" ON "documentation_changes"("status");
CREATE INDEX IF NOT EXISTS "idx_documentation_changes_section_id" ON "documentation_changes"("section_id");
CREATE INDEX IF NOT EXISTS "idx_documentation_versions_section_id" ON "documentation_versions"("section_id");

