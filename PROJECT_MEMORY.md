# PROJECT MEMORY - Professional Diver Training Platform

## 🧠 CRITICAL: This file helps Cursor AI remember what's been implemented!

**Last Updated:** 2025-01-18

---

## 📚 Core Training Tracks (7 Professional Diving Tracks)

These tracks are seeded via `scripts/professional-seed.ts`:

1. **inspection-ndt** - Inspection & Non-Destructive Testing (NDT)
   - Slug: `inspection-ndt`
   - AI Tutor: Dr. Sarah Chen
   - Published: Yes

2. **diver-medic-technician** - Diver Medic Technician
   - Slug: `diver-medic-technician`
   - AI Tutor: James (DMT)
   - Published: Yes

3. **commercial-dive-supervisor** - Commercial Dive Supervisor
   - Slug: `commercial-dive-supervisor`
   - AI Tutor: David (Commercial Supervisor)
   - Published: Yes

4. **air-diver-certification** - Air Diver Certification
   - Slug: `air-diver-certification`
   - AI Tutor: Michael (Air Diving)
   - Published: Yes

5. **saturation-diver-training** - Saturation Diver Training
   - Slug: `saturation-diver-training`
   - AI Tutor: Marcus (Saturation)
   - Published: Yes

6. **assistant-life-support-technician** - Assistant Life Support Technician (ALST)
   - Slug: `assistant-life-support-technician`
   - AI Tutor: Elena (ALST)
   - Published: Yes

7. **life-support-technician** - Life Support Technician (LST)
   - Slug: `life-support-technician`
   - AI Tutor: Maria (LST)
   - Published: Yes

### Additional Tracks (from other seed scripts)

- **underwater-welding** - Underwater Welding Operations
  - Slug: `underwater-welding`
  - AI Tutor: Lisa (Welding)
  - Script: `scripts/add-welding-lessons.ts`

- **hyperbaric-operations** - Hyperbaric Operations
  - Slug: `hyperbaric-operations`
  - AI Tutor: Michael (Hyperbaric)
  - Script: `scripts/add-hyperbaric-lessons.ts`

---

## 🔑 Key Features Implemented

### Authentication & User Management
- **SUPER_ADMIN forcing logic** in `admin-dashboard.tsx`
  - Email: `lalabalavu.jon@gmail.com`
  - Hardcoded in multiple places to ensure SUPER_ADMIN access
  - Location: `client/src/pages/admin-dashboard.tsx` lines 48-55, 58-79, 113-122
- Session-based authentication
- Role-based access control (USER, ADMIN, SUPER_ADMIN, LIFETIME, AFFILIATE, ENTERPRISE)
- Trial user system

### Content Management
- **Track detail pages** - `/tracks/:slug`
  - API: `GET /api/tracks/:slug` (returns track with lessons)
  - Fixed: Added missing `queryFn` in `track-detail.tsx` (2025-01-18)
- Lesson management with markdown content
- Quiz and exam system
- Progress tracking

### Location & GPS Features
- **GPS location widgets** with error handling
  - API: `POST /api/widgets/location/gps`
  - Error handling in `compact-navigation-widget.tsx`
  - Handles permission denied, unavailable, timeout errors
- Location-based weather and tides
- Navigation waypoints and routes
- Medical facilities directory

### CRM System
- Client management (`/crm`)
- HighLevel CRM integration
- Partner program management
- Affiliate system with commission tracking
- Communication tracking

### AI Features
- **9 Discipline-Specific AI Tutors:**
  1. Sarah (NDT) - Non-Destructive Testing
  2. Maria (LST) - Life Support Technician
  3. Elena (ALST) - Assistant Life Support Technician
  4. James (DMT) - Dive Medical Technician
  5. David (Commercial Supervisor)
  6. Marcus (Saturation)
  7. Lisa (Welding)
  8. Michael (Hyperbaric/Air Diving)
- **Laura Oracle** - Platform Oracle AI Assistant
- **Diver Well** - Operations Consultant
- LangChain + LangSmith integration
- OpenAI GPT-4o for all AI features
- Voice responses with OpenAI TTS (Alloy voice)

### Admin Features
- Admin dashboard (`/admin`)
- User management container
- Content editing (tracks, lessons, quizzes)
- Analytics dashboard
- Invite system
- Feature flags and role-based permissions
- SRS (Spaced Repetition System) administration

### Operations Tools
- Operations calendar
- Equipment management
- Dive supervisor tools
- Team member management
- Dive operations planning
- Daily project reports (DPRs)
- CAS/EVAC drills tracking
- Toolbox talks
- Hazard assessments

---

## 🛠️ Technical Stack

### Frontend
- **Build Tool:** Vite (NOT Next.js)
- **Framework:** React 19 with TypeScript
- **Routing:** Wouter
- **State Management:** TanStack Query (React Query)
- **Styling:** Tailwind CSS
- **Port:** 3000 (dev)

### Backend
- **Framework:** Express.js with TypeScript
- **Database:** SQLite (dev) / PostgreSQL (production)
- **ORM:** Drizzle ORM
- **Port:** 5000 (dev)

### AI Integration
- LangChain
- LangSmith
- OpenAI GPT-4o
- OpenAI TTS (Alloy voice)

### Mobile
- Capacitor (iOS & Android native apps)

---

## 📁 Important File Locations

### Key Pages
- `client/src/pages/admin-dashboard.tsx` - Admin dashboard with SUPER_ADMIN forcing
- `client/src/pages/track-detail.tsx` - Track detail page (FIXED: added queryFn)
- `client/src/pages/tracks.tsx` - Track listing page
- `client/src/pages/lesson-detail.tsx` - Lesson detail page

### Key Components
- `client/src/components/widgets/compact-navigation-widget.tsx` - GPS location widget
- `client/src/components/role-based-navigation.tsx` - Navigation with role checks
- `client/src/components/user-management-container.tsx` - User management

### Backend Routes
- `server/routes.ts` - Main API routes (7182 lines!)
- `server/temp-storage.ts` - Database storage layer
- `server/laura-oracle-service.ts` - Laura Oracle AI service

### Database
- `shared/schema.ts` - PostgreSQL schema
- `shared/schema-sqlite.ts` - SQLite schema
- `scripts/professional-seed.ts` - Main seed script for tracks

---

## 🔧 API Endpoints

### Tracks
- `GET /api/tracks` - List all published tracks
- `GET /api/tracks?all=true` - List all tracks (including unpublished)
- `GET /api/tracks/:slug` - Get track by slug (includes lessons)
- `GET /api/tracks/:slug/lessons` - Get lessons for a track
- `PATCH /api/tracks/:id` - Update track (e.g., publish status)

### Location/GPS
- `GET /api/widgets/location` - Get saved location
- `POST /api/widgets/location` - Save location
- `POST /api/widgets/location/gps` - Save GPS location

### Users
- `GET /api/users/current` - Get current user
- `GET /api/users/current/permissions` - Get user permissions
- `PUT /api/users/profile` - Update user profile

### Admin
- `GET /api/admin/invites` - List invites
- `POST /api/admin/invites` - Create invite
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/user-permissions` - Get user permissions
- `POST /api/admin/sync-partners-to-crm` - Sync partners to CRM

---

## 🐛 Known Issues & Fixes

### Fixed Issues (2025-01-18)
1. **Track not found error** - Fixed `track-detail.tsx` by adding missing `queryFn` to `useQuery` hook
   - Issue: `useQuery` was missing `queryFn`, so it never fetched data
   - Fix: Added `queryFn` that fetches from `/api/tracks/:slug`

### GPS Location Error
- Error handling already implemented in `compact-navigation-widget.tsx`
- Handles: permission denied, unavailable, timeout, browser support
- Shows user-friendly error messages

---

## 🚀 Deployment

### Development
```bash
npm run dev:all  # Starts both API (5000) and frontend (3000)
npm run dev:api  # API only
npm run dev:web  # Frontend only
```

### Database Seeding
```bash
# Seed tracks and lessons (won't clear existing data)
tsx scripts/professional-seed.ts

# Clear and reseed (WARNING: deletes all data)
CLEAR_DB=true tsx scripts/professional-seed.ts
```

### Production
- **Frontend:** Cloudflare Pages
- **Backend:** Railway
- **Database:** Supabase (PostgreSQL)

---

## 📝 Notes for Cursor AI

### When Working on This Project:
1. **ALWAYS check this file first** before implementing features
2. **Tracks exist** - Don't recreate them, use the seed script
3. **SUPER_ADMIN is hardcoded** - Don't remove the forcing logic in admin-dashboard.tsx
4. **Use queryFn** - All `useQuery` hooks MUST have a `queryFn`
5. **Database is SQLite in dev** - Use `schema-sqlite.ts` for local development
6. **This is Vite, NOT Next.js** - Don't use Next.js patterns

### Common Patterns:
- API calls use `fetch()` with `/api/*` endpoints
- React Query for data fetching
- TypeScript types from `@shared/schema`
- Role-based navigation via `RoleBasedNavigation` component
- Toast notifications via `useToast()` hook

---

## 🔄 Update This File

**When adding new features:**
1. Add to appropriate section above
2. Update "Last Updated" date
3. Document API endpoints if new
4. Note any breaking changes

**When fixing bugs:**
1. Add to "Known Issues & Fixes" section
2. Document the issue and solution
3. Update date

---

**Remember:** This file exists so Cursor AI doesn't forget what's already been implemented! 🧠✨
