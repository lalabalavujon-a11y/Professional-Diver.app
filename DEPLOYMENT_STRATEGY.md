# Deployment Strategy & API Worker Limitations

## Current Architecture

The application consists of two main components:

1. **Express.js API Server** (`server/index.ts`) - Full-featured backend with database access
2. **Cloudflare Workers** - Frontend static asset serving and API proxy

## API Worker Limitations

### Current State

The `worker-api/index.ts` file is a **minimal placeholder** that only implements:
- Health check endpoint
- Basic CORS handling
- Authentication endpoint (returns 501 - should proxy to Express server)

### Why API Worker is Limited

Cloudflare Workers have several limitations that prevent direct Express.js deployment:
1. **No Node.js runtime** - Workers use V8 isolates, not full Node.js
2. **Limited imports** - Many Node.js modules don't work in Workers
3. **Cold start constraints** - Different execution model than Express
4. **Database access** - Direct database connections are limited

## Recommended Deployment Strategy

### Option A: Separate Express API Server (Recommended)

**Architecture:**
```
User → Cloudflare Worker (Static Assets) 
    → Cloudflare Worker (API Proxy) 
    → Express API Server (Separate Hosting)
```

**Deployment Steps:**

1. **Deploy Express API Server** to a Node.js hosting service:
   - **Railway** (recommended) - Easy PostgreSQL + Node.js
   - **Render** - Free tier available
   - **Fly.io** - Global edge deployment
   - **AWS EC2/Lightsail** - Traditional hosting
   - **DigitalOcean App Platform** - Simple deployment

2. **Set Express API URL** in Cloudflare Worker:
   ```bash
   wrangler secret put API_URL --env production
   # Value: https://your-api-server.railway.app
   ```

3. **Update worker-api/index.ts** to proxy all requests:
   ```typescript
   // In worker-api/index.ts
   if (env.API_URL) {
     const apiUrl = `${env.API_URL}${url.pathname}${url.search}`;
     const apiRequest = new Request(apiUrl, {
       method: request.method,
       headers: request.headers,
       body: request.body,
     });
     return await fetch(apiRequest);
   }
   ```

4. **Configure CORS** on Express server to allow Cloudflare Worker:
   ```typescript
   app.use(cors({
     origin: ['https://professionaldiver.app', 'https://www.professionaldiver.app']
   }));
   ```

### Option B: Convert to Workers-Compatible (Advanced)

Convert all Express routes to Hono (Workers-compatible framework):
- **Pros:** Single deployment, edge-optimized
- **Cons:** Major refactoring required, database access complexity

**Not Recommended** for current codebase due to:
- Extensive Express.js usage
- Database ORM dependencies
- Complex middleware chains

### Option C: Cloudflare Pages + Functions (Future Consideration)

Use Cloudflare Pages Functions for API routes:
- Convert critical endpoints to Cloudflare Functions
- Keep complex logic in separate Express server

## Current Production Setup

### What Works Now:
✅ Static asset serving via Cloudflare Workers  
✅ Frontend application loads correctly  
✅ Health check endpoints  

### What Needs Configuration:
⚠️ API endpoints must be proxied to Express server  
⚠️ Database must be provisioned (PostgreSQL)  
⚠️ Environment variables must be set as Cloudflare Workers secrets  

## Environment Variables Setup

### For Express API Server:
Set these in your hosting platform (Railway, Render, etc.):

```bash
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
LANGSMITH_API_KEY=...
SESSION_SECRET=...
# ... all other variables from .env.example
```

### For Cloudflare Workers:
Set via `wrangler secret put`:

```bash
# Required
wrangler secret put DATABASE_URL --env production
wrangler secret put OPENAI_API_KEY --env production

# Optional - if using direct API URL
wrangler secret put API_URL --env production
# Value: https://your-express-api.railway.app
```

## Deployment Checklist

### Pre-Deployment:
- [ ] Database provisioned (Neon, Supabase, Railway PostgreSQL)
- [ ] Express API server deployed and accessible
- [ ] All environment variables set on Express server
- [ ] Database migrations run
- [ ] User migration script run (if needed)
- [ ] Webhook endpoints tested

### Cloudflare Workers Deployment:
- [ ] Frontend built (`pnpm run build`)
- [ ] Worker deployed (`pnpm run deploy:prod`)
- [ ] API_URL secret set if using separate Express server
- [ ] Routes configured in wrangler.toml
- [ ] DNS configured (professionaldiver.app)

### Post-Deployment:
- [ ] Health check endpoints working
- [ ] API endpoints responding correctly
- [ ] Authentication working
- [ ] Database connections verified
- [ ] Error logging configured
- [ ] Monitoring set up

## Migration from Hardcoded Auth

Before deploying, run the user migration script:

```bash
# Set DATABASE_URL to production database
export DATABASE_URL=postgresql://...

# Run migration
tsx scripts/migrate-users-to-database-auth.ts
```

This will:
- Create database entries for all admin/partner admin users
- Hash passwords securely
- Preserve user roles and permissions

**Important:** Users should change their passwords after migration!

## Troubleshooting

### API Returns 501 "Not Implemented"
- **Cause:** API Worker doesn't have Express server configured
- **Fix:** Set `API_URL` secret or deploy Express server separately

### Database Connection Errors
- **Cause:** DATABASE_URL not set or incorrect
- **Fix:** Verify DATABASE_URL in production environment

### CORS Errors
- **Cause:** Express server not allowing Cloudflare Worker origin
- **Fix:** Configure CORS on Express server to allow professionaldiver.app

## Next Steps

1. **Choose deployment option** (Option A recommended)
2. **Deploy Express API server** to Railway/Render
3. **Configure Cloudflare Worker** to proxy to Express API
4. **Run user migration script** to move users to database
5. **Test all endpoints** in production environment
6. **Monitor logs** for errors

---

**Last Updated:** January 2025  
**Status:** Ready for deployment after Express server is hosted separately




