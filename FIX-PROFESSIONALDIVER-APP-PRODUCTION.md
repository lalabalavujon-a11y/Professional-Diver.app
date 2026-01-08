# Fix professionaldiver-app-production Project

This project has a route for `professionaldiver.app/*` but it's serving the old sales page. Here's how to fix it:

## Option 1: Remove the Route (Recommended)

1. In the `professionaldiver-app-production` project dashboard
2. Look for **Routes** section (visible in the right sidebar)
3. Find the route: `professionaldiver.app/*`
4. Click the **Edit** or **Delete** icon next to it
5. Remove or disable the route

## Option 2: Check if This is a Workers Project

If this is a Cloudflare Workers project (not Pages), you need to:

1. Go to **Settings** tab
2. Check the **Routes** section
3. Remove the route: `professionaldiver.app/*`
4. Or update the Worker code to redirect to the new site

## Option 3: Delete the Project (If Not Needed)

If this project is only serving the old sales page and you don't need it:

1. Go to **Settings** tab
2. Scroll down to **Delete project**
3. Click **Delete project**
4. Confirm deletion

⚠️ **Warning**: Only delete if you're sure this project isn't needed for anything else.

## Option 4: Update the Route to Redirect

If you want to keep the project but redirect to the new site:

1. Go to **Settings** → **Routes**
2. Edit the route: `professionaldiver.app/*`
3. Update the Worker code to redirect to `https://professional-diver-app.pages.dev`

## Recommended Steps:

1. **First, check what this project does:**
   - Go to **Deployments** tab
   - Check recent deployments
   - See what code it's running

2. **If it's the old sales page:**
   - Remove the route `professionaldiver.app/*` from this project
   - Or delete the project entirely

3. **Then add domain to new project:**
   - Go to Cloudflare Dashboard → **Pages**
   - Click on **professional-diver-app** (the new training app)
   - Go to **Custom domains**
   - Add `professionaldiver.app`

## Quick Check:

To see if this is serving the old sales page:
- Visit the project's `.pages.dev` URL
- If it shows the sales page, this is the old project
- If it shows the training app, this might be a different deployment

