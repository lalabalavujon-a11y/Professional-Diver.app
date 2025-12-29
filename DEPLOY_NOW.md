# Deploy to Railway Now! 🚀

## Code Pushed to GitHub ✅

Your code is now on GitHub with:
- `.npmrc` with `legacy-peer-deps=true`
- Updated `nixpacks.toml`
- Removed `package-lock.json`
- Updated LangChain packages

## Railway Deployment Steps

### Step 1: Configure Build Command

1. **Go to Railway Dashboard** → "professional-diver.app" service
2. **Settings → Build**
3. **Set Build Command:**
   ```
   npm ci --legacy-peer-deps
   ```
4. **Set Start Command:**
   ```
   NODE_ENV=production node --import tsx/esm server/index.ts
   ```

### Step 2: Verify Variables

1. **Settings → Variables**
2. Make sure you have:
   - `DATABASE_URL` = Your Supabase connection string
   - `NODE_ENV` = `production`

### Step 3: Deploy

1. Click **"Deploy"** button
2. Or Railway should auto-deploy from the GitHub push

### Step 4: Monitor Deployment

1. Go to **"Deployments"** tab
2. Watch the build logs
3. Should see: `npm ci --legacy-peer-deps` running successfully

## Expected Result

✅ Build succeeds with `--legacy-peer-deps`  
✅ Service starts on Railway  
✅ API_URL already set in Cloudflare: `https://professional-diverapp-production.up.railway.app`  
✅ Lesson errors fixed! 🎉

## Once Deployed

Test your Railway service:
```bash
curl https://professional-diverapp-production.up.railway.app/api/health
```

Should return: `{"status":"ok"}`

Then test your site - lessons should work! 🚀

