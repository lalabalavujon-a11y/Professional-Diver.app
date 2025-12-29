# 🚀 Deploy Express Server - First Time Guide

## 🎯 The Problem

You have:
- ✅ Code on GitHub
- ✅ Frontend on Cloudflare Workers
- ❌ **No Express server deployed** (this is why data is lost!)

## 🚀 Quick Deploy to Railway (Easiest Option)

### Step 1: Sign Up for Railway

1. Go to: https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (easiest - connects to your repo)

### Step 2: Create New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository: `professional-diver-training` (or whatever it's named)
4. Railway will detect it's a Node.js project

### Step 3: Configure the Service

Railway will automatically:
- ✅ Detect Node.js
- ✅ Find `package.json`
- ✅ Set up build process

**You need to configure:**

1. **Root Directory:** (usually `/` - leave default)
2. **Start Command:** 
   ```
   npm start
   ```
   Or if that doesn't work:
   ```
   node dist/server/index.js
   ```

3. **Build Command (if needed):**
   ```
   npm run build
   ```

### Step 4: Add PostgreSQL Database

1. In Railway project, click **"New"**
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway will:
   - ✅ Create database
   - ✅ Automatically set `DATABASE_URL` environment variable
   - ✅ Connect it to your service

### Step 5: Set Environment Variables

Go to your service → **Variables** tab:

**Required Variables:**
```
NODE_ENV=production
DATABASE_URL=<automatically set by Railway>
```

**Other Variables (from your .env.example):**
- `OPENAI_API_KEY` (if using AI features)
- `LANGSMITH_API_KEY` (if using LangSmith)
- `SESSION_SECRET` (generate a random string)
- `GHL_API_KEY` (if using GoHighLevel)
- Any other variables your app needs

### Step 6: Get Your Service URL

1. Railway Dashboard → Your Service
2. Go to **Settings** → **Networking**
3. Look for **"Public Domain"** or **"Custom Domain"**
4. Copy the URL (e.g., `https://professionaldiver-api.railway.app`)

### Step 7: Update API_URL in Cloudflare Workers

```bash
wrangler secret put API_URL --env production
```

**When prompted, enter your Railway URL:**
```
https://your-service-name.railway.app
```

**Important:** No trailing slash!

### Step 8: Run Database Migrations

```bash
# Option 1: Via Railway CLI
railway run npm run db:push

# Option 2: Connect directly
# Get DATABASE_URL from Railway → Service → Variables
# Then run:
psql $DATABASE_URL -f migrations/0000_tricky_ezekiel_stane.sql
```

### Step 9: Test Everything

```bash
# Test Railway server directly
curl https://your-railway-url.railway.app/health
curl https://your-railway-url.railway.app/api/health

# Test via Cloudflare Workers
curl https://professionaldiver.app/api/health

# Should return actual data (not "Not implemented")
```

## ✅ Success Checklist

After deployment:

- [ ] Railway service is running
- [ ] Service logs show no errors
- [ ] `DATABASE_URL` is set in Railway
- [ ] Database migrations have run
- [ ] `API_URL` is updated in Cloudflare Workers
- [ ] `curl https://professionaldiver.app/api/health` works
- [ ] Login works on website
- [ ] Data persists after redeploy

## 🎯 Why This Fixes Data Loss

**Before:**
- No Express server = No database = Data lost on redeploy ❌

**After:**
- Express server on Railway = Database connected = Data persists ✅

## 📝 Alternative: Deploy to Render

If you prefer Render:

1. Go to: https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
6. Add PostgreSQL database: "New" → "PostgreSQL"
7. Set environment variables
8. Get service URL
9. Update `API_URL` in Cloudflare Workers

## 🔗 Quick Links

- **Railway:** https://railway.app
- **Render:** https://render.com
- **Fly.io:** https://fly.io
- **Cloudflare Dashboard:** https://dash.cloudflare.com

## 💡 Pro Tips

1. **Start with Railway** - It's the easiest
2. **Use GitHub integration** - Automatic deployments on push
3. **Check logs** - Railway shows real-time logs
4. **Test locally first** - Make sure `npm start` works locally

---

**Once you deploy the Express server, data will persist across redeploys!** 🎉





