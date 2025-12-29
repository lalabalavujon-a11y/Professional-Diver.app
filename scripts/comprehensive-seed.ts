import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema-sqlite.js';

// Import content from local files
import { alstLessons } from '../content/alst-lessons.js';
import { lstLessons } from '../content/lst-lessons.js';
import { ndtLessons } from '../content/ndt-lessons.js';
import { additionalLessons } from '../additional-lessons.js';

async function comprehensiveSeed() {
  console.log('🌱 Seeding comprehensive professional diving education content from all available sources...');

  // Clear existing data
  await db.delete(questions);
  await db.delete(quizzes);
  await db.delete(lessons);
  await db.delete(tracks);

  // Create the 7 comprehensive professional diving tracks
  const [ndtTrack] = await db.insert(tracks).values({
    title: "Inspection & Non-Destructive Testing (NDT)",
    slug: "inspection-ndt",
    summary: "AI-powered comprehensive training in underwater inspection techniques, corrosion assessment, cathodic protection surveying, thickness gauging, magnetic particle inspection, and professional documentation standards for commercial diving operations. Features expert AI tutor Dr. Sarah Chen specializing in NDT and inspection techniques.",
    isPublished: true,
  }).returning();

  const [medicTrack] = await db.insert(tracks).values({
    title: "Diver Medic Technician", 
    slug: "diver-medic-technician",
    summary: "Advanced medical training with AI tutor Dr. Michael Rodriguez specializing in diving emergencies. Covers scene assessment, ABCDE protocols, airway management, breathing support, circulation assessment, disability evaluation, and emergency response procedures for diving operations.",
    isPublished: true,
  }).returning();

  const [supervisorTrack] = await db.insert(tracks).values({
    title: "Commercial Dive Supervisor",
    slug: "commercial-dive-supervisor", 
    summary: "AI-guided leadership training with Captain James Mitchell covering dive planning fundamentals, risk assessment methodologies, hazard identification protocols, communication systems, emergency response procedures, and quality assurance for commercial diving operations.",
    isPublished: true,
  }).returning();

  const [airDiverTrack] = await db.insert(tracks).values({
    title: "Air Diver Certification",
    slug: "air-diver-certification",
    summary: "Essential air diving skills with AI tutor Lisa Thompson including diving physics review, gas management concepts, ascent best practices, problem-solving drills, tool handling safety, and basic communications for professional diving operations.",
    isPublished: true,
  }).returning();

  const [satDiverTrack] = await db.insert(tracks).values({
    title: "Saturation Diver Training",
    slug: "saturation-diver-training",
    summary: "Specialized AI-assisted training with Commander Robert Hayes for saturation diving operations, system components and operation, human factors in confined environments, risk assessment themes, and life support systems for deep-sea commercial operations.",
    isPublished: true,
  }).returning();

  const [alstTrack] = await db.insert(tracks).values({
    title: "Assistant Life Support Technician (ALST)",
    slug: "assistant-life-support-technician", 
    summary: "AI tutor David Kim guides life support system operation training, gas management principles, environmental control systems, emergency procedures, equipment maintenance protocols, and safety systems essential for diving support operations.",
    isPublished: true,
  }).returning();

  const [lstTrack] = await db.insert(tracks).values({
    title: "Life Support Technician (LST)",
    slug: "life-support-technician",
    summary: "Advanced AI-powered training with Rebecca Foster covering life support systems, system design principles, troubleshooting methodologies, emergency management procedures, team leadership skills, and quality assurance protocols for senior technical positions.",
    isPublished: true,
  }).returning();

  console.log('✅ Created all 7 training tracks');

  // Create lessons for NDT Track
  console.log('📚 Creating NDT lessons...');
  const ndtLessonIds = [];
  for (let i = 0; i < ndtLessons.length; i++) {
    const lesson = ndtLessons[i];
    const [createdLesson] = await db.insert(lessons).values({
      trackId: ndtTrack.id,
      title: lesson.title,
      order: i + 1,
      content: lesson.content,
    }).returning();
    ndtLessonIds.push(createdLesson.id);
  }

  // Create lessons for DMT Track
  console.log('📚 Creating DMT lessons...');
  const dmtLessonIds = [];
  const dmtLessons = additionalLessons.filter(lesson => lesson.trackSlug === 'diver-medic-technician');
  for (let i = 0; i < dmtLessons.length; i++) {
    const lesson = dmtLessons[i];
    const [createdLesson] = await db.insert(lessons).values({
      trackId: medicTrack.id,
      title: lesson.title,
      order: i + 1,
      content: lesson.content,
    }).returning();
    dmtLessonIds.push(createdLesson.id);
  }

  // Create lessons for Commercial Dive Supervisor Track
  console.log('📚 Creating Commercial Dive Supervisor lessons...');
  const supervisorLessonIds = [];
  const supervisorLessons = additionalLessons.filter(lesson => lesson.trackSlug === 'commercial-dive-supervisor');
  for (let i = 0; i < supervisorLessons.length; i++) {
    const lesson = supervisorLessons[i];
    const [createdLesson] = await db.insert(lessons).values({
      trackId: supervisorTrack.id,
      title: lesson.title,
      order: i + 1,
      content: lesson.content,
    }).returning();
    supervisorLessonIds.push(createdLesson.id);
  }

  // Create lessons for Air Diver Track
  console.log('📚 Creating Air Diver lessons...');
  const airDiverLessonIds = [];
  const airDiverLessons = additionalLessons.filter(lesson => lesson.trackSlug === 'air-diver-certification');
  for (let i = 0; i < airDiverLessons.length; i++) {
    const lesson = airDiverLessons[i];
    const [createdLesson] = await db.insert(lessons).values({
      trackId: airDiverTrack.id,
      title: lesson.title,
      order: i + 1,
      content: lesson.content,
    }).returning();
    airDiverLessonIds.push(createdLesson.id);
  }

  // Create lessons for Saturation Diver Track
  console.log('📚 Creating Saturation Diver lessons...');
  const satDiverLessonIds = [];
  const satDiverLessons = additionalLessons.filter(lesson => lesson.trackSlug === 'saturation-diver-training');
  for (let i = 0; i < satDiverLessons.length; i++) {
    const lesson = satDiverLessons[i];
    const [createdLesson] = await db.insert(lessons).values({
      trackId: satDiverTrack.id,
      title: lesson.title,
      order: i + 1,
      content: lesson.content,
    }).returning();
    satDiverLessonIds.push(createdLesson.id);
  }

  // Create lessons for ALST Track
  console.log('📚 Creating ALST lessons...');
  const alstLessonIds = [];
  for (let i = 0; i < alstLessons.length; i++) {
    const lesson = alstLessons[i];
    const [createdLesson] = await db.insert(lessons).values({
      trackId: alstTrack.id,
      title: lesson.title,
      order: i + 1,
      content: lesson.content,
    }).returning();
    alstLessonIds.push(createdLesson.id);
  }

  // Create lessons for LST Track
  console.log('📚 Creating LST lessons...');
  const lstLessonIds = [];
  for (let i = 0; i < lstLessons.length; i++) {
    const lesson = lstLessons[i];
    const [createdLesson] = await db.insert(lessons).values({
      trackId: lstTrack.id,
      title: lesson.title,
      order: i + 1,
      content: lesson.content,
    }).returning();
    lstLessonIds.push(createdLesson.id);
  }

  console.log('✅ All lessons created successfully!');

  // Create quizzes for key lessons
  console.log('📝 Creating assessment quizzes...');

  // NDT Quiz
  const [ndtQuiz] = await db.insert(quizzes).values({
    lessonId: ndtLessonIds[0],
    title: "Professional NDT Assessment - Visual Inspection Mastery",
    timeLimit: 30,
  }).returning();

  await db.insert(questions).values([
    {
      quizId: ndtQuiz.id,
      prompt: "In professional commercial underwater inspection operations, what is the primary advantage of systematic grid pattern inspection methodology?",
      options: JSON.stringify({
        a: "Reduces total inspection time and operational costs significantly",
        b: "Ensures complete systematic coverage with quality assurance verification and eliminates missed critical structural areas",
        c: "Minimizes specialized lighting and equipment requirements for operations",
        d: "Reduces diver physical exertion and gas consumption rates during work"
      }),
      correctAnswer: "b",
      order: 1,
    },
    {
      quizId: ndtQuiz.id,
      prompt: "Which corrosion type is most commonly associated with dissimilar metal connections in marine environments and requires electrochemical galvanic series analysis for assessment?",
      options: JSON.stringify({
        a: "General uniform corrosion across large surface areas of structures",
        b: "Localized pitting corrosion with high depth-to-diameter ratios",
        c: "Galvanic corrosion with preferential anode attack at connection points and interfaces",
        d: "Crevice corrosion in confined joint spaces and under marine growth deposits"
      }),
      correctAnswer: "c",
      order: 2,
    },
  ]);

  // DMT Quiz
  const [dmtQuiz] = await db.insert(quizzes).values({
    lessonId: dmtLessonIds[0],
    title: "Professional Emergency Medical Response Assessment", 
    timeLimit: 25,
  }).returning();

  await db.insert(questions).values([
    {
      quizId: dmtQuiz.id,
      prompt: "In the professional ABCDE emergency assessment protocol for diving emergencies, what is the correct systematic sequence and primary clinical focus of each component?",
      options: JSON.stringify({
        a: "Airway patency assessment, Breathing adequacy evaluation, Circulation status check, Disability neurological assessment, Exposure complete examination with sequential stabilization",
        b: "Alert level determination, Blood pressure measurement, CPR readiness assessment, Drug administration protocol, Emergency transport preparation",
        c: "Ascent procedure verification, Buoyancy control assessment, Communication system check, Depth monitoring evaluation, Emergency evacuation preparation",
        d: "Assessment priority determination, Basic life support initiation, Clinical evaluation completion, Diagnostic testing performance, Emergency procedure implementation"
      }),
      correctAnswer: "a",
      order: 1,
    },
    {
      quizId: dmtQuiz.id,
      prompt: "What is the primary clinical difference between Type I and Type II decompression sickness in terms of symptom presentation and treatment urgency requirements?",
      options: JSON.stringify({
        a: "Type I affects only joint systems with delayed onset, Type II affects only pulmonary systems with immediate onset",
        b: "Type I involves mild joint pain and skin manifestations with lower urgency, Type II involves serious neurological and pulmonary complications requiring immediate intervention",
        c: "Type I occurs exclusively at shallow recreational depths, Type II occurs exclusively at deep commercial diving depths",
        d: "Type I responds to surface oxygen therapy alone, Type II requires immediate surgical intervention and advanced life support"
      }),
      correctAnswer: "b",
      order: 2,
    },
  ]);

  console.log('✅ Professional diving education platform successfully seeded with comprehensive content!');
  console.log(`Created ${await db.select().from(tracks).then(r => r.length)} comprehensive professional training tracks`);
  console.log(`Created ${await db.select().from(lessons).then(r => r.length)} detailed professional lessons with AI tutors`);
  console.log(`Created ${await db.select().from(quizzes).then(r => r.length)} professional assessments`);
  console.log(`Created ${await db.select().from(questions).then(r => r.length)} comprehensive assessment questions`);
  
  console.log('\n🎓 Professional Training Tracks Created with AI Tutors:');
  console.log('1. Inspection & Non-Destructive Testing (NDT) - AI Tutor: Dr. Sarah Chen');
  console.log('2. Diver Medic Technician - AI Tutor: Dr. Michael Rodriguez');
  console.log('3. Commercial Dive Supervisor - AI Tutor: Captain James Mitchell');
  console.log('4. Air Diver Certification - AI Tutor: Lisa Thompson');
  console.log('5. Saturation Diver Training - AI Tutor: Commander Robert Hayes');
  console.log('6. Assistant Life Support Technician (ALST) - AI Tutor: David Kim');
  console.log('7. Life Support Technician (LST) - AI Tutor: Rebecca Foster');

  console.log('\n📚 Enhanced Features Integrated:');
  console.log('- AI tutors embedded in lesson content with specialist backgrounds');
  console.log('- Professional-grade comprehensive lesson content from all available sources'); 
  console.log('- Industry-standard assessment questions');
  console.log('- Real-world commercial diving scenarios');
  console.log('- Professional documentation and safety protocols');
  console.log('- Brand-neutral, originally reworded content for all tracks');
}

comprehensiveSeed().catch(console.error).finally(() => process.exit(0));
