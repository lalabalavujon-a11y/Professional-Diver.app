import { db } from "./db";
import { crmService } from "./crm-service";
import { userLifecycleService } from "./user-lifecycle-service";
import { affiliateService } from "./affiliate-service";

/**
 * Partner Service
 * Handles partner eligibility checks and conversion workflow
 */
export class PartnerService {
  /**
   * Check if user is eligible to become a partner
   */
  async checkEligibility(userId: string): Promise<{
    eligible: boolean;
    reasons: string[];
    requirements: {
      paidSubscriber: boolean;
      activeStatus: boolean;
      notAlreadyPartner: boolean;
      minimumRevenue?: boolean;
    };
  }> {
    try {
      const userResult = await db.execute(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return {
          eligible: false,
          reasons: ["User not found"],
          requirements: {
            paidSubscriber: false,
            activeStatus: false,
            notAlreadyPartner: false,
          },
        };
      }

      const user = userResult.rows[0];
      const reasons: string[] = [];
      const requirements = {
        paidSubscriber: user.subscription_type !== "TRIAL",
        activeStatus: user.subscription_status === "ACTIVE",
        notAlreadyPartner: user.role !== "AFFILIATE",
        minimumRevenue: false, // Can be enhanced with revenue thresholds
      };

      if (!requirements.paidSubscriber) {
        reasons.push("Must be a paid subscriber (not on trial)");
      }

      if (!requirements.activeStatus) {
        reasons.push("Must have an active subscription");
      }

      if (!requirements.notAlreadyPartner) {
        reasons.push("User is already a partner");
      }

      const eligible =
        requirements.paidSubscriber &&
        requirements.activeStatus &&
        requirements.notAlreadyPartner;

      return {
        eligible,
        reasons: eligible ? [] : reasons,
        requirements,
      };
    } catch (error) {
      console.error("Error checking partner eligibility:", error);
      return {
        eligible: false,
        reasons: ["Error checking eligibility"],
        requirements: {
          paidSubscriber: false,
          activeStatus: false,
          notAlreadyPartner: false,
        },
      };
    }
  }

  /**
   * Convert user to partner
   */
  async convertToPartner(userId: string): Promise<{
    success: boolean;
    user?: any;
    client?: any;
    affiliate?: any;
    error?: string;
  }> {
    try {
      // Check eligibility first
      const eligibility = await this.checkEligibility(userId);
      if (!eligibility.eligible) {
        return {
          success: false,
          error: `Not eligible: ${eligibility.reasons.join(", ")}`,
        };
      }

      // Convert user to partner via CRM service
      const result = await crmService.convertToPartner(userId);

      // Create or update affiliate account
      let affiliate;
      try {
        affiliate = await affiliateService.getAffiliateByUserId(userId);
        if (!affiliate) {
          affiliate = await affiliateService.createAffiliate({
            userId: userId,
            name: result.user.name || result.user.email,
            email: result.user.email,
          });
        }
      } catch (error) {
        console.error("Error creating affiliate account:", error);
        // Continue even if affiliate creation fails
      }

      return {
        success: true,
        user: result.user,
        client: result.client,
        affiliate,
      };
    } catch (error) {
      console.error("Error converting to partner:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * User applies to become a partner
   */
  async applyToBecomePartner(userId: string, applicationData?: {
    reason?: string;
    experience?: string;
  }): Promise<{
    success: boolean;
    status: "APPROVED" | "PENDING" | "REJECTED";
    message: string;
  }> {
    try {
      // Check eligibility
      const eligibility = await this.checkEligibility(userId);

      if (!eligibility.eligible) {
        return {
          success: false,
          status: "REJECTED",
          message: `Not eligible: ${eligibility.reasons.join(", ")}`,
        };
      }

      // Auto-approve if eligible (can be enhanced with manual approval workflow)
      const result = await this.convertToPartner(userId);

      if (result.success) {
        return {
          success: true,
          status: "APPROVED",
          message: "Successfully converted to partner!",
        };
      } else {
        return {
          success: false,
          status: "REJECTED",
          message: result.error || "Conversion failed",
        };
      }
    } catch (error) {
      console.error("Error processing partner application:", error);
      return {
        success: false,
        status: "REJECTED",
        message: "Error processing application",
      };
    }
  }

  /**
   * Get partner statistics for a user
   */
  async getPartnerStats(userId: string): Promise<{
    isPartner: boolean;
    partnerStatus?: string;
    totalReferrals?: number;
    totalEarnings?: number;
    monthlyEarnings?: number;
  }> {
    try {
      const userResult = await db.execute(
        'SELECT * FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return { isPartner: false };
      }

      const user = userResult.rows[0];
      const isPartner = user.role === "AFFILIATE";

      if (!isPartner) {
        return { isPartner: false };
      }

      // Get affiliate stats
      try {
        const affiliate = await affiliateService.getAffiliateByUserId(userId);
        if (affiliate) {
          const dashboard = await affiliateService.getAffiliateDashboard(
            affiliate.id
          );
          return {
            isPartner: true,
            partnerStatus: "ACTIVE",
            totalReferrals: dashboard.totalReferrals || 0,
            totalEarnings: dashboard.totalEarnings || 0,
            monthlyEarnings: dashboard.monthlyEarnings || 0,
          };
        }
      } catch (error) {
        console.error("Error getting affiliate stats:", error);
      }

      // Get partner status from client
      const client = await crmService.getClientByUserId(userId);
      return {
        isPartner: true,
        partnerStatus: client?.partner_status || "ACTIVE",
        totalReferrals: 0,
        totalEarnings: 0,
        monthlyEarnings: 0,
      };
    } catch (error) {
      console.error("Error getting partner stats:", error);
      return { isPartner: false };
    }
  }
}

export const partnerService = new PartnerService();



