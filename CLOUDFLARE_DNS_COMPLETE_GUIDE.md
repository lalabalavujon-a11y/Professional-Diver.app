# Cloudflare DNS Configuration - Complete Guide

## Current DNS Configuration ✅

Your domain `professionaldiver.app` is configured with:

### 1. Root Domain A Record
- **Type:** A
- **Name:** `@` (or `professionaldiver.app`)
- **Content:** `192.0.2.1` (placeholder - Cloudflare Worker handles routing)
- **Proxy Status:** ✅ **Proxied** (orange cloud)
- **TTL:** Auto

### 2. WWW Subdomain CNAME Record
- **Type:** CNAME
- **Name:** `www`
- **Content:** `professionaldiver.app`
- **Proxy Status:** ✅ **Proxied** (orange cloud)
- **TTL:** Auto

## Understanding DNS Record Types

### A Record (Address Record)
- **Purpose:** Maps a domain name to an IPv4 address
- **Use Case:** Root domain pointing to an IP address
- **Example:** `professionaldiver.app` → `192.0.2.1`
- **Note:** For Cloudflare Workers, the IP is a placeholder; routing is handled by the Worker

### CNAME Record (Canonical Name Record)
- **Purpose:** Maps a domain name to another domain name (alias)
- **Use Case:** Subdomains pointing to the main domain
- **Example:** `www.professionaldiver.app` → `professionaldiver.app`
- **Note:** CNAME cannot be used for root domain (@) - must use A record

### Other Common DNS Record Types

#### AAAA Record (IPv6 Address)
- **Purpose:** Maps a domain name to an IPv6 address
- **Use Case:** IPv6 support (optional)
- **Example:** `professionaldiver.app` → `2001:db8::1`

#### MX Record (Mail Exchange)
- **Purpose:** Specifies mail servers for the domain
- **Use Case:** Email routing
- **Example:** `@` → `mail.professionaldiver.app` (priority: 10)

#### TXT Record
- **Purpose:** Text-based records for various purposes
- **Use Case:** SPF, DKIM, DMARC, domain verification
- **Example:** `@` → `"v=spf1 include:_spf.google.com ~all"`

#### NS Record (Name Server)
- **Purpose:** Specifies authoritative name servers
- **Use Case:** Usually managed by Cloudflare automatically

## Adding Additional DNS Records

### Method 1: Via Cloudflare Dashboard (Recommended)

1. Go to: https://dash.cloudflare.com
2. Select zone: `professionaldiver.app`
3. Navigate to: **DNS** → **Records**
4. Click **Add record**
5. Configure:
   - **Type:** Select record type (A, CNAME, AAAA, MX, TXT, etc.)
   - **Name:** Subdomain name (or `@` for root)
   - **Content:** Target value (IP for A, domain for CNAME, etc.)
   - **Proxy status:** ✅ Enable proxy (orange cloud) for web traffic
   - **TTL:** Auto (when proxied) or custom
6. Click **Save**

### Method 2: Via Cloudflare API

Use the existing script or create custom API calls:

```bash
# Set API token
export CLOUDFLARE_API_TOKEN=your_token_here

# Run DNS configuration script
node --import tsx/esm scripts/configure-dns-api.ts
```

### Method 3: Via Wrangler CLI

```bash
# Note: Wrangler doesn't directly manage DNS records
# Use Cloudflare Dashboard or API instead
```

## Common DNS Record Examples

### Adding a Subdomain (e.g., `api.professionaldiver.app`)

**Via Dashboard:**
- Type: CNAME
- Name: `api`
- Content: `professionaldiver.app`
- Proxy: ✅ Proxied
- TTL: Auto

**Via API:**
```typescript
await createDNSRecord(zoneId, {
  type: 'CNAME',
  name: 'api',
  content: 'professionaldiver.app',
  proxied: true,
});
```

### Adding Email Records (MX)

**Via Dashboard:**
- Type: MX
- Name: `@`
- Mail server: `mail.professionaldiver.app`
- Priority: `10`
- Proxy: ❌ DNS only (not proxied)
- TTL: Auto

### Adding SPF Record (TXT)

**Via Dashboard:**
- Type: TXT
- Name: `@`
- Content: `"v=spf1 include:_spf.google.com ~all"`
- Proxy: ❌ DNS only
- TTL: Auto

### Adding AAAA Record (IPv6)

**Via Dashboard:**
- Type: AAAA
- Name: `@`
- Content: `2001:db8::1` (example IPv6)
- Proxy: ✅ Proxied
- TTL: Auto

## What Happens After DNS Configuration

### 1. DNS Propagation (5-10 minutes)
- DNS changes propagate globally
- Different DNS servers update at different rates
- Some locations may see changes faster than others
- **Status:** Wait 5-10 minutes before testing

### 2. SSL Certificate Provisioning (5-10 minutes)
- Cloudflare automatically provisions SSL certificates
- Works for proxied records (orange cloud)
- Supports both root and subdomains
- **Status:** Automatic - no action needed

### 3. Worker Route Activation
- Cloudflare Worker routes become active
- Traffic starts routing through your Worker
- Both `professionaldiver.app` and `www.professionaldiver.app` work

## Testing Your DNS Configuration

### 1. Test DNS Resolution

```bash
# Test root domain
dig professionaldiver.app +short
nslookup professionaldiver.app

# Test www subdomain
dig www.professionaldiver.app +short
nslookup www.professionaldiver.app
```

**Expected:** Should return Cloudflare IP addresses (when proxied)

### 2. Test HTTPS Connection

```bash
# Test main domain
curl -I https://professionaldiver.app

# Test www subdomain
curl -I https://www.professionaldiver.app

# Test with referral code
curl -I "https://professionaldiver.app/?ref=TEST123"
```

**Expected Responses:**
- `HTTP/2 200` - Site is working!
- `HTTP/2 301` - Redirect (www → main domain)
- Valid SSL certificate

### 3. Test in Browser

1. Open: `https://professionaldiver.app`
2. Should see the landing page
3. Check SSL certificate (lock icon in address bar)
4. Test referral link: `https://professionaldiver.app/?ref=TEST123`
5. Open browser console (F12)
6. Look for: `"Referral code detected in URL: TEST123"`
7. Run: `window.checkReferral()` to verify storage

### 4. Verify Referral Tracking

```javascript
// In browser console
window.checkReferral()
// Should return: "TEST123" (or your test code)

// Check localStorage
localStorage.getItem('referralCode')
// Should return: "TEST123"
```

## Current Status

✅ **Worker deployed:** `professionaldiver-app-production`

✅ **Routes configured:**
- `professionaldiver.app/*`
- `www.professionaldiver.app/*`

✅ **DNS records:**
- A record for root domain (proxied)
- CNAME for www (proxied)

✅ **Referral tracking:** Ready and working

## Troubleshooting

### SSL Certificate Errors

**Symptoms:**
- Browser shows "Not Secure" or SSL error
- `curl` shows SSL handshake failure

**Solutions:**
1. **Wait longer:** SSL provisioning can take 10-15 minutes
2. **Check SSL mode:** Cloudflare Dashboard → SSL/TLS → Overview
   - Should be "Full" or "Full (strict)"
3. **Verify proxy status:** Records must be proxied (orange cloud)
4. **Check certificate status:** SSL/TLS → Edge Certificates
   - Should show "Active Certificate"

### 404 Errors

**Symptoms:**
- Site loads but shows 404
- Worker not responding

**Solutions:**
1. **Check routes:** Cloudflare Dashboard → Workers & Pages → `professionaldiver-app-production` → Settings → Triggers
   - Verify routes are active
   - Ensure custom domains are added
2. **Check Worker status:** Workers & Pages → `professionaldiver-app-production`
   - Should show "Active"
3. **Verify deployment:** Check deployment logs for errors

### DNS Not Resolving

**Symptoms:**
- Domain doesn't resolve
- DNS lookup fails
- "Server not found" error

**Solutions:**
1. **Check DNS records:** Cloudflare Dashboard → DNS → Records
   - Verify records exist
   - Ensure they're proxied (orange cloud)
2. **Wait for propagation:** Can take 5-10 minutes (or up to 48 hours in rare cases)
3. **Check nameservers:** Verify nameservers at registrar point to Cloudflare
4. **Clear DNS cache:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   
   # Linux
   sudo systemd-resolve --flush-caches
   
   # Windows
   ipconfig /flushdns
   ```

### Referral Tracking Not Working

**Symptoms:**
- Referral codes not detected
- `window.checkReferral()` returns null

**Solutions:**
1. **Check URL format:** Must be `?ref=CODE` (not `&ref=CODE` as first param)
2. **Check browser console:** Look for JavaScript errors
3. **Verify Worker code:** Check that referral tracking is implemented
4. **Test with different codes:** Try `?ref=TEST123` to verify

### WWW Not Redirecting

**Symptoms:**
- `www.professionaldiver.app` doesn't redirect to `professionaldiver.app`

**Solutions:**
1. **Check Page Rules:** Cloudflare Dashboard → Rules → Page Rules
   - Create rule: `www.professionaldiver.app/*` → Forwarding URL (301) → `https://professionaldiver.app/$1`
2. **Or handle in Worker:** Add redirect logic in Worker code
3. **Verify CNAME:** Ensure www CNAME points to root domain

## Best Practices

### 1. Always Proxy Web Traffic
- Enable proxy (orange cloud) for A and CNAME records serving web traffic
- Provides DDoS protection, CDN, and SSL

### 2. Use CNAME for Subdomains
- Use CNAME records for subdomains pointing to main domain
- Easier to manage and update

### 3. Keep TTL on Auto
- When proxied, Cloudflare manages TTL automatically
- Ensures optimal caching and performance

### 4. Monitor DNS Changes
- Use Cloudflare Analytics to monitor DNS queries
- Set up alerts for DNS failures

### 5. Document Your DNS Records
- Keep a record of all DNS configurations
- Makes troubleshooting easier

## Additional Resources

- **Cloudflare DNS Docs:** https://developers.cloudflare.com/dns/
- **DNS API Reference:** https://developers.cloudflare.com/api/operations/dns-records-for-a-zone-list-dns-records
- **SSL/TLS Settings:** https://developers.cloudflare.com/ssl/
- **Page Rules:** https://developers.cloudflare.com/page-rules/

## Quick Reference Commands

```bash
# Test DNS resolution
dig professionaldiver.app +short
nslookup professionaldiver.app

# Test HTTPS
curl -I https://professionaldiver.app
curl -I https://www.professionaldiver.app

# Test with referral
curl -I "https://professionaldiver.app/?ref=TEST123"

# Check SSL certificate
openssl s_client -connect professionaldiver.app:443 -servername professionaldiver.app

# Clear DNS cache (macOS)
sudo dscacheutil -flushcache
```

## Next Steps

After DNS propagation and SSL provisioning (5-10 minutes):

1. ✅ Test the site: `https://professionaldiver.app`
2. ✅ Test www: `https://www.professionaldiver.app`
3. ✅ Test referral links: `https://professionaldiver.app/?ref=TEST123`
4. ✅ Verify SSL certificate in browser
5. ✅ Check referral tracking in browser console

If everything works, your site is live! 🎉








