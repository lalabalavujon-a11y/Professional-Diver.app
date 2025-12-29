# Deployment Checklist - Prevent Data Loss

## ⚠️ CRITICAL: Before Every Deployment

### 1. Verify Express Server is Running
```bash
# Check if your Express server is accessible
curl https://your-express-server-url/health
```

### 2. Verify DATABASE_URL is Set in Express Server
- If using Railway: Check Environment Variables in Railway dashboard
- If using Render: Check Environment Variables in Render dashboard  
- If using Fly.io: Check with `fly secrets list`
- The Express server MUST have `DATABASE_URL` configured

### 3. Verify API_URL Secret in Cloudflare Workers
```bash
# Check if API_URL is set
wrangler secret list --env production

# If not set, set it:
wrangler secret put API_URL --env production
# Enter: https://your-express-server-url
```

### 4. Verify Database Connection
```bash
# Test database connection from Express server
curl https://your-express-server-url/api/health
# Should return database status
```

### 5. Run Database Migrations (if schema changed)
```bash
# If you've updated the schema, run migrations on your database
# For PostgreSQL (Neon/Supabase):
psql $DATABASE_URL -f migrations/0000_tricky_ezekiel_stane.sql

# Or use your database provider's migration tool
```

## 📋 Pre-Deployment Checklist

- [ ] Express server is running and accessible
- [ ] `DATABASE_URL` is set in Express server environment
- [ ] `API_URL` secret is set in Cloudflare Workers
- [ ] Database connection test passes
- [ ] Database migrations are up to date
- [ ] Test login with existing user credentials
- [ ] Verify Learning Tracks are accessible
- [ ] Verify user profiles load correctly

## 🚀 Deployment Steps

### Step 1: Deploy API Worker
```bash
pnpm run deploy:api
```

### Step 2: Deploy Main Worker
```bash
pnpm run deploy:prod
```

### Step 3: Verify Deployment
```bash
# Test the deployed site
curl https://professionaldiver.app/health

# Test API endpoint
curl https://professionaldiver.app/api/health
```

### Step 4: Test Data Persistence
1. Log in with existing credentials
2. Check if Learning Tracks are still present
3. Verify user profile data
4. Create a test track and verify it persists

## 🔍 Troubleshooting Data Loss

### If data is lost after redeploy:

1. **Check Express Server Logs**
   ```bash
   # Check Railway/Render/Fly.io logs for database connection errors
   ```

2. **Verify DATABASE_URL**
   ```bash
   # In your Express server environment, verify:
   echo $DATABASE_URL
   # Should show your PostgreSQL connection string
   ```

3. **Test Database Connection**
   ```bash
   # Connect directly to database
   psql $DATABASE_URL
   # Check if tables exist:
   \dt
   # Check if data exists:
   SELECT * FROM users LIMIT 5;
   SELECT * FROM tracks LIMIT 5;
   ```

4. **Check API_URL Configuration**
   ```bash
   # Verify API_URL is correct
   wrangler secret list --env production
   # Test the URL:
   curl $(wrangler secret get API_URL --env production)/health
   ```

## 🎯 Quick Fix Commands

```bash
# Set API_URL if missing
wrangler secret put API_URL --env production

# Check all secrets
wrangler secret list --env production

# Test Express server
curl https://your-express-server-url/health

# Test database connection
curl https://your-express-server-url/api/health
```

## 📝 Notes

- **Never deploy without verifying DATABASE_URL is set**
- **Always test data persistence after deployment**
- **Keep database backups before major deployments**
- **Document any schema changes before deploying**





