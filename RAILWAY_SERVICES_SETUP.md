# Railway Services Setup - Staging + Prod Split

## 🎯 Goal

- **Staging API** → `staging-api.professionaldiver.app` → deploys from `staging` branch
- **Prod API** → `api.professionaldiver.app` → deploys from `main` branch

---

## Step 1: Create Staging Service

### A) Create New Service

1. Go to **Railway Dashboard**
2. Open your project (or create new if needed)
3. Click **"New Service"** (or **"+"** button)
4. Select **"GitHub Repo"**
5. Choose: `lalabalavujon-a11y/Professional-Diver.app`

### B) Configure Staging Service

1. **Service Name:** `professional-diver-api-staging`
2. **Settings → Source:**
   - **Branch:** `staging`
3. **Settings → Deploy:**
   - Build command: `npm run build` (auto-detected from `railway.json`)
   - Start command: `npm run start` (auto-detected)
4. **Settings → Domains:**
   - Click **"Generate Domain"** or **"Add Domain"**
   - Railway will show: `professional-diver-api-staging.up.railway.app` (or similar)
   - **Save this domain** - you'll need it for Cloudflare DNS

---

## Step 2: Create Production Service

### A) Create New Service

1. In the same Railway project
2. Click **"New Service"** again
3. Select **"GitHub Repo"**
4. Choose: `lalabalavujon-a11y/Professional-Diver.app` (same repo)

### B) Configure Prod Service

1. **Service Name:** `professional-diver-api-prod`
2. **Settings → Source:**
   - **Branch:** `main`
3. **Settings → Deploy:**
   - Build command: `npm run build`
   - Start command: `npm run start`
4. **Settings → Domains:**
   - Click **"Generate Domain"** or **"Add Domain"**
   - Railway will show: `professional-diver-api-prod.up.railway.app` (or similar)
   - **Save this domain** - you'll need it for Cloudflare DNS

---

## Step 3: Environment Variables

### For Both Services

Go to each service → **Variables** tab → Add these:

#### Database
- `DATABASE_URL` (with rotated password)

#### Supabase
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (optional - can match Cloudflare)

#### AI Services
- `OPENAI_API_KEY`
- `LANGSMITH_API_KEY`
- `LANGSMITH_PROJECT`

#### Payment
- `STRIPE_SECRET_KEY` (test key for staging, live for prod)
- `STRIPE_WEBHOOK_SECRET`

#### Email
- `SENDGRID_API_KEY`

#### External APIs
- `OPENWEATHER_API_KEY`
- `STORMGLASS_API_KEY`

#### Other
- `NODE_ENV=production`
- `WHATSAPP_APP_SECRET` (if used)

**Important:**
- **Staging:** Use test/development keys where possible
- **Production:** Use live/production keys
- **Both:** Use rotated `DATABASE_URL`

---

## Step 4: Cloudflare DNS Configuration

### A) Get Railway Domain Targets

From Railway dashboard, note the domains:

- **Staging service domain:** `professional-diver-api-staging-XXXX.up.railway.app`
- **Prod service domain:** `professional-diver-api-prod-XXXX.up.railway.app`

**Paste these here and I'll give you exact DNS entries.**

### B) Cloudflare DNS Records

Go to: **Cloudflare Dashboard → DNS → Records**

#### Record 1: Staging API

- **Type:** `CNAME`
- **Name:** `staging-api`
- **Target:** `<staging-railway-domain>.up.railway.app`
- **Proxy status:** ✅ **Proxied** (orange cloud)
- **TTL:** Auto

#### Record 2: Production API

- **Type:** `CNAME`
- **Name:** `api`
- **Target:** `<prod-railway-domain>.up.railway.app`
- **Proxy status:** ✅ **Proxied** (orange cloud)
- **TTL:** Auto

**Result:**
- `staging-api.professionaldiver.app` → Railway staging service
- `api.professionaldiver.app` → Railway prod service

---

## Step 5: Update Cloudflare Worker (if needed)

If you have a Cloudflare Worker routing API requests, you may need to update it:

**Current:** Routes `api.professionaldiver.app/*` to Railway

**Options:**
1. **Keep Worker for prod only** (staging uses direct DNS)
2. **Update Worker** to route based on subdomain
3. **Remove Worker** and use direct DNS for both

**For now:** Direct DNS (CNAME records) is simplest and works fine.

---

## Step 6: Verification

### A) Test Staging Deployment

1. Make a small change
2. Push to `staging` branch:
   ```bash
   git checkout staging
   echo "# Test" >> README.md
   git add README.md
   git commit -m "Test staging deployment"
   git push origin staging
   ```
3. Check Railway dashboard → `professional-diver-api-staging` should deploy
4. Test: `https://staging-api.professionaldiver.app/health`

### B) Test Production Deployment

1. Merge `staging` → `main`:
   ```bash
   git checkout main
   git merge staging
   git push origin main
   ```
2. Check Railway dashboard → `professional-diver-api-prod` should deploy
3. Test: `https://api.professionaldiver.app/health`

---

## WebSocket Notes

If your API uses WebSockets (`ws` package), Cloudflare proxy should work fine, but:

- Ensure Railway serves WebSocket connections correctly
- Test WebSocket connections on both staging and prod
- If issues occur, may need to adjust Cloudflare proxy settings

---

## Troubleshooting

### Service won't deploy
- Check Railway build logs
- Verify Node version (should use `.nvmrc` automatically)
- Check environment variables are set

### DNS not working
- Wait 1-2 minutes for DNS propagation
- Verify CNAME records in Cloudflare
- Check proxy status (should be "Proxied")

### Connection errors
- Verify `DATABASE_URL` is correct in Railway
- Check Railway service logs
- Verify environment variables are set

---

## Next Steps After Setup

1. ✅ Test staging deployment
2. ✅ Test production deployment
3. ✅ Verify both domains work
4. ✅ Set up monitoring/alerts (optional)

---

**Status:** Ready to create services | Need Railway domain targets for DNS config
