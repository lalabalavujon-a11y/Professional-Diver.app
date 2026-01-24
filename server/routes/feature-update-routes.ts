/**
 * Feature Update Log API Routes
 * Tracks all feature deployments, bug fixes, and system updates
 */

import { Router } from "express";
import { db } from "../db";
import { featureUpdateLog, smartBuildProjects, smartBuildFeatures, smartBuildLogs } from "../../shared/schema-sqlite";
import { eq, desc, like, or, sql } from "drizzle-orm";

const router = Router();

// Get all feature updates with optional search and filtering
router.get("/feature-updates", async (req, res) => {
  try {
    const { search, category, status, limit = "50" } = req.query;
    
    let query = db.select().from(featureUpdateLog).orderBy(desc(featureUpdateLog.deployedAt));
    
    // Note: Complex filtering would need to be done in-memory for SQLite
    // For production PostgreSQL, you would use proper SQL WHERE clauses
    
    const updates = await query.limit(parseInt(limit as string));
    
    // Apply filters in memory for SQLite compatibility
    let filtered = updates;
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filtered = filtered.filter(u => 
        u.title.toLowerCase().includes(searchLower) ||
        u.description.toLowerCase().includes(searchLower)
      );
    }
    
    if (category && category !== "all") {
      filtered = filtered.filter(u => u.category === category);
    }
    
    if (status && status !== "all") {
      filtered = filtered.filter(u => u.status === status);
    }
    
    res.json(filtered);
  } catch (error) {
    console.error("Error fetching feature updates:", error);
    res.status(500).json({ error: "Failed to fetch feature updates" });
  }
});

// Create a new feature update log entry
router.post("/feature-updates", async (req, res) => {
  try {
    const {
      title,
      description,
      category = "FEATURE",
      status = "DEPLOYED",
      version,
      commitHash,
      pullRequestUrl,
      affectedComponents = [],
      technicalDetails,
      breakingChanges = false,
    } = req.body;
    
    const [update] = await db.insert(featureUpdateLog).values({
      title,
      description,
      category,
      status,
      version,
      commitHash,
      pullRequestUrl,
      affectedComponents: JSON.stringify(affectedComponents),
      technicalDetails,
      breakingChanges,
      deployedAt: new Date(),
    }).returning();
    
    res.status(201).json(update);
  } catch (error) {
    console.error("Error creating feature update:", error);
    res.status(500).json({ error: "Failed to create feature update" });
  }
});

// Get all Smart Build projects
router.get("/smart-build/projects", async (req, res) => {
  try {
    const projects = await db.select().from(smartBuildProjects).orderBy(desc(smartBuildProjects.createdAt));
    res.json(projects);
  } catch (error) {
    console.error("Error fetching smart build projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Create a new Smart Build project
router.post("/smart-build/projects", async (req, res) => {
  try {
    const {
      name,
      description,
      targetPlatform,
      estimatedCost,
      targetDate,
    } = req.body;
    
    const [project] = await db.insert(smartBuildProjects).values({
      name,
      description,
      targetPlatform,
      currentPhase: "PLANNING",
      overallProgress: 0,
      estimatedCost,
      targetDate: targetDate ? new Date(targetDate) : null,
      startDate: new Date(),
    }).returning();
    
    // Log the project creation
    await db.insert(smartBuildLogs).values({
      projectId: project.id,
      action: "PROJECT_CREATED",
      details: `Created new project: ${name}`,
      metadata: JSON.stringify({ targetPlatform, estimatedCost }),
    });
    
    res.status(201).json(project);
  } catch (error) {
    console.error("Error creating smart build project:", error);
    res.status(500).json({ error: "Failed to create project" });
  }
});

// Get a single project with its features
router.get("/smart-build/projects/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const [project] = await db.select().from(smartBuildProjects).where(eq(smartBuildProjects.id, projectId));
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    const features = await db.select()
      .from(smartBuildFeatures)
      .where(eq(smartBuildFeatures.projectId, projectId))
      .orderBy(smartBuildFeatures.order);
    
    res.json({ ...project, features });
  } catch (error) {
    console.error("Error fetching smart build project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Update a project's phase
router.patch("/smart-build/projects/:projectId/phase", async (req, res) => {
  try {
    const { projectId } = req.params;
    const { phase } = req.body;
    
    const [project] = await db.update(smartBuildProjects)
      .set({ 
        currentPhase: phase,
        updatedAt: new Date(),
        completedDate: phase === "COMPLETE" ? new Date() : null,
      })
      .where(eq(smartBuildProjects.id, projectId))
      .returning();
    
    // Log the phase change
    await db.insert(smartBuildLogs).values({
      projectId,
      action: `PHASE_CHANGED_TO_${phase}`,
      details: `Project phase changed to ${phase}`,
    });
    
    res.json(project);
  } catch (error) {
    console.error("Error updating project phase:", error);
    res.status(500).json({ error: "Failed to update project phase" });
  }
});

// Create a new feature for a project
router.post("/smart-build/projects/:projectId/features", async (req, res) => {
  try {
    const { projectId } = req.params;
    const {
      name,
      description,
      priority = "MEDIUM",
      planDetails,
      estimatedHours,
      costEstimate,
    } = req.body;
    
    // Get max order for the project
    const features = await db.select()
      .from(smartBuildFeatures)
      .where(eq(smartBuildFeatures.projectId, projectId));
    
    const maxOrder = features.length > 0 
      ? Math.max(...features.map(f => f.order)) 
      : 0;
    
    const [feature] = await db.insert(smartBuildFeatures).values({
      projectId,
      name,
      description,
      priority,
      phase: "PLANNING",
      order: maxOrder + 1,
      planDetails,
      estimatedHours,
      costEstimate,
      testCases: "[]",
      testResults: "[]",
      codeChanges: "[]",
    }).returning();
    
    // Log the feature creation
    await db.insert(smartBuildLogs).values({
      projectId,
      featureId: feature.id,
      action: "FEATURE_CREATED",
      details: `Created new feature: ${name}`,
      metadata: JSON.stringify({ priority, estimatedHours }),
    });
    
    res.status(201).json(feature);
  } catch (error) {
    console.error("Error creating smart build feature:", error);
    res.status(500).json({ error: "Failed to create feature" });
  }
});

// Update a feature's phase (with PLAN-EXECUTE-TEST flow)
router.patch("/smart-build/features/:featureId/phase", async (req, res) => {
  try {
    const { featureId } = req.params;
    const { phase, notes, testResults } = req.body;
    
    const updateData: any = {
      phase,
      updatedAt: new Date(),
    };
    
    // Add phase-specific timestamps and data
    switch (phase) {
      case "PLANNING":
        if (notes) updateData.planDetails = notes;
        break;
      case "EXECUTION":
        updateData.executionStartedAt = new Date();
        if (notes) updateData.executionNotes = notes;
        break;
      case "TESTING":
        updateData.executionCompletedAt = new Date();
        updateData.testStartedAt = new Date();
        if (testResults) {
          updateData.testResults = JSON.stringify(testResults);
          const passed = testResults.filter((t: any) => t.passed).length;
          updateData.testPassRate = Math.round((passed / testResults.length) * 100);
        }
        break;
      case "COMPLETE":
        updateData.testCompletedAt = new Date();
        break;
    }
    
    const [feature] = await db.update(smartBuildFeatures)
      .set(updateData)
      .where(eq(smartBuildFeatures.id, featureId))
      .returning();
    
    // Log the phase change
    await db.insert(smartBuildLogs).values({
      projectId: feature.projectId,
      featureId,
      action: `FEATURE_PHASE_${phase}`,
      details: notes || `Feature moved to ${phase} phase`,
    });
    
    // Update project progress
    const allFeatures = await db.select()
      .from(smartBuildFeatures)
      .where(eq(smartBuildFeatures.projectId, feature.projectId));
    
    const completedCount = allFeatures.filter(f => f.phase === "COMPLETE").length;
    const progress = Math.round((completedCount / allFeatures.length) * 100);
    
    await db.update(smartBuildProjects)
      .set({ 
        overallProgress: progress,
        updatedAt: new Date(),
      })
      .where(eq(smartBuildProjects.id, feature.projectId));
    
    res.json(feature);
  } catch (error) {
    console.error("Error updating feature phase:", error);
    res.status(500).json({ error: "Failed to update feature phase" });
  }
});

// Get project activity logs
router.get("/smart-build/projects/:projectId/logs", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const logs = await db.select()
      .from(smartBuildLogs)
      .where(eq(smartBuildLogs.projectId, projectId))
      .orderBy(desc(smartBuildLogs.createdAt))
      .limit(100);
    
    res.json(logs);
  } catch (error) {
    console.error("Error fetching project logs:", error);
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

export default router;
