# 🔧 Setting Up DATABASE_URL - Quick Guide

## Option 1: Interactive Setup Script (Recommended)

Run the interactive setup script:

```bash
./scripts/setup-database-url.sh
```

This script will:
- ✅ Guide you through entering your PostgreSQL connection string
- ✅ Set DATABASE_URL for the main worker
- ✅ Optionally set DATABASE_URL for the API worker
- ✅ Verify the configuration

## Option 2: Manual Setup

### Step 1: Get Your PostgreSQL Connection String

You need your production PostgreSQL database connection string. It should look like:
```
postgresql://user:password@host:port/database?sslmode=require
```

**Where to find it:**
- **Neon**: Dashboard → Project → Connection String
- **Supabase**: Dashboard → Project Settings → Database → Connection String  
- **Railway**: Service → Variables → DATABASE_URL
- **Other providers**: Check your database provider's dashboard

### Step 2: Set DATABASE_URL for Main Worker

```bash
wrangler secret put DATABASE_URL --env production
```

When prompted, paste your PostgreSQL connection string (without quotes).

### Step 3: Set DATABASE_URL for API Worker (Optional)

If your API worker also needs database access:

```bash
wrangler secret put DATABASE_URL --config wrangler-api.toml --env production
```

Paste the same connection string when prompted.

### Step 4: Verify Configuration

```bash
# Check main worker
wrangler secret list --env production

# Check API worker
wrangler secret list --config wrangler-api.toml --env production

# Run verification
NODE_ENV=production DATABASE_URL="your-connection-string" pnpm run deploy:verify production
```

## Option 3: Non-Interactive Setup (For Automation)

If you have the connection string in an environment variable:

```bash
# Set from environment variable
echo "$DATABASE_URL" | wrangler secret put DATABASE_URL --env production

# Or pipe directly
echo "postgresql://user:pass@host:5432/db?sslmode=require" | wrangler secret put DATABASE_URL --env production
```

## Connection String Format

Your connection string should follow this format:

```
postgresql://[user]:[password]@[host]:[port]/[database]?sslmode=require
```

**Important:**
- ✅ Must start with `postgresql://`
- ✅ Include `?sslmode=require` for secure connections
- ✅ URL-encode special characters in password if needed
- ❌ Don't include quotes around the string

## Example Connection Strings

### Neon
```
postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Supabase
```
postgresql://postgres:password@db.abcdefghijklmnop.supabase.co:5432/postgres?sslmode=require
```

### Railway
```
postgresql://postgres:password@containers-us-west-123.railway.app:5432/railway?sslmode=require
```

## Troubleshooting

### Error: "Secret not found"
- Make sure you're logged into Cloudflare: `wrangler login`
- Verify you have permissions for the account

### Error: "Invalid connection string"
- Check that it starts with `postgresql://`
- Verify all parts (user, password, host, port, database) are present
- Ensure special characters in password are URL-encoded

### Error: "Connection refused" after setting
- Verify the database is accessible from the internet
- Check firewall rules allow Cloudflare IPs
- Test connection manually: `psql "your-connection-string"`

## After Setup

Once DATABASE_URL is configured:

1. **Verify it works:**
   ```bash
   NODE_ENV=production DATABASE_URL="your-url" pnpm run deploy:verify production
   ```

2. **Create a backup:**
   ```bash
   NODE_ENV=production DATABASE_URL="your-url" pnpm run backup:full
   ```

3. **Deploy safely:**
   ```bash
   DATABASE_URL="your-url" ./scripts/safe-deploy.sh production
   ```

## Security Notes

- ✅ Secrets are encrypted by Cloudflare
- ✅ Never commit connection strings to git
- ✅ Use different databases for development and production
- ✅ Rotate passwords regularly

---

**Ready to set it up?** Run: `./scripts/setup-database-url.sh`





