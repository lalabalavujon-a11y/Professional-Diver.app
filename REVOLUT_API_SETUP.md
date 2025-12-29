# Revolut Merchant API Setup Guide

## Quick Start with Your API Key

### Step 1: Add API Key to Environment Variables

Add to your `.env` file:

```bash
# Revolut Merchant API
REVOLUT_API_KEY=your_merchant_api_key_here
REVOLUT_MERCHANT_ID=your_merchant_id_here  # Optional but recommended
REVOLUT_WEBHOOK_SECRET=your_webhook_secret_here  # For webhook signature verification
```

### Step 2: Create Subscription Plans

The system will automatically create subscription plans when first run, OR you can create them manually:

**Option A: Automatic Creation (Recommended)**
- The service will create plans on first API call
- Plan IDs will be logged to console
- Save them to environment variables for future use

**Option B: Manual Creation via API**
- Use the `createSubscriptionPlan()` method
- Store plan IDs in environment variables

### Step 3: Get Plan IDs

After plans are created, add to `.env`:

```bash
REVOLUT_MONTHLY_PLAN_ID=plan_xxxxx
REVOLUT_ANNUAL_PLAN_ID=plan_xxxxx
```

### Step 4: Update Payment Flow

Instead of hardcoded payment links, the system will:
1. Create subscription orders via API
2. Generate dynamic checkout URLs
3. Handle subscription creation automatically

---

## API Endpoints

### Create Subscription Checkout

**Endpoint:** `POST /api/revolut/create-subscription`

**Request:**
```json
{
  "subscriptionType": "MONTHLY" | "ANNUAL",
  "customerEmail": "user@example.com",
  "customerName": "John Doe",
  "successUrl": "https://your-domain.com/success",
  "cancelUrl": "https://your-domain.com/cancel"
}
```

**Response:**
```json
{
  "checkoutUrl": "https://checkout.revolut.com/pay/xxx",
  "orderId": "order_xxx",
  "publicId": "xxx"
}
```

### Webhook Endpoint

**Endpoint:** `POST /api/revolut/webhook`

Already implemented - handles:
- Order completion
- Subscription creation
- Subscription renewals
- Payment captures

---

## Next Steps

1. ✅ Add API key to `.env`
2. ⏳ Test API connection
3. ⏳ Create subscription plans
4. ⏳ Update frontend to use API endpoints
5. ⏳ Set up webhook in Revolut dashboard






