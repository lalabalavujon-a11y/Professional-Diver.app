# Fireproof Deploy Blueprint - Professional Diver Training

## ✅ Current Status

- **CI:** Clean (lint, typecheck, test, build only - no secrets needed)
- **Railway:** Two services online (staging + prod)
- **Cloudflare DNS:** Configured (DNS-only for Railway APIs)
- **Branch Protection:** Enabled on `main`
- **Code Fix:** Ready on `staging` branch (DB health check fix)

---

## 0) Golden Rules

* **Server secrets → Railway** (DB, service role keys, OpenAI, Stripe, etc.)
* **Client/public config → Cloudflare Pages** (`VITE_*` only)
* **Never commit `.env.local`** ✅ (history cleaned)

---

## 1) Git Flow

### Branches
- `staging` → auto-deploys to **staging API** (`staging-api.professionaldiver.app`)
- `main` → auto-deploys to **production API** (`api.professionaldiver.app`)

### Workflow
1. Feature branch → PR into `staging`
2. Test on staging environment
3. PR `staging` → `main` to release to production

---

## 2) CI Gates (What Blocks Merges)

Your `.github/workflows/ci.yml` runs:
- ✅ **Lint:** Blocking
- ✅ **Typecheck:** Informational (non-blocking)
- ✅ **Tests:** Blocking
- ✅ **Build:** Blocking

**No secrets used** - CI only validates code quality.

---

## 3) Railway Setup

### Services

**Production Service:**
- Deploy branch: `main`
- Custom domain: `api.professionaldiver.app`
- Railway target: `d7ah4f1a.up.railway.app`
- Status: Online (but DB health check needs code fix)

**Staging Service:**
- Deploy branch: `staging`
- Custom domain: `staging-api.professionaldiver.app`
- Railway target: `1g0x14gf.up.railway.app`
- Status: Online ✅ (`postgresql-connected`)

### Port Configuration
- Both services use port **8080** (Railway routes by hostname)
- App listens on `process.env.PORT` (Railway sets automatically)

---

## 4) Cloudflare DNS Setup

### Railway APIs (DNS-Only)
- `api` → CNAME → `d7ah4f1a.up.railway.app` → **DNS only** ✅
- `staging-api` → CNAME → `1g0x14gf.up.railway.app` → **DNS only** ✅

**Why DNS-only?** Railway manages SSL certs for custom domains. DNS-only avoids proxy conflicts during cert verification.

### Cloudflare Pages
- Root: `professionaldiver.app` → `professional-diver-app.pages.dev` (CNAME flattening)
- WWW: `www.professionaldiver.app` → `professional-diver-app.pages.dev`

---

## 5) Cloudflare Pages Environment Variables

**Location:** Cloudflare Pages → Settings → Environment variables

### Production Environment
```
VITE_API_URL = https://api.professionaldiver.app
VITE_WS_URL = wss://api.professionaldiver.app
VITE_SUPABASE_URL = <your-supabase-url>
VITE_SUPABASE_ANON_KEY = <your-supabase-anon-key>
```

### Preview Environment
```
VITE_API_URL = https://staging-api.professionaldiver.app
VITE_WS_URL = wss://staging-api.professionaldiver.app
VITE_SUPABASE_URL = <your-supabase-url>
VITE_SUPABASE_ANON_KEY = <your-supabase-anon-key>
```

**After setting:** Redeploy Pages so Vite bakes env vars into build.

---

## 6) Railway Environment Variables

### Required (Both Services)
- `DATABASE_URL` - Supabase PostgreSQL connection string
- `SUPABASE_SERVICE_ROLE_KEY` - Server-only Supabase key
- `NODE_ENV` - Set to `production` (even for staging)
- `OPENAI_API_KEY` - OpenAI API key
- `STRIPE_SECRET_KEY` - Stripe key (test for staging, live for prod)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

### Optional
- `LANGSMITH_API_KEY`
- `LANGSMITH_PROJECT`
- `SENDGRID_API_KEY`
- `OPENWEATHER_API_KEY`
- `STORMGLASS_API_KEY`
- `WHATSAPP_APP_SECRET`

**See:** `RAILWAY_ENV_VERIFICATION.md` for complete checklist.

---

## 7) Current Issue: Production DB Health Check

**Status:**
- ✅ Staging: `postgresql-connected`
- ❌ Production: `database-error: db.get is not a function`

**Root Cause:** Production is running old code. The fix is on `staging` branch.

**Fix:** Merge `staging → main` to deploy the fix.

---

## 8) GitHub Secrets Audit

### ✅ Safe to Remove

Your CI workflow (`.github/workflows/ci.yml`) does **not** use any secrets:
- No `${{ secrets.* }}` references
- No deployments in CI
- Only lint, typecheck, test, build

**Recommendation:** You can safely remove GitHub Secrets if:
1. You're not using them in any workflows
2. Railway holds all backend secrets
3. Cloudflare Pages holds only `VITE_*` public config

**Action:** After confirming production works, clean up unused GitHub Secrets.

---

## 9) Verification Checklist

### After Merge to Main

```bash
# 1. Test production API health
curl -s https://api.professionaldiver.app/health | jq '.services.db'
# Expected: "postgresql-connected"

# 2. Test staging API health
curl -s https://staging-api.professionaldiver.app/health | jq '.services.db'
# Expected: "postgresql-connected"

# 3. Test frontend (after Pages deploy)
curl -I https://professionaldiver.app
# Expected: HTTP 200

# 4. Quick smoke test from browser
# Open https://professionaldiver.app
# Open DevTools → Console
# Check API calls hit correct endpoints
```

---

## 10) Deployment Workflow

### Feature Development
1. Create feature branch from `staging`
2. Make changes
3. Push and create PR to `staging`
4. CI runs (lint, test, build)
5. Merge to `staging` → Railway auto-deploys staging API
6. Test on staging environment

### Production Release
1. Create PR from `staging` → `main`
2. CI runs (lint, test, build)
3. Merge to `main` → Railway auto-deploys production API
4. Cloudflare Pages auto-deploys from `main`
5. Verify production health endpoints

---

## 11) Troubleshooting

### Production DB Not Connected
- Check Railway → Production service → Variables → `DATABASE_URL` is set
- Verify Supabase database is accessible
- Check Railway deployment logs

### Frontend Can't Reach API
- Verify Cloudflare Pages env vars are set (`VITE_API_URL`)
- Check CORS configuration in `server/index.ts`
- Verify Railway services are online

### CI Failing
- Check branch protection rules allow CI to run
- Verify all required checks pass
- Review CI logs for specific errors

---

## 12) Security Best Practices

✅ **Do:**
- Store secrets in Railway (backend) and Cloudflare Pages (public only)
- Use `.env.local` for local development (gitignored)
- Rotate secrets periodically
- Use different Stripe keys for staging (test) vs production (live)

❌ **Don't:**
- Commit `.env.local` or any secrets to git
- Put server secrets in Cloudflare Pages
- Use production keys in staging environment
- Share secrets in chat/logs/documentation

---

## Next Steps

1. ✅ Merge `staging → main` (to fix production DB health check)
2. ✅ Verify production health endpoint returns `postgresql-connected`
3. ✅ Set Cloudflare Pages env vars (if not done)
4. ✅ Test end-to-end: Frontend → API → Database
5. ✅ Clean up unused GitHub Secrets (optional)

---

## Quick Reference

- **Railway Dashboard:** https://railway.app
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **Supabase Dashboard:** https://supabase.com/dashboard
- **GitHub Actions:** https://github.com/[your-repo]/actions

---

**Last Updated:** After production DB fix deployment
