# Deploying Lessons to Production

## Current Status
✅ **Local Development**: All 9 tracks now have 12 lessons each (108 total lessons)
❌ **Production Site**: Lessons need to be populated in production database

## Solution

The production site uses PostgreSQL (Neon) via `DATABASE_URL`. You have two options:

### Option 1: Use API Endpoint (Recommended)

If your API server is running and accessible, you can use the populate endpoint:

```bash
# Make sure your API server is running and accessible
curl -X POST https://your-api-url.com/api/admin/populate-lessons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Option 2: Run Script Against Production Database

1. **Get your production DATABASE_URL** from your Neon dashboard or environment variables

2. **Run the populate script**:
```bash
DATABASE_URL="postgresql://user:password@host/database" pnpm tsx scripts/create-12-lessons-per-track.ts
```

**Note**: The script will need to be modified to work with PostgreSQL. Currently it's set up for SQLite.

### Option 3: Manual Database Update

1. Export lessons from local database:
```bash
# Export lessons data
sqlite3 local-dev.db ".dump lessons" > lessons_export.sql
```

2. Import to production PostgreSQL (adapt SQL syntax as needed)

### Option 4: Deploy Updated Worker Code

The worker code has been updated to better handle lessons. Deploy the updated worker:

```bash
# Build the application
pnpm run build

# Deploy to production
pnpm run deploy:prod
```

## Quick Fix: Update Worker Fallback

The worker fallback has been updated to fetch lessons even when using fallback data. After deploying the updated worker, lessons should appear on the live site.

## Verification

After deploying, verify lessons are showing:
1. Visit your production site
2. Navigate to any track detail page
3. You should see 12 lessons listed

## Next Steps

1. **Deploy updated worker code** (includes lesson fetching improvements)
2. **Populate production database** with 12 lessons per track
3. **Verify** lessons appear on live site

## Troubleshooting

If lessons still don't appear:
1. Check browser console for errors
2. Check worker logs in Cloudflare dashboard
3. Verify API endpoint is accessible
4. Check database connection in production
5. Verify lessons exist in production database





