# How to Get Your Supabase Database Password

## Method 1: View Password in Database Settings

1. In the Supabase dashboard, go to **Settings** → **Database**
2. Scroll down to the **Database password** section
3. You'll see your password (it may be masked with dots)
4. Click the **"Reveal"** or **"Show"** button to see the full password
5. Copy it

## Method 2: Reset Password (if you don't have it)

If you can't see or don't remember your password:

1. Go to **Settings** → **Database**
2. Find the **Database password** section
3. Click **"Reset database password"** or **"Generate new password"**
4. **IMPORTANT**: Copy the new password immediately - Supabase will only show it once!
5. Save it securely (password manager, secure notes, etc.)

## Method 3: From Connection Parameters

1. In the connection modal, click **"> View parameters"**
2. Look for the **Password** field
3. Click **"Reveal"** to show it

## Security Note

⚠️ **Store your password securely!** You'll need it for:
- Database connections
- Migrations
- Application configuration

If you lose it, you'll need to reset it (which may require updating all your connection strings).
