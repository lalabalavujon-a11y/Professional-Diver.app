/**
 * Migration script to move hardcoded users to database with hashed passwords
 * Run this script once to migrate existing admin/partner admin users to the database
 * 
 * Usage: tsx scripts/migrate-users-to-database-auth.ts
 */

import { db } from '../server/db.js';
import { eq } from 'drizzle-orm';
import { hashPassword } from '../server/utils/auth.js';
import { nanoid } from 'nanoid';

// Import the correct schema based on environment
const env = process.env.NODE_ENV ?? 'development';
const isProduction = env === 'production' && process.env.DATABASE_URL;
const { users } = isProduction 
  ? await import('@shared/schema')
  : await import('@shared/schema-sqlite');

interface UserToMigrate {
  email: string;
  name: string;
  password: string;
  role: 'SUPER_ADMIN' | 'PARTNER_ADMIN' | 'USER';
  subscriptionType: 'LIFETIME' | 'TRIAL';
  restrictedAccess?: string[];
}

// Users to migrate from hardcoded credentials
const usersToMigrate: UserToMigrate[] = [
  {
    email: 'lalabalavu.jon@gmail.com',
    name: 'Admin User',
    password: 'admin123', // User should change this after migration
    role: 'SUPER_ADMIN',
    subscriptionType: 'LIFETIME',
  },
  {
    email: 'admin@diverwell.app',
    name: 'Admin User',
    password: 'admin123', // User should change this after migration
    role: 'ADMIN',
    subscriptionType: 'LIFETIME',
  },
  {
    email: 'freddierussell.joseph@yahoo.com',
    name: 'Freddie Joseph',
    password: 'partner123', // User should change this after migration
    role: 'PARTNER_ADMIN',
    subscriptionType: 'LIFETIME',
    restrictedAccess: ['affiliate', 'finance', 'revenue', 'billing', 'payments'],
  },
  {
    email: 'deesuks@gmail.com',
    name: 'Dilo Suka',
    password: 'partner123', // User should change this after migration
    role: 'PARTNER_ADMIN',
    subscriptionType: 'LIFETIME',
    restrictedAccess: ['affiliate', 'finance', 'revenue', 'billing', 'payments'],
  },
  // Lifetime users
  {
    email: 'eroni2519@gmail.com',
    name: 'Lifetime Member',
    password: 'lifetime123', // User should change this after migration
    role: 'USER',
    subscriptionType: 'LIFETIME',
  },
];

async function migrateUsers() {
  console.log('🚀 Starting user migration to database authentication...\n');

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const userData of usersToMigrate) {
    try {
      // Check if user already exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, userData.email))
        .limit(1);

      if (existingUser) {
        // Update existing user with password if they don't have one
        if (!existingUser.password) {
          const hashedPassword = await hashPassword(userData.password);
          const updateData: any = {
            password: hashedPassword,
            name: userData.name,
            role: userData.role,
            subscriptionType: userData.subscriptionType,
          };

          // For SQLite, we need to provide timestamp explicitly
          if (!isProduction) {
            updateData.updatedAt = new Date();
          } else {
            updateData.updatedAt = new Date();
          }

          await db
            .update(users)
            .set(updateData)
            .where(eq(users.id, existingUser.id));

          console.log(`✅ Updated existing user: ${userData.email} (added password)`);
          migrated++;
        } else {
          console.log(`⏭️  Skipped: ${userData.email} (already has password)`);
          skipped++;
        }
      } else {
        // Create new user
        const hashedPassword = await hashPassword(userData.password);
        const env = process.env.NODE_ENV ?? 'development';
        const userId = env === 'development' ? nanoid() : undefined; // Let PostgreSQL generate UUID if in production
        
        const now = new Date();
        const insertData: any = {
          id: userId, // Only set for SQLite, PostgreSQL will use default
          email: userData.email,
          name: userData.name,
          password: hashedPassword,
          role: userData.role,
          subscriptionType: userData.subscriptionType,
          subscriptionStatus: 'ACTIVE',
        };

        // For SQLite, we need to provide timestamps explicitly
        if (!isProduction) {
          insertData.createdAt = now;
          insertData.updatedAt = now;
        }

        await db.insert(users).values(insertData);

        console.log(`✅ Created new user: ${userData.email}`);
        migrated++;
      }
    } catch (error) {
      console.error(`❌ Error migrating ${userData.email}:`, error);
      errors++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Migrated/Updated: ${migrated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);

  if (migrated > 0) {
    console.log('\n⚠️  IMPORTANT: All migrated users should change their passwords!');
    console.log('   The default passwords are still set to the original hardcoded values.');
    console.log('   Users should use the password reset feature to set secure passwords.\n');
  }

  if (errors === 0) {
    console.log('✅ Migration completed successfully!\n');
  } else {
    console.log('⚠️  Migration completed with errors. Please review the output above.\n');
    process.exit(1);
  }
}

// Run migration
migrateUsers().catch((error) => {
  console.error('❌ Fatal error during migration:', error);
  process.exit(1);
});
