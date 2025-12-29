-- Add password column to users table if it doesn't exist
-- Run this in Supabase SQL Editor

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'password'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "password" text;
        RAISE NOTICE 'Password column added to users table';
    ELSE
        RAISE NOTICE 'Password column already exists';
    END IF;
END $$;

