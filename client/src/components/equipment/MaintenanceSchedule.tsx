import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface MaintenanceTask {
  id: string;
  equipmentItemId: string;
  scheduledDate: string;
  status: string;
  equipmentItem?: {
    id: string;
    name: string;
    serialNumber?: string | null;
  };
}

interface MaintenanceScheduleProps {
  itemId?: string;
}

export default function MaintenanceSchedule({ itemId }: MaintenanceScheduleProps) {
  const { data: tasks, isLoading } = useQuery<MaintenanceTask[]>({
    queryKey: ["/api/equipment/tasks", itemId],
    queryFn: async () => {
      const url = itemId
        ? `/api/equipment/tasks?itemId=${itemId}`
        : "/api/equipment/tasks?upcoming=true";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch maintenance tasks");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">Loading schedule...</div>
        </CardContent>
      </Card>
    );
  }

  const scheduledTasks = tasks || [];
  const overdueTasks = scheduledTasks.filter(
    (task) =>
      (task.status === "SCHEDULED" || task.status === "IN_PROGRESS") &&
      new Date(task.scheduledDate) < new Date()
  );
  const upcomingTasks = scheduledTasks.filter(
    (task) => new Date(task.scheduledDate) >= new Date()
  );

  return (
    <div className="space-y-6">
      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-900">
              <AlertTriangle className="w-5 h-5" />
              <span>Overdue Maintenance</span>
              <Badge variant="destructive">{overdueTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueTasks.map((task) => (
                <div key={task.id} className="border-l-4 border-red-500 pl-3 py-2 bg-white rounded">
                  <div className="font-medium">{task.equipmentItem?.name || "Unknown Equipment"}</div>
                  <div className="text-sm text-slate-600">
                    Scheduled: {format(new Date(task.scheduledDate), "MMM d, yyyy")}
                  </div>
                  {task.equipmentItem?.serialNumber && (
                    <div className="text-xs text-slate-500">
                      SN: {task.equipmentItem.serialNumber}
                    </div>
                  )}
                  <Badge className="mt-1" variant="destructive">
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Upcoming Maintenance</span>
            {upcomingTasks.length > 0 && <Badge>{upcomingTasks.length}</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingTasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
              <p>No upcoming maintenance tasks</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingTasks
                .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
                .map((task) => (
                  <div key={task.id} className="border-l-4 border-blue-500 pl-3 py-2">
                    <div className="font-medium">{task.equipmentItem?.name || "Unknown Equipment"}</div>
                    <div className="text-sm text-slate-600">
                      Scheduled: {format(new Date(task.scheduledDate), "MMM d, yyyy")}
                    </div>
                    {task.equipmentItem?.serialNumber && (
                      <div className="text-xs text-slate-500">
                        SN: {task.equipmentItem.serialNumber}
                      </div>
                    )}
                    <Badge className="mt-1">{task.status}</Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



