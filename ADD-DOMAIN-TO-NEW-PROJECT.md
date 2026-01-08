# Add professionaldiver.app to New Project

Now that the routes are deleted from the old project, let's add the domain to the new training app project.

## Step 1: Go to New Project

1. Go to Cloudflare Dashboard → **Pages**
2. Click on **professional-diver-app** (the new training app project)
   - This is different from `professionaldiver-app-production` (the one you just deleted routes from)

## Step 2: Add Custom Domain

1. In the `professional-diver-app` project dashboard
2. Go to **Custom domains** tab (or look in the right sidebar under "Domains & Routes")
3. Click **Set up a custom domain** or **Add custom domain**
4. Enter: `professionaldiver.app`
5. Click **Continue** or **Add**

## Step 3: Complete DNS Setup

Cloudflare should automatically:
- Verify the DNS record (since you already changed it to point to `professional-diver-app.pages.dev`)
- Provision SSL certificate
- Activate the domain

This should happen quickly (1-5 minutes) since the DNS is already pointing correctly.

## Step 4: Verify

Once the domain shows as "Active" (not "Verifying"):

1. Wait 2-3 minutes for propagation
2. Test in browser: `https://professionaldiver.app`
3. Should now show the new training app!

## If It's Still "Verifying"

If the domain stays in "Verifying" status:

1. Click on the domain in the Custom domains list
2. Click **Check DNS records** or **Complete DNS setup**
3. Follow any instructions shown
4. The DNS should already be correct since you changed it earlier

## Expected Result

After adding the domain:
- ✅ `professionaldiver.app` should show the new training app
- ✅ No more old sales page
- ✅ Domain status should be "Active" (green checkmark)

