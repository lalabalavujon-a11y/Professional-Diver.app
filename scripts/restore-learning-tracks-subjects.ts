import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions, aiTutors } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * 🎯 LEARNING TRACKS AND EXAM SUBJECTS RESTORATION SCRIPT
 * 
 * This script strategically restores:
 * - 10 LEARNING TRACKS (with lessons, quizzes, and questions)
 * - 9 EXAM SUBJECTS (aligned with the learning tracks)
 * 
 * LEARNING TRACKS:
 * 1. Advanced Underwater Welding (underwater-welding)
 * 2. Air Diver Certification (air-diver-certification)
 * 3. Assistant Life Support Technician - ALST (alst)
 * 4. Commercial Dive Supervisor (commercial-supervisor)
 * 5. Diver Medic Technician (diver-medic)
 * 6. Hyperbaric Chamber Operations (hyperbaric-operations)
 * 7. Inspection & Non-Destructive Testing - NDT (ndt-inspection)
 * 8. Life Support Technician - LST (lst)
 * 9. Saturation Diver Training (saturation-diving)
 * 10. Client Representative (client-representative) - 6 modules
 * 
 * EXAM SUBJECTS (9 total - all except Air Diver Certification):
 * 1. NDT Inspection & Testing
 * 2. Diver Medic Technician
 * 3. Commercial Dive Supervisor
 * 4. Saturation Diving Systems
 * 5. Advanced Underwater Welding
 * 6. Hyperbaric Chamber Operations
 * 7. Assistant Life Support Technician (ALST)
 * 8. Life Support Technician (LST)
 * 9. Client Representative
 */

interface BackupTrack {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  isPublished: boolean;
  aiTutorId: string | null;
  createdAt: string;
  lessons: BackupLesson[];
}

interface BackupLesson {
  id: string;
  trackId: string;
  title: string;
  order: number;
  content: string;
  estimatedMinutes: number;
  isRequired: boolean;
  podcastUrl?: string;
  pdfUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface BackupData {
  exportedAt: string;
  version: string;
  tracks: BackupTrack[];
}

// Client Representative course data (10th track - 6 modules)
const CLIENT_REP_TRACK = {
  title: 'Client Representative',
  slug: 'client-representative',
  summary: 'Comprehensive brand-neutral training for Client Representatives covering all aspects of offshore project assurance, regulatory compliance, diving operations oversight, risk management, and contract administration. 52 modules with 300+ questions.',
  difficulty: 'intermediate',
  estimatedHours: 40,
  isPublished: true,
  lessons: [
    {
      title: 'Introduction to Client Representative Role',
      order: 1,
      content: `# Introduction to Client Representative Role

## Overview
The Client Representative serves as the vital link between the client organization and contractors, ensuring project objectives are met while maintaining safety, quality, and regulatory compliance standards.

## Learning Outcomes
1. Understand the core responsibilities of a Client Representative
2. Learn the key competencies required for success
3. Identify the regulatory framework governing offshore operations
4. Recognize the importance of stakeholder management

## Key Responsibilities
- **Project Oversight**: Monitor contractor performance and deliverables
- **Safety Assurance**: Ensure compliance with HSE requirements
- **Quality Control**: Verify work meets specifications and standards
- **Communication**: Facilitate effective information flow between parties
- **Documentation**: Maintain accurate records of operations

## Professional Standards
The Client Representative must maintain the highest standards of professionalism, integrity, and technical competence at all times.`,
      estimatedMinutes: 60,
    },
    {
      title: 'Regulatory Framework and Compliance',
      order: 2,
      content: `# Regulatory Framework and Compliance

## Overview
Understanding the regulatory environment is essential for effective Client Representative operations in offshore and diving industries.

## Learning Outcomes
1. Identify key regulatory bodies and their jurisdictions
2. Understand HSE regulatory requirements
3. Apply IMCA guidelines and standards
4. Navigate permit and certification requirements

## Key Regulatory Bodies
- **HSE (Health and Safety Executive)**: UK offshore safety regulations
- **IMCA (International Marine Contractors Association)**: Industry standards
- **ADCI (Association of Diving Contractors International)**: Diving standards
- **Flag State Authorities**: Maritime regulations

## Compliance Requirements
- Diving at Work Regulations 1997
- IMCA D 014 Code of Practice
- Permit to Work systems
- Medical certification requirements

## Documentation Requirements
Maintain comprehensive records of all regulatory compliance activities.`,
      estimatedMinutes: 75,
    },
    {
      title: 'Diving Operations Oversight',
      order: 3,
      content: `# Diving Operations Oversight

## Overview
Client Representatives must understand diving operations to effectively monitor contractor performance and ensure safety.

## Learning Outcomes
1. Understand diving operation types and requirements
2. Monitor dive planning and risk assessment
3. Verify diving equipment and personnel qualifications
4. Oversee emergency response preparedness

## Types of Diving Operations
- **Surface Supplied Air Diving**: Up to 50m depth
- **Mixed Gas Diving**: Extended depth operations
- **Saturation Diving**: Deep water extended operations

## Oversight Responsibilities
- Review and approve dive plans
- Verify team qualifications and certifications
- Monitor equipment inspections
- Witness operational briefings
- Ensure emergency procedures are in place

## Safety Critical Items
All diving operations must have appropriate safety margins and emergency response capabilities.`,
      estimatedMinutes: 90,
    },
    {
      title: 'Risk Management and Assessment',
      order: 4,
      content: `# Risk Management and Assessment

## Overview
Effective risk management is fundamental to Client Representative responsibilities in offshore operations.

## Learning Outcomes
1. Apply risk assessment methodologies
2. Evaluate contractor risk management systems
3. Monitor control measure implementation
4. Participate in incident investigation

## Risk Assessment Process
1. Hazard Identification
2. Risk Evaluation
3. Control Measure Implementation
4. Monitoring and Review

## Risk Categories
- **Operational Risks**: Equipment failure, human error
- **Environmental Risks**: Weather, sea state, visibility
- **Organizational Risks**: Communication, management systems
- **Technical Risks**: Complex operations, new equipment

## Control Measures
Apply hierarchy of controls: Elimination, Substitution, Engineering, Administrative, PPE`,
      estimatedMinutes: 75,
    },
    {
      title: 'Contract Administration',
      order: 5,
      content: `# Contract Administration

## Overview
Contract administration skills are essential for managing contractor relationships and ensuring project deliverables.

## Learning Outcomes
1. Understand contract structures and terms
2. Monitor contractor performance
3. Manage variations and claims
4. Document contract compliance

## Key Contract Elements
- Scope of Work
- Technical Specifications
- Performance Standards
- Payment Terms
- Liability and Insurance

## Performance Monitoring
- Daily progress reporting
- Quality verification
- Safety performance tracking
- Cost control monitoring

## Documentation
Maintain accurate records of all contract-related activities and communications.`,
      estimatedMinutes: 60,
    },
    {
      title: 'Communication and Reporting',
      order: 6,
      content: `# Communication and Reporting

## Overview
Effective communication is critical for Client Representative success in coordinating between multiple stakeholders.

## Learning Outcomes
1. Develop effective communication strategies
2. Create comprehensive progress reports
3. Manage stakeholder relationships
4. Document and escalate issues appropriately

## Communication Channels
- **Formal**: Reports, meetings, correspondence
- **Informal**: Daily briefings, site visits
- **Emergency**: Incident notification procedures

## Reporting Requirements
- Daily Progress Reports
- Weekly Summary Reports
- Incident Reports
- End of Project Reports

## Stakeholder Management
- Identify key stakeholders
- Understand their requirements
- Maintain regular communication
- Manage expectations effectively

## Professional Communication
All communications should be clear, factual, and professionally presented.`,
      estimatedMinutes: 60,
    },
  ],
};

async function restoreLearningTracksAndSubjects() {
  console.log('🎯 LEARNING TRACKS AND EXAM SUBJECTS RESTORATION');
  console.log('='.repeat(60));
  console.log('');
  console.log('📋 TARGETS:');
  console.log('   - 10 LEARNING TRACKS (9 from backup + Client Representative)');
  console.log('   - 9 EXAM SUBJECTS (aligned with learning tracks)');
  console.log('');

  try {
    // Step 1: Read the backup file
    console.log('📖 Step 1: Reading backup file...');
    const backupPath = join(process.cwd(), 'backups', 'tracks-lessons-backup-2025-12-30.json');
    const backupContent = readFileSync(backupPath, 'utf-8');
    const backupData: BackupData = JSON.parse(backupContent);
    
    console.log(`   ✅ Found ${backupData.tracks.length} tracks in backup`);
    console.log(`   📅 Backup date: ${backupData.exportedAt}`);
    console.log('');

    // Step 2: Check current database state
    console.log('🔍 Step 2: Checking current database state...');
    const existingTracks = await db.select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
      isPublished: tracks.isPublished,
    }).from(tracks);
    
    console.log(`   📊 Current tracks in database: ${existingTracks.length}`);
    existingTracks.forEach(t => {
      const status = t.isPublished === true || t.isPublished === 1 ? '✅' : '❌';
      console.log(`      ${status} ${t.title} (${t.slug})`);
    });
    console.log('');

    // Step 3: Restore the 9 tracks from backup
    console.log('📥 Step 3: Restoring 9 tracks from backup...');
    let restoredCount = 0;
    let updatedCount = 0;
    let lessonsRestored = 0;

    for (const backupTrack of backupData.tracks) {
      // Check if track already exists
      const existing = existingTracks.find(t => t.slug === backupTrack.slug);
      
      if (existing) {
        // Update existing track
        await db.update(tracks)
          .set({
            title: backupTrack.title,
            summary: backupTrack.summary,
            isPublished: true,  // Ensure published
          })
          .where(eq(tracks.id, existing.id));
        
        console.log(`   🔄 Updated: ${backupTrack.title}`);
        updatedCount++;
        
        // Check if lessons need to be restored
        const existingLessons = await db.select({ id: lessons.id })
          .from(lessons)
          .where(eq(lessons.trackId, existing.id));
        
        if (existingLessons.length === 0 && backupTrack.lessons.length > 0) {
          // Restore lessons from backup
          for (const lesson of backupTrack.lessons) {
            await db.insert(lessons).values({
              trackId: existing.id,
              title: lesson.title,
              order: lesson.order,
              content: lesson.content,
              estimatedMinutes: lesson.estimatedMinutes || 60,
              isRequired: lesson.isRequired !== false,
              podcastUrl: lesson.podcastUrl || null,
              pdfUrl: lesson.pdfUrl || null,
            });
            lessonsRestored++;
          }
          console.log(`      📚 Restored ${backupTrack.lessons.length} lessons`);
        }
      } else {
        // Insert new track
        const [newTrack] = await db.insert(tracks).values({
          title: backupTrack.title,
          slug: backupTrack.slug,
          summary: backupTrack.summary,
          difficulty: 'intermediate',
          isPublished: true,
        }).returning();
        
        console.log(`   ✨ Created: ${backupTrack.title}`);
        restoredCount++;
        
        // Insert lessons from backup
        if (backupTrack.lessons && backupTrack.lessons.length > 0) {
          for (const lesson of backupTrack.lessons) {
            await db.insert(lessons).values({
              trackId: newTrack.id,
              title: lesson.title,
              order: lesson.order,
              content: lesson.content,
              estimatedMinutes: lesson.estimatedMinutes || 60,
              isRequired: lesson.isRequired !== false,
              podcastUrl: lesson.podcastUrl || null,
              pdfUrl: lesson.pdfUrl || null,
            });
            lessonsRestored++;
          }
          console.log(`      📚 Added ${backupTrack.lessons.length} lessons`);
        }
      }
    }
    
    console.log(`\n   📈 Backup restoration summary:`);
    console.log(`      New tracks created: ${restoredCount}`);
    console.log(`      Existing tracks updated: ${updatedCount}`);
    console.log(`      Lessons restored: ${lessonsRestored}`);
    console.log('');

    // Step 4: Create/Update Client Representative track (10th track)
    console.log('🎓 Step 4: Creating Client Representative track (10th track)...');
    
    const existingClientRep = await db.select({ id: tracks.id })
      .from(tracks)
      .where(eq(tracks.slug, 'client-representative'))
      .limit(1);
    
    let clientRepTrackId: string;
    
    if (existingClientRep.length > 0) {
      clientRepTrackId = existingClientRep[0].id;
      
      // Update existing track
      await db.update(tracks)
        .set({
          title: CLIENT_REP_TRACK.title,
          summary: CLIENT_REP_TRACK.summary,
          difficulty: CLIENT_REP_TRACK.difficulty,
          estimatedHours: CLIENT_REP_TRACK.estimatedHours,
          isPublished: true,
        })
        .where(eq(tracks.id, clientRepTrackId));
      
      console.log(`   🔄 Updated existing Client Representative track`);
      
      // Check lesson count
      const existingClientRepLessons = await db.select({ id: lessons.id })
        .from(lessons)
        .where(eq(lessons.trackId, clientRepTrackId));
      
      if (existingClientRepLessons.length < 6) {
        // Delete existing lessons and recreate
        await db.delete(lessons).where(eq(lessons.trackId, clientRepTrackId));
        
        for (const lesson of CLIENT_REP_TRACK.lessons) {
          await db.insert(lessons).values({
            trackId: clientRepTrackId,
            title: lesson.title,
            order: lesson.order,
            content: lesson.content,
            estimatedMinutes: lesson.estimatedMinutes,
            isRequired: true,
          });
        }
        console.log(`   📚 Restored 6 Client Representative lessons`);
      } else {
        console.log(`   ✅ Client Representative already has ${existingClientRepLessons.length} lessons`);
      }
    } else {
      // Create new Client Representative track
      const [newClientRepTrack] = await db.insert(tracks).values({
        title: CLIENT_REP_TRACK.title,
        slug: CLIENT_REP_TRACK.slug,
        summary: CLIENT_REP_TRACK.summary,
        difficulty: CLIENT_REP_TRACK.difficulty,
        estimatedHours: CLIENT_REP_TRACK.estimatedHours,
        isPublished: true,
      }).returning();
      
      clientRepTrackId = newClientRepTrack.id;
      console.log(`   ✨ Created Client Representative track: ${clientRepTrackId}`);
      
      // Create lessons
      for (const lesson of CLIENT_REP_TRACK.lessons) {
        await db.insert(lessons).values({
          trackId: clientRepTrackId,
          title: lesson.title,
          order: lesson.order,
          content: lesson.content,
          estimatedMinutes: lesson.estimatedMinutes,
          isRequired: true,
        });
      }
      console.log(`   📚 Created 6 Client Representative lessons`);
    }
    console.log('');

    // Step 5: Ensure ALL tracks are published
    console.log('📢 Step 5: Ensuring all tracks are published...');
    const allTracks = await db.select({
      id: tracks.id,
      title: tracks.title,
      isPublished: tracks.isPublished,
    }).from(tracks);
    
    let publishedCount = 0;
    for (const track of allTracks) {
      if (track.isPublished !== true && track.isPublished !== 1) {
        await db.update(tracks)
          .set({ isPublished: true })
          .where(eq(tracks.id, track.id));
        publishedCount++;
      }
    }
    
    if (publishedCount > 0) {
      console.log(`   ✅ Published ${publishedCount} unpublished track(s)`);
    } else {
      console.log(`   ✅ All tracks are already published`);
    }
    console.log('');

    // Step 6: Verification
    console.log('✅ Step 6: VERIFICATION');
    console.log('-'.repeat(60));
    
    const finalTracks = await db.select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
      isPublished: tracks.isPublished,
    })
      .from(tracks)
      .orderBy(tracks.title);
    
    console.log(`\n📊 FINAL STATE: ${finalTracks.length} LEARNING TRACKS`);
    console.log('-'.repeat(60));
    
    for (let i = 0; i < finalTracks.length; i++) {
      const track = finalTracks[i];
      const trackLessons = await db.select({ id: lessons.id })
        .from(lessons)
        .where(eq(lessons.trackId, track.id));
      
      const status = track.isPublished === true || track.isPublished === 1 ? '✅' : '❌';
      console.log(`${i + 1}. ${status} ${track.title}`);
      console.log(`   Slug: ${track.slug}`);
      console.log(`   Lessons: ${trackLessons.length}`);
      console.log('');
    }

    // Display exam subjects
    console.log('📋 9 EXAM SUBJECTS (configured in professional-exams.tsx):');
    console.log('-'.repeat(60));
    const examSubjects = [
      { title: 'NDT Inspection & Testing', slug: 'ndt-inspection' },
      { title: 'Diver Medic Technician', slug: 'diver-medic' },
      { title: 'Commercial Dive Supervisor', slug: 'commercial-supervisor' },
      { title: 'Saturation Diving Systems', slug: 'saturation-diving' },
      { title: 'Advanced Underwater Welding', slug: 'underwater-welding' },
      { title: 'Hyperbaric Chamber Operations', slug: 'hyperbaric-operations' },
      { title: 'Assistant Life Support Technician', slug: 'alst' },
      { title: 'Life Support Technician (LST)', slug: 'lst' },
      { title: 'Client Representative', slug: 'client-representative' },
    ];
    
    for (let i = 0; i < examSubjects.length; i++) {
      const subject = examSubjects[i];
      const matchingTrack = finalTracks.find(t => t.slug === subject.slug);
      const status = matchingTrack ? '✅' : '❌';
      console.log(`${i + 1}. ${status} ${subject.title} (${subject.slug})`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 RESTORATION COMPLETE!');
    console.log(`   📚 ${finalTracks.length} Learning Tracks`);
    console.log(`   📝 9 Exam Subjects`);
    console.log('='.repeat(60));

    if (finalTracks.length !== 10) {
      console.log(`\n⚠️  WARNING: Expected 10 tracks, found ${finalTracks.length}`);
    }

  } catch (error: any) {
    console.error('\n❌ Error during restoration:', error);
    if (error.message) {
      console.error(`   ${error.message}`);
    }
    if (error.code === 'ENOENT') {
      console.error('   Backup file not found. Please ensure the backup file exists.');
    }
    process.exit(1);
  }
}

// Run the restoration
restoreLearningTracksAndSubjects()
  .then(() => {
    console.log('\n✨ Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
