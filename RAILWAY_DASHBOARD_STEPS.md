# Step-by-Step: Railway Environment Variables Verification

## Current Status

✅ **Staging:** `postgresql-connected` (working)  
❌ **Production:** `database-error: db.get is not a function` (needs code update + env var check)

---

## Step 1: Access Railway Dashboard

1. Go to [railway.app](https://railway.app)
2. Sign in with your account
3. You should see your project: **Professional Diver Training** (or similar)

---

## Step 2: Verify Staging Service Variables

### 2.1 Open Staging Service
1. Click on the service named **`professional-diver-api-staging`** (or similar)
2. In the left sidebar, click **Variables** tab

### 2.2 Check Required Variables
Look for these variables and verify they exist:

#### Critical (Must Have):
- [ ] **`DATABASE_URL`**
  - Should start with: `postgresql://postgres:`
  - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
  - **If missing:** Copy from Supabase Dashboard → Settings → Database → Connection string

- [ ] **`SUPABASE_SERVICE_ROLE_KEY`**
  - Should start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - **If missing:** Copy from Supabase Dashboard → Settings → API → `service_role` key

- [ ] **`NODE_ENV`**
  - Should be: `production`
  - **If missing or different:** Add/update to `production`

#### Important (Should Have):
- [ ] **`OPENAI_API_KEY`**
  - Should start with: `sk-...`
  - **If missing:** Get from OpenAI Dashboard

- [ ] **`STRIPE_SECRET_KEY`**
  - Should start with: `sk_test_...` (for staging/test mode)
  - **If missing:** Get from Stripe Dashboard → Developers → API keys (Test mode)

- [ ] **`STRIPE_WEBHOOK_SECRET`**
  - Should start with: `whsec_test_...` (for staging)
  - **If missing:** Get from Stripe Dashboard → Developers → Webhooks

#### Optional (Nice to Have):
- [ ] `LANGSMITH_API_KEY`
- [ ] `LANGSMITH_PROJECT`
- [ ] `SENDGRID_API_KEY`
- [ ] `OPENWEATHER_API_KEY`
- [ ] `STORMGLASS_API_KEY`
- [ ] `WHATSAPP_APP_SECRET`

### 2.3 Take a Screenshot or Note
- Write down which variables are present
- Note any that are missing

---

## Step 3: Verify Production Service Variables

### 3.1 Open Production Service
1. Go back to project view (click project name in breadcrumb)
2. Click on the service named **`professional-diver-api-prod`** (or similar)
3. In the left sidebar, click **Variables** tab

### 3.2 Check Required Variables
**Compare with staging** - they should match, except:

#### Critical (Must Have):
- [ ] **`DATABASE_URL`** ⚠️ **MOST IMPORTANT**
  - Should start with: `postgresql://postgres:`
  - **This is likely missing or wrong in production!**
  - **If missing:** Copy from Supabase Dashboard → Settings → Database → Connection string
  - Can be same as staging, or use separate Supabase project

- [ ] **`SUPABASE_SERVICE_ROLE_KEY`**
  - Should start with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
  - **If missing:** Copy from Supabase Dashboard

- [ ] **`NODE_ENV`**
  - Should be: `production`
  - **If missing:** Add it

#### Important (Should Have):
- [ ] **`OPENAI_API_KEY`**
  - Should start with: `sk-...`
  - Can be same as staging

- [ ] **`STRIPE_SECRET_KEY`** ⚠️ **DIFFERENT FROM STAGING**
  - Should start with: `sk_live_...` (for production/live mode)
  - **Must be different from staging!**
  - **If missing:** Get from Stripe Dashboard → Developers → API keys (Live mode)

- [ ] **`STRIPE_WEBHOOK_SECRET`** ⚠️ **DIFFERENT FROM STAGING**
  - Should start with: `whsec_...` (for production, no "test" in name)
  - **Must be different from staging!**
  - **If missing:** Get from Stripe Dashboard → Developers → Webhooks (Live mode)

### 3.3 Compare with Staging
Create a comparison table:

| Variable | Staging | Production | Status |
|----------|---------|------------|--------|
| `DATABASE_URL` | ✅ Set | ❓ Check | **Critical** |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ Set | ❓ Check | Important |
| `NODE_ENV` | ✅ Set | ❓ Check | Important |
| `OPENAI_API_KEY` | ✅ Set | ❓ Check | Important |
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` | **Different** |
| `STRIPE_WEBHOOK_SECRET` | `whsec_test_...` | `whsec_...` | **Different** |

---

## Step 4: Fix Missing Variables

### If `DATABASE_URL` is Missing in Production:

1. **Get from Supabase:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to **Settings** → **Database**
   - Scroll to **Connection string** section
   - Copy the **URI** format (not the other formats)
   - It should look like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

2. **Add to Railway:**
   - Railway Dashboard → Production service → Variables
   - Click **+ New Variable**
   - Name: `DATABASE_URL`
   - Value: Paste the connection string
   - Click **Add**

3. **Redeploy:**
   - Railway will automatically redeploy when you add variables
   - Or manually: Deployments → Redeploy

### If Other Variables are Missing:

1. **Find the value:**
   - See "Where to Find Values" section below
   - Or copy from staging if it's the same key

2. **Add to Railway:**
   - Same process as above
   - Add variable → Redeploy

---

## Step 5: Verify After Fixes

After adding missing variables and redeploying:

```bash
# Test production (should now work)
curl https://api.professionaldiver.app/health | jq '.services.db'
```

**Expected:** `"postgresql-connected"`

---

## Where to Find Values

### Supabase `DATABASE_URL`
1. Supabase Dashboard → Your Project
2. Settings → Database
3. Connection string → **URI** format
4. Copy the entire string (includes password)

### Supabase `SUPABASE_SERVICE_ROLE_KEY`
1. Supabase Dashboard → Your Project
2. Settings → API
3. Project API keys section
4. Copy **`service_role`** key (not `anon` key)

### Stripe Keys
1. Stripe Dashboard → Developers → API keys
2. **Test mode:** Use `sk_test_...` for staging
3. **Live mode:** Use `sk_live_...` for production
4. Webhooks → Your webhook → Copy signing secret

### OpenAI
1. OpenAI Dashboard → API keys
2. Create new or use existing key

---

## Quick Fix Checklist

If production health check is failing:

- [ ] Check Railway Dashboard → Production service → Variables
- [ ] Verify `DATABASE_URL` exists and is correct
- [ ] Verify `NODE_ENV=production` is set
- [ ] Compare with staging (staging works, so use it as reference)
- [ ] Add any missing variables
- [ ] Redeploy production service
- [ ] Test health endpoint again

---

## After Verification

Once both services show `postgresql-connected`:

1. ✅ Railway env vars verified
2. ✅ Set Cloudflare Pages env vars (see `CLOUDFLARE_PAGES_SETUP.md`)
3. ✅ Test end-to-end: Frontend → API → Database

---

## Need Help?

If you're stuck:

1. **Check Railway logs:**
   - Service → Deployments → Latest → View logs
   - Look for database connection errors

2. **Test connection string:**
   - Use Supabase SQL editor to verify database is accessible
   - Or use `psql` command line tool

3. **Compare with staging:**
   - If staging works, production should have the same variables (except Stripe keys)
