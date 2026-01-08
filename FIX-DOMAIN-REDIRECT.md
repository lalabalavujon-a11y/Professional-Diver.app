# Fix professionaldiver.app Redirect - Alternative Approach

The Page Rule isn't working because the domain is directly pointing to the old Cloudflare Pages deployment. Here's the solution:

## Solution: Change DNS Record (Recommended)

Instead of using a Page Rule redirect, change the DNS record to point directly to the new Cloudflare Pages deployment.

### Step 1: Check Current DNS Setup

1. Go to Cloudflare Dashboard → Select zone `professionaldiver.app`
2. Go to **DNS** → **Records**
3. Look for the `@` (root) record
4. Note what it's pointing to (probably the old Cloudflare Pages deployment)

### Step 2: Update DNS Record

1. Find the `@` (root) CNAME or A record
2. Click **Edit**
3. Change the **Target** to:
   ```
   professional-diver-app.pages.dev
   ```
4. Ensure **Proxy status** is **Proxied** (orange cloud) ✅
5. Set **TTL** to **Auto**
6. Click **Save**

### Step 3: Remove Old Deployment Domain

1. Go to Cloudflare Dashboard → **Pages**
2. Find the **old project** (the one with the sales page)
3. Go to **Custom domains**
4. Remove `professionaldiver.app` from that project
5. Confirm removal

### Step 4: Add Domain to New Project

1. Go to Cloudflare Dashboard → **Pages**
2. Click on the **professional-diver-app** project (new training app)
3. Go to **Custom domains**
4. Click **Set up a custom domain**
5. Enter: `professionaldiver.app`
6. Click **Continue**
7. Complete the DNS setup (it should verify quickly since DNS already points correctly)

### Step 5: Purge Cache

1. Go to Cloudflare Dashboard → Select zone `professionaldiver.app`
2. Go to **Caching** → **Configuration**
3. Click **Purge Everything**
4. Confirm

### Step 6: Wait and Verify

Wait 5-10 minutes for DNS propagation, then test:

```bash
curl -I https://professionaldiver.app
```

Should now show the new site or properly redirect.

## Alternative: Delete Old Deployment

If you want to completely remove the old sales page:

1. Go to Cloudflare Dashboard → **Pages**
2. Find the old project (the one serving the sales page)
3. Click **Settings** → **General**
4. Scroll down and click **Delete project**
5. Confirm deletion

⚠️ **Warning**: This permanently deletes the old site. Only do this if you don't need it anymore.

## Why Page Rules Aren't Working

Page Rules run on Cloudflare's edge, but if the DNS record points directly to a Cloudflare Pages deployment, the request goes directly to that deployment and bypasses the Page Rule logic. That's why we need to change the DNS record instead.

