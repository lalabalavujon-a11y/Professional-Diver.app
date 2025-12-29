# Final Railway Fix - Switch to Nixpacks

## The Problem

Railway's Railpack is running `npm ci` in the install step automatically, and we can't override it easily. Even with `railpack-plan.json`, Railway might be using a cached snapshot with `package-lock.json`.

## Solution: Use Nixpacks Instead

I've switched `railway.json` to use **Nixpacks** instead of Railpack. Nixpacks gives us full control via `nixpacks.toml`.

## What I Did

1. ✅ Created `railpack-plan.json` (may help if Railway respects it)
2. ✅ Switched `railway.json` to use Nixpacks builder
3. ✅ Updated `.gitignore` to ignore `package-lock.json`
4. ✅ Your `nixpacks.toml` already has: `pnpm install --frozen-lockfile --legacy-peer-deps`

## Next Steps

### Option 1: Use Nixpacks (Recommended)

1. **Push the code:**
   ```bash
   git push
   ```

2. **In Railway Dashboard:**
   - Go to Settings → Build
   - **Change Builder to "Nixpacks (Deprecated)"** (it's deprecated but still works)
   - Railway will use your `nixpacks.toml` which has `pnpm install --frozen-lockfile --legacy-peer-deps`

3. **Deploy**

### Option 2: Force Remove package-lock.json from Git History

If Railway is still seeing it from cache:

```bash
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch package-lock.json' --prune-empty --tag-name-filter cat -- --all
git push --force
```

⚠️ **Warning:** This rewrites git history. Only do this if you're sure.

## Recommended: Try Nixpacks First

1. Push code: `git push`
2. Railway Dashboard → Settings → Build → Select "Nixpacks (Deprecated)"
3. Deploy

Nixpacks will use your `nixpacks.toml` which should work! 🚀

