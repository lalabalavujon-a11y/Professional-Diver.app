import { db } from '../server/db.js';
import { tracks, lessons, quizzes, questions } from '../shared/schema.js';

async function professionalSeed() {
  console.log('🌱 Seeding professional diving education content...');

  // Clear existing data
  await db.delete(questions);
  await db.delete(quizzes);
  await db.delete(lessons);
  await db.delete(tracks);

  // Create the 7 comprehensive professional diving tracks from DIVER-WELL-TRAINING documentation
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

  // NDT Track - Comprehensive Professional Content
  const [ndtLesson1] = await db.insert(lessons).values({
    trackId: ndtTrack.id,
    title: "Visual Inspection Fundamentals",
    order: 1,
    content: `# Visual Inspection Fundamentals
## AI Tutor: Dr. Sarah Chen - NDT & Inspection Specialist

*Expert in Non-Destructive Testing and Inspection with 15+ years in underwater inspection techniques, corrosion assessment, and CP surveying*

Visual inspection forms the foundation of underwater non-destructive testing for commercial diving operations. This comprehensive module covers industry-standard techniques used in offshore, marine construction, and underwater maintenance operations.

## Learning Objectives
- Master systematic visual inspection methodologies for underwater structures
- Understand defect identification and classification systems
- Learn professional underwater documentation techniques
- Apply industry safety protocols and quality assurance standards
- Develop skills for real-world commercial diving scenarios

## Professional Inspection Methodology

### Pre-Inspection Planning
Commercial underwater inspection requires thorough preparation and systematic approach:

#### Document Review Process
- **Structural Drawings Analysis**: Understanding design specifications and critical load paths
- **Historical Data Review**: Previous inspection reports, maintenance records, incident history
- **Environmental Assessment**: Current conditions, marine growth, visibility factors
- **Access Planning**: Safe approach routes, working platforms, emergency egress

#### Equipment Preparation Checklist
- **Primary Lighting**: Minimum 10,000 lumen underwater LED systems
- **Documentation Tools**: Underwater cameras (minimum 24MP), measurement devices
- **Cleaning Equipment**: Wire brushes, scrapers, high-pressure water systems
- **Safety Equipment**: Emergency ascent devices, communication systems

### Systematic Coverage Methods

#### Grid Pattern Inspection
Professional standard for comprehensive coverage:
- **Grid Size**: 2x2 meters typical for detailed inspection
- **Overlap Requirements**: 10% minimum between adjacent grids
- **Documentation**: Mark completed areas on underwater slates
- **Quality Control**: Independent verification of critical areas

#### Zone-Based Assessment
Structural priority classification system:
- **Critical Zones**: Primary load-bearing members, connection points
- **High Priority**: Secondary structural elements, heavily stressed areas
- **Standard Zones**: General structural components, cladding systems
- **Environmental**: Areas with known aggressive conditions

## Defect Identification and Classification

### Corrosion Types and Assessment

#### General Corrosion
- **Characteristics**: Uniform metal loss across large surface areas
- **Measurement**: Thickness reduction using ultrasonic gauges
- **Documentation**: Area percentage affected, average thickness loss
- **Critical Factors**: Rate of progression, remaining material thickness

#### Pitting Corrosion
- **Recognition**: Localized deep holes with small surface area
- **Assessment**: Individual pit measurement (depth, diameter, density)
- **Critical Evaluation**: Depth-to-diameter ratio exceeding 1:1
- **Risk Assessment**: Perforation potential, stress concentration effects

#### Crevice Corrosion
- **Location**: Confined spaces, joint areas, under deposits
- **Detection Challenges**: Often hidden, requires disassembly for complete assessment
- **Documentation**: Access photographs, dimensional surveys
- **Prevention Notes**: Design recommendations for future maintenance

#### Galvanic Corrosion
- **Recognition**: Preferential attack at dissimilar metal connections
- **Pattern Analysis**: Anode/cathode identification using galvanic series
- **Measurement**: Extent of attack, remaining material integrity
- **Recommendations**: Isolation methods, cathodic protection assessment

### Structural Defects Assessment

#### Fatigue Cracking
- **Characteristics**: Linear defects, often multiple parallel cracks
- **Growth Patterns**: Progressive extension from stress concentration points
- **Documentation**: Length, width, penetration depth measurements
- **Critical Assessment**: Load path interruption, propagation potential

#### Weld Defects Evaluation
- **Lack of Fusion**: Incomplete joint formation at weld interfaces
- **Porosity Assessment**: Gas bubble size, distribution, structural impact
- **Profile Issues**: Undercut depth, reinforcement geometry
- **Repair Requirements**: Access considerations, welding procedure needs

## Professional Documentation Standards

### Real-Time Field Recording
Systematic documentation during inspection operations:

#### Location Identification Systems
- **GPS Coordinates**: Surface reference points with accuracy requirements
- **Structural Grid**: Platform coordinate systems, member identification
- **Depth References**: Chart datum, mean sea level, structure datum
- **Orientation Data**: Magnetic headings, structural references

#### Defect Characterization Protocol
- **Classification System**: Industry standard defect categories (AWS, NACE)
- **Dimensional Recording**: Digital calipers, measurement scales, photo documentation
- **Severity Assessment**: Structural significance, safety implications
- **Priority Ranking**: Immediate, short-term, long-term action requirements

### Professional Photography Standards
High-quality underwater documentation techniques:

#### Technical Requirements
- **Resolution**: Minimum 24 megapixel for detailed defect documentation
- **Lighting**: Multiple source illumination, shadow elimination
- **Scale Reference**: Measurement devices in all detailed photographs
- **Multiple Angles**: Overview, detail, and profile perspectives

#### Documentation Protocol
- **Overview Shots**: General area condition, defect location context
- **Detail Images**: Close-up defect characteristics, measurement inclusion
- **Sequential Coverage**: Systematic area documentation with position references
- **Quality Control**: Real-time image review, retake procedures

## Safety Integration and Risk Management

### Hazard Recognition Protocol
Commercial diving safety considerations during inspection:

#### Structural Hazards
- **Instability Assessment**: Compromised structural integrity evaluation
- **Sharp Edge Management**: Cut protection, safe handling procedures
- **Falling Object Risk**: Loose components, debris hazard assessment
- **Confined Space Entry**: Limited access area safety protocols

#### Environmental Safety Factors
- **Current Conditions**: Working current limits, emergency procedures
- **Visibility Management**: Lighting adequacy, navigation safety
- **Marine Life**: Hazardous species awareness, avoidance procedures
- **Contamination Risk**: Water quality, biological hazard assessment

### Emergency Response Procedures
Critical safety protocols for underwater inspection:

#### Immediate Hazard Response
- **Structural Collapse Risk**: Emergency ascent procedures, area evacuation
- **Equipment Entanglement**: Cutting tool accessibility, buddy assistance
- **Medical Emergency**: Rapid ascent protocols, surface support activation
- **Lost Diver Procedures**: Search patterns, emergency communication

#### Communication Requirements
- **Regular Check-ins**: Status reports every 10 minutes minimum
- **Critical Finding Reports**: Immediate surface notification requirements
- **Emergency Signals**: Standardized distress communication protocols
- **Documentation Backup**: Real-time data transmission to surface support

## Practice Scenario: Offshore Platform Leg Inspection

**Professional Scenario**: Complete visual inspection of offshore platform leg showing corrosion evidence and marine growth accumulation at 18-meter depth with 4-meter visibility.

### Pre-Dive Briefing Requirements
- **Structure History**: 12-year-old platform, previous inspection findings
- **Environmental Conditions**: 2-knot current, 18°C water temperature
- **Work Scope**: 4x4 meter inspection area, documentation requirements
- **Safety Considerations**: Sharp edges from previous repairs, overhead hazards

### Inspection Task Sequence
1. **Initial Area Assessment**: Overall condition survey, safety hazard identification
2. **Marine Growth Removal**: Systematic cleaning using appropriate tools
3. **Grid Pattern Inspection**: 2x2 meter systematic coverage with overlap
4. **Defect Documentation**: Photography with measurements, detailed recording
5. **Structural Assessment**: Load path evaluation, repair priority determination

### Professional Deliverables
- **Field Notes**: Real-time observation recording with sketches
- **Photographic Documentation**: Minimum 50 images with measurement scales
- **Dimensional Survey**: Complete defect measurement inventory
- **Assessment Report**: Structural significance evaluation and recommendations
- **Priority Matrix**: Repair scheduling based on risk assessment

### Quality Assurance Verification
- **Independent Review**: Peer verification of critical findings
- **Documentation Completeness**: Checklist verification against requirements
- **Technical Accuracy**: Measurement verification, calculation checks
- **Safety Compliance**: Protocol adherence verification, incident reporting

This comprehensive visual inspection training provides the professional foundation required for commercial diving NDT operations, ensuring consistent, reliable results that meet industry standards and regulatory requirements.`,
  }).returning();

  const [ndtLesson2] = await db.insert(lessons).values({
    trackId: ndtTrack.id,
    title: "Corrosion Assessment Techniques",
    order: 2,
    content: `# Corrosion Assessment Techniques
## AI Tutor: Dr. Sarah Chen - Underwater Corrosion Assessment Expert

Advanced corrosion assessment techniques for professional underwater inspection operations, covering electrochemical processes, measurement methods, and industry standards.

## Professional Corrosion Assessment Framework

### Electrochemical Fundamentals
Understanding the science behind underwater corrosion processes:

#### Corrosion Cell Components
- **Anode (Oxidation)**: Metal dissolution releasing electrons (Fe → Fe²⁺ + 2e⁻)
- **Cathode (Reduction)**: Electron consumption (O₂ + 4H⁺ + 4e⁻ → 2H₂O)
- **Electrolyte**: Seawater providing ionic conductivity
- **Metallic Path**: Current flow through the structure

#### Marine Environment Factors
- **Chloride Concentration**: Aggressive ion attack (19,000 ppm typical seawater)
- **Oxygen Availability**: Cathodic reaction support, depth variation effects
- **Temperature Gradients**: Reaction rate doubling every 10°C increase
- **pH Variations**: Local acidity effects from biological activity

### Assessment Methodology Standards

#### Visual Assessment Protocol
Professional visual corrosion evaluation techniques:

**Surface Condition Categories**:
- **Grade A**: No visible corrosion, intact protective systems
- **Grade B**: Light surface corrosion, 5-25% area affected
- **Grade C**: Moderate corrosion, 25-50% area affected  
- **Grade D**: Heavy corrosion, >50% area affected with significant metal loss

**Pattern Recognition**:
- **Uniform Attack**: Even metal loss across large areas
- **Localized Corrosion**: Concentrated attack in specific zones
- **Preferential Corrosion**: Selective attack on specific alloy phases
- **Microbiologically Influenced**: Bacterial colony-associated patterns

#### Quantitative Assessment Techniques

**Half-Cell Potential Measurements**:
- **Reference Electrode**: Silver/Silver Chloride (Ag/AgCl) in seawater
- **Measurement Grid**: 1-meter spacing for detailed surveys
- **Interpretation**: More negative potentials indicate active corrosion
- **Standards**: ASTM C876 modified for marine applications

**Measurement Protocol**:
1. **Equipment Calibration**: Daily verification using standard solutions
2. **Grid Establishment**: Systematic measurement point layout
3. **Contact Verification**: Proper electrical connection confirmation
4. **Data Recording**: Potential values with location coordinates
5. **Trend Analysis**: Comparison with previous survey data

## Cathodic Protection Assessment

### Protection Criteria Standards
Industry-accepted protection potentials:

#### Primary Criteria
- **-850 mV (Ag/AgCl)**: Minimum protection potential for steel
- **Polarization Decay**: 100 mV shift from native potential
- **Current Density**: 20-50 mA/m² typical protection requirements
- **Environmental Factors**: Temperature and salinity corrections

#### Assessment Procedures
**Instant-Off Potential Measurement**:
- **Purpose**: Eliminate IR drop effects for accurate potential measurement
- **Technique**: Momentary current interruption, rapid potential reading
- **Equipment**: High-speed data loggers, synchronized interruption systems
- **Interpretation**: True steel potential without voltage drop influences

**Polarization Surveys**:
- **Native Potential**: Natural corrosion potential measurement
- **Polarized Potential**: With cathodic protection applied
- **Decay Characteristics**: Depolarization curve analysis
- **Protection Confirmation**: Adequate shift verification

### Common Protection System Problems

#### Inadequate Protection Issues
- **Insufficient Current**: Anode capacity limitations or depletion
- **Poor Distribution**: Current shadowing behind large structures
- **High Resistance**: Connection deterioration, coating breakdown
- **Design Limitations**: Inadequate anode quantity or placement

**Diagnostic Techniques**:
- **Current Distribution Surveys**: Anode effectiveness mapping
- **Resistance Measurements**: Connection integrity verification
- **Anode Condition Assessment**: Consumption rate evaluation
- **System Performance Trending**: Historical effectiveness analysis

#### Over-Protection Problems
- **Hydrogen Embrittlement Risk**: High-strength steel susceptibility
- **Coating Disbondment**: Alkaline condition-induced failures
- **Calcareous Deposit Formation**: Excessive current density effects
- **Accelerated Anode Consumption**: Economic impact assessment

## Thickness Measurement Techniques

### Ultrasonic Testing Methods

#### Equipment Configuration
**Transducer Selection**:
- **Frequency Range**: 2-10 MHz depending on material and thickness
- **Element Size**: 6-13mm diameter for general purpose applications
- **Cable Length**: Minimize for underwater operations, typically <15 meters
- **Protective Housing**: Pressure-rated, impact-resistant construction

**Calibration Requirements**:
- **Reference Standards**: Known thickness blocks of similar material
- **Velocity Verification**: Material-specific sound velocity confirmation
- **Temperature Compensation**: Correction factors for actual conditions
- **System Linearity**: Accuracy verification across measurement range

#### Measurement Protocols
**Surface Preparation Standards**:
- **Cleanliness**: Complete marine growth and debris removal
- **Roughness**: Smooth surface finish for probe contact
- **Coupling**: Appropriate couplant application for sound transmission
- **Access**: Stable platform for consistent measurements

**Data Collection Procedures**:
1. **Grid Establishment**: Systematic measurement point layout
2. **Multiple Readings**: Minimum 5 readings per location for accuracy
3. **Statistical Analysis**: Mean, standard deviation, minimum value recording
4. **Trend Monitoring**: Comparison with baseline and previous surveys
5. **Critical Area Focus**: Intensive measurement of suspected problem areas

### Data Interpretation Methods

#### Statistical Analysis Techniques
**Measurement Evaluation**:
- **Mean Thickness**: Average remaining material calculation
- **Standard Deviation**: Measurement precision assessment
- **Minimum Values**: Worst-case condition identification
- **Confidence Intervals**: Statistical accuracy determination

**Corrosion Rate Calculation**:
- **Metal Loss Rate**: (Original - Current Thickness) / Service Time
- **Remaining Life**: (Current - Minimum Thickness) / Corrosion Rate
- **Inspection Intervals**: Based on acceptable risk levels
- **Trend Analysis**: Acceleration or deceleration patterns

#### Engineering Assessment
**Structural Adequacy Evaluation**:
- **Design Minimum**: Original specification requirements
- **Code Requirements**: Current applicable standards (API, AWS, NACE)
- **Safety Factors**: Conservative operation margins
- **Load Considerations**: Actual vs. design loading conditions

**Risk-Based Assessment**:
- **Probability of Failure**: Statistical failure analysis
- **Consequence Evaluation**: Environmental, safety, economic impacts
- **Risk Matrix**: Priority ranking for maintenance actions
- **Inspection Frequency**: Risk-based interval determination

## Professional Documentation and Reporting

### Field Data Management
Comprehensive data collection and organization:

#### Real-Time Documentation
- **Electronic Data Loggers**: Automated measurement recording
- **GPS Integration**: Precise location documentation
- **Photographic Correlation**: Visual evidence with measurement data
- **Environmental Recording**: Conditions affecting measurements

#### Quality Assurance Protocols
- **Duplicate Measurements**: Independent verification procedures
- **Calibration Verification**: Daily equipment accuracy checks
- **Data Validation**: Range and consistency verification
- **Backup Systems**: Redundant data storage and transmission

### Professional Assessment Reports
Industry-standard reporting formats:

#### Executive Summary Requirements
- **Key Findings**: Critical conditions requiring immediate attention
- **Overall Assessment**: Structure condition grade and trending
- **Priority Recommendations**: Risk-based action priorities
- **Economic Impact**: Repair costs and operational implications

#### Technical Analysis Section
- **Methodology Description**: Techniques and standards applied
- **Data Presentation**: Tables, graphs, statistical analysis
- **Comparison Studies**: Historical trending and benchmark analysis
- **Uncertainty Analysis**: Measurement accuracy and confidence levels

## Advanced Practice Scenario: Platform Inspection

**Complex Assessment Project**: Complete corrosion assessment of 15-year-old offshore platform including visual survey, cathodic protection evaluation, and thickness monitoring.

### Project Scope Definition
- **Structure**: 8-leg jacket platform, 25-meter water depth
- **Service History**: Continuous operation, previous maintenance records
- **Assessment Requirements**: Regulatory compliance, insurance requirements
- **Schedule**: 5-day weather window, multi-diver operations

### Technical Execution Plan
1. **Pre-Survey Preparation**: Document review, equipment calibration
2. **Visual Condition Survey**: Systematic photographic documentation
3. **Cathodic Protection Testing**: Potential surveys, current distribution
4. **Thickness Monitoring**: Critical area measurement program
5. **Data Analysis**: Statistical evaluation, trend analysis
6. **Report Generation**: Professional assessment with recommendations

This comprehensive corrosion assessment training ensures professional competency in advanced underwater inspection techniques, meeting industry standards for commercial diving operations and regulatory compliance.`,
  }).returning();

  // Diver Medic Technician Track
  const [medicLesson1] = await db.insert(lessons).values({
    trackId: medicTrack.id,
    title: "Scene Assessment and Safety Protocols",
    order: 1,
    content: `# Scene Assessment and Safety Protocols
## AI Tutor: Dr. Michael Rodriguez - Emergency Medicine Specialist

*Emergency medicine specialist focused on diving-related medical emergencies, hyperbaric treatment, and underwater rescue protocols*

Scene assessment forms the critical foundation of emergency medical response in diving operations. This comprehensive module covers systematic assessment techniques, safety protocols, and decision-making frameworks for diving emergencies.

## Primary Scene Assessment Framework

### Immediate Safety Evaluation
The first priority in any diving emergency is ensuring rescuer safety and scene control:

#### Environmental Hazard Assessment
- **Water Conditions**: Current strength, visibility, temperature, sea state
- **Structural Hazards**: Platform stability, overhead obstacles, sharp edges
- **Electrical Hazards**: Underwater welding equipment, power tools, lighting systems
- **Chemical Exposure**: Contaminated water, industrial chemicals, fuel products
- **Biological Hazards**: Marine life, infectious materials, contamination sources

#### Scene Security and Access
- **Safe Access Routes**: Primary and emergency egress paths
- **Equipment Staging**: Medical supplies, rescue equipment positioning
- **Communication Systems**: Emergency contact protocols, backup communications
- **Bystander Management**: Crowd control, witness coordination, family notification
- **Documentation Preparation**: Incident recording, legal evidence preservation

### Initial Patient Contact Protocol

#### Approach Safety Assessment
Before making patient contact, evaluate:
- **Scene Stability**: Continued hazard potential, environmental changes
- **Patient Location**: Accessibility, extraction requirements, safety positioning
- **Number of Patients**: Multiple casualty scenarios, triage requirements
- **Mechanism of Injury**: Decompression illness, near drowning, trauma, medical emergency

#### Primary Survey Initiation
Systematic patient assessment using established protocols:
- **Consciousness Level**: AVPU scale (Alert, Voice, Pain, Unresponsive)
- **Airway Assessment**: Patency, obstruction, positioning requirements
- **Breathing Evaluation**: Rate, quality, effectiveness, distress signs
- **Circulation Check**: Pulse presence, quality, bleeding assessment
- **Immediate Threats**: Life-threatening conditions requiring instant intervention

## ABCDE Assessment Protocol

### A - Airway Management
Comprehensive airway evaluation and management:

#### Assessment Techniques
- **Look**: Chest movement, cyanosis, foreign material, facial trauma
- **Listen**: Breath sounds, stridor, vocalization ability, airway noises
- **Feel**: Air movement, chest rise, pulse presence, skin temperature

#### Airway Obstruction Recognition
**Complete Obstruction Signs**:
- Absent breath sounds despite respiratory effort
- Silent chest with obvious distress
- Rapid progression to unconsciousness
- Inability to cough or vocalize

**Partial Obstruction Indicators**:
- Stridor (high-pitched breathing sound)
- Diminished air movement
- Use of accessory breathing muscles
- Anxiety and agitation from hypoxia

#### Management Interventions
**Basic Airway Techniques**:
1. **Head Tilt-Chin Lift**: Standard positioning for unconscious patients
2. **Jaw Thrust**: Spinal injury precaution technique
3. **Recovery Position**: Unconscious breathing patients
4. **Manual Obstruction Removal**: Visible foreign material extraction

**Advanced Interventions** (when trained):
- **Oropharyngeal Airway**: Unconscious patients without gag reflex
- **Nasopharyngeal Airway**: Conscious or semiconscious patients
- **Bag-Valve-Mask Ventilation**: Positive pressure ventilation
- **Oxygen Therapy**: High-flow oxygen delivery systems

### B - Breathing Assessment and Support

#### Comprehensive Breathing Evaluation
**Rate Assessment**: Normal adult range 12-20 breaths per minute
- **Tachypnea**: >20 BPM (anxiety, hypoxia, shock, pain)
- **Bradypnea**: <12 BPM (CNS depression, hypothermia, drugs)
- **Apnea**: Absent breathing requiring immediate intervention

**Quality Evaluation**: Depth, rhythm, and effectiveness
- **Shallow Breathing**: Inadequate tidal volume, fatigue indication
- **Deep Breathing**: Compensatory response to acidosis or hypoxia
- **Irregular Patterns**: Neurological injury, respiratory center depression

#### Diving-Specific Breathing Emergencies

**Pulmonary Barotrauma Management**:
- **Pneumothorax Recognition**: Chest pain, dyspnea, decreased breath sounds
- **Management**: High-flow oxygen, upright positioning, urgent evacuation
- **Tension Pneumothorax**: Life-threatening condition requiring decompression
- **Prevention**: Proper ascent procedures, lung overexpansion awareness

**Near Drowning Protocol**:
- **Laryngospasm**: Vocal cord spasm preventing air entry
- **Pulmonary Edema**: Fluid accumulation in lung tissue
- **Aspiration**: Inhaled water or foreign material
- **Management**: Airway positioning, ventilation support, oxygen therapy

### C - Circulation Assessment and Management

#### Pulse Assessment Techniques
**Pulse Locations and Significance**:
- **Carotid**: Central pulse, best for emergency assessment
- **Radial**: Peripheral pulse, blood pressure indicator (>90 systolic)
- **Femoral**: Strong central pulse, useful in shock states
- **Brachial**: Infants and blood pressure measurement

**Pulse Quality Interpretation**:
- **Strong and Regular**: Normal cardiovascular function
- **Weak and Thready**: Shock states, dehydration, blood loss
- **Irregular**: Cardiac arrhythmias, electrolyte imbalances
- **Absent**: Cardiac arrest, severe shock, local vascular injury

#### Bleeding Control Methodology
**Progressive Bleeding Control**:
1. **Direct Pressure**: Primary method for external bleeding control
2. **Elevation**: Raise injured extremity above heart level
3. **Pressure Points**: Arterial pressure application for extremity bleeding
4. **Tourniquet**: Last resort for life-threatening extremity hemorrhage

**Internal Bleeding Recognition**:
- **Abdominal Distension**: Intra-abdominal hemorrhage
- **Chest Pain/Dyspnea**: Hemothorax, cardiac tamponade
- **Neurological Changes**: Intracranial bleeding
- **Shock Signs**: Hypotension, tachycardia, altered mental status

### D - Disability (Neurological Assessment)

#### Consciousness Level Evaluation
**AVPU Scale Application**:
- **Alert**: Awake, oriented, following commands appropriately
- **Voice**: Responds to verbal stimuli, may be disoriented
- **Pain**: Responds only to painful stimulation
- **Unresponsive**: No response to verbal or painful stimuli

#### Glasgow Coma Scale (Advanced Assessment)
**Eye Opening Response (1-4)**:
- 4: Spontaneous eye opening
- 3: Opens to verbal command
- 2: Opens to painful stimulus
- 1: No eye opening response

**Verbal Response (1-5)**:
- 5: Oriented and converses
- 4: Disoriented and converses
- 3: Inappropriate words
- 2: Incomprehensible sounds
- 1: No verbal response

#### Diving-Specific Neurological Emergencies
**Decompression Sickness (DCS)**:
- **Type I**: Joint pain, skin changes, lymphatic swelling
- **Type II**: Neurological symptoms, pulmonary involvement
- **Assessment**: Symptom onset timing, dive profile correlation
- **Management**: High-flow oxygen, supine positioning, rapid evacuation

**Arterial Gas Embolism (AGE)**:
- **Recognition**: Immediate neurological symptoms upon surfacing
- **Symptoms**: Focal neurological deficits, altered consciousness
- **Management**: Immediate high-flow oxygen, left lateral position
- **Evacuation**: Urgent hyperbaric treatment facility transport

### E - Exposure and Environmental Assessment

#### Complete Patient Examination
**Systematic Exposure Protocol**:
- **Privacy Preservation**: Maintain patient dignity during examination
- **Hypothermia Prevention**: Minimize heat loss, provide warming
- **Complete Assessment**: Identify all injuries and medical conditions
- **Evidence Preservation**: Document injuries, preserve legal evidence

#### Environmental Injury Management
**Hypothermia Recognition and Treatment**:
- **Mild (90-95°F)**: Shivering, increased heart rate, confusion
- **Moderate (82-90°F)**: Decreased shivering, muscle rigidity, altered mental status
- **Severe (<82°F)**: Cardiac arrhythmias, unconsciousness, apparent death
- **Treatment**: Gradual rewarming, handle gently, insulation, warm environment

## Emergency Communication Protocols

### Medical Emergency Reporting
**Critical Information for Medical Control**:
- **Scene Description**: Location, environmental conditions, safety status
- **Patient Information**: Age, sex, consciousness level, vital signs
- **Mechanism**: Diving profile, symptoms onset, current condition
- **Treatment Provided**: Interventions performed, response to treatment
- **Resources Needed**: Equipment, personnel, transportation requirements

### Documentation Requirements
**Legal and Medical Documentation**:
- **Incident Timeline**: Precise timing of events and interventions
- **Patient Assessment**: Complete ABCDE findings and serial assessments
- **Treatment Record**: All interventions with times and patient responses
- **Witness Information**: Contact details for follow-up investigation
- **Equipment Status**: Condition and operation of emergency equipment

## Practice Scenario: Multi-Patient Diving Emergency

**Emergency Scenario**: Two-diver rapid ascent incident with one unconscious patient and one conscious but symptomatic patient at offshore platform.

### Scene Assessment Priorities
1. **Safety Evaluation**: Platform stability, weather conditions, water safety
2. **Resource Assessment**: Available medical equipment, personnel, communication
3. **Triage Decision**: Priority patient identification and treatment sequence
4. **Evacuation Planning**: Transportation options, medical facility capabilities

### Emergency Response Sequence
1. **Primary Survey**: Rapid ABCDE assessment of both patients
2. **Life-Saving Interventions**: Immediate treatments for critical conditions
3. **Communication**: Medical control contact, evacuation coordination
4. **Ongoing Care**: Serial assessments, treatment adjustments
5. **Transfer Preparation**: Patient packaging, equipment check, family notification

This comprehensive scene assessment training ensures systematic, professional emergency response capabilities essential for diving operations safety and emergency medical care effectiveness.`,
  }).returning();

  // Commercial Dive Supervisor Track
  const [supervisorLesson1] = await db.insert(lessons).values({
    trackId: supervisorTrack.id,
    title: "Dive Planning Fundamentals",
    order: 1,
    content: `# Dive Planning Fundamentals
## AI Tutor: Captain James Mitchell - Commercial Dive Supervisor

*Veteran dive supervisor with expertise in dive planning, risk assessment, and emergency response coordination for commercial diving operations*

Comprehensive dive planning forms the cornerstone of safe, efficient commercial diving operations. This module covers systematic planning methodologies, risk assessment frameworks, and operational management techniques.

## Strategic Planning Framework

### Pre-Job Assessment Process
Professional dive planning begins with comprehensive project evaluation:

#### Project Scope Analysis
- **Work Objective Definition**: Specific tasks, quality requirements, deliverables
- **Environmental Assessment**: Site conditions, seasonal variations, weather patterns
- **Technical Requirements**: Equipment needs, specialized tools, support systems
- **Timeline Analysis**: Critical path scheduling, weather windows, tidal considerations
- **Resource Allocation**: Personnel requirements, equipment deployment, logistics

#### Site-Specific Evaluation
**Physical Site Assessment**:
- **Bathymetric Surveys**: Depth profiles, bottom composition, obstacle identification
- **Current Analysis**: Tidal patterns, seasonal variations, operational windows
- **Visibility Conditions**: Seasonal patterns, industrial impacts, planning implications
- **Access Evaluation**: Platform capabilities, crane capacity, staging areas
- **Emergency Infrastructure**: Medical facilities, evacuation routes, communication systems

### Risk Assessment Methodology

#### Systematic Hazard Identification
**Environmental Hazards**:
- **Weather Conditions**: Sea state limits, wind parameters, visibility restrictions
- **Water Quality**: Temperature ranges, contamination risks, biological hazards
- **Marine Traffic**: Vessel operations, shipping lanes, fishing activity
- **Structural Hazards**: Underwater obstacles, unstable structures, entanglement risks

**Operational Risk Categories**:
- **Equipment Failures**: Breathing gas interruption, communication loss, tool malfunctions
- **Personnel Factors**: Experience levels, medical fitness, psychological readiness
- **Procedural Risks**: Complex operations, confined spaces, overhead environments
- **Emergency Scenarios**: Medical emergencies, equipment casualties, environmental changes

#### Risk Matrix Development
**Probability Assessment Scale**:
- **Very Low (1)**: Extremely unlikely, exceptional circumstances
- **Low (2)**: Unlikely but possible, rare occurrence
- **Medium (3)**: Possible, occasional occurrence
- **High (4)**: Likely, regular occurrence
- **Very High (5)**: Almost certain, frequent occurrence

**Consequence Severity Scale**:
- **Negligible (1)**: Minor inconvenience, no impact
- **Minor (2)**: Small delays, minor equipment damage
- **Moderate (3)**: Significant delays, moderate injuries
- **Major (4)**: Project impact, serious injuries
- **Catastrophic (5)**: Fatalities, major environmental impact

## Operational Planning Components

### Personnel Management Strategy

#### Team Composition Planning
**Primary Diving Personnel**:
- **Lead Diver**: Most experienced, complex task assignment
- **Standby Diver**: Ready for immediate deployment, emergency response
- **Dive Supervisor**: Overall operation control, safety management
- **Dive Tender**: Surface support, equipment management, communication

**Support Personnel Requirements**:
- **Medical Officer**: Emergency medical response, fitness assessment
- **Equipment Technician**: System maintenance, troubleshooting support
- **Crane Operator**: Lifting operations, equipment deployment
- **Communications Operator**: Multi-channel communication management

#### Competency Assessment Framework
**Technical Skill Verification**:
- **Certification Currency**: Valid certifications, recency requirements
- **Task-Specific Training**: Specialized procedures, equipment familiarity
- **Experience Documentation**: Similar work history, complexity progression
- **Medical Fitness**: Physical examination currency, fitness for duty

**Team Integration Factors**:
- **Communication Compatibility**: Language skills, protocol familiarity
- **Work History**: Previous collaboration, performance records
- **Emergency Response**: Crisis management experience, stress performance
- **Cultural Considerations**: International operations, local regulations

### Equipment Planning and Management

#### Primary Life Support Systems
**Breathing Gas Supply**:
- **Surface Supply**: Compressor capacity, distribution systems, backup requirements
- **Emergency Gas**: Bailout bottles, emergency gas volume calculations
- **Gas Quality**: Analysis requirements, purity standards, contamination monitoring
- **Distribution Infrastructure**: Umbilicals, manifolds, pressure regulation systems

**Communication Systems**:
- **Primary Communications**: Hard-wire systems, wireless backup options
- **Emergency Communications**: Independent systems, surface-to-surface backup
- **Recording Systems**: Communication logging, incident documentation
- **Integration**: Multiple platform communication, shore-based coordination

#### Specialized Tool Requirements
**Task-Specific Equipment**:
- **Cutting Tools**: Underwater torches, hydraulic cutters, diamond wire saws
- **Welding Equipment**: Underwater welding systems, electrode specifications
- **Lifting Equipment**: Lifting bags, mechanical advantage systems, rigging hardware
- **Inspection Tools**: Cameras, measurement devices, non-destructive testing equipment

## Operational Procedures Development

### Standard Operating Procedures (SOPs)

#### Dive Operation Protocols
**Pre-Dive Procedures**:
1. **Equipment Inspection**: System functionality verification, safety checks
2. **Personnel Briefing**: Task assignment, safety protocols, emergency procedures
3. **Environmental Assessment**: Current conditions, weather monitoring
4. **Communication Checks**: All systems operational verification
5. **Final Authorization**: Supervisor approval, safety clearance

**During Operations**:
- **Continuous Monitoring**: Diver status, environmental conditions, equipment performance
- **Communication Protocol**: Regular check-ins, status reporting, emergency signals
- **Progress Tracking**: Work advancement, quality verification, time management
- **Safety Oversight**: Hazard monitoring, personnel rotation, emergency readiness

#### Emergency Response Procedures
**Medical Emergency Protocol**:
1. **Immediate Response**: Emergency ascent procedures, medical assessment
2. **Treatment Initiation**: First aid, oxygen therapy, evacuation preparation
3. **Communication**: Medical control contact, evacuation coordination
4. **Documentation**: Incident recording, witness statements, equipment status

**Equipment Emergency Response**:
- **Gas Supply Failure**: Emergency gas deployment, bailout procedures
- **Communication Loss**: Backup system activation, emergency protocols
- **Equipment Malfunction**: Troubleshooting procedures, replacement protocols
- **Environmental Emergency**: Abort procedures, personnel recovery

### Quality Assurance Framework

#### Work Quality Standards
**Performance Specifications**:
- **Technical Standards**: Industry codes, client specifications, regulatory requirements
- **Quality Control**: Inspection protocols, testing procedures, documentation requirements
- **Acceptance Criteria**: Pass/fail standards, rework procedures, final approval

**Documentation Requirements**:
- **Work Progress**: Daily reports, photographic documentation, measurement records
- **Quality Records**: Inspection results, test data, certification documents
- **Safety Documentation**: Incident reports, safety meeting minutes, training records
- **Regulatory Compliance**: Permit requirements, environmental monitoring, inspection reports

## Advanced Planning Considerations

### Multi-Phase Project Management

#### Sequential Operation Planning
**Phase Development Strategy**:
- **Critical Path Analysis**: Task dependencies, scheduling optimization
- **Resource Scheduling**: Equipment deployment, personnel rotation
- **Weather Window Utilization**: Optimal condition periods, contingency scheduling
- **Progress Milestones**: Achievement markers, payment schedules, client reporting

#### Contingency Planning
**Alternative Approach Development**:
- **Method Variations**: Multiple techniques for achieving objectives
- **Resource Alternatives**: Backup equipment, alternative suppliers
- **Schedule Flexibility**: Weather delays, equipment failures, personnel issues
- **Budget Contingencies**: Cost overrun provisions, scope change management

### International Operations Considerations

#### Regulatory Compliance Management
**Local Regulations**: National diving standards, safety requirements, certification recognition
**Permit Requirements**: Work permits, environmental approvals, safety clearances
**Cultural Factors**: Local practices, language barriers, business customs
**Logistics**: Equipment importation, personnel visas, local support services

## Practice Application: Complex Project Planning

**Project Scenario**: Underwater pipeline repair at 45-meter depth in challenging environmental conditions with international crew and specialized equipment requirements.

### Comprehensive Planning Exercise
1. **Risk Assessment**: Complete hazard identification and mitigation planning
2. **Resource Planning**: Personnel, equipment, and logistics coordination
3. **Procedure Development**: Step-by-step operational procedures
4. **Emergency Planning**: Comprehensive emergency response procedures
5. **Quality Assurance**: Quality control and documentation systems

### Planning Deliverables
- **Project Plan Document**: Complete operational plan with schedules and procedures
- **Risk Management Plan**: Hazard identification and mitigation strategies
- **Emergency Response Plan**: Comprehensive emergency procedures
- **Quality Assurance Plan**: Inspection and documentation protocols
- **Communication Plan**: Reporting and coordination procedures

This comprehensive dive planning training ensures systematic project management capabilities essential for successful commercial diving operations and professional supervisory responsibilities.`,
  }).returning();

  // Air Diver Track
  const [airLesson1] = await db.insert(lessons).values({
    trackId: airDiverTrack.id,
    title: "Gas Management and Consumption Planning",
    order: 1,
    content: `# Gas Management and Consumption Planning
## AI Tutor: Lisa Thompson - Professional Air Diving Instructor

*Professional air diving instructor specializing in gas management, ascent procedures, and underwater tool handling safety*

Proper gas management forms the foundation of safe air diving operations. This comprehensive module covers consumption calculation methodologies, emergency reserve planning, and supply monitoring techniques essential for professional diving safety.

## Gas Consumption Fundamentals

### Physiological Consumption Factors
Understanding individual variation in gas consumption rates:

#### Physical Characteristics Impact
- **Body Mass Index**: Larger individuals typically require higher gas volumes
- **Lung Capacity**: Vital capacity directly affects breathing efficiency
- **Physical Conditioning**: Cardiovascular fitness reduces consumption rates
- **Age Factors**: Respiratory efficiency changes with age and health status
- **Gender Differences**: Average consumption variations requiring individual assessment

#### Psychological Influences on Consumption
- **Experience Level**: Novice divers consume 50-100% more than experienced divers
- **Stress Response**: Anxiety can double or triple consumption rates
- **Task Familiarity**: Unfamiliar work increases mental load and gas use
- **Emergency Situations**: Panic responses can increase consumption 300-400%
- **Confidence Factor**: Self-assured divers demonstrate more efficient breathing patterns

### Environmental Consumption Variables

#### Depth-Related Consumption Changes
Gas consumption increases linearly with absolute pressure:

**Pressure Relationships**:
- **Surface (1 ATA)**: Baseline consumption measurement
- **33 feet (2 ATA)**: Exactly double surface consumption
- **66 feet (3 ATA)**: Triple surface consumption rate
- **99 feet (4 ATA)**: Quadruple surface consumption rate
- **132 feet (5 ATA)**: Five times surface consumption

**Consumption Formula**: 
Surface Rate × (Depth in feet + 33) ÷ 33 = Depth Consumption Rate

#### Work Load Categories and Planning Rates
Professional diving work classification with typical consumption rates:

**Light Work (1.5-2.0 CFM)**:
- Visual inspection without tools
- Light cleaning with hand tools
- Photography and documentation
- Simple measurement tasks

**Moderate Work (2.0-3.0 CFM)**:
- Power tool operation
- Moderate physical effort tasks
- Rigging and lifting preparation
- Installation of small components

**Heavy Work (3.0-4.5 CFM)**:
- Cutting and welding operations
- Heavy lifting and positioning
- Demolition activities
- Strenuous physical labor

**Emergency Operations (4.5-6.0+ CFM)**:
- Rescue operations under stress
- Emergency repair activities
- Panic or high-stress situations
- Life-threatening emergency response

## Professional Gas Planning Methodology

### Pre-Dive Calculation Procedures

#### Complete Gas Requirement Formula
**Total Gas Required = (Work Time × Consumption Rate × Depth Factor) + Emergency Reserves + Operational Reserves + Surface Reserves**

#### Detailed Planning Example
**Scenario**: 75-foot working dive for heavy construction work

**Given Parameters**:
- Planned bottom time: 40 minutes
- Work classification: Heavy (4.0 CFM surface equivalent)
- Depth factor: 3.3 ATA (75 feet + 33 ÷ 33)
- Diver experience: Intermediate level
- Environmental conditions: Moderate current, good visibility

**Calculation Steps**:
1. **Base Work Consumption**: 40 min × 4.0 CFM × 3.3 ATA = 528 cubic feet
2. **Emergency Reserve (25%)**: 528 × 0.25 = 132 cubic feet
3. **Task Overrun (20%)**: 528 × 0.20 = 106 cubic feet
4. **Emergency Ascent**: 75 cubic feet (standard minimum)
5. **Surface Reserve**: 50 cubic feet (equipment operation)
6. **Total Required**: 528 + 132 + 106 + 75 + 50 = 891 cubic feet

### Reserve Category Planning

#### Emergency Reserves (Non-Negotiable)
**Primary Emergency Reserve**: 25% of total calculated work consumption
- Purpose: Equipment malfunction response
- Usage: Emergency problem-solving time
- Protection: Against calculation errors
- Standard: Industry minimum requirement

**Emergency Ascent Reserve**: Minimum 75 cubic feet regardless of dive depth
- Purpose: Controlled emergency ascent to surface
- Calculation: Ascent time × emergency consumption rate × average depth factor
- Includes: Surface swimming time and equipment inflation
- Safety Factor: Weather deterioration contingency

#### Operational Reserves
**Task Overrun Reserve**: 20% of work consumption
- Purpose: Extended work time for task completion
- Causes: Unexpected complications, additional work requirements
- Planning: Client expectation management, schedule flexibility
- Documentation: Actual time vs. planned time tracking

**Equipment Problem Reserve**: 10% of total gas supply
- Purpose: On-bottom equipment troubleshooting
- Scenarios: Tool malfunctions, equipment adjustments
- Time Allocation: Problem-solving without compromising safety
- Alternative: Additional dive for equipment issues

### Real-Time Gas Management

#### Continuous Monitoring Protocols
Professional divers maintain constant gas awareness:

**Pressure Check Intervals**:
- **Initial**: Full verification before descent
- **Every 5 Minutes**: Regular consumption monitoring during work
- **Before Tasks**: Prior to high-consumption activities
- **Critical Pressures**: At predetermined decision points

#### Consumption Rate Verification
**Real-Time Calculation Method**:
1. **Baseline Establishment**: Record initial pressure and time
2. **Interval Measurement**: Note pressure drop over specific time period
3. **Volume Conversion**: Convert pressure loss to actual gas volume used
4. **Rate Calculation**: Adjust for current depth to determine actual consumption
5. **Projection**: Estimate remaining bottom time based on current rate

**Example Real-Time Assessment**:
- **Equipment**: 80 cubic foot tank at 3000 PSI initial
- **After 20 minutes at 66 feet**: 2200 PSI remaining
- **Pressure Used**: 800 PSI (3000 - 2200)
- **Volume Consumed**: 800 ÷ 3000 × 80 = 21.3 cubic feet
- **Time Factor**: 20 minutes
- **Depth Factor**: 3.0 ATA (66 feet)
- **Actual Surface Rate**: 21.3 ÷ 20 ÷ 3.0 = 0.36 CFM surface equivalent
- **Assessment**: Lower than planned (4.0 CFM) - verify work intensity or task changes

### Critical Decision Point Management

#### Predetermined Pressure Points
Establish clear decision pressures before every dive:

**Turn-Around Pressure (50% Remaining)**:
- Purpose: Initiate return to surface or ascent preparation
- Calculation: Must allow for ascent plus all reserves
- No Exceptions: Begin ascent regardless of work status
- Communication: Notify surface support immediately

**Emergency Reserve Pressure (25% Remaining)**:
- Purpose: Emergency use only - no routine consumption
- Usage: Equipment emergencies, emergency ascent, rescue operations
- Violation: Serious safety protocol breach requiring investigation
- Recovery: Immediate ascent using emergency procedures

**Surface Reserve Pressure (200 PSI Minimum)**:
- Purpose: Equipment operation after surfacing
- Requirements: Regulator function, BCD operation, safety margin
- Weather Factor: Rough surface conditions may require additional reserve
- Equipment Checkout: Post-dive system verification

## Advanced Gas Management Techniques

### Surface Supply System Management

#### Compressor System Planning
**Capacity Requirements**:
- **Primary Diver Supply**: Maximum anticipated consumption
- **Standby Diver**: Concurrent supply capability
- **System Losses**: 10-15% for distribution and regulation
- **Emergency Factor**: 50% additional capacity minimum

**Example System Sizing**:
- Primary diver maximum: 5.0 CFM (heavy work at depth)
- Standby diver requirement: 5.0 CFM capability
- Distribution losses: 15%
- Emergency factor: 50%
- **Total Compressor Requirement**: (5.0 + 5.0) × 1.15 × 1.5 = 17.25 CFM minimum

#### Distribution System Management
**Manifold Configuration**:
- **Primary Distribution**: Main supply line to primary diver
- **Emergency Distribution**: Independent supply to all stations
- **Cross-Connection**: Emergency supply sharing capability
- **Monitoring**: Pressure and flow monitoring at all points

### Emergency Gas Management Procedures

#### Gas Emergency Response Protocol
**Recognition**: Early identification of gas supply problems
- **Consumption Monitoring**: Unexpectedly high consumption rates
- **Pressure Warnings**: Rapid pressure loss indicators
- **Equipment Symptoms**: Regulator breathing resistance, flow irregularities
- **Communication**: Clear emergency communication procedures

**Response Priorities**:
1. **Safety Assessment**: Evaluate immediate danger level
2. **Conservation**: Reduce consumption through work cessation
3. **Alternative Supply**: Deploy emergency gas or bailout systems
4. **Ascent Decision**: Initiate emergency ascent if required
5. **Surface Support**: Alert surface team for emergency response

## Practice Application: Gas Management Scenario

**Professional Scenario**: Complex underwater welding operation at 90-foot depth with multiple divers and extended work requirements.

### Planning Requirements
- **Primary Welder**: Heavy work consumption for 60 minutes
- **Standby Diver**: Ready for immediate emergency response
- **Inspection Diver**: Light work for quality verification
- **Environmental**: Moderate current, good visibility, stable weather

### Gas Management Plan Development
1. **Individual Calculations**: Each diver's specific gas requirements
2. **System Capacity**: Surface supply system sizing and backup
3. **Emergency Procedures**: Gas failure response protocols
4. **Communication**: Gas status reporting and emergency signals
5. **Quality Assurance**: Real-time monitoring and decision protocols

This comprehensive gas management training ensures professional competency in gas planning and monitoring, providing the safety foundation essential for all commercial diving operations.`,
  }).returning();

  // Create professional assessments with multiple question types
  const [ndtAssessment] = await db.insert(quizzes).values({
    lessonId: ndtLesson1.id,
    title: "Professional NDT Assessment - Visual Inspection",
    timeLimit: 30,
  }).returning();

  await db.insert(questions).values([
    {
      quizId: ndtAssessment.id,
      prompt: "In professional underwater visual inspection, what is the primary advantage of using a systematic grid pattern technique?",
      a: "Reduces overall inspection time",
      b: "Ensures complete coverage with no missed areas and provides quality control verification",
      c: "Minimizes required lighting equipment",
      d: "Reduces diver fatigue and air consumption",
      answer: "b",
      order: 1,
    },
    {
      quizId: ndtAssessment.id,
      prompt: "Which type of corrosion is most commonly associated with dissimilar metal connections in marine environments and requires galvanic series analysis?",
      a: "General uniform corrosion",
      b: "Localized pitting corrosion",
      c: "Galvanic corrosion with preferential anode attack",
      d: "Crevice corrosion in confined spaces",
      answer: "c",
      order: 2,
    },
    {
      quizId: ndtAssessment.id,
      prompt: "What is the industry standard minimum cathodic protection potential for steel structures in seawater according to NACE standards?",
      a: "-750 mV (Ag/AgCl reference electrode)",
      b: "-850 mV (Ag/AgCl reference electrode)",
      c: "-950 mV (Ag/AgCl reference electrode)", 
      d: "-650 mV (Ag/AgCl reference electrode)",
      answer: "b",
      order: 3,
    },
  ]);

  const [medicAssessment] = await db.insert(quizzes).values({
    lessonId: medicLesson1.id,
    title: "Professional Emergency Medical Assessment",
    timeLimit: 25,
  }).returning();

  await db.insert(questions).values([
    {
      quizId: medicAssessment.id,
      prompt: "In the ABCDE assessment protocol for diving emergencies, what is the correct sequence and primary focus of each step?",
      a: "Airway, Breathing, Circulation, Disability, Exposure - with systematic progression through each step",
      b: "Assessment, Basic life support, CPR, Defibrillation, Emergency transport",
      c: "Alert, Blood pressure, Consciousness, Drugs, Environment evaluation",
      d: "Ascent, Buoyancy, Communication, Descent, Emergency procedures",
      answer: "a",
      order: 1,
    },
    {
      quizId: medicAssessment.id,
      prompt: "What is the primary difference between Type I and Type II decompression sickness in terms of symptoms and severity?",
      a: "Type I affects only joints, Type II affects only the lungs",
      b: "Type I involves mild joint pain and skin changes, Type II involves neurological symptoms and pulmonary involvement",
      c: "Type I occurs at shallow depths, Type II occurs at deep depths",
      d: "Type I is treatable with oxygen, Type II requires immediate surgery",
      answer: "b",
      order: 2,
    },
  ]);

  const [airDiverAssessment] = await db.insert(quizzes).values({
    lessonId: airLesson1.id,
    title: "Professional Gas Management Assessment",
    timeLimit: 20,
  }).returning();

  await db.insert(questions).values([
    {
      quizId: airDiverAssessment.id,
      prompt: "For a 60-foot working dive with moderate work consumption (3.0 CFM surface rate) for 30 minutes, what is the minimum total gas requirement including all professional reserves?",
      a: "180 cubic feet (work gas only)",
      b: "270 cubic feet (work gas plus 25% emergency reserve)",
      c: "405 cubic feet (work gas, emergency reserve, task overrun, ascent, and surface reserves)",
      d: "225 cubic feet (work gas plus emergency ascent reserve)",
      answer: "c",
      order: 1,
    },
    {
      quizId: airDiverAssessment.id,
      prompt: "At what remaining tank pressure should a professional air diver begin ascent procedures (turn-around pressure)?",
      a: "25% of total tank capacity (emergency reserve pressure)",
      b: "50% of total tank capacity to allow for ascent plus all reserves", 
      c: "200 PSI minimum surface reserve pressure",
      d: "When work is completed regardless of remaining pressure",
      answer: "b",
      order: 2,
    },
  ]);

  console.log('✅ Professional diving education platform seeded successfully!');
  console.log(`Created ${await db.select().from(tracks).then(r => r.length)} comprehensive professional training tracks`);
  console.log(`Created ${await db.select().from(lessons).then(r => r.length)} detailed professional lessons`);
  console.log(`Created ${await db.select().from(quizzes).then(r => r.length)} professional assessments`);
  console.log(`Created ${await db.select().from(questions).then(r => r.length)} professional assessment questions`);
}

professionalSeed().catch(console.error).finally(() => process.exit(0));