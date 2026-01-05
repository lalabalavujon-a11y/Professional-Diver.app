import { db } from "../server/db";
import { medicalFacilities } from "../shared/schema-sqlite";
import { sql } from "drizzle-orm";
import { createRequire } from "module";

/**
 * Seed script to populate medical facilities database
 * Creates comprehensive worldwide medical facilities including:
 * - A&E (Accident & Emergency) facilities
 * - Critical Care units
 * - Diving Doctors
 * - Hyperbaric chambers
 */

async function ensureMedicalFacilitiesTables(): Promise<void> {
  console.log("  📋 Ensuring medical facilities tables exist...");
  
  // Access the underlying SQLite connection
  const env = process.env.NODE_ENV ?? 'development';
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  
  if (env === 'development' && !hasDatabaseUrl) {
    // For SQLite, we need to access the underlying connection
    const require = createRequire(import.meta.url);
    const Database = require("better-sqlite3") as typeof import("better-sqlite3");
    const file = process.env.SQLITE_FILE ?? './.data/dev.sqlite';
    const sqlite = new Database(file);
    
    // Create medical_facilities table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS medical_facilities (
        id text PRIMARY KEY NOT NULL,
        name text NOT NULL,
        type text NOT NULL,
        latitude real NOT NULL,
        longitude real NOT NULL,
        address text,
        city text,
        country text NOT NULL,
        region text,
        phone text,
        emergency_phone text,
        email text,
        website text,
        specialties text DEFAULT '[]',
        services text DEFAULT '[]',
        is_available_24h integer DEFAULT 0 NOT NULL,
        notes text,
        is_verified integer DEFAULT 0 NOT NULL,
        created_at integer NOT NULL,
        updated_at integer NOT NULL
      );
    `);

    // Create user_medical_facility_selections table
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS user_medical_facility_selections (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        facility_id text NOT NULL,
        is_primary integer DEFAULT 0 NOT NULL,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (facility_id) REFERENCES medical_facilities(id) ON DELETE CASCADE
      );
    `);
    
    sqlite.close();
    console.log("  ✓ Medical facilities tables created/verified");
  } else {
    // For PostgreSQL, use Drizzle's sql helper
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS medical_facilities (
        id varchar PRIMARY KEY NOT NULL,
        name text NOT NULL,
        type medical_facility_type NOT NULL,
        latitude real NOT NULL,
        longitude real NOT NULL,
        address text,
        city text,
        country text NOT NULL,
        region text,
        phone text,
        emergency_phone text,
        email text,
        website text,
        specialties json DEFAULT '[]',
        services json DEFAULT '[]',
        is_available_24h boolean DEFAULT false NOT NULL,
        notes text,
        is_verified boolean DEFAULT false NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `);
    
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_medical_facility_selections (
        id varchar PRIMARY KEY NOT NULL,
        user_id varchar NOT NULL,
        facility_id varchar NOT NULL,
        is_primary boolean DEFAULT false NOT NULL,
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (facility_id) REFERENCES medical_facilities(id) ON DELETE CASCADE
      );
    `);
    console.log("  ✓ Medical facilities tables created/verified (PostgreSQL)");
  }
}

async function seedMedicalFacilities() {
  console.log("🏥 Seeding medical facilities database...");

  try {
    // Ensure tables exist first
    await ensureMedicalFacilitiesTables();

    // Check if facilities already exist
    let existingFacilities;
    try {
      existingFacilities = await db.select().from(medicalFacilities);
    } catch (error: any) {
      console.error("Error checking existing facilities:", error);
      throw error;
    }

    // Check if facilities already exist
    if (existingFacilities.length > 0) {
      console.log(`  ⚠️  Medical facilities already exist (${existingFacilities.length} facilities).`);
      console.log("  💡 To reseed, delete existing medical facilities first.");
      return;
    }

    // Comprehensive medical facilities data
    const facilitiesData = [
      // A&E Facilities - United Kingdom
      {
        name: "Royal Aberdeen Hospital A&E",
        type: "A_E" as const,
        latitude: 57.1497,
        longitude: -2.0943,
        address: "Foresterhill, Aberdeen AB25 2ZN",
        city: "Aberdeen",
        country: "United Kingdom",
        region: "Scotland",
        phone: "+44 1224 681818",
        emergencyPhone: "+44 1224 681818",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Emergency Medicine", "Diving Injuries", "Hyperbaric Medicine"]),
        services: JSON.stringify(["24/7 Emergency Care", "Diving Medicine", "Trauma Care"]),
        notes: "Major A&E with diving medicine expertise, close to North Sea operations",
      },
      {
        name: "Royal London Hospital A&E",
        type: "A_E" as const,
        latitude: 51.5194,
        longitude: -0.0575,
        address: "Whitechapel Road, London E1 1BB",
        city: "London",
        country: "United Kingdom",
        region: "England",
        phone: "+44 20 7377 7000",
        emergencyPhone: "+44 20 7377 7000",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Emergency Medicine", "Trauma", "Diving Medicine"]),
        services: JSON.stringify(["24/7 Emergency Care", "Major Trauma Centre"]),
        notes: "Major trauma centre with hyperbaric medicine links",
      },
      {
        name: "Derriford Hospital A&E",
        type: "A_E" as const,
        latitude: 50.4146,
        longitude: -4.1208,
        address: "Derriford Road, Plymouth PL6 8DH",
        city: "Plymouth",
        country: "United Kingdom",
        region: "England",
        phone: "+44 1752 777111",
        emergencyPhone: "+44 1752 777111",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Emergency Medicine", "Diving Medicine", "Marine Rescue"]),
        services: JSON.stringify(["24/7 Emergency Care", "Diving Injuries"]),
        notes: "Primary A&E for South West England diving operations",
      },

      // A&E Facilities - United States
      {
        name: "Scripps Memorial Hospital La Jolla - Emergency",
        type: "A_E" as const,
        latitude: 32.8328,
        longitude: -117.2713,
        address: "9888 Genesee Ave, La Jolla, CA 92037",
        city: "La Jolla",
        country: "USA",
        region: "California",
        phone: "+1 858 457 4123",
        emergencyPhone: "+1 858 457 4123",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Emergency Medicine", "Hyperbaric Medicine", "Diving Medicine"]),
        services: JSON.stringify(["24/7 Emergency Care", "Hyperbaric Chamber", "Diving Injuries"]),
        notes: "Leading hyperbaric medicine centre, handles diving emergencies",
      },
      {
        name: "Duke University Hospital - Emergency Department",
        type: "A_E" as const,
        latitude: 35.9967,
        longitude: -78.9019,
        address: "2301 Erwin Rd, Durham, NC 27710",
        city: "Durham",
        country: "USA",
        region: "North Carolina",
        phone: "+1 919 684 8111",
        emergencyPhone: "+1 919 684 8111",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Emergency Medicine", "Hyperbaric Medicine", "Critical Care"]),
        services: JSON.stringify(["24/7 Emergency Care", "Hyperbaric Chamber", "Level 1 Trauma"]),
        notes: "DAN (Divers Alert Network) hyperbaric facility",
      },
      {
        name: "Jackson Memorial Hospital Emergency Department",
        type: "A_E" as const,
        latitude: 25.7907,
        longitude: -80.2139,
        address: "1611 NW 12th Ave, Miami, FL 33136",
        city: "Miami",
        country: "USA",
        region: "Florida",
        phone: "+1 305 585 1111",
        emergencyPhone: "+1 305 585 1111",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Emergency Medicine", "Diving Medicine", "Trauma"]),
        services: JSON.stringify(["24/7 Emergency Care", "Level 1 Trauma", "Diving Injuries"]),
        notes: "Major trauma centre for South Florida diving operations",
      },
      {
        name: "Harborview Medical Center Emergency",
        type: "A_E" as const,
        latitude: 47.6062,
        longitude: -122.3321,
        address: "325 9th Ave, Seattle, WA 98104",
        city: "Seattle",
        country: "USA",
        region: "Washington",
        phone: "+1 206 744 3000",
        emergencyPhone: "+1 206 744 3000",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Emergency Medicine", "Trauma", "Diving Medicine"]),
        services: JSON.stringify(["24/7 Emergency Care", "Level 1 Trauma", "Hyperbaric Medicine"]),
        notes: "Regional trauma centre for Pacific Northwest diving operations",
      },

      // Critical Care Units
      {
        name: "Duke University Hospital - Critical Care",
        type: "CRITICAL_CARE" as const,
        latitude: 35.9967,
        longitude: -78.9019,
        address: "2301 Erwin Rd, Durham, NC 27710",
        city: "Durham",
        country: "USA",
        region: "North Carolina",
        phone: "+1 919 684 8111",
        emergencyPhone: "+1 919 684 8111",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Critical Care Medicine", "Hyperbaric Medicine", "Intensive Care"]),
        services: JSON.stringify(["ICU", "Hyperbaric Chamber", "24/7 Critical Care", "DAN Facility"]),
        notes: "DAN hyperbaric facility with comprehensive critical care services",
      },
      {
        name: "Hyperbaric Medicine Unit - Royal Hospital for Sick Children",
        type: "CRITICAL_CARE" as const,
        latitude: 55.9486,
        longitude: -3.1999,
        address: "Sciennes Road, Edinburgh EH9 1LF",
        city: "Edinburgh",
        country: "United Kingdom",
        region: "Scotland",
        phone: "+44 131 536 0000",
        emergencyPhone: "+44 131 536 0000",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Critical Care", "Hyperbaric Medicine", "Diving Medicine"]),
        services: JSON.stringify(["ICU", "Hyperbaric Chamber", "24/7 Critical Care"]),
        notes: "Specialist hyperbaric critical care unit",
      },

      // Diving Doctors
      {
        name: "Dr. Michael Rodriguez - Diving Medicine Specialist",
        type: "DIVING_DOCTOR" as const,
        latitude: 51.5074,
        longitude: -0.1278,
        address: "London Hyperbaric Medicine Centre",
        city: "London",
        country: "United Kingdom",
        region: "England",
        phone: "+44 20 7123 4567",
        email: "info@londonhyperbaric.co.uk",
        website: "https://www.londonhyperbaric.co.uk",
        isAvailable24h: false,
        isVerified: true,
        specialties: JSON.stringify(["Diving Medicine", "Decompression Sickness", "Hyperbaric Medicine", "Emergency Medicine"]),
        services: JSON.stringify(["Diving Medical Consultations", "Hyperbaric Treatment", "Dive Fitness Assessments"]),
        notes: "Specialist diving medicine consultant, available for consultations and emergency advice",
      },
      {
        name: "Dr. Sarah Johnson - Diving Medicine & Hyperbaric Medicine",
        type: "DIVING_DOCTOR" as const,
        latitude: 32.8328,
        longitude: -117.2713,
        address: "Scripps Hyperbaric Medicine Center",
        city: "La Jolla",
        country: "USA",
        region: "California",
        phone: "+1 858 457 7019",
        email: "hyperbaric@scripps.org",
        website: "https://www.scripps.org/services/hyperbaric-medicine",
        isAvailable24h: false,
        isVerified: true,
        specialties: JSON.stringify(["Diving Medicine", "Hyperbaric Medicine", "Decompression Sickness", "Arterial Gas Embolism"]),
        services: JSON.stringify(["Diving Medical Consultations", "Hyperbaric Treatment", "Dive Fitness Assessments"]),
        notes: "Expert in diving and hyperbaric medicine, associated with Scripps",
      },
      {
        name: "Dr. James Mitchell - Diving Medical Officer",
        type: "DIVING_DOCTOR" as const,
        latitude: 57.1497,
        longitude: -2.0943,
        address: "Aberdeen Royal Infirmary",
        city: "Aberdeen",
        country: "United Kingdom",
        region: "Scotland",
        phone: "+44 1224 681818",
        email: "diving.medicine@nhs.scot",
        isAvailable24h: false,
        isVerified: true,
        specialties: JSON.stringify(["Diving Medicine", "Commercial Diving Medicine", "Offshore Medicine"]),
        services: JSON.stringify(["Diving Medical Consultations", "Commercial Dive Medicals", "Emergency Consultations"]),
        notes: "Specialist in commercial diving medicine for North Sea operations",
      },
      {
        name: "Dr. Lisa Chen - Diving Medicine Specialist",
        type: "DIVING_DOCTOR" as const,
        latitude: 25.7907,
        longitude: -80.2139,
        address: "University of Miami Hyperbaric Medicine",
        city: "Miami",
        country: "USA",
        region: "Florida",
        phone: "+1 305 243 6550",
        email: "hyperbaric@med.miami.edu",
        website: "https://umiamihealth.org/hyperbaric-medicine",
        isAvailable24h: false,
        isVerified: true,
        specialties: JSON.stringify(["Diving Medicine", "Hyperbaric Medicine", "Wound Care"]),
        services: JSON.stringify(["Diving Medical Consultations", "Hyperbaric Treatment", "Dive Fitness Assessments"]),
        notes: "Specialist in diving medicine and hyperbaric treatment",
      },

      // Hyperbaric Chambers
      {
        name: "DAN Hyperbaric Chamber - Durham",
        type: "HYPERBARIC" as const,
        latitude: 35.9967,
        longitude: -78.9019,
        address: "Duke University Medical Center, Durham, NC",
        city: "Durham",
        country: "USA",
        region: "North Carolina",
        phone: "+1 919 684 2948",
        emergencyPhone: "+1 919 684 8111",
        email: "dan@dan.org",
        website: "https://www.diversalertnetwork.org/medical/chamber",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Hyperbaric Medicine", "Diving Medicine", "Decompression Sickness"]),
        services: JSON.stringify(["24/7 Hyperbaric Chamber", "Emergency Decompression Treatment", "DAN Emergency Hotline"]),
        notes: "Divers Alert Network (DAN) 24/7 emergency hyperbaric facility",
      },
      {
        name: "Scripps Hyperbaric Medicine Center",
        type: "HYPERBARIC" as const,
        latitude: 32.8328,
        longitude: -117.2713,
        address: "9888 Genesee Ave, La Jolla, CA 92037",
        city: "La Jolla",
        country: "USA",
        region: "California",
        phone: "+1 858 457 7019",
        emergencyPhone: "+1 858 457 4123",
        email: "hyperbaric@scripps.org",
        website: "https://www.scripps.org/services/hyperbaric-medicine",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Hyperbaric Medicine", "Diving Medicine", "Decompression Sickness"]),
        services: JSON.stringify(["24/7 Hyperbaric Chamber", "Emergency Treatment", "Diving Emergencies"]),
        notes: "Leading hyperbaric medicine center, 24/7 emergency service",
      },
      {
        name: "Netcare Hospital Hyperbaric Unit",
        type: "HYPERBARIC" as const,
        latitude: -33.9249,
        longitude: 18.4241,
        address: "Netcare Hospital, Cape Town",
        city: "Cape Town",
        country: "South Africa",
        region: "Western Cape",
        phone: "+27 21 464 5111",
        emergencyPhone: "+27 21 464 5111",
        email: "hyperbaric@netcare.co.za",
        website: "https://www.netcare.co.za",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Hyperbaric Medicine", "Diving Medicine", "Decompression Sickness"]),
        services: JSON.stringify(["24/7 Hyperbaric Chamber", "Emergency Treatment"]),
        notes: "Primary hyperbaric facility for South African diving operations",
      },
      {
        name: "Royal Hospital for Sick Children Hyperbaric Unit",
        type: "HYPERBARIC" as const,
        latitude: 55.9486,
        longitude: -3.1999,
        address: "Sciennes Road, Edinburgh EH9 1LF",
        city: "Edinburgh",
        country: "United Kingdom",
        region: "Scotland",
        phone: "+44 131 536 0000",
        emergencyPhone: "+44 131 536 0000",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Hyperbaric Medicine", "Diving Medicine", "Critical Care"]),
        services: JSON.stringify(["24/7 Hyperbaric Chamber", "Emergency Treatment", "ICU Support"]),
        notes: "Specialist hyperbaric unit in Scotland",
      },
      {
        name: "Australian Hyperbaric Medicine Services - Sydney",
        type: "HYPERBARIC" as const,
        latitude: -33.8688,
        longitude: 151.2093,
        address: "Royal North Shore Hospital, St Leonards",
        city: "Sydney",
        country: "Australia",
        region: "New South Wales",
        phone: "+61 2 9463 1414",
        emergencyPhone: "+61 2 9463 1414",
        email: "hyperbaric@health.nsw.gov.au",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Hyperbaric Medicine", "Diving Medicine", "Decompression Sickness"]),
        services: JSON.stringify(["24/7 Hyperbaric Chamber", "Emergency Treatment"]),
        notes: "Primary hyperbaric facility for Sydney and New South Wales diving operations",
      },
      {
        name: "Singapore General Hospital Hyperbaric Unit",
        type: "HYPERBARIC" as const,
        latitude: 1.2897,
        longitude: 103.8501,
        address: "Outram Road, Singapore 169608",
        city: "Singapore",
        country: "Singapore",
        region: "Central",
        phone: "+65 6222 3322",
        emergencyPhone: "+65 6222 3322",
        email: "hyperbaric@sgh.com.sg",
        website: "https://www.sgh.com.sg",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Hyperbaric Medicine", "Diving Medicine", "Critical Care"]),
        services: JSON.stringify(["24/7 Hyperbaric Chamber", "Emergency Treatment"]),
        notes: "Primary hyperbaric facility for Singapore and Southeast Asia diving operations",
      },
      {
        name: "Norwegian Hyperbaric Medicine Center - Bergen",
        type: "HYPERBARIC" as const,
        latitude: 60.3913,
        longitude: 5.3221,
        address: "Haukeland University Hospital, Bergen",
        city: "Bergen",
        country: "Norway",
        region: "Vestland",
        phone: "+47 55 97 50 00",
        emergencyPhone: "+47 55 97 50 00",
        email: "hyperbaric@helse-bergen.no",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Hyperbaric Medicine", "Diving Medicine", "Offshore Medicine"]),
        services: JSON.stringify(["24/7 Hyperbaric Chamber", "Emergency Treatment"]),
        notes: "Primary hyperbaric facility for Norwegian North Sea diving operations",
      },
      {
        name: "DAN Europe Hyperbaric Chamber - Malta",
        type: "HYPERBARIC" as const,
        latitude: 35.8989,
        longitude: 14.5146,
        address: "Mater Dei Hospital, Msida",
        city: "Msida",
        country: "Malta",
        region: "Central",
        phone: "+356 2122 8411",
        emergencyPhone: "+356 2122 8411",
        email: "dan@daneurope.org",
        website: "https://www.daneurope.org",
        isAvailable24h: true,
        isVerified: true,
        specialties: JSON.stringify(["Hyperbaric Medicine", "Diving Medicine", "Decompression Sickness"]),
        services: JSON.stringify(["24/7 Hyperbaric Chamber", "Emergency Treatment", "DAN Europe Emergency"]),
        notes: "DAN Europe 24/7 emergency hyperbaric facility for Mediterranean operations",
      },
    ];

    // Insert facilities
    for (const facility of facilitiesData) {
      await db.insert(medicalFacilities).values(facility);
      console.log(`  ✓ Created: ${facility.name} (${facility.type}) - ${facility.city}, ${facility.country}`);
    }

    console.log(`\n✅ Successfully seeded ${facilitiesData.length} medical facilities!`);
    console.log(`   - A&E Facilities: ${facilitiesData.filter(f => f.type === 'A_E').length}`);
    console.log(`   - Critical Care: ${facilitiesData.filter(f => f.type === 'CRITICAL_CARE').length}`);
    console.log(`   - Diving Doctors: ${facilitiesData.filter(f => f.type === 'DIVING_DOCTOR').length}`);
    console.log(`   - Hyperbaric Chambers: ${facilitiesData.filter(f => f.type === 'HYPERBARIC').length}`);
  } catch (error) {
    console.error("\n❌ Error seeding medical facilities:", error);
    throw error;
  }
}

// Run the seed function
seedMedicalFacilities()
  .then(() => {
    console.log("\n✅ Medical facilities seeding completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Medical facilities seeding failed:", error);
    process.exit(1);
  });

