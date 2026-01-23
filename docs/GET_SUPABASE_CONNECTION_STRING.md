# How to Get Your Supabase Connection String

Follow these steps to get your Supabase PostgreSQL connection string:

## Step-by-Step Instructions

### 1. Log in to Supabase
- Go to [https://supabase.com](https://supabase.com)
- Sign in to your account

### 2. Select Your Project
- From your dashboard, click on your project (or create a new one if you don't have one)

### 3. Navigate to Database Settings
- In the left sidebar, click on **Settings** (gear icon)
- Then click on **Database** in the settings menu

### 4. Find the Connection String
- Scroll down to the **Connection string** section
- You'll see several connection string options:
  - **URI** - This is the one you want (starts with `postgresql://`)
  - **JDBC** - For Java applications
  - **Golang** - For Go applications
  - **Python** - For Python applications
  - **Node.js** - For Node.js applications

### 5. Copy the Connection String
- Click on the **URI** tab
- Click the **Copy** button next to the connection string
- The format will look like:
  ```
  postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
  ```

### 6. Important: Use the Pooled Connection (Recommended)
- For better performance and connection management, use the **Connection pooling** option
- Click on the **Connection pooling** tab
- Copy the **Session mode** connection string (recommended for migrations)
- It will look like:
  ```
  postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
  ```

### 7. Add SSL Mode (if not present)
- Make sure your connection string ends with `?sslmode=require`
- If it doesn't, add it:
  ```
  postgresql://...?sslmode=require
  ```

## Alternative: Get Connection String from Project Settings

1. Go to **Settings** → **Database**
2. Look for **Connection string** section
3. Under **Connection parameters**, you'll find:
   - **Host**: `db.[PROJECT-REF].supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`
   - **Password**: (click "Reveal" to see it)

You can construct the connection string manually:
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

## Security Note

⚠️ **Never commit your connection string to version control!**

- Store it in your `.env` file (which should be in `.gitignore`)
- Or use environment variables in your deployment platform

## Using the Connection String

Once you have your connection string, you can:

1. **Set it as an environment variable:**
   ```bash
   export DATABASE_URL='postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require'
   ```

2. **Add it to your `.env` file:**
   ```env
   DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require
   ```

3. **Run the RLS migration:**
   ```bash
   npm run db:migrate:rls
   ```

## Troubleshooting

### Connection Refused
- Make sure your IP is allowed in Supabase's network settings
- Check that you're using the correct port (5432 for direct, 6543 for pooled)

### Authentication Failed
- Verify your password is correct
- Make sure you're using the `postgres` user (or another authorized user)

### SSL Required
- Make sure `?sslmode=require` is at the end of your connection string
- Supabase requires SSL connections

## Need Help?

If you're having trouble finding your connection string:
1. Check the Supabase documentation: https://supabase.com/docs/guides/database/connecting-to-postgres
2. Make sure you have the correct permissions to view database settings
3. Contact Supabase support if you're still having issues
