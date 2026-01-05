/**
 * Notices to Mariners Service - Provides navigational warnings and notices
 * 
 * For production, consider integrating with:
 * - Niord Public API: https://docs.niord.org/public-api/api.html
 *   Base URL: https://niord.dma.dk
 *   Endpoint: /rest/public/v1/messages
 *   (Public REST API for navigational warnings and notices, no authentication required)
 * - UKHO (UK Hydrographic Office) Notices to Mariners
 * - U.S. Coast Guard Local Notices to Mariners (LNMs)
 * - Admiralty Digital Publications
 * 
 * Currently uses mock data. In production, fetch from Niord API or other sources based on location.
 */

export interface NoticeToMariners {
  id: string;
  number: string;
  title: string;
  type: 'NAVIGATION' | 'SAFETY' | 'CHART' | 'TIDAL' | 'GENERAL';
  severity: 'CRITICAL' | 'WARNING' | 'INFORMATION';
  location: string;
  latitude?: number;
  longitude?: number;
  date: string;
  expiresAt?: string;
  description: string;
  affectedCharts?: string[];
  affectedAreas?: string[];
}

// Mock notices data - in production, fetch from Niord API or other sources
const mockNotices: NoticeToMariners[] = [
  {
    id: '1',
    number: 'NM-2025-001',
    title: 'Temporary Channel Closure - Dredging Operations',
    type: 'NAVIGATION',
    severity: 'CRITICAL',
    location: 'Southampton, UK',
    latitude: 50.863714,
    longitude: -1.425028,
    date: '2025-01-15',
    expiresAt: '2025-02-15',
    description: 'Dredging operations will temporarily close the main shipping channel from 0600 to 1800 UTC daily. Vessels are advised to use alternative routes.',
    affectedCharts: ['BA 2456', 'BA 2457'],
    affectedAreas: ['Main Channel', 'Approach Channel']
  },
  {
    id: '2',
    number: 'NM-2025-002',
    title: 'New Wreck Marked - Unlit Buoy',
    type: 'SAFETY',
    severity: 'WARNING',
    location: 'English Channel',
    latitude: 50.7,
    longitude: -1.2,
    date: '2025-01-10',
    description: 'A new wreck has been discovered and marked with an unlit yellow buoy at position 50°42.0\'N 001°12.0\'W. Mariners are advised to navigate with caution.',
    affectedCharts: ['BA 2456'],
  },
  {
    id: '3',
    number: 'NM-2025-003',
    title: 'Chart Correction - Depth Changes',
    type: 'CHART',
    severity: 'INFORMATION',
    location: 'Portsmouth Harbour',
    latitude: 50.8198,
    longitude: -1.0880,
    date: '2025-01-08',
    description: 'Updated depth soundings have been recorded in Portsmouth Harbour. Depths in the main channel have changed by up to 0.5m. New chart edition available.',
    affectedCharts: ['BA 2045', 'BA 2046'],
  },
  {
    id: '4',
    number: 'NM-2025-004',
    title: 'Tidal Stream Changes - Survey Results',
    type: 'TIDAL',
    severity: 'INFORMATION',
    location: 'Isle of Wight',
    latitude: 50.6944,
    longitude: -1.2986,
    date: '2025-01-05',
    description: 'Recent survey indicates changes in tidal stream patterns around the Isle of Wight. Maximum flow rates have increased by approximately 0.5 knots during spring tides.',
    affectedCharts: ['BA 2456'],
  },
  {
    id: '5',
    number: 'NM-2025-005',
    title: 'Temporary Traffic Separation Scheme Modification',
    type: 'NAVIGATION',
    severity: 'WARNING',
    location: 'Dover Strait',
    latitude: 51.0153,
    longitude: 1.3721,
    date: '2025-01-12',
    expiresAt: '2025-03-12',
    description: 'TSS modification in effect due to ongoing maintenance work. Eastbound traffic lane temporarily shifted 0.5 nautical miles north.',
    affectedCharts: ['BA 2450', 'BA 2451'],
    affectedAreas: ['Dover Strait TSS']
  },
  {
    id: '6',
    number: 'NM-2025-006',
    title: 'New Port Facility - Pilot Boarding Area',
    type: 'GENERAL',
    severity: 'INFORMATION',
    location: 'Southampton',
    latitude: 50.9097,
    longitude: -1.4044,
    date: '2025-01-14',
    description: 'New pilot boarding area established at position 50°54.5\'N 001°24.0\'W. All vessels requiring pilotage should contact Southampton VTS on VHF Channel 12.',
    affectedCharts: ['BA 2456'],
  },
  {
    id: '7',
    number: 'NM-2025-007',
    title: 'Underwater Cable Installation - Exclusion Zone',
    type: 'SAFETY',
    severity: 'WARNING',
    location: 'Off Brighton',
    latitude: 50.8225,
    longitude: -0.1372,
    date: '2025-01-20',
    expiresAt: '2025-02-20',
    description: 'Temporary exclusion zone established for underwater cable installation. Area marked with yellow buoys. No anchoring or trawling permitted.',
    affectedCharts: ['BA 2047'],
    affectedAreas: ['2nm radius from 50°49.3\'N 000°08.2\'W']
  },
  {
    id: '8',
    number: 'NM-2025-008',
    title: 'Light Character Change - Harbour Entrance',
    type: 'NAVIGATION',
    severity: 'INFORMATION',
    location: 'Portsmouth',
    latitude: 50.8198,
    longitude: -1.0880,
    date: '2025-01-18',
    description: 'Portsmouth Harbour entrance light character changed from Fl.R.3s to Fl.R.2s. Light remains visible range 10 nautical miles.',
    affectedCharts: ['BA 2045'],
  },
];

/**
 * Get notices to mariners for a location
 * @param lat Latitude (optional)
 * @param lon Longitude (optional)
 * @param radiusKm Radius in kilometers to search (default: 200km)
 * @returns Array of notices within radius
 */
export async function getNoticesToMariners(
  lat?: number,
  lon?: number,
  radiusKm: number = 200
): Promise<NoticeToMariners[]> {
  // In production, fetch from Niord API or other sources
  // Example Niord API call:
  // const baseUrl = 'https://niord.dma.dk/rest/public/v1/messages';
  // const params = new URLSearchParams({
  //   lang: 'en',
  //   domain: 'niord-nm', // niord-nm for Notices to Mariners, niord-nw for Navigational Warnings
  //   bbox: `${lon - lonDelta},${lat - latDelta},${lon + lonDelta},${lat + latDelta}` // Optional bounding box
  // });
  // const response = await fetch(`${baseUrl}?${params.toString()}`);
  
  if (lat !== undefined && lon !== undefined) {
    // Filter notices by location if coordinates provided
    return mockNotices.filter(notice => {
      if (!notice.latitude || !notice.longitude) {
        return true; // Include notices without coordinates
      }
      
      const distance = calculateDistance(lat, lon, notice.latitude, notice.longitude);
      return distance <= radiusKm;
    }).sort((a, b) => {
      // Sort by severity first, then by date
      const severityOrder = { 'CRITICAL': 0, 'WARNING': 1, 'INFORMATION': 2 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }
  
  // If no coordinates, return all notices sorted by severity and date
  return [...mockNotices].sort((a, b) => {
    const severityOrder = { 'CRITICAL': 0, 'WARNING': 1, 'INFORMATION': 2 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point
 * @param lon1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lon2 Longitude of second point
 * @returns Distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Example function to fetch from Niord API (for future implementation)
 * 
 * @example
 * async function fetchFromNiordAPI(lat: number, lon: number, radiusKm: number) {
 *   // Create bounding box from center point and radius
 *   const latDelta = radiusKm / 111; // approximately 111 km per degree latitude
 *   const lonDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
 *   const bbox = `${lon - lonDelta},${lat - latDelta},${lon + lonDelta},${lat + latDelta}`;
 *   
 *   const baseUrl = 'https://niord.dma.dk/rest/public/v1/messages';
 *   const params = new URLSearchParams({
 *     lang: 'en',
 *     domain: 'niord-nm', // 'niord-nm' for Notices to Mariners, 'niord-nw' for Navigational Warnings
 *     bbox: bbox, // Optional: bounding box in format "lon1,lat1,lon2,lat2"
 *   });
 *   
 *   const url = `${baseUrl}?${params.toString()}`;
 *   const response = await fetch(url);
 *   const data = await response.json();
 *   
 *   // Transform Niord API response to our NoticeToMariners format
 *   // Note: Niord API structure may vary - adjust mapping based on actual API response
 *   return data.map((item: any) => ({
 *     id: item.id,
 *     number: item.number,
 *     title: item.title || item.description?.substring(0, 100),
 *     type: mapNiordTypeToOurType(item.type),
 *     severity: mapNiordSeverityToOurSeverity(item.priority),
 *     location: item.location || item.area,
 *     latitude: item.geometry?.coordinates?.[1],
 *     longitude: item.geometry?.coordinates?.[0],
 *     date: item.validFrom || item.date,
 *     expiresAt: item.validTo,
 *     description: item.description,
 *     affectedCharts: item.charts,
 *     affectedAreas: item.areas,
 *   }));
 * }
 */

