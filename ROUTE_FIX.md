# Route Configuration Fix

## Issue: 404 Errors After Deployment

The worker deployed successfully, but routes may not be properly attached. The routes need to be verified in the Cloudflare Dashboard.

## Solution: Verify Routes in Dashboard

### Step 1: Check Worker Status
1. Go to: **Cloudflare Dashboard** → **Workers & Pages**
2. Find: **diverwell-app-production**
3. Verify it shows as **Active**

### Step 2: Verify Routes Are Attached
1. Click on **diverwell-app-production**
2. Go to **Settings** → **Triggers**
3. Under **Routes**, verify these exist:
   - `diverwell.app/*`
   - `www.diverwell.app/*`
   - `professional-diver.diverwell.app/*`

### Step 3: If Routes Are Missing
**Option A: Add Routes Manually**
1. In **Settings** → **Triggers**
2. Click **Add Route** or **Add Custom Domain**
3. Add each route:
   - Route: `diverwell.app/*`
   - Zone: `diverwell.app`
   - Click **Add Route**
4. Repeat for:
   - `www.diverwell.app/*`
   - `professional-diver.diverwell.app/*`

**Option B: Redeploy with Routes**
```bash
npm run deploy:prod
```

### Step 4: Verify Assets Are Uploaded
1. In **Settings** → **Assets** (or **Overview**)
2. Verify files are listed:
   - `index.html`
   - `assets/index-*.js`
   - `assets/index-*.css`

If assets are missing, redeploy:
```bash
npm run build:worker
npm run deploy:prod
```

## Alternative: Use Custom Domains Instead of Routes

If routes aren't working, try using Custom Domains:

1. **Settings** → **Triggers** → **Custom Domains**
2. Click **Add Custom Domain**
3. Add: `diverwell.app`
4. Add: `www.diverwell.app`
5. Add: `professional-diver.diverwell.app`

## Verify DNS Configuration

For the main domain:
1. **DNS** → **Records**
2. Verify there's an **A** or **CNAME** record for `diverwell.app`
3. It should be **Proxied** (orange cloud)

For subdomain:
1. **DNS** → **Records**
2. Find `professional-diver` record
3. Update to:
   - Type: **CNAME**
   - Target: `diverwell.app`
   - Proxy: **Proxied** (orange cloud)

## Test After Fix

```bash
# Test main domain
curl -I https://diverwell.app

# Should return: HTTP/2 200
```

## Common Issues

### Routes show but still 404
- Check if assets are uploaded
- Verify worker code is correct
- Check worker logs for errors

### Routes don't appear
- Routes may need to be added manually
- Try using Custom Domains instead
- Redeploy the worker

### SSL Error on Subdomain
- DNS record not proxied
- Wait 10-15 minutes for SSL certificate
- Check SSL/TLS settings








