import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Wrench } from "lucide-react";
import { format } from "date-fns";

interface UpcomingMaintenance {
  upcoming: MaintenanceTask[];
  overdue: MaintenanceTask[];
}

interface MaintenanceTask {
  id: string;
  equipmentItemId: string;
  maintenanceScheduleId: string;
  scheduledDate: string;
  status: string;
  equipmentItem?: {
    id: string;
    name: string;
    serialNumber?: string | null;
    status: string;
  };
}

export default function EquipmentDashboard() {
  const { data: upcomingMaintenance, isLoading } = useQuery<UpcomingMaintenance>({
    queryKey: ["/api/equipment/upcoming-maintenance"],
    queryFn: async () => {
      const res = await fetch("/api/equipment/upcoming-maintenance?days=30");
      if (!res.ok) throw new Error("Failed to fetch upcoming maintenance");
      return res.json();
    },
  });

  const { data: equipmentItems } = useQuery<any[]>({
    queryKey: ["/api/equipment/items"],
    queryFn: async () => {
      const res = await fetch("/api/equipment/items");
      if (!res.ok) throw new Error("Failed to fetch equipment items");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalEquipment = equipmentItems?.length || 0;
  const operationalCount = equipmentItems?.filter((item) => item.status === "OPERATIONAL").length || 0;
  const maintenanceCount = equipmentItems?.filter((item) => item.status === "MAINTENANCE").length || 0;
  const overdueCount = upcomingMaintenance?.overdue?.length || 0;
  const upcomingCount = upcomingMaintenance?.upcoming?.length || 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEquipment}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Operational</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{operationalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">In Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{maintenanceCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Upcoming Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{upcomingCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {overdueCount > 0 && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-900">
                <AlertTriangle className="w-5 h-5" />
                <span>Overdue Maintenance</span>
                <Badge variant="destructive">{overdueCount}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingMaintenance?.overdue?.slice(0, 5).map((task) => (
                  <div key={task.id} className="border-l-4 border-red-500 pl-3 py-2 bg-white rounded">
                    <div className="font-medium">{task.equipmentItem?.name || "Unknown Equipment"}</div>
                    <div className="text-sm text-slate-600">
                      Scheduled: {format(new Date(task.scheduledDate), "MMM d, yyyy")}
                    </div>
                    {task.equipmentItem?.serialNumber && (
                      <div className="text-xs text-slate-500">SN: {task.equipmentItem.serialNumber}</div>
                    )}
                  </div>
                ))}
                {overdueCount > 5 && (
                  <div className="text-sm text-red-700">+{overdueCount - 5} more overdue tasks</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Upcoming Maintenance (Next 30 Days)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingCount === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                <p>No upcoming maintenance tasks</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMaintenance?.upcoming?.slice(0, 10).map((task) => (
                  <div key={task.id} className="border-l-4 border-blue-500 pl-3 py-2">
                    <div className="font-medium">{task.equipmentItem?.name || "Unknown Equipment"}</div>
                    <div className="text-sm text-slate-600">
                      Scheduled: {format(new Date(task.scheduledDate), "MMM d, yyyy")}
                    </div>
                    {task.equipmentItem?.serialNumber && (
                      <div className="text-xs text-slate-500">SN: {task.equipmentItem.serialNumber}</div>
                    )}
                  </div>
                ))}
                {upcomingCount > 10 && (
                  <div className="text-sm text-slate-500">+{upcomingCount - 10} more tasks</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
