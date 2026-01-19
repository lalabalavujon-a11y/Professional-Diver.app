import { useEffect, useState } from "react";
import { trackImpression, trackClick } from "@/lib/sponsor-tracking";
import type { Sponsor } from "@shared/sponsor-schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Building2 } from "lucide-react";

export default function PartnerDirectory() {
  const [sponsors, setSponsors] = useState<Array<Sponsor & { logoUrl?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSponsors() {
      try {
        const response = await fetch("/api/sponsors/public/active");
        const sponsorsData: Sponsor[] = await response.json();

        // Fetch logos for each sponsor
        const sponsorsWithLogos = await Promise.all(
          sponsorsData.map(async (sponsor) => {
            try {
              const assetsResponse = await fetch(`/api/sponsors/${sponsor.id}/assets?assetType=LOGO`);
              const assets = await assetsResponse.json();
              return {
                ...sponsor,
                logoUrl: assets[0]?.assetUrl || null,
              };
            } catch {
              return { ...sponsor, logoUrl: null };
            }
          })
        );

        setSponsors(sponsorsWithLogos);
      } catch (error) {
        console.error("Error fetching sponsors:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSponsors();
  }, []);

  useEffect(() => {
    // Track impressions
    sponsors.forEach((sponsor) => {
      trackImpression(sponsor.id);
    });
  }, [sponsors]);

  const categories = Array.from(new Set(sponsors.map((s) => s.category).filter(Boolean))) as string[];

  const filteredSponsors = selectedCategory
    ? sponsors.filter((s) => s.category === selectedCategory)
    : sponsors;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading partners...</div>
      </div>
    );
  }

  if (sponsors.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 mx-auto text-slate-400 mb-4" />
        <p className="text-slate-600">No partners available at this time.</p>
      </div>
    );
  }

  return (
    <div className="partner-directory">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Our Partners</h2>
        <p className="text-slate-600 mb-6">
          Trusted by leading companies in the commercial diving industry
        </p>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSponsors.map((sponsor) => {
          const handleClick = () => {
            if (sponsor.landingUrl) {
              trackClick(sponsor.id, undefined, sponsor.landingUrl);
              window.open(sponsor.landingUrl, "_blank", "noopener,noreferrer");
            }
          };

          return (
            <Card key={sponsor.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  {sponsor.logoUrl ? (
                    <img
                      src={sponsor.logoUrl}
                      alt={sponsor.companyName}
                      className="h-20 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={handleClick}
                    />
                  ) : (
                    <div className="text-slate-700 font-semibold text-lg">
                      {sponsor.companyName}
                    </div>
                  )}
                </div>
                <CardTitle className="text-center text-lg">{sponsor.companyName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sponsor.description && (
                  <p className="text-sm text-slate-600 text-center line-clamp-3">
                    {sponsor.description}
                  </p>
                )}
                {sponsor.category && (
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                      {sponsor.category}
                    </span>
                  </div>
                )}
                {sponsor.landingUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleClick}
                  >
                    Visit Website
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
