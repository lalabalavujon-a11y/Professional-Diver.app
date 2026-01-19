import { useEffect, useState } from "react";
import { trackImpression, trackClick } from "@/lib/sponsor-tracking";
import type { Sponsor, SponsorPlacement } from "@shared/sponsor-schema";

interface SponsorStripProps {
  placementType?: string;
  className?: string;
}

export default function SponsorStrip({ placementType = "HOMEPAGE_STRIP", className = "" }: SponsorStripProps) {
  const [sponsors, setSponsors] = useState<Array<Sponsor & { placement?: SponsorPlacement; logoUrl?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSponsors() {
      try {
        // Fetch active placements
        const placementsResponse = await fetch(`/api/sponsors/placements/active?placementType=${placementType}`);
        const placements: SponsorPlacement[] = await placementsResponse.json();

        // Fetch sponsor details for each placement
        const sponsorPromises = placements.map(async (placement) => {
          const sponsorResponse = await fetch(`/api/sponsors/${placement.sponsorId}`);
          const sponsor: Sponsor = await sponsorResponse.json();

          // Get logo asset
          const assetsResponse = await fetch(`/api/sponsors/${placement.sponsorId}/assets?assetType=LOGO`);
          const assets = await assetsResponse.json();
          const logoAsset = assets[0];

          return {
            ...sponsor,
            placement,
            logoUrl: logoAsset?.assetUrl || null,
          };
        });

        const sponsorsData = await Promise.all(sponsorPromises);
        setSponsors(sponsorsData.filter((s) => s.status === "ACTIVE"));
      } catch (error) {
        console.error("Error fetching sponsors:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSponsors();
  }, [placementType]);

  useEffect(() => {
    // Track impressions for all visible sponsors
    sponsors.forEach((sponsor) => {
      if (sponsor.placement) {
        trackImpression(sponsor.id, sponsor.placement.id);
      }
    });
  }, [sponsors]);

  if (loading || sponsors.length === 0) {
    return null;
  }

  return (
    <div className={`sponsor-strip ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-6">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Trusted Partners
          </h3>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {sponsors.map((sponsor) => {
            const handleClick = () => {
              if (sponsor.placement && sponsor.landingUrl) {
                trackClick(sponsor.id, sponsor.placement.id, sponsor.landingUrl);
                window.open(sponsor.landingUrl, "_blank", "noopener,noreferrer");
              }
            };

            return (
              <div
                key={sponsor.id}
                className="flex items-center justify-center transition-opacity hover:opacity-80"
                onClick={handleClick}
                style={{ cursor: sponsor.landingUrl ? "pointer" : "default" }}
              >
                {sponsor.logoUrl ? (
                  <img
                    src={sponsor.logoUrl}
                    alt={sponsor.companyName}
                    className="h-12 md:h-16 w-auto object-contain filter grayscale hover:grayscale-0 transition-all"
                    title={sponsor.description || sponsor.companyName}
                  />
                ) : (
                  <span className="text-slate-600 font-medium text-sm md:text-base">
                    {sponsor.companyName}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
