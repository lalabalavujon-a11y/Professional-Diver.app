import { useEffect, useState } from "react";
import { trackImpression, trackClick, trackCTAClick } from "@/lib/sponsor-tracking";
import type { Sponsor, SponsorPlacement } from "@shared/sponsor-schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface SponsorTileProps {
  placementType?: string;
  className?: string;
  maxSponsors?: number;
}

export default function SponsorTile({ 
  placementType = "IN_APP_TILE", 
  className = "",
  maxSponsors = 1 
}: SponsorTileProps) {
  const [sponsors, setSponsors] = useState<Array<Sponsor & { placement?: SponsorPlacement; logoUrl?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSponsors() {
      try {
        const placementsResponse = await fetch(`/api/sponsors/placements/active?placementType=${placementType}`);
        const placements: SponsorPlacement[] = await placementsResponse.json();

        // Rotate sponsors if multiple (equal share)
        const selectedPlacements = placements.slice(0, maxSponsors);

        const sponsorPromises = selectedPlacements.map(async (placement) => {
          const sponsorResponse = await fetch(`/api/sponsors/${placement.sponsorId}`);
          const sponsor: Sponsor = await sponsorResponse.json();

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
  }, [placementType, maxSponsors]);

  useEffect(() => {
    sponsors.forEach((sponsor) => {
      if (sponsor.placement) {
        trackImpression(sponsor.id, sponsor.placement.id);
      }
    });
  }, [sponsors]);

  if (loading || sponsors.length === 0) {
    return null;
  }

  const sponsor = sponsors[0]; // Show first sponsor for tile

  const handleLogoClick = () => {
    if (sponsor.placement && sponsor.landingUrl) {
      trackClick(sponsor.id, sponsor.placement.id, sponsor.landingUrl);
      window.open(sponsor.landingUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleCTAClick = () => {
    if (sponsor.placement && sponsor.landingUrl) {
      trackCTAClick(sponsor.id, sponsor.placement.id, sponsor.ctaText || "CTA");
      window.open(sponsor.landingUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card className={`sponsor-tile ${className}`}>
      <CardContent className="p-4">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Featured Partner
          </div>
          {sponsor.logoUrl ? (
            <img
              src={sponsor.logoUrl}
              alt={sponsor.companyName}
              className="h-16 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleLogoClick}
              title={sponsor.description || sponsor.companyName}
            />
          ) : (
            <div className="text-slate-700 font-medium text-sm">
              {sponsor.companyName}
            </div>
          )}
          {sponsor.description && (
            <p className="text-xs text-slate-600 line-clamp-2">
              {sponsor.description}
            </p>
          )}
          {sponsor.ctaText && sponsor.landingUrl && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCTAClick}
              className="text-xs"
            >
              {sponsor.ctaText}
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
