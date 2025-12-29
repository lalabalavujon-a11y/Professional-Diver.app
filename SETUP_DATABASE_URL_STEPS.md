# 🔧 Setting Up DATABASE_URL - Step by Step

## Your Connection String Template:
```
postgresql://postgres:[YOUR-PASSWORD]@***REDACTED_HOST***:5432/postgres
```

## Step 1: Get Your Database Password

You need to replace `[YOUR-PASSWORD]` with your actual Supabase database password.

### Option A: If You Know Your Password
- Use the password you set when creating the Supabase project
- Or the password you set in Database Settings

### Option B: Reset Your Password (If You Don't Know It)
1. In Supabase Dashboard, go to **Project Settings** → **Database**
2. Find the **"Database password"** section
3. Click **"Reset database password"** button
4. Copy the new password (you'll only see it once!)

## Step 2: Complete Your Connection String

Replace `[YOUR-PASSWORD]` with your actual password:

**Before:**
```
postgresql://postgres:[YOUR-PASSWORD]@***REDACTED_HOST***:5432/postgres
```

**After (example):**
```
postgresql://postgres:MySecurePassword123@***REDACTED_HOST***:5432/postgres
```

## Step 3: Add SSL Mode (Important!)

Add `?sslmode=require` at the end for secure connection:

**Final connection string:**
```
postgresql://postgres:YourActualPassword@***REDACTED_HOST***:5432/postgres?sslmode=require
```

## Step 4: Set It Up

Once you have your complete connection string, you can:

### Option A: Use the Setup Script
```bash
./scripts/setup-database-url.sh
```
Then paste your complete connection string when prompted.

### Option B: Set It Manually
```bash
# Set for main worker
echo "postgresql://postgres:YourPassword@***REDACTED_HOST***:5432/postgres?sslmode=require" | wrangler secret put DATABASE_URL --env production

# Set for API worker
echo "postgresql://postgres:YourPassword@***REDACTED_HOST***:5432/postgres?sslmode=require" | wrangler secret put DATABASE_URL --config wrangler-api.toml --env production
```

## Step 5: Verify

After setting it, verify:
```bash
wrangler secret list --env production
wrangler secret list --config wrangler-api.toml --env production
```

You should see `DATABASE_URL` in both lists.

---

**⚠️ Important:** 
- Keep your password secure
- Never commit it to git
- The password in the connection string will be hidden when set as a secret

