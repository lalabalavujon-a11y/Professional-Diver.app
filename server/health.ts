import { Router } from "express";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { LangChainConfig } from "./langchain-config";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { Client as LangSmithClient } from "langsmith";

const router = Router();

// Initialize LangSmith client for health checks
const langsmith = new LangSmithClient({
  apiKey: process.env.LANGSMITH_API_KEY || "dev-mode"
});

// Initialize LangChain model for pipeline testing
const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  apiKey: process.env.OPENAI_API_KEY || "dev-mode"
});

router.get("/", async (req, res) => {
  const health = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      db: "unknown",
      ai: "unknown", 
      api: "express-running",
      langchain: "unknown",
      laura: "unknown",
      diverWell: "unknown"
    }
  };

  // Database connectivity check
  // Primary signal: DATABASE_URL presence and format
  const databaseUrl = process.env.DATABASE_URL || '';
  const isPostgres = databaseUrl.startsWith('postgresql://') || databaseUrl.startsWith('postgres://');
  const isSqlite = !isPostgres && (databaseUrl.includes('.sqlite') || databaseUrl.includes('.db') || !databaseUrl);
  
  let dbDriver: string = 'unknown';
  let dbOk: boolean = false;
  
  try {
    // Attempt a trivial query to verify connectivity
    if (typeof (db as any).execute === 'function') {
      // PostgreSQL/Neon - use execute()
      await db.execute(sql`SELECT 1`);
      dbDriver = 'postgres';
      dbOk = true;
    } else {
      // SQLite - use a simple query that works with better-sqlite3
      const sqliteDb = (db as any).sqlite || db;
      if (sqliteDb && typeof sqliteDb.prepare === 'function') {
        sqliteDb.prepare('SELECT 1').get();
        dbDriver = 'sqlite';
        dbOk = true;
      } else {
        // Fallback: try execute with sql template
        await db.execute(sql`SELECT 1`);
        dbDriver = isPostgres ? 'postgres' : 'sqlite';
        dbOk = true;
      }
    }
  } catch (error) {
    dbOk = false;
    // Infer driver from DATABASE_URL if query failed
    if (isPostgres) {
      dbDriver = 'postgres';
    } else if (isSqlite) {
      dbDriver = 'sqlite';
    }
  }
  
  // Report database status
  if (dbOk) {
    health.services.db = `${dbDriver}-connected`;
  } else {
    health.services.db = `${dbDriver}-error`;
  }

  // LangSmith connectivity check
  try {
    if (process.env.LANGSMITH_API_KEY && process.env.LANGSMITH_PROJECT) {
      await langsmith.listProjects();
      health.services.ai = "langsmith-connected";
    } else {
      health.services.ai = "langsmith-dev-mode";
    }
  } catch (error) {
    health.services.ai = `langsmith-error: ${error instanceof Error ? error.message : 'unknown'}`;
  }

  // LangChain pipeline test - deterministic ping/pong
  try {
    if (process.env.OPENAI_API_KEY) {
      // Use a deterministic prompt that should always return "pong"
      const result = await llm.invoke([
        new HumanMessage("Respond with exactly one word: pong")
      ]);
      
      const response = result.content?.toString().toLowerCase().trim();
      if (response === "pong") {
        health.services.langchain = "pipeline-ok";
      } else {
        health.services.langchain = `pipeline-responding: ${response}`;
      }
    } else {
      health.services.langchain = "langchain-dev-mode";
    }
  } catch (error) {
    health.services.langchain = `pipeline-error: ${error instanceof Error ? error.message : 'unknown'}`;
  }

  // Test Laura (Platform) connection
  try {
    if (process.env.OPENAI_API_KEY) {
      const { LauraOracleService } = await import('./laura-oracle-service');
      const laura = LauraOracleService.getInstance();
      const testResult = await laura.chatWithOracle("Test connection", "health-check");
      health.services.laura = testResult.response ? "connected-and-working" : "connected-but-no-response";
    } else {
      health.services.laura = "no-api-key";
    }
  } catch (error) {
    health.services.laura = `error: ${error instanceof Error ? error.message : 'unknown'}`;
  }

  // Test Diver Well (External GPT) connection
  try {
    if (process.env.OPENAI_API_KEY) {
      const DiverWellService = (await import('./diver-well-service')).default;
      const diverWell = DiverWellService.getInstance();
      const testResult = await diverWell.chatWithConsultant("Test connection", "health-check");
      health.services.diverWell = testResult.response ? "connected-and-working" : "connected-but-no-response";
    } else {
      health.services.diverWell = "no-api-key";
    }
  } catch (error) {
    health.services.diverWell = `error: ${error instanceof Error ? error.message : 'unknown'}`;
  }

  // Determine overall status
  const hasErrors = Object.values(health.services).some(service => 
    typeof service === 'string' && service.includes('error')
  );
  
  if (hasErrors) {
    health.status = "degraded";
  }

  res.json(health);
});

export default router;
