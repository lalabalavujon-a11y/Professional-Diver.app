# Final Setup Actions - Complete in 30 Minutes

## ✅ Step 1: Staging Branch Created

**Status:** ✅ **DONE**

The `staging` branch has been created and pushed to GitHub.

---

## ⚠️ Step 2: GitHub Branch Protection (10 minutes)

### Action Required

1. Go to: `https://github.com/lalabalavujon-a11y/Professional-Diver.app/settings/branches`
2. Click **"Add branch protection rule"**
3. **Branch name pattern:** `main`
4. Enable these settings:

**Required:**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: **1** (recommended)
  - ✅ Dismiss stale approvals when new commits are pushed
- ✅ **Require status checks to pass before merging**
  - Select: **"CI / build"** (or "build" if that's what shows)
  - ✅ Require branches to be up to date before merging
- ✅ **Require conversation resolution before merging**
- ✅ **Do not allow bypassing the above settings**
- ✅ **Block force pushes**
- ✅ **Block deletions**

**Save rule**

**Result:** `main` is now protected - no direct pushes, CI must pass.

---

## ⚠️ Step 3: Railway Services Split (20 minutes)

### A) Create Staging Service

1. Go to Railway dashboard
2. Open your project
3. **New Service** → **GitHub Repo** → Select `Professional-Diver.app`
4. **Configure:**
   - **Name:** `professional-diver-api-staging`
   - **Branch:** `staging`
   - Build/Start commands auto-detected from `railway.json`

### B) Create Production Service

1. **New Service** → **GitHub Repo** → Same repo
2. **Configure:**
   - **Name:** `professional-diver-api-prod`
   - **Branch:** `main`
   - Build/Start commands auto-detected

### C) Environment Variables

**For both services → Variables tab:**

Copy from your current service:
- `DATABASE_URL` (use staging DB for staging if available)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` (test key for staging, live for prod)
- `STRIPE_WEBHOOK_SECRET`
- `SENDGRID_API_KEY`
- `NODE_ENV=production`
- All other API keys/secrets

**Important:**
- Staging: Use test/development keys where possible
- Production: Use live/production keys
- Consider separate Supabase projects (optional)

---

## ⚠️ Step 4: Cloudflare Routing (Optional - for now)

**Current:**
- `api.professionaldiver.app/*` → Railway prod

**Recommended (later):**
- `api.professionaldiver.app/*` → Railway prod
- `staging-api.professionaldiver.app/*` → Railway staging

**For now:** Test staging via Railway's generated URL directly.

---

## ✅ Step 5: Your New Workflow

### Daily Development

1. **Feature branch:**
   ```bash
   git checkout -b feature/my-feature
   # Make changes
   git push origin feature/my-feature
   ```

2. **PR to `staging`:**
   - Open PR: `feature/my-feature` → `staging`
   - CI runs automatically (lint, test, build)
   - Cloudflare creates preview deployment
   - Review and merge

3. **Staging auto-deploys:**
   - Railway `professional-diver-api-staging` deploys automatically
   - Test: `staging-api.professionaldiver.app` (or Railway URL)

4. **Promote to production:**
   - PR: `staging` → `main`
   - CI runs (must pass - branch protection enforces)
   - After merge:
     - Railway `professional-diver-api-prod` deploys
     - Cloudflare Pages deploys frontend

---

## Verification Checklist

After completing Steps 2-3:

- [ ] GitHub branch protection enabled for `main`
- [ ] Railway `professional-diver-api-staging` service created
- [ ] Railway `professional-diver-api-prod` service created
- [ ] Staging service deploys from `staging` branch
- [ ] Prod service deploys from `main` branch
- [ ] Environment variables set in both services
- [ ] Test: Push to `staging` → staging deploys ✅
- [ ] Test: Merge `staging` → `main` → prod deploys ✅

---

## Quick Test Commands

### Test Staging Deployment

```bash
# Make a small change
git checkout staging
echo "# Test" >> README.md
git add README.md
git commit -m "Test staging deployment"
git push origin staging
```

**Check:** Railway dashboard → `professional-diver-api-staging` should deploy

### Test Production Deployment

```bash
# Merge staging to main
git checkout main
git merge staging
git push origin main
```

**Check:** 
- Railway dashboard → `professional-diver-api-prod` should deploy
- CI must pass (branch protection enforces)

---

## Database Migrations

**Rule:** Only run migrations on `main` (production)

**Process:**
1. Generate migration: `drizzle-kit generate`
2. Review `migrations/` folder
3. Test on staging first (if staging DB exists)
4. Merge to `main`
5. Production migration runs automatically (or manually in Railway)

**Never:**
- ❌ `db:push --force` on production
- ❌ Manual migrations mid-debug
- ❌ Skip staging verification

---

## What You've Achieved

✅ **Staging branch created** (safe testing environment)  
✅ **Infrastructure fireproofed** (Node pinned, CI gates, cost limits)  
✅ **Code quality enforced** (lint + build block, typecheck reports)  
⚠️ **Branch protection** (10 min - prevents broken merges)  
⚠️ **Railway services** (20 min - staging + prod separation)

---

## Time Remaining

- GitHub branch protection: **10 minutes**
- Railway services setup: **20 minutes**
- Testing: **5 minutes**

**Total: ~35 minutes** to complete fireproofing

---

## You're Done When...

✅ Branch protection enabled  
✅ Two Railway services created  
✅ Both services have environment variables  
✅ Test deployment works  

**Then you're 100% fireproofed!** 🎉

---

**Status:** Staging branch created ✅ | Manual setup remaining: 2 steps
