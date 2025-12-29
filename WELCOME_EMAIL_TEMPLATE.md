# Welcome Email Template
## Professional Divers App by Diver Well Training

---

## Email Template (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Professional Divers App</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 0;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0066CC 0%, #004499 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Professional Divers App</h1>
      <p style="color: #e0e0e0; margin: 10px 0 0 0; font-size: 16px;">by Diver Well Training</p>
    </div>

    <!-- Main Content -->
    <div style="padding: 40px 30px;">
      
      <!-- Welcome Message -->
      <h2 style="color: #0066CC; margin-top: 0; font-size: 24px;">Welcome, {{NAME}}! 🎉</h2>
      
      <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
        Thank you for joining Professional Divers App! We're excited to have you on board. This email contains everything you need to get started, including your login credentials, app setup instructions, and partner affiliate program details.
      </p>

      <!-- Login Credentials Section -->
      <div style="background: #f0f9ff; border-left: 4px solid #0066CC; padding: 20px; margin: 30px 0; border-radius: 8px;">
        <h3 style="color: #0066CC; margin-top: 0; font-size: 20px;">🔐 Your Login Credentials</h3>
        
        <div style="background: #ffffff; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <p style="margin: 8px 0; font-size: 14px;"><strong>Email:</strong> <span style="color: #0066CC; font-family: monospace;">{{EMAIL}}</span></p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Password:</strong> <span style="color: #0066CC; font-family: monospace;">{{PASSWORD}}</span></p>
          <p style="margin: 8px 0; font-size: 14px;"><strong>Role:</strong> <span style="color: #0066CC;">{{ROLE}}</span></p>
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <a href="https://professionaldiver.app/signin" 
             style="display: inline-block; background: #0066CC; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Login to Your Account
          </a>
        </div>

        <p style="font-size: 12px; color: #666; margin-top: 15px; margin-bottom: 0;">
          ⚠️ <strong>Security Note:</strong> Please change your password after your first login for security purposes. You can update it in your Profile Settings.
        </p>
      </div>

      <!-- App Setup Instructions -->
      <div style="background: #fefce8; border-left: 4px solid #fbbf24; padding: 20px; margin: 30px 0; border-radius: 8px;">
        <h3 style="color: #92400e; margin-top: 0; font-size: 20px;">📱 Mobile App Setup Instructions</h3>
        
        <p style="font-size: 15px; color: #333; margin-bottom: 15px;">
          Professional Divers App works perfectly on mobile devices! You can install it on your phone or tablet for quick access, just like a native app.
        </p>

        <div style="margin: 20px 0;">
          <h4 style="color: #92400e; font-size: 16px; margin-bottom: 10px;">🍎 For iPhone/iPad Users:</h4>
          <ol style="margin: 0; padding-left: 20px; color: #333;">
            <li style="margin-bottom: 8px;">Open <strong>Safari</strong> browser (not Chrome)</li>
            <li style="margin-bottom: 8px;">Navigate to <strong>professionaldiver.app</strong></li>
            <li style="margin-bottom: 8px;">Tap the <strong>Share button</strong> (square with arrow) at the bottom</li>
            <li style="margin-bottom: 8px;">Scroll down and tap <strong>"Add to Home Screen"</strong></li>
            <li style="margin-bottom: 8px;">Tap <strong>"Add"</strong> to finish</li>
          </ol>
        </div>

        <div style="margin: 20px 0;">
          <h4 style="color: #92400e; font-size: 16px; margin-bottom: 10px;">🤖 For Android Users:</h4>
          <ol style="margin: 0; padding-left: 20px; color: #333;">
            <li style="margin-bottom: 8px;">Open <strong>Chrome</strong> browser</li>
            <li style="margin-bottom: 8px;">Navigate to <strong>professionaldiver.app</strong></li>
            <li style="margin-bottom: 8px;">Tap the <strong>three-dot menu</strong> (⋮) in the top-right</li>
            <li style="margin-bottom: 8px;">Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong></li>
            <li style="margin-bottom: 8px;">Tap <strong>"Add"</strong> to confirm</li>
          </ol>
        </div>

        <div style="text-align: center; margin-top: 25px;">
          <a href="https://professionaldiver.app/install-app" 
             style="display: inline-block; background: #fbbf24; color: #333; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
            View Full Installation Guide
          </a>
        </div>

        <p style="font-size: 12px; color: #666; margin-top: 15px; margin-bottom: 0;">
          💡 <strong>Tip:</strong> Once installed, the app will open in full-screen mode and work offline for previously viewed content!
        </p>
      </div>

      <!-- Partner Affiliate Program Section -->
      {{AFFILIATE_SECTION}}

      <!-- Getting Started -->
      <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 30px 0; border-radius: 8px;">
        <h3 style="color: #15803d; margin-top: 0; font-size: 20px;">🚀 Getting Started</h3>
        
        <p style="font-size: 15px; color: #333; margin-bottom: 15px;">
          Here's what you can do right now:
        </p>

        <ul style="margin: 0; padding-left: 20px; color: #333;">
          <li style="margin-bottom: 10px;"><strong>Explore Learning Tracks:</strong> Browse our comprehensive diving education courses</li>
          <li style="margin-bottom: 10px;"><strong>Take Practice Exams:</strong> Test your knowledge with timed mock examinations</li>
          <li style="margin-bottom: 10px;"><strong>Use AI Tutor:</strong> Get personalized help from our AI-powered diving consultant</li>
          <li style="margin-bottom: 10px;"><strong>Track Progress:</strong> Monitor your learning journey with detailed analytics</li>
          <li style="margin-bottom: 10px;"><strong>Access Admin Dashboard:</strong> {{ADMIN_FEATURES}}</li>
        </ul>

        <div style="text-align: center; margin-top: 25px;">
          <a href="https://professionaldiver.app/dashboard" 
             style="display: inline-block; background: #22c55e; color: #ffffff; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
            Go to Dashboard
          </a>
        </div>
      </div>

      <!-- Support Section -->
      <div style="border-top: 2px solid #e5e7eb; padding-top: 30px; margin-top: 40px;">
        <h3 style="color: #0066CC; font-size: 18px; margin-bottom: 15px;">💬 Need Help?</h3>
        
        <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
          Our support team is here to help you succeed:
        </p>

        <ul style="margin: 0; padding-left: 20px; color: #666; font-size: 14px;">
          <li style="margin-bottom: 8px;"><strong>Email:</strong> 1pull@professionaldiver.app</li>
          <li style="margin-bottom: 8px;"><strong>In-App Support:</strong> Use the chat feature in your dashboard</li>
          <li style="margin-bottom: 8px;"><strong>Documentation:</strong> Visit /install-app for setup guides</li>
        </ul>
      </div>

    </div>

    <!-- Footer -->
    <div style="background: #1f2937; color: #9ca3af; padding: 30px 20px; text-align: center;">
      <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #ffffff;">Professional Divers App</p>
      <p style="margin: 0 0 10px 0; font-size: 12px;">by Diver Well Training</p>
      <p style="margin: 0; font-size: 11px;">
        Brand-neutral commercial diving education platform
      </p>
      <p style="margin: 15px 0 0 0; font-size: 11px;">
        © 2025 Diver Well Training. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
```

---

## Email Template (Plain Text Version)

```
================================================================================
PROFESSIONAL DIVERS APP
by Diver Well Training
================================================================================

Welcome, {{NAME}}! 🎉

Thank you for joining Professional Divers App! We're excited to have you on board. 
This email contains everything you need to get started, including your login 
credentials, app setup instructions, and partner affiliate program details.

================================================================================
🔐 YOUR LOGIN CREDENTIALS
================================================================================

Email: {{EMAIL}}
Password: {{PASSWORD}}
Role: {{ROLE}}

Login URL: https://professionaldiver.app/signin

⚠️ Security Note: Please change your password after your first login for 
security purposes. You can update it in your Profile Settings.

================================================================================
📱 MOBILE APP SETUP INSTRUCTIONS
================================================================================

Professional Divers App works perfectly on mobile devices! You can install it on 
your phone or tablet for quick access, just like a native app.

🍎 For iPhone/iPad Users:
1. Open Safari browser (not Chrome)
2. Navigate to professionaldiver.app
3. Tap the Share button (square with arrow) at the bottom
4. Scroll down and tap "Add to Home Screen"
5. Tap "Add" to finish

🤖 For Android Users:
1. Open Chrome browser
2. Navigate to professionaldiver.app
3. Tap the three-dot menu (⋮) in the top-right
4. Select "Add to Home screen" or "Install app"
5. Tap "Add" to confirm

Full Installation Guide: https://professionaldiver.app/install-app

💡 Tip: Once installed, the app will open in full-screen mode and work offline 
for previously viewed content!

{{AFFILIATE_SECTION_TEXT}}

================================================================================
🚀 GETTING STARTED
================================================================================

Here's what you can do right now:

• Explore Learning Tracks: Browse our comprehensive diving education courses
• Take Practice Exams: Test your knowledge with timed mock examinations
• Use AI Tutor: Get personalized help from our AI-powered diving consultant
• Track Progress: Monitor your learning journey with detailed analytics
• Access Admin Dashboard: {{ADMIN_FEATURES_TEXT}}

Dashboard: https://professionaldiver.app/dashboard

================================================================================
💬 NEED HELP?
================================================================================

Our support team is here to help you succeed:

• Email: 1pull@professionaldiver.app
• In-App Support: Use the chat feature in your dashboard
• Documentation: Visit /install-app for setup guides

================================================================================

Professional Divers App by Diver Well Training
Brand-neutral commercial diving education platform

© 2025 Diver Well Training. All rights reserved.
```

---

## Personalized Email Content

### For Super Admin: Jon Lalabalavu

**Email:** lalabalavu.jon@gmail.com  
**Password:** [To be set/confirmed]  
**Role:** SUPER_ADMIN

**Admin Features Text:**
"Manage all platform features including user management, content editing, analytics, CRM, operations center, affiliate program, and system configuration."

**Affiliate Section:**
```html
<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
  <h3 style="color: #92400e; margin-top: 0; font-size: 20px;">💰 Partner Affiliate Program</h3>
  
  <p style="font-size: 15px; color: #333; margin-bottom: 15px;">
    As Super Admin, you have full access to manage the affiliate program. You can:
  </p>

  <ul style="margin: 0; padding-left: 20px; color: #333;">
    <li style="margin-bottom: 10px;">Create and manage affiliate accounts</li>
    <li style="margin-bottom: 10px;">Track all referrals and commissions</li>
    <li style="margin-bottom: 10px;">Process payouts via Stripe or PayPal</li>
    <li style="margin-bottom: 10px;">View comprehensive affiliate analytics</li>
    <li style="margin-bottom: 10px;">Manage sub-affiliates and commission structures</li>
  </ul>

  <div style="text-align: center; margin-top: 25px;">
    <a href="https://professionaldiver.app/affiliate" 
       style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
      Access Affiliate Dashboard
    </a>
  </div>

  <p style="font-size: 12px; color: #666; margin-top: 15px; margin-bottom: 0;">
    💡 <strong>Commission Rate:</strong> Standard affiliates earn 50% commission on all referrals. You can customize rates for premium partners.
  </p>
</div>
```

---

### For Partner Admin: Freddie Joseph

**Email:** freddierussell.joseph@yahoo.com  
**Password:** partner123  
**Role:** PARTNER_ADMIN

**Admin Features Text:**
"Access platform development tools, content management, user analytics, and operations center. Note: Affiliate and finance features are restricted."

**Affiliate Section:**
```html
<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 8px;">
  <h3 style="color: #92400e; margin-top: 0; font-size: 20px;">🤝 Partner Affiliate Program</h3>
  
  <p style="font-size: 15px; color: #333; margin-bottom: 15px;">
    As a Partner Admin, you can participate in our affiliate program to earn commissions by referring new users to the platform.
  </p>

  <div style="background: #ffffff; padding: 15px; border-radius: 6px; margin: 15px 0;">
    <p style="margin: 8px 0; font-size: 14px;"><strong>Commission Rate:</strong> <span style="color: #f59e0b; font-weight: bold;">50%</span> of all referred subscriptions</p>
    <p style="margin: 8px 0; font-size: 14px;"><strong>Minimum Payout:</strong> $50</p>
    <p style="margin: 8px 0; font-size: 14px;"><strong>Payout Schedule:</strong> Monthly</p>
  </div>

  <h4 style="color: #92400e; font-size: 16px; margin-top: 20px; margin-bottom: 10px;">How to Get Started:</h4>
  <ol style="margin: 0; padding-left: 20px; color: #333;">
    <li style="margin-bottom: 8px;">Log in to your account</li>
    <li style="margin-bottom: 8px;">Navigate to the Affiliate Dashboard</li>
    <li style="margin-bottom: 8px;">Create your affiliate account (if not already created)</li>
    <li style="margin-bottom: 8px;">Get your unique affiliate code (format: PD12345678)</li>
    <li style="margin-bottom: 8px;">Share your referral link: <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px;">https://professionaldiver.app/?ref=YOUR_CODE</code></li>
    <li style="margin-bottom: 8px;">Track your referrals and earnings in real-time</li>
  </ol>

  <div style="text-align: center; margin-top: 25px;">
    <a href="https://professionaldiver.app/affiliate" 
       style="display: inline-block; background: #f59e0b; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">
      Access Affiliate Dashboard
    </a>
  </div>

  <p style="font-size: 12px; color: #666; margin-top: 15px; margin-bottom: 0;">
    💡 <strong>Tip:</strong> Share your referral link on social media, in emails, or on your website. Every successful referral earns you commission!
  </p>
</div>
```

---

### For Partner Admin: Dilo Suka

**Email:** deesuks@gmail.com  
**Password:** partner123  
**Role:** PARTNER_ADMIN

**Admin Features Text:**
"Access platform development tools, content management, user analytics, and operations center. Note: Affiliate and finance features are restricted."

**Affiliate Section:** (Same as Freddie Joseph)

---

## Email Sending Instructions

### Option 1: Manual Send
Copy the HTML template above, replace the placeholders:
- `{{NAME}}` - User's name
- `{{EMAIL}}` - User's email
- `{{PASSWORD}}` - User's password
- `{{ROLE}}` - User's role
- `{{AFFILIATE_SECTION}}` - Appropriate affiliate section
- `{{ADMIN_FEATURES}}` - Admin features description

### Option 2: Automated Send (Future Implementation)
The email template can be integrated into `server/email-marketing.ts` to send automatically when accounts are created.

---

## Quick Reference

### Login URLs:
- Sign In: https://professionaldiver.app/signin
- Dashboard: https://professionaldiver.app/dashboard
- Affiliate Dashboard: https://professionaldiver.app/affiliate
- Install Guide: https://professionaldiver.app/install-app

### Support:
- Email: 1pull@professionaldiver.app
- In-App: Chat feature in dashboard

---

**Template Created:** January 2025  
**Version:** 1.0

