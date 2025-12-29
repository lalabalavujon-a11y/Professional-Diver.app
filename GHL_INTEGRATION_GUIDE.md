# GoHighLevel Integration Guide
## Professional Diver Training Platform ↔ GHL Sub-Account: RanYKgzAFnSUqSIKrjOb

### 🎯 **Integration Overview**

Your Professional Diver Training Platform is now equipped with comprehensive GoHighLevel (GHL) integration capabilities. This allows you to:

- **Automatically sync student registrations** to your GHL CRM
- **Track course enrollments and completions** with detailed analytics
- **Manage leads and opportunities** through GHL pipelines
- **Automate marketing workflows** based on student behavior
- **Receive real-time updates** via webhooks

---

## 🔧 **Setup Instructions**

### **Step 1: Get Your GHL API Key**

1. **Log into your GoHighLevel account**
2. **Navigate to your Sub-Account**: `PROFESSIONAL DIVER TRAINING APP: RanYKgzAFnSUqSIKrjOb`
3. **Go to Settings → API Keys**
4. **Generate a new API key** with the following permissions:
   - `contacts.write`
   - `contacts.read`
   - `opportunities.write`
   - `opportunities.read`
   - `locations.read`

### **Step 2: Configure Environment Variables**

Add your GHL API key to your environment configuration:

```bash
# In your .env.local file (create if it doesn't exist)
GHL_API_KEY=your_actual_ghl_api_key_here
GHL_SUB_ACCOUNT_ID=RanYKgzAFnSUqSIKrjOb
```

### **Step 3: Restart Your Server**

```bash
# Stop current server
pkill -f "node.*server/index.ts"

# Start with GHL integration
cd "/Users/Jon/0 A VIBE CODER PROJECTS MACBOOK PRO/professional-diver.app-main"
NODE_ENV=development PORT=5000 GHL_API_KEY=your_key_here node --import tsx/esm server/index.ts
```

---

## 🚀 **Available API Endpoints**

### **Test Connection**
```bash
GET /api/ghl/test
```
**Response:**
```json
{
  "success": true,
  "message": "GHL connection successful",
  "subAccountId": "RanYKgzAFnSUqSIKrjOb"
}
```

### **Sync User Registration**
```bash
POST /api/ghl/sync-user
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "subscriptionType": "PREMIUM",
  "source": "Website Registration"
}
```

### **Webhook Endpoint**
```bash
POST /api/ghl/webhook
```
Configure this in your GHL Sub-Account webhook settings:
- **URL**: `https://your-domain.com/api/ghl/webhook`
- **Events**: Contact Create, Contact Update, Opportunity Create, Opportunity Update

---

## 🎯 **Automatic Integrations**

### **User Registration Sync**
When users register or login, the system automatically:
- ✅ **Creates/updates contact** in GHL
- ✅ **Adds relevant tags**: `Professional Diver Training`, `Platform User`, `Subscription: [TYPE]`
- ✅ **Sets custom fields**: Registration date, subscription type, platform source
- ✅ **Creates opportunities** for paid subscriptions

### **Course Tracking**
The system tracks and syncs:
- 📚 **Course Enrollments**: Tags like `Course: NDT Fundamentals`, `Type: Commercial`
- 🎓 **Course Completions**: Tags like `Completed: NDT Fundamentals`, `Score: 95%`
- 📊 **Progress Updates**: Custom fields with completion dates and scores

### **Lead Scoring & Segmentation**
Automatic tagging based on:
- **Subscription Level**: `TRIAL`, `MONTHLY`, `YEARLY`, `LIFETIME`, `PREMIUM`
- **Course Interest**: `NDT`, `LST`, `ALST`, `DMT`, `Commercial Supervisor`
- **Engagement Level**: `Active Learner`, `Course Graduate`, `High Scorer`

---

## 📊 **GHL Pipeline Setup Recommendations**

### **Sales Pipeline: Professional Diver Training**

**Stage 1: Lead**
- New website visitors
- Trial signups
- Course inquiries

**Stage 2: Qualified Lead**
- Completed profile
- Started first lesson
- Engaged with AI tutor

**Stage 3: Enrolled**
- Paid subscription
- Active course participation
- Regular platform usage

**Stage 4: Graduate**
- Course completion
- Certification earned
- Ready for advanced courses

**Stage 5: Advocate**
- Lifetime subscriber
- Course reviews/testimonials
- Referral source

---

## 🔄 **Webhook Configuration**

### **In Your GHL Sub-Account:**

1. **Go to Settings → Integrations → Webhooks**
2. **Create New Webhook**:
   - **Name**: Professional Diver Training Platform
   - **URL**: `https://your-domain.com/api/ghl/webhook`
   - **Events to Subscribe**:
     - `contact.create`
     - `contact.update`
     - `opportunity.create`
     - `opportunity.update`
     - `appointment.create`

### **Webhook Security (Recommended)**
Add webhook signature verification:
```bash
GHL_WEBHOOK_SECRET=your_webhook_secret_here
```

---

## 🎨 **Custom Fields Setup**

### **Contact Custom Fields**
Create these in your GHL Sub-Account:

| Field Name | Type | Description |
|------------|------|-------------|
| `subscriptionType` | Text | TRIAL, MONTHLY, YEARLY, LIFETIME, etc. |
| `registrationDate` | Date | When they joined the platform |
| `lastCourseEnrolled` | Text | Most recent course enrollment |
| `lastCourseCompleted` | Text | Most recent course completion |
| `completionDate` | Date | Last course completion date |
| `lastScore` | Number | Most recent quiz/exam score |
| `totalCoursesCompleted` | Number | Count of completed courses |
| `platformUsage` | Text | Active, Inactive, Graduated |

---

## 🚀 **Marketing Automation Ideas**

### **Welcome Sequence**
- **Trigger**: New contact with tag `Platform User`
- **Actions**: 
  - Send welcome email
  - Assign to sales rep
  - Schedule follow-up call

### **Course Completion Celebration**
- **Trigger**: Tag added `Course Graduate`
- **Actions**:
  - Send congratulations email
  - Offer advanced course discount
  - Request testimonial/review

### **Re-engagement Campaign**
- **Trigger**: No activity for 7 days
- **Actions**:
  - Send motivational email
  - Offer 1-on-1 tutoring session
  - Provide study tips

### **Upsell Automation**
- **Trigger**: Trial user, active for 3+ days
- **Actions**:
  - Send subscription offer
  - Highlight premium features
  - Limited-time discount

---

## 🔍 **Testing Your Integration**

### **1. Test API Connection**
```bash
curl -X GET http://127.0.0.1:5000/api/ghl/test
```

### **2. Test User Sync**
```bash
curl -X POST http://127.0.0.1:5000/api/ghl/sync-user \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subscriptionType": "TRIAL",
    "source": "API Test"
  }'
```

### **3. Check GHL Dashboard**
- Verify contact was created
- Check tags were applied
- Confirm custom fields are populated

---

## 🛠 **Troubleshooting**

### **Common Issues**

**❌ "GHL service not initialized"**
- **Solution**: Add `GHL_API_KEY` to environment variables

**❌ "GHL connection failed"**
- **Solution**: Verify API key permissions and Sub-Account ID

**❌ "Contact creation failed"**
- **Solution**: Check required fields (firstName, email) are provided

**❌ "Webhook not receiving data"**
- **Solution**: Verify webhook URL is publicly accessible (use ngrok for local testing)

### **Debug Mode**
Enable detailed logging:
```bash
DEBUG=ghl:* node --import tsx/esm server/index.ts
```

---

## 📈 **Success Metrics**

Track these KPIs in your GHL dashboard:
- **Contact Sync Rate**: % of platform users in GHL
- **Course Completion Rate**: % tagged as graduates
- **Conversion Rate**: Trial → Paid subscriptions
- **Engagement Score**: Platform activity vs. GHL interactions
- **Revenue Attribution**: Sales generated from platform leads

---

## 🎯 **Next Steps**

1. **✅ Set up your GHL API key**
2. **✅ Test the integration endpoints**
3. **📋 Configure your sales pipelines**
4. **🎨 Create custom fields**
5. **🔄 Set up webhooks**
6. **🚀 Launch marketing automations**

---

## 🆘 **Support**

For integration support:
- **Platform Issues**: Check server logs at `/api/ghl/test`
- **GHL Configuration**: Consult GHL documentation
- **Custom Workflows**: Contact your development team

**Your Professional Diver Training Platform is now fully integrated with GoHighLevel! 🎉**


