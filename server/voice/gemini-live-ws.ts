import type { Server as HttpServer, IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";
import type { AddressInfo } from "net";

type VoiceAgentId = "laura-oracle" | "diver-well";

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

async function createGeminiLiveUpstreamWebSocket(): Promise<WebSocket> {
  // IMPORTANT:
  // - The bidi "Live" WebSocket endpoint is currently exposed via the Gemini API hostname.
  // - We keep this as a server-to-server connection so the browser never sees credentials.
  //
  // Auth options:
  // - GEMINI_API_KEY (NOT SUPPORTED for Live WebSocket - requires OAuth2)
  // - Application Default Credentials (service account / workload identity) via OAuth bearer token
  //
  // NOTE: Gemini Live WebSocket REQUIRES OAuth2 authentication, not API keys.
  // The error "API keys are not supported by this API" confirms this.

  const urlBase =
    "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent";

  // Skip API key check - Gemini Live requires OAuth2
  // const apiKey = process.env.GEMINI_API_KEY;
  // if (apiKey) {
  //   return new WebSocket(`${urlBase}?key=${encodeURIComponent(apiKey)}`);
  // }

  function formatAuthFailure(err: unknown): string {
    // google-auth-library typically throws GaxiosError with a response payload.
    const anyErr = err as any;
    
    // Check for nested errors (Node.js error chaining, google-auth-library wrapping)
    const cause = anyErr?.cause;
    const originalError = anyErr?.originalError || anyErr?.error;
    
    // Log the raw error structure for debugging
    console.error("LAURA: Raw error object structure:", {
      hasResponse: !!anyErr?.response,
      status: anyErr?.response?.status,
      statusText: anyErr?.response?.statusText,
      data: anyErr?.response?.data,
      code: anyErr?.code,
      name: anyErr?.name,
      message: anyErr?.message,
      stack: anyErr?.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
      hasCause: !!cause,
      causeMessage: cause?.message,
      causeCode: cause?.code,
      hasOriginalError: !!originalError,
      originalErrorMessage: originalError?.message,
      originalErrorCode: originalError?.code,
      keys: Object.keys(anyErr || {}),
    });
    
    // If there's a cause or originalError, log it separately
    if (cause) {
      console.error("LAURA: Error cause:", {
        name: cause?.name,
        message: cause?.message,
        code: cause?.code,
        stack: cause?.stack?.split('\n').slice(0, 3).join('\n'),
      });
    }
    if (originalError) {
      console.error("LAURA: Original error:", {
        name: originalError?.name,
        message: originalError?.message,
        code: originalError?.code,
        stack: originalError?.stack?.split('\n').slice(0, 3).join('\n'),
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

  // Log credential file info for debugging
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credsPath) {
    const fs = await import("node:fs");
    try {
      if (fs.existsSync(credsPath)) {
        const stats = fs.statSync(credsPath);
        console.log(`LAURA: Credentials file exists: ${credsPath} (${stats.size} bytes)`);
        // Validate JSON structure
        try {
          const credsContent = fs.readFileSync(credsPath, "utf8");
          const credsJson = JSON.parse(credsContent);
          console.log(`LAURA: Credentials valid JSON - project: ${credsJson.project_id}, client_email: ${credsJson.client_email}`);
          // Check private key format
          if (credsJson.private_key) {
            const keyLines = credsJson.private_key.split('\n');
            const hasBegin = keyLines.some((line: string) => line.includes('BEGIN'));
            const hasEnd = keyLines.some((line: string) => line.includes('END'));
            console.log(`LAURA: Private key format check - has BEGIN: ${hasBegin}, has END: ${hasEnd}, lines: ${keyLines.length}`);
            if (!hasBegin || !hasEnd) {
              console.error("LAURA: ⚠️ Private key may be malformed - missing BEGIN/END markers");
            }
          } else {
            console.error("LAURA: ❌ Private key missing from credentials JSON");
          }
        } catch (parseErr) {
          console.error("LAURA: ❌ Failed to parse credentials JSON:", parseErr instanceof Error ? parseErr.message : parseErr);
        }
      } else {
        console.error(`LAURA: ❌ Credentials file does not exist: ${credsPath}`);
      }
    } catch (fsErr) {
      console.error("LAURA: Error checking credentials file:", fsErr instanceof Error ? fsErr.message : fsErr);
    }
  } else {
    console.warn("LAURA: ⚠️ GOOGLE_APPLICATION_CREDENTIALS not set");
  }

  console.log(`LAURA: Requesting scopes: ${scopes.join(", ")}`);

  const auth = new google.auth.GoogleAuth({
    // Some Gemini Live endpoints require OAuth and can be picky about scopes.
    // Defaults cover both Gemini API + Vertex-style access patterns.
    scopes,
  });
  let client: any;
  try {
    client = await auth.getClient();
    console.log("LAURA: GoogleAuth client created successfully");
  } catch (err) {
    console.error("LAURA: Google ADC getClient() error:", err);
    const formatted = formatAuthFailure(err);
    console.error("LAURA:", formatted);
    throw new Error(formatted);
  }

  let tokenResult: any;
  try {
    // Try to get more details about the client before requesting token
    if (client && typeof client === 'object') {
      console.log("LAURA: Client type:", client.constructor?.name);
      // Check if it's a JWT client and log its properties
      if ('credentials' in client) {
        console.log("LAURA: Client has credentials property");
      }
      if ('projectId' in client) {
        console.log(`LAURA: Client projectId: ${(client as any).projectId}`);
      }
    }
    
    console.log("LAURA: Attempting to get access token...");
    
    // Try to manually test the credentials by reading and validating the key file
    const fs = await import("node:fs");
    const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credsPath && fs.existsSync(credsPath)) {
      try {
        const credsContent = fs.readFileSync(credsPath, "utf8");
        const credsJson = JSON.parse(credsContent);
        
        // Check if private key can be parsed (basic validation)
        if (credsJson.private_key) {
          const key = credsJson.private_key;
          // Remove headers/footers and whitespace for validation
          const keyContent = key.replace(/-----BEGIN[^-]+-----/g, '').replace(/-----END[^-]+-----/g, '').replace(/\s/g, '');
          console.log(`LAURA: Private key content length (without headers): ${keyContent.length} chars`);
          if (keyContent.length < 100) {
            console.error("LAURA: ⚠️ Private key seems too short - might be corrupted");
          }
        }
      } catch (keyErr) {
        console.error("LAURA: Error validating key file:", keyErr instanceof Error ? keyErr.message : keyErr);
      }
    }
    
    // Try with explicit error handling
    try {
      tokenResult = await client.getAccessToken();
      console.log("LAURA: Access token retrieved successfully");
    } catch (tokenErr: any) {
      // Log everything we can find - use JSON.stringify to ensure we see all properties
      const errorDetails: any = {
        message: tokenErr?.message,
        name: tokenErr?.name,
        code: tokenErr?.code,
        errno: tokenErr?.errno,
        syscall: tokenErr?.syscall,
        hostname: tokenErr?.hostname,
        address: tokenErr?.address,
        port: tokenErr?.port,
        toString: String(tokenErr),
      };
      
      // Try to get response details
      if (tokenErr?.response) {
        errorDetails.response = {
          status: tokenErr.response.status,
          statusText: tokenErr.response.statusText,
          data: tokenErr.response.data,
          headers: tokenErr.response.headers,
        };
        console.error("LAURA: Error has HTTP response:", JSON.stringify(errorDetails.response, null, 2));
      }
      
      // Try to get config details
      if (tokenErr?.config) {
        errorDetails.config = {
          url: tokenErr.config.url,
          method: tokenErr.config.method,
          headers: tokenErr.config.headers ? Object.keys(tokenErr.config.headers) : undefined,
        };
        console.error("LAURA: Error request config:", JSON.stringify(errorDetails.config, null, 2));
      }
      
      // Log all enumerable properties
      const allProps: Record<string, any> = {};
      for (const key in tokenErr) {
        try {
          allProps[key] = tokenErr[key];
        } catch {
          allProps[key] = '[cannot serialize]';
        }
      }
      console.error("LAURA: All error properties:", JSON.stringify(allProps, null, 2));
      
      // Log the full error object as JSON
      try {
        console.error("LAURA: Full error object (JSON):", JSON.stringify(tokenErr, Object.getOwnPropertyNames(tokenErr), 2));
      } catch (jsonErr) {
        console.error("LAURA: Could not stringify error:", jsonErr);
      }
      
      console.error("LAURA: Detailed token error summary:", JSON.stringify(errorDetails, null, 2));
      throw tokenErr;
    }
  } catch (err) {
    console.error("LAURA: Google ADC getAccessToken() error:", err);
    
    // Try to get more details from the error
    const anyErr = err as any;
    if (anyErr?.response) {
      console.error("LAURA: Error has response:", {
        status: anyErr.response.status,
        statusText: anyErr.response.statusText,
        data: anyErr.response.data,
      });
    }
    
    // Check if there's an inner error in the stack or message
    const errorString = String(err);
    const errorStack = anyErr?.stack || '';
    console.error("LAURA: Full error string:", errorString);
    console.error("LAURA: Error stack (first 10 lines):", errorStack.split('\n').slice(0, 10).join('\n'));
    
    const formatted = formatAuthFailure(err);
    console.error("LAURA:", formatted);
    throw new Error(formatted);
  }
  const token = typeof tokenResult === "string" ? tokenResult : tokenResult?.token;
  if (!token) {
    throw new Error(
      "Neither GEMINI_API_KEY nor Application Default Credentials are available for Gemini Live."
    );
  }

  return new WebSocket(urlBase, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
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

async function runToolCall(call: GeminiToolCall): Promise<unknown> {
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
    const task = args.task;
    const parameters = args.parameters;
    const LauraOracleService = (await import("../laura-oracle-service")).default;
    const laura = LauraOracleService.getInstance();
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

  httpServer.on("upgrade", (req, socket, head) => {
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

    console.log(`✅ WebSocket upgrade accepted for ${isLaura ? 'laura-oracle' : 'diver-well'}`);

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, pathname);
    });
  });
  
  console.log("✅ Gemini Live Voice WebSocket routes registered");

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  wss.on("connection", async (clientWs: WebSocket, req: IncomingMessage) => {
    const url = getWsUrl(req);
    const pathname = url.pathname;
    const agent: VoiceAgentId =
      pathname === "/api/laura-oracle/live" ? "laura-oracle" : "diver-well";

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
          const result = await runToolCall(call);
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

