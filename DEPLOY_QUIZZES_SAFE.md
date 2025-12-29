# 🔒 Safe Quiz Deployment Guide

## Overview
This guide helps you safely deploy quizzes to production without losing any data.

## Safety Guarantees
✅ **Will NOT delete**:
- Existing quizzes
- Existing questions
- Existing lessons
- Existing tracks
- Any user data

✅ **Will ONLY add**:
- Missing quizzes to lessons that don't have quizzes
- Questions to newly created quizzes

✅ **Idempotent**:
- Safe to run multiple times
- Will skip quizzes that already exist

## Deployment Steps

### Step 1: Verify Local Database
```bash
# Check current quiz count
sqlite3 local-dev.db "SELECT COUNT(*) FROM quizzes;"
```

### Step 2: Run Safe Deployment Script
```bash
# This will add missing quizzes to your local database first
pnpm run deploy:quizzes-safe
```

### Step 3: Verify Local Changes
```bash
# Check quiz count after deployment
sqlite3 local-dev.db "SELECT COUNT(*) FROM quizzes;"

# Verify quizzes were added for hyperbaric and lst tracks
sqlite3 local-dev.db "SELECT t.slug, COUNT(q.id) as quiz_count FROM tracks t LEFT JOIN lessons l ON t.id = l.track_id LEFT JOIN quizzes q ON l.id = q.lesson_id WHERE t.slug IN ('hyperbaric-operations', 'lst') GROUP BY t.slug;"
```

### Step 4: Deploy to Production

**Option A: If using Cloudflare D1 (Recommended)**
```bash
# The script will run automatically on production when you deploy
# Just make sure your production environment uses the same database connection

# For Cloudflare D1, run the script using wrangler:
wrangler d1 execute professionaldiver-db --command="[run the script commands]"
```

**Option B: If using PostgreSQL/Neon**
```bash
# Set production DATABASE_URL
export DATABASE_URL="your-production-database-url"

# Run the safe deployment script
NODE_ENV=production DATABASE_URL="$DATABASE_URL" pnpm run deploy:quizzes-safe
```

**Option C: Manual Database Sync**
```bash
# Export quizzes from local
sqlite3 local-dev.db ".mode json" ".output quizzes-export.json" "SELECT * FROM quizzes;"
sqlite3 local-dev.db ".mode json" ".output questions-export.json" "SELECT * FROM questions;"

# Then import to production (method depends on your production database)
```

## Verification After Deployment

1. **Check Quiz Count**:
   - Should have quizzes for all lessons
   - Hyperbaric operations: 12 quizzes
   - LST: 12 quizzes

2. **Test on Live Site**:
   - Navigate to a lesson
   - Click "Take Quiz" button
   - Verify quiz loads with questions

3. **Verify Navigation**:
   - Previous/Next Lesson buttons should work
   - Track outline should show all lessons

## Rollback Plan

If something goes wrong:

1. **Quizzes are safe** - The script only adds, never deletes
2. **To remove added quizzes** (if needed):
   ```sql
   -- Find newly added quizzes by timestamp (if you track this)
   -- Or manually remove specific quizzes by ID
   ```

## Troubleshooting

### Issue: "Quiz already exists" warnings
- **Solution**: This is normal. The script skips existing quizzes safely.

### Issue: Some tracks still show "Coming Soon"
- **Solution**: Check that lessons exist in the database:
  ```sql
  SELECT t.slug, COUNT(l.id) FROM tracks t LEFT JOIN lessons l ON t.id = l.track_id GROUP BY t.slug;
  ```

### Issue: Quizzes don't appear on live site
- **Solution**: 
  1. Verify database connection in production
  2. Check API logs for errors
  3. Verify quiz API endpoint is working

---

**🔒 Remember: This deployment is 100% safe - it only adds data, never deletes!**




