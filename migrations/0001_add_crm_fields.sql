-- Migration: Add CRM fields to clients table
-- Adds user_id, partner_status, conversion_date, and highlevel_contact_id fields

-- For PostgreSQL
ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS user_id varchar REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS partner_status varchar DEFAULT 'NONE' NOT NULL,
  ADD COLUMN IF NOT EXISTS conversion_date timestamp,
  ADD COLUMN IF NOT EXISTS highlevel_contact_id text;

-- Create enum for partner_status if it doesn't exist (PostgreSQL)
DO $$ BEGIN
  CREATE TYPE partner_status AS ENUM ('NONE', 'PENDING', 'ACTIVE', 'INACTIVE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update existing column to use enum (PostgreSQL)
-- Note: This may require data migration if partner_status column already exists
-- ALTER TABLE clients ALTER COLUMN partner_status TYPE partner_status USING partner_status::partner_status;

-- For SQLite (handled in schema-sqlite.ts, but adding here for reference)
-- SQLite doesn't support ALTER TABLE ADD COLUMN with constraints in all versions
-- The schema-sqlite.ts file handles this with the table definition

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_highlevel_contact_id ON clients(highlevel_contact_id);
CREATE INDEX IF NOT EXISTS idx_clients_partner_status ON clients(partner_status);

