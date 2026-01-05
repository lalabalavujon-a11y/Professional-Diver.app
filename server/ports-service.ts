/**
 * Ports Service - Provides worldwide port information
 * 
 * For production, consider integrating with:
 * - World Port Index (WPI) database
 * - UN/LOCODE database
 * - VesselFinder Port API
 * - MarineTraffic Port API
 * 
 * Currently uses comprehensive mock data covering major ports worldwide
 */

export interface Port {
  id: string;
  name: string;
  country: string;
  region: string;
  type: 'Primary' | 'Secondary';
  callsign: string;
  vhfChannels: string[];
  phone: string;
  fax?: string;
  email?: string;
  latitude: number;
  longitude: number;
  timezone: string;
}

// Comprehensive port data - primary and secondary ports worldwide
// In production, this would be loaded from a database or external API
const portsDatabase: Port[] = [
  // Primary Ports - Major International Ports
  { id: '1', name: 'Port of Rotterdam', country: 'Netherlands', region: 'Europe', type: 'Primary', callsign: 'PHRTM', vhfChannels: ['12', '14', '16'], phone: '+31 10 252 1010', email: 'info@portofrotterdam.com', latitude: 51.9225, longitude: 4.4764, timezone: 'Europe/Amsterdam' },
  { id: '2', name: 'Port of Shanghai', country: 'China', region: 'Asia', type: 'Primary', callsign: 'SHAHAI', vhfChannels: ['08', '14', '16'], phone: '+86 21 5539 6688', latitude: 31.2304, longitude: 121.4737, timezone: 'Asia/Shanghai' },
  { id: '3', name: 'Port of Singapore', country: 'Singapore', region: 'Asia', type: 'Primary', callsign: 'SINPO', vhfChannels: ['12', '14', '16', '18'], phone: '+65 6275 6100', email: 'psa@psa.com.sg', latitude: 1.2897, longitude: 103.8501, timezone: 'Asia/Singapore' },
  { id: '4', name: 'Port of Los Angeles', country: 'USA', region: 'North America', type: 'Primary', callsign: 'KLAX', vhfChannels: ['12', '14', '16'], phone: '+1 310 732 3508', latitude: 33.7490, longitude: -118.2643, timezone: 'America/Los_Angeles' },
  { id: '5', name: 'Port of Hamburg', country: 'Germany', region: 'Europe', type: 'Primary', callsign: 'DEHAM', vhfChannels: ['12', '14', '16'], phone: '+49 40 42847 2000', email: 'info@hafen-hamburg.de', latitude: 53.5511, longitude: 9.9937, timezone: 'Europe/Berlin' },
  { id: '6', name: 'Port of Antwerp', country: 'Belgium', region: 'Europe', type: 'Primary', callsign: 'BEANT', vhfChannels: ['14', '16'], phone: '+32 3 205 2000', latitude: 51.2194, longitude: 4.4025, timezone: 'Europe/Brussels' },
  { id: '7', name: 'Port of Busan', country: 'South Korea', region: 'Asia', type: 'Primary', callsign: 'KRBUS', vhfChannels: ['12', '14', '16'], phone: '+82 51 999 2000', latitude: 35.1796, longitude: 129.0756, timezone: 'Asia/Seoul' },
  { id: '8', name: 'Port of Hong Kong', country: 'Hong Kong', region: 'Asia', type: 'Primary', callsign: 'HKHKG', vhfChannels: ['12', '14', '16', '18'], phone: '+852 2542 2822', latitude: 22.3193, longitude: 114.1694, timezone: 'Asia/Hong_Kong' },
  { id: '9', name: 'Port of New York/New Jersey', country: 'USA', region: 'North America', type: 'Primary', callsign: 'KNYNY', vhfChannels: ['12', '14', '16'], phone: '+1 212 435 4000', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
  { id: '10', name: 'Port of Long Beach', country: 'USA', region: 'North America', type: 'Primary', callsign: 'KLGB', vhfChannels: ['12', '14', '16'], phone: '+1 562 437 0041', latitude: 33.7701, longitude: -118.1937, timezone: 'America/Los_Angeles' },
  { id: '11', name: 'Port of Dubai (Jebel Ali)', country: 'UAE', region: 'Middle East', type: 'Primary', callsign: 'AEDXB', vhfChannels: ['12', '14', '16'], phone: '+971 4 881 5000', email: 'info@dpworld.ae', latitude: 25.0252, longitude: 55.0428, timezone: 'Asia/Dubai' },
  { id: '12', name: 'Port of Ningbo-Zhoushan', country: 'China', region: 'Asia', type: 'Primary', callsign: 'CNNGB', vhfChannels: ['08', '14', '16'], phone: '+86 574 8766 8150', latitude: 29.8683, longitude: 121.5440, timezone: 'Asia/Shanghai' },
  { id: '13', name: 'Port of Qingdao', country: 'China', region: 'Asia', type: 'Primary', callsign: 'CNQIN', vhfChannels: ['08', '14', '16'], phone: '+86 532 8298 2121', latitude: 36.0671, longitude: 120.3826, timezone: 'Asia/Shanghai' },
  { id: '14', name: 'Port of Tianjin', country: 'China', region: 'Asia', type: 'Primary', callsign: 'CNTXG', vhfChannels: ['08', '14', '16'], phone: '+86 22 2570 2563', latitude: 39.1290, longitude: 117.1994, timezone: 'Asia/Shanghai' },
  { id: '15', name: 'Port of Tanjung Pelepas', country: 'Malaysia', region: 'Asia', type: 'Primary', callsign: 'MYPTP', vhfChannels: ['12', '14', '16'], phone: '+60 7 504 2121', latitude: 1.3644, longitude: 103.5500, timezone: 'Asia/Kuala_Lumpur' },
  { id: '16', name: 'Port of Bremen/Bremerhaven', country: 'Germany', region: 'Europe', type: 'Primary', callsign: 'DEBRE', vhfChannels: ['12', '14', '16'], phone: '+49 421 361 0', latitude: 53.5479, longitude: 8.5789, timezone: 'Europe/Berlin' },
  { id: '17', name: 'Port of Tokyo', country: 'Japan', region: 'Asia', type: 'Primary', callsign: 'JPTYO', vhfChannels: ['12', '14', '16'], phone: '+81 3 3527 6951', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { id: '18', name: 'Port of Yokohama', country: 'Japan', region: 'Asia', type: 'Primary', callsign: 'JPYOK', vhfChannels: ['12', '14', '16'], phone: '+81 45 671 7272', latitude: 35.4437, longitude: 139.6380, timezone: 'Asia/Tokyo' },
  { id: '19', name: 'Port of Kaohsiung', country: 'Taiwan', region: 'Asia', type: 'Primary', callsign: 'TWKHH', vhfChannels: ['12', '14', '16'], phone: '+886 7 562 2345', latitude: 22.6273, longitude: 120.3014, timezone: 'Asia/Taipei' },
  { id: '20', name: 'Port of Tanjung Priok', country: 'Indonesia', region: 'Asia', type: 'Primary', callsign: 'IDJKT', vhfChannels: ['12', '14', '16'], phone: '+62 21 430 9888', latitude: -6.1254, longitude: 106.8925, timezone: 'Asia/Jakarta' },
  { id: '21', name: 'Port of Colombo', country: 'Sri Lanka', region: 'Asia', type: 'Primary', callsign: 'LKCMB', vhfChannels: ['12', '14', '16'], phone: '+94 11 242 1201', latitude: 6.9344, longitude: 79.8428, timezone: 'Asia/Colombo' },
  { id: '22', name: 'Port of Durban', country: 'South Africa', region: 'Africa', type: 'Primary', callsign: 'ZADUR', vhfChannels: ['12', '14', '16'], phone: '+27 31 361 8777', latitude: -29.8587, longitude: 31.0218, timezone: 'Africa/Johannesburg' },
  { id: '23', name: 'Port of Santos', country: 'Brazil', region: 'South America', type: 'Primary', callsign: 'BRSST', vhfChannels: ['12', '14', '16'], phone: '+55 13 3202 1000', latitude: -23.9608, longitude: -46.3336, timezone: 'America/Sao_Paulo' },
  { id: '24', name: 'Port of Vancouver', country: 'Canada', region: 'North America', type: 'Primary', callsign: 'CAVAN', vhfChannels: ['12', '14', '16'], phone: '+1 604 665 9000', email: 'info@portvancouver.com', latitude: 49.2827, longitude: -123.1207, timezone: 'America/Vancouver' },
  { id: '25', name: 'Port of Sydney', country: 'Australia', region: 'Oceania', type: 'Primary', callsign: 'AUSYD', vhfChannels: ['12', '14', '16'], phone: '+61 2 9296 4999', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
  { id: '26', name: 'Port of Melbourne', country: 'Australia', region: 'Oceania', type: 'Primary', callsign: 'AUMEL', vhfChannels: ['12', '14', '16'], phone: '+61 3 9628 2800', latitude: -37.8136, longitude: 144.9631, timezone: 'Australia/Melbourne' },
  { id: '27', name: 'Port of Felixstowe', country: 'United Kingdom', region: 'Europe', type: 'Primary', callsign: 'GBFEL', vhfChannels: ['12', '14', '16'], phone: '+44 1394 604500', email: 'info@portoffelixstowe.co.uk', latitude: 51.9614, longitude: 1.3514, timezone: 'Europe/London' },
  { id: '28', name: 'Port of Southampton', country: 'United Kingdom', region: 'Europe', type: 'Primary', callsign: 'GBSOU', vhfChannels: ['12', '14', '16'], phone: '+44 23 8048 8000', email: 'info@abports.co.uk', latitude: 50.863714, longitude: -1.425028, timezone: 'Europe/London' },
  { id: '29', name: 'Port of Le Havre', country: 'France', region: 'Europe', type: 'Primary', callsign: 'FRLEH', vhfChannels: ['12', '14', '16'], phone: '+33 2 32 74 70 00', latitude: 49.4944, longitude: 0.1079, timezone: 'Europe/Paris' },
  { id: '30', name: 'Port of Marseille', country: 'France', region: 'Europe', type: 'Primary', callsign: 'FRMRS', vhfChannels: ['12', '14', '16'], phone: '+33 4 91 39 40 00', latitude: 43.2965, longitude: 5.3698, timezone: 'Europe/Paris' },
  
  // Secondary Ports - Regional Important Ports
  { id: '31', name: 'Port of Valparaíso', country: 'Chile', region: 'South America', type: 'Secondary', callsign: 'CLVAP', vhfChannels: ['12', '16'], phone: '+56 32 225 2000', latitude: -33.0472, longitude: -71.6127, timezone: 'America/Santiago' },
  { id: '32', name: 'Port of Callao', country: 'Peru', region: 'South America', type: 'Secondary', callsign: 'PECLL', vhfChannels: ['12', '16'], phone: '+51 1 208 2800', latitude: -12.0464, longitude: -77.0428, timezone: 'America/Lima' },
  { id: '33', name: 'Port of Mombasa', country: 'Kenya', region: 'Africa', type: 'Secondary', callsign: 'KEMOM', vhfChannels: ['12', '14', '16'], phone: '+254 41 231 9601', latitude: -4.0435, longitude: 39.6682, timezone: 'Africa/Nairobi' },
  { id: '34', name: 'Port of Lagos', country: 'Nigeria', region: 'Africa', type: 'Secondary', callsign: 'NGLOS', vhfChannels: ['12', '16'], phone: '+234 1 545 0200', latitude: 6.5244, longitude: 3.3792, timezone: 'Africa/Lagos' },
  { id: '35', name: 'Port of Casablanca', country: 'Morocco', region: 'Africa', type: 'Secondary', callsign: 'MACAS', vhfChannels: ['12', '16'], phone: '+212 522 45 30 00', latitude: 33.5731, longitude: -7.5898, timezone: 'Africa/Casablanca' },
  { id: '36', name: 'Port of Alexandria', country: 'Egypt', region: 'Africa', type: 'Secondary', callsign: 'EGALY', vhfChannels: ['12', '16'], phone: '+20 3 480 0333', latitude: 31.2001, longitude: 29.9187, timezone: 'Africa/Cairo' },
  { id: '37', name: 'Port of Haifa', country: 'Israel', region: 'Middle East', type: 'Secondary', callsign: 'ILHFA', vhfChannels: ['12', '16'], phone: '+972 4 861 4111', latitude: 32.7940, longitude: 35.0010, timezone: 'Asia/Jerusalem' },
  { id: '38', name: 'Port of Jeddah', country: 'Saudi Arabia', region: 'Middle East', type: 'Secondary', callsign: 'SAJED', vhfChannels: ['12', '16'], phone: '+966 12 642 4444', latitude: 21.5433, longitude: 39.1728, timezone: 'Asia/Riyadh' },
  { id: '39', name: 'Port of Karachi', country: 'Pakistan', region: 'Asia', type: 'Secondary', callsign: 'PKKHI', vhfChannels: ['12', '16'], phone: '+92 21 9921 2201', latitude: 24.8607, longitude: 67.0011, timezone: 'Asia/Karachi' },
  { id: '40', name: 'Port of Mumbai', country: 'India', region: 'Asia', type: 'Secondary', callsign: 'INMUM', vhfChannels: ['12', '14', '16'], phone: '+91 22 2261 3333', latitude: 19.0760, longitude: 72.8777, timezone: 'Asia/Kolkata' },
  { id: '41', name: 'Port of Chennai', country: 'India', region: 'Asia', type: 'Secondary', callsign: 'INMAA', vhfChannels: ['12', '16'], phone: '+91 44 2536 1000', latitude: 13.0827, longitude: 80.2707, timezone: 'Asia/Kolkata' },
  { id: '42', name: 'Port of Chittagong', country: 'Bangladesh', region: 'Asia', type: 'Secondary', callsign: 'BDCGP', vhfChannels: ['12', '16'], phone: '+880 31 713 311', latitude: 22.3569, longitude: 91.7832, timezone: 'Asia/Dhaka' },
  { id: '43', name: 'Port of Bangkok', country: 'Thailand', region: 'Asia', type: 'Secondary', callsign: 'THBKK', vhfChannels: ['12', '16'], phone: '+66 2 249 0311', latitude: 13.7563, longitude: 100.5018, timezone: 'Asia/Bangkok' },
  { id: '44', name: 'Port of Manila', country: 'Philippines', region: 'Asia', type: 'Secondary', callsign: 'PHMNL', vhfChannels: ['12', '16'], phone: '+63 2 527 3701', latitude: 14.5995, longitude: 120.9842, timezone: 'Asia/Manila' },
  { id: '45', name: 'Port of Ho Chi Minh City', country: 'Vietnam', region: 'Asia', type: 'Secondary', callsign: 'VNSGN', vhfChannels: ['12', '16'], phone: '+84 28 3859 1820', latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
  { id: '46', name: 'Port of Auckland', country: 'New Zealand', region: 'Oceania', type: 'Secondary', callsign: 'NZAKL', vhfChannels: ['12', '16'], phone: '+64 9 379 5900', latitude: -36.8485, longitude: 174.7633, timezone: 'Pacific/Auckland' },
  { id: '47', name: 'Port of Wellington', country: 'New Zealand', region: 'Oceania', type: 'Secondary', callsign: 'NZWN', vhfChannels: ['12', '16'], phone: '+64 4 495 3700', latitude: -41.2865, longitude: 174.7762, timezone: 'Pacific/Auckland' },
  { id: '48', name: 'Port of Reykjavik', country: 'Iceland', region: 'Europe', type: 'Secondary', callsign: 'ISREY', vhfChannels: ['12', '16'], phone: '+354 525 5000', latitude: 64.1466, longitude: -21.9426, timezone: 'Atlantic/Reykjavik' },
  { id: '49', name: 'Port of Gothenburg', country: 'Sweden', region: 'Europe', type: 'Secondary', callsign: 'SEGOT', vhfChannels: ['12', '16'], phone: '+46 31 731 1000', latitude: 57.7089, longitude: 11.9746, timezone: 'Europe/Stockholm' },
  { id: '50', name: 'Port of Oslo', country: 'Norway', region: 'Europe', type: 'Secondary', callsign: 'NOOSL', vhfChannels: ['12', '16'], phone: '+47 23 47 71 00', latitude: 59.9139, longitude: 10.7522, timezone: 'Europe/Oslo' },
  { id: '51', name: 'Port of Helsinki', country: 'Finland', region: 'Europe', type: 'Secondary', callsign: 'FIHEL', vhfChannels: ['12', '16'], phone: '+358 9 310 331', latitude: 60.1699, longitude: 24.9384, timezone: 'Europe/Helsinki' },
  { id: '52', name: 'Port of Copenhagen', country: 'Denmark', region: 'Europe', type: 'Secondary', callsign: 'DKCPH', vhfChannels: ['12', '16'], phone: '+45 33 93 33 93', latitude: 55.6761, longitude: 12.5683, timezone: 'Europe/Copenhagen' },
  { id: '53', name: 'Port of Gdansk', country: 'Poland', region: 'Europe', type: 'Secondary', callsign: 'PLGDN', vhfChannels: ['12', '16'], phone: '+48 58 737 9111', latitude: 54.3520, longitude: 18.6466, timezone: 'Europe/Warsaw' },
  { id: '54', name: 'Port of Istanbul', country: 'Turkey', region: 'Europe', type: 'Secondary', callsign: 'TRIST', vhfChannels: ['12', '16'], phone: '+90 212 449 4000', latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul' },
  { id: '55', name: 'Port of Barcelona', country: 'Spain', region: 'Europe', type: 'Secondary', callsign: 'ESBCN', vhfChannels: ['12', '16'], phone: '+34 93 306 8800', latitude: 41.3851, longitude: 2.1734, timezone: 'Europe/Madrid' },
  { id: '56', name: 'Port of Genoa', country: 'Italy', region: 'Europe', type: 'Secondary', callsign: 'ITGOA', vhfChannels: ['12', '16'], phone: '+39 010 241 241', latitude: 44.4056, longitude: 8.9463, timezone: 'Europe/Rome' },
  { id: '57', name: 'Port of Piraeus', country: 'Greece', region: 'Europe', type: 'Secondary', callsign: 'GRPIR', vhfChannels: ['12', '16'], phone: '+30 210 455 0000', latitude: 37.9420, longitude: 23.6462, timezone: 'Europe/Athens' },
  { id: '58', name: 'Port of Lisbon', country: 'Portugal', region: 'Europe', type: 'Secondary', callsign: 'PTLIS', vhfChannels: ['12', '16'], phone: '+351 21 361 1000', latitude: 38.7223, longitude: -9.1393, timezone: 'Europe/Lisbon' },
  { id: '59', name: 'Port of Montreal', country: 'Canada', region: 'North America', type: 'Secondary', callsign: 'CAMTR', vhfChannels: ['12', '16'], phone: '+1 514 283 7011', latitude: 45.5017, longitude: -73.5673, timezone: 'America/Montreal' },
  { id: '60', name: 'Port of Halifax', country: 'Canada', region: 'North America', type: 'Secondary', callsign: 'CAHAL', vhfChannels: ['12', '16'], phone: '+1 902 426 8222', latitude: 44.6488, longitude: -63.5752, timezone: 'America/Halifax' },
  { id: '61', name: 'Port of Seattle', country: 'USA', region: 'North America', type: 'Secondary', callsign: 'KSEA', vhfChannels: ['12', '16'], phone: '+1 206 728 3000', latitude: 47.6062, longitude: -122.3321, timezone: 'America/Los_Angeles' },
  { id: '62', name: 'Port of Houston', country: 'USA', region: 'North America', type: 'Secondary', callsign: 'KHOU', vhfChannels: ['12', '16'], phone: '+1 713 670 2400', latitude: 29.7604, longitude: -95.3698, timezone: 'America/Chicago' },
  { id: '63', name: 'Port of Miami', country: 'USA', region: 'North America', type: 'Secondary', callsign: 'KMIA', vhfChannels: ['12', '16'], phone: '+1 305 347 4800', latitude: 25.7617, longitude: -80.1918, timezone: 'America/New_York' },
  { id: '64', name: 'Port of San Francisco', country: 'USA', region: 'North America', type: 'Secondary', callsign: 'KSFO', vhfChannels: ['12', '16'], phone: '+1 415 274 0400', latitude: 37.7749, longitude: -122.4194, timezone: 'America/Los_Angeles' },
  { id: '65', name: 'Port of Baltimore', country: 'USA', region: 'North America', type: 'Secondary', callsign: 'KBWI', vhfChannels: ['12', '16'], phone: '+1 410 385 4400', latitude: 39.2904, longitude: -76.6122, timezone: 'America/New_York' },
];

/**
 * Get all ports (with optional filtering)
 * @param filters Optional filters for region, type, or search term
 * @returns Array of ports matching filters
 */
export async function getPorts(filters?: {
  region?: string;
  type?: 'Primary' | 'Secondary';
  search?: string;
}): Promise<Port[]> {
  // In production, this would query a database or external API
  // For now, filter the mock data
  let ports = [...portsDatabase];

  if (filters) {
    if (filters.region && filters.region !== 'all') {
      ports = ports.filter(port => port.region === filters.region);
    }

    if (filters.type && filters.type !== 'all') {
      ports = ports.filter(port => port.type === filters.type);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      ports = ports.filter(port =>
        port.name.toLowerCase().includes(searchLower) ||
        port.country.toLowerCase().includes(searchLower) ||
        port.callsign.toLowerCase().includes(searchLower)
      );
    }
  }

  return ports;
}

/**
 * Get a single port by ID
 * @param id Port ID
 * @returns Port or null if not found
 */
export async function getPortById(id: string): Promise<Port | null> {
  const port = portsDatabase.find(p => p.id === id);
  return port || null;
}

/**
 * Get ports near a location (within radius)
 * @param lat Latitude
 * @param lon Longitude
 * @param radiusKm Radius in kilometers (default: 100km)
 * @returns Array of ports within radius
 */
export async function getPortsNearLocation(
  lat: number,
  lon: number,
  radiusKm: number = 100
): Promise<Port[]> {
  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  
  return portsDatabase.filter(port => {
    const dLat = (port.latitude - lat) * Math.PI / 180;
    const dLon = (port.longitude - lon) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * Math.PI / 180) *
      Math.cos(port.latitude * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance <= radiusKm;
  }).sort((a, b) => {
    // Sort by distance (closest first)
    const distA = calculateDistance(lat, lon, a.latitude, a.longitude);
    const distB = calculateDistance(lat, lon, b.latitude, b.longitude);
    return distA - distB;
  });
}

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


