import { Router } from "express";
import LangChainConfig from "../langchain-config";
import LangSmithChangeTracker from "../langsmith-change-tracker";
import { ProfessionalDivingVectorStore } from "../vector-store";
import { db } from "../db";
import { documentationChanges } from "@shared/schema-sqlite";
import { count, eq } from "drizzle-orm";

export function registerBackendOpsRoutes(app: any) {
  const router = Router();

  router.get("/", async (req, res) => {
    try {
      const langChainConfig = LangChainConfig.getInstance();
      const langSmithTracker = LangSmithChangeTracker.getInstance();
      const vectorStore = ProfessionalDivingVectorStore.getInstance();

      // Check Environment Variables (masked)
      const hasOpenAI = !!process.env.OPENAI_API_KEY;
      const hasGamma = !!process.env.GAMMA_API_KEY;
      const hasLangSmith = !!process.env.LANGSMITH_API_KEY;
      
      const openAIKeyMasked = hasOpenAI 
        ? `...${process.env.OPENAI_API_KEY?.slice(-4)}` 
        : 'Not Set';
      
      const gammaKeyMasked = hasGamma
        ? `...${process.env.GAMMA_API_KEY?.slice(-4)}`
        : 'Not Set';

      const langSmithKeyMasked = hasLangSmith
        ? `...${process.env.LANGSMITH_API_KEY?.slice(-4)}`
        : 'Not Set';

      // LangChain Stats
      const langChainStats = {
        model: process.env.AI_TUTOR_MODEL || 'gpt-4o',
        temperature: process.env.AI_TUTOR_TEMPERATURE || '0.7',
        voiceProvider: langChainConfig.getVoiceProvider(),
        embeddingModel: process.env.VECTOR_STORE_EMBEDDING_MODEL || 'text-embedding-3-small',
      };

      // LangSmith Stats
      const langSmithStats = {
        enabled: hasLangSmith,
        project: process.env.LANGSMITH_PROJECT || 'Not Set',
        calendarProject: process.env.LANGSMITH_PROJECT_CALENDAR || 'Not Set',
        tracing: process.env.LANGCHAIN_TRACING_V2 === 'true',
        trackerAvailable: langSmithTracker.isAvailable(),
      };

      // Vector Store Stats
      const vsStatus = vectorStore.getVectorStore() ? 'Initialized' : 'Not Initialized';
      
      // Database/Alerts Stats (Mocked count if table empty or query fails)
      let alertsCount = 0;
      let recentChanges = [];
      
      try {
        const changesResult = await db.select({ count: count() }).from(documentationChanges);
        alertsCount = changesResult[0]?.count || 0;
        
        // Get recent 5 changes
        recentChanges = await db.select()
          .from(documentationChanges)
          .orderBy(documentationChanges.detectedAt)
          .limit(5);
      } catch (dbError) {
        console.error("Failed to fetch documentation changes:", dbError);
      }

      const responseData = {
        timestamp: new Date().toISOString(),
        services: {
          openai: {
            status: hasOpenAI ? 'operational' : 'error',
            keyMasked: openAIKeyMasked,
            ...langChainStats
          },
          gamma: {
            status: hasGamma ? 'operational' : 'error',
            keyMasked: gammaKeyMasked,
            templateId: 'g_y8099ohiceag889' // From gamma-api.ts
          },
          langsmith: {
            status: hasLangSmith ? 'operational' : 'warning',
            keyMasked: langSmithKeyMasked,
            ...langSmithStats
          },
          vectorStore: {
            status: vsStatus === 'Initialized' ? 'operational' : 'warning',
            message: vsStatus
          }
        },
        alerts: {
            count: alertsCount,
            recent: recentChanges
        },
        system: {
            nodeEnv: process.env.NODE_ENV,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime()
        }
      };

      res.json(responseData);
    } catch (error) {
      console.error("Error in backend-ops route:", error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Internal Server Error" });
    }
  });

  app.use("/api/admin/backend-ops", router);
}
