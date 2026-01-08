# Final Fix: Point professionaldiver.app to New Site

The Page Rule isn't working. Let's fix this by changing the DNS record directly.

## Step 1: Delete the Page Rule (It's Not Working)

1. Go to Cloudflare Dashboard → Select zone `professionaldiver.app`
2. Go to **Rules** → **Page Rules**
3. Find the Page Rule for `professionaldiver.app/*`
4. Click the **Delete** (X) icon
5. Confirm deletion

## Step 2: Check Current DNS Record

1. Go to **DNS** → **Records**
2. Find the `@` (root) record
3. Note what it's currently pointing to

## Step 3: Update DNS Record to New Deployment

1. Click **Edit** on the `@` record
2. Change:
   - **Type:** CNAME (if not already)
   - **Name:** @
   - **Target:** `professional-diver-app.pages.dev`
   - **Proxy status:** ✅ Proxied (orange cloud)
   - **TTL:** Auto
3. Click **Save**

## Step 4: Remove Domain from Old Project

1. Go to Cloudflare Dashboard → **Pages**
2. Find the **old project** (the one with the sales page)
3. Click on it
4. Go to **Custom domains**
5. Find `professionaldiver.app` in the list
6. Click **Remove** or the trash icon
7. Confirm removal

## Step 5: Add Domain to New Project

1. Go to Cloudflare Dashboard → **Pages**
2. Click on **professional-diver-app** (the new training app project)
3. Go to **Custom domains**
4. Click **Set up a custom domain**
5. Enter: `professionaldiver.app`
6. Click **Continue**
7. It should verify quickly since DNS already points correctly

## Step 6: Purge Cache Again

1. Go to Cloudflare Dashboard → Select zone `professionaldiver.app`
2. Go to **Caching** → **Configuration**
3. Click **Purge Everything**
4. Confirm

## Step 7: Wait and Test

Wait 5-10 minutes for DNS propagation, then:

```bash
curl -I https://professionaldiver.app
```

Or visit in browser: `https://professionaldiver.app`

It should now show the new training app, not the old sales page.

## Why This Works

- DNS points directly to the new Cloudflare Pages deployment
- No redirect needed - domain serves the new site directly
- Old deployment no longer has the domain, so it can't serve the old site
- Clean, simple solution

## If It Still Shows Old Site

1. Check browser cache (try incognito/private mode)
2. Wait longer for DNS propagation (can take up to 24 hours globally)
3. Verify DNS record is saved correctly in Cloudflare
4. Check that the domain was removed from the old project

