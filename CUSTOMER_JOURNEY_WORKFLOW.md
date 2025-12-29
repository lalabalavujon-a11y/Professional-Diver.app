# Customer Journey Workflow - Professional Diver Training Platform
## Complete Workflow for GHL & Local CRM

---

## 📊 **Customer Journey Overview**

### **Stage 1: Ad Click → Landing Page**
**Trigger:** Customer clicks on advertisement (Google Ads, Facebook, etc.)

**Actions:**
- Customer lands on: `https://professionaldiver.app/` (Landing Page)
- Referral code captured if present: `?ref=PDXXXXXXXX`
- Landing page displays:
  - Hero section with "Start 24-Hour Free Trial" CTA
  - Features showcase
  - Pricing plans ($25/month, $250/year)

**Tracking:**
- UTM parameters captured (source, medium, campaign)
- Referral code stored in localStorage
- Page view tracked

---

### **Stage 2: Trial Signup (24-Hour Free Trial)**
**Trigger:** Customer clicks "Start 24-Hour Free Trial" button

**Actions:**
- Redirects to: `/trial-signup`
- Customer fills form:
  - Name (required)
  - Email (required)
  - Referral code (auto-populated if present)
- **No credit card required**
- Trial account created with:
  - Subscription Type: `TRIAL`
  - Trial expires: 24 hours from signup
  - Full platform access granted

**Backend Process:**
1. User created in database
2. Referral code processed (if provided)
3. Welcome email sent
4. GHL contact created/updated
5. Redirect to dashboard

**GHL Sync:**
- Contact created with tags: `Professional Diver Training`, `Platform User`, `Subscription: TRIAL`
- Custom fields set:
  - `subscriptionType`: `TRIAL`
  - `registrationDate`: Current date
  - `source`: Landing page source
  - `referralCode`: If applicable

---

### **Stage 3: Trial Experience (24 Hours)**
**Trigger:** Customer accesses dashboard during trial period

**Actions:**
- Full access to all features:
  - All commercial diving courses
  - Timed mock exams
  - AI-powered tutors
  - Voice dictation
  - Progress analytics
- Trial countdown displayed
- Upgrade prompts shown (non-intrusive)

**Tracking:**
- Course enrollments tracked
- Exam attempts logged
- Engagement metrics recorded
- GHL tags updated based on activity

**GHL Updates:**
- Tags added: `Active Learner`, `Trial User`
- Custom fields updated:
  - `lastCourseEnrolled`: Course name
  - `enrollmentDate`: Date
  - `platformUsage`: `Active`

---

### **Stage 4: Trial Expiry → Upgrade Decision**
**Trigger:** Trial expires OR customer decides to upgrade during trial

**Actions:**
- Trial countdown shows time remaining
- Upgrade CTA buttons displayed:
  - "Upgrade to Monthly - $25/month"
  - "Upgrade to Yearly - $250/year"
- Customer clicks upgrade button
- Redirects to Revolut payment link:
  - Monthly: `https://checkout.revolut.com/pay/79436775-0472-4414-a0ca-b5f151db466b`
  - Yearly: `https://checkout.revolut.com/pay/28d2e7d0-4ee7-41ed-bbf1-d2024f9275d8`

**Alternative Path:**
- Customer can also purchase directly from landing page pricing section
- Same Revolut payment links used

---

### **Stage 5: Payment & Subscription Activation**
**Trigger:** Customer completes payment via Revolut

**Actions:**
- Payment processed by Revolut
- Customer redirected to success page (if configured)
- Subscription activated:
  - Subscription Type: `MONTHLY` or `ANNUAL`
  - Status: `ACTIVE`
  - Access continues seamlessly

**Backend Process:**
1. Payment webhook received (if configured)
2. Subscription updated in database
3. Access permissions updated
4. Confirmation email sent
5. GHL contact updated
6. Opportunity created/updated in GHL

**GHL Sync:**
- Tags updated: `Subscription: MONTHLY` or `Subscription: ANNUAL`
- Custom fields updated:
  - `subscriptionType`: `MONTHLY` or `ANNUAL`
  - `subscriptionDate`: Payment date
  - `subscriptionStatus`: `ACTIVE`
- Opportunity created:
  - Pipeline: "Professional Diver Training"
  - Stage: "Enrolled"
  - Value: $25 (monthly) or $250 (yearly)
  - Status: `Won`

**Referral Processing:**
- If customer came via referral code:
  - Referral conversion tracked
  - Commission calculated (50% of subscription value)
  - Affiliate earnings updated
  - Commission payment scheduled

---

### **Stage 6: Active Subscriber**
**Trigger:** Customer has active subscription

**Actions:**
- Full platform access maintained
- Course progress tracked
- Exam results saved
- Analytics dashboard available
- Partner program accessible

**Ongoing GHL Updates:**
- Course completions tracked
- Tags added: `Course Graduate`, `High Scorer` (if applicable)
- Custom fields updated:
  - `lastCourseCompleted`: Course name
  - `completionDate`: Date
  - `lastScore`: Score percentage
  - `totalCoursesCompleted`: Count

---

### **Stage 7: Becoming a Partner**
**Trigger:** Customer clicks "Become a Partner" or visits `/affiliate`

**Actions:**
- Affiliate account automatically created (if not exists)
- Unique affiliate code generated: `PDXXXXXXXX`
- Referral link created: `https://professionaldiver.app/?ref=PDXXXXXXXX`
- Partner dashboard accessible:
  - View earnings
  - Track referrals
  - Manage sub-affiliates
  - View analytics

**Backend Process:**
1. Affiliate account created
2. Affiliate code generated
3. Referral link created
4. Dashboard data prepared

**GHL Sync:**
- Tags added: `Partner`, `Affiliate`
- Custom fields updated:
  - `affiliateCode`: `PDXXXXXXXX`
  - `referralLink`: Full URL
  - `partnerStatus`: `Active`

**Partner Benefits:**
- 50% commission on all referrals
- Can create sub-affiliates
- Real-time earnings tracking
- Commission payments via Stripe/PayPal

---

## 🔄 **GHL Workflow Configuration**

### **Pipeline: Professional Diver Training**

#### **Stage 1: Lead**
**Entry Criteria:**
- New contact created from landing page
- Tag: `Platform User`
- Source: Website/Ad

**Actions:**
- Add tag: `Lead`
- Assign to sales rep (if configured)
- Trigger welcome sequence

**Exit Criteria:**
- Moves to "Qualified Lead" when trial signup completed

---

#### **Stage 2: Qualified Lead**
**Entry Criteria:**
- Trial signup completed
- Tag: `Subscription: TRIAL`
- Custom field: `subscriptionType` = `TRIAL`

**Actions:**
- Add tag: `Qualified Lead`
- Send trial welcome email sequence
- Schedule follow-up (18 hours after signup)

**Exit Criteria:**
- Moves to "Enrolled" when subscription purchased
- Moves to "Lost" if trial expires without conversion

---

#### **Stage 3: Enrolled**
**Entry Criteria:**
- Subscription purchased
- Tag: `Subscription: MONTHLY` or `Subscription: ANNUAL`
- Custom field: `subscriptionType` = `MONTHLY` or `ANNUAL`

**Actions:**
- Add tag: `Enrolled`, `Paid Subscriber`
- Create opportunity with value
- Send subscription confirmation
- Assign to customer success (if configured)

**Exit Criteria:**
- Moves to "Graduate" when course completed
- Moves to "Advocate" when becomes partner

---

#### **Stage 4: Graduate**
**Entry Criteria:**
- Course completed
- Tag: `Course Graduate`
- Custom field: `totalCoursesCompleted` > 0

**Actions:**
- Add tag: `Graduate`
- Send congratulations email
- Offer advanced courses
- Request testimonial

**Exit Criteria:**
- Moves to "Advocate" when becomes partner
- Stays in "Graduate" for ongoing learning

---

#### **Stage 5: Advocate**
**Entry Criteria:**
- Partner account created
- Tag: `Partner`
- Custom field: `affiliateCode` exists

**Actions:**
- Add tag: `Advocate`, `Partner`
- Send partner welcome email
- Provide partner resources
- Track referral performance

**Exit Criteria:**
- Stays in "Advocate" (end of pipeline)

---

### **GHL Automation Workflows**

#### **Workflow 1: Welcome Sequence**
**Trigger:** Contact created with tag `Platform User`

**Actions:**
1. **Immediate:**
   - Send welcome email
   - Add tag: `Welcome Email Sent`

2. **After 1 hour:**
   - Send platform tour email
   - Add tag: `Platform Tour Sent`

3. **After 6 hours:**
   - Send tips email
   - Add tag: `Tips Email Sent`

---

#### **Workflow 2: Trial Conversion**
**Trigger:** Contact has tag `Subscription: TRIAL`

**Actions:**
1. **After 12 hours:**
   - Send "How's your trial going?" email
   - Add tag: `Trial Check-in Sent`

2. **After 20 hours:**
   - Send upgrade offer email
   - Highlight benefits
   - Add tag: `Upgrade Offer Sent`

3. **After 24 hours (if not converted):**
   - Send trial expiry reminder
   - Offer extended trial (if applicable)
   - Add tag: `Trial Expired`

---

#### **Workflow 3: Course Completion**
**Trigger:** Tag added `Course Graduate`

**Actions:**
1. **Immediate:**
   - Send congratulations email
   - Add tag: `Congrats Sent`

2. **After 1 day:**
   - Offer advanced courses
   - Add tag: `Advanced Course Offer Sent`

3. **After 3 days:**
   - Request testimonial/review
   - Add tag: `Testimonial Request Sent`

---

#### **Workflow 4: Partner Onboarding**
**Trigger:** Tag added `Partner`

**Actions:**
1. **Immediate:**
   - Send partner welcome email
   - Include affiliate code and referral link
   - Add tag: `Partner Welcome Sent`

2. **After 1 day:**
   - Send partner resources email
   - Marketing materials
   - Add tag: `Partner Resources Sent`

3. **After 7 days:**
   - Check for first referral
   - Send tips if no referrals yet
   - Add tag: `Partner Check-in Sent`

---

### **GHL Custom Fields Setup**

Create these custom fields in your GHL Sub-Account:

| Field Name | Type | Description |
|------------|------|-------------|
| `subscriptionType` | Text | TRIAL, MONTHLY, ANNUAL |
| `subscriptionStatus` | Text | ACTIVE, PAUSED, CANCELLED |
| `registrationDate` | Date | When they joined |
| `subscriptionDate` | Date | When subscription started |
| `trialExpiresAt` | Date | Trial expiration date |
| `lastCourseEnrolled` | Text | Most recent course |
| `lastCourseCompleted` | Text | Last completed course |
| `enrollmentDate` | Date | Last enrollment date |
| `completionDate` | Date | Last completion date |
| `lastScore` | Number | Most recent exam score |
| `totalCoursesCompleted` | Number | Count of completed courses |
| `platformUsage` | Text | Active, Inactive, Graduated |
| `affiliateCode` | Text | Partner affiliate code |
| `referralLink` | Text | Partner referral link |
| `partnerStatus` | Text | Active, Inactive |
| `referralCode` | Text | Code used when signing up |
| `utmSource` | Text | Ad source |
| `utmMedium` | Text | Ad medium |
| `utmCampaign` | Text | Campaign name |

---

### **GHL Tags Structure**

**Subscription Tags:**
- `Subscription: TRIAL`
- `Subscription: MONTHLY`
- `Subscription: ANNUAL`
- `Paid Subscriber`

**Status Tags:**
- `Platform User`
- `Active Learner`
- `Course Graduate`
- `High Scorer`
- `Partner`
- `Affiliate`

**Course Tags:**
- `Course: NDT Fundamentals`
- `Course: LST`
- `Course: ALST`
- `Type: Commercial`
- `Enrolled`
- `Completed: [Course Name]`

**Engagement Tags:**
- `Welcome Email Sent`
- `Trial Check-in Sent`
- `Upgrade Offer Sent`
- `Congrats Sent`
- `Partner Welcome Sent`

---

## 🏢 **Local CRM Workflow**

### **CRM Dashboard Access**
**URL:** `/crm`
**Access:** Admin/Partner Admin roles

### **CRM Stages**

#### **Stage 1: New Lead**
**Status:** `ACTIVE`
**Subscription Type:** `TRIAL`

**Actions:**
- View lead details
- Add notes
- Track engagement
- Send manual follow-up

---

#### **Stage 2: Active Trial**
**Status:** `ACTIVE`
**Subscription Type:** `TRIAL`

**Actions:**
- Monitor trial usage
- Track course enrollments
- View engagement metrics
- Prepare conversion strategy

---

#### **Stage 3: Converted Subscriber**
**Status:** `ACTIVE`
**Subscription Type:** `MONTHLY` or `ANNUAL`

**Actions:**
- View subscription details
- Track course progress
- Monitor renewal dates
- Manage subscription

---

#### **Stage 4: Partner**
**Status:** `ACTIVE`
**Has Affiliate Code**

**Actions:**
- View partner performance
- Track referrals
- Monitor earnings
- Manage sub-affiliates

---

### **Local CRM Features**

1. **Client Management:**
   - View all clients
   - Filter by subscription type
   - Search by name/email
   - Edit client details
   - Add notes

2. **Subscription Management:**
   - View subscription types
   - Update subscription status
   - Track trial expiration
   - Monitor renewals

3. **Analytics:**
   - Total clients
   - Active subscriptions
   - Trial conversion rate
   - Revenue tracking

4. **Partner Management:**
   - View all partners
   - Track affiliate performance
   - Monitor commissions
   - Manage sub-affiliates

---

## 📋 **Workflow Implementation Checklist**

### **GHL Setup:**
- [ ] Create custom fields in GHL
- [ ] Set up pipeline stages
- [ ] Configure automation workflows
- [ ] Set up webhook endpoint
- [ ] Test contact sync
- [ ] Test opportunity creation
- [ ] Configure email sequences
- [ ] Set up tags structure

### **Local CRM:**
- [ ] Access CRM dashboard (`/crm`)
- [ ] Review client list
- [ ] Test client creation
- [ ] Test subscription updates
- [ ] Configure filters
- [ ] Set up reporting

### **Integration Testing:**
- [ ] Test trial signup → GHL sync
- [ ] Test subscription purchase → GHL sync
- [ ] Test partner creation → GHL sync
- [ ] Test webhook reception
- [ ] Verify tags applied correctly
- [ ] Verify custom fields populated
- [ ] Test automation triggers

---

## 🎯 **Key Metrics to Track**

### **Conversion Funnel:**
1. Ad clicks → Landing page views
2. Landing page views → Trial signups
3. Trial signups → Active trials
4. Active trials → Paid subscriptions
5. Paid subscriptions → Partners

### **GHL Metrics:**
- Contact sync rate
- Pipeline conversion rate
- Average deal value
- Time in each stage
- Email open/click rates

### **Local CRM Metrics:**
- Total clients
- Active subscriptions
- Trial conversion rate
- Partner count
- Revenue per client

---

## 🔗 **Integration Points**

### **GHL Webhook Endpoint:**
```
POST /api/ghl/webhook
```

**Events Handled:**
- Contact Create
- Contact Update
- Opportunity Create
- Opportunity Update

### **Platform → GHL Sync:**
- Trial signup → Contact create/update
- Subscription purchase → Opportunity create
- Course enrollment → Tag update
- Course completion → Tag + custom field update
- Partner creation → Tag + custom field update

### **GHL → Platform Sync:**
- Contact updates → Platform user updates (if configured)
- Opportunity updates → Subscription status (if configured)

---

## 📞 **Support & Troubleshooting**

### **Common Issues:**

1. **GHL Contact Not Created:**
   - Check API key configuration
   - Verify sub-account ID
   - Check server logs

2. **Tags Not Applied:**
   - Verify tag names match
   - Check API permissions
   - Review error logs

3. **Custom Fields Not Populated:**
   - Ensure fields exist in GHL
   - Verify field names match
   - Check data types

4. **Webhook Not Receiving:**
   - Verify webhook URL is public
   - Check GHL webhook configuration
   - Review webhook logs

---

## 🚀 **Next Steps**

1. **Configure GHL:**
   - Set up custom fields
   - Create pipeline
   - Configure workflows
   - Test integrations

2. **Set Up Automations:**
   - Welcome sequence
   - Trial conversion
   - Course completion
   - Partner onboarding

3. **Monitor Performance:**
   - Track conversion rates
   - Monitor GHL sync
   - Review analytics
   - Optimize workflows

4. **Iterate & Improve:**
   - A/B test email sequences
   - Optimize conversion funnel
   - Refine automation triggers
   - Enhance tracking

---

## 💰 **Affiliate Payout Workflow**

### **Commission Structure:**
- **50% commission** on all referrals
- **Monthly:** $25 subscription → $12.50 commission
- **Yearly:** $250 subscription → $125 commission

### **Payout Methods:**
1. **Stripe Connect** - Automated transfers (instant to 2 days)
2. **PayPal** - Automated transfers (instant to 1 day)
3. **Revolut Bank Transfer** - Automated transfers (1-3 days)
4. **Manual Bank Transfer** - Manual processing (1-5 days)

### **Payout Process:**
1. **Commission Accumulation:**
   - Commission calculated when referral purchases subscription
   - Tracked in real-time
   - Added to affiliate earnings

2. **Payout Threshold:**
   - Minimum payout: **$50**
   - Monthly payout schedule (1st of month)
   - Automated processing for eligible affiliates

3. **Payout Processing:**
   - System processes payouts automatically
   - Uses affiliate's preferred payment method
   - Records payout in system
   - Syncs to GHL
   - Sends confirmation email

4. **GHL Integration:**
   - Tags: `Commission Paid`, `Payout: $XXX.XX`
   - Custom fields: `lastPayoutAmount`, `lastPayoutDate`, `totalPayouts`
   - Opportunity updates

**See:** `AFFILIATE_PAYOUT_WORKFLOW.md` for complete payout documentation

---

**🎉 Your customer journey workflow is now fully documented and ready for implementation!**

