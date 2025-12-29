# Diverwell.app Deployment Guide

## Overview
This guide will help you deploy your Professional Diver Training Platform to `diverwell.app` using Cloudflare Workers and Pages.

## Prerequisites

### 1. Domain Setup
- Own the `diverwell.app` domain
- Have access to domain registrar settings
- Cloudflare account (free tier works)

### 2. Development Environment
- Node.js 22.12.0+ (managed via .nvmrc)
- pnpm package manager
- Cloudflare Wrangler CLI

### 3. Install Dependencies

```bash
# Install Wrangler CLI globally
npm install -g wrangler

# Install project dependencies
pnpm install
```

## Step 1: Cloudflare Account Setup

### 1.1 Add Domain to Cloudflare
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click "Add a Site"
3. Enter `diverwell.app`
4. Choose the Free plan
5. Cloudflare will scan existing DNS records

### 1.2 Update Nameservers
1. Copy the Cloudflare nameservers provided
2. Update nameservers at your domain registrar
3. Wait for propagation (24-48 hours max)

### 1.3 SSL/TLS Configuration
1. Go to SSL/TLS → Overview
2. Set encryption mode to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Enable "Automatic HTTPS Rewrites"

## Step 2: Wrangler Authentication

```bash
# Login to Cloudflare
wrangler login

# Verify authentication
wrangler whoami
```

## Step 3: Create Cloudflare Resources

### 3.1 Create KV Namespaces

```bash
# Create production KV namespaces
wrangler kv:namespace create "CACHE"
wrangler kv:namespace create "DATA"

# Create preview KV namespaces
wrangler kv:namespace create "CACHE" --preview
wrangler kv:namespace create "DATA" --preview
```

### 3.2 Create D1 Database (Optional)

```bash
# Create D1 database for user data
wrangler d1 create diverwell-db
```

### 3.3 Update wrangler.toml
Update the `wrangler.toml` file with the actual IDs from the commands above:

```toml
# Replace these with actual IDs from the commands above
[[kv_namespaces]]
binding = "CACHE"
id = "your-actual-cache-kv-id"
preview_id = "your-actual-preview-cache-kv-id"

[[kv_namespaces]]
binding = "DATA"
id = "your-actual-data-kv-id"
preview_id = "your-actual-preview-data-kv-id"

[[d1_databases]]
binding = "DB"
database_name = "diverwell-db"
database_id = "your-actual-d1-database-id"
```

## Step 4: Build and Deploy

### 4.1 Build the Application

```bash
# Build for production
npm run build:worker
```

This will:
- Build the React client application
- Bundle the Cloudflare Worker
- Generate optimized assets
- Create security headers and routing configuration

### 4.2 Deploy to Cloudflare

```bash
# Deploy to production
npm run deploy:prod

# Or deploy to development first
npm run deploy:dev
```

## Step 5: Domain Configuration

### 5.1 Add Custom Domain Routes
In Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your `diverwell-app-production` worker
3. Go to Settings → Triggers
4. Add Custom Domain: `diverwell.app`
5. Add Custom Domain: `www.diverwell.app`

### 5.2 DNS Configuration
Ensure these DNS records exist in Cloudflare:

```
Type: A
Name: diverwell.app
Content: 192.0.2.1 (placeholder, will be overridden by Worker)
Proxy: Proxied (orange cloud)

Type: CNAME
Name: www
Content: diverwell.app
Proxy: Proxied (orange cloud)
```

## Step 6: Performance Optimization

### 6.1 Caching Rules
In Cloudflare Dashboard → Caching → Cache Rules:

```
Rule 1: Cache Static Assets
If URI Path starts with "/assets/"
Then Cache Level: Cache Everything, Edge TTL: 1 year

Rule 2: Cache API Responses
If URI Path starts with "/api/" AND Request Method equals "GET"
Then Cache Level: Cache Everything, Edge TTL: 5 minutes
```

### 6.2 Page Rules
Create these page rules in order:

```
Rule 1: Force HTTPS
URL: http://diverwell.app/*
Setting: Always Use HTTPS

Rule 2: WWW Redirect
URL: www.diverwell.app/*
Setting: Forwarding URL (301, https://diverwell.app/$1)
```

## Step 7: Security Configuration

### 7.1 Security Headers
Already configured in the build process via `_headers` file.

### 7.2 Firewall Rules (Optional)
- Enable Bot Fight Mode
- Set Security Level to "Medium"
- Configure rate limiting for API endpoints

## Step 8: Monitoring and Analytics

### 8.1 Enable Analytics
1. Go to Analytics & Logs → Web Analytics
2. Enable for `diverwell.app`
3. Add the analytics script to your application if needed

### 8.2 Set Up Alerts
1. Go to Notifications
2. Create alerts for:
   - Worker errors
   - High response times
   - Domain SSL certificate expiry

## Step 9: Testing and Verification

### 9.1 DNS Propagation Check
```bash
# Check DNS resolution
nslookup diverwell.app
dig diverwell.app

# Check from multiple locations
curl -I https://diverwell.app
```

### 9.2 SSL Certificate Verification
```bash
# Test SSL certificate
openssl s_client -connect diverwell.app:443 -servername diverwell.app
```

### 9.3 Performance Testing
- Test with [Google PageSpeed Insights](https://pagespeed.web.dev/)
- Use [Cloudflare Speed Test](https://speed.cloudflare.com/)
- Verify all features work correctly

## Step 10: Environment Variables

### 10.1 Production Secrets
Add any necessary secrets via Wrangler:

```bash
# Add environment variables
wrangler secret put API_KEY --env production
wrangler secret put DATABASE_URL --env production
```

### 10.2 Update Application Configuration
Ensure your application uses the correct production URLs:

```typescript
// In your application config
const config = {
  apiUrl: 'https://diverwell.app/api',
  siteUrl: 'https://diverwell.app',
  environment: 'production'
};
```

## Troubleshooting

### Common Issues

#### 1. DNS Not Resolving
- Check nameserver propagation
- Verify DNS records in Cloudflare
- Clear local DNS cache

#### 2. SSL Certificate Issues
- Ensure SSL mode is "Full (strict)"
- Check that Cloudflare proxy is enabled (orange cloud)
- Wait for certificate provisioning (up to 24 hours)

#### 3. Worker Not Responding
- Check Worker logs in Cloudflare Dashboard
- Verify routes are configured correctly
- Ensure Worker is deployed to production environment

#### 4. Assets Not Loading
- Check asset paths in built application
- Verify `_routes.json` configuration
- Ensure assets are included in deployment

### Debugging Commands

```bash
# Check Worker logs
wrangler tail --env production

# Test Worker locally
wrangler dev --env development

# Check deployment status
wrangler deployments list --env production
```

## Maintenance

### Regular Tasks
1. Monitor Worker performance and errors
2. Update dependencies monthly
3. Review security logs
4. Check SSL certificate renewal
5. Monitor domain expiration

### Backup Strategy
- KV namespace data backup
- D1 database backup (if used)
- Configuration backup
- DNS settings documentation

## Success Checklist

- [ ] Domain points to Cloudflare nameservers
- [ ] SSL certificate is active and valid
- [ ] https://diverwell.app loads the training platform
- [ ] www.diverwell.app redirects to diverwell.app
- [ ] All application features work correctly
- [ ] Performance is optimized (>90 PageSpeed score)
- [ ] Security headers are properly configured
- [ ] Analytics and monitoring are active
- [ ] Error handling works correctly
- [ ] Mobile responsiveness is maintained

## Support

For issues with this deployment:
1. Check Cloudflare status page
2. Review Worker logs in dashboard
3. Test with `wrangler dev` locally
4. Check DNS propagation status
5. Verify SSL certificate status

## Next Steps

After successful deployment:
1. Set up automated deployments via GitHub Actions
2. Configure staging environment
3. Implement monitoring and alerting
4. Set up backup procedures
5. Document operational procedures

---

**🎉 Congratulations!** Your Professional Diver Training Platform is now live at `diverwell.app` with enterprise-grade Cloudflare infrastructure!


