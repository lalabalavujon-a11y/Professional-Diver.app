#!/usr/bin/env tsx

/**
 * Script Cleanup Utility
 * 
 * Moves duplicate/old seed scripts to an archive folder
 * Keeps actively used utility scripts
 */

import { mkdir, rename, access } from 'fs/promises';
import { join } from 'path';

const SCRIPTS_DIR = join(process.cwd(), 'scripts');
const ARCHIVE_DIR = join(SCRIPTS_DIR, 'archive');

// Scripts to archive (duplicates/old versions)
const SCRIPTS_TO_ARCHIVE = [
  // Old seed scripts
  'seed.ts',
  'simple-seed.ts',
  'minimal-working-seed.ts',
  'comprehensive-seed.ts',
  'final-professional-seed.ts',
  'corrected-professional-seed.ts',
  'professional-diving-seed.ts',
  'fixed-categorization-seed.ts',
  'database-compatible-seed.ts',
  'fixed-seed.ts',
  'current-db-seed.ts',
  'working-seed.ts',
  'simple-populate.ts',
  'populate-content.ts',
  'populate-tracks.ts',
  
  // Reusable/template scripts (old versions)
  'REUSABLE_SCRIPT.ts',
  'REUSABLE_EDUCATIONAL_PLATFORM_SCRIPT.ts',
  'INDUSTRY_TEMPLATE_SCRIPT.ts',
  'SUPER_EDUCATIONAL_PLATFORM_SCRIPT.ts',
  
  // Platform check scripts (duplicates)
  'platform-validation-script.ts',
  'simple-platform-check.ts',
];

// Scripts to keep (actively used)
const SCRIPTS_TO_KEEP = [
  'init-laura-oracle.ts',           // Referenced in package.json
  'add-partners-to-crm.ts',         // Currently in use
  'seed-medical-facilities.ts',     // Utility
  'seed-equipment.ts',              // Utility
  'ensure-equipment-tables.ts',     // Utility
  'update-ai-tutors.ts',            // Utility
  'add-missing-quizzes.ts',         // Utility
  'set-default-location.ts',        // Utility
  'add-hyperbaric-lessons.ts',      // Utility
  'add-welding-lessons.ts',         // Utility
  'import-repository-content.ts',   // Utility
  'professional-seed.ts',           // Keep one seed script as reference
];

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🧹 Starting script cleanup...\n');

  // Create archive directory
  try {
    await mkdir(ARCHIVE_DIR, { recursive: true });
    console.log(`✅ Created archive directory: ${ARCHIVE_DIR}\n`);
  } catch (error) {
    console.error('❌ Failed to create archive directory:', error);
    process.exit(1);
  }

  let movedCount = 0;
  let skippedCount = 0;
  const movedFiles: string[] = [];
  const skippedFiles: string[] = [];

  // Move scripts to archive
  for (const script of SCRIPTS_TO_ARCHIVE) {
    const sourcePath = join(SCRIPTS_DIR, script);
    const destPath = join(ARCHIVE_DIR, script);

    try {
      if (await fileExists(sourcePath)) {
        await rename(sourcePath, destPath);
        movedFiles.push(script);
        movedCount++;
        console.log(`📦 Moved: ${script}`);
      } else {
        skippedFiles.push(script);
        skippedCount++;
        console.log(`⏭️  Skipped (not found): ${script}`);
      }
    } catch (error) {
      console.error(`❌ Error moving ${script}:`, error);
      skippedFiles.push(script);
      skippedCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Cleanup Summary');
  console.log('='.repeat(60));
  console.log(`✅ Moved to archive: ${movedCount} files`);
  console.log(`⏭️  Skipped: ${skippedCount} files`);
  console.log(`📁 Archive location: ${ARCHIVE_DIR}`);
  console.log('\n📋 Files moved:');
  movedFiles.forEach(file => console.log(`   - ${file}`));
  
  if (skippedFiles.length > 0) {
    console.log('\n⏭️  Files skipped (not found):');
    skippedFiles.forEach(file => console.log(`   - ${file}`));
  }

  console.log('\n📌 Scripts kept in scripts/ directory:');
  SCRIPTS_TO_KEEP.forEach(file => console.log(`   ✓ ${file}`));
  
  console.log('\n✨ Cleanup complete!');
  console.log('💡 You can recover files from the archive folder if needed.\n');
}

main().catch(console.error);

