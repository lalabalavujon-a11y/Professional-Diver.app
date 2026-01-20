// Update all AI Tutor names in database content to "Diver Well"
import { db } from '../server/db.js';
import { lessons, quizzes, questions } from '@shared/schema-sqlite';
import { sql, eq } from 'drizzle-orm';

// List of AI Tutor names to replace
const AI_TUTOR_NAMES = [
  'David',
  'Captain James Mitchell',
  'Commander David Thompson',
  'Lisa',
  'Lisa Thompson',
  'Master Welder Carlos Mendez',
  'Dr. Michael Rodriguez',
  'Dr. Patricia Walsh',
  'Michael',
  'Commander David Park',
  'Marcus',
  'Dr. Sarah Chen',
  'Maria',
  'Senior Technician Maria Santos',
  'Alex',
  'Chief Technician Robert Kim',
  'David Kim',
  'Mike',
  'Rebecca Foster',
  'Commander Robert Hayes'
];

// Patterns to match and replace
const REPLACEMENT_PATTERNS = [
  // Pattern: ## AI Tutor: [Name] - [Specialty]
  {
    pattern: /##\s*AI\s+Tutor:\s*([^-]+)\s*-\s*/gi,
    replacement: '## AI Tutor: Diver Well - '
  },
  // Pattern: **AI Tutor: [Name] - [Specialty]**
  {
    pattern: /\*\*AI\s+Tutor:\s*([^-]+)\s*-\s*([^*]+)\*\*/gi,
    replacement: '**AI Tutor: Diver Well - $2**'
  },
  // Pattern: I'm [Name], your AI tutor
  {
    pattern: /I'm\s+([^,]+),\s+your\s+AI\s+tutor/gi,
    replacement: "I'm Diver Well, your AI tutor"
  },
  // Pattern: Welcome to... I'm [Name]
  {
    pattern: /Welcome\s+to[^!]*!?\s+I'm\s+([^,\.]+)/gi,
    replacement: (match: string, name: string) => {
      // Only replace if the name is one of our AI tutor names
      const normalizedName = name.trim();
      if (AI_TUTOR_NAMES.some(tutorName => normalizedName.includes(tutorName) || tutorName.includes(normalizedName))) {
        return match.replace(normalizedName, 'Diver Well');
      }
      return match;
    }
  },
  // Pattern: AI Tutor: [Name] (standalone)
  {
    pattern: /AI\s+Tutor:\s*([A-Za-z\s\.]+?)(?:\s*-\s*|$|\n)/gi,
    replacement: (match: string, name: string) => {
      const normalizedName = name.trim();
      if (AI_TUTOR_NAMES.some(tutorName => normalizedName.includes(tutorName) || tutorName.includes(normalizedName))) {
        return match.replace(normalizedName, 'Diver Well');
      }
      return match;
    }
  }
];

function replaceAITutorNames(content: string): string {
  let updatedContent = content;
  let changesMade = false;

  // First, do direct name replacements for known AI tutor names
  for (const tutorName of AI_TUTOR_NAMES) {
    // Replace in various contexts
    const patterns = [
      // In headings: ## AI Tutor: [Name]
      new RegExp(`##\\s*AI\\s+Tutor:\\s*${tutorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*-?`, 'gi'),
      // In bold: **AI Tutor: [Name]**
      new RegExp(`\\*\\*AI\\s+Tutor:\\s*${tutorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*-?`, 'gi'),
      // In text: I'm [Name], your AI tutor
      new RegExp(`I'm\\s+${tutorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*,\\s*your\\s+AI\\s+tutor`, 'gi'),
      // In text: Welcome... I'm [Name]
      new RegExp(`I'm\\s+${tutorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s*,\\s*|\\s*\\.|\\s*$)`, 'gi'),
      // Standalone: AI Tutor: [Name]
      new RegExp(`AI\\s+Tutor:\\s*${tutorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s*-|\\s*$|\\s*\\.)`, 'gi'),
    ];

    for (const pattern of patterns) {
      if (pattern.test(updatedContent)) {
        updatedContent = updatedContent.replace(pattern, (match) => {
          return match.replace(tutorName, 'Diver Well');
        });
        changesMade = true;
      }
    }
  }

  // Apply pattern-based replacements
  for (const { pattern, replacement } of REPLACEMENT_PATTERNS) {
    const before = updatedContent;
    if (typeof replacement === 'string') {
      updatedContent = updatedContent.replace(pattern, replacement);
    } else {
      updatedContent = updatedContent.replace(pattern, replacement);
    }
    if (before !== updatedContent) {
      changesMade = true;
    }
  }

  return updatedContent;
}

async function updateAITutorNamesInDB() {
  console.log('🤖 Starting AI Tutor name replacement in database...\n');

  try {
    // Update lessons
    console.log('📚 Updating lessons...');
    const allLessons = await db.select().from(lessons);
    let lessonsUpdated = 0;

    for (const lesson of allLessons) {
      const originalContent = lesson.content;
      const updatedContent = replaceAITutorNames(originalContent);

      if (originalContent !== updatedContent) {
        await db
          .update(lessons)
          .set({ content: updatedContent })
          .where(eq(lessons.id, lesson.id));
        lessonsUpdated++;
        console.log(`  ✓ Updated lesson: ${lesson.title.substring(0, 50)}...`);
      }
    }
    console.log(`✅ Updated ${lessonsUpdated} out of ${allLessons.length} lessons\n`);

    // Update quizzes (if they have content fields)
    console.log('📝 Checking quizzes...');
    const allQuizzes = await db.select().from(quizzes);
    let quizzesUpdated = 0;

    for (const quiz of allQuizzes) {
      // Check if title needs updating
      const originalTitle = quiz.title;
      const updatedTitle = replaceAITutorNames(originalTitle);

      if (originalTitle !== updatedTitle) {
        await db
          .update(quizzes)
          .set({ title: updatedTitle })
          .where(eq(quizzes.id, quiz.id));
        quizzesUpdated++;
        console.log(`  ✓ Updated quiz title: ${quiz.title.substring(0, 50)}...`);
      }
    }
    console.log(`✅ Updated ${quizzesUpdated} out of ${allQuizzes.length} quizzes\n`);

    // Update questions
    console.log('❓ Updating questions...');
    const allQuestions = await db.select().from(questions);
    let questionsUpdated = 0;

    for (const question of allQuestions) {
      // Update prompt
      const originalPrompt = question.prompt;
      const updatedPrompt = replaceAITutorNames(originalPrompt);

      // Update explanation if it exists
      let updatedExplanation = question.explanation;
      if (question.explanation) {
        updatedExplanation = replaceAITutorNames(question.explanation);
      }

      if (originalPrompt !== updatedPrompt || (question.explanation && question.explanation !== updatedExplanation)) {
        await db
          .update(questions)
          .set({
            prompt: updatedPrompt,
            explanation: updatedExplanation || question.explanation
          })
          .where(eq(questions.id, question.id));
        questionsUpdated++;
        console.log(`  ✓ Updated question: ${question.prompt.substring(0, 50)}...`);
      }
    }
    console.log(`✅ Updated ${questionsUpdated} out of ${allQuestions.length} questions\n`);

    console.log('🎉 Successfully updated all AI Tutor names to "Diver Well"!');
    console.log(`\n📊 Summary:`);
    console.log(`   - Lessons updated: ${lessonsUpdated}`);
    console.log(`   - Quizzes updated: ${quizzesUpdated}`);
    console.log(`   - Questions updated: ${questionsUpdated}`);

  } catch (error) {
    console.error('❌ Error updating AI Tutor names:', error);
    throw error;
  }
}

// Run the update
updateAITutorNamesInDB().catch(console.error);
