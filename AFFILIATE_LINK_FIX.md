# Affiliate Link Fix - Deployment Guide

## Issues Fixed

1. ✅ **Worker SPA Routing** - Fixed worker to properly serve `index.html` for all routes
2. ✅ **Subdomain Redirect** - Added redirect from `professional-diver.diverwell.app` → `diverwell.app` (preserves query params)
3. ✅ **Referral Code Tracking** - Enhanced referral hook with better error handling and logging
4. ✅ **Wrangler Configuration** - Added subdomain route to `wrangler.toml`

## Current Status

- ✅ Code changes complete
- ⚠️ **Needs deployment** - Worker must be rebuilt and deployed
- ⚠️ **DNS Configuration** - Subdomain needs to be configured in Cloudflare

## Deployment Steps

### 1. Build and Deploy Worker

```bash
# Build the worker
npm run build:worker

# Deploy to production
npm run deploy:prod
```

### 2. DNS Configuration in Cloudflare

The subdomain `professional-diver.diverwell.app` needs to be configured:

**Option A: CNAME Record (Recommended)**
- Type: CNAME
- Name: `professional-diver`
- Target: `diverwell.app` (or your Cloudflare worker domain)
- Proxy: ✅ Proxied (orange cloud)

**Option B: A Record**
- Type: A
- Name: `professional-diver`
- IPv4: (Your server IP - if not using Cloudflare proxy)
- Proxy: ✅ Proxied

### 3. Verify SSL Certificate

After DNS is configured:
1. Go to Cloudflare Dashboard → SSL/TLS
2. Ensure SSL mode is set to **Full** or **Full (strict)**
3. Wait 5-10 minutes for SSL certificate to provision
4. Test: `https://professional-diver.diverwell.app`

### 4. Test the Affiliate Link

1. Visit: `https://professional-diver.diverwell.app/?ref=PDWSGUAEGO`
2. Should redirect to: `https://diverwell.app/?ref=PDWSGUAEGO`
3. Open browser console
4. Look for: `"Referral code detected in URL: PDWSGUAEGO"`
5. Run: `window.checkReferral()` to verify storage

## Troubleshooting

### SSL Error (ERR_SSL_PROTOCOL_ERROR)

**Cause**: DNS not configured or SSL certificate not provisioned

**Fix**:
1. Verify DNS record exists in Cloudflare
2. Ensure record is proxied (orange cloud)
3. Wait 5-10 minutes for SSL to provision
4. Check SSL/TLS settings in Cloudflare dashboard

### 404 Error on Main Domain

**Cause**: Worker not deployed or assets not built

**Fix**:
1. Run `npm run build:worker`
2. Run `npm run deploy:prod`
3. Verify `dist/client/index.html` exists
4. Check Cloudflare Workers dashboard for deployment status

### Referral Code Not Captured

**Check**:
1. Open browser console
2. Look for referral code logs
3. Check localStorage: `localStorage.getItem('affiliate_referral_code')`
4. Run: `window.checkReferral()`

## Testing Checklist

- [ ] `https://diverwell.app` loads correctly
- [ ] `https://diverwell.app/?ref=TEST123` loads and captures code
- [ ] `https://professional-diver.diverwell.app` redirects to main domain
- [ ] `https://professional-diver.diverwell.app/?ref=TEST123` redirects and preserves ref
- [ ] Referral code stored in localStorage
- [ ] Console shows "Referral code detected in URL"
- [ ] Trial signup includes referral code

## Next Steps

1. Deploy the updated worker
2. Configure DNS for subdomain
3. Wait for SSL certificate
4. Test affiliate links
5. Verify referral tracking in affiliate dashboard








