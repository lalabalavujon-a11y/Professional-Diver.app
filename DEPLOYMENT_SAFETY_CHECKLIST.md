# 🛡️ Deployment Safety Checklist

**CRITICAL: Follow this checklist before EVERY deployment to prevent data loss.**

## Pre-Deployment Checklist

### ✅ Step 1: Verify Environment Configuration

1. **Check DATABASE_URL is Set (Production Only)**
   ```bash
   # For production, DATABASE_URL must be set
   echo $DATABASE_URL
   # Should show: postgresql://user:password@host:port/database
   ```

2. **Verify Database Connection**
   ```bash
   # Run verification script
   pnpm tsx scripts/verify-deployment-ready.ts production
   ```

### ✅ Step 2: Create Comprehensive Backup

**BEFORE deploying, create a full backup of all data:**

```bash
# Option 1: Full database backup (recommended)
NODE_ENV=production DATABASE_URL="your-production-url" pnpm tsx scripts/backup-production-database.ts

# Option 2: Tracks and lessons backup (faster, less comprehensive)
pnpm run backup:export
```

**What gets backed up:**
- ✅ All tracks and lessons
- ✅ All quizzes and questions
- ✅ All user accounts (passwords excluded for security)
- ✅ All user progress records
- ✅ All quiz/exam attempts
- ✅ All invites

**Backup Location:**
- Timestamped: `backups/full-database-backup-YYYY-MM-DD-HHMMSS.json`
- Latest: `backups/full-database-latest.json`

### ✅ Step 3: Verify Backup Integrity

```bash
# Check backup file exists and is recent
ls -lh backups/full-database-latest.json

# Verify backup contains data
cat backups/full-database-latest.json | jq '.statistics'
```

### ✅ Step 4: Test Database Connection

```bash
# Test connection to production database
NODE_ENV=production DATABASE_URL="your-production-url" pnpm tsx scripts/verify-deployment-ready.ts production
```

### ✅ Step 5: Verify Cloudflare Workers Configuration

1. **Check DATABASE_URL Secret is Set**
   ```bash
   # List secrets (will show if DATABASE_URL is set)
   wrangler secret list --env production
   ```

2. **If DATABASE_URL is NOT set, set it:**
   ```bash
   wrangler secret put DATABASE_URL --env production
   # Paste your PostgreSQL connection string when prompted
   ```

3. **Verify wrangler.toml Configuration**
   - Check that `[env.production]` section exists
   - Verify routes are configured correctly
   - Ensure KV namespaces are set up

### ✅ Step 6: Run Pre-Deployment Verification

```bash
# Comprehensive verification
pnpm tsx scripts/verify-deployment-ready.ts production
```

**This checks:**
- ✅ DATABASE_URL configuration
- ✅ Database connection
- ✅ Existing data counts
- ✅ Recent backup exists
- ✅ Migrations are ready

### ✅ Step 7: Deploy with Backup Safety

The deployment scripts automatically run backups, but verify:

```bash
# Check package.json scripts include backup
cat package.json | grep -A 2 "deploy:prod"

# Should show:
# "predeploy": "npm run backup:export",
# "deploy:prod": "npm run backup:export && wrangler deploy --env production",
```

### ✅ Step 8: Post-Deployment Verification

After deployment, verify:

1. **Check Site is Live**
   ```bash
   curl -I https://www.professionaldiver.app
   # Should return 200 OK
   ```

2. **Verify Database Connection in Production**
   - Log into your production database
   - Verify data still exists
   - Check recent activity

3. **Test Critical Functionality**
   - User login
   - Track/lesson loading
   - Progress tracking

## 🚨 Emergency Rollback Procedure

If something goes wrong during deployment:

### Step 1: Stop Deployment
```bash
# If deployment is in progress, cancel it
# Check Cloudflare Workers dashboard for active deployments
```

### Step 2: Restore from Backup
```bash
# Restore from latest backup
NODE_ENV=production DATABASE_URL="your-production-url" pnpm tsx scripts/restore-tracks-lessons.ts backups/full-database-latest.json
```

### Step 3: Verify Data Integrity
```bash
# Check data was restored
NODE_ENV=production DATABASE_URL="your-production-url" pnpm tsx scripts/verify-deployment-ready.ts production
```

## 📊 Data Protection Best Practices

### 1. Regular Backups
- **Before every deployment**: Full backup
- **Daily**: Automatic backups (if auto-backup is enabled)
- **Weekly**: Archive old backups

### 2. Backup Storage
- Keep backups in `backups/` directory
- Consider version control for critical backups
- Store backups in multiple locations (local + cloud)

### 3. Database Configuration
- **NEVER** deploy without DATABASE_URL configured in production
- **ALWAYS** verify DATABASE_URL before deployment
- Use Cloudflare Workers secrets for sensitive data

### 4. Migration Safety
- Test migrations on development database first
- Never run destructive migrations without backup
- Verify migration scripts before deployment

## 🔍 Troubleshooting

### Issue: "DATABASE_URL must be set for production"

**Solution:**
```bash
# Set DATABASE_URL in Cloudflare Workers
wrangler secret put DATABASE_URL --env production
```

### Issue: "No backup found"

**Solution:**
```bash
# Create backup before deploying
NODE_ENV=production DATABASE_URL="your-url" pnpm tsx scripts/backup-production-database.ts
```

### Issue: "Database connection failed"

**Solution:**
1. Verify DATABASE_URL is correct
2. Check database is accessible
3. Verify network/firewall settings
4. Test connection manually:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

### Issue: "Changes not visible on live site"

**Possible Causes:**
1. DATABASE_URL not configured in Cloudflare Workers
2. Cache issues (clear Cloudflare cache)
3. Deployment didn't complete successfully
4. Wrong environment deployed to

**Solution:**
```bash
# 1. Verify DATABASE_URL is set
wrangler secret list --env production

# 2. Check deployment status
wrangler deployments list --env production

# 3. Clear cache (in Cloudflare dashboard)
# 4. Redeploy if needed
```

## 📝 Quick Reference Commands

```bash
# Full backup (production)
NODE_ENV=production DATABASE_URL="..." pnpm tsx scripts/backup-production-database.ts

# Quick backup (tracks/lessons only)
pnpm run backup:export

# Verify deployment readiness
pnpm tsx scripts/verify-deployment-ready.ts production

# Deploy to production (includes automatic backup)
pnpm run deploy:prod

# Set DATABASE_URL secret
wrangler secret put DATABASE_URL --env production

# Check secrets
wrangler secret list --env production
```

## ⚠️ Critical Reminders

1. **NEVER deploy without a backup**
2. **ALWAYS verify DATABASE_URL is set for production**
3. **TEST database connection before deploying**
4. **VERIFY data exists after deployment**
5. **KEEP multiple backup copies**

---

**Last Updated:** 2024-01-XX
**Version:** 1.0.0





