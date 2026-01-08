/**
 * Import Exam Questions Script
 * 
 * This script imports 465+ exam questions from content/exam-questions.js
 * into the database (Supabase PostgreSQL or Cloudflare D1 SQLite).
 * 
 * It creates:
 * 1. A "Professional Exams" track (if it doesn't exist)
 * 2. A lesson for each exam type
 * 3. A quiz for each exam
 * 4. All questions linked to their respective quizzes
 * 
 * Usage:
 *   npm run tsx scripts/import-exam-questions.ts
 * 
 * Database Support:
 *   - Supabase (PostgreSQL) via DATABASE_URL
 *   - Cloudflare D1 (SQLite) via local SQLite file
 */

import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema.js';
import { tracks as sqliteTracks, lessons as sqliteLessons, quizzes as sqliteQuizzes, questions as sqliteQuestions } from '../shared/schema-sqlite.js';
import { examQuestions } from '../content/exam-questions.js';
import { eq } from 'drizzle-orm';

// Map exam question keys to UI slugs and exam metadata
const examMetadata = {
  'ndt': {
    slug: 'ndt-inspection',
    title: 'NDT Inspection & Testing - Professional Exam',
    description: 'Comprehensive professional examination covering visual inspection, magnetic particle testing, ultrasonic testing, and documentation standards.',
    timeLimit: 120, // minutes
    passingScore: 80,
    maxAttempts: 3,
  },
  'dmt': {
    slug: 'diver-medic',
    title: 'Diver Medic Technician - Professional Exam',
    description: 'Advanced medical examination covering emergency medical response, ABCDE assessment, diving injury treatment, and life support protocols.',
    timeLimit: 90,
    passingScore: 85,
    maxAttempts: 3,
  },
  'commercial-supervisor': {
    slug: 'commercial-supervisor',
    title: 'Commercial Dive Supervisor - Professional Exam',
    description: 'Leadership and management examination covering dive operations management, safety protocols, risk assessment, and emergency response coordination.',
    timeLimit: 150,
    passingScore: 80,
    maxAttempts: 3,
  },
  'alst': {
    slug: 'alst',
    title: 'Assistant Life Support Technician - Professional Exam',
    description: 'Life support systems examination covering assistant life support operations, emergency response protocols, and life support system procedures.',
    timeLimit: 120,
    passingScore: 85,
    maxAttempts: 3,
  },
  'lst': {
    slug: 'lst',
    title: 'Life Support Technician (LST) - Professional Exam',
    description: 'Advanced life support examination covering life support system operations, gas management, emergency response procedures, and system maintenance.',
    timeLimit: 100,
    passingScore: 80,
    maxAttempts: 3,
  },
  'hyperbaric-operations': {
    slug: 'hyperbaric-operations',
    title: 'Hyperbaric Chamber Operations - Professional Exam',
    description: 'Hyperbaric operations examination covering treatment protocols, emergency procedures, patient monitoring, and chamber operations.',
    timeLimit: 90,
    passingScore: 85,
    maxAttempts: 3,
  },
  'underwater-welding': {
    slug: 'underwater-welding',
    title: 'Advanced Underwater Welding - Professional Exam',
    description: 'Professional underwater welding examination covering welding techniques, electrode selection, quality control, and safety procedures.',
    timeLimit: 100,
    passingScore: 80,
    maxAttempts: 3,
  },
};

// Check if using SQLite (Cloudflare D1) or PostgreSQL (Supabase)
function isSQLite(): boolean {
  return !process.env.DATABASE_URL || process.env.NODE_ENV === 'development';
}

async function importExamQuestions() {
  console.log('🚀 Starting exam questions import...');
  console.log(`📊 Database: ${isSQLite() ? 'SQLite (Cloudflare D1)' : 'PostgreSQL (Supabase)'}\n`);
  
  let totalImported = 0;
  let totalQuizzes = 0;

  try {
    // Step 1: Create or find "Professional Exams" track
    const examTrackSlug = 'professional-exams';
    const examTrackTitle = 'Professional Exams';
    
    let examTrack;
    const existingTracks = isSQLite()
      ? await db.select().from(sqliteTracks).where(eq(sqliteTracks.slug, examTrackSlug))
      : await db.select().from(tracks).where(eq(tracks.slug, examTrackSlug));

    if (existingTracks.length > 0) {
      examTrack = existingTracks[0];
      console.log(`✅ Found existing track: ${examTrackTitle}`);
    } else {
      console.log(`📁 Creating track: ${examTrackTitle}`);
      const [newTrack] = isSQLite()
        ? await db.insert(sqliteTracks).values({
            title: examTrackTitle,
            slug: examTrackSlug,
            summary: 'Professional certification examinations for commercial diving disciplines. Comprehensive question banks covering all major certification areas.',
            isPublished: true,
            difficulty: 'advanced',
          }).returning()
        : await db.insert(tracks).values({
            title: examTrackTitle,
            slug: examTrackSlug,
            summary: 'Professional certification examinations for commercial diving disciplines. Comprehensive question banks covering all major certification areas.',
            isPublished: true,
            difficulty: 'advanced',
          }).returning();
      examTrack = newTrack;
      console.log(`✅ Created track: ${examTrackTitle}`);
    }

    // Step 2: Process each exam type
    for (const [examKey, questionsArray] of Object.entries(examQuestions)) {
      const metadata = examMetadata[examKey as keyof typeof examMetadata];
      
      if (!metadata) {
        console.warn(`⚠️  No metadata found for exam key: ${examKey}, skipping...`);
        continue;
      }

      console.log(`\n📝 Processing ${examKey} exam...`);
      console.log(`   Questions: ${questionsArray.length}`);
      console.log(`   Slug: ${metadata.slug}`);

      // Step 3: Create or find lesson for this exam
      let examLesson;
      const existingLessons = isSQLite()
        ? await db.select().from(sqliteLessons)
            .where(eq(sqliteLessons.trackId, examTrack.id))
            .where(eq(sqliteLessons.title, metadata.title))
        : await db.select().from(lessons)
            .where(eq(lessons.trackId, examTrack.id))
            .where(eq(lessons.title, metadata.title));

      if (existingLessons.length > 0) {
        examLesson = existingLessons[0];
        console.log(`   ✅ Found existing lesson: ${metadata.title}`);
      } else {
        console.log(`   📄 Creating lesson: ${metadata.title}`);
        const [newLesson] = isSQLite()
          ? await db.insert(sqliteLessons).values({
              trackId: examTrack.id,
              title: metadata.title,
              content: metadata.description,
              order: totalQuizzes + 1,
              estimatedMinutes: metadata.timeLimit,
              isRequired: true,
            }).returning()
          : await db.insert(lessons).values({
              trackId: examTrack.id,
              title: metadata.title,
              content: metadata.description,
              order: totalQuizzes + 1,
              estimatedMinutes: metadata.timeLimit,
              isRequired: true,
            }).returning();
        examLesson = newLesson;
        console.log(`   ✅ Created lesson: ${metadata.title}`);
      }

      // Step 4: Create or find quiz for this exam
      let examQuiz;
      const existingQuizzes = isSQLite()
        ? await db.select().from(sqliteQuizzes)
            .where(eq(sqliteQuizzes.lessonId, examLesson.id))
            .where(eq(sqliteQuizzes.title, metadata.title))
        : await db.select().from(quizzes)
            .where(eq(quizzes.lessonId, examLesson.id))
            .where(eq(quizzes.title, metadata.title));

      if (existingQuizzes.length > 0) {
        examQuiz = existingQuizzes[0];
        console.log(`   ✅ Found existing quiz: ${metadata.title}`);
        
        // Delete existing questions for this quiz
        if (isSQLite()) {
          await db.delete(sqliteQuestions).where(eq(sqliteQuestions.quizId, examQuiz.id));
        } else {
          await db.delete(questions).where(eq(questions.quizId, examQuiz.id));
        }
        console.log(`   🗑️  Deleted existing questions`);
      } else {
        console.log(`   📋 Creating quiz: ${metadata.title}`);
        const [newQuiz] = isSQLite()
          ? await db.insert(sqliteQuizzes).values({
              lessonId: examLesson.id,
              title: metadata.title,
              timeLimit: metadata.timeLimit,
              passingScore: metadata.passingScore,
              maxAttempts: metadata.maxAttempts,
              examType: 'EXAM',
              showFeedback: true,
            }).returning()
          : await db.insert(quizzes).values({
              lessonId: examLesson.id,
              title: metadata.title,
              timeLimit: metadata.timeLimit,
              passingScore: metadata.passingScore,
              maxAttempts: metadata.maxAttempts,
              examType: 'EXAM',
              showFeedback: true,
            }).returning();
        examQuiz = newQuiz;
        console.log(`   ✅ Created quiz: ${metadata.title}`);
      }

      // Step 5: Prepare and insert questions
      const questionsToInsert = questionsArray.map((q, index) => {
        const questionData: any = {
          quizId: examQuiz.id,
          prompt: q.prompt,
          correctAnswer: q.correctAnswer || '',
          explanation: q.explanation || null,
          points: q.points || 1,
          order: q.order || index + 1,
        };

        // Handle options based on question type
        if (q.type === 'MULTIPLE_CHOICE' && q.options) {
          questionData.options = isSQLite() 
            ? JSON.stringify(q.options) 
            : q.options;
          questionData.type = 'MULTIPLE_CHOICE';
        } else if (q.type === 'TRUE_FALSE' && q.options) {
          questionData.options = isSQLite()
            ? JSON.stringify(q.options)
            : q.options;
          questionData.type = 'TRUE_FALSE';
        } else if (q.type === 'WRITTEN') {
          questionData.options = isSQLite()
            ? JSON.stringify([])
            : [];
          questionData.type = 'WRITTEN';
        } else {
          // Default to multiple choice if type not specified
          questionData.options = isSQLite()
            ? JSON.stringify(q.options || [])
            : (q.options || []);
          questionData.type = 'MULTIPLE_CHOICE';
        }

        return questionData;
      });

      // Insert questions in batches to avoid memory issues
      const batchSize = 50;
      for (let i = 0; i < questionsToInsert.length; i += batchSize) {
        const batch = questionsToInsert.slice(i, i + batchSize);
        if (isSQLite()) {
          await db.insert(sqliteQuestions).values(batch);
        } else {
          await db.insert(questions).values(batch);
        }
      }

      console.log(`   ✅ Imported ${questionsToInsert.length} questions`);
      totalImported += questionsToInsert.length;
      totalQuizzes++;
    }

    console.log('\n🎉 Import completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Track: ${examTrackTitle}`);
    console.log(`   - Quizzes processed: ${totalQuizzes}`);
    console.log(`   - Total questions imported: ${totalImported}`);
    console.log(`   - Database: ${isSQLite() ? 'SQLite (Cloudflare D1)' : 'PostgreSQL (Supabase)'}`);

  } catch (error) {
    console.error('❌ Error importing exam questions:', error);
    throw error;
  }
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
  importExamQuestions()
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    })
    .finally(() => {
      process.exit(0);
    });
}

export { importExamQuestions };

