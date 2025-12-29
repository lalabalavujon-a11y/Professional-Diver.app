/**
 * Email Campaign Cron Job
 * 
 * This script sends email campaigns on a schedule:
 * - Follow-up emails to non-purchasers (called daily)
 * - Testimonial promo emails to purchasers (called weekly)
 * 
 * Usage:
 *   - Run manually: tsx scripts/send-email-campaigns.ts
 *   - Run with specific campaign: tsx scripts/send-email-campaigns.ts --follow-up
 *   - Run with specific campaign: tsx scripts/send-email-campaigns.ts --testimonial
 * 
 * For production, set up a cron job or scheduled task:
 *   - Daily at 9 AM: 0 9 * * * cd /path/to/project && tsx scripts/send-email-campaigns.ts --follow-up
 *   - Weekly on Monday at 10 AM: 0 10 * * 1 cd /path/to/project && tsx scripts/send-email-campaigns.ts --testimonial
 */

import { config } from 'dotenv';

// Load environment variables
config();
config({ path: '.env.local', override: false });

const BASE_URL = process.env.BASE_URL || process.env.VITE_API_URL || 'http://localhost:5000';

interface CampaignResult {
  success: boolean;
  processed?: number;
  sent?: number;
  results?: Array<{ email: string; sent: boolean; emailNumber?: number; error?: string }>;
  message?: string;
  error?: string;
}

async function sendFollowUpCampaign(): Promise<void> {
  console.log('📧 Starting follow-up email campaign...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/email-campaigns/send-follow-up`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result: CampaignResult = await response.json();
    
    if (result.success) {
      console.log(`✅ Follow-up campaign completed:`);
      console.log(`   Processed: ${result.processed || 0} users`);
      console.log(`   Sent: ${result.sent || 0} emails`);
      
      if (result.results && result.results.length > 0) {
        console.log('\n   Results:');
        result.results.forEach(r => {
          if (r.sent) {
            console.log(`   ✅ ${r.email} - Email #${r.emailNumber}`);
          } else {
            console.log(`   ❌ ${r.email} - Failed: ${r.error || 'Unknown error'}`);
          }
        });
      }
    } else {
      console.error('❌ Follow-up campaign failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error running follow-up campaign:', error);
    process.exit(1);
  }
}

async function sendTestimonialPromoCampaign(): Promise<void> {
  console.log('📧 Starting testimonial promo email campaign...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/email-campaigns/send-testimonial-promo-batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        daysSinceSubscription: 14 // Send to users subscribed for 14+ days
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result: CampaignResult = await response.json();
    
    if (result.success) {
      console.log(`✅ Testimonial promo campaign completed:`);
      console.log(`   Processed: ${result.processed || 0} users`);
      console.log(`   Sent: ${result.sent || 0} emails`);
      
      if (result.results && result.results.length > 0) {
        console.log('\n   Results:');
        result.results.forEach(r => {
          if (r.sent) {
            console.log(`   ✅ ${r.email}`);
          } else {
            console.log(`   ❌ ${r.email} - Failed: ${r.error || 'Unknown error'}`);
          }
        });
      }
    } else {
      console.error('❌ Testimonial promo campaign failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error running testimonial promo campaign:', error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const followUp = args.includes('--follow-up');
  const testimonial = args.includes('--testimonial');
  const all = !followUp && !testimonial; // Run all if no specific campaign specified

  console.log('🚀 Email Campaign Script Started');
  console.log(`   Base URL: ${BASE_URL}\n`);

  if (followUp || all) {
    await sendFollowUpCampaign();
    console.log('');
  }

  if (testimonial || all) {
    await sendTestimonialPromoCampaign();
    console.log('');
  }

  console.log('✅ Email campaign script completed');
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});





