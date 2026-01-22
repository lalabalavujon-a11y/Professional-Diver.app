#!/usr/bin/env tsx
/**
 * Diagnostic script to check deployment status
 * Run: tsx scripts/diagnose-deployment.ts
 */

const DOMAIN = 'professionaldiver.app';
const RAILWAY_URL = 'https://professional-diverapp-production.up.railway.app';
const CLOUDFLARE_PAGES_URL = `https://${DOMAIN}`;

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: string;
}

const results: CheckResult[] = [];

async function checkUrl(url: string, name: string): Promise<CheckResult> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Deployment-Diagnostic/1.0',
      },
    });
    
    clearTimeout(timeout);
    
    if (response.ok) {
      return {
        name,
        status: 'pass',
        message: `✅ ${name} is accessible (${response.status})`,
        details: `Response time: ${Date.now()}ms`,
      };
    } else {
      return {
        name,
        status: 'fail',
        message: `❌ ${name} returned ${response.status}`,
        details: `Status: ${response.status} ${response.statusText}`,
      };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        name,
        status: 'fail',
        message: `❌ ${name} timed out after 10 seconds`,
        details: 'The server may be down or unreachable',
      };
    }
    return {
      name,
      status: 'fail',
      message: `❌ ${name} is not accessible`,
      details: error.message,
    };
  }
}

async function checkDns(domain: string): Promise<CheckResult> {
  try {
    // This is a simplified check - in production you'd use a DNS library
    const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.Answer && data.Answer.length > 0) {
        return {
          name: 'DNS Resolution',
          status: 'pass',
          message: `✅ DNS resolves for ${domain}`,
          details: `IPs: ${data.Answer.map((a: any) => a.data).join(', ')}`,
        };
      } else {
        return {
          name: 'DNS Resolution',
          status: 'fail',
          message: `❌ No DNS records found for ${domain}`,
          details: 'DNS may not be configured or not propagated yet',
        };
      }
    }
  } catch (error: any) {
    return {
      name: 'DNS Resolution',
      status: 'warning',
      message: `⚠️ Could not check DNS (${error.message})`,
      details: 'DNS check requires network access',
    };
  }
  
  return {
    name: 'DNS Resolution',
    status: 'warning',
    message: '⚠️ DNS check unavailable',
  };
}

async function checkHealthEndpoint(): Promise<CheckResult> {
  try {
    const response = await fetch(`${RAILWAY_URL}/health`, {
      headers: { 'Accept': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        name: 'Railway Health Check',
        status: 'pass',
        message: '✅ Railway backend health endpoint is responding',
        details: JSON.stringify(data, null, 2),
      };
    } else {
      return {
        name: 'Railway Health Check',
        status: 'fail',
        message: `❌ Railway health endpoint returned ${response.status}`,
      };
    }
  } catch (error: any) {
    return {
      name: 'Railway Health Check',
      status: 'fail',
      message: '❌ Railway health endpoint is not accessible',
      details: error.message,
    };
  }
}

async function main() {
  console.log('🔍 Professional Diver App Deployment Diagnostic\n');
  console.log('='.repeat(60));
  console.log(`Domain: ${DOMAIN}`);
  console.log(`Railway Backend: ${RAILWAY_URL}`);
  console.log(`Cloudflare Pages: ${CLOUDFLARE_PAGES_URL}`);
  console.log('='.repeat(60));
  console.log('');

  // Check DNS
  console.log('📡 Checking DNS...');
  results.push(await checkDns(DOMAIN));
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check Railway backend
  console.log('🚂 Checking Railway backend...');
  results.push(await checkUrl(RAILWAY_URL, 'Railway Backend'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check Railway health endpoint
  console.log('🏥 Checking Railway health endpoint...');
  results.push(await checkHealthEndpoint());
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check Cloudflare Pages frontend
  console.log('☁️ Checking Cloudflare Pages frontend...');
  results.push(await checkUrl(CLOUDFLARE_PAGES_URL, 'Cloudflare Pages'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // Check API subdomain (if exists)
  const apiUrl = `https://api.${DOMAIN}`;
  console.log('🔌 Checking API subdomain...');
  results.push(await checkUrl(apiUrl, 'API Subdomain'));
  await new Promise(resolve => setTimeout(resolve, 500));

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(60));
  console.log('');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;

  results.forEach(result => {
    console.log(result.message);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    console.log('');
  });

  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed} | ❌ Failed: ${failed} | ⚠️ Warnings: ${warnings}`);
  console.log('='.repeat(60));
  console.log('');

  // Provide recommendations
  if (failed > 0) {
    console.log('💡 RECOMMENDATIONS:');
    console.log('');
    
    const railwayFailed = results.find(r => r.name.includes('Railway') && r.status === 'fail');
    if (railwayFailed) {
      console.log('1. Railway Backend Issues:');
      console.log('   - Check Railway dashboard: https://railway.app');
      console.log('   - Verify service is deployed and running');
      console.log('   - Check deployment logs for errors');
      console.log('   - Verify environment variables are set');
      console.log('   - Ensure PORT is correctly configured');
      console.log('');
    }

    const pagesFailed = results.find(r => r.name.includes('Cloudflare') && r.status === 'fail');
    if (pagesFailed) {
      console.log('2. Cloudflare Pages Issues:');
      console.log('   - Check Cloudflare Pages dashboard');
      console.log('   - Verify project is deployed');
      console.log('   - Check build logs for errors');
      console.log('   - Ensure VITE_API_URL environment variable is set');
      console.log('   - Trigger a new deployment if needed');
      console.log('');
    }

    const dnsFailed = results.find(r => r.name.includes('DNS') && r.status === 'fail');
    if (dnsFailed) {
      console.log('3. DNS Configuration Issues:');
      console.log('   - Check Cloudflare DNS settings');
      console.log('   - Verify domain is added to Cloudflare');
      console.log('   - Check nameservers are configured correctly');
      console.log('   - Wait for DNS propagation (up to 48 hours)');
      console.log('   - Verify SSL/TLS settings in Cloudflare');
      console.log('');
    }

    console.log('4. General Troubleshooting:');
    console.log('   - Check Railway service status page');
    console.log('   - Review Cloudflare Pages deployment logs');
    console.log('   - Verify all required environment variables are set');
    console.log('   - Check for CORS errors in browser console');
    console.log('   - Verify build commands are correct');
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
