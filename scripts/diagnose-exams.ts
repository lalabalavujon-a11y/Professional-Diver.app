import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema-sqlite.js';
import { eq, sql } from 'drizzle-orm';

/**
 * Diagnostic script to verify exam questions for all tracks
 * Focuses on Client Representative exam readiness
 */

async function diagnoseExams() {
  console.log('🔍 Diagnosing Exam Questions...\n');

  try {
    // Get all published tracks
    const allTracks = await db.select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
      isPublished: tracks.isPublished,
    })
      .from(tracks)
      .where(eq(tracks.isPublished, true))
      .orderBy(tracks.title);

    console.log(`📊 Analyzing ${allTracks.length} published tracks for exam readiness\n`);

    const examReadiness: Array<{
      track: typeof allTracks[0];
      lessonCount: number;
      quizCount: number;
      questionCount: number;
      questionsPerQuiz: number;
      readyForExam: boolean;
      issues: string[];
    }> = [];

    for (const track of allTracks) {
      // Get lessons for this track
      const trackLessons = await db.select({
        id: lessons.id,
        title: lessons.title,
      })
        .from(lessons)
        .where(eq(lessons.trackId, track.id));

      // Get quizzes for this track
      const trackQuizzes = await db.select({
        id: quizzes.id,
        lessonId: quizzes.lessonId,
        title: quizzes.title,
      })
        .from(quizzes)
        .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
        .where(eq(lessons.trackId, track.id));

      // Get all questions for this track
      const trackQuestions = await db.select({
        id: questions.id,
        quizId: questions.quizId,
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

      const lessonCount = trackLessons.length;
      const quizCount = trackQuizzes.length;
      const questionCount = trackQuestions.length;
      const questionsPerQuiz = quizCount > 0 ? Math.round(questionCount / quizCount) : 0;

      const issues: string[] = [];
      let readyForExam = true;

      // Check for issues
      if (lessonCount === 0) {
        issues.push('No lessons found');
        readyForExam = false;
      }
      if (quizCount === 0) {
        issues.push('No quizzes found');
        readyForExam = false;
      }
      if (questionCount === 0) {
        issues.push('No questions found');
        readyForExam = false;
      }
      if (quizCount > 0 && questionCount === 0) {
        issues.push('Quizzes exist but have no questions');
        readyForExam = false;
      }

      // Check question structure
      const invalidQuestions = trackQuestions.filter(q => {
        if (!q.prompt || q.prompt.trim() === '') return true;
        if (!q.options) return true;
        if (!q.correctAnswer) return true;
        try {
          const options = JSON.parse(q.options);
          if (!Array.isArray(options) || options.length === 0) return true;
        } catch {
          return true; // Invalid JSON
        }
        return false;
      });

      if (invalidQuestions.length > 0) {
        issues.push(`${invalidQuestions.length} question(s) have invalid structure`);
        readyForExam = false;
      }

      examReadiness.push({
        track,
        lessonCount,
        quizCount,
        questionCount,
        questionsPerQuiz,
        readyForExam,
        issues,
      });
    }

    // Display results
    console.log('📚 EXAM READINESS REPORT:\n');

    examReadiness.forEach((status, index) => {
      const statusIcon = status.readyForExam ? '✅' : '❌';
      console.log(`${index + 1}. ${statusIcon} ${status.track.title}`);
      console.log(`   Slug: ${status.track.slug}`);
      console.log(`   Lessons: ${status.lessonCount}`);
      console.log(`   Quizzes: ${status.quizCount}`);
      console.log(`   Questions: ${status.questionCount}`);
      if (status.quizCount > 0) {
        console.log(`   Avg Questions per Quiz: ${status.questionsPerQuiz}`);
      }
      
      if (status.issues.length > 0) {
        console.log(`   ⚠️  Issues:`);
        status.issues.forEach(issue => {
          console.log(`      - ${issue}`);
        });
      } else {
        console.log(`   ✅ Ready for exams!`);
      }
      console.log('');
    });

    // Focus on Client Representative
    const clientRep = examReadiness.find(s => 
      s.track.slug === 'client-representative' ||
      s.track.title.toLowerCase().includes('client representative')
    );

    if (clientRep) {
      console.log('🎯 CLIENT REPRESENTATIVE EXAM STATUS:');
      console.log(`   Title: ${clientRep.track.title}`);
      console.log(`   Slug: ${clientRep.track.slug}`);
      console.log(`   Lessons: ${clientRep.lessonCount} (expected: 6)`);
      console.log(`   Quizzes: ${clientRep.quizCount} (expected: 6)`);
      console.log(`   Questions: ${clientRep.questionCount} (expected: 60)`);
      console.log(`   Questions per Quiz: ${clientRep.questionsPerQuiz} (expected: 10)`);
      
      if (clientRep.readyForExam) {
        console.log(`   ✅ Ready for Full Exam (${clientRep.questionCount} questions)`);
        console.log(`   ✅ Ready for SRS Exam (15 questions from pool of ${clientRep.questionCount})`);
      } else {
        console.log(`   ❌ NOT ready for exams`);
        console.log(`   Issues:`);
        clientRep.issues.forEach(issue => {
          console.log(`      - ${issue}`);
        });
      }
      console.log('');
    } else {
      console.log('⚠️  CLIENT REPRESENTATIVE NOT FOUND!\n');
    }

    // Summary
    const readyTracks = examReadiness.filter(s => s.readyForExam).length;
    const notReadyTracks = examReadiness.filter(s => !s.readyForExam).length;
    const totalQuestions = examReadiness.reduce((sum, s) => sum + s.questionCount, 0);

    console.log('📈 SUMMARY:');
    console.log(`   Total Tracks: ${examReadiness.length}`);
    console.log(`   Ready for Exams: ${readyTracks}`);
    console.log(`   Not Ready: ${notReadyTracks}`);
    console.log(`   Total Questions: ${totalQuestions}`);
    
    if (clientRep && clientRep.readyForExam) {
      console.log(`   ✅ Client Representative is ready for exams!`);
    } else if (clientRep) {
      console.log(`   ⚠️  Client Representative needs fixes before exams can work`);
    }

    console.log('\n✨ Diagnosis complete!');

  } catch (error: any) {
    console.error('\n❌ Error diagnosing exams:', error);
    if (error.message) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

// Run the diagnosis
diagnoseExams()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
