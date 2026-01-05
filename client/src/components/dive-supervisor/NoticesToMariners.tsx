/**
 * Notices to Mariners Component
 * 
 * Integration with existing NTM service to display relevant notices
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  FileText,
  AlertTriangle,
  Info,
  MapPin,
  Calendar,
  RefreshCw,
  Filter
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface NoticeToMariners {
  id: string;
  number: string;
  title: string;
  type: string;
  severity: string;
  location: string;
  latitude?: number;
  longitude?: number;
  date: string;
  expiresAt?: string;
  description: string;
  affectedCharts?: string[];
  affectedAreas?: string[];
}

interface NoticesToMarinersProps {
  operationId: string | null;
  onOperationSelect: (id: string | null) => void;
}

export default function NoticesToMariners({ operationId, onOperationSelect }: NoticesToMarinersProps) {
  const { toast } = useToast();
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");

  // Fetch operations
  const { data: operations = [] } = useQuery({
    queryKey: ["/api/dive-supervisor/operations"],
    queryFn: async () => {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/dive-supervisor/operations?email=${email}`);
      if (!response.ok) throw new Error('Failed to fetch operations');
      return response.json();
    },
  });

  // Get location
  useEffect(() => {
    fetchUserLocation();
  }, [operationId]);

  const fetchUserLocation = async () => {
    try {
      const email = localStorage.getItem('userEmail') || 'lalabalavu.jon@gmail.com';
      const response = await fetch(`/api/widget-locations?email=${email}`);
      if (response.ok) {
        const data = await response.json();
        if (data.locations && data.locations.length > 0) {
          const currentLocation = data.locations.find((loc: any) => loc.isCurrentLocation) || data.locations[0];
          setLocation({ lat: currentLocation.latitude, lon: currentLocation.longitude });
        }
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  // Fetch notices
  const { data: notices = [], isLoading, refetch } = useQuery<NoticeToMariners[]>({
    queryKey: ["/api/dive-supervisor/notices-to-mariners", location?.lat, location?.lon, radiusKm],
    queryFn: async () => {
      if (!location) throw new Error('Location not available');
      const response = await fetch(
        `/api/dive-supervisor/notices-to-mariners?lat=${location.lat}&lon=${location.lon}&radiusKm=${radiusKm}`
      );
      if (!response.ok) throw new Error('Failed to fetch notices');
      return response.json();
    },
    enabled: !!location,
  });

  const filteredNotices = notices.filter((notice) => {
    if (filterType !== "ALL" && notice.type !== filterType) return false;
    if (filterSeverity !== "ALL" && notice.severity !== filterSeverity) return false;
    return true;
  });

  const severityColors: Record<string, string> = {
    CRITICAL: "bg-red-100 text-red-800 border-red-300",
    WARNING: "bg-orange-100 text-orange-800 border-orange-300",
    INFORMATION: "bg-blue-100 text-blue-800 border-blue-300",
  };

  const typeLabels: Record<string, string> = {
    NAVIGATION: "Navigation",
    SAFETY: "Safety",
    CHART: "Chart",
    TIDAL: "Tidal",
    GENERAL: "General",
  };

  if (!operationId) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Select Operation</CardTitle>
            <CardDescription>Choose an operation to view Notices to Mariners</CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={operationId || "none"}
              onValueChange={(value) => onOperationSelect(value === "none" ? null : value)}
            >
              <SelectTrigger className="w-full md:w-[300px]">
                <SelectValue placeholder="Select Operation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select Operation</SelectItem>
                {operations.map((op: any) => (
                  <SelectItem key={op.id} value={op.id}>
                    {op.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notices to Mariners</h2>
          <p className="text-sm text-muted-foreground">
            Relevant navigation and safety notices for your operation location
          </p>
        </div>
        <div className="flex space-x-2">
          <Select
            value={operationId}
            onValueChange={(value) => onOperationSelect(value)}
          >
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operations.map((op: any) => (
                <SelectItem key={op.id} value={op.id}>
                  {op.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Type</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="NAVIGATION">Navigation</SelectItem>
                  <SelectItem value="SAFETY">Safety</SelectItem>
                  <SelectItem value="CHART">Chart</SelectItem>
                  <SelectItem value="TIDAL">Tidal</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Severity</label>
              <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Severities</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="WARNING">Warning</SelectItem>
                  <SelectItem value="INFORMATION">Information</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Radius (km)</label>
              <Input
                type="number"
                value={radiusKm}
                onChange={(e) => setRadiusKm(parseInt(e.target.value) || 50)}
                min={1}
                max={500}
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline" onClick={() => refetch()} className="w-full">
                Apply Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!location && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Location not available. Please set a location in widget settings.</p>
          </CardContent>
        </Card>
      )}

      {location && isLoading && (
        <Card>
          <CardContent className="py-8 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading notices...</p>
          </CardContent>
        </Card>
      )}

      {location && !isLoading && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredNotices.length} of {notices.length} notices
            </p>
          </div>

          <div className="space-y-4">
            {filteredNotices.map((notice) => (
              <Card key={notice.id} className={notice.severity === "CRITICAL" ? "border-red-500" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        {notice.severity === "CRITICAL" ? (
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        ) : (
                          <Info className="w-5 h-5 text-blue-600" />
                        )}
                        <span>{notice.title}</span>
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline">{notice.number}</Badge>
                        <Badge variant="outline">{typeLabels[notice.type] || notice.type}</Badge>
                        <Badge className={severityColors[notice.severity] || "bg-gray-100 text-gray-800"}>
                          {notice.severity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4" />
                      <span>{notice.location}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>Date: {format(new Date(notice.date), "PPP")}</span>
                    </div>
                    {notice.expiresAt && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Expires: {format(new Date(notice.expiresAt), "PPP")}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-semibold mb-1">Description</div>
                    <p className="text-sm text-muted-foreground">{notice.description}</p>
                  </div>
                  {notice.affectedCharts && notice.affectedCharts.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold mb-1">Affected Charts</div>
                      <div className="flex flex-wrap gap-1">
                        {notice.affectedCharts.map((chart, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {chart}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {notice.affectedAreas && notice.affectedAreas.length > 0 && (
                    <div>
                      <div className="text-sm font-semibold mb-1">Affected Areas</div>
                      <div className="flex flex-wrap gap-1">
                        {notice.affectedAreas.map((area, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {area}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredNotices.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No notices found matching your filters.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

