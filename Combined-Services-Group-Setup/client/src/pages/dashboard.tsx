import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Ship, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  DollarSign,
  TrendingUp,
  Plus
} from "lucide-react";
import { getDashboardStats, getWrecks } from "@/lib/api";
import { useLocation } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function Dashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/salvage/stats"],
    queryFn: getDashboardStats,
  });

  const { data: recentWrecks } = useQuery({
    queryKey: ["/api/salvage/wrecks", "?limit=5"],
    queryFn: () => getWrecks(),
  });

  const statusChartData = stats ? [
    { name: "Pending", value: stats.pending, color: "#94a3b8" },
    { name: "In Progress", value: stats.inProgress, color: "#3b82f6" },
    { name: "Completed", value: stats.completed, color: "#10b981" },
    { name: "On Hold", value: stats.onHold, color: "#f59e0b" },
  ] : [];

  if (statsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operations Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of salvage operations in Suva Harbour
          </p>
        </div>
        <Button onClick={() => setLocation("/salvage/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Wreck
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Wrecks</CardTitle>
            <Ship className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total === 34 ? "Target reached" : `${34 - (stats?.total || 0)} remaining`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inProgress || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active operations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total ? `${Math.round((stats.completed / stats.total) * 100)}% complete` : "0% complete"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.averageProgress ? Math.round(stats.averageProgress) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Across all operations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Estimated Value</span>
                <span className="text-lg font-semibold">
                  ${stats?.totalEstimatedValue ? (stats.totalEstimatedValue / 100).toLocaleString() : "0"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Actual Cost</span>
                <span className="text-lg font-semibold">
                  ${stats?.totalActualCost ? (stats.totalActualCost / 100).toLocaleString() : "0"}
                </span>
              </div>
              {stats?.totalEstimatedValue && stats?.totalActualCost && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Net Value</span>
                    <span className={`text-lg font-semibold ${
                      (stats.totalEstimatedValue - stats.totalActualCost) >= 0 
                        ? "text-green-600" 
                        : "text-red-600"
                    }`}>
                      ${((stats.totalEstimatedValue - stats.totalActualCost) / 100).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Wrecks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Wrecks</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setLocation("/salvage")}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentWrecks && recentWrecks.length > 0 ? (
            <div className="space-y-2">
              {recentWrecks.slice(0, 5).map((wreck) => (
                <div
                  key={wreck.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => setLocation(`/salvage/${wreck.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Ship className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{wreck.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {wreck.hullType} • {wreck.progressPercentage}% complete
                      </p>
                    </div>
                  </div>
                  <Badge variant={
                    wreck.status === "completed" ? "success" :
                    wreck.status === "in-progress" ? "info" :
                    wreck.status === "pending" ? "secondary" : "warning"
                  }>
                    {wreck.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No wrecks found. Add your first wreck to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
