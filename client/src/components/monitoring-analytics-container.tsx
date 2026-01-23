import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bell,
  Brain,
  CheckCircle2,
  Clock,
  Database,
  Eye,
  Key,
  Link2,
  Loader2,
  RefreshCw,
  Server,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MonitoringData {
  success: boolean;
  data: {
    systemHealth: {
      status: "healthy" | "degraded" | "error";
      uptime: number;
      lastChecked: string;
      services: {
        name: string;
        status: "connected" | "disconnected" | "error" | "dev-mode";
        message?: string;
        lastPing?: string;
      }[];
    };
    apiKeyStatus: {
      name: string;
      configured: boolean;
      preview?: string;
    }[];
    metrics: {
      changesDetected: number;
      pendingChanges: number;
      processedChanges: number;
      errorsToday: number;
      lastSyncTime: string | null;
    };
    recentActivity: {
      id: string;
      type: string;
      description: string;
      timestamp: string;
      status: string;
      metadata?: any;
    }[];
    aiStatus: {
      langchain: {
        enabled: boolean;
        model: string;
        temperature: number;
        maxTokens: number;
        voiceProvider: string;
      };
      langsmith: {
        enabled: boolean;
        tracingEnabled: boolean;
        project: string | null;
      };
      embeddings: {
        enabled: boolean;
        model: string;
      };
    };
    serverInfo: {
      nodeVersion: string;
      environment: string;
      uptime: number;
      memoryUsage: {
        heapUsed: number;
        heapTotal: number;
        rss: number;
      };
    };
  };
}

interface AlertData {
  level: "info" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatBytes(bytes: number): string {
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(0)} MB`;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

function ServiceStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; icon: typeof CheckCircle2 }> = {
    connected: { className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", icon: CheckCircle2 },
    disconnected: { className: "bg-red-500/15 text-red-600 border-red-500/30", icon: AlertCircle },
    error: { className: "bg-red-500/15 text-red-600 border-red-500/30", icon: AlertCircle },
    "dev-mode": { className: "bg-amber-500/15 text-amber-600 border-amber-500/30", icon: AlertTriangle },
  };
  
  const variant = variants[status] || variants.disconnected;
  const Icon = variant.icon;
  
  return (
    <Badge variant="outline" className={cn("font-medium", variant.className)}>
      <Icon className="w-3 h-3 mr-1" />
      {status === "dev-mode" ? "Dev Mode" : status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function ServiceIcon({ name }: { name: string }) {
  const icons: Record<string, typeof Database> = {
    Database: Database,
    LangChain: Brain,
    LangSmith: Eye,
    "Platform Monitor": Activity,
    "OpenAI Voice": Sparkles,
    "Gamma API": Zap,
  };
  
  const Icon = icons[name] || Server;
  return <Icon className="w-5 h-5 text-muted-foreground" />;
}

export default function MonitoringAnalyticsContainer() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch monitoring data
  const { data: monitoringData, isLoading, error, refetch } = useQuery<MonitoringData>({
    queryKey: ["/api/admin/monitoring"],
    queryFn: async () => {
      const response = await fetch("/api/admin/monitoring");
      if (!response.ok) throw new Error("Failed to fetch monitoring data");
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch alerts
  const { data: alertsData } = useQuery<{ success: boolean; alerts: AlertData[] }>({
    queryKey: ["/api/admin/monitoring/alerts"],
    queryFn: async () => {
      const response = await fetch("/api/admin/monitoring/alerts");
      if (!response.ok) throw new Error("Failed to fetch alerts");
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Force check mutation
  const forceCheckMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/admin/monitoring/force-check", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to force check");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/monitoring"] });
      toast({
        title: "Check Complete",
        description: "Platform monitoring check completed successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to run monitoring check",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error || !monitoringData?.success) {
    return (
      <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200">
        <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-sm text-red-600">Failed to load monitoring data</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { systemHealth, apiKeyStatus, metrics, recentActivity, aiStatus, serverInfo } = monitoringData.data;
  const alerts = alertsData?.alerts || [];

  const memoryPercent = (serverInfo.memoryUsage.heapUsed / serverInfo.memoryUsage.heapTotal) * 100;

  return (
    <div className="space-y-6">
      {/* Header with Status Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            systemHealth.status === "healthy" ? "bg-emerald-100 dark:bg-emerald-900/30" :
            systemHealth.status === "degraded" ? "bg-amber-100 dark:bg-amber-900/30" :
            "bg-red-100 dark:bg-red-900/30"
          )}>
            <Activity className={cn(
              "h-5 w-5",
              systemHealth.status === "healthy" ? "text-emerald-600" :
              systemHealth.status === "degraded" ? "text-amber-600" :
              "text-red-600"
            )} />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Backend Operations Monitor</h3>
            <p className="text-sm text-muted-foreground">
              LangChain, LangSmith & System Analytics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(
            "px-3 py-1",
            systemHealth.status === "healthy" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" :
            systemHealth.status === "degraded" ? "bg-amber-500/15 text-amber-600 border-amber-500/30" :
            "bg-red-500/15 text-red-600 border-red-500/30"
          )}>
            {systemHealth.status === "healthy" ? (
              <><CheckCircle2 className="w-3 h-3 mr-1" /> All Systems Operational</>
            ) : systemHealth.status === "degraded" ? (
              <><AlertTriangle className="w-3 h-3 mr-1" /> Some Services in Dev Mode</>
            ) : (
              <><AlertCircle className="w-3 h-3 mr-1" /> System Error</>
            )}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => forceCheckMutation.mutate()}
            disabled={forceCheckMutation.isPending}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", forceCheckMutation.isPending && "animate-spin")} />
            Sync Now
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Services & API Keys */}
        <div className="lg:col-span-2 space-y-6">
          {/* Services Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-4 h-4" />
                Services Status
              </CardTitle>
              <CardDescription>Real-time connection status for all backend services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {systemHealth.services.map((service) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ServiceIcon name={service.name} />
                      <div>
                        <p className="font-medium text-sm">{service.name}</p>
                        {service.message && (
                          <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {service.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <ServiceStatusBadge status={service.status} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Services Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="w-4 h-4" />
                AI Services Configuration
              </CardTitle>
              <CardDescription>LangChain & LangSmith monitoring details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* LangChain */}
              <div className="p-4 rounded-lg border bg-gradient-to-br from-violet-50/50 to-purple-50/50 dark:from-violet-900/10 dark:to-purple-900/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-violet-600" />
                    <span className="font-semibold">LangChain</span>
                  </div>
                  <Badge variant={aiStatus.langchain.enabled ? "default" : "secondary"}>
                    {aiStatus.langchain.enabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Model:</span>
                    <p className="font-medium">{aiStatus.langchain.model}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Temperature:</span>
                    <p className="font-medium">{aiStatus.langchain.temperature}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Tokens:</span>
                    <p className="font-medium">{aiStatus.langchain.maxTokens}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Voice Provider:</span>
                    <p className="font-medium capitalize">{aiStatus.langchain.voiceProvider}</p>
                  </div>
                </div>
              </div>

              {/* LangSmith */}
              <div className="p-4 rounded-lg border bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-900/10 dark:to-cyan-900/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">LangSmith Tracing</span>
                  </div>
                  <Badge variant={aiStatus.langsmith.tracingEnabled ? "default" : "secondary"}>
                    {aiStatus.langsmith.tracingEnabled ? "Tracing Active" : "Tracing Off"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium">{aiStatus.langsmith.enabled ? "Configured" : "Not Configured"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Project:</span>
                    <p className="font-medium">{aiStatus.langsmith.project || "Default"}</p>
                  </div>
                </div>
              </div>

              {/* Embeddings */}
              <div className="p-4 rounded-lg border bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-900/10 dark:to-teal-900/10">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold">Embeddings</span>
                  </div>
                  <Badge variant={aiStatus.embeddings.enabled ? "default" : "secondary"}>
                    {aiStatus.embeddings.enabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Model: </span>
                  <span className="font-medium">{aiStatus.embeddings.model}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Keys Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-4 h-4" />
                API Keys Status
              </CardTitle>
              <CardDescription>Configuration status for external service integrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {apiKeyStatus.map((key) => (
                  <div
                    key={key.name}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      key.configured ? "bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800" : "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {key.configured ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      <span className="text-sm font-medium">{key.name}</span>
                    </div>
                    {key.configured && key.preview && (
                      <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {key.preview}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Metrics, Alerts, Activity */}
        <div className="space-y-6">
          {/* Quick Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Monitoring Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-2xl font-bold text-blue-600">{metrics.changesDetected}</p>
                  <p className="text-xs text-muted-foreground">Changes Detected</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-2xl font-bold text-amber-600">{metrics.pendingChanges}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                  <p className="text-2xl font-bold text-emerald-600">{metrics.processedChanges}</p>
                  <p className="text-xs text-muted-foreground">Processed</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <p className="text-2xl font-bold text-red-600">{metrics.errorsToday}</p>
                  <p className="text-xs text-muted-foreground">Errors</p>
                </div>
              </div>
              {metrics.lastSyncTime && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Last sync: {formatTimestamp(metrics.lastSyncTime)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Server Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-4 h-4" />
                Server Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Environment</span>
                <Badge variant="outline">{serverInfo.environment}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Node.js</span>
                <span className="font-medium">{serverInfo.nodeVersion}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-medium">{formatUptime(serverInfo.uptime)}</span>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Memory Usage</span>
                  <span className="font-medium">
                    {formatBytes(serverInfo.memoryUsage.heapUsed)} / {formatBytes(serverInfo.memoryUsage.heapTotal)}
                  </span>
                </div>
                <Progress value={memoryPercent} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Alerts */}
          {alerts.length > 0 && (
            <Card className="border-amber-200 dark:border-amber-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Active Alerts
                  <Badge variant="destructive" className="ml-auto">{alerts.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {alerts.map((alert, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-2 rounded text-sm",
                          alert.level === "error" ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200" :
                          alert.level === "warning" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200" :
                          "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                        )}
                      >
                        <p className="font-medium">{alert.title}</p>
                        <p className="text-xs opacity-80">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                {recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Activity className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 10).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 text-sm">
                        <div className={cn(
                          "w-2 h-2 mt-1.5 rounded-full flex-shrink-0",
                          activity.status === "processed" ? "bg-emerald-500" :
                          activity.status === "error" ? "bg-red-500" :
                          "bg-amber-500"
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{activity.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="h-5 text-[10px]">
                              {activity.type}
                            </Badge>
                            <span>{formatTimestamp(activity.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
