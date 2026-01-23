# AGENTS.md - AI Agent Instructions

This document provides instructions and context for AI agents working on this codebase.

## Project Overview

This is a **Professional Diving Exam Preparation Platform** built with React, Express, and Drizzle ORM. The application provides comprehensive practice tests and study materials to help divers prepare for certification exams at certified diving schools.

### Key Features
- Professional-grade mock exams for commercial diving certifications
- AI-powered tutors and explanations (DMT, ALST, LST, NDT, Commercial Dive Supervisor, SSED, SAT)
- Voice dictation technology
- Performance analytics and progress tracking
- Learning paths with personalized recommendations
- Mobile app support (iOS/Android via Capacitor)
- Calendar integration (Google, Outlook, Apple, HighLevel)
- Affiliate and sponsor management
- CRM integration with HighLevel

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Wouter** for client-side routing
- **TanStack Query** for data fetching and caching
- **Shadcn/ui** components built on Radix UI primitives
- **Tailwind CSS** for styling
- **Framer Motion** for animations

### Backend
- **Express.js** REST API server
- **TypeScript** throughout
- **Drizzle ORM** for database operations
- **PostgreSQL** (Neon serverless) as primary database
- **LangChain/OpenAI** for AI features
- **Stripe** for payments and affiliate payouts

### Mobile
- **Capacitor** for iOS and Android builds

## Project Structure

```
/workspace
├── client/                 # React frontend application
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── hooks/          # Custom React hooks
│       ├── lib/            # Utility functions
│       └── pages/          # Page components
├── server/                 # Express backend
│   ├── agents/             # AI agent orchestrators
│   ├── api/                # API route handlers
│   ├── lib/                # Backend utilities (calendar sync, etc.)
│   ├── middleware/         # Express middleware
│   ├── routes/             # Route definitions
│   ├── services/           # Business logic services
│   ├── voice/              # Voice/audio features
│   └── index.ts            # Server entry point
├── shared/                 # Shared code between client/server
│   ├── schema.ts           # Drizzle schema (PostgreSQL)
│   └── schema-sqlite.ts    # SQLite schema (development)
├── content/                # Lesson and exam content
├── migrations/             # Database migrations
├── scripts/                # Utility scripts
├── android/                # Android Capacitor config
├── ios/                    # iOS Capacitor config
└── marketing/              # Marketing materials and scripts
```

## Development Commands

```bash
# Start development (both API and web)
npm run dev:all

# Start API only (port 5000)
npm run dev:api

# Start web only (port 3000)
npm run dev:web

# Build for production
npm run build

# Start production server
npm run start

# TypeScript type checking
npm run check
npm run typecheck

# ESLint
npm run debug:start    # Run ESLint
npm run debug:fix      # Auto-fix ESLint issues

# Database
npm run db:push        # Push schema changes to database

# Mobile builds
npm run mobile:ios     # Build and open iOS project
npm run mobile:android # Build and open Android project
```

## Code Style Guidelines

### TypeScript
- Define proper types for all variables
- Use interfaces for object shapes
- Avoid `any` type - use proper typing
- Implement proper error types
- Use generics where appropriate

### React
- Use functional components with hooks
- Implement proper prop validation with TypeScript
- Follow React Hooks rules (no hooks in conditionals/loops)
- Use React.memo for performance optimization where needed
- Prefer TanStack Query for server state management

### File Naming
- Components: PascalCase (e.g., `UserProfile.tsx`)
- Utilities/hooks: camelCase (e.g., `useAuth.ts`)
- Constants: SCREAMING_SNAKE_CASE for values
- Use descriptive, meaningful names

### Imports
- Use path aliases: `@/*` for client/src, `@shared/*` for shared
- Group imports: external packages, internal modules, types
- Use index files for clean exports from directories

## Database Schema

The database uses PostgreSQL with Drizzle ORM. Key tables include:

- **users**: User accounts with roles (USER, ADMIN, SUPER_ADMIN, LIFETIME, AFFILIATE, ENTERPRISE)
- **tracks**: Learning courses/certification tracks
- **lessons**: Individual learning units with content, podcasts, PDFs
- **quizzes/questions**: Assessment content
- **user_progress**: Learning progress tracking
- **ai_tutors**: AI tutor configurations per track
- **learning_paths**: Personalized learning recommendations
- **affiliates/sponsors**: Partnership management
- **calendar_events/sync**: Calendar integration

### Schema Locations
- PostgreSQL: `shared/schema.ts`
- SQLite (dev): `shared/schema-sqlite.ts`
- Affiliate tables: `shared/affiliate-schema.ts`
- Sponsor tables: `shared/sponsor-schema.ts`

## API Design

RESTful endpoints following conventional patterns:

- `/api/auth/*` - Authentication and session management
- `/api/tracks/*` - Learning track operations
- `/api/lessons/*` - Lesson content and management
- `/api/quizzes/*` - Quiz functionality and submissions
- `/api/admin/*` - Administrative operations
- `/api/calendar/*` - Calendar integration
- `/api/affiliates/*` - Affiliate management
- `/api/sponsors/*` - Sponsor management

## Environment Variables

Key environment variables (configured via platform secrets):

- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `STRIPE_SECRET_KEY` - Stripe API key
- `SENDGRID_API_KEY` - Email service
- `GOOGLE_*` - Google OAuth/Calendar credentials
- `HIGHLEVEL_*` - HighLevel CRM integration

## Testing Considerations

- Write testable code with dependency injection
- Implement proper error boundaries
- Add comprehensive logging for debugging
- Consider edge cases in all implementations
- Use proper error handling throughout

## Security Guidelines

- Validate all user inputs with Zod schemas
- Sanitize data before rendering (especially markdown content)
- Use HTTPS in production
- Implement proper authentication middleware
- Follow role-based access patterns
- Never expose sensitive keys in client code

## Important Patterns

### Error Handling
```typescript
try {
  // operation
} catch (error) {
  console.error('Descriptive error message:', error);
  // Return appropriate error response
}
```

### API Response Format
```typescript
// Success
res.json({ success: true, data: result });

// Error
res.status(400).json({ success: false, error: 'Error message' });
```

### Database Queries (Drizzle)
```typescript
import { db } from '../db';
import { users, tracks } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

// Query example
const user = await db.select().from(users).where(eq(users.id, userId));
```

### React Query Usage
```typescript
import { useQuery, useMutation } from '@tanstack/react-query';

const { data, isLoading } = useQuery({
  queryKey: ['tracks'],
  queryFn: () => fetch('/api/tracks').then(r => r.json())
});
```

## Git Workflow

- Create descriptive commit messages
- Keep commits focused and atomic
- Run linting before committing: `npm run debug:fix`
- Run type checking: `npm run typecheck`

## Common Tasks

### Adding a New API Endpoint
1. Define route in `server/routes.ts` or create new file in `server/routes/`
2. Add any new schema types in `shared/schema.ts`
3. Implement service logic in `server/services/` if complex
4. Add proper authentication middleware if needed

### Adding a New Page
1. Create component in `client/src/pages/`
2. Add route in client routing configuration
3. Use TanStack Query for data fetching
4. Follow existing component patterns

### Database Schema Changes
1. Modify `shared/schema.ts`
2. Run `npm run db:push` to apply changes
3. For complex migrations, create SQL file in `migrations/`

## AI Integration

The platform uses LangChain with OpenAI for:
- AI tutors for each certification track
- Laura Oracle (documentation assistant)
- Content generation
- Calendar analysis agents

AI-related code is primarily in:
- `server/ai-tutor.ts`, `server/ai-tutors.ts`
- `server/ai-learning-path.ts`, `server/ai-learning-path-service.ts`
- `server/agents/` - Agent orchestrators
- `server/api/langchain-tutor.ts`, `server/api/laura-oracle.ts`

## Notes for AI Agents

1. **Always read files before editing** - Understand the existing code structure
2. **Follow existing patterns** - Match the coding style of surrounding code
3. **Preserve functionality** - Ensure changes don't break existing features
4. **Add proper error handling** - Don't leave operations without try/catch
5. **Type everything** - Avoid `any` types; use proper TypeScript types
6. **Test your changes** - Consider edge cases and potential issues
7. **Keep commits small** - Make focused, atomic changes
8. **Document complex logic** - Add JSDoc comments for non-obvious code

## Super Debug Agent

This project includes a background debugging agent. Configuration is in `.superdebugrc`. The agent monitors code quality in real-time.

Run with: `npm run debug:monitor`
