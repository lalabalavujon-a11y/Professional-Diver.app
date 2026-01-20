/**
 * Calendar Analytics Component
 * Displays calendar usage analytics and insights
 */

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer
} from "recharts";
import { Calendar, TrendingUp, AlertTriangle, CheckCircle, Clock } from "lucide-react";

interface CalendarAnalyticsData {
  eventsBySource: Record<string, number>;
  totalEvents: number;
  syncStatuses: Array<{
    source: string;
    lastSyncAt?: string;
    syncStatus?: string;
    eventsSynced: number;
  }>;
  conflicts: {
    total: number;
    bySeverity: Record<string, number>;
  };
  syncMetrics: {
    successRate: number;
    totalSyncs: number;
    successfulSyncs: number;
  };
  dateRange: {
    start: string;
    end: string;
  };
}

const COLORS = ['#8b5cf6', '#3b82f6', '#dc2626', '#10b981'];

export default function CalendarAnalytics() {
  // Fetch analytics
  const { data: analytics, isLoading } = useQuery<CalendarAnalyticsData>({
    queryKey: ['/api/admin/calendar/analytics'],
    queryFn: async () => {
      const response = await fetch('/api/admin/calendar/analytics');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!analytics) {
    return <p className="text-muted-foreground">No analytics data available</p>;
  }

  // Prepare chart data
  const sourceData = Object.entries(analytics.eventsBySource).map(([source, count]) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value: count,
  }));

  const conflictSeverityData = Object.entries(analytics.conflicts.bySeverity).map(([severity, count]) => ({
    name: severity.charAt(0).toUpperCase() + severity.slice(1),
    value: count,
  }));

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEvents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.syncMetrics.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics.syncMetrics.successfulSyncs} of {analytics.syncMetrics.totalSyncs} syncs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conflicts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.conflicts.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.syncStatuses.filter(s => s.syncStatus === 'success').length}
            </div>
            <p className="text-xs text-muted-foreground">
              of {analytics.syncStatuses.length} sources
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by Source */}
        <Card>
          <CardHeader>
            <CardTitle>Events by Source</CardTitle>
            <CardDescription>Distribution of events across calendar sources</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conflicts by Severity */}
        <Card>
          <CardHeader>
            <CardTitle>Conflicts by Severity</CardTitle>
            <CardDescription>Distribution of conflict severity levels</CardDescription>
          </CardHeader>
          <CardContent>
            {conflictSeverityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={conflictSeverityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#dc2626" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No conflicts in this period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sync Status Details */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Status by Source</CardTitle>
          <CardDescription>Last sync times and status for each calendar source</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.syncStatuses.map((status) => (
              <div key={status.source} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium capitalize">{status.source}</div>
                  <div className="text-sm text-muted-foreground">
                    {status.lastSyncAt
                      ? `Last synced: ${new Date(status.lastSyncAt).toLocaleString()}`
                      : 'Never synced'}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{status.eventsSynced} events</div>
                    <div className="text-xs text-muted-foreground">
                      {status.syncStatus === 'success' && (
                        <span className="text-green-600">Success</span>
                      )}
                      {status.syncStatus === 'failed' && (
                        <span className="text-red-600">Failed</span>
                      )}
                      {status.syncStatus === 'in_progress' && (
                        <span className="text-yellow-600">In Progress</span>
                      )}
                      {!status.syncStatus && (
                        <span className="text-muted-foreground">Unknown</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
