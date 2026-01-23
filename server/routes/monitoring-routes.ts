import { Router } from "express";
import { db } from "../db";
import { documentationChanges } from "../../shared/schema-sqlite";
import { eq, desc, count, gte } from "drizzle-orm";
import { LangChainConfig } from "../langchain-config";
import { LangSmithChangeTracker } from "../langsmith-change-tracker";
import PlatformChangeMonitor from "../platform-change-monitor";

const router = Router();

/**
 * Monitoring Analytics API Routes
 * Provides backend operations visibility for Super Admin Dashboard
 */

interface SystemHealth {
  status: "healthy" | "degraded" | "error";
  uptime: number;
  lastChecked: string;
  services: {
    name: string;
    status: "connected" | "disconnected" | "error" | "dev-mode";
    message?: string;
    lastPing?: string;
  }[];
}

interface ApiKeyStatus {
  name: string;
  configured: boolean;
  preview?: string;
  lastUsed?: string;
}

interface MonitoringMetrics {
  changesDetected: number;
  pendingChanges: number;
  processedChanges: number;
  errorsToday: number;
  lastSyncTime: string | null;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
  metadata?: any;
}

/**
 * GET /api/admin/monitoring
 * Returns comprehensive monitoring data for Super Admin Dashboard
 */
router.get("/", async (req, res) => {
  try {
    // Get system health status
    const systemHealth = await getSystemHealth();
    
    // Get API key status
    const apiKeyStatus = getApiKeyStatus();
    
    // Get monitoring metrics
    const metrics = await getMonitoringMetrics();
    
    // Get recent activity
    const recentActivity = await getRecentActivity();
    
    // Get LangChain/LangSmith status
    const aiStatus = getAIServicesStatus();

    res.json({
      success: true,
      data: {
        systemHealth,
        apiKeyStatus,
        metrics,
        recentActivity,
        aiStatus,
        serverInfo: {
          nodeVersion: process.version,
          environment: process.env.NODE_ENV || "development",
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
        }
      }
    });
  } catch (error) {
    console.error("Error fetching monitoring data:", error);
    res.status(500).json({ 
      success: false, 
      error: "Failed to fetch monitoring data",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * GET /api/admin/monitoring/health
 * Quick health check endpoint
 */
router.get("/health", async (req, res) => {
  const health = await getSystemHealth();
  res.json(health);
});

/**
 * GET /api/admin/monitoring/alerts
 * Get active alerts and warnings
 */
router.get("/alerts", async (req, res) => {
  try {
    const alerts = await getAlerts();
    res.json({ success: true, alerts });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch alerts" });
  }
});

/**
 * POST /api/admin/monitoring/force-check
 * Force a platform change check
 */
router.post("/force-check", async (req, res) => {
  try {
    const platformMonitor = PlatformChangeMonitor.getInstance();
    await platformMonitor.forceCheck();
    
    const langsmithTracker = LangSmithChangeTracker.getInstance();
    await langsmithTracker.forceCheck();
    
    res.json({ success: true, message: "Force check completed" });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to force check" });
  }
});

/**
 * GET /api/admin/monitoring/langsmith
 * Get LangSmith-specific monitoring data
 */
router.get("/langsmith", async (req, res) => {
  try {
    const langsmithTracker = LangSmithChangeTracker.getInstance();
    const isAvailable = langsmithTracker.isAvailable();
    
    // Get recent LangSmith-related changes
    const aiChanges = await db.select()
      .from(documentationChanges)
      .where(eq(documentationChanges.changeType, "ai"))
      .orderBy(desc(documentationChanges.detectedAt))
      .limit(10);

    res.json({
      success: true,
      data: {
        available: isAvailable,
        tracingEnabled: !!process.env.LANGSMITH_API_KEY && !!process.env.LANGSMITH_PROJECT,
        project: process.env.LANGSMITH_PROJECT || null,
        recentChanges: aiChanges.map(change => ({
          id: change.id,
          description: change.description,
          timestamp: change.detectedAt,
          status: change.status,
          metadata: change.metadata ? JSON.parse(change.metadata as string) : null
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: "Failed to fetch LangSmith data" });
  }
});

// Helper Functions

async function getSystemHealth(): Promise<SystemHealth> {
  const services: SystemHealth["services"] = [];
  
  // Database status
  try {
    await db.select().from(documentationChanges).limit(1);
    services.push({
      name: "Database",
      status: "connected",
      message: process.env.NODE_ENV === "development" ? "SQLite" : "PostgreSQL",
      lastPing: new Date().toISOString()
    });
  } catch {
    services.push({
      name: "Database",
      status: "error",
      message: "Connection failed"
    });
  }

  // LangChain status
  try {
    const langchain = LangChainConfig.getInstance();
    const chatModel = langchain.getChatModel();
    services.push({
      name: "LangChain",
      status: process.env.OPENAI_API_KEY ? "connected" : "dev-mode",
      message: `GPT Model: ${process.env.AI_TUTOR_MODEL || "gpt-4o"}`,
      lastPing: new Date().toISOString()
    });
  } catch {
    services.push({
      name: "LangChain",
      status: "error",
      message: "Initialization failed"
    });
  }

  // LangSmith status
  const langsmithTracker = LangSmithChangeTracker.getInstance();
  services.push({
    name: "LangSmith",
    status: langsmithTracker.isAvailable() ? "connected" : "dev-mode",
    message: langsmithTracker.isAvailable() 
      ? `Project: ${process.env.LANGSMITH_PROJECT || "default"}`
      : "No API key configured",
    lastPing: new Date().toISOString()
  });

  // Platform Monitor status
  const platformMonitor = PlatformChangeMonitor.getInstance();
  services.push({
    name: "Platform Monitor",
    status: "connected",
    message: "Monitoring active",
    lastPing: new Date().toISOString()
  });

  // OpenAI Voice status
  services.push({
    name: "OpenAI Voice",
    status: process.env.OPENAI_API_KEY ? "connected" : "dev-mode",
    message: process.env.OPENAI_API_KEY ? "Available" : "No API key"
  });

  // Gamma API status
  services.push({
    name: "Gamma API",
    status: process.env.GAMMA_API_KEY ? "connected" : "dev-mode",
    message: process.env.GAMMA_API_KEY ? "PDF generation available" : "No API key"
  });

  const hasErrors = services.some(s => s.status === "error");
  const allDevMode = services.every(s => s.status === "dev-mode");

  return {
    status: hasErrors ? "error" : (allDevMode ? "degraded" : "healthy"),
    uptime: process.uptime(),
    lastChecked: new Date().toISOString(),
    services
  };
}

function getApiKeyStatus(): ApiKeyStatus[] {
  const maskKey = (key: string | undefined): string | undefined => {
    if (!key) return undefined;
    if (key.length <= 8) return "***";
    return key.substring(0, 4) + "..." + key.substring(key.length - 4);
  };

  return [
    {
      name: "OpenAI API",
      configured: !!process.env.OPENAI_API_KEY,
      preview: maskKey(process.env.OPENAI_API_KEY)
    },
    {
      name: "Gamma API",
      configured: !!process.env.GAMMA_API_KEY,
      preview: maskKey(process.env.GAMMA_API_KEY)
    },
    {
      name: "LangSmith API",
      configured: !!process.env.LANGSMITH_API_KEY,
      preview: maskKey(process.env.LANGSMITH_API_KEY)
    },
    {
      name: "Gemini API",
      configured: !!process.env.GEMINI_API_KEY,
      preview: maskKey(process.env.GEMINI_API_KEY)
    },
    {
      name: "Stripe Secret",
      configured: !!process.env.STRIPE_SECRET_KEY,
      preview: maskKey(process.env.STRIPE_SECRET_KEY)
    },
    {
      name: "HighLevel API",
      configured: !!process.env.HIGHLEVEL_API_KEY,
      preview: maskKey(process.env.HIGHLEVEL_API_KEY)
    }
  ];
}

async function getMonitoringMetrics(): Promise<MonitoringMetrics> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // Get total changes
    const [totalResult] = await db.select({ count: count() }).from(documentationChanges);
    
    // Get pending changes
    const [pendingResult] = await db.select({ count: count() })
      .from(documentationChanges)
      .where(eq(documentationChanges.status, "pending"));
    
    // Get processed changes
    const [processedResult] = await db.select({ count: count() })
      .from(documentationChanges)
      .where(eq(documentationChanges.status, "processed"));
    
    // Get errors today
    const [errorsResult] = await db.select({ count: count() })
      .from(documentationChanges)
      .where(eq(documentationChanges.status, "error"));
    
    // Get last sync time
    const [lastSync] = await db.select({ detectedAt: documentationChanges.detectedAt })
      .from(documentationChanges)
      .orderBy(desc(documentationChanges.detectedAt))
      .limit(1);

    return {
      changesDetected: totalResult?.count || 0,
      pendingChanges: pendingResult?.count || 0,
      processedChanges: processedResult?.count || 0,
      errorsToday: errorsResult?.count || 0,
      lastSyncTime: lastSync?.detectedAt?.toISOString() || null
    };
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return {
      changesDetected: 0,
      pendingChanges: 0,
      processedChanges: 0,
      errorsToday: 0,
      lastSyncTime: null
    };
  }
}

async function getRecentActivity(): Promise<RecentActivity[]> {
  try {
    const changes = await db.select()
      .from(documentationChanges)
      .orderBy(desc(documentationChanges.detectedAt))
      .limit(20);

    return changes.map(change => ({
      id: change.id?.toString() || "",
      type: change.changeType || "unknown",
      description: change.description || "",
      timestamp: change.detectedAt?.toISOString() || new Date().toISOString(),
      status: change.status || "pending",
      metadata: change.metadata ? JSON.parse(change.metadata as string) : null
    }));
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return [];
  }
}

function getAIServicesStatus() {
  const langchain = LangChainConfig.getInstance();
  
  return {
    langchain: {
      enabled: !!process.env.OPENAI_API_KEY,
      model: process.env.AI_TUTOR_MODEL || "gpt-4o",
      temperature: parseFloat(process.env.AI_TUTOR_TEMPERATURE || "0.7"),
      maxTokens: parseInt(process.env.AI_TUTOR_MAX_TOKENS || "2000"),
      voiceProvider: langchain.getVoiceProvider()
    },
    langsmith: {
      enabled: !!process.env.LANGSMITH_API_KEY,
      tracingEnabled: process.env.LANGCHAIN_TRACING_V2 === "true",
      project: process.env.LANGSMITH_PROJECT || null
    },
    embeddings: {
      enabled: !!process.env.OPENAI_API_KEY,
      model: process.env.VECTOR_STORE_EMBEDDING_MODEL || "text-embedding-3-small"
    }
  };
}

async function getAlerts(): Promise<{
  level: "info" | "warning" | "error";
  title: string;
  message: string;
  timestamp: string;
}[]> {
  const alerts: ReturnType<typeof getAlerts> extends Promise<infer T> ? T : never = [];
  
  // Check for missing API keys
  if (!process.env.OPENAI_API_KEY) {
    alerts.push({
      level: "warning",
      title: "OpenAI API Key Missing",
      message: "AI features may not work properly without OPENAI_API_KEY",
      timestamp: new Date().toISOString()
    });
  }

  if (!process.env.LANGSMITH_API_KEY) {
    alerts.push({
      level: "info",
      title: "LangSmith Not Configured",
      message: "LangSmith tracing is disabled. Configure LANGSMITH_API_KEY for monitoring.",
      timestamp: new Date().toISOString()
    });
  }

  // Check for pending changes
  try {
    const [pendingResult] = await db.select({ count: count() })
      .from(documentationChanges)
      .where(eq(documentationChanges.status, "pending"));
    
    if (pendingResult?.count && pendingResult.count > 10) {
      alerts.push({
        level: "warning",
        title: "Pending Changes Backlog",
        message: `${pendingResult.count} documentation changes are waiting to be processed`,
        timestamp: new Date().toISOString()
      });
    }
  } catch {
    // Ignore db errors for alerts
  }

  // Check memory usage
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
  if (heapUsedMB > 500) {
    alerts.push({
      level: "warning",
      title: "High Memory Usage",
      message: `Heap usage is ${heapUsedMB.toFixed(0)}MB`,
      timestamp: new Date().toISOString()
    });
  }

  return alerts;
}

export default router;
