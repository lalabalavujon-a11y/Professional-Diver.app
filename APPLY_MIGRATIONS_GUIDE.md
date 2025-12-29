# 🚀 Apply Database Migrations to Supabase

## Step-by-Step Guide

### Step 1: Open Supabase SQL Editor
1. In your Supabase Dashboard
2. Click **"Database"** in the left sidebar
3. Click **"SQL Editor"** (or look for it in the Database section)

### Step 2: Copy the Migration SQL
1. Open the file: `migrations/0000_clean_for_supabase.sql`
2. Copy **ALL** the contents (Ctrl+A, Ctrl+C / Cmd+A, Cmd+C)

### Step 3: Paste and Run in SQL Editor
1. In Supabase SQL Editor, click **"New query"** or clear the editor
2. Paste the entire SQL migration
3. Click **"Run"** button (or press Ctrl+Enter / Cmd+Enter)

### Step 4: Verify Success
You should see:
- ✅ "Success. No rows returned" or similar success message
- ✅ No errors

### Step 5: Verify Tables Were Created
1. In Supabase Dashboard → **Database** → **Tables**
2. You should see all these tables:
   - accounts
   - ai_tutors
   - attempts
   - certificates
   - clients
   - invites
   - learning_paths
   - lessons
   - practice_scenarios
   - questions
   - quizzes
   - scenario_attempts
   - sessions
   - tracks
   - user_progress
   - users
   - verification_tokens

## If You Get Errors

### Error: "type already exists"
- Some types might already exist - that's OK, the migration will continue
- You can ignore these warnings

### Error: "relation already exists"
- Some tables might already exist
- You can either:
  - Drop existing tables first (if they're empty)
  - Or skip creating existing tables

### Error: "permission denied"
- Make sure you're logged in as the project owner
- Check you have the right permissions

## After Migration is Complete

Once the migration is successful, we can:
1. ✅ Test the connection again
2. ✅ Seed initial data (tracks, lessons, etc.)
3. ✅ Verify everything is working

---

**Ready?** Open Supabase SQL Editor and paste the migration SQL!

