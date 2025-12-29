#!/usr/bin/env tsx
/**
 * Setup DNS records for professionaldiver.app via Cloudflare API
 */

import { execSync } from 'child_process';

const DOMAIN = 'professionaldiver.app';
const ZONE_NAME = 'professionaldiver.app';

console.log(`🔧 Setting up DNS for ${DOMAIN}...\n`);

// Step 1: Check if zone exists
console.log('1. Checking if zone exists...');
try {
  const zoneCheck = execSync(`npx wrangler dns list --zone-name ${ZONE_NAME} 2>&1`, { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  
  if (zoneCheck.includes('Zone not found') || zoneCheck.includes('No zone found')) {
    console.log('   ⚠️  Zone not found. You need to add the domain to Cloudflare first.');
    console.log('   📋 Steps:');
    console.log('      1. Go to: https://dash.cloudflare.com');
    console.log('      2. Click "Add a Site"');
    console.log('      3. Enter: professionaldiver.app');
    console.log('      4. Follow the setup wizard');
    console.log('      5. Update nameservers at your registrar');
    console.log('      6. Then run this script again\n');
    process.exit(1);
  } else {
    console.log('   ✅ Zone exists\n');
  }
} catch (e: any) {
  console.log('   ⚠️  Could not check zone. Assuming it exists...\n');
}

// Step 2: List current DNS records
console.log('2. Current DNS records:');
try {
  const records = execSync(`npx wrangler dns list --zone-name ${ZONE_NAME} 2>&1`, { 
    encoding: 'utf-8',
    stdio: 'pipe'
  });
  console.log(records);
} catch (e: any) {
  console.log('   ⚠️  Could not list records:', e.message.split('\n')[0]);
}

// Step 3: Instructions for adding records
console.log('\n3. DNS Records to Add:\n');
console.log('   Option A: Use Cloudflare Dashboard (Recommended)');
console.log('   ----------------------------------------');
console.log('   1. Go to: DNS → Records');
console.log('   2. Add record:');
console.log('      Type: A');
console.log('      Name: @ (or leave blank for root)');
console.log('      IPv4: 192.0.2.1 (placeholder - Worker will handle routing)');
console.log('      Proxy: ✅ Proxied (orange cloud)');
console.log('      TTL: Auto');
console.log('');
console.log('   3. Add record:');
console.log('      Type: CNAME');
console.log('      Name: www');
console.log('      Target: professionaldiver.app');
console.log('      Proxy: ✅ Proxied (orange cloud)');
console.log('      TTL: Auto');
console.log('');
console.log('   Option B: Use Cloudflare API directly');
console.log('   ----------------------------------------');
console.log('   You can use curl or the Cloudflare API to add records.');
console.log('   Get your API token from: https://dash.cloudflare.com/profile/api-tokens');
console.log('   Then use the Cloudflare API v4 to add records.\n');

console.log('4. After DNS is configured:');
console.log('   - Wait 5-10 minutes for DNS propagation');
console.log('   - SSL certificate will auto-provision');
console.log('   - Test: https://professionaldiver.app\n');

console.log('📝 Note: Workers routes are already configured in wrangler.toml');
console.log('   The DNS records just need to point the domain to Cloudflare.');








