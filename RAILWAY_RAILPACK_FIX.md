# Fix Railway Railpack Install Step

## The Problem

Railway's Railpack is running `npm ci` in the **install step** (before build), which fails due to dependency conflicts.

The logs show:
```
Steps     
──────────
▸ install
  $ npm ci          ← FAILS HERE!
     
▸ build
  $ npm ci --legacy-peer-deps  ← Never reaches this
```

## Solution: Override Install Command

I've updated `railway.json` to use RAILPACK with a custom buildCommand. But Railway might still use the install step.

## Option 1: Set Build Command in Railway Dashboard

**In Railway Dashboard → Settings → Build:**

**Build Command:**
```
npm install --legacy-peer-deps
```

This should override both install and build steps.

## Option 2: Ensure package-lock.json is Deleted on GitHub

The logs show Railway is still detecting `package-lock.json`. Make sure it's deleted and pushed:

```bash
git rm package-lock.json
git commit -m "Remove package-lock.json"
git push
```

## Option 3: Use .railwayignore

Create `.railwayignore` file:
```
package-lock.json
```

## Recommended: Do All Three

1. **Push the updated railway.json** (already committed)
2. **Set Build Command in Railway:** `npm install --legacy-peer-deps`
3. **Verify package-lock.json is deleted** on GitHub

Then deploy again!
