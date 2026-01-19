import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tempStorage } from "./temp-storage";
import { emailMarketing } from "./email-marketing";
import { affiliateService } from "./affiliate-service";
import { crmService } from "./crm-service";
import { crmAdapter } from "./crm-adapter";
import { userLifecycleService } from "./user-lifecycle-service";
import { partnerService } from "./partner-service";
import { userManagement } from "./user-management";
import { gptAccessService } from "./gpt-access-service";
import * as featureService from "./feature-service";
import { getAllFeatures, FEATURE_REGISTRY } from "./feature-registry";
import { resolveUserPermissions } from "./feature-service";
import { handleHighLevelContactWebhook, handleHighLevelTagWebhook } from "./highlevel-webhooks";
import { registerImportRoutes } from "./routes/import-content";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
// import { AILearningPathService } from "./ai-learning-path";
import { z } from "zod";
// LangChain AI Tutor routes are now handled by ai-tutor.ts router
import { insertLessonSchema, insertInviteSchema, insertAttemptSchema, insertWidgetLocationSchema, insertNavigationWaypointSchema, insertNavigationRouteSchema, insertWidgetPreferencesSchema, widgetLocations, navigationWaypoints, navigationRoutes, users, sessions, widgetPreferences, diveTeamMembers, diveOperations, diveOperationContacts, diveOperationPermits, diveTeamRosters, divePlans, dailyProjectReports, casEvacDrills, toolBoxTalks, diveOperationHazards, welfareRecords, shippingInfo, ramsDocuments } from "@shared/schema";
import { insertLessonSchema as insertLessonSchemaSQLite, widgetLocations as widgetLocationsSQLite, navigationWaypoints as navigationWaypointsSQLite, navigationRoutes as navigationRoutesSQLite, users as usersSQLite, sessions as sessionsSQLite, widgetPreferences as widgetPreferencesSQLite, supportTickets, type InsertSupportTicket } from "@shared/schema-sqlite";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes, createHash } from "crypto";
import { nanoid } from "nanoid";
import { db } from "./db";
import { lessons } from "@shared/schema";
import { registerSrsRoutes } from "./srs-routes";
import { registerEquipmentRoutes } from "./routes/equipment-routes";
import { registerOperationsCalendarRoutes } from "./routes/operations-calendar-routes";
import { registerCallingRoutes } from "./routes/calling-routes";
import { registerSponsorRoutes } from "./sponsor-routes";
import { getWeatherData, timezoneToCoordinates as weatherTimezoneToCoordinates } from "./weather-service";
import { getTideData, timezoneToCoordinates as tidesTimezoneToCoordinates, clearTidesCache } from "./tides-service";
import { getPorts, getPortsNearLocation } from "./ports-service";
import { getNoticesToMariners } from "./notices-to-mariners-service";
import { 
  getMedicalFacilities, 
  getUserMedicalFacilities, 
  addUserMedicalFacility, 
  removeUserMedicalFacility,
  MedicalFacilityType 
} from "./medical-facilities-service";
import multer from "multer";
import { registerGeminiLiveVoiceWsRoutes } from "./voice/gemini-live-ws";
import {
  generateAllContent,
  generateTrackContent,
  generatePdf,
  generatePodcast,
  batchGeneratePdfs,
  regenerateTrackPdfs,
  getGenerationHistory,
  validateLessonContent,
  getReviewQueue,
} from "./api/content-generation";
import { registerOpenAIVoiceWsRoutes } from "./voice/openai-live-ws";

// In-memory store for user profile data (for demo purposes)
const userProfileStore = new Map<string, any>();

// In-memory stores for passwords and 2FA
const passwordStore = new Map<string, string>();
const twoFactorStore = new Map<string, { secret: string; enabled: boolean }>();

// Helper function to generate Gravatar URL
function getGravatarUrl(email: string, size: number = 200): string {
  const normalizedEmail = email.trim().toLowerCase();
  const hash = createHash('md5').update(normalizedEmail).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=mp`;
}

// Helper function to get profile picture URL (handles Gravatar)
function getProfilePictureUrl(profilePictureUrl: string | null | undefined, email: string): string | null {
  if (!profilePictureUrl) return null;
  if (profilePictureUrl === 'gravatar') {
    return getGravatarUrl(email);
  }
  return profilePictureUrl;
}

/**
 * Sanitize a lesson title for use in filenames
 * Converts to lowercase, replaces spaces with hyphens, removes special characters
 * Limits length to 100 characters
 * Handles edge cases: empty strings, special characters only, very long titles, Unicode
 */
function sanitizeFilename(title: string): string {
  // Handle null, undefined, empty, or non-string values
  if (!title || typeof title !== 'string' || !title.trim()) {
    return 'lesson';
  }
  
  // Convert to lowercase and trim
  let sanitized = title.toLowerCase().trim();
  
  // Handle very long titles early to improve performance
  if (sanitized.length > 150) {
    sanitized = sanitized.substring(0, 150);
  }
  
  // Replace spaces, underscores, and other whitespace with hyphens
  sanitized = sanitized.replace(/[\s_]+/g, '-');
  
  // Remove special characters, keep only alphanumeric and hyphens
  // This also handles Unicode characters by removing them
  sanitized = sanitized.replace(/[^a-z0-9-]/g, '');
  
  // Replace multiple consecutive hyphens with a single hyphen
  sanitized = sanitized.replace(/-+/g, '-');
  
  // Remove leading and trailing hyphens
  sanitized = sanitized.replace(/^-+|-+$/g, '');
  
  // Limit length to 100 characters (after sanitization)
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
    // Ensure we don't end with a hyphen after truncation
    sanitized = sanitized.replace(/-+$/, '');
  }
  
  // If empty after sanitization (e.g., title was only special characters), use fallback
  if (!sanitized) {
    return 'lesson';
  }
  
  return sanitized;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // DEBUG: Verify userManagement is initialized correctly
  console.log('[Server Startup] 🔍 Verifying SUPER_ADMIN users are initialized...');
  const superAdmin1 = userManagement.getSpecialUser('lalabalavu.jon@gmail.com');
  const superAdmin2 = userManagement.getSpecialUser('sephdee@hotmail.com');
  console.log('[Server Startup] Super Admin 1:', superAdmin1 ? `✅ Found (${superAdmin1.role})` : '❌ NOT FOUND');
  console.log('[Server Startup] Super Admin 2:', superAdmin2 ? `✅ Found (${superAdmin2.role})` : '❌ NOT FOUND');
  
  if (!superAdmin1 || !superAdmin2) {
    console.error('[Server Startup] ⚠️ WARNING: SUPER_ADMIN users not properly initialized!');
  }

  // SRS (Phase 2–4) routes
  registerSrsRoutes(app);
  
  // Equipment Maintenance routes
  registerEquipmentRoutes(app);
  
  // Operations Calendar routes
  console.log("📅 About to register Operations Calendar routes...");
  registerOperationsCalendarRoutes(app);
  console.log("📅 Operations Calendar routes registration completed");

  // Calling routes
  registerCallingRoutes(app);

  // Sponsor routes
  registerSponsorRoutes(app);

  // Serve uploaded files statically with CORS headers for PDF files
  const path = await import('path');
  const express = await import('express');
  const fs = await import('fs');
  
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  
  // Custom route for diver-well-training PDFs with clean URLs
  app.get('/diver-well-training/:lessonName', async (req, res) => {
    try {
      const { lessonName } = req.params;
      const sanitized = sanitizeFilename(lessonName);
      const filePath = path.join(process.cwd(), 'uploads', 'diver-well-training', `${sanitized}.pdf`);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'PDF not found' });
      }
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${sanitized}.pdf"`);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(filePath);
    } catch (error) {
      console.error('Error serving PDF:', error);
      res.status(500).json({ error: 'Failed to serve PDF' });
    }
  });
  
  // Custom static file handler with CORS headers for PDF files
  app.use('/uploads', (req, res, next) => {
    // Set CORS headers for PDF files
    if (req.path.endsWith('.pdf')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Content-Type', 'application/pdf');
    }
    // Set proper content type for audio files
    if (req.path.match(/\.(m4a|mp3|mp4a)$/i)) {
      res.setHeader('Content-Type', 'audio/mp4');
    }
    next();
  }, express.default.static(uploadsDir));

  // Object storage routes
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Local development upload endpoint with proper file handling
  // IMPORTANT: This route must be registered BEFORE express.json() middleware
  // or we need to skip body parsing for this route
  app.post("/api/objects/upload-local/:objectId", async (req, res) => {
    console.log("Upload route hit:", req.params.objectId);
    try {
      const { objectId } = req.params;
      
      // Extract lesson ID from objectId pattern: lesson-{id}-{type}-{timestamp}
      const lessonIdMatch = objectId.match(/^lesson-([^-]+)-/);
      const lessonId = lessonIdMatch ? lessonIdMatch[1] : null;
      const fileTypeMatch = objectId.match(/-(podcast|pdf)-/);
      const fileType = fileTypeMatch ? fileTypeMatch[1] : null;
      
      // Determine file extension from objectId or will get from file
      const determineExtension = (fileType: string | null, originalExt: string): string => {
        if (fileType === 'pdf') return '.pdf';
        if (fileType === 'podcast') {
          const ext = originalExt.toLowerCase();
          if (['.m4a', '.mp4a'].includes(ext)) return '.m4a';
          return ext || '.m4a';
        }
        return originalExt || '';
      };
      
      // Configure multer for file uploads - use temporary filename first
      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          // Use temporary filename - will rename after fetching lesson title
          const tempId = nanoid(12);
          const ext = determineExtension(fileType, path.extname(file.originalname));
          cb(null, `temp-${tempId}${ext}`);
        }
      });
      
      const upload = multer({ 
        storage,
        limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit (applies to all files)
        fileFilter: (req, file, cb) => {
          // Get file extension
          const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
          
          // Define allowed extensions
          const allowedExtensions = ['jpeg', 'jpg', 'png', 'gif', 'pdf', 'mp3', 'mp4', 'wav', 'm4a', 'webm', 'ogg', 'aac', 'mp4a'];
          
          // Define allowed MIME types (including variants for M4A and PDF)
          const allowedMimeTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'application/pdf', 'application/x-pdf', 'application/octet-stream', // PDF variants
            'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4', 'audio/x-m4a', 
            'audio/ogg', 'audio/aac', 'audio/webm', 'audio/x-mpeg', 'audio/x-mp3',
            'video/mp4', 'video/webm'
          ];
          
          // Check if extension is allowed
          const extAllowed = allowedExtensions.includes(ext);
          
          if (!extAllowed) {
            return cb(new Error(`Invalid file extension: ${ext || 'none'}. Allowed: images, PDFs, audio (MP3, WAV, M4A/MP4a, OGG, AAC), and video files.`));
          }
          
          // Special handling for M4A/MP4a files - they can have various MIME types
          if (ext === 'm4a' || ext === 'mp4a') {
            // Accept M4A files with any audio MIME type or audio/mp4 or unknown
            if (!file.mimetype || file.mimetype.startsWith('audio/') || file.mimetype === 'audio/mp4' || file.mimetype === 'application/octet-stream') {
              return cb(null, true);
            }
          }
          
          // Special handling for PDF files - they can have various MIME types
          if (ext === 'pdf') {
            // Accept PDF files with PDF MIME types or application/octet-stream or unknown
            if (!file.mimetype || file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf' || 
                file.mimetype === 'application/octet-stream') {
              return cb(null, true);
            }
          }
          
          // Check if MIME type is allowed
          const mimeAllowed = allowedMimeTypes.includes(file.mimetype) || 
                            (ext === 'mp4' && (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')));
          
          // Accept if MIME type is allowed OR if it's a known extension with a generic/unknown MIME type
          if (mimeAllowed || !file.mimetype || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
            return cb(null, true);
          } else {
            cb(new Error(`Invalid file type: ${file.mimetype || 'unknown'} (${ext || 'no extension'}). Allowed: images, PDFs, audio (MP3, WAV, M4A/MP4a, OGG, AAC), and video files.`));
          }
        }
      }).single('file');
      
      // Use multer's callback-based API properly
      upload(req, res, async (err) => {
        if (err) {
          console.error("Upload error:", err);
          console.error("Request details:", {
            method: req.method,
            url: req.url,
            headers: {
              'content-type': req.headers['content-type'],
              'content-length': req.headers['content-length']
            },
            fileDetails: req.file ? {
              originalname: req.file.originalname,
              mimetype: req.file.mimetype,
              size: req.file.size,
              fieldname: req.file.fieldname
            } : 'No file in request'
          });
          
          // Provide more helpful error messages
          let errorMessage = err.message;
          if (err.message.includes('File too large') || err.message.includes('LIMIT_FILE_SIZE')) {
            errorMessage = 'File size exceeds the 100MB limit. Please upload a smaller file.';
          } else if (err.message.includes('Invalid file type') || err.message.includes('Invalid file extension')) {
            errorMessage = err.message;
          } else if (err.message.includes('Unexpected field')) {
            errorMessage = 'Invalid form field. Please ensure the file is uploaded with the field name "file".';
          }
          
          return res.status(400).json({ 
            error: errorMessage,
            details: {
              originalname: req.file?.originalname,
              mimetype: req.file?.mimetype,
              size: req.file?.size
            }
          });
        }
        
        if (!req.file) {
          console.error("No file in request after multer processing");
          console.error("Request body:", req.body);
          console.error("Request files:", (req as any).files);
          return res.status(400).json({ 
            error: 'No file uploaded. Please ensure you are sending a file with the field name "file".',
            receivedFields: Object.keys(req.body || {})
          });
        }
        
        // Process the file asynchronously: fetch lesson title, rename file, delete old files
        try {
          let lessonTitle: string | null = null;
          let oldFileUrl: string | null = null;
          
          // Try to get lesson title from request body (multer preserves text fields in req.body for multipart/form-data)
          if (req.body && typeof req.body.lessonTitle === 'string' && req.body.lessonTitle.trim()) {
            lessonTitle = req.body.lessonTitle.trim();
            console.log('Lesson title from request body:', lessonTitle);
          }
            
            // If not provided and we have lesson ID, fetch from database
            if (!lessonTitle && lessonId) {
              try {
                const [lesson] = await db.select({
                  title: lessons.title,
                  pdfUrl: lessons.pdfUrl,
                  podcastUrl: lessons.podcastUrl,
                })
                .from(lessons)
                .where(eq(lessons.id, lessonId))
                .limit(1);
                
                if (lesson) {
                  lessonTitle = lesson.title;
                  // Get old file URL for deletion
                  if (fileType === 'pdf' && lesson.pdfUrl) {
                    oldFileUrl = lesson.pdfUrl;
                  } else if (fileType === 'podcast' && lesson.podcastUrl) {
                    oldFileUrl = lesson.podcastUrl;
                  }
                  console.log('Lesson title fetched from database:', lessonTitle);
                }
              } catch (dbError) {
                console.error('Error fetching lesson from database:', dbError);
                // Continue with fallback title
              }
            }
            
          // Sanitize lesson title for filename
          const sanitizedTitle = sanitizeFilename(lessonTitle || 'lesson');
          
          // Determine file extension
          const fileExt = determineExtension(fileType, path.extname(req.file.originalname));
          const extForFilename = fileExt || (fileType === 'pdf' ? '.pdf' : '.m4a');
          
          // Generate custom filename
          const uniqueId = nanoid(6);
          const customFilename = `${sanitizedTitle}-professional-diver-app_diver-well-training-${uniqueId}${extForFilename}`;
          const tempFilePath = path.join(uploadsDir, req.file.filename);
          const newFilePath = path.join(uploadsDir, customFilename);
          
          // Rename the temporary file to the custom filename
          try {
            await fs.promises.rename(tempFilePath, newFilePath);
            console.log('File renamed from', req.file.filename, 'to', customFilename);
          } catch (renameError: any) {
            console.error('Error renaming file:', renameError);
            // If rename fails, try copying and then deleting
            try {
              await fs.promises.copyFile(tempFilePath, newFilePath);
              await fs.promises.unlink(tempFilePath);
              console.log('File copied and temp file deleted');
            } catch (copyError) {
              console.error('Error copying file:', copyError);
              throw new Error('Failed to save file with custom filename');
            }
          }
          
          // Delete old file if it exists
          if (oldFileUrl) {
            try {
              // Extract filename from URL (remove /uploads/ prefix)
              const oldFilename = oldFileUrl.replace(/^\/uploads\//, '');
              const oldFilePath = path.join(uploadsDir, oldFilename);
              
              // Check if file exists before deleting
              try {
                await fs.promises.access(oldFilePath);
                await fs.promises.unlink(oldFilePath);
                console.log('Old file deleted:', oldFilename);
              } catch (accessError) {
                console.log('Old file not found, skipping deletion:', oldFilename);
              }
            } catch (deleteError: any) {
              // Log error but don't fail the upload
              console.warn('Warning: Failed to delete old file:', deleteError.message);
            }
          }
          
          const fileUrl = `/uploads/${customFilename}`;
          
          res.json({
            success: true,
            objectId,
            filename: customFilename,
            originalName: req.file.originalname,
            path: fileUrl,
            url: fileUrl,
            size: req.file.size,
            mimetype: req.file.mimetype
          });
        } catch (processError: any) {
          console.error("Error processing uploaded file:", processError);
          // Clean up temp file if it still exists
          try {
            const tempFilePath = path.join(uploadsDir, req.file.filename);
            try {
              await fs.promises.access(tempFilePath);
              await fs.promises.unlink(tempFilePath);
            } catch (accessError) {
              // File doesn't exist, nothing to clean up
            }
          } catch (cleanupError) {
            console.error('Error cleaning up temp file:', cleanupError);
          }
          
          res.status(500).json({
            error: "Failed to process uploaded file",
            message: processError.message || "Unknown error"
          });
        }
      });
    } catch (error: any) {
      console.error("Error in local upload setup:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({ 
        error: "Failed to handle local upload",
        message: error.message || "Unknown error",
        details: error.stack
      });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Auth routes
  app.get("/api/auth/session", async (req, res) => {
    try {
      // This would be handled by Auth.js in a real implementation
      // For now, return mock session or null
      res.json({ user: null });
    } catch (error) {
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // ============================================================================
  // AUTHENTICATION - SUPER ADMIN CREDENTIALS
  // ============================================================================
  // IMPORTANT: DO NOT CHANGE THESE CREDENTIALS - THEY ARE PERMANENT
  // 
  // Super Admin Account:
  //   Email: lalabalavu.jon@gmail.com
  //   Password: Admin123
  //   Role: SUPER_ADMIN
  //   Name: Jon Lalabalavu
  //
  // Secondary Super Admin Account:
  //   Email: sephdee@hotmail.com
  //   Password: Admin123
  //   Role: SUPER_ADMIN
  //   Name: Jon Lalabalavu
  //
  // These credentials are hardcoded and will NOT change with code updates.
  // ============================================================================
  
  // Enhanced authentication route for credentials
  app.post("/api/auth/credentials", async (req, res) => {
    try {
      // Log raw request body for debugging
      console.log('[AUTH] Raw request body:', JSON.stringify(req.body));
      console.log('[AUTH] Content-Type:', req.headers['content-type']);
      
      const { email, password, rememberMe } = req.body as { email: string; password: string; rememberMe?: boolean };

      if (!email || !password) {
        console.error('[AUTH] Missing email or password');
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Normalize email (lowercase, trim)
      const normalizedEmail = (email || '').toLowerCase().trim();
      const normalizedPassword = password || '';

      console.log(`[AUTH] Login attempt - Email: "${normalizedEmail}", Password length: ${normalizedPassword.length}`);

      // Demo authentication - check against known accounts
      if (normalizedEmail === 'admin@diverwell.app' && normalizedPassword === 'admin123') {
        res.json({ 
          success: true, 
          user: {
            id: 'admin-1',
            name: 'Admin User',
            email: 'admin@diverwell.app',
            role: 'ADMIN',
            subscriptionType: 'LIFETIME'
          },
          rememberMe 
        });
        return;
      }

      // SUPER ADMIN CREDENTIALS - DO NOT CHANGE
      // Jon Lalabalavu - Super Admin
      // Email: lalabalavu.jon@gmail.com
      // Password: Admin123
      // Role: SUPER_ADMIN
      const superAdminCredentials: Record<string, string> = {
        'lalabalavu.jon@gmail.com': 'Admin123',
        'sephdee@hotmail.com': 'Admin123', // Secondary super admin account
      };

      const expectedPassword = superAdminCredentials[normalizedEmail];
      if (expectedPassword && normalizedPassword === expectedPassword) {
        console.log(`[AUTH] ✅ SUPER_ADMIN login successful for: ${normalizedEmail}`);
        res.json({ 
          success: true, 
          user: {
            id: normalizedEmail === 'sephdee@hotmail.com' ? 'super-admin-2' : 'super-admin-1',
            name: normalizedEmail === 'lalabalavu.jon@gmail.com' ? 'Jon Lalabalavu' : 'Jon Lalabalavu',
            email: normalizedEmail,
            role: 'SUPER_ADMIN',
            subscriptionType: 'LIFETIME'
          },
          rememberMe 
        });
        return;
      } else if (expectedPassword) {
        console.log(`[AUTH] ❌ Password mismatch for ${normalizedEmail}. Expected: "${expectedPassword}", Got: "${normalizedPassword}"`);
      }

      // Check for lifetime users with their specific passwords
      const lifetimeUserCredentials: Record<string, string> = {
        'eroni2519@gmail.com': 'lifetime123',
        'jone.cirikidaveta@gmail.com': 'lifetime123',
        'jone7898@gmail.com': 'lifetime123',
        'samueltabuya35@gmail.com': 'lifetime123',
        'jone.viti@gmail.com': 'lifetime123',
      };
      
      if (lifetimeUserCredentials[normalizedEmail] && normalizedPassword === lifetimeUserCredentials[normalizedEmail]) {
        res.json({ 
          success: true, 
          user: {
            id: 'lifetime-user',
            name: 'Lifetime Member',
            email: normalizedEmail,
            role: 'USER',
            subscriptionType: 'LIFETIME'
          },
          rememberMe 
        });
        return;
      }

      // Demo trial user
      if (normalizedPassword === 'trial123') {
        res.json({ 
          success: true, 
          user: {
            id: 'trial-user',
            name: 'Trial User',
            email: normalizedEmail,
            role: 'USER',
            subscriptionType: 'TRIAL',
            trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          rememberMe 
        });
        return;
      }

      console.log(`[AUTH] ❌ Invalid credentials for: ${normalizedEmail}`);
      res.status(401).json({ error: "Invalid credentials" });
    } catch (error: any) {
      console.error("Authentication error:", error);
      console.error("Error stack:", error?.stack);
      console.error("Request body:", req.body);
      res.status(500).json({ error: "Authentication failed", details: error?.message || "Unknown error" });
    }
  });

  // Password Change Endpoint
  app.post("/api/auth/change-password", async (req, res) => {
    try {
      const { email, currentPassword, newPassword } = req.body;

      if (!email || !currentPassword || !newPassword) {
        return res.status(400).json({ error: "Email, current password, and new password are required" });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      }

      const normalizedEmail = (email || '').toLowerCase().trim();

      // Check against super admin credentials first
      const superAdminCredentials: Record<string, string> = {
        'lalabalavu.jon@gmail.com': 'Admin123',
        'sephdee@hotmail.com': 'Admin123',
      };

      const storedPassword = passwordStore.get(normalizedEmail) || superAdminCredentials[normalizedEmail];

      if (!storedPassword || storedPassword !== currentPassword) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }

      // Update password in store
      passwordStore.set(normalizedEmail, newPassword);

      // Update super admin credentials if it's a super admin
      if (superAdminCredentials[normalizedEmail]) {
        superAdminCredentials[normalizedEmail] = newPassword;
      }

      res.json({ success: true, message: "Password changed successfully" });
    } catch (error: any) {
      console.error("Password change error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  // 2FA Setup - Generate secret and QR code
  app.post("/api/auth/2fa/setup", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const normalizedEmail = (email || '').toLowerCase().trim();
      
      // Generate a random secret (base32 encoded, 32 characters)
      // TOTP secrets are typically base32 encoded
      const secretBytes = randomBytes(20);
      // Convert to base32 manually (RFC 4648 base32 alphabet: A-Z, 2-7)
      const base32Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
      let secret = '';
      for (let i = 0; i < 32; i++) {
        const byteIndex = i % secretBytes.length;
        const charIndex = secretBytes[byteIndex] % base32Alphabet.length;
        secret += base32Alphabet[charIndex];
      }

      // Store secret (not enabled yet)
      twoFactorStore.set(normalizedEmail, { secret, enabled: false });

      // Generate QR code data URL
      // For now, return the secret and manual entry URL
      // The frontend can use a QR code library to generate the QR code
      const issuer = 'Professional Diver Training';
      const accountName = normalizedEmail;
      const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

      // Generate a simple QR code data URL using a placeholder
      // In production, you'd use a QR code library like 'qrcode'
      const qrCodeDataUrl = `data:image/svg+xml;base64,${Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
          <rect width="200" height="200" fill="white"/>
          <text x="100" y="100" text-anchor="middle" font-family="monospace" font-size="10">QR Code</text>
          <text x="100" y="120" text-anchor="middle" font-family="monospace" font-size="8">Use authenticator app</text>
          <text x="100" y="135" text-anchor="middle" font-family="monospace" font-size="8">with secret below</text>
        </svg>`
      ).toString('base64')}`;

      res.json({
        secret,
        qrCode: qrCodeDataUrl,
        otpAuthUrl,
      });
    } catch (error: any) {
      console.error("2FA setup error:", error);
      res.status(500).json({ error: "Failed to setup 2FA" });
    }
  });

  // 2FA Verify - Verify token and enable 2FA
  app.post("/api/auth/2fa/verify", async (req, res) => {
    try {
      const { email, token, secret } = req.body;

      if (!email || !token || !secret) {
        return res.status(400).json({ error: "Email, token, and secret are required" });
      }

      const normalizedEmail = (email || '').toLowerCase().trim();

      // Verify token (simple TOTP implementation)
      // In production, use a proper TOTP library like 'otplib'
      const stored2FA = twoFactorStore.get(normalizedEmail);
      if (!stored2FA || stored2FA.secret !== secret) {
        return res.status(400).json({ error: "Invalid 2FA secret" });
      }

      // For now, accept any 6-digit token for demo purposes
      // In production, implement proper TOTP verification
      const tokenStr = token.toString().replace(/\D/g, '');
      if (tokenStr.length !== 6) {
        return res.status(400).json({ error: "Token must be 6 digits" });
      }

      // Enable 2FA
      twoFactorStore.set(normalizedEmail, { secret, enabled: true });

      res.json({ success: true, message: "2FA enabled successfully" });
    } catch (error: any) {
      console.error("2FA verify error:", error);
      res.status(500).json({ error: "Failed to verify 2FA" });
    }
  });

  // 2FA Status - Check if 2FA is enabled
  app.get("/api/auth/2fa/status", async (req, res) => {
    try {
      const email = req.query.email as string;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const normalizedEmail = (email || '').toLowerCase().trim();
      const twoFactorData = twoFactorStore.get(normalizedEmail);

      res.json({
        enabled: twoFactorData?.enabled || false,
        hasSecret: !!twoFactorData?.secret,
      });
    } catch (error: any) {
      console.error("2FA status error:", error);
      res.status(500).json({ error: "Failed to get 2FA status" });
    }
  });

  // AI Learning Path Routes
  app.post("/api/learning-path/suggestions", async (req, res) => {
    try {
      const { userId, skillLevel, goals, timeAvailable, preferredLearningStyle, certificationGoals } = req.body;

      const userProgress = {
        userId: userId || 'demo-user',
        completedLessons: [],
        skillLevel: skillLevel || 'intermediate',
        goals: goals || ['certification'],
        weakAreas: ['gas management'],
        strengths: ['safety protocols'],
        timeAvailable: timeAvailable || 10,
        preferredLearningStyle: preferredLearningStyle || 'mixed',
        certificationGoals: certificationGoals || ['NDT Inspector']
      };

      // const suggestion = await aiLearningPathService.generateLearningPath(userProgress);
      res.json({ message: "AI learning path service temporarily disabled" });
    } catch (error) {
      console.error('Error generating learning path suggestions:', error);
      res.status(500).json({ error: "Failed to generate learning path suggestions" });
    }
  });

  app.post("/api/learning-path/analysis", async (req, res) => {
    try {
      const { completedLessons, quizScores } = req.body;
      
      // const analysis = await aiLearningPathService.analyzeLearningStyle(
      //   completedLessons || [],
      //   quizScores || [85, 92, 78, 95]
      // );
      
      res.json({ message: "AI learning style analysis temporarily disabled" });
    } catch (error) {
      console.error('Error analyzing learning style:', error);
      res.status(500).json({ error: "Failed to analyze learning style" });
    }
  });

  app.post("/api/learning-path/career-advice", async (req, res) => {
    try {
      const { userId, skillLevel, goals, certificationGoals } = req.body;

      const userProgress = {
        userId: userId || 'demo-user',
        completedLessons: [],
        skillLevel: skillLevel || 'intermediate',
        goals: goals || ['certification'],
        weakAreas: [],
        strengths: [],
        timeAvailable: 10,
        preferredLearningStyle: 'mixed',
        certificationGoals: certificationGoals || ['NDT Inspector']
      };

      // const advice = await aiLearningPathService.generateCareerAdvice(userProgress);
      res.json({ message: "AI career advice service temporarily disabled" });
    } catch (error) {
      console.error('Error generating career advice:', error);
      res.status(500).json({ error: "Failed to generate career advice" });
    }
  });

  // Tracks routes
  app.get("/api/tracks", async (req, res) => {
    try {
      // Check if admin wants all tracks (including unpublished)
      const includeAll = req.query.all === 'true';
      
      if (includeAll) {
        // For admin: return all tracks
        const { db } = await import('./db.js');
        const { tracks, aiTutors } = await import('@shared/schema-sqlite');
        const allTracks = await db.select({
          id: tracks.id,
          title: tracks.title,
          slug: tracks.slug,
          summary: tracks.summary,
          isPublished: tracks.isPublished,
          difficulty: tracks.difficulty,
          estimatedHours: tracks.estimatedHours,
          createdAt: tracks.createdAt,
        }).from(tracks)
          .leftJoin(aiTutors, eq(tracks.aiTutorId, aiTutors.id))
          .orderBy(tracks.title);
        
        // Convert SQLite boolean to proper boolean
        const formattedTracks = allTracks.map(track => ({
          ...track,
          isPublished: track.isPublished === 1 || track.isPublished === true
        }));
        
        res.json(formattedTracks);
      } else {
        // For regular users: return only published tracks
        const tracks = await tempStorage.getAllTracks();
        res.json(tracks);
      }
    } catch (error) {
      console.error('Tracks API error:', error);
      res.status(500).json({ error: "Failed to fetch tracks" });
    }
  });

  app.get("/api/tracks/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const track = await tempStorage.getTrackBySlug(slug);
      
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }
      
      res.json(track);
    } catch (error) {
      console.error('Track by slug API error:', error);
      res.status(500).json({ error: "Failed to fetch track" });
    }
  });

  app.get("/api/tracks/:slug/lessons", async (req, res) => {
    try {
      const { slug } = req.params;
      const { db } = await import('./db.js');
      const { tracks, lessons } = await import('@shared/schema-sqlite');
      
      // First get the track
      const track = await db.select().from(tracks).where(eq(tracks.slug, slug)).limit(1);
      if (!track || track.length === 0) {
        return res.status(404).json({ error: "Track not found" });
      }
      
      // Then get all lessons for this track
      const trackLessons = await db.select().from(lessons).where(eq(lessons.trackId, track[0].id)).orderBy(lessons.order);
      
      res.json({
        ...track[0],
        lessons: trackLessons
      });
    } catch (error) {
      console.error('Track lessons API error:', error);
      res.status(500).json({ error: "Failed to fetch track lessons" });
    }
  });

  // Update track (for publication status)
  app.patch("/api/tracks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { isPublished } = req.body;
      
      const { db } = await import('./db.js');
      const { tracks } = await import('@shared/schema-sqlite');
      
      // Update track
      const [updated] = await db.update(tracks)
        .set({ isPublished: isPublished === true ? 1 : 0 })
        .where(eq(tracks.id, id))
        .returning();
      
      if (!updated) {
        return res.status(404).json({ error: "Track not found" });
      }
      
      res.json({
        ...updated,
        isPublished: updated.isPublished === 1 || updated.isPublished === true
      });
    } catch (error) {
      console.error('Update track API error:', error);
      res.status(500).json({ error: "Failed to update track" });
    }
  });

  // Trial signup endpoint - now uses CRM service for user + client sync
  app.post('/api/trial-signup', async (req, res) => {
    try {
      const { name, email } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
      }

      if (!email.includes('@')) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
      }

      // Use CRM service to create user and sync to client (with optional HighLevel sync)
      const { user, client } = await crmService.handleTrialSignup({ name, email });
      
      // Sync to HighLevel if available (via adapter)
      if (client) {
        try {
          await crmAdapter.updateClient(client.id, {
            name: client.name,
            email: client.email,
            subscriptionType: client.subscription_type,
            status: client.status,
          });
        } catch (error) {
          console.error('Error syncing trial signup to HighLevel (non-fatal):', error);
          // Continue even if HighLevel sync fails
        }
      }
      
      // Send welcome email
      await emailMarketing.sendWelcomeTrialEmail({ name, email });
      
      res.json({ 
        success: true, 
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          subscriptionType: user.subscription_type,
          trialExpiresAt: user.trial_expires_at
        },
        client: client ? {
          id: client.id,
          partnerStatus: client.partner_status
        } : null
      });
    } catch (error: any) {
      console.error('Trial signup error:', error);
      if (error.message.includes('already exists')) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }
      res.status(500).json({ error: 'Failed to create trial account' });
    }
  });

  // Support ticket endpoints
  app.post('/api/support/ticket', async (req, res) => {
    try {
      const { name, email, subject, message, priority = 'medium' } = req.body;
      
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Try to find user by email
      let userId: string | undefined;
      try {
        const user = await db.select().from(usersSQLite).where(eq(usersSQLite.email, email)).limit(1);
        if (user.length > 0) {
          userId = user[0].id;
        }
      } catch (e) {
        // User not found, continue without userId
        console.log('User not found for email:', email);
      }

      // Use crypto.randomUUID() for ticket ID to avoid import side-effects, and ensure InsertSupportTicket type is correct.
      const ticketId = `PDT-${crypto.randomUUID()}`;
      const ticketData: InsertSupportTicket = {
        ticketId,
        userId: userId || null,
        email,
        name,
        subject,
        message,
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        status: 'pending',
        assignedToLaura: true, // Default to Laura handling all tickets
      };

      // Save ticket to database
      const [savedTicket] = await db.insert(supportTickets).values(ticketData).returning();

      // Send confirmation email
      const ticket = {
        userId: userId || 'unknown',
        email,
        name,
        subject,
        message,
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        createdAt: new Date()
      };

      const success = await emailMarketing.sendTicketConfirmation(ticket);
      
      if (success && savedTicket) {
        res.json({ 
          success: true, 
          message: 'Support ticket submitted successfully. You will receive a confirmation email shortly.',
          ticketId: savedTicket.ticketId,
          id: savedTicket.id
        });
      } else {
        res.status(500).json({ error: 'Failed to submit support ticket' });
      }
    } catch (error) {
      console.error('Support ticket error:', error);
      res.status(500).json({ error: 'Failed to submit support ticket' });
    }
  });

  // Get all support tickets (admin only)
  app.get('/api/support/tickets', async (req, res) => {
    try {
      const { status, priority, assignedToLaura } = req.query;
      
      let query = db.select().from(supportTickets);
      const conditions = [];

      if (status) {
        conditions.push(eq(supportTickets.status, status as string));
      }
      if (priority) {
        conditions.push(eq(supportTickets.priority, priority as string));
      }
      if (assignedToLaura !== undefined) {
        conditions.push(eq(supportTickets.assignedToLaura, assignedToLaura === 'true'));
      }

      if (conditions.length > 0) {
        query = db.select().from(supportTickets).where(and(...conditions));
      }

      const tickets = await query.orderBy(desc(supportTickets.createdAt));

      res.json({ 
        success: true, 
        tickets,
        count: tickets.length
      });
    } catch (error) {
      console.error('Get support tickets error:', error);
      res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
  });

  // Get single support ticket
  app.get('/api/support/ticket/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const [ticket] = await db.select()
        .from(supportTickets)
        .where(eq(supportTickets.id, id))
        .limit(1);

      if (!ticket) {
        return res.status(404).json({ error: 'Support ticket not found' });
      }

      res.json({ 
        success: true, 
        ticket
      });
    } catch (error) {
      console.error('Get support ticket error:', error);
      res.status(500).json({ error: 'Failed to fetch support ticket' });
    }
  });

  // Update support ticket status
  app.patch('/api/support/ticket/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, response, assignedTo, assignedToLaura } = req.body;
      
      const updateData: any = {
        updatedAt: new Date()
      };

      if (status) {
        updateData.status = status;
        if (status === 'completed' || status === 'closed') {
          updateData.resolvedAt = new Date();
        }
      }
      if (response !== undefined) {
        updateData.response = response;
      }
      if (assignedTo !== undefined) {
        updateData.assignedTo = assignedTo;
      }
      if (assignedToLaura !== undefined) {
        updateData.assignedToLaura = assignedToLaura;
      }

      const [updatedTicket] = await db.update(supportTickets)
        .set(updateData)
        .where(eq(supportTickets.id, id))
        .returning();

      if (!updatedTicket) {
        return res.status(404).json({ error: 'Support ticket not found' });
      }

      res.json({ 
        success: true, 
        ticket: updatedTicket
      });
    } catch (error) {
      console.error('Update support ticket error:', error);
      res.status(500).json({ error: 'Failed to update support ticket' });
    }
  });

  // Get support ticket statistics
  app.get('/api/support/tickets/stats', async (req, res) => {
    try {
      const allTickets = await db.select().from(supportTickets);
      
      const stats = {
        total: allTickets.length,
        pending: allTickets.filter(t => t.status === 'pending').length,
        inProgress: allTickets.filter(t => t.status === 'in_progress').length,
        completed: allTickets.filter(t => t.status === 'completed').length,
        closed: allTickets.filter(t => t.status === 'closed').length,
        assignedToLaura: allTickets.filter(t => t.assignedToLaura).length,
        byPriority: {
          low: allTickets.filter(t => t.priority === 'low').length,
          medium: allTickets.filter(t => t.priority === 'medium').length,
          high: allTickets.filter(t => t.priority === 'high').length,
          urgent: allTickets.filter(t => t.priority === 'urgent').length,
        }
      };

      res.json({ 
        success: true, 
        stats
      });
    } catch (error) {
      console.error('Get support ticket stats error:', error);
      res.status(500).json({ error: 'Failed to fetch support ticket statistics' });
    }
  });

  // Laura auto-handle support ticket
  app.post('/api/support/ticket/:id/laura-handle', async (req, res) => {
    try {
      const { id } = req.params;
      const { userContext } = req.body;
      const LauraOracleService = (await import('./laura-oracle-service')).default;
      const lauraOracle = LauraOracleService.getInstance();

      const result = await lauraOracle.autoHandleTicket(id, userContext);

      if (result.success) {
        res.json({
          success: true,
          ticket: result.ticket,
          response: result.response,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.message
        });
      }
    } catch (error) {
      console.error('Laura auto-handle ticket error:', error);
      res.status(500).json({ error: 'Failed to auto-handle support ticket' });
    }
  });

  // Request Google review endpoint
  app.post('/api/support/request-review', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      await emailMarketing.checkAndRequestReview(userId);
      
      res.json({ 
        success: true, 
        message: 'Review request processed successfully'
      });
    } catch (error) {
      console.error('Review request error:', error);
      res.status(500).json({ error: 'Failed to process review request' });
    }
  });

  // Documentation API Endpoints
  app.get('/api/support-documents/sections', async (req, res) => {
    try {
      const { getDocumentationSections } = await import('./api/documentation');
      await getDocumentationSections(req, res);
    } catch (error) {
      console.error('Documentation sections error:', error);
      res.status(500).json({ error: 'Failed to fetch documentation sections' });
    }
  });

  app.get('/api/support-documents/sections/:sectionId', async (req, res) => {
    try {
      const { getDocumentationSection } = await import('./api/documentation');
      await getDocumentationSection(req, res);
    } catch (error) {
      console.error('Documentation section error:', error);
      res.status(500).json({ error: 'Failed to fetch documentation section' });
    }
  });

  app.get('/api/support-documents/changes', async (req, res) => {
    try {
      const { getDocumentationChanges } = await import('./api/documentation');
      await getDocumentationChanges(req, res);
    } catch (error) {
      console.error('Documentation changes error:', error);
      res.status(500).json({ error: 'Failed to fetch documentation changes' });
    }
  });

  app.get('/api/support-documents/versions/:sectionId', async (req, res) => {
    try {
      const { getSectionVersions } = await import('./api/documentation');
      await getSectionVersions(req, res);
    } catch (error) {
      console.error('Section versions error:', error);
      res.status(500).json({ error: 'Failed to fetch section versions' });
    }
  });

  app.post('/api/support-documents/update', async (req, res) => {
    try {
      const { triggerDocumentationUpdate } = await import('./api/documentation');
      await triggerDocumentationUpdate(req, res);
    } catch (error) {
      console.error('Documentation update trigger error:', error);
      res.status(500).json({ error: 'Failed to trigger documentation update' });
    }
  });

  app.post('/api/support-documents/sync', async (req, res) => {
    try {
      const { forceSyncFromPlatform } = await import('./api/documentation');
      await forceSyncFromPlatform(req, res);
    } catch (error) {
      console.error('Documentation sync error:', error);
      res.status(500).json({ error: 'Failed to sync documentation' });
    }
  });

  app.get('/api/support-documents/pending-count', async (req, res) => {
    try {
      const { getPendingChangesCount } = await import('./api/documentation');
      await getPendingChangesCount(req, res);
    } catch (error) {
      console.error('Pending changes count error:', error);
      res.status(500).json({ error: 'Failed to fetch pending changes count' });
    }
  });

  // Affiliate Program Endpoints
  app.get('/api/affiliate/dashboard', async (req, res) => {
    try {
      // Get user email from query params (same pattern as /api/users/current)
      const email = req.query.email as string;
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required' });
      }

      // Get user info to get userId and name (same logic as /api/users/current)
      let userId: string;
      let userName: string;
      
      // SUPER ADMIN ACCOUNT - DO NOT CHANGE
      if (email === 'lalabalavu.jon@gmail.com') {
        userId = 'super-admin-1';
        userName = 'Jon Lalabalavu';
      } else if (email === 'sephdee@hotmail.com') {
        userId = 'super-admin-2';
        userName = 'Jon Lalabalavu';
      } else {
        // For other users, use email as userId (consistent with current user endpoint)
        userId = email;
        // Extract name from email or use email
        userName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      }

      // Find or create affiliate for this user
      let affiliate = await affiliateService.getAffiliateByUserId(userId);
      
      if (!affiliate) {
        // Create new affiliate account
        affiliate = await affiliateService.createAffiliate({
          userId: userId,
          name: userName,
          email: email
        });
      }

      // Get dashboard data
      const dashboardData = await affiliateService.getAffiliateDashboard(affiliate.id);
      res.json(dashboardData);
    } catch (error) {
      console.error('Affiliate dashboard error:', error);
      res.status(500).json({ error: 'Failed to load dashboard' });
    }
  });

  app.get('/api/affiliate/leaderboard', async (req, res) => {
    try {
      const leaderboard = await affiliateService.getLeaderboard();
      res.json(leaderboard);
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({ error: 'Failed to load leaderboard' });
    }
  });

  app.post('/api/affiliate/track-click', async (req, res) => {
    try {
      const { affiliateCode, clickData } = req.body;
      
      if (!affiliateCode) {
        return res.status(400).json({ error: 'Affiliate code is required' });
      }

      const click = await affiliateService.trackClick(affiliateCode, clickData);
      res.json({ success: true, clickId: click.id });
    } catch (error) {
      console.error('Click tracking error:', error);
      res.status(500).json({ error: 'Failed to track click' });
    }
  });

  app.post('/api/affiliate/convert', async (req, res) => {
    try {
      const { affiliateCode, referredUserId, subscriptionType, monthlyValue } = req.body;
      
      if (!affiliateCode || !referredUserId || !subscriptionType || !monthlyValue) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const referral = await affiliateService.processReferral({
        affiliateCode,
        referredUserId,
        subscriptionType,
        monthlyValue
      });

      res.json({ success: true, referral });
    } catch (error) {
      console.error('Conversion tracking error:', error);
      res.status(500).json({ error: 'Failed to process conversion' });
    }
  });

  // Partner routes
  app.post('/api/partners/convert', async (req, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const result = await partnerService.convertToPartner(userId);
      
      if (result.success) {
        res.json({
          success: true,
          user: result.user,
          client: result.client,
          affiliate: result.affiliate,
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error('Partner conversion error:', error);
      res.status(500).json({ error: 'Failed to convert to partner' });
    }
  });

  app.get('/api/partners/eligibility/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const eligibility = await partnerService.checkEligibility(userId);
      res.json(eligibility);
    } catch (error) {
      console.error('Partner eligibility check error:', error);
      res.status(500).json({ error: 'Failed to check eligibility' });
    }
  });

  app.post('/api/partners/apply', async (req, res) => {
    try {
      const { userId, reason, experience } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const result = await partnerService.applyToBecomePartner(userId, {
        reason,
        experience,
      });
      
      res.json(result);
    } catch (error) {
      console.error('Partner application error:', error);
      res.status(500).json({ error: 'Failed to process partner application' });
    }
  });

  app.get('/api/partners/stats/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      
      const stats = await partnerService.getPartnerStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Partner stats error:', error);
      res.status(500).json({ error: 'Failed to get partner stats' });
    }
  });

  app.post('/api/affiliate/create', async (req, res) => {
    try {
      const { userId, name, email } = req.body;
      
      if (!userId || !name || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const affiliate = await affiliateService.createAffiliate({ userId, name, email });
      res.json({ success: true, affiliate });
    } catch (error) {
      console.error('Affiliate creation error:', error);
      res.status(500).json({ error: 'Failed to create affiliate account' });
    }
  });

  // Learning Path AI Routes
  app.post('/api/learning-path/generate', async (req, res) => {
    try {
      const { profile, additionalInfo, userId } = req.body;
      
      // Log request for debugging
      console.log('Learning path generation request received:', {
        hasProfile: !!profile,
        experience: profile?.experience,
        goalsCount: profile?.goals?.length || 0,
        hasAdditionalInfo: !!additionalInfo,
      });
      
      if (!profile) {
        console.error('Learning path generation failed: No profile provided');
        return res.status(400).json({ 
          error: 'Profile is required',
          message: 'Please provide your profile information'
        });
      }

      if (!profile.experience || !profile.goals || profile.goals.length === 0) {
        console.error('Learning path generation failed: Profile incomplete', {
          hasExperience: !!profile.experience,
          goalsCount: profile.goals?.length || 0,
        });
        return res.status(400).json({ 
          error: 'Profile incomplete',
          message: 'Profile with experience and at least one goal is required'
        });
      }

      try {
        const { AILearningPathService } = await import('./ai-learning-path');
        const aiLearningPathService = new AILearningPathService();
        const suggestions = await aiLearningPathService.generateLearningPath(profile, additionalInfo);
        
        // Ensure we always return suggestions array
        if (suggestions && Array.isArray(suggestions) && suggestions.length > 0) {
          return res.json({ suggestions });
        } else {
          // If AI returns empty, use fallback
          console.warn('AI service returned empty suggestions, using fallback');
          const mockSuggestions = generateMockSuggestions(profile);
          return res.json({ suggestions: mockSuggestions });
        }
      } catch (aiError: any) {
        console.error('AI Learning Path service error:', aiError);
        // Fallback to mock suggestions if AI service fails
        const mockSuggestions = generateMockSuggestions(profile);
        return res.json({ suggestions: mockSuggestions });
      }
    } catch (error: any) {
      console.error('Learning path generation error:', error);
      const errorMessage = error?.message || 'Failed to generate learning path suggestions';
      return res.status(500).json({ 
        error: 'Generation failed',
        message: errorMessage 
      });
    }
  });

  // Helper function for fallback mock suggestions
  function generateMockSuggestions(profile: any) {
    const isBeginner = profile.experience?.toLowerCase().includes('beginner') || 
                      profile.experience?.toLowerCase().includes('new');
    
    if (isBeginner) {
      return [{
        id: "foundation-path",
        title: "Commercial Diving Foundation Path",
        description: "Essential certifications for starting your commercial diving career with industry-standard training",
        difficulty: "Beginner",
        estimatedWeeks: 12,
        tracks: [
          {
            id: "1",
            title: "Assistant Life Support Technician",
            slug: "air-diving-life-support-technician",
            order: 1,
            reason: "Essential foundation for all commercial diving operations and safety protocols"
          }
        ],
        confidence: 92,
        reasoning: "Based on your beginner experience level and career goals, this path provides the essential foundation certifications required by IMCA and ADCI industry standards."
      }];
    }
    
    return [{
      id: "professional-path",
      title: "Professional Development Path",
      description: "Advance your diving career with specialized certifications aligned with your goals",
      difficulty: "Intermediate",
      estimatedWeeks: 20,
      tracks: [
        {
          id: "2",
          title: "Life Support Technician (LST)",
          slug: "life-support-technician",
          order: 1,
          reason: "Advanced life support skills for complex operations"
        },
        {
          id: "3",
          title: "Diver Medic Technician (DMT)",
          slug: "diver-medic-technician",
          order: 2,
          reason: "Medical emergency response capabilities for diving operations"
        }
      ],
      confidence: 85,
      reasoning: "Building on your experience, these certifications will enhance your value and safety capabilities in commercial diving operations while advancing your career goals."
    }];
  }

  app.get('/api/learning-path/suggestions', async (req, res) => {
    try {
      // For the demo, return mock suggestions based on query parameters
      const { experience, goals } = req.query;
      
      if (!experience || !goals) {
        return res.json([]);
      }

      // Return sample suggestions for now
      const mockSuggestions = [
        {
          id: "foundation-path",
          title: "Commercial Diving Foundation",
          description: "Essential certifications for starting your commercial diving career",
          difficulty: "Beginner",
          estimatedWeeks: 16,
          tracks: [
            {
              id: "1",
              title: "Assistant Life Support Technician",
              slug: "air-diving-life-support-technician",
              order: 1,
              reason: "Foundation certification required for all commercial diving operations"
            },
            {
              id: "2", 
              title: "Life Support Technician (LST)",
              slug: "life-support-technician",
              order: 2,
              reason: "Advanced life support systems management and safety protocols"
            }
          ],
          confidence: 92,
          reasoning: "Based on your beginner experience level and commercial diving goals, this path provides the essential foundation certifications required by industry standards."
        }
      ];
      
      res.json(mockSuggestions);
    } catch (error) {
      console.error('Learning path suggestions error:', error);
      res.status(500).json({ error: 'Failed to fetch learning path suggestions' });
    }
  });

  // Save user's learning path for later review
  app.post('/api/learning-path/save', async (req, res) => {
    try {
      const { userId, pathId, pathData } = req.body;
      
      if (!userId || !pathId || !pathData) {
        return res.status(400).json({ error: 'UserId, pathId, and pathData are required' });
      }

      // In a real implementation, save to database
      // For now, return success
      res.json({ 
        success: true, 
        message: 'Learning path saved successfully',
        savedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Save learning path error:', error);
      res.status(500).json({ error: 'Failed to save learning path' });
    }
  });

  // Share learning path (generates shareable link)
  app.post('/api/learning-path/share', async (req, res) => {
    try {
      const { pathId, pathData } = req.body;
      
      if (!pathId || !pathData) {
        return res.status(400).json({ error: 'PathId and pathData are required' });
      }

      // Generate a shareable token/link
      const shareToken = randomBytes(32).toString('hex');
      // In a real implementation, store in database with expiration
      
      res.json({ 
        success: true,
        shareToken,
        shareUrl: `/learning-path/shared/${shareToken}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      });
    } catch (error) {
      console.error('Share learning path error:', error);
      res.status(500).json({ error: 'Failed to share learning path' });
    }
  });

  // Download path summary as PDF (placeholder - would need PDF generation library)
  app.post('/api/learning-path/download', async (req, res) => {
    try {
      const { pathData } = req.body;
      
      if (!pathData) {
        return res.status(400).json({ error: 'PathData is required' });
      }

      // In a real implementation, generate PDF
      // For now, return JSON that can be formatted client-side
      res.json({ 
        success: true,
        message: 'PDF generation would happen here',
        data: pathData
      });
    } catch (error) {
      console.error('Download learning path error:', error);
      res.status(500).json({ error: 'Failed to download learning path' });
    }
  });

  // Book consultation
  app.post('/api/learning-path/consultation', async (req, res) => {
    try {
      const { userId, email, name, phone, preferredDate, message } = req.body;
      
      if (!email || !name) {
        return res.status(400).json({ error: 'Email and name are required' });
      }

      // In a real implementation, create calendar event and send confirmation
      res.json({ 
        success: true,
        message: 'Consultation request received. We will contact you within 24 hours.',
        confirmationId: randomBytes(16).toString('hex')
      });
    } catch (error) {
      console.error('Consultation booking error:', error);
      res.status(500).json({ error: 'Failed to book consultation' });
    }
  });

  // Get current user (mock endpoint for trial)
  app.get('/api/current-user', async (req, res) => {
    try {
      // For now, return a mock trial user
      const mockTrialUser = {
        id: 'trial-user-1',
        name: 'Trial User',
        email: 'trial@example.com',
        subscriptionType: 'TRIAL',
        trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        subscriptionStatus: 'ACTIVE'
      };
      res.json(mockTrialUser);
    } catch (error) {
      console.error('Error fetching current user:', error);
      res.status(500).json({ error: 'Failed to fetch user data' });
    }
  });

  // Lessons routes
  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const lesson = await tempStorage.getLessonById(id);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      res.json(lesson);
    } catch (error) {
      console.error('Lesson API error:', error);
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.patch("/api/lessons/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log('PATCH /api/lessons/:id - Request body:', JSON.stringify(req.body, null, 2));
      
      // Validate with SQLite schema since tempStorage uses SQLite
      const updateData = insertLessonSchemaSQLite.partial().parse(req.body);
      console.log('PATCH /api/lessons/:id - Parsed update data:', JSON.stringify(updateData, null, 2));
      
      // Use tempStorage to match the GET endpoint and work with current database
      const lesson = await tempStorage.updateLesson(id, updateData);
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      console.log('PATCH /api/lessons/:id - Updated lesson:', JSON.stringify(lesson, null, 2));
      res.json(lesson);
    } catch (error) {
      console.error('Lesson update error:', error);
      if (error instanceof z.ZodError) {
        console.error('Zod validation errors:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update lesson", message: error instanceof Error ? error.message : String(error) });
    }
  });

  // Bulk upload endpoints for lessons (PDF and podcast files)
  // Endpoint for automatic filename-based matching
  app.post("/api/lessons/bulk-upload-auto", async (req, res) => {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = path.extname(file.originalname);
          cb(null, `bulk-${uniqueSuffix}${ext}`);
        }
      });

      const upload = multer({
        storage,
        limits: { fileSize: 100 * 1024 * 1024 }, // 100MB per file
        fileFilter: (req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
          const allowedExtensions = ['pdf', 'm4a', 'mp4a', 'mp3', 'wav', 'aac', 'ogg'];
          
          if (!allowedExtensions.includes(ext)) {
            return cb(new Error(`Invalid file type: ${ext}. Only PDF and audio files are allowed.`));
          }
          
          const isPdf = ext === 'pdf';
          const isAudio = ['m4a', 'mp4a', 'mp3', 'wav', 'aac', 'ogg'].includes(ext);
          
          if (!file.mimetype) {
            // Accept files without MIME type if extension is valid
            return cb(null, true);
          }
          
          if (isPdf && (file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf' || file.mimetype === 'application/octet-stream')) {
            return cb(null, true);
          }
          
          if (isAudio && (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream')) {
            return cb(null, true);
          }
          
          if (!isPdf && !isAudio) {
            return cb(new Error(`Invalid file type: ${ext}. Only PDF and audio files are allowed.`));
          }
          
          cb(null, true);
        }
      }).array('files', 50); // Allow up to 50 files

      upload(req, res, async (err) => {
        if (err) {
          console.error('Bulk upload error:', err);
          return res.status(400).json({ 
            error: err.message || 'File upload failed',
          });
        }

        const files = (req as any).files as Express.Multer.File[];

        // Ensure files is an array of file-like objects to avoid type confusion
        if (
          !Array.isArray(files) ||
          files.length === 0 ||
          typeof files[0] !== "object" ||
          files[0] === null ||
          typeof (files[0] as any).originalname !== "string" ||
          typeof (files[0] as any).filename !== "string"
        ) {
          return res.status(400).json({ error: "No valid files uploaded" });
        }

        const { parseFilenameForLesson, findLessonByParsedFilename, getFileType } = await import('./utils/file-matcher');
        const results = [];

        for (const file of files) {
          try {
            const parsed = parseFilenameForLesson(file.originalname);
            const fileType = getFileType(file.originalname);
            
            if (fileType === 'unknown') {
              results.push({
                filename: file.originalname,
                success: false,
                error: 'Unknown file type',
              });
              continue;
            }

            const lesson = await findLessonByParsedFilename(parsed);
            
            if (!lesson) {
              results.push({
                filename: file.originalname,
                success: false,
                error: `Could not find matching lesson for file: ${file.originalname}`,
                parsed,
              });
              continue;
            }

            const fileUrl = `/uploads/${file.filename}`;
            const updateData: any = {};
            
            if (fileType === 'pdf') {
              updateData.pdfUrl = fileUrl;
            } else if (fileType === 'podcast') {
              updateData.podcastUrl = fileUrl;
              // TODO: Extract duration from audio file if needed
            }

            await tempStorage.updateLesson(lesson.id, updateData);

            results.push({
              filename: file.originalname,
              lessonId: lesson.id,
              lessonTitle: lesson.title,
              fileType,
              success: true,
              url: fileUrl,
            });
          } catch (error: any) {
            console.error(`Error processing file ${file.originalname}:`, error);
            results.push({
              filename: file.originalname,
              success: false,
              error: error.message || 'Unknown error',
            });
          }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        res.json({
          success: true,
          total: files.length,
          successful: successCount,
          failed: failureCount,
          results,
        });
      });
    } catch (error: any) {
      console.error('Bulk upload auto error:', error);
      res.status(500).json({ 
        error: 'Failed to process bulk upload',
        message: error.message || 'Unknown error',
      });
    }
  });

  // Endpoint for manual file-to-lesson mapping
  app.post("/api/lessons/bulk-upload", async (req, res) => {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const storage = multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, uploadsDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
          const ext = path.extname(file.originalname);
          cb(null, `bulk-${uniqueSuffix}${ext}`);
        }
      });

      const upload = multer({
        storage,
        limits: { fileSize: 100 * 1024 * 1024 }, // 100MB per file
        fileFilter: (req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
          const allowedExtensions = ['pdf', 'm4a', 'mp4a', 'mp3', 'wav', 'aac', 'ogg'];
          
          if (!allowedExtensions.includes(ext)) {
            return cb(new Error(`Invalid file type: ${ext}. Only PDF and audio files are allowed.`));
          }
          
          const isPdf = ext === 'pdf';
          const isAudio = ['m4a', 'mp4a', 'mp3', 'wav', 'aac', 'ogg'].includes(ext);
          
          if (!file.mimetype) {
            return cb(null, true);
          }
          
          if (isPdf && (file.mimetype === 'application/pdf' || file.mimetype === 'application/x-pdf' || file.mimetype === 'application/octet-stream')) {
            return cb(null, true);
          }
          
          if (isAudio && (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream')) {
            return cb(null, true);
          }
          
          cb(null, true);
        }
      }).array('files', 50); // Allow up to 50 files

      upload(req, res, async (err) => {
        if (err) {
          console.error('Bulk upload error:', err);
          return res.status(400).json({ 
            error: err.message || 'File upload failed',
          });
        }

        const files = (req as any).files as Express.Multer.File[];
        const mappings = JSON.parse(req.body.mappings || '[]'); // Array of { fileIndex, lessonId, type: 'pdf'|'podcast' }

        if (!files || files.length === 0) {
          return res.status(400).json({ error: 'No files uploaded' });
        }

        if (!mappings || mappings.length === 0) {
          return res.status(400).json({ error: 'No file mappings provided' });
        }

        const { getFileType } = await import('./utils/file-matcher');
        const results = [];

        for (const mapping of mappings) {
          const { fileIndex, lessonId, type } = mapping;
          const file = files[fileIndex];

          if (!file) {
            results.push({
              fileIndex,
              success: false,
              error: 'File not found at specified index',
            });
            continue;
          }

          if (!lessonId) {
            results.push({
              filename: file.originalname,
              success: false,
              error: 'Lesson ID is required',
            });
            continue;
          }

          if (!type || (type !== 'pdf' && type !== 'podcast')) {
            results.push({
              filename: file.originalname,
              success: false,
              error: 'Type must be "pdf" or "podcast"',
            });
            continue;
          }

          try {
            // Verify lesson exists
            const lesson = await tempStorage.getLessonById(lessonId);
            if (!lesson) {
              results.push({
                filename: file.originalname,
                lessonId,
                success: false,
                error: 'Lesson not found',
              });
              continue;
            }

            const fileType = getFileType(file.originalname);
            if ((type === 'pdf' && fileType !== 'pdf') || (type === 'podcast' && fileType !== 'podcast')) {
              results.push({
                filename: file.originalname,
                success: false,
                error: `File type mismatch: expected ${type}, got ${fileType}`,
              });
              continue;
            }

            const fileUrl = `/uploads/${file.filename}`;
            const updateData: any = {};
            
            if (type === 'pdf') {
              updateData.pdfUrl = fileUrl;
            } else {
              updateData.podcastUrl = fileUrl;
            }

            await tempStorage.updateLesson(lessonId, updateData);

            results.push({
              filename: file.originalname,
              lessonId,
              lessonTitle: lesson.title,
              fileType: type,
              success: true,
              url: fileUrl,
            });
          } catch (error: any) {
            console.error(`Error processing file ${file.originalname}:`, error);
            results.push({
              filename: file.originalname,
              lessonId,
              success: false,
              error: error.message || 'Unknown error',
            });
          }
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.filter(r => !r.success).length;

        res.json({
          success: true,
          total: mappings.length,
          successful: successCount,
          failed: failureCount,
          results,
        });
      });
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      res.status(500).json({ 
        error: 'Failed to process bulk upload',
        message: error.message || 'Unknown error',
      });
    }
  });

  // Quiz routes
  app.get("/api/quizzes/lesson/:lessonId", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const quiz = await tempStorage.getQuizByLessonId(lessonId);
      if (!quiz) {
        return res.status(404).json({ error: "Quiz not found" });
      }
      res.json(quiz);
    } catch (error) {
      console.error('Quiz API error:', error);
      res.status(500).json({ error: "Failed to fetch quiz" });
    }
  });

  app.post("/api/quiz-attempts", async (req, res) => {
    try {
      const env = process.env.NODE_ENV ?? "development";
      const isSQLiteDev = env === "development";

      // SQLite dev writes to `quiz_attempts` (used by the analytics dashboard).
      if (isSQLiteDev) {
        const quizAttemptInput = z.object({
          userId: z.string().min(1),
          quizId: z.string().min(1),
          score: z.number().int().min(0),
          timeSpent: z.number().int().min(0).optional(),
          answers: z.string().optional(),
        });

        const parsed = quizAttemptInput.parse(req.body);
        const id = randomBytes(16).toString("hex");
        const completedAt = Date.now();

        await db.execute(
          `
          INSERT INTO quiz_attempts (id, user_id, quiz_id, score, time_spent, completed_at, answers)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          `,
          [
            id,
            parsed.userId,
            parsed.quizId,
            parsed.score,
            parsed.timeSpent ?? null,
            completedAt,
            parsed.answers ?? null,
          ],
        );

        res.status(201).json({ id, ...parsed, completedAt });
        return;
      }

      // Production (PostgreSQL) — keep existing behavior.
      const attemptData = insertAttemptSchema.parse(req.body);
      const attempt = await storage.createAttempt(attemptData);
      res.status(201).json(attempt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create attempt" });
    }
  });

  // Full exam attempts (used by the "Exam Interface" page)
  app.post("/api/exam-attempts", async (req, res) => {
    try {
      const env = process.env.NODE_ENV ?? "development";
      const isSQLiteDev = env === "development";

      if (!isSQLiteDev) {
        res.status(501).json({ error: "Exam attempts not implemented for production yet" });
        return;
      }

      // Ensure table exists (safe no-op if already created)
      await db.execute(`
        CREATE TABLE IF NOT EXISTS exam_attempts (
          id text PRIMARY KEY NOT NULL,
          user_id text NOT NULL,
          exam_slug text NOT NULL,
          score integer NOT NULL,
          total_questions integer NOT NULL,
          time_spent integer,
          completed_at integer NOT NULL,
          answers text,
          FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE no action ON DELETE cascade
        );
      `);

      const examAttemptInput = z.object({
        userId: z.string().min(1),
        examSlug: z.string().min(1),
        score: z.number().int().min(0),
        totalQuestions: z.number().int().min(0),
        timeSpent: z.number().int().min(0).optional(),
        answers: z.string().optional(),
      });

      const parsed = examAttemptInput.parse(req.body);
      const id = randomBytes(16).toString("hex");
      const completedAt = Date.now();

      await db.execute(
        `
        INSERT INTO exam_attempts (id, user_id, exam_slug, score, total_questions, time_spent, completed_at, answers)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          id,
          parsed.userId,
          parsed.examSlug,
          parsed.score,
          parsed.totalQuestions,
          parsed.timeSpent ?? null,
          completedAt,
          parsed.answers ?? null,
        ],
      );

      res.status(201).json({ id, ...parsed, completedAt });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Exam attempt create error:", error);
      res.status(500).json({ error: "Failed to create exam attempt" });
    }
  });

  // Client Management routes
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await tempStorage.getAllClients();
      res.json(clients);
    } catch (error) {
      console.error('Get clients API error:', error);
      res.status(500).json({ error: "Failed to fetch clients" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      // Use CRM adapter for unified local + HighLevel sync
      const client = await crmAdapter.createClient(req.body);
      res.json(client);
    } catch (error) {
      console.error('Create client API error:', error);
      res.status(500).json({ error: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      // Use CRM adapter for unified local + HighLevel sync
      const client = await crmAdapter.updateClient(req.params.id, req.body);
      res.json(client);
    } catch (error) {
      console.error('Update client API error:', error);
      res.status(500).json({ error: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const result = await tempStorage.deleteClient(req.params.id);
      res.json(result);
    } catch (error) {
      console.error('Delete client API error:', error);
      res.status(500).json({ error: "Failed to delete client" });
    }
  });

  // Sync Partner Admins to CRM (Super Admin only)
  app.post("/api/admin/sync-partners-to-crm", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      // Get all Partner Admins
      const partnerAdmins = userManagement.getPartnerAdmins();
      
      if (partnerAdmins.length === 0) {
        return res.json({
          success: true,
          synced: 0,
          syncedClients: [],
          errors: [],
          message: "No Partner Admins to sync",
        });
      }

      // Get all existing clients from CRM
      const existingClients = await tempStorage.getAllClients();
      const existingClientEmails = new Set(existingClients.map((c: any) => c.email?.toLowerCase()));

      const syncedClients: any[] = [];
      const errors: any[] = [];

      // Sync each Partner Admin
      for (const partnerAdmin of partnerAdmins) {
        try {
          const emailLower = partnerAdmin.email?.toLowerCase();
          
          // Check if client already exists
          if (existingClientEmails.has(emailLower)) {
            // Client exists - skip or update (optional: update existing)
            errors.push({
              email: partnerAdmin.email,
              error: "Client already exists in CRM",
              action: "skipped",
            });
            continue;
          }

          // Create client in CRM
          const clientData = {
            name: partnerAdmin.name,
            email: partnerAdmin.email,
            subscriptionType: 'LIFETIME',
            status: 'ACTIVE',
            notes: "Partner Admin - Managed by Super Admin",
            partnerStatus: 'PARTNER_ADMIN',
            monthlyRevenue: 0, // Lifetime access
          };

          const client = await crmAdapter.createClient(clientData);
          syncedClients.push({
            id: client.id,
            name: client.name,
            email: client.email,
            subscriptionType: client.subscriptionType,
            status: client.status,
          });
        } catch (error: any) {
          errors.push({
            email: partnerAdmin.email,
            error: error.message || "Failed to sync to CRM",
          });
        }
      }

      res.json({
        success: true,
        synced: syncedClients.length,
        syncedClients,
        errors: errors.length > 0 ? errors : undefined,
        message: `Synced ${syncedClients.length} Partner Admin(s) to CRM`,
      });
    } catch (error: any) {
      console.error("Error syncing Partner Admins to CRM:", error);
      res.status(500).json({ error: error.message || "Failed to sync Partner Admins to CRM" });
    }
  });

  app.get("/api/clients/stats", async (req, res) => {
    try {
      const stats = await tempStorage.getClientStats();
      res.json(stats);
    } catch (error) {
      console.error('Client stats API error:', error);
      res.status(500).json({ error: "Failed to fetch client stats" });
    }
  });

  // Helper function to ensure CRM tables exist (SQLite only)
  async function ensureCrmTables(): Promise<void> {
    // Only create tables for SQLite (dev environment)
    if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'development') {
      return; // PostgreSQL will use migrations
    }

    try {
      // Create client_tags table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS client_tags (
          id text PRIMARY KEY NOT NULL,
          client_id text NOT NULL,
          tag_name text NOT NULL,
          color text DEFAULT '#3b82f6',
          created_at integer NOT NULL,
          created_by text,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );
      `);

      // Create communications table
      await db.execute(`
        CREATE TABLE IF NOT EXISTS communications (
          id text PRIMARY KEY NOT NULL,
          client_id text NOT NULL,
          type text NOT NULL CHECK(type IN ('email', 'phone', 'sms', 'whatsapp', 'note')),
          direction text NOT NULL CHECK(direction IN ('inbound', 'outbound')),
          subject text,
          content text NOT NULL,
          status text NOT NULL DEFAULT 'sent' CHECK(status IN ('sent', 'delivered', 'read', 'failed', 'answered', 'missed')),
          duration integer,
          metadata text,
          created_by text,
          created_at integer NOT NULL,
          FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );
      `);

      // Add phone column to clients table if it doesn't exist
      try {
        await db.execute(`ALTER TABLE clients ADD COLUMN phone text;`);
      } catch (e: any) {
        // Column might already exist, ignore error
        if (!e.message?.includes('duplicate column')) {
          console.warn('Error adding phone column to clients:', e.message);
        }
      }

      // Create indexes for better performance
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_client_tags_client_id ON client_tags(client_id);`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_communications_client_id ON communications(client_id);`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_communications_created_at ON communications(created_at DESC);`);
    } catch (error) {
      console.error('Error ensuring CRM tables:', error);
      // Don't throw - allow server to continue
    }
  }

  // Client Tags Routes
  app.get("/api/clients/:id/tags", async (req, res) => {
    try {
      await ensureCrmTables();
      const { taggingService } = await import("./services/tagging-service");
      const tags = await taggingService.getClientTags(req.params.id);
      res.json({ success: true, tags });
    } catch (error) {
      console.error('Get client tags error:', error);
      res.status(500).json({ error: "Failed to fetch client tags" });
    }
  });

  app.post("/api/clients/:id/tags", async (req, res) => {
    try {
      await ensureCrmTables();
      const { taggingService } = await import("./services/tagging-service");
      const { tagName, color } = req.body;
      
      if (!tagName || !tagName.trim()) {
        return res.status(400).json({ error: "Tag name is required" });
      }

      // Try to get user email from localStorage via header or from userEmail in body
      const userEmail = (req.headers['x-user-email'] as string) || req.body.userEmail || undefined;
      let createdBy = undefined;
      if (userEmail) {
        try {
          const user = await db.select().from(usersSQLite).where(eq(usersSQLite.email, userEmail)).limit(1);
          if (user.length > 0) {
            createdBy = user[0].id;
          }
        } catch (e) {
          // User not found, continue without createdBy
          console.log('User not found for email:', userEmail);
        }
      }
      const tag = await taggingService.addTag(req.params.id, tagName.trim(), color, createdBy);
      res.json({ success: true, tag });
    } catch (error) {
      console.error('Add client tag error:', error);
      res.status(500).json({ error: "Failed to add tag" });
    }
  });

  app.delete("/api/clients/:id/tags/:tagId", async (req, res) => {
    try {
      await ensureCrmTables();
      const { taggingService } = await import("./services/tagging-service");
      const success = await taggingService.removeTag(req.params.id, req.params.tagId);
      res.json({ success });
    } catch (error) {
      console.error('Remove client tag error:', error);
      res.status(500).json({ error: "Failed to remove tag" });
    }
  });

  app.get("/api/tags/all", async (req, res) => {
    try {
      await ensureCrmTables();
      const { taggingService } = await import("./services/tagging-service");
      const tags = await taggingService.getAllTags();
      res.json({ success: true, tags });
    } catch (error) {
      console.error('Get all tags error:', error);
      res.status(500).json({ error: "Failed to fetch tags" });
    }
  });

  // Communication Routes
  app.get("/api/clients/:id/communications", async (req, res) => {
    try {
      await ensureCrmTables();
      const { communicationService } = await import("./services/communication-service");
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const communications = await communicationService.getClientCommunications(req.params.id, limit);
      res.json({ success: true, communications });
    } catch (error) {
      console.error('Get client communications error:', error);
      res.status(500).json({ error: "Failed to fetch communications" });
    }
  });

  app.post("/api/clients/:id/communications", async (req, res) => {
    try {
      await ensureCrmTables();
      const { communicationService } = await import("./services/communication-service");
      const { type, direction, subject, content, status, duration, metadata } = req.body;
      
      if (!content || !content.trim()) {
        return res.status(400).json({ error: "Content is required" });
      }

      // Try to get user email from localStorage via header or from userEmail in body
      const userEmail = (req.headers['x-user-email'] as string) || req.body.userEmail || undefined;
      let createdBy = undefined;
      if (userEmail) {
        try {
          const user = await db.select().from(usersSQLite).where(eq(usersSQLite.email, userEmail)).limit(1);
          if (user.length > 0) {
            createdBy = user[0].id;
          }
        } catch (e) {
          // User not found, continue without createdBy
          console.log('User not found for email:', userEmail);
        }
      }

      let communication;
      if (type === "email" && direction === "outbound") {
        // Send email
        communication = await communicationService.sendEmail({
          clientId: req.params.id,
          to: req.body.to,
          subject,
          content,
          htmlContent: req.body.htmlContent,
          createdBy,
        });
      } else if (type === "phone") {
        communication = await communicationService.logPhoneCall({
          clientId: req.params.id,
          direction,
          duration,
          status: status || "answered",
          notes: content,
          phoneNumber: req.body.phoneNumber,
          createdBy,
        });
      } else if (type === "sms") {
        communication = await communicationService.logSMS({
          clientId: req.params.id,
          direction,
          content,
          phoneNumber: req.body.phoneNumber,
          status,
          createdBy,
        });
      } else if (type === "whatsapp") {
        communication = await communicationService.logWhatsApp({
          clientId: req.params.id,
          direction,
          content,
          phoneNumber: req.body.phoneNumber,
          status,
          createdBy,
        });
      } else if (type === "note") {
        communication = await communicationService.addNote({
          clientId: req.params.id,
          content,
          createdBy,
        });
      } else {
        // Generic communication log
        communication = await communicationService.logCommunication({
          clientId: req.params.id,
          type,
          direction,
          subject,
          content,
          status,
          duration,
          metadata,
          createdBy,
        });
      }

      res.json({ success: true, communication });
    } catch (error) {
      console.error('Create communication error:', error);
      res.status(500).json({ error: "Failed to create communication" });
    }
  });

  app.get("/api/clients/:id/communications/stats", async (req, res) => {
    try {
      await ensureCrmTables();
      const { communicationService } = await import("./services/communication-service");
      const stats = await communicationService.getCommunicationStats(req.params.id);
      res.json({ success: true, stats });
    } catch (error) {
      console.error('Get communication stats error:', error);
      res.status(500).json({ error: "Failed to fetch communication stats" });
    }
  });

  app.patch("/api/communications/:id/status", async (req, res) => {
    try {
      await ensureCrmTables();
      const { communicationService } = await import("./services/communication-service");
      const { status } = req.body;
      const success = await communicationService.updateStatus(req.params.id, status);
      res.json({ success });
    } catch (error) {
      console.error('Update communication status error:', error);
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  // Partner routes
  app.get("/api/partners/eligibility/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const eligibility = await partnerService.checkEligibility(userId);
      res.json(eligibility);
    } catch (error) {
      console.error('Partner eligibility error:', error);
      res.status(500).json({ error: "Failed to check partner eligibility" });
    }
  });

  app.post("/api/partners/convert", async (req, res) => {
    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const result = await partnerService.convertToPartner(userId);
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Partner conversion error:', error);
      res.status(500).json({ error: "Failed to convert to partner" });
    }
  });

  app.post("/api/partners/apply", async (req, res) => {
    try {
      const { userId, reason, experience } = req.body;
      if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
      }
      const result = await partnerService.applyToBecomePartner(userId, {
        reason,
        experience,
      });
      res.json(result);
    } catch (error) {
      console.error('Partner application error:', error);
      res.status(500).json({ error: "Failed to process partner application" });
    }
  });

  app.get("/api/partners/stats/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const stats = await partnerService.getPartnerStats(userId);
      res.json(stats);
    } catch (error) {
      console.error('Partner stats error:', error);
      res.status(500).json({ error: "Failed to get partner stats" });
    }
  });

  // HighLevel webhook routes
  app.post("/api/webhooks/highlevel/contact", async (req, res) => {
    try {
      await handleHighLevelContactWebhook(req, res);
    } catch (error) {
      console.error('HighLevel contact webhook error:', error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  app.post("/api/webhooks/highlevel/tags", async (req, res) => {
    try {
      await handleHighLevelTagWebhook(req, res);
    } catch (error) {
      console.error('HighLevel tag webhook error:', error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Payment webhook handlers - integrate with Stripe/PayPal when payment processing is implemented
  app.post("/api/webhooks/stripe", async (req, res) => {
    try {
      const event = req.body;
      
      // Handle different Stripe event types
      switch (event.type) {
        case 'checkout.session.completed':
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          // Handle subscription creation/update
          const customerId = event.data.object.customer;
          const subscriptionType = event.data.object.items?.data[0]?.price?.recurring?.interval === 'month' 
            ? 'MONTHLY' 
            : event.data.object.items?.data[0]?.price?.recurring?.interval === 'year'
            ? 'ANNUAL'
            : 'MONTHLY';
          
          // Find user by Stripe customer ID
          const userResult = await db.execute(
            'SELECT * FROM users WHERE stripe_customer_id = $1',
            [customerId]
          );
          
          if (userResult.rows.length > 0) {
            const userId = userResult.rows[0].id;
            // Update user subscription and sync to CRM
            await userLifecycleService.handlePurchaseEvent({
              userId,
              subscriptionType: subscriptionType as "MONTHLY" | "ANNUAL" | "LIFETIME",
              stripeCustomerId: customerId,
            });
          }
          break;
          
        case 'customer.subscription.deleted':
          // Handle subscription cancellation
          const cancelledCustomerId = event.data.object.customer;
          const cancelledUserResult = await db.execute(
            'SELECT * FROM users WHERE stripe_customer_id = $1',
            [cancelledCustomerId]
          );
          
          if (cancelledUserResult.rows.length > 0) {
            const cancelledUserId = cancelledUserResult.rows[0].id;
            await userLifecycleService.updateSubscriptionStatus(cancelledUserId, 'CANCELLED');
          }
          break;
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  app.post("/api/webhooks/paypal", async (req, res) => {
    try {
      const event = req.body;
      
      // TODO: Implement PayPal webhook handling
      // Similar structure to Stripe webhook but using PayPal event types
      // Handle subscription.created, subscription.updated, subscription.cancelled
      
      console.log('PayPal webhook received:', event.event_type);
      res.json({ received: true });
    } catch (error) {
      console.error('PayPal webhook error:', error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/quiz", async (req, res) => {
    try {
      const analytics = await tempStorage.getQuizAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error('Quiz analytics API error:', error);
      res.status(500).json({ error: "Failed to fetch quiz analytics" });
    }
  });

  // Exam analytics endpoint
  app.get("/api/analytics/exams", async (req, res) => {
    try {
      const analytics = await tempStorage.getQuizAnalytics();
      // Extract just exam-related data
      res.json({
        examStats: analytics.examStats || [],
        recentExamAttempts: analytics.recentExamAttempts || [],
      });
    } catch (error) {
      console.error('Exam analytics API error:', error);
      res.status(500).json({ error: "Failed to fetch exam analytics" });
    }
  });

  // Content generation & validation (admin placeholder endpoints)
  app.post("/api/content/generate-all", generateAllContent);
  app.post("/api/content/generate-track/:trackSlug", generateTrackContent);
  app.post("/api/content/generate-pdf/:lessonId", generatePdf);
  app.post("/api/content/generate-podcast/:lessonId", generatePodcast);
  app.post("/api/content/batch-generate-pdfs", batchGeneratePdfs);
  app.post("/api/content/regenerate-track-pdfs/:trackSlug", regenerateTrackPdfs);
  app.get("/api/content/generation-history/:lessonId", getGenerationHistory);
  app.get("/api/content/validation/:lessonId", validateLessonContent);
  app.get("/api/content/review-queue", getReviewQueue);

  // User progress routes
  app.get("/api/users/current/progress", async (req, res) => {
    try {
      // Get user email from query params or localStorage
      const email = req.query.email as string || req.headers['x-user-email'] as string || 'lalabalavu.jon@gmail.com';
      
      // Get user ID (use email as userId for consistency)
      let userId = email;
      if (email === 'lalabalavu.jon@gmail.com' || email === 'sephdee@hotmail.com') {
        userId = email === 'lalabalavu.jon@gmail.com' ? 'super-admin-1' : 'super-admin-2';
      }
      
      const progress = await tempStorage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error('User progress API error:', error);
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });

  // Track progress endpoint - calculate completion percentage for a specific track
  app.get("/api/tracks/:slug/progress", async (req, res) => {
    try {
      const { slug } = req.params;
      const email = req.query.email as string || req.headers['x-user-email'] as string || 'lalabalavu.jon@gmail.com';
      
      let userId = email;
      if (email === 'lalabalavu.jon@gmail.com' || email === 'sephdee@hotmail.com') {
        userId = email === 'lalabalavu.jon@gmail.com' ? 'super-admin-1' : 'super-admin-2';
      }

      // Get track by slug
      const track = await tempStorage.getTrackBySlug(slug);
      if (!track) {
        return res.status(404).json({ error: "Track not found" });
      }

      // Calculate track progress
      const progress = await tempStorage.getUserProgress(userId);
      const trackProgressData = progress.trackProgress?.find(tp => tp.track_slug === slug);

      res.json({
        trackId: track.id,
        trackTitle: track.title,
        trackSlug: slug,
        totalLessons: trackProgressData?.total_lessons || 0,
        completedLessons: trackProgressData?.completed_lessons || 0,
        completionPercentage: trackProgressData?.completion_percentage || 0,
      });
    } catch (error) {
      console.error('Track progress API error:', error);
      res.status(500).json({ error: "Failed to fetch track progress" });
    }
  });

  // Admin routes
  app.get("/api/admin/invites", async (req, res) => {
    try {
      const invites = await tempStorage.getAllInvites();
      res.json(invites);
    } catch (error) {
      console.error('Admin invites API error:', error);
      res.status(500).json({ error: "Failed to fetch invites" });
    }
  });

  app.post("/api/admin/invites", async (req, res) => {
    try {
      const inviteData = insertInviteSchema.parse(req.body);
      const invite = await storage.createInvite(inviteData);
      res.status(201).json(invite);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create invite" });
    }
  });

  app.delete("/api/admin/invites/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInvite(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete invite" });
    }
  });

  // ============================================================================
  // Feature Management API Endpoints
  // ============================================================================
  
  // Get all available features (from registry)
  app.get("/api/admin/features", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const features = getAllFeatures();
      res.json({ features });
    } catch (error) {
      console.error("Features API error:", error);
      res.status(500).json({ error: "Failed to fetch features" });
    }
  });

  // Get role default permissions
  app.get("/api/admin/role-defaults", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const role = req.query.role as string;
      if (!role) {
        return res.status(400).json({ error: "Role parameter is required" });
      }

      const defaults = await featureService.getRoleDefaults(role);
      const allFeatures = getAllFeatures();
      
      // Build response with all features and their default state
      const roleDefaults = allFeatures.map((feature) => {
        const defaultPerm = defaults.find((d: any) => d.featureId === feature.id);
        return {
          featureId: feature.id,
          enabled: defaultPerm?.enabled ?? false,
        };
      });

      res.json({ role, defaults: roleDefaults });
    } catch (error) {
      console.error("Role defaults API error:", error);
      res.status(500).json({ error: "Failed to fetch role defaults" });
    }
  });

  // Update role default permissions
  app.put("/api/admin/role-defaults", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const { role, defaults } = req.body;
      if (!role || !Array.isArray(defaults)) {
        return res.status(400).json({ error: "Invalid request data" });
      }

      // Update each feature default
      for (const defaultPerm of defaults) {
        await featureService.updateRoleDefault(
          role,
          defaultPerm.featureId,
          defaultPerm.enabled
        );
      }

      res.json({ success: true, role, defaults });
    } catch (error) {
      console.error("Role defaults update error:", error);
      res.status(500).json({ error: "Failed to update role defaults" });
    }
  });

  // Get global feature flags (public endpoint for client-side checking)
  app.get("/api/global-features", async (req, res) => {
    try {
      const { getGlobalFeatureFlags } = featureService;
      const globalFlags = await getGlobalFeatureFlags();
      res.json(globalFlags);
    } catch (error) {
      console.error("Global features API error:", error);
      res.status(500).json({ error: "Failed to fetch global feature flags" });
    }
  });

  // Get global feature flags (admin endpoint with metadata)
  app.get("/api/admin/global-features", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const { getAllFeatures } = await import("./feature-registry");
      const allFeatures = getAllFeatures();
      
      // Get global flags from database using feature service
      const { getGlobalFeatureFlags } = featureService;
      const globalFlags = await getGlobalFeatureFlags();
      
      // Get detailed flag info from database (for updatedAt/updatedBy)
      const isSQLiteDev = process.env.NODE_ENV === "development";
      const schemaModule = await import("@shared/schema");
      const schemaSQLiteModule = await import("@shared/schema-sqlite");
      const { globalFeatureFlags: globalFeatureFlagsPg } = schemaModule;
      const { globalFeatureFlags: globalFeatureFlagsSQLite } = schemaSQLiteModule;
      
      const dbFlags = isSQLiteDev
        ? await db.select().from(globalFeatureFlagsSQLite)
        : await db.select().from(globalFeatureFlagsPg);

      // Build map of featureId -> flag data (for metadata like updatedAt/updatedBy)
      const flagMetadataMap = new Map(dbFlags.map(f => [f.featureId, f]));

      // Build response with feature metadata
      const flagsWithMetadata = allFeatures.map(feature => {
        const flagData = flagMetadataMap.get(feature.id);
        const updatedAt = flagData?.updatedAt 
          ? (flagData.updatedAt instanceof Date ? flagData.updatedAt.toISOString() : new Date(flagData.updatedAt as number).toISOString())
          : null;
        
        return {
          featureId: feature.id,
          name: feature.name,
          description: feature.description,
          category: feature.category,
          enabled: globalFlags[feature.id] ?? true,
          updatedAt,
          updatedBy: flagData?.updatedBy || null,
        };
      });

      res.json({ flags: flagsWithMetadata });
    } catch (error) {
      console.error("Global features API error:", error);
      res.status(500).json({ error: "Failed to fetch global feature flags" });
    }
  });

  // Update single global feature flag
  app.put("/api/admin/global-features/:featureId", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const { featureId } = req.params;
      const { enabled } = req.body;

      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ error: "enabled must be a boolean" });
      }

      const { updateGlobalFeatureFlag } = featureService;
      await updateGlobalFeatureFlag(featureId, enabled, userEmail);

      res.json({ success: true, featureId, enabled, updatedBy: userEmail });
    } catch (error) {
      console.error("Global feature update error:", error);
      res.status(500).json({ error: "Failed to update global feature flag" });
    }
  });

  // Bulk update global feature flags
  app.put("/api/admin/global-features", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const { flags, updatedBy } = req.body;

      if (!Array.isArray(flags)) {
        return res.status(400).json({ error: "flags must be an array" });
      }

      const { updateGlobalFeatureFlag } = featureService;
      const updateBy = updatedBy || userEmail;
      const results: any[] = [];
      const errors: any[] = [];

      // Update each flag
      for (const flag of flags) {
        try {
          if (typeof flag.featureId !== 'string' || typeof flag.enabled !== 'boolean') {
            errors.push({ featureId: flag.featureId, error: "Invalid flag data" });
            continue;
          }
          await updateGlobalFeatureFlag(flag.featureId, flag.enabled, updateBy);
          results.push({ featureId: flag.featureId, enabled: flag.enabled });
        } catch (error: any) {
          errors.push({ featureId: flag.featureId, error: error.message });
        }
      }

      res.json({
        success: true,
        updated: results.length,
        flags: results,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      console.error("Bulk global features update error:", error);
      res.status(500).json({ error: "Failed to update global feature flags" });
    }
  });

  // Update user role (Super Admin only)
  app.put("/api/admin/users/:userId/role", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const { userId } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ error: "Role is required" });
      }

      // Validate role enum
      const validRoles = ['USER', 'ENTERPRISE', 'AFFILIATE', 'LIFETIME'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
      }

      // Find user by userId or email
      const targetUser = userManagement.getSpecialUser(userId) || 
                        Array.from(userManagement.getAllSpecialUsers()).find((u: any) => u.id === userId);

      if (!targetUser) {
        // User not in special users - try to update database
        // Check if user exists in database
        const isSQLiteDev = process.env.NODE_ENV === "development";
        const { users: usersPg } = await import("@shared/schema");
        const { users: usersSQLite } = await import("@shared/schema-sqlite");
        
        try {
          const dbUser = isSQLiteDev
            ? await db.select().from(usersSQLite).where(eq(usersSQLite.email, userId)).limit(1)
            : await db.select().from(usersPg).where(eq(usersPg.email, userId)).limit(1);

          if (dbUser.length > 0) {
            // Update database user
            if (isSQLiteDev) {
              await db.update(usersSQLite)
                .set({ role: role as any, updatedAt: new Date() })
                .where(eq(usersSQLite.email, userId));
            } else {
              await db.update(usersPg)
                .set({ role: role as any, updatedAt: new Date() })
                .where(eq(usersPg.email, userId));
            }

            return res.json({
              success: true,
              userId,
              email: userId,
              role,
              message: "Role updated in database",
            });
          }
        } catch (error: any) {
          console.error("Error updating database user role:", error);
          return res.status(500).json({ error: "Failed to update user role in database" });
        }

        return res.status(404).json({ error: "User not found" });
      }

      // Validate role change
      if (!userManagement.canChangeRole(targetUser.email, role)) {
        return res.status(400).json({ error: `Cannot change role to ${role} for this user` });
      }

      // Update in userManagement service
      const updatedUser = await userManagement.updateUserRole(targetUser.email, role);

      // Also update database if user exists there
      const isSQLiteDev = process.env.NODE_ENV === "development";
      const { users: usersPg } = await import("@shared/schema");
      const { users: usersSQLite } = await import("@shared/schema-sqlite");

      try {
        if (isSQLiteDev) {
          await db.update(usersSQLite)
            .set({ role: role as any, updatedAt: new Date() })
            .where(eq(usersSQLite.email, targetUser.email));
        } else {
          await db.update(usersPg)
            .set({ role: role as any, updatedAt: new Date() })
            .where(eq(usersPg.email, targetUser.email));
        }
      } catch (error: any) {
        // Database update failed but userManagement updated - log warning
        console.warn(`Role updated in userManagement but database update failed for ${targetUser.email}:`, error);
      }

      return res.json({
        success: true,
        user: updatedUser,
        role,
        message: "Role updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating user role:", error);
      res.status(500).json({ error: error.message || "Failed to update user role" });
    }
  });

  // Get user permissions - returns Partner Admins, Enterprise Users with merged permissions
  // Only accessible to SUPER_ADMIN
  app.get("/api/admin/user-permissions", async (req, res) => {
    try {
      // Check if user is SUPER_ADMIN
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      // Check if we should include all users (for role management)
      const includeAllUsers = req.query.includeAllUsers === 'true';

      // Get managed users (Partner Admins, Enterprise Users, and optionally all users)
      const allSpecialUsers = userManagement.getAllSpecialUsers();
      let managedUsers: any[] = allSpecialUsers.filter((user: any) => 
        user.role === "AFFILIATE" || 
        user.role === "ENTERPRISE" || 
        (user.role === "LIFETIME" && user.email !== 'lalabalavu.jon@gmail.com' && user.email !== 'sephdee@hotmail.com')
      );

      // If includeAllUsers is true, also fetch regular users from database
      if (includeAllUsers) {
        try {
          const isSQLiteDev = process.env.NODE_ENV === "development";
          const { users: usersPg } = await import("@shared/schema");
          const { users: usersSQLite } = await import("@shared/schema-sqlite");

          const dbUsers = isSQLiteDev
            ? await db.select().from(usersSQLite).limit(100) // Limit to prevent huge responses
            : await db.select().from(usersPg).limit(100);

          // Filter out users already in special users
          const specialUserEmails = new Set(allSpecialUsers.map((u: any) => u.email));
          const regularUsers = dbUsers
            .filter(dbUser => !specialUserEmails.has(dbUser.email))
            .map(dbUser => ({
              id: dbUser.id,
              email: dbUser.email,
              name: dbUser.name || 'Unknown User',
              role: dbUser.role,
              subscriptionType: dbUser.subscriptionType,
              subscriptionStatus: dbUser.subscriptionStatus || 'ACTIVE',
              createdAt: dbUser.createdAt,
              updatedAt: dbUser.updatedAt,
            }));

          // Merge regular users with managed users
          managedUsers = [...managedUsers, ...regularUsers];
        } catch (error: any) {
          console.error("Error fetching all users for role management:", error);
          // Continue with just special users if database query fails
        }
      }

      // Resolve permissions for each user
      const usersWithPermissions = await Promise.all(
        managedUsers.map(async (user: any) => {
          // Get user ID - need to find actual user ID from database or use email
          const userId = user.id || user.email;
          const permissions = await featureService.resolveUserPermissions(userId, user.role);
          
          // Map role enum to display name
          const roleDisplayMap: Record<string, string> = {
            "AFFILIATE": "Partner Admin",
            "ENTERPRISE": "Enterprise User",
            "LIFETIME": "Lifetime",
            "USER": "User",
            "ADMIN": "Admin",
            "SUPER_ADMIN": "Super Admin",
          };
          
          return {
            id: userId,
            name: user.name || 'Unknown User',
            email: user.email,
            role: roleDisplayMap[user.role] || user.role,
            permissions,
          };
        })
      );

      res.json({ users: usersWithPermissions });
    } catch (error) {
      console.error("User permissions API error:", error);
      res.status(500).json({ error: "Failed to fetch user permissions" });
    }
  });

  // Update individual user feature overrides
  app.put("/api/admin/user-permissions/:userId", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const { userId } = req.params;
      const { permissions } = req.body;

      if (!permissions || typeof permissions !== "object") {
        return res.status(400).json({ error: "Invalid permissions data" });
      }

      // Update each feature override
      const allFeatures = getAllFeatures();
      for (const feature of allFeatures) {
        const enabled = permissions[feature.id];
        if (enabled !== undefined) {
          // If value matches role default, set to null (use default)
          // Otherwise, set the override
          const userData = userManagement.getAllSpecialUsers().find((u: any) => u.id === userId || u.email === userId);
          if (userData) {
            const roleDefaults = await featureService.getRoleDefaults(userData.role);
            const defaultPerm = roleDefaults.find((d) => d.featureId === feature.id);
            const defaultEnabled = defaultPerm?.enabled ?? false;
            
            if (enabled === defaultEnabled) {
              // Reset to role default
              await featureService.updateUserOverride(userId, feature.id, null);
            } else {
              // Set override
              await featureService.updateUserOverride(userId, feature.id, enabled);
            }
          }
        }
      }

      res.json({ success: true, userId });
    } catch (error) {
      console.error("User permissions update error:", error);
      res.status(500).json({ error: "Failed to update user permissions" });
    }
  });

  // Reset user to role defaults
  app.post("/api/admin/user-permissions/:userId/reset", async (req, res) => {
    try {
      const userEmail = req.query.email as string;
      if (!userEmail) {
        return res.status(401).json({ error: "User email is required" });
      }

      const user = userManagement.getSpecialUser(userEmail);
      if (!user || user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: "Access denied. SUPER_ADMIN role required." });
      }

      const { userId } = req.params;
      await featureService.resetUserToRoleDefaults(userId);

      res.json({ success: true, userId });
    } catch (error) {
      console.error("Reset user permissions error:", error);
      res.status(500).json({ error: "Failed to reset user permissions" });
    }
  });

  // Object storage routes
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const { ObjectStorageService } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      const { ObjectStorageService, ObjectNotFoundError } = await import("./objectStorage");
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof Error && error.name === 'ObjectNotFoundError') {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Profile update routes
  app.put("/api/users/profile", async (req, res) => {
    try {
      const { name, email, phone, bio, company, jobTitle, location, currentEmail } = req.body;
      const userEmail = req.headers['x-user-email'] || currentEmail || email;
      
      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      // Get existing profile or create new one
      const existingProfile = userProfileStore.get(userEmail) || {};
      
      // Update profile data
      const updatedProfile = {
        ...existingProfile,
        name: name || existingProfile.name || '',
        email: email || userEmail,
        phone: phone !== undefined ? phone : existingProfile.phone || '',
        bio: bio !== undefined ? bio : existingProfile.bio || '',
        company: company !== undefined ? company : existingProfile.company || '',
        jobTitle: jobTitle !== undefined ? jobTitle : existingProfile.jobTitle || '',
        location: location !== undefined ? location : existingProfile.location || '',
        updatedAt: new Date().toISOString(),
      };

      // Store updated profile
      userProfileStore.set(userEmail, updatedProfile);

      // Determine role and subscription type - SUPER ADMIN ACCOUNT (DO NOT CHANGE)
      const role = (userEmail === 'lalabalavu.jon@gmail.com' || userEmail === 'sephdee@hotmail.com') ? 'SUPER_ADMIN' : 'USER';
      const subscriptionType = (userEmail === 'lalabalavu.jon@gmail.com' || userEmail === 'sephdee@hotmail.com') ? 'LIFETIME' : 'TRIAL';

      const updatedUser = {
        id: userEmail === 'lalabalavu.jon@gmail.com' ? 'super-admin-1' : userEmail === 'sephdee@hotmail.com' ? 'super-admin-2' : 'user-1',
        ...updatedProfile,
        role,
        subscriptionType,
      };

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.put("/api/users/profile-picture", async (req, res) => {
    try {
      const { profilePictureURL } = req.body;
      const userEmail = req.headers['x-user-email'] as string;
      
      if (!profilePictureURL) {
        return res.status(400).json({ error: "Profile picture URL is required" });
      }

      if (!userEmail) {
        return res.status(400).json({ error: "User email is required" });
      }

      // Handle profile picture URL (gravatar, data URLs, or object storage URLs)
      let normalizedPath = profilePictureURL;
      
      // If it's not "gravatar" and not a data URL, normalize object storage URLs
      if (profilePictureURL !== 'gravatar' && !profilePictureURL.startsWith('data:')) {
        const { ObjectStorageService } = await import("./objectStorage");
        const objectStorageService = new ObjectStorageService();
        normalizedPath = objectStorageService.normalizeObjectEntityPath(profilePictureURL);
      }

      // Get existing profile or create new one
      const existingProfile = userProfileStore.get(userEmail) || {};
      
      // Update profile picture
      const updatedProfile = {
        ...existingProfile,
        profilePictureUrl: normalizedPath,
        updatedAt: new Date().toISOString(),
      };

      // Store updated profile
      userProfileStore.set(userEmail, updatedProfile);

      // Determine role and subscription type - SUPER ADMIN ACCOUNT (DO NOT CHANGE)
      const role = (userEmail === 'lalabalavu.jon@gmail.com' || userEmail === 'sephdee@hotmail.com') ? 'SUPER_ADMIN' : 'USER';
      const subscriptionType = (userEmail === 'lalabalavu.jon@gmail.com' || userEmail === 'sephdee@hotmail.com') ? 'LIFETIME' : 'TRIAL';

      const updatedUser = {
        id: userEmail === 'lalabalavu.jon@gmail.com' ? 'super-admin-1' : userEmail === 'sephdee@hotmail.com' ? 'super-admin-2' : 'user-1',
        ...updatedProfile,
        name: existingProfile.name || (userEmail === 'lalabalavu.jon@gmail.com' ? 'Jon Lalabalavu' : userEmail === 'sephdee@hotmail.com' ? 'Jon Lalabalavu' : 'User'),
        email: userEmail,
        role,
        subscriptionType,
        profilePictureUrl: getProfilePictureUrl(normalizedPath, userEmail), // Convert "gravatar" to actual URL
      };

      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ error: "Failed to update profile picture" });
    }
  });

  // Current user route
  app.get("/api/users/current", async (req, res) => {
    try {
      const email = req.query.email as string;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Normalize email (lowercase, trim)
      const normalizedEmail = email.toLowerCase().trim();

      // CRITICAL FIX: Always check for SUPER_ADMIN emails FIRST before any other lookup
      // This ensures SUPER_ADMIN role is never overridden by database or other checks
      const isSuperAdminEmail = normalizedEmail === 'lalabalavu.jon@gmail.com' || normalizedEmail === 'sephdee@hotmail.com';
      
      if (isSuperAdminEmail) {
        // Get stored profile data
        const storedProfile = userProfileStore.get(normalizedEmail) || {};
        
        // Return SUPER_ADMIN user directly
        const superAdminUser = {
          id: normalizedEmail === 'lalabalavu.jon@gmail.com' ? 'super-admin-1' : 'super-admin-2',
          name: storedProfile.name || 'Jon Lalabalavu',
          email: normalizedEmail,
          role: 'SUPER_ADMIN',
          subscriptionType: 'LIFETIME',
          subscriptionStatus: 'ACTIVE',
          subscriptionDate: new Date('2024-01-01').toISOString(),
          trialExpiresAt: null,
          phone: storedProfile.phone || '',
          bio: storedProfile.bio || '',
          company: storedProfile.company || '',
          jobTitle: storedProfile.jobTitle || '',
          location: storedProfile.location || '',
          profilePictureUrl: getProfilePictureUrl(storedProfile.profilePictureUrl, normalizedEmail),
          createdAt: storedProfile.createdAt || new Date('2024-01-01').toISOString(),
          updatedAt: storedProfile.updatedAt || new Date('2024-01-01').toISOString(),
        };
        
        console.log(`[GET /api/users/current] ✅ SUPER_ADMIN user returned directly for: ${normalizedEmail}`);
        return res.json(superAdminUser);
      }

      // Get stored profile data
      const storedProfile = userProfileStore.get(normalizedEmail) || {};
      
      // Base user data
      let baseUser: any;
      
      // Check if user is in special users (Super Admin, Partner Admin, Lifetime, Enterprise)
      // All special users are managed by Super Admin and controlled through userManagement
      const specialUser = userManagement.getSpecialUser(normalizedEmail);
      
      // Debug logging
      console.log(`[GET /api/users/current] Email: ${normalizedEmail}, Special user found: ${!!specialUser}, Role: ${specialUser?.role || 'NONE'}`);
      
      if (specialUser) {
        // User is a special user (Super Admin, Partner Admin, Lifetime, or Enterprise)
        baseUser = {
          id: specialUser.id,
          name: storedProfile.name || specialUser.name,
          email: normalizedEmail,
          role: specialUser.role, // SUPER_ADMIN, AFFILIATE, LIFETIME, or ENTERPRISE
          subscriptionType: specialUser.subscriptionType || 'LIFETIME',
          subscriptionDate: new Date('2024-01-01').toISOString(),
          trialExpiresAt: null,
          createdAt: storedProfile.createdAt || specialUser.createdAt?.toISOString() || new Date('2024-01-01').toISOString(),
        };
      }
      // Default trial user (not in special users)
      else {
        console.log(`[GET /api/users/current] User ${normalizedEmail} not found in special users, returning USER role`);
        baseUser = {
          id: 'trial-user',
          name: storedProfile.name || 'Trial User',
          email: normalizedEmail,
          role: 'USER',
          subscriptionType: 'TRIAL',
          subscriptionDate: null,
          trialExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: storedProfile.createdAt || new Date().toISOString(),
        };
      }

      // Merge with stored profile data
      const user = {
        ...baseUser,
        phone: storedProfile.phone || '',
        bio: storedProfile.bio || '',
        company: storedProfile.company || '',
        jobTitle: storedProfile.jobTitle || '',
        location: storedProfile.location || '',
        profilePictureUrl: getProfilePictureUrl(storedProfile.profilePictureUrl, email),
        updatedAt: storedProfile.updatedAt || baseUser.createdAt,
      };

      res.json(user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ error: "Failed to fetch current user" });
    }
  });

  // Get user feature permissions
  app.get("/api/users/current/permissions", async (req, res) => {
    try {
      const email = req.query.email as string;
      const previewRole = req.query.previewRole as string | undefined;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Get user from user management service
      const user = userManagement.getSpecialUser(email);
      
      // Determine the role to use
      const roleToUse = previewRole || user?.role || 'USER';
      
      // SUPER_ADMIN always gets all features enabled
      if (roleToUse === 'SUPER_ADMIN') {
        const { getAllFeatures } = await import("./feature-registry");
        const allFeatures = getAllFeatures();
        const allPermissions: Record<string, boolean> = {};
        
        // Enable all features for SUPER_ADMIN
        allFeatures.forEach(feature => {
          allPermissions[feature.id] = true;
        });
        
        return res.json(allPermissions);
      }
      
      // If user not found in special users, return default USER permissions
      if (!user) {
        try {
          const defaultPermissions = await resolveUserPermissions(email, 'USER');
          // Ensure we return flat permissions object
          return res.json(defaultPermissions);
        } catch (error) {
          console.error("Error resolving default permissions:", error);
          // Return empty permissions object if resolution fails
          return res.json({});
        }
      }

      const userId = user.id || email;

      // Resolve permissions for the role (includes global flag checks)
      // Global flags are already checked inside resolveUserPermissions
      // SUPER_ADMIN is exempt from global flags
      const permissions = await resolveUserPermissions(userId, roleToUse);

      // Ensure we return flat permissions object (not nested)
      res.json(permissions);
    } catch (error: any) {
      console.error("Error fetching user permissions:", error);
      console.error("Error stack:", error.stack);
      // Return empty permissions object instead of nested structure
      res.json({});
    }
  });

  // GPT Access routes
  app.get("/api/gpt-access/token", async (req, res) => {
    try {
      const email = req.query.email as string || req.headers['x-user-email'] as string;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Get user from database
      const userResult = await db
        .select()
        .from(usersSQLite)
        .where(eq(usersSQLite.email, email.toLowerCase().trim()))
        .limit(1);

      if (userResult.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = userResult[0];

      // Check if user already has an active token
      const activeToken = await gptAccessService.getUserActiveToken(user.id);
      
      if (activeToken) {
        return res.json({
          token: activeToken.token,
          expiresAt: activeToken.expiresAt,
          accessLink: activeToken.accessLink,
        });
      }

      // Generate new token
      const tokenData = await gptAccessService.generateAccessToken(user.id);
      
      res.json({
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        accessLink: tokenData.accessLink,
      });
    } catch (error: any) {
      console.error("Error generating GPT access token:", error);
      if (error.message === "User does not have an active subscription") {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to generate access token" });
    }
  });

  app.get("/api/gpt-access/link", async (req, res) => {
    try {
      const email = req.query.email as string || req.headers['x-user-email'] as string;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Get user from database
      const userResult = await db
        .select()
        .from(usersSQLite)
        .where(eq(usersSQLite.email, email.toLowerCase().trim()))
        .limit(1);

      if (userResult.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = userResult[0];

      // Get or generate token
      let activeToken = await gptAccessService.getUserActiveToken(user.id);
      
      if (!activeToken) {
        // Generate new token if none exists
        const tokenData = await gptAccessService.generateAccessToken(user.id);
        activeToken = {
          token: tokenData.token,
          expiresAt: tokenData.expiresAt,
          accessLink: tokenData.accessLink,
        };
      }

      res.json({
        accessLink: activeToken.accessLink,
        expiresAt: activeToken.expiresAt,
      });
    } catch (error: any) {
      console.error("Error getting GPT access link:", error);
      if (error.message === "User does not have an active subscription") {
        return res.status(403).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to get access link" });
    }
  });

  app.post("/api/gpt-access/revoke", async (req, res) => {
    try {
      const email = req.query.email as string || req.headers['x-user-email'] as string;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Get user from database
      const userResult = await db
        .select()
        .from(usersSQLite)
        .where(eq(usersSQLite.email, email.toLowerCase().trim()))
        .limit(1);

      if (userResult.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      const user = userResult[0];

      // Revoke all tokens for user
      await gptAccessService.revokeUserTokens(user.id, "User requested revocation");
      
      res.json({ success: true, message: "Access tokens revoked" });
    } catch (error: any) {
      console.error("Error revoking GPT access tokens:", error);
      res.status(500).json({ error: "Failed to revoke access tokens" });
    }
  });

  // Public endpoint for token validation (used by GPT)
  app.get("/api/gpt-access/validate/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      if (!token) {
        return res.status(400).json({ valid: false, message: "Token is required" });
      }

      const validation = await gptAccessService.validateToken(token);
      
      if (validation.valid) {
        return res.json({ valid: true, message: "Access granted" });
      } else {
        return res.status(401).json({ valid: false, message: validation.reason || "Access denied" });
      }
    } catch (error: any) {
      console.error("Error validating GPT access token:", error);
      res.status(500).json({ valid: false, message: "Validation error" });
    }
  });

  // User progress routes
  app.get("/api/users/:userId/progress", async (req, res) => {
    try {
      const { userId } = req.params;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });

  app.post("/api/users/:userId/progress", async (req, res) => {
    try {
      const { userId } = req.params;
      const { lessonId, score, timeSpent } = req.body;
      const progress = await tempStorage.markLessonComplete(userId, lessonId, score, timeSpent);
      res.status(201).json(progress);
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      res.status(500).json({ error: "Failed to mark lesson complete" });
    }
  });

  // Alternative endpoint for marking lesson complete
  app.post("/api/lessons/:lessonId/complete", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const email = req.body.email || req.query.email as string || req.headers['x-user-email'] as string || 'lalabalavu.jon@gmail.com';
      
      let userId = email;
      if (email === 'lalabalavu.jon@gmail.com' || email === 'sephdee@hotmail.com') {
        userId = email === 'lalabalavu.jon@gmail.com' ? 'super-admin-1' : 'super-admin-2';
      }

      const { score, timeSpent } = req.body;
      const progress = await tempStorage.markLessonComplete(userId, lessonId, score, timeSpent);
      res.status(201).json(progress);
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      res.status(500).json({ error: "Failed to mark lesson complete" });
    }
  });

  // Invite validation route
  app.get("/api/invites/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const invite = await storage.getInviteByToken(token);
      if (!invite || invite.usedAt || new Date() > invite.expiresAt) {
        return res.status(404).json({ error: "Invalid or expired invite" });
      }
      res.json(invite);
    } catch (error) {
      res.status(500).json({ error: "Failed to validate invite" });
    }
  });

  // Laura Oracle routes
  app.post("/api/laura-oracle/chat", async (req, res) => {
    try {
      const { chatWithLauraOracle } = await import('./api/laura-oracle');
      await chatWithLauraOracle(req, res);
    } catch (error) {
      console.error('Laura Oracle chat error:', error);
      res.status(500).json({ error: 'Laura Oracle service unavailable' });
    }
  });

  app.get("/api/laura-oracle/analytics", async (req, res) => {
    try {
      const { getPlatformAnalytics } = await import('./api/laura-oracle');
      await getPlatformAnalytics(req, res);
    } catch (error) {
      console.error('Laura Oracle analytics error:', error);
      res.status(500).json({ error: 'Laura Oracle analytics unavailable' });
    }
  });

  app.post("/api/laura-oracle/admin-task", async (req, res) => {
    try {
      const { executeAdminTask } = await import('./api/laura-oracle');
      await executeAdminTask(req, res);
    } catch (error) {
      console.error('Laura Oracle admin task error:', error);
      res.status(500).json({ error: 'Laura Oracle admin service unavailable' });
    }
  });

  app.post("/api/laura-oracle/learn-objectives", async (req, res) => {
    try {
      const { learnFromObjectives } = await import('./api/laura-oracle');
      await learnFromObjectives(req, res);
    } catch (error) {
      console.error('Laura Oracle learning error:', error);
      res.status(500).json({ error: 'Laura Oracle learning service unavailable' });
    }
  });

  app.get("/api/laura-oracle/info", async (req, res) => {
    try {
      const { getLauraOracleInfo } = await import('./api/laura-oracle');
      await getLauraOracleInfo(req, res);
    } catch (error) {
      console.error('Laura Oracle info error:', error);
      res.status(500).json({ error: 'Laura Oracle info unavailable' });
    }
  });

  app.post("/api/laura-oracle/voice", async (req, res) => {
    try {
      const { generateVoiceResponse } = await import('./api/laura-oracle');
      await generateVoiceResponse(req, res);
    } catch (error) {
      console.error('Laura Oracle voice error:', error);
      res.status(500).json({ error: 'Laura Oracle voice service unavailable' });
    }
  });

  // Diver Well routes
  app.post("/api/diver-well/chat", async (req, res) => {
    try {
      const { chatWithDiverWell } = await import('./api/diver-well');
      await chatWithDiverWell(req, res);
    } catch (error) {
      console.error('Diver Well chat error:', error);
      res.status(500).json({ error: 'Diver Well service unavailable' });
    }
  });

  app.get("/api/diver-well/info", async (req, res) => {
    try {
      const { getDiverWellInfo } = await import('./api/diver-well');
      await getDiverWellInfo(req, res);
    } catch (error) {
      console.error('Diver Well info error:', error);
      res.status(500).json({ error: 'Diver Well info unavailable' });
    }
  });

  app.post("/api/diver-well/voice", async (req, res) => {
    try {
      const { generateVoiceResponse } = await import('./api/diver-well');
      await generateVoiceResponse(req, res);
    } catch (error) {
      console.error('Diver Well voice error:', error);
      res.status(500).json({ error: 'Diver Well voice service unavailable' });
    }
  });

  // Register import routes for GitHub repository content
  registerImportRoutes(app);

  // User progress routes
  app.get("/api/users/:userId/progress", async (req, res) => {
    try {
      const { userId } = req.params;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user progress" });
    }
  });

  app.post("/api/users/:userId/progress", async (req, res) => {
    try {
      const { userId } = req.params;
      const { lessonId, score, timeSpent } = req.body;
      const progress = await tempStorage.markLessonComplete(userId, lessonId, score, timeSpent);
      res.status(201).json(progress);
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      res.status(500).json({ error: "Failed to mark lesson complete" });
    }
  });

  // Alternative endpoint for marking lesson complete
  app.post("/api/lessons/:lessonId/complete", async (req, res) => {
    try {
      const { lessonId } = req.params;
      const email = req.body.email || req.query.email as string || req.headers['x-user-email'] as string || 'lalabalavu.jon@gmail.com';
      
      let userId = email;
      if (email === 'lalabalavu.jon@gmail.com' || email === 'sephdee@hotmail.com') {
        userId = email === 'lalabalavu.jon@gmail.com' ? 'super-admin-1' : 'super-admin-2';
      }

      const { score, timeSpent } = req.body;
      const progress = await tempStorage.markLessonComplete(userId, lessonId, score, timeSpent);
      res.status(201).json(progress);
    } catch (error) {
      console.error('Error marking lesson complete:', error);
      res.status(500).json({ error: "Failed to mark lesson complete" });
    }
  });

  // Invite validation route
  app.get("/api/invites/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const invite = await storage.getInviteByToken(token);
      if (!invite || invite.usedAt || new Date() > invite.expiresAt) {
        return res.status(404).json({ error: "Invalid or expired invite" });
      }
      res.json(invite);
    } catch (error) {
      res.status(500).json({ error: "Failed to validate invite" });
    }
  });

  // Laura Oracle routes
  app.post("/api/laura-oracle/chat", async (req, res) => {
    try {
      const { chatWithLauraOracle } = await import('./api/laura-oracle');
      await chatWithLauraOracle(req, res);
    } catch (error) {
      console.error('Laura Oracle chat error:', error);
      res.status(500).json({ error: 'Laura Oracle service unavailable' });
    }
  });

  app.get("/api/laura-oracle/analytics", async (req, res) => {
    try {
      const { getPlatformAnalytics } = await import('./api/laura-oracle');
      await getPlatformAnalytics(req, res);
    } catch (error) {
      console.error('Laura Oracle analytics error:', error);
      res.status(500).json({ error: 'Laura Oracle analytics unavailable' });
    }
  });

  app.post("/api/laura-oracle/admin-task", async (req, res) => {
    try {
      const { executeAdminTask } = await import('./api/laura-oracle');
      await executeAdminTask(req, res);
    } catch (error) {
      console.error('Laura Oracle admin task error:', error);
      res.status(500).json({ error: 'Laura Oracle admin service unavailable' });
    }
  });

  app.post("/api/laura-oracle/learn-objectives", async (req, res) => {
    try {
      const { learnFromObjectives } = await import('./api/laura-oracle');
      await learnFromObjectives(req, res);
    } catch (error) {
      console.error('Laura Oracle learning error:', error);
      res.status(500).json({ error: 'Laura Oracle learning service unavailable' });
    }
  });

  app.get("/api/laura-oracle/info", async (req, res) => {
    try {
      const { getLauraOracleInfo } = await import('./api/laura-oracle');
      await getLauraOracleInfo(req, res);
    } catch (error) {
      console.error('Laura Oracle info error:', error);
      res.status(500).json({ error: 'Laura Oracle info unavailable' });
    }
  });

  app.post("/api/laura-oracle/voice", async (req, res) => {
    try {
      const { generateVoiceResponse } = await import('./api/laura-oracle');
      await generateVoiceResponse(req, res);
    } catch (error) {
      console.error('Laura Oracle voice error:', error);
      res.status(500).json({ error: 'Laura Oracle voice service unavailable' });
    }
  });

  // Diver Well routes
  app.post("/api/diver-well/chat", async (req, res) => {
    try {
      const { chatWithDiverWell } = await import('./api/diver-well');
      await chatWithDiverWell(req, res);
    } catch (error) {
      console.error('Diver Well chat error:', error);
      res.status(500).json({ error: 'Diver Well service unavailable' });
    }
  });

  app.get("/api/diver-well/info", async (req, res) => {
    try {
      const { getDiverWellInfo } = await import('./api/diver-well');
      await getDiverWellInfo(req, res);
    } catch (error) {
      console.error('Diver Well info error:', error);
      res.status(500).json({ error: 'Diver Well info unavailable' });
    }
  });

  app.post("/api/diver-well/voice", async (req, res) => {
    try {
      const { generateVoiceResponse } = await import('./api/diver-well');
      await generateVoiceResponse(req, res);
    } catch (error) {
      console.error('Diver Well voice error:', error);
      res.status(500).json({ error: 'Diver Well voice service unavailable' });
    }
  });

  // Register import routes for GitHub repository content
  registerImportRoutes(app);

  // Helper function to get user ID from email
  async function getUserIdFromEmail(email: string): Promise<string | null> {
    try {
      const env = process.env.NODE_ENV ?? 'development';
      const hasDatabaseUrl = !!process.env.DATABASE_URL;
      const usersTable = (env === 'development' && !hasDatabaseUrl) ? usersSQLite : users;
      
      const normalizedEmail = email.toLowerCase().trim();
      
      // CRITICAL: Check for SUPER_ADMIN emails FIRST - never create them as USER
      const isSuperAdminEmail = normalizedEmail === 'lalabalavu.jon@gmail.com' || normalizedEmail === 'sephdee@hotmail.com';
      
      // Select only the columns we need to avoid schema mismatch errors
      let user = await db.select({
        id: usersTable.id,
        email: usersTable.email,
        role: usersTable.role,
      }).from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
      
      // If no exact match, try case-insensitive (for SQLite compatibility)
      if (user.length === 0 && env === 'development' && !hasDatabaseUrl) {
        const allUsers = await db.select({
          id: usersTable.id,
          email: usersTable.email,
          role: usersTable.role,
        }).from(usersTable);
        user = allUsers.filter(u => u.email?.toLowerCase().trim() === normalizedEmail).slice(0, 1);
      }
      
      if (user.length > 0) {
        // If user exists but is SUPER_ADMIN email with wrong role, log warning (don't auto-fix to avoid breaking things)
        if (isSuperAdminEmail && user[0].role !== 'SUPER_ADMIN') {
          console.warn(`[getUserIdFromEmail] ⚠️ WARNING: SUPER_ADMIN email ${normalizedEmail} found in database with role ${user[0].role} instead of SUPER_ADMIN`);
        }
        return user[0].id;
      }
      
      // If user doesn't exist, try to create a minimal user record
      // BUT: For SUPER_ADMIN emails, use correct role
      const role = isSuperAdminEmail ? 'SUPER_ADMIN' : 'USER';
      const subscriptionType = isSuperAdminEmail ? 'LIFETIME' : 'TRIAL';
      const userId = isSuperAdminEmail 
        ? (normalizedEmail === 'lalabalavu.jon@gmail.com' ? 'super-admin-1' : 'super-admin-2')
        : `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const userName = isSuperAdminEmail ? 'Jon Lalabalavu' : email.split('@')[0];
      
      console.log(`User not found, attempting to create user for email: ${email} with role: ${role}`);
      try {
        const newUser = await db
          .insert(usersTable)
          .values({
            id: userId,
            email: normalizedEmail,
            name: userName,
            role: role,
            subscriptionType: subscriptionType,
            subscriptionStatus: 'ACTIVE',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any)
          .returning();
        
        if (newUser && newUser.length > 0) {
          console.log(`Created new user: ${newUser[0].id} with role: ${newUser[0].role}`);
          return newUser[0].id;
        }
      } catch (createError: any) {
        console.error('Error creating user:', createError);
        // If creation fails (e.g., duplicate), try to fetch again
        const retryUser = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
        if (retryUser.length > 0) {
          return retryUser[0].id;
        }
      }
      
      // Final fallback - return null to indicate user not found
      console.error('Could not find or create user for email:', email);
      return null;
    } catch (error) {
      console.error('Error getting user ID from email:', error);
      return null;
    }
  }

  // Helper function to get user ID from session token or email (for Tide Times App and XC Weather App)
  async function getUserIdFromSessionOrEmail(req: any): Promise<string | null> {
    try {
      // First, try to get from session token (cookie or Authorization header)
      const sessionToken = req.cookies?.sessionToken || 
                          req.headers?.authorization?.replace('Bearer ', '') ||
                          req.headers?.['x-session-token'];
      
      if (sessionToken) {
        const env = process.env.NODE_ENV ?? 'development';
        const hasDatabaseUrl = !!process.env.DATABASE_URL;
        const sessionsTable = (env === 'development' && !hasDatabaseUrl) ? sessionsSQLite : sessions;
        
        const session = await db
          .select()
          .from(sessionsTable)
          .where(eq(sessionsTable.sessionToken, sessionToken))
          .limit(1);
        
        if (session.length > 0) {
          const sessionData = session[0];
          // Check if session is expired
          const expires = sessionData.expires instanceof Date ? sessionData.expires : new Date(sessionData.expires);
          if (expires > new Date()) {
            return sessionData.userId;
          }
        }
      }
      
      // Fallback to email-based lookup (backward compatible)
      const email = (req.query?.email as string) || 
                    (req.body?.email as string) || 
                    (req.headers?.['x-user-email'] as string);
      
      if (email) {
        return await getUserIdFromEmail(email);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting user ID from session or email:', error);
      // Fallback to email if session lookup fails
      const email = (req.query?.email as string) || 
                    (req.body?.email as string) || 
                    (req.headers?.['x-user-email'] as string);
      if (email) {
        return await getUserIdFromEmail(email);
      }
      return null;
    }
  }

  // Helper function to get widget locations table based on environment
  function getWidgetLocationsTable() {
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    return (env === 'development' && !hasDatabaseUrl) ? widgetLocationsSQLite : widgetLocations;
  }

  // Helper function to get widget preferences table based on environment
  function getWidgetPreferencesTable() {
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    return (env === 'development' && !hasDatabaseUrl) ? widgetPreferencesSQLite : widgetPreferences;
  }

  // Helper function to ensure widget preferences table exists
  async function ensureWidgetPreferencesTable() {
    try {
      const widgetPreferencesTable = getWidgetPreferencesTable();
      // Try a simple query to check if table exists
      await db.select().from(widgetPreferencesTable).limit(1);
    } catch (error: any) {
      if (error?.message?.includes('no such table') || error?.message?.includes('does not exist')) {
        console.warn('Widget preferences table does not exist. Please run database migrations.');
      } else {
        throw error;
      }
    }
  }

  // Ensure widget_locations table exists (for SQLite)
  async function ensureWidgetLocationsTable() {
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    
    // Only need to ensure table for SQLite (PostgreSQL uses migrations)
    if (env === 'development' && !hasDatabaseUrl) {
      try {
        // Access the SQLite database instance stored in db.sqlite
        const sqliteDb = (db as any).sqlite;
        
        if (sqliteDb && typeof sqliteDb.exec === 'function') {
          // Use exec for better-sqlite3 (synchronous method)
          sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS widget_locations (
              id text PRIMARY KEY NOT NULL,
              user_id text NOT NULL,
              latitude real NOT NULL,
              longitude real NOT NULL,
              location_name text,
              is_current_location integer NOT NULL DEFAULT 0,
              created_at integer NOT NULL,
              updated_at integer NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `);
          console.log('✅ widget_locations table ensured');
        } else if (typeof (db as any).execute === 'function') {
          // Try db.execute if available (for async)
          await (db as any).execute(`
            CREATE TABLE IF NOT EXISTS widget_locations (
              id text PRIMARY KEY NOT NULL,
              user_id text NOT NULL,
              latitude real NOT NULL,
              longitude real NOT NULL,
              location_name text,
              is_current_location integer NOT NULL DEFAULT 0,
              created_at integer NOT NULL,
              updated_at integer NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `);
          console.log('✅ widget_locations table ensured (via execute)');
        } else {
          console.warn('⚠️ Could not ensure widget_locations table - SQLite database not accessible');
        }
      } catch (error: any) {
        console.error('Error ensuring widget_locations table:', error?.message || error);
        console.error('Error stack:', error?.stack);
        // Don't throw - table might already exist or be created via migrations
      }
    }
  }

  function getNavigationWaypointsTable() {
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    return (env === 'development' && !hasDatabaseUrl) ? navigationWaypointsSQLite : navigationWaypoints;
  }

  function getNavigationRoutesTable() {
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    return (env === 'development' && !hasDatabaseUrl) ? navigationRoutesSQLite : navigationRoutes;
  }

  // Ensure navigation tables exist (for SQLite)
  async function ensureNavigationTables() {
    const env = process.env.NODE_ENV ?? 'development';
    const hasDatabaseUrl = !!process.env.DATABASE_URL;
    
    if (env === 'development' && !hasDatabaseUrl) {
      try {
        const sqliteDb = (db as any).sqlite;
        if (sqliteDb && typeof sqliteDb.exec === 'function') {
          // Create navigation_waypoints table
          sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS navigation_waypoints (
              id text PRIMARY KEY NOT NULL,
              user_id text NOT NULL,
              name text NOT NULL,
              latitude real NOT NULL,
              longitude real NOT NULL,
              description text,
              created_at integer NOT NULL,
              updated_at integer NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `);
          
          // Create navigation_routes table
          // Note: Drizzle uses snake_case for SQLite column names
          sqliteDb.exec(`
            CREATE TABLE IF NOT EXISTS navigation_routes (
              id text PRIMARY KEY NOT NULL,
              user_id text NOT NULL,
              name text NOT NULL,
              waypoint_ids text NOT NULL,
              description text,
              created_at integer NOT NULL,
              updated_at integer NOT NULL,
              FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
          `);
          
          console.log('✅ Navigation tables ensured');
        }
      } catch (error: any) {
        console.error('Error ensuring navigation tables:', error?.message || error);
      }
    }
  }

  // Widget location API endpoints
  app.get("/api/widgets/location", async (req, res) => {
    try {
      // Ensure table exists before operations
      await ensureWidgetLocationsTable();
      
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const widgetLocationsTable = getWidgetLocationsTable();
      const locations = await db
        .select()
        .from(widgetLocationsTable)
        .where(eq(widgetLocationsTable.userId, userId))
        .orderBy(desc(widgetLocationsTable.updatedAt))
        .limit(1);

      if (locations.length === 0) {
        // Return 404 but don't treat it as an error - it's expected if no location is set
        return res.status(404).json({ error: "No widget location found" });
      }

      res.json(locations[0]);
    } catch (error: any) {
      console.error("Error fetching widget location:", error);
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      console.error("Error details:", {
        message: errorMessage,
        stack: error?.stack,
        query: req.query
      });
      res.status(500).json({ 
        error: "Failed to fetch widget location",
        details: errorMessage
      });
    }
  });

  app.post("/api/widgets/location", async (req, res) => {
    try {
      // Ensure table exists before operations
      await ensureWidgetLocationsTable();
      
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { latitude, longitude, locationName, isCurrentLocation } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: "Valid latitude and longitude are required" });
      }

      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ error: "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const widgetLocationsTable = getWidgetLocationsTable();
      
      console.log('Saving widget location:', {
        email,
        userId,
        latitude,
        longitude,
        locationName,
        isCurrentLocation,
        table: widgetLocationsTable === widgetLocationsSQLite ? 'SQLite' : 'PostgreSQL'
      });
      
      // Check if location already exists for this user
      const existing = await db
        .select()
        .from(widgetLocationsTable)
        .where(eq(widgetLocationsTable.userId, userId))
        .limit(1);

      console.log('Existing locations:', existing.length);

      let location;
      if (existing.length > 0) {
        // Update existing location
        console.log('Updating existing location:', existing[0].id);
        const updateResult = await db
          .update(widgetLocationsTable)
          .set({
            latitude,
            longitude,
            locationName: locationName || null,
            isCurrentLocation: isCurrentLocation || false,
            updatedAt: new Date(),
          })
          .where(eq(widgetLocationsTable.id, existing[0].id))
          .returning();
        
        if (updateResult && updateResult.length > 0) {
          location = updateResult[0];
        } else {
          // If returning doesn't work, fetch the updated record
          const [updated] = await db
            .select()
            .from(widgetLocationsTable)
            .where(eq(widgetLocationsTable.id, existing[0].id))
            .limit(1);
          location = updated;
        }
        console.log('Updated location:', location);
      } else {
        // Create new location
        console.log('Creating new location');
        const insertData = {
          userId,
          latitude,
          longitude,
          locationName: locationName || null,
          isCurrentLocation: isCurrentLocation || false,
        };
        console.log('Insert data:', insertData);
        const insertResult = await db
          .insert(widgetLocationsTable)
          .values(insertData)
          .returning();
        console.log('Insert result:', insertResult);
        
        if (insertResult && insertResult.length > 0) {
          location = insertResult[0];
        } else {
          // If returning doesn't work, fetch the created record
          const created = await db
            .select()
            .from(widgetLocationsTable)
            .where(eq(widgetLocationsTable.userId, userId))
            .orderBy(desc(widgetLocationsTable.createdAt))
            .limit(1);
          location = created[0];
        }
        console.log('Created location:', location);
      }

      if (!location) {
        throw new Error('Location was not created or updated');
      }

      res.json(location);
    } catch (error: any) {
      console.error("Error saving widget location:", error);
      const errorMessage = error?.message || error?.toString() || "Unknown error";
      const errorCode = error?.code || 'UNKNOWN';
      console.error("Error details:", {
        message: errorMessage,
        code: errorCode,
        stack: error?.stack,
        body: req.body,
        error: error
      });
      
      // Provide more specific error messages
      let statusCode = 500;
      let userMessage = "Failed to save widget location";
      
      if (errorMessage.includes('no such table') || errorMessage.includes('relation') || errorMessage.includes('does not exist')) {
        statusCode = 500;
        userMessage = "Database table not found. Please run database migrations.";
      } else if (errorMessage.includes('FOREIGN KEY') || errorMessage.includes('foreign key')) {
        statusCode = 400;
        userMessage = "Invalid user. Please ensure you are logged in.";
      } else if (errorMessage.includes('UNIQUE constraint') || errorMessage.includes('unique constraint')) {
        statusCode = 409;
        userMessage = "Location already exists for this user.";
      }
      
      res.status(statusCode).json({ 
        error: userMessage,
        details: errorMessage,
        code: errorCode
      });
    }
  });

  app.post("/api/widgets/location/gps", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { latitude, longitude, locationName } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: "Valid latitude and longitude are required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const widgetLocationsTable = getWidgetLocationsTable();
      
      // Check if location already exists for this user
      const existing = await db
        .select()
        .from(widgetLocationsTable)
        .where(eq(widgetLocationsTable.userId, userId))
        .limit(1);

      let location;
      if (existing.length > 0) {
        // Update existing location
        const [updated] = await db
          .update(widgetLocationsTable)
          .set({
            latitude,
            longitude,
            locationName: locationName || "Current Location",
            isCurrentLocation: true,
            updatedAt: new Date(),
          })
          .where(eq(widgetLocationsTable.id, existing[0].id))
          .returning();
        location = updated;
      } else {
        // Create new location
        const insertData = {
          userId,
          latitude,
          longitude,
          locationName: locationName || "Current Location",
          isCurrentLocation: true,
        };
        const [created] = await db
          .insert(widgetLocationsTable)
          .values(insertData)
          .returning();
        location = created;
      }

      res.json(location);
    } catch (error) {
      console.error("Error saving GPS location:", error);
      res.status(500).json({ error: "Failed to save GPS location" });
    }
  });

  // Navigation waypoints API endpoints
  app.get("/api/navigation/waypoints", async (req, res) => {
    try {
      // Ensure tables exist before operations
      await ensureNavigationTables();
      
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const waypointsTable = getNavigationWaypointsTable();
      
      try {
        const waypoints = await db
          .select()
          .from(waypointsTable)
          .where(eq(waypointsTable.userId, userId))
          .orderBy(waypointsTable.createdAt);

        res.json(waypoints);
      } catch (dbError: any) {
        console.error("Database error fetching waypoints:", dbError);
        // If table doesn't exist, return empty array instead of error
        if (dbError?.message?.includes('no such table') || dbError?.message?.includes('does not exist')) {
          console.log('Navigation waypoints table does not exist, returning empty array');
          return res.json([]);
        }
        throw dbError;
      }
    } catch (error: any) {
      console.error("Error fetching waypoints:", error);
      console.error("Error stack:", error?.stack);
      res.status(500).json({ 
        error: "Failed to fetch waypoints",
        details: error?.message || "Unknown error"
      });
    }
  });

  app.post("/api/navigation/waypoints", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { name, latitude, longitude, description } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      if (!name || typeof latitude !== 'number' || typeof longitude !== 'number') {
        return res.status(400).json({ error: "Name, latitude, and longitude are required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const waypointsTable = getNavigationWaypointsTable();
      const insertData = {
        userId,
        name,
        latitude,
        longitude,
        description: description || null,
      };

      const [waypoint] = await db
        .insert(waypointsTable)
        .values(insertData)
        .returning();

      res.status(201).json(waypoint);
    } catch (error) {
      console.error("Error creating waypoint:", error);
      res.status(500).json({ error: "Failed to create waypoint" });
    }
  });

  app.delete("/api/navigation/waypoints/:id", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const { id } = req.params;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const waypointsTable = getNavigationWaypointsTable();
      const deleted = await db
        .delete(waypointsTable)
        .where(and(eq(waypointsTable.id, id), eq(waypointsTable.userId, userId)))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: "Waypoint not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting waypoint:", error);
      res.status(500).json({ error: "Failed to delete waypoint" });
    }
  });

  // Navigation routes API endpoints
  app.get("/api/navigation/routes", async (req, res) => {
    try {
      // Ensure tables exist before operations
      await ensureNavigationTables();
      
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const routesTable = getNavigationRoutesTable();
      
      try {
        const routes = await db
          .select()
          .from(routesTable)
          .where(eq(routesTable.userId, userId))
          .orderBy(routesTable.createdAt);

        res.json(routes);
      } catch (dbError: any) {
        console.error("Database error fetching routes:", dbError);
        // If table doesn't exist, return empty array instead of error
        if (dbError?.message?.includes('no such table') || dbError?.message?.includes('does not exist')) {
          console.log('Navigation routes table does not exist, returning empty array');
          return res.json([]);
        }
        throw dbError;
      }
    } catch (error: any) {
      console.error("Error fetching routes:", error);
      console.error("Error stack:", error?.stack);
      res.status(500).json({ 
        error: "Failed to fetch routes",
        details: error?.message || "Unknown error"
      });
    }
  });

  app.post("/api/navigation/routes", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { name, waypointIds, description } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      if (!name || !Array.isArray(waypointIds) || waypointIds.length === 0) {
        return res.status(400).json({ error: "Name and waypointIds array are required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const routesTable = getNavigationRoutesTable();
      const insertData = {
        userId,
        name,
        waypointIds: Array.isArray(waypointIds) ? waypointIds : JSON.parse(waypointIds),
        description: description || null,
      };

      const [route] = await db
        .insert(routesTable)
        .values(insertData)
        .returning();

      res.status(201).json(route);
    } catch (error) {
      console.error("Error creating route:", error);
      res.status(500).json({ error: "Failed to create route" });
    }
  });

  app.delete("/api/navigation/routes/:id", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const { id } = req.params;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const routesTable = getNavigationRoutesTable();
      const deleted = await db
        .delete(routesTable)
        .where(and(eq(routesTable.id, id), eq(routesTable.userId, userId)))
        .returning();

      if (deleted.length === 0) {
        return res.status(404).json({ error: "Route not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting route:", error);
      res.status(500).json({ error: "Failed to delete route" });
    }
  });

  // Weather API endpoint (XC Weather App)
  app.get("/api/weather", async (req, res) => {
    try {
      let lat = parseFloat(req.query.lat as string);
      let lon = parseFloat(req.query.lon as string);
      const timezone = (req.query.timezone as string) || 'UTC';

      // Try to get user ID from session or email (enhanced authentication)
      const userId = await getUserIdFromSessionOrEmail(req);

      // If coordinates not provided, try to get from saved location
      if ((isNaN(lat) || isNaN(lon)) && userId) {
        try {
            const widgetLocationsTable = getWidgetLocationsTable();
            const locations = await db
              .select()
              .from(widgetLocationsTable)
              .where(eq(widgetLocationsTable.userId, userId))
              .orderBy(desc(widgetLocationsTable.updatedAt))
              .limit(1);
            
            if (locations.length > 0) {
              lat = locations[0].latitude;
              lon = locations[0].longitude;
          }
        } catch (error) {
          console.error("Error fetching saved location:", error);
          // Continue with fallback to timezone
        }
      }

      // Validate coordinates or convert from timezone
      let finalLat = lat;
      let finalLon = lon;

      if (isNaN(lat) || isNaN(lon)) {
        // Try to get coordinates from timezone
        const coords = weatherTimezoneToCoordinates(timezone);
        if (coords) {
          finalLat = coords.lat;
          finalLon = coords.lon;
        } else {
          return res.status(400).json({ 
            error: "Latitude and longitude are required, or provide a valid timezone, or set a widget location",
            errorCode: "MISSING_COORDINATES"
          });
        }
      }

      const weatherData = await getWeatherData(finalLat, finalLon, timezone);

      if (!weatherData) {
        return res.status(503).json({ 
          error: "Weather data unavailable. Please check API configuration.",
          errorCode: "WEATHER_API_UNAVAILABLE",
          details: "OpenWeatherMap API key may be missing or invalid"
        });
      }

      res.json(weatherData);
    } catch (error: any) {
      console.error("Error in XC Weather App endpoint:", error);
      const errorCode = error?.code || "WEATHER_FETCH_ERROR";
      const statusCode = error?.statusCode || 500;
      res.status(statusCode).json({ 
        error: "Failed to fetch weather data",
        errorCode,
        details: error?.message || "Unknown error occurred"
      });
    }
  });

  // Tides API endpoint (Tide Times App)
  app.get("/api/tides", async (req, res) => {
    try {
      let lat = parseFloat(req.query.lat as string);
      let lon = parseFloat(req.query.lon as string);
      const timezone = (req.query.timezone as string) || 'UTC';
      const forceRefresh = req.query.refresh === 'true' || req.query._refresh !== undefined;

      // Try to get user ID from session or email (enhanced authentication)
      const userId = await getUserIdFromSessionOrEmail(req);

      // If coordinates not provided, try to get from saved location
      if ((isNaN(lat) || isNaN(lon)) && userId) {
        try {
            const widgetLocationsTable = getWidgetLocationsTable();
            const locations = await db
              .select()
              .from(widgetLocationsTable)
              .where(eq(widgetLocationsTable.userId, userId))
              .orderBy(desc(widgetLocationsTable.updatedAt))
              .limit(1);
            
            if (locations.length > 0) {
              lat = locations[0].latitude;
              lon = locations[0].longitude;
          }
        } catch (error) {
          console.error("Error fetching saved location:", error);
          // Continue with fallback to timezone
        }
      }

      // Validate coordinates or convert from timezone
      let finalLat = lat;
      let finalLon = lon;

      if (isNaN(lat) || isNaN(lon)) {
        // Try to get coordinates from timezone
        const coords = tidesTimezoneToCoordinates(timezone);
        if (coords) {
          finalLat = coords.lat;
          finalLon = coords.lon;
        } else {
          return res.status(400).json({ 
            error: "Latitude and longitude are required, or provide a valid timezone, or set a widget location",
            errorCode: "MISSING_COORDINATES"
          });
        }
      }

      // Clear cache if force refresh is requested
      if (forceRefresh) {
        clearTidesCache(finalLat, finalLon);
        console.log(`🔄 Force refresh requested for tides at ${finalLat}, ${finalLon} (timezone: ${timezone})`);
      }

      // Log coordinates for Southampton debugging (using correct coordinates: 50.863714, -1.425028)
      if (Math.abs(finalLat - 50.863714) < 0.1 && Math.abs(finalLon - (-1.425028)) < 0.1) {
        console.log('🌊 Southampton Tide Request:', {
          finalLat,
          finalLon,
          timezone,
          providedLat: lat,
          providedLon: lon,
          userId,
          forceRefresh,
        });
      }

      const tideData = await getTideData(finalLat, finalLon, timezone, forceRefresh);

      if (!tideData) {
        return res.status(503).json({ 
          error: "Tide data unavailable. Please check API configuration.",
          errorCode: "TIDE_API_UNAVAILABLE",
          details: "Stormglass.io API key may be missing or invalid"
        });
      }

      res.json(tideData);
    } catch (error: any) {
      console.error("Error in Tide Times App endpoint:", error);
      const errorCode = error?.code || "TIDE_FETCH_ERROR";
      const statusCode = error?.statusCode || 500;
      res.status(statusCode).json({ 
        error: "Failed to fetch tide data",
        errorCode,
        details: error?.message || "Unknown error occurred"
      });
    }
  });

  // Widget Preferences API endpoints
  app.get("/api/widgets/preferences", async (req, res) => {
    try {
      await ensureWidgetPreferencesTable();
      
      const userId = await getUserIdFromSessionOrEmail(req);
      if (!userId) {
        return res.status(401).json({ 
          error: "Authentication required",
          errorCode: "UNAUTHORIZED"
        });
      }

      const widgetPreferencesTable = getWidgetPreferencesTable();
      const preferences = await db
        .select()
        .from(widgetPreferencesTable)
        .where(eq(widgetPreferencesTable.userId, userId))
        .limit(1);

      if (preferences.length === 0) {
        // Return default preferences if none exist
        const defaultPreferences = {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          clockType: 'digital' as const,
          enableWeather: false,
          enableTides: false,
          enableMoonPhase: false,
          enableNavigation: false,
          enableAis: false,
          weatherAlertsEnabled: true,
          tideAlertsEnabled: true,
        };
        return res.json(defaultPreferences);
      }

      res.json(preferences[0]);
    } catch (error: any) {
      console.error("Error fetching widget preferences:", error);
      res.status(500).json({ 
        error: "Failed to fetch widget preferences",
        errorCode: "PREFERENCES_FETCH_ERROR",
        details: error?.message
      });
    }
  });

  app.post("/api/widgets/preferences", async (req, res) => {
    try {
      await ensureWidgetPreferencesTable();
      
      const userId = await getUserIdFromSessionOrEmail(req);
      if (!userId) {
        return res.status(401).json({ 
          error: "Authentication required",
          errorCode: "UNAUTHORIZED"
        });
      }

      const {
        timezone,
        clockType,
        enableWeather,
        enableTides,
        enableMoonPhase,
        enableNavigation,
        enableAis,
        weatherAlertsEnabled,
        tideAlertsEnabled,
      } = req.body;

      const widgetPreferencesTable = getWidgetPreferencesTable();
      
      // Check if preferences already exist
      const existing = await db
        .select()
        .from(widgetPreferencesTable)
        .where(eq(widgetPreferencesTable.userId, userId))
        .limit(1);

      const preferencesData = {
        userId,
        timezone: timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        clockType: clockType || 'digital',
        enableWeather: enableWeather ?? false,
        enableTides: enableTides ?? false,
        enableMoonPhase: enableMoonPhase ?? false,
        enableNavigation: enableNavigation ?? false,
        enableAis: enableAis ?? false,
        weatherAlertsEnabled: weatherAlertsEnabled ?? true,
        tideAlertsEnabled: tideAlertsEnabled ?? true,
        updatedAt: new Date(),
      };

      let result;
      if (existing.length > 0) {
        // Update existing preferences
        const updateResult = await db
          .update(widgetPreferencesTable)
          .set(preferencesData)
          .where(eq(widgetPreferencesTable.userId, userId))
          .returning();
        result = updateResult[0];
      } else {
        // Create new preferences
        const insertResult = await db
          .insert(widgetPreferencesTable)
          .values(preferencesData)
          .returning();
        result = insertResult[0];
      }

      res.json(result);
    } catch (error: any) {
      console.error("Error saving widget preferences:", error);
      res.status(500).json({ 
        error: "Failed to save widget preferences",
        errorCode: "PREFERENCES_SAVE_ERROR",
        details: error?.message
      });
    }
  });

  // Unified Environment API endpoint (XC Weather App + Tide Times App)
  app.get("/api/widgets/environment", async (req, res) => {
    try {
      let lat = parseFloat(req.query.lat as string);
      let lon = parseFloat(req.query.lon as string);
      const timezone = (req.query.timezone as string) || 'UTC';

      // Try to get user ID from session or email
      const userId = await getUserIdFromSessionOrEmail(req);

      // If coordinates not provided, try to get from saved location
      if ((isNaN(lat) || isNaN(lon)) && userId) {
        try {
          const widgetLocationsTable = getWidgetLocationsTable();
          const locations = await db
            .select()
            .from(widgetLocationsTable)
            .where(eq(widgetLocationsTable.userId, userId))
            .orderBy(desc(widgetLocationsTable.updatedAt))
            .limit(1);
          
          if (locations.length > 0) {
            lat = locations[0].latitude;
            lon = locations[0].longitude;
          }
    } catch (error) {
          console.error("Error fetching saved location:", error);
        }
      }

      // Validate coordinates or convert from timezone
      let finalLat = lat;
      let finalLon = lon;

      if (isNaN(lat) || isNaN(lon)) {
        const coords = weatherTimezoneToCoordinates(timezone) || tidesTimezoneToCoordinates(timezone);
        if (coords) {
          finalLat = coords.lat;
          finalLon = coords.lon;
        } else {
          return res.status(400).json({ 
            error: "Latitude and longitude are required, or provide a valid timezone, or set a widget location",
            errorCode: "MISSING_COORDINATES"
          });
        }
      }

      // Fetch both weather and tide data in parallel
      const [weatherData, tideData] = await Promise.allSettled([
        getWeatherData(finalLat, finalLon, timezone),
        getTideData(finalLat, finalLon, timezone),
      ]);

      const response: any = {
        location: {
          latitude: finalLat,
          longitude: finalLon,
          timezone,
        },
        weather: weatherData.status === 'fulfilled' ? weatherData.value : null,
        tides: tideData.status === 'fulfilled' ? tideData.value : null,
      };

      // Add error information if any requests failed
      if (weatherData.status === 'rejected') {
        response.weatherError = {
          error: "Failed to fetch weather data",
          errorCode: "WEATHER_FETCH_ERROR",
          details: weatherData.reason?.message || "Unknown error",
        };
      }

      if (tideData.status === 'rejected') {
        response.tideError = {
          error: "Failed to fetch tide data",
          errorCode: "TIDE_FETCH_ERROR",
          details: tideData.reason?.message || "Unknown error",
        };
      }

      // Return 200 even if one service fails, but include error info
      const statusCode = (!response.weather && !response.tides) ? 503 : 200;
      res.status(statusCode).json(response);
    } catch (error: any) {
      console.error("Error in unified environment endpoint:", error);
      res.status(500).json({ 
        error: "Failed to fetch environment data",
        errorCode: "ENVIRONMENT_FETCH_ERROR",
        details: error?.message || "Unknown error occurred"
      });
    }
  });

  // Clear tides cache endpoint (for debugging/restarting)
  app.post("/api/tides/clear-cache", async (req, res) => {
    try {
      const { lat, lon } = req.body;
      
      if (lat !== undefined && lon !== undefined) {
        clearTidesCache(lat, lon);
        res.json({ 
          success: true, 
          message: `Cache cleared for location ${lat}, ${lon}` 
        });
      } else {
        clearTidesCache(); // Clear all cache
        res.json({ 
          success: true, 
          message: 'All tide cache cleared' 
        });
      }
    } catch (error: any) {
      console.error("Error clearing tide cache:", error);
      res.status(500).json({ 
        error: "Failed to clear cache",
        details: error?.message 
      });
    }
  });

  // AIS Vessels API endpoint
  app.get("/api/ais/vessels", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const radius = parseFloat(req.query.radius as string) || 10; // Default 10 nautical miles

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      // For now, return mock/demo data
      // In production, this would connect to a real AIS API service
      // Options include: MarineTraffic API, VesselFinder API, or other AIS providers
      
      const vessels = generateMockAISVessels(lat, lon, radius);

      res.json({ vessels });
    } catch (error) {
      console.error("Error in AIS vessels endpoint:", error);
      res.status(500).json({ error: "Failed to fetch AIS data" });
    }
  });

  // Helper function to generate mock AIS vessels for demonstration
  function generateMockAISVessels(lat: number, lon: number, radius: number): any[] {
    const vessels: any[] = [];
    const shipNames = ['Ocean Explorer', 'Sea Breeze', 'Maritime Star', 'Coastal Voyager', 'Harbor Master', 'Blue Horizon'];
    const shipTypes = ['Cargo', 'Tanker', 'Container', 'Fishing', 'Passenger', 'Tug'];

    const count = Math.floor(Math.random() * 5) + 3; // 3-7 vessels

    for (let i = 0; i < count; i++) {
      const distance = Math.random() * radius;
      const bearing = Math.random() * 360;
      const offsetLat = (distance / 60) * Math.cos(bearing * Math.PI / 180);
      const offsetLon = (distance / (60 * Math.cos(lat * Math.PI / 180))) * Math.sin(bearing * Math.PI / 180);

      vessels.push({
        mmsi: String(230000000 + i),
        name: shipNames[i % shipNames.length],
        latitude: lat + offsetLat,
        longitude: lon + offsetLon,
        speed: Math.random() * 15 + 5,
        course: Math.random() * 360,
        shipType: shipTypes[i % shipTypes.length],
        heading: Math.random() * 360,
        destination: 'Port',
      });
    }

    return vessels;
  }

  // Ports API endpoint
  app.get("/api/ports", async (req, res) => {
    try {
      const id = req.query.id as string;
      const region = req.query.region as string;
      const type = req.query.type as 'Primary' | 'Secondary' | undefined;
      const search = req.query.search as string;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
      const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 100;

      let ports;

      // If ID is provided, search for that specific port
      if (id) {
        const allPorts = await getPorts({});
        // Try to find by ID first, then by name (case-insensitive)
        const port = allPorts.find((p: any) => 
          p.id === id || 
          p.id === id.replace('port:', '') ||
          p.name?.toLowerCase() === id.toLowerCase() ||
          p.name?.toLowerCase() === id.replace('port:', '').toLowerCase()
        );
        if (port) {
          console.log('Port found:', { id, portId: port.id, name: port.name, lat: port.latitude, lon: port.longitude });
          return res.json([port]); // Return as array to match expected format
        } else {
          console.log('Port not found:', { id, availablePorts: allPorts.slice(0, 5).map((p: any) => ({ id: p.id, name: p.name })) });
          return res.status(404).json({ error: "Port not found" });
        }
      }

      if (lat !== undefined && lon !== undefined && !isNaN(lat) && !isNaN(lon)) {
        // Get ports near location
        ports = await getPortsNearLocation(lat, lon, radiusKm);
      } else {
        // Get all ports with filters
        ports = await getPorts({
          region: region || undefined,
          type: type || undefined,
          search: search || undefined,
        });
      }

      res.json({ ports });
    } catch (error) {
      console.error("Error in ports endpoint:", error);
      res.status(500).json({ error: "Failed to fetch ports data" });
    }
  });

  // Reverse Geocoding - Find nearest location from GPS coordinates
  app.get("/api/geocode/reverse", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Valid latitude and longitude required" });
      }

      // First, try to find nearest port/harbor/marina
      const portsResponse = await getPortsNearLocation(lat, lon, 50);
      if (portsResponse && portsResponse.length > 0) {
        const nearest = portsResponse[0];
        return res.json({
          type: 'port',
          name: nearest.name,
          city: nearest.city,
          country: nearest.country,
          latitude: nearest.latitude,
          longitude: nearest.longitude,
          distance: nearest.distance,
        });
      }

      // Fallback: Use a geocoding service (OpenStreetMap Nominatim - free, no API key needed)
      try {
        const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`;
        const geocodeResponse = await fetch(geocodeUrl, {
          headers: {
            'User-Agent': 'Diver-Well-Training-App/1.0', // Required by Nominatim
          },
        });

        if (geocodeResponse.ok) {
          const data = await geocodeResponse.json();
          const address = data.address || {};
          
          return res.json({
            type: address.city ? 'city' : address.town ? 'town' : 'location',
            name: address.city || address.town || address.village || address.county || 'Unknown',
            city: address.city || address.town,
            country: address.country,
            latitude: parseFloat(data.lat),
            longitude: parseFloat(data.lon),
            fullAddress: data.display_name,
          });
        }
      } catch (geocodeError) {
        console.error('Geocoding error:', geocodeError);
      }

      // Final fallback
      res.json({
        type: 'location',
        name: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        latitude: lat,
        longitude: lon,
      });
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      res.status(500).json({ error: "Failed to reverse geocode location" });
    }
  });

  // Enhanced location info endpoint - combines GPS + nearest locations
  app.get("/api/location/info", async (req, res) => {
    try {
      const email = req.query.email as string;
      const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;

      let finalLat = lat;
      let finalLon = lon;

      // If no coordinates provided, get from saved location
      if ((!finalLat || !finalLon) && email) {
        try {
          const userId = await getUserIdFromEmail(email);
          if (userId) {
            const widgetLocationsTable = getWidgetLocationsTable();
            const locations = await db
              .select()
              .from(widgetLocationsTable)
              .where(eq(widgetLocationsTable.userId, userId))
              .orderBy(desc(widgetLocationsTable.updatedAt))
              .limit(1);
            
            if (locations.length > 0) {
              finalLat = locations[0].latitude;
              finalLon = locations[0].longitude;
            }
          }
        } catch (error) {
          console.error("Error fetching saved location:", error);
        }
      }

      if (!finalLat || !finalLon) {
        return res.status(400).json({ error: "Location coordinates required" });
      }

      // Get nearest port
      const ports = await getPortsNearLocation(finalLat, finalLon, 50);
      const nearestPort = ports && ports.length > 0 ? ports[0] : null;

      // Get reverse geocoding info (use internal function instead of HTTP call)
      let locationInfo = null;
      try {
        // First try ports
        const ports = await getPortsNearLocation(finalLat, finalLon, 50);
        if (ports && ports.length > 0) {
          const nearest = ports[0];
          locationInfo = {
            type: 'port',
            name: nearest.name,
            city: nearest.city,
            country: nearest.country,
            latitude: nearest.latitude,
            longitude: nearest.longitude,
            distance: nearest.distance,
          };
        } else {
          // Fallback to OpenStreetMap Nominatim
          const geocodeUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${finalLat}&lon=${finalLon}&zoom=10&addressdetails=1`;
          const geocodeResponse = await fetch(geocodeUrl, {
            headers: {
              'User-Agent': 'Diver-Well-Training-App/1.0',
            },
          });
          if (geocodeResponse.ok) {
            const data = await geocodeResponse.json();
            const address = data.address || {};
            locationInfo = {
              type: address.city ? 'city' : address.town ? 'town' : 'location',
              name: address.city || address.town || address.village || address.county || 'Unknown',
              city: address.city || address.town,
              country: address.country,
              latitude: parseFloat(data.lat),
              longitude: parseFloat(data.lon),
              fullAddress: data.display_name,
            };
          }
        }
      } catch (error) {
        console.error('Error getting location info:', error);
      }

      res.json({
        coordinates: {
          latitude: finalLat,
          longitude: finalLon,
        },
        nearestPort: nearestPort ? {
          name: nearestPort.name,
          type: nearestPort.type,
          distance: nearestPort.distance,
          latitude: nearestPort.latitude,
          longitude: nearestPort.longitude,
        } : null,
        locationInfo,
      });
    } catch (error) {
      console.error("Location info error:", error);
      res.status(500).json({ error: "Failed to get location info" });
    }
  });

  // Notices to Mariners API endpoint
  app.get("/api/notices-to-mariners", async (req, res) => {
    try {
      let lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      let lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 200;

      // If coordinates not provided, try to get from saved location
      if ((lat === undefined || lon === undefined || isNaN(lat) || isNaN(lon)) && email) {
        try {
          const userId = await getUserIdFromEmail(email);
          if (userId) {
            const widgetLocationsTable = getWidgetLocationsTable();
            const locations = await db
              .select()
              .from(widgetLocationsTable)
              .where(eq(widgetLocationsTable.userId, userId))
              .orderBy(desc(widgetLocationsTable.updatedAt))
              .limit(1);
            
            if (locations.length > 0) {
              lat = locations[0].latitude;
              lon = locations[0].longitude;
            }
          }
        } catch (error) {
          console.error("Error fetching saved location:", error);
          // Continue without location
        }
      }

      const notices = await getNoticesToMariners(lat, lon, radiusKm);

      res.json({ notices });
    } catch (error) {
      console.error("Error in notices to mariners endpoint:", error);
      res.status(500).json({ error: "Failed to fetch notices to mariners" });
    }
  });

  // Medical Facilities API endpoints
  app.get("/api/medical-facilities", async (req, res) => {
    try {
      let lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
      let lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : 200;
      const types = req.query.types ? (req.query.types as string).split(',') as MedicalFacilityType[] : undefined;
      const country = req.query.country as string | undefined;
      const region = req.query.region as string | undefined;
      const available24h = req.query.available24h === 'true' ? true : req.query.available24h === 'false' ? false : undefined;

      // If coordinates not provided, try to get from saved location
      if ((lat === undefined || lon === undefined || isNaN(lat) || isNaN(lon)) && email) {
        try {
          const userId = await getUserIdFromEmail(email);
          if (userId) {
            const widgetLocationsTable = getWidgetLocationsTable();
            const locations = await db
              .select()
              .from(widgetLocationsTable)
              .where(eq(widgetLocationsTable.userId, userId))
              .orderBy(desc(widgetLocationsTable.updatedAt))
              .limit(1);
            
            if (locations.length > 0) {
              lat = locations[0].latitude;
              lon = locations[0].longitude;
            }
          }
        } catch (error) {
          console.error("Error fetching saved location:", error);
          // Continue without location
        }
      }

      const facilities = await getMedicalFacilities({
        latitude: lat,
        longitude: lon,
        radiusKm: radiusKm,
        types: types,
        country: country,
        region: region,
        available24h: available24h,
      });

      res.json({ facilities });
    } catch (error) {
      console.error("Error in medical facilities endpoint:", error);
      res.status(500).json({ error: "Failed to fetch medical facilities" });
    }
  });

  // Get user's selected medical facilities
  app.get("/api/medical-facilities/user-selections", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const facilities = await getUserMedicalFacilities(userId);
      res.json({ facilities });
    } catch (error) {
      console.error("Error fetching user medical facilities:", error);
      res.status(500).json({ error: "Failed to fetch user medical facilities" });
    }
  });

  // Add medical facility to user's selections
  app.post("/api/medical-facilities/user-selections", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { facilityId, isPrimary } = req.body;

      if (!email || !facilityId) {
        return res.status(400).json({ error: "Email and facilityId required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      await addUserMedicalFacility(userId, facilityId, isPrimary || false);
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding user medical facility:", error);
      res.status(500).json({ error: "Failed to add user medical facility" });
    }
  });

  // Remove medical facility from user's selections
  app.delete("/api/medical-facilities/user-selections/:facilityId", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const { facilityId } = req.params;

      if (!email || !facilityId) {
        return res.status(400).json({ error: "Email and facilityId required" });
      }

      const userId = await getUserIdFromEmail(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      await removeUserMedicalFacility(userId, facilityId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing user medical facility:", error);
      res.status(500).json({ error: "Failed to remove user medical facility" });
    }
  });

  // ============================================================================
  // DIVE SUPERVISOR CONTROL ROUTES
  // ============================================================================

  // Helper function to get user ID from email
  async function getUserIdFromEmailForDiveSupervisor(email: string): Promise<string | null> {
    try {
      const userTable = users;
      const result = await db
        .select({ id: userTable.id })
        .from(userTable)
        .where(eq(userTable.email, email))
        .limit(1);
      return result.length > 0 ? result[0].id : null;
    } catch (error) {
      console.error("Error getting user ID:", error);
      return null;
    }
  }

  // Team Members CRUD
  app.get("/api/dive-supervisor/team-members", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const members = await db
        .select()
        .from(diveTeamMembers)
        .where(eq(diveTeamMembers.userId, userId));

      res.json(members);
    } catch (error) {
      console.error("Error fetching team members:", error);
      res.status(500).json({ error: "Failed to fetch team members" });
    }
  });

  app.post("/api/dive-supervisor/team-members", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const { name, role, age, experienceYears, phone, email: memberEmail, certifications, medicalRunoutDates, competencies, emergencyContact, notes } = req.body;

      const [member] = await db
        .insert(diveTeamMembers)
        .values({
          userId,
          name,
          role: role || "DIVER",
          age,
          experienceYears,
          phone,
          email: memberEmail,
          certifications: certifications || [],
          medicalRunoutDates: medicalRunoutDates || [],
          competencies: competencies || [],
          emergencyContact: emergencyContact || {},
          notes,
        })
        .returning();

      res.json(member);
    } catch (error) {
      console.error("Error creating team member:", error);
      res.status(500).json({ error: "Failed to create team member" });
    }
  });

  app.put("/api/dive-supervisor/team-members/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const { name, role, age, experienceYears, phone, email: memberEmail, certifications, medicalRunoutDates, competencies, emergencyContact, notes } = req.body;

      const [member] = await db
        .update(diveTeamMembers)
        .set({
          name,
          role,
          age,
          experienceYears,
          phone,
          email: memberEmail,
          certifications: certifications || [],
          medicalRunoutDates: medicalRunoutDates || [],
          competencies: competencies || [],
          emergencyContact: emergencyContact || {},
          notes,
          updatedAt: new Date(),
        })
        .where(and(eq(diveTeamMembers.id, id), eq(diveTeamMembers.userId, userId)))
        .returning();

      if (!member) {
        return res.status(404).json({ error: "Team member not found" });
      }

      res.json(member);
    } catch (error) {
      console.error("Error updating team member:", error);
      res.status(500).json({ error: "Failed to update team member" });
    }
  });

  app.delete("/api/dive-supervisor/team-members/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      await db
        .delete(diveTeamMembers)
        .where(and(eq(diveTeamMembers.id, id), eq(diveTeamMembers.userId, userId)));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting team member:", error);
      res.status(500).json({ error: "Failed to delete team member" });
    }
  });

  // Operations CRUD
  app.get("/api/dive-supervisor/operations", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const operations = await db
        .select()
        .from(diveOperations)
        .where(eq(diveOperations.userId, userId))
        .orderBy(desc(diveOperations.createdAt));

      res.json(operations);
    } catch (error) {
      console.error("Error fetching operations:", error);
      res.status(500).json({ error: "Failed to fetch operations" });
    }
  });

  app.post("/api/dive-supervisor/operations", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const { title, clientId, location, plannedDate, status, supervisorId } = req.body;

      const [operation] = await db
        .insert(diveOperations)
        .values({
          userId,
          title,
          clientId,
          location,
          plannedDate: plannedDate ? new Date(plannedDate) : null,
          status: status || "PLANNED",
          supervisorId,
        })
        .returning();

      res.json(operation);
    } catch (error) {
      console.error("Error creating operation:", error);
      res.status(500).json({ error: "Failed to create operation" });
    }
  });

  // Contacts CRUD
  app.get("/api/dive-supervisor/contacts", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const contacts = await db
        .select()
        .from(diveOperationContacts)
        .where(eq(diveOperationContacts.operationId, operationId));

      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  app.post("/api/dive-supervisor/contacts", async (req, res) => {
    try {
      const { operationId, contactType, name, organization, phone, email: contactEmail, vhfChannel, notes } = req.body;

      if (!operationId || !contactType || !name) {
        return res.status(400).json({ error: "operationId, contactType, and name required" });
      }

      const [contact] = await db
        .insert(diveOperationContacts)
        .values({
          operationId,
          contactType,
          name,
          organization,
          phone,
          email: contactEmail,
          vhfChannel,
          notes,
        })
        .returning();

      res.json(contact);
    } catch (error) {
      console.error("Error creating contact:", error);
      res.status(500).json({ error: "Failed to create contact" });
    }
  });

  app.put("/api/dive-supervisor/contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { contactType, name, organization, phone, email: contactEmail, vhfChannel, notes } = req.body;

      const [contact] = await db
        .update(diveOperationContacts)
        .set({
          contactType,
          name,
          organization,
          phone,
          email: contactEmail,
          vhfChannel,
          notes,
          updatedAt: new Date(),
        })
        .where(eq(diveOperationContacts.id, id))
        .returning();

      if (!contact) {
        return res.status(404).json({ error: "Contact not found" });
      }

      res.json(contact);
    } catch (error) {
      console.error("Error updating contact:", error);
      res.status(500).json({ error: "Failed to update contact" });
    }
  });

  app.delete("/api/dive-supervisor/contacts/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(diveOperationContacts)
        .where(eq(diveOperationContacts.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting contact:", error);
      res.status(500).json({ error: "Failed to delete contact" });
    }
  });

  // Permits CRUD
  app.get("/api/dive-supervisor/permits", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const permits = await db
        .select()
        .from(diveOperationPermits)
        .where(eq(diveOperationPermits.operationId, operationId));

      res.json(permits);
    } catch (error) {
      console.error("Error fetching permits:", error);
      res.status(500).json({ error: "Failed to fetch permits" });
    }
  });

  app.post("/api/dive-supervisor/permits", async (req, res) => {
    try {
      const { operationId, permitType, permitNumber, issuedBy, issueDate, expiryDate, status, notes } = req.body;

      if (!operationId || !permitType) {
        return res.status(400).json({ error: "operationId and permitType required" });
      }

      const [permit] = await db
        .insert(diveOperationPermits)
        .values({
          operationId,
          permitType,
          permitNumber,
          issuedBy,
          issueDate: issueDate ? new Date(issueDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status: status || "PENDING",
          notes,
        })
        .returning();

      res.json(permit);
    } catch (error) {
      console.error("Error creating permit:", error);
      res.status(500).json({ error: "Failed to create permit" });
    }
  });

  app.put("/api/dive-supervisor/permits/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { permitType, permitNumber, issuedBy, issueDate, expiryDate, status, notes } = req.body;

      const [permit] = await db
        .update(diveOperationPermits)
        .set({
          permitType,
          permitNumber,
          issuedBy,
          issueDate: issueDate ? new Date(issueDate) : null,
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status,
          notes,
          updatedAt: new Date(),
        })
        .where(eq(diveOperationPermits.id, id))
        .returning();

      if (!permit) {
        return res.status(404).json({ error: "Permit not found" });
      }

      res.json(permit);
    } catch (error) {
      console.error("Error updating permit:", error);
      res.status(500).json({ error: "Failed to update permit" });
    }
  });

  app.delete("/api/dive-supervisor/permits/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(diveOperationPermits)
        .where(eq(diveOperationPermits.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting permit:", error);
      res.status(500).json({ error: "Failed to delete permit" });
    }
  });

  // Rosters CRUD
  app.get("/api/dive-supervisor/rosters", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const rosters = await db
        .select()
        .from(diveTeamRosters)
        .where(eq(diveTeamRosters.operationId, operationId));

      // Join with team members to get names
      const rostersWithNames = await Promise.all(
        rosters.map(async (roster: any) => {
          if (roster.teamMemberId) {
            const [member] = await db
              .select()
              .from(diveTeamMembers)
              .where(eq(diveTeamMembers.id, roster.teamMemberId))
              .limit(1);
            return { ...roster, teamMemberName: member?.name };
          }
          return roster;
        })
      );

      res.json(rostersWithNames);
    } catch (error) {
      console.error("Error fetching rosters:", error);
      res.status(500).json({ error: "Failed to fetch rosters" });
    }
  });

  app.post("/api/dive-supervisor/rosters", async (req, res) => {
    try {
      const { operationId, phase, diverRole, teamMemberId, notes } = req.body;

      if (!operationId || !phase || !diverRole) {
        return res.status(400).json({ error: "operationId, phase, and diverRole required" });
      }

      const [roster] = await db
        .insert(diveTeamRosters)
        .values({
          operationId,
          phase,
          diverRole,
          teamMemberId,
          notes,
        })
        .returning();

      res.json(roster);
    } catch (error) {
      console.error("Error creating roster:", error);
      res.status(500).json({ error: "Failed to create roster" });
    }
  });

  app.delete("/api/dive-supervisor/rosters/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(diveTeamRosters)
        .where(eq(diveTeamRosters.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting roster:", error);
      res.status(500).json({ error: "Failed to delete roster" });
    }
  });

  // Dive Plans CRUD
  app.get("/api/dive-supervisor/dive-plans", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const [plan] = await db
        .select()
        .from(divePlans)
        .where(eq(divePlans.operationId, operationId))
        .limit(1);

      res.json(plan || null);
    } catch (error) {
      console.error("Error fetching dive plan:", error);
      res.status(500).json({ error: "Failed to fetch dive plan" });
    }
  });

  app.post("/api/dive-supervisor/dive-plans", async (req, res) => {
    try {
      const { operationId, maxDepth, bottomTime, decompressionProfile, gasMixtures, equipment, riskAssessment } = req.body;

      if (!operationId) {
        return res.status(400).json({ error: "operationId required" });
      }

      const [plan] = await db
        .insert(divePlans)
        .values({
          operationId,
          maxDepth,
          bottomTime,
          decompressionProfile: decompressionProfile || [],
          gasMixtures: gasMixtures || [],
          equipment: equipment || [],
          riskAssessment: riskAssessment || {},
        })
        .returning();

      res.json(plan);
    } catch (error) {
      console.error("Error creating dive plan:", error);
      res.status(500).json({ error: "Failed to create dive plan" });
    }
  });

  app.put("/api/dive-supervisor/dive-plans/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { maxDepth, bottomTime, decompressionProfile, gasMixtures, equipment, riskAssessment } = req.body;

      const [plan] = await db
        .update(divePlans)
        .set({
          maxDepth,
          bottomTime,
          decompressionProfile: decompressionProfile || [],
          gasMixtures: gasMixtures || [],
          equipment: equipment || [],
          riskAssessment: riskAssessment || {},
          updatedAt: new Date(),
        })
        .where(eq(divePlans.id, id))
        .returning();

      if (!plan) {
        return res.status(404).json({ error: "Dive plan not found" });
      }

      res.json(plan);
    } catch (error) {
      console.error("Error updating dive plan:", error);
      res.status(500).json({ error: "Failed to update dive plan" });
    }
  });

  // DPRs CRUD
  app.get("/api/dive-supervisor/dprs", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      let whereConditions = [eq(dailyProjectReports.createdBy, userId)];
      if (operationId) {
        whereConditions.push(eq(dailyProjectReports.operationId, operationId));
      }

      const dprs = await db
        .select({
          id: dailyProjectReports.id,
          operationId: dailyProjectReports.operationId,
          reportDate: dailyProjectReports.reportDate,
          reportData: dailyProjectReports.reportData,
          createdBy: dailyProjectReports.createdBy,
          createdAt: dailyProjectReports.createdAt,
          updatedAt: dailyProjectReports.updatedAt,
          operationTitle: diveOperations.title,
        })
        .from(dailyProjectReports)
        .leftJoin(diveOperations, eq(dailyProjectReports.operationId, diveOperations.id))
        .where(and(...whereConditions))
        .orderBy(desc(dailyProjectReports.reportDate));

      res.json(dprs);
    } catch (error) {
      console.error("Error fetching DPRs:", error);
      res.status(500).json({ error: "Failed to fetch DPRs" });
    }
  });

  app.post("/api/dive-supervisor/dprs", async (req, res) => {
    try {
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { operationId, reportDate, reportData } = req.body;

      if (!email || !operationId || !reportDate || !reportData) {
        return res.status(400).json({ error: "Email, operationId, reportDate, and reportData required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const [dpr] = await db
        .insert(dailyProjectReports)
        .values({
          operationId,
          reportDate: new Date(reportDate),
          reportData,
          createdBy: userId,
        })
        .returning();

      res.json(dpr);
    } catch (error) {
      console.error("Error creating DPR:", error);
      res.status(500).json({ error: "Failed to create DPR" });
    }
  });

  app.put("/api/dive-supervisor/dprs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);
      const { reportDate, reportData } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email required" });
      }

      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const [dpr] = await db
        .update(dailyProjectReports)
        .set({
          reportDate: reportDate ? new Date(reportDate) : undefined,
          reportData,
          updatedAt: new Date(),
        })
        .where(and(eq(dailyProjectReports.id, id), eq(dailyProjectReports.createdBy, userId)))
        .returning();

      if (!dpr) {
        return res.status(404).json({ error: "DPR not found" });
      }

      res.json(dpr);
    } catch (error) {
      console.error("Error updating DPR:", error);
      res.status(500).json({ error: "Failed to update DPR" });
    }
  });

  // DPR Export endpoints (placeholder - will be implemented with PDF/DOCX services)
  app.post("/api/dive-supervisor/dprs/:id/export-pdf", async (req, res) => {
    try {
      const { id } = req.params;
      // TODO: Implement PDF export using PDFExportService
      res.status(501).json({ error: "PDF export not yet implemented" });
    } catch (error) {
      console.error("Error exporting DPR to PDF:", error);
      res.status(500).json({ error: "Failed to export DPR to PDF" });
    }
  });

  app.post("/api/dive-supervisor/dprs/:id/export-docx", async (req, res) => {
    try {
      const { id } = req.params;
      // TODO: Implement DOCX export using DOCXExportService
      res.status(501).json({ error: "DOCX export not yet implemented" });
    } catch (error) {
      console.error("Error exporting DPR to DOCX:", error);
      res.status(500).json({ error: "Failed to export DPR to DOCX" });
    }
  });

  app.post("/api/dive-supervisor/dprs/import", async (req, res) => {
    try {
      // TODO: Implement DPR import from PDF/DOCX
      res.status(501).json({ error: "DPR import not yet implemented" });
    } catch (error) {
      console.error("Error importing DPR:", error);
      res.status(500).json({ error: "Failed to import DPR" });
    }
  });

  // ============================================================================
  // ENHANCED DIVE SUPERVISOR CONTROL ROUTES
  // ============================================================================

  // CasEvac Drills CRUD
  app.get("/api/dive-supervisor/cas-evac-drills", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const drills = await db
        .select()
        .from(casEvacDrills)
        .where(eq(casEvacDrills.operationId, operationId))
        .orderBy(desc(casEvacDrills.drillDate));

      res.json(drills);
    } catch (error) {
      console.error("Error fetching CasEvac drills:", error);
      res.status(500).json({ error: "Failed to fetch drills" });
    }
  });

  app.post("/api/dive-supervisor/cas-evac-drills", async (req, res) => {
    try {
      const { operationId, drillDate, scenario, participants, outcomes, notes } = req.body;

      if (!operationId || !drillDate || !scenario) {
        return res.status(400).json({ error: "operationId, drillDate, and scenario required" });
      }

      const [drill] = await db
        .insert(casEvacDrills)
        .values({
          operationId,
          drillDate: new Date(drillDate),
          scenario,
          participants: participants || [],
          outcomes,
          notes,
        })
        .returning();

      res.json(drill);
    } catch (error) {
      console.error("Error creating CasEvac drill:", error);
      res.status(500).json({ error: "Failed to create drill" });
    }
  });

  app.put("/api/dive-supervisor/cas-evac-drills/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { drillDate, scenario, participants, outcomes, notes } = req.body;

      const [drill] = await db
        .update(casEvacDrills)
        .set({
          drillDate: drillDate ? new Date(drillDate) : undefined,
          scenario,
          participants: participants || [],
          outcomes,
          notes,
          updatedAt: new Date(),
        })
        .where(eq(casEvacDrills.id, id))
        .returning();

      if (!drill) {
        return res.status(404).json({ error: "Drill not found" });
      }

      res.json(drill);
    } catch (error) {
      console.error("Error updating CasEvac drill:", error);
      res.status(500).json({ error: "Failed to update drill" });
    }
  });

  app.delete("/api/dive-supervisor/cas-evac-drills/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(casEvacDrills)
        .where(eq(casEvacDrills.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting CasEvac drill:", error);
      res.status(500).json({ error: "Failed to delete drill" });
    }
  });

  // Tool Box Talks CRUD
  app.get("/api/dive-supervisor/toolbox-talks", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const talks = await db
        .select()
        .from(toolBoxTalks)
        .where(eq(toolBoxTalks.operationId, operationId))
        .orderBy(desc(toolBoxTalks.talkDate));

      res.json(talks);
    } catch (error) {
      console.error("Error fetching toolbox talks:", error);
      res.status(500).json({ error: "Failed to fetch toolbox talks" });
    }
  });

  app.post("/api/dive-supervisor/toolbox-talks", async (req, res) => {
    try {
      const { operationId, talkDate, topics, attendees, presenter, signOffs, notes } = req.body;

      if (!operationId || !talkDate || !presenter) {
        return res.status(400).json({ error: "operationId, talkDate, and presenter required" });
      }

      const [talk] = await db
        .insert(toolBoxTalks)
        .values({
          operationId,
          talkDate: new Date(talkDate),
          topics: topics || [],
          attendees: attendees || [],
          presenter,
          signOffs: signOffs || [],
          notes,
        })
        .returning();

      res.json(talk);
    } catch (error) {
      console.error("Error creating toolbox talk:", error);
      res.status(500).json({ error: "Failed to create toolbox talk" });
    }
  });

  app.put("/api/dive-supervisor/toolbox-talks/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { talkDate, topics, attendees, presenter, signOffs, notes } = req.body;

      const [talk] = await db
        .update(toolBoxTalks)
        .set({
          talkDate: talkDate ? new Date(talkDate) : undefined,
          topics: topics || [],
          attendees: attendees || [],
          presenter,
          signOffs: signOffs || [],
          notes,
          updatedAt: new Date(),
        })
        .where(eq(toolBoxTalks.id, id))
        .returning();

      if (!talk) {
        return res.status(404).json({ error: "Toolbox talk not found" });
      }

      res.json(talk);
    } catch (error) {
      console.error("Error updating toolbox talk:", error);
      res.status(500).json({ error: "Failed to update toolbox talk" });
    }
  });

  app.delete("/api/dive-supervisor/toolbox-talks/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(toolBoxTalks)
        .where(eq(toolBoxTalks.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting toolbox talk:", error);
      res.status(500).json({ error: "Failed to delete toolbox talk" });
    }
  });

  // Hazards CRUD
  app.get("/api/dive-supervisor/hazards", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const hazards = await db
        .select()
        .from(diveOperationHazards)
        .where(eq(diveOperationHazards.operationId, operationId))
        .orderBy(desc(diveOperationHazards.createdAt));

      res.json(hazards);
    } catch (error) {
      console.error("Error fetching hazards:", error);
      res.status(500).json({ error: "Failed to fetch hazards" });
    }
  });

  app.post("/api/dive-supervisor/hazards", async (req, res) => {
    try {
      const { operationId, hazardType, description, severity, likelihood, mitigation, status } = req.body;

      if (!operationId || !hazardType || !description || !severity || !likelihood) {
        return res.status(400).json({ error: "operationId, hazardType, description, severity, and likelihood required" });
      }

      const [hazard] = await db
        .insert(diveOperationHazards)
        .values({
          operationId,
          hazardType,
          description,
          severity,
          likelihood,
          mitigation,
          status: status || "IDENTIFIED",
        })
        .returning();

      res.json(hazard);
    } catch (error) {
      console.error("Error creating hazard:", error);
      res.status(500).json({ error: "Failed to create hazard" });
    }
  });

  app.put("/api/dive-supervisor/hazards/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { hazardType, description, severity, likelihood, mitigation, status } = req.body;

      const [hazard] = await db
        .update(diveOperationHazards)
        .set({
          hazardType,
          description,
          severity,
          likelihood,
          mitigation,
          status,
          updatedAt: new Date(),
        })
        .where(eq(diveOperationHazards.id, id))
        .returning();

      if (!hazard) {
        return res.status(404).json({ error: "Hazard not found" });
      }

      res.json(hazard);
    } catch (error) {
      console.error("Error updating hazard:", error);
      res.status(500).json({ error: "Failed to update hazard" });
    }
  });

  app.delete("/api/dive-supervisor/hazards/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(diveOperationHazards)
        .where(eq(diveOperationHazards.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting hazard:", error);
      res.status(500).json({ error: "Failed to delete hazard" });
    }
  });

  // Welfare Records CRUD
  app.get("/api/dive-supervisor/welfare", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const records = await db
        .select()
        .from(welfareRecords)
        .where(eq(welfareRecords.operationId, operationId))
        .orderBy(desc(welfareRecords.recordDate));

      res.json(records);
    } catch (error) {
      console.error("Error fetching welfare records:", error);
      res.status(500).json({ error: "Failed to fetch welfare records" });
    }
  });

  app.post("/api/dive-supervisor/welfare", async (req, res) => {
    try {
      const { operationId, recordDate, accommodation, meals, restPeriods, healthNotes } = req.body;

      if (!operationId || !recordDate) {
        return res.status(400).json({ error: "operationId and recordDate required" });
      }

      const [record] = await db
        .insert(welfareRecords)
        .values({
          operationId,
          recordDate: new Date(recordDate),
          accommodation: accommodation || {},
          meals: meals || {},
          restPeriods: restPeriods || [],
          healthNotes,
        })
        .returning();

      res.json(record);
    } catch (error) {
      console.error("Error creating welfare record:", error);
      res.status(500).json({ error: "Failed to create welfare record" });
    }
  });

  app.put("/api/dive-supervisor/welfare/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { recordDate, accommodation, meals, restPeriods, healthNotes } = req.body;

      const [record] = await db
        .update(welfareRecords)
        .set({
          recordDate: recordDate ? new Date(recordDate) : undefined,
          accommodation: accommodation || {},
          meals: meals || {},
          restPeriods: restPeriods || [],
          healthNotes,
          updatedAt: new Date(),
        })
        .where(eq(welfareRecords.id, id))
        .returning();

      if (!record) {
        return res.status(404).json({ error: "Welfare record not found" });
      }

      res.json(record);
    } catch (error) {
      console.error("Error updating welfare record:", error);
      res.status(500).json({ error: "Failed to update welfare record" });
    }
  });

  app.delete("/api/dive-supervisor/welfare/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(welfareRecords)
        .where(eq(welfareRecords.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting welfare record:", error);
      res.status(500).json({ error: "Failed to delete welfare record" });
    }
  });

  // Shipping Info CRUD
  app.get("/api/dive-supervisor/shipping", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const info = await db
        .select()
        .from(shippingInfo)
        .where(eq(shippingInfo.operationId, operationId))
        .orderBy(desc(shippingInfo.createdAt));

      res.json(info);
    } catch (error) {
      console.error("Error fetching shipping info:", error);
      res.status(500).json({ error: "Failed to fetch shipping info" });
    }
  });

  app.post("/api/dive-supervisor/shipping", async (req, res) => {
    try {
      const { operationId, vesselName, vesselType, eta, etd, contact, notes } = req.body;

      if (!operationId) {
        return res.status(400).json({ error: "operationId required" });
      }

      const [info] = await db
        .insert(shippingInfo)
        .values({
          operationId,
          vesselName,
          vesselType,
          eta: eta ? new Date(eta) : null,
          etd: etd ? new Date(etd) : null,
          contact: contact || {},
          notes,
        })
        .returning();

      res.json(info);
    } catch (error) {
      console.error("Error creating shipping info:", error);
      res.status(500).json({ error: "Failed to create shipping info" });
    }
  });

  app.put("/api/dive-supervisor/shipping/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { vesselName, vesselType, eta, etd, contact, notes } = req.body;

      const [info] = await db
        .update(shippingInfo)
        .set({
          vesselName,
          vesselType,
          eta: eta ? new Date(eta) : null,
          etd: etd ? new Date(etd) : null,
          contact: contact || {},
          notes,
          updatedAt: new Date(),
        })
        .where(eq(shippingInfo.id, id))
        .returning();

      if (!info) {
        return res.status(404).json({ error: "Shipping info not found" });
      }

      res.json(info);
    } catch (error) {
      console.error("Error updating shipping info:", error);
      res.status(500).json({ error: "Failed to update shipping info" });
    }
  });

  app.delete("/api/dive-supervisor/shipping/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(shippingInfo)
        .where(eq(shippingInfo.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting shipping info:", error);
      res.status(500).json({ error: "Failed to delete shipping info" });
    }
  });

  // Environmental Data endpoint
  app.get("/api/dive-supervisor/environmental-data", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const timezone = (req.query.timezone as string) || "UTC";

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Valid latitude and longitude required" });
      }

      // Use existing services
      const [weatherData, tideData] = await Promise.all([
        getWeatherData(lat, lon, timezone),
        getTideData(lat, lon, timezone),
      ]);

      res.json({
        weather: weatherData,
        tides: tideData,
      });
    } catch (error) {
      console.error("Error fetching environmental data:", error);
      res.status(500).json({ error: "Failed to fetch environmental data" });
    }
  });

  // Notices to Mariners endpoint
  app.get("/api/dive-supervisor/notices-to-mariners", async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat as string);
      const lon = parseFloat(req.query.lon as string);
      const radiusKm = parseFloat(req.query.radiusKm as string) || 50;

      if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Valid latitude and longitude required" });
      }

      const notices = await getNoticesToMariners(lat, lon, radiusKm);

      res.json(notices);
    } catch (error) {
      console.error("Error fetching notices to mariners:", error);
      res.status(500).json({ error: "Failed to fetch notices to mariners" });
    }
  });

  // RAMS Documents CRUD
  app.get("/api/dive-supervisor/rams", async (req, res) => {
    try {
      const email = (req.query.email as string) || (req.headers['x-user-email'] as string);
      const operationId = req.query.operationId as string;

      if (!email || !operationId) {
        return res.status(400).json({ error: "Email and operationId required" });
      }

      const rams = await db
        .select()
        .from(ramsDocuments)
        .where(eq(ramsDocuments.operationId, operationId))
        .orderBy(desc(ramsDocuments.createdAt));

      res.json(rams);
    } catch (error) {
      console.error("Error fetching RAMS documents:", error);
      res.status(500).json({ error: "Failed to fetch RAMS documents" });
    }
  });

  app.post("/api/dive-supervisor/rams", async (req, res) => {
    try {
      const { operationId, title, documentData, linkedHazardIds, signatures } = req.body;
      const email = (req.body.email as string) || (req.headers['x-user-email'] as string);

      if (!operationId || !title || !documentData) {
        return res.status(400).json({ error: "operationId, title, and documentData required" });
      }

      // Get user ID from email
      const userId = await getUserIdFromEmailForDiveSupervisor(email);
      if (!userId) {
        return res.status(404).json({ error: "User not found" });
      }

      const [rams] = await db
        .insert(ramsDocuments)
        .values({
          operationId,
          title,
          documentData,
          linkedHazardIds: linkedHazardIds || [],
          signatures: signatures || [],
          createdBy: userId,
        })
        .returning();

      res.json(rams);
    } catch (error) {
      console.error("Error creating RAMS document:", error);
      res.status(500).json({ error: "Failed to create RAMS document" });
    }
  });

  app.put("/api/dive-supervisor/rams/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, documentData, linkedHazardIds, signatures } = req.body;

      const [rams] = await db
        .update(ramsDocuments)
        .set({
          title,
          documentData,
          linkedHazardIds: linkedHazardIds || [],
          signatures: signatures || [],
          updatedAt: new Date(),
        })
        .where(eq(ramsDocuments.id, id))
        .returning();

      if (!rams) {
        return res.status(404).json({ error: "RAMS document not found" });
      }

      res.json(rams);
    } catch (error) {
      console.error("Error updating RAMS document:", error);
      res.status(500).json({ error: "Failed to update RAMS document" });
    }
  });

  app.delete("/api/dive-supervisor/rams/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await db
        .delete(ramsDocuments)
        .where(eq(ramsDocuments.id, id));

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting RAMS document:", error);
      res.status(500).json({ error: "Failed to delete RAMS document" });
    }
  });

  app.post("/api/dive-supervisor/rams/:id/sign", async (req, res) => {
    try {
      const { id } = req.params;
      const { teamMemberId, signature } = req.body;

      if (!teamMemberId || !signature) {
        return res.status(400).json({ error: "teamMemberId and signature required" });
      }

      const [rams] = await db
        .select()
        .from(ramsDocuments)
        .where(eq(ramsDocuments.id, id))
        .limit(1);

      if (!rams) {
        return res.status(404).json({ error: "RAMS document not found" });
      }

      const signatures = (rams.signatures as any[]) || [];
      const signatureIndex = signatures.findIndex((s: any) => s.teamMemberId === teamMemberId);
      
      const newSignature = {
        teamMemberId,
        name: signatures[signatureIndex]?.name || "",
        signature,
        date: new Date().toISOString(),
        status: "SIGNED" as const,
      };

      if (signatureIndex >= 0) {
        signatures[signatureIndex] = newSignature;
      } else {
        signatures.push(newSignature);
      }

      const [updated] = await db
        .update(ramsDocuments)
        .set({
          signatures,
          updatedAt: new Date(),
        })
        .where(eq(ramsDocuments.id, id))
        .returning();

      res.json(updated);
    } catch (error) {
      console.error("Error signing RAMS document:", error);
      res.status(500).json({ error: "Failed to sign RAMS document" });
    }
  });

  app.get("/api/dive-supervisor/rams/:id/export-pdf", async (req, res) => {
    try {
      const { id } = req.params;

      const [rams] = await db
        .select()
        .from(ramsDocuments)
        .where(eq(ramsDocuments.id, id))
        .limit(1);

      if (!rams) {
        return res.status(404).json({ error: "RAMS document not found" });
      }

      // TODO: Generate PDF using jsPDF or similar
      // For now, return a placeholder
      res.status(501).json({ error: "PDF export not yet implemented" });
    } catch (error) {
      console.error("Error exporting RAMS PDF:", error);
      res.status(500).json({ error: "Failed to export PDF" });
    }
  });

  const httpServer = createServer(app);
  // Gemini Live (native audio) WebSocket endpoints:
  // - /api/laura-oracle/live
  // - /api/diver-well/live
  //
  // This keeps the API key server-side and enables the low-latency voice loop.
  registerGeminiLiveVoiceWsRoutes(httpServer);
  // OpenAI Voice WebSocket endpoints (direct and fallback testing):
  // - /api/openai/laura-oracle/live
  // - /api/openai/diver-well/live
  registerOpenAIVoiceWsRoutes(httpServer);
  // Initialize Platform Change Monitor and Documentation Updater
  try {
    const { default: PlatformChangeMonitor } = await import('./platform-change-monitor');
    const { default: LangSmithChangeTracker } = await import('./langsmith-change-tracker');
    const { default: DocumentationUpdater } = await import('./documentation-updater');

    // Get instances
    const platformMonitor = PlatformChangeMonitor.getInstance(15);
    const langsmithTracker = LangSmithChangeTracker.getInstance(30);
    const updater = DocumentationUpdater.getInstance();

    // Set up change event listeners
    platformMonitor.on('change', async (change: any) => {
      console.log(`📢 Platform change detected: ${change.type} - ${change.description}`);
      // Process changes automatically via documentation updater
      try {
        await updater.processPendingChanges();
      } catch (error) {
        console.error('❌ Error processing changes:', error);
      }
    });

    langsmithTracker.on('change', async (change: any) => {
      console.log(`📢 LangSmith change detected: ${change.type} - ${change.description}`);
      // Process changes automatically via documentation updater
      try {
        await updater.processPendingChanges();
      } catch (error) {
        console.error('❌ Error processing changes:', error);
      }
    });

    // Start monitoring services
    await platformMonitor.start();
    await langsmithTracker.start();

    // Process any existing pending changes on startup (delayed to avoid blocking)
    setTimeout(async () => {
      try {
        await updater.processPendingChanges();
      } catch (error) {
        console.error('❌ Error processing initial pending changes:', error);
      }
    }, 5000); // Wait 5 seconds after server starts

    console.log('✅ Platform Change Monitor and Documentation Updater initialized');
  } catch (error) {
    console.error('⚠️ Warning: Failed to initialize documentation monitoring services:', error);
    // Continue startup even if monitoring fails
  }

  return httpServer;
}
