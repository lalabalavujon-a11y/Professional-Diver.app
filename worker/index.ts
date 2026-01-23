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
  ALLOWED_ORIGINS?: string; // Comma-separated list of allowed origins
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

/**
 * Default allowed origins for CORS
 * SECURITY: Explicitly list allowed origins instead of using wildcard with credentials
 */
const DEFAULT_ALLOWED_ORIGINS = [
  "https://professionaldiver.app",
  "https://www.professionaldiver.app",
  "https://professional-diver-app.pages.dev",
];

/**
 * Check if an origin is allowed
 */
function isOriginAllowed(origin: string | null, env: Env): boolean {
  if (!origin) return false;
  
  // Check custom allowed origins from environment
  if (env.ALLOWED_ORIGINS) {
    const customOrigins = env.ALLOWED_ORIGINS.split(",").map(o => o.trim());
    if (customOrigins.includes(origin)) return true;
  }
  
  // Check default allowed origins
  if (DEFAULT_ALLOWED_ORIGINS.includes(origin)) return true;
  
  // Allow localhost in development
  if (env.ENVIRONMENT === "development" || env.NODE_ENV === "development") {
    if (origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:")) {
      return true;
    }
  }
  
  return false;
}

/**
 * Apply CORS headers with proper security
 * SECURITY: Uses explicit origin whitelist instead of wildcard with credentials
 */
function withCors(headers: Headers, origin: string | null, env: Env): Headers {
  // Only allow credentials with explicitly whitelisted origins
  if (origin && isOriginAllowed(origin, env)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  } else {
    // For non-credentialed requests, we can use wildcard
    // But we won't set credentials header
    headers.set("Access-Control-Allow-Origin", "*");
    // Explicitly NOT setting Access-Control-Allow-Credentials
  }
  
  headers.set(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-session-token"
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

    // Get the request origin for CORS handling
    const origin = request.headers.get("Origin");

    // Handle CORS preflight at the edge.
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: withCors(new Headers(), origin, env) });
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
    withCors(outHeaders, origin, env);

    return new Response(resp.body, {
      status: resp.status,
      statusText: resp.statusText,
      headers: outHeaders,
    });
  },
};

