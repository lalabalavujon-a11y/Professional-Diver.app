# Quick Fix: Get Railway URL for API Worker

## Option 1: Use Existing "professional-diver.app" Service (Recommended)

Even though it shows "Build failed", Railway should still have assigned it a public domain:

1. **Click on the "professional-diver.app" service box** (the one with GitHub icon and red border)
2. **Go to Settings → Networking**
3. **Look for "Public Domain"** - it should show a URL like:
   - `https://professional-diver-app-production.up.railway.app`
   - OR `https://[something].up.railway.app`
4. **Copy that URL** - this is what we need!

If you don't see a public domain:
- Click **"Generate Domain"** button
- Copy the generated URL

## Option 2: Delete "chic-joy" and Fix "professional-diver.app"

1. **Delete "chic-joy" service:**
   - Click on "chic-joy" service
   - Go to **Settings → Danger**
   - Click **"Delete Service"**

2. **Fix "professional-diver.app":**
   - Click on "professional-diver.app" service
   - Go to **Settings → Source**
   - Make sure it's connected to your GitHub repo
   - Go to **Settings → Variables**
   - Add `DATABASE_URL` (from Supabase)
   - Add `NODE_ENV=production`
   - Go to **Settings → Networking**
   - Click **"Generate Domain"** if needed
   - Copy the public domain URL

## Option 3: Use "chic-joy" (If You Want to Keep It)

1. **Configure "chic-joy" service:**
   - You're already in Settings
   - Click **"Connect Repo"** in Source section
   - Select your GitHub repository
   - Go to **Variables** tab
   - Add `DATABASE_URL` (from Supabase)
   - Add `NODE_ENV=production`
   - Go to **Networking** section
   - Click **"Generate Domain"**
   - Copy the public domain URL

## After You Get the URL

Once you have ANY Railway service URL (from either service), run:

```bash
wrangler secret put API_URL --config wrangler-api.toml --env production
```

Then paste your Railway URL when prompted.

## Recommended: Use "professional-diver.app"

Since "professional-diver.app" is already set up:
1. Click on it
2. Go to Settings → Networking
3. Get the public domain URL
4. Use that URL for API_URL

Even if the build failed, the domain should still work once we fix the deployment!

