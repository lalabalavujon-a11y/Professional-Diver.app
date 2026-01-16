import type { Server as HttpServer, IncomingMessage } from "http";
import WebSocket, { WebSocketServer } from "ws";
import type { AddressInfo } from "net";
import { nanoid } from "nanoid";

type VoiceAgentId = "laura-oracle" | "diver-well";

interface OpenAIToolCall {
  name: string;
  args: Record<string, unknown>;
  id?: string;
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
  const common = [
    {
      type: "function",
      function: {
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
    },
  ];

  const lauraOnly = [
    {
      type: "function",
      function: {
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
    },
  ];

  return agent === "laura-oracle" ? [...common, ...lauraOnly] : common;
}

function parseToolCallsFromOpenAI(message: any): OpenAIToolCall[] {
  if (!message || typeof message !== "object") return [];
  const calls: OpenAIToolCall[] = [];

  // OpenAI Realtime API tool calls often appear as:
  // { type: "response.function_call_arguments.done", name: "tool", call_id, arguments }
  const type = message.type;
  const name = message.name || message.function_call?.name;
  const args = message.arguments || message.function_call?.arguments;
  const callId = message.call_id || message.id;

  if (
    typeof name === "string" &&
    (type?.includes("function_call") || type === "tool_call" || type === "response.function_call_arguments.done")
  ) {
    if (typeof args === "string") {
      try {
        const parsed = JSON.parse(args);
        calls.push({ name, args: parsed, id: callId });
      } catch {
        // Ignore parsing issues; fall through
      }
    } else if (args && typeof args === "object") {
      calls.push({ name, args: args as Record<string, unknown>, id: callId });
    }
  }
  return calls;
}

async function runToolCall(call: OpenAIToolCall): Promise<unknown> {
  const name = call.name;
  const args = call.args || {};

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
        userContext as Record<string, unknown> | undefined
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
    return await laura.executeAdminTask(String(task ?? ""), parameters as Record<string, unknown> | undefined);
  }

  return { error: `Unknown tool "${name}"` };
}

function buildSessionUpdate(agent: VoiceAgentId) {
  const voice = agent === "laura-oracle" ? "alloy" : "onyx";
  return {
    type: "session.update",
    session: {
      id: nanoid(),
      instructions: buildAgentSystemInstruction(agent),
      input_audio_format: "pcm16",
      output_audio_format: "pcm16",
      voice,
      modalities: ["text", "audio"],
      turn_detection: { type: "server_vad" },
      tools: buildToolDeclarations(agent),
    },
  };
}

/**
 * Start a voice session with OpenAI Realtime API. This is used as a fallback
 * from Gemini Live or via dedicated OpenAI endpoints.
 */
export async function startOpenAIVoiceSession(
  agent: VoiceAgentId,
  clientWs: WebSocket
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured for OpenAI Voice.");
  }

  const model =
    process.env.OPENAI_VOICE_MODEL || "gpt-4o-realtime-preview-2024-12-17";

  const upstreamWs = new WebSocket(
    `wss://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "OpenAI-Beta": "realtime=v1",
      },
    }
  );

  upstreamWs.on("open", () => {
    console.log(
      `🎙️ OpenAI Voice upstream connected for ${agent} (model=${model})`
    );
    try {
      upstreamWs.send(JSON.stringify(buildSessionUpdate(agent)));
    } catch (err) {
      console.error("OpenAI Voice: failed to send session update:", err);
    }
  });

  upstreamWs.on("message", async (payload, isBinary) => {
    // Forward upstream messages to the client
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

    // Handle tool calls
    const text =
      typeof payload === "string" ? payload : payload.toString("utf8");
    let parsed: any = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      // ignore parsing errors for non-JSON frames
    }
    const toolCalls = parseToolCallsFromOpenAI(parsed);
    if (!toolCalls.length) return;

    for (const call of toolCalls) {
      try {
        const result = await runToolCall(call);
        if (upstreamWs.readyState === WebSocket.OPEN) {
          upstreamWs.send(
            JSON.stringify({
              type: "response.function_call_arguments.result",
              call_id: call.id ?? call.name,
              result,
            })
          );
        }
      } catch (err) {
        if (upstreamWs.readyState === WebSocket.OPEN) {
          upstreamWs.send(
            JSON.stringify({
              type: "response.function_call_arguments.result",
              call_id: call.id ?? call.name,
              result: {
                error: err instanceof Error ? err.message : String(err),
              },
            })
          );
        }
      }
    }
  });

  upstreamWs.on("close", (code: number, reason: Buffer) => {
    const reasonText = reason?.toString?.() || "";
    console.warn(
      `🎙️ OpenAI Voice upstream closed for ${agent}: code=${code} reason=${reasonText}`
    );
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(1011, `OpenAI Voice upstream closed: ${reasonText}`);
    }
  });

  upstreamWs.on("error", (err) => {
    console.error(`🎙️ OpenAI Voice upstream error for ${agent}:`, err);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(
        1011,
        err instanceof Error ? err.message : "OpenAI upstream error"
      );
    }
  });

  clientWs.on("message", (payload) => {
    if (upstreamWs.readyState !== WebSocket.OPEN) return;
    try {
      upstreamWs.send(payload);
    } catch {
      // ignore
    }
  });

  clientWs.on("close", () => {
    try {
      if (upstreamWs.readyState === WebSocket.OPEN) {
        upstreamWs.close(1000, "Client closed");
      }
    } catch {
      // ignore
    }
  });

  clientWs.on("error", () => {
    try {
      if (upstreamWs.readyState === WebSocket.OPEN) {
        upstreamWs.close(1011, "Client error");
      }
    } catch {
      // ignore
    }
  });
}

/**
 * Dedicated OpenAI Voice WebSocket routes. These are useful for direct testing
 * and also serve as a standalone backup endpoint.
 */
export function registerOpenAIVoiceWsRoutes(httpServer: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true });

  console.log("🎙️ Registering OpenAI Voice WebSocket routes...");

  httpServer.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const pathname = url.pathname;

    const isLaura = pathname === "/api/openai/laura-oracle/live";
    const isDiver = pathname === "/api/openai/diver-well/live";
    if (!isLaura && !isDiver) {
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req, pathname);
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  wss.on("connection", async (clientWs: WebSocket, req: IncomingMessage) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    const pathname = url.pathname;
    const agent: VoiceAgentId =
      pathname === "/api/openai/laura-oracle/live" ? "laura-oracle" : "diver-well";

    console.log(`✅ OpenAI Voice WebSocket connection accepted for ${agent}`);

    try {
      await startOpenAIVoiceSession(agent, clientWs);
    } catch (err) {
      console.error(`OpenAI Voice connection failed for ${agent}:`, err);
      try {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.close(
            1011,
            err instanceof Error ? err.message : "OpenAI Voice connection failed"
          );
        }
      } catch {
        // ignore
      }
    }
  });

  const addr = httpServer.address() as AddressInfo | null;
  console.log(
    `✅ OpenAI Voice WebSocket routes registered${addr?.port ? ` on port ${addr.port}` : ""}`
  );
}
