# Customer Journey Summary - Confirmation Document
## Professional Diver Training Platform

---

## ✅ **Confirmed Customer Journey**

### **1. Ad Click → Landing Page**
- **Entry Point:** Customer clicks advertisement (Google Ads, Facebook, etc.)
- **Landing Page:** `https://professionaldiver.app/`
- **Features:**
  - Hero section with "Start 24-Hour Free Trial" CTA
  - Features showcase
  - Pricing plans displayed ($25/month, $250/year)
- **Tracking:** UTM parameters and referral codes captured

---

### **2. 24-Hour Free Trial Signup**
- **Page:** `/trial-signup`
- **Form Fields:**
  - Name (required)
  - Email (required)
  - Referral code (auto-populated if present)
- **No Credit Card Required**
- **Trial Benefits:**
  - Full access to all commercial diving courses
  - Timed mock exams with detailed explanations
  - AI-powered tutors and instant feedback
  - Voice dictation for written examinations
  - Progress analytics and performance tracking
  - All NDT inspection and emergency protocols
- **Duration:** 24 hours from signup
- **After Signup:** Redirects to dashboard

---

### **3. Trial Experience (24 Hours)**
- **Access:** Full platform access during trial
- **Features Available:**
  - All courses
  - All exam formats
  - AI tutors
  - Voice dictation
  - Analytics
- **Trial Countdown:** Displayed on dashboard
- **Upgrade Prompts:** Non-intrusive upgrade CTAs shown

---

### **4. Subscription Purchase**
- **Trigger:** Customer decides to upgrade (during or after trial)
- **Options:**
  - **Monthly:** $25/month USD
  - **Yearly:** $250/year USD (save 15%)
- **Payment Method:** Revolut Payment Links
  - Monthly: `https://checkout.revolut.com/pay/79436775-0472-4414-a0ca-b5f151db466b`
  - Yearly: `https://checkout.revolut.com/pay/28d2e7d0-4ee7-41ed-bbf1-d2024f9275d8`
- **Purchase Locations:**
  - Landing page pricing section
  - Dashboard upgrade buttons
  - Trial countdown component
- **After Purchase:** Subscription activated, access continues

---

### **5. Active Subscriber**
- **Status:** `ACTIVE`
- **Subscription Type:** `MONTHLY` or `ANNUAL`
- **Access:** Full platform access maintained
- **Features:**
  - All courses
  - All exam formats
  - Progress tracking
  - Analytics dashboard
  - Partner program access

---

### **6. Becoming a Partner**
- **Access:** All users can become partners
- **Entry Point:** 
  - Click "Become a Partner" in navigation
  - Visit `/affiliate` page
- **Automatic Setup:**
  - Affiliate account created automatically
  - Unique affiliate code generated: `PDXXXXXXXX`
  - Referral link created: `https://professionaldiver.app/?ref=PDXXXXXXXX`
- **Partner Benefits:**
  - 50% commission on all referrals
  - Real-time earnings tracking
  - Sub-affiliate management
  - Partner dashboard
- **Commission Structure:**
  - 50% of subscription value
  - Monthly: $12.50 per referral
  - Yearly: $125 per referral

---

## 🔄 **Workflow Systems**

### **GoHighLevel (GHL) Workflow**

**Sub-Account:** `RanYKgzAFnSUqSIKrjOb`

**Pipeline Stages:**
1. **Lead** - New website visitor
2. **Qualified Lead** - Trial signup completed
3. **Enrolled** - Paid subscription active
4. **Graduate** - Course completed
5. **Advocate** - Partner/affiliate

**Automation Workflows:**
- Welcome Sequence (trial signup)
- Trial Conversion Campaign (12h, 20h, 24h)
- Subscription Purchase Confirmation
- Course Completion Celebration
- Partner Onboarding
- Re-engagement Campaign
- High Scorer Recognition
- Referral Conversion Tracking

**Sync Points:**
- Trial signup → Contact created/updated
- Subscription purchase → Opportunity created
- Course enrollment → Tags updated
- Course completion → Tags + custom fields updated
- Partner creation → Tags + custom fields updated

**See:** `GHL_WORKFLOW_IMPORT.md` for detailed workflow configurations

---

### **Local CRM Workflow**

**Access:** `/crm` (Admin/Partner Admin roles)

**Features:**
- Client management (view, edit, add notes)
- Subscription management (view, update status)
- Analytics dashboard
- Partner management
- Filtering and search

**Client Stages:**
1. **New Lead** - Status: `ACTIVE`, Subscription: `TRIAL`
2. **Active Trial** - Status: `ACTIVE`, Subscription: `TRIAL`
3. **Converted Subscriber** - Status: `ACTIVE`, Subscription: `MONTHLY` or `ANNUAL`
4. **Partner** - Has affiliate code

**See:** `CUSTOMER_JOURNEY_WORKFLOW.md` for detailed workflow

---

## 📊 **Data Flow**

### **Trial Signup Flow:**
```
Ad Click → Landing Page → Trial Signup Form → 
Backend API (/api/trial-signup) → 
User Created → Welcome Email Sent → 
GHL Contact Created → 
Redirect to Dashboard
```

### **Subscription Purchase Flow:**
```
Upgrade Button Click → Revolut Payment Link → 
Payment Completed → 
Webhook (if configured) → 
Subscription Updated → 
Confirmation Email → 
GHL Opportunity Created → 
Access Continued
```

### **Partner Creation Flow:**
```
"Become a Partner" Click → /affiliate Page → 
Backend API (/api/affiliate/dashboard) → 
Affiliate Account Created → 
Affiliate Code Generated → 
Referral Link Created → 
GHL Tags Updated → 
Partner Dashboard Displayed
```

---

## 🎯 **Key Integration Points**

### **Platform → GHL:**
- **Endpoint:** GHL API (via `GHLIntegrationService`)
- **Events:**
  - Trial signup → Contact create/update
  - Subscription purchase → Opportunity create
  - Course enrollment → Tag update
  - Course completion → Tag + custom field update
  - Partner creation → Tag + custom field update

### **GHL → Platform:**
- **Endpoint:** `/api/ghl/webhook`
- **Events:**
  - Contact create/update
  - Opportunity create/update
  - (Can sync back to platform if configured)

### **Platform → Local CRM:**
- **Endpoint:** `/api/clients`
- **Features:**
  - Client CRUD operations
  - Subscription management
  - Analytics tracking

---

## 📋 **Subscription Types**

| Type | Price | Duration | Features |
|------|-------|----------|----------|
| **TRIAL** | $0 | 24 hours | Full platform access |
| **MONTHLY** | $25/month | Monthly recurring | Full platform access |
| **ANNUAL** | $250/year | Yearly recurring | Full platform access + Priority Support |

---

## 🏷️ **Status Types**

| Status | Description |
|--------|-------------|
| **ACTIVE** | Active subscription/trial |
| **PAUSED** | Subscription paused |
| **CANCELLED** | Subscription cancelled |

---

## 🔗 **Important URLs**

- **Landing Page:** `https://professionaldiver.app/`
- **Trial Signup:** `https://professionaldiver.app/trial-signup`
- **Dashboard:** `https://professionaldiver.app/dashboard`
- **Partner Dashboard:** `https://professionaldiver.app/affiliate`
- **CRM Dashboard:** `https://professionaldiver.app/crm`
- **Monthly Payment:** `https://checkout.revolut.com/pay/79436775-0472-4414-a0ca-b5f151db466b`
- **Yearly Payment:** `https://checkout.revolut.com/pay/28d2e7d0-4ee7-41ed-bbf1-d2024f9275d8`

---

## ✅ **Confirmation Checklist**

- [x] Landing page with trial signup CTA
- [x] 24-hour free trial (no credit card required)
- [x] Trial signup form (name, email, referral code)
- [x] Full platform access during trial
- [x] Subscription purchase options (monthly/yearly)
- [x] Revolut payment integration
- [x] Partner program (all users can become partners)
- [x] GHL integration (contact sync, opportunities, tags)
- [x] Local CRM dashboard
- [x] Affiliate tracking and commissions
- [x] **Affiliate payout system** (Stripe, PayPal, Bank Transfer)
- [x] **Automated payout processing** (monthly schedule)
- [x] **GHL payout sync** (tags, custom fields, opportunities)

---

## 📚 **Documentation Files**

1. **CUSTOMER_JOURNEY_WORKFLOW.md** - Complete detailed workflow
2. **GHL_WORKFLOW_IMPORT.md** - Ready-to-import GHL workflows
3. **CUSTOMER_JOURNEY_SUMMARY.md** - This summary document
4. **CUSTOMER_JOURNEY_DIAGRAM.md** - Visual workflow diagrams
5. **AFFILIATE_PAYOUT_WORKFLOW.md** - Complete affiliate payout system
6. **GHL_INTEGRATION_GUIDE.md** - GHL setup and configuration

---

## 🚀 **Next Steps**

1. **Review Workflows:**
   - Read `CUSTOMER_JOURNEY_WORKFLOW.md` for complete details
   - Review `GHL_WORKFLOW_IMPORT.md` for GHL setup

2. **Configure GHL:**
   - Set up custom fields
   - Create pipeline stages
   - Import automation workflows
   - Configure webhooks

3. **Test Journey:**
   - Test trial signup
   - Test subscription purchase
   - Test partner creation
   - Verify GHL sync
   - Verify local CRM updates

4. **Monitor Performance:**
   - Track conversion rates
   - Monitor GHL sync
   - Review analytics
   - Optimize workflows

---

**✅ Customer journey confirmed and documented!**

All workflows are ready for implementation in both GHL and your local CRM system.

