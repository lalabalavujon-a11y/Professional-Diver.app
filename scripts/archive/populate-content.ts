import { db } from "../server/db";
import { tracks, lessons, quizzes, questions } from "@shared/schema";

const professionalDivingContent = {
  // Diver Medic Technician (DMT)
  "diver-medic-technician": {
    lessons: [
      {
        title: "Introduction to Diving Medicine",
        order: 1,
        content: `# Introduction to Diving Medicine

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
        estimatedMinutes: 45,
        quiz: {
          title: "Diving Medicine Fundamentals Quiz",
          timeLimit: 20,
          questions: [
            {
              prompt: "What is the primary role of a Diver Medic Technician in commercial diving operations?",
              options: ["Equipment maintenance", "Emergency medical response", "Dive planning", "Surface support"],
              correctAnswer: "Emergency medical response",
              explanation: "The DMT serves as the primary medical responder for diving emergencies and decompression incidents."
            },
            {
              prompt: "Which regulatory body establishes commercial diving standards in the United States?",
              options: ["PADI", "NAUI", "OSHA", "USCG"],
              correctAnswer: "OSHA",
              explanation: "OSHA (Occupational Safety and Health Administration) regulates commercial diving through 29 CFR 1910.401-441."
            },
            {
              prompt: "Decompression sickness primarily affects which body systems?",
              options: ["Respiratory only", "Circulatory and nervous systems", "Digestive system", "Muscular system only"],
              correctAnswer: "Circulatory and nervous systems",
              explanation: "DCS affects circulation through bubble formation and can cause neurological symptoms."
            }
          ]
        }
      },
      {
        title: "Hyperbaric Medicine Principles",
        order: 2,
        content: `# Hyperbaric Medicine Principles

## Pressure Physics in Diving Medicine

### Fundamental Laws
1. **Boyle's Law**: Gas volume inversely proportional to pressure
2. **Henry's Law**: Gas solubility proportional to pressure
3. **Dalton's Law**: Total pressure equals sum of partial pressures

### Clinical Applications
- Understanding tissue gas loading during compression
- Predicting decompression requirements
- Calculating therapeutic recompression protocols

## Decompression Sickness (DCS)

### Type I DCS (Pain-Only Bends)
- Musculoskeletal pain, typically in joints
- Mild to moderate severity
- Usually responds well to recompression therapy
- Most common in shoulders, elbows, and knees

### Type II DCS (Serious Bends)
- Neurological symptoms: paralysis, sensory loss, confusion
- Pulmonary symptoms: chest pain, cough, breathing difficulty
- Inner ear symptoms: vertigo, hearing loss, tinnitus
- Requires immediate recompression treatment

## Treatment Protocols

### Initial Assessment
1. Airway, breathing, circulation (ABC)
2. Neurological examination
3. Diving history and profile analysis
4. Symptom onset and progression

### Recompression Therapy
- U.S. Navy Treatment Tables
- Oxygen administration protocols
- Monitoring during treatment
- Post-treatment care and observation

## Emergency Procedures
- Chamber operations and safety
- Medical gas management
- Patient monitoring systems
- Communication protocols during treatment`,
        estimatedMinutes: 60,
        quiz: {
          title: "Hyperbaric Medicine Assessment",
          timeLimit: 25,
          questions: [
            {
              prompt: "Which gas law explains why decompression sickness occurs?",
              options: ["Boyle's Law", "Henry's Law", "Dalton's Law", "Gay-Lussac's Law"],
              correctAnswer: "Henry's Law",
              explanation: "Henry's Law governs gas solubility, explaining how nitrogen dissolves under pressure and forms bubbles during decompression."
            },
            {
              prompt: "Type II DCS is characterized by:",
              options: ["Joint pain only", "Neurological symptoms", "Skin manifestations", "Mild discomfort"],
              correctAnswer: "Neurological symptoms",
              explanation: "Type II DCS affects the nervous system and can cause serious neurological complications."
            }
          ]
        }
      }
    ]
  },

  // Air Diving Life Support Technician (ALST)
  "air-diving-life-support-technician": {
    lessons: [
      {
        title: "Air Diving Systems Overview",
        order: 1,
        content: `# Air Diving Systems Overview

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
        estimatedMinutes: 50,
        quiz: {
          title: "Air Diving Systems Knowledge Check",
          timeLimit: 20,
          questions: [
            {
              prompt: "What is the maximum allowable carbon monoxide content in Grade E breathing air?",
              options: ["5 ppm", "10 ppm", "20 ppm", "50 ppm"],
              correctAnswer: "10 ppm",
              explanation: "Grade E breathing air standards specify a maximum of 10 ppm carbon monoxide for safe diving operations."
            },
            {
              prompt: "The primary responsibility of an ALST during diving operations is:",
              options: ["Dive planning", "Air supply monitoring", "Equipment repair", "Diver training"],
              correctAnswer: "Air supply monitoring",
              explanation: "ALSTs are responsible for continuous monitoring and management of the air supply system during dive operations."
            }
          ]
        }
      }
    ]
  },

  // Life Support Technician (LST)
  "life-support-technician": {
    lessons: [
      {
        title: "Life Support System Fundamentals",
        order: 1,
        content: `# Life Support System Fundamentals

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
        estimatedMinutes: 45,
        quiz: {
          title: "Life Support Systems Evaluation",
          timeLimit: 20,
          questions: [
            {
              prompt: "What are the core functions of surface-supplied diving life support systems?",
              options: ["Gas supply only", "Gas supply and environmental control", "Communication only", "Equipment storage"],
              correctAnswer: "Gas supply and environmental control",
              explanation: "LST systems provide both breathing gas management and environmental support including heating and communication."
            }
          ]
        }
      }
    ]
  },

  // Mixed Gas Diving
  "mixed-gas-diving": {
    lessons: [
      {
        title: "Mixed Gas Theory and Applications",
        order: 1,
        content: `# Mixed Gas Theory and Applications

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
        estimatedMinutes: 75,
        quiz: {
          title: "Mixed Gas Diving Competency",
          timeLimit: 30,
          questions: [
            {
              prompt: "What is the primary advantage of using heliox over air for deep diving?",
              options: ["Lower cost", "Reduced nitrogen narcosis", "Better taste", "Easier mixing"],
              correctAnswer: "Reduced nitrogen narcosis",
              explanation: "Heliox eliminates nitrogen narcosis by replacing nitrogen with helium, allowing clearer thinking at depth."
            },
            {
              prompt: "High-Pressure Nervous Syndrome (HPNS) is typically mitigated by:",
              options: ["Adding oxygen", "Adding nitrogen", "Adding helium", "Using pure oxygen"],
              correctAnswer: "Adding nitrogen",
              explanation: "Adding small amounts of nitrogen to helium-oxygen mixtures helps reduce HPNS symptoms."
            },
            {
              prompt: "In mixed gas diving, equivalent air depth (EAD) is used to:",
              options: ["Calculate oxygen toxicity", "Determine narcotic effects", "Plan decompression", "Monitor gas supplies"],
              correctAnswer: "Determine narcotic effects",
              explanation: "EAD helps determine the narcotic equivalent depth when using nitrogen-helium mixtures."
            }
          ]
        }
      }
    ]
  },

  // Saturation Diving
  "saturation-diving": {
    lessons: [
      {
        title: "Saturation Diving Principles",
        order: 1,
        content: `# Saturation Diving Principles

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

### Surface Support Systems
- **Gas Supply**: High-volume mixed gas generation and storage
- **Control Systems**: Centralized monitoring and control capabilities
- **Power Generation**: Redundant electrical systems
- **Emergency Response**: Medical facilities and evacuation procedures

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

## Operational Procedures

### Saturation Phases
1. **Compression**: Gradual pressurization to storage depth
2. **Storage**: Extended period at working pressure
3. **Excursions**: Working dives to operational depth
4. **Decompression**: Controlled return to surface pressure

### Safety Protocols
- **Redundant Systems**: Multiple backup capabilities
- **Emergency Procedures**: Fire, flood, and medical emergencies
- **Communication**: Continuous contact requirements
- **Medical Support**: Specialized hyperbaric medicine

### Quality Control
- **Gas Analysis**: Continuous atmosphere monitoring
- **Equipment Testing**: Regular system inspections
- **Documentation**: Detailed operational logs
- **Training Requirements**: Specialized crew certification

This advanced diving technique requires extensive training, specialized equipment, and rigorous safety procedures to ensure successful operations.`,
        estimatedMinutes: 90,
        quiz: {
          title: "Saturation Diving Mastery Test",
          timeLimit: 35,
          questions: [
            {
              prompt: "What is the primary advantage of saturation diving for deep commercial operations?",
              options: ["Lower equipment costs", "Extended bottom time without decompression penalty", "Simpler procedures", "Reduced training requirements"],
              correctAnswer: "Extended bottom time without decompression penalty",
              explanation: "Once tissues are saturated, additional bottom time doesn't increase decompression requirements."
            },
            {
              prompt: "How long does it typically take to achieve tissue saturation?",
              options: ["6-12 hours", "24-48 hours", "3-4 days", "1 week"],
              correctAnswer: "24-48 hours",
              explanation: "Complete tissue saturation typically requires 24-48 hours of pressure exposure."
            },
            {
              prompt: "The Personnel Transfer Capsule (PTC) is used for:",
              options: ["Equipment storage", "Gas mixing", "Diver transport to depth", "Surface communication"],
              correctAnswer: "Diver transport to depth",
              explanation: "The PTC safely transports saturated divers between the surface chamber and working depth."
            },
            {
              prompt: "In saturation diving, what happens to decompression time as bottom time increases?",
              options: ["It increases proportionally", "It remains constant", "It decreases", "It doubles"],
              correctAnswer: "It remains constant",
              explanation: "Once tissues are saturated, decompression time remains constant regardless of additional bottom time."
            }
          ]
        }
      }
    ]
  },

  // Diving Physiology Basics
  "diving-physiology-basics": {
    lessons: [
      {
        title: "Human Physiology and Pressure Effects",
        order: 1,
        content: `# Human Physiology and Pressure Effects

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

### Blood Gas Transport
- **Hemoglobin Saturation**: Oxygen carrying capacity
- **Dissolved Gas Content**: Henry's Law applications
- **Bubble Formation**: Intravascular gas bubbles
- **Circulation Time**: Effects on gas elimination

## Nervous System Considerations

### Pressure Effects on Neural Function
- **High-Pressure Nervous Syndrome**: Deep diving considerations
- **Cognitive Function**: Performance under pressure
- **Sensory Changes**: Vision, hearing, and proprioception
- **Motor Function**: Coordination and dexterity effects

### Gas Narcosis
- **Nitrogen Narcosis**: Mechanism and effects
- **Impairment Assessment**: Performance degradation
- **Individual Variation**: Susceptibility factors
- **Mitigation Strategies**: Mixed gas applications

## Thermal Regulation

### Heat Loss Mechanisms
- **Conduction**: Direct thermal transfer
- **Convection**: Water circulation effects
- **Respiratory Heat Loss**: Breathing gas temperature
- **Metabolic Heat Production**: Exercise and shivering

### Hypothermia Prevention
- **Thermal Protection**: Insulation requirements
- **Active Heating**: Hot water suits and heaters
- **Recognition and Treatment**: Hypothermia management
- **Performance Effects**: Cold-induced impairment

This foundational knowledge is essential for understanding more advanced diving physiology concepts and safe diving practices.`,
        estimatedMinutes: 60,
        quiz: {
          title: "Diving Physiology Fundamentals",
          timeLimit: 25,
          questions: [
            {
              prompt: "According to Boyle's Law, what happens to lung volume when a diver descends from the surface to 33 feet?",
              options: ["Volume doubles", "Volume halves", "Volume remains constant", "Volume triples"],
              correctAnswer: "Volume halves",
              explanation: "At 33 feet (2 ATA), pressure doubles and volume halves according to Boyle's Law."
            },
            {
              prompt: "Henry's Law explains which diving-related phenomenon?",
              options: ["Lung squeeze", "Gas narcosis", "Decompression sickness", "Oxygen toxicity"],
              correctAnswer: "Decompression sickness",
              explanation: "Henry's Law governs gas solubility, explaining how inert gases dissolve under pressure and can form bubbles during decompression."
            },
            {
              prompt: "What is the primary cause of increased work of breathing at depth?",
              options: ["Lower oxygen levels", "Higher gas density", "Increased pressure", "Cold water"],
              correctAnswer: "Higher gas density",
              explanation: "Breathing gas becomes denser at depth, increasing the work required to move gas in and out of the lungs."
            },
            {
              prompt: "High-Pressure Nervous Syndrome (HPNS) primarily affects which body system?",
              options: ["Respiratory", "Circulatory", "Nervous", "Digestive"],
              correctAnswer: "Nervous",
              explanation: "HPNS directly affects the nervous system, causing tremors, dizziness, and cognitive impairment at extreme depths."
            }
          ]
        }
      }
    ]
  }
};

async function populateLessonsAndQuizzes() {
  console.log("Starting to populate lessons and quizzes...");

  try {
    // Get all existing tracks
    const existingTracks = await db.select().from(tracks);
    console.log(`Found ${existingTracks.length} tracks in database`);

    for (const track of existingTracks) {
      const trackContent = professionalDivingContent[track.slug as keyof typeof professionalDivingContent];
      
      if (trackContent) {
        console.log(`Adding content for track: ${track.title}`);
        
        for (const lessonData of trackContent.lessons) {
          // Insert lesson
          const [insertedLesson] = await db.insert(lessons).values({
            trackId: track.id,
            title: lessonData.title,
            order: lessonData.order,
            content: lessonData.content,
            estimatedMinutes: lessonData.estimatedMinutes,
            isRequired: true
          }).returning();

          console.log(`  Added lesson: ${lessonData.title}`);

          // Insert quiz if it exists
          if (lessonData.quiz) {
            const [insertedQuiz] = await db.insert(quizzes).values({
              lessonId: insertedLesson.id,
              title: lessonData.quiz.title,
              timeLimit: lessonData.quiz.timeLimit,
              examType: 'QUIZ',
              passingScore: 70,
              maxAttempts: 3,
              showFeedback: true
            }).returning();

            console.log(`    Added quiz: ${lessonData.quiz.title}`);

            // Insert questions
            for (let i = 0; i < lessonData.quiz.questions.length; i++) {
              const questionData = lessonData.quiz.questions[i];
              await db.insert(questions).values({
                quizId: insertedQuiz.id,
                type: 'MULTIPLE_CHOICE',
                prompt: questionData.prompt,
                options: questionData.options,
                correctAnswer: questionData.correctAnswer,
                explanation: questionData.explanation,
                points: 1,
                order: i + 1
              });

              console.log(`      Added question ${i + 1}`);
            }
          }
        }
      } else {
        console.log(`No content found for track: ${track.slug}`);
      }
    }

    console.log("Content population completed successfully!");

  } catch (error) {
    console.error("Error populating content:", error);
    throw error;
  }
}

// Execute the population function
populateLessonsAndQuizzes()
  .then(() => {
    console.log("Database population completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to populate database:", error);
    process.exit(1);
  });