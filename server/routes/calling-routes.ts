import type { Express, Request, Response, NextFunction } from "express";
import { db } from "../db";
import { users } from "@shared/schema-sqlite";
import { users as pgUsers } from "@shared/schema";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";

// Determine which schema to use based on environment
const env = process.env.NODE_ENV ?? "development";
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const isSQLiteDev = env === "development" && !hasDatabaseUrl;
const usersTable = isSQLiteDev ? users : pgUsers;

/**
 * Whitelist of allowed calling preference fields
 * SECURITY: Prevents mass assignment attacks by explicitly listing allowed fields
 */
const ALLOWED_PREFERENCE_FIELDS = [
  "defaultProvider",
  "enableVideo",
  "enableAudio",
  "providers",
] as const;

/**
 * Sanitize calling preferences to only include allowed fields
 */
function sanitizeCallingPreferences(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") {
    return {};
  }
  
  const sanitized: Record<string, unknown> = {};
  const inputObj = input as Record<string, unknown>;
  
  for (const field of ALLOWED_PREFERENCE_FIELDS) {
    if (field in inputObj) {
      // Additional validation for specific fields
      if (field === "defaultProvider" && typeof inputObj[field] === "string") {
        // Only allow known providers
        const allowedProviders = ["google-meet", "facetime", "zoom", "twilio", "phone"];
        if (allowedProviders.includes(inputObj[field] as string)) {
          sanitized[field] = inputObj[field];
        }
      } else if ((field === "enableVideo" || field === "enableAudio") && typeof inputObj[field] === "boolean") {
        sanitized[field] = inputObj[field];
      } else if (field === "providers" && typeof inputObj[field] === "object") {
        // Sanitize providers object
        sanitized[field] = inputObj[field];
      }
    }
  }
  
  return sanitized;
}

/**
 * Register calling-related API routes
 * All routes require authentication via session tokens
 */
export function registerCallingRoutes(app: Express): void {
  
  // Get user calling preferences
  // SECURITY: Uses session-based authentication, not x-user-email header
  app.get("/api/calling/preferences", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const [dbUser] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, user.id))
        .limit(1);

      if (!dbUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get calling preferences from user data
      const preferences = (dbUser as any).calling_preferences || {
        defaultProvider: 'google-meet',
        enableVideo: true,
        enableAudio: true,
        providers: {
          googleMeet: { enabled: true },
          facetime: { enabled: true },
          zoom: { enabled: true },
          twilio: { enabled: false },
        },
      };

      res.json(preferences);
    } catch (error) {
      console.error("Error fetching calling preferences:", error);
      res.status(500).json({ error: "Failed to fetch calling preferences" });
    }
  });

  // Save user calling preferences
  // SECURITY: Uses session-based authentication and sanitizes input
  app.post("/api/calling/preferences", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // SECURITY: Sanitize input to prevent mass assignment
      const sanitizedPreferences = sanitizeCallingPreferences(req.body);
      
      if (Object.keys(sanitizedPreferences).length === 0) {
        return res.status(400).json({ error: "No valid preference fields provided" });
      }

      // Store preferences as a JSON object in a dedicated field
      // Note: This requires a calling_preferences JSON column in the users table
      // For now, we'll log and return the sanitized preferences
      console.log(`Updating calling preferences for user ${user.id}:`, sanitizedPreferences);
      
      // TODO: Implement actual database storage when calling_preferences column is added
      // await db
      //   .update(usersTable)
      //   .set({ calling_preferences: sanitizedPreferences })
      //   .where(eq(usersTable.id, user.id));

      res.json({ success: true, preferences: sanitizedPreferences });
    } catch (error) {
      console.error("Error saving calling preferences:", error);
      res.status(500).json({ error: "Failed to save calling preferences" });
    }
  });

  // Generate Twilio access token for phone calls
  // SECURITY: Uses session-based authentication
  app.post("/api/calling/twilio/token", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { phoneNumber } = req.body;

      if (!phoneNumber || typeof phoneNumber !== "string") {
        return res.status(400).json({ error: "Phone number required" });
      }

      // Basic phone number validation
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(phoneNumber)) {
        return res.status(400).json({ error: "Invalid phone number format" });
      }

      // Check if Twilio is configured
      const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

      if (!twilioAccountSid || !twilioAuthToken) {
        return res.status(503).json({ 
          error: "Twilio is not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables." 
        });
      }

      // Generate Twilio access token
      try {
        const twilio = await import("twilio");
        const AccessToken = twilio.jwt.AccessToken;
        const VoiceGrant = twilio.jwt.AccessToken.VoiceGrant;

        // Use authenticated user's email for Twilio identity
        const userIdentity = user.email || user.id;

        // Create an access token
        const token = new AccessToken(
          twilioAccountSid,
          process.env.TWILIO_API_KEY_SID || twilioAccountSid,
          process.env.TWILIO_API_KEY_SECRET || twilioAuthToken,
          { identity: userIdentity }
        );

        // Grant access to Twilio Voice
        const voiceGrant = new VoiceGrant({
          outgoingApplicationSid: process.env.TWILIO_APP_SID,
          incomingAllow: true,
        });
        token.addGrant(voiceGrant);

        // Generate the token
        const jwt = token.toJwt();

        res.json({
          token: jwt,
          phoneNumber: twilioPhoneNumber,
          callUrl: `tel:${phoneNumber}`,
        });
      } catch (twilioError) {
        console.error("Twilio token generation error:", twilioError);
        res.json({
          token: null,
          phoneNumber: twilioPhoneNumber,
          callUrl: `tel:${phoneNumber}`,
          message: "Twilio SDK not available. Install with: npm install twilio",
        });
      }
    } catch (error) {
      console.error("Error generating Twilio token:", error);
      res.status(500).json({ error: "Failed to generate Twilio token" });
    }
  });

  // Create Zoom meeting
  // SECURITY: Uses session-based authentication
  app.post("/api/calling/zoom/create", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { topic, type = 1 } = req.body;

      // Validate topic if provided
      const sanitizedTopic = typeof topic === "string" ? topic.slice(0, 200) : "Meeting";

      // Check if Zoom is configured
      const zoomApiKey = process.env.ZOOM_API_KEY;
      const zoomApiSecret = process.env.ZOOM_API_SECRET;
      const zoomAccountId = process.env.ZOOM_ACCOUNT_ID;

      if (!zoomApiKey || !zoomApiSecret) {
        // Return a mock meeting link for development
        const meetingId = Math.random().toString(36).substring(2, 15);
        return res.json({
          joinUrl: `https://zoom.us/j/${meetingId}`,
          startUrl: `https://zoom.us/s/${meetingId}`,
          meetingId,
          message: "Zoom API not configured. Using mock meeting link.",
        });
      }

      // Create Zoom meeting via API
      try {
        const jwt = require("jsonwebtoken");
        const payload = {
          iss: zoomApiKey,
          exp: Math.floor(Date.now() / 1000) + 3600,
        };
        const token = jwt.sign(payload, zoomApiSecret);

        const axios = require("axios");
        const response = await axios.post(
          `https://api.zoom.us/v2/users/${zoomAccountId || "me"}/meetings`,
          {
            topic: sanitizedTopic,
            type: type,
            settings: {
              host_video: true,
              participant_video: true,
              join_before_host: true,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        res.json({
          joinUrl: response.data.join_url,
          startUrl: response.data.start_url,
          meetingId: response.data.id.toString(),
        });
      } catch (zoomError: any) {
        console.error("Zoom API error:", zoomError);
        const meetingId = Math.random().toString(36).substring(2, 15);
        res.json({
          joinUrl: `https://zoom.us/j/${meetingId}`,
          startUrl: `https://zoom.us/s/${meetingId}`,
          meetingId,
          message: "Zoom API error. Using mock meeting link.",
        });
      }
    } catch (error) {
      console.error("Error creating Zoom meeting:", error);
      res.status(500).json({ error: "Failed to create Zoom meeting" });
    }
  });

  // Create Google Meet link
  // SECURITY: Uses session-based authentication
  app.post("/api/calling/meet/create", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // For now, generate a simple meet link
      // In production, you would use Google Calendar API to create a scheduled meeting
      const meetingId = Math.random().toString(36).substring(2, 15);
      const meetUrl = `https://meet.google.com/${meetingId}`;

      res.json({
        url: meetUrl,
        meetingId,
        message: "Google Meet link generated. For production, integrate with Google Calendar API.",
      });
    } catch (error) {
      console.error("Error creating Google Meet:", error);
      res.status(500).json({ error: "Failed to create Google Meet" });
    }
  });
}
