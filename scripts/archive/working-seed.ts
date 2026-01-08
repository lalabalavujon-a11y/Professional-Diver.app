import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema-sqlite.js';

async function workingSeed() {
  console.log('🌱 Seeding comprehensive professional diving education content...');

  // Clear existing data
  await db.delete(questions);
  await db.delete(quizzes);
  await db.delete(lessons);
  await db.delete(tracks);

  // Create the 7 comprehensive professional diving tracks (using only existing columns)
  const [ndtTrack] = await db.insert(tracks).values({
    title: "Inspection & Non-Destructive Testing (NDT)",
    slug: "inspection-ndt",
    summary: "AI-powered comprehensive training in underwater inspection techniques, corrosion assessment, cathodic protection surveying, thickness gauging, magnetic particle inspection, and professional documentation standards for commercial diving operations. Features expert AI tutor Dr. Sarah Chen specializing in NDT and inspection techniques.",
    isPublished: true,
  }).returning();

  const [medicTrack] = await db.insert(tracks).values({
    title: "Diver Medic Technician", 
    slug: "diver-medic-technician",
    summary: "Advanced medical training with AI tutor Dr. Michael Rodriguez specializing in diving emergencies. Covers scene assessment, ABCDE protocols, airway management, breathing support, circulation assessment, disability evaluation, and emergency response procedures for diving operations.",
    isPublished: true,
  }).returning();

  const [supervisorTrack] = await db.insert(tracks).values({
    title: "Commercial Dive Supervisor",
    slug: "commercial-dive-supervisor", 
    summary: "AI-guided leadership training with Captain James Mitchell covering dive planning fundamentals, risk assessment methodologies, hazard identification protocols, communication systems, emergency response procedures, and quality assurance for commercial diving operations.",
    isPublished: true,
  }).returning();

  const [airDiverTrack] = await db.insert(tracks).values({
    title: "Air Diver Certification",
    slug: "air-diver-certification",
    summary: "Essential air diving skills with AI tutor Lisa Thompson including diving physics review, gas management concepts, ascent best practices, problem-solving drills, tool handling safety, and basic communications for professional diving operations.",
    isPublished: true,
  }).returning();

  const [satDiverTrack] = await db.insert(tracks).values({
    title: "Saturation Diver Training",
    slug: "saturation-diver-training",
    summary: "Specialized AI-assisted training with Commander Robert Hayes for saturation diving operations, system components and operation, human factors in confined environments, risk assessment themes, and life support systems for deep-sea commercial operations.",
    isPublished: true,
  }).returning();

  const [alstTrack] = await db.insert(tracks).values({
    title: "Assistant Life Support Technician (ALST)",
    slug: "assistant-life-support-technician", 
    summary: "AI tutor David Kim guides life support system operation training, gas management principles, environmental control systems, emergency procedures, equipment maintenance protocols, and safety systems essential for diving support operations.",
    isPublished: true,
  }).returning();

  const [lstTrack] = await db.insert(tracks).values({
    title: "Life Support Technician (LST)",
    slug: "life-support-technician",
    summary: "Advanced AI-powered training with Rebecca Foster covering life support systems, system design principles, troubleshooting methodologies, emergency management procedures, team leadership skills, and quality assurance protocols for senior technical positions.",
    isPublished: true,
  }).returning();

  // NDT Track - Professional Content
  const [ndtLesson1] = await db.insert(lessons).values({
    trackId: ndtTrack.id,
    title: "Visual Inspection Fundamentals",
    order: 1,
    content: `# Visual Inspection Fundamentals

## AI Tutor: Dr. Sarah Chen - NDT & Inspection Specialist
*Expert in Non-Destructive Testing and Inspection with 15+ years in underwater inspection techniques, corrosion assessment, and CP surveying.*

Welcome to professional underwater visual inspection training! I'm Dr. Sarah Chen, and I'll be your AI tutor specializing in Non-Destructive Testing and underwater inspection techniques. Let's master the systematic methodologies used in commercial diving operations.

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

## Professional Defect Identification and Classification

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

#### Crevice Corrosion Investigation
- **Typical Location Identification**: Confined spaces, structural joint areas, under marine growth deposits
- **Detection Challenges**: Often hidden from direct view, requires systematic cleaning for complete assessment
- **Professional Documentation**: Access photographs with measurement scales, comprehensive dimensional surveys
- **Prevention Recommendations**: Design modification suggestions for improved future maintenance accessibility

#### Galvanic Corrosion Professional Evaluation
- **Recognition Patterns**: Preferential metal attack at dissimilar metal connections and interfaces
- **Analysis Methodology**: Anode/cathode identification using electrochemical galvanic series principles
- **Measurement Protocol**: Extent of preferential attack documentation, remaining material structural integrity
- **Professional Recommendations**: Electrical isolation methods, cathodic protection system effectiveness assessment

## Professional Documentation Standards

### Real-Time Field Recording Protocol
Systematic documentation during commercial inspection operations:

#### Location Identification Systems
- **GPS Coordinate Systems**: Surface reference points with sub-meter accuracy requirements for positioning
- **Structural Grid References**: Platform coordinate systems, structural member identification protocols
- **Depth Reference Standards**: Chart datum, mean sea level, structure-specific datum reference systems
- **Orientation Documentation**: Magnetic compass headings, structural reference bearing documentation

#### Defect Characterization Professional Protocol
- **Industry Classification Systems**: Standard defect categories per AWS D3.6M, NACE, and API standards
- **Dimensional Recording Standards**: Digital calipers, measurement scales, comprehensive photographic documentation
- **Severity Assessment Criteria**: Structural significance evaluation, safety implications comprehensive analysis
- **Priority Ranking System**: Immediate, short-term, and long-term action requirements with cost implications

### Professional Photography Standards
High-quality underwater documentation techniques for commercial operations:

#### Technical Requirements for Commercial Documentation
- **Resolution Standards**: Minimum 24 megapixel cameras for detailed professional defect documentation
- **Professional Lighting**: Multiple source illumination systems, shadow elimination lighting techniques
- **Scale Reference Requirements**: Calibrated measurement devices visible in all detailed documentation photographs
- **Multiple Perspective Protocol**: Overview, detail, and profile perspectives for complete visual documentation

## Safety Integration and Professional Risk Management

### Commercial Diving Hazard Recognition Protocol
Professional safety considerations during underwater inspection operations:

#### Structural Safety Hazards
- **Instability Assessment Protocol**: Compromised structural integrity professional evaluation procedures
- **Sharp Edge Management**: Cut protection systems, safe handling procedures for damaged structures
- **Falling Object Risk Assessment**: Loose component evaluation, debris hazard comprehensive analysis
- **Confined Space Entry Protocol**: Limited access area safety procedures, emergency egress planning

#### Environmental Safety Factors
- **Current Condition Operating Limits**: Working current thresholds, emergency response procedures
- **Visibility Management**: Adequate lighting requirements, navigation safety protocols
- **Marine Life Hazard Assessment**: Hazardous species awareness, avoidance procedures
- **Contamination Risk Evaluation**: Water quality assessment, biological hazard protection protocols

## Professional Practice Scenario

**Commercial Scenario**: Complete professional visual inspection of offshore platform leg showing corrosion evidence and marine growth accumulation at 18-meter depth with 4-meter visibility conditions.

### Pre-Dive Professional Briefing
- **Structure Service History**: 12-year-old platform operational history, previous inspection findings
- **Environmental Operating Conditions**: 2-knot current, 18°C water temperature, moderate sea state
- **Commercial Work Scope**: 4x4 meter inspection area, client documentation requirements
- **Safety Considerations**: Sharp edges from previous repair work, overhead structural hazards

### Professional Inspection Task Sequence
1. **Initial Safety and Area Assessment**: Overall condition survey, safety hazard identification
2. **Systematic Marine Growth Removal**: Professional cleaning using appropriate commercial tools
3. **Grid Pattern Professional Inspection**: 2x2 meter systematic coverage with required overlap
4. **Professional Defect Documentation**: Photography with measurement scales, detailed recording
5. **Structural Integrity Assessment**: Load path evaluation, commercial repair priority determination

### Professional Deliverables
- **Comprehensive Field Notes**: Real-time observation recording with technical sketches
- **Professional Photographic Documentation**: Minimum 50 high-resolution images with measurement scales  
- **Complete Dimensional Survey**: Comprehensive defect measurement inventory with engineering calculations
- **Professional Assessment Report**: Structural significance evaluation with prioritized repair recommendations
- **Priority Matrix**: Risk-based repair scheduling with comprehensive cost-benefit analysis

This comprehensive training with AI tutoring provides the professional foundation required for commercial diving NDT operations, ensuring consistent, reliable results meeting industry standards and regulatory requirements.`,
  }).returning();

  const [ndtLesson2] = await db.insert(lessons).values({
    trackId: ndtTrack.id,
    title: "Corrosion Assessment Techniques",
    order: 2,
    content: `# Corrosion Assessment Techniques

## AI Tutor: Dr. Sarah Chen - Corrosion Assessment Expert
*Specialized in underwater corrosion assessment, electrochemical processes, and marine environment analysis*

Advanced corrosion assessment techniques are essential for professional underwater operations. I'll guide you through electrochemical processes, measurement methods, and industry standards for marine environments.

## Professional Corrosion Assessment Framework

### Electrochemical Fundamentals
Understanding corrosion science for professional assessment:

#### Corrosion Cell Components in Marine Environment
- **Anode (Oxidation Reaction)**: Metal dissolution releasing electrons (Fe → Fe²⁺ + 2e⁻)
- **Cathode (Reduction Reaction)**: Electron consumption (O₂ + 4H⁺ + 4e⁻ → 2H₂O)
- **Electrolyte Function**: Seawater providing ionic conductivity (35,000 ppm dissolved salts)
- **Metallic Current Path**: Electron flow through structural steel components

#### Marine Environment Corrosion Factors
- **Chloride Ion Concentration**: Aggressive attack mechanism (19,000 ppm typical seawater)
- **Dissolved Oxygen Availability**: Cathodic reaction support, depth-dependent variations
- **Temperature Gradient Effects**: Corrosion rate doubling every 10°C temperature increase
- **pH Variation Impact**: Local acidity effects from marine biological activity

### Assessment Methodology Standards

#### Visual Corrosion Assessment Protocol
Professional visual evaluation techniques:

**Surface Condition Classification**:
- **Grade A (Excellent)**: No visible corrosion, intact protective coating systems
- **Grade B (Good)**: Light surface corrosion, 5-25% surface area affected
- **Grade C (Fair)**: Moderate corrosion damage, 25-50% surface area affected
- **Grade D (Poor)**: Heavy corrosion damage, >50% area affected with significant metal loss

**Professional Pattern Recognition**:
- **Uniform Attack Pattern**: Even metal loss distribution across large structural areas
- **Localized Corrosion Pattern**: Concentrated attack in specific environmental zones
- **Preferential Corrosion Pattern**: Selective attack on specific metallurgical phases
- **Microbiologically Influenced Pattern**: Bacterial colony-associated corrosion patterns

#### Quantitative Assessment Techniques

**Half-Cell Potential Measurement Protocol**:
- **Reference Electrode Standard**: Silver/Silver Chloride (Ag/AgCl) in seawater electrolyte
- **Measurement Grid System**: 1-meter spacing for detailed commercial surveys
- **Professional Interpretation**: More negative potentials indicate active corrosion processes
- **Industry Standards**: ASTM C876 modified for marine underwater applications

**Professional Measurement Steps**:
1. **Equipment Calibration**: Daily verification using certified standard solutions
2. **Grid Establishment**: Systematic measurement point layout with GPS coordination
3. **Contact Verification**: Proper electrical connection confirmation with structure
4. **Data Recording**: Potential values with precise location coordinates
5. **Trend Analysis**: Statistical comparison with previous survey data

## Cathodic Protection Assessment

### Industry Protection Criteria
Professional protection standards for marine structures:

#### Primary Professional Criteria
- **-850 mV (Ag/AgCl)**: Industry standard minimum protection potential for carbon steel
- **Polarization Decay Test**: 100 mV shift requirement from native corrosion potential
- **Current Density Range**: 20-50 mA/m² typical protection current requirements
- **Environmental Corrections**: Temperature and salinity adjustment calculations

#### Assessment Procedures
**Instant-Off Potential Measurement**:
- **Purpose**: Eliminate ohmic (IR) drop effects for accurate steel potential
- **Technique**: Momentary cathodic current interruption, rapid potential reading
- **Equipment**: High-speed data logging systems, synchronized interruption equipment
- **Interpretation**: True steel electrochemical potential without voltage influences

### Common Protection System Problems

#### Inadequate Protection Issues
- **Insufficient Current**: Anode capacity limitations or galvanic anode depletion
- **Poor Distribution**: Current shadowing behind large structural components
- **High Resistance**: Connection deterioration, protective coating breakdown
- **Design Limitations**: Inadequate anode quantity or suboptimal placement

**Diagnostic Techniques**:
- **Current Distribution Surveys**: Anode effectiveness evaluation mapping
- **Resistance Measurements**: Connection integrity verification testing
- **Anode Condition Assessment**: Consumption rate and remaining life calculation
- **Performance Trending**: Historical effectiveness analysis over time

This comprehensive corrosion assessment training ensures professional competency in advanced underwater inspection techniques for commercial diving operations.`,
  }).returning();

  // Diver Medic Track
  const [medicLesson1] = await db.insert(lessons).values({
    trackId: medicTrack.id,
    title: "ABCDE Emergency Assessment Protocol",
    order: 1,
    content: `# ABCDE Emergency Assessment Protocol

## AI Tutor: Dr. Michael Rodriguez - Emergency Medicine Specialist
*Emergency medicine specialist focused on diving-related medical emergencies, hyperbaric treatment, and underwater rescue protocols*

Welcome to professional emergency medical response training! I'm Dr. Michael Rodriguez, your AI tutor specializing in diving medical emergencies. The ABCDE protocol provides a systematic, life-saving approach for managing diving emergencies with optimal patient outcomes.

## ABCDE Protocol Professional Framework

### Primary Assessment Sequence
The ABCDE approach requires strict sequential order:
- **A**: Airway management and patency assessment
- **B**: Breathing evaluation and ventilation support
- **C**: Circulation assessment and hemorrhage control
- **D**: Disability (Neurological) evaluation and protection
- **E**: Exposure/Environment control and complete examination

**Critical Principle**: Each step must be completed and stabilized before progressing to the next, with immediate life-saving interventions taking absolute priority.

## A - Airway Assessment and Management

### Comprehensive Initial Assessment
Professional **Look, Listen, Feel** systematic approach:
- **Visual Assessment**: Chest movement patterns, facial cyanosis, visible foreign objects
- **Auditory Assessment**: Air movement sounds, vocalization ability, abnormal breathing noises  
- **Tactile Assessment**: Air flow sensation at nose/mouth, chest rise confirmation

### Airway Obstruction Recognition
**Complete Obstruction Emergency Signs**:
- Absent air movement despite obvious respiratory effort and distress
- Silent chest presentation with visible distress and panic
- Rapid progression to unconsciousness and cyanosis
- Complete inability to cough, speak, or vocalize

**Partial Obstruction Warning Signs**:
- Stridor (high-pitched inspiratory sound indicating upper airway narrowing)
- Significantly diminished air movement with increased respiratory effort
- Use of accessory breathing muscles indicating respiratory distress
- Anxiety and agitation from developing hypoxia and air hunger

### Professional Management Techniques

#### Basic Airway Management
1. **Head Tilt-Chin Lift**: Primary positioning technique for unconscious patients
   - Place hand on forehead, apply gentle backward pressure
   - Use fingertips to lift chin upward (avoid soft tissue pressure)
   - Maintain neutral spine alignment if spinal injury suspected

2. **Jaw Thrust**: Alternative for suspected spinal injury
   - Position at patient's head for optimal leverage
   - Place fingers behind jaw angles, lift jaw forward
   - Maintain head and neck stabilization throughout

#### Advanced Airway Clearance
- **Manual Removal**: Finger sweep for visible foreign objects
- **Suction Clearance**: Professional devices for fluid or debris
- **Patient Positioning**: Log roll for drainage with spinal alignment
- **Back Blow Technique**: Conscious choking victim intervention

### Professional Advanced Management
- **Oropharyngeal Airway**: Unconscious patients without gag reflex
- **Nasopharyngeal Airway**: Conscious or semiconscious patients
- **Bag-Valve-Mask**: Positive pressure ventilation for inadequate breathing
- **Advanced Airways**: Endotracheal intubation when trained and equipped

## B - Breathing Assessment and Support

### Comprehensive Evaluation
Professional assessment of **Rate, Rhythm, Quality, Effort**:
- **Respiratory Rate**: Normal adult range 12-20 breaths per minute
- **Breathing Rhythm**: Regular versus irregular breathing patterns  
- **Quality Analysis**: Deep versus shallow, effective versus ineffective
- **Effort Assessment**: Accessory muscles, signs of respiratory distress

### Professional Emergency Management

#### Respiratory Arrest Protocol
- **Recognition**: Complete absence of chest movement, no detectable air flow
- **Management**: Institute rescue breathing immediately without delay
- **Ventilation Rate**: 10-12 assisted breaths per minute for adults
- **Volume**: Sufficient to produce visible chest rise with each breath

#### Respiratory Distress Management
- **Recognition**: Increased rate, labored breathing, accessory muscle use
- **Positioning**: Upright position if conscious and no spinal contraindications
- **Oxygen Therapy**: High-flow oxygen if available and trained
- **Monitoring**: Ongoing assessment of effectiveness and patient response

### Diving-Specific Emergencies

#### Pulmonary Barotrauma Management
- **Pneumothorax Recognition**: Sudden chest pain, severe breathing difficulty, decreased sounds
- **Emergency Management**: High-flow oxygen, upright positioning, urgent evacuation
- **Tension Pneumothorax**: Life-threatening condition requiring needle decompression
- **Prevention Education**: Proper ascent procedures, lung overexpansion awareness

#### Near Drowning Protocol
- **Laryngospasm Recognition**: Vocal cord spasm preventing air entry
- **Pulmonary Edema Management**: Fluid accumulation requiring ventilation support
- **Aspiration Concerns**: Inhaled water or foreign material requiring clearance
- **Management**: Optimal airway positioning, assisted ventilation, high-flow oxygen

## C - Circulation Assessment and Management

### Professional Pulse Assessment
**Location Selection and Clinical Significance**:
- **Carotid Pulse**: Central pulse, optimal for emergency assessment and CPR
- **Radial Pulse**: Peripheral pulse indicating systolic pressure >90 mmHg
- **Femoral Pulse**: Strong central pulse useful in shock states
- **Brachial Pulse**: Primary for infants and blood pressure measurement

**Quality Interpretation**:
- **Strong and Regular**: Normal cardiovascular function and adequate circulation
- **Weak and Thready**: Shock states, dehydration, significant blood loss
- **Irregular Pattern**: Cardiac arrhythmias, electrolyte imbalances
- **Absent Pulse**: Cardiac arrest, severe shock, local vascular injury

#### Professional Bleeding Control
**Progressive Control Protocol**:
1. **Direct Pressure**: Primary method for external bleeding control
2. **Extremity Elevation**: Raise injured extremity above heart level
3. **Arterial Pressure Points**: Strategic pressure for extremity bleeding
4. **Tourniquet Application**: Last resort for life-threatening extremity hemorrhage

**Internal Bleeding Recognition**:
- **Abdominal Distension**: Potential intra-abdominal hemorrhage
- **Chest Pain with Dyspnea**: Possible hemothorax or cardiac tamponade
- **Neurological Changes**: Potential intracranial bleeding
- **Shock Presentation**: Hypotension, tachycardia, altered mental status

## D - Disability (Neurological Assessment)

### Professional Consciousness Evaluation
**AVPU Scale Application**:
- **Alert**: Awake, oriented to person/place/time, following commands appropriately
- **Voice Responsive**: Responds to verbal stimuli, may be disoriented
- **Pain Responsive**: Responds only to painful stimulation
- **Unresponsive**: No response to verbal or painful stimuli

#### Diving-Specific Neurological Emergencies
**Decompression Sickness Assessment**:
- **Type I DCS**: Joint pain (bends), skin changes, lymphatic swelling
- **Type II DCS**: Neurological symptoms, pulmonary involvement, serious manifestations
- **Assessment**: Symptom onset timing correlation with dive profile
- **Management**: High-flow oxygen, supine positioning, rapid evacuation

**Arterial Gas Embolism Protocol**:
- **Recognition**: Immediate neurological symptoms upon surfacing
- **Symptoms**: Focal neurological deficits, altered consciousness
- **Management**: Immediate high-flow oxygen, left lateral positioning
- **Evacuation**: Urgent hyperbaric treatment facility transport

## E - Exposure and Environmental Assessment

### Complete Patient Examination
**Systematic Exposure Protocol**:
- **Privacy Preservation**: Maintain patient dignity during examination
- **Hypothermia Prevention**: Minimize heat loss, provide warming
- **Complete Assessment**: Identify all injuries and medical conditions
- **Evidence Preservation**: Document all injuries, preserve legal evidence

#### Environmental Injury Management
**Hypothermia Recognition and Treatment**:
- **Mild (90-95°F)**: Shivering, increased heart rate, confusion
- **Moderate (82-90°F)**: Decreased shivering, muscle rigidity, altered mental status
- **Severe (<82°F)**: Cardiac arrhythmias, unconsciousness, apparent death
- **Treatment**: Gradual rewarming, gentle handling, insulation, warm environment

## Professional Emergency Communication

### Medical Emergency Reporting
**Critical Information for Medical Control**:
- **Scene Description**: Exact location, environmental conditions, safety status
- **Patient Information**: Age, sex, consciousness level, vital signs
- **Mechanism**: Detailed dive profile, symptom onset timing, current condition
- **Treatment Provided**: All interventions performed, patient response
- **Resources Required**: Equipment, personnel, transportation requirements

### Documentation Requirements
**Legal and Medical Documentation**:
- **Incident Timeline**: Precise timing of all events and interventions
- **Patient Assessment**: Complete ABCDE findings and serial reassessments
- **Treatment Record**: All interventions with exact times and responses
- **Witness Information**: Contact details for follow-up investigation
- **Equipment Status**: Condition and operational status of emergency equipment

This comprehensive ABCDE training with AI tutoring ensures systematic, professional emergency response capabilities essential for diving operations safety and medical care effectiveness.`,
  }).returning();

  // Create comprehensive assessments
  const [ndtAssessment] = await db.insert(quizzes).values({
    lessonId: ndtLesson1.id,
    title: "Professional NDT Assessment - Visual Inspection Mastery",
    timeLimit: 30,
  }).returning();

  await db.insert(questions).values([
    {
      quizId: ndtAssessment.id,
      prompt: "In professional commercial underwater inspection operations, what is the primary advantage of systematic grid pattern inspection methodology?",
      options: JSON.stringify({
        a: "Reduces total inspection time and operational costs significantly",
        b: "Ensures complete systematic coverage with quality assurance verification and eliminates missed critical structural areas",
        c: "Minimizes specialized lighting and equipment requirements for operations",
        d: "Reduces diver physical exertion and gas consumption rates during work"
      }),
      correctAnswer: "b",
      order: 1,
    },
    {
      quizId: ndtAssessment.id,
      prompt: "Which corrosion type is most commonly associated with dissimilar metal connections in marine environments and requires electrochemical galvanic series analysis for assessment?",
      options: JSON.stringify({
        a: "General uniform corrosion across large surface areas of structures",
        b: "Localized pitting corrosion with high depth-to-diameter ratios",
        c: "Galvanic corrosion with preferential anode attack at connection points and interfaces",
        d: "Crevice corrosion in confined joint spaces and under marine growth deposits"
      }),
      correctAnswer: "c", 
      order: 2,
    },
    {
      quizId: ndtAssessment.id,
      prompt: "According to NACE industry standards for cathodic protection, what is the minimum protection potential for steel structures in seawater using Silver/Silver Chloride reference electrode?",
      options: JSON.stringify({
        a: "-750 mV (Ag/AgCl) with polarization verification",
        b: "-850 mV (Ag/AgCl) with instant-off potential measurement",
        c: "-950 mV (Ag/AgCl) with current density confirmation",
        d: "-650 mV (Ag/AgCl) with environmental correction factors"
      }),
      correctAnswer: "b",
      order: 3,
    },
  ]);

  const [medicAssessment] = await db.insert(quizzes).values({
    lessonId: medicLesson1.id,
    title: "Professional Emergency Medical Response Assessment", 
    timeLimit: 25,
  }).returning();

  await db.insert(questions).values([
    {
      quizId: medicAssessment.id,
      prompt: "In the professional ABCDE emergency assessment protocol for diving emergencies, what is the correct systematic sequence and primary clinical focus of each component?",
      options: JSON.stringify({
        a: "Airway patency assessment, Breathing adequacy evaluation, Circulation status check, Disability neurological assessment, Exposure complete examination with sequential stabilization",
        b: "Alert level determination, Blood pressure measurement, CPR readiness assessment, Drug administration protocol, Emergency transport preparation",
        c: "Ascent procedure verification, Buoyancy control assessment, Communication system check, Depth monitoring evaluation, Emergency evacuation preparation",
        d: "Assessment priority determination, Basic life support initiation, Clinical evaluation completion, Diagnostic testing performance, Emergency procedure implementation"
      }),
      correctAnswer: "a",
      order: 1,
    },
    {
      quizId: medicAssessment.id,
      prompt: "What is the primary clinical difference between Type I and Type II decompression sickness in terms of symptom presentation and treatment urgency requirements?",
      options: JSON.stringify({
        a: "Type I affects only joint systems with delayed onset, Type II affects only pulmonary systems with immediate onset",
        b: "Type I involves mild joint pain and skin manifestations with lower urgency, Type II involves serious neurological and pulmonary complications requiring immediate intervention",
        c: "Type I occurs exclusively at shallow recreational depths, Type II occurs exclusively at deep commercial diving depths",
        d: "Type I responds to surface oxygen therapy alone, Type II requires immediate surgical intervention and advanced life support"
      }),
      correctAnswer: "b",
      order: 2,
    },
    {
      quizId: medicAssessment.id,
      prompt: "In arterial gas embolism (AGE) emergency management, what is the optimal patient positioning and immediate treatment protocol for maximum effectiveness?",
      options: JSON.stringify({
        a: "Upright sitting position with standard oxygen therapy and gradual ascent procedures",
        b: "Left lateral recumbent position with immediate high-flow oxygen therapy and urgent hyperbaric facility evacuation",
        c: "Prone position with assisted mechanical ventilation and intravenous fluid administration",
        d: "Right lateral position with standard oxygen therapy and delayed transport to medical facility"
      }),
      correctAnswer: "b",
      order: 3,
    },
  ]);

  console.log('✅ Professional diving education platform successfully seeded with comprehensive content!');
  console.log(`Created ${await db.select().from(tracks).then(r => r.length)} comprehensive professional training tracks`);
  console.log(`Created ${await db.select().from(lessons).then(r => r.length)} detailed professional lessons with AI tutors`);
  console.log(`Created ${await db.select().from(quizzes).then(r => r.length)} professional assessments`);
  console.log(`Created ${await db.select().from(questions).then(r => r.length)} comprehensive assessment questions`);
  
  console.log('\n🎓 Professional Training Tracks Created with AI Tutors:');
  console.log('1. Inspection & Non-Destructive Testing (NDT) - AI Tutor: Dr. Sarah Chen');
  console.log('2. Diver Medic Technician - AI Tutor: Dr. Michael Rodriguez');
  console.log('3. Commercial Dive Supervisor - AI Tutor: Captain James Mitchell');
  console.log('4. Air Diver Certification - AI Tutor: Lisa Thompson');
  console.log('5. Saturation Diver Training - AI Tutor: Commander Robert Hayes');
  console.log('6. Assistant Life Support Technician (ALST) - AI Tutor: David Kim');
  console.log('7. Life Support Technician (LST) - AI Tutor: Rebecca Foster');

  console.log('\n📚 Enhanced Features Integrated:');
  console.log('- AI tutors embedded in lesson content with specialist backgrounds');
  console.log('- Professional-grade comprehensive lesson content'); 
  console.log('- Industry-standard assessment questions');
  console.log('- Real-world commercial diving scenarios');
  console.log('- Professional documentation and safety protocols');
}

workingSeed().catch(console.error).finally(() => process.exit(0));