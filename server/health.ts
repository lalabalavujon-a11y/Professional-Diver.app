import { Router } from "express";
import { db } from "./db";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { Client as LangSmithClient } from "langsmith";
import { sql } from "drizzle-orm";

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
      langchain: "unknown"
    }
  };

  // Database connectivity check
  try {
    await db.execute(sql`SELECT 1`);

    const isProd = process.env.NODE_ENV === "production";
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    health.services.db = isProd && hasDatabaseUrl ? "postgresql-connected" : "sqlite-connected";
  } catch (error) {
    health.services.db = `database-error: ${error instanceof Error ? error.message : 'unknown'}`;
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
