# Data Persistence Fix - Why Data is Lost on Redeploy

## 🔴 ROOT CAUSE

Your data (Learning Tracks, Login Details, Profiles) is being lost on redeploy because:

1. **Express Server Requires DATABASE_URL**: Your Express server (`server/index.ts`) needs `DATABASE_URL` environment variable to connect to PostgreSQL database
2. **Missing Cloudflare Workers Secret**: The `DATABASE_URL` is NOT configured as a Cloudflare Workers secret
3. **No Database Connection**: When the API worker tries to proxy to Express server, the Express server can't connect to the database
4. **D1 Database Not Configured**: The D1 database binding is commented out in `wrangler.toml`

## 📋 Current Architecture

```
Cloudflare Worker (worker/index.ts)
  ↓ (proxies via service binding)
API Worker (worker-api/index.ts)
  ↓ (proxies via API_URL)
Express Server (server/index.ts)
  ↓ (requires DATABASE_URL)
PostgreSQL Database (Neon/Supabase)
```

## ✅ SOLUTION OPTIONS

### Option 1: Configure DATABASE_URL in Cloudflare Workers (RECOMMENDED)

If your Express server is deployed separately (Railway, Render, Fly.io), set the `API_URL` secret:

```bash
# Set API_URL to point to your Express server
wrangler secret put API_URL --env production
# Enter: https://your-express-server.railway.app (or your server URL)
```

Then ensure your Express server has `DATABASE_URL` configured in its environment.

### Option 2: Use Cloudflare D1 Database (BEST FOR CLOUDFLARE)

1. Create a D1 database:
```bash
wrangler d1 create professionaldiver-db
```

2. Update `wrangler.toml` to uncomment and configure D1:
```toml
[[env.production.d1_databases]]
binding = "DB"
database_name = "professionaldiver-db"
database_id = "YOUR_D1_DATABASE_ID"
```

3. Run migrations:
```bash
wrangler d1 execute professionaldiver-db --file=./migrations/0000_tricky_ezekiel_stane.sql --env production
```

4. Update `server/db.ts` to support D1 database

### Option 3: Deploy Express Server Separately with Persistent Database

1. Deploy Express server to Railway/Render/Fly.io
2. Configure `DATABASE_URL` in that service's environment
3. Set `API_URL` in Cloudflare Workers to point to that server

## 🚀 IMMEDIATE FIX STEPS

### Step 1: Check Current Configuration

```bash
# Check if API_URL is set
wrangler secret list --env production

# Check if DATABASE_URL is set in your Express server deployment
```

### Step 2: Set API_URL (if Express server is separate)

```bash
wrangler secret put API_URL --env production
# Enter your Express server URL, e.g.: https://professionaldiver-api.railway.app
```

### Step 3: Verify Express Server Has DATABASE_URL

If Express server is deployed separately, ensure it has:
- `DATABASE_URL` environment variable set
- Database connection is persistent (not reset on redeploy)
- Database migrations have been run

### Step 4: Verify Database Connection

Test the connection:
```bash
# From your Express server
curl https://your-api-url/health
```

## 🔍 VERIFICATION

After fixing, verify:
1. ✅ Learning Tracks persist after redeploy
2. ✅ User login credentials work after redeploy  
3. ✅ User profiles remain after redeploy
4. ✅ Database connection is stable

## 📝 NOTES

- **Development**: Uses local SQLite (`local-dev.db`) - this file is NOT deployed
- **Production**: Requires PostgreSQL via `DATABASE_URL` or D1 database
- **Data Loss**: Happens because database connection is lost/missing on redeploy
- **Persistence**: Database must be external (Neon, Supabase, Railway) or Cloudflare D1

## 🎯 RECOMMENDED APPROACH

For Cloudflare Workers deployment, use **Cloudflare D1 Database**:
- Native integration with Workers
- No external dependencies
- Automatic persistence
- Free tier available
- Easy migrations

If you need PostgreSQL features, use **Option 3** (separate Express server with persistent PostgreSQL).





