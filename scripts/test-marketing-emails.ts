#!/usr/bin/env tsx
/**
 * Test Marketing Email Templates
 * 
 * Sends test emails using the marketing email templates to verify they work correctly.
 * Uses Google Workspace SMTP (nodemailer) for email delivery.
 * 
 * Usage:
 *   tsx scripts/test-marketing-emails.ts
 * 
 * Requires:
 *   - SMTP configuration via EMAIL_SERVER or individual SMTP settings
 *   - EMAIL_FROM environment variable (optional, defaults to noreply@professionaldiver.app)
 */

import nodemailer from 'nodemailer';
import { readFile } from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Test email addresses
const TEST_EMAILS = [
  'lalabalavu.jon@gmail.com',
  'sephdee@hotmail.com'
];

// Get email configuration from environment
const EMAIL_SERVER = process.env.EMAIL_SERVER;
const FROM_EMAIL = process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || 'noreply@professionaldiver.app';
const FROM_NAME = process.env.EMAIL_FROM_NAME || process.env.SENDGRID_FROM_NAME || 'Diver Well Training - Professional Diver App';

// SMTP configuration (for Google Workspace)
let transporter: nodemailer.Transporter;

if (EMAIL_SERVER && EMAIL_SERVER.startsWith('smtp://')) {
  // Parse SMTP URL format: smtp://user:pass@host:port
  try {
    transporter = nodemailer.createTransport(EMAIL_SERVER);
    console.log('✅ Using EMAIL_SERVER configuration');
  } catch (error: any) {
    console.error('❌ Error creating transporter from EMAIL_SERVER:', error.message);
    process.exit(1);
  }
} else {
  // Use individual SMTP settings for Google Workspace
  const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
  const SMTP_USER = process.env.SMTP_USER || process.env.GMAIL_USER;
  const SMTP_PASSWORD = process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASSWORD;
  const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

  if (!SMTP_USER || !SMTP_PASSWORD) {
    console.error('❌ Error: SMTP credentials are required');
    console.error('');
    console.error('   Options to configure:');
    console.error('   1. Use EMAIL_SERVER: smtp://user:pass@smtp.gmail.com:587');
    console.error('   2. Set individual variables in .env:');
    console.error('      - SMTP_USER or GMAIL_USER (your Google Workspace email)');
    console.error('      - SMTP_PASSWORD or GMAIL_APP_PASSWORD (App Password, not regular password)');
    console.error('      - SMTP_HOST (default: smtp.gmail.com)');
    console.error('      - SMTP_PORT (default: 587)');
    console.error('');
    console.error('   For Google Workspace/Gmail, you need an App Password:');
    console.error('   https://support.google.com/accounts/answer/185833');
    console.error('');
    console.error('   Example .env configuration:');
    console.error('   SMTP_USER=your-email@yourdomain.com');
    console.error('   SMTP_PASSWORD=your-app-password');
    process.exit(1);
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE, // true for 465, false for other ports
    auth: {
      user: SMTP_USER.trim(),
      pass: SMTP_PASSWORD.trim()
    },
    tls: {
      rejectUnauthorized: false // For Google Workspace, sometimes needed
    }
  });
  console.log(`✅ Using SMTP configuration: ${SMTP_HOST}:${SMTP_PORT}`);
}

/**
 * Load email template from marketing materials
 */
async function loadEmailTemplate(templateName: string): Promise<string> {
  try {
    const templatePath = path.join(process.cwd(), 'marketing', 'email-sequences', `${templateName}.md`);
    const content = await readFile(templatePath, 'utf-8');
    
    // Extract the first email template from the markdown file
    const sections = content.split('---');
    if (sections.length > 1) {
      // Get the body from the first template
      const firstSection = sections[1];
      const lines = firstSection.split('\n');
      const bodyStart = lines.findIndex(line => line.trim().startsWith('Hi [First Name]'));
      if (bodyStart !== -1) {
        return lines.slice(bodyStart).join('\n').trim();
      }
    }
    
    // Fallback: return the content as-is
    return content;
  } catch (error) {
    console.error(`Error loading template ${templateName}:`, error);
    throw error;
  }
}

/**
 * Send test email using Generic Initial Outreach template
 */
async function sendTestEmail(to: string, templateName: string = 'initial-outreach'): Promise<boolean> {
  try {
    // Load the template
    const templateBody = await loadEmailTemplate(templateName);
    
    // Replace template variables
    const personalizedBody = templateBody
      .replace(/\[First Name\]/g, 'Test')
      .replace(/I'm reaching out because \[Company Name\] serves commercial divers — exactly the audience we reach on Professional Diver Training\./g, 'I\'m reaching out because Diver Well Training serves commercial divers — exactly the audience we reach on Professional Diver App.')
      .replace(/\[Company Name\]/g, 'Test Company')
      .replace(/\[Your Name\]/g, 'Diver Well Training')
      .replace(/Professional Diver Training/g, 'Professional Diver App')
      .replace(/1pull@professionaldiver\.app/g, 'jon@professionaldiver.app');
    
    // Extract subject from template (if available)
    const subjectMatch = templateBody.match(/\*\*Subject:\*\* (.+)/);
    const subject = subjectMatch 
      ? subjectMatch[1].trim()
      : 'Test Email - Partnership Opportunity — Professional Diver Training';
    
    // Convert markdown to HTML (simple conversion)
    const htmlBody = personalizedBody
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>\n')
      .replace(/^(.+)$/gm, '<p>$1</p>');
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          h1 { color: #1e40af; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #64748b; font-size: 14px; }
        </style>
      </head>
      <body>
        ${htmlBody}
        <div class="footer">
          <p><strong>Professional Diver App</strong></p>
          <p>jon@professionaldiver.app | +447448320513</p>
          <p>Diver Well Training - Professional Diver App</p>
        </div>
      </body>
      </html>
    `;
    
    const mailOptions = {
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      subject: `[TEST] ${subject}`,
      text: personalizedBody,
      html: html
    };
    
    console.log(`📧 Sending test email to ${to}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Successfully sent test email to ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    
    return true;
  } catch (error: any) {
    console.error(`❌ Error sending email to ${to}:`, error.message);
    if (error.response) {
      console.error('   Response:', error.response);
    }
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting Marketing Email Test...\n');
  console.log(`📬 Test recipients: ${TEST_EMAILS.join(', ')}`);
  console.log(`📤 From: ${FROM_NAME} <${FROM_EMAIL}>\n`);
  
  // Verify SMTP connection
  try {
    console.log('🔌 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified\n');
  } catch (error: any) {
    console.error('❌ SMTP connection failed:', error.message);
    console.error('\nPlease check your SMTP credentials and configuration.');
    process.exit(1);
  }
  
  const results = await Promise.allSettled(
    TEST_EMAILS.map(email => sendTestEmail(email, 'initial-outreach'))
  );
  
  console.log('\n📊 Test Results:');
  console.log('─'.repeat(50));
  
  results.forEach((result, index) => {
    const email = TEST_EMAILS[index];
    if (result.status === 'fulfilled' && result.value) {
      console.log(`✅ ${email} - Email sent successfully`);
    } else {
      console.log(`❌ ${email} - Failed to send email`);
      if (result.status === 'rejected') {
        console.log(`   Error: ${result.reason?.message || 'Unknown error'}`);
      }
    }
  });
  
  console.log('─'.repeat(50));
  
  const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
  const totalCount = TEST_EMAILS.length;
  
  if (successCount === totalCount) {
    console.log(`\n🎉 All ${totalCount} test emails sent successfully!`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  ${successCount}/${totalCount} emails sent successfully`);
    process.exit(1);
  }
}

// Run if executed directly
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

export { sendTestEmail, loadEmailTemplate };
