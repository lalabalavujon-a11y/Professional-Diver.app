# GoHighLevel Workflow Import Guide
## Professional Diver Training Platform - Ready-to-Import Workflows

---

## 📥 **How to Import These Workflows into GHL**

1. **Log into your GHL Sub-Account:** `RanYKgzAFnSUqSIKrjOb`
2. **Navigate to:** Settings → Automations → Workflows
3. **Create New Workflow** for each workflow below
4. **Copy the trigger and action configurations**

---

## 🔄 **Workflow 1: Welcome New Trial User**

### **Trigger:**
- **Type:** Contact Created
- **Conditions:**
  - Tag contains: `Platform User`
  - Custom Field `subscriptionType` equals: `TRIAL`

### **Actions:**

**Action 1: Send Welcome Email (Immediate)**
- **Type:** Email
- **Template:** Welcome to Professional Diver Training
- **Subject:** Welcome to Your 24-Hour Free Trial! 🎓
- **Add Tag:** `Welcome Email Sent`

**Action 2: Add to Pipeline (Immediate)**
- **Type:** Move to Pipeline Stage
- **Pipeline:** Professional Diver Training
- **Stage:** Qualified Lead

**Action 3: Send Platform Tour (Delay: 1 hour)**
- **Type:** Email
- **Template:** Platform Tour Guide
- **Subject:** Your Platform Tour - Get Started in 5 Minutes
- **Add Tag:** `Platform Tour Sent`

**Action 4: Send Tips Email (Delay: 6 hours)**
- **Type:** Email
- **Template:** Study Tips & Best Practices
- **Subject:** Pro Tips for Acing Your Diving Exams
- **Add Tag:** `Tips Email Sent`

---

## 🔄 **Workflow 2: Trial Conversion Campaign**

### **Trigger:**
- **Type:** Tag Added
- **Tag:** `Subscription: TRIAL`

### **Actions:**

**Action 1: Trial Check-in (Delay: 12 hours)**
- **Type:** Email
- **Template:** How's Your Trial Going?
- **Subject:** How's Your Free Trial Going? We're Here to Help!
- **Add Tag:** `Trial Check-in Sent`

**Action 2: Upgrade Offer (Delay: 20 hours)**
- **Type:** Email
- **Template:** Upgrade to Full Access
- **Subject:** Your Trial Ends Soon - Upgrade Now & Save!
- **Add Tag:** `Upgrade Offer Sent`
- **Include:** Pricing comparison, Benefits list

**Action 3: Trial Expiry Reminder (Delay: 24 hours)**
- **Type:** Conditional
- **Condition:** Tag does NOT contain `Subscription: MONTHLY` OR `Subscription: ANNUAL`
- **If True:**
  - Send Email: Trial Expired - Last Chance
  - Subject: Your Trial Has Ended - Don't Miss Out!
  - Add Tag: `Trial Expired`
  - Move to Pipeline Stage: Lost

---

## 🔄 **Workflow 3: Subscription Purchase Confirmation**

### **Trigger:**
- **Type:** Tag Added
- **Tag:** `Paid Subscriber`

### **Actions:**

**Action 1: Subscription Confirmation (Immediate)**
- **Type:** Email
- **Template:** Subscription Confirmation
- **Subject:** Welcome to Professional Diver Training - Your Subscription is Active!
- **Add Tag:** `Subscription Confirmed`

**Action 2: Move to Enrolled Stage (Immediate)**
- **Type:** Move to Pipeline Stage
- **Pipeline:** Professional Diver Training
- **Stage:** Enrolled

**Action 3: Create Opportunity (Immediate)**
- **Type:** Create Opportunity
- **Pipeline:** Professional Diver Training
- **Stage:** Enrolled
- **Value:** 
  - If Tag `Subscription: MONTHLY`: $25
  - If Tag `Subscription: ANNUAL`: $250
- **Status:** Won

**Action 4: Customer Success Welcome (Delay: 1 hour)**
- **Type:** Email
- **Template:** Customer Success Welcome
- **Subject:** Let's Make the Most of Your Subscription
- **Add Tag:** `Customer Success Welcome Sent`

---

## 🔄 **Workflow 4: Course Completion Celebration**

### **Trigger:**
- **Type:** Tag Added
- **Tag:** `Course Graduate`

### **Actions:**

**Action 1: Congratulations Email (Immediate)**
- **Type:** Email
- **Template:** Course Completion Congratulations
- **Subject:** 🎉 Congratulations! You've Completed Your Course!
- **Add Tag:** `Congrats Sent`

**Action 2: Move to Graduate Stage (Immediate)**
- **Type:** Move to Pipeline Stage
- **Pipeline:** Professional Diver Training
- **Stage:** Graduate

**Action 3: Advanced Course Offer (Delay: 1 day)**
- **Type:** Email
- **Template:** Advanced Course Offer
- **Subject:** Ready for the Next Level? Explore Advanced Courses
- **Add Tag:** `Advanced Course Offer Sent`

**Action 4: Request Testimonial (Delay: 3 days)**
- **Type:** Email
- **Template:** Testimonial Request
- **Subject:** Share Your Success Story - We'd Love to Hear From You!
- **Add Tag:** `Testimonial Request Sent`

---

## 🔄 **Workflow 5: Partner Onboarding**

### **Trigger:**
- **Type:** Tag Added
- **Tag:** `Partner`

### **Actions:**

**Action 1: Partner Welcome Email (Immediate)**
- **Type:** Email
- **Template:** Partner Welcome
- **Subject:** Welcome to the Partner Program! Start Earning Today
- **Add Tag:** `Partner Welcome Sent`
- **Include:** 
  - Affiliate code (from custom field `affiliateCode`)
  - Referral link (from custom field `referralLink`)
  - Commission structure (50%)

**Action 2: Move to Advocate Stage (Immediate)**
- **Type:** Move to Pipeline Stage
- **Pipeline:** Professional Diver Training
- **Stage:** Advocate

**Action 3: Partner Resources (Delay: 1 day)**
- **Type:** Email
- **Template:** Partner Resources
- **Subject:** Your Partner Marketing Kit - Everything You Need
- **Add Tag:** `Partner Resources Sent`
- **Attachments:** Marketing materials, banners, email templates

**Action 4: Partner Check-in (Delay: 7 days)**
- **Type:** Conditional
- **Condition:** Custom Field `totalReferrals` equals: 0
- **If True:**
  - Send Email: Partner Tips & Best Practices
  - Subject: Tips to Get Your First Referral
  - Add Tag: `Partner Check-in Sent`

---

## 🔄 **Workflow 6: Re-engagement Campaign**

### **Trigger:**
- **Type:** No Activity
- **Duration:** 7 days
- **Conditions:**
  - Tag contains: `Platform User`
  - Custom Field `platformUsage` equals: `Inactive`

### **Actions:**

**Action 1: Re-engagement Email (Immediate)**
- **Type:** Email
- **Template:** We Miss You - Come Back!
- **Subject:** We Miss You! Here's What You're Missing
- **Add Tag:** `Re-engagement Sent`

**Action 2: Special Offer (Delay: 2 days)**
- **Type:** Conditional
- **Condition:** Tag contains `Subscription: TRIAL`
- **If True:**
  - Send Email: Extended Trial Offer
  - Subject: Special Offer: Extended Trial + Discount
  - Add Tag: `Special Offer Sent`

---

## 🔄 **Workflow 7: High Scorer Recognition**

### **Trigger:**
- **Type:** Custom Field Updated
- **Field:** `lastScore`
- **Condition:** Value greater than or equal to 90

### **Actions:**

**Action 1: Add High Scorer Tag (Immediate)**
- **Type:** Add Tag
- **Tag:** `High Scorer`

**Action 2: Recognition Email (Immediate)**
- **Type:** Email
- **Template:** High Score Recognition
- **Subject:** Outstanding Performance! You Scored 90%+ 🎯
- **Add Tag:** `High Scorer Recognition Sent`

---

## 🔄 **Workflow 8: Referral Conversion Tracking**

### **Trigger:**
- **Type:** Custom Field Updated
- **Field:** `referralCode`
- **Condition:** Field is not empty

### **Actions:**

**Action 1: Track Referral Source (Immediate)**
- **Type:** Add Tag
- **Tag:** `Referred Customer`

**Action 2: Notify Referrer (Immediate)**
- **Type:** Conditional
- **Condition:** Referral code exists in system
- **If True:**
  - Find contact with matching `affiliateCode`
  - Send Email: New Referral Notification
  - Subject: 🎉 You Got a New Referral!
  - Add Tag: `Referral Notification Sent`

---

## 📧 **Email Template Suggestions**

### **Welcome Email Template:**
```
Subject: Welcome to Your 24-Hour Free Trial! 🎓

Hi [FirstName],

Welcome to Professional Diver Training! Your 24-hour free trial has started, and you now have full access to:

✅ All commercial diving courses
✅ Timed mock exams with detailed explanations
✅ AI-powered tutors and instant feedback
✅ Voice dictation for written examinations
✅ Progress analytics and performance tracking

Get started: [Dashboard Link]

Questions? Just reply to this email.

Happy Learning!
The Professional Diver Team
```

### **Upgrade Offer Template:**
```
Subject: Your Trial Ends Soon - Upgrade Now & Save!

Hi [FirstName],

Your 24-hour trial is ending soon. Don't lose access to all these amazing features!

Choose Your Plan:
• Monthly: $25/month - Full access, cancel anytime
• Yearly: $250/year - Save 15%, best value!

Upgrade Now: [Upgrade Link]

Questions? We're here to help!

Best,
The Professional Diver Team
```

### **Course Completion Template:**
```
Subject: 🎉 Congratulations! You've Completed Your Course!

Hi [FirstName],

Congratulations on completing [CourseName]! You scored [Score]% - outstanding work!

What's Next?
• Explore advanced courses
• Take certification exams
• Become a partner and earn 50% commission

Continue Learning: [Dashboard Link]

Keep up the great work!

The Professional Diver Team
```

### **Partner Welcome Template:**
```
Subject: Welcome to the Partner Program! Start Earning Today

Hi [FirstName],

Congratulations! You're now a Professional Diver Training Partner.

Your Details:
• Affiliate Code: [AffiliateCode]
• Referral Link: [ReferralLink]
• Commission: 50% on all referrals

How It Works:
1. Share your referral link
2. When someone signs up via your link, you earn 50% commission
3. Track your earnings in real-time

Get Started: [Partner Dashboard Link]

Questions? We're here to help!

Best,
The Professional Diver Team
```

---

## 🎯 **Pipeline Configuration**

### **Pipeline Name:** Professional Diver Training

**Stages:**
1. **Lead** - New website visitor
2. **Qualified Lead** - Trial signup completed
3. **Enrolled** - Paid subscription active
4. **Graduate** - Course completed
5. **Advocate** - Partner/affiliate

**Stage Values:**
- Lead: $0
- Qualified Lead: $0
- Enrolled: $25 (monthly) or $250 (yearly)
- Graduate: Same as Enrolled
- Advocate: Same as Enrolled + commission potential

---

## 🔄 **Workflow 9: Commission Payout Notification**

### **Trigger:**
- **Type:** Tag Added
- **Tag:** `Commission Paid`

### **Actions:**

**Action 1: Payout Confirmation Email (Immediate)**
- **Type:** Email
- **Template:** Commission Payout Confirmation
- **Subject:** Your Commission Payout Has Been Processed! 💰
- **Add Tag:** `Payout Confirmed`
- **Include:**
  - Payout amount (from custom field `lastPayoutAmount`)
  - Payout date (from custom field `lastPayoutDate`)
  - Payment method
  - Payout reference

**Action 2: Update Custom Fields (Immediate)**
- **Type:** Update Custom Fields
- **Fields:**
  - `lastPayoutDate`: Current date
  - `totalPayouts`: Add to existing total

**Action 3: Thank You Email (Delay: 1 day)**
- **Type:** Email
- **Template:** Payout Thank You
- **Subject:** Thank You for Being an Amazing Partner!
- **Add Tag:** `Payout Thank You Sent`

**Action 4: Performance Update (Delay: 7 days)**
- **Type:** Email
- **Template:** Performance Update
- **Subject:** Your Partner Performance Update
- **Add Tag:** `Performance Update Sent`
- **Include:**
  - Current earnings
  - Referral count
  - Next payout estimate

---

## 🔄 **Workflow 10: High Earner Recognition**

### **Trigger:**
- **Type:** Custom Field Updated
- **Field:** `totalEarnings`
- **Condition:** Value greater than or equal to 10000 (=$100.00)

### **Actions:**

**Action 1: Add High Earner Tag (Immediate)**
- **Type:** Add Tag
- **Tag:** `High Earner`

**Action 2: Recognition Email (Immediate)**
- **Type:** Email
- **Template:** High Earner Recognition
- **Subject:** 🎉 Congratulations! You're a High Earner!
- **Add Tag:** `High Earner Recognition Sent`

**Action 3: Upgrade Offer (Delay: 1 day)**
- **Type:** Conditional
- **Condition:** Custom Field `commissionRate` equals: 50
- **If True:**
  - Send Email: Premium Partner Upgrade Offer
  - Subject: Upgrade to Premium Partner - Earn 60% Commission!
  - Add Tag: `Premium Upgrade Offer Sent`

---

## ✅ **Implementation Checklist**

- [ ] Create all custom fields in GHL
- [ ] Set up pipeline with 5 stages
- [ ] Import all 10 workflows
- [ ] Create email templates
- [ ] Test each workflow trigger
- [ ] Verify tag application
- [ ] Test email delivery
- [ ] Configure webhook endpoint
- [ ] Set up opportunity tracking
- [ ] Test payout workflows
- [ ] Test end-to-end customer journey

---

## 🔍 **Testing Your Workflows**

1. **Test Welcome Workflow:**
   - Create test contact with tag `Platform User`
   - Verify welcome email sent
   - Check tags applied

2. **Test Trial Conversion:**
   - Add tag `Subscription: TRIAL` to contact
   - Verify check-in email sent after 12 hours
   - Verify upgrade offer sent after 20 hours

3. **Test Subscription Purchase:**
   - Add tag `Paid Subscriber` to contact
   - Verify confirmation email sent
   - Check opportunity created
   - Verify pipeline stage updated

4. **Test Course Completion:**
   - Add tag `Course Graduate` to contact
   - Verify congratulations email sent
   - Check pipeline stage updated

5. **Test Partner Onboarding:**
   - Add tag `Partner` to contact
   - Set custom field `affiliateCode`
   - Verify welcome email sent
   - Check resources email sent after 1 day

---

**🎉 Your GHL workflows are ready to import and activate!**

