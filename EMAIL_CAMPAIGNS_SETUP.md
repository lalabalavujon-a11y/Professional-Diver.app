# Email Campaigns Setup Guide

This guide explains how to set up and use the email campaign system for Professional Diver.

## Overview

The email campaign system includes:
1. **Follow-up emails** for non-purchasers (7 emails over 60 days)
2. **Testimonial promo emails** for purchasers (offering free month for testimonials)
3. **Thank you emails** sent automatically after purchase
4. **Email tracking** to prevent duplicate sends

## Database Setup

First, push the new database schema to add the tracking tables:

```bash
npm run db:push
```

This will create:
- `email_campaigns` table - Tracks all emails sent to prevent duplicates
- `testimonials` table - Stores user-submitted testimonials

## Email Campaigns

### 1. Follow-Up Emails (Non-Purchasers)

Follow-up emails are sent to users whose trials have expired without purchasing. The schedule is:
- Email 1: Day 1 after trial expiry
- Email 2: Day 3
- Email 3: Day 7
- Email 4: Day 14
- Email 5: Day 21
- Email 6: Day 30
- Email 7: Day 60

#### Manual Trigger

Send to a specific user:
```bash
curl -X POST http://localhost:5000/api/email-campaigns/send-follow-up/user@example.com \
  -H "Content-Type: application/json" \
  -d '{"emailNumber": 1}'
```

Send to all eligible users:
```bash
npm run email-campaigns:follow-up
```

### 2. Testimonial Promo Emails (Purchasers)

Testimonial promo emails offer users a free month in exchange for a video and written testimonial.

#### Manual Trigger

Send to a specific user:
```bash
curl -X POST http://localhost:5000/api/email-campaigns/send-testimonial-promo \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

Send to all eligible users (subscribed for 14+ days):
```bash
npm run email-campaigns:testimonial
```

### 3. Thank You Emails

Thank you emails are automatically sent after successful purchase via the payment webhook. No manual action needed.

## Cron Job Setup

### Option 1: System Cron (Recommended for Production)

Edit your crontab:
```bash
crontab -e
```

Add the following lines:

```cron
# Follow-up emails - Daily at 9 AM
0 9 * * * cd /path/to/professional-diver.app-main && npm run email-campaigns:follow-up >> /var/log/email-campaigns.log 2>&1

# Testimonial promo emails - Weekly on Monday at 10 AM
0 10 * * 1 cd /path/to/professional-diver.app-main && npm run email-campaigns:testimonial >> /var/log/email-campaigns.log 2>&1
```

### Option 2: Cloudflare Workers Cron Trigger

If deploying to Cloudflare Workers, add to `wrangler.toml`:

```toml
[triggers]
crons = [
  "0 9 * * *",  # Daily at 9 AM - follow-up emails
  "0 10 * * 1"  # Weekly on Monday at 10 AM - testimonial promo
]
```

Then create a cron handler in your worker that calls the endpoints.

### Option 3: External Cron Service

Use services like:
- **EasyCron** - https://www.easycron.com/
- **Cron-job.org** - https://cron-job.org/
- **GitHub Actions** - Set up a scheduled workflow

Example GitHub Actions workflow (`.github/workflows/email-campaigns.yml`):

```yaml
name: Email Campaigns

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  follow-up:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm install
      - run: npm run email-campaigns:follow-up
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

## Email Service Configuration

The system supports two email providers:

### 1. Google Workspace (SMTP)

Set these environment variables:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=1pull@professionaldiver.app
SMTP_PASSWORD=your_app_password
```

### 2. SendGrid

Set this environment variable:
```bash
SENDGRID_API_KEY=your_sendgrid_api_key
```

The system will try SMTP first, then fall back to SendGrid.

## Email Tracking

All emails are tracked in the `email_campaigns` table to prevent duplicates. The system checks:
- If an email of this type has already been sent to the user
- For follow-up emails: which email number (1-7) has been sent
- Campaign status (sent, failed, bounced)

## Testimonials

Users can submit testimonials via the form (to be created at `/testimonials/submit`). When approved, they receive a free month added to their subscription.

### Testimonial Status Flow

1. **Pending** - Submitted, awaiting review
2. **Approved** - Approved for use in marketing
3. **Featured** - Featured on landing pages
4. **Rejected** - Not approved (doesn't qualify for free month)

### Awarding Free Month

When a testimonial is approved:
1. Update testimonial status to "approved"
2. Add 30 days to user's subscription expiration
3. Mark `freeMonthAwarded` as true
4. Update `freeMonthAwardedAt` timestamp

## Testing

### Test Follow-Up Emails

```bash
# Test email #1 to a specific user
curl -X POST http://localhost:5000/api/email-campaigns/send-follow-up/test@example.com \
  -H "Content-Type: application/json" \
  -d '{"emailNumber": 1}'
```

### Test Testimonial Promo

```bash
# Send testimonial promo to a user
curl -X POST http://localhost:5000/api/email-campaigns/send-testimonial-promo \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

## Monitoring

Check email campaign logs:
```bash
# View recent email sends
SELECT * FROM email_campaigns ORDER BY sent_at DESC LIMIT 50;

# Check failed emails
SELECT * FROM email_campaigns WHERE status = 'failed';

# Count emails sent by type
SELECT campaign_type, COUNT(*) as count 
FROM email_campaigns 
WHERE status = 'sent' 
GROUP BY campaign_type;
```

## Customization

Email templates can be customized based on:
- User subscription type
- Engagement level (can be enhanced to check user progress, quiz attempts, etc.)
- Days since subscription/trial expiry

To add more customization, modify the `email-marketing.ts` file and add logic to determine engagement levels based on user activity.

## Troubleshooting

### Emails Not Sending

1. Check email service configuration (SMTP or SendGrid)
2. Verify environment variables are set
3. Check server logs for errors
4. Verify database connection

### Duplicate Emails

The tracking system should prevent this, but if you see duplicates:
1. Check the `email_campaigns` table for existing records
2. Verify the tracking logic is working correctly
3. Check if multiple cron jobs are running

### Cron Job Not Running

1. Verify cron service is running: `systemctl status cron` (Linux)
2. Check cron logs: `grep CRON /var/log/syslog` (Linux)
3. Test the script manually first: `npm run email-campaigns:follow-up`

## Next Steps

1. Create the testimonials submission form at `/testimonials/submit`
2. Set up admin interface to review and approve testimonials
3. Add logic to automatically award free month when testimonial is approved
4. Enhance engagement level detection based on user activity metrics





