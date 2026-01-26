-- Ensure calendar sync flag columns are boolean in Postgres
-- Convert legacy integer flags to boolean safely.

ALTER TABLE "calendar_sync_credentials"
  ALTER COLUMN "sync_enabled" TYPE boolean
  USING (CASE
    WHEN "sync_enabled" IS NULL THEN true
    WHEN "sync_enabled"::integer <> 0 THEN true
    ELSE false
  END),
  ALTER COLUMN "sync_enabled" SET DEFAULT true;

ALTER TABLE "calendar_sync_credentials"
  ALTER COLUMN "is_active" TYPE boolean
  USING (CASE
    WHEN "is_active" IS NULL THEN true
    WHEN "is_active"::integer <> 0 THEN true
    ELSE false
  END),
  ALTER COLUMN "is_active" SET DEFAULT true;
