-- Migration: Add GPT access tokens table (SQLite version)
-- Stores time-limited access tokens for Diver Well GPT access
-- Tokens are automatically revoked when subscriptions end or are cancelled

-- SQLite version
-- Create gpt_access_tokens table
CREATE TABLE IF NOT EXISTS "gpt_access_tokens" (
  "id" text PRIMARY KEY,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token" text NOT NULL UNIQUE,
  "expires_at" integer NOT NULL,
  "is_revoked" integer DEFAULT 0 NOT NULL,
  "revoked_at" integer,
  "revoked_reason" text,
  "created_at" integer NOT NULL DEFAULT (unixepoch()),
  "updated_at" integer NOT NULL DEFAULT (unixepoch())
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "gpt_access_tokens_user_id_idx" ON "gpt_access_tokens"("user_id");
CREATE INDEX IF NOT EXISTS "gpt_access_tokens_token_idx" ON "gpt_access_tokens"("token");
CREATE INDEX IF NOT EXISTS "gpt_access_tokens_expires_at_idx" ON "gpt_access_tokens"("expires_at");
CREATE INDEX IF NOT EXISTS "gpt_access_tokens_is_revoked_idx" ON "gpt_access_tokens"("is_revoked");
