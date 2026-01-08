import { db } from "../server/db";

async function populateContent() {
  console.log("Starting to populate lessons and quizzes...");

  try {
    // Get all tracks
    const tracksResult = await db.execute('SELECT id, slug, title FROM tracks WHERE is_published = true');
    console.log(`Found ${tracksResult.rows.length} published tracks`);

    for (const track of tracksResult.rows) {
      console.log(`Processing track: ${track.title}`);
      
      if (track.slug === 'diver-medic-technician') {
        // Add DMT lessons
        const lessonResult = await db.execute(`
          INSERT INTO lessons (track_id, title, "order", content, estimated_minutes, is_required) 
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING id
        `, [
          track.id,
          'Introduction to Diving Medicine',
          1,
          `# Introduction to Diving Medicine

## Overview
The Diver Medic Technician (DMT) program provides comprehensive medical training specifically designed for commercial diving operations. This certification is essential for maintaining safety standards in professional diving environments.

## Learning Objectives
- Understand the physiological effects of diving on the human body
- Identify and treat diving-related medical emergencies
- Apply proper first aid techniques in hyperbaric environments
- Maintain medical equipment and supplies for diving operations

## Medical Scope in Commercial Diving

### Primary Responsibilities
1. **Emergency Response**: First responder for diving accidents and decompression incidents
2. **Medical Monitoring**: Continuous assessment of diver health and fitness
3. **Equipment Management**: Maintenance of medical supplies and emergency equipment
4. **Documentation**: Accurate record-keeping of medical incidents and treatments

### Physiological Considerations
- Pressure effects on body systems
- Gas narcosis and oxygen toxicity
- Decompression sickness mechanisms
- Hypothermia and thermal protection

## Legal and Regulatory Framework
- OSHA Commercial Diving Standards (29 CFR 1910.401-441)
- ADCI certification requirements
- Medical documentation and reporting obligations
- Liability and scope of practice limitations

This foundational knowledge forms the basis for all advanced DMT procedures and protocols.`,
          45,
          true
        ]);

        const lessonId = lessonResult.rows[0].id;

        // Add quiz for DMT lesson
        const quizResult = await db.execute(`
          INSERT INTO quizzes (lesson_id, title, time_limit) 
          VALUES ($1, $2, $3) 
          RETURNING id
        `, [lessonId, 'Diving Medicine Fundamentals Quiz', 20]);

        const quizId = quizResult.rows[0].id;

        // Add questions for DMT quiz (adapted to current schema)
        await db.execute(`
          INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          quizId,
          'What is the primary role of a Diver Medic Technician in commercial diving operations?',
          'Equipment maintenance',
          'Emergency medical response',
          'Dive planning',
          'Surface support',
          'b',
          1
        ]);

        await db.execute(`
          INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          quizId,
          'Which regulatory body establishes commercial diving standards in the United States?',
          'PADI',
          'NAUI',
          'OSHA',
          'USCG',
          'c',
          2
        ]);

        await db.execute(`
          INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          quizId,
          'Decompression sickness primarily affects which body systems?',
          'Respiratory only',
          'Circulatory and nervous systems',
          'Digestive system',
          'Muscular system only',
          'b',
          3
        ]);

        console.log(`  Added lesson and quiz for DMT`);
      }

      if (track.slug === 'air-diving-life-support-technician') {
        // Add ALST lesson
        const lessonResult = await db.execute(`
          INSERT INTO lessons (track_id, title, "order", content, estimated_minutes, is_required) 
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING id
        `, [
          track.id,
          'Air Diving Systems Overview',
          1,
          `# Air Diving Systems Overview

## Surface-Supplied Air Diving

### System Components
1. **Air Supply Sources**
   - High-pressure compressors
   - Breathing air quality standards
   - Backup air supply systems
   - Emergency bail-out bottles

2. **Distribution Systems**
   - Manifolds and control panels
   - Pressure regulators and gauges
   - Umbilical management systems
   - Emergency gas switching valves

## ALST Responsibilities

### Pre-Dive Operations
- System inspection and testing
- Air quality verification
- Equipment calibration
- Safety briefings with dive team

### During Dive Operations
- Continuous monitoring of air supply pressures
- Umbilical management and tending
- Communication with diving supervisor
- Emergency response readiness

### Post-Dive Procedures
- System shutdown and securing
- Equipment maintenance and logging
- Incident documentation
- Preventive maintenance scheduling

## Air Quality Standards

### Grade E Breathing Air Requirements
- Oxygen: 19.5-23.5%
- Carbon monoxide: 10 ppm maximum
- Carbon dioxide: 1000 ppm maximum
- Condensed water: no measurement
- Oil mist: 5 mg/m³ maximum

### Testing and Monitoring
- Daily air quality analysis
- Compressor intake monitoring
- Filter maintenance schedules
- Documentation requirements

## Emergency Procedures
- Loss of primary air supply
- Umbilical entanglement or damage
- Compressor failure protocols
- Diver emergency response`,
          50,
          true
        ]);

        const lessonId = lessonResult.rows[0].id;

        // Add ALST quiz
        const quizResult = await db.execute(`
          INSERT INTO quizzes (lesson_id, title, time_limit) 
          VALUES ($1, $2, $3) 
          RETURNING id
        `, [lessonId, 'Air Diving Systems Knowledge Check', 20]);

        const quizId = quizResult.rows[0].id;

        // Add ALST questions
        await db.execute(`
          INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          quizId,
          'What is the maximum allowable carbon monoxide content in Grade E breathing air?',
          '5 ppm',
          '10 ppm',
          '20 ppm',
          '50 ppm',
          'b',
          1
        ]);

        await db.execute(`
          INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          quizId,
          'The primary responsibility of an ALST during diving operations is:',
          'Dive planning',
          'Air supply monitoring',
          'Equipment repair',
          'Diver training',
          'b',
          2
        ]);

        console.log(`  Added lesson and quiz for ALST`);
      }

      if (track.slug === 'life-support-technician') {
        // Add LST lesson
        const lessonResult = await db.execute(`
          INSERT INTO lessons (track_id, title, "order", content, estimated_minutes, is_required) 
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING id
        `, [
          track.id,
          'Life Support System Fundamentals',
          1,
          `# Life Support System Fundamentals

## Surface-Supplied Diving Life Support

### Core Functions
1. **Gas Supply Management**
   - Primary and secondary gas sources
   - Gas mixing and distribution systems
   - Pressure regulation and control
   - Quality assurance and monitoring

2. **Environmental Control**
   - Diver heating systems
   - Depth and pressure monitoring
   - Communication systems
   - Emergency response capabilities

## LST Certification Requirements

### Training Components
- Gas physics and physiology
- Life support equipment operation
- Emergency procedures and protocols
- System maintenance and troubleshooting

### Practical Skills
- Equipment inspection and testing
- System startup and operation
- Emergency response procedures
- Maintenance and repair techniques

## Equipment Systems

### Gas Distribution Panels
- Multi-diver manifold systems
- Individual diver controls
- Pressure monitoring and alarms
- Emergency switching capabilities

### Hot Water Systems
- Heating unit operation
- Temperature control and monitoring
- Flow rate management
- System maintenance requirements

### Communication Systems
- Hard-wire communication equipment
- Through-water communication devices
- Emergency signaling systems
- Integration with dive control systems

## Operational Procedures
- Pre-dive system checks
- Operational monitoring requirements
- Emergency response protocols
- Post-dive shutdown procedures

## Safety Protocols
- Redundant system design
- Fail-safe mechanisms
- Emergency procedures
- Risk assessment and mitigation`,
          45,
          true
        ]);

        const lessonId = lessonResult.rows[0].id;

        // Add LST quiz
        const quizResult = await db.execute(`
          INSERT INTO quizzes (lesson_id, title, time_limit) 
          VALUES ($1, $2, $3) 
          RETURNING id
        `, [lessonId, 'Life Support Systems Evaluation', 20]);

        const quizId = quizResult.rows[0].id;

        // Add LST question
        await db.execute(`
          INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          quizId,
          'What are the core functions of surface-supplied diving life support systems?',
          'Gas supply only',
          'Gas supply and environmental control',
          'Communication only',
          'Equipment storage',
          'b',
          1
        ]);

        console.log(`  Added lesson and quiz for LST`);
      }

      if (track.slug === 'mixed-gas-diving') {
        // Add Mixed Gas lesson
        const lessonResult = await db.execute(`
          INSERT INTO lessons (track_id, title, "order", content, estimated_minutes, is_required) 
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING id
        `, [
          track.id,
          'Mixed Gas Theory and Applications',
          1,
          `# Mixed Gas Theory and Applications

## Introduction to Mixed Gas Diving

Mixed gas diving utilizes breathing gas mixtures other than air to extend operational depth and reduce narcotic effects. This advanced technique requires specialized knowledge of gas physics, physiology, and operational procedures.

## Gas Mixing Fundamentals

### Helium-Oxygen Mixtures (Heliox)
- **Advantages**: Reduced nitrogen narcosis, improved thermal conductivity
- **Disadvantages**: Helium cost, voice distortion, increased heat loss
- **Applications**: Deep air equivalent diving beyond 190 fsw

### Trimix (Helium-Nitrogen-Oxygen)
- **Composition**: Variable ratios of all three gases
- **Benefits**: Cost reduction compared to pure heliox
- **Considerations**: Complex mixing calculations and procedures

## Physiological Considerations

### Nitrogen Narcosis Mitigation
- Helium substitution for nitrogen at depth
- Equivalent air depth (EAD) calculations
- Performance improvements in deep diving

### Oxygen Toxicity Management
- Central nervous system (CNS) oxygen toxicity
- Pulmonary oxygen toxicity
- Partial pressure calculations and limits

### High-Pressure Nervous Syndrome (HPNS)
- Symptoms and onset depths
- Nitrogen addition to mitigate HPNS
- Compression rate considerations

## Decompression Planning

### Mixed Gas Tables and Algorithms
- Helium vs. nitrogen uptake and elimination
- Multi-tissue models for mixed gas
- Computer algorithm considerations

### Gas Switching Procedures
- Travel gas mixtures
- Bottom gas compositions
- Decompression gas optimization
- Switch depth calculations

## Operational Procedures

### Gas Mixing Safety
- Contamination prevention
- Oxygen handling procedures
- Gas analysis and verification
- Documentation requirements

### Equipment Considerations
- Regulator compatibility
- Thermal protection requirements
- Communication system effects
- Emergency gas supplies

This comprehensive overview prepares divers for advanced mixed gas operations while emphasizing safety protocols and theoretical understanding.`,
          75,
          true
        ]);

        const lessonId = lessonResult.rows[0].id;

        // Add Mixed Gas quiz
        const quizResult = await db.execute(`
          INSERT INTO quizzes (lesson_id, title, time_limit) 
          VALUES ($1, $2, $3) 
          RETURNING id
        `, [lessonId, 'Mixed Gas Diving Competency', 30]);

        const quizId = quizResult.rows[0].id;

        // Add Mixed Gas questions
        await db.execute(`
          INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          quizId,
          'What is the primary advantage of using heliox over air for deep diving?',
          'Lower cost',
          'Reduced nitrogen narcosis',
          'Better taste',
          'Easier mixing',
          'b',
          1
        ]);

        await db.execute(`
          INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          quizId,
          'High-Pressure Nervous Syndrome (HPNS) is typically mitigated by:',
          'Adding oxygen',
          'Adding nitrogen',
          'Adding helium',
          'Using pure oxygen',
          'b',
          2
        ]);

        console.log(`  Added lesson and quiz for Mixed Gas`);
      }

      if (track.slug === 'saturation-diving') {
        // Add Saturation Diving lesson
        const lessonResult = await db.execute(`
          INSERT INTO lessons (track_id, title, "order", content, estimated_minutes, is_required) 
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING id
        `, [
          track.id,
          'Saturation Diving Principles',
          1,
          `# Saturation Diving Principles

## Saturation Diving Overview

Saturation diving is the most advanced form of commercial diving, allowing divers to work at extreme depths for extended periods. This technique involves saturating body tissues with inert gas at working depth pressure, eliminating repetitive decompression requirements.

## Fundamental Concepts

### Tissue Saturation
- **Definition**: Complete equilibration of dissolved gases in body tissues
- **Time Requirements**: Typically 24-48 hours to achieve saturation
- **Depth Independence**: Once saturated, decompression time remains constant regardless of additional bottom time

### Operational Advantages
- Extended bottom time without additional decompression penalty
- Continuous work capability at operational depth
- Reduced total project decompression time for long-duration jobs
- Enhanced diver safety through controlled environment

## Saturation System Components

### Deck Decompression Chamber (DDC)
- **Living Chambers**: Pressurized habitat for diver accommodation
- **Entry/Exit Locks**: Transfer systems for personnel and equipment
- **Environmental Control**: Atmosphere monitoring, heating, sanitation
- **Emergency Systems**: Fire suppression, emergency evacuation capabilities

### Personnel Transfer Capsule (PTC)
- **Transport Function**: Safe transfer of divers to working depth
- **Life Support**: Independent breathing gas and environmental systems
- **Communication**: Continuous contact with dive control
- **Emergency Capabilities**: Self-rescue and backup systems

## Physiological Considerations

### Long-Term Pressure Exposure
- **Tissue Adaptation**: Physiological changes during saturation
- **Thermal Regulation**: Body heat management in helium atmospheres
- **Respiratory Function**: Breathing gas density effects
- **Psychological Factors**: Isolation and confinement effects

### Gas Management
- **Breathing Gas Mixtures**: Optimized helium-oxygen compositions
- **Atmosphere Control**: CO2 scrubbing and oxygen addition
- **Contaminant Removal**: Trace gas and humidity control
- **Emergency Gas Supplies**: Backup breathing systems

This advanced diving technique requires extensive training, specialized equipment, and rigorous safety procedures to ensure successful operations.`,
          90,
          true
        ]);

        const lessonId = lessonResult.rows[0].id;

        // Add Saturation quiz
        const quizResult = await db.execute(`
          INSERT INTO quizzes (lesson_id, title, time_limit) 
          VALUES ($1, $2, $3) 
          RETURNING id
        `, [lessonId, 'Saturation Diving Mastery Test', 35]);

        const quizId = quizResult.rows[0].id;

        // Add Saturation questions
        await db.execute(`
          INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          quizId,
          'What is the primary advantage of saturation diving for deep commercial operations?',
          'Lower equipment costs',
          'Extended bottom time without decompression penalty',
          'Simpler procedures',
          'Reduced training requirements',
          'b',
          1
        ]);

        await db.execute(`
          INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          quizId,
          'How long does it typically take to achieve tissue saturation?',
          '6-12 hours',
          '24-48 hours',
          '3-4 days',
          '1 week',
          'b',
          2
        ]);

        console.log(`  Added lesson and quiz for Saturation Diving`);
      }

      if (track.slug === 'diving-physiology-basics') {
        // Add Physiology lesson
        const lessonResult = await db.execute(`
          INSERT INTO lessons (track_id, title, "order", content, estimated_minutes, is_required) 
          VALUES ($1, $2, $3, $4, $5, $6) 
          RETURNING id
        `, [
          track.id,
          'Human Physiology and Pressure Effects',
          1,
          `# Human Physiology and Pressure Effects

## Introduction to Diving Physiology

Understanding human physiology under pressure is fundamental to safe diving operations. The human body undergoes significant physiological changes when exposed to increased pressure, affecting multiple organ systems and requiring careful consideration in dive planning and execution.

## Pressure and the Human Body

### Atmospheric Pressure Concepts
- **Sea Level Pressure**: 14.7 psi (1 atmosphere absolute)
- **Pressure Increase**: 14.7 psi per 33 feet of seawater
- **Gauge vs. Absolute Pressure**: Understanding pressure measurement systems
- **Pressure Effects**: Direct and indirect effects on body systems

### Gas Laws and Physiological Applications

#### Boyle's Law Applications
- **Lung Volume Changes**: Compression and expansion effects
- **Air-Filled Spaces**: Mask squeeze, ear squeeze, sinus squeeze
- **Pneumothorax Risk**: Lung overexpansion injuries
- **Equipment Considerations**: Buoyancy compensator behavior

#### Henry's Law Applications
- **Gas Solubility**: Increased gas dissolution under pressure
- **Nitrogen Absorption**: Tissue loading during descent
- **Decompression Requirements**: Gas elimination during ascent
- **Bubble Formation**: Supersaturation and decompression sickness

## Respiratory System Under Pressure

### Breathing Gas Density
- **Increased Work of Breathing**: Higher gas density at depth
- **CO2 Retention**: Reduced ventilation efficiency
- **Performance Limitations**: Maximum sustainable work rates
- **Equipment Design**: Regulator performance considerations

### Oxygen and Carbon Dioxide Transport
- **Oxygen Partial Pressure**: Effects on tissue oxygenation
- **Carbon Dioxide Elimination**: Pressure effects on CO2 removal
- **Respiratory Drive**: Hypercapnic and hypoxic responses
- **Acid-Base Balance**: Pressure effects on pH regulation

## Circulatory System Adaptations

### Cardiovascular Responses
- **Heart Rate Changes**: Bradycardia and pressure effects
- **Blood Flow Distribution**: Centralization of circulation
- **Blood Pressure**: Hydrostatic and physiological changes
- **Cardiac Output**: Pressure effects on heart function

This foundational knowledge is essential for understanding more advanced diving physiology concepts and safe diving practices.`,
          60,
          true
        ]);

        const lessonId = lessonResult.rows[0].id;

        // Add Physiology quiz
        const quizResult = await db.execute(`
          INSERT INTO quizzes (lesson_id, title, time_limit) 
          VALUES ($1, $2, $3) 
          RETURNING id
        `, [lessonId, 'Diving Physiology Fundamentals', 25]);

        const quizId = quizResult.rows[0].id;

        // Add Physiology questions
        await db.execute(`
          INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          quizId,
          'According to Boyle\'s Law, what happens to lung volume when a diver descends from the surface to 33 feet?',
          'Volume doubles',
          'Volume halves',
          'Volume remains constant',
          'Volume triples',
          'b',
          1
        ]);

        await db.execute(`
          INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          quizId,
          'Henry\'s Law explains which diving-related phenomenon?',
          'Lung squeeze',
          'Gas narcosis',
          'Decompression sickness',
          'Oxygen toxicity',
          'c',
          2
        ]);

        console.log(`  Added lesson and quiz for Diving Physiology`);
      }
    }

    console.log("Content population completed successfully!");

  } catch (error) {
    console.error("Error populating content:", error);
    throw error;
  }
}

// Execute the population function
populateContent()
  .then(() => {
    console.log("Database population completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to populate database:", error);
    process.exit(1);
  });