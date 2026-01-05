# API Integration Guide for Ports, Notices to Mariners, and Medical Facilities

This guide explains where to find and implement API calls for the World Ports, Notices to Mariners, and Medical Facilities widgets.

## Current Implementation

These widgets currently use **mock data** stored in service files:
- **World Ports**: `server/ports-service.ts`
- **Notices to Mariners**: `server/notices-to-mariners-service.ts`
- **Medical Facilities**: `server/medical-facilities-service.ts`

The API endpoints are already set up and working:
- **GET `/api/ports`** - Returns port data with optional filters (region, type, search)
- **GET `/api/notices-to-mariners`** - Returns notices based on user location
- **GET `/api/medical-facilities`** - Returns medical facilities (A&E, Critical Care, Diving Doctors, Hyperbaric) with optional filters
- **GET `/api/medical-facilities/user-selections`** - Returns user's selected medical facilities
- **POST `/api/medical-facilities/user-selections`** - Add facility to user's selections
- **DELETE `/api/medical-facilities/user-selections/:facilityId`** - Remove facility from user's selections

## API Endpoints Location

### Server-Side API Routes
**File**: `server/routes.ts`

The endpoints are defined around lines 1948-2100:
- `/api/ports` endpoint (line ~1948)
- `/api/notices-to-mariners` endpoint (line ~1978)
- `/api/medical-facilities` endpoint (line ~2058)
- `/api/medical-facilities/user-selections` endpoints (line ~2080)

### Service Files
**Files**:
- `server/ports-service.ts` - Port data service
- `server/notices-to-mariners-service.ts` - Notices data service
- `server/medical-facilities-service.ts` - Medical facilities data service

## Integrating Real APIs

### Option 1: World Ports Widget

#### Recommended APIs:

1. **World Port Index (WPI) Database**
   - Official database maintained by NGA (National Geospatial-Intelligence Agency)
   - Contains comprehensive port information
   - Requires database setup or API access

2. **UN/LOCODE Database**
   - United Nations location codes database
   - Includes port codes and locations
   - Available as CSV/XML downloads or APIs

3. **VesselFinder Port API**
   - Commercial API with port information
   - Provides port calls and vessel data
   - Requires API key and subscription
   - Website: https://www.vesselfinder.com/port-calls-api

4. **MarineTraffic Port API**
   - Commercial maritime data provider
   - Port information and vessel tracking
   - Requires API key
   - Website: https://www.marinetraffic.com/en/ais-api

#### Implementation Steps:

1. **Update `server/ports-service.ts`**:
   ```typescript
   export async function getPorts(filters?: {...}): Promise<Port[]> {
     // Replace mock data with API call
     const apiKey = process.env.PORTS_API_KEY;
     const response = await fetch(`https://api.example.com/ports?key=${apiKey}`);
     const data = await response.json();
     // Transform API response to Port[] format
     return data.map(transformToPort);
   }
   ```

2. **Add API key to environment variables**:
   ```bash
   # .env file
   PORTS_API_KEY=your_api_key_here
   ```

### Option 2: Notices to Mariners Widget

#### Recommended APIs:

1. **Niord Public API** (RECOMMENDED - FREE)
   - Public REST API for navigational warnings and notices
   - No authentication required
   - Global coverage (primarily European waters, but expanding)
   - Website: https://docs.niord.org/public-api/api.html
   - API Base URL: `https://niord.dma.dk/rest/public/v1`
   - Endpoints:
     - `/messages` - Search for messages
     - `/message/{messageId}` - Get specific message

   **Example API Call**:
   ```typescript
   // Get notices for a location
   const baseUrl = 'https://niord.dma.dk/rest/public/v1/messages';
   const latDelta = radiusKm / 111; // ~111 km per degree latitude
   const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
   const bbox = `${lon - lonDelta},${lat - latDelta},${lon + lonDelta},${lat + latDelta}`;
   
   const params = new URLSearchParams({
     lang: 'en',
     domain: 'niord-nm', // 'niord-nm' for Notices to Mariners, 'niord-nw' for Navigational Warnings
     bbox: bbox, // Optional: bounding box in format "lon1,lat1,lon2,lat2"
   });
   
   const url = `${baseUrl}?${params.toString()}`;
   const response = await fetch(url);
   const data = await response.json();
   ```

2. **UKHO (UK Hydrographic Office) Notices**
   - Official UK notices to mariners
   - Available through Admiralty Digital Publications
   - May require subscription

3. **U.S. Coast Guard Local Notices to Mariners (LNMs)**
   - Weekly notices for US waters
   - Available via web scraping or official feeds
   - Website: https://www.navcen.uscg.gov/local-notices-to-mariners

4. **Admiralty Digital Publications**
   - Comprehensive maritime information
   - Requires commercial subscription
   - Includes global notices

#### Implementation Steps:

1. **Update `server/notices-to-mariners-service.ts`**:

   For Niord API (recommended):
   ```typescript
   export async function getNoticesToMariners(
     lat?: number,
     lon?: number,
     radiusKm: number = 200
   ): Promise<NoticeToMariners[]> {
     if (!lat || !lon) {
       // Return global notices or handle as needed
       return [];
     }

     try {
       // Create bounding box from center point and radius
       const latDelta = radiusKm / 111; // ~111 km per degree latitude
       const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
       const bbox = `${lon - lonDelta},${lat - latDelta},${lon + lonDelta},${lat + latDelta}`;
       
       const baseUrl = 'https://niord.dma.dk/rest/public/v1/messages';
       const params = new URLSearchParams({
         lang: 'en',
         domain: 'niord-nm', // 'niord-nm' for Notices to Mariners
         bbox: bbox, // Optional bounding box
       });
       
       const url = `${baseUrl}?${params.toString()}`;
       const response = await fetch(url);
       
       if (!response.ok) {
         console.error('Niord API error:', response.status, response.statusText);
         return []; // Return empty array on error, or fall back to mock data
       }
       
       const data = await response.json();
       
       // Transform Niord API response to NoticeToMariners format
       // Note: Adjust field mapping based on actual API response structure
       return data.map((item: any) => ({
         id: item.id || item.messageId,
         number: item.number || item.messageId,
         title: item.title || item.description?.substring(0, 100) || 'Notice',
         type: mapNiordTypeToOurType(item.type),
         severity: mapNiordSeverityToOurSeverity(item.priority),
         location: item.location || item.area || 'Unknown',
         latitude: item.geometry?.coordinates?.[1],
         longitude: item.geometry?.coordinates?.[0],
         date: item.validFrom || item.date || new Date().toISOString(),
         expiresAt: item.validTo,
         description: item.description || item.text || '',
         affectedCharts: item.charts || [],
         affectedAreas: item.areas || [],
       }));
     } catch (error) {
       console.error('Error fetching from Niord API:', error);
       return []; // Return empty array on error, or fall back to mock data
     }
   }
   ```

## Testing the Current Implementation

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Test Ports API**:
   ```bash
   curl "http://localhost:5000/api/ports?region=Europe&type=Primary"
   ```

3. **Test Notices API**:
   ```bash
   curl "http://localhost:5000/api/notices-to-mariners?lat=50.9097&lon=-1.4044&email=test@example.com"
   ```

## Frontend Integration

The widgets are already integrated and will automatically use the API endpoints:

- **World Ports Widget**: `client/src/components/widgets/world-ports-widget.tsx`
- **Notices to Mariners Widget**: `client/src/components/widgets/notices-to-mariners-widget.tsx`

Both widgets use React Query to fetch data from the API endpoints. They will automatically:
- Show loading states
- Handle errors gracefully
- Fall back to mock data if API fails
- Cache responses for better performance

## Next Steps

1. **For Production**:
   - Choose appropriate API providers
   - Obtain API keys/subscriptions
   - Update service files with real API calls
   - Add error handling and retry logic
   - Implement caching strategies

2. **For Development**:
   - Current mock data is sufficient
   - Can test API integration with Niord (free, no key required)
   - Consider implementing Niord API first as it's free and public

3. **Performance Optimization**:
   - Implement caching (Redis, in-memory cache)
   - Add rate limiting
   - Optimize API response transformation
   - Consider database storage for frequently accessed data

### Option 3: Medical Facilities Widget

#### Database Seeding (RECOMMENDED FIRST STEP)

Before integrating external APIs, seed the database with comprehensive medical facilities data:

1. **Run the seeder script**:
   ```bash
   npx tsx scripts/seed-medical-facilities.ts
   ```

   This will populate the database with real medical facilities worldwide including:
   - A&E (Accident & Emergency) facilities
   - Critical Care units
   - Diving Doctors
   - Hyperbaric chambers

   The seeder includes facilities from major diving locations:
   - United Kingdom (Aberdeen, London, Plymouth, Edinburgh)
   - United States (California, North Carolina, Florida, Washington)
   - Australia (Sydney)
   - Singapore
   - Norway (Bergen)
   - Malta
   - South Africa (Cape Town)

2. **Verify the data**:
   ```bash
   curl "http://localhost:5000/api/medical-facilities?country=United Kingdom"
   ```

#### Recommended APIs for Live Data:

1. **Divers Alert Network (DAN) Hyperbaric Chamber Directory** (RECOMMENDED)
   - Comprehensive directory of hyperbaric chambers worldwide
   - Includes contact information and availability
   - Free access, but may require scraping or manual updates
   - Website: https://www.diversalertnetwork.org/medical/chamber
   - Data Format: Web scraping or manual database updates

2. **Google Places API / Maps API**
   - Search for hospitals, emergency rooms, medical facilities
   - Provides location, contact info, and ratings
   - Requires API key and billing
   - Website: https://developers.google.com/maps/documentation/places/web-service
   - Can filter by type: `hospital`, `hospital|doctor`, etc.

   **Example Implementation**:
   ```typescript
   export async function getMedicalFacilities(
     filters?: {
       latitude?: number;
       longitude?: number;
       radiusKm?: number;
       types?: MedicalFacilityType[];
     }
   ): Promise<MedicalFacility[]> {
     try {
       // Try database first
       const dbFacilities = await getFacilitiesFromDatabase(filters);
       if (dbFacilities.length > 0) return dbFacilities;

       // Fallback to Google Places API
       if (filters?.latitude && filters?.longitude) {
         const apiKey = process.env.GOOGLE_PLACES_API_KEY;
         const radius = Math.round((filters.radiusKm || 200) * 1000); // Convert to meters
         
         const response = await fetch(
           `https://maps.googleapis.com/maps/api/place/nearbysearch/json?` +
           `location=${filters.latitude},${filters.longitude}&` +
           `radius=${radius}&` +
           `type=hospital&` +
           `key=${apiKey}`
         );
         
         const data = await response.json();
         return transformGooglePlacesToFacilities(data.results);
       }
     } catch (error) {
       console.error('Error fetching medical facilities:', error);
       return getMockMedicalFacilities(filters);
     }
   }
   ```

3. **OpenStreetMap Overpass API** (FREE)
   - Free geographic data including hospitals and medical facilities
   - No API key required
   - Query language for filtering
   - Website: https://wiki.openstreetmap.org/wiki/Overpass_API
   - Can search for: `amenity=hospital`, `amenity=doctors`, etc.

   **Example Implementation**:
   ```typescript
   export async function getMedicalFacilitiesFromOSM(
     lat: number,
     lon: number,
     radiusKm: number
   ): Promise<MedicalFacility[]> {
     const overpassUrl = 'https://overpass-api.de/api/interpreter';
     const query = `
       [out:json][timeout:25];
       (
         node["amenity"="hospital"](around:${radiusKm * 1000},${lat},${lon});
         way["amenity"="hospital"](around:${radiusKm * 1000},${lat},${lon});
         relation["amenity"="hospital"](around:${radiusKm * 1000},${lat},${lon});
       );
       out center;
     `;
     
     const response = await fetch(overpassUrl, {
       method: 'POST',
       body: query,
     });
     
     const data = await response.json();
     return transformOSMToFacilities(data.elements);
   }
   ```

4. **Healthcare.gov Provider Data** (USA only)
   - Free API for US healthcare providers
   - Includes location and contact information
   - No API key required
   - Website: https://www.healthcare.gov/developers/
   - Limited to United States

5. **Hyperbaric Medicine Society Directories**
   - Professional directories of hyperbaric medicine facilities
   - May require membership or manual data collection
   - Various regional societies maintain directories

#### Implementation Steps:

1. **Update `server/medical-facilities-service.ts`**:

   ```typescript
   export async function getMedicalFacilities(
     filters?: {
       latitude?: number;
       longitude?: number;
       radiusKm?: number;
       types?: MedicalFacilityType[];
       country?: string;
       region?: string;
       available24h?: boolean;
     }
   ): Promise<MedicalFacility[]> {
     try {
       // First, try to get from database (seeded data)
       const dbFacilities = await getFacilitiesFromDatabase(filters);
       if (dbFacilities.length > 0) {
         return dbFacilities;
       }

       // If no database results, try external API
       if (filters?.latitude && filters?.longitude) {
         // Option 1: Google Places API
         if (process.env.GOOGLE_PLACES_API_KEY) {
           return await getFacilitiesFromGooglePlaces(filters);
         }
         
         // Option 2: OpenStreetMap (free, no key required)
         return await getFacilitiesFromOSM(filters);
       }

       return [];
     } catch (error) {
       console.error('Error fetching medical facilities:', error);
       // Fallback to mock data
       return getMockMedicalFacilities(filters);
     }
   }
   ```

2. **Add API keys to environment variables** (if using Google Places):
   ```bash
   # .env file
   GOOGLE_PLACES_API_KEY=your_api_key_here
   ```

3. **Database Seeding**:
   ```bash
   # Seed database with comprehensive medical facilities
   npx tsx scripts/seed-medical-facilities.ts
   ```

## Testing the Current Implementation

1. **Start the server**:
   ```bash
   npm run dev
   ```

2. **Seed medical facilities database**:
   ```bash
   npx tsx scripts/seed-medical-facilities.ts
   ```

3. **Test Medical Facilities API**:
   ```bash
   # Get all facilities
   curl "http://localhost:5000/api/medical-facilities"
   
   # Get facilities near a location
   curl "http://localhost:5000/api/medical-facilities?lat=51.5074&lon=-0.1278&radiusKm=100"
   
   # Get only A&E facilities
   curl "http://localhost:5000/api/medical-facilities?types=A_E&country=United Kingdom"
   
   # Get hyperbaric chambers
   curl "http://localhost:5000/api/medical-facilities?types=HYPERBARIC"
   ```

4. **Test Ports API**:
   ```bash
   curl "http://localhost:5000/api/ports?region=Europe&type=Primary"
   ```

5. **Test Notices API**:
   ```bash
   curl "http://localhost:5000/api/notices-to-mariners?lat=50.9097&lon=-1.4044&email=test@example.com"
   ```

## Frontend Integration

The widgets are already integrated and will automatically use the API endpoints:

- **World Ports Widget**: `client/src/components/widgets/world-ports-widget.tsx`
- **Notices to Mariners Widget**: `client/src/components/widgets/notices-to-mariners-widget.tsx`
- **MED OPS Container**: `client/src/components/med-ops/MedOpsApp.tsx` (in Operations page)

All widgets use React Query to fetch data from the API endpoints. They will automatically:
- Show loading states
- Handle errors gracefully
- Fall back to mock data if API fails
- Cache responses for better performance

## Additional Resources

### Ports & Maritime
- Niord API Documentation: https://docs.niord.org/public-api/api.html
- UN/LOCODE Database: https://unece.org/trade/uncefact/unlocode
- World Port Index: Available through NGA
- VesselFinder API: https://www.vesselfinder.com/api
- MarineTraffic API: https://www.marinetraffic.com/en/ais-api

### Medical Facilities
- DAN Hyperbaric Chamber Directory: https://www.diversalertnetwork.org/medical/chamber
- Google Places API: https://developers.google.com/maps/documentation/places/web-service
- OpenStreetMap Overpass API: https://wiki.openstreetmap.org/wiki/Overpass_API
- Healthcare.gov Provider Data: https://www.healthcare.gov/developers/
- Undersea and Hyperbaric Medical Society: https://www.uhms.org/

