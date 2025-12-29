# Set API_URL to Fix Lesson Errors

## The Problem
The API worker is trying to use D1 database (which doesn't have your lesson data), but it should proxy to Railway Express server (which has Supabase access).

## Solution: Set API_URL in API Worker

### Step 1: Find Your Railway Service URL

1. **Go to Railway Dashboard**: https://railway.app/dashboard
2. **Click on your project** (the one running your Express server)
3. **Click on your service** (the Express API service)
4. **Go to Settings → Networking**
5. **Find "Public Domain"** - it will look like:
   - `https://professional-diver-app-production.up.railway.app`
   - OR `https://your-service-name.up.railway.app`
6. **Copy the full URL** (including `https://`)

### Step 2: Set API_URL Secret in API Worker

Run this command and paste your Railway URL when prompted:

```bash
wrangler secret put API_URL --config wrangler-api.toml --env production
```

**When prompted, enter your Railway URL** (e.g., `https://professional-diver-app-production.up.railway.app`)

### Step 3: Verify It's Set

```bash
wrangler secret list --config wrangler-api.toml --env production
```

You should see `API_URL` in the list.

### Step 4: Test the Fix

1. Visit your site: https://professionaldiver.app
2. Try to open a lesson
3. The error should be gone! ✅

## How It Works Now

**Before (Broken):**
```
Frontend → Main Worker → API Worker → D1 Database ❌ (no data)
```

**After (Fixed):**
```
Frontend → Main Worker → API Worker → Railway Express → Supabase PostgreSQL ✅
```

## Quick Test

You can test your Railway URL directly:

```bash
# Replace with your actual Railway URL
curl https://your-railway-url.up.railway.app/api/health
```

Should return: `{"status":"ok"}` or similar.

