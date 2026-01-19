# CRM Email and WhatsApp Integration - Setup Checklist

## ✅ Implementation Status

All code implementation is **COMPLETE**:
- ✅ Email sending integration
- ✅ Email receiving (IMAP polling)
- ✅ WhatsApp sending
- ✅ WhatsApp receiving (webhook)
- ✅ Client auto-creation
- ✅ All routes and services

## 📋 Configuration Checklist

### 1. Email Sending (✅ Already Configured)
- [x] `SMTP_USER=jon@professionaldiver.app` - ✅ Set
- [x] `SMTP_PASSWORD=sugdzjwhokdfxcuf` - ✅ Set
- [x] `SMTP_HOST=smtp.gmail.com` - ✅ Set
- [x] `SMTP_PORT=587` - ✅ Set
- [x] `EMAIL_FROM=jon@professionaldiver.app` - ✅ Set
- [x] `EMAIL_FROM_NAME=Diver Well Training - Professional Diver App` - ✅ Set

**Status:** ✅ **READY TO USE** - You can send emails from CRM now!

---

### 2. Email Receiving (IMAP Polling) - ⚠️ NEEDS CONFIGURATION

Add these to your `.env` file:

```bash
# IMAP Configuration (for receiving emails)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=jon@professionaldiver.app
IMAP_PASSWORD=sugdzjwhokdfxcuf
IMAP_MAILBOX=INBOX
EMAIL_POLL_INTERVAL=600000
```

**Notes:**
- `IMAP_USER` and `IMAP_PASSWORD` can be the same as `SMTP_USER` and `SMTP_PASSWORD`
- `EMAIL_POLL_INTERVAL` is in milliseconds (600000 = 10 minutes)
- The service will automatically start polling when the server starts

**Action Required:**
- [ ] Add IMAP variables to `.env` file
- [ ] Restart the server to enable email polling

**Status:** ⚠️ **NEEDS CONFIGURATION**

---

### 3. WhatsApp Sending - ⚠️ NEEDS CONFIGURATION

**Status:** ✅ Environment variable template added to `.env` - Replace placeholder values with actual credentials

Add these to your `.env` file (template already added):

```bash
# WhatsApp Business API Configuration (for sending)
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id-here  # Replace with actual value
WHATSAPP_ACCESS_TOKEN=your-access-token-here        # Replace with actual value
```

**How to Get These:**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create or select your app
3. Add "WhatsApp" product
4. Go to WhatsApp > API Setup
5. Copy:
   - **Phone Number ID** → `WHATSAPP_PHONE_NUMBER_ID`
   - **Temporary Access Token** or **System User Access Token** → `WHATSAPP_ACCESS_TOKEN`

**Action Required:**
- [ ] Set up Meta Business Account (if not done)
- [ ] Create/configure WhatsApp Business API app
- [ ] Get `WHATSAPP_PHONE_NUMBER_ID`
- [ ] Get `WHATSAPP_ACCESS_TOKEN`
- [ ] Add both to `.env` file

**Status:** ⚠️ **NEEDS CONFIGURATION**

---

### 4. WhatsApp Receiving (Webhook) - ⚠️ NEEDS CONFIGURATION

Add these to your `.env` file:

```bash
# WhatsApp Business API Configuration (for receiving)
WHATSAPP_VERIFY_TOKEN=your-secure-random-token-here
WHATSAPP_APP_SECRET=your-app-secret-here
```

**How to Get These:**
1. **WHATSAPP_VERIFY_TOKEN**: Create a secure random string (e.g., use `openssl rand -hex 32`)
   - This is the token you'll use when configuring the webhook in Meta
   - Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

2. **WHATSAPP_APP_SECRET**: Found in Meta for Developers
   - Go to App Settings > Basic
   - Copy the "App Secret" (click "Show" to reveal)

**Webhook Configuration:**
1. In Meta for Developers, go to WhatsApp > Configuration
2. Click "Edit" on Webhook
3. Set:
   - **Callback URL**: `https://your-domain.com/api/webhooks/whatsapp/inbound`
   - **Verify Token**: Use the same value as `WHATSAPP_VERIFY_TOKEN` in `.env`
4. Subscribe to `messages` field
5. Click "Verify and Save"

**Action Required:**
- [x] ✅ Generate `WHATSAPP_VERIFY_TOKEN` (secure random string) - **DONE**
- [ ] Get `WHATSAPP_APP_SECRET` from Meta
- [x] ✅ Add verify token to `.env` file - **DONE** (App Secret still needed)
- [ ] Configure webhook in Meta Business Manager
- [ ] Set webhook URL to your production domain
- [ ] Verify webhook is working

**Status:** ⚠️ **NEEDS CONFIGURATION**

---

## 🚀 Quick Start Guide

### Immediate Actions (Can Do Now):

1. **Test Email Sending** (Already works!)
   - Go to CRM Dashboard
   - Select any client
   - Send a test email
   - ✅ Should work immediately

2. **Enable Email Receiving** (5 minutes)
   - Add IMAP variables to `.env`
   - Restart server
   - Send test email to `jon@professionaldiver.app`
   - Check CRM Dashboard for new client/communication

### Next Steps (Requires Meta Setup):

3. **Enable WhatsApp Sending** (15-30 minutes)
   - Set up Meta Business Account
   - Create WhatsApp Business API app
   - Get credentials
   - Add to `.env`
   - Test sending from CRM

4. **Enable WhatsApp Receiving** (15-30 minutes)
   - Get webhook credentials
   - Configure webhook in Meta
   - Test receiving messages

---

## 📝 Environment Variables Summary

### Currently Set (✅):
```bash
SMTP_USER=jon@professionaldiver.app
SMTP_PASSWORD=sugdzjwhokdfxcuf
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=jon@professionaldiver.app
EMAIL_FROM_NAME=Diver Well Training - Professional Diver App
```

### Need to Add (⚠️):
```bash
# Email Receiving
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=jon@professionaldiver.app
IMAP_PASSWORD=sugdzjwhokdfxcuf
IMAP_MAILBOX=INBOX
EMAIL_POLL_INTERVAL=600000

# WhatsApp Sending
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_ACCESS_TOKEN=your-access-token-here

# WhatsApp Receiving
WHATSAPP_VERIFY_TOKEN=your-secure-random-token-here
WHATSAPP_APP_SECRET=your-app-secret-here
```

---

## 🧪 Testing Checklist

### Email Sending
- [x] ✅ Already working - can test immediately

### Email Receiving
- [ ] Add IMAP config to `.env`
- [ ] Restart server
- [ ] Send test email to `jon@professionaldiver.app`
- [ ] Verify email appears in CRM within polling interval
- [ ] Verify client auto-created (if new sender)

### WhatsApp Sending
- [ ] Add WhatsApp credentials to `.env`
- [ ] Restart server
- [ ] Send test WhatsApp from CRM
- [ ] Verify message arrives

### WhatsApp Receiving
- [ ] Configure webhook in Meta
- [ ] Send test message to WhatsApp Business number
- [ ] Verify message appears in CRM
- [ ] Verify client auto-created (if new sender)

---

## 🔒 Security Reminders

- ✅ Never commit `.env` file to git
- ✅ Use App Passwords for Google Workspace (not regular passwords)
- ✅ Keep `WHATSAPP_APP_SECRET` secure
- ✅ Use strong, random `WHATSAPP_VERIFY_TOKEN`
- ✅ Webhook signature verification is enabled

---

## 📞 Support Resources

- **Google Workspace App Passwords**: https://support.google.com/accounts/answer/185833
- **Meta for Developers**: https://developers.facebook.com/
- **WhatsApp Business API Docs**: https://developers.facebook.com/docs/whatsapp

---

## Summary

**What Works Now:**
- ✅ Email sending from CRM

**What Needs Configuration:**
- ⚠️ Email receiving (just add IMAP variables)
- ⚠️ WhatsApp sending (requires Meta setup)
- ⚠️ WhatsApp receiving (requires Meta setup + webhook)

**Estimated Time to Complete:**
- Email receiving: 5 minutes
- WhatsApp setup: 30-60 minutes (first time)
