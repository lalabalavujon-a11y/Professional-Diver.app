# AGENTS

Guidance for automated agents working in this repository.

## Repository overview
- client/: React + Vite web UI
- server/: Express API (TypeScript)
- shared/: shared schemas and types
- scripts/: maintenance and data scripts (tsx)
- migrations/: Drizzle SQL migrations
- ios/ and android/: Capacitor mobile targets

## Environment setup
- Node.js 22.x (see .nvmrc)
- npm >= 10
- Install dependencies: npm install

## Common commands
- Dev (API + Web): npm run dev:all
- Dev (API only): npm run dev:api
- Dev (Web only): npm run dev:web
- Typecheck: npm run typecheck
- Lint: npm run debug:start
- Fix lint: npm run debug:fix
- Build: npm run build

## Data and database
- Drizzle migrations live in migrations/
- Push schema (local/dev): npm run db:push
- RLS migrations: npm run db:migrate:rls or npm run db:migrate:rls:pg

## Engineering expectations
- Use TypeScript for new code and avoid any
- Prefer meaningful names and small, focused changes
- Keep package-lock.json updated with dependency changes
- Avoid editing large binary assets in uploads/ or attached_assets unless asked
- Add brief comments only where logic is non-obvious

## Troubleshooting
- See TROUBLESHOOTING.md and DEVELOPMENT_NOTES.md for more context
