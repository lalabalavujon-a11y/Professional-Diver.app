# How to Create a Supabase Database Backup

## Step-by-Step Instructions

### Method 1: Download Existing Backup (Fastest)

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Backups**
   - Click on **"Database"** in the left sidebar
   - Click on **"Backups"** tab

3. **Download Latest Backup**
   - You'll see a list of automatic daily backups
   - Click **"Download"** on the most recent backup
   - The backup will be downloaded as a `.backup` or `.sql` file

### Method 2: Create Manual Backup (Most Recent)

1. **Go to Database Settings**
   - Navigate to: https://supabase.com/dashboard
   - Select your project
   - Click **"Settings"** (gear icon) → **"Database"**

2. **Create Backup**
   - Scroll down to **"Database backups"** section
   - Click **"Create backup"** or **"Backup now"** button
   - Wait for the backup to complete (usually takes a few minutes)

3. **Download the Backup**
   - Once complete, go to **"Database"** → **"Backups"**
   - Find your newly created backup
   - Click **"Download"**

### Method 3: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Create and download backup
supabase db dump -f backup.sql
```

## Backup File Information

- **Format**: Usually `.backup` (PostgreSQL custom format) or `.sql` (plain SQL)
- **Size**: Depends on your database size (can be large)
- **Location**: Downloads to your default download folder
- **Naming**: Usually includes timestamp, e.g., `backup_2024-01-15.backup`

## What's Included in the Backup

✅ **Included:**
- All table schemas and data
- Indexes and constraints
- Functions and triggers
- RLS policies (if any)
- Extensions

❌ **Not Included:**
- Storage files (S3 objects) - these must be backed up separately
- Auth provider secrets
- Realtime subscriptions
- Some Supabase-specific metadata

## After Downloading

1. **Save it securely**
   - Store in a safe location
   - Consider encrypting if it contains sensitive data
   - Don't commit to version control

2. **Verify the backup**
   - Check file size (should be > 0 bytes)
   - Note the timestamp

3. **You're ready to run the migration!**
   - Now you can safely run the RLS migration
   - If anything goes wrong, you can restore from this backup

## Restoring from Backup (If Needed)

If you need to restore later:

1. Go to **Database** → **Backups**
2. Click **"Restore"** on the backup you want
3. Or use the Supabase CLI restore command

⚠️ **Warning**: Restoring will overwrite your current database!
