# 🔍 How to Find Your Supabase Connection String

## The Connection String is NOT in Database Settings

You're currently on: **Database → Settings** (which shows pooling configuration)

The connection string is in a **different location**:

## Correct Location:

1. **Click on the gear icon (⚙️) in the left sidebar** - This is "Project Settings" (not Database Settings)
   - OR look for "Project Settings" at the top of the sidebar
   - OR click your project name at the top

2. **In Project Settings, click "Database"** (in the left menu)

3. **Scroll down to find "Connection string" section**

4. **You'll see tabs like:**
   - **Connection pooling** (recommended - use this one)
   - **Direct connection**
   - **Session mode**
   - **Transaction mode**

5. **Copy the connection string** from the "Connection pooling" tab

## Alternative: Quick Access

If you can't find it:
1. Look for a **"Connect"** button at the top of your Supabase dashboard
2. Click it - it usually shows connection strings
3. Or look for **"Connection info"** or **"Connection string"** in the main dashboard

## What the Connection String Looks Like:

**Connection Pooling (Recommended):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
```

**Direct Connection:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

## Quick Navigation:

1. **Left Sidebar** → Click the **gear icon (⚙️)** or **"Project Settings"**
2. **Left Menu** → Click **"Database"**
3. **Main Content** → Scroll to **"Connection string"** section
4. **Copy** the connection string from the **"Connection pooling"** tab

---

**Note:** The connection string section might be below the SSL Configuration section, so scroll down on that Database settings page in Project Settings.

