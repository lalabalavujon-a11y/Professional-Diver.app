/**
 * Send Test Emails Script
 * 
 * This script sends test emails to preview what users will receive:
 * 1. Welcome Trial Email (24hr Free Trial)
 * 2. Purchase Thank You Email (Subscription)
 * 
 * Usage:
 *   tsx scripts/send-test-emails.ts <email>
 * 
 * Example:
 *   tsx scripts/send-test-emails.ts lalabalavu.jon@gmail.com
 */

import { config } from 'dotenv';
import { emailMarketing } from '../server/email-marketing';

config();
config({ path: '.env.local', override: false });

async function sendTestEmails(email: string) {
  console.log('📧 Sending Test Emails');
  console.log(`   Recipient: ${email}\n`);

  // Test 1: Welcome Trial Email
  console.log('1️⃣  Sending Welcome Trial Email (24hr Free Trial)...');
  try {
    const trialResult = await emailMarketing.sendWelcomeTrialEmail({
      name: 'Jon Lalabalavu',
      email: email,
    });
    
    if (trialResult) {
      console.log('   ✅ Welcome Trial Email sent successfully!\n');
    } else {
      console.log('   ⚠️  Welcome Trial Email failed (check email service configuration)\n');
    }
  } catch (error) {
    console.error('   ❌ Error sending Welcome Trial Email:', error);
    console.log('');
  }

  // Wait a moment between emails
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Purchase Thank You Email
  console.log('2️⃣  Sending Purchase Thank You Email (Subscription)...');
  try {
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1); // 1 month from now

    const purchaseResult = await emailMarketing.sendPurchaseThankYouEmail({
      name: 'Jon Lalabalavu',
      email: email,
      subscriptionType: 'MONTHLY',
      expirationDate: expirationDate,
      loginEmail: email,
      loginPassword: 'TempPassword123!', // Test password
    });
    
    if (purchaseResult) {
      console.log('   ✅ Purchase Thank You Email sent successfully!\n');
    } else {
      console.log('   ⚠️  Purchase Thank You Email failed (check email service configuration)\n');
    }
  } catch (error) {
    console.error('   ❌ Error sending Purchase Thank You Email:', error);
    console.log('');
  }

  console.log('✨ Test email sending complete!');
  console.log('\n📬 Check your inbox at:', email);
  console.log('   - Welcome Trial Email: "Welcome to Professional Diver - Your 24-Hour Trial Starts Now! 🤿"');
  console.log('   - Purchase Thank You Email: "Welcome to Professional Diver - Thank You for Your Purchase! 🎉"');
  console.log('\n💡 Note: If emails are not received, check:');
  console.log('   - SMTP_PASSWORD or SENDGRID_API_KEY environment variables');
  console.log('   - Email service configuration in .env or .env.local');
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Send Test Emails Script

Usage:
  tsx scripts/send-test-emails.ts <email>

Example:
  tsx scripts/send-test-emails.ts lalabalavu.jon@gmail.com

This script sends two test emails:
  1. Welcome Trial Email - What users receive when they sign up for the 24hr free trial
  2. Purchase Thank You Email - What users receive when they purchase a subscription

Environment Variables:
  SMTP_PASSWORD                  SMTP password for Google Workspace (optional)
  SENDGRID_API_KEY               SendGrid API key (optional)
    `);
    return;
  }

  const email = args[0];

  if (!email || !email.includes('@')) {
    console.error('❌ Please provide a valid email address');
    process.exit(1);
  }

  await sendTestEmails(email);
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});





