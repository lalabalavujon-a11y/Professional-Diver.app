# AGENTS.md

This file is a **repo-specific playbook for coding agents** (Cursor background agents, Copilot, etc.). It documents how this project is structured, how to run it, and the conventions/gotchas that matter when making changes.

## Project map (where things live)

- `client/`: Vite + React + TypeScript app
  - Source: `client/src/`
  - Vite root is `client/` (see `vite.config.ts`)
  - Build output: `dist/client/`
- `server/`: Express API (TypeScript)
  - Entry: `server/index.ts`
  - API routes are prefixed with `/api/*`
  - Health: `/health` and `/api/health`
- `shared/`: shared types + Drizzle schemas
  - `shared/schema.ts`: Postgres schema (production / when `DATABASE_URL` is set)
  - `shared/schema-sqlite.ts`: SQLite schema (local dev fallback)
- `migrations/`: Drizzle migrations output
- `worker/`: Cloudflare Worker reverse proxy for `api.*` domain (see `worker/index.ts`)
- `scripts/`: maintenance + deployment + diagnostics scripts

TypeScript path aliases:

- `@/*` → `client/src/*`
- `@shared/*` → `shared/*`

## Quick commands (most common)

Install:

```bash
npm install
```

Run both web + API (recommended for local dev):

```bash
npm run dev:all
```

Run individually:

```bash
npm run dev:web   # http://127.0.0.1:3000
npm run dev:api   # http://127.0.0.1:5000
```

Typecheck / lint:

```bash
npm run typecheck
npm run debug:start   # eslint . (may currently fail on TS/TSX parsing)
```

Linting note:

- The repo has an `eslint .` script, but the current ESLint configuration is minimal and may not successfully parse all TypeScript/TSX files. If you hit parsing errors, prioritize `npm run typecheck` / `npm run build` and scope lint fixes to the files you touched.

Build:

```bash
npm run build
```

## Ports, proxying, and request paths (important)

- **Frontend** runs on `127.0.0.1:3000` (strict).
- **API** runs on `127.0.0.1:5000` by default (or `HOST`/`PORT` env vars).
- Vite dev server proxies:
  - `/api/*` → `http://127.0.0.1:5000/api/*`
  - `/uploads/*` → `http://127.0.0.1:5000/uploads/*`

When implementing new endpoints, keep them under `/api/*` so local dev works seamlessly via the proxy.

## Database behavior (SQLite vs Postgres)

This repo intentionally supports:

- **SQLite (local dev fallback)** when `NODE_ENV=development` **and** `DATABASE_URL` is not set.
  - File: `local-dev.db`
  - Drizzle uses `shared/schema-sqlite.ts`
- **Postgres (production)** when `DATABASE_URL` is set (or not in development).
  - Drizzle uses `shared/schema.ts`

Schema push / migrations:

```bash
npm run db:push
```

Notes:

- `db:push` runs `drizzle-kit push --force` with `CI=true` (be careful; avoid running it unless the change requires it).
- RLS migration helpers exist:
  - `npm run db:migrate:rls`
  - `npm run db:migrate:rls:pg`

## Environment variables (high-signal)

Local development can run with minimal env, but some features require keys.

Backend (Express) commonly uses:

- `NODE_ENV` (development/production)
- `PORT` (default 5000)
- `HOST` (defaults to `127.0.0.1` in dev, `0.0.0.0` in prod)
- `DATABASE_URL` (set to use Postgres instead of local SQLite)
- `OPENAI_API_KEY`, `LANGSMITH_API_KEY`, plus other integration keys (Stripe, email, etc.)

Frontend (Vite) in deployed environments (Cloudflare Pages) needs:

- `VITE_API_URL` pointing at the API base URL

Worker (`worker/index.ts`) requires Cloudflare secret:

- `API_URL` (e.g. `https://professional-diverapp-production.up.railway.app`)

## Conventions for changes (agent guidance)

- **Use TypeScript everywhere**; keep strict typing (`tsconfig.json` is strict).
- **Avoid `any`** unless there is no reasonable alternative and you add a comment explaining why.
- **Prefer shared contracts** in `shared/` for request/response shapes used by both client and server.
- **Don’t break the dev proxy**: API routes should remain under `/api`.
- **Keep server startup resilient**: non-critical subsystems should fail “softly” (the server already follows this pattern).
- **Security**: never commit secrets; don’t introduce permissive CORS in production without justification (the Worker is currently permissive by design).

## Deployment notes (so agents don’t accidentally regress it)

- `npm run build` produces `dist/client` for static hosting (Cloudflare Pages configuration expects this).
- Railway uses `npm run build` then `npm run start` (see `railway.json`).

