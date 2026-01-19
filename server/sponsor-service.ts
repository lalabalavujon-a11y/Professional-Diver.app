import { db } from "./db";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import type {
  Sponsor,
  NewSponsor,
  SponsorPlacement,
  NewSponsorPlacement,
  SponsorAsset,
  NewSponsorAsset,
  SponsorEvent,
  NewSponsorEvent,
  SponsorReport,
  NewSponsorReport,
  SponsorInquiry,
  NewSponsorInquiry,
} from "@shared/sponsor-schema";
import {
  sponsors,
  sponsorPlacements,
  sponsorAssets,
  sponsorEvents,
  sponsorReports,
  sponsorInquiries,
} from "@shared/sponsor-schema";

export class SponsorService {
  // ========== Sponsor CRUD Operations ==========

  /**
   * Get all sponsors with optional filters
   */
  async getSponsors(filters?: {
    status?: "PENDING" | "ACTIVE" | "INACTIVE" | "CANCELLED";
    tier?: "BRONZE" | "SILVER" | "GOLD" | "TITLE" | "FOUNDING";
    category?: string;
  }): Promise<Sponsor[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(sponsors.status, filters.status));
    }
    if (filters?.tier) {
      conditions.push(eq(sponsors.tier, filters.tier));
    }
    if (filters?.category) {
      conditions.push(eq(sponsors.category, filters.category));
    }

    const result = await db
      .select()
      .from(sponsors)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(sponsors.createdAt));

    return Array.isArray(result) ? result : result.rows || [];
  }

  /**
   * Get active sponsors for public display
   */
  async getActiveSponsors(): Promise<Sponsor[]> {
    const now = new Date();
    const result = await db
      .select()
      .from(sponsors)
      .where(
        and(
          eq(sponsors.status, "ACTIVE"),
          sql`(${sponsors.startDate} IS NULL OR ${sponsors.startDate} <= ${now})`,
          sql`(${sponsors.endDate} IS NULL OR ${sponsors.endDate} >= ${now})`
        )
      )
      .orderBy(sponsors.tier, desc(sponsors.createdAt));

    return Array.isArray(result) ? result : result.rows || [];
  }

  /**
   * Get sponsor by ID
   */
  async getSponsorById(id: string): Promise<Sponsor | null> {
    const result = await db.select().from(sponsors).where(eq(sponsors.id, id)).limit(1);
    const sponsor = Array.isArray(result) ? result[0] : result.rows?.[0];
    return sponsor || null;
  }

  /**
   * Create new sponsor
   */
  async createSponsor(data: NewSponsor): Promise<Sponsor> {
    const result = await db.insert(sponsors).values(data).returning();
    return Array.isArray(result) ? result[0] : result.rows[0];
  }

  /**
   * Update sponsor
   */
  async updateSponsor(id: string, data: Partial<NewSponsor>): Promise<Sponsor> {
    const updateData = { ...data, updatedAt: new Date() };
    const result = await db
      .update(sponsors)
      .set(updateData)
      .where(eq(sponsors.id, id))
      .returning();
    return Array.isArray(result) ? result[0] : result.rows[0];
  }

  /**
   * Delete sponsor
   */
  async deleteSponsor(id: string): Promise<void> {
    await db.delete(sponsors).where(eq(sponsors.id, id));
  }

  // ========== Placement Management ==========

  /**
   * Get placements for a sponsor
   */
  async getSponsorPlacements(sponsorId: string): Promise<SponsorPlacement[]> {
    const result = await db
      .select()
      .from(sponsorPlacements)
      .where(eq(sponsorPlacements.sponsorId, sponsorId))
      .orderBy(sponsorPlacements.order, desc(sponsorPlacements.createdAt));

    return Array.isArray(result) ? result : result.rows || [];
  }

  /**
   * Get active placements for public display
   */
  async getActivePlacements(placementType?: string): Promise<SponsorPlacement[]> {
    const now = new Date();
    const conditions = [
      eq(sponsorPlacements.isActive, true),
      sql`(${sponsorPlacements.startDate} IS NULL OR ${sponsorPlacements.startDate} <= ${now})`,
      sql`(${sponsorPlacements.endDate} IS NULL OR ${sponsorPlacements.endDate} >= ${now})`,
    ];

    if (placementType) {
      conditions.push(eq(sponsorPlacements.placementType, placementType as any));
    }

    const result = await db
      .select()
      .from(sponsorPlacements)
      .where(and(...conditions))
      .orderBy(sponsorPlacements.order);

    return Array.isArray(result) ? result : result.rows || [];
  }

  /**
   * Create placement
   */
  async createPlacement(data: NewSponsorPlacement): Promise<SponsorPlacement> {
    const result = await db.insert(sponsorPlacements).values(data).returning();
    return Array.isArray(result) ? result[0] : result.rows[0];
  }

  /**
   * Update placement
   */
  async updatePlacement(id: string, data: Partial<NewSponsorPlacement>): Promise<SponsorPlacement> {
    const updateData = { ...data, updatedAt: new Date() };
    const result = await db
      .update(sponsorPlacements)
      .set(updateData)
      .where(eq(sponsorPlacements.id, id))
      .returning();
    return Array.isArray(result) ? result[0] : result.rows[0];
  }

  /**
   * Delete placement
   */
  async deletePlacement(id: string): Promise<void> {
    await db.delete(sponsorPlacements).where(eq(sponsorPlacements.id, id));
  }

  // ========== Asset Management ==========

  /**
   * Get assets for a sponsor
   */
  async getSponsorAssets(sponsorId: string, assetType?: string): Promise<SponsorAsset[]> {
    const conditions = [eq(sponsorAssets.sponsorId, sponsorId)];
    if (assetType) {
      conditions.push(eq(sponsorAssets.assetType, assetType as any));
    }

    const result = await db
      .select()
      .from(sponsorAssets)
      .where(and(...conditions))
      .orderBy(desc(sponsorAssets.createdAt));

    return Array.isArray(result) ? result : result.rows || [];
  }

  /**
   * Create asset
   */
  async createAsset(data: NewSponsorAsset): Promise<SponsorAsset> {
    const result = await db.insert(sponsorAssets).values(data).returning();
    return Array.isArray(result) ? result[0] : result.rows[0];
  }

  /**
   * Delete asset
   */
  async deleteAsset(id: string): Promise<void> {
    await db.delete(sponsorAssets).where(eq(sponsorAssets.id, id));
  }

  // ========== Event Tracking ==========

  /**
   * Track sponsor event
   */
  async trackEvent(data: NewSponsorEvent): Promise<SponsorEvent> {
    const result = await db.insert(sponsorEvents).values(data).returning();
    return Array.isArray(result) ? result[0] : result.rows[0];
  }

  /**
   * Get events for a sponsor
   */
  async getSponsorEvents(
    sponsorId: string,
    filters?: {
      eventType?: string;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<SponsorEvent[]> {
    const conditions = [eq(sponsorEvents.sponsorId, sponsorId)];

    if (filters?.eventType) {
      conditions.push(eq(sponsorEvents.eventType, filters.eventType as any));
    }
    if (filters?.startDate) {
      conditions.push(gte(sponsorEvents.timestamp, filters.startDate));
    }
    if (filters?.endDate) {
      conditions.push(lte(sponsorEvents.timestamp, filters.endDate));
    }

    const result = await db
      .select()
      .from(sponsorEvents)
      .where(and(...conditions))
      .orderBy(desc(sponsorEvents.timestamp));

    return Array.isArray(result) ? result : result.rows || [];
  }

  /**
   * Get analytics for a sponsor
   */
  async getSponsorAnalytics(
    sponsorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    impressions: number;
    clicks: number;
    ctr: number;
    ctaConversions: number;
    placementBreakdown: Record<string, { impressions: number; clicks: number; ctr: number }>;
  }> {
    const conditions = [eq(sponsorEvents.sponsorId, sponsorId)];
    if (startDate) {
      conditions.push(gte(sponsorEvents.timestamp, startDate));
    }
    if (endDate) {
      conditions.push(lte(sponsorEvents.timestamp, endDate));
    }

    const allEvents = await this.getSponsorEvents(sponsorId, {
      startDate,
      endDate,
    });

    const impressions = allEvents.filter((e) => e.eventType === "IMPRESSION").length;
    const clicks = allEvents.filter((e) => e.eventType === "CLICK" || e.eventType === "CTA_CLICK").length;
    const ctaConversions = allEvents.filter((e) => e.eventType === "CONVERSION").length;
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

    // Placement breakdown
    const placementBreakdown: Record<string, { impressions: number; clicks: number; ctr: number }> = {};
    for (const event of allEvents) {
      const placementId = event.placementId || "unknown";
      if (!placementBreakdown[placementId]) {
        placementBreakdown[placementId] = { impressions: 0, clicks: 0, ctr: 0 };
      }
      if (event.eventType === "IMPRESSION") {
        placementBreakdown[placementId].impressions++;
      }
      if (event.eventType === "CLICK" || event.eventType === "CTA_CLICK") {
        placementBreakdown[placementId].clicks++;
      }
    }

    // Calculate CTR for each placement
    for (const placementId in placementBreakdown) {
      const breakdown = placementBreakdown[placementId];
      breakdown.ctr = breakdown.impressions > 0 ? (breakdown.clicks / breakdown.impressions) * 100 : 0;
    }

    return {
      impressions,
      clicks,
      ctr,
      ctaConversions,
      placementBreakdown,
    };
  }

  // ========== Report Management ==========

  /**
   * Get reports for a sponsor
   */
  async getSponsorReports(sponsorId: string): Promise<SponsorReport[]> {
    const result = await db
      .select()
      .from(sponsorReports)
      .where(eq(sponsorReports.sponsorId, sponsorId))
      .orderBy(desc(sponsorReports.reportMonth));

    return Array.isArray(result) ? result : result.rows || [];
  }

  /**
   * Generate monthly report
   */
  async generateMonthlyReport(sponsorId: string, reportMonth: string): Promise<SponsorReport> {
    // Parse month (format: "YYYY-MM")
    const [year, month] = reportMonth.split("-");
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const analytics = await this.getSponsorAnalytics(sponsorId, startDate, endDate);

    const reportData: NewSponsorReport = {
      sponsorId,
      reportMonth,
      impressions: analytics.impressions,
      clicks: analytics.clicks,
      ctr: analytics.ctr,
      ctaConversions: analytics.ctaConversions,
      placementBreakdown: analytics.placementBreakdown,
      reportData: analytics,
    };

    const result = await db.insert(sponsorReports).values(reportData).returning();
    return Array.isArray(result) ? result[0] : result.rows[0];
  }

  // ========== Inquiry Management ==========

  /**
   * Create inquiry
   */
  async createInquiry(data: NewSponsorInquiry): Promise<SponsorInquiry> {
    const result = await db.insert(sponsorInquiries).values(data).returning();
    return Array.isArray(result) ? result[0] : result.rows[0];
  }

  /**
   * Get all inquiries
   */
  async getInquiries(filters?: { status?: string }): Promise<SponsorInquiry[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(sponsorInquiries.status, filters.status));
    }

    const result = await db
      .select()
      .from(sponsorInquiries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(sponsorInquiries.createdAt));

    return Array.isArray(result) ? result : result.rows || [];
  }

  /**
   * Update inquiry
   */
  async updateInquiry(id: string, data: Partial<NewSponsorInquiry>): Promise<SponsorInquiry> {
    const updateData = { ...data, updatedAt: new Date() };
    const result = await db
      .update(sponsorInquiries)
      .set(updateData)
      .where(eq(sponsorInquiries.id, id))
      .returning();
    return Array.isArray(result) ? result[0] : result.rows[0];
  }

  // ========== UTM Link Generation ==========

  /**
   * Generate UTM-tracked link for sponsor
   */
  generateUTMLink(sponsor: Sponsor, baseUrl: string, placement?: string): string {
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    const campaign = `${sponsor.companyName}_${sponsor.tier}_${month}`.replace(/\s+/g, "_");

    const url = new URL(baseUrl);
    url.searchParams.set("utm_source", "professionaldiverapp");
    url.searchParams.set("utm_medium", "sponsorship");
    url.searchParams.set("utm_campaign", campaign);
    if (placement) {
      url.searchParams.set("utm_content", placement);
    }

    return url.toString();
  }

  // ========== Exclusivity Validation ==========

  /**
   * Check if category exclusivity is available
   */
  async checkExclusivityAvailable(category: string, excludeSponsorId?: string): Promise<boolean> {
    const conditions = [
      eq(sponsors.status, "ACTIVE"),
      eq(sponsors.exclusivityCategory, category),
    ];

    if (excludeSponsorId) {
      // Use SQL to exclude sponsor
      conditions.push(sql`${sponsors.id} != ${excludeSponsorId}`);
    }

    const result = await db
      .select()
      .from(sponsors)
      .where(and(...conditions))
      .limit(1);

    const existing = Array.isArray(result) ? result[0] : result.rows?.[0];
    return !existing; // Available if no existing sponsor found
  }
}

export const sponsorService = new SponsorService();
