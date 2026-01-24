/**
 * Feature Update Log API Routes
 * Tracks all feature deployments, bug fixes, and system updates
 * 
 * NOTE: These routes use in-memory data for now to avoid database migration issues.
 * The tables will be created when migrations are run.
 */

import { Router } from "express";

const router = Router();

// In-memory storage for feature updates (to avoid database dependency issues)
// This will be replaced with database storage once migrations are applied
const inMemoryFeatureUpdates = [
  {
    id: "1",
    title: "Enterprise Unified Calendar System",
    description: "Complete calendar integration with Google, Outlook, HighLevel, and Calendly for enterprise users with AI monitoring.",
    category: "FEATURE",
    status: "DEPLOYED",
    version: "1.0.3",
    affectedComponents: ["Calendar", "Enterprise Dashboard", "AI Agents"],
    technicalDetails: "Implemented calendar sync with multiple providers, conflict resolution, and LangSmith tracking.",
    breakingChanges: false,
    deployedAt: "2026-01-23T13:50:00Z",
    createdAt: "2026-01-22T10:00:00Z",
  },
  {
    id: "2",
    title: "Auto-Seed Database Feature",
    description: "Automatic database seeding on server startup when production database is empty.",
    category: "FEATURE",
    status: "DEPLOYED",
    version: "1.0.3",
    affectedComponents: ["Server", "Database", "Deployment"],
    technicalDetails: "Created auto-seed.ts that checks for empty database and populates with training tracks and content.",
    breakingChanges: false,
    deployedAt: "2026-01-24T09:10:00Z",
    createdAt: "2026-01-24T09:00:00Z",
  },
  {
    id: "3",
    title: "Cloudflare Cache Purge Workflow Fix",
    description: "Fixed GitHub Actions workflow to use correct CLOUDFLARE_CACHE_PURGE_TOKEN for automatic cache clearing.",
    category: "BUGFIX",
    status: "DEPLOYED",
    version: "1.0.3",
    affectedComponents: ["CI/CD", "Cloudflare", "Deployment"],
    technicalDetails: "Updated workflow to fallback to CLOUDFLARE_CACHE_PURGE_TOKEN when CLOUDFLARE_API_TOKEN lacks permissions.",
    breakingChanges: false,
    deployedAt: "2026-01-24T09:01:00Z",
    createdAt: "2026-01-24T08:50:00Z",
  },
];

const inMemoryProjects = [
  {
    id: "1",
    name: "Professional Diver Training Platform",
    description: "Comprehensive AI-powered diving education platform with training tracks, certifications, and enterprise features.",
    targetPlatform: "web",
    currentPhase: "EXECUTION",
    overallProgress: 75,
    features: [],
  }
];

// Get all feature updates with optional search and filtering
router.get("/feature-updates", async (req, res) => {
  try {
    const { search, category, status } = req.query;
    
    let filtered = [...inMemoryFeatureUpdates];
    
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

// Create a new feature update log entry (in-memory for now)
router.post("/feature-updates", async (req, res) => {
  try {
    const {
      title,
      description,
      category = "FEATURE",
      status = "DEPLOYED",
      version,
      affectedComponents = [],
      technicalDetails,
      breakingChanges = false,
    } = req.body;
    
    const update = {
      id: String(inMemoryFeatureUpdates.length + 1),
      title,
      description,
      category,
      status,
      version,
      affectedComponents,
      technicalDetails,
      breakingChanges,
      deployedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    
    inMemoryFeatureUpdates.unshift(update);
    res.status(201).json(update);
  } catch (error) {
    console.error("Error creating feature update:", error);
    res.status(500).json({ error: "Failed to create feature update" });
  }
});

// Get all Smart Build projects (in-memory for now)
router.get("/smart-build/projects", async (req, res) => {
  try {
    res.json(inMemoryProjects);
  } catch (error) {
    console.error("Error fetching smart build projects:", error);
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Create a new Smart Build project (in-memory for now)
router.post("/smart-build/projects", async (req, res) => {
  try {
    const { name, description, targetPlatform } = req.body;
    
    const project = {
      id: String(inMemoryProjects.length + 1),
      name,
      description,
      targetPlatform,
      currentPhase: "PLANNING",
      overallProgress: 0,
      features: [],
    };
    
    inMemoryProjects.push(project);
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
    const project = inMemoryProjects.find(p => p.id === projectId);
    
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    
    res.json(project);
  } catch (error) {
    console.error("Error fetching smart build project:", error);
    res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Placeholder routes for future database implementation
router.patch("/smart-build/projects/:projectId/phase", async (req, res) => {
  res.json({ message: "Phase updated (in-memory)" });
});

router.post("/smart-build/projects/:projectId/features", async (req, res) => {
  res.status(201).json({ message: "Feature created (in-memory)" });
});

router.patch("/smart-build/features/:featureId/phase", async (req, res) => {
  res.json({ message: "Feature phase updated (in-memory)" });
});

router.get("/smart-build/projects/:projectId/logs", async (req, res) => {
  res.json([]);
});

export default router;
