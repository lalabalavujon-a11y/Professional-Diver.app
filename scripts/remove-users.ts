/**
 * Remove specific users from the database
 * Removes test/demo users that are no longer needed
 */

import { db } from '../server/db.js';
import { users } from '@shared/schema-sqlite';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// Import the correct schema based on environment
const env = process.env.NODE_ENV ?? 'development';
const isProduction = env === 'production' && process.env.DATABASE_URL;
const { users: usersSchema } = isProduction 
  ? await import('@shared/schema')
  : await import('@shared/schema-sqlite');

// Users to remove
const usersToRemove = [
  'jone.cirikidaveta@gmail.com',
  'jone7898@gmail.com',
  'samueltabuya35@gmail.com',
  'jone.viti@gmail.com',
  'freddierusseljoseph@yahoo.com', // Alternative email format for Freddie
];

async function removeUsers() {
  console.log('🗑️  Starting user removal process...\n');

  let removed = 0;
  let notFound = 0;
  let errors = 0;

  for (const email of usersToRemove) {
    try {
      // Find user by email
      const [user] = await db
        .select()
        .from(usersSchema)
        .where(eq(usersSchema.email, email))
        .limit(1);

      if (user) {
        // Delete user
        await db
          .delete(usersSchema)
          .where(eq(usersSchema.email, email));

        console.log(`✅ Removed user: ${email}`);
        removed++;
      } else {
        console.log(`⏭️  User not found: ${email}`);
        notFound++;
      }
    } catch (error) {
      console.error(`❌ Error removing ${email}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Removal Summary:');
  console.log(`   ✅ Removed: ${removed}`);
  console.log(`   ⏭️  Not Found: ${notFound}`);
  console.log(`   ❌ Errors: ${errors}`);

  if (errors === 0) {
    console.log('\n✅ User removal completed successfully!\n');
  } else {
    console.log('⚠️  Removal completed with errors. Please review the output above.\n');
    process.exit(1);
  }
}

// Run removal
removeUsers().catch((error) => {
  console.error('❌ Fatal error during user removal:', error);
  process.exit(1);
});




