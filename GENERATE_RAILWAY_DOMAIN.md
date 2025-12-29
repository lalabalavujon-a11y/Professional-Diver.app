# Generate Railway Domain - Quick Steps

## Step 1: Generate Domain
1. You're already in the right place! ✅
2. In the **"Public Networking"** section, click the **"Generate Domain"** button (with lightning bolt icon)
3. Railway will create a public domain like:
   - `https://professional-diver-app-production.up.railway.app`
   - OR `https://[random-id].up.railway.app`

## Step 2: Copy the Domain
1. Once generated, the domain will appear in the "Public Networking" section
2. **Copy the full URL** (including `https://`)

## Step 3: Set API_URL in Cloudflare
Run this command and paste your Railway URL:

```bash
wrangler secret put API_URL --config wrangler-api.toml --env production
```

When prompted, paste your Railway domain URL.

## That's It! ✅

Once you set the API_URL, the lesson errors will be fixed because:
- Frontend → Main Worker → API Worker → Railway → Supabase ✅

The domain will work even if the service shows "Build failed" - we can fix the deployment later, but the domain/URL is what we need right now!

