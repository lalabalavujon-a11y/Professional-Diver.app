import type { Express } from "express";
import { db } from "../db";
import { users } from "@shared/schema-sqlite";
import { eq } from "drizzle-orm";

/**
 * Register calling-related API routes
 */
export function registerCallingRoutes(app: Express): void {
  // Get user calling preferences
  app.get("/api/calling/preferences", async (req, res) => {
    try {
      const userEmail = req.headers["x-user-email"] as string || 
                       (req.query.email as string) ||
                       req.body?.email;

      if (!userEmail) {
        return res.status(401).json({ error: "User email required" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, userEmail))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Get calling preferences from user data
      // For now, we'll store it in a JSON field or return defaults
      const preferences = (user as any).calling_preferences || {
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
  app.post("/api/calling/preferences", async (req, res) => {
    try {
      const userEmail = req.headers["x-user-email"] as string || 
                       req.body?.email;

      if (!userEmail) {
        return res.status(401).json({ error: "User email required" });
      }

      const preferences = req.body;

      // Update user with calling preferences
      // Note: This assumes calling_preferences is a JSON column in the users table
      // If not, you'll need to add it to the schema
      await db
        .update(users)
        .set({
          // Store preferences as JSON string or in a separate column
          // For now, we'll use a workaround with a JSON field
          ...(preferences as any),
        })
        .where(eq(users.email, userEmail));

      res.json({ success: true, preferences });
    } catch (error) {
      console.error("Error saving calling preferences:", error);
      res.status(500).json({ error: "Failed to save calling preferences" });
    }
  });

  // Generate Twilio access token for phone calls
  app.post("/api/calling/twilio/token", async (req, res) => {
    try {
      const userEmail = req.headers["x-user-email"] as string || 
                       req.body?.email;
      const { phoneNumber } = req.body;

      if (!userEmail) {
        return res.status(401).json({ error: "User email required" });
      }

      if (!phoneNumber) {
        return res.status(400).json({ error: "Phone number required" });
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
      // This requires the Twilio SDK
      try {
        const twilio = await import("twilio");
        const AccessToken = twilio.jwt.AccessToken;
        const VoiceGrant = twilio.jwt.AccessToken.VoiceGrant;

        // Create an access token
        const token = new AccessToken(
          twilioAccountSid,
          process.env.TWILIO_API_KEY_SID || twilioAccountSid,
          process.env.TWILIO_API_KEY_SECRET || twilioAuthToken,
          { identity: userEmail }
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
        // Fallback: Return a simple response if Twilio SDK is not available
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
  app.post("/api/calling/zoom/create", async (req, res) => {
    try {
      const userEmail = req.headers["x-user-email"] as string || 
                       req.body?.email;
      const { topic, type = 1 } = req.body; // type: 1 = instant meeting

      if (!userEmail) {
        return res.status(401).json({ error: "User email required" });
      }

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
        // Generate JWT token for Zoom API
        const jwt = require("jsonwebtoken");
        const payload = {
          iss: zoomApiKey,
          exp: Math.floor(Date.now() / 1000) + 3600,
        };
        const token = jwt.sign(payload, zoomApiSecret);

        // Create meeting
        const axios = require("axios");
        const response = await axios.post(
          `https://api.zoom.us/v2/users/${zoomAccountId || "me"}/meetings`,
          {
            topic: topic || "Meeting",
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
        // Fallback to mock meeting
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

  // Create Google Meet link (via Calendar API)
  app.post("/api/calling/meet/create", async (req, res) => {
    try {
      const userEmail = req.headers["x-user-email"] as string || 
                       req.body?.email;
      const { summary, startTime, endTime } = req.body;

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







