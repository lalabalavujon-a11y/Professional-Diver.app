/**
 * Test Email Campaigns Script
 * 
 * This script helps test email campaigns in development/staging environments
 * without actually sending emails to real users.
 * 
 * Usage:
 *   tsx scripts/test-email-campaigns.ts --help
 *   tsx scripts/test-email-campaigns.ts --follow-up test@example.com 1
 *   tsx scripts/test-email-campaigns.ts --testimonial test@example.com
 *   tsx scripts/test-email-campaigns.ts --thank-you test@example.com
 */

import { config } from 'dotenv';

config();
config({ path: '.env.local', override: false });

const BASE_URL = process.env.BASE_URL || process.env.VITE_API_URL || 'http://localhost:5000';

interface TestResult {
  success: boolean;
  message?: string;
  error?: string;
}

async function testFollowUpEmail(email: string, emailNumber: number): Promise<void> {
  console.log(`🧪 Testing follow-up email #${emailNumber} to ${email}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/email-campaigns/send-follow-up/${encodeURIComponent(email)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emailNumber }),
    });

    const result: TestResult = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Test successful: ${result.message || 'Email sent'}`);
    } else {
      console.error(`❌ Test failed: ${result.error || result.message || 'Unknown error'}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error testing follow-up email:', error);
    process.exit(1);
  }
}

async function testTestimonialPromo(email: string): Promise<void> {
  console.log(`🧪 Testing testimonial promo email to ${email}...`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/email-campaigns/send-testimonial-promo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const result: TestResult = await response.json();
    
    if (response.ok && result.success) {
      console.log(`✅ Test successful: ${result.message || 'Email sent'}`);
    } else {
      console.error(`❌ Test failed: ${result.error || result.message || 'Unknown error'}`);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error testing testimonial promo:', error);
    process.exit(1);
  }
}

async function testThankYouEmail(email: string): Promise<void> {
  console.log(`🧪 Testing thank you email to ${email}...`);
  console.log('⚠️  Note: Thank you emails are typically sent via payment webhook.');
  console.log('   This test endpoint may need to be created separately.\n');
  
  // This would require a test endpoint or direct function call
  console.log('✅ Test endpoint would be created if needed');
}

function printHelp() {
  console.log(`
Email Campaign Test Script

Usage:
  tsx scripts/test-email-campaigns.ts [options]

Options:
  --follow-up <email> <number>    Test follow-up email (1-7)
  --testimonial <email>           Test testimonial promo email
  --thank-you <email>             Test thank you email (placeholder)
  --help                          Show this help message

Examples:
  tsx scripts/test-email-campaigns.ts --follow-up test@example.com 1
  tsx scripts/test-email-campaigns.ts --testimonial test@example.com

Environment Variables:
  BASE_URL                        API base URL (default: http://localhost:5000)
  DATABASE_URL                    Database connection string
  SENDGRID_API_KEY               SendGrid API key (optional)
  SMTP_PASSWORD                  SMTP password (optional)
  `);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.length === 0) {
    printHelp();
    return;
  }

  console.log('🧪 Email Campaign Test Script');
  console.log(`   Base URL: ${BASE_URL}\n`);

  if (args[0] === '--follow-up') {
    const email = args[1];
    const emailNumber = parseInt(args[2] || '1');
    
    if (!email) {
      console.error('❌ Email address required for --follow-up');
      printHelp();
      process.exit(1);
    }
    
    if (emailNumber < 1 || emailNumber > 7) {
      console.error('❌ Email number must be between 1 and 7');
      process.exit(1);
    }
    
    await testFollowUpEmail(email, emailNumber);
  } else if (args[0] === '--testimonial') {
    const email = args[1];
    
    if (!email) {
      console.error('❌ Email address required for --testimonial');
      printHelp();
      process.exit(1);
    }
    
    await testTestimonialPromo(email);
  } else if (args[0] === '--thank-you') {
    const email = args[1];
    
    if (!email) {
      console.error('❌ Email address required for --thank-you');
      printHelp();
      process.exit(1);
    }
    
    await testThankYouEmail(email);
  } else {
    console.error('❌ Unknown option:', args[0]);
    printHelp();
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});





