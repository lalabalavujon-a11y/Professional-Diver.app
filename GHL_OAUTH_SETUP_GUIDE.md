# GoHighLevel OAuth 2.0 Integration Guide
## Professional Diver Training Platform ↔ GHL Sub-Account: RanYKgzAFnSUqSIKrjOb

### 🚨 **Important Update**
GoHighLevel has **discontinued local API keys**. We now use the **OAuth 2.0 flow** for secure API access.

---

## 🏗️ **Step 1: Create GHL Marketplace App**

### **1.1 Access GHL Marketplace**
1. Go to: https://marketplace.leadconnectorhq.com/
2. **Sign in** with your GHL account
3. Click **"Developer"** in the top menu
4. Click **"Create App"**

### **1.2 App Configuration**
```
App Name: Professional Diver Training Platform
App Type: Private App (for your sub-account only)
Category: CRM & Lead Management
Description: Integrates professional diving training platform with GHL CRM for automated lead management and course tracking.
```

### **1.3 OAuth Settings**
```
Redirect URIs:
- http://127.0.0.1:5000/api/ghl/callback (for local development)
- https://your-production-domain.com/api/ghl/callback (for production)

Scopes Required:
✅ contacts.write
✅ contacts.read  
✅ opportunities.write
✅ opportunities.read
✅ locations.read
✅ users.read
```

### **1.4 Get Your Credentials**
After creating the app, you'll receive:
- **Client ID**: `ghl_client_id_here`
- **Client Secret**: `ghl_client_secret_here`

---

## 🔧 **Step 2: Environment Configuration**

### **2.1 Update Environment Variables**
```bash
# GHL OAuth Configuration
GHL_CLIENT_ID=your_ghl_client_id_here
GHL_CLIENT_SECRET=your_ghl_client_secret_here
GHL_REDIRECT_URI=http://127.0.0.1:5000/api/ghl/callback
GHL_SUB_ACCOUNT_ID=RanYKgzAFnSUqSIKrjOb

# Optional: Custom scopes (defaults are fine)
GHL_SCOPES=contacts.write,contacts.read,opportunities.write,opportunities.read,locations.read
```

### **2.2 Restart Your Server**
```bash
# Stop current server
pkill -f "node.*server/index.ts"

# Start with OAuth configuration
cd "/Users/Jon/0 A VIBE CODER PROJECTS MACBOOK PRO/professional-diver.app-main"
GHL_CLIENT_ID=your_id GHL_CLIENT_SECRET=your_secret node --import tsx/esm server/index.ts
```

---

## 🚀 **Step 3: Complete OAuth Flow**

### **3.1 Initiate OAuth**
```bash
GET http://127.0.0.1:5000/api/ghl/auth
```

**Response:**
```json
{
  "success": true,
  "authUrl": "https://marketplace.leadconnectorhq.com/oauth/chooselocation?...",
  "message": "Visit the authUrl to complete OAuth flow"
}
```

### **3.2 Complete Authorization**
1. **Open the `authUrl`** in your browser
2. **Select your Sub-Account**: `PROFESSIONAL DIVER TRAINING APP: RanYKgzAFnSUqSIKrjOb`
3. **Grant permissions** for the requested scopes
4. **You'll be redirected** to your callback URL with tokens

### **3.3 Verify Connection**
```bash
GET http://127.0.0.1:5000/api/ghl/status
```

**Success Response:**
```json
{
  "success": true,
  "hasTokens": true,
  "locationId": "RanYKgzAFnSUqSIKrjOb",
  "expiresAt": "2024-12-20T20:30:00.000Z",
  "scopes": "contacts.write contacts.read opportunities.write opportunities.read locations.read"
}
```

---

## 🔄 **Step 4: Automatic Token Management**

### **4.1 Token Refresh**
The system automatically:
- ✅ **Refreshes tokens** before they expire
- ✅ **Saves tokens** securely in your database
- ✅ **Handles token errors** gracefully
- ✅ **Retries failed requests** with fresh tokens

### **4.2 Token Storage**
Tokens are stored with:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...", 
  "expires_at": 1703097000000,
  "locationId": "RanYKgzAFnSUqSIKrjOb",
  "scope": "contacts.write contacts.read..."
}
```

---

## 🎯 **Step 5: Available API Endpoints**

### **OAuth Management**
```bash
# Start OAuth flow
GET /api/ghl/auth

# OAuth callback (automatic)
GET /api/ghl/callback?code=...

# Check OAuth status
GET /api/ghl/status
```

### **Contact Management**
```bash
# Sync user to GHL
POST /api/ghl/sync-user
{
  "name": "John Doe",
  "email": "john@example.com", 
  "phone": "+1234567890",
  "subscriptionType": "PREMIUM",
  "source": "Platform Registration"
}

# Test connection
GET /api/ghl/test

# Webhook handler
POST /api/ghl/webhook
```

---

## 🛠️ **Step 6: Production Deployment**

### **6.1 Update Redirect URI**
In your GHL Marketplace App settings:
```
Production Redirect URI: https://profiler.leadrecon.app/api/ghl/callback
```

### **6.2 Environment Variables**
```bash
# Production environment
GHL_CLIENT_ID=your_ghl_client_id
GHL_CLIENT_SECRET=your_ghl_client_secret  
GHL_REDIRECT_URI=https://profiler.leadrecon.app/api/ghl/callback
GHL_SUB_ACCOUNT_ID=RanYKgzAFnSUqSIKrjOb
```

### **6.3 Webhook Configuration**
In your GHL Sub-Account:
```
Webhook URL: https://profiler.leadrecon.app/api/ghl/webhook
Events: contact.create, contact.update, opportunity.create, opportunity.update
```

---

## 🔐 **Security Best Practices**

### **6.1 Token Security**
- ✅ **Encrypt tokens** in database storage
- ✅ **Use HTTPS** for all OAuth flows
- ✅ **Validate redirect URIs** strictly
- ✅ **Implement rate limiting** on OAuth endpoints

### **6.2 Webhook Security**
```bash
# Add webhook signature verification
GHL_WEBHOOK_SECRET=your_webhook_secret_here
```

### **6.3 Environment Security**
- ✅ **Never commit** client secrets to git
- ✅ **Use environment variables** for all credentials
- ✅ **Rotate secrets** regularly
- ✅ **Monitor OAuth usage** in GHL dashboard

---

## 🧪 **Testing Your Integration**

### **Test 1: OAuth Flow**
```bash
curl http://127.0.0.1:5000/api/ghl/auth
# Follow the authUrl, complete OAuth
curl http://127.0.0.1:5000/api/ghl/status
```

### **Test 2: Contact Sync**
```bash
curl -X POST http://127.0.0.1:5000/api/ghl/sync-user \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subscriptionType": "TRIAL"
  }'
```

### **Test 3: Verify in GHL**
1. **Check your GHL Sub-Account**
2. **Verify contact was created**
3. **Check tags and custom fields**

---

## 🚨 **Troubleshooting**

### **Common Issues**

**❌ "OAuth service not initialized"**
- **Solution**: Set `GHL_CLIENT_ID` and `GHL_CLIENT_SECRET` environment variables

**❌ "Invalid redirect URI"**
- **Solution**: Ensure redirect URI in app matches your environment configuration

**❌ "Insufficient permissions"**
- **Solution**: Check OAuth scopes in your GHL Marketplace App

**❌ "Token expired"**
- **Solution**: System should auto-refresh, but you can restart OAuth flow

### **Debug Mode**
```bash
DEBUG=ghl:* node --import tsx/esm server/index.ts
```

---

## 📊 **OAuth vs Legacy Comparison**

| **Legacy API Keys** | **OAuth 2.0** |
|-------------------|---------------|
| ❌ Discontinued | ✅ Current standard |
| ❌ No expiration | ✅ Secure token expiration |
| ❌ Static access | ✅ Dynamic permission scopes |
| ❌ No user consent | ✅ Explicit user authorization |
| ❌ Limited audit trail | ✅ Full OAuth audit logs |

---

## 🎯 **Next Steps**

1. **✅ Create your GHL Marketplace App**
2. **✅ Configure OAuth credentials**
3. **✅ Complete the OAuth flow**
4. **✅ Test contact synchronization**
5. **✅ Set up production webhooks**
6. **✅ Monitor OAuth token usage**

**Your Professional Diver Training Platform now uses modern, secure OAuth 2.0 for GHL integration! 🔐🚀**

---

## 📞 **Support Resources**

- **GHL OAuth Documentation**: https://highlevel.stoplight.io/docs/integrations/
- **GHL Marketplace**: https://marketplace.leadconnectorhq.com/
- **OAuth 2.0 Specification**: https://oauth.net/2/
- **Platform Integration Support**: Check `/api/ghl/status` endpoint


