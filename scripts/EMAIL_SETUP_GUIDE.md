# Email Setup Guide for Marketing Email Tests

This guide will help you configure Google Workspace SMTP to send test marketing emails.

## Quick Setup

### Option 1: Using EMAIL_SERVER (Recommended)

Add this to your `.env` file:

```bash
EMAIL_SERVER=smtp://your-email@yourdomain.com:your-app-password@smtp.gmail.com:587
EMAIL_FROM=your-email@yourdomain.com
EMAIL_FROM_NAME=Professional Diver Training
```

### Option 2: Using Individual SMTP Settings

Add these to your `.env` file:

```bash
SMTP_USER=your-email@yourdomain.com
SMTP_PASSWORD=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_FROM=your-email@yourdomain.com
EMAIL_FROM_NAME=Professional Diver Training
```

## Getting a Google Workspace App Password

1. **Go to Google Account Settings:**
   - Visit: https://myaccount.google.com/
   - Click on "Security" in the left sidebar

2. **Enable 2-Step Verification** (if not already enabled):
   - This is required to generate App Passwords
   - Follow the prompts to set it up

3. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Or: Security → 2-Step Verification → App passwords
   - Select "Mail" as the app
   - Select "Other (Custom name)" as the device
   - Enter "Professional Diver Training" as the name
   - Click "Generate"
   - Copy the 16-character password (spaces don't matter)

4. **Use the App Password:**
   - Use this 16-character password (not your regular Google password)
   - Add it to your `.env` file as `SMTP_PASSWORD` or in the `EMAIL_SERVER` URL

## Testing the Configuration

Once you've added the credentials to your `.env` file, run:

```bash
npx tsx scripts/test-marketing-emails.ts
```

The script will:
- Verify SMTP connection
- Send test emails to `lalabalavu.jon@gmail.com` and `sephdee@hotmail.com`
- Use the "Generic Initial Outreach" template from your marketing materials

## Troubleshooting

### Error: "Invalid login"
- Make sure you're using an App Password, not your regular password
- Verify 2-Step Verification is enabled
- Check that the email address is correct

### Error: "Connection timeout"
- Check your firewall/network settings
- Verify SMTP_HOST is `smtp.gmail.com`
- Try SMTP_PORT `465` with `SMTP_SECURE=true` instead of `587`

### Error: "Authentication failed"
- Regenerate the App Password
- Make sure there are no extra spaces in the password
- Verify the email address matches your Google Workspace account

## For Google Workspace (Business) Accounts

If you're using a Google Workspace account (not personal Gmail):

1. **Admin Settings:**
   - Your admin may need to enable "Less secure app access" (not recommended)
   - Better: Use App Passwords (same process as above)

2. **SMTP Settings:**
   - Host: `smtp.gmail.com` (same as personal Gmail)
   - Port: `587` (TLS) or `465` (SSL)
   - Username: Your full email address
   - Password: App Password (16 characters)

## Security Notes

- **Never commit `.env` file to git** - it's already in `.gitignore`
- **App Passwords are safer** than using your main password
- **Rotate App Passwords** periodically for security
- **Use environment variables** in production (Railway, Replit, etc.)

## Example .env Configuration

```bash
# Email Configuration
EMAIL_SERVER=smtp://your-email@yourdomain.com:abcd-efgh-ijkl-mnop@smtp.gmail.com:587
EMAIL_FROM=your-email@yourdomain.com
EMAIL_FROM_NAME=Professional Diver Training

# OR use individual settings:
# SMTP_USER=your-email@yourdomain.com
# SMTP_PASSWORD=abcd-efgh-ijkl-mnop
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
```
