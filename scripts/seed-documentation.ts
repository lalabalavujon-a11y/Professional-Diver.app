#!/usr/bin/env tsx

/**
 * Seed Initial Documentation Content
 * 
 * This script seeds the documentation_sections table with initial content
 * from the static documentation sections defined in the support-documents page.
 * Run this after creating the documentation tables.
 */

import 'dotenv/config';
import { db } from '../server/db';
import { documentationSections } from '../shared/schema-sqlite';
import { eq } from 'drizzle-orm';

// Initial documentation sections (from static content)
const initialSections = [
  {
    sectionId: 'platform-overview',
    category: 'Getting Started',
    title: 'Platform Overview',
    content: 'The Professional Diver Training Platform is a comprehensive learning management system designed for commercial diving professionals. The platform offers 9 specialized training tracks covering Non-Destructive Testing (NDT), Life Support Technician (LST), Assistant Life Support Technician (ALST), Dive Medical Technician (DMT), Commercial Supervisor, Saturation Diving, Underwater Welding, Hyperbaric Operations, and Air Diver Certification.',
    keywords: JSON.stringify(['overview', 'platform', 'introduction', 'what is', 'about']),
    relatedLinks: JSON.stringify([
      { label: 'Training Tracks', href: '/tracks' },
      { label: 'Start Free Trial', href: '/trial-signup' }
    ]),
    subsections: JSON.stringify([]),
    updatedBy: 'system',
    changeType: 'content',
  },
  {
    sectionId: 'account-setup',
    category: 'Getting Started',
    title: 'Account Setup',
    content: 'To create an account, visit the trial signup page and provide your email address, name, and password. You\'ll receive a confirmation email to verify your account. Once verified, you can log in and start exploring the platform. Your trial account gives you access to all features for a limited period.',
    keywords: JSON.stringify(['account', 'setup', 'signup', 'register', 'create account', 'trial']),
    relatedLinks: JSON.stringify([
      { label: 'Trial Signup', href: '/trial-signup' },
      { label: 'Login', href: '/login' }
    ]),
    subsections: JSON.stringify([]),
    updatedBy: 'system',
    changeType: 'content',
  },
  {
    sectionId: 'first-login',
    category: 'Getting Started',
    title: 'First Login Guide',
    content: 'After logging in for the first time, you\'ll be directed to your home dashboard. Take a moment to explore the navigation menu on the left side. Update your profile by clicking on your profile picture in the top right corner. Navigate to the Training section to view available tracks, or start with the Professional Exams dashboard to see certification options.',
    keywords: JSON.stringify(['first login', 'getting started', 'dashboard', 'home', 'profile']),
    relatedLinks: JSON.stringify([
      { label: 'Home Dashboard', href: '/home' },
      { label: 'Profile Settings', href: '/profile-settings' }
    ]),
    subsections: JSON.stringify([]),
    updatedBy: 'system',
    changeType: 'content',
  },
  {
    sectionId: 'profile-setup',
    category: 'Getting Started',
    title: 'Profile Setup',
    content: 'Your profile contains important information about your account. Access it by clicking your profile picture in the top right corner. You can update your name, email, profile picture, timezone preferences, and notification settings. Complete profiles help us provide better personalized recommendations and support.',
    keywords: JSON.stringify(['profile', 'settings', 'preferences', 'account settings', 'user info']),
    relatedLinks: JSON.stringify([
      { label: 'Profile Settings', href: '/profile-settings' }
    ]),
    subsections: JSON.stringify([]),
    updatedBy: 'system',
    changeType: 'content',
  },
  {
    sectionId: 'training-tracks',
    category: 'Learning Features',
    title: 'Training Tracks',
    content: 'The platform offers 9 comprehensive training tracks, each designed for specific professional diving roles. Each track contains multiple lessons with interactive content, quizzes, and practical exercises. Tracks are organized by difficulty level (Beginner, Intermediate, Advanced, Expert) and estimated completion time.',
    keywords: JSON.stringify(['tracks', 'courses', 'training', 'lessons', 'curriculum', 'learning paths']),
    relatedLinks: JSON.stringify([
      { label: 'View All Tracks', href: '/tracks' },
      { label: 'Learning Path', href: '/learning-path' }
    ]),
    subsections: JSON.stringify([
      {
        title: 'Available Tracks',
        content: '1. NDT Inspection & Testing\n2. Life Support Technician (LST)\n3. Assistant Life Support Technician (ALST)\n4. Dive Medical Technician (DMT)\n5. Commercial Dive Supervisor\n6. Saturation Diving\n7. Underwater Welding\n8. Hyperbaric Operations\n9. Air Diver Certification'
      },
      {
        title: 'Track Features',
        content: 'Each track includes: interactive lessons with markdown content, podcast audio support, PDF reference guides, Notebook LM integration, progress tracking, completion certificates, and AI tutor support.'
      }
    ]),
    updatedBy: 'system',
    changeType: 'content',
  },
  {
    sectionId: 'laura-oracle',
    category: 'AI Features',
    title: 'Laura Platform Oracle',
    content: 'Laura is the Platform Oracle AI Assistant with comprehensive knowledge of all platform features, operations, and administration. She can help with account questions, technical issues, feature guidance, and platform optimization. Laura operates from the LangSmith domain and continuously learns from platform interactions. Laura has complete administrative knowledge and can execute platform management tasks, monitor performance, and provide comprehensive platform guidance.',
    keywords: JSON.stringify(['laura', 'oracle', 'ai assistant', 'help', 'support', 'chat']),
    relatedLinks: JSON.stringify([
      { label: 'Chat with Laura', href: '/chat/laura' }
    ]),
    subsections: JSON.stringify([
      {
        title: 'Capabilities',
        content: 'Platform administration guidance, support ticket handling, platform analytics, troubleshooting assistance, feature explanations, account management help, and system health monitoring.'
      },
      {
        title: 'Voice Features',
        content: 'Laura supports text-to-speech responses using OpenAI TTS with the Alloy voice. You can toggle voice on/off and control playback. Voice responses are particularly helpful for hands-free learning.'
      }
    ]),
    updatedBy: 'laura',
    changeType: 'ai',
  },
  {
    sectionId: 'ai-tutors',
    category: 'AI Features',
    title: 'AI Tutors (9 Discipline Experts)',
    content: 'The platform features 9 specialized AI tutors, each an expert in their respective discipline. These tutors provide personalized guidance and answer questions related to their specific areas of expertise. Available tutors include: Sarah (NDT), Maria (LST), Elena (ALST), James (DMT), David (Commercial Supervisor), Marcus (Saturation), Lisa (Underwater Welding), Michael (Hyperbaric), and Michael (Air Diving).',
    keywords: JSON.stringify(['ai tutors', 'tutors', 'sarah', 'maria', 'elena', 'james', 'david', 'marcus', 'lisa', 'michael', 'help']),
    relatedLinks: JSON.stringify([
      { label: 'Training Tracks', href: '/tracks' }
    ]),
    subsections: JSON.stringify([
      {
        title: 'Available Tutors',
        content: 'Sarah (NDT) - Non-Destructive Testing and Inspection\nMaria (LST) - Life Support Technician\nElena (ALST) - Assistant Life Support Technician\nJames (DMT) - Dive Medical Technician\nDavid - Commercial Dive Supervisor\nMarcus - Saturation Diving Systems\nLisa - Underwater Welding Operations\nMichael (Hyperbaric) - Hyperbaric Operations\nMichael (Air Diving) - Air Diver Certification / Diving Physics'
      },
      {
        title: 'Using AI Tutors',
        content: 'AI tutors are automatically available when viewing lessons in their respective tracks. You can ask questions about course content, get explanations, request examples, and receive personalized guidance. Each tutor has comprehensive knowledge of their discipline.'
      }
    ]),
    updatedBy: 'system',
    changeType: 'ai',
  },
  {
    sectionId: 'diver-well',
    category: 'AI Features',
    title: 'Diver Well Operations Consultant',
    content: 'Diver Well is an AI Operations Consultant specializing in commercial diving operations. She provides expert guidance on dive planning, safety protocols, equipment selection, industry regulations, and operational best practices. Diver Well is ideal for dive supervisors and operations managers.',
    keywords: JSON.stringify(['diver well', 'operations', 'consultant', 'dive planning', 'safety', 'operations']),
    relatedLinks: JSON.stringify([
      { label: 'Chat with Diver Well', href: '/chat/diver-well' }
    ]),
    subsections: JSON.stringify([]),
    updatedBy: 'system',
    changeType: 'ai',
  },
  {
    sectionId: 'support-tickets',
    category: 'Support & Help',
    title: 'Creating Support Tickets',
    content: 'To create a support ticket, visit the Contact page or Support Tickets page. Fill out the form with your name, email, subject, message, and priority level. Support tickets are automatically assigned to the support team, and you\'ll receive email confirmations and responses.',
    keywords: JSON.stringify(['support', 'tickets', 'help', 'contact', 'issues']),
    relatedLinks: JSON.stringify([
      { label: 'Contact Support', href: '/contact' },
      { label: 'Support Tickets', href: '/support-tickets' }
    ]),
    subsections: JSON.stringify([]),
    updatedBy: 'system',
    changeType: 'content',
  },
  {
    sectionId: 'lessons-content',
    category: 'Learning Features',
    title: 'Lessons & Content',
    content: 'Lessons are the core learning units in each track. Each lesson contains markdown-formatted content with rich media support including videos, images, PDFs, and podcasts. Lessons have clear learning objectives and are designed to build upon each other sequentially.',
    keywords: JSON.stringify(['lessons', 'content', 'learning', 'materials', 'courses', 'study']),
    relatedLinks: JSON.stringify([
      { label: 'Browse Tracks', href: '/tracks' }
    ]),
    subsections: JSON.stringify([
      {
        title: 'Lesson Features',
        content: 'Interactive markdown content, podcast audio support (M4A format), PDF reference guides, Notebook LM integration for AI-powered learning assistance, estimated completion time, required vs. optional lessons, progress tracking, and completion certificates.'
      },
      {
        title: 'Accessing Lessons',
        content: 'Navigate to a track detail page to see all lessons in that track. Click on any lesson to view its content. Complete lessons to unlock subsequent content. Your progress is automatically saved as you work through lessons.'
      }
    ]),
    updatedBy: 'system',
    changeType: 'content',
  },
  {
    sectionId: 'quizzes-exams',
    category: 'Learning Features',
    title: 'Quizzes & Exams',
    content: 'Quizzes accompany most lessons to test your understanding. Professional exams are comprehensive assessments covering entire tracks. Quizzes have time limits and passing scores, while exams are more rigorous and may be required for certification.',
    keywords: JSON.stringify(['quizzes', 'exams', 'tests', 'assessments', 'certification', 'questions']),
    relatedLinks: JSON.stringify([
      { label: 'Professional Exams', href: '/exams' },
      { label: 'Dashboard', href: '/dashboard' }
    ]),
    subsections: JSON.stringify([
      {
        title: 'Quiz Types',
        content: 'Practice Quizzes: Self-assessment with immediate feedback\nLesson Quizzes: Required to complete lessons\nExams: Comprehensive professional certification assessments'
      }
    ]),
    updatedBy: 'system',
    changeType: 'content',
  },
  {
    sectionId: 'operations-calendar',
    category: 'Platform Features',
    title: 'Operations Calendar',
    content: 'The Operations Calendar helps you schedule and track dive operations, inspections, maintenance, training sessions, and other activities. You can create calendar events, share calendars with team members, sync with external calendar systems, and set reminders.',
    keywords: JSON.stringify(['calendar', 'operations', 'schedule', 'events', 'planning']),
    relatedLinks: JSON.stringify([
      { label: 'Operations Calendar', href: '/operations' }
    ]),
    subsections: JSON.stringify([]),
    updatedBy: 'system',
    changeType: 'feature',
  },
  {
    sectionId: 'subscription-types',
    category: 'Account & Billing',
    title: 'Subscription Types',
    content: 'The platform offers several subscription options: Trial (limited time access), Monthly (recurring monthly subscription), Annual (yearly subscription with savings), Lifetime (one-time payment for permanent access), Affiliate (for partners), and Enterprise (for organizations).',
    keywords: JSON.stringify(['subscription', 'billing', 'plans', 'pricing', 'payment']),
    relatedLinks: JSON.stringify([
      { label: 'Profile Settings', href: '/profile-settings' }
    ]),
    subsections: JSON.stringify([]),
    updatedBy: 'system',
    changeType: 'content',
  },
  {
    sectionId: 'api-endpoints',
    category: 'Technical Information',
    title: 'API Endpoints Overview',
    content: 'The platform provides RESTful API endpoints for authentication, user management, content access, AI services, support tickets, CRM operations, and more. API documentation is available for developers. Key endpoints include /api/auth/*, /api/users/*, /api/tracks/*, /api/laura-oracle/*, and /api/support/*.',
    keywords: JSON.stringify(['api', 'endpoints', 'developer', 'integration', 'technical']),
    relatedLinks: JSON.stringify([]),
    subsections: JSON.stringify([]),
    updatedBy: 'system',
    changeType: 'api',
  },
];

async function seedDocumentation() {
  console.log('🌱 Seeding initial documentation content...');

  try {
    let seededCount = 0;
    let skippedCount = 0;

    for (const section of initialSections) {
      // Check if section already exists
      const existing = await db.select()
        .from(documentationSections)
        .where(eq(documentationSections.sectionId, section.sectionId))
        .limit(1);

      if (existing.length > 0) {
        console.log(`⏭️  Section "${section.sectionId}" already exists, skipping...`);
        skippedCount++;
        continue;
      }

      // Insert new section
      await db.insert(documentationSections).values({
        sectionId: section.sectionId,
        category: section.category,
        title: section.title,
        content: section.content,
        subsections: section.subsections,
        relatedLinks: section.relatedLinks,
        keywords: section.keywords,
        version: 1,
        updatedBy: section.updatedBy,
        changeType: section.changeType,
        isActive: true,
        lastUpdated: new Date(),
        createdAt: new Date(),
      });

      console.log(`✅ Seeded section: ${section.title}`);
      seededCount++;
    }

    console.log(`\n✅ Documentation seeding complete!`);
    console.log(`   - Seeded: ${seededCount} sections`);
    console.log(`   - Skipped: ${skippedCount} existing sections`);
    console.log(`   - Total: ${initialSections.length} sections\n`);

  } catch (error) {
    console.error('❌ Error seeding documentation:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDocumentation()
    .then(() => {
      console.log('✅ Seed script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    });
}

export default seedDocumentation;

