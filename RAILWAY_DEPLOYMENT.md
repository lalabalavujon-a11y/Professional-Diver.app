# Railway Deployment Guide

## Quick Start

1. **Sign up at [railway.app](https://railway.app)** using GitHub
2. **Create New Project** → "Deploy from GitHub repo"
3. **Select your repository**
4. **Railway will auto-detect Node.js** and start deploying

## Configuration

### Environment Variables

Set these in Railway Dashboard → Variables tab:

```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=<your-supabase-postgresql-connection-string>

# Optional but recommended:
OPENAI_API_KEY=<your-openai-key>
LANGSMITH_API_KEY=<your-langsmith-key>
GHL_API_KEY=<your-ghl-key>
```

### Database Connection

Use your existing Supabase PostgreSQL connection string:
- Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
- Get it from Supabase Dashboard → Project Settings → Database → Connection string

### Build Settings

Railway will automatically:
- Detect Node.js 22.x (from `package.json` engines)
- Run `pnpm install`
- Start with `node --import tsx/esm server/index.ts` (TypeScript runs directly, no build needed)

**Note**: The Express server uses `tsx` to run TypeScript directly. No compilation step required!

### Custom Domain (Optional)

1. Go to Railway Dashboard → Settings → Domains
2. Add custom domain: `api.professionaldiver.app`
3. Update DNS records as shown
4. Update Cloudflare Worker `API_URL` to use custom domain

## After Deployment

1. **Get your Railway URL**: `https://your-project.railway.app`
2. **Set API_URL in Cloudflare Workers**:
   ```bash
   wrangler secret put API_URL --env production
   # Enter: https://your-project.railway.app
   ```

## Troubleshooting

### Build Fails
- Check Railway logs for errors
- Ensure `package.json` has correct `engines.node` (>=22.12.0)
- Verify `pnpm-lock.yaml` is committed

### Server Won't Start
- Check `NODE_ENV=production` is set
- Verify `DATABASE_URL` is correct
- Check Railway logs for connection errors

### 502 Bad Gateway
- Server may be starting up (wait 30 seconds)
- Check Railway logs for runtime errors
- Verify PORT is set correctly (Railway auto-assigns, but 5000 is fallback)

