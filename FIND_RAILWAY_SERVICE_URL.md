# How to Find Your Railway Service URL

## Current Location
You're currently in **Project Settings** for "Professional Diver App". 

## Steps to Find Service URL

### Option 1: Via Architecture View (Easiest)

1. **Click "Architecture"** in the top navigation bar (next to "Settings")
2. You'll see your services listed (e.g., "Express API", "Database", etc.)
3. **Click on your Express API service** (the one running your server)
4. **Click "Settings"** tab in that service
5. **Click "Networking"** in the left sidebar
6. **Find "Public Domain"** - this is your Railway URL!
7. Copy the URL (e.g., `https://professional-diver-app-production.up.railway.app`)

### Option 2: Via Service Directly

1. **Go back to your project** (click "Professional Diver App" in breadcrumb)
2. **Click on your service** (the Express API service card)
3. **Settings → Networking → Public Domain**

## What the URL Looks Like

Your Railway service URL will be something like:
- `https://professional-diver-app-production.up.railway.app`
- `https://your-service-name.up.railway.app`
- `https://[random-id].up.railway.app`

## After You Find It

Once you have the URL, run:

```bash
wrangler secret put API_URL --config wrangler-api.toml --env production
```

Then paste your Railway URL when prompted.

## Quick Test

Test your Railway URL works:

```bash
# Replace with your actual URL
curl https://your-railway-url.up.railway.app/api/health
```

Should return: `{"status":"ok"}` or similar JSON.

