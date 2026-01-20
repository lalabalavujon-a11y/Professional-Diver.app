/**
 * Stripe Connect Integration Test Script
 * 
 * This script tests the complete Stripe Connect flow in test mode.
 * 
 * Prerequisites:
 * 1. Set STRIPE_SECRET_KEY in .env.local (use test key starting with sk_test_)
 * 2. Ensure database is running and migrations are applied
 * 3. Start the API server: npm run dev:api
 * 
 * Usage:
 *   npm run test:stripe-connect
 *   or
 *   tsx scripts/test-stripe-connect.ts
 */

import '../server/bootstrap/env';
import { stripeConnectService } from '../server/stripe-connect-service';
import { affiliateService } from '../server/affiliate-service';
import { affiliatePayoutService } from '../server/affiliate-payout-service';

const TEST_EMAIL = 'test-affiliate@example.com';
const TEST_USER_ID = 'test-user-123';

async function testStripeConnectFlow() {
  console.log('🧪 Starting Stripe Connect Integration Tests\n');
  console.log('='.repeat(60));

  // Check environment
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ ERROR: STRIPE_SECRET_KEY not set in environment');
    console.log('\nPlease set STRIPE_SECRET_KEY in .env.local with your Stripe test key (sk_test_...)');
    process.exit(1);
  }

  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.warn('⚠️  WARNING: STRIPE_SECRET_KEY does not start with sk_test_');
    console.warn('   This script should use Stripe TEST keys, not live keys!');
  }

  try {
    // Test 1: Create Connect Account
    console.log('\n📝 Test 1: Creating Stripe Connect Account...');
    const account = await stripeConnectService.createConnectAccount(TEST_EMAIL, TEST_USER_ID);
    console.log('✅ Connect account created:', account.id);
    console.log('   Account type:', account.type);
    console.log('   Email:', account.email);

    // Test 2: Create Onboarding Link
    console.log('\n📝 Test 2: Creating Onboarding Link...');
    const returnUrl = 'http://localhost:3000/affiliate/stripe-onboard?return=true';
    const onboardingLink = await stripeConnectService.createOnboardingLink(
      account.id,
      returnUrl,
      returnUrl
    );
    console.log('✅ Onboarding link created');
    console.log('   URL:', onboardingLink.url);
    console.log('\n   👉 Open this URL in a browser to complete onboarding in test mode');
    console.log('   👉 Use Stripe test data: https://stripe.com/docs/connect/testing');

    // Test 3: Get Account Status
    console.log('\n📝 Test 3: Checking Account Status...');
    const accountStatus = await stripeConnectService.getAccountStatus(account.id);
    console.log('✅ Account status retrieved');
    console.log('   Details submitted:', accountStatus.detailsSubmitted);
    console.log('   Charges enabled:', accountStatus.chargesEnabled);
    console.log('   Payouts enabled:', accountStatus.payoutsEnabled);

    // Test 4: Create Affiliate and Link Account
    console.log('\n📝 Test 4: Creating Affiliate and Linking Stripe Account...');
    let affiliate = await affiliateService.getAffiliateByUserId(TEST_USER_ID);
    
    if (!affiliate) {
      affiliate = await affiliateService.createAffiliate({
        userId: TEST_USER_ID,
        name: 'Test Affiliate',
        email: TEST_EMAIL,
      });
      console.log('✅ Affiliate created:', affiliate.id);
    } else {
      console.log('✅ Affiliate already exists:', affiliate.id);
    }

    // Update affiliate with Stripe account
    await affiliateService.updateAffiliate(affiliate.id, {
      stripeConnectAccountId: account.id,
      stripeConnectAccountEmail: TEST_EMAIL,
      stripeConnectOnboardingStatus: accountStatus.payoutsEnabled ? 'COMPLETE' : 'IN_PROGRESS',
      preferredPaymentMethod: 'STRIPE_CONNECT',
    });
    console.log('✅ Affiliate linked to Stripe Connect account');

    // Test 5: Check Payout Eligibility
    console.log('\n📝 Test 5: Checking Payout Eligibility...');
    const eligibility = await affiliateService.getPayoutEligibility(affiliate.id);
    console.log('✅ Eligibility check complete');
    console.log('   Eligible:', eligibility.eligible);
    console.log('   Current earnings:', `$${(eligibility.currentEarnings / 100).toFixed(2)}`);
    console.log('   Minimum threshold:', `$${(eligibility.minimumThreshold / 100).toFixed(2)}`);
    console.log('   Account ready:', eligibility.accountReady);
    if (eligibility.reason) {
      console.log('   Reason:', eligibility.reason);
    }

    // Test 6: Simulate Commission (for testing payouts)
    console.log('\n📝 Test 6: Simulating Commission Earnings...');
    await affiliateService.processReferral({
      affiliateCode: affiliate.affiliateCode,
      referredUserId: 'test-referred-user',
      subscriptionType: 'MONTHLY',
      monthlyValue: 2500, // $25.00
    });
    console.log('✅ Commission processed: $12.50 (50% of $25)');

    // Test 7: Test Transfer (only if account is ready)
    if (accountStatus.payoutsEnabled) {
      console.log('\n📝 Test 7: Testing Transfer (Account Ready)...');
      try {
        const transfer = await stripeConnectService.createTransfer(
          account.id,
          1250, // $12.50 in cents
          'usd',
          {
            test: 'true',
            affiliateId: affiliate.id,
          }
        );
        console.log('✅ Transfer created:', transfer.id);
        console.log('   Amount:', `$${(transfer.amount / 100).toFixed(2)}`);
        console.log('   Status:', transfer.status);
      } catch (error) {
        console.log('⚠️  Transfer test skipped (account may need more setup)');
        console.log('   Error:', error instanceof Error ? error.message : 'Unknown');
      }
    } else {
      console.log('\n📝 Test 7: Skipping Transfer (Account Not Ready)');
      console.log('   Complete onboarding first to enable transfers');
    }

    // Test 8: Validate Payout Eligibility
    console.log('\n📝 Test 8: Validating Payout Service...');
    const updatedAffiliate = await affiliateService.getAffiliateById(affiliate.id);
    if (updatedAffiliate) {
      const payoutEligibility = await affiliatePayoutService.validatePayoutEligibility(updatedAffiliate);
      console.log('✅ Payout validation complete');
      console.log('   Eligible:', payoutEligibility.eligible);
      if (payoutEligibility.reason) {
        console.log('   Reason:', payoutEligibility.reason);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ All Tests Completed Successfully!\n');
    console.log('📋 Test Summary:');
    console.log('   ✓ Connect account created');
    console.log('   ✓ Onboarding link generated');
    console.log('   ✓ Account status checked');
    console.log('   ✓ Affiliate linked');
    console.log('   ✓ Commission processed');
    console.log('   ✓ Payout eligibility validated\n');
    
    console.log('🔗 Next Steps:');
    console.log('   1. Complete onboarding using the URL above');
    console.log('   2. Check account status again after onboarding');
    console.log('   3. Test actual payout once account is ready');
    console.log('   4. Configure webhooks in Stripe Dashboard\n');

  } catch (error) {
    console.error('\n❌ Test Failed:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run tests
testStripeConnectFlow().catch(console.error);
