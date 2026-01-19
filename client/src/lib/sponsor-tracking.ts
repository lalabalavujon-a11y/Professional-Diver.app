/**
 * Client-side sponsor tracking utilities
 * Handles GA4 events and server-side event logging
 */

export interface SponsorEventData {
  sponsorId: string;
  placementId?: string;
  eventType: "IMPRESSION" | "CLICK" | "CTA_CLICK" | "CONVERSION";
  userId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  metadata?: Record<string, any>;
}

/**
 * Track sponsor event (impression or click)
 */
export async function trackSponsorEvent(data: SponsorEventData): Promise<void> {
  try {
    // Send to server for database logging
    await fetch("/api/sponsors/track-event", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Track in GA4 if available
    if (typeof window !== "undefined" && (window as any).gtag) {
      const gtag = (window as any).gtag;
      
      if (data.eventType === "IMPRESSION") {
        gtag("event", "sponsor_logo_impression", {
          sponsor_id: data.sponsorId,
          placement: data.placementId || "unknown",
          event_category: "Sponsorship",
        });
      } else if (data.eventType === "CLICK" || data.eventType === "CTA_CLICK") {
        gtag("event", "sponsor_logo_click", {
          sponsor_id: data.sponsorId,
          placement: data.placementId || "unknown",
          destination_url: data.metadata?.destinationUrl || "",
          event_category: "Sponsorship",
        });
      }
    }
  } catch (error) {
    console.error("Error tracking sponsor event:", error);
    // Don't throw - tracking failures shouldn't break the app
  }
}

/**
 * Track sponsor impression
 */
export function trackImpression(sponsorId: string, placementId?: string, metadata?: Record<string, any>): void {
  trackSponsorEvent({
    sponsorId,
    placementId,
    eventType: "IMPRESSION",
    metadata,
  });
}

/**
 * Track sponsor click
 */
export function trackClick(
  sponsorId: string,
  placementId?: string,
  destinationUrl?: string,
  metadata?: Record<string, any>
): void {
  trackSponsorEvent({
    sponsorId,
    placementId,
    eventType: "CLICK",
    metadata: {
      ...metadata,
      destinationUrl,
    },
  });
}

/**
 * Track CTA click
 */
export function trackCTAClick(
  sponsorId: string,
  placementId?: string,
  ctaType?: string,
  metadata?: Record<string, any>
): void {
  trackSponsorEvent({
    sponsorId,
    placementId,
    eventType: "CTA_CLICK",
    metadata: {
      ...metadata,
      ctaType,
    },
  });
}
