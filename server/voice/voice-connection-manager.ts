import WebSocket from "ws";
import { startOpenAIVoiceSession } from "./openai-live-ws";
import type { Server as HttpServer } from "http";

type VoiceAgentId = "laura-oracle" | "diver-well";

export type VoiceProvider = "gemini-oauth2" | "gemini-api-key" | "openai";

export interface VoiceConnectionResult {
  provider: VoiceProvider;
}

function getBooleanEnv(name: string, defaultValue = false): boolean {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

/**
 * For now, Gemini routes are already registered by gemini-live-ws. This helper
 * registers OpenAI routes as well and documents provider order.
 */
export function registerVoiceProviders(httpServer: HttpServer): void {
  // Existing Gemini Live routes
  // Lazy import to avoid cycles
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { registerGeminiLiveVoiceWsRoutes } = require("./gemini-live-ws");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { registerOpenAIVoiceWsRoutes } = require("./openai-live-ws");
  registerGeminiLiveVoiceWsRoutes(httpServer);
  registerOpenAIVoiceWsRoutes(httpServer);
}

/**
 * Attempt to connect via OpenAI Voice. Used as a final fallback when Gemini fails.
 */
export async function fallbackToOpenAIVoice(
  agent: VoiceAgentId,
  clientWs: WebSocket
): Promise<VoiceConnectionResult> {
  await startOpenAIVoiceSession(agent, clientWs);
  return { provider: "openai" };
}

/**
 * Simple provider selector: checks env to determine if we should try OpenAI first.
 * Currently used to enable/disable fallback dynamically.
 */
export function shouldFallbackToOpenAI(): boolean {
  const provider = process.env.VOICE_PROVIDER?.toLowerCase?.() ?? "auto";
  if (provider === "openai") return true;
  if (provider === "gemini") return false;
  // auto/both defer to env flag
  return getBooleanEnv("VOICE_FALLBACK_ENABLED", true);
}
