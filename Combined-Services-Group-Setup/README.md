# Combined Services Group - Operations Management System

A comprehensive full-stack application for managing salvage operations, vessel tracking, crew management, and project oversight for the Suva Harbour salvage project.

## Features

- **Salvage Operations Management**: Track and manage 34 shipwrecks in Suva Harbour
- **Vessel Tracking**: Monitor foreign-going vessels for hull cleaning operations
- **Crew Management**: Schedule and assign divers, barge operators, and boat operators
- **Project Management**: Track bids, projects, and compliance records
- **Real-time Dashboard**: Overview of operations, progress, and statistics

## Tech Stack

- **Frontend**: Vite + React 19 + TypeScript
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL (production) / SQLite (development)
- **ORM**: Drizzle ORM
- **UI**: Radix UI + Tailwind CSS
- **State Management**: TanStack Query

## Getting Started

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed setup instructions.

Quick start:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run db:push

# Start development servers
npm run dev:all
```

Access the application:
- Frontend: http://localhost:3000
- API: http://localhost:5000

## Project Structure

```
├── server/          # Express backend
├── client/         # React frontend
├── shared/         # Shared types and schemas
└── scripts/        # Utility scripts
```

## Development

- `npm run dev:all` - Start both frontend and backend
- `npm run dev:api` - Start backend only
- `npm run dev:web` - Start frontend only
- `npm run db:push` - Push database schema changes
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking

## License

MIT
