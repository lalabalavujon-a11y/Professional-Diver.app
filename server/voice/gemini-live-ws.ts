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
  // - GEMINI_API_KEY (simplest)
  // - Application Default Credentials (service account / workload identity) via OAuth bearer token

  const apiKey = process.env.GEMINI_API_KEY;
  const urlBase =
    "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent";

  if (apiKey) {
    return new WebSocket(`${urlBase}?key=${encodeURIComponent(apiKey)}`);
  }

  // Fall back to ADC (works well for Vertex/Google Cloud deployments).
  const { google } = await import("googleapis");
  const scopesFromEnv = process.env.GOOGLE_AUTH_SCOPES
    ? process.env.GOOGLE_AUTH_SCOPES.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  const auth = new google.auth.GoogleAuth({
    // Some Gemini Live endpoints require OAuth and can be picky about scopes.
    // Defaults cover both Gemini API + Vertex-style access patterns.
    scopes:
      scopesFromEnv ??
      [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/generative-language",
        // Some projects require explicit Vertex scope even when using the Gemini API host.
        "https://www.googleapis.com/auth/aiplatform",
      ],
  });
  const client = await auth.getClient();
  const tokenResult = await client.getAccessToken();
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

  httpServer.on("upgrade", (req, socket, head) => {
    const url = getWsUrl(req);
    const pathname = url.pathname;

    // Two dedicated endpoints (one per agent).
    const isLaura = pathname === "/api/laura-oracle/live";
    const isDiver = pathname === "/api/diver-well/live";
    if (!isLaura && !isDiver) return;

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, pathname);
    });
  });

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
      sendClientError(
        clientWs,
        "missing_gemini_key",
        err instanceof Error ? err.message : "Failed to start Gemini Live session."
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

    upstreamWs.on("message", async (payload) => {
      // Always forward upstream messages to the client (UI can decide what to render/play).
      try {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(payload);
        }
      } catch {
        // ignore
      }

      // Intercept tool calls, run them locally, and respond back upstream.
      const parsed = safeJsonParse(payload);
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

