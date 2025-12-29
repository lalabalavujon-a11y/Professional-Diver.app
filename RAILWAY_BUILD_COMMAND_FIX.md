# Railway Build Command - Final Fix

## The Problem

Railway is still running `npm ci` without `--legacy-peer-deps`, which means the Build Command isn't being used.

## Solution: Use `npm install` Instead

`npm ci` is stricter and might ignore the flag. Use `npm install` instead:

**Build Command:**
```
npm install --legacy-peer-deps
```

**Start Command:**
```
NODE_ENV=production node --import tsx/esm server/index.ts
```

## Alternative: Use --force

If `--legacy-peer-deps` still doesn't work:

**Build Command:**
```
npm install --force
```

## Why This Works

- `npm install` is more permissive than `npm ci`
- `--legacy-peer-deps` or `--force` will ignore peer dependency conflicts
- Allows `openai@5.15.0` to work with `@langchain/community`

## Steps in Railway

1. **Settings → Build**
2. **Build Command:** `npm install --legacy-peer-deps`
3. **Start Command:** `NODE_ENV=production node --import tsx/esm server/index.ts`
4. **Deploy**

## If Still Failing: Remove Conflicting Peer Dependency

If it still fails, we can try removing the problematic peer dependency by updating `@langchain/community` to a version that doesn't require `@browserbasehq/stagehand`, or by installing it explicitly.

But try `npm install --legacy-peer-deps` first - it should work!

