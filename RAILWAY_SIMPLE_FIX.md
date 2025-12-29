# Simple Railway Fix - Manual Configuration

Since nixpacks.toml might not be working, let's configure Railway manually:

## Step 1: Check Railway Service Settings

1. **Go to Railway Dashboard** → Click "professional-diver.app" service
2. **Go to Settings → Source**
   - **Root Directory:** `/` (should be empty or `/`)
   - Make sure it's connected to your GitHub repo

## Step 2: Set Build & Start Commands Manually

1. **Go to Settings → Build**
   - **Build Command:** `pnpm install --frozen-lockfile`
   - **Start Command:** `NODE_ENV=production node --import tsx/esm server/index.ts`

## Step 3: Verify Variables

1. **Go to Settings → Variables**
   - Make sure you have:
     - `DATABASE_URL` = Your Supabase connection string
     - `NODE_ENV` = `production`
     - `PORT` = (Railway auto-sets this, but you can set `5000`)

## Step 4: Check What Error You're Getting

1. **Go to Deployments tab**
2. **Click on the failed deployment**
3. **Click "View logs"**
4. **Look for the error** - what does it say?

Common errors:
- ❌ "npm ci failed" → Already fixed (removed package-lock.json)
- ❌ "Cannot find module 'tsx'" → Need to ensure pnpm installs dependencies
- ❌ "Port already in use" → Railway handles this automatically
- ❌ "DATABASE_URL not set" → Need to add it in Variables

## Quick Test: Try This Start Command

If the above doesn't work, try this simpler start command:

```
pnpm start
```

But first, we need to add a `start` script that works. Your current `start` script expects a built `dist/server/index.js`, but we're running TypeScript directly.

## Alternative: Use pnpm start with tsx

Actually, your `package.json` has:
- `"start": "cross-env NODE_ENV=production node dist/server/index.js"`

But we're not building, so we need to either:
1. Build first, OR
2. Use the tsx command directly

**Try this in Railway Settings → Build:**
- **Build Command:** `pnpm install --frozen-lockfile`
- **Start Command:** `NODE_ENV=production pnpm exec tsx server/index.ts`

## What's the Actual Error?

Please share:
1. What step fails? (Install, Build, or Start?)
2. What's the exact error message from the logs?

This will help me give you the exact fix!

