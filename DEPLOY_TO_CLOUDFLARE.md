# Deploy to Cloudflare - Quick Guide

## Current Status

✅ **Build:** Completed successfully  
✅ **Worker File:** `dist/worker.js` ready  
✅ **Client Files:** `dist/client/` ready  
❌ **Deployment:** Blocked by API token permissions

## Fix API Token Permissions

Your current API token only has DNS permissions. You need to add **Workers** permissions.

### Option 1: Update Existing Token (Recommended)

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Find your existing token (or create a new one)
3. Click **Edit** on the token
4. Add these permissions:
   - **Account** → **Cloudflare Workers** → **Edit**
   - **Zone** → **Workers Routes** → **Edit** (for `professionaldiver.app`)
   - **Account** → **Workers KV Storage** → **Edit**
   - **Account** → **Workers Scripts** → **Edit**
5. Save the token
6. Update your environment variable:
   ```bash
   export CLOUDFLARE_API_TOKEN=your_updated_token_here
   ```

### Option 2: Create New Token with Full Permissions

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use **"Edit Cloudflare Workers"** template
4. Or create custom token with:
   - **Account** → **Cloudflare Workers** → **Edit**
   - **Zone** → **Workers Routes** → **Edit** (select `professionaldiver.app`)
   - **Account** → **Workers KV Storage** → **Edit**
   - **Account** → **Workers Scripts** → **Edit**
5. Copy the new token
6. Set it:
   ```bash
   export CLOUDFLARE_API_TOKEN=your_new_token_here
   ```

## Deploy After Fixing Token

Once you've updated the token with Workers permissions:

```bash
# Make sure token is set
export CLOUDFLARE_API_TOKEN=your_token_with_workers_permissions

# Deploy to production
pnpm run deploy:prod
```

## Alternative: Use Wrangler Login (OAuth)

If you prefer OAuth instead of API token:

1. **Unset the API token:**
   ```bash
   unset CLOUDFLARE_API_TOKEN
   ```

2. **Login via OAuth:**
   ```bash
   wrangler login
   ```
   - This will open your browser
   - Authorize the application
   - Return to terminal

3. **Deploy:**
   ```bash
   pnpm run deploy:prod
   ```

## What Gets Deployed

- **Worker:** `dist/worker.js` (Cloudflare Worker)
- **Assets:** `dist/client/` (Static files)
- **Routes:** Configured for `professionaldiver.app/*` and `www.professionaldiver.app/*`

## After Deployment

1. **Wait 1-2 minutes** for deployment to propagate
2. **Test your site:**
   ```bash
   curl -I https://professionaldiver.app
   ```
3. **Check deployment status:**
   ```bash
   wrangler deployments list --env production
   ```

## Troubleshooting

### "Authentication error [code: 10000]"
- **Fix:** Update API token with Workers permissions (see above)

### "Timed out waiting for authorization"
- **Fix:** Complete OAuth flow in browser, or use API token method

### "Worker not found"
- **Fix:** Check worker name in `wrangler.toml` matches Cloudflare dashboard

### "Routes not working"
- **Fix:** Verify routes in Cloudflare Dashboard → Workers & Pages → Settings → Triggers

## Quick Deploy Command

Once token is fixed:

```bash
export CLOUDFLARE_API_TOKEN=your_token_with_workers_permissions && pnpm run deploy:prod
```

## Current Build Status

✅ Client application built  
✅ Worker built (`dist/worker.js`)  
✅ Assets ready (`dist/client/`)  
✅ Configuration ready (`wrangler.toml`)  
⏳ Waiting for API token with Workers permissions

---

**Next Step:** Update your Cloudflare API token with Workers permissions, then run `pnpm run deploy:prod`








