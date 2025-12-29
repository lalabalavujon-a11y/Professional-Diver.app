import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';

/**
 * 🔧 ADD MISSING QUIZZES FOR ALL TRACKS
 * 
 * This script adds quizzes to all tracks that don't have them yet.
 */

async function addMissingQuizzes() {
  console.log('🔧 Adding missing quizzes for all tracks...');

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

    // Process each track
    for (const track of trackMap.values()) {
      console.log(`\n📚 Processing track: ${track.trackTitle}`);
      
      for (const lesson of track.lessons) {
        // Check if lesson already has a quiz
        const existingQuiz = await db.select().from(quizzes).where(eq(quizzes.lessonId, lesson.id));
        
        if (existingQuiz.length === 0) {
          console.log(`  📝 Adding quiz for lesson: ${lesson.title}`);
          
          // Add quiz
          const insertedQuiz = await db.insert(quizzes).values({
            lessonId: lesson.id,
            title: `${lesson.title} - Assessment`,
            timeLimit: 30,
            passingScore: 80
          }).returning();
          
          // Add questions for the quiz
          const quizQuestions = getQuizQuestions(track.trackSlug, lesson.title);
          for (const question of quizQuestions) {
            await db.insert(questions).values({
              quizId: insertedQuiz[0].id,
              prompt: question.prompt,
              options: JSON.stringify([question.a, question.b, question.c, question.d]),
              correctAnswer: question.answer,
              order: question.order
            });
          }
          console.log(`    ✅ Added ${quizQuestions.length} questions`);
        } else {
          console.log(`  ⏭️  Quiz already exists for: ${lesson.title}`);
        }
      }
    }

    console.log('\n🎉 Successfully added missing quizzes!');
    
    // Final verification
    const finalStats = await db.execute(`
      SELECT t.title as track_title, 
             COUNT(DISTINCT l.id) as lesson_count, 
             COUNT(DISTINCT q.id) as quiz_count 
      FROM tracks t 
      LEFT JOIN lessons l ON t.id = l.track_id 
      LEFT JOIN quizzes q ON l.id = q.lesson_id 
      GROUP BY t.id, t.title 
      ORDER BY t.title
    `);
    
    console.log('\n📊 Final Statistics:');
    for (const row of finalStats.rows) {
      console.log(`  ${row.track_title}: ${row.lesson_count} lessons, ${row.quiz_count} quizzes`);
    }

  } catch (error) {
    console.error('❌ Error adding missing quizzes:', error);
  }
}

// Function to generate quiz questions based on track and lesson
function getQuizQuestions(trackSlug: string, lessonTitle: string) {
  const questionSets = {
    "underwater-welding": {
      "Underwater Welding Fundamentals & Safety": [
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
      ],
      "Advanced Welding Techniques & Quality Control": [
        {
          prompt: "What is the primary purpose of multi-pass welding?",
          a: "To reduce welding time",
          b: "To weld thick materials with proper penetration",
          c: "To improve arc stability",
          d: "To reduce electrode consumption",
          answer: "b",
          order: 1
        },
        {
          prompt: "What is the most critical factor in underwater weld quality?",
          a: "Welding speed",
          b: "Arc length control",
          c: "Electrode angle",
          d: "All of the above",
          answer: "d",
          order: 2
        },
        {
          prompt: "Which testing method is most effective for detecting internal weld defects?",
          a: "Visual inspection",
          b: "Magnetic particle testing",
          c: "Ultrasonic testing",
          d: "Dye penetrant testing",
          answer: "c",
          order: 3
        }
      ],
      "Welding Equipment & Maintenance": [
        {
          prompt: "What is the minimum power output required for underwater welding operations?",
          a: "200-300 amps",
          b: "300-400 amps",
          c: "400-500 amps",
          d: "500-600 amps",
          answer: "b",
          order: 1
        },
        {
          prompt: "How often should welding cables be inspected for damage?",
          a: "Weekly",
          b: "Daily",
          c: "Before each use",
          d: "Monthly",
          answer: "c",
          order: 2
        },
        {
          prompt: "What is the primary safety concern with underwater welding equipment?",
          a: "Equipment corrosion",
          b: "Electrical shock hazard",
          c: "Equipment weight",
          d: "Cable length",
          answer: "b",
          order: 3
        }
      ],
      "Final Assessment & Certification": [
        {
          prompt: "What organization provides primary certification for underwater welding?",
          a: "AWS",
          b: "ADCI",
          c: "API",
          d: "NACE",
          answer: "a",
          order: 1
        },
        {
          prompt: "What is the minimum passing score for underwater welding certification?",
          a: "70%",
          b: "75%",
          c: "80%",
          d: "85%",
          answer: "c",
          order: 2
        },
        {
          prompt: "What is the primary responsibility of an underwater welder during operations?",
          a: "To minimize costs",
          b: "To ensure weld quality and safety",
          c: "To work as fast as possible",
          d: "To reduce equipment usage",
          answer: "b",
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
        },
        {
          prompt: "What is the typical grid size for detailed commercial inspection?",
          a: "1x1 meters",
          b: "2x2 meters",
          c: "3x3 meters",
          d: "4x4 meters",
          answer: "b",
          order: 3
        }
      ],
      "Corrosion Assessment Techniques": [
        {
          prompt: "What is the industry standard minimum protection potential for steel?",
          a: "-750 mV (Ag/AgCl)",
          b: "-800 mV (Ag/AgCl)",
          c: "-850 mV (Ag/AgCl)",
          d: "-900 mV (Ag/AgCl)",
          answer: "c",
          order: 1
        },
        {
          prompt: "What type of corrosion is most commonly associated with dissimilar metal connections?",
          a: "General corrosion",
          b: "Pitting corrosion",
          c: "Galvanic corrosion",
          d: "Crevice corrosion",
          answer: "c",
          order: 2
        },
        {
          prompt: "What is the critical depth-to-diameter ratio for pitting corrosion?",
          a: "0.5:1",
          b: "1:1",
          c: "1.5:1",
          d: "2:1",
          answer: "b",
          order: 3
        }
      ],
      "Documentation Standards": [
        {
          prompt: "What is the minimum camera resolution for professional defect documentation?",
          a: "12 megapixels",
          b: "18 megapixels",
          c: "24 megapixels",
          d: "30 megapixels",
          answer: "c",
          order: 1
        },
        {
          prompt: "What is the minimum overlap requirement between adjacent inspection grids?",
          a: "5%",
          b: "10%",
          c: "15%",
          d: "20%",
          answer: "b",
          order: 2
        },
        {
          prompt: "What is the primary purpose of including measurement scales in photographs?",
          a: "To improve image quality",
          b: "To provide dimensional reference",
          c: "To reduce file size",
          d: "To enhance lighting",
          answer: "b",
          order: 3
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
        },
        {
          prompt: "What is the primary goal of the ABCDE assessment?",
          a: "To diagnose the specific condition",
          b: "To identify and treat life-threatening conditions systematically",
          c: "To determine treatment priority",
          d: "To assess patient consciousness",
          answer: "b",
          order: 2
        },
        {
          prompt: "What should be assessed first in the ABCDE sequence?",
          a: "Breathing",
          b: "Airway",
          c: "Circulation",
          d: "Disability",
          answer: "b",
          order: 3
        }
      ]
    },
    "saturation-diving": {
      "Saturation Systems & Decompression Management": [
        {
          prompt: "What is the primary advantage of saturation diving?",
          a: "Lower cost per dive",
          b: "No decompression time limits at working depth",
          c: "Simpler equipment",
          d: "Faster ascent rates",
          answer: "b",
          order: 1
        },
        {
          prompt: "What is the typical saturation decompression rate?",
          a: "1 meter per hour",
          b: "2 meters per hour",
          c: "3 meters per hour",
          d: "4 meters per hour",
          answer: "a",
          order: 2
        },
        {
          prompt: "What is the primary gas used in saturation diving?",
          a: "Air",
          b: "Nitrox",
          c: "Heliox",
          d: "Trimix",
          answer: "c",
          order: 3
        }
      ]
    },
    "commercial-supervisor": {
      "Dive Planning Fundamentals": [
        {
          prompt: "What is the primary responsibility of a commercial dive supervisor?",
          a: "To minimize operational costs",
          b: "To ensure diver safety and operational efficiency",
          c: "To reduce dive times",
          d: "To maximize productivity",
          answer: "b",
          order: 1
        },
        {
          prompt: "What is the minimum experience requirement for commercial dive supervision?",
          a: "2 years commercial diving",
          b: "3 years commercial diving",
          c: "5 years commercial diving",
          d: "10 years commercial diving",
          answer: "c",
          order: 2
        },
        {
          prompt: "What is the primary purpose of dive planning?",
          a: "To reduce costs",
          b: "To identify and mitigate risks",
          c: "To increase productivity",
          d: "To minimize equipment usage",
          answer: "b",
          order: 3
        }
      ]
    },
    "alst": {
      "Advanced Life Support Systems": [
        {
          prompt: "What is the primary responsibility of an ALST?",
          a: "To operate life support systems",
          b: "To maintain life support systems",
          c: "To operate and maintain life support systems",
          d: "To supervise life support operations",
          answer: "c",
          order: 1
        },
        {
          prompt: "What is the minimum gas reserve requirement for life support systems?",
          a: "12 hours",
          b: "24 hours",
          c: "48 hours",
          d: "72 hours",
          answer: "c",
          order: 2
        },
        {
          prompt: "What is the primary gas used in life support systems?",
          a: "Air",
          b: "Oxygen",
          c: "Helium",
          d: "Nitrogen",
          answer: "a",
          order: 3
        }
      ],
      "Emergency Decompression Procedures": [
        {
          prompt: "What is the primary purpose of emergency decompression?",
          a: "To reduce costs",
          b: "To treat decompression sickness",
          c: "To save time",
          d: "To reduce gas consumption",
          answer: "b",
          order: 1
        },
        {
          prompt: "What is the standard emergency decompression pressure?",
          a: "2.0 ATA",
          b: "2.4 ATA",
          c: "2.8 ATA",
          d: "3.0 ATA",
          answer: "c",
          order: 2
        },
        {
          prompt: "What is the minimum treatment duration for emergency decompression?",
          a: "30 minutes",
          b: "60 minutes",
          c: "90 minutes",
          d: "120 minutes",
          answer: "c",
          order: 3
        }
      ],
      "System Troubleshooting": [
        {
          prompt: "What is the first step in system troubleshooting?",
          a: "Replace equipment",
          b: "Identify the problem",
          c: "Call for help",
          d: "Shut down systems",
          answer: "b",
          order: 1
        },
        {
          prompt: "What is the primary cause of system failures?",
          a: "Equipment age",
          b: "Poor maintenance",
          c: "Operator error",
          d: "All of the above",
          answer: "d",
          order: 2
        },
        {
          prompt: "What is the most critical system in life support operations?",
          a: "Gas supply",
          b: "Environmental control",
          c: "Communication",
          d: "All are equally critical",
          answer: "d",
          order: 3
        }
      ]
    },
    "lst": {
      "Life Support Fundamentals": [
        {
          prompt: "What is the primary responsibility of an LST?",
          a: "To operate life support systems",
          b: "To maintain life support systems",
          c: "To supervise life support operations",
          d: "All of the above",
          answer: "d",
          order: 1
        },
        {
          prompt: "What is the minimum experience requirement for LST certification?",
          a: "1 year",
          b: "2 years",
          c: "3 years",
          d: "5 years",
          answer: "c",
          order: 2
        },
        {
          prompt: "What is the primary gas used in life support systems?",
          a: "Air",
          b: "Oxygen",
          c: "Helium",
          d: "Nitrogen",
          answer: "a",
          order: 3
        }
      ],
      "System Design Principles": [
        {
          prompt: "What is the primary design principle for life support systems?",
          a: "Cost effectiveness",
          b: "Redundancy",
          c: "Simplicity",
          d: "Compactness",
          answer: "b",
          order: 1
        },
        {
          prompt: "What is the minimum number of backup systems required?",
          a: "1",
          b: "2",
          c: "3",
          d: "4",
          answer: "b",
          order: 2
        },
        {
          prompt: "What is the primary purpose of system redundancy?",
          a: "To reduce costs",
          b: "To ensure continuous operation",
          c: "To simplify maintenance",
          d: "To reduce space requirements",
          answer: "b",
          order: 3
        }
      ],
      "Advanced Troubleshooting": [
        {
          prompt: "What is the first step in advanced troubleshooting?",
          a: "Replace equipment",
          b: "Identify the root cause",
          c: "Call for help",
          d: "Shut down systems",
          answer: "b",
          order: 1
        },
        {
          prompt: "What is the most common cause of system failures?",
          a: "Equipment age",
          b: "Poor maintenance",
          c: "Operator error",
          d: "Environmental factors",
          answer: "b",
          order: 2
        },
        {
          prompt: "What is the primary goal of troubleshooting?",
          a: "To minimize downtime",
          b: "To restore system operation",
          c: "To identify root causes",
          d: "All of the above",
          answer: "d",
          order: 3
        }
      ]
    }
  };

  const trackQuestions = questionSets[trackSlug];
  if (!trackQuestions) {
    // Default questions if track not found
    return [
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
  }

  return trackQuestions[lessonTitle] || [
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
}

// Run the script
addMissingQuizzes()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
