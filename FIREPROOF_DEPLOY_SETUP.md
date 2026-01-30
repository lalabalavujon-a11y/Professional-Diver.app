# Fireproof Deploy Blueprint - Implementation Summary

## ✅ Completed Changes

### 1. Added Required Scripts to `package.json`

- ✅ `lint`: Runs ESLint on all JS/TS files
- ✅ `lint:fix`: Auto-fixes ESLint issues
- ✅ `test`: Uses Node.js built-in test runner (passes if no failing tests)
- ✅ `db:migrate`: Safe production migration command (uses `drizzle-kit migrate`)

### 2. Updated CI Workflow (`.github/workflows/ci.yml`)

**Key Changes:**
- ✅ Removed `continue-on-error: true` - **checks now block merges**
- ✅ Uses `.nvmrc` for Node version consistency (Node 22)
- ✅ Enforces: `lint` → `typecheck` → `test` → `build` (all must pass)
- ✅ Removed matrix testing (single Node 22 version for consistency)
- ✅ All steps now fail the build if they fail (no more "|| echo" workarounds)

**What This Means:**
- Broken code **cannot** merge to `main` if CI fails
- Type errors block deployment
- Lint errors block deployment
- Build failures block deployment

---

## 🔧 Next Steps (Manual Configuration Required)

### 1. GitHub Branch Protection (CRITICAL)

**Go to:** GitHub Repo → Settings → Branches → Branch protection rules → Add rule for `main`

**Enable:**
- ✅ **Require status checks to pass before merging**
  - Select: `CI / build` (or `build` if that's what it shows)
- ✅ **Require pull request reviews before merging** (optional but recommended)
- ✅ **Do not allow bypassing the above settings**
- ✅ **Block force pushes**

**This prevents:**
- Direct pushes to main
- Merging PRs with failing CI
- Accidental force pushes

---

### 2. Railway Environments Setup

**Current:** Single Railway service (likely production)

**Create Two Services:**

1. **`professional-diver-api-staging`**
   - Deploy from `develop` branch (or create a staging branch)
   - Use staging database URL
   - Test migrations here first

2. **`professional-diver-api-prod`**
   - Deploy from `main` branch only
   - Use production database URL
   - Only deploy after staging verification

**Railway Configuration:**
- Set Node version to **22** (or ensure it reads from `package.json` engines)
- Build command: `npm run build` (already in `railway.json`)
- Start command: `npm run start` (already in `railway.json`)

---

### 3. Cloudflare Pages Configuration

**Already Set:**
- Preview deployments on PRs (default behavior)
- Production branch: `main`

**Verify:**
- Environment variable `NODE_VERSION=22` is set in Cloudflare Pages build settings
- Build command: `npm run build` (Vite build)

**Location:** Cloudflare Dashboard → Pages → Your Project → Settings → Builds & deployments

---

### 4. Database Migration Policy (SAFETY CRITICAL)

**Current Problem:**
```json
"db:push": "CI=true drizzle-kit push --force"
```
The `--force` flag can cause data loss in production.

**New Safe Workflow:**

**For Development/Staging:**
```bash
npm run db:push  # Still OK for dev/staging
```

**For Production:**
```bash
# 1. Generate migration from schema changes
drizzle-kit generate

# 2. Review the migration file in migrations/ folder

# 3. Apply migration (safe, versioned)
npm run db:migrate
```

**Migration Deployment Process:**
1. Make schema changes locally
2. Run `drizzle-kit generate` to create migration file
3. Commit migration file to git
4. Test migration on **staging** first
5. Only after staging success, merge to `main`
6. Railway will run migration on prod (or add as deploy hook)

**Railway Deploy Hook (Optional):**
Add to Railway service settings:
- Deploy command: `npm run db:migrate && npm run start`

---

### 5. Cursor Billing (Fire Prevention)

**Action Required:**
1. Open Cursor Settings → Billing
2. Set **Spend limit = $0** (hard stop on costs)
3. Keep model default = **Auto**

This prevents surprise charges from desktop + browser usage.

---

## 📋 Deployment Workflow (New Process)

### Feature Development
1. Create feature branch
2. Make changes
3. Push → PR opens
4. **CI runs automatically** (lint, typecheck, test, build)
5. **Cloudflare creates preview deployment**
6. Review preview URL
7. If CI green + preview looks good → merge

### Staging Deployment
1. Merge to `develop` (or staging branch)
2. Railway deploys to `professional-diver-api-staging`
3. Test staging environment
4. If DB changes: verify migration on staging

### Production Deployment
1. Merge `develop` → `main` (or merge PR to main)
2. **CI must be green** (enforced by branch protection)
3. Railway deploys to `professional-diver-api-prod`
4. Cloudflare Pages deploys frontend
5. Monitor for issues

---

## 🚨 Critical Rules

1. **Never use `db:push --force` in production**
   - Use `db:migrate` instead
   - Always test migrations on staging first

2. **Never merge PRs with failing CI**
   - Branch protection will block this
   - Fix issues before merging

3. **Never deploy directly to prod without staging test**
   - Use staging environment first
   - Verify migrations work

4. **Never skip the migration review step**
   - Always review generated migration files
   - Test on staging before prod

---

## 🎯 What This Prevents

✅ **"Works locally, breaks in CI"** → Node version locked everywhere
✅ **"Type errors in production"** → Typecheck blocks merges
✅ **"Lint errors everywhere"** → Lint blocks merges
✅ **"Broken builds deploy"** → Build step blocks merges
✅ **"Migration disasters"** → Safe migration workflow
✅ **"Surprise Cursor costs"** → Spend limit = $0

---

## 📝 Quick Reference

**Local Development:**
```bash
npm run dev:all        # Start API + Vite
npm run lint           # Check linting
npm run lint:fix       # Auto-fix linting
npm run typecheck      # Check types
npm run test           # Run tests
npm run build          # Build for production
```

**Database:**
```bash
npm run db:push        # Dev/staging only (uses --force)
npm run db:migrate     # Production-safe (versioned migrations)
drizzle-kit generate   # Generate migration from schema changes
```

**CI Checks (automatic on PR):**
- Lint
- Typecheck
- Test
- Build
- Health checks

---

## 🔍 Verification Checklist

Before considering this setup complete:

- [ ] GitHub branch protection enabled for `main`
- [ ] Railway staging service created
- [ ] Railway prod service configured to deploy from `main`
- [ ] Cloudflare Pages `NODE_VERSION=22` env var set
- [ ] Cursor billing spend limit set to $0
- [ ] Test a PR to verify CI blocks on failures
- [ ] Test a successful PR merge to verify deployment flow

---

**Status:** Core implementation complete. Manual configuration steps above required for full fireproofing.
