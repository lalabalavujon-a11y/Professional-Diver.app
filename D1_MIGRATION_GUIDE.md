# Cloudflare D1 Database Migration Guide

This guide will help you migrate from Railway Express Server with PostgreSQL to Cloudflare D1 database.

## Overview

**Cloudflare D1** is a serverless SQLite database that runs natively in Cloudflare Workers. It provides:
- ✅ No external database server needed
- ✅ Automatic scaling
- ✅ Built-in replication
- ✅ Zero configuration
- ✅ Free tier available

## Prerequisites

1. Cloudflare account with Wrangler CLI installed
2. Node.js 22.12.0+ (as per project requirements)
3. Access to your Cloudflare dashboard

## Step 1: Create D1 Database

```bash
# Create the D1 database
wrangler d1 create professionaldiver-db

# This will output something like:
# ✅ Successfully created DB 'professionaldiver-db'!
# Created your database using D1's new storage backend. The new storage backend is not yet recommended for production workloads, but backs up your data via snapshots to R2.
# [[d1_databases]]
# binding = "DB"
# database_name = "professionaldiver-db"
# database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
```

**Important:** Copy the `database_id` from the output - you'll need it in the next step.

## Step 2: Update wrangler.toml

Update both `wrangler.toml` and `wrangler-api.toml` with the actual database ID:

```toml
# In wrangler.toml - Production environment
[[env.production.d1_databases]]
binding = "DB"
database_name = "professionaldiver-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # Replace with your actual ID

# In wrangler.toml - Development environment
[[env.development.d1_databases]]
binding = "DB"
database_name = "professionaldiver-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # Replace with your actual ID
```

```toml
# In wrangler-api.toml - Production environment
[[env.production.d1_databases]]
binding = "DB"
database_name = "professionaldiver-db"
database_id = "a1b2c3d4-e5f6-7890-abcd-ef1234567890"  # Replace with your actual ID
```

## Step 3: Generate SQLite Migration

D1 uses SQLite, so we need to use the SQLite schema. The project already has `shared/schema-sqlite.ts` which is compatible with D1.

```bash
# Generate migration from SQLite schema
NODE_ENV=development pnpm run db:push

# This will create/update migrations in ./migrations/
```

## Step 4: Run Migrations on D1

```bash
# Run migrations on production D1 database
wrangler d1 execute professionaldiver-db --file=./migrations/0000_tricky_ezekiel_stane.sql --env production

# Or if you have multiple migration files:
for file in ./migrations/*.sql; do
  wrangler d1 execute professionaldiver-db --file="$file" --env production
done
```

## Step 5: Migrate Data from PostgreSQL (If Needed)

If you have existing data in PostgreSQL that needs to be migrated:

```bash
# Export data from PostgreSQL
pg_dump $DATABASE_URL --data-only --table=users --table=tracks --table=lessons > data_export.sql

# Convert PostgreSQL SQL to SQLite-compatible SQL (manual editing may be required)
# Then import to D1:
wrangler d1 execute professionaldiver-db --file=data_export.sql --env production
```

**Note:** You may need to manually adjust the SQL syntax as PostgreSQL and SQLite have some differences.

## Step 6: Update Environment Variables

Remove or update the `API_URL` secret if you were using it to point to Railway:

```bash
# Remove API_URL if no longer needed
wrangler secret delete API_URL --env production

# Or keep it as a fallback during migration
# wrangler secret put API_URL --env production
# (Enter your Railway URL if you want to keep it as fallback)
```

## Step 7: Deploy Updated Workers

```bash
# Deploy API worker with D1 support
pnpm run deploy:api

# Deploy main worker
pnpm run deploy:prod
```

## Step 8: Verify D1 Database

```bash
# Check database info
wrangler d1 info professionaldiver-db --env production

# Query database directly
wrangler d1 execute professionaldiver-db --command="SELECT COUNT(*) FROM users" --env production
```

## Step 9: Test Authentication

1. Try logging in with an existing user account
2. Verify that authentication works with D1
3. Check Cloudflare Workers logs for any errors

## Important Notes

### Password Hashing

The current implementation uses `bcryptjs` which may not work perfectly in Cloudflare Workers. Consider:

1. **Option A:** Use Web Crypto API for password hashing (recommended for Workers)
2. **Option B:** Keep bcryptjs with error handling (current implementation)
3. **Option C:** Migrate passwords to use a Workers-compatible hashing method

### Schema Differences

- PostgreSQL uses `pgEnum` types, SQLite uses text with enum constraints
- PostgreSQL uses `gen_random_uuid()`, SQLite uses `nanoid()` (already handled in schema-sqlite.ts)
- Some PostgreSQL-specific features may need adjustment

### Performance Considerations

- D1 is eventually consistent (read-after-write may not be immediate)
- D1 has rate limits on the free tier
- For high-traffic applications, consider using D1 with caching

## Troubleshooting

### Issue: "Database binding not found"

**Solution:** Make sure you've:
1. Created the D1 database
2. Updated `wrangler.toml` and `wrangler-api.toml` with the correct `database_id`
3. Redeployed the workers

### Issue: "Migration failed"

**Solution:**
1. Check the SQL syntax is SQLite-compatible
2. Ensure all tables are created in the correct order (respecting foreign keys)
3. Run migrations one at a time to identify the failing statement

### Issue: "bcryptjs not working"

**Solution:** 
1. Check if `nodejs_compat` flag is set in `wrangler.toml` (it is)
2. Consider migrating to Web Crypto API for password hashing
3. Use the fallback password check during migration

## Migration Checklist

- [ ] D1 database created
- [ ] `wrangler.toml` updated with database_id
- [ ] `wrangler-api.toml` updated with database_id
- [ ] Migrations generated from SQLite schema
- [ ] Migrations run on D1 database
- [ ] Data migrated from PostgreSQL (if applicable)
- [ ] Workers deployed with D1 support
- [ ] Authentication tested
- [ ] All API endpoints tested
- [ ] Railway Express server can be decommissioned (optional)

## Next Steps

After successful migration:

1. **Monitor D1 usage** in Cloudflare dashboard
2. **Set up D1 backups** (automatic with new storage backend)
3. **Consider removing Railway dependency** if no longer needed
4. **Update documentation** to reflect D1 usage
5. **Set up monitoring** for D1 performance

## Support

For issues or questions:
- Cloudflare D1 Docs: https://developers.cloudflare.com/d1/
- Drizzle ORM D1 Docs: https://orm.drizzle.team/docs/get-started-sqlite#cloudflare-d1





