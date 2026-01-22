import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Ship, MapPin, Calendar, DollarSign, Progress } from "lucide-react";
import type { SalvageWreck } from "@/lib/api";
import { useLocation } from "wouter";

interface WreckCardProps {
  wreck: SalvageWreck;
  onView?: (id: string) => void;
}

export function WreckCard({ wreck, onView }: WreckCardProps) {
  const [, setLocation] = useLocation();

  const statusColors = {
    pending: "secondary",
    "in-progress": "info",
    completed: "success",
    "on-hold": "warning",
  } as const;

  const hullTypeLabels = {
    metal: "Metal",
    fiberglass: "Fiberglass",
  };

  const handleView = () => {
    if (onView) {
      onView(wreck.id);
    } else {
      setLocation(`/salvage/${wreck.id}`);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ship className="h-5 w-5" />
              {wreck.name}
            </CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {typeof wreck.location === 'object' 
                    ? `${wreck.location.lat.toFixed(4)}, ${wreck.location.lng.toFixed(4)}`
                    : 'Location TBD'}
                </span>
              </div>
            </CardDescription>
          </div>
          <Badge variant={statusColors[wreck.status] || "default"}>
            {wreck.status.replace("-", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Hull Type:</span>
              <p className="font-medium">{hullTypeLabels[wreck.hullType]}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Progress:</span>
              <div className="flex items-center gap-2">
                <Progress className="h-4 w-4" />
                <p className="font-medium">{wreck.progressPercentage}%</p>
              </div>
            </div>
            {wreck.estimatedValue && (
              <div>
                <span className="text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  Est. Value:
                </span>
                <p className="font-medium">
                  ${(wreck.estimatedValue / 100).toLocaleString()}
                </p>
              </div>
            )}
            {wreck.startDate && (
              <div>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Started:
                </span>
                <p className="font-medium">
                  {new Date(wreck.startDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {wreck.notes && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {wreck.notes}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleView}
              className="flex-1"
            >
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
