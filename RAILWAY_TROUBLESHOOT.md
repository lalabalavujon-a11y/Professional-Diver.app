# Railway Deployment Troubleshooting

## Common Issues & Fixes

### Issue 1: Railway Not Using pnpm
**Solution:** ✅ Already fixed - removed `package-lock.json`

### Issue 2: Railway Not Finding nixpacks.toml
**Check:**
1. Go to Railway Dashboard → Service → Settings → Source
2. Make sure "Root Directory" is `/` (not empty, not `/server`)
3. Railway should detect `nixpacks.toml` in the root

### Issue 3: Missing Dependencies
**Check Variables:**
1. Go to Railway Dashboard → Service → Variables
2. Ensure these are set:
   - `DATABASE_URL` (your Supabase connection string)
   - `NODE_ENV=production`
   - `PORT` (Railway auto-sets this, but you can set it to `5000`)

### Issue 4: Build Command Issues
**Check Build Settings:**
1. Go to Railway Dashboard → Service → Settings → Build
2. **Build Command:** Leave empty (nixpacks.toml handles it)
3. **Start Command:** `NODE_ENV=production node --import tsx/esm server/index.ts`

### Issue 5: Check Deployment Logs
**To see the actual error:**
1. Go to Railway Dashboard → Service → Deployments
2. Click on the failed deployment
3. Click "View logs"
4. Look for the specific error message

## Quick Fix: Try Manual Configuration

If nixpacks.toml isn't working:

1. **In Railway Dashboard → Service → Settings → Build:**
   - **Build Command:** `pnpm install --frozen-lockfile`
   - **Start Command:** `NODE_ENV=production node --import tsx/esm server/index.ts`

2. **Make sure Variables are set:**
   - `DATABASE_URL` = your Supabase connection string
   - `NODE_ENV` = `production`

## What Error Are You Seeing?

Please check the Railway deployment logs and share:
- What step fails? (Build, Install, Start?)
- What's the exact error message?

This will help us fix it faster!

