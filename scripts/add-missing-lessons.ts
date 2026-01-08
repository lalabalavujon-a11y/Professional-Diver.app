import { db } from '../server/db.js';
import { tracks, lessons } from '../shared/schema-sqlite.js';
import { eq, sql, desc } from 'drizzle-orm';

// Lesson templates for each track - 12 lessons per track
const trackLessonTemplates: Record<string, string[]> = {
  'ndt-inspection': [
    'Visual Inspection Fundamentals',
    'Corrosion Assessment Techniques',
    'Magnetic Particle Testing',
    'Ultrasonic Thickness Gauging',
    'Cathodic Protection Surveying',
    'Documentation Standards',
    'Marine Growth Identification',
    'Defect Classification',
    'Quality Assurance Protocols',
    'Advanced Inspection Methods',
    'Report Writing & Analysis',
    'Final Assessment'
  ],
  'diver-medic': [
    'Scene Assessment and Safety Protocols',
    'ABCDE Assessment Protocol',
    'Airway Management Techniques',
    'Breathing Support Procedures',
    'Circulation Assessment',
    'Neurological Evaluation',
    'Diving Injuries & Treatment',
    'Decompression Sickness Management',
    'Hyperbaric Medicine',
    'Emergency Medications',
    'Patient Transport & Evacuation',
    'Final Assessment'
  ],
  'commercial-supervisor': [
    'Dive Planning Fundamentals',
    'Risk Assessment & Safety',
    'Team Management',
    'Emergency Response',
    'Quality Assurance',
    'Project Management',
    'Communication Protocols',
    'Equipment Management',
    'Regulatory Compliance',
    'Incident Investigation',
    'Leadership & Decision Making',
    'Final Assessment'
  ],
  'saturation-diving': [
    'Life Support Systems',
    'Decompression Management',
    'Human Factors',
    'Emergency Procedures',
    'System Maintenance',
    'Gas Management',
    'Chamber Operations',
    'Medical Monitoring',
    'Team Coordination',
    'Advanced Procedures',
    'Safety Systems',
    'Final Assessment'
  ],
  'underwater-welding': [
    'Welding Fundamentals',
    'Electrode Selection',
    'Quality Control',
    'Safety Protocols',
    'Advanced Techniques',
    'Underwater Welding Methods',
    'Weld Inspection',
    'Equipment Operation',
    'Troubleshooting',
    'Material Science',
    'Welding Standards',
    'Final Assessment'
  ],
  'hyperbaric-operations': [
    'Chamber Operations',
    'Treatment Protocols',
    'Patient Monitoring',
    'Emergency Procedures',
    'Equipment Maintenance',
    'Gas Management',
    'Medical Protocols',
    'Safety Systems',
    'Maintenance Procedures',
    'Advanced Operations',
    'Quality Control',
    'Final Assessment'
  ],
  'alst': [
    'Life Support System Fundamentals',
    'Equipment Operation & Maintenance',
    'Emergency Response Procedures',
    'Safety Protocols & Procedures',
    'Leadership & Communication',
    'Gas Management',
    'System Troubleshooting',
    'Environmental Control',
    'Team Coordination',
    'Advanced Procedures',
    'Quality Assurance',
    'Final Assessment'
  ],
  'lst': [
    'Life Support Fundamentals',
    'Gas Management',
    'Emergency Response',
    'Equipment Operations',
    'Safety Systems',
    'System Design',
    'Advanced Troubleshooting',
    'Team Leadership',
    'Quality Control',
    'Maintenance Protocols',
    'Advanced Operations',
    'Final Assessment'
  ],
  'air-diver-certification': [
    'Diving Physics Fundamentals',
    'Gas Laws & Pressure Effects',
    'Decompression Theory',
    'Safety Calculations',
    'Equipment Physics',
    'Gas Management',
    'Ascent Procedures',
    'Problem Solving',
    'Tool Handling Safety',
    'Communication Protocols',
    'Emergency Procedures',
    'Final Assessment'
  ]
};

// AI Tutor information for each track
const trackTutors: Record<string, { name: string; specialty: string; description: string }> = {
  'ndt-inspection': {
    name: 'Sarah',
    specialty: 'NDT & Inspection Specialist',
    description: 'Expert in Non-Destructive Testing and Inspection, corrosion assessment, and CP surveying'
  },
  'diver-medic': {
    name: 'Michael',
    specialty: 'Emergency Medicine Specialist',
    description: 'Specialist in diving-related medical emergencies, hyperbaric treatment, and underwater rescue protocols'
  },
  'commercial-supervisor': {
    name: 'David',
    specialty: 'Commercial Dive Supervisor',
    description: 'Dive supervisor with expertise in dive planning, risk assessment, and emergency response coordination for commercial diving operations'
  },
  'saturation-diving': {
    name: 'Marcus',
    specialty: 'Saturation Diving Expert',
    description: 'Expert in saturation diving systems, life support operations, and extended underwater mission management'
  },
  'underwater-welding': {
    name: 'Carlos',
    specialty: 'Underwater Welding Specialist',
    description: 'Expert in underwater welding techniques, quality control, and marine construction'
  },
  'hyperbaric-operations': {
    name: 'Michael',
    specialty: 'Hyperbaric Medicine Specialist',
    description: 'Specialist in hyperbaric chamber operations, decompression therapy, and medical gas management'
  },
  'alst': {
    name: 'Alex',
    specialty: 'Life Support Systems Expert',
    description: 'Expert in life support system operations, emergency response procedures, and life support operations'
  },
  'lst': {
    name: 'Maria',
    specialty: 'Advanced Life Support Systems',
    description: 'Expert in advanced life support systems, gas management, and emergency response for diving operations'
  },
  'air-diver-certification': {
    name: 'Michael',
    specialty: 'Air Diving Specialist',
    description: 'Specialist in gas management, ascent procedures, and underwater tool handling safety'
  }
};

function generateLessonContent(trackSlug: string, lessonTitle: string, lessonNumber: number): string {
  const tutor = trackTutors[trackSlug];
  const isFinalAssessment = lessonTitle.toLowerCase().includes('final assessment');
  
  if (isFinalAssessment) {
    return `# ${lessonTitle}

## AI Tutor: ${tutor.name} - ${tutor.specialty}
*${tutor.description}*

Welcome to the Final Assessment for ${trackSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}!

## Assessment Overview
This comprehensive assessment evaluates your understanding of all concepts covered in this training track. Successfully completing this assessment demonstrates your readiness for professional certification.

## Assessment Format
- Multiple choice questions covering all modules
- Practical scenario-based questions
- Case study analysis
- Professional standards application

## Preparation Tips
- Review all previous lessons
- Understand key concepts and procedures
- Practice with sample scenarios
- Review industry standards and regulations

## Passing Requirements
- Minimum score: 80%
- All critical safety questions must be answered correctly
- Demonstrate understanding of emergency procedures

## Next Steps
Upon successful completion, you will be eligible for professional certification in this specialization.

Good luck! Remember: Professional competency requires both knowledge and practical application.`;
  }

  return `# ${lessonTitle}

## AI Tutor: ${tutor.name} - ${tutor.specialty}
*${tutor.description}*

Welcome to Lesson ${lessonNumber} of ${trackSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}! I'm ${tutor.name}, your AI tutor. Today we'll cover ${lessonTitle.toLowerCase()} for professional diving operations.

## Learning Objectives
- Master ${lessonTitle.toLowerCase()} principles and techniques
- Understand professional standards and best practices
- Learn practical application methods
- Develop critical thinking skills
- Practice safety protocols

## Core Concepts

### Fundamental Principles
Professional diving operations require systematic understanding of ${lessonTitle.toLowerCase()}. This lesson provides comprehensive coverage of essential concepts and practical applications.

### Key Topics Covered
- **Theory**: Fundamental principles and scientific basis
- **Practice**: Hands-on techniques and procedures
- **Safety**: Critical safety protocols and risk management
- **Standards**: Industry standards and regulatory requirements
- **Application**: Real-world scenarios and case studies

## Professional Standards
- Maintain highest quality standards
- Follow safety protocols rigorously
- Practice techniques regularly
- Document all work thoroughly
- Stay current with industry developments

## Practical Application
This lesson includes practical exercises and real-world scenarios to reinforce learning. Complete all exercises to ensure comprehensive understanding.

## Next Steps
Continue building your expertise. Practice these techniques and prepare for the next lesson.

Remember: Professional competency requires both knowledge and practical application.`;
}

async function addMissingLessons() {
  console.log('📚 Adding missing lessons to tracks...\n');

  try {
    // Get all tracks
    const allTracks = await db.select({
      id: tracks.id,
      title: tracks.title,
      slug: tracks.slug,
    }).from(tracks).orderBy(tracks.title);

    let totalAdded = 0;

    for (const track of allTracks) {
      const slug = track.slug;
      const lessonTemplates = trackLessonTemplates[slug];

      if (!lessonTemplates) {
        console.log(`⚠️  No lesson templates found for track: ${track.title} (${slug})`);
        continue;
      }

      // Get existing lessons for this track
      const existingLessons = await db.select({
        id: lessons.id,
        title: lessons.title,
        order: lessons.order,
      })
        .from(lessons)
        .where(eq(lessons.trackId, track.id))
        .orderBy(lessons.order);

      const existingTitles = new Set(existingLessons.map(l => l.title.toLowerCase()));
      const maxOrder = existingLessons.length > 0 
        ? Math.max(...existingLessons.map(l => l.order)) 
        : 0;

      console.log(`\n📖 ${track.title} (${slug})`);
      console.log(`   Current lessons: ${existingLessons.length}/${lessonTemplates.length}`);

      let addedForTrack = 0;

      // Add missing lessons
      for (let i = 0; i < lessonTemplates.length; i++) {
        const lessonTitle = lessonTemplates[i];
        const lessonNumber = i + 1;

        // Check if lesson already exists (case-insensitive)
        if (existingTitles.has(lessonTitle.toLowerCase())) {
          continue;
        }

        // Find the correct order position
        let order = lessonNumber;
        
        // Check if we need to insert between existing lessons
        const existingAtPosition = existingLessons.find(l => l.order === lessonNumber);
        if (existingAtPosition) {
          // Find next available order number
          order = maxOrder + addedForTrack + 1;
        }

        const content = generateLessonContent(slug, lessonTitle, lessonNumber);

        await db.insert(lessons).values({
          trackId: track.id,
          title: lessonTitle,
          order: order,
          content: content,
          estimatedMinutes: 60,
          isRequired: true,
        });

        console.log(`   ✅ Added: ${lessonTitle} (order: ${order})`);
        addedForTrack++;
        totalAdded++;
      }

      if (addedForTrack === 0) {
        console.log(`   ✓ All lessons already exist`);
      }
    }

    console.log(`\n🎉 Successfully added ${totalAdded} lesson(s) across all tracks!`);
    
    // Verify final counts
    console.log('\n📊 Final Lesson Counts:');
    for (const track of allTracks) {
      const lessonCount = await db.select({ count: sql<number>`count(*)` })
        .from(lessons)
        .where(eq(lessons.trackId, track.id));
      
      const count = lessonCount[0]?.count || 0;
      const expected = trackLessonTemplates[track.slug]?.length || 0;
      const status = count >= expected ? '✅' : '⚠️';
      
      console.log(`   ${status} ${track.title}: ${count}/${expected} lessons`);
    }

  } catch (error) {
    console.error('❌ Error adding lessons:', error);
    throw error;
  }
}

addMissingLessons()
  .catch(console.error)
  .finally(() => process.exit(0));

