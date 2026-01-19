# WhatsApp Integration Setup Guide

## Quick Start

This guide will help you set up WhatsApp Business API integration for sending and receiving messages through your CRM.

## Step 1: Code Fix ✅ COMPLETE

The missing imports in `whatsapp-receiver-service.ts` have been fixed.

## Step 2: Generate Verify Token ✅ COMPLETE

A secure verify token has been generated for you:

```
74a791f7d874b6be82e9be74caab215c71d6e222ca1c52f69f69f6bedcc3a901
```

**Save this token** - you'll need it for both `.env` and Meta webhook configuration.

## Step 3: Meta Business Account Setup

### 3.1 Create/Verify Meta Business Account

1. Go to https://business.facebook.com/
2. Create or select existing Business Account
3. Verify business information

### 3.2 Create Meta App

1. Go to https://developers.facebook.com/
2. Click "My Apps" → "Create App"
3. Select "Business" type
4. Enter app name: "Professional Diver Training"
5. Add contact email: `jon@professionaldiver.app`

### 3.3 Add WhatsApp Product

1. In app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set Up"
3. Follow setup wizard

## Step 4: Get WhatsApp Credentials

### 4.1 Phone Number ID

1. In Meta app, go to **WhatsApp → API Setup**
2. Find "Phone number ID" (starts with numbers, e.g., `123456789012345`)
3. Copy this value → You'll use it for `WHATSAPP_PHONE_NUMBER_ID`

### 4.2 Access Token

1. In **WhatsApp → API Setup**
2. Find "Temporary access token" (for testing)
   - **Note:** Temporary tokens expire in 24 hours
   - For production, create a System User Access Token
3. Copy this value → You'll use it for `WHATSAPP_ACCESS_TOKEN`

### 4.3 App Secret

1. Go to **App Settings → Basic**
2. Find "App Secret"
3. Click "Show" and copy → You'll use it for `WHATSAPP_APP_SECRET`

## Step 5: Add Environment Variables

Add these to your `.env` file:

```bash
# WhatsApp Business API - Sending
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id-here
WHATSAPP_ACCESS_TOKEN=your-access-token-here

# WhatsApp Business API - Receiving (Webhook)
WHATSAPP_VERIFY_TOKEN=74a791f7d874b6be82e9be74caab215c71d6e222ca1c52f69f69f6bedcc3a901
WHATSAPP_APP_SECRET=your-app-secret-here
```

**Replace the placeholder values with your actual credentials from Meta.**

## Step 6: Configure Webhook

### 6.1 Get Your Webhook URL

**For Production:**
```
https://your-domain.com/api/webhooks/whatsapp/inbound
```

**For Local Development (using ngrok):**
1. Install ngrok: https://ngrok.com/
2. Run: `ngrok http 5000`
3. Use the ngrok URL: `https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp/inbound`

### 6.2 Configure in Meta

1. Go to Meta app → **WhatsApp → Configuration**
2. Click "Edit" on Webhook section
3. Enter:
   - **Callback URL**: Your webhook URL (from step 6.1)
   - **Verify Token**: `74a791f7d874b6be82e9be74caab215c71d6e222ca1c52f69f69f6bedcc3a901` (same as in `.env`)
4. Click "Verify and Save"
   - Meta will send a GET request to verify the webhook
   - Your server should respond with the challenge token

### 6.3 Subscribe to Webhook Fields

1. In webhook configuration, subscribe to:
   - ✅ `messages` (required for receiving messages)
   - ✅ `message_status` (optional, for delivery status)

## Step 7: Restart Server

After adding environment variables:

```bash
# Stop the server (Ctrl+C or pkill)
# Then restart:
npm run dev:api
```

## Step 8: Test WhatsApp Integration

### Test Sending (Outbound)

1. **Via CRM Dashboard:**
   - Go to `http://localhost:3000/crm`
   - Select a client (or create one with phone number)
   - Click "Send Message" → Select "WhatsApp"
   - Enter phone number (format: `+447448320513`)
   - Compose message
   - Click "Send"
   - Verify message arrives on recipient's WhatsApp

2. **Check Server Logs:**
   - Look for successful send confirmation
   - Check for any API errors

### Test Receiving (Inbound)

1. **Send Test Message:**
   - Send WhatsApp message to your Business number
   - Message should be received by webhook

2. **Verify in CRM:**
   - Go to `http://localhost:3000/crm`
   - Check if new client was auto-created (if new phone number)
   - Check client's communication timeline
   - Verify message appears as inbound WhatsApp

3. **Check Server Logs:**
   - Look for: `✅ Processed inbound WhatsApp message from +[number]`
   - Check for any errors in webhook processing

## Troubleshooting

### "WhatsApp API credentials not configured"
- ✅ Check environment variables are set in `.env`
- ✅ Restart server after adding variables
- ✅ Verify variable names match exactly (case-sensitive)

### "Invalid webhook signature"
- ✅ Verify `WHATSAPP_APP_SECRET` matches Meta app secret exactly
- ✅ Check webhook is receiving raw body (already handled in code)
- ✅ Ensure signature header is present: `x-hub-signature-256`

### "Webhook verification failed"
- ✅ Verify `WHATSAPP_VERIFY_TOKEN` matches in both `.env` and Meta webhook config
- ✅ Check webhook URL is accessible (use ngrok for local testing)
- ✅ Ensure webhook endpoint responds to GET requests for verification

### "Phone number format error"
- ✅ Ensure phone numbers include country code
- ✅ System handles UK number formatting automatically
- ✅ Format: `+[country][number]` (e.g., `+447448320513`)

### Messages not appearing in CRM
- ✅ Check server logs for processing errors
- ✅ Verify webhook is subscribed to `messages` field
- ✅ Check client auto-creation logic
- ✅ Verify database connection is working

## Production Considerations

### Access Token Management
- ⚠️ Temporary tokens expire in 24 hours
- ✅ For production, use System User Access Token
- 📝 Set up token refresh if using temporary tokens

### Webhook Security
- ✅ Signature verification is already implemented
- ✅ Ensure `WHATSAPP_APP_SECRET` is set in production
- ✅ Webhook will reject invalid signatures

### Rate Limits
- 📊 Meta has rate limits for WhatsApp messages
- 📊 Free tier: 1,000 conversations/month
- 📊 Monitor usage in Meta Business Manager

### Phone Number Format
- ✅ System automatically formats UK numbers
- ✅ Input: `+44 07448320513` → Output: `+447448320513`
- ✅ Always use international format: `+[country][number]`

## Next Steps

Once setup is complete:

1. ✅ Test sending WhatsApp from CRM
2. ✅ Test receiving WhatsApp via webhook
3. ✅ Verify client auto-creation works
4. ✅ Verify communications appear in timeline
5. ✅ Test phone number formatting (UK numbers)
6. ✅ Verify error handling for invalid credentials

## Support Resources

- **Meta for Developers**: https://developers.facebook.com/
- **WhatsApp Business API Docs**: https://developers.facebook.com/docs/whatsapp
- **Meta Business Manager**: https://business.facebook.com/

## Summary

**Code Status:** ✅ Complete (imports fixed)

**Configuration Status:** ⚠️ Needs your action:
- [ ] Set up Meta Business Account
- [ ] Create WhatsApp Business API app
- [ ] Get credentials (Phone Number ID, Access Token, App Secret)
- [ ] Add environment variables to `.env`
- [ ] Configure webhook in Meta
- [ ] Test sending and receiving

**Estimated Time:** 30-60 minutes (first time setup)
