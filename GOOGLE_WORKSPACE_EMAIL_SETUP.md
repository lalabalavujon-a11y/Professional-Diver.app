# Google Workspace Email Setup
## Using 1pull@professionaldiver.app for Email Sending

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Enable 2-Step Verification

1. **Go to Google Account Settings:**
   - Visit: https://myaccount.google.com/security
   - Sign in with your Google Workspace admin account

2. **Enable 2-Step Verification:**
   - Click **2-Step Verification**
   - Follow the setup process
   - ⚠️ **Required** for App Passwords

### Step 2: Generate App Password

1. **Go to App Passwords:**
   - Visit: https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App Passwords

2. **Create App Password:**
   - Select app: **Mail**
   - Select device: **Other (Custom name)**
   - Enter name: **Professional Divers App**
   - Click **Generate**

3. **Copy the Password:**
   - You'll see a 16-character password like: `abcd efgh ijkl mnop`
   - ⚠️ **Copy it immediately** (you won't see it again!)
   - Remove spaces: `abcdefghijklmnop`

### Step 3: Configure Environment Variables

**Option A: Add to .env.local file**
```bash
# Google Workspace SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=1pull@professionaldiver.app
SMTP_PASSWORD=your_16_character_app_password_here
```

**Option B: Set environment variables**
```bash
export SMTP_USER=1pull@professionaldiver.app
export SMTP_PASSWORD=your_16_character_app_password_here
```

### Step 4: Send Welcome Email

Once configured, run:

```bash
node --import tsx/esm scripts/send-welcome-email.ts
```

---

## ✅ Verification

After setting up, test with:

```bash
# Check if SMTP is configured
echo $SMTP_PASSWORD

# Send test email
node --import tsx/esm scripts/send-welcome-email.ts
```

You should see:
```
✅ SMTP connection verified for 1pull@professionaldiver.app
✅ Welcome email sent to lalabalavu.jon@gmail.com via SMTP (Google Workspace)
```

---

## 🔧 Troubleshooting

### "Invalid login" error
- **Fix:** Make sure you're using an **App Password**, not your regular Google password
- **Fix:** Verify 2-Step Verification is enabled
- **Fix:** Check that SMTP_USER matches the email address exactly

### "Connection timeout" error
- **Fix:** Check firewall settings
- **Fix:** Verify SMTP_PORT is 587 (or 465 for SSL)
- **Fix:** Ensure SMTP_HOST is `smtp.gmail.com`

### "Sender address not verified"
- **Fix:** Make sure `1pull@professionaldiver.app` is a valid Google Workspace email
- **Fix:** Verify the email address in Google Workspace admin console

---

## 📧 Email Limits

**Google Workspace:**
- **Free/Starter:** 500 emails/day per user
- **Business Standard:** 2,000 emails/day per user
- **Business Plus:** 2,000 emails/day per user
- **Enterprise:** 2,000 emails/day per user

**Note:** For higher volumes, consider using SendGrid or similar service.

---

## 🔒 Security Best Practices

1. **Use App Passwords**
   - Never use your main Google password
   - App passwords are more secure
   - Can be revoked individually

2. **Never Commit Passwords**
   - Add `.env.local` to `.gitignore`
   - Use environment variables in production

3. **Rotate Passwords Regularly**
   - Change App Passwords every 90 days
   - Revoke old passwords immediately

---

## 📚 Additional Resources

- **Google Workspace Admin:** https://admin.google.com/
- **App Passwords Guide:** https://support.google.com/accounts/answer/185833
- **SMTP Settings:** https://support.google.com/a/answer/176600

---

## 🎯 Quick Command Reference

```bash
# Add SMTP password to .env.local
echo "SMTP_PASSWORD=your_app_password" >> .env.local

# Send welcome email
node --import tsx/esm scripts/send-welcome-email.ts

# Test SMTP connection (will be done automatically)
```

---

**Ready to send emails via Google Workspace! 🎉**






