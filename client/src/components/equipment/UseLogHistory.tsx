import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Clock } from "lucide-react";

interface UseLogHistoryProps {
  itemId?: string;
}

interface UseLog {
  id: string;
  useType: "BEFORE_USE" | "AFTER_USE";
  logDate: string;
  condition: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  defects?: string | null;
  notes?: string | null;
  hoursUsed?: number | null;
  location?: string | null;
  performedBy: string;
}

export default function UseLogHistory({ itemId }: UseLogHistoryProps) {
  const { data: logs, isLoading } = useQuery<UseLog[]>({
    queryKey: ["/api/equipment/use-logs", itemId],
    queryFn: async () => {
      const url = itemId ? `/api/equipment/use-logs?itemId=${itemId}` : "/api/equipment/use-logs";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch use logs");
      return res.json();
    },
  });

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "EXCELLENT":
        return "bg-green-100 text-green-800";
      case "GOOD":
        return "bg-blue-100 text-blue-800";
      case "FAIR":
        return "bg-yellow-100 text-yellow-800";
      case "POOR":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Use History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-500">Loading use history...</div>
        </CardContent>
      </Card>
    );
  }

  const sortedLogs = (logs || []).sort(
    (a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>Use History</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedLogs.length === 0 ? (
          <div className="text-center py-8 text-slate-500">No use logs recorded</div>
        ) : (
          <div className="space-y-4">
            {sortedLogs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant={log.useType === "BEFORE_USE" ? "default" : "secondary"}>
                    {log.useType === "BEFORE_USE" ? "Before Use" : "After Use"}
                  </Badge>
                  <span className="text-sm text-slate-600">
                    {format(new Date(log.logDate), "MMM d, yyyy HH:mm")}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm mb-2">
                  <span>
                    <span className="font-medium">Condition:</span>{" "}
                    <Badge className={getConditionColor(log.condition)}>{log.condition}</Badge>
                  </span>
                  {log.hoursUsed !== null && log.hoursUsed !== undefined && (
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
                {log.defects && (
                  <div className="text-sm mb-2">
                    <span className="font-medium text-red-600">Defects:</span>{" "}
                    <span className="text-slate-700">{log.defects}</span>
                  </div>
                )}
                {log.notes && (
                  <div className="text-sm text-slate-700">
                    <span className="font-medium">Notes:</span> {log.notes}
                  </div>
                )}
                <div className="text-xs text-slate-500 mt-2">Performed by: {log.performedBy}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}



