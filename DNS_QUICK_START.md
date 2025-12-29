# DNS Configuration Quick Start

## Current Status

✅ **Configured:**
- CNAME record for `www` → `professionaldiver.app` (Proxied)

❌ **Missing:**
- **Root A record** (CRITICAL - required for root domain)

## What Records You Need

### Required Records

1. **Root A Record** (MISSING - ADD THIS!)
   - Type: A
   - Name: `@` (root domain)
   - Content: `192.0.2.1`
   - Proxy: ✅ Proxied
   - TTL: Auto

2. **WWW CNAME** (✅ Already configured)
   - Type: CNAME
   - Name: `www`
   - Content: `professionaldiver.app`
   - Proxy: ✅ Proxied
   - TTL: Auto

## How to Add Missing Records

### Option 1: Check Current Status (Recommended First Step)

```bash
# Check what DNS records you currently have
pnpm run dns:check

# Or directly:
node --import tsx/esm scripts/check-dns-records.ts
```

This will show:
- All current DNS records
- What's missing
- What needs to be updated

### Option 2: Auto-Configure Missing Records

```bash
# Set your Cloudflare API token first
export CLOUDFLARE_API_TOKEN=your_token_here

# Run the configuration script
pnpm run dns:configure

# Or directly:
node --import tsx/esm scripts/configure-dns-api.ts
```

This script will:
- ✅ Check existing records
- ✅ Add missing root A record
- ✅ Verify www CNAME is correct
- ✅ Ensure all records are proxied

### Option 3: Manual via Cloudflare Dashboard

1. Go to: https://dash.cloudflare.com
2. Select zone: `professionaldiver.app`
3. Go to: **DNS** → **Records**
4. Click **Add record**
5. Configure:
   - **Type:** A
   - **Name:** `@` (or leave blank)
   - **IPv4 address:** `192.0.2.1`
   - **Proxy status:** ✅ Enable (orange cloud)
   - **TTL:** Auto
6. Click **Save**

## Get Cloudflare API Token

If you want to use the API scripts:

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use **Edit zone DNS** template
4. Select zone: `professionaldiver.app`
5. Copy the token
6. Set it: `export CLOUDFLARE_API_TOKEN=your_token`

## After Configuration

1. ⏳ Wait 5-10 minutes for DNS propagation
2. ⏳ Wait 5-10 minutes for SSL certificate provisioning
3. ✅ Test: `curl -I https://professionaldiver.app`
4. ✅ Test: `curl -I https://www.professionaldiver.app`

## Quick Commands Reference

```bash
# Check DNS records status
pnpm run dns:check

# Configure missing DNS records
pnpm run dns:configure

# Test DNS resolution
dig professionaldiver.app +short

# Test HTTPS
curl -I https://professionaldiver.app
```

## Troubleshooting

### "Domain not resolving"
- **Fix:** Add root A record (see above)

### "SSL certificate error"
- **Fix:** Ensure all records are proxied (orange cloud)
- **Wait:** SSL provisioning takes 5-10 minutes

### "API credentials not found"
- **Fix:** Set `CLOUDFLARE_API_TOKEN` environment variable
- **Or:** Use Cloudflare Dashboard method instead

## Full Documentation

- **Complete DNS Guide:** [CLOUDFLARE_DNS_COMPLETE_GUIDE.md](./CLOUDFLARE_DNS_COMPLETE_GUIDE.md)
- **Required Records:** [DNS_RECORDS_REQUIRED.md](./DNS_RECORDS_REQUIRED.md)
- **API Setup:** [DNS_API_SETUP.md](./DNS_API_SETUP.md)








