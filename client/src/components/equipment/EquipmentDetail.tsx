import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Clock, Wrench, FileText } from "lucide-react";
import { format } from "date-fns";

interface EquipmentDetailProps {
  itemId: string;
  onBack?: () => void;
  onLogUse?: () => void;
  onScheduleMaintenance?: () => void;
}

interface EquipmentDetailData {
  id: string;
  name: string;
  serialNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  purchaseDate?: string | null;
  status: string;
  location?: string | null;
  notes?: string | null;
  equipmentType?: {
    id: string;
    name: string;
    description?: string | null;
  };
  maintenanceTasks?: any[];
  useLogs?: any[];
}

export default function EquipmentDetail({
  itemId,
  onBack,
  onLogUse,
  onScheduleMaintenance,
}: EquipmentDetailProps) {
  const { data: equipment, isLoading } = useQuery<EquipmentDetailData>({
    queryKey: ["/api/equipment/items", itemId],
    queryFn: async () => {
      const res = await fetch(`/api/equipment/items/${itemId}`);
      if (!res.ok) throw new Error("Failed to fetch equipment item");
      return res.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPERATIONAL":
        return "bg-green-100 text-green-800";
      case "MAINTENANCE":
        return "bg-orange-100 text-orange-800";
      case "RETIRED":
        return "bg-gray-100 text-gray-800";
      case "RESERVED":
        return "bg-blue-100 text-blue-800";
      case "DECOMMISSIONED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading equipment details...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!equipment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Equipment not found</CardTitle>
        </CardHeader>
        <CardContent>
          {onBack && (
            <Button onClick={onBack} variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Inventory
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <Button onClick={onBack} variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold">{equipment.name}</h1>
            {equipment.equipmentType && (
              <p className="text-slate-600">{equipment.equipmentType.name}</p>
            )}
          </div>
        </div>
        <Badge className={getStatusColor(equipment.status)}>{getStatusLabel(equipment.status)}</Badge>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {onLogUse && (
          <Button onClick={onLogUse}>
            <FileText className="w-4 h-4 mr-2" />
            Log Use
          </Button>
        )}
        {onScheduleMaintenance && (
          <Button onClick={onScheduleMaintenance} variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Maintenance
          </Button>
        )}
      </div>

      {/* Details Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="history">Use History</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equipment.serialNumber && (
                  <div>
                    <span className="font-medium text-slate-600">Serial Number:</span>
                    <p className="text-lg">{equipment.serialNumber}</p>
                  </div>
                )}
                {(equipment.manufacturer || equipment.model) && (
                  <div>
                    <span className="font-medium text-slate-600">Make/Model:</span>
                    <p className="text-lg">
                      {equipment.manufacturer || ""} {equipment.model || ""}
                    </p>
                  </div>
                )}
                {equipment.purchaseDate && (
                  <div>
                    <span className="font-medium text-slate-600">Purchase Date:</span>
                    <p className="text-lg">{format(new Date(equipment.purchaseDate), "MMM d, yyyy")}</p>
                  </div>
                )}
                {equipment.location && (
                  <div>
                    <span className="font-medium text-slate-600">Location:</span>
                    <p className="text-lg">{equipment.location}</p>
                  </div>
                )}
              </div>
              {equipment.notes && (
                <div className="mt-4">
                  <span className="font-medium text-slate-600">Notes:</span>
                  <p className="mt-2 text-slate-700">{equipment.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wrench className="w-5 h-5" />
                <span>Maintenance Tasks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!equipment.maintenanceTasks || equipment.maintenanceTasks.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No maintenance tasks scheduled
                </div>
              ) : (
                <div className="space-y-4">
                  {equipment.maintenanceTasks.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Scheduled: {format(new Date(task.scheduledDate), "MMM d, yyyy")}</span>
                        <Badge>{task.status}</Badge>
                      </div>
                      {task.completedDate && (
                        <div className="text-sm text-slate-600">
                          Completed: {format(new Date(task.completedDate), "MMM d, yyyy")}
                        </div>
                      )}
                      {task.notes && <p className="text-sm text-slate-700 mt-2">{task.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Use History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!equipment.useLogs || equipment.useLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No use logs recorded</div>
              ) : (
                <div className="space-y-4">
                  {equipment.useLogs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={log.useType === "BEFORE_USE" ? "default" : "secondary"}>
                          {log.useType === "BEFORE_USE" ? "Before Use" : "After Use"}
                        </Badge>
                        <span className="text-sm text-slate-600">
                          {format(new Date(log.logDate), "MMM d, yyyy HH:mm")}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span>
                          <span className="font-medium">Condition:</span> {log.condition}
                        </span>
                        {log.hoursUsed && (
                          <span>
                            <span className="font-medium">Hours:</span> {log.hoursUsed}
                          </span>
                        )}
                        {log.location && (
                          <span>
                            <span className="font-medium">Location:</span> {log.location}
                          </span>
                        )}
                      </div>
                      {log.notes && <p className="text-sm text-slate-700 mt-2">{log.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}



