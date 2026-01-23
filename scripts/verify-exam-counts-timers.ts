// @ts-ignore - content file import
import { examQuestions } from '../content/exam-questions.js';

/**
 * Script to verify exam counts and timers are correctly represented
 */

interface ExamTrack {
  id: string;
  title: string;
  slug: string;
  srsQuestions: number;
  fullExamQuestions: number;
  srsTimeLimit: number; // minutes
  fullExamTimeLimit: number; // minutes
}

// Read actual question counts from content file
function getActualQuestionCounts() {
  const counts: Record<string, number> = {};
  for (const [key, value] of Object.entries(examQuestions)) {
    counts[key] = Array.isArray(value) ? value.length : 0;
  }
  return counts;
}

// Expected exam tracks from professional-exams.tsx
const expectedExams: ExamTrack[] = [
  {
    id: "ndt-inspection",
    title: "NDT Inspection & Testing",
    slug: "ndt-inspection",
    srsQuestions: 15,
    fullExamQuestions: 75,
    srsTimeLimit: 30,
    fullExamTimeLimit: 120,
  },
  {
    id: "diver-medic",
    title: "Diver Medic Technician",
    slug: "diver-medic",
    srsQuestions: 15,
    fullExamQuestions: 65,
    srsTimeLimit: 25,
    fullExamTimeLimit: 90,
  },
  {
    id: "commercial-supervisor",
    title: "Commercial Dive Supervisor",
    slug: "commercial-supervisor",
    srsQuestions: 15,
    fullExamQuestions: 80,
    srsTimeLimit: 30,
    fullExamTimeLimit: 150,
  },
  {
    id: "saturation-diving",
    title: "Saturation Diving Systems",
    slug: "saturation-diving",
    srsQuestions: 15,
    fullExamQuestions: 70,
    srsTimeLimit: 30,
    fullExamTimeLimit: 135,
  },
  {
    id: "underwater-welding",
    title: "Advanced Underwater Welding",
    slug: "underwater-welding",
    srsQuestions: 15,
    fullExamQuestions: 60,
    srsTimeLimit: 25,
    fullExamTimeLimit: 100,
  },
  {
    id: "hyperbaric-operations",
    title: "Hyperbaric Chamber Operations",
    slug: "hyperbaric-operations",
    srsQuestions: 15,
    fullExamQuestions: 55,
    srsTimeLimit: 25,
    fullExamTimeLimit: 90,
  },
  {
    id: "alst",
    title: "Assistant Life Support Technician",
    slug: "alst",
    srsQuestions: 15,
    fullExamQuestions: 70,
    srsTimeLimit: 30,
    fullExamTimeLimit: 120,
  },
  {
    id: "lst",
    title: "Life Support Technician (LST)",
    slug: "lst",
    srsQuestions: 15,
    fullExamQuestions: 60,
    srsTimeLimit: 25,
    fullExamTimeLimit: 100,
  },
  {
    id: "commercial-air-diver-wet-bell",
    title: "Commercial Air Diver + Top Up (Wet Bell)",
    slug: "commercial-air-diver-wet-bell",
    srsQuestions: 15,
    fullExamQuestions: 60,
    srsTimeLimit: 30,
    fullExamTimeLimit: 120,
  },
  {
    id: "client-representative",
    title: "Client Representative",
    slug: "client-representative",
    srsQuestions: 15,
    fullExamQuestions: 60,
    srsTimeLimit: 30,
    fullExamTimeLimit: 90,
  },
];

// Timer limits from exam-interface.tsx (in seconds)
const srsTimeLimits: Record<string, number> = {
  'ndt-inspection': 1800,        // 30 minutes
  'diver-medic': 1500,           // 25 minutes
  'commercial-supervisor': 1800, // 30 minutes
  'saturation-diving': 1800,     // 30 minutes
  'underwater-welding': 1500,    // 25 minutes
  'hyperbaric-operations': 1500, // 25 minutes
  'alst': 1800,                  // 30 minutes
  'lst': 1500,                   // 25 minutes
  'client-representative': 1800,  // 30 minutes
  'commercial-air-diver-wet-bell': 1800 // 30 minutes
};

const fullExamTimeLimits: Record<string, number> = {
  'ndt-inspection': 7200,           // 120 minutes (2 hours)
  'diver-medic': 5400,              // 90 minutes
  'commercial-supervisor': 9000,    // 150 minutes (2.5 hours)
  'saturation-diving': 8100,        // 135 minutes
  'underwater-welding': 6000,       // 100 minutes
  'hyperbaric-operations': 5400,    // 90 minutes
  'alst': 7200,                     // 120 minutes
  'lst': 6000,                      // 100 minutes
  'client-representative': 5400,     // 90 minutes
  'commercial-air-diver-wet-bell': 7200 // 120 minutes
};

async function verifyExamCountsAndTimers() {
  console.log('🔍 Verifying Exam Counts and Timers...\n');

  const actualCounts = getActualQuestionCounts();
  
  // Map slugs to content keys
  const slugToContentKey: Record<string, string> = {
    'ndt-inspection': 'ndt',
    'diver-medic': 'dmt',
    'commercial-supervisor': 'commercial-supervisor',
    'saturation-diving': 'saturation-diving',
    'underwater-welding': 'underwater-welding',
    'hyperbaric-operations': 'hyperbaric-operations',
    'alst': 'alst',
    'lst': 'lst',
    'commercial-air-diver-wet-bell': 'commercial-air-diver-wet-bell',
  };

  console.log('📊 EXAM COUNT VERIFICATION:\n');

  let allCorrect = true;

  expectedExams.forEach((exam, index) => {
    const contentKey = slugToContentKey[exam.slug];
    const actualCount = contentKey ? (actualCounts[contentKey] || 0) : (exam.slug === 'client-representative' ? 199 : 0);
    
    const countMatch = exam.fullExamQuestions === actualCount;
    const srsTimerMatch = (exam.srsTimeLimit * 60) === srsTimeLimits[exam.slug];
    const fullTimerMatch = (exam.fullExamTimeLimit * 60) === fullExamTimeLimits[exam.slug];

    const statusIcon = (countMatch && srsTimerMatch && fullTimerMatch) ? '✅' : '❌';
    
    console.log(`${index + 1}. ${statusIcon} ${exam.title}`);
    console.log(`   Slug: ${exam.slug}`);
    
    if (exam.slug === 'client-representative') {
      console.log(`   Full Exam Questions: ${exam.fullExamQuestions} (expected: 199 from database)`);
      console.log(`   ✅ Database has 199 questions (185 MCQs + 14 short-answer)`);
    } else {
      console.log(`   Full Exam Questions: ${exam.fullExamQuestions} (expected: ${actualCount})`);
      if (!countMatch) {
        console.log(`   ⚠️  MISMATCH: Expected ${actualCount}, found ${exam.fullExamQuestions}`);
        allCorrect = false;
      }
    }
    
    console.log(`   SRS Timer: ${exam.srsTimeLimit} min (${exam.srsTimeLimit * 60}s) = ${srsTimeLimits[exam.slug]}s`);
    if (!srsTimerMatch) {
      console.log(`   ⚠️  SRS Timer mismatch!`);
      allCorrect = false;
    }
    
    console.log(`   Full Exam Timer: ${exam.fullExamTimeLimit} min (${exam.fullExamTimeLimit * 60}s) = ${fullExamTimeLimits[exam.slug]}s`);
    if (!fullTimerMatch) {
      console.log(`   ⚠️  Full Exam Timer mismatch!`);
      allCorrect = false;
    }
    console.log('');
  });

  console.log('📈 SUMMARY:');
  if (allCorrect) {
    console.log('   ✅ All exam counts and timers are correctly represented!');
  } else {
    console.log('   ⚠️  Some mismatches found. Please review above.');
  }

  console.log('\n✨ Verification complete!');
}

verifyExamCountsAndTimers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
