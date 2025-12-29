# Partner Admin Accounts

## Overview

Two partner admin accounts have been created for platform development partners. These accounts have full admin access to all pages **except** affiliate revenue and finance-related pages.

## Partner Admin Accounts

### 1. Freddie Joseph
- **Email:** `freddierussell.joseph@yahoo.com`
- **Password:** `partner123`
- **Role:** `PARTNER_ADMIN`
- **Access Level:** Admin access (all pages except affiliate/finance)
- **ID:** `partner-admin-1`

### 2. Dilo Suka
- **Email:** `deesuks@gmail.com`
- **Password:** `partner123`
- **Role:** `PARTNER_ADMIN`
- **Access Level:** Admin access (all pages except affiliate/finance)
- **ID:** `partner-admin-2`

## Access Permissions

### ✅ **Allowed Access:**
- Admin Dashboard (`/admin`)
- CRM Dashboard (`/crm`)
- Analytics (`/analytics`)
- Operations (`/operations`)
- Content Editor (`/markdown-editor`)
- All training pages (dashboard, tracks, lessons, exams)
- Learning Path
- All user-facing features

### ❌ **Restricted Access:**
- Affiliate Dashboard (`/affiliate`) - **BLOCKED**
- Finance/Revenue pages - **BLOCKED**
- Billing/Payment pages - **BLOCKED**
- Any affiliate-related functionality - **BLOCKED**

## How to Sign In

1. Go to: `http://localhost:3000/signin` (or production URL)
2. Select **"Password"** tab
3. Enter credentials:
   - Email: `freddierussell.joseph@yahoo.com` or `deesuks@gmail.com`
   - Password: `partner123`
4. Click **"Sign In"**

## Role Differences

| Role | Full Admin Access | Affiliate/Finance Access | Use Case |
|------|-------------------|-------------------------|----------|
| `SUPER_ADMIN` | ✅ Yes | ✅ Yes | Full platform control |
| `ADMIN` | ✅ Yes | ✅ Yes | Standard admin access |
| `PARTNER_ADMIN` | ✅ Yes | ❌ No | Platform development partners |

## Security Notes

- Partner admins cannot access financial data or affiliate revenue information
- Navigation menu automatically hides affiliate links for partner admins
- Direct URL access to `/affiliate` shows an access restricted message
- All admin features (CRM, Analytics, Operations, Content Editor) are fully accessible

## Implementation Details

### Authentication
- Credentials are stored in `server/routes.ts`
- Password: `partner123` (can be changed)
- Role: `PARTNER_ADMIN`

### Access Control
- Role check in `client/src/components/role-based-navigation.tsx`
- Affiliate page access control in `client/src/pages/affiliate-dashboard.tsx`
- User management in `server/user-management.ts`

### User Management
- Partner admins are stored in the special users map
- They have LIFETIME subscription type
- Purpose: "Platform Development Partner"

## Changing Passwords

To change a partner admin password, update the `partnerAdminCredentials` object in `server/routes.ts`:

```typescript
const partnerAdminCredentials: Record<string, { password: string; name: string; id: string }> = {
  'freddierussell.joseph@yahoo.com': {
    password: 'new_password_here', // Change this
    name: 'Freddie Joseph',
    id: 'partner-admin-1'
  },
  // ...
};
```

Then restart the API server.

## Troubleshooting

### "Invalid credentials" Error
- Verify email is correct (check for typos)
- Ensure password is `partner123` (all lowercase)
- Check server is running

### Can See Affiliate Link in Navigation
- Clear browser cache
- Hard refresh: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
- Check user role in browser console: `localStorage.getItem('userEmail')`

### Access Denied on Affiliate Page
- This is expected behavior for PARTNER_ADMIN role
- Partner admins should not access affiliate/finance pages
- If access is needed, contact a SUPER_ADMIN

## Notes

- Both partner admins share the same password for simplicity
- Passwords can be individualized if needed
- Email addresses are case-sensitive in authentication
- Alternative email format for Freddie is supported for compatibility




