import type { Server as HttpServer, IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";
import type { AddressInfo } from "net";
import type { Socket } from "net";
import { fallbackToOpenAIVoice, shouldFallbackToOpenAI } from "./voice-connection-manager";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { sessions as pgSessions, users as pgUsers } from "@shared/schema";
import { sessions as sqliteSessions, users as sqliteUsers } from "@shared/schema-sqlite";

type VoiceAgentId = "laura-oracle" | "diver-well";

// Authentication types and helpers
interface AuthenticatedUser {
  id: string;
  email: string | null;
  role: string | null;
}

const env = process.env.NODE_ENV ?? "development";
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);
const isSQLiteDevMode = env === "development" && !hasDatabaseUrl;

const sessionsTable = isSQLiteDevMode ? sqliteSessions : pgSessions;
const usersTable = isSQLiteDevMode ? sqliteUsers : pgUsers;

/**
 * Parse cookies from request headers
 */
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [key, ...rest] = cookie.trim().split("=");
    if (key) {
      cookies[key] = rest.join("=");
    }
  });
  return cookies;
}

/**
 * Extract session token from WebSocket upgrade request
 * Supports: cookie (sessionToken), query param (?token=), Authorization header
 */
function extractSessionToken(req: IncomingMessage): string | null {
  // 1. Check cookies
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.sessionToken) {
    return cookies.sessionToken;
  }
  
  // 2. Check query parameters
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  const tokenParam = url.searchParams.get("token");
  if (tokenParam) {
    return tokenParam;
  }
  
  // 3. Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }
  
  // 4. Check x-session-token header
  const sessionHeader = req.headers["x-session-token"];
  if (typeof sessionHeader === "string") {
    return sessionHeader.trim();
  }
  
  return null;
}

/**
 * Authenticate WebSocket connection using session token
 * Returns the authenticated user or null if authentication fails
 */
async function authenticateWebSocketConnection(req: IncomingMessage): Promise<AuthenticatedUser | null> {
  const sessionToken = extractSessionToken(req);
  
  if (!sessionToken) {
    console.log("🔐 WebSocket auth failed: No session token provided");
    return null;
  }
  
  try {
    // Look up session
    const sessionResult = await db
      .select()
      .from(sessionsTable)
      .where(eq(sessionsTable.sessionToken, sessionToken))
      .limit(1);
    
    if (!sessionResult || sessionResult.length === 0) {
      console.log("🔐 WebSocket auth failed: Invalid session token");
      return null;
    }
    
    const session = sessionResult[0] as any;
    const expires = session.expires instanceof Date ? session.expires : new Date(session.expires);
    
    if (Number.isNaN(expires.getTime()) || expires <= new Date()) {
      console.log("🔐 WebSocket auth failed: Session expired");
      return null;
    }
    
    // Look up user
    const userResult = await db
      .select({
        id: usersTable.id,
        email: usersTable.email,
        role: usersTable.role,
      })
      .from(usersTable)
      .where(eq(usersTable.id, session.userId))
      .limit(1);
    
    if (!userResult || userResult.length === 0) {
      console.log("🔐 WebSocket auth failed: User not found");
      return null;
    }
    
    const user = userResult[0];
    console.log(`🔐 WebSocket authenticated: user=${user.email || user.id}`);
    
    return {
      id: String(user.id),
      email: user.email ? String(user.email) : null,
      role: user.role ? String(user.role) : null,
    };
  } catch (error) {
    console.error("🔐 WebSocket auth error:", error);
    return null;
  }
}

/**
 * Reject WebSocket upgrade with 401 Unauthorized
 */
function rejectWebSocketUpgrade(socket: Socket, reason: string): void {
  const response = [
    "HTTP/1.1 401 Unauthorized",
    "Content-Type: application/json",
    "Connection: close",
    "",
    JSON.stringify({ error: "Authentication required", message: reason }),
  ].join("\r\n");
  
  socket.write(response);
  socket.destroy();
}

const GEMINI_URL_BASE =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent";

function getBooleanEnv(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

/**
 * Check if running in development mode
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Log verbose debug info only in development mode
 * SECURITY: Prevents credential details from appearing in production logs
 */
function debugLog(message: string, ...args: unknown[]): void {
  if (isDevelopment()) {
    console.log(message, ...args);
  }
}

/**
 * Log verbose debug errors only in development mode
 * SECURITY: Prevents sensitive error details from appearing in production logs
 */
function debugError(message: string, ...args: unknown[]): void {
  if (isDevelopment()) {
    console.error(message, ...args);
  }
}

interface GeminiToolCall {
  name: string;
  args: unknown;
}

function getWsUrl(req: IncomingMessage): URL {
  const host = req.headers.host ?? "localhost";
  const url = req.url ?? "/";
  return new URL(url, `http://${host}`);
}

function safeJsonParse(payload: WebSocket.RawData): unknown | null {
  try {
    const text = typeof payload === "string" ? payload : payload.toString("utf8");
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function extractToolCalls(msg: unknown): GeminiToolCall[] {
  if (!isRecord(msg)) return [];

  // Support a few possible shapes seen in bidi/live payloads.
  const direct = msg.toolCall ?? msg.tool_call ?? msg.toolCalls ?? msg.tool_calls;
  const candidates = Array.isArray(direct) ? direct : direct ? [direct] : [];

  const calls: GeminiToolCall[] = [];
  for (const c of candidates) {
    if (!isRecord(c)) continue;

    // Shape A: { functionCall: { name, args } }
    const fc = c.functionCall ?? c.function_call;
    if (isRecord(fc) && typeof fc.name === "string") {
      calls.push({ name: fc.name, args: fc.args });
      continue;
    }

    // Shape B: { name, args }
    if (typeof c.name === "string") {
      calls.push({ name: c.name, args: c.args });
      continue;
    }
  }

  return calls;
}

function createGeminiLiveWebSocketWithApiKey(urlBase: string): WebSocket {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured for API key fallback.");
  }
  const url = `${urlBase}?key=${encodeURIComponent(apiKey)}`;
  console.log("LAURA: Attempting Gemini Live connection with API key fallback...");
  return new WebSocket(url);
}

async function createGeminiLiveUpstreamWebSocket(): Promise<WebSocket> {
  // IMPORTANT:
  // - The bidi "Live" WebSocket endpoint is currently exposed via the Gemini API hostname.
  // - We keep this as a server-to-server connection so the browser never sees credentials.
  //
  // Auth options:
  // - GEMINI_API_KEY (NOT SUPPORTED for Live WebSocket - requires OAuth2) — we still attempt as a fallback
  // - Application Default Credentials (service account / workload identity) via OAuth bearer token
  //
  // NOTE: Gemini Live WebSocket REQUIRES OAuth2 authentication, but in practice some projects allow API key.
  // We attempt API key only as a fallback or when explicitly configured.

  const urlBase = GEMINI_URL_BASE;

  const forceApiKey = getBooleanEnv("GEMINI_FALLBACK_TO_API_KEY", false);
  const disableOAuth = getBooleanEnv("GEMINI_DISABLE_OAUTH", false);
  const apiKeyAvailable = !!process.env.GEMINI_API_KEY;
  let lastError: unknown = null;

  if (disableOAuth) {
    if (!apiKeyAvailable) {
      throw new Error(
        "GEMINI_DISABLE_OAUTH is enabled but no GEMINI_API_KEY is configured."
      );
    }
    try {
      console.log("LAURA: GEMINI_DISABLE_OAUTH=true, using API key only.");
      return createGeminiLiveWebSocketWithApiKey(urlBase);
    } catch (err) {
      lastError = err;
      console.error("LAURA: API key only mode failed for Gemini Live.", err);
      throw err;
    }
  }

  if (forceApiKey && apiKeyAvailable) {
    try {
      return createGeminiLiveWebSocketWithApiKey(urlBase);
    } catch (err) {
      lastError = err;
      console.error("LAURA: Forced API key connection failed, will try OAuth2 next.", err);
    }
  }

  function formatAuthFailure(err: unknown): string {
    // google-auth-library typically throws GaxiosError with a response payload.
    const anyErr = err as any;
    
    // Check for nested errors (Node.js error chaining, google-auth-library wrapping)
    const cause = anyErr?.cause;
    const originalError = anyErr?.originalError || anyErr?.error;
    
    // SECURITY: Only log detailed error structure in development mode
    debugError("LAURA: Raw error object structure:", {
      hasResponse: !!anyErr?.response,
      status: anyErr?.response?.status,
      statusText: anyErr?.response?.statusText,
      code: anyErr?.code,
      name: anyErr?.name,
      message: anyErr?.message,
    });
    
    // If there's a cause or originalError, log it separately (dev only)
    if (cause) {
      debugError("LAURA: Error cause:", {
        name: cause?.name,
        message: cause?.message,
        code: cause?.code,
      });
    }
    if (originalError) {
      debugError("LAURA: Original error:", {
        name: originalError?.name,
        message: originalError?.message,
        code: originalError?.code,
      });
    }
    
    const msg =
      typeof anyErr?.message === "string" ? anyErr.message : "Unknown auth error";
    const status = anyErr?.response?.status;
    const statusText = anyErr?.response?.statusText;
    const data = anyErr?.response?.data;
    const errorCode = anyErr?.code || anyErr?.response?.data?.error || anyErr?.response?.data?.error_description;
    const errorType = anyErr?.name || anyErr?.constructor?.name || typeof err;
    
    // Try to extract error details from various possible locations
    let dataStr = "";
    if (data) {
      if (typeof data === "object") {
        // Extract error, error_description, or full object
        const errorDetail = data.error || data.error_description || data;
        dataStr = typeof errorDetail === "string" 
          ? errorDetail 
          : JSON.stringify(errorDetail);
      } else if (typeof data === "string") {
        dataStr = data;
      }
    }
    
    // Also check for error in response.data.error
    const responseError = anyErr?.response?.data?.error;
    const responseErrorDesc = anyErr?.response?.data?.error_description;

    const pieces = [
      "Could not refresh access token via Google ADC.",
      status ? `HTTP ${String(status)}` : null,
      statusText ? `statusText=${statusText}` : null,
      errorType && errorType !== "Error" ? `errorType=${errorType}` : null,
      errorCode ? `errorCode=${String(errorCode)}` : null,
      responseError ? `googleError=${String(responseError)}` : null,
      responseErrorDesc ? `googleErrorDesc=${String(responseErrorDesc)}` : null,
      msg ? `message=${msg}` : null,
      dataStr ? `details=${dataStr}` : null,
      "Common fixes: ensure the service account key is enabled (not revoked), system time is correct, billing is enabled, and APIs are enabled (Vertex AI API + Generative Language API).",
    ].filter(Boolean);
    return pieces.join(" ");
  }

  // Fall back to ADC (works well for Vertex/Google Cloud deployments).
  const { google } = await import("googleapis");
  const scopesFromEnv = process.env.GOOGLE_AUTH_SCOPES
    ? process.env.GOOGLE_AUTH_SCOPES.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  const scopes = scopesFromEnv ?? [
    "https://www.googleapis.com/auth/cloud-platform",
    "https://www.googleapis.com/auth/generative-language",
    // Some projects require explicit Vertex scope even when using the Gemini API host.
    "https://www.googleapis.com/auth/aiplatform",
  ];

  try {
    // SECURITY: Only log detailed credential info in development mode
    const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credsPath) {
      const fs = await import("node:fs");
      try {
        if (fs.existsSync(credsPath)) {
          debugLog(`LAURA: Credentials file found`);
          try {
            const credsContent = fs.readFileSync(credsPath, "utf8");
            const credsJson = JSON.parse(credsContent);
            debugLog(`LAURA: Credentials valid JSON - project: ${credsJson.project_id}`);
            if (!credsJson.private_key) {
              console.error("LAURA: ❌ Private key missing from credentials JSON");
            }
          } catch (parseErr) {
            console.error("LAURA: ❌ Failed to parse credentials JSON");
          }
        } else {
          console.error("LAURA: ❌ Credentials file does not exist");
        }
      } catch (fsErr) {
        console.error("LAURA: Error checking credentials file");
      }
    } else {
      debugLog("LAURA: ⚠️ GOOGLE_APPLICATION_CREDENTIALS not set (will use other auth methods)");
    }

    debugLog(`LAURA: Requesting scopes: ${scopes.join(", ")}`);

    const auth = new google.auth.GoogleAuth({
      // Some Gemini Live endpoints require OAuth and can be picky about scopes.
      // Defaults cover both Gemini API + Vertex-style access patterns.
      scopes,
    });
    let client: any;
    client = await auth.getClient();
    debugLog("LAURA: GoogleAuth client created successfully");

    let tokenResult: any;
    try {
      // SECURITY: Only log detailed client info in development
      if (isDevelopment() && client && typeof client === 'object') {
        debugLog("LAURA: Client type:", client.constructor?.name);
        if ('projectId' in client) {
          debugLog(`LAURA: Client projectId: ${(client as any).projectId}`);
        }
      }
      
      debugLog("LAURA: Attempting to get access token...");
      
      // Try with explicit error handling
      try {
        tokenResult = await client.getAccessToken();
        debugLog("LAURA: Access token retrieved successfully");
      } catch (tokenErr: any) {
        debugError("LAURA: getAccessToken() failed:", tokenErr?.message || "Unknown error");
        
        // SECURITY: Only attempt manual JWT request in development for debugging
        if (isDevelopment()) {
          debugLog("LAURA: Attempting manual JWT token request to capture actual error...");
          try {
            const fsMod = await import("node:fs");
            const fs = fsMod.default || fsMod;
            const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
            if (credsPath && fs.existsSync(credsPath)) {
              const credsContent = fs.readFileSync(credsPath, "utf8");
              const credsJson = JSON.parse(credsContent);
              
              const jwtModule = await import("jsonwebtoken");
              const jwt = jwtModule.default || jwtModule;
              const now = Math.floor(Date.now() / 1000);
              const jwtPayload = {
                iss: credsJson.client_email,
                sub: credsJson.client_email,
                aud: "https://oauth2.googleapis.com/token",
                exp: now + 3600,
                iat: now,
                scope: scopes.join(" "),
              };
              
              debugLog("LAURA: Creating JWT for manual token request");
              
              try {
                const signedJwt = jwt.sign(jwtPayload, credsJson.private_key, { algorithm: "RS256" });
                debugLog("LAURA: JWT signed successfully");
                
                const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
                  method: "POST",
                  headers: { "Content-Type": "application/x-www-form-urlencoded" },
                  body: new URLSearchParams({
                    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    assertion: signedJwt,
                  }).toString(),
                });
                
                const tokenData = await tokenResponse.json() as any;
                debugLog("LAURA: Token exchange response status:", tokenResponse.status);
                if (tokenData.access_token) {
                  debugLog("LAURA: access_token obtained via manual request");
                }
              
              if (!tokenResponse.ok) {
                debugError("LAURA: ❌ Token exchange failed");
                debugError("LAURA: HTTP Status:", tokenResponse.status);
              } else {
                if (tokenData.access_token) {
                  debugLog("LAURA: ✅ Token exchange successful");
                  tokenResult = { token: tokenData.access_token };
                } else if (tokenData.id_token) {
                  throw new Error("OAuth2 token response missing access_token (got id_token instead)");
                } else {
                  throw new Error("OAuth2 token response missing access_token");
                }
              }
            } catch (jwtErr: any) {
              debugError("LAURA: ❌ JWT signing failed:", jwtErr?.message);
            }
          }
        } catch (manualErr: any) {
          debugError("LAURA: Manual token request failed:", manualErr?.message);
        }
        }
        
        // If manual token request also failed, throw the original error
        if (!tokenResult) {
          console.error("LAURA: All token request methods failed");
          throw tokenErr;
        }
      }
    } catch (err) {
      // SECURITY: Only log minimal error info in production
      console.error("LAURA: Google ADC getAccessToken() error");
      debugError("LAURA: Error details:", err);
      
      const formatted = formatAuthFailure(err);
      console.error("LAURA: Auth failure -", isDevelopment() ? formatted : "See development logs for details");
      throw new Error(formatted);
    }
    const token = typeof tokenResult === "string" ? tokenResult : tokenResult?.token;
    if (!token) {
      throw new Error(
        "Neither GEMINI_API_KEY nor Application Default Credentials are available for Gemini Live."
      );
    }

    debugLog("LAURA: Using OAuth2 bearer token for Gemini Live connection.");
    return new WebSocket(urlBase, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (oauthErr) {
    lastError = oauthErr;
    debugError("LAURA: OAuth2 connection failed, considering API key fallback...");
  }

  if (apiKeyAvailable) {
    try {
      const ws = createGeminiLiveWebSocketWithApiKey(urlBase);
      console.log("LAURA: Gemini Live connected using API key fallback.");
      return ws;
    } catch (apiErr) {
      lastError = apiErr;
      console.error("LAURA: API key fallback failed.", apiErr);
    }
  }

  const message =
    "Gemini Live could not obtain credentials (OAuth2 and API key both failed).";
  console.error("LAURA:", message, lastError);
  throw new Error(message);
}

function buildAgentSystemInstruction(agent: VoiceAgentId): string {
  if (agent === "laura-oracle") {
    return [
      "You are Laura, the Platform Oracle for the Professional Diver Training Platform.",
      "You speak with a friendly, confident, helpful tone.",
      "Use a warm, natural female voice when speaking.",
      "Be concise and action-oriented.",
      "If a request requires platform data, ask clarifying questions or call tools.",
    ].join("\n");
  }

  return [
    "You are Diver Well, the Commercial Diving Operations AI Consultant.",
    "SAFETY OF LIFE IS PARAMOUNT in every recommendation.",
    "Be professional, direct, conservative, and standards-focused.",
    "Use a mature, authoritative male voice when speaking.",
    "If a request is safety-critical or requires calculations or verification, call tools or ask for required inputs.",
  ].join("\n");
}

function buildToolDeclarations(agent: VoiceAgentId) {
  // These tools let Gemini (voice loop) delegate “heavy lifting” to your existing services.
  // Note: Field casing in v1alpha bidi payloads can vary; we use snake_case as commonly used in examples.
  const common = [
    {
      name: "background_agent_chat",
      description:
        "Delegate complex requests to the platform's existing background agent stack and return the result.",
      parameters: {
        type: "object",
        properties: {
          agent: {
            type: "string",
            enum: ["laura-oracle", "diver-well"],
            description: "Which background agent to invoke.",
          },
          message: { type: "string", description: "User request (text)." },
          sessionId: {
            type: "string",
            description: "Optional session ID for tracing.",
          },
          userContext: {
            type: "object",
            description: "Optional user context for role-aware responses.",
          },
        },
        required: ["agent", "message"],
      },
    },
  ];

  const lauraOnly = [
    {
      name: "laura_admin_task",
      description:
        "Execute an administrative task through Laura's existing admin task handler.",
      parameters: {
        type: "object",
        properties: {
          task: { type: "string" },
          parameters: { type: "object" },
        },
        required: ["task"],
      },
    },
  ];

  return agent === "laura-oracle" ? [...common, ...lauraOnly] : common;
}

async function runToolCall(call: GeminiToolCall, user?: AuthenticatedUser): Promise<unknown> {
  const name = call.name;
  const args = isRecord(call.args) ? call.args : {};

  if (name === "background_agent_chat") {
    const agent = args.agent;
    const message = args.message;
    const sessionId = args.sessionId;
    const userContext = args.userContext;

    if (agent === "laura-oracle") {
      const LauraOracleService = (await import("../laura-oracle-service")).default;
      const laura = LauraOracleService.getInstance();
      const result = await laura.chatWithOracle(
        String(message ?? ""),
        sessionId ? String(sessionId) : undefined,
        userContext
      );
      return result;
    }

    if (agent === "diver-well") {
      const DiverWellService = (await import("../diver-well-service")).default;
      const diver = DiverWellService.getInstance();
      const result = await diver.chatWithConsultant(
        String(message ?? ""),
        sessionId ? String(sessionId) : undefined
      );
      return result;
    }

    return { error: `Unknown agent "${String(agent)}"` };
  }

  if (name === "laura_admin_task") {
    // SECURITY: Only allow admin users to execute admin tasks
    if (!user || user.role !== "admin") {
      console.warn(`🔐 Admin task rejected - user ${user?.email || user?.id || 'unknown'} is not an admin`);
      return { error: "Unauthorized: Admin privileges required for this operation" };
    }
    
    const task = args.task;
    const parameters = args.parameters;
    const LauraOracleService = (await import("../laura-oracle-service")).default;
    const laura = LauraOracleService.getInstance();
    console.log(`🔐 Admin task authorized for user ${user.email || user.id}: ${task}`);
    return await laura.executeAdminTask(String(task ?? ""), parameters);
  }

  return { error: `Unknown tool "${name}"` };
}

function buildSetupMessage(agent: VoiceAgentId) {
  // Prefer a "live" model by default; can be overridden per environment.
  // If your project only has access to different model IDs, set GEMINI_LIVE_MODEL.
  const model =
    process.env.GEMINI_LIVE_MODEL || "models/gemini-2.0-flash-live-001";

  return {
    setup: {
      model,
      system_instruction: {
        parts: [{ text: buildAgentSystemInstruction(agent) }],
      },
      // Ask the model to respond with audio in addition to any text it wants to emit.
      generation_config: {
        response_modalities: ["AUDIO", "TEXT"],
      },
      tools: [
        {
          function_declarations: buildToolDeclarations(agent),
        },
      ],
    },
  };
}

function sendClientError(
  clientWs: WebSocket,
  code: string,
  message: string,
  onSent?: () => void
): void {
  if (clientWs.readyState !== WebSocket.OPEN) return;
  clientWs.send(
    JSON.stringify({
      type: "error",
      code,
      message,
    }),
    onSent
  );
}

export function registerGeminiLiveVoiceWsRoutes(httpServer: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  console.log("🎙️ Registering Gemini Live Voice WebSocket routes...");

  httpServer.on("upgrade", async (req, socket, head) => {
    const url = getWsUrl(req);
    const pathname = url.pathname;

    console.log(`🔌 WebSocket upgrade request: ${req.method} ${pathname} from ${req.headers.origin || 'unknown origin'}`);

    // Two dedicated endpoints (one per agent).
    const isLaura = pathname === "/api/laura-oracle/live";
    const isDiver = pathname === "/api/diver-well/live";
    if (!isLaura && !isDiver) {
      console.log(`⚠️ WebSocket upgrade ignored - path not matched: ${pathname}`);
      return;
    }

    // SECURITY: Authenticate the WebSocket connection before accepting
    const user = await authenticateWebSocketConnection(req);
    if (!user) {
      console.log(`🔐 WebSocket upgrade rejected - authentication required for ${pathname}`);
      rejectWebSocketUpgrade(socket as Socket, "Valid session token required for voice endpoints");
      return;
    }

    console.log(`✅ WebSocket upgrade accepted for ${isLaura ? 'laura-oracle' : 'diver-well'} (user: ${user.email || user.id})`);

    wss.handleUpgrade(req, socket, head, (ws) => {
      // Attach user info to the connection for later use
      (ws as any).authenticatedUser = user;
      wss.emit("connection", ws, req, pathname);
    });
  });
  
  console.log("✅ Gemini Live Voice WebSocket routes registered (with authentication)");

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  wss.on("connection", async (clientWs: WebSocket, req: IncomingMessage) => {
    const url = getWsUrl(req);
    const pathname = url.pathname;
    const agent: VoiceAgentId =
      pathname === "/api/laura-oracle/live" ? "laura-oracle" : "diver-well";
    
    // Get authenticated user from the connection (set during upgrade)
    const authenticatedUser: AuthenticatedUser | undefined = (clientWs as any).authenticatedUser;
    if (!authenticatedUser) {
      // This should not happen if upgrade handler worked correctly, but defensive check
      console.error("🔐 Connection established without authentication - closing");
      clientWs.close(1008, "Authentication required");
      return;
    }
    
    console.log(`🎙️ Voice connection established for ${agent} (user: ${authenticatedUser.email || authenticatedUser.id})`);

    let upstreamWs: WebSocket | null = null;
    let closed = false;

    const closeBoth = (reason: string) => {
      if (closed) return;
      closed = true;
      try {
        if (clientWs.readyState === WebSocket.OPEN) clientWs.close(1011, reason);
      } catch {
        // ignore
      }
      try {
        if (upstreamWs && upstreamWs.readyState === WebSocket.OPEN) {
          upstreamWs.close(1011, reason);
        }
      } catch {
        // ignore
      }
    };

    try {
      upstreamWs = await createGeminiLiveUpstreamWebSocket();
    } catch (err) {
      // Log the full error details for debugging
      console.error(`LAURA: Failed to create Gemini Live upstream WebSocket for ${agent}:`, err);
      const errorMessage = err instanceof Error ? err.message : "Failed to start Gemini Live session.";
      console.error(`LAURA: Error message: ${errorMessage}`);

      // Attempt OpenAI Voice fallback if enabled
      if (shouldFallbackToOpenAI()) {
        try {
          console.warn("LAURA: Attempting OpenAI Voice fallback...");
          await fallbackToOpenAIVoice(agent, clientWs);
          console.log("LAURA: OpenAI Voice fallback connected.");
          return;
        } catch (fallbackErr) {
          console.error("LAURA: OpenAI Voice fallback failed:", fallbackErr);
        }
      }

      sendClientError(
        clientWs,
        "missing_gemini_key",
        errorMessage
      );
      closeBoth("Gemini Live not configured");
      return;
    }

    upstreamWs.on("open", () => {
      try {
        const model = process.env.GEMINI_LIVE_MODEL || "models/gemini-2.0-flash-exp";
        console.log(
          `🎙️ Gemini Live upstream connected for ${agent} (model=${model})`
        );
        upstreamWs?.send(JSON.stringify(buildSetupMessage(agent)));
      } catch (err) {
        sendClientError(
          clientWs,
          "setup_failed",
          err instanceof Error ? err.message : "Failed to send setup."
        );
        closeBoth("Setup failed");
      }
    });

    upstreamWs.on("message", async (payload, isBinary) => {
      // Always forward upstream messages to the client (UI can decide what to render/play).
      // IMPORTANT: Forward JSON as *text* frames so browsers don't treat it as binary.
      try {
        if (clientWs.readyState === WebSocket.OPEN) {
          if (!isBinary) {
            const text =
              typeof payload === "string" ? payload : payload.toString("utf8");
            clientWs.send(text);
          } else {
            clientWs.send(payload, { binary: true });
          }
        }
      } catch {
        // ignore
      }

      // Intercept tool calls, run them locally, and respond back upstream.
      const parsed = isBinary ? null : safeJsonParse(payload);
      const toolCalls = extractToolCalls(parsed);
      if (!toolCalls.length) return;

      for (const call of toolCalls) {
        try {
          const result = await runToolCall(call, authenticatedUser);
          if (upstreamWs?.readyState === WebSocket.OPEN) {
            upstreamWs.send(
              JSON.stringify({
                tool_response: {
                  function_response: {
                    name: call.name,
                    response: result,
                  },
                },
              })
            );
          }
        } catch (err) {
          if (upstreamWs?.readyState === WebSocket.OPEN) {
            upstreamWs.send(
              JSON.stringify({
                tool_response: {
                  function_response: {
                    name: call.name,
                    response: {
                      error: err instanceof Error ? err.message : String(err),
                    },
                  },
                },
              })
            );
          }
        }
      }
    });

    upstreamWs.on("close", (code: number, reason: Buffer) => {
      const reasonText = reason?.toString?.() || "";
      const closeSummary = `Upstream closed (code=${code}) ${reasonText}`.trim();
      console.warn(
        `🎙️ Gemini Live upstream closed for ${agent}: code=${code} reason=${reasonText}`
      );
      if (clientWs.readyState === WebSocket.OPEN) {
        sendClientError(
          clientWs,
          "upstream_closed",
          `Gemini Live ${closeSummary}`.trim()
        );
        setTimeout(() => closeBoth(closeSummary), 250);
        return;
      }
      closeBoth(closeSummary);
    });
    upstreamWs.on("error", (err) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        sendClientError(
          clientWs,
          "upstream_error",
          err instanceof Error ? err.message : "Gemini upstream error"
        );
        setTimeout(() => closeBoth("Upstream error"), 250);
        return;
      }
      closeBoth("Upstream error");
    });
    upstreamWs.on("unexpected-response", (_req, res) => {
      const status = res.statusCode;
      const statusText = res.statusMessage;
      console.error(
        `🎙️ Gemini Live upstream unexpected response for ${agent}: ${status} ${statusText}`
      );
      if (clientWs.readyState === WebSocket.OPEN) {
        sendClientError(
          clientWs,
          "upstream_unexpected_response",
          `Gemini Live upstream unexpected response: ${status} ${statusText}`.trim()
        );
        setTimeout(() => closeBoth("Upstream unexpected response"), 250);
        return;
      }
      closeBoth("Upstream unexpected response");
    });

    clientWs.on("message", (payload) => {
      // The browser sends either:
      // - realtime_input (audio chunks), or
      // - client_content (text turns), or any other Gemini bidi payload.
      if (!upstreamWs || upstreamWs.readyState !== WebSocket.OPEN) return;
      try {
        upstreamWs.send(payload);
      } catch {
        // ignore
      }
    });

    clientWs.on("close", () => closeBoth("Client closed"));
    clientWs.on("error", () => closeBoth("Client error"));

    // Let the UI know which agent was selected (and which backend port we’re on in dev).
    try {
      const addr = httpServer.address() as AddressInfo | null;
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: "connected",
            agent,
            server: {
              port: addr?.port ?? null,
            },
          })
        );
      }
    } catch {
      // ignore
    }
  });
}

