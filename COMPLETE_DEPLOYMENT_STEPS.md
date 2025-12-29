# Complete Deployment Steps 🚀

## ✅ Code Ready to Push

All changes are committed and ready:
- ✅ `.npmrc` with `legacy-peer-deps=true`
- ✅ Updated `nixpacks.toml`
- ✅ Removed `package-lock.json`
- ✅ Updated LangChain packages

## Step 1: Push to GitHub

Run this command (will prompt for GitHub credentials):

```bash
git push --set-upstream origin master
```

Or use GitHub Desktop/your git client.

## Step 2: Configure Railway Build Command

**CRITICAL:** Railway is still using default `npm ci`. You MUST set the Build Command manually.

### In Railway Dashboard:

1. **Go to:** Railway Dashboard → "professional-diver.app" service
2. **Click:** Settings → Build
3. **Set Build Command:**
   ```
   npm install --legacy-peer-deps
   ```
4. **Set Start Command:**
   ```
   NODE_ENV=production node --import tsx/esm server/index.ts
   ```
5. **Click Save/Apply**

## Step 3: Verify Variables

1. **Settings → Variables**
2. Ensure you have:
   - `DATABASE_URL` = Your Supabase connection string
   - `NODE_ENV` = `production`

## Step 4: Deploy

1. **Click "Deploy"** button
2. **OR** Railway will auto-deploy after you push to GitHub

## Step 5: Monitor Deployment

1. Go to **"Deployments"** tab
2. Watch the build logs
3. Should see: `npm install --legacy-peer-deps` running
4. Should succeed! ✅

## Expected Result

✅ Build succeeds with `npm install --legacy-peer-deps`  
✅ Service starts on Railway  
✅ API_URL already set: `https://professional-diverapp-production.up.railway.app`  
✅ Lesson errors fixed! 🎉

## Test After Deployment

```bash
curl https://professional-diverapp-production.up.railway.app/api/health
```

Should return: `{"status":"ok"}`

Then test your site - lessons should work! 🚀

## Summary

1. **Push:** `git push --set-upstream origin master`
2. **Railway Build Command:** `npm install --legacy-peer-deps`
3. **Railway Start Command:** `NODE_ENV=production node --import tsx/esm server/index.ts`
4. **Deploy**
5. **Test**

Good luck! 🎯

