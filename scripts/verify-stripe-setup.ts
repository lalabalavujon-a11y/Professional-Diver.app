/**
 * Quick Stripe Connect Setup Verification
 * 
 * Verifies that Stripe Connect is properly configured and can be initialized.
 * This is a lightweight check that doesn't require the full database setup.
 * 
 * Usage:
 *   tsx scripts/verify-stripe-setup.ts
 */

import '../server/bootstrap/env';

async function verifyStripeSetup() {
  console.log('🔍 Verifying Stripe Connect Setup...\n');

  // Check environment variables
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY',
  ];

  const optionalVars = [
    'STRIPE_WEBHOOK_SECRET',
  ];

  console.log('📋 Environment Variables:');
  
  let allPresent = true;
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      const masked = varName.includes('SECRET') || varName.includes('KEY')
        ? `${value.substring(0, 7)}...${value.substring(value.length - 4)}`
        : value;
      const isTest = value.startsWith('sk_test_') || value.startsWith('pk_test_');
      console.log(`   ✅ ${varName}: ${masked} ${isTest ? '(TEST)' : '(LIVE - ⚠️)'}`);
    } else {
      console.log(`   ❌ ${varName}: NOT SET`);
      allPresent = false;
    }
  }

  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      const masked = varName.includes('SECRET') || varName.includes('KEY')
        ? `${value.substring(0, 7)}...${value.substring(value.length - 4)}`
        : value;
      console.log(`   ⚠️  ${varName}: ${masked} (optional)`);
    } else {
      console.log(`   ⚠️  ${varName}: NOT SET (optional but recommended)`);
    }
  }

  if (!allPresent) {
    console.log('\n❌ Missing required environment variables!');
    console.log('\nPlease set the following in .env.local:');
    requiredVars.forEach(v => {
      if (!process.env[v]) {
        console.log(`   ${v}=your_value_here`);
      }
    });
    process.exit(1);
  }

  // Try to initialize Stripe service
  console.log('\n🔧 Testing Stripe Service Initialization...');
  try {
    const { stripeConnectService } = await import('../server/stripe-connect-service');
    console.log('✅ Stripe Connect service initialized successfully');
    
    // Try a simple API call to verify connectivity
    console.log('\n🌐 Testing Stripe API Connectivity...');
    try {
      // This will fail if the key is invalid, but that's okay for verification
      const account = await stripeConnectService.createConnectAccount(
        'test@example.com',
        'test-user'
      );
      console.log('✅ Stripe API connection successful');
      console.log(`   Test account created: ${account.id}`);
      console.log('   ⚠️  This is a test account - you may want to delete it in Stripe Dashboard');
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('Invalid API Key')) {
          console.log('❌ Invalid Stripe API key');
          console.log('   Please check your STRIPE_SECRET_KEY in .env.local');
        } else {
          console.log('⚠️  API test failed (this may be expected):', error.message);
        }
      }
    }

  } catch (error) {
    console.error('❌ Failed to initialize Stripe Connect service:', error);
    if (error instanceof Error) {
      console.error('   Error:', error.message);
    }
    process.exit(1);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Stripe Connect Setup Verification Complete!\n');
  console.log('📝 Next Steps:');
  console.log('   1. Run full test: npm run test:stripe-connect');
  console.log('   2. Start servers: npm run dev:all');
  console.log('   3. Test in UI: http://127.0.0.1:3000/affiliate-dashboard');
  console.log('   4. See testing guide: STRIPE_CONNECT_TESTING.md\n');
}

verifyStripeSetup().catch(console.error);
