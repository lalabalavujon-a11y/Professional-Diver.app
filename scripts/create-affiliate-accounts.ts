/**
 * Script to automatically create affiliate accounts for existing users
 * Starts with the three current admins
 */

import { affiliateService } from '../server/affiliate-service.js';
import { userManagement } from '../server/user-management.js';

// Three current admins
const adminUsers = [
  {
    email: 'lalabalavu.jon@gmail.com',
    name: 'Jon Lalabalavu',
    userId: 'super-admin-1',
    role: 'SUPER_ADMIN'
  },
  {
    email: 'sephdee@hotmail.com',
    name: 'Jon Lalabalavu',
    userId: 'super-admin-2',
    role: 'SUPER_ADMIN'
  },
  {
    email: 'freddierussell.joseph@yahoo.com',
    name: 'Freddie Joseph',
    userId: 'partner-admin-1',
    role: 'PARTNER_ADMIN'
  },
  {
    email: 'deesuks@gmail.com',
    name: 'Dilo Suka',
    userId: 'partner-admin-2',
    role: 'PARTNER_ADMIN'
  }
];

async function createAffiliateAccountsForAdmins() {
  console.log('🚀 Creating affiliate accounts for admins...\n');

  const results = [];

  for (const admin of adminUsers) {
    try {
      // Check if affiliate already exists
      const existingAffiliate = await affiliateService.getAffiliateByEmail(admin.email);
      
      if (existingAffiliate) {
        console.log(`✅ ${admin.name} (${admin.email}) - Affiliate already exists`);
        console.log(`   Code: ${existingAffiliate.affiliateCode}`);
        console.log(`   Link: ${existingAffiliate.referralLink}\n`);
        results.push({
          email: admin.email,
          name: admin.name,
          status: 'exists',
          affiliateCode: existingAffiliate.affiliateCode,
          referralLink: existingAffiliate.referralLink
        });
        continue;
      }

      // Create affiliate account
      const affiliate = await affiliateService.createAffiliate({
        userId: admin.userId,
        name: admin.name,
        email: admin.email
      });

      console.log(`✨ Created affiliate account for ${admin.name} (${admin.email})`);
      console.log(`   Code: ${affiliate.affiliateCode}`);
      console.log(`   Link: ${affiliate.referralLink}\n`);

      results.push({
        email: admin.email,
        name: admin.name,
        status: 'created',
        affiliateCode: affiliate.affiliateCode,
        referralLink: affiliate.referralLink
      });
    } catch (error) {
      console.error(`❌ Error creating affiliate for ${admin.name} (${admin.email}):`, error);
      results.push({
        email: admin.email,
        name: admin.name,
        status: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  console.log('\n📊 Summary:');
  console.log('='.repeat(60));
  results.forEach(result => {
    if (result.status === 'created') {
      console.log(`✅ ${result.name}: Created - ${result.affiliateCode}`);
    } else if (result.status === 'exists') {
      console.log(`ℹ️  ${result.name}: Already exists - ${result.affiliateCode}`);
    } else {
      console.log(`❌ ${result.name}: Error - ${result.error}`);
    }
  });
  console.log('='.repeat(60));

  return results;
}

// Run the script
createAffiliateAccountsForAdmins()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });





