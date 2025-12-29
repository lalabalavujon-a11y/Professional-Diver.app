# Revolut Payment Links + Renewal Tracking Solution

## Quick Solution Using Your Existing Payment Links

Since you already have Revolut payment links, here's how to make them work with subscriptions:

### Your Payment Links:
- **Monthly ($25)**: `https://checkout.revolut.com/pay/79436775-0472-4414-a0ca-b5f151db466b`
- **Annual ($250)**: `https://checkout.revolut.com/pay/28d2e7d0-4ee7-41ed-bbf1-d2024f9275d8`

---

## How It Works

### 1. **First Payment (New Subscription)**
- User clicks payment link
- Completes payment on Revolut
- Your system detects payment (via webhook or manual verification)
- Updates user: `subscriptionType = MONTHLY` or `ANNUAL`
- Sets subscription start date
- Calculates expiration: Start Date + 30 days (monthly) or + 365 days (annual)

### 2. **Renewal (Existing Subscription)**
- When subscription expires or is close to expiring:
  - Show "Renew Subscription" button/link
  - User clicks same payment link
  - Completes payment
  - System detects payment and **extends expiration date** by another period
  - User subscription continues seamlessly

### 3. **Expiration Tracking**
- System calculates expiration based on:
  - **Monthly**: Last payment date + 30 days
  - **Annual**: Last payment date + 365 days
- Shows countdown timer (already implemented in your code)
- Sends renewal reminders 3 days before expiration

---

## Implementation Steps

### Step 1: Update Payment Links in Code

Update these files to use your Revolut payment links:

**Files to update:**
- `client/src/pages/landing.tsx` (lines 230, 272)
- `client/src/components/trial-countdown.tsx` (lines 187, 195)

**Monthly Payment Link:**
```typescript
href="https://checkout.revolut.com/pay/79436775-0472-4414-a0ca-b5f151db466b"
```

**Annual Payment Link:**
```typescript
href="https://checkout.revolut.com/pay/28d2e7d0-4ee7-41ed-bbf1-d2024f9275d8"
```

### Step 2: Set Up Webhook to Detect Payments

Revolut can send webhooks when payments complete. Set up:

1. **In Revolut Dashboard:**
   - Go to Webhooks/API settings
   - Add webhook URL: `https://your-domain.com/api/revolut/payment-webhook`
   - Enable events: `ORDER_COMPLETED`, `PAYMENT_CAPTURED`

2. **Webhook Handler** (I'll create this)
   - Receives payment notification
   - Extracts customer email from payment metadata
   - Updates user subscription in database
   - Extends expiration date

### Step 3: Add Subscription Start Date Tracking

The system needs to track when a subscription started for renewal calculations.

**Option A: Use `updatedAt` field** (Quick)
- When subscription payment received, `updatedAt` = payment date
- Calculate expiration: `updatedAt + subscription period`

**Option B: Add `subscriptionStartDate` field** (Better)
- Add new column to users table
- Store subscription start date
- More accurate for renewals

### Step 4: Handle Renewal Logic

When payment webhook received:
1. Check if user already has subscription
2. If yes: **Extend expiration** (add 30/365 days to current expiration)
3. If no: **Create new subscription** (set expiration = now + 30/365 days)

---

## Code Changes Needed

### 1. Update Payment Links
✅ Simple replacement in landing.tsx and trial-countdown.tsx

### 2. Add Webhook Route
✅ Create `/api/revolut/payment-webhook` endpoint

### 3. Payment Detection Logic
✅ Parse webhook payload
✅ Extract customer email
✅ Identify subscription type (monthly/annual) from amount
✅ Update user subscription

### 4. Renewal vs New Subscription
✅ Check if user has active subscription
✅ If active: Extend expiration
✅ If expired/new: Create subscription

---

## Alternative: Manual Payment Verification

If webhooks aren't available, you can:

1. **Add Payment Reference Field**
   - User enters payment reference after paying
   - You verify in Revolut dashboard
   - Manually update subscription

2. **Email Confirmation Flow**
   - User pays via Revolut
   - Receives email receipt
   - Forwards receipt to you
   - You verify and activate subscription

3. **Scheduled Check**
   - Daily job checks Revolut API for new payments
   - Matches payments to users by email
   - Auto-activates subscriptions

---

## Recommended Approach

**Start Simple, Add Automation Later:**

1. ✅ **Use payment links as-is** (immediate)
2. ✅ **Track subscription expiration** (already implemented)
3. ⏳ **Add webhook handler** (when Revolut API ready)
4. ⏳ **Manual verification option** (fallback)

---

## Next Steps

1. **Update payment links** in code (5 minutes)
2. **Set up Revolut webhook** (if API available)
3. **Test payment flow** end-to-end
4. **Add renewal reminders** (already partially implemented)

Would you like me to:
- ✅ Update the payment links now?
- ✅ Create the webhook handler?
- ✅ Add subscription renewal logic?






