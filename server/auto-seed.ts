/**
 * Auto-seed the database on startup if it's empty
 * This ensures production deployments have data without manual intervention
 */

import { db } from './db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema.js';

export async function autoSeedIfEmpty(): Promise<void> {
  try {
    // Check if any tracks exist
    const existingTracks = await db.select().from(tracks).limit(1);
    
    if (existingTracks.length > 0) {
      console.log('✅ Database already has content, skipping auto-seed');
      return;
    }
    
    console.log('🌱 Empty database detected - running auto-seed...');
    
    // Create the 7 comprehensive professional diving tracks
    const [ndtTrack] = await db.insert(tracks).values({
      title: "Inspection & Non-Destructive Testing (NDT)",
      slug: "inspection-ndt",
      summary: "Comprehensive AI-powered training in underwater inspection techniques, corrosion assessment, cathodic protection surveying, thickness gauging, magnetic particle inspection, and professional documentation standards for commercial diving operations.",
      isPublished: true,
    }).returning();

    const [medicTrack] = await db.insert(tracks).values({
      title: "Diver Medic Technician",
      slug: "diver-medic-technician",
      summary: "Advanced medical training with AI tutor for diving emergencies including scene assessment, ABCDE protocols, airway management, breathing support, circulation assessment, disability evaluation, and emergency response procedures.",
      isPublished: true,
    }).returning();

    const [supervisorTrack] = await db.insert(tracks).values({
      title: "Commercial Dive Supervisor",
      slug: "commercial-dive-supervisor",
      summary: "AI-powered leadership and management training covering dive planning fundamentals, risk assessment methodologies, hazard identification, communication protocols, emergency response coordination, and quality assurance systems.",
      isPublished: true,
    }).returning();

    const [airDiverTrack] = await db.insert(tracks).values({
      title: "Air Diver Certification",
      slug: "air-diver-certification", 
      summary: "Essential air diving skills with AI tutoring including diving physics review, gas management concepts, ascent best practices, problem-solving drills, tool handling safety, and basic communications protocols.",
      isPublished: true,
    }).returning();

    const [satDiverTrack] = await db.insert(tracks).values({
      title: "Saturation Diver Training",
      slug: "saturation-diver-training",
      summary: "Specialized AI-guided training for saturation diving operations, system components and operation, human factors in confined environments, high-level risk assessment themes, and advanced life support systems.",
      isPublished: true,
    }).returning();

    const [alstTrack] = await db.insert(tracks).values({
      title: "Assistant Life Support Technician (ALST)",
      slug: "assistant-life-support-technician",
      summary: "AI tutor-assisted training for life support system operation, gas management principles, environmental control systems, emergency procedures, equipment maintenance protocols, and safety systems.",
      isPublished: true,
    }).returning();

    const [lstTrack] = await db.insert(tracks).values({
      title: "Life Support Technician (LST)",
      slug: "life-support-technician",
      summary: "Advanced AI-powered life support systems training, system design principles, troubleshooting methodologies, emergency management procedures, team leadership skills, and quality assurance protocols.",
      isPublished: true,
    }).returning();

    // Client Representative Track
    const [clientRepTrack] = await db.insert(tracks).values({
      title: "Client Representative",
      slug: "client-representative",
      summary: "Comprehensive training for offshore client representatives covering project oversight, safety compliance, quality assurance, contractor management, and regulatory requirements for diving and marine operations.",
      isPublished: true,
    }).returning();

    // Add one lesson per track for initial content
    await db.insert(lessons).values([
      {
        trackId: ndtTrack.id,
        title: "Visual Inspection Fundamentals",
        order: 1,
        content: `# Visual Inspection Fundamentals
        
Visual inspection forms the foundation of underwater non-destructive testing. This module covers systematic inspection methodologies, defect identification, and professional documentation standards.

## Learning Objectives
- Master systematic visual inspection methodologies
- Understand defect identification and classification
- Learn professional documentation techniques
- Apply industry safety protocols

## Key Topics
1. Pre-inspection planning and preparation
2. Grid pattern inspection techniques
3. Defect characterization and documentation
4. Safety protocols for underwater inspection`,
      },
      {
        trackId: medicTrack.id,
        title: "Scene Assessment and Safety Protocols",
        order: 1,
        content: `# Scene Assessment and Safety Protocols

Scene assessment forms the critical foundation of emergency medical response in diving operations.

## ABCDE Assessment Protocol
- **A** - Airway Management
- **B** - Breathing Assessment
- **C** - Circulation Check
- **D** - Disability (Neurological)
- **E** - Exposure and Environment

## Emergency Response Priorities
1. Ensure scene safety
2. Assess patient responsiveness
3. Call for help/backup
4. Begin systematic assessment`,
      },
      {
        trackId: supervisorTrack.id,
        title: "Dive Planning Fundamentals",
        order: 1,
        content: `# Dive Planning Fundamentals

Comprehensive dive planning ensures safe, efficient commercial diving operations.

## Strategic Planning Framework
- Project scope analysis
- Environmental assessment
- Technical requirements
- Timeline and resource allocation

## Risk Assessment Methodology
1. Hazard identification
2. Risk probability assessment
3. Consequence evaluation
4. Mitigation planning`,
      },
      {
        trackId: airDiverTrack.id,
        title: "Gas Management and Consumption Planning",
        order: 1,
        content: `# Gas Management and Consumption Planning

Proper gas management is the foundation of safe air diving operations.

## Gas Consumption Factors
- Physical characteristics
- Work intensity
- Depth and pressure
- Environmental conditions

## Planning Methodology
1. Calculate base consumption
2. Add emergency reserves (25%)
3. Include task overrun (20%)
4. Emergency ascent reserve`,
      },
      {
        trackId: satDiverTrack.id,
        title: "Saturation Diving Systems Overview",
        order: 1,
        content: `# Saturation Diving Systems Overview

Saturation diving enables extended deep diving operations by keeping divers at depth pressure.

## System Components
- Living chambers (habitat)
- Diving bells
- Life support systems
- Transfer under pressure (TUP)

## Safety Considerations
1. Pressure management
2. Gas mixture control
3. Emergency procedures
4. Health monitoring`,
      },
      {
        trackId: alstTrack.id,
        title: "Life Support System Fundamentals",
        order: 1,
        content: `# Life Support System Fundamentals

Assistant Life Support Technicians play a critical role in saturation diving operations.

## Core Responsibilities
- Gas supply monitoring
- Environmental control
- System maintenance
- Emergency response

## Key Systems
1. Breathing gas supply
2. CO2 scrubbing
3. Oxygen management
4. Temperature control`,
      },
      {
        trackId: lstTrack.id,
        title: "Advanced Life Support Operations",
        order: 1,
        content: `# Advanced Life Support Operations

Life Support Technicians oversee all aspects of saturation diving life support.

## Leadership Responsibilities
- Team supervision
- System design review
- Emergency coordination
- Quality assurance

## Advanced Topics
1. Complex troubleshooting
2. Emergency management
3. Regulatory compliance
4. Continuous improvement`,
      },
      {
        trackId: clientRepTrack.id,
        title: "Project Oversight Fundamentals",
        order: 1,
        content: `# Project Oversight Fundamentals

Client Representatives ensure diving operations meet safety, quality, and contractual requirements.

## Core Responsibilities
- Safety compliance monitoring
- Quality assurance
- Contractor oversight
- Documentation and reporting

## Key Skills
1. Risk assessment
2. Communication
3. Decision making
4. Regulatory knowledge`,
      },
    ]);

    const trackCount = await db.select().from(tracks).then(r => r.length);
    const lessonCount = await db.select().from(lessons).then(r => r.length);
    
    console.log(`✅ Auto-seed complete: ${trackCount} tracks, ${lessonCount} lessons created`);
    
  } catch (error) {
    console.error('⚠️ Auto-seed failed (non-fatal):', error);
    // Don't throw - allow server to start even if seed fails
  }
}
