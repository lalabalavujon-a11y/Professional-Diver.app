# Safe Deployment Guide: Media Fields for Lessons

This guide will help you deploy the new media editing features to production **without losing any data**.

## ⚠️ Important: Data Safety

- ✅ All new fields have default values (`[]` - empty arrays)
- ✅ Existing lessons will automatically get empty arrays for new fields
- ✅ No existing data will be modified or deleted
- ✅ Migration uses `IF NOT EXISTS` - safe to run multiple times

## Step 1: Set Your Database URL

```bash
# Set your production database URL
export DATABASE_URL="your-production-database-url-here"
```

**For Cloudflare/Neon:**
```bash
export DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

## Step 2: Apply Database Migration

### Option A: Using the Safe Migration Script (Recommended)

```bash
npm run db:migrate:media
```

This will:
- ✅ Check if columns already exist (safe to run multiple times)
- ✅ Add only missing columns
- ✅ Verify no data was lost
- ✅ Show confirmation of successful migration

### Option B: Manual SQL (If needed)

If you prefer to run SQL directly:

```sql
-- Run this in your database console
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "videos" json DEFAULT '[]'::json;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "documents" json DEFAULT '[]'::json;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "embeds" json DEFAULT '[]'::json;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "links" json DEFAULT '[]'::json;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "images" json DEFAULT '[]'::json;
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "audio" json DEFAULT '[]'::json;
```

## Step 3: Deploy the Code

### Option A: Using the Automated Script (Recommended)

```bash
# Make sure DATABASE_URL is set
export DATABASE_URL="your-database-url"

# Run the deployment script
./scripts/deploy-with-migration.sh
```

This script will:
1. Create a backup
2. Apply the migration
3. Build the application
4. Deploy to production

### Option B: Manual Deployment

```bash
# 1. Apply migration (if not done in Step 2)
npm run db:migrate:media

# 2. Build the application
npm run build:worker

# 3. Deploy to production
npm run deploy:prod
```

## Step 4: Verify Deployment

1. **Check the site loads**: https://diverwell.app
2. **Test lesson editor**:
   - Go to any lesson
   - Click "Edit Content"
   - Verify you see tabs: Content, Videos, Documents, Media
3. **Test existing lessons**:
   - Open an existing lesson
   - Verify it still displays correctly
   - Check that new media tabs are available (even if empty)

## Troubleshooting

### Migration Already Applied

If you see "column already exists" errors, that's OK! The migration is idempotent and safe to run multiple times.

### Database Connection Issues

Make sure your `DATABASE_URL` is correct:
```bash
echo $DATABASE_URL
```

### Code Not Showing Changes

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check Cloudflare cache - may need to purge cache in dashboard

### Rollback (If Needed)

If something goes wrong, the new columns can be removed:

```sql
-- ONLY RUN IF YOU NEED TO ROLLBACK
ALTER TABLE "lessons" DROP COLUMN IF EXISTS "videos";
ALTER TABLE "lessons" DROP COLUMN IF EXISTS "documents";
ALTER TABLE "lessons" DROP COLUMN IF EXISTS "embeds";
ALTER TABLE "lessons" DROP COLUMN IF EXISTS "links";
ALTER TABLE "lessons" DROP COLUMN IF EXISTS "images";
ALTER TABLE "lessons" DROP COLUMN IF EXISTS "audio";
```

**Note**: This will delete any media data you've added, so only use if absolutely necessary.

## What Changed

### Database Schema
- Added 6 new JSON columns to `lessons` table:
  - `videos` - Array of video objects
  - `documents` - Array of document objects
  - `embeds` - Array of embed objects
  - `links` - Array of link objects
  - `images` - Array of image objects
  - `audio` - Array of audio objects

### Application Features
- ✅ Admin lesson editor now has 4 tabs:
  - Content (Markdown editor)
  - Videos (manage videos)
  - Documents (manage documents)
  - Media (images, links, embeds, audio)
- ✅ Lesson display shows media from database
- ✅ File upload support for images, videos, documents, audio

## Success Checklist

- [ ] Migration applied successfully
- [ ] Site loads without errors
- [ ] Lesson editor shows new tabs
- [ ] Can add/edit/delete media items
- [ ] Existing lessons still work
- [ ] File uploads work (if configured)

## Support

If you encounter issues:
1. Check the migration script output
2. Verify DATABASE_URL is correct
3. Check Cloudflare Worker logs
4. Ensure all dependencies are installed: `pnpm install`

---

**🎉 Once deployed, you'll be able to edit Content, Videos, Documents, and add Embeds, Links, Images, and Audio files for all tracks and lessons!**





