# Stripe Connect Testing Guide

This guide walks you through testing the complete Stripe Connect integration in test mode.

## Prerequisites

1. **Stripe Test Account**
   - Sign up at https://stripe.com (or use existing account)
   - Get your test API keys from https://dashboard.stripe.com/test/apikeys
   - You'll need:
     - Secret key (starts with `sk_test_`)
     - Publishable key (starts with `pk_test_`)

2. **Environment Setup**
   - Add to `.env.local`:
     ```env
     STRIPE_SECRET_KEY=sk_test_your_test_secret_key_here
     STRIPE_PUBLISHABLE_KEY=pk_test_your_test_publishable_key_here
     STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
     ```

3. **Database Setup**
   - Ensure migrations are applied: `npm run db:push`
   - Database should be running (SQLite for dev, PostgreSQL for production)

4. **Server Running**
   - Start API server: `npm run dev:api`
   - Start frontend: `npm run dev:web`

## Testing Methods

### Method 0: Quick Setup Verification

First, verify your Stripe setup is configured correctly:

```bash
npm run verify:stripe
```

This will:
- ✅ Check environment variables are set
- ✅ Verify API keys are valid
- ✅ Test Stripe API connectivity
- ✅ Create a test Connect account

### Method 1: Automated Test Script

Run the automated test script:

```bash
npm run test:stripe-connect
```

Or directly:

```bash
tsx scripts/test-stripe-connect.ts
```

This script will:
- ✅ Create a Stripe Connect account
- ✅ Generate an onboarding link
- ✅ Check account status
- ✅ Create and link an affiliate
- ✅ Process a test commission
- ✅ Validate payout eligibility
- ✅ Test transfer (if account is ready)

### Method 2: Manual UI Testing

1. **Start the Application**
   ```bash
   npm run dev:all
   ```

2. **Access Affiliate Dashboard**
   - Navigate to: http://127.0.0.1:3000/affiliate-dashboard
   - Or: http://127.0.0.1:3000/affiliate

3. **Set Up Payment Method**
   - Scroll to "Payment Settings" section
   - Select "Stripe Connect" option
   - Click "Set Up Stripe Connect"

4. **Complete Onboarding**
   - You'll be redirected to Stripe's hosted onboarding page
   - Use Stripe test data:
     - **Email**: Use any test email
     - **Phone**: Use test number: +1 (555) 555-5555
     - **Business Type**: Individual or Company
     - **Bank Account**: Use test account number: `000123456789`
     - **Routing Number**: Use test routing: `110000000`
     - **SSN**: Use test SSN: `000-00-0000`
   
   See full test data: https://stripe.com/docs/connect/testing

5. **Return to Application**
   - After completing onboarding, you'll be redirected back
   - Status should update to "Connected"

6. **Test Commission Processing**
   - Create a test referral (via API or UI)
   - Check that commission is calculated correctly
   - Verify it appears in the dashboard

7. **Test Payout**
   - Ensure minimum threshold is met ($50)
   - Manually trigger payout (via admin or API)
   - Check transfer status

### Method 3: API Testing

Use curl or Postman to test the API endpoints:

#### 1. Initiate Onboarding
```bash
curl -X POST http://localhost:5000/api/affiliate/stripe-connect/onboard \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "userId": "test-user-123",
    "returnUrl": "http://localhost:3000/affiliate/stripe-onboard?return=true"
  }'
```

#### 2. Check Status
```bash
curl "http://localhost:5000/api/affiliate/stripe-connect/status?email=test@example.com"
```

#### 3. Get Payment Methods
```bash
curl "http://localhost:5000/api/affiliate/payment-methods?email=test@example.com"
```

#### 4. Update Payment Method
```bash
curl -X PUT http://localhost:5000/api/affiliate/payment-method \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "preferredMethod": "STRIPE_CONNECT"
  }'
```

#### 5. Check Payout Eligibility
```bash
curl "http://localhost:5000/api/affiliate/payout-eligibility?email=test@example.com"
```

## Webhook Testing

### Using Stripe CLI (Recommended)

1. **Install Stripe CLI**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**
   ```bash
   stripe login
   ```

3. **Forward Webhooks to Local Server**
   ```bash
   stripe listen --forward-to localhost:5000/api/webhooks/stripe
   ```
   
   This will give you a webhook signing secret (starts with `whsec_`)

4. **Trigger Test Events**
   ```bash
   # Test account.updated event
   stripe trigger account.updated
   
   # Test transfer.created event
   stripe trigger transfer.created
   
   # Test transfer.paid event
   stripe trigger transfer.paid
   ```

### Using Stripe Dashboard

1. Go to https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://your-domain.com/api/webhooks/stripe`
4. Select events:
   - `account.updated`
   - `transfer.created`
   - `transfer.paid`
   - `transfer.failed`
5. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Test Scenarios

### Scenario 1: Complete Onboarding Flow

1. ✅ Create affiliate account
2. ✅ Initiate Stripe Connect onboarding
3. ✅ Complete onboarding with test data
4. ✅ Verify account status updates
5. ✅ Confirm payout eligibility

### Scenario 2: Commission and Payout

1. ✅ Process test referral
2. ✅ Verify commission calculation (50%)
3. ✅ Check monthly earnings update
4. ✅ Trigger payout when threshold met
5. ✅ Verify transfer creation
6. ✅ Check payment status update

### Scenario 3: Payment Method Switching

1. ✅ Set up Stripe Connect
2. ✅ Switch to PayPal
3. ✅ Switch back to Stripe Connect
4. ✅ Verify preference persists

### Scenario 4: Error Handling

1. ✅ Test with invalid account ID
2. ✅ Test transfer to incomplete account
3. ✅ Test webhook signature verification
4. ✅ Test payout below threshold

## Stripe Test Data

### Bank Account (US)
- **Account Number**: `000123456789`
- **Routing Number**: `110000000`
- **Account Type**: Checking

### Credit Card
- **Number**: `4242 4242 4242 4242`
- **Expiry**: Any future date
- **CVC**: Any 3 digits
- **ZIP**: Any 5 digits

### Business Information
- **EIN**: `12-3456789`
- **SSN**: `000-00-0000`
- **Phone**: `+1 (555) 555-5555`

Full test data reference: https://stripe.com/docs/connect/testing

## Verification Checklist

After testing, verify:

- [ ] Connect account created successfully
- [ ] Onboarding link works and redirects properly
- [ ] Account status updates after onboarding
- [ ] Affiliate record linked to Stripe account
- [ ] Commission calculations are correct (50%)
- [ ] Payout eligibility checks work
- [ ] Transfers are created successfully
- [ ] Webhooks update payment status
- [ ] Payment method selection persists
- [ ] UI displays correct status badges
- [ ] Error handling works for edge cases

## Troubleshooting

### Issue: "STRIPE_SECRET_KEY environment variable is required"
**Solution**: Ensure `.env.local` has `STRIPE_SECRET_KEY` set with your test key

### Issue: "Invalid webhook signature"
**Solution**: 
- Use Stripe CLI to get correct webhook secret
- Or copy from Stripe Dashboard webhook settings
- Ensure `STRIPE_WEBHOOK_SECRET` is set correctly

### Issue: "Account not ready for payouts"
**Solution**: 
- Complete full onboarding process
- Ensure all required fields are filled
- Check account status in Stripe Dashboard

### Issue: "Transfer failed"
**Solution**:
- Verify account has completed onboarding
- Check account has valid bank account
- Ensure sufficient balance in platform account
- Review Stripe Dashboard for error details

## Next Steps

Once testing is complete:

1. **Production Setup**
   - Switch to live Stripe keys (starts with `sk_live_`)
   - Update webhook endpoint to production URL
   - Test with real accounts (small amounts first)

2. **Monitor**
   - Set up alerts in Stripe Dashboard
   - Monitor payout logs
   - Track failed transfers

3. **Documentation**
   - Update affiliate documentation
   - Create user guides
   - Document payout schedule

## Support

- Stripe Documentation: https://stripe.com/docs/connect
- Stripe Testing Guide: https://stripe.com/docs/connect/testing
- Stripe Support: https://support.stripe.com
