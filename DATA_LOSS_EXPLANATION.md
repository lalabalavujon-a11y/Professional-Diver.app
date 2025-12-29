# Why Data is Lost on Redeploy - Explanation

## 🔴 The Problem

When you redeploy, you lose:
- ✅ Learning Tracks
- ✅ Login Details  
- ✅ User Profiles

## 🔍 Root Cause

Your application architecture has **two separate services**:

1. **Cloudflare Workers** (Frontend + API Proxy)
   - Serves static files
   - Proxies API requests to Express server

2. **Express Server** (Backend API)
   - Handles all database operations
   - Requires `DATABASE_URL` to connect to PostgreSQL
   - Stores all your data (tracks, users, profiles)

### What Happens on Redeploy:

```
❌ BEFORE FIX:
1. You redeploy Cloudflare Workers
2. Workers try to proxy to Express server
3. Express server either:
   - Isn't running, OR
   - Doesn't have DATABASE_URL configured
4. Database connection fails
5. All data appears "lost" (actually just inaccessible)
```

## ✅ The Solution

You need to ensure:

1. **Express Server is Running**
   - Deployed to Railway, Render, or Fly.io
   - Always running (not just during development)

2. **DATABASE_URL is Configured**
   - Set in Express server's environment variables
   - Points to your PostgreSQL database (Neon, Supabase, etc.)
   - **This is the critical missing piece!**

3. **API_URL is Set in Cloudflare Workers**
   - Cloudflare Workers need to know where your Express server is
   - Set via: `wrangler secret put API_URL --env production`

## 🚀 Quick Fix (3 Steps)

### Step 1: Verify Express Server Has DATABASE_URL

If using Railway:
```bash
# Check in Railway dashboard → Your Service → Variables
# Ensure DATABASE_URL is set to your PostgreSQL connection string
```

If using Render:
```bash
# Check in Render dashboard → Your Service → Environment
# Ensure DATABASE_URL is set
```

### Step 2: Set API_URL in Cloudflare Workers

```bash
wrangler secret put API_URL --env production
# Enter your Express server URL, e.g.:
# https://professionaldiver-api.railway.app
```

### Step 3: Verify Everything Works

```bash
# Test Express server
curl https://your-express-server-url/health

# Test database connection
curl https://your-express-server-url/api/health

# Test deployed site
curl https://professionaldiver.app/health
```

## 📊 Architecture Diagram

```
┌─────────────────────────────────────┐
│   Cloudflare Workers                 │
│   (professionaldiver.app)           │
│   - Serves static files              │
│   - Proxies /api/* requests          │
└──────────────┬──────────────────────┘
               │ (via API_URL secret)
               ↓
┌─────────────────────────────────────┐
│   Express Server                     │
│   (Railway/Render/Fly.io)            │
│   - Handles all API requests         │
│   - Requires DATABASE_URL ⚠️         │
└──────────────┬──────────────────────┘
               │ (via DATABASE_URL)
               ↓
┌─────────────────────────────────────┐
│   PostgreSQL Database                │
│   (Neon/Supabase/etc.)               │
│   - Stores all your data             │
│   - Learning Tracks                  │
│   - User Accounts                    │
│   - Profiles                         │
└─────────────────────────────────────┘
```

## 🎯 Why This Happens

- **Development**: Uses local SQLite (`local-dev.db`) - file-based, persists locally
- **Production**: Uses PostgreSQL - requires connection string
- **On Redeploy**: If `DATABASE_URL` isn't configured, Express server can't connect
- **Result**: Data appears "lost" but is actually just inaccessible

## ✅ After Fix

Once `DATABASE_URL` is properly configured:
- ✅ Data persists across redeploys
- ✅ Learning Tracks remain
- ✅ Login credentials work
- ✅ User profiles are preserved

## 📝 Files to Check

1. **Express Server Environment** (Railway/Render/Fly.io)
   - Must have `DATABASE_URL` set

2. **Cloudflare Workers Secrets**
   - Must have `API_URL` set
   - Check with: `wrangler secret list --env production`

3. **Database Provider** (Neon/Supabase/etc.)
   - Database must be running
   - Connection string must be valid

## 🔗 Related Documentation

- See `DATA_PERSISTENCE_FIX.md` for detailed solutions
- See `DEPLOYMENT_CHECKLIST.md` for pre-deployment steps





