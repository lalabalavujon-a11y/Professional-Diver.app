import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageSection } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-states";
import { EmptyState } from "@/components/ui/empty-states";
import { AlertTriangle, CheckCircle2, Clock, RefreshCw } from "lucide-react";

type HealthServiceKey =
  | "db"
  | "ai"
  | "api"
  | "langchain"
  | "laura"
  | "diverWell";

type HealthIntegrationKey = "openai" | "gamma" | "langsmith";

type HealthServices = Partial<Record<HealthServiceKey, string>>;
type HealthIntegrations = Partial<Record<HealthIntegrationKey, "configured" | "missing">>;

interface BackendOpsHealth {
  status: "ok" | "degraded";
  uptime: number;
  timestamp: string;
  services: HealthServices;
  integrations?: HealthIntegrations;
}

type StatusTone = "healthy" | "warning" | "error" | "neutral";

interface AlertItem {
  id: string;
  message: string;
  severity: "warning" | "error";
}

const SERVICE_ENTRIES: Array<{
  key: HealthServiceKey;
  label: string;
  description: string;
}> = [
  {
    key: "langchain",
    label: "LangChain Pipeline",
    description: "LLM pipeline response check",
  },
  {
    key: "ai",
    label: "LangSmith Tracing",
    description: "Tracing + telemetry connectivity",
  },
  {
    key: "db",
    label: "Database",
    description: "Primary datastore health",
  },
  {
    key: "api",
    label: "API Server",
    description: "Express API runtime",
  },
  {
    key: "laura",
    label: "Laura Oracle",
    description: "Platform oracle assistant",
  },
  {
    key: "diverWell",
    label: "Diver Well",
    description: "Ops consultant endpoint",
  },
];

const INTEGRATION_ENTRIES: Array<{
  key: HealthIntegrationKey;
  label: string;
  description: string;
}> = [
  {
    key: "openai",
    label: "OpenAI API Key",
    description: "Required for LangChain + tutors",
  },
  {
    key: "gamma",
    label: "Gamma API Key",
    description: "Bulk PDF generation exports",
  },
  {
    key: "langsmith",
    label: "LangSmith API Key",
    description: "Tracing, datasets, and runs",
  },
];

const TONE_CLASSES: Record<StatusTone, string> = {
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-rose-200 bg-rose-50 text-rose-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

const TONE_LABELS: Record<StatusTone, string> = {
  healthy: "Healthy",
  warning: "Attention",
  error: "Issue",
  neutral: "Unknown",
};

function normalizeStatus(value?: string): string {
  return (value ?? "").toLowerCase();
}

function getStatusTone(value?: string): StatusTone {
  const normalized = normalizeStatus(value);
  if (!normalized) return "neutral";
  if (normalized.includes("error") || normalized.includes("failed")) return "error";
  if (normalized.includes("no-api-key") || normalized.includes("missing")) return "warning";
  if (normalized.includes("dev-mode") || normalized.includes("responding")) return "warning";
  if (
    normalized.includes("ok") ||
    normalized.includes("connected") ||
    normalized.includes("running") ||
    normalized.includes("success")
  ) {
    return "healthy";
  }
  return "neutral";
}

function getIntegrationTone(
  value?: HealthIntegrations[HealthIntegrationKey]
): StatusTone {
  if (value === "configured") return "healthy";
  if (value === "missing") return "warning";
  return "neutral";
}

function formatStatusDetails(value?: string): string {
  if (!value) return "Unknown";
  return value.replace(/_/g, " ").replace(/-/g, " ");
}

function formatIntegrationLabel(
  value?: HealthIntegrations[HealthIntegrationKey]
): string {
  if (value === "configured") return "Configured";
  if (value === "missing") return "Missing";
  return "Unknown";
}

function formatUptime(totalSeconds?: number): string {
  if (typeof totalSeconds !== "number" || Number.isNaN(totalSeconds)) {
    return "Unknown";
  }

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);

  return parts.join(" ");
}

export default function BackendOpsMonitoring() {
  const {
    data: backendHealth,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<BackendOpsHealth>({
    queryKey: ["/api/health"],
    queryFn: async () => {
      const response = await fetch("/api/health");
      if (!response.ok) {
        throw new Error("Failed to fetch backend ops status");
      }
      return response.json();
    },
    staleTime: 30000,
    refetchInterval: 120000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const alerts = useMemo<AlertItem[]>(() => {
    if (!backendHealth) return [];

    const items: AlertItem[] = [];
    if (backendHealth.status === "degraded") {
      items.push({
        id: "health-degraded",
        message: "Overall system health is degraded.",
        severity: "error",
      });
    }

    SERVICE_ENTRIES.forEach((entry) => {
      const status = backendHealth.services?.[entry.key];
      const normalized = normalizeStatus(status);
      if (!normalized) return;

      if (normalized.includes("error") || normalized.includes("failed")) {
        items.push({
          id: `service-${entry.key}-error`,
          message: `${entry.label} reports: ${formatStatusDetails(status)}`,
          severity: "error",
        });
        return;
      }

      if (normalized.includes("no-api-key") || normalized.includes("dev-mode")) {
        items.push({
          id: `service-${entry.key}-warning`,
          message: `${entry.label} running without production keys.`,
          severity: "warning",
        });
      }
    });

    INTEGRATION_ENTRIES.forEach((entry) => {
      const status = backendHealth.integrations?.[entry.key];
      if (status === "missing") {
        items.push({
          id: `integration-${entry.key}-missing`,
          message: `${entry.label} is missing in the server environment.`,
          severity: "warning",
        });
      }
    });

    return items;
  }, [backendHealth]);

  const overallTone: StatusTone =
    backendHealth?.status === "degraded"
      ? "warning"
      : backendHealth?.status === "ok"
      ? "healthy"
      : "neutral";

  const overallStatusLabel =
    backendHealth?.status === "degraded"
      ? "Degraded"
      : backendHealth?.status === "ok"
      ? "Operational"
      : "Unknown";

  const lastCheck = backendHealth?.timestamp
    ? new Date(backendHealth.timestamp).toLocaleString()
    : "Not available";

  return (
    <PageSection
      title="Backend Ops Monitoring"
      description="LangChain + LangSmith health, API key readiness, and alerts."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          aria-busy={isFetching}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      }
    >
      {isLoading ? (
        <LoadingSpinner text="Checking backend operations..." />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Unable to load backend ops"
          description="Try again to refresh system health status."
          action={{
            label: "Retry",
            onClick: () => refetch(),
            loading: isFetching,
          }}
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Status</p>
                  <p className="text-lg font-semibold text-foreground">
                    {overallStatusLabel}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={TONE_CLASSES[overallTone]}
                >
                  {TONE_LABELS[overallTone]}
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Last check: {lastCheck}</span>
                </div>
                <div>Uptime: {formatUptime(backendHealth?.uptime)}</div>
              </div>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Integration Keys</p>
                <p className="text-lg font-semibold text-foreground">
                  Credentials Readiness
                </p>
              </div>
              <div className="space-y-3">
                {INTEGRATION_ENTRIES.map((entry) => {
                  const status = backendHealth?.integrations?.[entry.key];
                  const tone = getIntegrationTone(status);
                  return (
                    <div
                      key={entry.key}
                      className="flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {entry.label}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.description}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={TONE_CLASSES[tone]}
                      >
                        {formatIntegrationLabel(status)}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-border p-4 space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Alerts</p>
                <p className="text-lg font-semibold text-foreground">
                  Ops Monitoring
                </p>
              </div>
              {alerts.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>No active alerts</span>
                </div>
              ) : (
                <ul className="space-y-2">
                  {alerts.map((alert) => (
                    <li
                      key={alert.id}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <AlertTriangle
                        className={`w-4 h-4 mt-0.5 ${
                          alert.severity === "error"
                            ? "text-rose-600"
                            : "text-amber-600"
                        }`}
                      />
                      <span>{alert.message}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {SERVICE_ENTRIES.map((entry) => {
              const status = backendHealth?.services?.[entry.key];
              const tone = getStatusTone(status);
              return (
                <div
                  key={entry.key}
                  className="rounded-lg border border-border p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        {entry.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.description}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={TONE_CLASSES[tone]}
                    >
                      {TONE_LABELS[tone]}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatStatusDetails(status)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </PageSection>
  );
}
