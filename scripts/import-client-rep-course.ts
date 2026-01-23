import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Import Client Representative Content
 * 
 * This script imports brand-neutral Client Representative content
 * from the Downloads folder into the Professional Diver Training app.
 * 
 * Content includes:
 * - 1 track: Client Representative
 * - 6 lessons (modules)
 * - 6 quizzes (assessments)
 * - 60 questions (10 per module)
 */

interface CourseModule {
  id: string;
  title: string;
  outcomes: string[];
  lessons: Array<{
    id: string;
    title: string;
    summary: string;
  }>;
  assessments: Array<{
    id: string;
    title: string;
    items: Array<{
      id: string;
      type: string;
      stem: string;
      options: string[];
      answer_index: number;
      rationale: string;
      tags: string[];
      difficulty: string;
    }>;
  }>;
}

interface CourseData {
  schema_version: string;
  modules: CourseModule[];
}

/**
 * Convert answer index to letter-based answer (0 -> "a", 1 -> "b", etc.)
 * For True/False questions, return "True" or "False"
 */
function convertAnswerIndex(answerIndex: number, options: string[]): string {
  // Handle True/False questions
  if (options.length === 2 && (options[0] === 'True' || options[0] === 'False')) {
    return options[answerIndex];
  }
  
  // Handle multiple choice questions
  const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
  if (answerIndex >= 0 && answerIndex < letters.length) {
    return letters[answerIndex];
  }
  
  throw new Error(`Invalid answer index: ${answerIndex} for ${options.length} options`);
}

/**
 * Format lesson content from module data
 */
function formatLessonContent(module: CourseModule): string {
  const lesson = module.lessons[0];
  let content = `# ${module.title}\n\n`;
  
  if (lesson.summary) {
    content += `${lesson.summary}\n\n`;
  }
  
  if (module.outcomes && module.outcomes.length > 0) {
    content += `## Learning Outcomes\n\n`;
    module.outcomes.forEach((outcome, index) => {
      content += `${index + 1}. ${outcome}\n`;
    });
    content += `\n`;
  }
  
  content += `## Course Content\n\n`;
  content += `This module covers essential knowledge and skills for Client Representatives `;
  content += `working in offshore and marine operations. Complete the assessment to demonstrate `;
  content += `your understanding of the key concepts.\n`;
  
  return content;
}

async function importClientRepCourse() {
    console.log('📚 Starting Client Representative import...\n');

  try {
    // Read the JSON file from Downloads
    const jsonPath = join(homedir(), 'Downloads', 'cr_course_brand_neutral_export', 'cr_course_sample.json');
    console.log(`📖 Reading course data from: ${jsonPath}`);
    
    const fileContent = readFileSync(jsonPath, 'utf-8');
    const courseData: CourseData = JSON.parse(fileContent);
    
    if (!courseData.modules || courseData.modules.length === 0) {
      throw new Error('No modules found in course data');
    }
    
    console.log(`✅ Found ${courseData.modules.length} modules to import\n`);

    // Check if Client Rep track already exists
    const existingTrack = await db.select({ id: tracks.id })
      .from(tracks)
      .where(eq(tracks.slug, 'client-representative'))
      .limit(1);

    let trackId: string;
    
    if (existingTrack.length > 0) {
      trackId = existingTrack[0].id;
      console.log(`ℹ️  Client Representative track already exists: ${trackId}`);
      console.log(`   Updating existing track...\n`);
      
      // Update the track
      await db.update(tracks)
        .set({
          title: 'Client Representative',
          summary: 'Comprehensive brand-neutral training for Client Representatives covering lifting operations, hazardous substances control, confined spaces, daily progress reporting, SIMOPS matrices, and ISM code interface.',
          difficulty: 'intermediate',
          isPublished: true,
        })
        .where(eq(tracks.id, trackId));
      
      // Delete existing lessons (cascade will delete quizzes and questions)
      await db.delete(lessons).where(eq(lessons.trackId, trackId));
      console.log('🧹 Cleared existing lessons for Client Representative track\n');
    } else {
      // Create the Client Representative track
      const [newTrack] = await db.insert(tracks).values({
        title: 'Client Representative Course',
        slug: 'client-representative',
        summary: 'Comprehensive brand-neutral training for Client Representatives covering lifting operations, hazardous substances control, confined spaces, daily progress reporting, SIMOPS matrices, and ISM code interface.',
        difficulty: 'intermediate',
        isPublished: true,
      }).returning();
      
      trackId = newTrack.id;
      console.log(`✅ Created Client Representative track: ${trackId}\n`);
    }

    let totalLessons = 0;
    let totalQuizzes = 0;
    let totalQuestions = 0;

    // Process each module
    for (let i = 0; i < courseData.modules.length; i++) {
      const module = courseData.modules[i];
      console.log(`📦 Processing Module ${i + 1}/${courseData.modules.length}: ${module.title}`);

      // Validate module structure
      if (!module.lessons || module.lessons.length === 0) {
        console.warn(`⚠️  Module ${module.id} has no lessons, skipping...`);
        continue;
      }

      if (!module.assessments || module.assessments.length === 0) {
        console.warn(`⚠️  Module ${module.id} has no assessments, skipping...`);
        continue;
      }

      const lessonData = module.lessons[0];
      const assessment = module.assessments[0];

      // Create lesson
      const lessonContent = formatLessonContent(module);
      const [insertedLesson] = await db.insert(lessons).values({
        trackId: trackId,
        title: module.title,
        order: i + 1,
        content: lessonContent,
        objectives: JSON.stringify(module.outcomes || []),
        estimatedMinutes: 60,
        isRequired: true,
      }).returning();

      console.log(`  ✅ Created lesson: ${module.title}`);
      totalLessons++;

      // Create quiz for the lesson
      const [insertedQuiz] = await db.insert(quizzes).values({
        lessonId: insertedLesson.id,
        title: assessment.title,
        timeLimit: 30,
        examType: 'EXAM',
        passingScore: 70,
      }).returning();

      console.log(`  ✅ Created quiz: ${assessment.title}`);
      totalQuizzes++;

      // Create questions for the quiz
      if (!assessment.items || assessment.items.length === 0) {
        console.warn(`  ⚠️  Assessment ${assessment.id} has no items, skipping questions...`);
        continue;
      }

      for (let j = 0; j < assessment.items.length; j++) {
        const item = assessment.items[j];
        
        // Validate question structure
        if (!item.stem || !item.options || item.options.length === 0) {
          console.warn(`  ⚠️  Question ${j + 1} in ${module.title} is invalid, skipping...`);
          continue;
        }

        if (item.answer_index < 0 || item.answer_index >= item.options.length) {
          console.warn(`  ⚠️  Question ${j + 1} in ${module.title} has invalid answer_index, skipping...`);
          continue;
        }

        // Convert answer index to correct answer format
        const correctAnswer = convertAnswerIndex(item.answer_index, item.options);
        
        // Store options as JSON string
        const optionsJson = JSON.stringify(item.options);

        await db.insert(questions).values({
          quizId: insertedQuiz.id,
          prompt: item.stem,
          options: optionsJson,
          correctAnswer: correctAnswer,
          order: j + 1,
        });

        totalQuestions++;
      }

      console.log(`  ✅ Added ${assessment.items.length} questions\n`);
    }

    // Verification
    console.log('\n📊 Import Summary:');
    console.log(`   Track: 1 (Client Representative)`);
    console.log(`   Lessons: ${totalLessons}`);
    console.log(`   Quizzes: ${totalQuizzes}`);
    console.log(`   Questions: ${totalQuestions}`);

    // Verify data in database
    const lessonCount = await db.select().from(lessons).where(eq(lessons.trackId, trackId));
    const quizCount = await db.select()
      .from(quizzes)
      .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
      .where(eq(lessons.trackId, trackId));
    const questionCount = await db.select()
      .from(questions)
      .innerJoin(quizzes, eq(questions.quizId, quizzes.id))
      .innerJoin(lessons, eq(quizzes.lessonId, lessons.id))
      .where(eq(lessons.trackId, trackId));

    console.log('\n✅ Verification:');
    console.log(`   Lessons in database: ${lessonCount.length}`);
    console.log(`   Quizzes in database: ${quizCount.length}`);
    console.log(`   Questions in database: ${questionCount.length}`);

    if (lessonCount.length === totalLessons && 
        quizCount.length === totalQuizzes && 
        questionCount.length === totalQuestions) {
      console.log('\n🎉 Successfully imported all Client Representative course content!');
    } else {
      console.warn('\n⚠️  Import completed but verification shows discrepancies.');
      console.warn('   Please review the data manually.');
    }

  } catch (error: any) {
    console.error('\n❌ Error importing Client Representative content:', error);
    if (error.code === 'ENOENT') {
      console.error(`   File not found. Please ensure the course JSON file exists at:`);
      console.error(`   ~/Downloads/cr_course_brand_neutral_export/cr_course_sample.json`);
    }
    process.exit(1);
  }
}

// Run the import
importClientRepCourse()
  .then(() => {
    console.log('\n✨ Import process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
