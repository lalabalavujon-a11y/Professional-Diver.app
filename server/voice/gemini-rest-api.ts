import { nanoid } from "nanoid";

const DEFAULT_MODEL = "models/gemini-2.0-flash";

export interface GeminiRestClientOptions {
  apiKey?: string;
  accessToken?: string;
  model?: string;
}

export interface GeminiContentRequest {
  messages: Array<{ role: "user" | "model" | "system"; content: string }>;
  systemInstruction?: string;
  model?: string;
}

function buildAuthHeaders(opts: GeminiRestClientOptions): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.accessToken) {
    headers.Authorization = `Bearer ${opts.accessToken}`;
  } else if (opts.apiKey) {
    headers["X-Goog-Api-Key"] = opts.apiKey;
  }
  return headers;
}

function getModel(opts?: GeminiRestClientOptions): string {
  return opts?.model || process.env.GEMINI_REST_MODEL || DEFAULT_MODEL;
}

export async function generateGeminiContent(
  request: GeminiContentRequest,
  opts: GeminiRestClientOptions = {}
): Promise<any> {
  const model = getModel(opts);
  const apiKey = opts.apiKey || process.env.GEMINI_API_KEY;
  const accessToken = opts.accessToken;

  if (!apiKey && !accessToken) {
    throw new Error("Gemini REST requires either apiKey or accessToken.");
  }

  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/${encodeURIComponent(
      model
    )}:generateContent`
  );

  if (!accessToken && apiKey) {
    url.searchParams.set("key", apiKey);
  }

  const body = {
    system_instruction: request.systemInstruction
      ? { parts: [{ text: request.systemInstruction }] }
      : undefined,
    contents: request.messages.map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      candidateCount: 1,
      maxOutputTokens: 2048,
    },
  };

  const headers = buildAuthHeaders({ apiKey, accessToken });

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const json = await response.json();
  if (!response.ok) {
    const errorMessage =
      json?.error?.message ||
      `Gemini REST request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  return json;
}

export async function chatWithGemini(
  message: string,
  opts: GeminiRestClientOptions = {}
): Promise<string> {
  const response = await generateGeminiContent(
    {
      messages: [{ role: "user", content: message }],
      model: opts.model,
    },
    opts
  );

  const text =
    response?.candidates?.[0]?.content?.parts?.[0]?.text ||
    response?.candidates?.[0]?.output ||
    "";
  return text;
}

export function createGeminiRestClient(opts: GeminiRestClientOptions = {}) {
  const apiKey = opts.apiKey || process.env.GEMINI_API_KEY;
  const accessToken = opts.accessToken;
  const model = getModel(opts);

  return {
    id: nanoid(),
    apiKey,
    accessToken,
    model,
    chat: (message: string) => chatWithGemini(message, { apiKey, accessToken, model }),
    generate: (request: GeminiContentRequest) =>
      generateGeminiContent(
        { ...request, model: request.model || model },
        { apiKey, accessToken, model }
      ),
  };
}
