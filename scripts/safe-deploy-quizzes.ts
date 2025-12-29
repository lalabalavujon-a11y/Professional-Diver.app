import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

/**
 * 🔒 SAFE DEPLOYMENT: Add Missing Quizzes to Production
 * 
 * This script safely adds quizzes to lessons that don't have them yet.
 * It will NOT:
 * - Delete existing quizzes
 * - Modify existing quizzes
 * - Delete any lessons
 * - Modify any lessons
 * 
 * It will ONLY:
 * - Add quizzes to lessons that don't have quizzes yet
 * - Add questions to new quizzes
 * 
 * This script is safe to run multiple times (idempotent).
 */

async function safeDeployQuizzes() {
  console.log('🔒 Starting SAFE quiz deployment...');
  console.log('✅ This will NOT delete or modify any existing data');
  console.log('✅ This will ONLY add missing quizzes\n');

  try {
    // Get all tracks with their lessons
    const allTracks = await db.select({
      trackId: tracks.id,
      trackTitle: tracks.title,
      trackSlug: tracks.slug,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      lessonOrder: lessons.order
    }).from(tracks)
    .leftJoin(lessons, eq(tracks.id, lessons.trackId))
    .orderBy(tracks.title, lessons.order);

    // Group by track
    const trackMap = new Map();
    for (const row of allTracks) {
      if (!trackMap.has(row.trackId)) {
        trackMap.set(row.trackId, {
          trackId: row.trackId,
          trackTitle: row.trackTitle,
          trackSlug: row.trackSlug,
          lessons: []
        });
      }
      if (row.lessonId) {
        trackMap.get(row.trackId).lessons.push({
          id: row.lessonId,
          title: row.lessonTitle,
          order: row.lessonOrder
        });
      }
    }

    let totalAdded = 0;
    let totalSkipped = 0;

    // Process each track
    for (const track of trackMap.values()) {
      console.log(`\n📚 Processing track: ${track.trackTitle}`);
      
      for (const lesson of track.lessons) {
        // Check if lesson already has a quiz
        const existingQuiz = await db.select().from(quizzes).where(eq(quizzes.lessonId, lesson.id));
        
        if (existingQuiz.length === 0) {
          console.log(`  ➕ Adding quiz for: ${lesson.title}`);
          
          try {
            // Add quiz
            const insertedQuiz = await db.insert(quizzes).values({
              lessonId: lesson.id,
              title: `${lesson.title} - Assessment`,
              timeLimit: 30,
              passingScore: 80
            }).returning();
            
            // Add questions for the quiz
            const quizQuestions = getQuizQuestions(track.trackSlug, lesson.title);
            let questionCount = 0;
            
            for (const question of quizQuestions) {
              await db.insert(questions).values({
                quizId: insertedQuiz[0].id,
                prompt: question.prompt,
                options: JSON.stringify([question.a, question.b, question.c, question.d]),
                correctAnswer: question.answer,
                order: question.order
              });
              questionCount++;
            }
            
            console.log(`    ✅ Added quiz with ${questionCount} questions`);
            totalAdded++;
          } catch (error) {
            console.error(`    ❌ Error adding quiz: ${error}`);
          }
        } else {
          console.log(`  ✓ Quiz already exists for: ${lesson.title}`);
          totalSkipped++;
        }
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 DEPLOYMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Quizzes added: ${totalAdded}`);
    console.log(`⏭️  Quizzes skipped (already exist): ${totalSkipped}`);
    console.log(`📚 Total lessons processed: ${totalAdded + totalSkipped}`);
    console.log('='.repeat(60));
    console.log('\n🎉 Safe deployment completed!');
    console.log('✅ No data was deleted or modified');
    console.log('✅ Only missing quizzes were added\n');

  } catch (error) {
    console.error('\n❌ Error during safe deployment:', error);
    throw error;
  }
}

// Function to generate quiz questions based on track and lesson
function getQuizQuestions(trackSlug: string, lessonTitle: string) {
  const questionSets: Record<string, Record<string, any[]>> = {
    "underwater-welding": {
      "Welding Fundamentals": [
        {
          prompt: "What is the primary advantage of wet welding over dry welding?",
          a: "Higher weld quality",
          b: "Faster setup and lower cost",
          c: "Better arc stability",
          d: "Reduced porosity risk",
          answer: "b",
          order: 1
        },
        {
          prompt: "What is the maximum safe compression rate for hyperbaric chamber operations?",
          a: "1 atmosphere per minute",
          b: "2 atmospheres per minute",
          c: "3 atmospheres per minute",
          d: "4 atmospheres per minute",
          answer: "a",
          order: 2
        },
        {
          prompt: "Which electrode type is most commonly used for underwater welding?",
          a: "E6013",
          b: "E7018",
          c: "E8018",
          d: "E308L",
          answer: "a",
          order: 3
        }
      ]
    },
    "ndt-inspection": {
      "Visual Inspection Fundamentals": [
        {
          prompt: "What is the primary advantage of systematic grid pattern inspection?",
          a: "Reduces inspection time",
          b: "Ensures complete systematic coverage and eliminates missed critical areas",
          c: "Minimizes equipment requirements",
          d: "Reduces diver fatigue",
          answer: "b",
          order: 1
        },
        {
          prompt: "What is the minimum lighting requirement for underwater inspection?",
          a: "5,000 lumens",
          b: "10,000 lumens",
          c: "15,000 lumens",
          d: "20,000 lumens",
          answer: "b",
          order: 2
        }
      ]
    },
    "diver-medic": {
      "Emergency Response - ABCDE Assessment": [
        {
          prompt: "What is the correct ABCDE sequence for diving emergencies?",
          a: "Airway, Breathing, Circulation, Disability, Exposure assessment with stabilization",
          b: "Alert level, Blood pressure, CPR, Drug administration, Emergency transport",
          c: "Ascent verification, Buoyancy control, Communication check, Depth monitoring, Evacuation",
          d: "Assessment priority, Basic life support, Clinical evaluation, Diagnostic testing, Emergency procedures",
          answer: "a",
          order: 1
        }
      ]
    },
    "hyperbaric-operations": {},
    "lst": {},
    "alst": {},
    "saturation-diving": {},
    "commercial-supervisor": {}
  };

  // Default questions if specific track/lesson not found
  const defaultQuestions = [
    {
      prompt: `What is the primary objective of ${lessonTitle}?`,
      a: "To minimize costs",
      b: "To ensure safety and quality",
      c: "To increase productivity",
      d: "To reduce time",
      answer: "b",
      order: 1
    },
    {
      prompt: `What is the most critical factor in ${lessonTitle}?`,
      a: "Speed",
      b: "Safety",
      c: "Cost",
      d: "Equipment",
      answer: "b",
      order: 2
    },
    {
      prompt: `What is the primary responsibility in ${lessonTitle}?`,
      a: "To follow procedures",
      b: "To maintain quality",
      c: "To ensure safety",
      d: "All of the above",
      answer: "d",
      order: 3
    }
  ];

  const trackQuestions = questionSets[trackSlug];
  if (!trackQuestions) {
    return defaultQuestions;
  }

  return trackQuestions[lessonTitle] || defaultQuestions;
}

// Export the function so it can be imported by API routes
export { safeDeployQuizzes };

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  safeDeployQuizzes()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

