# Required DNS Records for professionaldiver.app

## Current Status

You have configured:
- ✅ **CNAME** record for `www` → `professionaldiver.app` (Proxied)

## Missing Required Records

### ❌ Root A Record (CRITICAL - MISSING)

**This is REQUIRED for your site to work!**

- **Type:** A
- **Name:** `@` (or `professionaldiver.app`)
- **Content:** `192.0.2.1` (placeholder - Cloudflare Worker handles routing)
- **Proxy Status:** ✅ **Proxied** (orange cloud)
- **TTL:** Auto

**Why it's needed:**
- The root domain (`professionaldiver.app`) requires an A record
- Without it, `https://professionaldiver.app` won't resolve
- The IP is a placeholder; Cloudflare Worker handles actual routing

## Complete DNS Configuration

### Required Records

#### 1. Root A Record
```
Type: A
Name: @ (or professionaldiver.app)
Content: 192.0.2.1
Proxy: ✅ Proxied (orange cloud)
TTL: Auto
```

#### 2. WWW CNAME Record (✅ Already configured)
```
Type: CNAME
Name: www
Content: professionaldiver.app
Proxy: ✅ Proxied (orange cloud)
TTL: Auto
```

### Optional Records (Recommended)

#### 3. Root AAAA Record (IPv6 Support)
```
Type: AAAA
Name: @ (or professionaldiver.app)
Content: 100:: (placeholder - Cloudflare handles IPv6)
Proxy: ✅ Proxied (orange cloud)
TTL: Auto
```

**Note:** AAAA record is optional but recommended for IPv6 support.

## How to Add Missing Records

### Method 1: Via Cloudflare Dashboard

1. Go to: https://dash.cloudflare.com
2. Select zone: `professionaldiver.app`
3. Navigate to: **DNS** → **Records**
4. Click **Add record**
5. Configure:
   - **Type:** A
   - **Name:** `@` (or leave blank for root)
   - **IPv4 address:** `192.0.2.1`
   - **Proxy status:** ✅ Enable proxy (orange cloud)
   - **TTL:** Auto
6. Click **Save**

### Method 2: Via API Script (Recommended)

The existing script will automatically add the missing root A record:

```bash
# Set API token (if not already set)
export CLOUDFLARE_API_TOKEN=your_token_here

# Check current DNS records
node --import tsx/esm scripts/check-dns-records.ts

# Configure missing records
node --import tsx/esm scripts/configure-dns-api.ts
```

The script will:
1. Check for existing records
2. Create root A record if missing
3. Verify www CNAME is correct
4. Ensure all records are proxied

## What Each Record Does

### A Record (Address Record)
- **Purpose:** Maps domain name to IPv4 address
- **Required for:** Root domain resolution
- **For Cloudflare Workers:** IP is placeholder; Worker handles routing

### CNAME Record (Canonical Name)
- **Purpose:** Creates alias pointing to another domain
- **Required for:** Subdomain aliases (like www)
- **Note:** Cannot use CNAME for root domain (@) - must use A record

### AAAA Record (IPv6 Address)
- **Purpose:** Maps domain name to IPv6 address
- **Optional:** Provides IPv6 support
- **For Cloudflare Workers:** IPv6 is handled automatically when proxied

## Verification

After adding records, verify:

```bash
# Check DNS resolution
dig professionaldiver.app +short
nslookup professionaldiver.app

# Should return Cloudflare IP addresses (when proxied)

# Test HTTPS
curl -I https://professionaldiver.app

# Should return HTTP/2 200
```

## Expected Final Configuration

After complete setup, you should have:

| Type | Name | Content | Proxy | Status |
|------|------|---------|-------|--------|
| A | @ | 192.0.2.1 | ✅ | Required |
| CNAME | www | professionaldiver.app | ✅ | Required |
| AAAA | @ | 100:: | ✅ | Optional |

## Troubleshooting

### "Domain not resolving"
- **Cause:** Missing root A record
- **Fix:** Add A record for root domain (@)

### "SSL certificate error"
- **Cause:** Record not proxied
- **Fix:** Enable proxy (orange cloud) on all records

### "WWW not working"
- **Cause:** Missing or incorrect CNAME
- **Fix:** Ensure www CNAME points to root domain and is proxied

## Next Steps

1. ✅ Add root A record (via dashboard or API script)
2. ✅ Verify all records are proxied
3. ⏳ Wait 5-10 minutes for DNS propagation
4. ⏳ Wait 5-10 minutes for SSL certificate provisioning
5. ✅ Test: `https://professionaldiver.app`
6. ✅ Test: `https://www.professionaldiver.app`

## Quick Commands

```bash
# Check current DNS records
node --import tsx/esm scripts/check-dns-records.ts

# Configure missing records
node --import tsx/esm scripts/configure-dns-api.ts

# Test DNS resolution
dig professionaldiver.app +short

# Test HTTPS
curl -I https://professionaldiver.app
```








