# 🎯 Deployment Action Plan - Fix Data Loss Issue

## 📊 Current Status Summary

### ✅ What's Working
- Cloudflare Workers deployed: `https://professionaldiver.app` ✅
- API_URL secret configured in Cloudflare Workers ✅
- Multiple Railway services found and responding ✅

### ❌ What's NOT Working
- Express server API endpoints return "Not Found" ❌
- API returns "Not implemented" when accessed via Cloudflare ❌
- Data is lost on redeploy ❌

## 🔍 Root Cause Analysis

**The Problem:**
1. Express server exists on Railway (health endpoints work)
2. But API routes are not working ("Not Found")
3. This means either:
   - Express server is not fully deployed
   - Routes are not properly configured
   - Server is running but API endpoints aren't registered

## 🚀 Action Plan

### IMMEDIATE ACTIONS (Do These Now)

#### Step 1: Check Railway Dashboard

1. **Go to Railway Dashboard:**
   - https://railway.app/dashboard
   - Login with your account

2. **Identify Your Express Server:**
   - Look for services named:
     - `professionaldiver-api`
     - `professional-diver-api`
     - `professionaldiver-training-api`
     - `diverwell-api`
   - Or any service that looks like your backend

3. **Check Service Status:**
   - Is it deployed and running?
   - Are there any errors in logs?
   - When was the last deployment?

#### Step 2: Verify Express Server Configuration

For each Railway service, check:

**A. Service Settings:**
- Root directory: Should be `/` or project root
- Start command: Should be `npm start` or `node dist/server/index.js`
- Build command: Should be `npm run build` (if needed)

**B. Environment Variables:**
- ✅ `DATABASE_URL` - **CRITICAL!** Must be set
- ✅ `NODE_ENV=production`
- ✅ Other required variables from your `.env.example`

**C. Database:**
- Is PostgreSQL database attached?
- Is `DATABASE_URL` automatically set by Railway?

#### Step 3: Check Service Logs

In Railway Dashboard → Service → Logs:

Look for:
- ✅ "Express server listening on port..."
- ✅ "Database connection verified"
- ✅ "Routes registered"
- ❌ Any error messages
- ❌ Database connection errors

#### Step 4: Redeploy Express Server (If Needed)

If the server isn't working properly:

1. **Trigger New Deployment:**
   - Railway Dashboard → Service → Deployments
   - Click "Redeploy" or push to GitHub

2. **Or Manual Deploy:**
   ```bash
   # If you have Railway CLI
   railway up
   ```

#### Step 5: Test Express Server Directly

Once you identify the correct service:

```bash
# Replace with your actual Railway URL
EXPRESS_URL="https://professionaldiver-api.railway.app"

# Test health
curl $EXPRESS_URL/health

# Test API health
curl $EXPRESS_URL/api/health

# Test tracks endpoint
curl $EXPRESS_URL/api/tracks

# Test auth endpoint
curl -X POST $EXPRESS_URL/api/auth/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

**Expected Results:**
- `/health` → Should return "OK" ✅
- `/api/health` → Should return JSON with service status ✅
- `/api/tracks` → Should return tracks array or empty array ✅
- `/api/auth/credentials` → Should return error (not "Not Found") ✅

#### Step 6: Update API_URL in Cloudflare Workers

Once you have the working Express server URL:

```bash
wrangler secret put API_URL --env production
```

**Enter the Railway URL** (e.g., `https://professionaldiver-api.railway.app`)

**Important:**
- No trailing slash
- Use HTTPS
- Use the exact URL that has working API endpoints

#### Step 7: Verify DATABASE_URL is Set

**In Railway Dashboard:**
1. Service → Variables
2. Check if `DATABASE_URL` exists
3. If not:
   - Add PostgreSQL database: New → Database → PostgreSQL
   - Railway will auto-set `DATABASE_URL`
   - Or manually add your database connection string

**Format should be:**
```
postgresql://user:password@host:port/database
```

#### Step 8: Run Database Migrations

If database is new or empty:

```bash
# Connect to your database and run migrations
# Option 1: Via Railway CLI
railway run npm run db:push

# Option 2: Via direct connection
psql $DATABASE_URL -f migrations/0000_tricky_ezekiel_stane.sql
```

#### Step 9: Test Full Connection

```bash
# Wait for changes to propagate
sleep 30

# Test via Cloudflare Workers
curl https://professionaldiver.app/api/health

# Should return actual API response (not "Not implemented")
```

## 📋 Verification Checklist

After completing the steps above:

- [ ] Express server is deployed and running on Railway
- [ ] Service logs show no errors
- [ ] `DATABASE_URL` is set in Railway environment variables
- [ ] Database migrations have been run
- [ ] Express server API endpoints work when tested directly
- [ ] `API_URL` is updated in Cloudflare Workers
- [ ] `curl https://professionaldiver.app/api/health` returns actual data
- [ ] Login works on the website
- [ ] Learning Tracks are accessible
- [ ] Data persists after redeploy

## 🎯 Most Likely Issues & Solutions

### Issue 1: Express Server Not Fully Deployed
**Solution:** Redeploy the service in Railway

### Issue 2: DATABASE_URL Not Set
**Solution:** Add PostgreSQL database in Railway or set `DATABASE_URL` manually

### Issue 3: API Routes Not Working
**Solution:** Check service logs, verify build/start commands are correct

### Issue 4: Wrong API_URL in Cloudflare
**Solution:** Update `API_URL` secret to point to correct Railway URL

## 🔗 Quick Links

- **Railway Dashboard:** https://railway.app/dashboard
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Test Script:** `./scripts/find-express-server.sh`
- **Verification Script:** `./scripts/verify-deployment.sh`

## 💡 Pro Tips

1. **Check Railway Logs First** - They'll tell you what's wrong
2. **Test Directly** - Always test the Railway URL directly before updating API_URL
3. **Verify DATABASE_URL** - This is the #1 cause of data loss
4. **Wait for Propagation** - Changes can take 30-60 seconds to propagate

## ✅ Success Criteria

You'll know it's fixed when:

1. ✅ `curl https://professionaldiver.app/api/health` returns JSON (not "Not implemented")
2. ✅ You can log in on the website
3. ✅ Learning Tracks appear
4. ✅ User profiles load
5. ✅ Data remains after redeploying Cloudflare Workers

---

**Next Step:** Go to Railway Dashboard and check your services! 🚀





