# SendGrid Setup Guide
## Send Welcome Emails Automatically

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create SendGrid Account (if you don't have one)

1. **Sign up for SendGrid:**
   - Go to: https://signup.sendgrid.com/
   - Choose the **Free Plan** (100 emails/day free forever)
   - Complete signup verification

### Step 2: Create API Key

1. **Login to SendGrid Dashboard:**
   - Go to: https://app.sendgrid.com/

2. **Create API Key:**
   - Click **Settings** → **API Keys** (left sidebar)
   - Click **Create API Key** button
   - Name it: `Professional Divers App`
   - Choose **Full Access** (or **Restricted Access** with Mail Send permissions)
   - Click **Create & View**
   - **⚠️ IMPORTANT:** Copy the API key immediately (you won't see it again!)

### Step 3: Verify Sender Identity

1. **Go to Settings → Sender Authentication**
2. **Choose one:**
   - **Single Sender Verification** (quickest for testing)
     - Click **Verify a Single Sender**
     - Fill in your details
     - Verify via email
   - **Domain Authentication** (recommended for production)
     - Add your domain (professionaldiver.app)
     - Add DNS records
     - Verify domain

### Step 4: Set API Key in Your Project

**Option A: Set Environment Variable (Temporary)**
```bash
export SENDGRID_API_KEY=your_api_key_here
```

**Option B: Add to .env file (Permanent)**
```bash
# Create or edit .env file in project root
echo "SENDGRID_API_KEY=your_api_key_here" >> .env
```

**Option C: Add to Cloudflare Workers Environment (Production)**
- Go to Cloudflare Dashboard → Workers & Pages → Your Worker
- Settings → Variables
- Add `SENDGRID_API_KEY` as environment variable

### Step 5: Send Welcome Email

Once the API key is set, run:

```bash
node --import tsx/esm scripts/send-welcome-email.ts
```

Or use the API endpoint:
```bash
curl -X POST http://localhost:5000/api/admin/send-welcome-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "lalabalavu.jon@gmail.com",
    "name": "Jon Lalabalavu",
    "password": "admin123",
    "role": "SUPER_ADMIN"
  }'
```

---

## ✅ Verification

After setting up, test with:

```bash
# Check if API key is set
echo $SENDGRID_API_KEY

# Send test email
node --import tsx/esm scripts/send-welcome-email.ts
```

You should see:
```
✅ Welcome email sent successfully to lalabalavu.jon@gmail.com!
```

---

## 🔧 Troubleshooting

### "API key not found"
- Make sure you've set `SENDGRID_API_KEY` environment variable
- Check `.env` file exists and contains the key
- Restart your terminal/server after setting the variable

### "Unauthorized" error
- Verify your API key is correct
- Check that the API key has "Mail Send" permissions
- Make sure sender email is verified in SendGrid

### "Sender email not verified"
- Go to SendGrid → Settings → Sender Authentication
- Verify your sender email address
- Wait a few minutes for verification to complete

---

## 📧 Email Limits

**Free Plan:**
- 100 emails/day
- Unlimited contacts
- Perfect for getting started

**Paid Plans:**
- Start at $19.95/month
- 50,000+ emails/month
- Advanced features

---

## 🔒 Security Best Practices

1. **Never commit API keys to Git**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Use Restricted API Keys**
   - Only grant "Mail Send" permissions
   - Don't use Full Access unless necessary

3. **Rotate Keys Regularly**
   - Change API keys every 90 days
   - Revoke old keys immediately

---

## 📚 Additional Resources

- **SendGrid Docs:** https://docs.sendgrid.com/
- **API Reference:** https://docs.sendgrid.com/api-reference
- **Node.js SDK:** https://github.com/sendgrid/sendgrid-nodejs

---

**Ready to send emails! 🎉**






