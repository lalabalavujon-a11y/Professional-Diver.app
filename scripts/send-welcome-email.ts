import { config } from 'dotenv';
import { emailMarketing } from "../server/email-marketing.js";

// Load environment variables from .env.local
config();
config({ path: '.env.local', override: false });

async function sendWelcomeEmail() {
  const email = "lalabalavu.jon@gmail.com";
  const name = "Jon Lalabalavu";
  const password = "admin123";
  const role = "SUPER_ADMIN";

  console.log(`📧 Sending welcome email to ${email}...`);

  const success = await emailMarketing.sendWelcomeAdminEmail({
    email,
    name,
    password,
    role,
    isSuperAdmin: true,
    isPartnerAdmin: false,
  });

  if (success) {
    console.log(`✅ Welcome email sent successfully to ${email}!`);
  } else {
    console.log(`⚠️ Email not sent. Check if SENDGRID_API_KEY is configured.`);
    console.log(`\nTo send emails, set the SENDGRID_API_KEY environment variable:`);
    console.log(`export SENDGRID_API_KEY=your_sendgrid_api_key_here`);
    console.log(`\nOr copy the email content from WELCOME_EMAILS_FINAL.md and send manually.`);
  }
}

sendWelcomeEmail().catch(console.error);

