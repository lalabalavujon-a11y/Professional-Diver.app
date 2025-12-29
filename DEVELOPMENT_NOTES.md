# Development Environment Notes

## Current Tech Stack (as of current session)

### Frontend
- **Build Tool**: Vite (not Next.js)
- **React Version**: 18.3.1
- **Port**: 3000
- **Script**: `npm run dev:web` (vite --host 127.0.0.1 --port 3000)

### Backend
- **Framework**: Express.js with TypeScript
- **Port**: 5000
- **Script**: `npm run dev:api` (NODE_ENV=development PORT=5000 tsx server/index.ts)

### Key Dependencies
- React 18.3.1
- TypeScript 5.6.3
- Vite 5.4.19
- Express 4.21.2
- Drizzle ORM 0.39.1
- Tailwind CSS 3.4.17

## Important Notes
- **Current Project**: Uses Vite (not Next.js) for the frontend
- **Attached Assets**: Contains a separate Next.js 15.4.7 project in `attached_assets/Diver-Well-main/`
- Both servers (3000 and 5000) are currently running and verified
- The project structure follows a client/server separation pattern
- Uses modern React patterns with hooks and functional components

## Version Comparison
- **Current Working Project**: React 18.3.1 + Vite 5.4.19
- **Attached Next.js Project**: React 19.1.0 + Next.js 15.4.7

## Future Considerations
- The attached assets show a more recent Next.js 15.4.7 setup with React 19
- If upgrading to Next.js is planned, this would be a significant architectural change
- Current Vite setup is working well for the project's needs
- Consider the benefits vs. complexity of migrating to Next.js
- **Note**: The laptop may have compatibility issues with newer Next.js versions

## Server Status
- **Frontend**: http://127.0.0.1:3001 ✅ Running (Vite dev server)
- **Backend**: http://127.0.0.1:5000 ✅ Running (Express API server)

## Access URLs
- **Frontend Application**: http://127.0.0.1:3001
- **API Endpoints**: http://127.0.0.1:5000/api/*
