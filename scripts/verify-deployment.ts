#!/usr/bin/env tsx
/**
 * Verify deployment status and configuration
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

console.log('🔍 Verifying Deployment Configuration...\n');

// Check 1: Worker file exists
const workerPath = join(process.cwd(), 'dist', 'worker.js');
if (existsSync(workerPath)) {
  const stats = require('fs').statSync(workerPath);
  console.log(`✅ Worker built: dist/worker.js (${(stats.size / 1024).toFixed(2)} KB)`);
} else {
  console.log('❌ Worker not built: dist/worker.js missing');
  console.log('   Run: npm run build:worker');
}

// Check 2: Assets exist
const indexPath = join(process.cwd(), 'dist', 'client', 'index.html');
if (existsSync(indexPath)) {
  console.log('✅ Assets ready: dist/client/index.html exists');
} else {
  console.log('❌ Assets missing: dist/client/index.html not found');
  console.log('   Run: npm run build');
}

// Check 3: Wrangler config
const wranglerPath = join(process.cwd(), 'wrangler.toml');
if (existsSync(wranglerPath)) {
  const config = readFileSync(wranglerPath, 'utf-8');
  
  if (config.includes('[env.production.assets]')) {
    console.log('✅ Assets configured in wrangler.toml');
  } else {
    console.log('❌ Assets not configured in production environment');
  }
  
  if (config.includes('professional-diver.diverwell.app')) {
    console.log('✅ Subdomain route configured');
  } else {
    console.log('❌ Subdomain route missing');
  }
  
  if (config.includes('diverwell.app')) {
    console.log('✅ Main domain route configured');
  } else {
    console.log('❌ Main domain route missing');
  }
} else {
  console.log('❌ wrangler.toml not found');
}

// Check 4: Try to get deployment info
console.log('\n📡 Checking Cloudflare deployment status...\n');
try {
  const whoami = execSync('npx wrangler whoami', { encoding: 'utf-8', stdio: 'pipe' });
  console.log('✅ Logged into Cloudflare:');
  console.log(whoami.trim());
} catch (e: any) {
  console.log('⚠️  Not logged into Cloudflare');
  console.log('   Run: npx wrangler login');
}

try {
  const deployments = execSync('npx wrangler deployments list --env production 2>&1', { 
    encoding: 'utf-8', 
    stdio: 'pipe',
    timeout: 10000 
  });
  console.log('\n📦 Recent deployments:');
  console.log(deployments);
} catch (e: any) {
  if (e.message.includes('timeout')) {
    console.log('⚠️  Could not fetch deployments (timeout)');
  } else {
    console.log('⚠️  Could not fetch deployments');
    console.log('   Error:', e.message.split('\n')[0]);
  }
}

console.log('\n📋 Next Steps:');
console.log('1. If worker not built: npm run build:worker');
console.log('2. If not logged in: npx wrangler login');
console.log('3. Deploy: npm run deploy:prod');
console.log('4. Check Cloudflare Dashboard → Workers & Pages');
console.log('5. Verify routes in Settings → Triggers');








