# Railway Staging Database Setup Guide

## Current Status

Railway staging is currently running in **SQLite mode** instead of PostgreSQL. This guide will help you configure it to use PostgreSQL.

## Step 1: Verify Railway Staging Variables

Go to Railway → **professional-diver-api-staging** service → **Variables** tab.

### Required Variable: `DATABASE_URL`

**Check if it exists:**
- ✅ If `DATABASE_URL` is set → Verify it's a PostgreSQL connection string
- ❌ If `DATABASE_URL` is missing → This is why staging is using SQLite

**Format should be:**
```
postgresql://user:password@host:5432/database?sslmode=require
```

**For Supabase:**
- Get connection string from: Supabase Dashboard → Settings → Database → Connection string
- Use the "Direct connection" (not pooled/transaction)
- Ensure it includes `?sslmode=require` or add it

**For Neon:**
- Get connection string from: Neon Dashboard → Connection Details
- Use the "Direct connection" string
- Ensure it includes `?sslmode=require` or add it

### Optional Variable: `OPENAI_API_KEY`

- Set this if you want AI features (Laura, vector store) enabled in staging
- If not set, the app will work but AI features will be disabled (guards handle this)

## Step 2: Verify Database Type in Logs

After setting `DATABASE_URL`, redeploy and check the startup logs. You should see:

**✅ Correct (PostgreSQL):**
```
🚀 Using PostgreSQL database
```

**❌ Wrong (SQLite):**
```
⚠️ DATABASE_URL not set; falling back to local SQLite database
```
or
```
🔧 Using local SQLite database for development
```

## Step 3: Migrations

Migrations are now **automatically run** on every deploy thanks to the `start:with-migrations` script.

**Important:** The migration script includes safety guards:
- Only runs if `DATABASE_URL` is set and points to PostgreSQL
- Tests database connectivity before running migrations
- Skips migrations on SQLite or when DB is unreachable (prevents restart loops)
- Can be disabled by setting `RUN_MIGRATIONS_ON_START=false`

**⚠️ Railway UI vs railway.json:**

Railway typically uses the **service settings in the UI** (not `railway.json`). After merging, verify in Railway UI:

1. Go to Railway → `professional-diver-api-staging` → Settings
2. Check **Start Command** is set to: `npm run start:with-migrations`
3. If it still says `npm run start`, update it manually in the UI

The `railway.json` file is mainly used with Railway CLI, so the UI settings take precedence.

## Step 4: Verify Health Endpoint

After redeploy, check the health endpoint:

```bash
curl https://staging-api.professionaldiver.app/health
```

**Expected response (PostgreSQL):**
```json
{
  "status": "ok",
  "services": {
    "db": "postgresql-connected",
    ...
  }
}
```

**If still SQLite:**
```json
{
  "services": {
    "db": "sqlite-connected",
    ...
  }
}
```

## Troubleshooting

### Still seeing SQLite errors after setting DATABASE_URL?

1. **Check variable is set on the correct service:**
   - Make sure you're editing `professional-diver-api-staging` (not production)

2. **Redeploy after setting variable:**
   - Railway doesn't always pick up new variables without a redeploy
   - Trigger a new deployment after adding/changing `DATABASE_URL`

3. **Check variable name:**
   - Must be exactly `DATABASE_URL` (case-sensitive)
   - Not `POSTGRES_URL`, `DB_URL`, etc.

4. **Verify connection string format:**
   - Must start with `postgresql://` or `postgres://`
   - Should include `?sslmode=require` for Supabase/Neon

### Migration errors?

- Drizzle migrations are idempotent (safe to run multiple times)
- The migration script tests connectivity first - if DB is unreachable, migrations are skipped to prevent restart loops
- If migrations fail, check Railway logs for specific error messages
- Ensure `DATABASE_URL` is set correctly before migrations run
- To disable migrations on start: set `RUN_MIGRATIONS_ON_START=false` in Railway variables

### Multiple replicas / concurrent migrations?

- If you scale beyond 1 replica, be aware that multiple instances may attempt migrations simultaneously
- Drizzle migrations typically handle this with transaction locks, but monitor for race conditions
- Consider running migrations as a separate one-off command before scaling if needed

## Quick Checklist

- [ ] `DATABASE_URL` is set in Railway staging variables
- [ ] Connection string includes `?sslmode=require`
- [ ] Using direct connection (not pooled)
- [ ] Redeployed after setting variable
- [ ] Logs show "🚀 Using PostgreSQL database"
- [ ] Health endpoint shows "postgresql-connected"
- [ ] No "no such table" errors in logs
- [ ] (Optional) `OPENAI_API_KEY` is set if AI features needed

## Files Changed

1. **`package.json`**: Added `start:with-migrations` script
2. **`railway.json`**: Updated `startCommand` to run migrations before start
3. **`server/health.ts`**: Improved database type detection
