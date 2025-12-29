# ✅ Revolut API Key Setup - Complete!

## Configuration Status

Your Revolut Merchant API key has been added to `.env.local`:

```bash
REVOLUT_API_KEY=sk_TTVshlxlLM4OpVy3CGwTGrEuh0uroyB3G8hACb0_Np5CU1rsEP3EhWZJ-Yujm6Uz
```

## Next Steps

### 1. **Restart Your Server**

The Revolut subscription service will initialize automatically:

```bash
# Stop current server (if running)
# Then restart
pnpm run dev:api
# or
node --import tsx/esm server/index.ts
```

**Look for this in console:**
```
✅ Revolut subscription service initialized
```

### 2. **Test the API Connection**

Try creating a test subscription checkout:

```bash
curl -X POST http://localhost:5000/api/revolut/create-subscription-checkout \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionType": "MONTHLY",
    "customerEmail": "test@example.com",
    "customerName": "Test User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "checkoutUrl": "https://checkout.revolut.com/pay/xxx",
  "orderId": "order_xxx",
  "publicId": "xxx",
  "subscriptionType": "MONTHLY"
}
```

### 3. **Check Subscription Plans Creation**

On first API call, the system will create subscription plans:
- **Monthly Plan**: $25/month
- **Annual Plan**: $250/year

**Plan IDs will be logged to console.** Save them to `.env.local`:

```bash
REVOLUT_MONTHLY_PLAN_ID=plan_xxxxx
REVOLUT_ANNUAL_PLAN_ID=plan_xxxxx
```

### 4. **Set Up Webhook** (After Testing)

1. In **Revolut Business Dashboard** → **Settings → Webhooks**
2. Add webhook:
   - **URL**: `https://your-domain.com/api/revolut/payment-webhook`
   - **Events**: `ORDER_COMPLETED`, `PAYMENT_CAPTURED`
3. Copy webhook secret → Add to `.env.local`:
   ```bash
   REVOLUT_WEBHOOK_SECRET=your_secret_here
   ```

## How to Use

### **For Authenticated Users**
When users click "Subscribe" buttons in the app:
- System calls API to create checkout
- Redirects to Revolut checkout page
- After payment, webhook updates subscription

### **For Public Users (Landing Page)**
- Uses direct payment links (simpler for new visitors)
- Still works with webhook for subscription updates

## Testing Checklist

- [ ] Server restarts successfully
- [ ] See "Revolut subscription service initialized" in logs
- [ ] Can create subscription checkout via API
- [ ] Subscription plans created (check logs for plan IDs)
- [ ] Webhook endpoint accessible
- [ ] Test payment completes successfully
- [ ] User subscription updates after payment

## Troubleshooting

**"Revolut subscription service not configured"**
- ✅ API key is in `.env.local` - check file exists
- Restart server after adding key
- Check console for initialization message

**"Failed to create subscription plan"**
- Verify API key is correct
- Check API key has required permissions
- Check Revolut API status

**Webhook not working**
- Verify webhook URL is publicly accessible
- Check webhook is enabled in Revolut dashboard
- Verify events are subscribed
- Check server logs for errors

## Security Reminders

✅ **API key is in `.env.local`** (not committed to git)
✅ **`.env.local` is in `.gitignore`** (safe from commits)
❌ **Don't share API key publicly**
❌ **Don't commit API keys to git**

---

**You're all set!** 🚀

Your Revolut Merchant API is configured and ready to use for true recurring subscriptions!






