#!/usr/bin/env tsx
/**
 * Configure DNS records for professionaldiver.app via Cloudflare API
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const DOMAIN = 'professionaldiver.app';
const API_BASE = 'https://api.cloudflare.com/client/v4';

// Get API credentials from environment or wrangler config
function getAPICredentials() {
  // Try to get from environment
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const apiKey = process.env.CLOUDFLARE_API_KEY;
  const email = process.env.CLOUDFLARE_EMAIL;

  if (apiToken) {
    return { type: 'token', token: apiToken };
  }

  if (apiKey && email) {
    return { type: 'key', key: apiKey, email: email };
  }

  // Try to get from wrangler whoami (we can't get the actual token, but we can check auth)
  try {
    const whoami = execSync('npx wrangler whoami', { encoding: 'utf-8', stdio: 'pipe' });
    if (whoami.includes('logged in')) {
      console.log('✅ Authenticated with Cloudflare (via wrangler)');
      console.log('⚠️  To use API directly, you need to set:');
      console.log('   CLOUDFLARE_API_TOKEN=your_token');
      console.log('   Or: CLOUDFLARE_API_KEY=your_key and CLOUDFLARE_EMAIL=your_email\n');
      return null;
    }
  } catch (e) {
    // Not logged in
  }

  return null;
}

async function makeAPICall(method: string, endpoint: string, data?: any) {
  const creds = getAPICredentials();
  if (!creds) {
    throw new Error('API credentials not found. Set CLOUDFLARE_API_TOKEN or CLOUDFLARE_API_KEY + CLOUDFLARE_EMAIL');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (creds.type === 'token') {
    headers['Authorization'] = `Bearer ${creds.token}`;
  } else {
    headers['X-Auth-Email'] = creds.email!;
    headers['X-Auth-Key'] = creds.key!;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const result = await response.json();

  if (!result.success) {
    throw new Error(`API Error: ${JSON.stringify(result.errors)}`);
  }

  return result;
}

async function getZoneId(domain: string): Promise<string | null> {
  try {
    const result = await makeAPICall('GET', `/zones?name=${domain}`);
    if (result.result && result.result.length > 0) {
      return result.result[0].id;
    }
    return null;
  } catch (e: any) {
    if (e.message.includes('credentials')) {
      throw e;
    }
    return null;
  }
}

async function getDNSRecords(zoneId: string) {
  const result = await makeAPICall('GET', `/zones/${zoneId}/dns_records`);
  return result.result || [];
}

async function createDNSRecord(zoneId: string, record: {
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
  ttl?: number;
}) {
  const data: any = {
    type: record.type,
    name: record.name,
    content: record.content,
    proxied: record.proxied !== undefined ? record.proxied : true,
  };

  if (record.ttl) {
    data.ttl = record.ttl;
  } else if (data.proxied) {
    data.ttl = 1; // Auto TTL when proxied
  }

  return await makeAPICall('POST', `/zones/${zoneId}/dns_records`, data);
}

async function updateDNSRecord(zoneId: string, recordId: string, record: {
  type: string;
  name: string;
  content: string;
  proxied?: boolean;
  ttl?: number;
}) {
  const data: any = {
    type: record.type,
    name: record.name,
    content: record.content,
    proxied: record.proxied !== undefined ? record.proxied : true,
  };

  if (record.ttl) {
    data.ttl = record.ttl;
  } else if (data.proxied) {
    data.ttl = 1; // Auto TTL when proxied
  }

  return await makeAPICall('PUT', `/zones/${zoneId}/dns_records/${recordId}`, data);
}

async function main() {
  console.log(`🔧 Configuring DNS for ${DOMAIN} via Cloudflare API...\n`);

  // Check credentials
  const creds = getAPICredentials();
  if (!creds) {
    console.log('❌ API credentials not found.\n');
    console.log('📋 To configure DNS via API, you need to:');
    console.log('   1. Get API Token: https://dash.cloudflare.com/profile/api-tokens');
    console.log('   2. Create token with: Zone → DNS → Edit permissions');
    console.log('   3. Set environment variable:');
    console.log('      export CLOUDFLARE_API_TOKEN=your_token_here');
    console.log('   4. Run this script again\n');
    console.log('   OR use the dashboard method (no API token needed):');
    console.log('   - Go to: https://dash.cloudflare.com');
    console.log('   - DNS → Records → Add record\n');
    process.exit(1);
  }

  // Get zone ID
  console.log('1. Getting zone ID...');
  const zoneId = await getZoneId(DOMAIN);
  if (!zoneId) {
    console.log(`   ❌ Zone ${DOMAIN} not found in Cloudflare.`);
    console.log('   📋 Steps to add zone:');
    console.log('      1. Go to: https://dash.cloudflare.com');
    console.log('      2. Click "Add a Site"');
    console.log('      3. Enter: professionaldiver.app');
    console.log('      4. Follow setup wizard');
    console.log('      5. Update nameservers at registrar');
    console.log('      6. Run this script again\n');
    process.exit(1);
  }
  console.log(`   ✅ Zone ID: ${zoneId}\n`);

  // Get existing records
  console.log('2. Checking existing DNS records...');
  const existingRecords = await getDNSRecords(zoneId);
  console.log(`   Found ${existingRecords.length} existing records`);
  
  // Show current records summary
  if (existingRecords.length > 0) {
    console.log('\n   Current records:');
    existingRecords.forEach((r: any) => {
      const name = r.name === '' || r.name === '@' || r.name === DOMAIN ? '@' : r.name;
      const proxy = r.proxied ? '✅ proxied' : '❌ DNS only';
      console.log(`      ${r.type.padEnd(6)} ${name.padEnd(20)} → ${r.content.padEnd(30)} ${proxy}`);
    });
  }
  console.log('');

  // Check for root A record
  const rootRecord = existingRecords.find((r: any) => 
    (r.name === DOMAIN || r.name === '@' || r.name === '') && r.type === 'A'
  );

  // Check for www CNAME (handle both 'www' and 'www.professionaldiver.app' formats)
  const wwwRecord = existingRecords.find((r: any) => 
    r.type === 'CNAME' && (
      r.name === 'www' || 
      r.name === `www.${DOMAIN}` ||
      r.name.endsWith(`.${DOMAIN}`) && r.name.startsWith('www.')
    )
  );

  // Create or update root A record
  console.log('3. Configuring root domain (A record)...');
  if (rootRecord) {
    if (rootRecord.proxied) {
      console.log('   ✅ Root A record exists and is proxied');
    } else {
      console.log('   ⚠️  Root A record exists but not proxied. Updating...');
      await updateDNSRecord(zoneId, rootRecord.id, {
        type: 'A',
        name: DOMAIN,
        content: rootRecord.content,
        proxied: true,
      });
      console.log('   ✅ Updated to proxied');
    }
  } else {
    console.log('   ➕ Creating root A record...');
    await createDNSRecord(zoneId, {
      type: 'A',
      name: DOMAIN,
      content: '192.0.2.1', // Placeholder - Worker handles routing
      proxied: true,
    });
    console.log('   ✅ Root A record created (proxied)');
  }
  console.log('');

  // Create or update www CNAME
  console.log('4. Configuring www subdomain (CNAME)...');
  if (wwwRecord) {
    // Normalize content check (handle both formats)
    const contentMatches = wwwRecord.content === DOMAIN || 
                          wwwRecord.content === `${DOMAIN}.` ||
                          wwwRecord.content.endsWith(`.${DOMAIN}`);
    
    if (wwwRecord.proxied && contentMatches) {
      console.log(`   ✅ www CNAME exists and is correct (${wwwRecord.name} → ${wwwRecord.content})`);
    } else {
      console.log(`   ⚠️  www CNAME exists but needs update (${wwwRecord.name}). Updating...`);
      // Use the existing name format to avoid conflicts
      const recordName = wwwRecord.name.includes('.') ? 'www' : wwwRecord.name;
      await updateDNSRecord(zoneId, wwwRecord.id, {
        type: 'CNAME',
        name: recordName,
        content: DOMAIN,
        proxied: true,
      });
      console.log('   ✅ Updated www CNAME');
    }
  } else {
    console.log('   ➕ Creating www CNAME...');
    await createDNSRecord(zoneId, {
      type: 'CNAME',
      name: 'www',
      content: DOMAIN,
      proxied: true,
    });
    console.log('   ✅ www CNAME created (proxied)');
  }
  console.log('');

  // Final summary
  console.log('✅ DNS configuration complete!\n');
  
  // Get updated records for summary
  const finalRecords = await getDNSRecords(zoneId);
  const finalRootA = finalRecords.find((r: any) => 
    (r.name === DOMAIN || r.name === '@' || r.name === '') && r.type === 'A'
  );
  const finalWwwCNAME = finalRecords.find((r: any) => 
    r.type === 'CNAME' && (
      r.name === 'www' || 
      r.name === `www.${DOMAIN}` ||
      (r.name.endsWith(`.${DOMAIN}`) && r.name.startsWith('www.'))
    )
  );
  
  console.log('📊 Final Configuration:\n');
  if (finalRootA) {
    console.log(`   ✅ Root A Record: ${finalRootA.proxied ? 'Proxied' : 'DNS Only'}`);
  } else {
    console.log(`   ❌ Root A Record: Missing`);
  }
  if (finalWwwCNAME) {
    console.log(`   ✅ WWW CNAME: ${finalWwwCNAME.proxied ? 'Proxied' : 'DNS Only'}`);
  } else {
    console.log(`   ❌ WWW CNAME: Missing`);
  }
  console.log('');
  
  console.log('📋 Next steps:');
  console.log('   1. Wait 5-10 minutes for DNS propagation');
  console.log('   2. SSL certificate will auto-provision');
  console.log('   3. Test: https://professionaldiver.app');
  console.log('   4. Test: https://www.professionaldiver.app');
  console.log('   5. Check status: node --import tsx/esm scripts/check-dns-records.ts\n');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

