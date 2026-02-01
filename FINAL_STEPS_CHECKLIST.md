# Final Steps Checklist - Almost There!

## ✅ Completed

- [x] Infrastructure fireproofed (Node pinned, CI gates, cost limits)
- [x] Git history cleaned (no secrets in history)
- [x] Pre-commit hook installed (prevents future accidents)
- [x] Secret management guides created
- [x] Staging branch created
- [x] Fireproofing code committed and pushed

---

## ⚠️ Remaining (2 Manual Steps)

### Step 1: GitHub Branch Protection (10 minutes)

**Location:** `https://github.com/lalabalavujon-a11y/Professional-Diver.app/settings/branches`

**Action:**
1. Click **"Add branch protection rule"**
2. **Branch name pattern:** `main`
3. Enable these settings:

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

### Step 2: Railway Services Split (20 minutes)

**Location:** Railway Dashboard

#### A) Create Staging Service

1. Go to Railway dashboard
2. Open your project (or create new if needed)
3. **New Service** → **GitHub Repo** → Select `Professional-Diver.app`
4. **Configure:**
   - **Name:** `professional-diver-api-staging`
   - **Branch:** `staging`
   - Build/Start commands auto-detected from `railway.json`

#### B) Create Production Service

1. **New Service** → **GitHub Repo** → Same repo
2. **Configure:**
   - **Name:** `professional-diver-api-prod`
   - **Branch:** `main`
   - Build/Start commands auto-detected

#### C) Environment Variables

**For both services → Variables tab:**

Copy from your current Railway service (or from `.env.example` as reference):

**Database:**
- `DATABASE_URL` (with rotated password)

**Supabase:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (can match Cloudflare Pages)

**AI Services:**
- `OPENAI_API_KEY`
- `LANGSMITH_API_KEY`
- `LANGSMITH_PROJECT`

**Payment:**
- `STRIPE_SECRET_KEY` (test key for staging, live for prod)
- `STRIPE_WEBHOOK_SECRET`

**Email:**
- `SENDGRID_API_KEY`

**External APIs:**
- `OPENWEATHER_API_KEY`
- `STORMGLASS_API_KEY`

**Other:**
- `NODE_ENV=production`
- `WHATSAPP_APP_SECRET` (if used)

**Important:**
- Staging: Use test/development keys where possible
- Production: Use live/production keys
- Update `DATABASE_URL` with rotated password

#### D) Domain Routing (Optional - for now)

**Current:**
- `api.professionaldiver.app` → Railway prod service

**Recommended (later):**
- `api.professionaldiver.app` → Railway prod service
- `staging-api.professionaldiver.app` → Railway staging service

**For now:** Test staging via Railway's generated URL directly.

---

## 🔍 Sanity Checks

### Database Connection

```bash
# Verify local connection (if .env.local has DATABASE_URL)
npm run db:verify-url
```

**If it fails:**
- Check `.env.local` has correct `DATABASE_URL` with rotated password
- Verify Railway service has updated `DATABASE_URL`

### Git Branches

```bash
# Verify branches are aligned
git fetch --all --prune
git status
git branch -vv
```

**If anything looks weird:**
- Work from freshly pushed `staging` and `main` branches
- History was rewritten, so old local branches may be out of sync

---

## 📋 Verification Checklist

After completing both steps:

- [ ] GitHub branch protection enabled for `main`
- [ ] Railway `professional-diver-api-staging` service created
- [ ] Railway `professional-diver-api-prod` service created
- [ ] Staging service deploys from `staging` branch
- [ ] Prod service deploys from `main` branch
- [ ] Environment variables set in both services
- [ ] `DATABASE_URL` updated with rotated password
- [ ] Test: Push to `staging` → staging deploys ✅
- [ ] Test: Merge `staging` → `main` → prod deploys ✅

---

## 🎯 You're Done When...

✅ Branch protection enabled  
✅ Two Railway services created  
✅ Both services have environment variables  
✅ Database password rotated  
✅ Test deployments work  

**Then you're 100% fireproofed!** 🎉

---

**Status:** 2 manual steps remaining | History cleanup complete ✅
