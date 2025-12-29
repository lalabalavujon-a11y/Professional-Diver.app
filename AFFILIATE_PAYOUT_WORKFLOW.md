# Affiliate Payout Workflow - Complete Guide
## Professional Diver Training Platform

---

## 💰 **Affiliate Payout System Overview**

Your platform includes a comprehensive affiliate payout system with multiple payment methods and automated processing.

---

## 🎯 **Commission Structure**

### **Standard Commission Rate:**
- **50% commission** on all referrals
- **Monthly Subscription:** $25 → $12.50 commission per referral
- **Yearly Subscription:** $250 → $125 commission per referral

### **Commission Calculation:**
- Commission is calculated when a referred customer purchases a subscription
- Commission is tracked in real-time
- Earnings accumulate until payout threshold is met

---

## 💳 **Payout Methods Available**

### **1. Stripe Connect Payouts**
- **Method:** Automated transfers to affiliate Stripe accounts
- **Speed:** Instant to 2 business days
- **Minimum:** $50
- **Setup:** Affiliate needs Stripe Connect account

### **2. PayPal Payouts**
- **Method:** Automated PayPal transfers
- **Speed:** Instant to 1 business day
- **Minimum:** $50
- **Setup:** Affiliate needs PayPal account

### **3. Revolut Bank Transfer**
- **Method:** Automated bank transfers via Revolut Business API
- **Speed:** 1-3 business days
- **Minimum:** $50
- **Setup:** Requires Revolut Business API access

### **4. Manual Bank Transfer**
- **Method:** Manual bank transfer instructions generated
- **Speed:** Manual processing (1-5 business days)
- **Minimum:** $50
- **Setup:** Bank account details required

---

## 📊 **Payout Workflow**

### **Step 1: Commission Accumulation**

```
Referral Conversion
    │
    ├─→ Customer purchases subscription
    ├─→ Commission calculated (50% of subscription value)
    ├─→ Commission added to affiliate earnings
    └─→ GHL contact updated with new earnings
```

**Commission Tracking:**
- `totalEarnings`: Lifetime total commission earned
- `monthlyEarnings`: Current month's commission
- `pendingCommissions`: Amount ready for payout

---

### **Step 2: Payout Threshold Check**

**Minimum Payout:** $50.00

**Automated Check:**
- System checks affiliate earnings monthly
- If `pendingCommissions >= $50`, affiliate is eligible for payout
- Payout scheduled based on payout schedule

**Payout Schedules:**
- **Standard Affiliates:** Monthly (1st of each month)
- **Premium Partners:** Bi-weekly (every 2 weeks)
- **Elite Ambassadors:** Weekly
- **Strategic Partners:** Real-time (on-demand)

---

### **Step 3: Payout Processing**

#### **Automated Payout (Recommended)**

**Trigger:** Monthly payout schedule (1st of month)

**Process:**
1. System calculates all eligible affiliates
2. For each affiliate with `pendingCommissions >= $50`:
   - Check preferred payout method
   - Process payout via selected method
   - Record payout in system
   - Sync to GHL
   - Send confirmation email

**API Endpoint:**
```bash
POST /api/affiliate/schedule-payouts
```

**Manual Trigger:**
- Admin can trigger payouts manually
- Individual affiliate payouts can be processed on-demand

---

#### **Manual Payout Processing**

**Stripe Payout:**
```bash
POST /api/affiliate/payout/stripe
Content-Type: application/json

{
  "affiliateId": "affiliate_123",
  "affiliateEmail": "partner@example.com",
  "amount": 12500,  // $125.00 in cents
  "currency": "USD",
  "description": "Commission payout for January 2024"
}
```

**PayPal Payout:**
```bash
POST /api/affiliate/payout/paypal
Content-Type: application/json

{
  "affiliateId": "affiliate_123",
  "affiliateEmail": "partner@example.com",
  "amount": 12500,  // $125.00 in cents
  "currency": "USD",
  "description": "Commission payout for January 2024"
}
```

**Bank Transfer Payout:**
```bash
POST /api/affiliate/payout/bank-transfer
Content-Type: application/json

{
  "affiliateId": "affiliate_123",
  "affiliateEmail": "partner@example.com",
  "amount": 12500,  // $125.00 in cents
  "currency": "USD",
  "description": "Commission payout for January 2024",
  "bankDetails": {
    "accountNumber": "12345678",
    "sortCode": "12-34-56",
    "iban": "GB82WEST12345698765432",
    "swift": "WESTGB22",
    "accountHolderName": "John Doe",
    "bankName": "HSBC"
  },
  "useRevolut": true  // Use Revolut API if available
}
```

---

### **Step 4: Payout Confirmation & Tracking**

**After Payout Processing:**

1. **System Records:**
   - Payout ID
   - Amount
   - Payment method
   - Status (pending/completed/failed)
   - Processing date

2. **GHL Sync:**
   - Tags added: `Commission Paid`, `Payout: $XXX.XX`
   - Custom fields updated:
     - `lastPayoutAmount`: Amount of last payout
     - `lastPayoutDate`: Date of last payout
     - `totalPayouts`: Lifetime total payouts

3. **Email Notification:**
   - Confirmation email sent to affiliate
   - Includes payout details
   - Payment method confirmation

---

## 🔄 **GHL Integration for Payouts**

### **GHL Workflow: Commission Payout**

**Trigger:** Payout processed

**Actions:**

1. **Update Contact:**
   - Add tags: `Commission Paid`, `Payout: $XXX.XX`
   - Update custom fields:
     - `lastPayoutAmount`
     - `lastPayoutDate`
     - `totalPayouts`

2. **Create Note:**
   - Add note with payout details
   - Include payment method
   - Include payout reference

3. **Update Opportunity:**
   - Update affiliate opportunity value
   - Track cumulative earnings

---

## 📋 **Payout Status Tracking**

### **Payout Statuses:**

| Status | Description |
|--------|-------------|
| **PENDING** | Payout scheduled, awaiting processing |
| **PROCESSING** | Payout in progress |
| **COMPLETED** | Payout successfully processed |
| **FAILED** | Payout failed (requires manual intervention) |
| **PENDING_MANUAL** | Manual bank transfer instructions generated |

---

## 🎯 **Payout Workflow for GHL**

### **GHL Automation: Commission Payout Notification**

**Trigger:** Tag added `Commission Paid`

**Actions:**

1. **Immediate:**
   - Send payout confirmation email
   - Add tag: `Payout Confirmed`
   - Update custom field: `lastPayoutDate`

2. **After 1 day:**
   - Send thank you email
   - Request feedback
   - Add tag: `Payout Thank You Sent`

3. **After 7 days:**
   - Check for new referrals
   - Send performance update
   - Add tag: `Performance Update Sent`

---

## 📊 **Payout Reporting**

### **Affiliate Dashboard:**
- View total earnings
- View pending commissions
- View payout history
- Track payout status

### **Admin/CRM Dashboard:**
- View all affiliate payouts
- Filter by status
- Export payout reports
- Track payout costs

---

## 🔧 **Setup Instructions**

### **1. Stripe Connect Setup**

**For Automated Stripe Payouts:**

1. **Enable Stripe Connect** in Stripe dashboard
2. **Create Connect accounts** for affiliates:
   - Affiliates can onboard via Stripe Connect
   - Or you can create accounts manually
3. **Set up webhooks:**
   - `transfer.created` - Track successful payouts
   - `transfer.failed` - Handle failed payouts
4. **Environment Variables:**
   ```bash
   STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

---

### **2. PayPal Setup**

**For Automated PayPal Payouts:**

1. **Create PayPal Business account**
2. **Enable PayPal Payouts API**
3. **Get API credentials** from PayPal Developer
4. **Set up webhook endpoints** for payout confirmations
5. **Environment Variables:**
   ```bash
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_SANDBOX=false  # Set to true for testing
   ```

---

### **3. Revolut Bank Transfer Setup**

**For Automated Bank Transfers:**

1. **Revolut Business API access** required
2. **Get API key** from Revolut Business dashboard
3. **Set up merchant account**
4. **Environment Variables:**
   ```bash
   REVOLUT_API_KEY=your_revolut_api_key
   REVOLUT_MERCHANT_ID=your_merchant_id
   REVOLUT_WEBHOOK_SECRET=your_webhook_secret
   ```

---

## 📅 **Payout Schedule Configuration**

### **Automated Monthly Payouts**

**Schedule:** 1st of each month at 9:00 AM UTC

**Process:**
1. Calculate all eligible affiliates
2. Process payouts for affiliates with `pendingCommissions >= $50`
3. Use affiliate's preferred payout method
4. Record all payouts
5. Sync to GHL
6. Send confirmation emails

**Manual Trigger:**
```bash
POST /api/affiliate/schedule-payouts
```

---

## 🎯 **Payout Workflow Integration**

### **Complete Payout Flow:**

```
Commission Earned
    │
    ├─→ Added to affiliate earnings
    ├─→ Tracked in system
    ├─→ Synced to GHL (earnings updated)
    │
    ▼
Monthly Payout Check (1st of month)
    │
    ├─→ Calculate pending commissions
    ├─→ Check if >= $50 threshold
    │
    ▼
Eligible for Payout?
    │
    ├─→ YES → Process Payout
    │   ├─→ Stripe / PayPal / Bank Transfer
    │   ├─→ Record payout
    │   ├─→ Sync to GHL
    │   └─→ Send confirmation email
    │
    └─→ NO → Wait for next month
```

---

## 📧 **Payout Email Templates**

### **Payout Confirmation Email:**

```
Subject: Your Commission Payout Has Been Processed! 💰

Hi [AffiliateName],

Great news! Your commission payout has been processed.

Payout Details:
• Amount: $[Amount]
• Payment Method: [Method]
• Payout Date: [Date]
• Reference: [PayoutID]

Your earnings continue to grow! Keep sharing your referral link to earn more.

View Your Dashboard: [Dashboard Link]

Thank you for being an amazing partner!

Best,
The Professional Diver Training Team
```

---

## ✅ **Payout Checklist**

### **For Each Payout:**
- [ ] Verify affiliate has minimum $50 in earnings
- [ ] Confirm payout method is configured
- [ ] Process payout via selected method
- [ ] Record payout in system
- [ ] Sync payout details to GHL
- [ ] Send confirmation email
- [ ] Update affiliate earnings balance

### **Monthly Payout Process:**
- [ ] Run payout calculation
- [ ] Identify eligible affiliates
- [ ] Process all eligible payouts
- [ ] Verify all payouts completed
- [ ] Generate payout report
- [ ] Update GHL with all payouts
- [ ] Send summary email to admin

---

## 🔍 **Troubleshooting**

### **Common Issues:**

**1. Payout Failed:**
- Check payment method configuration
- Verify affiliate payment details
- Review error logs
- Retry payout manually

**2. Payout Not Processing:**
- Check minimum threshold ($50)
- Verify payout schedule
- Check API credentials
- Review system logs

**3. GHL Sync Failed:**
- Verify GHL API key
- Check contact exists in GHL
- Review sync logs
- Retry sync manually

---

## 📈 **Payout Analytics**

### **Key Metrics:**
- Total payouts processed
- Average payout amount
- Payout success rate
- Payout method distribution
- Monthly payout volume
- Affiliate retention rate

### **GHL Tracking:**
- Payout tags applied
- Custom fields updated
- Opportunities created
- Email engagement

---

## 🚀 **Next Steps**

1. **Configure Payment Methods:**
   - Set up Stripe Connect
   - Configure PayPal
   - Set up Revolut (if using)

2. **Set Payout Schedule:**
   - Configure monthly payout date
   - Set minimum threshold
   - Choose default payout method

3. **Test Payout Process:**
   - Process test payout
   - Verify GHL sync
   - Test email notifications

4. **Monitor Performance:**
   - Track payout success rate
   - Monitor affiliate satisfaction
   - Optimize payout schedule

---

**💰 Your affiliate payout system is fully integrated and ready to process commissions!**

All payouts are tracked, synced to GHL, and automated for seamless partner management.





