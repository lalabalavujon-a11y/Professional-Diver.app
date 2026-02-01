# Cloudflare Pages Environment Variables Setup

## Current Configuration

Your app uses `VITE_API_URL` as the API base URL environment variable.

**Frontend code location:** `client/src/lib/queryClient.ts`
- Uses `import.meta.env.VITE_API_URL`
- Falls back to relative paths if not set
- Automatically adds `https://` if protocol is missing

**Server health endpoint:** `/health` (available on both Railway services)

---

## Step-by-Step: Cloudflare Pages Environment Variables

### 1. Navigate to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account
3. Go to **Pages** → **professional-diver-app** (or your project name)

### 2. Set Production Environment Variables

**Production** = what runs when code is merged to `main`

1. Click **Settings** → **Environment variables**
2. Select **Production** environment
3. Add these variables:

```
VITE_API_URL = https://api.professionaldiver.app
VITE_WS_URL = wss://api.professionaldiver.app
VITE_SUPABASE_URL = <your-supabase-url>
VITE_SUPABASE_ANON_KEY = <your-supabase-anon-key>
```

**Important:** 
- ✅ Use `https://` (not `http://`)
- ✅ No trailing slash
- ✅ These are PUBLIC (bundled into browser code)

### 3. Set Preview Environment Variables

**Preview** = what runs on PR preview deployments

1. In the same **Environment variables** section
2. Select **Preview** environment
3. Add the same variables, but point to **staging API**:

```
VITE_API_URL = https://staging-api.professionaldiver.app
VITE_WS_URL = wss://staging-api.professionaldiver.app
VITE_SUPABASE_URL = <your-supabase-url>
VITE_SUPABASE_ANON_KEY = <your-supabase-anon-key>
```

**Why this matters:**
- PR previews → test against staging API (safe)
- Production → uses prod API (real data)

### 4. Verify Build Settings

1. Go to **Settings** → **Builds & deployments**
2. Ensure:
   - **Build command:** `npm run build`
   - **Build output directory:** `client/dist` (or wherever Vite outputs)
   - **Root directory:** `/` (or leave empty if repo root)

### 5. Node.js Version (Already Set)

You already have:
- `.node-version` file with `22.12.0`
- `NODE_VERSION=22` env var (optional, but good to have)

Cloudflare Pages will use `.node-version` automatically.

---

## Railway Services Verification Checklist

### Production Service (`api.professionaldiver.app`)

**In Railway dashboard:**

- [ ] Service name: `professional-diver-api-prod` (or similar)
- [ ] Custom domain: `api.professionaldiver.app` ✅
- [ ] Status: **Online** ✅
- [ ] Environment variables set:
  - [ ] `DATABASE_URL` (Supabase Postgres)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (server-only, never in client)
  - [ ] `OPENAI_API_KEY`
  - [ ] `LANGSMITH_API_KEY`
  - [ ] `LANGSMITH_PROJECT`
  - [ ] `STRIPE_SECRET_KEY`
  - [ ] `STRIPE_WEBHOOK_SECRET`
  - [ ] `SENDGRID_API_KEY`
  - [ ] `OPENWEATHER_API_KEY`
  - [ ] `STORMGLASS_API_KEY`
  - [ ] `WHATSAPP_APP_SECRET`
  - [ ] `PORT` (Railway sets this automatically, but verify it's not hardcoded wrong)
- [ ] CORS origins include:
  - [ ] `https://professionaldiver.app`
  - [ ] `https://professional-diver-app.pages.dev`

### Staging Service (`staging-api.professionaldiver.app`)

**In Railway dashboard:**

- [ ] Service name: `professional-diver-api-staging` (or similar)
- [ ] Custom domain: `staging-api.professionaldiver.app` ✅
- [ ] Status: **Online** ✅
- [ ] Environment variables set (same as prod, but can use test keys):
  - [ ] `DATABASE_URL` (can be same DB or separate staging DB)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] All other API keys (can use test/staging keys)
- [ ] CORS origins include:
  - [ ] `https://professional-diver-app.pages.dev` (for preview deployments)

---

## Testing the Setup

### 1. Test Railway Services

```bash
# Test production API
curl https://api.professionaldiver.app/health

# Test staging API
curl https://staging-api.professionaldiver.app/health
```

**Expected response:**
```json
{
  "status": "ok",
  "uptime": 123.45,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "db": "postgresql-connected",
    "ai": "langsmith-connected",
    "api": "express-running",
    "langchain": "pipeline-ok",
    "laura": "connected-and-working",
    "diverWell": "connected-and-working"
  }
}
```

### 2. Test Cloudflare Pages

1. **Create a test PR** (or use an existing one)
2. Wait for **Preview deployment** to complete
3. Open the preview URL
4. Open browser DevTools → **Console**
5. Check for API calls:
   - Should hit `https://staging-api.professionaldiver.app` (preview)
   - Should NOT hit production API

### 3. Test Production

1. Merge PR to `main`
2. Wait for **Production deployment**
3. Visit `https://professionaldiver.app`
4. Open browser DevTools → **Console**
5. Check for API calls:
   - Should hit `https://api.professionaldiver.app` (production)

---

## CORS Configuration

Your server (`server/index.ts`) already has CORS configured for:
- `https://professional-diver-app.pages.dev`
- `https://professionaldiver.app`
- Local development origins

**If you add new domains**, update `server/index.ts`:

```typescript
const allowedOrigins = [
  'https://professional-diver-app.pages.dev',
  'https://professionaldiver.app',
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  // Add new domains here
];
```

---

## Troubleshooting

### "API calls failing in production"

1. **Check CORS:** Browser console will show CORS errors
2. **Check env vars:** Verify `VITE_API_URL` is set in Cloudflare Pages
3. **Check Railway:** Verify service is online and health endpoint works
4. **Check DNS:** Verify CNAME records are correct in Cloudflare

### "Preview deployments hitting wrong API"

- Verify **Preview** environment variables are set (not just Production)
- Cloudflare Pages caches env vars, so redeploy after changes

### "Health endpoint returns errors"

- Check Railway logs for database connection issues
- Verify `DATABASE_URL` is set correctly
- Check API keys are valid

---

## Final Checklist

Before marking this as "fireproof complete":

- [ ] Railway prod service online and health check passes
- [ ] Railway staging service online and health check passes
- [ ] Cloudflare Pages Production env vars set (`VITE_API_URL` = prod API)
- [ ] Cloudflare Pages Preview env vars set (`VITE_API_URL` = staging API)
- [ ] Test PR preview deployment → hits staging API ✅
- [ ] Test production deployment → hits prod API ✅
- [ ] CORS configured for all domains
- [ ] All secrets stored in Railway (not Cloudflare Pages)
- [ ] Only `VITE_*` vars in Cloudflare Pages (public-safe)

---

## Next Steps

Once this is verified:

1. ✅ **Branch protection** (already done)
2. ✅ **Railway services** (done)
3. ✅ **Cloudflare Pages env vars** (this guide)
4. ⏭️ **Database migration policy** (next: only run migrations on merge to main)
5. ⏭️ **Monitoring & alerts** (optional but recommended)
