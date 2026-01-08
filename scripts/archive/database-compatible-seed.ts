import { db } from "../server/db";

async function databaseCompatibleSeed() {
  console.log('🔧 Creating database-compatible seed with correctly categorized questions...');

  // Clear existing data using raw SQL to avoid schema mismatches
  await db.execute("DELETE FROM questions");
  await db.execute("DELETE FROM quizzes");
  await db.execute("DELETE FROM lessons");
  await db.execute("DELETE FROM tracks");
  await db.execute("DELETE FROM ai_tutors");

  // Create AI Tutors using raw SQL (using actual database columns)
  const ndtTutorResult = await db.execute(`
    INSERT INTO ai_tutors (name, specialty, description) 
    VALUES ('Dr. Sarah Chen', 'NDT Inspection Specialist', 'Expert in underwater non-destructive testing')
    RETURNING id
  `);
  const ndtTutorId = ndtTutorResult.rows[0].id;

  const dmtTutorResult = await db.execute(`
    INSERT INTO ai_tutors (name, specialty, description) 
    VALUES ('Dr. Michael Rodriguez', 'Emergency Medicine Specialist', 'Diving medical officer')
    RETURNING id
  `);
  const dmtTutorId = dmtTutorResult.rows[0].id;

  // Create Tracks using raw SQL
  const ndtTrackResult = await db.execute(`
    INSERT INTO tracks (title, slug, summary, ai_tutor_id, is_published) 
    VALUES ('NDT Inspection & Testing', 'ndt-inspection', 'Underwater non-destructive testing and inspection', '${ndtTutorId}', true)
    RETURNING id
  `);
  const ndtTrackId = ndtTrackResult.rows[0].id;

  const dmtTrackResult = await db.execute(`
    INSERT INTO tracks (title, slug, summary, ai_tutor_id, is_published) 
    VALUES ('Diver Medic Technician (DMT)', 'diver-medic', 'Emergency medical response for diving operations', '${dmtTutorId}', true)
    RETURNING id
  `);
  const dmtTrackId = dmtTrackResult.rows[0].id;

  // Create NDT Lesson (using actual database columns)
  const ndtLessonResult = await db.execute(`
    INSERT INTO lessons (track_id, title, "order", content, estimated_minutes, is_required) 
    VALUES ('${ndtTrackId}', 'Visual Inspection Fundamentals', 1, 
    '# NDT Visual Inspection Fundamentals

## Grid Pattern Methodology
Systematic grid pattern ensures complete coverage and eliminates missed areas.

## Corrosion Types
- Galvanic corrosion: Most common at dissimilar metal connections
- Pitting corrosion: Localized deep penetration (NOT uniform surface degradation)

## NACE Standards
Minimum cathodic protection: -850 mV (Ag/AgCl reference electrode)', 30, true)
    RETURNING id
  `);
  const ndtLessonId = ndtLessonResult.rows[0].id;

  // Create DMT Lesson
  const dmtLessonResult = await db.execute(`
    INSERT INTO lessons (track_id, title, "order", content, estimated_minutes, is_required) 
    VALUES ('${dmtTrackId}', 'Emergency Response - ABCDE Assessment', 1, 
    '# ABCDE Emergency Assessment Protocol

## Sequence
A: Airway patency assessment
B: Breathing adequacy evaluation  
C: Circulation status check
D: Disability neurological assessment
E: Exposure complete examination

## DCS Classification
Type I: Mild joint pain, lower urgency
Type II: Serious neurological/pulmonary complications, immediate intervention required', 25, true)
    RETURNING id
  `);
  const dmtLessonId = dmtLessonResult.rows[0].id;

  // Create NDT Quiz
  const ndtQuizResult = await db.execute(`
    INSERT INTO quizzes (lesson_id, title, time_limit) 
    VALUES ('${ndtLessonId}', 'NDT Visual Inspection Assessment', 30)
    RETURNING id
  `);
  const ndtQuizId = ndtQuizResult.rows[0].id;

  // NDT Questions (CORRECTLY CATEGORIZED)
  await db.execute(`
    INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") VALUES 
    ('${ndtQuizId}', 'What is the primary advantage of systematic grid pattern inspection methodology?', 'Reduces inspection time', 'Ensures complete systematic coverage and eliminates missed critical areas', 'Minimizes equipment requirements', 'Reduces diver fatigue', 'b', 1),
    ('${ndtQuizId}', 'Which corrosion type is most commonly associated with dissimilar metal connections?', 'General corrosion', 'Pitting corrosion', 'Galvanic corrosion', 'Crevice corrosion', 'c', 2),
    ('${ndtQuizId}', 'According to NACE standards, what is the minimum cathodic protection potential for steel in seawater?', '-750 mV (Ag/AgCl)', '-850 mV (Ag/AgCl)', '-950 mV (Ag/AgCl)', '-650 mV (Ag/AgCl)', 'b', 3)
  `);

  // Create DMT Quiz
  const dmtQuizResult = await db.execute(`
    INSERT INTO quizzes (lesson_id, title, time_limit) 
    VALUES ('${dmtLessonId}', 'DMT Emergency Response Assessment', 25)
    RETURNING id
  `);
  const dmtQuizId = dmtQuizResult.rows[0].id;

  // DMT Questions (CORRECTLY CATEGORIZED)
  await db.execute(`
    INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") VALUES 
    ('${dmtQuizId}', 'What is the correct ABCDE sequence for diving emergencies?', 'Airway, Breathing, Circulation, Disability, Exposure assessment with stabilization', 'Alert level, Blood pressure, CPR, Drug administration, Emergency transport', 'Ascent verification, Buoyancy control, Communication check, Depth monitoring, Evacuation', 'Assessment priority, Basic life support, Clinical evaluation, Diagnostic testing, Emergency procedures', 'a', 1),
    ('${dmtQuizId}', 'What is the primary difference between Type I and Type II decompression sickness?', 'Type I affects joints only, Type II affects pulmonary only', 'Type I involves mild joint pain with lower urgency, Type II involves serious neurological/pulmonary complications requiring immediate intervention', 'Type I occurs at shallow depths, Type II at deep depths only', 'Type I responds to surface oxygen, Type II requires surgery', 'b', 2),
    ('${dmtQuizId}', 'What is the optimal positioning and treatment for arterial gas embolism (AGE)?', 'Upright with standard oxygen', 'Left lateral recumbent position with high-flow oxygen and urgent hyperbaric evacuation', 'Prone with mechanical ventilation', 'Right lateral with delayed transport', 'b', 3)
  `);

  console.log('✅ Database-compatible seed completed successfully!');
  
  const trackCount = await db.execute("SELECT COUNT(*) FROM tracks");
  const lessonCount = await db.execute("SELECT COUNT(*) FROM lessons");
  const quizCount = await db.execute("SELECT COUNT(*) FROM quizzes");
  const questionCount = await db.execute("SELECT COUNT(*) FROM questions");
  
  console.log(`Created ${trackCount.rows[0].count} tracks`);
  console.log(`Created ${lessonCount.rows[0].count} lessons`);
  console.log(`Created ${quizCount.rows[0].count} quizzes`);
  console.log(`Created ${questionCount.rows[0].count} properly categorized questions`);
  
  console.log('\n✅ QUESTION CATEGORIZATION FIXED:');
  console.log('NDT Track: Visual inspection, corrosion, cathodic protection questions ONLY');
  console.log('DMT Track: ABCDE protocol, DCS, AGE emergency management questions ONLY');
  console.log('NO MORE MIXED CATEGORIZATION!');
}

databaseCompatibleSeed().catch(console.error).finally(() => process.exit(0));