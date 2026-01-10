# How to Find the Old Cloudflare Pages Project

## Step 3: Locate the Old Project

The old project is the one that's currently serving the sales page at `professionaldiver.app`.

### Method 1: Check All Pages Projects

1. Go to Cloudflare Dashboard
2. Click **Pages** in the left sidebar (or go to https://dash.cloudflare.com/pages)
3. You'll see a list of all your Cloudflare Pages projects
4. Look for projects that might be the old one:
   - Check project names (might be something like "professional-diver", "sales-page", "landing-page", etc.)
   - Look at the **Domains** column - the old project should have `professionaldiver.app` listed
   - Check the **Last deployment** date - the old one might have an older date

### Method 2: Check Custom Domains

1. Go to Cloudflare Dashboard → **Pages**
2. Click on each project one by one
3. Go to **Custom domains** tab
4. Look for `professionaldiver.app` in the custom domains list
5. **That's the old project!**

### Method 3: Check by Deployment URL

1. Go to Cloudflare Dashboard → **Pages**
2. Each project has a `.pages.dev` URL
3. The old project might have a different `.pages.dev` URL than `professional-diver-app.pages.dev`
4. Check each project's settings to see which one has `professionaldiver.app` as a custom domain

### What to Look For

The old project will have:
- ✅ `professionaldiver.app` listed in **Custom domains**
- ❌ Different `.pages.dev` URL than `professional-diver-app.pages.dev`
- 📅 Possibly older last deployment date

### Once You Find It

1. Click on the old project
2. Go to **Custom domains** tab
3. Find `professionaldiver.app` in the list
4. Click **Remove** or the trash icon next to it
5. Confirm removal

### If You Can't Find It

If you can't find the old project:
- It might have been deleted already
- The domain might be managed elsewhere
- Skip to Step 4 (Add domain to new project) - Cloudflare will handle the conflict if the domain is still attached elsewhere

## Step 4: Add Domain to New Project

1. Go to Cloudflare Dashboard → **Pages**
2. Click on **professional-diver-app** (the new training app)
3. Go to **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter: `professionaldiver.app`
6. Click **Continue**

If the domain is still attached to another project, Cloudflare will show an error and tell you which project has it. Then you can go back and remove it from that project.





