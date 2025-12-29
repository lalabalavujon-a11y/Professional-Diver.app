# 🔍 Supabase Setup Verification Guide

## Current Status Check

Based on the verification, here's what we found:

### ❌ Missing Configuration
- **DATABASE_URL is NOT set in Cloudflare Workers**
  - Main worker: Only has `API_URL` secret
  - API worker: No secrets configured

### ✅ What's Already Set Up
- Code supports PostgreSQL/Supabase (`server/db.ts`)
- Migration files exist (`migrations/0000_tricky_ezekiel_stane.sql`)
- GitHub workflows reference `DATABASE_URL`
- Verification scripts are ready

## Step 1: Get Your Supabase Connection String

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Project Settings** → **Database**
4. Scroll to **Connection string** section
5. Copy the **Connection pooling** string (recommended) or **Direct connection** string

The format should look like:
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

Or for direct connection:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

## Step 2: Set DATABASE_URL in Cloudflare Workers

### Option A: Use the Interactive Script (Recommended)

```bash
./scripts/setup-database-url.sh
```

This will:
- Prompt for your connection string
- Set it for both main and API workers
- Verify the configuration

### Option B: Set Manually

```bash
# Set for main worker
echo "your-connection-string-here" | wrangler secret put DATABASE_URL --env production

# Set for API worker (if needed)
echo "your-connection-string-here" | wrangler secret put DATABASE_URL --config wrangler-api.toml --env production
```

## Step 3: Verify the Setup

### Check Secrets Are Set

```bash
# Check main worker
wrangler secret list --env production

# Check API worker
wrangler secret list --config wrangler-api.toml --env production
```

You should see `DATABASE_URL` in both lists.

### Run Full Verification

```bash
# Replace with your actual connection string
NODE_ENV=production DATABASE_URL="postgresql://..." pnpm run deploy:verify production
```

This will check:
- ✅ DATABASE_URL is configured (PostgreSQL)
- ✅ Database connection successful
- ✅ Data exists in database
- ✅ Recent backup found
- ✅ Migrations ready

### Test Database Connection

```bash
# Test connection and check for data
NODE_ENV=production DATABASE_URL="your-connection-string" pnpm tsx scripts/check-lessons.ts
```

## Step 4: Apply Migrations (If Not Done)

If your Supabase database is empty or needs migrations:

```bash
# Option 1: Via Supabase SQL Editor
# Copy the contents of migrations/0000_tricky_ezekiel_stane.sql
# Paste and run in Supabase Dashboard → SQL Editor

# Option 2: Using psql (if you have it installed)
psql "your-connection-string" < migrations/0000_tricky_ezekiel_stane.sql
```

## Step 5: Seed Initial Data (If Database is Empty)

```bash
NODE_ENV=production DATABASE_URL="your-connection-string" pnpm tsx scripts/working-seed.ts
```

## Step 6: Create Backup

```bash
NODE_ENV=production DATABASE_URL="your-connection-string" pnpm run backup:full
```

## Verification Checklist

- [ ] DATABASE_URL obtained from Supabase Dashboard
- [ ] DATABASE_URL set in main worker (`wrangler secret list --env production`)
- [ ] DATABASE_URL set in API worker (if needed)
- [ ] Database connection test successful
- [ ] Migrations applied (tables exist)
- [ ] Data exists (tracks, lessons, users)
- [ ] Backup created

## Troubleshooting

### Error: "DATABASE_URL is not set"
- Make sure you've set it in Cloudflare Workers secrets
- Verify with: `wrangler secret list --env production`

### Error: "Database connection failed"
- Check your connection string format
- Ensure it starts with `postgresql://`
- Verify SSL mode: `?sslmode=require`
- Check Supabase project is active

### Error: "No tables found"
- Run migrations: Copy `migrations/0000_tricky_ezekiel_stane.sql` to Supabase SQL Editor
- Or use: `psql "connection-string" < migrations/0000_tricky_ezekiel_stane.sql`

### Error: "No data found"
- Run seed script: `NODE_ENV=production DATABASE_URL="..." pnpm tsx scripts/working-seed.ts`

## Next Steps After Setup

1. ✅ Verify deployment: `pnpm run deploy:verify production`
2. ✅ Create backup: `pnpm run backup:full`
3. ✅ Deploy: `pnpm run deploy:prod`
4. ✅ Test production site: https://professionaldiver.app

---

**Need Help?** If you have your Supabase connection string ready, I can help you set it up!

