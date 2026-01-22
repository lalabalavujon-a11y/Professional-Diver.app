# Troubleshooting Guide: professionaldiver.app Not Opening

## Quick Diagnostic

Run the diagnostic script to check all services:

```bash
npm run diagnose:deployment
```

This will check:
- ✅ DNS resolution
- ✅ Railway backend availability
- ✅ Cloudflare Pages frontend
- ✅ Health endpoints
- ✅ API subdomain

## Common Issues & Solutions

### 1. Railway Backend Not Responding

**Symptoms:**
- Frontend loads but API calls fail
- 502/503 errors
- Connection timeouts

**Solutions:**

1. **Check Railway Dashboard:**
   - Go to https://railway.app
   - Verify your service is deployed and running
   - Check deployment logs for errors

2. **Verify Environment Variables:**
   - Ensure `NODE_ENV=production` is set
   - Verify `PORT` is set (Railway auto-assigns, but check)
   - Confirm `DATABASE_URL` is correct
   - Check all required API keys are present

3. **Check Deployment Logs:**
   ```bash
   # In Railway dashboard, check:
   # - Build logs for compilation errors
   # - Runtime logs for startup errors
   # - Check for "FATAL BOOT ERROR" messages
   ```

4. **Restart Service:**
   - In Railway dashboard, click "Restart"
   - Or trigger a new deployment

5. **Verify Build Command:**
   - Railway should use: `npm run build` (from railway.json)
   - Verify build completes successfully

6. **Check Start Command:**
   - Should be: `npm run start`
   - This runs: `cross-env NODE_ENV=production HOST=0.0.0.0 tsx server/index.ts`

### 2. Cloudflare Pages Frontend Not Deployed

**Symptoms:**
- Domain shows "404" or "Not Found"
- Blank page
- Build errors

**Solutions:**

1. **Check Cloudflare Pages Dashboard:**
   - Go to https://dash.cloudflare.com
   - Navigate to Pages → Your Project
   - Verify latest deployment status

2. **Check Build Configuration:**
   - Build command: `npm run build`
   - Build output directory: `dist/client`
   - Root directory: `/` (project root)

3. **Verify Environment Variables:**
   - **CRITICAL**: Set `VITE_API_URL` in Cloudflare Pages
   - Value: `https://professional-diverapp-production.up.railway.app`
   - Set for both Production and Preview environments
   - Without this, the frontend won't know where the API is!

4. **Trigger New Deployment:**
   - In Cloudflare Pages, click "Retry deployment" or "Create deployment"
   - Or push a new commit to trigger auto-deploy

5. **Check Build Logs:**
   - Look for TypeScript errors
   - Check for missing dependencies
   - Verify Vite build completes

6. **Verify DNS Configuration:**
   - Domain should point to Cloudflare Pages
   - Check DNS records in Cloudflare dashboard
   - Ensure SSL/TLS is enabled

### 3. DNS Not Configured

**Symptoms:**
- Domain doesn't resolve
- "This site can't be reached"
- DNS_PROBE_FINISHED_NXDOMAIN

**Solutions:**

1. **Check Cloudflare DNS:**
   - Go to Cloudflare dashboard → DNS → Records
   - Verify `professionaldiver.app` has an A or CNAME record
   - Should point to Cloudflare Pages deployment

2. **Verify Nameservers:**
   - Domain registrar should use Cloudflare nameservers
   - Check nameserver configuration at your registrar
   - Wait up to 48 hours for propagation

3. **Check SSL/TLS:**
   - Go to SSL/TLS → Overview
   - Set to "Full (strict)" for production
   - Enable "Always Use HTTPS"

4. **Test DNS Resolution:**
   ```bash
   # Check DNS
   nslookup professionaldiver.app
   dig professionaldiver.app
   
   # Check SSL certificate
   openssl s_client -connect professionaldiver.app:443 -servername professionaldiver.app
   ```

### 4. Environment Variables Missing

**Critical Environment Variables:**

**Railway (Backend):**
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=<your-supabase-connection-string>
OPENAI_API_KEY=<your-key>
LANGSMITH_API_KEY=<your-key>
# ... all other required keys
```

**Cloudflare Pages (Frontend):**
```env
VITE_API_URL=https://professional-diverapp-production.up.railway.app
```

**How to Set:**

1. **Railway:**
   - Dashboard → Your Service → Variables
   - Add each variable
   - Redeploy after adding

2. **Cloudflare Pages:**
   - Dashboard → Pages → Your Project → Settings → Environment Variables
   - Add `VITE_API_URL`
   - Set for Production and Preview
   - Trigger new deployment

### 5. Build Failures

**Symptoms:**
- Deployment fails
- Build errors in logs
- TypeScript compilation errors

**Solutions:**

1. **Check Build Locally:**
   ```bash
   npm run build
   ```
   - Fix any errors locally first
   - Ensure all dependencies are installed

2. **Check TypeScript Errors:**
   ```bash
   npm run typecheck
   ```

3. **Verify Node Version:**
   - Railway uses Node 22.x (from package.json engines)
   - Ensure compatibility

4. **Check Dependencies:**
   - Verify `package.json` is up to date
   - Check for missing peer dependencies
   - Run `npm install` locally to test

### 6. CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- API calls blocked
- "Access-Control-Allow-Origin" errors

**Solutions:**

1. **Check Server CORS Configuration:**
   - Verify `server/index.ts` allows `https://professionaldiver.app`
   - Check allowed origins list

2. **Verify API URL:**
   - Frontend should use `VITE_API_URL` environment variable
   - Check it's set correctly in Cloudflare Pages

3. **Check Cloudflare Worker (if using):**
   - Verify `worker/index.ts` has correct CORS headers
   - Check API_URL secret is set

### 7. Database Connection Issues

**Symptoms:**
- Backend starts but database queries fail
- Connection timeout errors
- Authentication errors

**Solutions:**

1. **Verify DATABASE_URL:**
   - Check connection string format
   - Ensure credentials are correct
   - Verify database is accessible from Railway

2. **Check Supabase Settings:**
   - Verify connection pooling is enabled
   - Check IP allowlist (if configured)
   - Verify database is running

3. **Test Connection:**
   - Use Railway CLI or dashboard to test connection
   - Check database logs in Supabase

## Step-by-Step Recovery

If the site is completely down, follow these steps:

1. **Run Diagnostic:**
   ```bash
   npm run diagnose:deployment
   ```

2. **Check Railway:**
   - Log into Railway dashboard
   - Verify service status
   - Check recent deployments
   - Review logs for errors
   - Restart if needed

3. **Check Cloudflare Pages:**
   - Log into Cloudflare dashboard
   - Check Pages deployment status
   - Review build logs
   - Verify environment variables
   - Trigger new deployment if needed

4. **Verify DNS:**
   - Check Cloudflare DNS records
   - Verify domain is configured
   - Check SSL/TLS settings

5. **Test Endpoints:**
   ```bash
   # Test Railway backend
   curl https://professional-diverapp-production.up.railway.app/health
   
   # Test frontend
   curl -I https://professionaldiver.app
   ```

6. **Check Environment Variables:**
   - Verify all required variables are set
   - Check values are correct
   - Redeploy after changes

## Getting Help

If issues persist:

1. **Check Logs:**
   - Railway deployment logs
   - Cloudflare Pages build logs
   - Browser console errors

2. **Verify Configuration:**
   - Review `railway.json`
   - Check `vite.config.ts`
   - Verify `package.json` scripts

3. **Test Locally:**
   ```bash
   # Test backend
   npm run dev:api
   
   # Test frontend
   npm run dev:web
   
   # Test build
   npm run build
   ```

4. **Contact Support:**
   - Railway support: https://railway.app/help
   - Cloudflare support: https://support.cloudflare.com

## Prevention

To avoid future issues:

1. **Monitor Deployments:**
   - Set up Railway alerts
   - Monitor Cloudflare Pages deployments
   - Check status regularly

2. **Test Before Deploying:**
   - Test builds locally
   - Verify environment variables
   - Check for TypeScript errors

3. **Keep Dependencies Updated:**
   - Regularly update packages
   - Check for security vulnerabilities
   - Test updates before deploying

4. **Document Changes:**
   - Keep deployment notes
   - Document environment variables
   - Track configuration changes
