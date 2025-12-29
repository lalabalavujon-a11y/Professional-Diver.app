#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('\n🚀 Google Workspace Email Setup\n');
console.log('='.repeat(50));

// Check if .env.local exists
const envLocalPath = join(process.cwd(), '.env.local');
const envPath = join(process.cwd(), '.env');

let envContent = '';
if (existsSync(envLocalPath)) {
  envContent = readFileSync(envLocalPath, 'utf-8');
  console.log('✅ Found .env.local file');
} else if (existsSync(envPath)) {
  envContent = readFileSync(envPath, 'utf-8');
  console.log('✅ Found .env file');
} else {
  console.log('📝 Creating new .env.local file...');
}

// Check if SMTP is already configured
if (envContent.includes('SMTP_PASSWORD') && envContent.includes('SMTP_USER')) {
  const userMatch = envContent.match(/SMTP_USER=(.+)/);
  const passMatch = envContent.match(/SMTP_PASSWORD=(.+)/);
  if (userMatch && passMatch && passMatch[1] && !passMatch[1].includes('your_')) {
    console.log('\n✅ Google Workspace SMTP already configured!');
    console.log(`   Email: ${userMatch[1]}`);
    console.log(`   Password: ${passMatch[1].substring(0, 4)}...`);
    console.log('\n📧 Ready to send emails!');
    console.log('   Run: node --import tsx/esm scripts/send-welcome-email.ts\n');
    process.exit(0);
  }
}

console.log('\n📋 Setup Steps:');
console.log('\n1. Enable 2-Step Verification:');
console.log('   → https://myaccount.google.com/security');
console.log('   → Click "2-Step Verification" and enable it');

console.log('\n2. Generate App Password:');
console.log('   → https://myaccount.google.com/apppasswords');
console.log('   → Select app: Mail');
console.log('   → Select device: Other (Custom name)');
console.log('   → Name: "Professional Divers App"');
console.log('   → Copy the 16-character password (remove spaces)');

console.log('\n3. Configure Environment Variables:');
console.log('   Email: 1pull@professionaldiver.app');
console.log('   Password: Your 16-character App Password');

console.log('\n' + '='.repeat(50));
console.log('\n💡 Quick Setup:');
console.log('\n   Option 1: Use this script');
console.log('   node --import tsx/esm scripts/setup-google-workspace-email.ts your_app_password_here');

console.log('\n   Option 2: Add to .env.local manually');
console.log('   echo "SMTP_USER=1pull@professionaldiver.app" >> .env.local');
console.log('   echo "SMTP_PASSWORD=your_app_password" >> .env.local');

console.log('\n   Option 3: Set environment variables');
console.log('   export SMTP_USER=1pull@professionaldiver.app');
console.log('   export SMTP_PASSWORD=your_app_password\n');

// Check if App Password provided as argument
const appPassword = process.argv[2];
if (appPassword && appPassword.length >= 16) {
  console.log('✅ App Password provided! Adding to .env.local...\n');
  
  // Add or update SMTP configuration
  const smtpConfig = `
# Google Workspace SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=1pull@professionaldiver.app
SMTP_PASSWORD=${appPassword}
`;

  if (envContent.includes('SMTP_USER')) {
    // Update existing
    envContent = envContent.replace(/SMTP_HOST=.*/g, 'SMTP_HOST=smtp.gmail.com');
    envContent = envContent.replace(/SMTP_PORT=.*/g, 'SMTP_PORT=587');
    envContent = envContent.replace(/SMTP_USER=.*/g, 'SMTP_USER=1pull@professionaldiver.app');
    envContent = envContent.replace(/SMTP_PASSWORD=.*/g, `SMTP_PASSWORD=${appPassword}`);
  } else {
    // Add new
    envContent += smtpConfig;
  }
  
  writeFileSync(envLocalPath, envContent);
  console.log('✅ Google Workspace SMTP configuration saved to .env.local!');
  console.log('\n📧 Ready to send welcome email!');
  console.log('   Run: node --import tsx/esm scripts/send-welcome-email.ts\n');
} else if (appPassword) {
  console.log('❌ Invalid App Password format. Google App Passwords are 16 characters.');
  console.log('   Example: abcdefghijklmnop\n');
}






