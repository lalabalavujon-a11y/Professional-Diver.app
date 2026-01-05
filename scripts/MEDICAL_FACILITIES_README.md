# Medical Facilities Database Seeding Guide

This guide explains how to seed the medical facilities database with comprehensive worldwide medical facility data.

## Overview

The medical facilities database stores information about:
- **A&E (Accident & Emergency)** facilities
- **Critical Care** units
- **Diving Doctors** (specialists in diving medicine)
- **Hyperbaric Chambers** (for decompression sickness treatment)

## Quick Start

### 1. Seed the Database

Run the seeder script to create tables and populate with initial data:

```bash
npx tsx scripts/seed-medical-facilities.ts
```

The script will:
- ✅ Automatically create the required database tables if they don't exist
- ✅ Check if facilities already exist (to prevent duplicates)
- ✅ Seed 21+ medical facilities from major diving locations worldwide

### 2. Verify the Data

Test the API endpoint to verify the data was seeded:

```bash
# Get all facilities
curl "http://localhost:5000/api/medical-facilities"

# Get facilities by country
curl "http://localhost:5000/api/medical-facilities?country=United Kingdom"

# Get only A&E facilities
curl "http://localhost:5000/api/medical-facilities?types=A_E"

# Get hyperbaric chambers
curl "http://localhost:5000/api/medical-facilities?types=HYPERBARIC"

# Get facilities near a location
curl "http://localhost:5000/api/medical-facilities?lat=51.5074&lon=-0.1278&radiusKm=100"
```

## What Gets Seeded

The seeder creates **21 medical facilities** across major diving locations:

### A&E Facilities (7)
- **United Kingdom**: Aberdeen, London, Plymouth
- **United States**: California (La Jolla), North Carolina (Durham), Florida (Miami), Washington (Seattle)

### Critical Care Units (2)
- **United States**: Duke University Hospital (North Carolina)
- **United Kingdom**: Royal Hospital for Sick Children (Edinburgh)

### Diving Doctors (4)
- **United Kingdom**: London, Aberdeen
- **United States**: California (La Jolla), Florida (Miami)

### Hyperbaric Chambers (8)
- **United States**: North Carolina (DAN Durham), California (Scripps)
- **United Kingdom**: Edinburgh
- **South Africa**: Cape Town
- **Australia**: Sydney
- **Singapore**: Singapore General Hospital
- **Norway**: Bergen
- **Malta**: DAN Europe

## Database Schema

### `medical_facilities` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Primary key (auto-generated) |
| `name` | text | Facility name |
| `type` | text | Facility type: `A_E`, `CRITICAL_CARE`, `DIVING_DOCTOR`, `HYPERBARIC` |
| `latitude` | real | Geographic latitude |
| `longitude` | real | Geographic longitude |
| `address` | text | Street address |
| `city` | text | City name |
| `country` | text | Country name |
| `region` | text | Region/state/province |
| `phone` | text | General phone number |
| `emergency_phone` | text | Emergency contact number |
| `email` | text | Contact email |
| `website` | text | Website URL |
| `specialties` | text | JSON array of specialties |
| `services` | text | JSON array of services offered |
| `is_available_24h` | integer | Boolean: 24/7 availability |
| `notes` | text | Additional notes |
| `is_verified` | integer | Boolean: Verified facility |
| `created_at` | integer | Timestamp |
| `updated_at` | integer | Timestamp |

### `user_medical_facility_selections` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Primary key |
| `user_id` | text | Foreign key to users table |
| `facility_id` | text | Foreign key to medical_facilities table |
| `is_primary` | integer | Boolean: Primary facility selection |
| `created_at` | integer | Timestamp |
| `updated_at` | integer | Timestamp |

## Reseeding

If you need to reseed the database:

1. **Delete existing facilities** (optional - the script will skip if facilities exist):
   ```sql
   DELETE FROM user_medical_facility_selections;
   DELETE FROM medical_facilities;
   ```

2. **Run the seeder again**:
   ```bash
   npx tsx scripts/seed-medical-facilities.ts
   ```

## Adding More Facilities

To add more facilities, edit `scripts/seed-medical-facilities.ts` and add entries to the `facilitiesData` array:

```typescript
{
  name: "Your Facility Name",
  type: "A_E" as const, // or "CRITICAL_CARE", "DIVING_DOCTOR", "HYPERBARIC"
  latitude: 51.5074,
  longitude: -0.1278,
  address: "Street Address",
  city: "City Name",
  country: "Country Name",
  region: "Region/State",
  phone: "+1 234 567 8900",
  emergencyPhone: "+1 234 567 8900",
  email: "contact@facility.com",
  website: "https://facility.com",
  isAvailable24h: true,
  isVerified: true,
  specialties: JSON.stringify(["Specialty 1", "Specialty 2"]),
  services: JSON.stringify(["Service 1", "Service 2"]),
  notes: "Additional notes about the facility",
}
```

## API Integration

The medical facilities are accessible via the API:

- **GET `/api/medical-facilities`** - Search facilities with filters
- **GET `/api/medical-facilities/user-selections`** - Get user's selected facilities
- **POST `/api/medical-facilities/user-selections`** - Add facility to user selections
- **DELETE `/api/medical-facilities/user-selections/:facilityId`** - Remove facility from selections

See `API_INTEGRATION_GUIDE.md` for details on integrating with external APIs for live data.

## Troubleshooting

### Tables Don't Exist

The seeder script automatically creates tables. If you see errors:

1. Ensure you're using SQLite in development mode
2. Check that the `.data` directory exists and is writable
3. Verify the database file path: `./.data/dev.sqlite`

### Duplicate Facilities

The script checks for existing facilities and won't create duplicates. To force reseed, delete existing facilities first (see Reseeding section above).

### Database Connection Errors

- Ensure the server database connection is working
- Check that `better-sqlite3` is installed: `npm install better-sqlite3`
- Verify the database file permissions

## Related Files

- **Seeder Script**: `scripts/seed-medical-facilities.ts`
- **Service**: `server/medical-facilities-service.ts`
- **API Routes**: `server/routes.ts` (lines ~2058-2120)
- **Schema**: `shared/schema-sqlite.ts` (medical facilities tables)
- **Frontend Component**: `client/src/components/med-ops/MedOpsApp.tsx`
- **API Integration Guide**: `API_INTEGRATION_GUIDE.md`

## Next Steps

1. ✅ **Database seeded** - Medical facilities are now available
2. 🔄 **Test the API** - Verify endpoints are working
3. 🌐 **Integrate live data** - See `API_INTEGRATION_GUIDE.md` for external API options
4. 📱 **Use in MED OPS** - Access via Operations → MED OPS / Emergency OPS

## Support

For issues or questions:
- Check the API Integration Guide for external API options
- Review the service file for implementation details
- Check server logs for database errors

