/**
 * Verification Script for Client Representative Course Completeness
 * 
 * This script verifies that all 52 modules, questions, and scenarios
 * have been imported correctly into the database.
 */

import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

interface VerificationResults {
  trackExists: boolean;
  expectedModules: number;
  actualLessons: number;
  actualQuizzes: number;
  actualQuestions: number;
  actualScenarios: number;
  mcqCount: number;
  shortAnswerCount: number;
  trueFalseCount: number;
  issues: string[];
}

async function verifyClientRepCompleteness() {
  console.log('🔍 Verifying Client Representative Course Completeness...\n');

  const results: VerificationResults = {
    trackExists: false,
    expectedModules: 52,
    actualLessons: 0,
    actualQuizzes: 0,
    actualQuestions: 0,
    actualScenarios: 0,
    mcqCount: 0,
    shortAnswerCount: 0,
    trueFalseCount: 0,
    issues: []
  };

  try {
    // Check if track exists
    const track = await db.select()
      .from(tracks)
      .where(eq(tracks.slug, 'client-representative'))
      .limit(1);

    if (track.length === 0) {
      results.issues.push('Client Representative track not found in database');
      console.log('❌ Track not found');
      printResults(results);
      return;
    }

    results.trackExists = true;
    const trackId = track[0].id;
    console.log(`✅ Track found: ${track[0].title} (${trackId})\n`);

    // Count lessons
    const dbLessons = await db.select()
      .from(lessons)
      .where(eq(lessons.trackId, trackId));
    
    results.actualLessons = dbLessons.length;
    console.log(`📚 Lessons: ${results.actualLessons} (expected: ${results.expectedModules})`);

    if (results.actualLessons < results.expectedModules) {
      results.issues.push(`Missing ${results.expectedModules - results.actualLessons} lessons`);
    }

    // Count quizzes
    const dbQuizzes = await db.select()
      .from(quizzes)
      .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
      .where(eq(lessons.trackId, trackId));
    
    results.actualQuizzes = dbQuizzes.length;
    console.log(`📝 Quizzes: ${results.actualQuizzes}`);

    // Count questions by type
    const dbQuestions = await db.select()
      .from(questions)
      .innerJoin(quizzes, eq(questions.quizId, quizzes.id))
      .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
      .where(eq(lessons.trackId, trackId));

    results.actualQuestions = dbQuestions.length;
    
    // SQLite schema doesn't have type field - determine type from options/correctAnswer
    for (const q of dbQuestions) {
      const question = q.questions;
      const optionsStr = question.options;
      let options: any[] = [];
      try {
        options = JSON.parse(optionsStr);
      } catch (e) {
        // Not JSON, treat as string
      }
      
      const correctAnswer = question.correctAnswer?.toLowerCase() || '';
      
      // Determine type based on options and answer
      if (options.length === 0 || (options.length === 1 && options[0].length > 100)) {
        // Likely short answer (no options or long model points)
        results.shortAnswerCount++;
      } else if (options.length === 2 && (options[0] === 'True' || options[0] === 'False')) {
        results.trueFalseCount++;
      } else if (options.length >= 2) {
        // Multiple choice
        results.mcqCount++;
      } else {
        // Default to MCQ
        results.mcqCount++;
      }
    }

    console.log(`❓ Questions: ${results.actualQuestions} total`);
    console.log(`   - MCQs: ${results.mcqCount}`);
    console.log(`   - Short Answer: ${results.shortAnswerCount}`);
    console.log(`   - True/False: ${results.trueFalseCount}`);

    if (results.mcqCount < 300) {
      results.issues.push(`Expected 300+ MCQs, found ${results.mcqCount}`);
    }

    // Count scenarios
    // Note: practiceScenarios table may not exist in SQLite schema
    const dbScenarios: any[] = [];
    try {
      // Try to query if table exists
      const scenarioResult = await db.execute(`SELECT COUNT(*) as count FROM practice_scenarios WHERE EXISTS (SELECT 1 FROM lessons WHERE lessons.id = practice_scenarios.lesson_id AND lessons.track_id = ?)`, [trackId]);
      if (scenarioResult && Array.isArray(scenarioResult) && scenarioResult[0]) {
        results.actualScenarios = scenarioResult[0].count || 0;
      }
    } catch (e) {
      // Table doesn't exist - scenarios not available
      results.actualScenarios = 0;
    }
    console.log(`🎭 Scenarios: ${results.actualScenarios} (expected: 22+)`);

    if (results.actualScenarios < 22) {
      results.issues.push(`Expected 22+ scenarios, found ${results.actualScenarios}`);
    }

    // Check for lessons without quizzes
    const lessonsWithoutQuizzes = await db.select()
      .from(lessons)
      .leftJoin(quizzes, eq(lessons.id, quizzes.lessonId))
      .where(eq(lessons.trackId, trackId))
      .where(eq(quizzes.id, null as any));

    if (lessonsWithoutQuizzes.length > 0) {
      results.issues.push(`${lessonsWithoutQuizzes.length} lessons without quizzes`);
      console.log(`\n⚠️  Lessons without quizzes:`);
      for (const l of lessonsWithoutQuizzes) {
        if (l.lessons) {
          console.log(`   - ${l.lessons.title}`);
        }
      }
    }

    // Check for quizzes without questions
    const quizzesWithoutQuestions = await db.select()
      .from(quizzes)
      .leftJoin(questions, eq(quizzes.id, questions.quizId))
      .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
      .where(eq(lessons.trackId, trackId))
      .where(eq(questions.id, null as any));

    if (quizzesWithoutQuestions.length > 0) {
      results.issues.push(`${quizzesWithoutQuestions.length} quizzes without questions`);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    printResults(results);

  } catch (error: any) {
    console.error('\n❌ Error during verification:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

function printResults(results: VerificationResults) {
  console.log('\n📊 Verification Summary:');
  console.log('='.repeat(60));
  console.log(`Track exists: ${results.trackExists ? '✅' : '❌'}`);
  console.log(`Lessons: ${results.actualLessons}/${results.expectedModules} ${results.actualLessons >= results.expectedModules ? '✅' : '⚠️'}`);
  console.log(`Quizzes: ${results.actualQuizzes} ${results.actualQuizzes >= results.expectedModules ? '✅' : '⚠️'}`);
  console.log(`Total Questions: ${results.actualQuestions} ${results.actualQuestions >= 300 ? '✅' : '⚠️'}`);
  console.log(`   - MCQs: ${results.mcqCount} ${results.mcqCount >= 300 ? '✅' : '⚠️'}`);
  console.log(`   - Short Answer: ${results.shortAnswerCount} ${results.shortAnswerCount >= 10 ? '✅' : '⚠️'}`);
  console.log(`   - True/False: ${results.trueFalseCount}`);
  console.log(`Scenarios: ${results.actualScenarios} ${results.actualScenarios >= 22 ? '✅' : '⚠️'}`);

  if (results.issues.length > 0) {
    console.log('\n⚠️  Issues Found:');
    results.issues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('\n✅ All checks passed! Course content is complete.');
  }
}

// Run verification
verifyClientRepCompleteness()
  .then(() => {
    console.log('\n✨ Verification completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
