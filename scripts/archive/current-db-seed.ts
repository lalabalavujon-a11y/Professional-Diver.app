import { db } from '../server/db.js';

// Manually define the structure that matches current database
async function currentDbSeed() {
  console.log('🌱 Seeding with current database structure...');

  // Insert using raw SQL to avoid schema mismatch
  await db.execute(`DELETE FROM questions`);
  await db.execute(`DELETE FROM quizzes`);
  await db.execute(`DELETE FROM lessons`);
  await db.execute(`DELETE FROM tracks`);

  // Insert tracks using only existing columns
  await db.execute(`
    INSERT INTO tracks (title, slug, summary, is_published) VALUES 
    ('Inspection & Non-Destructive Testing (NDT)', 'inspection-ndt', 'AI-powered comprehensive training in underwater inspection techniques, corrosion assessment, cathodic protection surveying, thickness gauging, magnetic particle inspection, and professional documentation standards. Features expert AI tutor Dr. Sarah Chen.', true),
    ('Diver Medic Technician', 'diver-medic-technician', 'Advanced medical training with AI tutor Dr. Michael Rodriguez specializing in diving emergencies. Covers scene assessment, ABCDE protocols, airway management, breathing support, circulation assessment, and emergency response procedures.', true),
    ('Commercial Dive Supervisor', 'commercial-dive-supervisor', 'AI-guided leadership training with Captain James Mitchell covering dive planning fundamentals, risk assessment methodologies, hazard identification protocols, communication systems, and emergency response procedures.', true),
    ('Air Diver Certification', 'air-diver-certification', 'Essential air diving skills with AI tutor Lisa Thompson including diving physics review, gas management concepts, ascent best practices, problem-solving drills, tool handling safety, and communications.', true),
    ('Saturation Diver Training', 'saturation-diver-training', 'Specialized AI-assisted training with Commander Robert Hayes for saturation diving operations, system components, human factors in confined environments, and life support systems for deep-sea operations.', true),
    ('Assistant Life Support Technician (ALST)', 'assistant-life-support-technician', 'AI tutor David Kim guides life support system operation training, gas management principles, environmental control systems, emergency procedures, and equipment maintenance protocols.', true),
    ('Life Support Technician (LST)', 'life-support-technician', 'Advanced AI-powered training with Rebecca Foster covering life support systems, system design principles, troubleshooting methodologies, emergency management, and team leadership skills.', true)
  `);

  // Get track IDs for inserting lessons
  const tracksResult = await db.execute(`SELECT id, slug FROM tracks ORDER BY title`);
  const tracks = tracksResult.rows;

  // Find specific tracks
  const ndtTrack = tracks.find(t => t.slug === 'inspection-ndt');
  const medicTrack = tracks.find(t => t.slug === 'diver-medic-technician');
  const supervisorTrack = tracks.find(t => t.slug === 'commercial-dive-supervisor');
  const airDiverTrack = tracks.find(t => t.slug === 'air-diver-certification');

  // Insert lessons using raw SQL
  if (ndtTrack) {
    await db.execute(`
      INSERT INTO lessons (track_id, title, "order", content) VALUES 
      ('${ndtTrack.id}', 'Visual Inspection Fundamentals', 1, '# Visual Inspection Fundamentals

## AI Tutor: Dr. Sarah Chen - NDT & Inspection Specialist
*Expert in Non-Destructive Testing and Inspection with 15+ years in underwater inspection techniques, corrosion assessment, and CP surveying.*

Welcome to professional underwater visual inspection training! I''m Dr. Sarah Chen, your AI tutor specializing in Non-Destructive Testing and underwater inspection techniques. Let''s master the systematic methodologies used in commercial diving operations.

## Learning Objectives
- Master systematic visual inspection methodologies for commercial operations
- Understand professional defect identification and classification systems  
- Learn industry-standard underwater documentation techniques
- Apply professional safety protocols and quality assurance requirements
- Develop skills for real-world commercial diving inspection scenarios

## Professional Inspection Methodology

### Pre-Inspection Planning
Professional underwater inspection requires systematic preparation:

#### Document Review Process
- **Structural Drawings Analysis**: Understanding design specifications and critical load paths
- **Historical Data Review**: Previous inspection reports, maintenance records, incident documentation
- **Environmental Assessment**: Current conditions, marine growth patterns, visibility factors
- **Access Planning**: Safe approach routes, working platforms, emergency egress procedures

#### Professional Equipment Preparation
- **Primary Lighting Systems**: Minimum 10,000 lumen underwater LED systems with redundant backup
- **Documentation Tools**: Professional underwater cameras (minimum 24MP), calibrated measurement devices
- **Cleaning Equipment**: Wire brushes, scrapers, high-pressure water cleaning systems for marine growth removal
- **Safety Equipment**: Emergency ascent devices, redundant communication systems, cutting tools

### Systematic Coverage Methods

#### Grid Pattern Inspection (Industry Standard)
Professional standard for comprehensive structural coverage:
- **Grid Dimensions**: 2x2 meters typical for detailed commercial inspection operations
- **Overlap Requirements**: 10% minimum between adjacent grids for quality assurance verification
- **Documentation Protocol**: Mark completed areas systematically on waterproof documentation slates
- **Quality Control**: Independent verification of critical structural areas by certified personnel

#### Zone-Based Assessment Framework
Structural priority classification system for commercial operations:
- **Critical Zones**: Primary load-bearing members, connection points, high-stress structural areas
- **High Priority Areas**: Secondary structural elements, heavily stressed components, fatigue-prone areas
- **Standard Zones**: General structural components, cladding systems, non-critical structural elements
- **Environmental Impact Areas**: Zones with known aggressive conditions or elevated corrosion risk factors

## Professional Defect Identification

### Corrosion Types and Commercial Assessment

#### General Corrosion Assessment
- **Characteristics**: Uniform metal loss across large surface areas of steel structures
- **Measurement Protocol**: Thickness reduction assessment using calibrated ultrasonic measurement gauges
- **Documentation Requirements**: Area percentage affected calculations, average thickness loss documentation
- **Critical Evaluation Factors**: Rate of progression analysis, remaining material structural integrity assessment

#### Pitting Corrosion Professional Analysis
- **Recognition Criteria**: Localized deep holes with relatively small surface area impact on structure
- **Assessment Protocol**: Individual pit dimensional measurement (depth, diameter, density per unit area)
- **Critical Evaluation Standards**: Depth-to-diameter ratio exceeding industry safety limits (typically 1:1)
- **Risk Assessment Parameters**: Perforation potential analysis, stress concentration effects on structural integrity

This comprehensive training provides the professional foundation required for commercial diving NDT operations.'),
      ('${ndtTrack.id}', 'Corrosion Assessment Techniques', 2, '# Corrosion Assessment Techniques

## AI Tutor: Dr. Sarah Chen - Corrosion Assessment Expert
*Specialized in underwater corrosion assessment, electrochemical processes, and marine environment analysis*

Advanced corrosion assessment techniques are essential for professional underwater operations. I''ll guide you through electrochemical processes, measurement methods, and industry standards for marine environments.

## Professional Corrosion Assessment Framework

### Electrochemical Fundamentals
Understanding corrosion science for professional assessment:

#### Corrosion Cell Components
- **Anode (Oxidation)**: Metal dissolution releasing electrons (Fe → Fe²⁺ + 2e⁻)
- **Cathode (Reduction)**: Electron consumption (O₂ + 4H⁺ + 4e⁻ → 2H₂O)
- **Electrolyte**: Seawater providing ionic conductivity (35,000 ppm dissolved salts)
- **Metallic Current Path**: Electron flow through structural steel components

#### Marine Environment Factors
- **Chloride Ion Concentration**: Aggressive attack mechanism (19,000 ppm typical seawater)
- **Dissolved Oxygen**: Cathodic reaction support, depth-dependent variations
- **Temperature Effects**: Corrosion rate doubling every 10°C increase
- **pH Variations**: Local acidity effects from marine biological activity

### Assessment Methodology Standards

#### Cathodic Protection Assessment
- **-850 mV (Ag/AgCl)**: Industry standard minimum protection potential for steel
- **Polarization Decay**: 100 mV shift requirement from native potential
- **Current Density**: 20-50 mA/m² typical protection requirements
- **Environmental Corrections**: Temperature and salinity adjustments

This comprehensive corrosion assessment training ensures professional competency in advanced underwater inspection techniques.')
    `);
  }

  if (medicTrack) {
    await db.execute(`
      INSERT INTO lessons (track_id, title, "order", content) VALUES 
      ('${medicTrack.id}', 'ABCDE Emergency Assessment Protocol', 1, '# ABCDE Emergency Assessment Protocol

## AI Tutor: Dr. Michael Rodriguez - Emergency Medicine Specialist
*Emergency medicine specialist focused on diving-related medical emergencies, hyperbaric treatment, and underwater rescue protocols*

Welcome to professional emergency medical response training! I''m Dr. Michael Rodriguez, your AI tutor specializing in diving medical emergencies. The ABCDE protocol provides a systematic, life-saving approach for managing diving emergencies.

## ABCDE Protocol Professional Framework

### Primary Assessment Sequence
The ABCDE approach requires strict sequential order:
- **A**: Airway management and patency assessment
- **B**: Breathing evaluation and ventilation support
- **C**: Circulation assessment and hemorrhage control
- **D**: Disability (Neurological) evaluation and protection
- **E**: Exposure/Environment control and complete examination

**Critical Principle**: Each step must be completed and stabilized before progressing to the next.

## A - Airway Assessment and Management

### Comprehensive Initial Assessment
Professional **Look, Listen, Feel** systematic approach:
- **Visual Assessment**: Chest movement patterns, facial cyanosis, visible foreign objects
- **Auditory Assessment**: Air movement sounds, vocalization ability, abnormal breathing noises  
- **Tactile Assessment**: Air flow sensation at nose/mouth, chest rise confirmation

### Airway Obstruction Recognition
**Complete Obstruction Emergency Signs**:
- Absent air movement despite obvious respiratory effort
- Silent chest presentation with visible distress
- Rapid progression to unconsciousness and cyanosis
- Complete inability to cough, speak, or vocalize

**Partial Obstruction Warning Signs**:
- Stridor (high-pitched inspiratory sound)
- Significantly diminished air movement
- Use of accessory breathing muscles
- Anxiety and agitation from developing hypoxia

### Professional Management Techniques

#### Basic Airway Management
1. **Head Tilt-Chin Lift**: Primary positioning technique for unconscious patients
2. **Jaw Thrust**: Alternative for suspected spinal injury
3. **Manual Removal**: Finger sweep for visible foreign objects
4. **Patient Positioning**: Log roll for drainage with spinal alignment

## Diving-Specific Emergencies

### Decompression Sickness Assessment
- **Type I DCS**: Joint pain (bends), skin changes, lymphatic swelling
- **Type II DCS**: Neurological symptoms, pulmonary involvement
- **Assessment**: Symptom onset timing correlation with dive profile
- **Management**: High-flow oxygen, supine positioning, rapid evacuation

### Arterial Gas Embolism Protocol
- **Recognition**: Immediate neurological symptoms upon surfacing
- **Symptoms**: Focal neurological deficits, altered consciousness
- **Management**: Immediate high-flow oxygen, left lateral positioning
- **Evacuation**: Urgent hyperbaric treatment facility transport

This comprehensive ABCDE training ensures systematic emergency response capabilities essential for diving operations safety.')
    `);
  }

  if (supervisorTrack) {
    await db.execute(`
      INSERT INTO lessons (track_id, title, "order", content) VALUES 
      ('${supervisorTrack.id}', 'Risk Assessment and Hazard Management', 1, '# Risk Assessment and Hazard Management

## AI Tutor: Captain James Mitchell - Commercial Dive Supervisor
*Veteran dive supervisor with expertise in dive planning, risk assessment, and emergency response coordination*

Comprehensive risk assessment and hazard management form the cornerstone of safe commercial diving operations. This module covers systematic risk identification, assessment methodologies, and mitigation strategies.

## Professional Risk Assessment Framework

### Systematic Hazard Identification

#### Environmental Hazard Categories
**Marine Environment Hazards**:
- **Weather Conditions**: Sea state limitations, wind parameters, visibility restrictions
- **Water Quality**: Temperature extremes, contamination risks, biological hazards
- **Current and Tidal Forces**: Working current limits, tidal variations
- **Marine Traffic**: Commercial vessels, shipping lanes, fishing activity

#### Operational Risk Categories
**Equipment-Related Hazards**:
- **Life Support Failures**: Breathing gas interruption, gas contamination
- **Communication Failures**: Hard-wire loss, wireless interference
- **Tool Malfunctions**: Power tool failures, cutting equipment problems
- **PPE Issues**: Diving suit integrity, helmet malfunction

### Professional Risk Matrix Development

#### Risk Probability Assessment Scale
- **Very Low (1)**: Extremely unlikely occurrence
- **Low (2)**: Unlikely but possible, rare occurrence
- **Medium (3)**: Possible occurrence, occasional
- **High (4)**: Likely occurrence, regular
- **Very High (5)**: Almost certain occurrence

#### Consequence Severity Scale
- **Negligible (1)**: Minor inconvenience, no significant impact
- **Minor (2)**: Small delays, minor equipment damage
- **Moderate (3)**: Significant delays, moderate injuries
- **Major (4)**: Substantial impact, serious injuries
- **Catastrophic (5)**: Fatalities, major environmental impact

**Risk Score**: Probability × Consequence = Risk Score

### Hazard Control Hierarchy

#### Control Methods (Most to Least Effective)
1. **Elimination**: Complete hazard removal
2. **Substitution**: Safer alternatives
3. **Engineering Controls**: Physical modifications
4. **Administrative Controls**: Procedures and training
5. **Personal Protective Equipment**: Individual protection

This comprehensive risk assessment training ensures professional competency in safety management essential for commercial dive supervision.')
    `);
  }

  if (airDiverTrack) {
    await db.execute(`
      INSERT INTO lessons (track_id, title, "order", content) VALUES 
      ('${airDiverTrack.id}', 'Gas Management and Consumption Planning', 1, '# Gas Management and Consumption Planning

## AI Tutor: Lisa Thompson - Professional Air Diving Instructor
*Professional air diving instructor specializing in gas management, ascent procedures, and underwater tool handling safety*

Proper gas management forms the foundation of safe air diving operations. This comprehensive module covers consumption calculation methodologies, emergency reserve planning, and supply monitoring techniques.

## Gas Consumption Fundamentals

### Physiological Consumption Factors
Individual variation in gas consumption rates:

#### Physical Characteristics Impact
- **Body Mass Index**: Larger individuals typically require higher gas volumes
- **Lung Capacity**: Vital capacity directly affects breathing efficiency
- **Physical Conditioning**: Cardiovascular fitness reduces consumption rates
- **Age and Health**: Respiratory efficiency changes with age

#### Psychological Influences
- **Experience Level**: Novice divers consume 50-100% more than experienced divers
- **Stress Response**: Anxiety can double or triple consumption rates
- **Task Familiarity**: Unfamiliar work increases mental load and gas use
- **Emergency Situations**: Panic responses can increase consumption 300-400%

### Environmental Consumption Variables

#### Depth-Related Consumption Changes
Gas consumption increases linearly with absolute pressure:
- **Surface (1 ATA)**: Baseline consumption measurement
- **33 feet (2 ATA)**: Exactly double surface consumption
- **66 feet (3 ATA)**: Triple surface consumption rate
- **99 feet (4 ATA)**: Quadruple surface consumption rate

**Formula**: Surface Rate × (Depth in feet + 33) ÷ 33 = Depth Consumption Rate

#### Work Load Categories
Professional diving work classification:
- **Light Work (1.5-2.0 CFM)**: Visual inspection, light cleaning
- **Moderate Work (2.0-3.0 CFM)**: Power tool operation, moderate effort
- **Heavy Work (3.0-4.5 CFM)**: Cutting, welding, heavy lifting
- **Emergency Operations (4.5-6.0+ CFM)**: Rescue operations, high stress

### Professional Gas Planning

#### Complete Gas Requirement Formula
**Total Gas = (Work Time × Consumption Rate × Depth Factor) + Emergency Reserves + Operational Reserves + Surface Reserves**

#### Reserve Requirements
- **Emergency Reserve**: 25% of total calculated consumption
- **Emergency Ascent**: 50 cubic feet minimum for ascent
- **Task Overrun**: 20% additional for extended work time
- **Surface Reserve**: 50 cubic feet minimum

### Critical Decision Points
- **Turn-Around Pressure (50%)**: Begin ascent initiation
- **Emergency Reserve (25%)**: Emergency use only
- **Surface Reserve (200 PSI)**: Final safety margin

This comprehensive gas management training ensures safe, efficient diving operations while maintaining adequate safety margins.')
    `);
  }

  // Insert quizzes and questions
  const lessonsResult = await db.execute(`SELECT id, title, track_id FROM lessons`);
  const lessons = lessonsResult.rows;

  const ndtLesson1 = lessons.find(l => l.title === 'Visual Inspection Fundamentals');
  const medicLesson1 = lessons.find(l => l.title === 'ABCDE Emergency Assessment Protocol');
  const airLesson1 = lessons.find(l => l.title === 'Gas Management and Consumption Planning');

  if (ndtLesson1) {
    await db.execute(`
      INSERT INTO quizzes (lesson_id, title, time_limit) VALUES 
      ('${ndtLesson1.id}', 'Professional NDT Assessment - Visual Inspection', 30)
    `);
    
    const quizResult = await db.execute(`SELECT id FROM quizzes WHERE lesson_id = '${ndtLesson1.id}'`);
    const quizId = quizResult.rows[0]?.id;
    
    if (quizId) {
      await db.execute(`
        INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") VALUES 
        ('${quizId}', 'In professional commercial underwater inspection, what is the primary advantage of systematic grid pattern inspection methodology?', 'Reduces total inspection time and operational costs', 'Ensures complete systematic coverage with quality assurance verification and eliminates missed critical areas', 'Minimizes specialized lighting and equipment requirements', 'Reduces diver physical exertion and gas consumption rates', 'b', 1),
        ('${quizId}', 'Which corrosion type is most commonly associated with dissimilar metal connections in marine environments?', 'General uniform corrosion across large surface areas', 'Localized pitting corrosion with high depth-to-diameter ratios', 'Galvanic corrosion with preferential anode attack at connection points', 'Crevice corrosion in confined joint spaces', 'c', 2),
        ('${quizId}', 'According to NACE standards, what is the minimum cathodic protection potential for steel in seawater?', '-750 mV (Ag/AgCl reference electrode)', '-850 mV (Ag/AgCl reference electrode)', '-950 mV (Ag/AgCl reference electrode)', '-650 mV (Ag/AgCl reference electrode)', 'b', 3)
      `);
    }
  }

  if (medicLesson1) {
    await db.execute(`
      INSERT INTO quizzes (lesson_id, title, time_limit) VALUES 
      ('${medicLesson1.id}', 'Professional Emergency Medical Response Assessment', 25)
    `);
    
    const quizResult = await db.execute(`SELECT id FROM quizzes WHERE lesson_id = '${medicLesson1.id}'`);
    const quizId = quizResult.rows[0]?.id;
    
    if (quizId) {
      await db.execute(`
        INSERT INTO questions (quiz_id, prompt, a, b, c, d, answer, "order") VALUES 
        ('${quizId}', 'In the ABCDE emergency assessment protocol, what is the correct systematic sequence?', 'Airway patency, Breathing adequacy, Circulation status, Disability assessment, Exposure examination with sequential stabilization', 'Alert level, Blood pressure, CPR readiness, Drug administration, Emergency transport', 'Ascent procedures, Buoyancy control, Communication systems, Depth monitoring, Emergency evacuation', 'Assessment priority, Basic life support, Clinical evaluation, Diagnostic testing, Emergency procedures', 'a', 1),
        ('${quizId}', 'What is the primary difference between Type I and Type II decompression sickness?', 'Type I affects only joints, Type II affects only lungs', 'Type I involves mild joint pain and skin manifestations, Type II involves serious neurological and pulmonary complications', 'Type I occurs at shallow depths, Type II occurs at deep depths', 'Type I responds to oxygen alone, Type II requires surgery', 'b', 2),
        ('${quizId}', 'In arterial gas embolism emergency management, what is the optimal patient positioning?', 'Upright sitting position with standard oxygen', 'Left lateral recumbent position with immediate high-flow oxygen and urgent hyperbaric evacuation', 'Prone position with assisted ventilation', 'Right lateral position with standard oxygen', 'b', 3)
      `);
    }
  }

  console.log('✅ Professional diving education platform successfully seeded!');
  console.log('Created 7 comprehensive professional training tracks with AI tutors');
  console.log('Created detailed professional lessons with industry-standard content');
  console.log('Created professional assessments with comprehensive questions');
  
  console.log('\n🎓 Professional Training Tracks Created:');
  console.log('1. Inspection & Non-Destructive Testing (NDT) - Dr. Sarah Chen');
  console.log('2. Diver Medic Technician - Dr. Michael Rodriguez');
  console.log('3. Commercial Dive Supervisor - Captain James Mitchell');
  console.log('4. Air Diver Certification - Lisa Thompson');
  console.log('5. Saturation Diver Training - Commander Robert Hayes');
  console.log('6. Assistant Life Support Technician (ALST) - David Kim');
  console.log('7. Life Support Technician (LST) - Rebecca Foster');
}

currentDbSeed().catch(console.error).finally(() => process.exit(0));