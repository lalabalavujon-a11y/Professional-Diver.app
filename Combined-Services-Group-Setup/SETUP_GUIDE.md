# Combined Services Group - Setup Guide

This guide will help you set up the Combined Services Group project in your new environment.

## Prerequisites

- Node.js 22.x or higher
- npm 10.0.0 or higher
- Git (optional, for version control)

## Quick Start

### 1. Copy Files to Your New Project Directory

Copy all files from `Combined-Services-Group-Setup/` to your new project directory:

```bash
# Create your project directory
mkdir -p "/path/to/your/projects/Combined-Services-Group"
cd "/path/to/your/projects/Combined-Services-Group"

# Copy all files from the setup directory
cp -r /path/to/Combined-Services-Group-Setup/* .
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string (leave empty for SQLite in development)
- `PORT` - Backend server port (default: 5000)
- `SESSION_SECRET` - Generate a random string for session security

### 4. Initialize Database

```bash
npm run db:push
```

This will create the database schema. In development (without DATABASE_URL), it will use SQLite in `.data/dev.sqlite`.

### 5. Start Development Servers

```bash
npm run dev:all
```

This starts both:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure

```
Combined-Services-Group/
├── server/              # Express backend
│   ├── index.ts        # Server entry point
│   ├── db.ts           # Database connection
│   ├── routes.ts       # Route registration
│   ├── routes/         # API route handlers
│   ├── services/       # Business logic
│   └── middleware/     # Express middleware
├── client/             # React frontend
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # Reusable components
│   │   └── lib/        # Utilities and API client
│   └── index.html
├── shared/             # Shared code
│   └── schema.ts       # Database schema
└── scripts/            # Utility scripts
```

## Available Scripts

- `npm run dev:all` - Start both frontend and backend
- `npm run dev:api` - Start backend only (port 5000)
- `npm run dev:web` - Start frontend only (port 3000)
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run typecheck` - Run TypeScript type checking

## Database Schema

The project includes the following main tables:

- **salvageWrecks** - 34 shipwrecks in Suva Harbour
- **vessels** - Foreign-going vessels for hull cleaning
- **crewMembers** - Operations team members
- **projects** - Project and bid management
- **salvageOperations** - Operation logs and tracking

## API Endpoints

### Salvage Operations

- `GET /api/salvage/wrecks` - List all wrecks (with optional filters)
- `GET /api/salvage/wrecks/:id` - Get specific wreck
- `POST /api/salvage/wrecks` - Create new wreck
- `PUT /api/salvage/wrecks/:id` - Update wreck
- `DELETE /api/salvage/wrecks/:id` - Delete wreck (soft delete)
- `GET /api/salvage/wrecks/:id/progress` - Get progress tracking
- `POST /api/salvage/wrecks/:id/assign-crew` - Assign crew
- `GET /api/salvage/stats` - Dashboard statistics
- `POST /api/salvage/wrecks/:id/operations` - Create operation log
- `GET /api/salvage/wrecks/:id/operations` - Get operations for wreck

## Features

✅ Complete CRUD operations for salvage wrecks
✅ Dashboard with statistics and charts
✅ Wreck list with filtering and search
✅ Detailed wreck view with progress tracking
✅ Operation logging
✅ Crew assignment
✅ Financial tracking
✅ Responsive design

## Next Steps

1. **Add Authentication**: Implement user authentication and authorization
2. **Add Crew Management**: Complete crew member CRUD operations
3. **Add Vessel Tracking**: Implement vessel management features
4. **Add Project Management**: Complete project and bid tracking
5. **Integration**: Connect with Professional Diver Training App

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running (if using DATABASE_URL)
- Check DATABASE_URL format: `postgresql://user:password@host:port/database`
- For SQLite, ensure `.data/` directory is writable

### Port Already in Use

- Change PORT in `.env` for backend
- Change port in `vite.config.ts` for frontend

### TypeScript Errors

- Run `npm run typecheck` to see all errors
- Ensure all dependencies are installed: `npm install`

## Support

For issues or questions, refer to the main README.md or project documentation.
