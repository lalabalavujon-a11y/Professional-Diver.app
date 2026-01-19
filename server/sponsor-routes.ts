import type { Express } from "express";
import { z } from "zod";
import { sponsorService } from "./sponsor-service";
import { insertSponsorSchema, insertSponsorPlacementSchema, insertSponsorInquirySchema } from "@shared/sponsor-schema";

/**
 * Register sponsor-related API routes
 */
export function registerSponsorRoutes(app: Express): void {
  // ========== Public Routes ==========

  /**
   * GET /api/sponsors/public/active
   * Get active sponsors for public display
   */
  app.get("/api/sponsors/public/active", async (req, res) => {
    try {
      const sponsors = await sponsorService.getActiveSponsors();
      res.json(sponsors);
    } catch (error) {
      console.error("Error fetching active sponsors:", error);
      res.status(500).json({ error: "Failed to fetch active sponsors" });
    }
  });

  /**
   * POST /api/sponsors/inquiry
   * Submit partner inquiry form (public)
   */
  app.post("/api/sponsors/inquiry", async (req, res) => {
    try {
      const inquiryData = insertSponsorInquirySchema.parse(req.body);
      const inquiry = await sponsorService.createInquiry(inquiryData);
      res.status(201).json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid inquiry data", details: error.errors });
        return;
      }
      console.error("Error creating inquiry:", error);
      res.status(500).json({ error: "Failed to create inquiry" });
    }
  });

  /**
   * POST /api/sponsors/track-event
   * Track sponsor event (impression/click) - public endpoint
   */
  app.post("/api/sponsors/track-event", async (req, res) => {
    try {
      const eventSchema = z.object({
        sponsorId: z.string(),
        placementId: z.string().optional(),
        eventType: z.enum(["IMPRESSION", "CLICK", "CTA_CLICK", "CONVERSION"]),
        userId: z.string().optional(),
        utmSource: z.string().optional(),
        utmMedium: z.string().optional(),
        utmCampaign: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      });

      const eventData = eventSchema.parse(req.body);
      const event = await sponsorService.trackEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid event data", details: error.errors });
        return;
      }
      console.error("Error tracking event:", error);
      res.status(500).json({ error: "Failed to track event" });
    }
  });

  // ========== Admin Routes ==========

  /**
   * GET /api/sponsors
   * List all sponsors (admin only)
   */
  app.get("/api/sponsors", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const filters = {
        status: req.query.status as any,
        tier: req.query.tier as any,
        category: req.query.category as string | undefined,
      };

      const sponsors = await sponsorService.getSponsors(filters);
      res.json(sponsors);
    } catch (error) {
      console.error("Error fetching sponsors:", error);
      res.status(500).json({ error: "Failed to fetch sponsors" });
    }
  });

  /**
   * GET /api/sponsors/:id
   * Get sponsor details
   */
  app.get("/api/sponsors/:id", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const sponsor = await sponsorService.getSponsorById(req.params.id);
      if (!sponsor) {
        res.status(404).json({ error: "Sponsor not found" });
        return;
      }
      res.json(sponsor);
    } catch (error) {
      console.error("Error fetching sponsor:", error);
      res.status(500).json({ error: "Failed to fetch sponsor" });
    }
  });

  /**
   * POST /api/sponsors
   * Create new sponsor (admin only)
   */
  app.post("/api/sponsors", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const sponsorData = insertSponsorSchema.parse(req.body);
      const sponsor = await sponsorService.createSponsor(sponsorData);
      res.status(201).json(sponsor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid sponsor data", details: error.errors });
        return;
      }
      console.error("Error creating sponsor:", error);
      res.status(500).json({ error: "Failed to create sponsor" });
    }
  });

  /**
   * PUT /api/sponsors/:id
   * Update sponsor (admin only)
   */
  app.put("/api/sponsors/:id", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const updateData = insertSponsorSchema.partial().parse(req.body);
      const sponsor = await sponsorService.updateSponsor(req.params.id, updateData);
      res.json(sponsor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid sponsor data", details: error.errors });
        return;
      }
      console.error("Error updating sponsor:", error);
      res.status(500).json({ error: "Failed to update sponsor" });
    }
  });

  /**
   * DELETE /api/sponsors/:id
   * Delete sponsor (admin only)
   */
  app.delete("/api/sponsors/:id", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      await sponsorService.deleteSponsor(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting sponsor:", error);
      res.status(500).json({ error: "Failed to delete sponsor" });
    }
  });

  /**
   * GET /api/sponsors/:id/placements
   * Get sponsor placements
   */
  app.get("/api/sponsors/:id/placements", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const placements = await sponsorService.getSponsorPlacements(req.params.id);
      res.json(placements);
    } catch (error) {
      console.error("Error fetching placements:", error);
      res.status(500).json({ error: "Failed to fetch placements" });
    }
  });

  /**
   * POST /api/sponsors/:id/placements
   * Create placement (admin only)
   */
  app.post("/api/sponsors/:id/placements", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const placementData = insertSponsorPlacementSchema.parse({
        ...req.body,
        sponsorId: req.params.id,
      });
      const placement = await sponsorService.createPlacement(placementData);
      res.status(201).json(placement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid placement data", details: error.errors });
        return;
      }
      console.error("Error creating placement:", error);
      res.status(500).json({ error: "Failed to create placement" });
    }
  });

  /**
   * PUT /api/sponsors/:id/placements/:placementId
   * Update placement (admin only)
   */
  app.put("/api/sponsors/:id/placements/:placementId", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const updateData = insertSponsorPlacementSchema.partial().parse(req.body);
      const placement = await sponsorService.updatePlacement(req.params.placementId, updateData);
      res.json(placement);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid placement data", details: error.errors });
        return;
      }
      console.error("Error updating placement:", error);
      res.status(500).json({ error: "Failed to update placement" });
    }
  });

  /**
   * DELETE /api/sponsors/:id/placements/:placementId
   * Delete placement (admin only)
   */
  app.delete("/api/sponsors/:id/placements/:placementId", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      await sponsorService.deletePlacement(req.params.placementId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting placement:", error);
      res.status(500).json({ error: "Failed to delete placement" });
    }
  });

  /**
   * GET /api/sponsors/:id/analytics
   * Get sponsor analytics dashboard
   */
  app.get("/api/sponsors/:id/analytics", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const analytics = await sponsorService.getSponsorAnalytics(req.params.id, startDate, endDate);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  /**
   * GET /api/sponsors/:id/reports
   * Get sponsor reports
   */
  app.get("/api/sponsors/:id/reports", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const reports = await sponsorService.getSponsorReports(req.params.id);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });

  /**
   * POST /api/sponsors/:id/generate-report
   * Generate monthly report (admin only)
   */
  app.post("/api/sponsors/:id/generate-report", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const reportMonthSchema = z.object({
        reportMonth: z.string().regex(/^\d{4}-\d{2}$/), // Format: YYYY-MM
      });

      const { reportMonth } = reportMonthSchema.parse(req.body);
      const report = await sponsorService.generateMonthlyReport(req.params.id, reportMonth);
      res.status(201).json(report);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid report month format", details: error.errors });
        return;
      }
      console.error("Error generating report:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  /**
   * GET /api/sponsors/inquiries
   * Get all inquiries (admin only)
   */
  app.get("/api/sponsors/inquiries", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const filters = {
        status: req.query.status as string | undefined,
      };
      const inquiries = await sponsorService.getInquiries(filters);
      res.json(inquiries);
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      res.status(500).json({ error: "Failed to fetch inquiries" });
    }
  });

  /**
   * PUT /api/sponsors/inquiries/:id
   * Update inquiry (admin only)
   */
  app.put("/api/sponsors/inquiries/:id", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const updateData = insertSponsorInquirySchema.partial().parse(req.body);
      const inquiry = await sponsorService.updateInquiry(req.params.id, updateData);
      res.json(inquiry);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid inquiry data", details: error.errors });
        return;
      }
      console.error("Error updating inquiry:", error);
      res.status(500).json({ error: "Failed to update inquiry" });
    }
  });

  /**
   * GET /api/sponsors/placements/active
   * Get active placements for a specific type (public or admin)
   */
  app.get("/api/sponsors/placements/active", async (req, res) => {
    try {
      const placementType = req.query.placementType as string | undefined;
      const placements = await sponsorService.getActivePlacements(placementType);
      res.json(placements);
    } catch (error) {
      console.error("Error fetching active placements:", error);
      res.status(500).json({ error: "Failed to fetch active placements" });
    }
  });

  /**
   * GET /api/sponsors/:id/assets
   * Get sponsor assets (public or admin)
   */
  app.get("/api/sponsors/:id/assets", async (req, res) => {
    try {
      const assetType = req.query.assetType as string | undefined;
      const assets = await sponsorService.getSponsorAssets(req.params.id, assetType);
      res.json(assets);
    } catch (error) {
      console.error("Error fetching sponsor assets:", error);
      res.status(500).json({ error: "Failed to fetch sponsor assets" });
    }
  });

  /**
   * POST /api/sponsors/:id/assets
   * Create sponsor asset (admin only)
   */
  app.post("/api/sponsors/:id/assets", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      const assetSchema = z.object({
        assetType: z.enum(["LOGO", "DESCRIPTION", "CTA_TEXT", "BRAND_GUIDELINES"]),
        assetUrl: z.string().url().optional(),
        assetData: z.record(z.any()).optional(),
      });

      const assetData = assetSchema.parse(req.body);
      const asset = await sponsorService.createAsset({
        ...assetData,
        sponsorId: req.params.id,
      });
      res.status(201).json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid asset data", details: error.errors });
        return;
      }
      console.error("Error creating asset:", error);
      res.status(500).json({ error: "Failed to create asset" });
    }
  });

  /**
   * DELETE /api/sponsors/:id/assets/:assetId
   * Delete sponsor asset (admin only)
   */
  app.delete("/api/sponsors/:id/assets/:assetId", async (req, res) => {
    try {
      // TODO: Add admin authentication check
      await sponsorService.deleteAsset(req.params.assetId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting asset:", error);
      res.status(500).json({ error: "Failed to delete asset" });
    }
  });
}
