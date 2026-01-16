#!/usr/bin/env tsx
/**
 * Generate brand-neutral, industry-standard content for all tracks (9) × 12 lessons (108 total).
 * - Uses OpenAI GPT-4o for content + quiz generation
 * - Does not auto-generate PDFs or podcasts (handled by services)
 */

import 'dotenv/config';
import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';
import ContentGeneratorService, {
  type TrackDefinition,
  type LessonOutline,
} from '../server/services/content-generator.js';

const generator = new ContentGeneratorService();

const TRACKS: TrackDefinition[] = [
  {
    slug: 'ndt-inspection',
    title: 'NDT Inspection & Testing',
    standards: ['AWS D3.6M', 'NACE', 'ASTM E1316', 'IMCA D 014', 'API RP 2A'],
    certification: 'NDT Inspector Certification',
    tutorName: 'Sarah (NDT)',
  },
  {
    slug: 'diver-medic',
    title: 'Diver Medic Technician',
    standards: ['UHMS', 'DMT Certification', 'US Navy Treatment Tables', 'Emergency Medical Protocols'],
    certification: 'Diver Medic Technician',
    tutorName: 'James (DMT)',
  },
  {
    slug: 'commercial-supervisor',
    title: 'Commercial Dive Supervisor',
    standards: ['HSE DWR 1997', 'ADCI Consensus Standards', 'IMCA D 018', 'OSHA 29 CFR 1910.410'],
    certification: 'Commercial Dive Supervisor',
    tutorName: 'David (Commercial Supervisor)',
  },
  {
    slug: 'saturation-diving',
    title: 'Saturation Diving Systems',
    standards: ['IMCA Saturation Guidelines', 'HSE Saturation Requirements', 'Life Support Standards'],
    certification: 'Saturation Diver',
    tutorName: 'Marcus (Saturation)',
  },
  {
    slug: 'underwater-welding',
    title: 'Underwater Welding',
    standards: ['AWS D3.6M', 'API Standards', 'Quality Control Requirements'],
    certification: 'Underwater Welder',
    tutorName: 'Lisa (Welding)',
  },
  {
    slug: 'hyperbaric-operations',
    title: 'Hyperbaric Operations',
    standards: ['UHMS Standards', 'Treatment Table Protocols', 'Chamber Operation Standards'],
    certification: 'Hyperbaric Operator',
    tutorName: 'Michael (Hyperbaric)',
  },
  {
    slug: 'alst',
    title: 'Assistant Life Support Technician',
    standards: ['IMCA Life Support Guidelines', 'HSE Part IV', 'Gas Management Standards'],
    certification: 'Assistant Life Support Technician',
    tutorName: 'Elena (ALST)',
  },
  {
    slug: 'lst',
    title: 'Life Support Technician',
    standards: ['IMCA Life Support Guidelines', 'HSE Part IV', 'Advanced Life Support Standards'],
    certification: 'Life Support Technician',
    tutorName: 'Maria (LST)',
  },
  {
    slug: 'air-diver-certification',
    title: 'Air Diver Certification',
    standards: ['HSE Part I', 'US Navy Diving Manual Rev 7', 'Decompression Tables'],
    certification: 'Air Diver',
    tutorName: 'Michael (Air Diving)',
  },
];

const OUTLINES: Record<string, LessonOutline[]> = {
  'ndt-inspection': [
    'Visual Inspection Fundamentals & Industry Standards',
    'Magnetic Particle Testing (MPT) Procedures',
    'Ultrasonic Thickness Gauging Techniques',
    'Corrosion Assessment & Classification',
    'Cathodic Protection Survey Methods',
    'Documentation Standards & Reporting',
    'Quality Assurance & Control Systems',
    'Safety Protocols & Risk Management',
    'Advanced Inspection Techniques',
    'Equipment Calibration & Maintenance',
    'Real-World Application Scenarios',
    'Final Assessment & Certification Preparation',
  ].map((title, idx) => ({ trackSlug: 'ndt-inspection', title, order: idx + 1, isFinal: idx === 11 })),
  'diver-medic': [
    'Emergency Assessment Fundamentals (ABCDE)',
    'Respiratory System & Airway Management',
    'Circulatory System & Shock Management',
    'Diving Injuries & Decompression Sickness',
    'Hyperbaric Treatment Protocols',
    'Emergency Medical Equipment & Procedures',
    'Patient Assessment & Monitoring',
    'Medical Documentation & Reporting',
    'Advanced Life Support Techniques',
    'Emergency Response Coordination',
    'Real-World Medical Scenarios',
    'Final Assessment & Certification Preparation',
  ].map((title, idx) => ({ trackSlug: 'diver-medic', title, order: idx + 1, isFinal: idx === 11 })),
  'commercial-supervisor': [
    'Dive Planning Fundamentals & Risk Assessment',
    'Hazard Identification & Control Measures',
    'Team Management & Communication Protocols',
    'Emergency Response & Crisis Management',
    'Quality Assurance & Documentation Standards',
    'Regulatory Compliance (HSE, ADCI, IMCA)',
    'Project Management & Planning',
    'Safety Systems & Procedures',
    'Advanced Leadership & Decision Making',
    'Incident Investigation & Reporting',
    'Real-World Supervisor Scenarios',
    'Final Assessment & Certification Preparation',
  ].map((title, idx) => ({ trackSlug: 'commercial-supervisor', title, order: idx + 1, isFinal: idx === 11 })),
  'saturation-diving': [
    'Life Support System Fundamentals',
    'Gas Management & Analysis Procedures',
    'Decompression Management & Tables',
    'Human Factors in Confined Environments',
    'Emergency Procedures & Evacuation',
    'System Maintenance & Troubleshooting',
    'Bell Operations & Lockout Procedures',
    'Medical Support & Monitoring',
    'Advanced Saturation Operations',
    'Quality Control & Documentation',
    'Real-World Saturation Scenarios',
    'Final Assessment & Certification Preparation',
  ].map((title, idx) => ({ trackSlug: 'saturation-diving', title, order: idx + 1, isFinal: idx === 11 })),
  'underwater-welding': [
    'Welding Fundamentals & Principles',
    'Electrode Selection & Preparation',
    'Quality Control & Inspection Standards',
    'Safety Protocols & Procedures',
    'Advanced Welding Techniques',
    'Weld Defect Identification & Repair',
    'Equipment Operation & Maintenance',
    'AWS D3.6M Code Compliance',
    'Environmental Considerations',
    'Documentation & Certification',
    'Real-World Welding Scenarios',
    'Final Assessment & Certification Preparation',
  ].map((title, idx) => ({ trackSlug: 'underwater-welding', title, order: idx + 1, isFinal: idx === 11 })),
  'hyperbaric-operations': [
    'Chamber Operations Fundamentals',
    'Treatment Protocols & Procedures',
    'Patient Monitoring & Care',
    'Emergency Procedures & Response',
    'Equipment Maintenance & Calibration',
    'Gas Management & Analysis',
    'Safety Systems & Protocols',
    'UHMS Standards & Compliance',
    'Advanced Treatment Techniques',
    'Quality Assurance & Documentation',
    'Real-World Hyperbaric Scenarios',
    'Final Assessment & Certification Preparation',
  ].map((title, idx) => ({ trackSlug: 'hyperbaric-operations', title, order: idx + 1, isFinal: idx === 11 })),
  alst: [
    'Life Support System Fundamentals',
    'Equipment Operation & Maintenance',
    'Emergency Response Procedures',
    'Safety Protocols & Procedures',
    'Gas Management Basics',
    'Environmental Control Systems',
    'Communication & Documentation',
    'Basic Troubleshooting',
    'Team Coordination',
    'Quality Control Basics',
    'Real-World ALST Scenarios',
    'Final Assessment & Certification Preparation',
  ].map((title, idx) => ({ trackSlug: 'alst', title, order: idx + 1, isFinal: idx === 11 })),
  lst: [
    'Advanced Life Support Fundamentals',
    'Gas Management & Mixing Procedures',
    'Emergency Response & Crisis Management',
    'Advanced Equipment Operations',
    'Safety Systems & Protocols',
    'Team Leadership & Coordination',
    'Troubleshooting & Problem Solving',
    'Quality Assurance & Control',
    'Advanced Gas Analysis',
    'System Design & Optimization',
    'Real-World LST Scenarios',
    'Final Assessment & Certification Preparation',
  ].map((title, idx) => ({ trackSlug: 'lst', title, order: idx + 1, isFinal: idx === 11 })),
  'air-diver-certification': [
    'Diving Physics Fundamentals',
    'Gas Laws & Pressure Effects',
    'Decompression Theory & Tables',
    'Safety Calculations & Planning',
    'Equipment Physics & Principles',
    'Ascent Procedures & Safety Stops',
    'Emergency Procedures',
    'US Navy Tables Application',
    'Equipment Operation & Safety',
    'Documentation & Logging',
    'Real-World Air Diving Scenarios',
    'Final Assessment & Certification Preparation',
  ].map((title, idx) => ({ trackSlug: 'air-diver-certification', title, order: idx + 1, isFinal: idx === 11 })),
};

async function main() {
  console.log('🚀 Generating all lessons (9 tracks × 12 lessons)...');

  for (const track of TRACKS) {
    const trackRows = await db.select().from(tracks).where(eq(tracks.slug, track.slug)).limit(1);
    if (!trackRows.length) {
      console.warn(`⚠️ Track not found in DB: ${track.slug}. Skipping.`);
      continue;
    }
    const trackRow = trackRows[0];
    const outlines = OUTLINES[track.slug];
    if (!outlines) {
      console.warn(`⚠️ No outlines for track: ${track.slug}. Skipping.`);
      continue;
    }

    console.log(`\n📘 Track: ${track.title} (${track.slug})`);

    for (const outline of outlines) {
      const exists = await db
        .select()
        .from(lessons)
        .where(and(eq(lessons.trackId, trackRow.id), eq(lessons.order, outline.order)))
        .limit(1);
      if (exists.length) {
        console.log(`   ✓ Lesson ${outline.order} exists: ${outline.title}`);
        continue;
      }

      console.log(`   ✏️  Generating Lesson ${outline.order}: ${outline.title}`);
      const generated = await generator.generateLesson(track, outline, outlines.length);

      const [lessonRow] = await db
        .insert(lessons)
        .values({
          trackId: trackRow.id,
          title: outline.title,
          order: outline.order,
          content: generated.content,
          objectives: JSON.stringify(generated.objectives),
          estimatedMinutes: generated.estimatedMinutes,
          isRequired: true,
        })
        .returning();

      const [quizRow] = await db
        .insert(quizzes)
        .values({
          lessonId: lessonRow.id,
          title: generated.quiz.title,
          timeLimit: generated.quiz.timeLimit,
          examType: generated.quiz.examType,
          passingScore: generated.quiz.passingScore,
        })
        .returning();

      for (let idx = 0; idx < generated.quiz.questions.length; idx++) {
        const q = generated.quiz.questions[idx];
        await db.insert(questions).values({
          quizId: quizRow.id,
          prompt: q.prompt,
          options: JSON.stringify(q.options),
          correctAnswer: q.correctAnswer,
          order: idx + 1,
        });
      }

      console.log(
        `   ✅ Created lesson, quiz, and ${generated.quiz.questions.length} questions for ${outline.title}`
      );
    }
  }

  console.log('\n🎉 Content generation complete.');
}

main().catch((err) => {
  console.error('❌ Generation failed:', err);
  process.exit(1);
});
