# Railway Deployment Configuration Guide

## Critical Issues to Check

Based on the diagnostic, your Railway backend is returning 502 errors. Here's what to check:

## 1. Required Environment Variables

### **CRITICAL - Must Have:**

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@host:5432/database
```

**⚠️ Without `DATABASE_URL`, the server will try to use SQLite which won't work on Railway!**

### **Important - Should Have:**

```env
# OpenAI (required for AI features)
OPENAI_API_KEY=sk-...

# LangSmith (required for AI observability)
LANGSMITH_API_KEY=lsv2_...
LANGSMITH_PROJECT=professional-diver-training-app

# Optional but recommended
STORMGLASS_API_KEY=...
OPENWEATHER_API_KEY=...
GEMINI_API_KEY=...
```

### **Optional - Nice to Have:**

```env
# Google Calendar (if using calendar features)
GOOGLE_SERVICE_ACCOUNT_JSON={...}
# OR
GOOGLE_SERVICE_ACCOUNT_JSON_B64=<base64-encoded-json>

# HighLevel CRM (if using CRM integration)
GHL_API_KEY=...
GHL_LOCATION_ID=...
CRM_MODE=local  # or 'highlevel' or 'dual'

# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLISHABLE_KEY=pk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Other services
SENDGRID_API_KEY=...
```

## 2. Railway Configuration

### Build Settings

In Railway dashboard, verify:

- **Build Command**: `npm run build` (or Railway auto-detects from `railway.json`)
- **Start Command**: `npm run start` (from `railway.json`)
- **Root Directory**: `/` (project root)

### Port Configuration

Railway automatically assigns a `PORT` environment variable. Your server should use it:

```typescript
const port = Number(process.env.PORT) || 5000;
```

✅ This is already configured correctly in `server/index.ts`

### Node Version

Your `package.json` specifies:
```json
"engines": {
  "node": "22.x",
  "npm": ">=10.0.0"
}
```

✅ Railway should respect this automatically.

## 3. Common Failure Points

### Database Connection Failure

**Symptoms:**
- Server crashes on startup
- "FATAL BOOT ERROR" in logs
- Database connection timeout

**Solutions:**
1. Verify `DATABASE_URL` is set correctly
2. Check database is accessible from Railway
3. Verify connection string format:
   ```
   postgresql://user:password@host:5432/database?sslmode=require
   ```
4. For Supabase, ensure connection pooling is enabled
5. Check database firewall/whitelist settings

### Missing Environment Variables

**Symptoms:**
- Server starts but features don't work
- API errors for specific endpoints
- Warnings in logs about missing keys

**Solutions:**
1. Review `server/bootstrap/env.ts` for required variables
2. Check Railway logs for warnings
3. Add missing variables in Railway dashboard

### Build Failures

**Symptoms:**
- Deployment fails before server starts
- TypeScript compilation errors
- Missing dependencies

**Solutions:**
1. Test build locally: `npm run build`
2. Check TypeScript errors: `npm run typecheck`
3. Verify all dependencies are in `package.json`
4. Check Railway build logs

### Startup Crashes

**Symptoms:**
- Server starts then immediately crashes
- "FATAL BOOT ERROR" in logs
- Process exits with code 1

**Common Causes:**
1. Database connection fails
2. Invalid environment variable format
3. Missing required files
4. Port already in use (unlikely on Railway)
5. Memory limits exceeded

## 4. Step-by-Step Recovery

### Step 1: Check Railway Logs

1. Go to Railway dashboard
2. Click on your service
3. Go to "Deployments" tab
4. Click on latest deployment
5. Check "Build Logs" and "Deploy Logs"

**Look for:**
- ❌ "FATAL BOOT ERROR"
- ❌ Database connection errors
- ❌ Missing environment variables
- ❌ TypeScript compilation errors
- ❌ Port binding errors

### Step 2: Verify Environment Variables

In Railway dashboard:
1. Go to your service
2. Click "Variables" tab
3. Verify all required variables are set
4. Check values are correct (no extra spaces, correct format)

### Step 3: Test Database Connection

If `DATABASE_URL` is set, test it:

```bash
# Using Railway CLI (if installed)
railway run node -e "console.log(process.env.DATABASE_URL)"

# Or check in Railway dashboard logs
# Look for: "🚀 Using PostgreSQL database for production"
```

### Step 4: Restart Service

1. In Railway dashboard
2. Click "Settings" → "Restart"
3. Or trigger a new deployment

### Step 5: Check Health Endpoint

After restart, test:
```bash
curl https://professional-diverapp-production.up.railway.app/health
```

Should return JSON with service status.

## 5. Quick Diagnostic Commands

### Check if service is running:
```bash
curl -I https://professional-diverapp-production.up.railway.app/health
```

### Check Railway status:
- Go to https://railway.app
- Check service status
- Review recent deployments

### Test locally with production config:
```bash
# Set environment variables
export NODE_ENV=production
export DATABASE_URL=your-database-url
export PORT=5000

# Test start command
npm run start
```

## 6. Railway-Specific Issues

### Service Not Deploying

**Check:**
- Is service paused? (unpause in dashboard)
- Is there a build error?
- Are environment variables blocking deployment?

### Port Issues

Railway automatically assigns `PORT`. Your code should use:
```typescript
const port = Number(process.env.PORT) || 5000;
```

✅ Already configured correctly.

### Memory Limits

If you hit memory limits:
- Check Railway plan limits
- Optimize startup code
- Lazy load heavy dependencies

### Build Timeouts

If builds timeout:
- Optimize build process
- Remove unnecessary build steps
- Check for hanging processes

## 7. Verification Checklist

Before considering the deployment fixed, verify:

- [ ] Railway service shows "Active" status
- [ ] Latest deployment succeeded
- [ ] Health endpoint returns 200: `/health`
- [ ] Database connection works (check logs)
- [ ] All required environment variables are set
- [ ] No errors in Railway logs
- [ ] Frontend can connect to backend API
- [ ] Diagnostic script passes: `npm run diagnose:deployment`

## 8. Getting Help

If issues persist:

1. **Check Railway Status Page**: https://status.railway.app
2. **Review Logs**: Railway dashboard → Service → Logs
3. **Test Locally**: Reproduce issue locally with production config
4. **Contact Support**: Railway support in dashboard

## 9. Prevention

To avoid future issues:

1. **Monitor Deployments**: Set up Railway alerts
2. **Test Before Deploying**: Run `npm run build` and `npm run start` locally
3. **Document Environment Variables**: Keep a list of required variables
4. **Use Railway CLI**: For easier debugging and management
5. **Regular Health Checks**: Monitor `/health` endpoint

## 10. Emergency Recovery

If site is completely down:

1. **Check Railway Dashboard**: Verify service status
2. **Review Latest Deployment**: Check for obvious errors
3. **Restart Service**: Try restarting in Railway
4. **Verify Database**: Ensure database is accessible
5. **Check Environment Variables**: Verify all required vars are set
6. **Rollback if Needed**: Revert to last working deployment
7. **Contact Support**: If nothing works, contact Railway support

---

**Next Steps:**
1. Check Railway logs for specific error messages
2. Verify `DATABASE_URL` is set correctly
3. Ensure all required environment variables are present
4. Restart the Railway service
5. Run diagnostic: `npm run diagnose:deployment`
