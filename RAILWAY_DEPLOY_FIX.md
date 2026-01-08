# Railway Deployment Fix Guide

## Problem
Railway hasn't deployed anything new in 2 days, even though code has been pushed to `main`.

## Immediate Solution - Manual Trigger via Railway Dashboard

### Option 1: Railway Dashboard (Easiest)
1. **Go to Railway Dashboard**: https://railway.app
2. **Select your project**
3. **Click on your service** (the one hosting the app)
4. **Click "Deployments" tab**
5. **Click "Redeploy"** on the latest deployment, OR
6. **Click "New Deployment"** and select the `main` branch
7. **Monitor the deployment logs** to ensure it completes successfully

### Option 2: Railway CLI (After Login)
Once you've logged in to Railway CLI in your terminal:
```bash
# Login (opens browser)
railway login

# Link to your project
railway link

# Deploy
railway up
```

### Option 3: Check Railway Configuration
1. **Go to Railway Dashboard** → Your Project → Settings
2. **Check "GitHub Integration"**:
   - Verify the repository is connected correctly
   - Check which branch Railway is watching (should be `main`)
   - Ensure "Auto Deploy" is enabled
3. **If disconnected, reconnect**:
   - Disconnect the current GitHub integration
   - Reconnect and select the correct repository and branch (`main`)

## Verification Steps

### 1. Check What Branch Railway is Watching
- Railway Dashboard → Project → Service → Settings → Source
- Should show: `main` branch
- Should have: "Auto Deploy" enabled

### 2. Verify Recent Commits Were Pushed
Run this locally:
```bash
git log --oneline -5 main
```

### 3. Check Railway Deployment Logs
- Railway Dashboard → Deployments
- Look for any failed deployments
- Check error messages if deployments failed

### 4. Force a New Deployment
In Railway Dashboard:
- Go to your service
- Click "Deployments"
- Click "Trigger Deploy" or "Redeploy"
- Select `main` branch
- Monitor the build logs

## Common Issues & Fixes

### Issue: Railway not connected to GitHub
**Fix**: Reconnect GitHub integration in Railway dashboard

### Issue: Railway watching wrong branch
**Fix**: Change branch in Railway settings to `main`

### Issue: Auto Deploy disabled
**Fix**: Enable "Auto Deploy" in Railway service settings

### Issue: Build failures
**Fix**: Check deployment logs for errors, fix build issues

### Issue: GitHub webhook not working
**Fix**: Railway → Project Settings → GitHub Integration → Reconnect

## After Deployment

1. **Clear Cloudflare Cache**:
   - Cloudflare Dashboard → Caching → Purge Everything
   - Or use: Caching → Custom Purge → `https://your-domain.com/*`

2. **Verify Deployment**:
   ```bash
   curl -I https://your-railway-url.up.railway.app/api/health
   ```

3. **Check Live Site**:
   - Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or use incognito/private browsing mode

## Quick Command Reference

```bash
# Check recent commits on main
git log --oneline -10 main

# Verify main branch is up to date
git fetch origin main
git log origin/main --oneline -5

# If Railway CLI is installed and you're logged in:
railway link          # Link to project
railway up            # Deploy current branch
railway logs          # View deployment logs
railway status        # Check deployment status
```

