# How to Get Google App Password
## Step-by-Step Guide for 1pull@professionaldiver.app

---

## ⚠️ Important: This is NOT Your Regular Password

**Google App Password** is a **special 16-character password** that you generate specifically for apps. It's different from your regular email password.

---

## 📋 Step-by-Step Instructions

### Step 1: Sign In to Google Account

1. **Go to Google Account:**
   - Visit: https://myaccount.google.com/
   - Sign in with: **1pull@professionaldiver.app**

### Step 2: Enable 2-Step Verification (Required First!)

**⚠️ You MUST enable 2-Step Verification before you can create App Passwords**

1. **Go to Security Settings:**
   - Click **Security** in the left sidebar
   - Or go directly to: https://myaccount.google.com/security

2. **Enable 2-Step Verification:**
   - Find **"2-Step Verification"** section
   - Click **Get started** or **Turn on**
   - Follow the setup process:
     - Enter your phone number
     - Verify with a code sent via SMS or call
     - Confirm the setup

3. **Complete Setup:**
   - You'll see "2-Step Verification is on" ✅

### Step 3: Generate App Password

**Once 2-Step Verification is enabled, you can create App Passwords:**

1. **Go to App Passwords:**
   - Visit: https://myaccount.google.com/apppasswords
   - Or: Security → 2-Step Verification → App Passwords (at the bottom)

2. **Sign In Again (if prompted):**
   - Google may ask you to verify your identity again

3. **Create App Password:**
   - **Select app:** Choose **Mail**
   - **Select device:** Choose **Other (Custom name)**
   - **Enter name:** Type: `Professional Divers App`
   - Click **Generate**

4. **Copy the Password:**
   - You'll see a **16-character password** like: `abcd efgh ijkl mnop`
   - ⚠️ **IMPORTANT:** Copy it immediately - you won't see it again!
   - **Remove the spaces:** `abcdefghijklmnop`
   - This is your **SMTP_PASSWORD**

---

## 🎯 Quick Visual Guide

```
Google Account → Security → 2-Step Verification → App Passwords
                                                      ↓
                                          Select: Mail
                                          Device: Other (Custom name)
                                          Name: Professional Divers App
                                                      ↓
                                          Generate → Copy Password
```

---

## ✅ What You'll Get

- **16-character password** (no spaces)
- Example: `abcdefghijklmnop`
- This is what you'll use as `SMTP_PASSWORD`

---

## 🔧 After Getting the App Password

**Add it to your project:**

```bash
# Option 1: Use the setup script
node --import tsx/esm scripts/setup-google-workspace-email.ts abcdefghijklmnop

# Option 2: Add manually to .env.local
echo "SMTP_USER=1pull@professionaldiver.app" >> .env.local
echo "SMTP_PASSWORD=abcdefghijklmnop" >> .env.local
```

---

## ❓ Common Questions

### Q: Can I use my regular email password?
**A:** No! You must use an App Password. Regular passwords won't work with SMTP.

### Q: What if I don't see "App Passwords" option?
**A:** Make sure 2-Step Verification is enabled first. It won't appear until 2-Step is on.

### Q: Can I reuse the same App Password?
**A:** Yes! You can use the same App Password for multiple apps, or create separate ones for each.

### Q: What if I lose the App Password?
**A:** You'll need to generate a new one. Old passwords can't be viewed again.

### Q: Is this secure?
**A:** Yes! App Passwords are more secure than using your main password because:
- They can be revoked individually
- They're specific to one app/service
- Your main password stays private

---

## 🚨 Troubleshooting

### "App Passwords" option not showing?
- ✅ Make sure 2-Step Verification is enabled
- ✅ Wait a few minutes after enabling 2-Step
- ✅ Try refreshing the page

### "Invalid login" error when sending emails?
- ✅ Make sure you're using the App Password (16 characters)
- ✅ Remove all spaces from the password
- ✅ Verify SMTP_USER is exactly: `1pull@professionaldiver.app`

### Still having issues?
- Check: https://support.google.com/accounts/answer/185833
- Contact Google Workspace support if you're on a business account

---

## 📞 Need Help?

If you're having trouble:
1. Make sure you're signed in as **1pull@professionaldiver.app**
2. Verify 2-Step Verification is enabled
3. Check that you're using the App Password (not regular password)
4. Ensure the password has no spaces (16 characters total)

---

**Once you have the App Password, we can send the welcome email! 🎉**






