# Environment Variables for CRM Email and WhatsApp Integration

## Email Sending Configuration

These variables are already configured for sending emails:

```bash
# SMTP Configuration (for sending emails)
SMTP_USER=jon@professionaldiver.app
SMTP_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=jon@professionaldiver.app
EMAIL_FROM_NAME=Diver Well Training - Professional Diver App

# OR use EMAIL_SERVER format:
# EMAIL_SERVER=smtp://user:pass@smtp.gmail.com:587
```

## Email Receiving Configuration (IMAP)

Add these to your `.env` file to enable inbound email receiving:

```bash
# IMAP Configuration (for receiving emails)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=jon@professionaldiver.app
IMAP_PASSWORD=your-app-password
IMAP_MAILBOX=INBOX
EMAIL_POLL_INTERVAL=600000
```

**Notes:**
- `IMAP_USER` and `IMAP_PASSWORD` can use the same values as `SMTP_USER` and `SMTP_PASSWORD` if using the same Google Workspace account
- `EMAIL_POLL_INTERVAL` is in milliseconds (600000 = 10 minutes)
- The service will automatically poll for new emails and process them into the CRM

**Phone Number Format:**
- WhatsApp phone numbers must be in international format: `+[country code][number]`
- For UK numbers: The system automatically removes the leading `0` after the country code
- Example: `+44 07448320513` or `+4407448320513` → automatically formatted to `+447448320513`
- Your business phone number: `+447448320513`

**Phone Number Format:**
- WhatsApp phone numbers must be in international format: `+[country code][number]`
- For UK numbers: Remove the leading `0` after the country code
- Example: `+44 07448320513` → `+447448320513`

## WhatsApp Business API Configuration

Add these to your `.env` file to enable WhatsApp message sending and receiving:

```bash
# WhatsApp Business API Configuration
# Sending (Outbound Messages)
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id-here
WHATSAPP_ACCESS_TOKEN=your-access-token-here

# Receiving (Inbound Messages via Webhook)
WHATSAPP_VERIFY_TOKEN=74a791f7d874b6be82e9be74caab215c71d6e222ca1c52f69f69f6bedcc3a901
WHATSAPP_APP_SECRET=your-app-secret-here
```

**Note:** The `WHATSAPP_VERIFY_TOKEN` above is a pre-generated secure token. Use this same value when configuring your webhook in Meta Business Manager.

**Setup Instructions:**

1. **Create Meta Business Account:**
   - Go to https://business.facebook.com/
   - Create or select a Business Account

2. **Set up WhatsApp Business API:**
   - Go to Meta for Developers: https://developers.facebook.com/
   - Create a new app or use existing
   - Add "WhatsApp" product to your app

3. **Configure Webhook:**
   - Webhook URL: `https://your-domain.com/api/webhooks/whatsapp/inbound`
   - Verify Token: Use a secure random string (set as `WHATSAPP_VERIFY_TOKEN`)
   - Subscribe to `messages` field

4. **Get Credentials:**
   - `WHATSAPP_APP_SECRET`: Found in App Settings > Basic
   - `WHATSAPP_PHONE_NUMBER_ID`: Found in WhatsApp > API Setup
   - `WHATSAPP_ACCESS_TOKEN`: Found in WhatsApp > API Setup (System User Access Token or User Access Token)
   - `WHATSAPP_VERIFY_TOKEN`: The token you set when configuring the webhook (can be any secure random string)

## Testing

### Test Email Sending
1. Go to CRM Dashboard
2. Select a client
3. Click "Send Message" > "Email"
4. Compose and send email
5. Verify email arrives at recipient

### Test Email Receiving
1. Send an email to `jon@professionaldiver.app` (or your configured IMAP_USER)
2. Wait for polling interval (or manually trigger: `GET /api/admin/email/receive`)
3. Check CRM Dashboard - new client should be created and communication logged

### Test WhatsApp Sending
1. Go to CRM Dashboard
2. Select a client with a phone number
3. Click "Send Message" > "WhatsApp"
4. Compose and send message
5. Verify message arrives at recipient's WhatsApp

### Test WhatsApp Receiving
1. Configure webhook in Meta Business Manager
2. Send a test message to your WhatsApp Business number
3. Check CRM Dashboard - new client should be created and communication logged

## Security Notes

- Never commit `.env` file to git
- Use App Passwords for Google Workspace (not regular passwords)
- Keep `WHATSAPP_APP_SECRET` secure
- Webhook signature verification is enabled for WhatsApp
