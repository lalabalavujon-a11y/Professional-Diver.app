# GitHub Secrets Audit - What to Keep vs Remove

## Workflows That Use Secrets

### ✅ Keep These Secrets (Used by Workflows)

1. **`CLOUDFLARE_API_TOKEN`** - **KEEP** ✅
   - Used by:
     - `verify-cloudflare-websockets.yml` (manual workflow)
     - `configure-cloudflare-pages-env.yml` (manual workflow)
     - `purge-cloudflare-cache.yml` (runs on push to `main`)
   - **Purpose:** Cloudflare API operations (cache purge, WebSocket config, Pages env vars)

2. **`RAILWAY_TOKEN`** - **KEEP** ✅
   - Used by:
     - `purge-cloudflare-cache.yml` (runs on push to `main`)
   - **Purpose:** Poll Railway deployment status before purging cache

3. **`RAILWAY_SERVICE_ID`** - **KEEP** ✅
   - Used by:
     - `purge-cloudflare-cache.yml` (runs on push to `main`)
   - **Purpose:** Identify which Railway service to check deployment status for

### ❌ Can Remove (Not Used)

Any other secrets that aren't referenced in workflows can be safely removed.

---

## Workflow Summary

### `ci.yml` (Main CI)
- **Uses secrets:** ❌ No
- **Purpose:** Lint, typecheck, test, build
- **Runs on:** PRs and pushes to `main`

### `purge-cloudflare-cache.yml` (Cache Management)
- **Uses secrets:** ✅ Yes
  - `CLOUDFLARE_API_TOKEN`
  - `RAILWAY_TOKEN`
  - `RAILWAY_SERVICE_ID`
- **Purpose:** Purge Cloudflare cache after Railway deployment
- **Runs on:** Push to `main` (automatic) + manual trigger

### `verify-cloudflare-websockets.yml` (Manual)
- **Uses secrets:** ✅ Yes
  - `CLOUDFLARE_API_TOKEN`
- **Purpose:** Verify/enable WebSockets in Cloudflare
- **Runs on:** Manual trigger only

### `configure-cloudflare-pages-env.yml` (Manual)
- **Uses secrets:** ✅ Yes
  - `CLOUDFLARE_API_TOKEN`
- **Purpose:** Configure Cloudflare Pages environment variables via API
- **Runs on:** Manual trigger only

---

## Recommendation

### ✅ Keep These 3 Secrets:
1. `CLOUDFLARE_API_TOKEN`
2. `RAILWAY_TOKEN`
3. `RAILWAY_SERVICE_ID`

### ❌ Can Remove:
- Any other secrets not listed above
- Old/unused secrets from previous setups

---

## How to Verify

Run these commands to see which secrets are actually used:

```bash
# Check all workflow files for secret references
grep -r "secrets\." .github/workflows/

# Check for specific secret names
grep -r "CLOUDFLARE_API_TOKEN" .github/workflows/
grep -r "RAILWAY_TOKEN" .github/workflows/
grep -r "RAILWAY_SERVICE_ID" .github/workflows/
```

---

## Next Steps

1. ✅ Keep the 3 secrets listed above
2. ❌ Review other secrets in GitHub Settings → Secrets and variables → Actions
3. ❌ Remove any that aren't used (compare with grep results above)

---

**Note:** The main CI workflow (`ci.yml`) doesn't use secrets, which is correct for your "fireproof" setup where Railway and Cloudflare Pages handle their own deployments.
