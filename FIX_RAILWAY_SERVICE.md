# Fix Railway Service or Get URL

## Option 1: Get URL from Existing Service (Even if Failed)

Even if the service failed to deploy, Railway should still assign it a public domain:

1. **Click on the "professional-diver.app" service box** in the Architecture view
2. **Go to Settings → Networking**
3. **Look for "Public Domain"** - copy this URL
4. This URL should work even if the service isn't running (we can fix deployment later)

## Option 2: Fix the Deployment

The service shows "4 Changes" and deployment failures. Let's fix it:

### Step 1: Click on the Service
1. Click the "professional-diver.app" service box
2. Go to **Settings** tab
3. Check **"Root Directory"** - should be `/` or empty
4. Check **"Start Command"** - should be `npm start`

### Step 2: Check Variables
1. Go to **Variables** tab
2. Make sure you have:
   - `DATABASE_URL` (from Supabase)
   - `NODE_ENV=production`
   - `PORT` (Railway auto-sets this, but you can set it to `5000`)

### Step 3: Check Build Settings
1. Go to **Settings → Build**
2. **Build Command:** `npm run build` (if needed)
3. **Start Command:** `npm start`

### Step 4: Redeploy
1. Click **"Deploy"** button or **"Redeploy"**
2. Check the **Logs** tab for errors

## Option 3: Create New Service (If Needed)

If the existing service is too broken:

1. In Architecture view, click **"+"** button
2. Select **"GitHub Repo"**
3. Select your repository
4. Railway will auto-detect and create the service
5. Go to **Settings → Networking → Generate Domain**
6. Copy the public domain URL

## Quick Fix: Use Railway CLI

If you have Railway CLI installed:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# Get service URL
railway domain
```

## After You Get the URL

Once you have the Railway service URL, set it in Cloudflare:

```bash
wrangler secret put API_URL --config wrangler-api.toml --env production
```

Then paste your Railway URL when prompted.

