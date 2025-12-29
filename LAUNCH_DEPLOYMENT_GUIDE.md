# 🚀 Launch Deployment Guide
## Deploy Diver Well Training Platform to Production

This guide will walk you through deploying your Professional Diver Training Platform to Cloudflare Workers for production use.

---

## ✅ Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] **Cloudflare Account** with Workers enabled
- [ ] **Domain configured** (e.g., `professionaldiver.app`)
- [ ] **API Keys** for payment processing (Stripe/PayPal)
- [ ] **Environment variables** configured
- [ ] **Database** set up (PostgreSQL or SQLite)
- [ ] **Build tested** locally

---

## 📋 Step 1: Configure Cloudflare API Token

### Option A: Use OAuth (Recommended for First Time)

1. **Login via Wrangler:**
   ```bash
   npx wrangler login
   ```
   - This opens your browser
   - Authorize Cloudflare Workers
   - Returns to terminal when complete

### Option B: Use API Token

1. **Create API Token:**
   - Go to: https://dash.cloudflare.com/profile/api-tokens
   - Click **"Create Token"**
   - Use **"Edit Cloudflare Workers"** template
   - Or create custom token with:
     - **Account** → **Cloudflare Workers** → **Edit**
     - **Zone** → **Workers Routes** → **Edit** (select your domain)
     - **Account** → **Workers KV Storage** → **Edit**
     - **Account** → **Workers Scripts** → **Edit**

2. **Set Environment Variable:**
   ```bash
   export CLOUDFLARE_API_TOKEN=your_token_here
   ```

---

## 📋 Step 2: Configure Environment Variables

Create a `.env` file in the project root with:

```env
# Cloudflare
CLOUDFLARE_API_TOKEN=your_token_here

# Database (Production)
DATABASE_URL=your_production_database_url

# Stripe (Payment Processing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal (Optional)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_SANDBOX=false

# GHL Integration (Optional)
GHL_CLIENT_ID=...
GHL_CLIENT_SECRET=...
GHL_REDIRECT_URI=https://yourdomain.com/api/ghl/callback

# OpenAI (AI Tutors)
OPENAI_API_KEY=sk-...

# LangSmith (Optional)
LANGSMITH_API_KEY=...
LANGSMITH_PROJECT=professional-diver-training-app

# Node Environment
NODE_ENV=production
```

---

## 📋 Step 3: Build the Application

```bash
# Install dependencies (if not already done)
pnpm install

# Build the application
pnpm run build

# This will:
# - Build the React frontend to dist/client/
# - Build the Cloudflare Worker to dist/worker.js
# - Copy all assets and manifest files
```

**Verify Build:**
```bash
# Check that dist/client/ exists with files
ls -la dist/client/

# Check that dist/worker.js exists
ls -la dist/worker.js
```

---

## 📋 Step 4: Configure Wrangler

Your `wrangler.toml` should already be configured. Verify:

```toml
[env.production]
name = "professionaldiver-app-production"
routes = [
  { pattern = "professionaldiver.app/*", zone_name = "professionaldiver.app" },
  { pattern = "www.professionaldiver.app/*", zone_name = "professionaldiver.app" }
]

[env.production.assets]
directory = "./dist/client"
binding = "ASSETS"
```

**Update with your domain** if different from `professionaldiver.app`.

---

## 📋 Step 5: Deploy to Production

### Deploy Everything:

```bash
# Deploy to production
pnpm run deploy:prod
```

Or deploy individually:

```bash
# Deploy API Worker
pnpm run deploy:api

# Deploy Frontend Worker
pnpm run deploy:prod
```

### What Gets Deployed:

- ✅ **Frontend Application** (`dist/client/`) - Static files
- ✅ **Cloudflare Worker** (`dist/worker.js`) - Server-side logic
- ✅ **PWA Manifest** (`manifest.json`) - Mobile app support
- ✅ **Service Worker** (`sw.js`) - Offline support
- ✅ **All Assets** - Images, fonts, icons

---

## 📋 Step 6: Verify Deployment

### 1. Check Deployment Status:

```bash
wrangler deployments list --env production
```

### 2. Test Your Site:

```bash
# Test homepage
curl -I https://yourdomain.com

# Test API endpoint
curl https://yourdomain.com/api/health
```

### 3. Test in Browser:

- Open `https://yourdomain.com` in your browser
- Check browser console for errors
- Test login/signup flow
- Test PWA installation (see Mobile Installation Guide)

### 4. Test Mobile Installation:

- **iOS**: Open in Safari → Share → Add to Home Screen
- **Android**: Open in Chrome → Menu → Add to Home Screen

---

## 📋 Step 7: Configure DNS (If Not Already Done)

If your domain isn't pointing to Cloudflare:

1. **Add Domain to Cloudflare:**
   - Go to Cloudflare Dashboard
   - Add your domain
   - Update nameservers at your registrar

2. **Configure DNS Records:**
   - Add A record pointing to Cloudflare Workers
   - Or use CNAME if using Workers Routes

3. **Wait for Propagation:**
   - DNS changes can take 24-48 hours
   - Usually works within minutes

---

## 📋 Step 8: Post-Deployment Tasks

### 1. Set Up Monitoring:

```bash
# Monitor Worker logs
wrangler tail --env production
```

### 2. Configure Error Tracking:

- Set up error tracking service (e.g., Sentry)
- Monitor API errors
- Track user issues

### 3. Test Payment Processing:

- Test Stripe checkout flow
- Test PayPal integration (if enabled)
- Verify webhook endpoints

### 4. Set Up Analytics:

- Configure Google Analytics or similar
- Track user behavior
- Monitor conversion rates

---

## 🔧 Troubleshooting

### Issue: "Authentication error [code: 10000]"

**Solution:**
- Update API token with Workers permissions
- Or use `wrangler login` instead

### Issue: "Worker not found"

**Solution:**
- Check worker name in `wrangler.toml`
- Verify it matches Cloudflare dashboard
- Create worker manually in dashboard if needed

### Issue: "Routes not working"

**Solution:**
- Check routes in Cloudflare Dashboard → Workers & Pages → Settings → Triggers
- Verify domain is added to Cloudflare
- Check DNS records

### Issue: "Assets not loading"

**Solution:**
- Verify `dist/client/` directory exists
- Check `wrangler.toml` assets configuration
- Ensure manifest.json is in public directory

### Issue: "PWA not installing"

**Solution:**
- Verify HTTPS is enabled (required for PWA)
- Check manifest.json is accessible at `/manifest.json`
- Ensure service worker is registered
- Check browser console for errors

---

## 📱 Mobile Installation Instructions for Users

After deployment, share the **MOBILE_APP_INSTALLATION_GUIDE.md** with your users, or add a link to it in your application.

**Quick Links:**
- Full Guide: `/MOBILE_APP_INSTALLATION_GUIDE.md`
- In-App Component: Shows automatically on mobile devices

---

## 🔄 Updating After Deployment

### To Deploy Updates:

```bash
# 1. Make your changes
# 2. Build again
pnpm run build

# 3. Deploy
pnpm run deploy:prod
```

### To Rollback:

```bash
# List deployments
wrangler deployments list --env production

# Rollback to previous version
wrangler rollback --env production
```

---

## 📊 Performance Checklist

After deployment, verify:

- [ ] **Page Load Speed**: < 3 seconds
- [ ] **Lighthouse Score**: > 90
- [ ] **Mobile Responsive**: Works on all devices
- [ ] **PWA Installable**: Shows install prompt
- [ ] **Offline Support**: Works without internet
- [ ] **API Response Time**: < 500ms average

---

## 🎯 Success Indicators

Your deployment is successful when:

✅ Site loads at `https://yourdomain.com`  
✅ All pages render correctly  
✅ Login/signup works  
✅ PWA installs on mobile devices  
✅ API endpoints respond correctly  
✅ Payment processing works  
✅ No console errors  

---

## 📞 Support

If you encounter issues:

1. Check Cloudflare Dashboard → Workers & Pages → Logs
2. Run `wrangler tail --env production` for real-time logs
3. Check browser console for frontend errors
4. Verify environment variables are set correctly
5. Review `DEPLOY_TO_CLOUDFLARE.md` for detailed troubleshooting

---

## 🎉 Launch Checklist

Before announcing launch:

- [ ] Domain is live and accessible
- [ ] SSL certificate is active (HTTPS)
- [ ] All features tested and working
- [ ] Payment processing tested
- [ ] Mobile installation works
- [ ] Error tracking configured
- [ ] Analytics configured
- [ ] Support email/contact set up
- [ ] Terms of Service and Privacy Policy published
- [ ] User documentation ready

---

**Last Updated:** January 2025  
**Version:** 1.0

**Ready to Launch! 🚀**






