import { db } from "../server/db";
import { tracks, lessons, quizzes, questions, aiTutors } from "../shared/schema";

async function minimalWorkingSeed() {
  console.log('🔧 Creating minimal working seed to fix question categorization...');

  // Clear existing data
  await db.delete(questions);
  await db.delete(quizzes);
  await db.delete(lessons);
  await db.delete(tracks);
  await db.delete(aiTutors);

  // Create AI Tutors
  const [ndtTutor] = await db.insert(aiTutors).values({
    name: "Dr. Sarah Chen",
    specialty: "NDT Inspection Specialist",
    description: "Expert in underwater non-destructive testing",
    systemPrompt: "You are Dr. Sarah Chen, NDT inspection specialist.",
    track: "NDT"
  }).returning();

  const [dmtTutor] = await db.insert(aiTutors).values({
    name: "Dr. Michael Rodriguez",
    specialty: "Emergency Medicine Specialist", 
    description: "Diving medical officer with emergency experience",
    systemPrompt: "You are Dr. Michael Rodriguez, emergency medicine specialist.",
    track: "DMT"
  }).returning();

  // Create Tracks
  const [ndtTrack] = await db.insert(tracks).values({
    title: "NDT Inspection & Testing",
    slug: "ndt-inspection",
    summary: "Underwater non-destructive testing and inspection",
    aiTutorId: ndtTutor.id,
    isPublished: true,
  }).returning();

  const [dmtTrack] = await db.insert(tracks).values({
    title: "Diver Medic Technician (DMT)",
    slug: "diver-medic",
    summary: "Emergency medical response for diving operations",
    aiTutorId: dmtTutor.id,
    isPublished: true,
  }).returning();

  // Create NDT Lesson (NO objectives column - using existing schema)
  const [ndtLesson] = await db.insert(lessons).values({
    trackId: ndtTrack.id,
    title: "Visual Inspection Fundamentals",
    order: 1,
    content: `# NDT Visual Inspection Fundamentals

## Grid Pattern Methodology
Systematic grid pattern ensures complete coverage and eliminates missed areas.

## Corrosion Types
- Galvanic corrosion: Most common at dissimilar metal connections
- Pitting corrosion: Localized deep penetration (NOT uniform surface degradation)

## NACE Standards
Minimum cathodic protection: -850 mV (Ag/AgCl reference electrode)

## Environmental Factors
1. Visibility limitations
2. Current effects  
3. Depth considerations`,
    estimatedMinutes: 30,
    isRequired: true,
  }).returning();

  // Create DMT Lesson
  const [dmtLesson] = await db.insert(lessons).values({
    trackId: dmtTrack.id,
    title: "Emergency Response - ABCDE Assessment",
    order: 1,
    content: `# ABCDE Emergency Assessment Protocol

## Sequence
A: Airway patency assessment
B: Breathing adequacy evaluation  
C: Circulation status check
D: Disability neurological assessment
E: Exposure complete examination

## DCS Classification
Type I: Mild joint pain, lower urgency
Type II: Serious neurological/pulmonary complications, immediate intervention required

## AGE Management
Left lateral recumbent position + high-flow oxygen + urgent hyperbaric evacuation`,
    estimatedMinutes: 25,
    isRequired: true,
  }).returning();

  // Create NDT Quiz
  const [ndtQuiz] = await db.insert(quizzes).values({
    lessonId: ndtLesson.id,
    title: "NDT Visual Inspection Assessment",
    timeLimit: 30,
  }).returning();

  // NDT Questions (CORRECTLY CATEGORIZED)
  await db.insert(questions).values([
    {
      quizId: ndtQuiz.id,
      prompt: "What is the primary advantage of systematic grid pattern inspection methodology?",
      a: "Reduces inspection time",
      b: "Ensures complete systematic coverage and eliminates missed critical areas",
      c: "Minimizes equipment requirements",
      d: "Reduces diver fatigue",
      answer: "b",
      order: 1,
    },
    {
      quizId: ndtQuiz.id,
      prompt: "Which corrosion type is most commonly associated with dissimilar metal connections?",
      a: "General corrosion",
      b: "Pitting corrosion",
      c: "Galvanic corrosion",
      d: "Crevice corrosion",
      answer: "c",
      order: 2,
    },
    {
      quizId: ndtQuiz.id,
      prompt: "According to NACE standards, what is the minimum cathodic protection potential for steel in seawater?",
      a: "-750 mV (Ag/AgCl)",
      b: "-850 mV (Ag/AgCl)",
      c: "-950 mV (Ag/AgCl)",
      d: "-650 mV (Ag/AgCl)",
      answer: "b",
      order: 3,
    }
  ]);

  // Create DMT Quiz
  const [dmtQuiz] = await db.insert(quizzes).values({
    lessonId: dmtLesson.id,
    title: "DMT Emergency Response Assessment",
    timeLimit: 25,
  }).returning();

  // DMT Questions (CORRECTLY CATEGORIZED)
  await db.insert(questions).values([
    {
      quizId: dmtQuiz.id,
      prompt: "What is the correct ABCDE sequence for diving emergencies?",
      a: "Airway, Breathing, Circulation, Disability, Exposure assessment with stabilization",
      b: "Alert level, Blood pressure, CPR, Drug administration, Emergency transport",
      c: "Ascent verification, Buoyancy control, Communication check, Depth monitoring, Evacuation",
      d: "Assessment priority, Basic life support, Clinical evaluation, Diagnostic testing, Emergency procedures",
      answer: "a",
      order: 1,
    },
    {
      quizId: dmtQuiz.id,
      prompt: "What is the primary difference between Type I and Type II decompression sickness?",
      a: "Type I affects joints only, Type II affects pulmonary only",
      b: "Type I involves mild joint pain with lower urgency, Type II involves serious neurological/pulmonary complications requiring immediate intervention",
      c: "Type I occurs at shallow depths, Type II at deep depths only",
      d: "Type I responds to surface oxygen, Type II requires surgery",
      answer: "b",
      order: 2,
    },
    {
      quizId: dmtQuiz.id,
      prompt: "What is the optimal positioning and treatment for arterial gas embolism (AGE)?",
      a: "Upright with standard oxygen",
      b: "Left lateral recumbent position with high-flow oxygen and urgent hyperbaric evacuation",
      c: "Prone with mechanical ventilation",
      d: "Right lateral with delayed transport",
      answer: "b",
      order: 3,
    }
  ]);

  console.log('✅ Minimal working seed completed successfully!');
  console.log(`Created ${await db.select().from(tracks).then(r => r.length)} tracks`);
  console.log(`Created ${await db.select().from(lessons).then(r => r.length)} lessons`);
  console.log(`Created ${await db.select().from(quizzes).then(r => r.length)} quizzes`);
  console.log(`Created ${await db.select().from(questions).then(r => r.length)} properly categorized questions`);
  
  console.log('\n✅ QUESTION CATEGORIZATION FIXED:');
  console.log('NDT Track: Visual inspection, corrosion, cathodic protection questions ONLY');
  console.log('DMT Track: ABCDE protocol, DCS, AGE emergency management questions ONLY');
  console.log('NO MORE MIXED CATEGORIZATION!');
}

minimalWorkingSeed().catch(console.error).finally(() => process.exit(0));