import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWreck, getWreckProgress, getWreckOperations } from "@/lib/api";
import { 
  Ship, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Progress, 
  Users,
  Wrench,
  ArrowLeft,
  Edit
} from "lucide-react";

export default function SalvageDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();

  const { data: wreck, isLoading } = useQuery({
    queryKey: ["/api/salvage/wrecks", id],
    queryFn: () => getWreck(id!),
    enabled: !!id,
  });

  const { data: progress } = useQuery({
    queryKey: ["/api/salvage/wrecks", id, "progress"],
    queryFn: () => getWreckProgress(id!),
    enabled: !!id,
  });

  const { data: operations } = useQuery({
    queryKey: ["/api/salvage/wrecks", id, "operations"],
    queryFn: () => getWreckOperations(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading wreck details...</div>
      </div>
    );
  }

  if (!wreck) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">Wreck not found</p>
            <Button onClick={() => setLocation("/salvage")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusColors = {
    pending: "secondary",
    "in-progress": "info",
    completed: "success",
    "on-hold": "warning",
  } as const;

  const location = typeof wreck.location === 'object' 
    ? wreck.location 
    : { lat: 0, lng: 0 };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/salvage")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Ship className="h-8 w-8" />
              {wreck.name}
            </h1>
            <p className="text-muted-foreground mt-1">Wreck ID: {wreck.id}</p>
          </div>
        </div>
        <Badge variant={statusColors[wreck.status] || "default"} className="text-sm px-3 py-1">
          {wreck.status.replace("-", " ")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hull Type</p>
                  <p className="font-medium capitalize">{wreck.hullType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={statusColors[wreck.status] || "default"}>
                    {wreck.status.replace("-", " ")}
                  </Badge>
                </div>
                {wreck.startDate && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Start Date
                    </p>
                    <p className="font-medium">
                      {new Date(wreck.startDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {wreck.completionDate && (
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Completion Date
                    </p>
                    <p className="font-medium">
                      {new Date(wreck.completionDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </p>
                <p className="font-medium">
                  {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                </p>
                <a
                  href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View on Google Maps
                </a>
              </div>

              {wreck.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{wreck.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operations */}
          <Card>
            <CardHeader>
              <CardTitle>Operations</CardTitle>
              <CardDescription>
                {operations?.length || 0} operation(s) recorded
              </CardDescription>
            </CardHeader>
            <CardContent>
              {operations && operations.length > 0 ? (
                <div className="space-y-4">
                  {operations.map((op) => (
                    <div key={op.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{op.operationType}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(op.startTime).toLocaleString()}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {op.progressPercentage}% complete
                        </Badge>
                      </div>
                      <p className="text-sm mb-2">{op.description}</p>
                      {op.notes && (
                        <p className="text-sm text-muted-foreground">{op.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No operations recorded yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Progress className="h-5 w-5" />
                Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall Progress</span>
                    <span className="text-lg font-bold">{wreck.progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${wreck.progressPercentage}%` }}
                    />
                  </div>
                </div>
                {progress && (
                  <>
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground mb-1">
                        Operations: {progress.completedOperations} / {progress.totalOperations}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial */}
          {(wreck.estimatedValue || wreck.actualCost) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {wreck.estimatedValue && (
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Value</p>
                    <p className="text-lg font-semibold">
                      ${(wreck.estimatedValue / 100).toLocaleString()}
                    </p>
                  </div>
                )}
                {wreck.actualCost && (
                  <div>
                    <p className="text-sm text-muted-foreground">Actual Cost</p>
                    <p className="text-lg font-semibold">
                      ${(wreck.actualCost / 100).toLocaleString()}
                    </p>
                  </div>
                )}
                {wreck.estimatedValue && wreck.actualCost && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">Net Value</p>
                    <p className={`text-lg font-semibold ${
                      (wreck.estimatedValue - wreck.actualCost) >= 0 
                        ? "text-green-600" 
                        : "text-red-600"
                    }`}>
                      ${((wreck.estimatedValue - wreck.actualCost) / 100).toLocaleString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Equipment */}
          {wreck.equipmentRequired && wreck.equipmentRequired.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Equipment Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {wreck.equipmentRequired.map((item, index) => (
                    <li key={index} className="text-sm">
                      • {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => setLocation(`/salvage/${id}/edit`)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Wreck
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
