# Fix Railway with Railpack - Manual Configuration

Since Nixpacks is still using npm, let's use Railpack and configure it manually:

## Step 1: Select Railpack Builder

1. In Railway Dashboard → Service → Settings → Build
2. **Select "Railpack (Default)"** from the Builder dropdown

## Step 2: Configure Build Commands

In the same Build settings section, you should see fields for:

**Build Command:**
```
pnpm install --frozen-lockfile --legacy-peer-deps
```

**Start Command:**
```
NODE_ENV=production node --import tsx/esm server/index.ts
```

## Step 3: Ensure pnpm is Available

Railpack should auto-detect pnpm from `pnpm-lock.yaml`, but if it doesn't, you might need to add a setup step.

## Alternative: Use npm with legacy-peer-deps

If pnpm still doesn't work, you can use npm with the legacy flag:

**Build Command:**
```
npm ci --legacy-peer-deps
```

**Start Command:**
```
NODE_ENV=production node --import tsx/esm server/index.ts
```

## Recommended: Try pnpm First

1. Set Builder to "Railpack (Default)"
2. Set Build Command: `pnpm install --frozen-lockfile --legacy-peer-deps`
3. Set Start Command: `NODE_ENV=production node --import tsx/esm server/index.ts`
4. Deploy

If that fails, fall back to npm with `--legacy-peer-deps`.

