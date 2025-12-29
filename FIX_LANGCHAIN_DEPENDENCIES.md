# Fix LangChain Dependencies for Railway

## The Problem

- `openai@5.15.0` (you have)
- `@browserbasehq/stagehand@1.14.0` (peer dependency) requires `openai@^4.62.1`
- Conflict!

## Solution: Use .npmrc with legacy-peer-deps

We already have `.npmrc` with `legacy-peer-deps=true`, which should fix this.

## Ensure Railway Uses .npmrc

The `.npmrc` file should be automatically used by npm/pnpm. But to be sure:

1. **Make sure `.npmrc` is in the root directory** ✅ (it is)
2. **Railway should automatically use it** when running `npm ci` or `pnpm install`

## Alternative: Update LangChain Packages

If `--legacy-peer-deps` still doesn't work, we can try updating to newer versions:

```bash
pnpm update @langchain/community @langchain/core @langchain/openai
```

But first, let's try with the current setup since `.npmrc` should handle it.

## Railway Build Command

Make sure Railway Build Command is:
```
npm ci --legacy-peer-deps
```

Or if using pnpm:
```
pnpm install --frozen-lockfile --legacy-peer-deps
```

The `.npmrc` file should make this work automatically, but explicitly adding the flag ensures it.

