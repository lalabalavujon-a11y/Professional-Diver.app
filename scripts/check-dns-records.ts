#!/usr/bin/env tsx
/**
 * Check and list all DNS records for professionaldiver.app
 * Shows what's configured and what's missing
 */

import { execSync } from 'child_process';

const DOMAIN = 'professionaldiver.app';
const API_BASE = 'https://api.cloudflare.com/client/v4';

// Get API credentials from environment
function getAPICredentials() {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const apiKey = process.env.CLOUDFLARE_API_KEY;
  const email = process.env.CLOUDFLARE_EMAIL;

  if (apiToken) {
    return { type: 'token', token: apiToken };
  }

  if (apiKey && email) {
    return { type: 'key', key: apiKey, email: email };
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

function formatRecordName(name: string): string {
  if (name === '' || name === '@' || name === DOMAIN) {
    return '@ (root)';
  }
  return name;
}

function formatProxyStatus(proxied: boolean): string {
  return proxied ? '✅ Proxied' : '❌ DNS Only';
}

function formatTTL(ttl: number, proxied: boolean): string {
  if (proxied && ttl === 1) {
    return 'Auto';
  }
  return `${ttl} seconds`;
}

async function main() {
  console.log(`🔍 Checking DNS records for ${DOMAIN}...\n`);

  // Check credentials
  const creds = getAPICredentials();
  if (!creds) {
    console.log('❌ API credentials not found.\n');
    console.log('📋 To check DNS records via API, you need to:');
    console.log('   1. Get API Token: https://dash.cloudflare.com/profile/api-tokens');
    console.log('   2. Create token with: Zone → DNS → Read permissions');
    console.log('   3. Set environment variable:');
    console.log('      export CLOUDFLARE_API_TOKEN=your_token_here');
    console.log('   4. Run this script again\n');
    process.exit(1);
  }

  // Get zone ID
  console.log('1. Getting zone ID...');
  const zoneId = await getZoneId(DOMAIN);
  if (!zoneId) {
    console.log(`   ❌ Zone ${DOMAIN} not found in Cloudflare.\n`);
    process.exit(1);
  }
  console.log(`   ✅ Zone ID: ${zoneId}\n`);

  // Get all DNS records
  console.log('2. Fetching DNS records...');
  const records = await getDNSRecords(zoneId);
  console.log(`   ✅ Found ${records.length} DNS records\n`);

  // Required records for Cloudflare Workers
  const requiredRecords = {
    rootA: records.find((r: any) => 
      (r.name === DOMAIN || r.name === '@' || r.name === '') && r.type === 'A'
    ),
    wwwCNAME: records.find((r: any) => 
      r.type === 'CNAME' && (
        r.name === 'www' || 
        r.name === `www.${DOMAIN}` ||
        (r.name.endsWith(`.${DOMAIN}`) && r.name.startsWith('www.'))
      )
    ),
  };

  // Optional records
  const optionalRecords = {
    rootAAAA: records.find((r: any) => 
      (r.name === DOMAIN || r.name === '@' || r.name === '') && r.type === 'AAAA'
    ),
  };

  // Display all records
  console.log('📋 Current DNS Records:\n');
  console.log('─'.repeat(80));
  
  if (records.length === 0) {
    console.log('   No DNS records found.\n');
  } else {
    records.forEach((record: any) => {
      const name = formatRecordName(record.name);
      const proxy = formatProxyStatus(record.proxied);
      const ttl = formatTTL(record.ttl, record.proxied);
      
      console.log(`   Type: ${record.type.padEnd(6)} | Name: ${name.padEnd(20)} | Content: ${record.content.padEnd(30)} | ${proxy} | TTL: ${ttl}`);
    });
  }
  
  console.log('─'.repeat(80));
  console.log('');

  // Check required records
  console.log('✅ Required Records Status:\n');
  
  // Root A record
  if (requiredRecords.rootA) {
    const status = requiredRecords.rootA.proxied ? '✅' : '⚠️';
    console.log(`   ${status} Root A Record (@):`);
    console.log(`      Type: A`);
    console.log(`      Name: @ (${DOMAIN})`);
    console.log(`      Content: ${requiredRecords.rootA.content}`);
    console.log(`      Proxy: ${formatProxyStatus(requiredRecords.rootA.proxied)}`);
    if (!requiredRecords.rootA.proxied) {
      console.log(`      ⚠️  WARNING: Not proxied! Enable proxy for SSL and CDN benefits.`);
    }
  } else {
    console.log(`   ❌ Root A Record (@): MISSING`);
    console.log(`      This is REQUIRED for the root domain to work!`);
  }
  console.log('');

  // WWW CNAME
  if (requiredRecords.wwwCNAME) {
    const contentMatches = requiredRecords.wwwCNAME.content === DOMAIN || 
                          requiredRecords.wwwCNAME.content === `${DOMAIN}.` ||
                          requiredRecords.wwwCNAME.content.endsWith(`.${DOMAIN}`);
    const status = requiredRecords.wwwCNAME.proxied && contentMatches ? '✅' : '⚠️';
    console.log(`   ${status} WWW CNAME Record:`);
    console.log(`      Type: CNAME`);
    console.log(`      Name: ${requiredRecords.wwwCNAME.name}`);
    console.log(`      Content: ${requiredRecords.wwwCNAME.content}`);
    console.log(`      Proxy: ${formatProxyStatus(requiredRecords.wwwCNAME.proxied)}`);
    if (!contentMatches) {
      console.log(`      ⚠️  WARNING: Should point to ${DOMAIN}`);
    }
    if (!requiredRecords.wwwCNAME.proxied) {
      console.log(`      ⚠️  WARNING: Not proxied! Enable proxy for SSL and CDN benefits.`);
    }
  } else {
    console.log(`   ❌ WWW CNAME Record: MISSING`);
    console.log(`      Recommended: www → ${DOMAIN} (proxied)`);
  }
  console.log('');

  // Optional records
  console.log('📋 Optional Records:\n');
  
  if (optionalRecords.rootAAAA) {
    console.log(`   ✅ Root AAAA Record (IPv6):`);
    console.log(`      Type: AAAA`);
    console.log(`      Name: @`);
    console.log(`      Content: ${optionalRecords.rootAAAA.content}`);
    console.log(`      Proxy: ${formatProxyStatus(optionalRecords.rootAAAA.proxied)}`);
  } else {
    console.log(`   ⚪ Root AAAA Record (IPv6): Not configured (optional)`);
  }
  console.log('');

  // Summary
  console.log('📊 Summary:\n');
  
  const missingRequired = [];
  if (!requiredRecords.rootA) missingRequired.push('Root A record');
  if (!requiredRecords.wwwCNAME) missingRequired.push('WWW CNAME record');
  
  if (missingRequired.length === 0) {
    console.log('   ✅ All required DNS records are configured!');
    
    const needsUpdate = [];
    if (requiredRecords.rootA && !requiredRecords.rootA.proxied) {
      needsUpdate.push('Root A record needs proxy enabled');
    }
    if (requiredRecords.wwwCNAME) {
      if (!requiredRecords.wwwCNAME.proxied) {
        needsUpdate.push('WWW CNAME needs proxy enabled');
      }
      const contentMatches = requiredRecords.wwwCNAME.content === DOMAIN || 
                            requiredRecords.wwwCNAME.content === `${DOMAIN}.` ||
                            requiredRecords.wwwCNAME.content.endsWith(`.${DOMAIN}`);
      if (!contentMatches) {
        needsUpdate.push('WWW CNAME should point to ' + DOMAIN);
      }
    }
    
    if (needsUpdate.length > 0) {
      console.log('   ⚠️  Some records need updates:');
      needsUpdate.forEach(item => console.log(`      - ${item}`));
      console.log('');
      console.log('   💡 To fix, run: node --import tsx/esm scripts/configure-dns-api.ts');
    } else {
      console.log('   ✅ All records are properly configured and proxied!');
    }
  } else {
    console.log('   ❌ Missing required records:');
    missingRequired.forEach(item => console.log(`      - ${item}`));
    console.log('');
    console.log('   💡 To add missing records, run: node --import tsx/esm scripts/configure-dns-api.ts');
  }
  
  console.log('');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});

