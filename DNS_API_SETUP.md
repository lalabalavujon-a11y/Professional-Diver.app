# DNS Configuration via Cloudflare API

## Quick Setup

### Step 1: Get Cloudflare API Token

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **Create Token**
3. Use **Edit zone DNS** template, or create custom token with:
   - Permissions: `Zone` → `DNS` → `Edit`
   - Zone Resources: Include → `professionaldiver.app`
4. Copy the token

### Step 2: Set Environment Variable

```bash
export CLOUDFLARE_API_TOKEN=VmM9c0TIDR1lluKjsTTobCiHDTT0UmgNlyYiZ3LH
```

### Step 3: Run DNS Configuration Script

```bash
node --import tsx/esm scripts/configure-dns-api.ts
```

## What the Script Does

1. ✅ Checks if zone `professionaldiver.app` exists
2. ✅ Gets zone ID
3. ✅ Creates/updates root A record (proxied)
4. ✅ Creates/updates www CNAME (proxied)

## Manual Alternative

If you prefer to use the dashboard:

1. Go to: https://dash.cloudflare.com
2. Select zone: `professionaldiver.app`
3. Go to: **DNS** → **Records**
4. Add records:
   - **A record**: `@` → `192.0.2.1` → ✅ Proxied
   - **CNAME**: `www` → `professionaldiver.app` → ✅ Proxied

## After Configuration

- Wait 5-10 minutes for DNS propagation
- SSL certificate will auto-provision
- Test: `https://professionaldiver.app`
- Test: `https://www.professionaldiver.app`

## Troubleshooting

### "Zone not found"
- Add the domain to Cloudflare first
- Update nameservers at registrar
- Wait for zone activation

### "API credentials not found"
- Set `CLOUDFLARE_API_TOKEN` environment variable
- Or use dashboard method instead

### "Permission denied"
- Check API token has DNS Edit permissions
- Verify token is for correct zone

