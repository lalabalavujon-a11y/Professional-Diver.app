# Railway Builder Choice

## Option 1: Use Nixpacks (Recommended First Try)

Since you have `nixpacks.toml` configured:

1. **In the Builder dropdown, select "Nixpacks (Deprecated)"**
2. Railway will read your `nixpacks.toml` file
3. It should use `pnpm` as configured

**Why try this first:** Your `nixpacks.toml` is already set up with pnpm and legacy-peer-deps.

## Option 2: Use Railpack (If Nixpacks Doesn't Work)

If Nixpacks fails, use Railpack but configure it manually:

1. **Select "Railpack (Default)"**
2. **Go to Settings → Build**
3. **Set Build Command manually:**
   ```
   pnpm install --frozen-lockfile --legacy-peer-deps
   ```
4. **Set Start Command:**
   ```
   NODE_ENV=production node --import tsx/esm server/index.ts
   ```

## Recommendation

**Try Nixpacks first** - it should work with your existing `nixpacks.toml` configuration.

If Nixpacks fails, switch to Railpack and set the build commands manually.

