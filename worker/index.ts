/**
 * Cloudflare Worker reverse proxy for the API domain.
 *
 * Routes:
 * - api.professionaldiver.app/* → ${API_URL}/*
 *
 * Secrets required (set in Cloudflare dashboard or via wrangler):
 * - API_URL (e.g. https://professional-diverapp-production.up.railway.app)
 *
 * Notes:
 * - For WebSockets, Cloudflare Workers can proxy Upgrade requests by passing through `fetch()`.
 * - We set permissive CORS headers for browser clients (adjust as needed).
 */

export interface Env {
  API_URL: string;
  DATABASE_URL?: string; // not used here but exists in your worker env
  ENVIRONMENT?: string;
  NODE_ENV?: string;
  CORS_ALLOW_ORIGINS?: string;
}

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
]);

function parseAllowedOrigins(env: Env): string[] {
  if (!env.CORS_ALLOW_ORIGINS) return [];
  return env.CORS_ALLOW_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function withCors(headers: Headers, origin: string | null, allowedOrigins: string[]): Headers {
  if (origin && allowedOrigins.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  } else {
    headers.set("Access-Control-Allow-Origin", "*");
    headers.delete("Access-Control-Allow-Credentials");
  }
  headers.set(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-user-email, x-session-token"
  );
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  // Avoid caches interfering with auth/session flows.
  if (!headers.has("Cache-Control")) headers.set("Cache-Control", "no-store");
  return headers;
}

function cloneRequestHeaders(req: Request): Headers {
  const out = new Headers();
  for (const [k, v] of req.headers.entries()) {
    const key = k.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(key)) continue;
    out.set(k, v);
  }
  return out;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!env.API_URL) {
      return new Response("Missing API_URL secret", { status: 500 });
    }

    const allowedOrigins = parseAllowedOrigins(env);
    const origin = request.headers.get("Origin");

    // Handle CORS preflight at the edge.
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: withCors(new Headers(), origin, allowedOrigins),
      });
    }

    const upstreamBase = env.API_URL.startsWith("http")
      ? env.API_URL
      : `https://${env.API_URL}`;
    const upstream = new URL(upstreamBase);
    const url = new URL(request.url);

    // Preserve path + query.
    upstream.pathname = url.pathname;
    upstream.search = url.search;

    const headers = cloneRequestHeaders(request);
    headers.set("host", upstream.host);
    headers.set("x-forwarded-host", url.host);
    headers.set("x-forwarded-proto", url.protocol.replace(":", ""));

    const resp = await fetch(upstream.toString(), {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : request.body,
      redirect: "manual",
    });

    const outHeaders = new Headers(resp.headers);
    withCors(outHeaders, origin, allowedOrigins);

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: outHeaders,
    });
  },
};

