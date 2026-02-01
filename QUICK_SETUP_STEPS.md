# Quick Setup Steps - Final Fireproofing

## Current Status

- **Branch:** `main` (no staging branch yet)
- **GitHub Repo:** `lalabalavujon-a11y/Professional-Diver.app`
- **Cloudflare Route:** `api.professionaldiver.app/*` → Railway
- **Railway:** Currently one service (need to create staging + prod)

---

## Step 1: Create Staging Branch (2 minutes)

```bash
# From your current main branch
git checkout -b staging
git push -u origin staging
```

**Result:** You now have a `staging` branch for safe testing.

---

## Step 2: GitHub Branch Protection (10 minutes)

### Go to GitHub

1. Navigate to: `https://github.com/lalabalavujon-a11y/Professional-Diver.app`
2. **Settings** → **Branches** → **Add branch protection rule**

### Configure

**Branch name pattern:**
```
main
```

**Enable:**
- ✅ **Require a pull request before merging**
  - Require approvals: **1**
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

## Step 3: Railway Services (20-30 minutes)

### A) Create Staging Service

1. Go to Railway dashboard
2. Open your project (or create new if needed)
3. **New Service** → **GitHub Repo** → Select `Professional-Diver.app`
4. **Settings:**
   - **Name:** `professional-diver-api-staging`
   - **Branch:** `staging`
   - **Build Command:** `npm run build` (auto-detected from `railway.json`)
   - **Start Command:** `npm run start` (auto-detected)

### B) Create Production Service

1. **New Service** → **GitHub Repo** → Same repo
2. **Settings:**
   - **Name:** `professional-diver-api-prod`
   - **Branch:** `main`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm run start`

### C) Environment Variables

**For both services, go to Variables tab:**

**Copy these from your current Railway service:**
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` (use test key for staging, live for prod)
- `STRIPE_WEBHOOK_SECRET`
- `SENDGRID_API_KEY`
- `NODE_ENV=production`
- Any other API keys/secrets

**Important:** 
- Staging should use **test/development** keys where possible
- Production uses **live/production** keys
- Consider separate Supabase projects for staging vs prod (optional but recommended)

---

## Step 4: Cloudflare Routing (Optional - for now)

**Current:** `api.professionaldiver.app/*` routes to your current Railway service

**For now:** 
- Keep prod routing as-is (`api.professionaldiver.app` → prod Railway)
- Test staging via Railway's generated URL directly
- Later: Add `staging-api.professionaldiver.app` route if needed

---

## Step 5: Test the Flow (5 minutes)

### Test Staging Deployment

1. Make a small change (add a comment somewhere)
2. Push to `staging`:
   ```bash
   git checkout staging
   # Make small change
   git add .
   git commit -m "Test staging deployment"
   git push origin staging
   ```
3. Check Railway dashboard - `professional-diver-api-staging` should deploy
4. Verify it works

### Test Production Deployment

1. Merge `staging` → `main`:
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```
2. Check Railway dashboard - `professional-diver-api-prod` should deploy
3. Verify production works

---

## Your New Workflow

### Daily Development

1. **Feature branch:**
   ```bash
   git checkout -b feature/my-feature
   # Make changes
   git push origin feature/my-feature
   ```

2. **PR to `staging`:**
   - Open PR: `feature/my-feature` → `staging`
   - CI runs automatically
   - Cloudflare creates preview
   - Review and merge

3. **Staging auto-deploys:**
   - Railway `professional-diver-api-staging` deploys automatically
   - Test staging environment

4. **Promote to production:**
   - PR: `staging` → `main`
   - After merge, Railway `professional-diver-api-prod` deploys
   - Cloudflare Pages deploys frontend

---

## Database Migrations

**Rule:** Only run migrations on `main` (production)

**Process:**
1. Generate migration:
   ```bash
   drizzle-kit generate
   ```

2. Review `migrations/` folder

3. Test on staging first (if staging DB exists):
   - Railway staging service → Run `npm run db:migrate`

4. Merge to `main`

5. Production migration:
   - Railway prod service → Run `npm run db:migrate` (or add to deploy command)

**Never:**
- ❌ `db:push --force` on production
- ❌ Manual migrations mid-debug
- ❌ Skip staging test for schema changes

---

## Verification Checklist

After completing all steps:

- [ ] `staging` branch created and pushed
- [ ] GitHub branch protection enabled for `main`
- [ ] Railway `professional-diver-api-staging` service created
- [ ] Railway `professional-diver-api-prod` service created
- [ ] Staging service set to deploy from `staging` branch
- [ ] Prod service set to deploy from `main` branch
- [ ] Environment variables copied to both services
- [ ] Tested: Push to `staging` → staging deploys
- [ ] Tested: Merge to `main` → prod deploys

---

## Quick Commands Reference

```bash
# Create feature branch
git checkout -b feature/my-feature

# Push and create PR to staging
git push origin feature/my-feature

# After staging test, promote to main
git checkout staging
git pull
git checkout main
git merge staging
git push origin main
```

---

## Troubleshooting

### Railway deployment fails
- Check build logs in Railway dashboard
- Verify Node version (should use `.nvmrc` automatically)
- Check environment variables are set

### CI fails
- Fix lint: `npm run lint:fix`
- Fix build: `npm run build` locally first
- Typecheck is informational (won't block)

### Branch protection blocks push
- This is correct! Use PRs instead
- Direct pushes to `main` are blocked (by design)

---

## Time Estimate

- Create staging branch: **2 minutes**
- GitHub branch protection: **10 minutes**
- Railway services setup: **20-30 minutes**
- Environment variables: **10 minutes**
- Testing: **5 minutes**

**Total: ~1 hour** to complete all manual setup

---

## You're Done When...

✅ Branch protection enabled  
✅ Staging branch exists  
✅ Two Railway services created  
✅ Both services have environment variables  
✅ Test deployment works  

**Then you're 100% fireproofed!** 🎉
