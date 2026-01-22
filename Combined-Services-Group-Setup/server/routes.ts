import type { Express } from "express";
import { registerSalvageRoutes } from "./routes/salvage-routes";

/**
 * Register all API routes
 */
export function registerRoutes(app: Express): void {
  console.log("📋 Registering API routes...");

  // Register salvage routes
  registerSalvageRoutes(app);
  console.log("✅ Salvage routes registered");

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  console.log("✅ All routes registered");
}
