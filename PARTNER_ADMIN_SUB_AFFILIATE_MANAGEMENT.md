# Partner Admin Sub-Affiliate Management

## Overview

Partner admins (Freddie Joseph and Dilo Suka) now have full access to the affiliate dashboard where they can:
- **View their own affiliate statistics**
- **Create and manage their own sub-affiliates**
- **Track their affiliate network performance**
- **Manage their partner program**

## What Changed

### ✅ **Partner Admins Can Now:**

1. **Access Full Affiliate Dashboard** (`/affiliate`)
   - View their own affiliate statistics
   - See their referral link and earnings
   - Track their performance

2. **Create Sub-Affiliates**
   - Add new affiliates under their management
   - Each sub-affiliate gets their own unique affiliate code
   - Track sub-affiliate performance

3. **Manage Their Affiliate Network**
   - View all sub-affiliates in a table
   - See each sub-affiliate's:
     - Name and email
     - Affiliate code
     - Number of referrals
     - Total earnings
     - Status (Active/Inactive)

4. **Full Partner Dashboard Features**
   - All standard affiliate dashboard features
   - Sub-affiliate management section
   - Create new affiliates form

### ❌ **Partner Admins Still Cannot:**
- Access main admin financial dashboard
- View other partner admins' affiliates
- Access system-wide revenue management
- See all affiliates across the platform

## How It Works

### Sub-Affiliate System

1. **Parent-Child Relationship:**
   - Partner admins are "parent" affiliates
   - They can create "child" affiliates (sub-affiliates)
   - Each sub-affiliate is linked to their parent

2. **Creating Sub-Affiliates:**
   - Partner admin goes to `/affiliate`
   - Clicks "Create New Affiliate" tab
   - Enters name and email
   - System automatically:
     - Creates affiliate account
     - Generates unique affiliate code
     - Links to parent (partner admin)
     - Creates referral link

3. **Viewing Sub-Affiliates:**
   - Partner admin sees "My Affiliates" tab
   - Shows all sub-affiliates in a table
   - Displays performance metrics for each

## Technical Implementation

### Backend Changes

1. **Affiliate Service** (`server/affiliate-service.ts`):
   - Added `parentAffiliateId` and `parentAffiliateCode` fields
   - Added `getSubAffiliates()` method
   - Added `getManagedAffiliates()` method
   - Updated `createAffiliate()` to support parent relationship

2. **API Routes** (`server/routes.ts`):
   - Updated `/api/affiliate/dashboard` to include sub-affiliates for partner admins
   - Updated `/api/affiliate/create` to support parent affiliate
   - Added `/api/affiliate/sub-affiliates` endpoint

3. **Frontend** (`client/src/pages/affiliate-dashboard.tsx`):
   - Added sub-affiliate management section
   - Added create sub-affiliate form
   - Added sub-affiliates table view
   - Shows management UI only for partner admins

## Using the Sub-Affiliate Management

### Step 1: Access Dashboard
1. Sign in as partner admin
2. Go to `/affiliate` or click "My Affiliate" in navigation
3. You'll see your affiliate dashboard

### Step 2: View Your Affiliates
1. Click "My Affiliates" tab
2. See all your sub-affiliates listed
3. View their performance metrics

### Step 3: Create New Affiliate
1. Click "Create New Affiliate" tab
2. Enter:
   - **Name:** Affiliate's full name
   - **Email:** Affiliate's email address
3. Click "Create Affiliate"
4. System creates account with unique affiliate code
5. New affiliate appears in "My Affiliates" list

## Sub-Affiliate Features

Each sub-affiliate gets:
- **Unique Affiliate Code:** Format `PDXXXXXXXX`
- **Referral Link:** `https://professionaldiver.app/?ref=THEIRCODE`
- **50% Commission Rate:** Same as parent
- **Own Dashboard:** Can track their own referrals
- **Linked to Parent:** Managed by partner admin

## Data Structure

### Parent Affiliate (Partner Admin)
```json
{
  "id": "partner-admin-1",
  "name": "Freddie Joseph",
  "email": "freddierussell.joseph@yahoo.com",
  "affiliateCode": "PDWDP0NYQ7",
  "parentAffiliateId": null,
  "canManageAffiliates": true
}
```

### Sub-Affiliate
```json
{
  "id": "sub-affiliate-1",
  "name": "John Doe",
  "email": "john@example.com",
  "affiliateCode": "PD12345678",
  "parentAffiliateId": "partner-admin-1",
  "parentAffiliateCode": "PDWDP0NYQ7"
}
```

## API Endpoints

### Get Sub-Affiliates
```bash
GET /api/affiliate/sub-affiliates?email=freddierussell.joseph@yahoo.com
```

Response:
```json
{
  "success": true,
  "subAffiliates": [...],
  "count": 5
}
```

### Create Sub-Affiliate
```bash
POST /api/affiliate/create
{
  "userId": "user-john-example-com",
  "name": "John Doe",
  "email": "john@example.com",
  "parentAffiliateCode": "PDWDP0NYQ7"
}
```

### Get Dashboard (with sub-affiliates)
```bash
GET /api/affiliate/dashboard?email=freddierussell.joseph@yahoo.com
```

Response includes:
```json
{
  "affiliate": {...},
  "stats": {...},
  "subAffiliates": [...],
  "canManageAffiliates": true
}
```

## Testing

### Test as Partner Admin

1. **Sign in:**
   - Email: `freddierussell.joseph@yahoo.com` or `deesuks@gmail.com`
   - Password: `partner123`

2. **Go to affiliate dashboard:**
   - Navigate to `/affiliate`
   - Should see "Manage Your Affiliates" section

3. **Create sub-affiliate:**
   - Click "Create New Affiliate" tab
   - Enter name and email
   - Click "Create Affiliate"
   - Should see new affiliate in "My Affiliates" list

4. **View sub-affiliates:**
   - Click "My Affiliates" tab
   - See all created sub-affiliates
   - View their stats and codes

## Notes

- Partner admins can create unlimited sub-affiliates
- Each sub-affiliate is independent with their own code
- Sub-affiliates can also refer customers
- Parent admin sees all sub-affiliate performance
- Sub-affiliates don't see other sub-affiliates (only their own data)

## Future Enhancements

Potential additions:
- Commission sharing between parent and sub-affiliates
- Sub-affiliate performance analytics
- Bulk affiliate creation
- Email invitations to new affiliates
- Sub-affiliate activity notifications








