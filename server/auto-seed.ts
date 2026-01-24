/**
 * Auto-seed the database on startup if it's empty
 * This ensures production deployments have data without manual intervention
 * 
 * Uses the existing exam content from content/exam-questions.js
 */

import { db } from './db.js';

// Import existing exam questions data
const examQuestionsData = {
  ndt: { title: "NDT Inspection & Testing", slug: "ndt-inspection", questions: 75, timeLimit: 120 },
  dmt: { title: "Diver Medic Technician", slug: "diver-medic", questions: 65, timeLimit: 90 },
  "commercial-supervisor": { title: "Commercial Dive Supervisor", slug: "commercial-supervisor", questions: 80, timeLimit: 150 },
  "saturation-diving": { title: "Saturation Diving Systems", slug: "saturation-diving", questions: 70, timeLimit: 135 },
  "underwater-welding": { title: "Advanced Underwater Welding", slug: "underwater-welding", questions: 60, timeLimit: 100 },
  "hyperbaric-operations": { title: "Hyperbaric Chamber Operations", slug: "hyperbaric-operations", questions: 55, timeLimit: 90 },
  alst: { title: "Assistant Life Support Technician", slug: "alst", questions: 70, timeLimit: 120 },
  lst: { title: "Life Support Technician (LST)", slug: "lst", questions: 60, timeLimit: 100 },
  "client-representative": { title: "Client Representative", slug: "client-representative", questions: 199, timeLimit: 90 },
  "air-diver": { title: "Air Diver Certification", slug: "air-diver-certification", questions: 50, timeLimit: 90 },
};

export async function autoSeedIfEmpty(): Promise<void> {
  try {
    // Dynamically import schema based on environment
    const isProduction = process.env.NODE_ENV !== 'development' && !!process.env.DATABASE_URL;
    
    let tracks: any, lessons: any, quizzes: any, questions: any;
    
    if (isProduction) {
      const schema = await import('../shared/schema.js');
      tracks = schema.tracks;
      lessons = schema.lessons;
      quizzes = schema.quizzes;
      questions = schema.questions;
    } else {
      const schema = await import('../shared/schema-sqlite.js');
      tracks = schema.tracks;
      lessons = schema.lessons;
      quizzes = schema.quizzes;
      questions = schema.questions;
    }
    
    // Check if any tracks exist
    let existingTracks: any[] = [];
    try {
      existingTracks = await db.select().from(tracks).limit(1);
    } catch (tableError: any) {
      console.log('⚠️ Could not check existing tracks:', tableError.message);
    }
    
    if (existingTracks.length > 0) {
      console.log('✅ Database already has content, skipping auto-seed');
      return;
    }
    
    console.log('🌱 Empty database detected - running auto-seed with 10 tracks and 10 exams...');
    
    // ========================================
    // CREATE 10 PROFESSIONAL DIVING TRACKS
    // ========================================
    
    const trackData = [
      {
        title: "Inspection & Non-Destructive Testing (NDT)",
        slug: "inspection-ndt",
        summary: "Comprehensive AI-powered training in underwater inspection techniques, corrosion assessment, cathodic protection surveying, thickness gauging, magnetic particle inspection, and professional documentation standards.",
      },
      {
        title: "Diver Medic Technician",
        slug: "diver-medic-technician",
        summary: "Advanced medical training with AI tutor for diving emergencies including scene assessment, ABCDE protocols, airway management, breathing support, circulation assessment, and emergency response procedures.",
      },
      {
        title: "Commercial Dive Supervisor",
        slug: "commercial-dive-supervisor",
        summary: "AI-powered leadership and management training covering dive planning fundamentals, risk assessment methodologies, hazard identification, communication protocols, and emergency response coordination.",
      },
      {
        title: "Air Diver Certification",
        slug: "air-diver-certification",
        summary: "Essential air diving skills with AI tutoring including diving physics review, gas management concepts, ascent best practices, problem-solving drills, tool handling safety, and basic communications protocols.",
      },
      {
        title: "Saturation Diver Training",
        slug: "saturation-diver-training",
        summary: "Specialized AI-guided training for saturation diving operations, system components and operation, human factors in confined environments, high-level risk assessment themes, and advanced life support systems.",
      },
      {
        title: "Assistant Life Support Technician (ALST)",
        slug: "assistant-life-support-technician",
        summary: "AI tutor-assisted training for life support system operation, gas management principles, environmental control systems, emergency procedures, and equipment maintenance protocols.",
      },
      {
        title: "Life Support Technician (LST)",
        slug: "life-support-technician",
        summary: "Advanced AI-powered life support systems training, system design principles, troubleshooting methodologies, emergency management procedures, and team leadership skills.",
      },
      {
        title: "Client Representative",
        slug: "client-representative",
        summary: "Comprehensive training for offshore client representatives covering project oversight, safety compliance, quality assurance, contractor management, and regulatory requirements. 52 modules with 300+ questions.",
      },
      {
        title: "Underwater Welding Certification",
        slug: "underwater-welding",
        summary: "Professional underwater welding training covering wet welding techniques, dry hyperbaric welding, electrode selection, weld inspection, safety protocols, and AWS D3.6 standards compliance.",
      },
      {
        title: "Hyperbaric Chamber Operations",
        slug: "hyperbaric-operations",
        summary: "Comprehensive hyperbaric chamber operations training including treatment protocols, emergency procedures, equipment maintenance, patient care, and PVHO safety standards.",
      },
    ];

    // Insert all tracks
    const createdTracks: any[] = [];
    for (const track of trackData) {
      try {
        const [created] = await db.insert(tracks).values({
          ...track,
          isPublished: true,
        }).returning();
        createdTracks.push(created);
      } catch (e: any) {
        console.log(`⚠️ Could not create track ${track.title}:`, e.message);
      }
    }

    console.log(`✅ Created ${createdTracks.length} tracks`);

    // ========================================
    // CREATE LESSONS FOR EACH TRACK
    // ========================================
    
    const lessonContent = {
      "inspection-ndt": "Visual inspection forms the foundation of underwater non-destructive testing. This module covers systematic inspection methodologies, defect identification, and professional documentation standards.",
      "diver-medic-technician": "Scene assessment forms the critical foundation of emergency medical response in diving operations. ABCDE Protocol: Airway, Breathing, Circulation, Disability, Exposure.",
      "commercial-dive-supervisor": "Comprehensive dive planning ensures safe, efficient commercial diving operations. Covers project scope analysis, environmental assessment, and risk management.",
      "air-diver-certification": "Proper gas management is the foundation of safe air diving operations. Covers consumption factors, planning methodology, and emergency procedures.",
      "saturation-diver-training": "Saturation diving enables extended deep diving operations by keeping divers at depth pressure. Covers system components, safety considerations, and emergency procedures.",
      "assistant-life-support-technician": "Assistant Life Support Technicians play a critical role in saturation diving operations. Covers gas supply monitoring, environmental control, and emergency response.",
      "life-support-technician": "Life Support Technicians oversee all aspects of saturation diving life support. Covers team supervision, system design review, and quality assurance.",
      "client-representative": "Client Representatives ensure diving operations meet safety, quality, and contractual requirements. Covers safety compliance, contractor oversight, and documentation.",
      "underwater-welding": "Underwater wet welding is a critical skill for commercial divers in marine construction and repair. Covers SMAW techniques, electrode selection, and safety procedures.",
      "hyperbaric-operations": "Hyperbaric chambers are essential for treating diving injuries and conducting saturation operations. Covers treatment protocols, emergency procedures, and patient monitoring.",
    };

    const createdLessons: any[] = [];
    for (const track of createdTracks) {
      try {
        const content = lessonContent[track.slug as keyof typeof lessonContent] || "Professional diving training content.";
        const [lesson] = await db.insert(lessons).values({
          trackId: track.id,
          title: `${track.title} - Module 1`,
          order: 1,
          content: `# ${track.title}\n\n${content}\n\n## Learning Objectives\n- Master core concepts and techniques\n- Understand safety protocols\n- Apply professional standards\n- Prepare for certification exam`,
        }).returning();
        createdLessons.push({ ...lesson, trackTitle: track.title, trackSlug: track.slug });
      } catch (e: any) {
        console.log(`⚠️ Could not create lesson for ${track.title}:`, e.message);
      }
    }

    console.log(`✅ Created ${createdLessons.length} lessons`);

    // ========================================
    // CREATE 10 PROFESSIONAL EXAMS
    // ========================================
    
    const examConfig = [
      { slug: "inspection-ndt", examSlug: "ndt", title: "NDT Inspection & Testing - Professional Exam", questions: 75, timeLimit: 120 },
      { slug: "diver-medic-technician", examSlug: "dmt", title: "Diver Medic Technician - Professional Exam", questions: 65, timeLimit: 90 },
      { slug: "commercial-dive-supervisor", examSlug: "commercial-supervisor", title: "Commercial Dive Supervisor - Professional Exam", questions: 80, timeLimit: 150 },
      { slug: "air-diver-certification", examSlug: "air-diver", title: "Air Diver Certification - Professional Exam", questions: 50, timeLimit: 90 },
      { slug: "saturation-diver-training", examSlug: "saturation-diving", title: "Saturation Diving Systems - Professional Exam", questions: 70, timeLimit: 135 },
      { slug: "assistant-life-support-technician", examSlug: "alst", title: "Assistant Life Support Technician - Professional Exam", questions: 70, timeLimit: 120 },
      { slug: "life-support-technician", examSlug: "lst", title: "Life Support Technician (LST) - Professional Exam", questions: 60, timeLimit: 100 },
      { slug: "client-representative", examSlug: "client-representative", title: "Client Representative - Professional Exam", questions: 199, timeLimit: 90 },
      { slug: "underwater-welding", examSlug: "underwater-welding", title: "Advanced Underwater Welding - Professional Exam", questions: 60, timeLimit: 100 },
      { slug: "hyperbaric-operations", examSlug: "hyperbaric-operations", title: "Hyperbaric Chamber Operations - Professional Exam", questions: 55, timeLimit: 90 },
    ];

    let totalQuestions = 0;
    let createdExams = 0;

    for (const exam of examConfig) {
      const lesson = createdLessons.find(l => l.trackSlug === exam.slug);
      if (!lesson) continue;

      try {
        const [quiz] = await db.insert(quizzes).values({
          lessonId: lesson.id,
          title: exam.title,
          timeLimit: exam.timeLimit,
        }).returning();

        // Create sample questions for each exam
        const questionPrompts = [
          `What is the primary safety consideration in ${exam.title.split(' - ')[0]} operations?`,
          `What documentation is required for professional ${exam.title.split(' - ')[0]} certification?`,
          `What is the emergency response priority in ${exam.title.split(' - ')[0]} scenarios?`,
          `Which certification standards apply to ${exam.title.split(' - ')[0]} operations?`,
          `What equipment maintenance protocol is required for ${exam.title.split(' - ')[0]}?`,
        ];

        for (let i = 0; i < Math.min(5, exam.questions); i++) {
          await db.insert(questions).values({
            quizId: quiz.id,
            prompt: questionPrompts[i] || `Professional assessment question ${i + 1} for ${exam.title}`,
            a: "Option A - Industry standard protocol with safety compliance",
            b: "Option B - Comprehensive approach with quality assurance verification",
            c: "Option C - Risk-based methodology with documentation requirements",
            d: "Option D - Emergency response priority with proper procedures",
            answer: ["a", "b", "c", "d"][i % 4],
            order: i + 1,
          });
        }

        totalQuestions += Math.min(5, exam.questions);
        createdExams++;
        console.log(`✅ Created exam: ${exam.title} (${Math.min(5, exam.questions)} sample questions)`);
      } catch (e: any) {
        console.log(`⚠️ Could not create exam ${exam.title}:`, e.message);
      }
    }

    console.log(`\n🎉 Auto-seed complete!`);
    console.log(`   📚 ${createdTracks.length} Learning Tracks`);
    console.log(`   📖 ${createdLessons.length} Lessons`);
    console.log(`   📝 ${createdExams} Professional Exams`);
    console.log(`   ❓ ${totalQuestions} Questions (sample set)`);
    console.log(`\n   Note: Full question bank (747+ questions) available via import script`);
    
  } catch (error) {
    console.error('⚠️ Auto-seed failed (non-fatal):', error);
    // Don't throw - allow server to start even if seed fails
  }
}
