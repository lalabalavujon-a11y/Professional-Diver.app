# Tracks and Lessons Backup

This directory contains backups of all tracks and lessons from the database.

## Files

- `tracks-lessons-latest.json` - The most recent backup (automatically updated)
- `tracks-lessons-backup-YYYY-MM-DD.json` - Timestamped backups for historical reference

## Automatic vs Manual

### ✅ Automatic (Happens Automatically)

1. **On Content Changes** - Automatically backs up when you:
   - Edit a lesson via the Admin Dashboard (`PATCH /api/lessons/:id`)
   - Populate lessons via the admin endpoint (`POST /api/admin/populate-lessons`)
   - Any other track/lesson modifications through the API
   
   The backup runs in the background and doesn't slow down your edits!

2. **Before Deployment** - Automatically exports backup when you run:
   - `npm run deploy:dev`
   - `npm run deploy:prod`
   - `npm run deploy:all`

3. **Deployment Script** - The `deploy-with-backup.sh` script automatically:
   - Exports backup before deployment
   - Prompts you to restore after deployment

### ⚠️ Manual (You Need to Run)

1. **After Deployment** - You must manually restore on the new environment:
   ```bash
   npm run backup:restore
   ```

2. **Manual Backup** - If you want to force a backup manually:
   ```bash
   npm run backup:export
   ```

### 🔧 Configuration

Auto-backup is enabled by default. To disable it, set:
```bash
export AUTO_BACKUP_ENABLED=false
```

Or in your `.env` file:
```
AUTO_BACKUP_ENABLED=false
```

## Usage

### Export (Backup) Current Data

Export all current tracks and lessons:

```bash
npm run backup:export
```

This will:
- Export all tracks and their lessons to `backups/tracks-lessons-latest.json`
- Create a timestamped backup file
- Preserve all lesson content, order, and metadata

### Restore Data After Deployment

After deploying to a new environment, restore the data:

```bash
npm run backup:restore
```

Or restore from a specific backup file:

```bash
npm run backup:restore backups/tracks-lessons-backup-2024-01-15.json
```

**⚠️ WARNING:** The restore process will DELETE all existing tracks and lessons before restoring from the backup.

### Automated Deployment with Backup

Use the deployment script for automatic backup/restore:

```bash
# Make script executable (first time only)
chmod +x scripts/deploy-with-backup.sh

# Deploy with automatic backup
./scripts/deploy-with-backup.sh prod
```

## Backup Format

The backup files are JSON with the following structure:

```json
{
  "exportedAt": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "tracks": [
    {
      "id": "track-id",
      "title": "Track Title",
      "slug": "track-slug",
      "summary": "Track description",
      "isPublished": true,
      "aiTutorId": "tutor-id",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "lessons": [
        {
          "id": "lesson-id",
          "trackId": "track-id",
          "title": "Lesson Title",
          "order": 1,
          "content": "Full lesson content...",
          "estimatedMinutes": 60,
          "isRequired": true,
          "createdAt": "2024-01-01T00:00:00.000Z",
          "updatedAt": "2024-01-01T00:00:00.000Z"
        }
      ]
    }
  ]
}
```

## Best Practices

1. **Export before every deployment** - Run `npm run backup:export` before deploying
2. **Keep multiple backups** - The script creates timestamped backups automatically
3. **Version control** - Consider committing the latest backup to git for version history
4. **Test restore** - Test the restore process in a development environment first

## Deployment Workflow

1. Export current data: `npm run backup:export`
2. Deploy application
3. Restore data: `npm run backup:restore`
4. Verify all tracks and lessons are restored correctly

