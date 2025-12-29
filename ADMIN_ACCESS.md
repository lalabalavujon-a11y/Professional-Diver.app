# Admin Account Access

## Your Admin Credentials

**Email:** `lalabalavu.jon@gmail.com`  
**Password:** `admin123`

## How to Sign In

1. Go to the sign-in page:
   - Local: `http://localhost:3000/signin` or `http://localhost:3000/login`
   - Production: `https://professionaldiver.app/signin` or `https://professionaldiver.app/login`

2. Select **"Password"** tab (not Magic Link)

3. Enter your credentials:
   - Email: `lalabalavu.jon@gmail.com`
   - Password: `admin123`

4. Click **"Sign In"**

5. You'll be redirected to `/dashboard` with SUPER_ADMIN role

## Account Details

- **Role:** SUPER_ADMIN
- **Subscription:** LIFETIME
- **User ID:** super-admin-1
- **Name:** Jon Lalabalavu

## Troubleshooting

### "Invalid credentials" Error

**Possible causes:**
1. **Wrong password** - Make sure you're using `admin123` (all lowercase)
2. **Email typo** - Verify: `lalabalavu.jon@gmail.com`
3. **Server not running** - Check if the API server is running
4. **Case sensitivity** - Email should be exactly as shown

**Solutions:**
1. Clear browser cache and cookies
2. Try incognito/private browsing mode
3. Check browser console for errors (F12)
4. Verify the API endpoint is accessible

### Server Not Running

If you're running locally, make sure the server is running:

```bash
# Start the development server
pnpm run dev:all

# Or start API and web separately
pnpm run dev:api  # API server on port 5000
pnpm run dev:web  # Web client on port 3000
```

### API Endpoint Not Responding

Test the authentication endpoint:

```bash
# Test locally
curl -X POST http://localhost:5000/api/auth/credentials \
  -H "Content-Type: application/json" \
  -d '{"email":"lalabalavu.jon@gmail.com","password":"admin123"}'

# Should return:
# {"success":true,"user":{"id":"super-admin-1",...}}
```

### Browser Console Errors

1. Open browser console (F12)
2. Check for:
   - Network errors (404, 500, etc.)
   - CORS errors
   - JavaScript errors
3. Look at Network tab → check `/api/auth/credentials` request

### Alternative: Magic Link

If password login doesn't work, try Magic Link:

1. Go to sign-in page
2. Click **"Magic Link"** tab
3. Enter: `lalabalavu.jon@gmail.com`
4. Check your email for the sign-in link

## Other Admin Accounts

### Demo Admin Account
- **Email:** `admin@diverwell.app`
- **Password:** `admin123`
- **Role:** ADMIN

### Alternative Super Admin
- **Email:** `sephdee@hotmail.com`
- **Password:** (check server/routes.ts)
- **Role:** SUPER_ADMIN

## Admin Features

Once signed in, you have access to:

- `/admin` - Admin Dashboard
- `/admin/invites` - Manage user invites
- `/admin/lessons/:id` - Edit lessons
- `/analytics` - Analytics dashboard
- `/crm` - CRM dashboard

## Security Notes

⚠️ **Important:** These credentials are hardcoded in `server/routes.ts`. For production:
- Consider using environment variables
- Implement proper password hashing
- Use a database for user management
- Enable 2FA for admin accounts

## Quick Test

To verify your credentials work:

```bash
# Test authentication API
curl -X POST http://localhost:5000/api/auth/credentials \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lalabalavu.jon@gmail.com",
    "password": "admin123"
  }'
```

Expected response:
```json
{
  "success": true,
  "user": {
    "id": "super-admin-1",
    "name": "Admin User",
    "email": "lalabalavu.jon@gmail.com",
    "role": "SUPER_ADMIN",
    "subscriptionType": "LIFETIME"
  }
}
```

## Still Having Issues?

1. **Check server logs** for authentication errors
2. **Verify API is running** on the correct port
3. **Check network tab** in browser DevTools
4. **Try different browser** or clear cache
5. **Check if email is correct** - no typos or extra spaces

If none of these work, the authentication route may need to be checked or updated.








