#!/bin/bash

# Combined Services Group - Project Initialization Script
# This script sets up the complete project structure

set -e

PROJECT_NAME="Combined-Services-Group"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")/$PROJECT_NAME"

echo "🚀 Initializing Combined Services Group Project..."
echo "📁 Project directory: $PROJECT_DIR"

# Create directory structure
mkdir -p "$PROJECT_DIR"/{server/{routes,services,middleware},shared,client/{src/{pages/{salvage,vessels,crew,projects},components/{salvage,crew,shared,ui},lib,hooks},public},scripts}

echo "✅ Directory structure created"

# Create .gitignore
cat > "$PROJECT_DIR/.gitignore" << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/

# Production
dist/
build/
*.local

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Database
*.sqlite
*.db
.data/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# TypeScript
*.tsbuildinfo

# Vite
.vite/
EOF

echo "✅ .gitignore created"

# Create README.md
cat > "$PROJECT_DIR/README.md" << 'EOF'
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

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Initialize database**:
   ```bash
   npm run db:push
   ```

4. **Start development servers**:
   ```bash
   npm run dev:all
   ```

5. **Access the application**:
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
EOF

echo "✅ README.md created"

echo ""
echo "✨ Project initialization complete!"
echo ""
echo "Next steps:"
echo "1. cd $PROJECT_DIR"
echo "2. npm install"
echo "3. cp .env.example .env"
echo "4. npm run db:push"
echo "5. npm run dev:all"
echo ""
