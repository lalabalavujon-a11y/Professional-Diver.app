# Railway Staging Verification Checklist

After setting up `DATABASE_URL` and deploying, use this checklist to verify everything is working correctly.

## Pre-Deployment Checks

### 1. Railway UI Settings
- [ ] Go to Railway → `professional-diver-api-staging` → **Settings**
- [ ] Verify **Start Command** is: `npm run start:with-migrations`
- [ ] If it's still `npm run start`, update it manually in the UI
- [ ] Note: `railway.json` may not be applied if UI settings override it

### 2. Railway Variables
- [ ] Go to Railway → `professional-diver-api-staging` → **Variables**
- [ ] Verify `DATABASE_URL` exists and is set
- [ ] Check format: Should start with `postgresql://` or `postgres://`
- [ ] Verify SSL: Should include `?sslmode=require` (or `&sslmode=require` if other params exist)
- [ ] (Optional) Set `OPENAI_API_KEY` if you want AI features enabled
- [ ] (Optional) Set `RUN_MIGRATIONS_ON_START=false` to disable migrations (default: true)

### 3. DATABASE_URL Format Check

**Correct formats:**
```
postgresql://user:password@host:5432/database?sslmode=require
postgresql://user:password@host:5432/database?sslmode=require&other=param
```

**Common issues:**
- ❌ Missing `sslmode=require` → Will fail with SSL connection errors
- ❌ Using pooled/transaction URL instead of direct → May cause connection issues
- ❌ Wrong service → Make sure it's set on `professional-diver-api-staging`, not production

## Post-Deployment Verification

### 4. Check Deployment Logs

After redeploying, check Railway logs for:

**✅ Expected (PostgreSQL):**
```
🔍 Migration check:
   DATABASE_URL present: true
   Is PostgreSQL: true
   RUN_MIGRATIONS_ON_START: not set (default: true)
🔌 Testing database connectivity...
✅ Database is reachable
🚀 Running database migrations...
✅ Migrations completed successfully
🚀 Using PostgreSQL database
```

**❌ Wrong (SQLite):**
```
⏭️  Skipping migrations: DATABASE_URL not set (using SQLite)
⚠️ DATABASE_URL not set; falling back to local SQLite database
```

**❌ Database unreachable:**
```
❌ Database connectivity test failed: ...
⏭️  Skipping migrations to prevent restart loop
```

### 5. Health Endpoint Check

After deployment, test the health endpoint:

```bash
curl https://staging-api.professionaldiver.app/health
```

**✅ Expected (PostgreSQL):**
```json
{
  "status": "ok",
  "services": {
    "db": "postgres-connected",
    ...
  }
}
```

**❌ Wrong (SQLite):**
```json
{
  "services": {
    "db": "sqlite-connected",
    ...
  }
}
```

**❌ Error:**
```json
{
  "services": {
    "db": "postgres-error",
    ...
  }
}
```

### 6. Verify No SQLite Errors

Check logs for absence of:
- ❌ `no such table: operations_calendar`
- ❌ `no such table: support_tickets`
- ❌ `no such table: calendar_sync_logs`
- ❌ `near "?": syntax error` (SQLite doesn't support PostgreSQL-style parameters)

If you still see these after setting `DATABASE_URL`:
1. Verify `DATABASE_URL` is set on the correct service
2. Trigger a new deployment (Railway may cache old variables)
3. Check logs for the migration check output

## Environment-Specific Recommendations

### Staging
- ✅ `RUN_MIGRATIONS_ON_START=true` (or unset, defaults to true)
- ✅ Auto-migrations on every deploy are fine (single replica)
- ✅ `OPENAI_API_KEY` optional (can test AI features)

### Production
- ⚠️ Consider `RUN_MIGRATIONS_ON_START=false` once stable
- ⚠️ Run migrations manually or as separate release step
- ⚠️ If scaling > 1 replica, consider migration locks

## Troubleshooting

### Still seeing SQLite after setting DATABASE_URL?

1. **Check variable is on correct service:**
   - Must be on `professional-diver-api-staging` service
   - Not on project/global level (unless inherited)

2. **Redeploy after setting variable:**
   - Railway doesn't always pick up new variables without redeploy
   - Trigger a new deployment after adding/changing `DATABASE_URL`

3. **Check variable name:**
   - Must be exactly `DATABASE_URL` (case-sensitive)
   - Not `POSTGRES_URL`, `DB_URL`, etc.

4. **Verify connection string:**
   - Must start with `postgresql://` or `postgres://`
   - Should include `?sslmode=require` for Supabase/Neon

### Migrations not running?

1. Check logs for migration check output
2. Verify `RUN_MIGRATIONS_ON_START` is not set to `false`
3. Check if database connectivity test is passing
4. Ensure `DATABASE_URL` points to PostgreSQL (not SQLite file path)

### Health endpoint shows wrong database type?

1. Check `DATABASE_URL` format in Railway variables
2. Verify it starts with `postgresql://` or `postgres://`
3. Check deployment logs for database initialization message
4. Health endpoint uses `DATABASE_URL` format as primary signal

## Quick Verification Script

You can also verify the setup programmatically:

```bash
# Check health endpoint
curl -s https://staging-api.professionaldiver.app/health | jq '.services.db'

# Should return: "postgres-connected" or "sqlite-connected"
```

## Success Criteria

✅ All checks pass when:
- [ ] Start Command is `npm run start:with-migrations`
- [ ] `DATABASE_URL` is set and formatted correctly
- [ ] Logs show "🚀 Using PostgreSQL database"
- [ ] Logs show "✅ Migrations completed successfully"
- [ ] Health endpoint shows `"db": "postgres-connected"`
- [ ] No "no such table" errors in logs
- [ ] App is running successfully
