# 🚂 Railway Deployment - Step-by-Step Guide

## ✅ Step 1: Create Project

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Find and select your repository: `professional-diver-training` (or whatever it's named)
4. Railway will create the project

**Project Name:** "Professional Diver App" ✅ (Perfect name!)

## ✅ Step 2: Railway Will Auto-Detect

Railway should automatically:
- ✅ Detect it's a Node.js project
- ✅ Find your `package.json`
- ✅ Set up the service

## ⚙️ Step 3: Configure the Service

### A. Check Service Settings

1. Click on the service (it might be named after your repo)
2. Go to **Settings** tab
3. Verify:

**Root Directory:** `/` (default - usually correct)

**Start Command:**
```
npm start
```

**Build Command (if needed):**
```
npm run build
```

**Note:** Your `package.json` has:
- `"start": "cross-env NODE_ENV=production node dist/server/index.js"`

So Railway should use `npm start` automatically.

### B. Check Environment Variables

Go to **Variables** tab:

**Railway should auto-set:**
- `NODE_ENV=production` (might be set automatically)

**You need to add:**
- `DATABASE_URL` (will be set automatically when you add PostgreSQL - see Step 4)
- `SESSION_SECRET` (generate a random string)
- `OPENAI_API_KEY` (if you have one)
- `LANGSMITH_API_KEY` (if you have one)
- Any other variables from your `.env.example`

## ✅ Step 4: Add PostgreSQL Database

**This is CRITICAL for data persistence!**

1. In your Railway project, click **"New"** button
2. Select **"Database"**
3. Choose **"PostgreSQL"**
4. Railway will:
   - ✅ Create the database
   - ✅ Automatically set `DATABASE_URL` environment variable
   - ✅ Link it to your service

**Important:** The `DATABASE_URL` will be automatically added to your service's environment variables. You don't need to set it manually!

## ✅ Step 5: Add Other Environment Variables

Go to your service → **Variables** tab → **"New Variable"**

Add these (if you have them):

```
SESSION_SECRET=<generate a random string>
OPENAI_API_KEY=<your key if you have one>
LANGSMITH_API_KEY=<your key if you have one>
GHL_API_KEY=<your key if you have one>
```

**To generate SESSION_SECRET:**
```bash
# Run this locally:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as `SESSION_SECRET`.

## ✅ Step 6: Get Your Service URL

1. Railway Dashboard → Your Service
2. Go to **Settings** → **Networking**
3. Look for **"Public Domain"**
4. Click **"Generate Domain"** if needed
5. Copy the URL (e.g., `https://professional-diver-app-production.up.railway.app`)

**Or create a custom domain:**
- Click **"Custom Domain"**
- Enter: `api.professionaldiver.app` (or similar)
- Railway will set it up

## ✅ Step 7: Run Database Migrations

Once the database is created:

1. Go to your service → **Variables**
2. Copy the `DATABASE_URL` value (click the eye icon to reveal)
3. Run migrations locally:

```bash
# Set the DATABASE_URL
export DATABASE_URL="<paste the value from Railway>"

# Run migrations
npm run db:push

# Or manually:
psql $DATABASE_URL -f migrations/0000_tricky_ezekiel_stane.sql
```

**Or use Railway CLI:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run npm run db:push
```

## ✅ Step 8: Update API_URL in Cloudflare Workers

Once you have your Railway service URL:

```bash
wrangler secret put API_URL --env production
```

**When prompted, enter your Railway URL:**
```
https://your-service-name.up.railway.app
```

**Important:**
- No trailing slash
- Use HTTPS
- Use the exact URL from Railway

## ✅ Step 9: Test Everything

### Test Railway Server Directly:

```bash
# Replace with your actual Railway URL
RAILWAY_URL="https://your-service.up.railway.app"

# Test health
curl $RAILWAY_URL/health

# Test API health
curl $RAILWAY_URL/api/health

# Should return JSON with service status
```

### Test Via Cloudflare Workers:

```bash
# Wait 30 seconds for changes to propagate
sleep 30

# Test
curl https://professionaldiver.app/api/health

# Should return actual data (not "Not implemented")
```

## ✅ Step 10: Verify Data Persistence

1. **Create a test track** on the website
2. **Redeploy Cloudflare Workers:**
   ```bash
   pnpm run deploy:prod
   ```
3. **Check if track still exists** ✅

If it does, data persistence is fixed! 🎉

## 📋 Checklist

- [ ] Project created: "Professional Diver App"
- [ ] Service deployed from GitHub
- [ ] PostgreSQL database added
- [ ] `DATABASE_URL` automatically set
- [ ] Other environment variables added
- [ ] Service URL obtained
- [ ] Database migrations run
- [ ] `API_URL` updated in Cloudflare Workers
- [ ] Railway server tested directly
- [ ] Cloudflare connection tested
- [ ] Data persists after redeploy

## 🎯 Expected Railway URL Format

Your Railway URL will look like:
```
https://professional-diver-app-production-xxxx.up.railway.app
```

Or if you set a custom domain:
```
https://api.professionaldiver.app
```

## 🚨 Common Issues

### Issue: Service won't start
**Check:**
- Service logs in Railway dashboard
- Build command is correct
- Start command is correct
- Environment variables are set

### Issue: Database connection fails
**Check:**
- `DATABASE_URL` is set in Variables
- Database is running (check in Railway dashboard)
- Migrations have been run

### Issue: API returns errors
**Check:**
- Service logs for errors
- All required environment variables are set
- Database is accessible

## 💡 Pro Tips

1. **Check Logs First** - Railway shows real-time logs
2. **Use GitHub Integration** - Auto-deploys on push
3. **Test Locally First** - Make sure `npm start` works
4. **Save Your DATABASE_URL** - Keep it secure!

---

**Once deployed, your data will persist across redeploys!** 🎉





