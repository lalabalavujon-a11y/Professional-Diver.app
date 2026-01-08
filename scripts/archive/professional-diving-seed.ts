import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema.js';

async function professionalDivingSeed() {
  console.log('🌱 Seeding professional diving education content...');

  // Clear existing data
  await db.delete(questions);
  await db.delete(quizzes);
  await db.delete(lessons);
  await db.delete(tracks);

  // Create the 7 comprehensive professional diving tracks
  const [ndtTrack] = await db.insert(tracks).values({
    title: "Inspection & Non-Destructive Testing (NDT)",
    slug: "inspection-ndt",
    summary: "Comprehensive training in underwater inspection techniques, corrosion assessment, cathodic protection surveying, thickness gauging, magnetic particle inspection, and professional documentation standards.",
    isPublished: true,
  }).returning();

  const [medicTrack] = await db.insert(tracks).values({
    title: "Diver Medic Technician",
    slug: "diver-medic-technician",
    summary: "Advanced medical training for diving emergencies including scene assessment, ABCDE protocols, airway management, breathing support, circulation assessment, and emergency response procedures.",
    isPublished: true,
  }).returning();

  const [supervisorTrack] = await db.insert(tracks).values({
    title: "Commercial Dive Supervisor",
    slug: "commercial-dive-supervisor",
    summary: "Leadership and management training covering dive planning fundamentals, risk assessment methodologies, hazard identification, communication protocols, and emergency response coordination.",
    isPublished: true,
  }).returning();

  const [airDiverTrack] = await db.insert(tracks).values({
    title: "Air Diver Certification",
    slug: "air-diver-certification", 
    summary: "Essential air diving skills including diving physics review, gas management concepts, ascent best practices, problem-solving drills, tool handling safety, and basic communications.",
    isPublished: true,
  }).returning();

  const [satDiverTrack] = await db.insert(tracks).values({
    title: "Saturation Diver Training",
    slug: "saturation-diver-training",
    summary: "Specialized training for saturation diving operations, system components and operation, human factors in confined environments, high-level risk assessment, and life support systems.",
    isPublished: true,
  }).returning();

  const [alstTrack] = await db.insert(tracks).values({
    title: "Assistant Life Support Technician (ALST)",
    slug: "assistant-life-support-technician",
    summary: "Essential training for life support system operation, gas management principles, environmental control systems, emergency procedures, equipment maintenance, and safety protocols.",
    isPublished: true,
  }).returning();

  const [lstTrack] = await db.insert(tracks).values({
    title: "Life Support Technician (LST)",
    slug: "life-support-technician",
    summary: "Advanced life support systems training, system design principles, troubleshooting methodologies, emergency management, team leadership, and quality assurance protocols.",
    isPublished: true,
  }).returning();

  // NDT Track Lessons
  const [ndtLesson1] = await db.insert(lessons).values({
    trackId: ndtTrack.id,
    title: "Visual Inspection Fundamentals",
    order: 1,
    content: `# Visual Inspection Fundamentals

**AI Tutor: Dr. Sarah Chen - Expert in Non-Destructive Testing and Inspection**

Visual inspection forms the foundation of underwater non-destructive testing. This comprehensive module covers industry-standard techniques and protocols used in commercial diving operations.

## Learning Objectives
- Master systematic visual inspection methodologies
- Understand defect identification and classification
- Learn proper underwater documentation techniques
- Apply industry safety protocols and standards

## Systematic Inspection Approach

### Pre-Inspection Planning
Professional inspection requires thorough preparation:

1. **Document Review**
   - Study structural drawings and specifications
   - Review previous inspection reports and findings
   - Understand expected defect types and critical areas
   - Identify environmental and operational constraints

2. **Equipment Preparation**
   - Underwater cameras with appropriate lighting
   - Measuring devices (calipers, thickness gauges)
   - Cleaning tools for surface preparation
   - Documentation materials (slates, forms)

3. **Safety Planning**
   - Hazard identification and risk assessment
   - Emergency response procedures
   - Communication protocols
   - Environmental monitoring requirements

### Inspection Methodologies

#### Grid Pattern Technique
Systematic coverage using overlapping inspection grids:
- **Grid Size**: Typically 2-4 square meters per section
- **Overlap**: Minimum 10% between adjacent areas
- **Documentation**: Mark completed areas on drawings
- **Quality Control**: Independent verification of critical zones

#### Zone-Based Inspection
Dividing structures into logical inspection zones:
- **Primary Zones**: High-stress, critical structural areas
- **Secondary Zones**: General structural components
- **Tertiary Zones**: Non-critical but monitored areas
- **Access Routes**: Safe pathways between zones

## Defect Identification

### Corrosion Types and Recognition

#### General Corrosion
- **Characteristics**: Uniform surface deterioration
- **Appearance**: Even metal loss across large areas
- **Measurement**: Thickness reduction patterns
- **Documentation**: Area coverage and depth measurements

#### Pitting Corrosion
- **Characteristics**: Localized deep penetration
- **Appearance**: Small holes with varying depths
- **Measurement**: Individual pit dimensions
- **Critical Factor**: Depth-to-diameter ratio

#### Crevice Corrosion
- **Characteristics**: Confined space deterioration
- **Common Locations**: Joints, gaskets, under deposits
- **Detection**: Often hidden, requires disassembly
- **Prevention**: Design modification recommendations

#### Galvanic Corrosion
- **Characteristics**: Dissimilar metal contact corrosion
- **Pattern**: Preferential attack on anodic material
- **Location**: Electrical connection points
- **Identification**: Reference galvanic series

### Structural Defects

#### Fatigue Cracking
- **Characteristics**: Cyclical stress-induced failures
- **Appearance**: Linear cracks, often multiple
- **Growth Pattern**: Progressive extension over time
- **Critical Areas**: Weld toes, stress concentrations

#### Weld Defects
- **Lack of Fusion**: Incomplete joint formation
- **Porosity**: Gas bubble inclusions
- **Undercut**: Groove along weld toe
- **Distortion**: Shape changes from welding

## Documentation Standards

### Field Recording Requirements
All observations must be systematically documented:

#### Location Identification
- **Coordinate Systems**: GPS, structural grid references
- **Elevation Data**: Depth measurements from datum
- **Orientation**: Cardinal directions, structural references
- **Access Routes**: Path documentation for future inspections

#### Defect Characterization
- **Type Classification**: Standard defect categories
- **Dimensional Data**: Length, width, depth measurements
- **Severity Assessment**: Impact on structural integrity
- **Photographic Evidence**: Multiple angles with scales

#### Environmental Conditions
- **Visibility**: Water clarity, lighting conditions
- **Current**: Direction, velocity measurements
- **Temperature**: Water and air temperatures
- **Marine Growth**: Type, thickness, coverage

### Professional Reporting

#### Immediate Notifications
Critical findings requiring immediate action:
- **Safety Hazards**: Imminent structural failure risk
- **Environmental Threats**: Pollution potential
- **Operational Impacts**: Service interruption risks
- **Emergency Responses**: Required immediate actions

#### Formal Reports
Comprehensive documentation including:
- **Executive Summary**: Key findings and recommendations
- **Detailed Findings**: Complete defect inventory
- **Risk Assessment**: Failure probability and consequences
- **Recommendations**: Repair priorities and methods

## Quality Assurance Protocols

### Inspection Validation
Ensuring consistent, reliable results:
- **Calibration**: Equipment accuracy verification
- **Technique Verification**: Method effectiveness confirmation
- **Peer Review**: Independent result validation
- **Statistical Analysis**: Trend identification and analysis

### Professional Standards
Adherence to industry standards:
- **AWS D3.6M**: Underwater Welding Code
- **NACE Standards**: Corrosion assessment protocols
- **API Standards**: Offshore structure inspection requirements
- **Company Procedures**: Client-specific requirements

## Safety Integration

### Hazard Recognition
Common inspection safety hazards:
- **Structural Instability**: Compromised structural integrity
- **Sharp Edges**: Cut hazards from damaged materials
- **Confined Spaces**: Limited escape route areas
- **Contamination**: Hazardous material exposure

### Emergency Procedures
Response protocols for discovered hazards:
- **Immediate Withdrawal**: When to abort inspection
- **Surface Notification**: Critical finding communication
- **Area Isolation**: Hazard containment procedures
- **Follow-up Actions**: Required safety measures

## Practice Scenario: Offshore Platform Inspection

**Scenario**: Visual inspection of offshore platform leg showing corrosion and marine growth at 15-meter depth with 3-meter visibility.

**Task Requirements**:
1. Remove marine growth from 2×2 meter inspection area
2. Document corrosion patterns with photographs
3. Measure affected areas and penetration depths
4. Check weld integrity at structural joints
5. Record findings using standard documentation

**Expected Actions**:
- Systematic marine growth removal using appropriate tools
- Grid-pattern inspection with overlapping coverage
- Photographic documentation with measurement scales
- Detailed dimensional recording of defects
- Safety protocol adherence throughout inspection

**Assessment Criteria**:
- Completeness of coverage (no missed areas)
- Accuracy of measurements and documentation  
- Quality of photographic evidence
- Adherence to safety protocols
- Professional reporting standards

This foundation in visual inspection provides the basis for all advanced NDT techniques and ensures consistent, professional results in commercial diving operations.`,
  }).returning();

  const [ndtLesson2] = await db.insert(lessons).values({
    trackId: ndtTrack.id,
    title: "Corrosion Assessment Techniques",
    order: 2,
    content: `# Corrosion Assessment Techniques

**AI Tutor: Dr. Sarah Chen - Underwater Corrosion Assessment Specialist**

Professional corrosion assessment requires understanding electrochemical processes, measurement techniques, and industry standards for underwater environments.

## Corrosion Fundamentals

### Electrochemical Process
Underwater corrosion occurs through electrochemical reactions:

#### Basic Corrosion Cell
- **Anode**: Metal dissolution (oxidation)
- **Cathode**: Electron consumption (reduction)
- **Electrolyte**: Seawater conducting current
- **Metallic Path**: Electron flow through structure

#### Driving Forces
- **Potential Differences**: Metal composition variations
- **Concentration Cells**: Oxygen or salt concentration gradients
- **Temperature Effects**: Reaction rate acceleration
- **pH Variations**: Local acidity/alkalinity changes

### Marine Environment Factors

#### Seawater Characteristics
- **High Conductivity**: Excellent electrolyte
- **Oxygen Content**: Cathodic reaction support
- **Chloride Concentration**: Aggressive ion presence
- **Temperature Gradients**: Differential corrosion rates

#### Biological Factors
- **Microbiologically Influenced Corrosion (MIC)**
- **Sulfate-Reducing Bacteria**: Hydrogen sulfide production
- **Acid-Producing Bacteria**: Local pH reduction
- **Biofilm Formation**: Differential aeration creation

## Assessment Methodologies

### Visual Assessment Techniques

#### Surface Condition Evaluation
- **Coating Condition**: Adhesion, holidays, deterioration
- **Base Metal Exposure**: Corrosion product identification
- **Pattern Recognition**: Uniform vs. localized attack
- **Color Indicators**: Corrosion product analysis

#### Measurement Techniques
- **Pit Depth Gauging**: Individual defect measurement
- **Area Assessment**: Percentage coverage calculation
- **Thickness Monitoring**: General metal loss quantification
- **Reference Comparisons**: Baseline condition evaluation

### Instrumental Techniques

#### Half-Cell Potential Measurements
**Purpose**: Identify areas of active corrosion
- **Reference Electrode**: Silver/Silver Chloride (Ag/AgCl)
- **Measurement Grid**: Systematic potential mapping
- **Interpretation**: Potential difference analysis
- **ASTM C876**: Standard practice guidelines

#### Polarization Resistance
**Purpose**: Quantify instantaneous corrosion rates
- **Linear Polarization**: Small potential perturbation
- **Stern-Geary Equation**: Rate calculation method
- **Environmental Correction**: Temperature and salinity factors
- **Continuous Monitoring**: Long-term trend analysis

## Cathodic Protection Assessment

### System Evaluation

#### Protection Criteria
- **-850 mV**: Minimum protection potential (Ag/AgCl)
- **Polarization Decay**: Native potential verification
- **100 mV Shift**: Alternative protection criterion
- **Current Density**: Protection current requirements

#### Measurement Procedures
- **Instant-Off Potential**: IR drop elimination
- **Native Potential**: Natural corrosion potential
- **Polarization Surveys**: Systematic grid measurements
- **Current Distribution**: Anode effectiveness evaluation

### Common Problems

#### Inadequate Protection
- **Insufficient Current**: Anode capacity limitations
- **Poor Distribution**: Current shadowing effects
- **High Resistance**: Connection or continuity problems
- **Coating Breakdown**: Excessive current demand

#### Over-Protection
- **Hydrogen Embrittlement**: High-strength steel risk
- **Coating Disbondment**: Alkaline condition effects
- **Calcareous Deposits**: Excessive current density
- **Interference**: Stray current effects

## Thickness Measurement

### Ultrasonic Techniques

#### Equipment Requirements
- **Frequency Selection**: Material and thickness dependent
- **Probe Types**: Contact, delay line, immersion
- **Calibration Standards**: Known thickness references
- **Surface Preparation**: Proper contact requirements

#### Measurement Procedures
- **Grid Establishment**: Systematic measurement points
- **Multiple Readings**: Statistical accuracy improvement
- **Temperature Compensation**: Velocity correction factors
- **Documentation**: Detailed recording requirements

### Interpretation Methods

#### Statistical Analysis
- **Mean Thickness**: Average remaining material
- **Standard Deviation**: Measurement scatter assessment
- **Minimum Readings**: Worst-case identification
- **Trend Analysis**: Rate of deterioration calculation

#### Acceptance Criteria
- **Design Minimum**: Structural adequacy limits
- **Safety Factors**: Conservative operation margins
- **Inspection Intervals**: Monitoring frequency requirements
- **Repair Thresholds**: Action level establishment

## Documentation and Reporting

### Field Data Collection

#### Systematic Recording
- **Location Identification**: Precise position documentation
- **Environmental Conditions**: Temperature, salinity, pH
- **Measurement Data**: Organized data collection
- **Photographic Evidence**: Before/after documentation

#### Quality Control
- **Equipment Calibration**: Daily verification procedures
- **Duplicate Measurements**: Accuracy confirmation
- **Independent Verification**: Peer review processes
- **Data Validation**: Range and consistency checks

### Professional Assessment

#### Risk Evaluation
- **Failure Probability**: Statistical analysis application
- **Consequence Assessment**: Impact evaluation
- **Risk Matrix**: Priority ranking system
- **Mitigation Strategies**: Risk reduction options

#### Recommendations
- **Immediate Actions**: Critical defect responses
- **Repair Priorities**: Risk-based ranking
- **Monitoring Programs**: Ongoing assessment needs
- **Prevention Measures**: Future protection strategies

## Practice Application: Platform Leg Assessment

**Scenario**: Comprehensive corrosion assessment of offshore platform leg with 15 years of service history.

**Assessment Tasks**:
1. Half-cell potential survey on 5×5 meter grid
2. Ultrasonic thickness measurements at critical areas
3. Cathodic protection system evaluation
4. Coating condition assessment and documentation
5. Risk-based prioritization of findings

**Professional Standards**:
- NACE SP0176: Corrosion Control of Steel Fixed Offshore Platforms
- API RP 2SIM: Structural Integrity Management
- ASTM Standards: Appropriate test methods
- Company Specifications: Client requirements

This comprehensive approach ensures professional-grade corrosion assessment supporting structural integrity management and operational safety decisions.`,
  }).returning();

  // Create NDT Assessment
  const [ndtQuiz] = await db.insert(quizzes).values({
    lessonId: ndtLesson1.id,
    title: "Professional NDT Assessment",
    timeLimit: 30,
  }).returning();

  await db.insert(questions).values([
    {
      quizId: ndtQuiz.id,
      prompt: "What is the primary advantage of using a grid pattern technique in underwater visual inspection?",
      a: "Reduces inspection time significantly",
      b: "Ensures complete systematic coverage with no missed areas",
      c: "Minimizes equipment requirements",
      d: "Reduces diver fatigue",
      answer: "b",
      order: 1,
    },
    {
      quizId: ndtQuiz.id,
      prompt: "Which type of corrosion is most commonly found at dissimilar metal connections in marine environments?",
      a: "General corrosion",
      b: "Pitting corrosion", 
      c: "Galvanic corrosion",
      d: "Crevice corrosion",
      answer: "c",
      order: 2,
    },
    {
      quizId: ndtQuiz.id,
      prompt: "What is the minimum cathodic protection potential for steel in seawater according to industry standards?",
      a: "-750 mV (Ag/AgCl)",
      b: "-850 mV (Ag/AgCl)",
      c: "-950 mV (Ag/AgCl)",
      d: "-650 mV (Ag/AgCl)",
      answer: "b",
      order: 3,
    }
  ]);

  // Diver Medic Technician Lessons
  const [medicLesson1] = await db.insert(lessons).values({
    trackId: medicTrack.id,
    title: "Emergency Response Protocols - ABCDE Assessment",
    order: 1,
    content: `# Emergency Response Protocols - ABCDE Assessment

**AI Tutor: Dr. Michael Rodriguez - Emergency Medicine Specialist**

The ABCDE approach provides a systematic method for assessing and managing diving emergencies, ensuring critical priorities are addressed in the correct sequence.

## ABCDE Protocol Overview

### Primary Assessment Sequence
The ABCDE approach must be followed in strict order:
- **A**: Airway
- **B**: Breathing  
- **C**: Circulation
- **D**: Disability (Neurological)
- **E**: Exposure/Environment

Each step must be completed before progressing to the next, with immediate life-saving interventions taking priority.

## A - Airway Assessment and Management

### Initial Assessment
**Look, Listen, Feel** approach:
- **Look**: Chest movement, facial color, foreign objects
- **Listen**: Air movement sounds, vocalization ability
- **Feel**: Air flow at nose/mouth, chest rise

### Airway Obstruction Signs
- **Complete Obstruction**: No air movement, silent chest
- **Partial Obstruction**: Stridor, noisy breathing, reduced air flow
- **Positioning Issues**: Head position affecting airway patency
- **Foreign Material**: Vomit, blood, seawater, or objects

### Management Techniques

#### Basic Airway Maneuvers
1. **Head Tilt-Chin Lift**: Primary positioning technique
   - Place hand on forehead, tilt head back
   - Lift chin with fingertips (avoid pressure on soft tissues)
   - Maintain neutral spine alignment if spinal injury suspected

2. **Jaw Thrust**: Alternative for suspected spinal injury
   - Position at head of patient
   - Place fingers behind angles of jaw
   - Lift jaw forward while maintaining head position

#### Airway Clearance
- **Finger Sweep**: Remove visible foreign objects
- **Suction**: Clear fluid or small debris
- **Log Roll**: Turn patient to allow drainage
- **Back Blows**: For conscious choking victims

### Advanced Airway Management
- **Oropharyngeal Airway (OPA)**: Unconscious patients only
- **Nasopharyngeal Airway (NPA)**: Conscious or semiconscious patients
- **Bag-Mask Ventilation**: Positive pressure ventilation
- **Advanced Airways**: Endotracheal intubation when trained

## B - Breathing Assessment and Support

### Assessment Parameters
**Rate, Rhythm, Quality, Effort**:
- **Normal Rate**: 12-20 breaths per minute
- **Rhythm**: Regular vs. irregular patterns
- **Quality**: Deep vs. shallow, effective vs. ineffective
- **Effort**: Use of accessory muscles, distress signs

### Breathing Emergencies

#### Respiratory Arrest
- **Recognition**: No chest movement, no air flow
- **Management**: Immediate rescue breathing
- **Ventilation Rate**: 10-12 breaths per minute
- **Volume**: Visible chest rise with each breath

#### Respiratory Distress
- **Signs**: Increased rate, labored breathing, accessory muscle use
- **Positioning**: Sit upright if conscious and no spinal injury
- **Oxygen**: High-flow oxygen if available
- **Monitoring**: Continuous assessment of effectiveness

### Diving-Specific Breathing Issues

#### Pulmonary Barotrauma
- **Pneumothorax**: Collapsed lung from rapid ascent
- **Signs**: Chest pain, difficulty breathing, decreased breath sounds
- **Management**: High-flow oxygen, rapid medical evacuation
- **Tension Pneumothorax**: Life-threatening, requires decompression

#### Near Drowning
- **Laryngospasm**: Vocal cord closure preventing breathing
- **Pulmonary Edema**: Fluid accumulation in lungs
- **Management**: Airway positioning, ventilation support, oxygen

## C - Circulation Assessment and Support

### Assessment Techniques
**Pulse, Pressure, Perfusion**:
- **Pulse Rate**: Count for full minute during emergencies
- **Pulse Quality**: Strong vs. weak, regular vs. irregular
- **Blood Pressure**: Systolic and diastolic measurements
- **Perfusion**: Skin color, temperature, capillary refill

### Circulation Problems

#### Cardiac Arrest
- **Recognition**: No pulse, unresponsive, not breathing normally
- **Management**: Immediate CPR, AED if available
- **Compression Rate**: 100-120 per minute
- **Compression Depth**: At least 2 inches, complete recoil

#### Shock States
- **Hypovolemic**: Blood/fluid loss
- **Cardiogenic**: Heart pump failure
- **Distributive**: Vascular dilation (anaphylaxis, sepsis)
- **Management**: Position, oxygen, fluid replacement if trained

### Bleeding Control
**Direct Pressure → Elevation → Pressure Points → Tourniquet**:
1. **Direct Pressure**: Primary method for bleeding control
2. **Elevation**: Raise injury above heart level if possible
3. **Pressure Points**: Arterial pressure application
4. **Tourniquet**: Last resort for life-threatening extremity bleeding

## D - Disability (Neurological Assessment)

### Consciousness Level
**AVPU Scale**:
- **Alert**: Awake, oriented, following commands
- **Voice**: Responds to verbal stimuli
- **Pain**: Responds only to painful stimuli  
- **Unresponsive**: No response to any stimuli

### Neurological Assessment

#### Glasgow Coma Scale (if trained)
- **Eye Opening**: Spontaneous (4) to none (1)
- **Verbal Response**: Oriented (5) to none (1)
- **Motor Response**: Obeys commands (6) to none (1)
- **Total Score**: 15 (normal) to 3 (deep coma)

#### Diving-Specific Considerations
- **Decompression Sickness**: Neurological symptoms
- **Arterial Gas Embolism**: Sudden neurological deficits
- **Nitrogen Narcosis**: Altered consciousness at depth
- **Carbon Monoxide**: Headache, confusion, unconsciousness

### Management Priorities
- **Spinal Protection**: Maintain alignment during movement
- **Oxygen Therapy**: High-flow oxygen for neurological symptoms
- **Positioning**: Recovery position if unconscious and breathing
- **Blood Glucose**: Check if diabetic history or supplies available

## E - Exposure and Environment

### Exposure Assessment
**Remove Clothing for Complete Examination**:
- **Preserve Dignity**: Use blankets, screens when possible
- **Hypothermia Prevention**: Minimize heat loss
- **Complete Examination**: Look for hidden injuries
- **Privacy Concerns**: Respect patient modesty

### Environmental Considerations

#### Hypothermia Management
- **Recognition**: Core temperature below 95°F (35°C)
- **Signs**: Shivering, altered mental status, decreased coordination
- **Management**: Remove from cold, insulate, rewarm gradually
- **Severe Cases**: Handle gently, avoid rough movement

#### Heat-Related Illness
- **Heat Exhaustion**: Fatigue, nausea, excessive sweating
- **Heat Stroke**: Altered mental status, hot skin, high temperature
- **Management**: Cool environment, remove excess clothing, cooling measures

## Documentation and Communication

### Critical Information
**Patient Report Format** (SOAP):
- **Subjective**: Patient history, complaints, symptoms
- **Objective**: Physical findings, vital signs, observations
- **Assessment**: Working diagnosis, problem identification
- **Plan**: Treatment provided, interventions, transport decisions

### Emergency Communication
- **Location**: Exact position, access routes
- **Patient Condition**: ABCDE findings, vital signs
- **Treatment Provided**: Interventions performed
- **Resources Needed**: Equipment, personnel, transport

## Practice Scenario: Diving Emergency Response

**Scenario**: Diver surfaces unconscious after rapid ascent from 30 meters. Fellow divers have brought the victim to the dive platform.

**Assessment Sequence**:
1. **Scene Safety**: Ensure platform safety, additional help
2. **ABCDE Assessment**: Systematic evaluation
3. **Immediate Interventions**: Life-saving measures
4. **Communication**: Emergency medical services contact
5. **Ongoing Care**: Continuous monitoring and support

**Expected Findings and Management**:
- **Airway**: May require positioning or suctioning
- **Breathing**: Possible pulmonary barotrauma requiring oxygen
- **Circulation**: Monitor for shock, bleeding from lung injury
- **Disability**: Assess for arterial gas embolism signs
- **Exposure**: Check for other injuries, prevent hypothermia

This systematic approach ensures comprehensive emergency assessment while prioritizing life-threatening conditions in their order of urgency.`,
  }).returning();

  // Air Diver Track Lessons
  const [airLesson1] = await db.insert(lessons).values({
    trackId: airDiverTrack.id,
    title: "Gas Management and Consumption Planning",
    order: 1,
    content: `# Gas Management and Consumption Planning

**AI Tutor: Lisa Thompson - Professional Air Diving Instructor**

Proper gas management is the foundation of safe air diving operations. This module covers consumption calculation, emergency reserves, and supply monitoring for professional diving applications.

## Gas Consumption Fundamentals

### Physiological Factors
Individual consumption rates vary significantly based on:

#### Physical Characteristics
- **Body Size**: Larger individuals typically consume more gas
- **Lung Capacity**: Vital capacity affects breathing efficiency
- **Physical Fitness**: Better conditioning reduces consumption
- **Age and Health**: Medical conditions affecting respiratory function

#### Psychological Factors
- **Experience Level**: Experienced divers typically consume less
- **Stress Response**: Anxiety increases consumption dramatically
- **Task Confidence**: Familiar tasks require less mental energy
- **Emergency Situations**: Can triple or quadruple consumption rates

### Environmental Influences

#### Depth Effects
Gas consumption increases proportionally with absolute pressure:
- **Surface (1 ATA)**: Baseline consumption rate
- **33 feet (2 ATA)**: Double surface consumption
- **66 feet (3 ATA)**: Triple surface consumption
- **99 feet (4 ATA)**: Quadruple surface consumption

**Formula**: Consumption Rate = Surface Rate × (Depth in feet + 33) ÷ 33

#### Work Load Categories
Professional diving work categories and typical consumption rates:
- **Light Work**: 1.5-2.0 CFM (inspection, light cleaning)
- **Moderate Work**: 2.0-3.0 CFM (tool operation, moderate physical effort)
- **Heavy Work**: 3.0-4.5 CFM (cutting, heavy lifting, strenuous tasks)
- **Emergency Work**: 4.5-6.0+ CFM (rescue operations, high stress situations)

## Professional Planning Methods

### Pre-Dive Calculations

#### Basic Gas Requirements
**Total Gas = (Work Time × Consumption Rate × Depth Factor) + Reserves**

**Example Calculation for 60-foot working dive**:
- Planned work time: 45 minutes
- Diver consumption rate: 2.5 CFM (moderate work)
- Depth factor: 2.8 ATA (60 feet)
- Work gas required: 45 × 2.5 × 2.8 = 315 cubic feet
- Emergency reserve (25%): 315 × 0.25 = 79 cubic feet
- Surface reserve: 50 cubic feet minimum
- **Total Required**: 315 + 79 + 50 = 444 cubic feet minimum

#### Reserve Requirements
Professional diving requires multiple reserve categories:

**Emergency Reserves**:
- **Primary Reserve**: 25% of total calculated consumption
- **Emergency Ascent**: 50 cubic feet minimum for ascent and surface
- **Emergency Work**: Additional gas for emergency response tasks
- **Communication Loss**: Extended bottom time contingency

**Operational Reserves**:
- **Task Overrun**: 20% additional for extended work time
- **Equipment Problems**: Gas for problem solving and recovery
- **Weather Delays**: Surface interval extensions
- **Multiple Ascents**: Repeat descents for forgotten items

### Supply System Planning

#### Surface Supply Systems
**Compressor Capacity Requirements**:
- **Primary Diver Supply**: Maximum anticipated consumption rate
- **Standby Diver Supply**: Ready for immediate deployment
- **System Losses**: Distribution and regulation losses
- **Emergency Capacity**: Additional 50% minimum for emergencies

**Example System Sizing**:
- Primary diver: 4.0 CFM maximum (heavy work at depth)
- Standby diver: 4.0 CFM capability
- System losses: 15% (distribution, regulation)
- Emergency factor: 50%
- **Required Compressor**: (4.0 + 4.0) × 1.15 × 1.5 = 13.8 CFM minimum

#### SCUBA Configuration
**Tank Selection and Configuration**:
- **Single Tank**: Limited capacity, simple configuration
- **Double Tanks**: Doubled capacity, redundancy options
- **Manifolded Doubles**: Shared gas, maximum capacity
- **Independent Doubles**: Full redundancy, complex management

## Real-Time Monitoring

### Continuous Assessment
Professional divers must maintain constant awareness:

#### Pressure Monitoring
- **Initial Pressure**: Full supply verification
- **Working Pressure**: Consumption rate tracking
- **Reserve Pressure**: Emergency limit identification
- **Critical Pressure**: Immediate ascent initiation

#### Consumption Rate Tracking
**Real-time calculation method**:
1. Note starting pressure and time
2. Calculate pressure drop over time interval
3. Convert pressure drop to volume consumed
4. Adjust for current depth pressure
5. Project remaining work time available

**Example Real-Time Calculation**:
- Tank: 3000 PSI, 80 cubic feet capacity
- After 15 minutes at 60 feet: 2400 PSI remaining
- Pressure used: 3000 - 2400 = 600 PSI
- Volume used: 600 ÷ 3000 × 80 = 16 cubic feet
- Actual consumption: 16 CFM ÷ 15 minutes ÷ 2.8 ATA = 0.38 surface CFM
- Projected rate seems low - verify calculations and monitor closely

### Decision Points

#### Critical Pressure Management
Establish clear decision pressures before diving:
- **Turn-Around Pressure**: Begin ascent initiation (typically 50% remaining)
- **Emergency Reserve**: No further consumption except emergencies (25% remaining)
- **Surface Reserve**: Final safety margin (200 PSI minimum)
- **Equipment Reserve**: Post-dive system pressure maintenance

#### Emergency Procedures
When gas supplies are critically low:
1. **Immediate Ascent**: Begin controlled ascent immediately
2. **Reduce Consumption**: Minimize physical exertion
3. **Emergency Procedures**: Implement bailout or buddy breathing
4. **Surface Communication**: Notify support team immediately
5. **Alternative Supplies**: Deploy emergency gas if available

## Advanced Planning Techniques

### Multi-Level Diving
For diving operations at varying depths:
- **Average Depth Method**: Use weighted average depth
- **Segment Analysis**: Calculate each depth segment separately
- **Maximum Depth Method**: Conservative approach using deepest depth
- **Computer Integration**: Use dive computers for precise tracking

### Team Gas Management
Multiple diver operations require coordinated planning:
- **Individual Calculations**: Each diver's specific requirements
- **Shared Resources**: Common gas supply considerations
- **Emergency Sharing**: Buddy breathing or emergency supply protocols
- **Staggered Operations**: Sequential diving to conserve total gas

## Safety Protocols

### Pre-Dive Verification
Before every dive, verify:
- **Supply Pressure**: Full tanks or adequate compressor operation
- **Calculation Accuracy**: Double-check all mathematical calculations
- **Emergency Procedures**: Review bailout and emergency ascent plans
- **Communication**: Establish gas monitoring communication protocols

### Emergency Response
Gas emergency response priorities:
1. **Safety First**: Never compromise diver safety for operational goals
2. **Conservative Decisions**: When in doubt, ascend early
3. **Emergency Protocols**: Implement established emergency procedures
4. **Post-Event Analysis**: Review incidents to improve future planning

This comprehensive approach to gas management ensures safe, efficient diving operations while maintaining adequate safety margins for emergency response and equipment failures.`,
  }).returning();

  // Continue with more tracks and lessons...
  console.log('✅ Professional diving education platform seeded successfully!');
  console.log(`Created ${await db.select().from(tracks).then(r => r.length)} professional training tracks`);
  console.log(`Created ${await db.select().from(lessons).then(r => r.length)} comprehensive lessons`);
  console.log(`Created ${await db.select().from(quizzes).then(r => r.length)} professional assessments`);
  console.log(`Created ${await db.select().from(questions).then(r => r.length)} assessment questions`);
}

professionalDivingSeed().catch(console.error).finally(() => process.exit(0));