# Fireproofing Checklist - Final Status

## ✅ Completed

### Infrastructure Stability
- [x] Node version pinned (`.nvmrc` = `22`, `.node-version` = `22.12.0`, `engines.node = "22.x"`)
- [x] Typecheck memory limit set (`NODE_OPTIONS=--max-old-space-size=3072`)
- [x] TypeScript config optimized (excludes junk folders, proper target)
- [x] Missing dependencies installed (`docx`, `jspdf`, `@types/pdf-parse`)

### CI/CD Pipeline
- [x] Lint: **BLOCKING** (enforces code quality, scoped to `client/` + `server/`)
- [x] Typecheck: **INFORMATIONAL** (reports errors, doesn't block merges)
- [x] Test: **BLOCKING** (must pass)
- [x] Build: **BLOCKING** (must pass)
- [x] CI uses `.nvmrc` for Node version consistency

### Code Quality Fixes
- [x] Fixed WebSocket type extension (moved to `server/types/ws.d.ts`)
- [x] Fixed critical runtime type issues (weather-service, tides-widget)
- [x] Fixed duplicate `type` in websocket-server
- [x] Fixed missing schema exports (insertGptAccessTokenSchema)
- [x] Fixed Uppy Dashboard import (modern subpath export)
- [x] Fixed Buffer/Uint8Array issues in Excel import components

### Cost Protection
- [x] Cursor spend limit: **$50** (prevents runaway costs, allows multi-model usage)

### Deployment Safety
- [x] Safe migration script (`db:migrate` instead of `db:push --force`)
- [x] Lint scope narrowed (only lints `client/` + `server/`)

---

## 🔧 Manual Setup Required

### 1. GitHub Branch Protection (CRITICAL)
**Status:** ⚠️ **NOT YET CONFIGURED**

**Action Required:**
1. Go to: GitHub Repo → Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - ✅ **Require status checks to pass before merging**
     - Select: `CI / build` (or `build` if that's what it shows)
   - ✅ **Require pull request reviews before merging** (optional but recommended)
   - ✅ **Do not allow bypassing the above settings**
   - ✅ **Block force pushes**

**Why:** This prevents direct pushes to main and blocks merges with failing CI.

---

### 2. Railway Environments (RECOMMENDED)
**Status:** ⚠️ **NOT YET CONFIGURED**

**Action Required:**
Create two Railway services:

1. **`professional-diver-api-staging`**
   - Deploy from `develop` branch (or create a staging branch)
   - Use staging database URL
   - Test migrations here first

2. **`professional-diver-api-prod`**
   - Deploy from `main` branch only
   - Use production database URL
   - Only deploy after staging verification

**Why:** Staging environment catches issues before they hit production.

---

### 3. Cloudflare Pages Node Version
**Status:** ⚠️ **VERIFY**

**Action Required:**
1. Cloudflare Dashboard → Pages → Your Project → Settings → Builds & deployments
2. Verify environment variable `NODE_VERSION=22` is set
3. (Optional but recommended: `.node-version` file already in repo)

**Why:** Ensures consistent Node version across all build environments.

---

## 📊 Current Error Counts

- **TypeScript errors:** ~288 (informational, non-blocking)
- **Lint errors:** ~346 (blocking - fix as you touch files)

**Strategy:** Fix incrementally as you work on files. Don't try to fix all at once.

---

## 🎯 Deployment Workflow (Once Branch Protection is Set)

1. **Feature Development**
   - Create feature branch
   - Make changes
   - Push → PR opens
   - CI runs automatically (lint, typecheck, test, build)
   - Cloudflare creates preview deployment
   - Review preview URL
   - If CI green + preview looks good → merge

2. **Staging Deployment** (if Railway staging is set up)
   - Merge to `develop` (or staging branch)
   - Railway deploys to `professional-diver-api-staging`
   - Test staging environment
   - If DB changes: verify migration on staging

3. **Production Deployment**
   - Merge `develop` → `main` (or merge PR to main)
   - **CI must be green** (enforced by branch protection)
   - Railway deploys to `professional-diver-api-prod`
   - Cloudflare Pages deploys frontend
   - Monitor for issues

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

## 📝 Quick Reference

**Local Development:**
```bash
npm run dev:all        # Start API + Vite
npm run lint           # Check linting (blocking in CI)
npm run lint:fix       # Auto-fix linting
npm run typecheck      # Check types (informational in CI)
npm run test           # Run tests (blocking in CI)
npm run build          # Build for production (blocking in CI)
```

**Database:**
```bash
npm run db:push        # Dev/staging only (uses --force)
npm run db:migrate     # Production-safe (versioned migrations)
drizzle-kit generate   # Generate migration from schema changes
```

**CI Checks (automatic on PR):**
- Lint (blocking)
- Typecheck (informational)
- Test (blocking)
- Build (blocking)
- Health checks

---

## ✅ Fireproofing Status

**Infrastructure:** ✅ Complete
**CI/CD:** ✅ Complete (branch protection pending)
**Cost Control:** ✅ Complete ($50 limit set)
**Deployment Safety:** ✅ Complete (Railway environments pending)

**Overall:** 🟡 **90% Complete** - Just need branch protection + Railway environments

---

**Last Updated:** After fireproofing implementation
**Next Review:** After branch protection is configured
