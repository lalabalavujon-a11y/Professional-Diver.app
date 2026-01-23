import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Server, 
  Database, 
  Bot, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Cpu,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface BackendOpsData {
  timestamp: string;
  services: {
    openai: {
      status: string;
      keyMasked: string;
      model: string;
      temperature: string;
      voiceProvider: string;
      embeddingModel: string;
    };
    gamma: {
      status: string;
      keyMasked: string;
      templateId: string;
    };
    langsmith: {
      status: string;
      keyMasked: string;
      enabled: boolean;
      project: string;
      calendarProject: string;
      tracing: boolean;
      trackerAvailable: boolean;
    };
    vectorStore: {
      status: string;
      message: string;
    };
  };
  alerts: {
    count: number;
    recent: any[];
  };
  system: {
    nodeEnv: string;
    uptime: number;
  };
}

export function BackendOpsMonitor() {
  const { data, isLoading, isError, refetch } = useQuery<BackendOpsData>({
    queryKey: ["/api/admin/backend-ops"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <BackendOpsSkeleton />;
  }

  if (isError || !data) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Backend Operations Monitor Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Failed to load backend operations data.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Backend Operations</h2>
          <p className="text-sm text-muted-foreground">Real-time monitoring of AI services and infrastructure</p>
        </div>
        <Button onClick={() => refetch()} variant="ghost" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* OpenAI Card */}
        <ServiceCard 
          title="OpenAI" 
          icon={Bot} 
          status={data.services.openai.status}
          details={[
            { label: "Model", value: data.services.openai.model },
            { label: "Voice", value: data.services.openai.voiceProvider },
            { label: "Key", value: data.services.openai.keyMasked },
          ]}
        />

        {/* Gamma Card */}
        <ServiceCard 
          title="Gamma" 
          icon={Cpu} 
          status={data.services.gamma.status}
          details={[
            { label: "Template", value: data.services.gamma.templateId },
            { label: "Key", value: data.services.gamma.keyMasked },
          ]}
        />

        {/* LangSmith Card */}
        <ServiceCard 
          title="LangSmith" 
          icon={Activity} 
          status={data.services.langsmith.status}
          details={[
            { label: "Project", value: data.services.langsmith.project },
            { label: "Tracing", value: data.services.langsmith.tracing ? "Enabled" : "Disabled" },
            { label: "Key", value: data.services.langsmith.keyMasked },
          ]}
        />

        {/* Vector Store Card */}
        <ServiceCard 
          title="Vector Store" 
          icon={Database} 
          status={data.services.vectorStore.status}
          details={[
            { label: "Status", value: data.services.vectorStore.message },
            { label: "Embedding", value: data.services.openai.embeddingModel },
          ]}
        />
      </div>

      {/* Alerts & System Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning-600" />
              Recent Alerts & Changes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.alerts.recent && data.alerts.recent.length > 0 ? (
              <div className="space-y-2">
                {data.alerts.recent.map((alert: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-2 text-sm border-b pb-2 last:border-0 last:pb-0">
                    <Badge variant="outline" className="mt-0.5 text-xs">{alert.changeType || 'Alert'}</Badge>
                    <div>
                      <p className="font-medium text-slate-700">{alert.description}</p>
                      <p className="text-xs text-muted-foreground">{new Date(alert.detectedAt || alert.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center text-muted-foreground">
                <CheckCircle className="h-8 w-8 mb-2 text-green-500 opacity-50" />
                <p>All systems normal. No active alerts.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Server className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Environment</span>
              <Badge variant="outline">{data.system.nodeEnv || 'Development'}</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-mono">{formatUptime(data.system.uptime)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="text-xs text-right">{new Date(data.timestamp).toLocaleTimeString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ServiceCard({ title, icon: Icon, status, details }: { title: string, icon: any, status: string, details: { label: string, value: string }[] }) {
  const isOperational = status === 'operational';
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {title}
          </CardTitle>
          {isOperational ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          {details.map((detail, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-muted-foreground">{detail.label}</span>
              <span className="font-medium truncate max-w-[120px]" title={detail.value}>{detail.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function BackendOpsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-48 lg:col-span-2" />
        <Skeleton className="h-48" />
      </div>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (parts.length === 0) return "< 1m";
  
  return parts.join(" ");
}
