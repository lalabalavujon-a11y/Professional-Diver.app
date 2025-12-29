# 🚀 Quick Deploy Guide

## Step 1: Push Code (You Need to Do This)

```bash
git push --set-upstream origin master
```

## Step 2: Configure Railway (Critical!)

**Railway Dashboard → "professional-diver.app" → Settings → Build**

**Build Command:**
```
npm install --legacy-peer-deps
```

**Start Command:**
```
NODE_ENV=production node --import tsx/esm server/index.ts
```

**Click Save/Deploy**

## Step 3: Done! ✅

Railway will deploy. Once it's running:
- ✅ API_URL already set in Cloudflare
- ✅ Lessons will work!
- ✅ Test: `curl https://professional-diverapp-production.up.railway.app/api/health`

## Why `npm install` instead of `npm ci`?

- `npm ci` is too strict and ignores flags
- `npm install --legacy-peer-deps` will resolve the dependency conflict
- Allows `openai@5.15.0` to work with `@langchain/community`
