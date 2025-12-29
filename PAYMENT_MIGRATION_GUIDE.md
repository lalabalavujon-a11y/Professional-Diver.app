# Payment Migration Guide: Stripe to Revolut Business

## Current Situation

- **Stripe Account**: Inaccessible due to deleted Google Workspace email (`jon@jonlalabalavu.com`)
- **New Payment Provider**: Revolut Business Account (LEAD RECON LTD)
- **Affiliate System**: Currently configured for Stripe Connect payouts

---

## Solution Options

### Option 1: Recover Stripe Account (Recommended for Affiliate Payouts)

**Steps to Recover Stripe Access:**

1. **Contact Stripe Support**
   - Visit: https://support.stripe.com/contact/email
   - Explain: Google Workspace email deleted, need to update account email
   - Provide verification:
     - Full name: Jon Lalabalavu
     - Business name: LEAD RECON LTD
     - Last 4 digits of bank account linked to Stripe
     - Recent transaction amounts/dates
     - Business registration details

2. **Request Email Update**
   - Once verified, request email change to: `[your-new-email]@leadrecon.com` or personal email
   - Update all API keys and webhook endpoints

3. **Hybrid Approach** (Best Solution)
   - **Customer Payments**: Use Revolut Business for new subscriptions
   - **Affiliate Payouts**: Keep Stripe Connect for automated affiliate commission payments
   - This maintains automated affiliate payouts while using Revolut for customer payments

---

### Option 2: Full Migration to Revolut Business

**For Customer Payments:**
- ✅ Revolut Business supports subscription products
- ✅ Can create payment links similar to Stripe
- ✅ Lower fees than Stripe in many cases
- ⚠️ Requires Revolut Business API integration

**For Affiliate Payouts:**
- ❌ Revolut doesn't have automated affiliate payout system (like Stripe Connect)
- ✅ Can use **PayPal** for affiliate payouts (already implemented)
- ✅ Can use **Bank Transfer** via Revolut (manual or automated via API)
- ✅ System already supports `BANK_TRANSFER` payment method

---

## Recommended Solution: Hybrid Approach

### Customer Payments → Revolut Business
- Create products in Revolut Business dashboard
- Generate payment links for monthly/annual subscriptions
- Update landing page to use Revolut payment links

### Affiliate Payouts → Multiple Options
1. **Stripe Connect** (if account recovered) - Automated, instant
2. **PayPal** (already implemented) - Automated, instant
3. **Bank Transfer via Revolut** (new implementation) - Automated via Revolut API

---

## Implementation Steps

### Step 1: Set Up Revolut Business Products

1. Log into Revolut Business dashboard
2. Navigate to **Products** or **Payment Links**
3. Create products:
   - **Professional Diver App - Monthly**: $25/month
   - **Professional Diver App - Annual**: $250/year
4. Generate payment links for each product
5. Save the payment link URLs

### Step 2: Update Payment Links in Code

Replace Stripe payment links with Revolut payment links:
- Monthly: `https://buy.stripe.com/8x24gzg9S2gG7WX4XugMw03` → Revolut link
- Annual: `https://buy.stripe.com/eVq8wP1eY2gG4KLblSgMw04` → Revolut link

### Step 3: Configure Affiliate Payouts

**Option A: Keep Stripe for Affiliate Payouts Only**
- Recover Stripe account
- Use Stripe Connect for automated affiliate payouts
- Customer payments go through Revolut

**Option B: Use PayPal for Affiliate Payouts**
- Already implemented in code
- Configure PayPal API credentials
- Affiliates receive payments via PayPal

**Option C: Use Bank Transfer via Revolut**
- Implement Revolut API for bank transfers
- Affiliates provide bank details
- Automated transfers via Revolut Business API

---

## Affiliate Payout Impact Analysis

### Current System Capabilities

The system already supports multiple payout methods:
- ✅ **Stripe Connect** - Automated transfers to affiliate Stripe accounts
- ✅ **PayPal** - Automated PayPal payouts
- ✅ **Bank Transfer** - Schema supports it, needs implementation

### Recommended Affiliate Payout Strategy

1. **Primary**: PayPal (already implemented, no Stripe needed)
2. **Secondary**: Bank Transfer via Revolut (for affiliates who prefer direct bank deposits)
3. **Tertiary**: Stripe Connect (if account recovered, for affiliates with Stripe accounts)

### Affiliate Experience

- Affiliates can choose their preferred payout method
- System tracks all payouts regardless of method
- GHL integration syncs payout data
- Analytics track all payout methods

---

## Next Steps

1. **Immediate**: Contact Stripe support to recover account
2. **Short-term**: Set up Revolut Business products and payment links
3. **Medium-term**: Update code to use Revolut payment links
4. **Long-term**: Implement Revolut bank transfer API for affiliate payouts (optional)

---

## Code Changes Required

1. ✅ Update payment links in `client/src/pages/landing.tsx`
2. ✅ Update payment links in `client/src/components/trial-countdown.tsx`
3. ✅ Add Revolut payment webhook handler (if using webhooks)
4. ✅ Implement bank transfer payout method in `server/affiliate-integrations.ts`
5. ✅ Update environment variables documentation

---

## Environment Variables

### Current Stripe Variables (Keep for Affiliate Payouts)
```bash
STRIPE_SECRET_KEY=sk_live_...  # Only needed if using Stripe for affiliate payouts
STRIPE_WEBHOOK_SECRET=whsec_...  # Only needed if using Stripe webhooks
```

### New Revolut Variables (For Customer Payments)
```bash
REVOLUT_API_KEY=your_revolut_api_key
REVOLUT_WEBHOOK_SECRET=your_revolut_webhook_secret
REVOLUT_MERCHANT_ID=your_revolut_merchant_id
```

### PayPal Variables (For Affiliate Payouts)
```bash
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_SANDBOX=false  # Set to true for testing
```

---

## FAQ

**Q: Can I use Revolut for both customer payments and affiliate payouts?**
A: Yes, but affiliate payouts would need to be manual bank transfers or automated via Revolut API (requires implementation). PayPal is easier for automated affiliate payouts.

**Q: What happens to existing Stripe subscriptions?**
A: Existing subscriptions will continue to work. New subscriptions will use Revolut. You can migrate existing customers gradually.

**Q: Will affiliate tracking still work?**
A: Yes! The affiliate tracking system is independent of payment provider. It tracks referrals regardless of payment method.

**Q: How do affiliates get paid if we use Revolut?**
A: Three options:
1. PayPal (automated, already implemented)
2. Bank Transfer via Revolut (automated, needs implementation)
3. Stripe Connect (if account recovered, automated)

---

## Support Contacts

- **Stripe Support**: https://support.stripe.com/contact/email
- **Revolut Business Support**: Available in Revolut Business dashboard
- **PayPal Developer Support**: https://developer.paypal.com/support/






