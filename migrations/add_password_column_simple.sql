-- Simple script to add password column
-- Run this in Supabase SQL Editor

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" text;

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users' 
  AND column_name = 'password';

