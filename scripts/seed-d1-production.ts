/**
 * Script to seed all 9 tracks into Cloudflare D1 production database
 * Run with: wrangler d1 execute professionaldiver-db --file=./scripts/seed-d1-production.ts --env production
 * Or use: tsx scripts/seed-d1-production.ts (for local testing with D1)
 */

import { drizzle } from 'drizzle-orm/d1';
import * as schema from '@shared/schema-sqlite';

// This script should be run via wrangler d1 execute
// For now, we'll create SQL statements that can be executed

const tracksToSeed = [
  {
    id: 'ndt-inspection-track',
    title: 'Inspection & Non-Destructive Testing (NDT)',
    slug: 'ndt-inspection',
    summary: 'Master visual inspection, magnetic particle testing, and ultrasonic testing for professional certification.',
    isPublished: 1,
    difficulty: 'advanced',
    estimatedHours: 40,
  },
  {
    id: 'diver-medic-track',
    title: 'Diver Medic Technician (DMT)',
    slug: 'diver-medic',
    summary: 'Emergency medical response, ABCDE assessment, and diving injury treatment certification.',
    isPublished: 1,
    difficulty: 'expert',
    estimatedHours: 60,
  },
  {
    id: 'commercial-supervisor-track',
    title: 'Commercial Dive Supervisor',
    slug: 'commercial-supervisor',
    summary: 'Dive operations management, safety protocols, and emergency response leadership.',
    isPublished: 1,
    difficulty: 'expert',
    estimatedHours: 50,
  },
  {
    id: 'saturation-diving-track',
    title: 'Saturation Diving Systems',
    slug: 'saturation-diving',
    summary: 'Saturation diving operations, life support systems, and decompression management.',
    isPublished: 1,
    difficulty: 'expert',
    estimatedHours: 80,
  },
  {
    id: 'underwater-welding-track',
    title: 'Advanced Underwater Welding',
    slug: 'underwater-welding',
    summary: 'Professional underwater welding techniques, electrode selection, and quality control.',
    isPublished: 1,
    difficulty: 'advanced',
    estimatedHours: 60,
  },
  {
    id: 'hyperbaric-operations-track',
    title: 'Hyperbaric Chamber Operations',
    slug: 'hyperbaric-operations',
    summary: 'Hyperbaric treatment protocols, emergency procedures, and patient monitoring.',
    isPublished: 1,
    difficulty: 'intermediate',
    estimatedHours: 30,
  },
  {
    id: 'alst-track',
    title: 'Assistant Life Support Technician (ALST)',
    slug: 'alst',
    summary: 'Advanced life support operations, emergency decompression protocols, and saturation diving medical procedures.',
    isPublished: 1,
    difficulty: 'expert',
    estimatedHours: 70,
  },
  {
    id: 'lst-track',
    title: 'Life Support Technician (LST)',
    slug: 'lst',
    summary: 'Life support system operations, gas management, and emergency response procedures.',
    isPublished: 1,
    difficulty: 'advanced',
    estimatedHours: 50,
  },
  {
    id: 'air-diver-track',
    title: 'Air Diver Certification',
    slug: 'air-diver-certification',
    summary: 'Essential air diving skills including diving physics review, gas management concepts, ascent best practices, problem-solving drills, tool handling safety, and basic communications.',
    isPublished: 1,
    difficulty: 'intermediate',
    estimatedHours: 40,
  },
];

// Generate SQL INSERT statements
function generateSQL() {
  const now = Math.floor(Date.now() / 1000);
  const inserts = tracksToSeed.map(track => {
    return `INSERT OR REPLACE INTO tracks (id, title, slug, summary, is_published, difficulty, estimated_hours, created_at) VALUES ('${track.id}', '${track.title.replace(/'/g, "''")}', '${track.slug}', '${track.summary.replace(/'/g, "''")}', ${track.isPublished}, '${track.difficulty}', ${track.estimatedHours}, ${now});`;
  });
  
  return inserts.join('\n');
}

console.log('-- SQL to seed 9 tracks into D1 database');
console.log('-- Run this with: wrangler d1 execute professionaldiver-db --command="<sql>" --env production');
console.log('\n' + generateSQL());

// For programmatic execution (if running via tsx)
export async function seedD1Tracks(db: D1Database) {
  const drizzleDb = drizzle(db, { schema });
  const now = new Date();
  
  console.log('🌱 Seeding 9 tracks into D1 database...');
  
  for (const track of tracksToSeed) {
    try {
      await drizzleDb.insert(schema.tracks).values({
        id: track.id,
        title: track.title,
        slug: track.slug,
        summary: track.summary,
        isPublished: track.isPublished === 1,
        difficulty: track.difficulty as any,
        estimatedHours: track.estimatedHours,
        createdAt: now,
      }).onConflictDoUpdate({
        target: schema.tracks.slug,
        set: {
          title: track.title,
          summary: track.summary,
          isPublished: track.isPublished === 1,
          difficulty: track.difficulty as any,
          estimatedHours: track.estimatedHours,
        }
      });
      console.log(`✅ Seeded track: ${track.title}`);
    } catch (error) {
      console.error(`❌ Error seeding track ${track.slug}:`, error);
    }
  }
  
  console.log('✅ All 9 tracks seeded successfully!');
}





