/**
 * Medical Facilities Service - Provides worldwide medical facility information
 * 
 * For production, consider integrating with:
 * - Medical facility databases
 * - Hyperbaric chamber directories
 * - Emergency services databases
 * - Diving medicine specialists directories
 * 
 * Currently uses comprehensive mock data covering major medical facilities worldwide
 */

import { db } from './db';
import { medicalFacilities, userMedicalFacilitySelections } from '../shared/schema-sqlite';
import { eq, and, sql, or, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

type UserMedicalFacilitySelection = typeof userMedicalFacilitySelections.$inferSelect;

export type MedicalFacilityType = 'A_E' | 'CRITICAL_CARE' | 'DIVING_DOCTOR' | 'HYPERBARIC';

export interface MedicalFacility {
  id: string;
  name: string;
  type: MedicalFacilityType;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  country: string;
  region?: string;
  phone?: string;
  emergencyPhone?: string;
  email?: string;
  website?: string;
  specialties?: string[];
  services?: string[];
  isAvailable24h: boolean;
  notes?: string;
  isVerified: boolean;
  distanceKm?: number; // Calculated distance from search location
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get medical facilities near a location
 */
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
    // Query facilities from database
    let query = db.select().from(medicalFacilities);

    // Apply filters
    const conditions = [];
    if (filters?.types && filters.types.length > 0) {
      conditions.push(inArray(medicalFacilities.type, filters.types));
    }
    if (filters?.country) {
      conditions.push(eq(medicalFacilities.country, filters.country));
    }
    if (filters?.region) {
      conditions.push(eq(medicalFacilities.region, filters.region));
    }
    if (filters?.available24h !== undefined) {
      conditions.push(eq(medicalFacilities.isAvailable24h, filters.available24h));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query;

    // Transform database results to interface format
    let facilities: MedicalFacility[] = results.map((facility: any) => ({
      id: facility.id,
      name: facility.name,
      type: facility.type,
      latitude: facility.latitude,
      longitude: facility.longitude,
      address: facility.address || undefined,
      city: facility.city || undefined,
      country: facility.country,
      region: facility.region || undefined,
      phone: facility.phone || undefined,
      emergencyPhone: facility.emergencyPhone || undefined,
      email: facility.email || undefined,
      website: facility.website || undefined,
      specialties: facility.specialties ? JSON.parse(facility.specialties) : [],
      services: facility.services ? JSON.parse(facility.services) : [],
      isAvailable24h: facility.isAvailable24h === 1,
      notes: facility.notes || undefined,
      isVerified: facility.isVerified === 1,
    }));

    // Calculate distances if location provided
    if (filters?.latitude && filters?.longitude) {
      facilities = facilities.map(facility => ({
        ...facility,
        distanceKm: calculateDistance(
          filters.latitude!,
          filters.longitude!,
          facility.latitude,
          facility.longitude
        ),
      }));

      // Filter by radius if specified
      if (filters.radiusKm) {
        facilities = facilities.filter(f => (f.distanceKm || 0) <= filters.radiusKm!);
      }

      // Sort by distance
      facilities.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    }

    return facilities;
  } catch (error) {
    console.error('Error fetching medical facilities:', error);
    // Return mock data as fallback
    return getMockMedicalFacilities(filters);
  }
}

/**
 * Get user's selected medical facilities
 */
export async function getUserMedicalFacilities(userId: string): Promise<MedicalFacility[]> {
  try {
    const selections = await db
      .select()
      .from(userMedicalFacilitySelections)
      .where(eq(userMedicalFacilitySelections.userId, userId));

    if (selections.length === 0) {
      return [];
    }

      const facilityIds = selections.map((s: UserMedicalFacilitySelection) => s.facilityId);
    const facilities = await db
      .select()
      .from(medicalFacilities)
      .where(inArray(medicalFacilities.id, facilityIds));

    return facilities.map((facility: any) => ({
      id: facility.id,
      name: facility.name,
      type: facility.type,
      latitude: facility.latitude,
      longitude: facility.longitude,
      address: facility.address || undefined,
      city: facility.city || undefined,
      country: facility.country,
      region: facility.region || undefined,
      phone: facility.phone || undefined,
      emergencyPhone: facility.emergencyPhone || undefined,
      email: facility.email || undefined,
      website: facility.website || undefined,
      specialties: facility.specialties ? JSON.parse(facility.specialties) : [],
      services: facility.services ? JSON.parse(facility.services) : [],
      isAvailable24h: facility.isAvailable24h === 1,
      notes: facility.notes || undefined,
      isVerified: facility.isVerified === 1,
    }));
  } catch (error) {
    console.error('Error fetching user medical facilities:', error);
    return [];
  }
}

/**
 * Add medical facility to user's selections
 */
export async function addUserMedicalFacility(
  userId: string,
  facilityId: string,
  isPrimary: boolean = false
): Promise<void> {
  try {
    // If setting as primary, unset other primary facilities
    if (isPrimary) {
      await db
        .update(userMedicalFacilitySelections)
        .set({ isPrimary: false })
        .where(eq(userMedicalFacilitySelections.userId, userId));
    }

    // Check if selection already exists
    const existing = await db
      .select()
      .from(userMedicalFacilitySelections)
      .where(
        and(
          eq(userMedicalFacilitySelections.userId, userId),
          eq(userMedicalFacilitySelections.facilityId, facilityId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing selection
      await db
        .update(userMedicalFacilitySelections)
        .set({ isPrimary, updatedAt: new Date() })
        .where(
          and(
            eq(userMedicalFacilitySelections.userId, userId),
            eq(userMedicalFacilitySelections.facilityId, facilityId)
          )
        );
    } else {
      // Insert new selection
      await db.insert(userMedicalFacilitySelections).values({
        id: nanoid(),
        userId,
        facilityId,
        isPrimary,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  } catch (error) {
    console.error('Error adding user medical facility:', error);
    throw error;
  }
}

/**
 * Remove medical facility from user's selections
 */
export async function removeUserMedicalFacility(
  userId: string,
  facilityId: string
): Promise<void> {
  try {
    await db
      .delete(userMedicalFacilitySelections)
      .where(
        and(
          eq(userMedicalFacilitySelections.userId, userId),
          eq(userMedicalFacilitySelections.facilityId, facilityId)
        )
      );
  } catch (error) {
    console.error('Error removing user medical facility:', error);
    throw error;
  }
}

/**
 * Mock medical facilities data (fallback)
 */
function getMockMedicalFacilities(filters?: {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  types?: MedicalFacilityType[];
  country?: string;
  region?: string;
}): MedicalFacility[] {
  const mockFacilities: MedicalFacility[] = [
    // A&E Facilities
    {
      id: 'ae-1',
      name: 'Royal Aberdeen Hospital A&E',
      type: 'A_E',
      latitude: 57.1497,
      longitude: -2.0943,
      address: 'Foresterhill, Aberdeen AB25 2ZN',
      city: 'Aberdeen',
      country: 'United Kingdom',
      region: 'Scotland',
      phone: '+44 1224 681818',
      emergencyPhone: '+44 1224 681818',
      isAvailable24h: true,
      isVerified: true,
      specialties: ['Emergency Medicine', 'Diving Injuries'],
      services: ['24/7 Emergency Care', 'Diving Medicine'],
    },
    {
      id: 'ae-2',
      name: 'Scripps Memorial Hospital La Jolla',
      type: 'A_E',
      latitude: 32.8328,
      longitude: -117.2713,
      address: '9888 Genesee Ave, La Jolla, CA 92037',
      city: 'La Jolla',
      country: 'USA',
      region: 'California',
      phone: '+1 858 457 4123',
      emergencyPhone: '+1 858 457 4123',
      isAvailable24h: true,
      isVerified: true,
      specialties: ['Emergency Medicine', 'Hyperbaric Medicine'],
      services: ['24/7 Emergency Care', 'Hyperbaric Chamber'],
    },
    // Critical Care
    {
      id: 'cc-1',
      name: 'Duke University Hospital - Critical Care',
      type: 'CRITICAL_CARE',
      latitude: 35.9967,
      longitude: -78.9019,
      address: '2301 Erwin Rd, Durham, NC 27710',
      city: 'Durham',
      country: 'USA',
      region: 'North Carolina',
      phone: '+1 919 684 8111',
      emergencyPhone: '+1 919 684 8111',
      isAvailable24h: true,
      isVerified: true,
      specialties: ['Critical Care Medicine', 'Hyperbaric Medicine'],
      services: ['ICU', 'Hyperbaric Chamber', '24/7 Critical Care'],
    },
    // Diving Doctors
    {
      id: 'dd-1',
      name: 'Dr. Michael Rodriguez - Diving Medicine Specialist',
      type: 'DIVING_DOCTOR',
      latitude: 51.5074,
      longitude: -0.1278,
      address: 'London Hyperbaric Medicine Centre',
      city: 'London',
      country: 'United Kingdom',
      region: 'England',
      phone: '+44 20 7123 4567',
      email: 'info@londonhyperbaric.co.uk',
      isAvailable24h: false,
      isVerified: true,
      specialties: ['Diving Medicine', 'Decompression Sickness', 'Hyperbaric Medicine'],
      services: ['Diving Medical Consultations', 'Hyperbaric Treatment'],
    },
    // Hyperbaric Facilities
    {
      id: 'hb-1',
      name: 'DAN Hyperbaric Chamber - Durham',
      type: 'HYPERBARIC',
      latitude: 35.9967,
      longitude: -78.9019,
      address: 'Duke University Medical Center, Durham, NC',
      city: 'Durham',
      country: 'USA',
      region: 'North Carolina',
      phone: '+1 919 684 2948',
      emergencyPhone: '+1 919 684 8111',
      isAvailable24h: true,
      isVerified: true,
      specialties: ['Hyperbaric Medicine', 'Diving Medicine'],
      services: ['24/7 Hyperbaric Chamber', 'Emergency Decompression Treatment'],
    },
    {
      id: 'hb-2',
      name: 'Netcare Hospital Hyperbaric Unit',
      type: 'HYPERBARIC',
      latitude: -33.9249,
      longitude: 18.4241,
      address: 'Netcare Hospital, Cape Town',
      city: 'Cape Town',
      country: 'South Africa',
      region: 'Western Cape',
      phone: '+27 21 464 5111',
      emergencyPhone: '+27 21 464 5111',
      isAvailable24h: true,
      isVerified: true,
      specialties: ['Hyperbaric Medicine', 'Diving Medicine'],
      services: ['24/7 Hyperbaric Chamber', 'Emergency Treatment'],
    },
  ];

  // Apply filters
  let filtered = mockFacilities;

  if (filters?.types && filters.types.length > 0) {
    filtered = filtered.filter(f => filters.types!.includes(f.type));
  }

  if (filters?.country) {
    filtered = filtered.filter(f => f.country === filters.country);
  }

  if (filters?.region) {
    filtered = filtered.filter(f => f.region === filters.region);
  }

  // Calculate distances and filter by radius
  if (filters?.latitude && filters?.longitude) {
    filtered = filtered.map(f => ({
      ...f,
      distanceKm: calculateDistance(
        filters.latitude!,
        filters.longitude!,
        f.latitude,
        f.longitude
      ),
    }));

    if (filters.radiusKm) {
      filtered = filtered.filter(f => (f.distanceKm || 0) <= filters.radiusKm!);
    }

    filtered.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
  }

  return filtered;
}

