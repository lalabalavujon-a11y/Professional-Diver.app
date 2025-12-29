# Revolut Subscription Setup Guide

## Overview

Revolut Business **DOES support subscriptions** via their Merchant API! The payment links you created are one-time payments, but we can use the API to create proper recurring subscriptions.

**Reference**: [Revolut Subscriptions Documentation](https://help.revolut.com/business/help/merchant-accounts/accept-recurring-payments-with-subscriptions/how-to-accept-recurring-payments-with-subscriptions/)

---

## Solution Options

### **Option 1: Full API Integration (Recommended - Proper Subscriptions)**

Use Revolut's Merchant API to create subscription plans and handle recurring payments automatically.

**Pros:**
- ✅ True recurring subscriptions
- ✅ Automatic renewals
- ✅ Webhook notifications
- ✅ Professional implementation

**Cons:**
- ⚠️ Requires API access and setup
- ⚠️ Need to integrate webhooks

---

### **Option 2: Hybrid Approach (Quick Solution)**

Use the payment links you already have, but track expiration dates and send renewal reminders. Users click the link again to renew.

**Pros:**
- ✅ Quick to implement
- ✅ Uses existing payment links
- ✅ No API setup needed

**Cons:**
- ⚠️ Manual renewal process
- ⚠️ Users must remember to renew
- ⚠️ Not automatic

---

## Option 1: Full API Integration Setup

### Step 1: Get Revolut API Access

1. Log into your Revolut Business dashboard
2. Navigate to **Developer** or **API** section
3. Create API key with permissions:
   - Read/Write Orders
   - Read/Write Subscriptions
   - Read/Write Customers
   - Webhooks

### Step 2: Create Subscription Plans

The system will create these automatically when you first run it, or you can create them manually:

**Monthly Plan:**
- Name: "Professional Diver Training - Monthly"
- Amount: $25.00 (2500 cents)
- Interval: Monthly (1 month)

**Annual Plan:**
- Name: "Professional Diver Training - Annual"
- Amount: $250.00 (25000 cents)
- Interval: Yearly (1 year)

### Step 3: Environment Variables

Add to your `.env` file:

```bash
# Revolut API Configuration
REVOLUT_API_KEY=your_revolut_api_key_here
REVOLUT_MERCHANT_ID=your_merchant_id
REVOLUT_WEBHOOK_SECRET=your_webhook_secret

# Subscription Plan IDs (created after first run)
REVOLUT_MONTHLY_PLAN_ID=plan_xxxxx
REVOLUT_ANNUAL_PLAN_ID=plan_xxxxx
```

### Step 4: Update Payment Links in Code

Instead of hardcoded payment links, the system will:
1. Create subscription orders via API
2. Generate checkout URLs dynamically
3. Handle subscription creation after payment

### Step 5: Set Up Webhooks

1. In Revolut dashboard, configure webhook endpoint:
   - URL: `https://your-domain.com/api/revolut/webhook`
   - Events: `ORDER_COMPLETED`, `SUBSCRIPTION_RENEWED`, `SUBSCRIPTION_CANCELLED`

2. The webhook handler will:
   - Update subscription status in database
   - Extend subscription expiration dates
   - Handle cancellations

---

## Option 2: Hybrid Approach (Using Existing Payment Links)

If you want to use the payment links you already have:

### Implementation

1. **Track Subscription Expiration Dates**
   - Store `subscriptionDate` when user first pays
   - Calculate expiration: `subscriptionDate + 30 days` (monthly) or `+ 365 days` (annual)

2. **Show Renewal Reminders**
   - When subscription expires or is close to expiring
   - Show "Renew Subscription" button
   - Link to same payment link

3. **Handle Renewal Payments**
   - User clicks payment link again
   - On successful payment, update `subscriptionDate` to current date
   - Extend expiration date accordingly

### Code Changes Needed

Update the payment flow to:
1. Detect if user already has subscription
2. If renewing, update `subscriptionDate` instead of creating new subscription
3. Send renewal confirmation email

---

## Recommended: Start with Option 2, Migrate to Option 1

**Why?**
- Option 2 gets you running immediately
- Option 1 requires API setup and testing
- You can migrate later when API is ready

---

## Implementation Status

✅ **Created**: `server/revolut-subscriptions.ts` - Full API integration service
⏳ **Next Steps**: 
1. Add webhook route handler
2. Update payment link generation
3. Integrate with user management

---

## API Endpoints Created

### Create Subscription Plans
```typescript
const revolutService = getRevolutSubscriptionService();
const { monthlyPlanId, annualPlanId } = await revolutService.getOrCreateSubscriptionPlans();
```

### Create Subscription Checkout
```typescript
const checkout = await revolutService.createSubscriptionOrder({
  planId: monthlyPlanId,
  customerEmail: 'user@example.com',
  customerName: 'John Doe',
  successUrl: 'https://your-domain.com/success',
  cancelUrl: 'https://your-domain.com/cancel'
});

// Redirect user to checkout.checkoutUrl
```

### Handle Webhooks
```typescript
app.post('/api/revolut/webhook', async (req, res) => {
  const revolutService = getRevolutSubscriptionService();
  await revolutService.handleWebhook(req.body);
  res.json({ received: true });
});
```

---

## Testing

### Test Subscription Flow

1. Create subscription plan (one-time setup)
2. Create subscription order
3. Complete payment via checkout URL
4. Verify webhook received
5. Check subscription created in Revolut dashboard
6. Verify user subscription updated in your database

### Test Renewal

1. Wait for subscription renewal (or use test mode)
2. Verify webhook received
3. Check subscription expiration extended in database

---

## Support Resources

- **Revolut Developer Docs**: https://developer.revolut.com/docs/merchant/
- **Subscription Management**: https://developer.revolut.com/docs/guides/accept-payments/tutorials/save-and-charge-payment-methods/subscription-management
- **Webhook Guide**: https://developer.revolut.com/docs/merchant/webhooks

---

## Next Steps

1. **Decide on approach**: Option 1 (API) or Option 2 (Payment Links + Manual)
2. **If Option 1**: Get API credentials and set up webhooks
3. **If Option 2**: Update payment processing to handle renewals
4. **Test thoroughly** before going live

Let me know which approach you prefer and I can implement it!






