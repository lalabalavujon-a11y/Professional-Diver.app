#!/usr/bin/env ts-node
/**
 * Export Diver Well Knowledge Base for OpenAI GPT
 * 
 * This script exports all tracks, lessons, and supplementary KB content
 * into formatted markdown files suitable for uploading to OpenAI GPT knowledge base.
 * 
 * Usage:
 *   tsx scripts/export-gpt-knowledge-base.ts
 * 
 * Output:
 *   ./exports/gpt-knowledge-base/ - Directory containing all exported content
 */

import 'dotenv/config';
import { db } from '../server/db.js';
import { lessons, tracks } from '../shared/schema-sqlite.js';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// Supplementary KB Content (CSWIP, DMT protocols, etc.)
const SUPPLEMENTARY_KB_CONTENT = [
  {
    title: 'CSWIP 3.1U - General Visual Inspection (GVI) and Close Visual Inspection (CVI)',
    content: `# CSWIP 3.1U Underwater Inspection - General Visual Inspection (GVI) and Close Visual Inspection (CVI)

## Terminology

- **GVI (General Visual Inspection)**: Broad overview inspection covering large areas to identify obvious defects, structural issues, and areas requiring closer examination
- **CVI (Close Visual Inspection)**: Detailed examination within arm's reach, typically within 600mm, to identify specific defects, cracks, corrosion, and surface conditions
- **Inspection Scope**: Defines what areas to inspect, what defects to look for, and what acceptance criteria apply

## Inspection Procedures

### Pre-Inspection Planning
- Review inspection scope and requirements
- Identify inspection areas and access points
- Prepare inspection equipment and documentation
- Conduct safety briefings and risk assessments

### Visual Inspection Techniques
- Systematic examination patterns (grid, spiral, linear)
- Proper lighting and visibility requirements
- Documentation standards (photos, videos, measurements)
- Defect identification and classification

### Defect Classification
- Critical defects requiring immediate action
- Major defects requiring scheduled repair
- Minor defects for monitoring
- Acceptable conditions within tolerance

## Reporting Requirements

### A-LODER Reporting Format
- **A**: Assessment and findings summary
- **L**: Location and position coordinates
- **O**: Observations and measurements
- **D**: Defect classification and severity
- **E**: Evidence (photos, videos, measurements)
- **R**: Recommendations and required actions

## Industry Standards
- CSWIP certification requirements
- IMCA guidelines for underwater inspection
- ADCI standards for commercial diving operations
- Regulatory compliance requirements`,
    category: 'cswip-3.1u',
    tags: ['GVI', 'CVI', 'terminology', 'inspection-scope', 'A-LODER']
  },
  {
    title: 'CSWIP 3.2U - Advanced Inspection Techniques',
    content: `# CSWIP 3.2U Underwater Inspection - Advanced Techniques

## Specialized Inspection Methods

### Cathodic Protection (CP) Surveys
- CP system assessment and monitoring
- Reference electrode positioning and measurements
- Potential readings and interpretation
- Anode condition and effectiveness evaluation
- CP system troubleshooting and maintenance

### Underwater Diver Touch Monitoring (UDTM)
- UDTM inspection protocols and procedures
- Equipment setup and calibration
- Measurement techniques and documentation
- Defect detection and classification
- Quality control and verification

### Fluorescent Magnetic Particle Inspection (MPI)
- Fluorescent MPI setup underwater
- Equipment requirements and preparation
- Application techniques and procedures
- Defect detection under UV lighting
- Documentation and reporting standards

### Toe-Grinding Techniques
- Grinding procedures and acceptance criteria
- Equipment selection and setup
- Quality control during grinding operations
- Post-grinding inspection requirements
- Documentation and verification

## Equipment and Procedures

### CP Monitoring Equipment
- Reference electrodes and positioning
- Voltmeter operation and calibration
- Data logging and recording
- Equipment maintenance and storage

### UDTM Inspection Protocols
- Pre-inspection equipment checks
- Measurement procedures and techniques
- Data recording and documentation
- Quality assurance and verification

### Fluorescent MPI Setup
- Equipment preparation and calibration
- Application procedures underwater
- UV lighting requirements
- Inspection and documentation

### Grinding Procedures
- Equipment selection and setup
- Grinding techniques and quality control
- Post-grinding inspection
- Acceptance criteria and documentation

## Industry Standards
- CSWIP 3.2U certification requirements
- IMCA guidelines for advanced inspection
- ADCI standards for specialized techniques
- Regulatory compliance and quality assurance`,
    category: 'cswip-3.2u',
    tags: ['CP', 'UDTM', 'fluorescent-MPI', 'toe-grinding', 'cathodic-protection']
  },
  {
    title: 'CSWIP 3.4U - Reporting Discipline and A-LODER Format',
    content: `# CSWIP 3.4U Underwater Inspection - Reporting Discipline

## A-LODER Reporting Format

### A - Assessment and Findings
- Summary of inspection findings
- Overall condition assessment
- Critical issues identification
- Recommendations overview

### L - Location and Position
- Precise location coordinates
- Structural reference points
- Depth and orientation
- Access and visibility conditions

### O - Observations and Measurements
- Detailed observations
- Quantitative measurements
- Defect dimensions and characteristics
- Environmental conditions

### D - Defect Classification
- Defect type and category
- Severity classification
- Code compliance assessment
- Acceptance criteria evaluation

### E - Evidence
- Photographic documentation
- Video recordings
- Measurement records
- Supporting documentation

### R - Recommendations and Actions
- Required actions and priorities
- Repair recommendations
- Monitoring requirements
- Follow-up inspection needs

## Reporting Standards

### Documentation Requirements
- Complete inspection records
- Photo and video standards
- Measurement accuracy requirements
- Client deliverable formats

### Quality Assurance
- Report review and verification
- Technical accuracy checks
- Compliance with standards
- Client approval processes

## Industry Standards
- CSWIP 3.4U certification requirements
- IMCA reporting guidelines
- ADCI documentation standards
- Regulatory compliance requirements`,
    category: 'cswip-3.4u',
    tags: ['A-LODER', 'reporting-discipline', 'documentation', 'quality-assurance']
  },
  {
    title: 'DMT SAFE Protocol - Scene Assessment and First Evaluation',
    content: `# DMT SAFE Protocol - Scene Assessment and First Evaluation

## SAFE Protocol

### S - Scene Safety Assessment
- Environmental hazard identification
- Structural hazard evaluation
- Biological and chemical hazard assessment
- Personal protective equipment requirements
- Scene control and safety protocols

### A - Airway Assessment and Management
- Airway patency evaluation
- Obstruction identification and management
- Positioning requirements
- Advanced airway techniques
- Airway maintenance procedures

### F - First Aid and Immediate Interventions
- Immediate life-saving interventions
- Bleeding control and management
- Shock recognition and treatment
- Basic life support procedures
- Emergency stabilization techniques

### E - Evaluation and Ongoing Monitoring
- Continuous patient assessment
- Vital signs monitoring
- Response to treatment evaluation
- Ongoing condition assessment
- Documentation and reporting

## ABCDE Assessment Protocol

### A - Airway
- Airway patency assessment
- Obstruction identification
- Airway management techniques
- Positioning for airway management
- Advanced airway procedures

### B - Breathing
- Breathing rate and quality assessment
- Respiratory effectiveness evaluation
- Breathing support requirements
- Oxygen therapy administration
- Ventilation support procedures

### C - Circulation
- Pulse assessment and quality
- Bleeding identification and control
- Shock recognition and management
- Fluid administration requirements
- Circulation support procedures

### D - Disability (Neurological)
- Consciousness level assessment (AVPU)
- Glasgow Coma Scale evaluation
- Neurological deficit identification
- Pupil response and motor function
- Diving-specific neurological assessment

### E - Exposure
- Complete patient examination
- Environmental factor assessment
- Hypothermia recognition and prevention
- Evidence preservation
- Privacy and dignity maintenance

## ATOMF Protocol

### A - Assessment
- Complete patient assessment
- History taking and evaluation
- Symptom identification and classification
- Severity determination
- Priority classification

### T - Treatment
- Immediate treatment interventions
- Evidence-based treatment protocols
- Medication administration (if available)
- Treatment response monitoring
- Treatment modifications as needed

### O - Oxygen Administration
- High-flow oxygen requirements
- Oxygen delivery systems
- Flow rate determination
- Duration and monitoring
- Oxygen toxicity considerations

### M - Monitoring
- Continuous vital signs monitoring
- Response to treatment evaluation
- Ongoing condition assessment
- Serial assessments and documentation
- Alert level monitoring

### F - Follow-up Care
- Follow-up treatment requirements
- Additional care coordination
- Medical facility notification
- Hyperbaric treatment coordination
- Recovery and rehabilitation planning

### C - Communication and Documentation
- Medical control communication
- Incident reporting requirements
- Complete documentation standards
- Legal and regulatory compliance
- Post-incident review coordination

## Industry Standards
- DMT certification requirements
- IMCA medical support guidelines
- ADCI emergency response standards
- Professional medical protocols
- Regulatory compliance requirements`,
    category: 'dmt-emergency',
    tags: ['SAFE', 'ABCDE', 'ATOMFC', 'emergency-response', 'DMT-protocols']
  }
];

async function main() {
  console.log('📚 Exporting Diver Well Knowledge Base for OpenAI GPT...\n');

  try {
    // Create export directory
    const exportDir = path.join(process.cwd(), 'exports', 'gpt-knowledge-base');
    if (!existsSync(exportDir)) {
      await mkdir(exportDir, { recursive: true });
      console.log(`📁 Created export directory: ${exportDir}\n`);
    }

    // Get all tracks from database
    console.log('📖 Loading tracks and lessons from database...');
    const allTracks = await db.select().from(tracks).orderBy(tracks.title);
    console.log(`   Found ${allTracks.length} tracks\n`);

    let totalLessons = 0;
    let totalContent = '';

    // Export each track with its lessons
    for (const track of allTracks) {
      try {
        const trackLessons = await db
          .select()
          .from(lessons)
          .where(eq(lessons.trackId, track.id))
          .orderBy(lessons.order);

        totalLessons += trackLessons.length;

        // Create track-specific content
        let trackContent = `# ${track.title}\n\n`;
        if (track.summary) {
          trackContent += `## Track Summary\n\n${track.summary}\n\n`;
        }
        trackContent += `**Track Slug:** ${track.slug}\n`;
        trackContent += `**Difficulty:** ${track.difficulty || 'Not specified'}\n`;
        trackContent += `**Estimated Hours:** ${track.estimatedHours || 0}\n\n`;
        trackContent += `---\n\n`;

        // Add lessons
        if (trackLessons.length > 0) {
          trackContent += `## Lessons (${trackLessons.length})\n\n`;
          
          for (const lesson of trackLessons) {
            trackContent += `### Lesson ${lesson.order}: ${lesson.title}\n\n`;
            
            // Add objectives if available
            if (lesson.objectives) {
              try {
                const objectives = JSON.parse(lesson.objectives as string);
                if (Array.isArray(objectives) && objectives.length > 0) {
                  trackContent += `**Learning Objectives:**\n`;
                  objectives.forEach((obj: string) => {
                    trackContent += `- ${obj}\n`;
                  });
                  trackContent += `\n`;
                }
              } catch (e) {
                // Ignore parse errors - objectives may not be valid JSON
              }
            }

            trackContent += `${lesson.content}\n\n`;
            trackContent += `---\n\n`;
          }
        } else {
          trackContent += `*No lessons available for this track.*\n\n`;
        }

        // Save track-specific file
        const trackFileName = `${track.slug.replace(/[^a-z0-9-]/gi, '-')}.md`;
        const trackFilePath = path.join(exportDir, trackFileName);
        await writeFile(trackFilePath, trackContent, 'utf-8');
        console.log(`   ✅ Exported: ${track.title} (${trackLessons.length} lessons)`);

        // Add to total content
        totalContent += trackContent + '\n\n';
      } catch (error) {
        console.error(`   ❌ Error exporting track "${track.title}":`, error instanceof Error ? error.message : error);
      }
    }

    // Add supplementary KB content
    console.log(`\n📋 Adding supplementary KB content...`);
    let supplementContent = `# Supplementary Knowledge Base Content\n\n`;
    supplementContent += `This section contains specialized knowledge base topics including CSWIP inspection protocols, DMT emergency procedures, and other critical diving operations knowledge.\n\n`;
    supplementContent += `---\n\n`;

    for (const item of SUPPLEMENTARY_KB_CONTENT) {
      supplementContent += `${item.content}\n\n---\n\n`;
      console.log(`   ✅ Added: ${item.title}`);
    }

    // Save supplementary content
    const supplementFilePath = path.join(exportDir, 'supplementary-kb-content.md');
    await writeFile(supplementFilePath, supplementContent, 'utf-8');

    // Create comprehensive single file
    let comprehensiveContent = `# Diver Well Training - Complete Knowledge Base\n\n`;
    comprehensiveContent += `**Export Date:** ${new Date().toISOString()}\n`;
    comprehensiveContent += `**Total Tracks:** ${allTracks.length}\n`;
    comprehensiveContent += `**Total Lessons:** ${totalLessons}\n`;
    comprehensiveContent += `**Supplementary Topics:** ${SUPPLEMENTARY_KB_CONTENT.length}\n\n`;
    comprehensiveContent += `---\n\n`;
    comprehensiveContent += totalContent;
    comprehensiveContent += `\n\n${supplementContent}`;

    const comprehensiveFilePath = path.join(exportDir, 'complete-knowledge-base.md');
    await writeFile(comprehensiveFilePath, comprehensiveContent, 'utf-8');

    // Create index file
    let indexContent = `# Diver Well GPT Knowledge Base - Index\n\n`;
    indexContent += `**Export Date:** ${new Date().toISOString()}\n\n`;
    indexContent += `**Total Tracks:** ${allTracks.length}\n`;
    indexContent += `**Total Lessons:** ${totalLessons}\n`;
    indexContent += `**Supplementary Topics:** ${SUPPLEMENTARY_KB_CONTENT.length}\n\n`;
    indexContent += `## Files in this Export\n\n`;
    indexContent += `### Track Files\n\n`;
    
    for (const track of allTracks) {
      const trackFileName = `${track.slug.replace(/[^a-z0-9-]/gi, '-')}.md`;
      indexContent += `- \`${trackFileName}\` - ${track.title}\n`;
    }
    
    indexContent += `\n### Supplementary Content\n\n`;
    indexContent += `- \`supplementary-kb-content.md\` - CSWIP, DMT protocols, and specialized topics\n`;
    indexContent += `- \`complete-knowledge-base.md\` - Single comprehensive file with all content\n\n`;
    indexContent += `## How to Use\n\n`;
    indexContent += `1. **For OpenAI GPT:** Upload the \`complete-knowledge-base.md\` file to your GPT's knowledge base\n`;
    indexContent += `2. **For Organized Upload:** Upload individual track files and supplementary content separately\n`;
    indexContent += `3. **For Review:** Use the individual files to review specific track content\n\n`;

    const indexFilePath = path.join(exportDir, 'README.md');
    await writeFile(indexFilePath, indexContent, 'utf-8');

    console.log(`\n✅ Export complete!`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Tracks: ${allTracks.length}`);
    console.log(`   - Lessons: ${totalLessons}`);
    console.log(`   - Supplementary Topics: ${SUPPLEMENTARY_KB_CONTENT.length}`);
    console.log(`   - Export Directory: ${exportDir}`);
    console.log(`\n📁 Files created:`);
    console.log(`   - Individual track files (${allTracks.length} files)`);
    console.log(`   - supplementary-kb-content.md`);
    console.log(`   - complete-knowledge-base.md (single comprehensive file)`);
    console.log(`   - README.md (index and instructions)`);
    console.log(`\n💡 Next Steps:`);
    console.log(`   1. Review the exported files in: ${exportDir}`);
    console.log(`   2. Upload 'complete-knowledge-base.md' to your OpenAI GPT knowledge base`);
    console.log(`   3. Or upload individual files for organized knowledge base structure`);

  } catch (error) {
    console.error('❌ Export error:', error);
    throw error;
  }
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
