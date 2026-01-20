import { db } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";
import { affiliates, referrals, commissionPayments } from "@shared/affiliate-schema";
import { affiliateService } from "./affiliate-service";
import { stripeConnectService } from "./stripe-connect-service";

/**
 * Affiliate Payout Service
 * Handles automated commission payouts to affiliates
 */
export class AffiliatePayoutService {
  private readonly MINIMUM_PAYOUT_THRESHOLD = 5000; // $50 in cents

  /**
   * Calculate pending payouts for all eligible affiliates
   */
  async calculatePendingPayouts(): Promise<Array<{
    affiliateId: string;
    affiliateCode: string;
    amount: number;
    paymentMethod: string;
    email?: string;
  }>> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Get all active affiliates
    const allAffiliates = await db.select()
      .from(affiliates)
      .where(eq(affiliates.isActive, true));

    const pendingPayouts = [];

    for (const affiliate of allAffiliates) {
      // Check eligibility
      const eligibility = await this.validatePayoutEligibility(affiliate);
      
      if (!eligibility.eligible) {
        continue;
      }

      // Calculate monthly earnings
      const monthlyReferrals = await db.select()
        .from(referrals)
        .where(
          and(
            eq(referrals.affiliateId, affiliate.id),
            eq(referrals.status, 'ACTIVE'),
            gte(referrals.createdAt, startOfMonth),
            lte(referrals.createdAt, endOfMonth)
          )
        );

      const monthlyCommission = monthlyReferrals.reduce(
        (sum, r) => sum + (r.commissionEarned || 0),
        0
      );

      if (monthlyCommission >= this.MINIMUM_PAYOUT_THRESHOLD) {
        pendingPayouts.push({
          affiliateId: affiliate.id,
          affiliateCode: affiliate.affiliateCode,
          amount: monthlyCommission,
          paymentMethod: affiliate.preferredPaymentMethod || 'PAYPAL',
          email: affiliate.stripeConnectAccountEmail || affiliate.paypalEmail || undefined,
        });
      }
    }

    return pendingPayouts;
  }

  /**
   * Process payout for a single affiliate
   */
  async processPayout(
    affiliateId: string,
    amount: number,
    paymentMethod: string
  ): Promise<{
    success: boolean;
    paymentId?: string;
    error?: string;
  }> {
    try {
      const affiliate = await affiliateService.getAffiliateById(affiliateId);
      
      if (!affiliate) {
        return { success: false, error: 'Affiliate not found' };
      }

      // Validate eligibility
      const eligibility = await this.validatePayoutEligibility(affiliate);
      if (!eligibility.eligible) {
        return { success: false, error: eligibility.reason || 'Not eligible for payout' };
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

      let paymentReference: string | undefined;
      let paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' = 'PENDING';

      // Process based on payment method
      switch (paymentMethod) {
        case 'STRIPE_CONNECT':
          if (!affiliate.stripeConnectAccountId) {
            return { success: false, error: 'Stripe Connect account not set up' };
          }

          try {
            const transfer = await stripeConnectService.createTransfer(
              affiliate.stripeConnectAccountId,
              amount,
              'usd',
              {
                affiliateId: affiliate.id,
                affiliateCode: affiliate.affiliateCode,
                period: `${startOfMonth.toISOString()}-${endOfMonth.toISOString()}`,
              }
            );

            paymentReference = transfer.id;
            paymentStatus = 'PENDING'; // Will be updated via webhook when transfer completes
          } catch (error) {
            console.error('Stripe transfer error:', error);
            paymentStatus = 'FAILED';
            return { success: false, error: `Stripe transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
          }
          break;

        case 'PAYPAL':
          // PayPal payout would be handled here
          // For now, mark as pending for manual processing
          paymentStatus = 'PENDING';
          paymentReference = `PAYPAL-${Date.now()}`;
          // TODO: Implement PayPal payout API
          console.log('PayPal payout pending:', { affiliateId, amount, email: affiliate.paypalEmail });
          break;

        case 'BANK_TRANSFER':
          // Bank transfer requires manual processing
          paymentStatus = 'PENDING';
          paymentReference = `BANK-${Date.now()}`;
          console.log('Bank transfer pending manual processing:', { affiliateId, amount });
          break;

        default:
          return { success: false, error: `Unknown payment method: ${paymentMethod}` };
      }

      // Create commission payment record
      const [payment] = await db.insert(commissionPayments).values({
        affiliateId: affiliate.id,
        amount,
        paymentMethod: paymentMethod === 'STRIPE_CONNECT' ? 'STRIPE_CONNECT' : paymentMethod,
        paymentReference,
        paymentStatus,
        periodStart: startOfMonth,
        periodEnd: endOfMonth,
      }).returning();

      // Reset monthly earnings after payout
      await db.update(affiliates)
        .set({
          monthlyEarnings: 0,
          updatedAt: new Date(),
        })
        .where(eq(affiliates.id, affiliateId));

      return {
        success: true,
        paymentId: payment.id,
      };
    } catch (error) {
      console.error('Payout processing error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process all pending payouts
   */
  async processAllPendingPayouts(): Promise<{
    processed: number;
    successful: number;
    failed: number;
    results: Array<{ affiliateId: string; success: boolean; error?: string }>;
  }> {
    const pendingPayouts = await this.calculatePendingPayouts();
    const results = [];

    let successful = 0;
    let failed = 0;

    for (const payout of pendingPayouts) {
      const result = await this.processPayout(
        payout.affiliateId,
        payout.amount,
        payout.paymentMethod
      );

      results.push({
        affiliateId: payout.affiliateId,
        success: result.success,
        error: result.error,
      });

      if (result.success) {
        successful++;
      } else {
        failed++;
      }
    }

    return {
      processed: pendingPayouts.length,
      successful,
      failed,
      results,
    };
  }

  /**
   * Validate if an affiliate is eligible for payout
   */
  async validatePayoutEligibility(affiliate: typeof affiliates.$inferSelect): Promise<{
    eligible: boolean;
    reason?: string;
  }> {
    // Check minimum threshold
    if ((affiliate.monthlyEarnings || 0) < this.MINIMUM_PAYOUT_THRESHOLD) {
      return {
        eligible: false,
        reason: `Minimum threshold not met. Need $${(this.MINIMUM_PAYOUT_THRESHOLD / 100).toFixed(2)}, have $${((affiliate.monthlyEarnings || 0) / 100).toFixed(2)}`,
      };
    }

    // Check payment method setup
    const paymentMethod = affiliate.preferredPaymentMethod || 'PAYPAL';

    if (paymentMethod === 'STRIPE_CONNECT') {
      if (!affiliate.stripeConnectAccountId) {
        return {
          eligible: false,
          reason: 'Stripe Connect account not set up',
        };
      }

      // Check if account is ready for payouts
      try {
        const accountStatus = await stripeConnectService.getAccountStatus(affiliate.stripeConnectAccountId);
        if (!accountStatus.payoutsEnabled) {
          return {
            eligible: false,
            reason: 'Stripe Connect account not ready for payouts',
          };
        }
      } catch (error) {
        return {
          eligible: false,
          reason: 'Error checking Stripe Connect account status',
        };
      }
    } else if (paymentMethod === 'PAYPAL') {
      if (!affiliate.paypalEmail) {
        return {
          eligible: false,
          reason: 'PayPal email not set',
        };
      }
    } else if (paymentMethod === 'BANK_TRANSFER') {
      if (!affiliate.bankDetails) {
        return {
          eligible: false,
          reason: 'Bank details not set',
        };
      }
    }

    return { eligible: true };
  }

  /**
   * Schedule monthly payouts (to be called by cron job)
   */
  async scheduleMonthlyPayouts(): Promise<void> {
    console.log('Starting monthly affiliate payout processing...');
    
    const result = await this.processAllPendingPayouts();
    
    console.log('Monthly payout processing complete:', {
      processed: result.processed,
      successful: result.successful,
      failed: result.failed,
    });

    // Log failed payouts for manual review
    if (result.failed > 0) {
      const failedPayouts = result.results.filter(r => !r.success);
      console.error('Failed payouts requiring manual review:', failedPayouts);
    }
  }
}

export const affiliatePayoutService = new AffiliatePayoutService();
