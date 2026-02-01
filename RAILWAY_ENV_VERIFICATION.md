# Railway Environment Variables Verification Guide

## Quick Checklist

Use this checklist to verify both **staging** and **production** Railway services have the correct environment variables.

---

## Required Variables (Both Services)

### Database & Supabase
- [ ] `DATABASE_URL` - Supabase PostgreSQL connection string
  - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
  - **Must be set in both staging and production**
  - **Never commit this to git** (contains password)

- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Server-only Supabase key
  - **Only for server-side operations**
  - **Never put in Cloudflare Pages** (client env vars)
  - Can be same key for staging/prod, or use separate Supabase projects

### Node.js Runtime
- [ ] `NODE_ENV` - Environment mode
  - **Staging:** `production` (or `staging` if you prefer)
  - **Production:** `production`
  - **Note:** Even though it says "production", staging should also use `NODE_ENV=production` to match production behavior

- [ ] `PORT` - Server port (optional)
  - Railway sets this automatically
  - Your code uses `process.env.PORT || 5000`
  - **Don't override unless you have a specific reason**

---

## API Keys & External Services

### OpenAI / LangChain
- [ ] `OPENAI_API_KEY` - OpenAI API key
  - Can use same key for staging/prod, or separate keys for isolation

- [ ] `LANGSMITH_API_KEY` - LangSmith API key (optional)
  - For LangSmith observability

- [ ] `LANGSMITH_PROJECT` - LangSmith project name (optional)
  - Example: `professional-diver-training`

### Payment Processing
- [ ] `STRIPE_SECRET_KEY` - Stripe secret key
  - **Staging:** Use Stripe test mode key (`sk_test_...`)
  - **Production:** Use Stripe live mode key (`sk_live_...`)

- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
  - **Staging:** Test webhook secret (`whsec_test_...`)
  - **Production:** Live webhook secret (`whsec_...`)

### Email Service
- [ ] `SENDGRID_API_KEY` - SendGrid API key
  - Can use same key, or separate keys for staging/prod

### Weather & External APIs
- [ ] `OPENWEATHER_API_KEY` - OpenWeatherMap API key
  - Can use same key for both

- [ ] `STORMGLASS_API_KEY` - Stormglass API key (for tides/weather)
  - Can use same key for both

### WhatsApp Integration (if used)
- [ ] `WHATSAPP_APP_SECRET` - WhatsApp app secret
  - Can use same or separate

---

## How to Verify in Railway Dashboard

### Step 1: Access Railway Dashboard
1. Go to [railway.app](https://railway.app)
2. Select your project
3. You should see two services:
   - `professional-diver-api-staging` (or similar)
   - `professional-diver-api-prod` (or similar)

### Step 2: Check Staging Service
1. Click on **staging service**
2. Go to **Variables** tab
3. Verify all required variables are present
4. **Take a screenshot or note which ones are set**

### Step 3: Check Production Service
1. Click on **production service**
2. Go to **Variables** tab
3. Compare with staging
4. **Ensure `DATABASE_URL` is set** (this is critical!)

### Step 4: Compare Staging vs Production
Use the comparison table below to ensure consistency.

---

## Staging vs Production Comparison

| Variable | Staging | Production | Notes |
|----------|---------|------------|-------|
| `DATABASE_URL` | ✅ Required | ✅ Required | Can be same DB or separate |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Required | ✅ Required | Can be same or separate |
| `NODE_ENV` | `production` | `production` | Both should be `production` |
| `OPENAI_API_KEY` | ✅ Required | ✅ Required | Can be same key |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` | **Different** (test vs live) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test_...` | `whsec_...` | **Different** (test vs live) |
| `SENDGRID_API_KEY` | ✅ Optional | ✅ Optional | Can be same |
| `OPENWEATHER_API_KEY` | ✅ Optional | ✅ Optional | Can be same |
| `STORMGLASS_API_KEY` | ✅ Optional | ✅ Optional | Can be same |
| `LANGSMITH_API_KEY` | ✅ Optional | ✅ Optional | Can be same |
| `LANGSMITH_PROJECT` | ✅ Optional | ✅ Optional | Can be same |
| `WHATSAPP_APP_SECRET` | ✅ Optional | ✅ Optional | Can be same |

---

## Common Issues & Fixes

### Issue 1: Production Missing `DATABASE_URL`
**Symptom:** Health check returns `database-error: db.get is not a function` or similar

**Fix:**
1. Railway Dashboard → Production service → Variables
2. Add `DATABASE_URL` with your Supabase connection string
3. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
4. Redeploy service

### Issue 2: Staging Works, Production Doesn't
**Possible causes:**
- Missing `DATABASE_URL` in production
- Wrong `NODE_ENV` value
- Different code version deployed

**Fix:**
1. Compare variables between staging and production
2. Ensure production has all required variables
3. Check deployment logs for errors
4. Redeploy production service

### Issue 3: Database Connection Fails
**Symptom:** `postgresql-connected` but other DB queries fail

**Possible causes:**
- Wrong password in `DATABASE_URL`
- Supabase IP restrictions
- Database doesn't exist

**Fix:**
1. Verify `DATABASE_URL` format is correct
2. Test connection string in Supabase dashboard
3. Check Supabase network settings (allow Railway IPs)

---

## Verification Script

After setting variables, test both services:

```bash
# Test staging
curl https://staging-api.professionaldiver.app/health | jq '.services.db'

# Test production
curl https://api.professionaldiver.app/health | jq '.services.db'
```

**Expected output:**
```json
"postgresql-connected"
```

---

## Security Checklist

- [ ] ✅ `DATABASE_URL` contains password - **never commit to git**
- [ ] ✅ `SUPABASE_SERVICE_ROLE_KEY` - **server-only, never in client**
- [ ] ✅ `STRIPE_SECRET_KEY` - **never commit to git**
- [ ] ✅ All secrets stored in Railway (not in code)
- [ ] ✅ `.env.local` is in `.gitignore`
- [ ] ✅ No secrets in Cloudflare Pages (only `VITE_*` vars)

---

## Quick Reference: Where to Find Values

### Supabase
1. Supabase Dashboard → Project Settings → Database
2. Copy **Connection string** (URI format)
3. Or use: **Connection pooling** → **Connection string**

### Stripe
1. Stripe Dashboard → Developers → API keys
2. **Test mode:** Use `sk_test_...` for staging
3. **Live mode:** Use `sk_live_...` for production
4. Webhooks → Your webhook → **Signing secret**

### OpenAI
1. OpenAI Dashboard → API keys
2. Create new key or use existing

### SendGrid
1. SendGrid Dashboard → Settings → API Keys
2. Create API key with "Mail Send" permissions

---

## Next Steps After Verification

1. ✅ Verify all variables are set
2. ✅ Test health endpoints (both return `postgresql-connected`)
3. ✅ Set Cloudflare Pages env vars (see `CLOUDFLARE_PAGES_SETUP.md`)
4. ✅ Test end-to-end: Frontend → API → Database

---

## Need Help?

If you find missing variables or connection issues:

1. **Check Railway logs:** Service → Deployments → Latest → View logs
2. **Check Supabase logs:** Supabase Dashboard → Logs
3. **Test connection string:** Use `psql` or Supabase SQL editor
4. **Compare with staging:** If staging works, copy its `DATABASE_URL` format
