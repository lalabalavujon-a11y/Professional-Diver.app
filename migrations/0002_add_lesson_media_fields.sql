-- Migration: Add media fields to lessons table
-- This migration adds support for videos, documents, embeds, links, images, and audio files

-- For PostgreSQL (production)
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "videos" json DEFAULT '[]'::json;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "documents" json DEFAULT '[]'::json;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "embeds" json DEFAULT '[]'::json;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "links" json DEFAULT '[]'::json;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "images" json DEFAULT '[]'::json;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "audio" json DEFAULT '[]'::json;

-- For SQLite (development)
-- Note: SQLite doesn't support ALTER TABLE ADD COLUMN with IF NOT EXISTS in all versions
-- These will be handled by Drizzle ORM when the schema is applied




