# Nautical Navigation App Implementation Plan
## Using Navionics Standard (Free) + Custom Navigation Features

## Overview
Implement a Nautical Navigation app using Navionics Standard (Free) for professional chart display, combined with custom-built navigation features (waypoints, routes, calculations) since Standard plan doesn't allow overlays. Integrate with Operations Planning and Calendar.

## Architecture

### Chart Display (Navionics Standard)
- Embedded chart viewer using Navionics Web API
- Professional nautical charts with bathymetry
- Standard plan limitations: No custom overlays on charts
- Chart viewer embedded in navigation component

### Custom Navigation Features (Built In-House)
- Waypoint management (stored in backend, displayed separately)
- Route planning (calculated paths between waypoints)
- Distance & bearing calculations
- Coordinate conversion tools
- Integration with Operations Calendar

### Two-Panel Layout
- **Left Panel**: Navionics chart viewer (embedded)
- **Right Panel**: Navigation tools (waypoints, routes, calculations, operations integration)

## Implementation Steps

### 1. Navionics Standard API Setup
**File**: `README.md` (update environment variables section)
- Add Navionics API key setup instructions
- Note: Request developer key from Garmin Developer Portal
- Environment variable: `NAVIONICS_API_KEY` (optional for free tier)

**File**: `.env.local` (documentation)
- Add NAVIONICS_API_KEY placeholder (though Standard plan may not require it for basic embedding)

### 2. Navigation Service (Backend)
**File**: `server/navigation-service.ts` (new file)
- Distance calculations (Haversine formula)
- Bearing/heading calculations
- Coordinate conversions (Lat/Lon, decimal degrees, DMS)
- Route calculations (straight-line routes between waypoints)
- Navigation utilities

### 3. Navigation API Endpoints
**File**: `server/routes.ts` (add routes)
- `GET /api/navigation/waypoints` - Get user's waypoints
- `POST /api/navigation/waypoints` - Create waypoint
- `PUT /api/navigation/waypoints/:id` - Update waypoint
- `DELETE /api/navigation/waypoints/:id` - Delete waypoint
- `GET /api/navigation/routes` - Get user's routes
- `POST /api/navigation/routes` - Create route
- `PUT /api/navigation/routes/:id` - Update route
- `DELETE /api/navigation/routes/:id` - Delete route
- `GET /api/navigation/calculate?lat1&lon1&lat2&lon2` - Calculate distance/bearing
- `POST /api/navigation/waypoints/bulk` - Import waypoints (GPX support)

### 4. Database Schema (if needed)
**File**: `shared/schema.ts` (add tables if using database)
- Waypoints table (id, userId, name, lat, lon, description, createdAt)
- Routes table (id, userId, name, waypointIds[], createdAt)
- Operations waypoints link (operationId, waypointId)

Or use in-memory storage similar to userProfileStore for MVP.

### 5. Navigation Component
**File**: `client/src/components/navigation/nautical-navigation-app.tsx` (new file)
- Two-panel layout:
  - **Left Panel**: Navionics chart viewer (embedded iframe/OpenLayers)
  - **Right Panel**: Navigation tools and waypoint/route management
- Waypoint list with coordinates
- Route planning interface
- Distance/bearing calculator
- Coordinate converter
- Operations calendar integration

### 6. Navionics Chart Viewer Component
**File**: `client/src/components/navigation/navionics-chart-viewer.tsx` (new file)
- Embed Navionics chart using their Web API
- Standard plan: Basic embedded viewer
- Handle chart loading and errors
- Center on user's location/timezone
- Display chart in left panel

### 7. Waypoint Management Component
**File**: `client/src/components/navigation/waypoint-manager.tsx` (new file)
- List of waypoints
- Add/edit/delete waypoints
- Display coordinates
- Link to operations calendar
- Export/import (GPX format)

### 8. Route Planning Component
**File**: `client/src/components/navigation/route-planner.tsx` (new file)
- Create routes from waypoints
- Calculate total distance
- Estimate travel time (optional)
- Display route details
- Link routes to operations

### 9. Navigation Tools Component
**File**: `client/src/components/navigation/navigation-tools.tsx` (new file)
- Distance calculator (between two coordinates)
- Bearing calculator
- Coordinate converter (Lat/Lon ↔ DMS)
- Navigation formulas display

### 10. Profile Settings Integration
**File**: `client/src/pages/profile-settings.tsx` (update)
- Add "Nautical Navigation App" toggle
- Store preference: `enableNauticalNavigation`
- Add to Display Preferences section

### 11. Operations Page Integration
**File**: `client/src/pages/operations.tsx` (update)
- Add Navigation App as optional operational app
- Or add Navigation widget/section when enabled
- Link navigation data to operations calendar events

### 12. Operations Calendar Integration
**File**: `client/src/components/widgets/operations-calendar-widget.tsx` (enhance)
- Allow linking waypoints/routes to calendar operations
- Display navigation info in operation details
- Quick access to navigation for scheduled operations

## Technical Considerations

### Navionics Standard Plan Limitations
- ✅ Can display charts in embedded viewer
- ✅ Professional chart quality
- ❌ Cannot add waypoints/overlays on charts
- ❌ No custom markers
- ❌ No route drawing on charts
- **Solution**: Display waypoints/routes in separate panel, sync chart center with selected waypoint

### Implementation Strategy
1. **Chart Display**: Use Navionics Standard API for chart viewer
2. **Waypoints/Routes**: Store in backend, display in separate panel
3. **Synchronization**: When user selects waypoint, center Navionics chart on that coordinate
4. **Integration**: Link waypoints/routes to operations calendar events

### Data Storage
- Option A: In-memory store (like userProfileStore) - quick MVP
- Option B: Database tables - for production persistence
- Start with Option A, migrate to Option B later

### Chart Integration
- Navionics Standard uses embedded viewer (iframe or OpenLayers)
- Can center chart on coordinates via API
- Cannot overlay custom data on charts
- Solution: Display navigation data alongside chart

## Files to Create/Modify

### New Files
- `server/navigation-service.ts` - Navigation calculations and utilities
- `client/src/components/navigation/nautical-navigation-app.tsx` - Main navigation component
- `client/src/components/navigation/navionics-chart-viewer.tsx` - Navionics chart embed
- `client/src/components/navigation/waypoint-manager.tsx` - Waypoint management
- `client/src/components/navigation/route-planner.tsx` - Route planning
- `client/src/components/navigation/navigation-tools.tsx` - Navigation calculators
- `client/src/components/navigation/index.ts` - Barrel export

### Modified Files
- `server/routes.ts` - Add navigation API endpoints
- `client/src/pages/profile-settings.tsx` - Add navigation app toggle
- `client/src/pages/operations.tsx` - Integrate navigation app
- `client/src/components/widgets/operations-calendar-widget.tsx` - Add navigation links
- `README.md` - Add Navionics setup instructions

## User Experience

### Navigation App Layout
```
┌─────────────────────────────────────────────────┐
│  Nautical Navigation App                        │
├──────────────────┬──────────────────────────────┤
│                  │  Navigation Tools            │
│  Navionics Chart │  ┌──────────────────────┐   │
│  (Embedded)      │  │ Waypoint Manager     │   │
│                  │  │ - Waypoint List      │   │
│  [Chart Display] │  │ - Add/Edit/Delete    │   │
│                  │  └──────────────────────┘   │
│  [Centered on    │  ┌──────────────────────┐   │
│   selected WP]   │  │ Route Planner        │   │
│                  │  │ - Create Routes      │   │
│                  │  │ - Calculate Distance │   │
│                  │  └──────────────────────┘   │
│                  │  ┌──────────────────────┐   │
│                  │  │ Navigation Tools     │   │
│                  │  │ - Distance Calc      │   │
│                  │  │ - Bearing Calc       │   │
│                  │  │ - Coord Converter    │   │
│                  │  └──────────────────────┘   │
│                  │  ┌──────────────────────┐   │
│                  │  │ Operations Link      │   │
│                  │  │ - Link to Calendar   │   │
│                  │  └──────────────────────┘   │
└──────────────────┴──────────────────────────────┘
```

### Workflow
1. User enables Navigation App in Profile Settings
2. Navigate to Operations page → Navigation App
3. View Navionics chart (left panel)
4. Add waypoints in right panel
5. Create routes from waypoints
6. Link waypoints/routes to operations calendar events
7. Use navigation tools for calculations
8. Chart centers when waypoint selected (sync between panels)

## API Integration Details

### Navionics Standard API
- Documentation: https://webapiv2.navionics.com/
- Developer Portal: https://developer.garmin.com/marine-charts/web/
- Implementation: Embedded chart viewer
- Chart centering: Via API parameters
- Limitations: No overlays, no custom markers

### Backend Navigation API
- RESTful endpoints for waypoints/routes
- Calculate distance/bearing between coordinates
- Store navigation data per user
- Link to operations calendar

## Testing Strategy

1. Test Navionics chart embedding
2. Test waypoint CRUD operations
3. Test route creation and calculations
4. Test distance/bearing calculations
5. Test operations calendar integration
6. Test coordinate conversions
7. Test chart-waypoint synchronization

## Future Enhancements (Out of Scope)

- Upgrade to Navionics Enhanced plan (allows overlays)
- GPX import/export for waypoints/routes
- Route optimization algorithms
- Real-time GPS tracking integration
- AIS vessel tracking
- Weather overlay integration
- Tides overlay integration
- Mobile app integration

## Dependencies

### New Dependencies (if needed)
- OpenLayers (if Navionics requires it) - may be included in Navionics API
- GPX parsing library (for import/export) - optional

### Existing Dependencies
- React Query (for API calls)
- Express.js (backend API)
- React/TypeScript (frontend)

## Notes

- Navionics Standard plan is free but limited
- Custom navigation features built separately due to overlay limitations
- Chart and navigation data displayed side-by-side
- Can upgrade to Enhanced plan later for overlay support
- All navigation calculations built in-house (no external API needed)








