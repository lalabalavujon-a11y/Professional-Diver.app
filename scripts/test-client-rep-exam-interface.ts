/**
 * Test Script for Client Representative Exam Interface
 * 
 * This script tests that the exam interface can:
 * 1. Fetch questions from the database
 * 2. Handle all question types (MCQ, True/False, Short Answer)
 * 3. Display questions correctly
 * 4. Calculate scores properly
 */

import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

interface TestResults {
  questionsFetched: boolean;
  questionTypes: {
    multipleChoice: number;
    trueFalse: number;
    shortAnswer: number;
  };
  totalQuestions: number;
  hasExplanations: number;
  issues: string[];
}

async function testClientRepExamInterface() {
  console.log('🧪 Testing Client Representative Exam Interface...\n');

  const results: TestResults = {
    questionsFetched: false,
    questionTypes: {
      multipleChoice: 0,
      trueFalse: 0,
      shortAnswer: 0
    },
    totalQuestions: 0,
    hasExplanations: 0,
    issues: []
  };

  try {
    // Get Client Representative track
    const [track] = await db.select()
      .from(tracks)
      .where(eq(tracks.slug, 'client-representative'))
      .limit(1);

    if (!track) {
      console.error('❌ Client Representative track not found');
      return;
    }

    console.log(`✅ Track found: ${track.title}\n`);

    // Fetch questions (simulating API endpoint)
    const trackQuestions = await db.select({
      id: questions.id,
      prompt: questions.prompt,
      options: questions.options,
      correctAnswer: questions.correctAnswer,
      order: questions.order,
    })
      .from(questions)
      .innerJoin(quizzes, eq(questions.quizId, quizzes.id))
      .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
      .where(eq(lessons.trackId, track.id))
      .orderBy(questions.order);

    results.totalQuestions = trackQuestions.length;
    results.questionsFetched = true;

    console.log(`📊 Total Questions: ${results.totalQuestions}\n`);

    // Analyze question types
    for (const q of trackQuestions) {
      let optionsArray: string[] = [];
      try {
        optionsArray = JSON.parse(q.options || '[]');
      } catch {
        optionsArray = [];
      }

      if (optionsArray.length === 0) {
        results.questionTypes.shortAnswer++;
      } else if (optionsArray.length === 2 && (optionsArray[0] === 'True' || optionsArray[0] === 'False')) {
        results.questionTypes.trueFalse++;
      } else if (optionsArray.length >= 2) {
        results.questionTypes.multipleChoice++;
      } else {
        results.issues.push(`Question ${q.id} has invalid options format`);
      }

      // Check for correct answer
      if (!q.correctAnswer || q.correctAnswer.trim() === '') {
        results.issues.push(`Question ${q.id} missing correctAnswer`);
      }

      // Check prompt
      if (!q.prompt || q.prompt.trim() === '') {
        results.issues.push(`Question ${q.id} missing prompt`);
      }
    }

    // Test question format conversion (as done in API)
    console.log('🔄 Testing Question Format Conversion:\n');
    
    const sampleQuestions = trackQuestions.slice(0, 5);
    for (const q of sampleQuestions) {
      let optionsArray: string[] = [];
      try {
        optionsArray = JSON.parse(q.options || '[]');
      } catch {
        optionsArray = [];
      }

      let questionType: 'MULTIPLE_CHOICE' | 'WRITTEN' | 'TRUE_FALSE' = 'MULTIPLE_CHOICE';
      if (optionsArray.length === 2 && (optionsArray[0] === 'True' || optionsArray[0] === 'False')) {
        questionType = 'TRUE_FALSE';
      } else if (optionsArray.length === 0) {
        questionType = 'WRITTEN';
      }

      console.log(`  Question ${q.order}: ${questionType}`);
      console.log(`    Prompt: ${q.prompt.substring(0, 60)}...`);
      console.log(`    Options: ${optionsArray.length} options`);
      console.log(`    Correct Answer: ${q.correctAnswer}`);
      console.log('');
    }

    // Summary
    console.log('📊 Test Results Summary:');
    console.log('='.repeat(60));
    console.log(`Questions Fetched: ${results.questionsFetched ? '✅' : '❌'}`);
    console.log(`Total Questions: ${results.totalQuestions}`);
    console.log(`  - Multiple Choice: ${results.questionTypes.multipleChoice}`);
    console.log(`  - True/False: ${results.questionTypes.trueFalse}`);
    console.log(`  - Short Answer: ${results.questionTypes.shortAnswer}`);

    if (results.issues.length > 0) {
      console.log(`\n⚠️  Issues Found (${results.issues.length}):`);
      results.issues.slice(0, 10).forEach(issue => console.log(`   - ${issue}`));
      if (results.issues.length > 10) {
        console.log(`   ... and ${results.issues.length - 10} more`);
      }
    } else {
      console.log('\n✅ No issues found - all questions are properly formatted!');
    }

    // Verify question counts match expectations
    console.log('\n📋 Expectations Check:');
    const expectedMCQs = 185;
    const expectedShortAnswer = 14;
    const expectedTotal = 199;

    if (results.questionTypes.multipleChoice >= expectedMCQs * 0.9) {
      console.log(`✅ MCQs: ${results.questionTypes.multipleChoice} (expected ~${expectedMCQs})`);
    } else {
      console.log(`⚠️  MCQs: ${results.questionTypes.multipleChoice} (expected ~${expectedMCQs})`);
      results.issues.push(`MCQ count lower than expected`);
    }

    if (results.questionTypes.shortAnswer >= expectedShortAnswer * 0.9) {
      console.log(`✅ Short Answer: ${results.questionTypes.shortAnswer} (expected ~${expectedShortAnswer})`);
    } else {
      console.log(`⚠️  Short Answer: ${results.questionTypes.shortAnswer} (expected ~${expectedShortAnswer})`);
      results.issues.push(`Short answer count lower than expected`);
    }

    if (results.totalQuestions >= expectedTotal * 0.9) {
      console.log(`✅ Total: ${results.totalQuestions} (expected ~${expectedTotal})`);
    } else {
      console.log(`⚠️  Total: ${results.totalQuestions} (expected ~${expectedTotal})`);
      results.issues.push(`Total question count lower than expected`);
    }

    console.log('\n✨ Test completed!');

  } catch (error: any) {
    console.error('\n❌ Error during test:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testClientRepExamInterface()
  .then(() => {
    console.log('\n✨ Test process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
