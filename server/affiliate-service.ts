import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { affiliates, referrals, affiliateClicks, commissionPayments } from "@shared/affiliate-schema";
import type { Affiliate, Referral, AffiliateClick, InsertAffiliate, InsertReferral, InsertAffiliateClick } from "@shared/affiliate-schema";
import { stripeConnectService } from "./stripe-connect-service";
import { users } from "@shared/schema";

// Role-based commission rates
// All users get 50% commission as standard, but can be customized per role
export const ROLE_COMMISSION_RATES: Record<string, number> = {
  USER: 50,          // Standard 50% commission
  ADMIN: 50,         // Admin gets 50% commission
  SUPER_ADMIN: 50,   // Super Admin gets 50% commission
  LIFETIME: 50,      // Lifetime users get 50% commission
  AFFILIATE: 50,     // Dedicated affiliates get 50% commission
  ENTERPRISE: 50,    // Enterprise users get 50% commission
};

// Affiliate service for managing partner/referral program (Database-backed)
export class AffiliateService {
  // Generate unique affiliate code
  private generateAffiliateCode(): string {
    return `PD${nanoid(8).toUpperCase()}`;
  }

  // Get commission rate based on user role
  getCommissionRateForRole(role: string): number {
    return ROLE_COMMISSION_RATES[role] || 50;
  }

  // Create affiliate account with role-based commission
  async createAffiliate(userData: { 
    userId: string; 
    name: string; 
    email: string; 
    role?: string;
  }): Promise<Affiliate> {
    // Check if affiliate already exists for this user
    const existing = await this.getAffiliateByUserId(userData.userId);
    if (existing) {
      return existing;
    }

    const affiliateCode = this.generateAffiliateCode();
    const referralLink = `https://professional-diver.diverwell.app/?ref=${affiliateCode}`;
    const commissionRate = this.getCommissionRateForRole(userData.role || 'USER');
    
    const [newAffiliate] = await db.insert(affiliates).values({
      userId: userData.userId,
      affiliateCode,
      commissionRate,
      totalReferrals: 0,
      totalEarnings: 0,
      monthlyEarnings: 0,
      referralLink,
      isActive: true,
      preferredPaymentMethod: "PAYPAL",
      stripeConnectOnboardingStatus: "NOT_STARTED",
    }).returning();

    // Also update the user record with the affiliate code
    try {
      await db.update(users)
        .set({ 
          affiliateCode,
          commissionRate,
          updatedAt: new Date()
        })
        .where(eq(users.id, userData.userId));
    } catch (error) {
      console.log('Note: Could not update user affiliate code (may be SQLite mode):', error);
    }

    return newAffiliate;
  }

  // Ensure user has an affiliate account - creates one if not exists
  async ensureUserHasAffiliate(userData: { 
    userId: string; 
    name: string; 
    email: string;
    role?: string;
  }): Promise<Affiliate> {
    let affiliate = await this.getAffiliateByUserId(userData.userId);
    
    if (!affiliate) {
      affiliate = await this.createAffiliate(userData);
      console.log(`[Affiliate] Created new affiliate account for user ${userData.email}:`, affiliate.affiliateCode);
    }
    
    return affiliate;
  }

  // Track affiliate click
  async trackClick(affiliateCode: string, clickData: {
    ipAddress?: string;
    userAgent?: string;
    referrerUrl?: string;
    landingPage?: string;
  }): Promise<AffiliateClick> {
    const [click] = await db.insert(affiliateClicks).values({
      affiliateCode,
      ipAddress: clickData.ipAddress,
      userAgent: clickData.userAgent,
      referrerUrl: clickData.referrerUrl,
      landingPage: clickData.landingPage,
      converted: false,
    }).returning();

    return click;
  }

  // Process referral conversion
  async processReferral(data: {
    affiliateCode: string;
    referredUserId: string;
    subscriptionType: string;
    monthlyValue: number; // in cents
  }): Promise<Referral> {
    // Find affiliate by code
    const [affiliate] = await db.select()
      .from(affiliates)
      .where(eq(affiliates.affiliateCode, data.affiliateCode))
      .limit(1);

    if (!affiliate) {
      throw new Error('Affiliate not found');
    }

    const commissionEarned = Math.round(data.monthlyValue * (affiliate.commissionRate / 100));

    // Create referral record
    const [referral] = await db.insert(referrals).values({
      affiliateId: affiliate.id,
      referredUserId: data.referredUserId,
      affiliateCode: data.affiliateCode,
      subscriptionType: data.subscriptionType,
      monthlyValue: data.monthlyValue,
      commissionEarned,
      status: 'ACTIVE',
      firstPaymentDate: new Date(),
      lastPaymentDate: new Date(),
    }).returning();

    // Update affiliate stats
    await db.update(affiliates)
      .set({
        totalReferrals: sql`${affiliates.totalReferrals} + 1`,
        totalEarnings: sql`${affiliates.totalEarnings} + ${commissionEarned}`,
        monthlyEarnings: sql`${affiliates.monthlyEarnings} + ${commissionEarned}`,
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, affiliate.id));

    // Mark corresponding click as converted if exists
    await db.update(affiliateClicks)
      .set({
        converted: true,
        convertedUserId: data.referredUserId,
      })
      .where(
        and(
          eq(affiliateClicks.affiliateCode, data.affiliateCode),
          eq(affiliateClicks.converted, false)
        )
      )
      .limit(1);

    return referral;
  }

  // Get affiliate dashboard data
  async getAffiliateDashboard(affiliateId: string) {
    const [affiliate] = await db.select()
      .from(affiliates)
      .where(eq(affiliates.id, affiliateId))
      .limit(1);

    if (!affiliate) {
      throw new Error('Affiliate not found');
    }

    // Get all referrals for this affiliate
    const allReferrals = await db.select()
      .from(referrals)
      .where(eq(referrals.affiliateId, affiliateId))
      .orderBy(desc(referrals.createdAt));

    // Get all clicks for this affiliate code
    const allClicks = await db.select()
      .from(affiliateClicks)
      .where(eq(affiliateClicks.affiliateCode, affiliate.affiliateCode))
      .orderBy(desc(affiliateClicks.createdAt));

    const totalClicks = allClicks.length;
    const totalConversions = allClicks.filter(c => c.converted).length;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    // Calculate monthly referrals (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthlyReferrals = allReferrals.filter(r => {
      const referralDate = new Date(r.createdAt);
      return referralDate >= startOfMonth && referralDate <= endOfMonth;
    });

    const averageOrderValue = allReferrals.length > 0
      ? Math.round(allReferrals.reduce((sum, r) => sum + r.monthlyValue, 0) / allReferrals.length)
      : 0;

    return {
      affiliate,
      stats: {
        totalReferrals: affiliate.totalReferrals || 0,
        totalEarnings: affiliate.totalEarnings || 0,
        monthlyEarnings: affiliate.monthlyEarnings || 0,
        monthlyReferrals: monthlyReferrals.length,
        totalClicks,
        totalConversions,
        conversionRate: Math.round(conversionRate * 100) / 100,
        averageOrderValue,
      },
      recentReferrals: allReferrals.slice(0, 10),
      recentClicks: allClicks.slice(0, 20),
    };
  }

  // Get affiliate leaderboard
  async getLeaderboard() {
    const affiliatesList = await db.select()
      .from(affiliates)
      .where(eq(affiliates.isActive, true))
      .orderBy(desc(affiliates.monthlyEarnings))
      .limit(20);

    return affiliatesList.map((affiliate, index) => ({
      rank: index + 1,
      name: affiliate.userId, // Will need to join with users table for name
      totalReferrals: affiliate.totalReferrals || 0,
      monthlyEarnings: affiliate.monthlyEarnings || 0,
      totalEarnings: affiliate.totalEarnings || 0,
      affiliateCode: affiliate.affiliateCode,
      joinDate: affiliate.createdAt,
    }));
  }

  // Calculate monthly commissions for all affiliates
  async calculateMonthlyCommissions() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const allAffiliates = await db.select()
      .from(affiliates)
      .where(eq(affiliates.isActive, true));

    const commissions = await Promise.all(
      allAffiliates.map(async (affiliate) => {
        const monthlyReferrals = await db.select()
          .from(referrals)
          .where(
            and(
              eq(referrals.affiliateId, affiliate.id),
              gte(referrals.createdAt, startOfMonth),
              lte(referrals.createdAt, endOfMonth)
            )
          );

        const monthlyCommission = monthlyReferrals.reduce(
          (sum, r) => sum + (r.commissionEarned || 0),
          0
        );

        return {
          affiliateId: affiliate.id,
          affiliateCode: affiliate.affiliateCode,
          name: affiliate.userId, // Will need to join with users table
          email: affiliate.stripeConnectAccountEmail || '', // Will need to get from users table
          monthlyCommission,
          referralCount: monthlyReferrals.length,
          paymentStatus: 'PENDING' as const,
        };
      })
    );

    return commissions.filter(c => c.monthlyCommission > 0);
  }

  // Get all affiliates
  async getAllAffiliates(): Promise<Affiliate[]> {
    return await db.select().from(affiliates);
  }

  // Get affiliate by code
  async getAffiliateByCode(code: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select()
      .from(affiliates)
      .where(eq(affiliates.affiliateCode, code))
      .limit(1);

    return affiliate;
  }

  // Get affiliate by userId
  async getAffiliateByUserId(userId: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select()
      .from(affiliates)
      .where(eq(affiliates.userId, userId))
      .limit(1);

    return affiliate;
  }

  // Get affiliate by ID
  async getAffiliateById(affiliateId: string): Promise<Affiliate | undefined> {
    const [affiliate] = await db.select()
      .from(affiliates)
      .where(eq(affiliates.id, affiliateId))
      .limit(1);

    return affiliate;
  }

  // Update affiliate
  async updateAffiliate(affiliateId: string, updates: Partial<Affiliate>): Promise<Affiliate> {
    const [updated] = await db.update(affiliates)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(affiliates.id, affiliateId))
      .returning();

    if (!updated) {
      throw new Error('Affiliate not found');
    }

    return updated;
  }

  // Initiate Stripe Connect onboarding
  async initiateStripeConnectOnboarding(userId: string, email: string, returnUrl: string): Promise<{ accountId: string; onboardingUrl: string }> {
    // Get or create affiliate
    let affiliate = await this.getAffiliateByUserId(userId);
    
    if (!affiliate) {
      // Create affiliate if doesn't exist
      affiliate = await this.createAffiliate({
        userId,
        name: email.split('@')[0],
        email,
      });
    }

    // Check if account already exists
    if (affiliate.stripeConnectAccountId) {
      // Get existing account status
      const accountStatus = await stripeConnectService.getAccountStatus(affiliate.stripeConnectAccountId);
      
      // If already complete, return existing account
      if (accountStatus.payoutsEnabled) {
        const onboardingLink = await stripeConnectService.createOnboardingLink(
          affiliate.stripeConnectAccountId,
          returnUrl
        );
        return {
          accountId: affiliate.stripeConnectAccountId,
          onboardingUrl: onboardingLink.url,
        };
      }
    }

    // Create new Connect account
    const account = await stripeConnectService.createConnectAccount(email, userId);

    // Create onboarding link
    const onboardingLink = await stripeConnectService.createOnboardingLink(
      account.id,
      returnUrl
    );

    // Update affiliate with account ID
    await this.updateAffiliate(affiliate.id, {
      stripeConnectAccountId: account.id,
      stripeConnectAccountEmail: email,
      stripeConnectOnboardingStatus: 'IN_PROGRESS',
    });

    return {
      accountId: account.id,
      onboardingUrl: onboardingLink.url,
    };
  }

  // Update Stripe Connect account information
  async updateStripeConnectAccount(
    affiliateId: string,
    accountId: string,
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' | 'REQUIRES_ACTION'
  ): Promise<Affiliate> {
    // Get account details from Stripe
    const account = await stripeConnectService.getAccountDetails(accountId);
    const onboardingStatus = stripeConnectService.getOnboardingStatus(account);

    // Update affiliate record
    return await this.updateAffiliate(affiliateId, {
      stripeConnectAccountId: accountId,
      stripeConnectAccountEmail: account.email || undefined,
      stripeConnectOnboardingStatus: onboardingStatus,
    });
  }

  // Get payout eligibility for an affiliate
  async getPayoutEligibility(affiliateId: string): Promise<{
    eligible: boolean;
    reason?: string;
    minimumThreshold: number;
    currentEarnings: number;
    accountReady: boolean;
  }> {
    const affiliate = await this.getAffiliateById(affiliateId);
    
    if (!affiliate) {
      throw new Error('Affiliate not found');
    }

    const minimumThreshold = 5000; // $50 in cents
    const currentEarnings = affiliate.monthlyEarnings || 0;

    // Check if account is ready for payouts
    let accountReady = false;
    if (affiliate.stripeConnectAccountId) {
      try {
        const accountStatus = await stripeConnectService.getAccountStatus(affiliate.stripeConnectAccountId);
        accountReady = accountStatus.payoutsEnabled;
      } catch (error) {
        console.error('Error checking account status:', error);
      }
    }

    const eligible = currentEarnings >= minimumThreshold && accountReady;

    return {
      eligible,
      reason: !eligible
        ? currentEarnings < minimumThreshold
          ? `Minimum threshold not met. Need $${(minimumThreshold / 100).toFixed(2)}, have $${(currentEarnings / 100).toFixed(2)}`
          : !accountReady
          ? 'Stripe Connect account not ready for payouts'
          : undefined
        : undefined,
      minimumThreshold,
      currentEarnings,
      accountReady,
    };
  }

  // Get Stripe Connect account status
  async getStripeConnectStatus(affiliateId: string): Promise<{
    accountId: string | null;
    onboardingStatus: string;
    accountStatus?: {
      detailsSubmitted: boolean;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
    };
  }> {
    const affiliate = await this.getAffiliateById(affiliateId);
    
    if (!affiliate) {
      throw new Error('Affiliate not found');
    }

    if (!affiliate.stripeConnectAccountId) {
      return {
        accountId: null,
        onboardingStatus: affiliate.stripeConnectOnboardingStatus || 'NOT_STARTED',
      };
    }

    try {
      const accountStatus = await stripeConnectService.getAccountStatus(affiliate.stripeConnectAccountId);
      return {
        accountId: affiliate.stripeConnectAccountId,
        onboardingStatus: affiliate.stripeConnectOnboardingStatus || 'NOT_STARTED',
        accountStatus: {
          detailsSubmitted: accountStatus.detailsSubmitted,
          chargesEnabled: accountStatus.chargesEnabled,
          payoutsEnabled: accountStatus.payoutsEnabled,
        },
      };
    } catch (error) {
      console.error('Error getting account status:', error);
      return {
        accountId: affiliate.stripeConnectAccountId,
        onboardingStatus: affiliate.stripeConnectOnboardingStatus || 'NOT_STARTED',
      };
    }
  }

  // Add predefined super admins and lifetime users
  async initializeSpecialUsers() {
    // Super Admins
    const superAdmins = [
      { email: 'lalabalavu.jon@gmail.com', name: 'Jon Lalabalavu' },
      { email: 'sephdee@hotmail.com', name: 'Jon Lalabalavu' }
    ];

    // Lifetime Access Users
    const lifetimeUsers = [
      { email: 'freddierusseljoseph@yahoo.com', name: 'Freddie Russell Joseph' },
      { email: 'deesuks@gmail.com', name: 'Dilo Suka' },
      { email: 'steve44hall@yahoo.co.uk', name: 'Steve Hall' },
      { email: 'mike@ascotwood.com', name: 'Mike Scarpellini' },
      // Eroni Cirikidaveta - email to follow
    ];

    const specialUsers = {
      superAdmins,
      lifetimeUsers,
      initialized: true,
      createdAt: new Date(),
    };

    return specialUsers;
  }
}

export const affiliateService = new AffiliateService();
