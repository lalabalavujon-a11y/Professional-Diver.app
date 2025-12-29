#!/usr/bin/env node
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('\n🚀 SendGrid Setup for Professional Divers App\n');
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

// Check if SENDGRID_API_KEY already exists
if (envContent.includes('SENDGRID_API_KEY')) {
  const match = envContent.match(/SENDGRID_API_KEY=(.+)/);
  if (match && match[1] && !match[1].includes('your_')) {
    console.log('\n✅ SendGrid API Key already configured!');
    console.log(`   Current key: ${match[1].substring(0, 10)}...`);
    console.log('\n📧 Ready to send emails!');
    console.log('   Run: node --import tsx/esm scripts/send-welcome-email.ts\n');
    process.exit(0);
  }
}

console.log('\n📋 Setup Steps:');
console.log('\n1. Sign up for SendGrid (if needed):');
console.log('   → https://signup.sendgrid.com/');
console.log('   → Free plan: 100 emails/day forever');

console.log('\n2. Create API Key:');
console.log('   → Login: https://app.sendgrid.com/');
console.log('   → Settings → API Keys → Create API Key');
console.log('   → Name: "Professional Divers App"');
console.log('   → Permissions: Full Access (or Mail Send)');
console.log('   → ⚠️ Copy the key immediately!');

console.log('\n3. Verify Sender Email:');
console.log('   → Settings → Sender Authentication');
console.log('   → Verify a Single Sender (quickest)');
console.log('   → Use: noreply@diverwell.app');

console.log('\n' + '='.repeat(50));
console.log('\n💡 Quick Setup:');
console.log('\n   Option 1: Set environment variable');
console.log('   export SENDGRID_API_KEY=your_key_here');
console.log('   node --import tsx/esm scripts/send-welcome-email.ts');

console.log('\n   Option 2: Add to .env.local file');
console.log('   echo "SENDGRID_API_KEY=your_key_here" >> .env.local');
console.log('   node --import tsx/esm scripts/send-welcome-email.ts');

console.log('\n   Option 3: Use this script');
console.log('   node --import tsx/esm scripts/setup-sendgrid.ts SG.your_api_key_here\n');

// Check if API key provided as argument
const apiKey = process.argv[2];
if (apiKey && apiKey.startsWith('SG.')) {
  console.log('✅ API Key provided! Adding to .env.local...\n');
  
  // Add or update SENDGRID_API_KEY
  if (envContent.includes('SENDGRID_API_KEY')) {
    envContent = envContent.replace(/SENDGRID_API_KEY=.*/g, `SENDGRID_API_KEY=${apiKey}`);
  } else {
    envContent += `\n# SendGrid Configuration\nSENDGRID_API_KEY=${apiKey}\n`;
  }
  
  writeFileSync(envLocalPath, envContent);
  console.log('✅ SendGrid API Key saved to .env.local!');
  console.log('\n📧 Ready to send welcome email!');
  console.log('   Run: node --import tsx/esm scripts/send-welcome-email.ts\n');
} else if (apiKey) {
  console.log('❌ Invalid API key format. SendGrid keys start with "SG."');
  console.log('   Example: SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n');
}
