/**
 * Production Database Backup Script
 * 
 * This script creates a comprehensive backup of all critical data from the production database.
 * It works with both PostgreSQL (production) and SQLite (development).
 * 
 * Usage:
 *   # For production (requires DATABASE_URL)
 *   DATABASE_URL="postgresql://..." NODE_ENV=production pnpm tsx scripts/backup-production-database.ts
 * 
 *   # For development (uses local SQLite)
 *   pnpm tsx scripts/backup-production-database.ts
 */

import { db } from '../server/db.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { eq } from 'drizzle-orm';

// Import schemas based on environment
const isProduction = process.env.NODE_ENV === 'production' && process.env.DATABASE_URL;
const schema = isProduction 
  ? await import('../shared/schema.js')
  : await import('../shared/schema-sqlite.js');

const { tracks, lessons, quizzes, questions, users, userProgress, attempts, invites } = schema;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BackupData {
  exportedAt: string;
  version: string;
  environment: string;
  databaseType: string;
  tracks: any[];
  users: any[];
  userProgress: any[];
  attempts: any[];
  invites: any[];
  statistics: {
    totalTracks: number;
    totalLessons: number;
    totalUsers: number;
    totalProgress: number;
    totalAttempts: number;
    totalInvites: number;
  };
}

async function backupProductionDatabase() {
  console.log('📦 Starting comprehensive database backup...');
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Database: ${isProduction ? 'PostgreSQL (Production)' : 'SQLite (Development)'}`);
  
  if (isProduction && !process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL is required for production backup');
  }

  try {
    const backupData: BackupData = {
      exportedAt: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      databaseType: isProduction ? 'postgresql' : 'sqlite',
      tracks: [],
      users: [],
      userProgress: [],
      attempts: [],
      invites: [],
      statistics: {
        totalTracks: 0,
        totalLessons: 0,
        totalUsers: 0,
        totalProgress: 0,
        totalAttempts: 0,
        totalInvites: 0,
      }
    };

    // Backup Tracks and Lessons
    console.log('\n📚 Backing up tracks and lessons...');
    const allTracks = await db.select().from(tracks).orderBy(tracks.title);
    console.log(`   Found ${allTracks.length} tracks`);

    for (const track of allTracks) {
      const trackLessons = await db
        .select()
        .from(lessons)
        .where(eq(lessons.trackId, track.id))
        .orderBy(lessons.order);

      // Get quizzes and questions for each lesson
      const trackWithLessons: any = {
        ...track,
        lessons: await Promise.all(
          trackLessons.map(async (lesson) => {
            const lessonQuizzes = await db
              .select()
              .from(quizzes)
              .where(eq(quizzes.lessonId, lesson.id));

            const quizzesWithQuestions = await Promise.all(
              lessonQuizzes.map(async (quiz) => {
                const quizQuestions = await db
                  .select()
                  .from(questions)
                  .where(eq(questions.quizId, quiz.id))
                  .orderBy(questions.order);

                return {
                  ...quiz,
                  questions: quizQuestions,
                };
              })
            );

            return {
              ...lesson,
              quizzes: quizzesWithQuestions,
            };
          })
        ),
      };

      backupData.tracks.push(trackWithLessons);
      backupData.statistics.totalLessons += trackLessons.length;
    }
    backupData.statistics.totalTracks = allTracks.length;

    // Backup Users (excluding sensitive password hashes in backup)
    console.log('\n👥 Backing up users...');
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      subscriptionType: users.subscriptionType,
      subscriptionStatus: users.subscriptionStatus,
      trialExpiresAt: users.trialExpiresAt,
      stripeCustomerId: users.stripeCustomerId,
      affiliateCode: users.affiliateCode,
      referredBy: users.referredBy,
      commissionRate: users.commissionRate,
      totalEarnings: users.totalEarnings,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
      // Note: password hashes are NOT backed up for security
    }).from(users);
    backupData.users = allUsers;
    backupData.statistics.totalUsers = allUsers.length;
    console.log(`   Found ${allUsers.length} users (passwords excluded for security)`);

    // Backup User Progress
    console.log('\n📊 Backing up user progress...');
    const allProgress = await db.select().from(userProgress);
    backupData.userProgress = allProgress;
    backupData.statistics.totalProgress = allProgress.length;
    console.log(`   Found ${allProgress.length} progress records`);

    // Backup Attempts
    console.log('\n📝 Backing up quiz/exam attempts...');
    const allAttempts = await db.select().from(attempts);
    backupData.attempts = allAttempts;
    backupData.statistics.totalAttempts = allAttempts.length;
    console.log(`   Found ${allAttempts.length} attempts`);

    // Backup Invites
    console.log('\n✉️  Backing up invites...');
    const allInvites = await db.select().from(invites);
    backupData.invites = allInvites;
    backupData.statistics.totalInvites = allInvites.length;
    console.log(`   Found ${allInvites.length} invites`);

    // Create backup directory
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Save timestamped backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const timeStr = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const filename = `full-database-backup-${timestamp}-${timeStr.split('T')[1]}.json`;
    const filepath = path.join(backupDir, filename);

    // Also save as latest backup
    const latestFilepath = path.join(backupDir, 'full-database-latest.json');

    // Write backup files
    const backupJson = JSON.stringify(backupData, null, 2);
    fs.writeFileSync(filepath, backupJson, 'utf-8');
    fs.writeFileSync(latestFilepath, backupJson, 'utf-8');

    console.log('\n✅ Backup complete!');
    console.log(`   📁 Timestamped backup: ${filepath}`);
    console.log(`   📁 Latest backup: ${latestFilepath}`);
    console.log('\n📊 Backup Statistics:');
    console.log(`   Tracks: ${backupData.statistics.totalTracks}`);
    console.log(`   Lessons: ${backupData.statistics.totalLessons}`);
    console.log(`   Users: ${backupData.statistics.totalUsers}`);
    console.log(`   Progress Records: ${backupData.statistics.totalProgress}`);
    console.log(`   Attempts: ${backupData.statistics.totalAttempts}`);
    console.log(`   Invites: ${backupData.statistics.totalInvites}`);
    console.log(`   Backup Size: ${(backupJson.length / 1024).toFixed(2)} KB`);

    return backupData;
  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  }
}

// Run if called directly
const isMainModule = process.argv[1] && import.meta.url.includes(process.argv[1].replace(/\\/g, '/'));
if (isMainModule || process.argv[1]?.includes('backup-production-database')) {
  backupProductionDatabase()
    .then(() => {
      console.log('\n🎉 Backup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Backup failed:', error);
      process.exit(1);
    });
}

export { backupProductionDatabase };





