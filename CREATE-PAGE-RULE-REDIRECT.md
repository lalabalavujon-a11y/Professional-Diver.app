# Create Page Rule Redirect for Old Sales Page

## Quick Steps to Redirect professionaldiver.app to New Site

### Step 1: Access Cloudflare Dashboard
1. Go to **https://dash.cloudflare.com**
2. Log in to your account
3. Select the zone: **professionaldiver.app**

### Step 2: Navigate to Page Rules
1. In the left sidebar, click **Rules**
2. Click **Page Rules** (or **Transform Rules** if Page Rules isn't available)
3. Click **Create rule** (or **Add rule**)

### Step 3: Create the Redirect Rule

**If using Page Rules (older interface):**

1. **URL Pattern:**
   ```
   professionaldiver.app/*
   ```

2. **Setting:**
   - Select: **Forwarding URL**
   - Choose: **301 - Permanent Redirect**

3. **Destination URL:**
   ```
   https://professional-diver-app.pages.dev/$1
   ```
   (The `$1` preserves the path after the domain)

4. Click **Save and Deploy**

**If using Transform Rules (modern interface):**

1. Click **Transform Rules** → **Dynamic Redirects**
2. Click **Create rule**

3. **Rule name:**
   ```
   Redirect old sales page to new site
   ```

4. **When incoming requests match:**
   ```
   (http.host eq "professionaldiver.app" and http.request.uri.path ne "/api")
   ```
   (Exclude /api paths if you have API routes)

5. **Then:**
   - Select: **Dynamic redirect**
   - Status code: **301 - Permanent Redirect**
   - Redirect to: **https://professional-diver-app.pages.dev${http.request.uri.path}**

6. Click **Deploy**

### Step 4: Verify the Redirect

After saving, test the redirect:

```bash
curl -I https://professionaldiver.app
```

Expected response:
```
HTTP/2 301
Location: https://professional-diver-app.pages.dev/
```

Or test in browser:
- Visit `https://professionaldiver.app`
- Should automatically redirect to `https://professional-diver-app.pages.dev`

### Step 5: Wait for Propagation

- Page Rules: Usually take effect within 1-2 minutes
- Transform Rules: Can take up to 5 minutes to propagate globally

## Troubleshooting

### If you don't see Page Rules:
- Your Cloudflare plan might not include Page Rules
- Use Transform Rules instead (available on all plans)
- Or use Cloudflare Workers for more control

### If redirect isn't working:
1. Check rule priority/order (rules execute in order)
2. Clear Cloudflare cache
3. Check browser cache (try incognito mode)
4. Wait 5-10 minutes for full propagation

### If you get SSL errors:
1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**
3. Wait for SSL certificate to provision

### If you need to exclude certain paths:
For example, if you want to keep `/api` paths working:
- Page Rules: Use multiple rules with different URL patterns
- Transform Rules: Add condition: `and http.request.uri.path ne "/api"`

## Alternative: Simple DNS Approach

If Page Rules don't work, you can also:

1. Go to **DNS** → **Records**
2. Find the `@` (root) CNAME record
3. Change target to: `professional-diver-app.pages.dev`
4. Ensure **Proxy status** is **Proxied** (orange cloud)
5. Save

This will point the domain directly to the new Cloudflare Pages deployment.

## Next Steps After Redirect Works

Once the redirect is working:
1. Go to Cloudflare Pages → Find the **old project** (the one with the sales page)
2. Remove `professionaldiver.app` from its custom domains
3. Go to Cloudflare Pages → `professional-diver-app` (new project)
4. Add `professionaldiver.app` as a custom domain
5. Complete DNS setup (it should verify quickly since DNS is already pointing correctly)

This ensures:
- ✅ Old sales page no longer shows (redirects to new site)
- ✅ Custom domain verification completes on new project
- ✅ Clean migration with zero downtime

