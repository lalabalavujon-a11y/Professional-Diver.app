# Express Server Finder - Step-by-Step Guide

## 🔍 Current Status

- ✅ **API_URL secret exists** in Cloudflare Workers
- ❌ **Express server not connected** (API returns "Not implemented")
- ❓ **Express server URL unknown**

## 📋 Step-by-Step Verification Process

### Step 1: Run the Finder Script

```bash
./scripts/find-express-server.sh
```

This will test common deployment URLs automatically.

### Step 2: Manual Platform Checks

If the script doesn't find it, check these platforms manually:

#### A. Railway Dashboard
1. Go to: https://railway.app/dashboard
2. Look for services/projects
3. Check service names: `professionaldiver`, `api`, `backend`, `express`
4. Click on the service → Settings → Variables
5. Check for:
   - Service URL (e.g., `https://xxx.railway.app`)
   - `DATABASE_URL` environment variable

**To get Railway URL:**
- Railway Dashboard → Your Service → Settings → Networking
- Look for "Public Domain" or "Custom Domain"

#### B. Render Dashboard
1. Go to: https://dashboard.render.com
2. Look for "Web Services"
3. Check service names
4. Click service → Environment tab
5. Check for:
   - Service URL (e.g., `https://xxx.onrender.com`)
   - `DATABASE_URL` environment variable

#### C. Fly.io
```bash
# List all apps
fly apps list

# Check specific app status
fly status -a professionaldiver-api

# List secrets (includes DATABASE_URL)
fly secrets list -a professionaldiver-api
```

#### D. Vercel Dashboard
1. Go to: https://vercel.com/dashboard
2. Look for projects
3. Check project settings → Domains
4. Look for API routes configuration

### Step 3: Check Cloudflare Dashboard

Even though we can't read the API_URL value, we can see if it's set:

1. Go to: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **professionaldiver-app-production**
3. Go to: **Settings** → **Variables**
4. Look for `API_URL` in the list
5. If it exists, you can **update it** (even if you can't read the current value)

### Step 4: Test the Express Server

Once you find the URL, test it:

```bash
# Test health endpoint
curl https://your-express-server-url/health

# Test API health endpoint
curl https://your-express-server-url/api/health

# Should return JSON with status information
```

**Expected Response:**
```json
{
  "status": "ok",
  "services": {
    "db": "connected",
    "api": "running"
  }
}
```

### Step 5: Verify DATABASE_URL

**If using Railway:**
1. Railway Dashboard → Service → Variables
2. Check if `DATABASE_URL` is set
3. Format should be: `postgresql://user:password@host:port/database`

**If using Render:**
1. Render Dashboard → Service → Environment
2. Check if `DATABASE_URL` is set

**If using Fly.io:**
```bash
fly secrets list -a your-app-name
# Should show DATABASE_URL
```

### Step 6: Update API_URL in Cloudflare Workers

Once you have the Express server URL:

```bash
wrangler secret put API_URL --env production
# When prompted, enter: https://your-express-server-url
```

**Important:** Don't include trailing slash:
- ✅ Correct: `https://api.railway.app`
- ❌ Wrong: `https://api.railway.app/`

### Step 7: Verify Connection

After updating API_URL:

```bash
# Wait 30 seconds for changes to propagate
sleep 30

# Test the connection
curl https://professionaldiver.app/api/health

# Should NOT return "Not implemented"
# Should return actual API response
```

## 🚨 If Express Server is NOT Deployed

If you can't find the Express server anywhere, you need to deploy it:

### Quick Deploy to Railway (Recommended)

1. **Sign up/Login to Railway:**
   - https://railway.app
   - Connect GitHub account

2. **Create New Project:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Configure Service:**
   - Railway will detect it's a Node.js project
   - Set root directory (if needed)
   - Set start command: `npm start` or `node dist/server/index.js`

4. **Add PostgreSQL Database:**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will create database and set `DATABASE_URL` automatically

5. **Set Environment Variables:**
   - Go to Service → Variables
   - Add all required variables from `.env.example`
   - **Important:** `DATABASE_URL` is set automatically by Railway

6. **Get Service URL:**
   - Railway Dashboard → Service → Settings → Networking
   - Copy the public domain URL

7. **Update API_URL:**
   ```bash
   wrangler secret put API_URL --env production
   # Enter the Railway URL
   ```

## 📝 Checklist

- [ ] Run finder script: `./scripts/find-express-server.sh`
- [ ] Check Railway dashboard
- [ ] Check Render dashboard
- [ ] Check Fly.io (if used)
- [ ] Check Vercel dashboard (if used)
- [ ] Test Express server URL directly
- [ ] Verify `DATABASE_URL` is set in Express server
- [ ] Update `API_URL` in Cloudflare Workers
- [ ] Test connection: `curl https://professionaldiver.app/api/health`
- [ ] Verify data persists after redeploy

## 🎯 Success Criteria

You'll know it's working when:

1. ✅ `curl https://professionaldiver.app/api/health` returns actual data (not "Not implemented")
2. ✅ Login works on the website
3. ✅ Learning Tracks are accessible
4. ✅ User profiles load correctly
5. ✅ Data persists after redeploying Cloudflare Workers

## 🔗 Quick Links

- **Railway Dashboard:** https://railway.app/dashboard
- **Render Dashboard:** https://dashboard.render.com
- **Fly.io Dashboard:** https://fly.io/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Cloudflare Dashboard:** https://dash.cloudflare.com





