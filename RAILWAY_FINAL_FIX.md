# Final Railway Fix - Keep LangChain & LangSmith

## The Issue

You need LangChain and LangSmith, but there's a peer dependency conflict:
- `openai@5.15.0` (your version)
- `@browserbasehq/stagehand` requires `openai@^4.62.1`

## Solution: Explicitly Use --legacy-peer-deps

Even though `.npmrc` has `legacy-peer-deps=true`, Railway might not be reading it. Set it explicitly in the build command.

## Railway Settings → Build

**Build Command:**
```
npm ci --legacy-peer-deps
```

**Start Command:**
```
NODE_ENV=production node --import tsx/esm server/index.ts
```

## Why This Works

- `npm ci --legacy-peer-deps` will:
  1. Install all dependencies
  2. Ignore peer dependency conflicts
  3. Allow `openai@5.15.0` to work with `@langchain/community`

## After Setting This

1. **Set the Build Command** in Railway: `npm ci --legacy-peer-deps`
2. **Deploy**
3. It should work! ✅

The `--legacy-peer-deps` flag tells npm to use the old (more permissive) peer dependency resolution, which will allow the version mismatch.

## If Still Failing

If it still fails, check the Build Logs to see the exact error. But `npm ci --legacy-peer-deps` should resolve the openai conflict.

