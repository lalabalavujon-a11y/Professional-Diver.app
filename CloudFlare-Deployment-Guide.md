# CloudFlare Deployment Guide for Professional Diver - Diver Well Training

## Deployment Architecture

This guide covers the deployment setup for the Professional Diver Training Platform using:
- **Cloudflare** - Frontend/CDN and Workers
- **Railway** - Backend API hosting
- **Supabase** - Production PostgreSQL database

## Prerequisites

- CloudFlare account
- Railway account
- Supabase account
- Domain ownership verification for diverwell.app
- GitHub repository connected to Railway

## Step 1: Railway Backend Setup

1. **Connect Repository to Railway:**
   - Log in to Railway dashboard (railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub repository
   - Select the repository and branch (main)

2. **Configure Railway Service:**
   - Railway will auto-detect the project
   - Set the root directory (if needed)
   - Configure build command: `npm ci --legacy-peer-deps`
   - Configure start command: `npm run start`
   - Set PORT environment variable (Railway auto-assigns, but you can set explicitly)

3. **Environment Variables in Railway:**
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=<your-supabase-connection-string>
   OPENAI_API_KEY=<your-openai-key>
   LANGSMITH_API_KEY=<your-langsmith-key>
   OPENWEATHER_API_KEY=<your-openweather-key>
   STORMGLASS_API_KEY=<your-stormglass-key>
   # Add all other required environment variables
   ```

4. **Get Railway Deployment URL:**
   - After deployment, Railway provides a public URL
   - Format: `https://your-service-name.up.railway.app`
   - **Current Production URL**: `https://professional-diverapp-production.up.railway.app`
   - Note this URL for DNS configuration and Cloudflare Pages environment variables

## Step 2: CloudFlare Domain Configuration

1. **Add Domain to CloudFlare:**
   - Log in to CloudFlare dashboard
   - Click "Add a Site" 
   - Enter `diverwell.app`
   - Select plan (Free plan works for basic setup)
   - CloudFlare will scan existing DNS records

2. **Update Nameservers:**
   - Copy the CloudFlare nameservers provided
   - Update nameservers at your domain registrar to point to CloudFlare
   - Wait for propagation (usually 24-48 hours)

## Step 3: DNS Configuration

3. **Add API Subdomain Record (Railway Backend):**
   ```
   Type: CNAME
   Name: api (or api.professional-diver)
   Target: <your-railway-url>.up.railway.app
   Proxy Status: Proxied (orange cloud)
   TTL: Auto
   ```

4. **Add Frontend Record (Cloudflare Workers/Pages):**
   ```
   Type: A (or CNAME if using Cloudflare Pages)
   Name: professional-diver (or @ for root domain)
   Target: Cloudflare Workers/Pages deployment
   Proxy Status: Proxied (orange cloud)
   TTL: Auto
   ```

5. **SSL/TLS Settings:**
   - Go to SSL/TLS → Overview
   - Set encryption mode to "Full (strict)" for production
   - Enable "Always Use HTTPS"

## Step 4: Supabase Database Setup

1. **Create Supabase Project:**
   - Log in to Supabase dashboard
   - Create a new project
   - Choose a region close to your Railway deployment
   - Note the database password

2. **Get Connection String:**
   - Go to Project Settings → Database
   - Copy the connection string (URI format)
   - Format: `postgresql://postgres:[password]@[host]:5432/postgres`
   - Add this as `DATABASE_URL` in Railway environment variables

3. **Run Migrations:**
   - Use Supabase SQL editor or Railway CLI
   - Run your database migrations
   - Verify tables are created correctly

## Step 5: CloudFlare Performance & Security

6. **Performance Optimization:**
   - Enable "Auto Minify" for CSS, HTML, JS
   - Enable "Brotli" compression
   - Set Browser Cache TTL to appropriate value
   - Enable "Always Online"
   - Configure caching rules for static assets

7. **Security Configuration:**
   - Enable "Security Level: Medium"
   - Configure "Challenge Passage" to 30 minutes
   - Enable "Browser Integrity Check"
   - Set up "Rate Limiting" for API endpoints
   - Configure WAF rules if needed

## Step 6: Page Rules & Redirects

8. **Create Page Rules:**
   ```
   Rule 1: Redirect www to non-www
   URL: www.professional-diver.diverwell.app/*
   Setting: Forwarding URL (Status Code: 301, Destination: https://professional-diver.diverwell.app/$1)

   Rule 2: Force HTTPS
   URL: http://professional-diver.diverwell.app/*
   Setting: Always Use HTTPS

   Rule 3: Cache API responses (optional)
   URL: api.professional-diver.diverwell.app/api/*
   Setting: Cache Level: Standard, Edge Cache TTL: 1 hour
   ```

## Step 7: Additional Configuration

9. **HTTP/2 & HTTP/3:**
   - Enable HTTP/2 and HTTP/3 in Network settings
   - Enable "0-RTT Connection Resumption"

10. **Analytics Setup:**
    - Enable CloudFlare Web Analytics
    - Configure custom analytics if needed
    - Set up Railway metrics monitoring

## Step 8: Email Marketing Integration

11. **Email Routing (Optional):**
    - Set up email routing for support@diverwell.app
    - Configure SPF/DKIM records for email marketing
    - Add MX records if using CloudFlare email routing

## Step 9: Testing & Verification

12. **Domain Verification:**
    ```bash
    # Test DNS resolution
    nslookup professional-diver.diverwell.app
    nslookup api.professional-diver.diverwell.app
    
    # Test SSL certificate
    openssl s_client -connect professional-diver.diverwell.app:443 -servername professional-diver.diverwell.app
    
    # Test HTTP to HTTPS redirect
    curl -I http://professional-diver.diverwell.app
    
    # Test API endpoint
    curl https://api.professional-diver.diverwell.app/api/health
    ```

13. **Performance Testing:**
    - Use CloudFlare's Speed Test
    - Test with Google PageSpeed Insights
    - Verify all resources load correctly
    - Test API response times from Railway

## Environment Variables

14. **Railway Environment Variables:**
    ```env
    NODE_ENV=production
    PORT=5000
    DATABASE_URL=<supabase-connection-string>
    SITE_URL=https://professional-diver.diverwell.app
    API_URL=https://api.professional-diver.diverwell.app
    
    # API Keys
    OPENAI_API_KEY=<your-key>
    LANGSMITH_API_KEY=<your-key>
    LANGSMITH_PROJECT=professional-diver-training-app
    OPENWEATHER_API_KEY=<your-key>
    STORMGLASS_API_KEY=<your-key>
    
    # Add all other required service keys
    ```

15. **CloudFlare Pages Environment Variables (REQUIRED for Frontend):**
    ```env
    VITE_API_URL=https://professional-diverapp-production.up.railway.app
    ```
    - **Critical**: This tells the frontend where to find the Railway backend API
    - Go to Cloudflare Pages → Your Project → Settings → Environment Variables
    - Add `VITE_API_URL` with value: `https://professional-diverapp-production.up.railway.app`
    - Set for both Production and Preview environments
    - After adding, trigger a new deployment for changes to take effect
    - **Note**: Without this, login and all API calls will fail on Cloudflare Pages

16. **CloudFlare Workers Environment Variables (if using Workers):**
    - Configure in CloudFlare Workers dashboard
    - Add secrets for API keys if needed
    - Set environment-specific variables

## Monitoring & Maintenance

16. **Set up CloudFlare Monitoring:**
    - Configure uptime monitoring
    - Set up email alerts for downtime
    - Monitor traffic analytics

17. **Set up Railway Monitoring:**
    - Enable Railway metrics
    - Set up alerts for deployment failures
    - Monitor resource usage

18. **Set up Supabase Monitoring:**
    - Monitor database performance
    - Set up alerts for connection issues
    - Review query performance

19. **Regular Maintenance:**
    - Review security logs monthly
    - Update firewall rules as needed
    - Monitor performance metrics
    - Keep dependencies updated
    - Review Railway deployment logs

## Troubleshooting Common Issues

### DNS Propagation Delays
- Use `dig` or `nslookup` to check propagation
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Wait up to 48 hours for full propagation

### SSL Certificate Issues
- Ensure CloudFlare SSL mode is "Full (strict)"
- Verify Railway provides HTTPS by default
- Check for mixed content warnings
- Verify SSL certificate is valid in Railway

### Railway Connection Issues
- Verify the Railway service is running and deployed
- Check Railway deployment logs for errors
- Verify environment variables are set correctly
- Ensure PORT is correctly configured
- Check Railway service status page

### Database Connection Issues
- Verify DATABASE_URL is correct in Railway
- Check Supabase connection pooling settings
- Verify database is accessible from Railway's IP ranges
- Check Supabase logs for connection errors
- Ensure database migrations have run

### Performance Issues
- Enable CloudFlare caching for static assets
- Optimize images and minimize HTTP requests
- Use CloudFlare's Polish feature for image optimization
- Review Railway resource limits
- Optimize database queries
- Use CloudFlare caching rules for API responses (if appropriate)

### CORS Issues
- Configure CORS headers in Railway/Express
- Add CloudFlare domain to allowed origins
- Verify API endpoints are accessible
- Check browser console for CORS errors

## Security Best Practices

1. **Enable CloudFlare Security Features:**
   - Bot Fight Mode for basic bot protection
   - Rate limiting for API endpoints
   - WAF rules for common attacks
   - DDoS protection

2. **Railway Security:**
   - Use Railway's built-in HTTPS
   - Keep environment variables secure
   - Enable Railway's authentication if needed
   - Review deployment logs regularly

3. **Supabase Security:**
   - Use connection pooling
   - Enable Row Level Security (RLS)
   - Use service role keys only server-side
   - Regularly rotate database passwords
   - Enable database backups

4. **Content Security Policy:**
   - Add CSP headers for XSS protection
   - Whitelist trusted domains only
   - Configure in Railway/Express middleware

5. **Regular Updates:**
   - Keep dependencies updated
   - Monitor security advisories
   - Review access logs regularly
   - Update Railway runtime as needed

## Deployment Workflow

### Automatic Deployment

1. **Push to main branch:**
   - Railway auto-deploys when code is pushed to main
   - CloudFlare Workers/Pages can be configured for auto-deploy
   - GitHub Actions can trigger deployments

2. **Manual Deployment:**
   - Trigger deployment from Railway dashboard
   - Use Railway CLI: `railway up`
   - Deploy to CloudFlare Workers via Wrangler CLI

3. **Database Migrations:**
   - Run migrations before or after deployment
   - Use Supabase migrations or Railway scripts
   - Always backup database before migrations

## Success Verification

Once completed, verify:
- ✅ https://professional-diver.diverwell.app loads correctly
- ✅ API endpoints respond at api.professional-diver.diverwell.app
- ✅ HTTP redirects to HTTPS
- ✅ SSL certificates are valid and trusted
- ✅ Database connections are working
- ✅ All features work (trial signup, AI consultant, payment links)
- ✅ Email marketing functions properly
- ✅ Performance is optimized with CloudFlare
- ✅ Analytics and monitoring are configured
- ✅ Railway deployments are successful
- ✅ Environment variables are set correctly

This setup provides enterprise-grade performance, security, and reliability for the Professional Diver platform through CloudFlare's global CDN network, Railway's robust backend hosting, and Supabase's managed PostgreSQL database.
