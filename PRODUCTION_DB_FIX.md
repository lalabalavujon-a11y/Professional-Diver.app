# Production Database Health Check Fix

## Problem

Production API health endpoint was returning:
```json
{
  "status": "degraded",
  "services": {
    "db": "database-error: db.get is not a function"
  }
}
```

Staging API was working correctly with `"db": "postgresql-connected"`.

## Root Cause

The health check in `server/health.ts` was using `db.get("SELECT 1")`, which is a SQLite-specific API. However, the codebase uses **Drizzle ORM**, which doesn't have a `.get()` method. Drizzle uses `db.execute()` for raw SQL queries.

## Fixes Applied

### 1. Health Check Fix (`server/health.ts`)

**Before:**
```typescript
await db.get("SELECT 1");  // ❌ Drizzle doesn't have .get()
```

**After:**
```typescript
import { sql } from "drizzle-orm";
await db.execute(sql`SELECT 1`);  // ✅ Correct Drizzle API
```

### 2. Database Initialization Logic (`server/db.ts`)

**Before:**
```typescript
if (env !== 'development' && hasDatabaseUrl) {
  // PostgreSQL
} else {
  // SQLite (could fall back in production if DATABASE_URL missing)
}
```

**After:**
```typescript
if (hasDatabaseUrl) {
  // PostgreSQL (prioritize DATABASE_URL regardless of NODE_ENV)
} else {
  // SQLite (only if DATABASE_URL is missing)
}
```

**Why this matters:**
- Production will **always** use PostgreSQL if `DATABASE_URL` is set
- No risk of accidentally falling back to SQLite in production
- Cleaner, more predictable behavior

## Verification

After deploying this fix, test both APIs:

```bash
# Production
curl https://api.professionaldiver.app/health

# Staging
curl https://staging-api.professionaldiver.app/health
```

**Expected result:**
```json
{
  "status": "ok",
  "services": {
    "db": "postgresql-connected"
  }
}
```

## Next Steps

1. **Commit and push** these changes
2. **Redeploy production service** on Railway
3. **Verify health endpoint** returns `postgresql-connected`
4. **Set Cloudflare Pages env vars** (see `CLOUDFLARE_PAGES_SETUP.md`)

## Railway Environment Variables Check

Ensure production service has:
- ✅ `DATABASE_URL` set (Supabase Postgres connection string)
- ✅ `NODE_ENV=production` (optional, but recommended)

If `DATABASE_URL` is missing in production, the service will now log a warning and fall back to SQLite (which won't work in Railway's ephemeral filesystem).
