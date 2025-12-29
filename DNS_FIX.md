# DNS Record Already Exists - Fix Guide

## Issue
You're trying to add a CNAME record for `professional-diver.diverwell.app` but a record with that name already exists.

## Solution Options

### Option 1: Update Existing Record (Recommended)

1. Go to **Cloudflare Dashboard** → **DNS** → **Records**
2. Find the existing record for `professional-diver`
3. Click **Edit** on that record
4. Update it to:
   - **Type:** CNAME
   - **Name:** `professional-diver`
   - **Target:** `diverwell.app`
   - **Proxy status:** ✅ **Proxied** (orange cloud)
   - **TTL:** Auto
5. Click **Save**

### Option 2: Delete and Recreate

1. Go to **Cloudflare Dashboard** → **DNS** → **Records**
2. Find the existing record for `professional-diver`
3. Click **Delete** and confirm
4. Wait 30 seconds
5. Click **Add record**
6. Create new CNAME:
   - **Type:** CNAME
   - **Name:** `professional-diver`
   - **Target:** `diverwell.app`
   - **Proxy status:** ✅ **Proxied** (orange cloud)
   - **TTL:** Auto
7. Click **Save**

## Verify the Record

After updating, verify:
1. The record shows as **Proxied** (orange cloud icon)
2. Type is **CNAME**
3. Target is `diverwell.app`

## Test After Update

Wait 5-10 minutes for DNS propagation, then test:

```bash
# Should redirect to main domain
curl -I "https://professional-diver.diverwell.app/?ref=TEST123"
```

Expected: `301 Moved Permanently` → `https://diverwell.app/?ref=TEST123`

## Common Issues

### If record is not proxied:
- The SSL error will persist
- **Fix:** Enable proxy (orange cloud)

### If record type is wrong:
- A or AAAA records won't work with Workers
- **Fix:** Change to CNAME pointing to `diverwell.app`

### If target is wrong:
- Should point to `diverwell.app` (not an IP)
- **Fix:** Update target to `diverwell.app`








