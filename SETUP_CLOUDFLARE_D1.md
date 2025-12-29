# 🚀 Setting Up Cloudflare D1 Database

**D1 is Cloudflare's native SQLite database** - perfect for Cloudflare Workers! It's:
- ✅ **Free** for reasonable usage
- ✅ **Native** to Cloudflare (no external database needed)
- ✅ **SQLite-based** (matches your development setup)
- ✅ **Automatic backups** to R2
- ✅ **No connection strings** needed

## Why D1 vs PostgreSQL?

| Feature | D1 (SQLite) | PostgreSQL (Neon/Supabase) |
|---------|-------------|----------------------------|
| **Cost** | Free tier available | May have costs |
| **Setup** | Native to Cloudflare | External service |
| **Connection** | No connection string | Requires DATABASE_URL |
| **Latency** | Very low (same edge) | Network latency |
| **Scalability** | Good for most apps | Better for very large scale |
| **SQL Features** | SQLite (good for most) | Full PostgreSQL |

**Recommendation:** Use D1 if you don't need advanced PostgreSQL features. It's simpler and free!

## Setup Steps

### Step 1: Create D1 Database

```bash
# Create the D1 database
wrangler d1 create professionaldiver-db
```

This will output something like:
```
✅ Successfully created DB 'professionaldiver-db' in region APAC
Created your database using D1's new storage backend. The new storage backend is not yet recommended for production workloads, but backs up your data via snapshots to R2.

[[d1_databases]]
binding = "DB"
database_name = "professionaldiver-db"
database_id = "abc123def456..."  # <-- Copy this ID
```

### Step 2: Update wrangler.toml

Update `wrangler.toml` with the database_id from Step 1:

```toml
# D1 Database binding for production
[[env.production.d1_databases]]
binding = "DB"
database_name = "professionaldiver-db"
database_id = "your-actual-database-id-here"  # Replace with ID from Step 1
```

### Step 3: Update wrangler-api.toml

Update `wrangler-api.toml` with the same database_id:

```toml
# D1 Database binding for production
[[env.production.d1_databases]]
binding = "DB"
database_name = "professionaldiver-db"
database_id = "your-actual-database-id-here"  # Same ID as above
```

### Step 4: Run Migrations

```bash
# Run migrations to create tables
wrangler d1 execute professionaldiver-db --file=./migrations/0000_tricky_ezekiel_stane.sql --env production
```

### Step 5: Update Code to Use D1

The code needs to be updated to use D1 when available. Currently it's set up for PostgreSQL. We'll need to:

1. Update `server/db.ts` to support D1
2. Use D1 binding in workers
3. Update schema to work with D1 (SQLite)

### Step 6: Migrate Data (If You Have Existing Data)

If you have data in PostgreSQL that you want to migrate:

```bash
# Export from PostgreSQL
pg_dump $DATABASE_URL --data-only --table=users --table=tracks --table=lessons > data_export.sql

# Import to D1 (you'll need to convert the SQL format)
wrangler d1 execute professionaldiver-db --file=data_export.sql --env production
```

## Quick Setup Script

I'll create a script to automate this setup. For now, here are the manual steps:

```bash
# 1. Create D1 database
wrangler d1 create professionaldiver-db

# 2. Copy the database_id from output and update wrangler.toml

# 3. Run migrations
wrangler d1 execute professionaldiver-db --file=./migrations/0000_tricky_ezekiel_stane.sql --env production

# 4. Verify database
wrangler d1 info professionaldiver-db
```

## Code Changes Needed

To fully support D1, we need to:

1. **Update `server/db.ts`** to detect D1 binding
2. **Update worker code** to pass D1 binding
3. **Use SQLite schema** for D1 (already have `schema-sqlite.ts`)

Would you like me to:
1. **Set up D1 now** (create database, update configs, run migrations)?
2. **Update the code** to support D1 alongside PostgreSQL?
3. **Create a migration script** to move from PostgreSQL to D1?

## Advantages of D1

- ✅ **No DATABASE_URL needed** - No secrets to manage!
- ✅ **Free tier** - Generous free limits
- ✅ **Fast** - Runs on Cloudflare's edge
- ✅ **Automatic backups** - Backed up to R2 automatically
- ✅ **Simple** - Native Cloudflare integration

## Next Steps

Choose one:
1. **Set up D1** (I'll create the database and update configs)
2. **Keep PostgreSQL** (set up DATABASE_URL secret instead)
3. **Support both** (use D1 if available, fallback to PostgreSQL)

Let me know which option you prefer!





