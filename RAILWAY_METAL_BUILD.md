# Railway Metal Build Environment

## What is Metal Build Environment?

Metal is Railway's new, faster build environment that will become the default for all builds. It's designed to be:
- ⚡ Faster builds
- 🔧 More reliable
- 🚀 Better performance

## Should You Enable It?

### ✅ Yes, Try It!

Since you're having build issues, the Metal environment might:
1. **Better detect pnpm** from `pnpm-lock.yaml`
2. **Handle dependencies better**
3. **Provide faster builds**

## How to Enable

1. In Railway Dashboard → Service → Settings → Build
2. Find "Metal Build Environment" section
3. **Toggle it ON** (purple/active state)
4. Set your Build Command: `pnpm install --frozen-lockfile --legacy-peer-deps`
5. Set Start Command: `NODE_ENV=production node --import tsx/esm server/index.ts`
6. Deploy

## Recommendation

**Enable Metal Build Environment** - it's the future of Railway builds and might solve your pnpm detection issue.

The Metal environment should:
- Better recognize `pnpm-lock.yaml`
- Use pnpm instead of npm
- Handle the `--legacy-peer-deps` flag properly

## If Metal Doesn't Work

If Metal still uses npm, you can:
1. Keep Metal enabled (it's faster)
2. Use npm with legacy-peer-deps: `npm ci --legacy-peer-deps`

But try Metal with pnpm first - it should work better!

