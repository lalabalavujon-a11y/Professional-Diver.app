# Quick Redirect Instructions - Use Transform Rules

Since Page Rules aren't available, use **Transform Rules** instead (available on all plans).

## Step-by-Step Instructions:

### Step 1: Access Transform Rules
1. Go to **https://dash.cloudflare.com**
2. Select zone: **professionaldiver.app**
3. In the left sidebar, click **Rules**
4. Click **Transform Rules**
5. Click the **Dynamic Redirects** tab

### Step 2: Create Redirect Rule
1. Click **Create rule**
2. **Rule name:**
   ```
   Redirect old sales page to new site
   ```

3. **When incoming requests match:**
   Click **Edit expression** and enter:
   ```
   (http.host eq "professionaldiver.app")
   ```
   (This matches all requests to professionaldiver.app)

4. **Then:**
   - Select: **Dynamic redirect**
   - Status code: **301 - Permanent Redirect**
   - Redirect to: **https://professional-diver-app.pages.dev${http.request.uri.path}${http.request.uri.query}**
   
   This preserves the path and query parameters.

5. Click **Deploy**

### Step 3: Verify
Wait 1-2 minutes, then test:
```bash
curl -I https://professionaldiver.app
```

Should return:
```
HTTP/2 301
Location: https://professional-diver-app.pages.dev/
```

## Alternative: Change DNS Record (Even Simpler!)

If Transform Rules don't work or seem complex, just change the DNS record:

1. Go to **DNS** → **Records**
2. Find the `@` (root) CNAME or A record
3. Edit it:
   - **Type:** CNAME
   - **Name:** @
   - **Target:** `professional-diver-app.pages.dev`
   - **Proxy status:** ✅ Proxied (orange cloud)
   - **TTL:** Auto
4. Click **Save**

This points the domain directly to the new Cloudflare Pages deployment - no redirect needed!

Wait 5-10 minutes for DNS to propagate, then `professionaldiver.app` will show the new site.

## Which Method to Use?

- **Transform Rules:** Good if you want to keep both deployments and redirect
- **DNS Change:** Simpler, points domain directly to new site (recommended)

I recommend the **DNS Change** method - it's simpler and more direct!

