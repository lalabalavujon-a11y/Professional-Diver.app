# Revolut Merchant API Key Setup - Quick Guide

## ✅ You Have Your API Key - Here's What to Do Next

### Step 1: Add API Key to Environment

Add to your `.env` file (or `.env.local`):

```bash
# Revolut Merchant API
REVOLUT_API_KEY=your_merchant_api_key_here
REVOLUT_MERCHANT_ID=your_merchant_id_here  # Optional but recommended
REVOLUT_WEBHOOK_SECRET=your_webhook_secret_here  # For webhook verification (get after setting up webhook)
```

**⚠️ SECURITY NOTE**: Never commit API keys to git! Always keep them in `.env.local` which is in `.gitignore`.

### Step 2: Restart Your Server

The Revolut subscription service will initialize automatically when the server starts.

```bash
# Stop current server
# Then restart
pnpm run dev:api
# or
node --import tsx/esm server/index.ts
```

You should see in the console:
```
✅ Revolut subscription service initialized
```

### Step 3: Create Subscription Plans (Automatic)

On first use, the system will automatically create subscription plans:

- **Monthly Plan**: $25/month
- **Annual Plan**: $250/year

**Plan IDs will be logged to console**. Save them to `.env`:

```bash
REVOLUT_MONTHLY_PLAN_ID=plan_xxxxx
REVOLUT_ANNUAL_PLAN_ID=plan_xxxxx
```

This prevents creating duplicate plans on subsequent runs.

### Step 4: Set Up Webhook (Important!)

1. **In Revolut Business Dashboard:**
   - Go to **Settings → Webhooks** or **Developer → Webhooks**
   - Click **Add Webhook**
   - **Webhook URL**: `https://your-domain.com/api/revolut/payment-webhook`
   - **Events to Subscribe:**
     - `ORDER_COMPLETED`
     - `PAYMENT_CAPTURED`
     - `SUBSCRIPTION_RENEWED` (if available)
     - `SUBSCRIPTION_CANCELLED` (if available)

2. **Copy Webhook Secret** (if provided)
   - Add to `.env`: `REVOLUT_WEBHOOK_SECRET=your_secret_here`

### Step 5: Test the Flow

1. **Test API Endpoint:**
```bash
curl -X POST http://localhost:5000/api/revolut/create-subscription-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionType": "MONTHLY",
    "customerEmail": "test@example.com",
    "customerName": "Test User"
  }'
```

2. **Expected Response:**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.revolut.com/pay/xxx",
  "orderId": "order_xxx",
  "publicId": "xxx",
  "subscriptionType": "MONTHLY"
}
```

3. **Test in Browser:**
   - Open the app
   - Go to a page with upgrade buttons (like dashboard)
   - Click "Subscribe Monthly" or "Subscribe Yearly"
   - Should redirect to Revolut checkout

### Step 6: Verify Webhook Works

After a test payment:
1. Check server logs for webhook receipt
2. Verify user subscription updated in database
3. Check expiration date is set correctly

---

## 🎯 How It Works Now

### **For Authenticated Users** (Trial Countdown Component)
- ✅ Uses API to create subscription checkout
- ✅ Includes user email in checkout
- ✅ Falls back to direct links if API unavailable

### **For Public Users** (Landing Page)
- ✅ Uses direct payment links (no API needed)
- ✅ Simple and fast for new visitors

### **Payment Processing**
- ✅ Webhook receives payment notification
- ✅ System updates user subscription
- ✅ Handles renewals (extends expiration)
- ✅ Tracks affiliate conversions

---

## 🔍 Troubleshooting

### **"Revolut subscription service not configured"**
- Check `REVOLUT_API_KEY` is set in `.env`
- Restart server after adding API key

### **"Failed to create subscription plan"**
- Check API key is valid
- Verify API key has correct permissions
- Check Revolut API status

### **Webhook not receiving events**
- Verify webhook URL is publicly accessible
- Check webhook is enabled in Revolut dashboard
- Verify webhook events are subscribed
- Check server logs for errors

### **Subscription not updating after payment**
- Check webhook is configured correctly
- Verify webhook endpoint is receiving requests
- Check server logs for webhook processing errors
- Verify user email matches payment email

---

## 📋 API Endpoints

### Create Subscription Checkout
**POST** `/api/revolut/create-subscription-checkout`

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
  "success": true,
  "checkoutUrl": "https://checkout.revolut.com/pay/xxx",
  "orderId": "order_xxx",
  "publicId": "xxx",
  "subscriptionType": "MONTHLY"
}
```

### Payment Webhook
**POST** `/api/revolut/payment-webhook`

Receives payment notifications from Revolut and updates subscriptions automatically.

---

## ✅ Next Steps

1. ✅ Add API key to `.env`
2. ✅ Restart server
3. ⏳ Test checkout creation
4. ⏳ Set up webhook in Revolut dashboard
5. ⏳ Test full payment flow
6. ⏳ Verify subscription updates

**You're all set!** The system is ready to use your Revolut Merchant API key for true recurring subscriptions! 🚀

