# Partner Admin Affiliate Access

## Overview

Partner admins (Freddie Joseph and Dilo Suka) now have access to their **own** affiliate dashboards where they can:
- Create and share their own affiliate links
- Track their own referrals and earnings
- View their own affiliate statistics
- Access their personal affiliate dashboard

They **cannot** access the main admin affiliate dashboard that shows all affiliates and financial data.

## What Changed

### ✅ **Partner Admins Can Now:**
1. **Access their own affiliate dashboard** at `/affiliate`
2. **Create affiliate accounts** automatically (created on first access)
3. **Get unique affiliate codes** (format: `PDXXXXXXXX`)
4. **Share their referral links** (`https://professionaldiver.app/?ref=THEIRCODE`)
5. **Track their own referrals** and earnings
6. **View their own statistics** (clicks, conversions, earnings)

### ❌ **Partner Admins Still Cannot:**
1. Access the main admin affiliate dashboard
2. View other affiliates' data
3. Access financial/revenue management pages
4. See system-wide affiliate statistics

## How It Works

### Automatic Affiliate Account Creation

When a partner admin first visits `/affiliate`:
1. System checks if they have an affiliate account
2. If not, automatically creates one with:
   - Unique affiliate code (e.g., `PD12345678`)
   - Referral link: `https://professionaldiver.app/?ref=PD12345678`
   - 50% commission rate
   - Their name and email from user management

### Personal Dashboard Features

Each partner admin sees:
- **Their own referral link** - unique to them
- **Their own statistics**:
  - Total referrals
  - Total earnings
  - Monthly earnings
  - Click tracking
  - Conversion rates
- **Their own referral history**
- **Copy link functionality**

## Access Details

### Navigation
- Partner admins see **"My Affiliate"** link in navigation (instead of "Partners")
- Link appears for all paid users, including partner admins
- Clicking takes them to their personal dashboard

### Dashboard URL
- URL: `/affiliate`
- Shows their own data only
- Automatically filters by their email/user ID

## Technical Implementation

### Backend Changes
1. **Affiliate Service** (`server/affiliate-service.ts`):
   - Added `getAffiliateByEmail()` method
   - Added `getAffiliateByUserId()` method

2. **API Route** (`server/routes.ts`):
   - Updated `/api/affiliate/dashboard` to accept `?email=` parameter
   - Auto-creates affiliate account if doesn't exist
   - Uses user management service to get user name

3. **Frontend** (`client/src/pages/affiliate-dashboard.tsx`):
   - Removed block for PARTNER_ADMIN role
   - Passes user email to API to get their own dashboard
   - Shows personal affiliate data

4. **Navigation** (`client/src/components/role-based-navigation.tsx`):
   - Shows "My Affiliate" link for partner admins
   - Allows access to `/affiliate` route

## Testing

### Test Partner Admin Access

1. **Sign in as partner admin:**
   - Email: `freddierussell.joseph@yahoo.com` or `deesuks@gmail.com`
   - Password: `partner123`

2. **Navigate to affiliate:**
   - Click "My Affiliate" in navigation
   - Or go to: `http://localhost:3000/affiliate`

3. **Verify:**
   - See their own affiliate code
   - See their own referral link
   - Can copy and share link
   - See their own stats (initially zeros)
   - Cannot see other affiliates' data

### Test API Directly

```bash
# Get Freddie's affiliate dashboard
curl "http://localhost:5000/api/affiliate/dashboard?email=freddierussell.joseph@yahoo.com"

# Get Dilo's affiliate dashboard
curl "http://localhost:5000/api/affiliate/dashboard?email=deesuks@gmail.com"
```

## Affiliate Code Format

- Format: `PD` + 8 random uppercase characters
- Example: `PDA1B2C3D4`
- Referral Link: `https://professionaldiver.app/?ref=PDA1B2C3D4`

## Commission Structure

- **Commission Rate:** 50%
- **Tracking:** Automatic via referral codes
- **Payouts:** Managed separately (not accessible to partner admins)

## Notes

- Each partner admin gets their own unique affiliate account
- Affiliate accounts are created automatically on first dashboard access
- Names are pulled from user management service
- Email addresses must match exactly (case-insensitive comparison)
- Affiliate data is separate from admin financial data

## Future Enhancements

Potential additions:
- Email notifications for new referrals
- Commission payout history (personal view only)
- Referral analytics and insights
- Social sharing buttons for referral links








