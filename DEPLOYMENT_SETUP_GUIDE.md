# Deployment Setup Guide - Final Steps

## Current Status

✅ **Infrastructure:** Fireproofed (Node pinned, CI gates, cost limits)  
✅ **Code:** Critical fixes applied  
⚠️ **Manual Setup:** Branch protection + Railway environments needed

---

## Step 1: GitHub Branch Protection (10 minutes)

### Action Required

1. Go to your GitHub repo
2. **Settings → Branches → Add branch protection rule**

### Configuration

**Branch name pattern:**
```
main
```

**Enable these settings:**

✅ **Require a pull request before merging**
   - Require approvals: **1** (optional but recommended)
   - ✅ Dismiss stale approvals when new commits are pushed

✅ **Require status checks to pass before merging**
   - Select: **"CI / build"** (or your workflow job name)
   - ✅ "Require branches to be up to date before merging"

✅ **Require conversation resolution before merging**

✅ **Do not allow bypassing the above settings**

✅ **Block force pushes**

✅ **Block deletions**

**Result:** Nobody (including you) can push broken code directly to `main`.

---

## Step 2: Create Staging Branch (if you don't have one)

### Option A: You only have `main` (recommended for simplicity)

```bash
# Create staging branch from main
git checkout -b staging
git push -u origin staging
```

### Option B: You already have `develop` or `staging`

Use that branch for staging deployments.

---

## Step 3: Railway Services Setup (20-30 minutes)

### A) Create Staging Service

1. Open your Railway project
2. **New Service** → Deploy from GitHub repo
3. **Name:** `professional-diver-api-staging`
4. **Branch:** `staging` (or `develop` if you use that)
5. **Build Command:** `npm run build` (already in `railway.json`)
6. **Start Command:** `npm run start` (already in `railway.json`)

### B) Create Production Service

1. **New Service** → Deploy from same GitHub repo
2. **Name:** `professional-diver-api-prod`
3. **Branch:** `main`
4. **Build Command:** `npm run build`
5. **Start Command:** `npm run start`

### C) Environment Variables

**Copy from current service to both, then separate:**

**Shared (can be same):**
- `NODE_ENV` (set to `production` for both)
- `PORT` (Railway sets this automatically)

**Must be separate:**
- `DATABASE_URL` (staging should point to staging DB if you have one)
- `SUPABASE_URL` (can be same project, but better to separate)
- `SUPABASE_ANON_KEY` (can be same if same project)
- `SUPABASE_SERVICE_ROLE_KEY` (should be different per environment)

**Sensitive (must be different per environment):**
- `STRIPE_SECRET_KEY` (use test key for staging, live for prod)
- `STRIPE_WEBHOOK_SECRET` (different per environment)
- `SENDGRID_API_KEY` (can use test key for staging)
- OAuth secrets (different per environment)

**Railway Setup:**
- In each service → **Variables** tab
- Add all required environment variables
- Railway will automatically use them during build/deploy

---

## Step 4: Cloudflare Routing (if needed)

### Current Setup

Your `wrangler.toml` shows:
- Worker routes `api.professionaldiver.app/*` to Railway

### Recommended: Add Staging Route

**Option 1: Subdomain (recommended)**
- **Prod:** `api.professionaldiver.app` → prod Railway service
- **Staging:** `staging-api.professionaldiver.app` → staging Railway service

**Option 2: Path-based (if subdomain not available)**
- **Prod:** `api.professionaldiver.app/*` → prod Railway service
- **Staging:** `api-staging.professionaldiver.app/*` → staging Railway service

### Cloudflare Worker Configuration

If you want staging routing, update `wrangler.toml` or create a separate worker for staging.

**For now:** You can test staging via Railway's generated URL directly, and only route prod through Cloudflare.

---

## Step 5: Deployment Workflow

### Daily Development Flow

1. **Create feature branch**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit**
   ```bash
   git add .
   git commit -m "Add feature X"
   git push origin feature/my-feature
   ```

3. **Open PR to `staging` branch**
   - GitHub automatically runs CI
   - Cloudflare creates preview deployment
   - Review preview URL

4. **Merge to `staging`**
   - Railway automatically deploys to `professional-diver-api-staging`
   - Test staging environment

5. **Promote to production**
   - Open PR: `staging` → `main`
   - After merge, Railway deploys to `professional-diver-api-prod`
   - Cloudflare Pages deploys frontend

### Database Migrations

**Rule:** Only run migrations on `main` (production)

**Process:**
1. Generate migration locally:
   ```bash
   drizzle-kit generate
   ```

2. Review migration file in `migrations/` folder

3. Test migration on staging first (if you have staging DB):
   ```bash
   # On staging Railway service, run:
   npm run db:migrate
   ```

4. After staging verification, merge to `main`

5. Railway will deploy, then run migration:
   ```bash
   # Add to Railway deploy command or run manually:
   npm run db:migrate && npm run start
   ```

**Never:**
- ❌ Run `db:push --force` on production
- ❌ Run migrations manually mid-debug
- ❌ Skip staging verification for schema changes

---

## Step 6: Verification Checklist

After setup, verify:

- [ ] GitHub branch protection enabled for `main`
- [ ] `staging` branch exists and pushed to GitHub
- [ ] Railway `professional-diver-api-staging` service created
- [ ] Railway `professional-diver-api-prod` service created
- [ ] Staging service deploys from `staging` branch
- [ ] Prod service deploys from `main` branch
- [ ] Environment variables set in both Railway services
- [ ] Test: Push to `staging` → staging service deploys
- [ ] Test: Merge `staging` → `main` → prod service deploys

---

## Quick Reference

### Branch Strategy

```
main (protected) ← production
  ↑
staging ← staging environment
  ↑
feature branches ← development
```

### Railway Services

- **Staging:** `professional-diver-api-staging` → `staging` branch
- **Production:** `professional-diver-api-prod` → `main` branch

### CI/CD Flow

1. PR to `staging` → CI runs → Cloudflare preview
2. Merge to `staging` → Railway staging deploys
3. PR `staging` → `main` → CI runs
4. Merge to `main` → Railway prod deploys + Cloudflare Pages deploys

### Commands

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
- Verify environment variables are set
- Check Node version matches `.nvmrc`

### CI fails on PR

- Fix lint errors: `npm run lint:fix`
- Fix type errors incrementally
- Ensure build passes: `npm run build`

### Migration issues

- Always test on staging first
- Review migration SQL before applying
- Never use `--force` in production

---

## Next Steps After Setup

1. ✅ Set up branch protection (10 min)
2. ✅ Create staging branch (2 min)
3. ✅ Create Railway services (20-30 min)
4. ✅ Configure environment variables (10 min)
5. ✅ Test deployment flow (5 min)

**Total time:** ~1 hour to complete all manual setup

---

**Status:** Ready to complete final manual steps  
**Last Updated:** After fireproofing implementation
