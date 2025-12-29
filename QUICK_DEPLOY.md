# Quick Deployment Guide

## Current Status: 404 Errors

The 404 errors indicate the worker is **not deployed** or routes are not configured.

## Immediate Actions Required

### Step 1: Verify You're Logged In

```bash
npx wrangler whoami
```

If not logged in:
```bash
npx wrangler login
```

### Step 2: Deploy the Worker

```bash
npm run deploy:prod
```

**Expected output:**
```
✨ Success! Published diverwell-app-production
```

### Step 3: Verify Deployment in Cloudflare Dashboard

1. Go to: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **diverwell-app-production**
3. Check:
   - ✅ Worker is listed
   - ✅ Status shows "Active"
   - ✅ Under "Settings" → "Assets" - files are listed

### Step 4: Verify Routes

In Cloudflare Dashboard:
1. **Workers & Pages** → **diverwell-app-production** → **Settings** → **Triggers**
2. Verify these routes exist:
   - `diverwell.app/*`
   - `www.diverwell.app/*`
   - `professional-diver.diverwell.app/*`

**If routes are missing:**
- Click "Add Custom Domain" or "Add Route"
- Add each route manually

### Step 5: Configure DNS for Subdomain

1. Go to: **DNS** → **Records**
2. Add CNAME:
   - **Type:** CNAME
   - **Name:** `professional-diver`
   - **Target:** `diverwell.app`
   - **Proxy:** ✅ Proxied (orange cloud)
   - **TTL:** Auto

### Step 6: Wait and Test

Wait 5-10 minutes, then test:
```bash
curl -I https://diverwell.app
```

Should return: `200 OK`

## Troubleshooting 404 Errors

### If deployment succeeds but still 404:

1. **Check Worker Logs:**
   ```bash
   npx wrangler tail --env production
   ```
   Then visit the site and watch for errors.

2. **Verify Assets Were Uploaded:**
   - Dashboard → Workers & Pages → diverwell-app-production → Settings
   - Look for "Assets" section
   - Should show files from `dist/client/`

3. **Check Route Pattern:**
   - Route must be: `diverwell.app/*` (with `/*`)
   - Zone name must be: `diverwell.app`

4. **Try Manual Route Addition:**
   - In dashboard, manually add route if missing
   - Ensure it's attached to the correct worker

### If SSL Error on Subdomain:

1. **Verify DNS Record:**
   - CNAME must exist
   - Must be proxied (orange cloud)
   - Wait 10-15 minutes for SSL certificate

2. **Check SSL/TLS Settings:**
   - Dashboard → SSL/TLS
   - Mode: "Full" or "Full (strict)"

## Quick Test Commands

```bash
# Test main domain
curl -I https://diverwell.app

# Test with referral code
curl -I "https://diverwell.app/?ref=TEST123"

# Test subdomain (should redirect)
curl -I "https://professional-diver.diverwell.app/?ref=TEST123"
```

## Common Issues

### Issue: "Worker not found"
**Solution:** Worker not deployed. Run `npm run deploy:prod`

### Issue: "Route not found"  
**Solution:** Routes not configured. Add in dashboard or check `wrangler.toml`

### Issue: "Assets not found"
**Solution:** Assets not uploaded. Check `[env.production.assets]` in `wrangler.toml`

### Issue: "404 Page not found"
**Solution:** Worker deployed but not serving correctly. Check logs and route configuration.

## Next Steps After Deployment

1. ✅ Deploy: `npm run deploy:prod`
2. ✅ Verify in dashboard
3. ✅ Add DNS record for subdomain
4. ✅ Wait 10 minutes
5. ✅ Test all URLs
6. ✅ Verify referral code tracking








