# Merge Staging → Main: Production DB Fix

## Current Situation

- ✅ **Staging:** Working (`postgresql-connected`)
- ❌ **Production:** Broken (`database-error: db.get is not a function`)
- ✅ **Fix:** Ready on `staging` branch

## What's Being Merged

The following fixes are on `staging` and need to go to `main`:

1. **Health Check Fix** (`server/health.ts`)
   - Changed `db.get()` to `db.execute(sql\`SELECT 1\`)` (Drizzle API)

2. **Database Initialization** (`server/db.ts`)
   - Prioritize `DATABASE_URL` (always use Postgres if set)

3. **CORS Update** (`server/index.ts`)
   - Support Cloudflare Pages preview deployments

## Step-by-Step Merge Process

### Step 1: Verify Staging is Working

```bash
curl -s https://staging-api.professionaldiver.app/health | jq '.services.db'
```

**Expected:** `"postgresql-connected"`

### Step 2: Check Current Branch

```bash
git branch
# Should be on 'staging'
```

### Step 3: Ensure Staging is Up to Date

```bash
git fetch origin
git status
# Should show "Your branch is up to date"
```

### Step 4: Create PR or Merge Directly

#### Option A: Create PR (Recommended - Shows CI Status)

1. **Push staging to GitHub** (if not already):
   ```bash
   git push origin staging
   ```

2. **Create PR on GitHub:**
   - Go to GitHub → Pull requests → New PR
   - Base: `main`
   - Compare: `staging`
   - Title: "fix: production database health check (merge staging → main)"
   - Description: "Merges DB health check fix and improvements from staging to production"

3. **Wait for CI to pass:**
   - CI will run lint, typecheck, test, build
   - All should pass ✅

4. **Merge PR:**
   - Click "Merge pull request"
   - Railway will auto-deploy production service

#### Option B: Merge Directly (Faster, but skips CI on merge)

```bash
# Switch to main
git checkout main

# Pull latest
git pull origin main

# Merge staging
git merge staging

# Push to trigger Railway deployment
git push origin main
```

**Note:** Option A is safer because it shows CI status before merge.

### Step 5: Monitor Railway Deployment

1. Go to Railway Dashboard
2. Click on **production service**
3. Go to **Deployments** tab
4. Watch for new deployment triggered by `main` branch push
5. Wait for deployment to complete (usually 2-5 minutes)

### Step 6: Verify Production Fix

After deployment completes:

```bash
# Test production health endpoint
curl -s https://api.professionaldiver.app/health | jq '.services.db'
```

**Expected:** `"postgresql-connected"` ✅

If still showing error:
- Check Railway logs for errors
- Verify `DATABASE_URL` is set in Railway production service
- Check deployment logs in Railway dashboard

### Step 7: Full Verification

```bash
# Run full verification script
./verify-railway-env.sh
```

Or manually:

```bash
# Staging
curl -s https://staging-api.professionaldiver.app/health | jq '.'

# Production
curl -s https://api.professionaldiver.app/health | jq '.'
```

Both should show:
```json
{
  "status": "ok",
  "services": {
    "db": "postgresql-connected"
  }
}
```

---

## Troubleshooting

### If Production Still Shows Error After Merge

1. **Check Railway Variables:**
   - Railway Dashboard → Production service → Variables
   - Verify `DATABASE_URL` is set
   - Verify `NODE_ENV=production` is set

2. **Check Deployment Logs:**
   - Railway Dashboard → Production service → Deployments → Latest
   - Look for errors during build/deploy

3. **Verify Code Was Deployed:**
   - Check deployment commit SHA matches your merge commit
   - Railway should show "Deployed from main branch"

4. **Manual Redeploy:**
   - Railway Dashboard → Production service → Deployments
   - Click "Redeploy" to force new deployment

### If CI Fails on PR

- Check CI logs for specific errors
- Fix any lint/typecheck/test/build issues
- Push fixes to `staging` branch
- PR will update automatically

---

## After Successful Merge

Once production shows `postgresql-connected`:

1. ✅ **Production DB fixed**
2. ✅ **Set Cloudflare Pages env vars** (if not done)
3. ✅ **Test end-to-end:** Frontend → API → Database
4. ✅ **Clean up unused GitHub Secrets** (optional)

---

## Quick Command Reference

```bash
# Check current branch
git branch

# Switch to main
git checkout main

# Merge staging into main
git merge staging

# Push to trigger Railway deployment
git push origin main

# Test production after deploy
curl -s https://api.professionaldiver.app/health | jq '.services.db'
```

---

**Ready to merge?** Follow Step 4 (Option A recommended for safety).
