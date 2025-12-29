# 🔗 Get Your Connection String - Quick Steps

## You're on the Right Page!

From the General Settings page you're on:

### Step 1: Click "Database" in Left Sidebar
- Look at the left sidebar under **"CONFIGURATION"**
- Click on **"Database"** (it has an arrow icon →)

### Step 2: Find Connection String
- Scroll down on the Database page
- Look for **"Connection string"** section
- You'll see tabs: **Connection pooling**, **Direct connection**, etc.

### Step 3: Copy Connection Pooling String (Recommended)
- Click the **"Connection pooling"** tab
- Copy the connection string (it will look like):
  ```
  postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
  ```

### Step 4: Or Use Direct Connection
- If connection pooling doesn't work, try **"Direct connection"** tab
- Copy that string instead

---

## Quick Check: Is Project Active?

While you're on General Settings:
- Look for any "Paused" or "Inactive" status
- If you see "Pause project" button, that means it's **currently active** ✅
- If project is paused, you'd see "Restart project" instead

---

**Once you have the connection string, paste it here and I'll update the DATABASE_URL!**

