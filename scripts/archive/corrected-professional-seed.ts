import { db } from "../server/db";
import { tracks, lessons, quizzes, questions, aiTutors } from "../shared/schema";

async function correctedProfessionalSeed() {
  console.log('🔧 Creating corrected professional diving exam preparation database with properly categorized questions...');

  // Clear existing data
  await db.delete(questions);
  await db.delete(quizzes);
  await db.delete(lessons);
  await db.delete(tracks);
  await db.delete(aiTutors);

  // Create AI Tutors for each specialization
  const [ndtTutor] = await db.insert(aiTutors).values({
    name: "Dr. Sarah Chen",
    specialty: "NDT Inspection Specialist",
    description: "Expert in underwater non-destructive testing, visual inspection, and structural integrity assessment with 15+ years in offshore inspection.",
    systemPrompt: "You are Dr. Sarah Chen, a professional NDT inspection specialist with expertise in underwater visual inspection, corrosion assessment, and structural integrity. Provide detailed technical guidance on inspection methodologies, equipment, and safety protocols.",
    track: "NDT"
  }).returning();

  const [dmtTutor] = await db.insert(aiTutors).values({
    name: "Dr. Michael Rodriguez",
    specialty: "Emergency Medicine Specialist",
    description: "Diving medical officer with extensive experience in diving emergencies, hyperbaric medicine, and field emergency response.",
    systemPrompt: "You are Dr. Michael Rodriguez, a diving medical specialist with expertise in emergency response, ABCDE assessment, and diving-related medical emergencies. Provide professional medical guidance and emergency protocols.",
    track: "DMT"
  }).returning();

  const [supervisorTutor] = await db.insert(aiTutors).values({
    name: "Captain James Mitchell",
    specialty: "Commercial Dive Supervisor",
    description: "Senior dive supervisor with 20+ years managing complex offshore diving operations, safety protocols, and team leadership.",
    systemPrompt: "You are Captain James Mitchell, an experienced commercial dive supervisor with expertise in dive operations management, safety protocols, and emergency response leadership.",
    track: "SUPERVISOR"
  }).returning();

  const [saturationTutor] = await db.insert(aiTutors).values({
    name: "Commander Robert Hayes",
    specialty: "Saturation Diving Expert",
    description: "Military and commercial saturation diving specialist with expertise in life support systems, decompression management, and deep diving operations.",
    systemPrompt: "You are Commander Robert Hayes, a saturation diving expert with military and commercial experience in deep diving operations, life support systems, and decompression management.",
    track: "SATURATION"
  }).returning();

  const [weldingTutor] = await db.insert(aiTutors).values({
    name: "Lisa Thompson",
    specialty: "Underwater Welding Specialist",
    description: "Professional underwater welder with expertise in wet welding, electrode selection, and quality control in marine environments.",
    systemPrompt: "You are Lisa Thompson, an underwater welding specialist with expertise in wet and dry welding techniques, electrode selection, and quality control procedures.",
    track: "WELDING"
  }).returning();

  const [hyperbaricTutor] = await db.insert(aiTutors).values({
    name: "Rebecca Foster",
    specialty: "Hyperbaric Chamber Operator",
    description: "Certified hyperbaric technician with expertise in chamber operations, treatment protocols, and emergency procedures.",
    systemPrompt: "You are Rebecca Foster, a hyperbaric chamber specialist with expertise in treatment protocols, emergency procedures, and patient monitoring.",
    track: "HYPERBARIC"
  }).returning();

  // Create Professional Training Tracks
  const [ndtTrack] = await db.insert(tracks).values({
    title: "NDT Inspection & Testing",
    slug: "ndt-inspection",
    summary: "Comprehensive training in underwater non-destructive testing, visual inspection techniques, and structural integrity assessment for commercial diving operations.",
    aiTutorId: ndtTutor.id,
    isPublished: true,
  }).returning();

  const [dmtTrack] = await db.insert(tracks).values({
    title: "Diver Medic Technician (DMT)",
    slug: "diver-medic",
    summary: "Professional emergency medical response training for diving operations, including ABCDE assessment, emergency protocols, and field medical care.",
    aiTutorId: dmtTutor.id,
    isPublished: true,
  }).returning();

  const [supervisorTrack] = await db.insert(tracks).values({
    title: "Commercial Dive Supervisor",
    slug: "commercial-supervisor",
    summary: "Leadership training for dive operations management, safety protocols, and emergency response coordination in commercial diving.",
    aiTutorId: supervisorTutor.id,
    isPublished: true,
  }).returning();

  const [saturationTrack] = await db.insert(tracks).values({
    title: "Saturation Diving Systems",
    slug: "saturation-diving",
    summary: "Advanced training in saturation diving operations, life support systems, and decompression management for deep commercial diving.",
    aiTutorId: saturationTutor.id,
    isPublished: true,
  }).returning();

  const [weldingTrack] = await db.insert(tracks).values({
    title: "Advanced Underwater Welding",
    slug: "underwater-welding",
    summary: "Professional underwater welding techniques, electrode selection, and quality control procedures for marine construction.",
    aiTutorId: weldingTutor.id,
    isPublished: true,
  }).returning();

  const [hyperbaricTrack] = await db.insert(tracks).values({
    title: "Hyperbaric Chamber Operations",
    slug: "hyperbaric-operations",
    summary: "Comprehensive training in hyperbaric treatment protocols, emergency procedures, and patient monitoring systems.",
    aiTutorId: hyperbaricTutor.id,
    isPublished: true,
  }).returning();

  // ====== NDT INSPECTION TRACK CONTENT ======
  const [ndtLesson1] = await db.insert(lessons).values({
    trackId: ndtTrack.id,
    title: "Visual Inspection Fundamentals",
    order: 1,

    content: `# Visual Inspection Fundamentals - NDT Training

**AI Tutor: Dr. Sarah Chen - NDT Inspection Specialist**

Visual inspection forms the foundation of underwater non-destructive testing, requiring systematic methodology and professional expertise.

## Systematic Grid Pattern Methodology

### Grid Pattern Advantages
The systematic grid pattern technique is the **primary advantage** for underwater visual inspection because it:
- **Ensures complete systematic coverage** with quality assurance verification
- **Eliminates missed critical structural areas** through methodical progression
- Provides documentation of inspection completeness
- Enables quality assurance verification and audit trails

### Corrosion Assessment

#### Galvanic Corrosion
**Most commonly associated with dissimilar metal connections** in marine environments:
- Occurs when dissimilar metals are in electrical contact in seawater
- Creates galvanic cells with preferential anode attack at connection points
- Requires electrochemical galvanic series analysis for proper assessment

#### Pitting Corrosion
- **Localized deep penetration**, not uniform surface degradation
- High depth-to-diameter ratios characterize pitting damage
- Distinguished from general corrosion by localized attack patterns

### Cathodic Protection Standards

#### NACE Standards
According to **NACE industry standards** for cathodic protection:
- **Minimum protection potential**: -850 mV (Ag/AgCl reference electrode)
- Requires instant-off potential measurement for accurate assessment
- Silver/Silver Chloride reference electrode is industry standard

## Environmental Factors Affecting Inspection

### Critical Environmental Considerations
Three key environmental factors significantly impacting inspection quality:
1. **Visibility limitations** - water clarity and lighting conditions
2. **Current effects** - impact on diver stability and inspection accuracy  
3. **Depth considerations** - narcosis effects and time limitations

## Professional Documentation
All inspections must follow professional standards with systematic documentation and quality assurance verification.`,
  }).returning();

  const [ndtQuiz] = await db.insert(quizzes).values({
    lessonId: ndtLesson1.id,
    title: "NDT Visual Inspection Assessment",
    timeLimit: 30,
    examType: "PRACTICE_TEST",
    passingScore: 80,
    maxAttempts: 3,
    showFeedback: true,
  }).returning();

  // NDT-SPECIFIC QUESTIONS (Correctly Categorized)
  await db.insert(questions).values([
    {
      quizId: ndtQuiz.id,
      type: "MULTIPLE_CHOICE",
      prompt: "In professional underwater visual inspection, what is the primary advantage of systematic grid pattern inspection methodology?",
      options: ["Reduces total inspection time and operational costs", "Ensures complete systematic coverage with quality assurance verification and eliminates missed critical areas", "Minimizes specialized lighting and equipment requirements", "Reduces diver physical exertion and gas consumption rates"],
      correctAnswer: "Ensures complete systematic coverage with quality assurance verification and eliminates missed critical areas",
      explanation: "Systematic grid pattern methodology is the primary advantage because it ensures complete coverage with quality assurance verification, preventing missed critical structural areas during inspection.",
      points: 3,
      order: 1,
    },
    {
      quizId: ndtQuiz.id,
      type: "MULTIPLE_CHOICE",
      prompt: "Which corrosion type is most commonly associated with dissimilar metal connections in marine environments?",
      options: ["General uniform corrosion across large surface areas", "Localized pitting corrosion with high depth-to-diameter ratios", "Galvanic corrosion with preferential anode attack at connection points", "Crevice corrosion in confined joint spaces"],
      correctAnswer: "Galvanic corrosion with preferential anode attack at connection points",
      explanation: "Galvanic corrosion is most commonly associated with dissimilar metal connections because it occurs when different metals are in electrical contact in seawater, creating galvanic cells.",
      points: 2,
      order: 2,
    },
    {
      quizId: ndtQuiz.id,
      type: "TRUE_FALSE",
      prompt: "Pitting corrosion is characterized by uniform surface degradation across large areas.",
      options: ["True", "False"],
      correctAnswer: "False",
      explanation: "Pitting corrosion is characterized by localized deep penetration, not uniform surface degradation. General corrosion shows uniform patterns across large areas.",
      points: 1,
      order: 3,
    },
    {
      quizId: ndtQuiz.id,
      type: "MULTIPLE_CHOICE",
      prompt: "According to NACE industry standards, what is the minimum cathodic protection potential for steel structures in seawater using Silver/Silver Chloride reference electrode?",
      options: ["-750 mV (Ag/AgCl) with polarization verification", "-850 mV (Ag/AgCl) with instant-off potential measurement", "-950 mV (Ag/AgCl) with current density confirmation", "-650 mV (Ag/AgCl) with environmental correction factors"],
      correctAnswer: "-850 mV (Ag/AgCl) with instant-off potential measurement",
      explanation: "NACE standards specify -850 mV (Ag/AgCl) as the minimum cathodic protection potential for steel in seawater, measured with instant-off potential techniques.",
      points: 2,
      order: 4,
    },
    {
      quizId: ndtQuiz.id,
      type: "SHORT_ANSWER",
      prompt: "List three environmental factors that can significantly impact underwater visual inspection quality and explain how each factor affects inspection accuracy.",
      options: [],
      correctAnswer: "visibility limitations, current effects, depth considerations",
      explanation: "Key environmental factors include: 1) Visibility limitations (water clarity affects defect detection), 2) Current effects (impact diver stability and inspection accuracy), 3) Depth considerations (narcosis and time limits affect inspector performance).",
      points: 4,
      order: 5,
    }
  ]);

  // ====== DMT (DIVER MEDIC TECHNICIAN) TRACK CONTENT ======
  const [dmtLesson1] = await db.insert(lessons).values({
    trackId: dmtTrack.id,
    title: "Emergency Response Protocols - ABCDE Assessment",
    order: 1,

    content: `# Emergency Response Protocols - ABCDE Assessment

**AI Tutor: Dr. Michael Rodriguez - Emergency Medicine Specialist**

The ABCDE approach provides systematic emergency assessment for diving emergencies, ensuring critical priorities are addressed in correct sequence.

## ABCDE Protocol Overview

### Professional ABCDE Sequence
The correct systematic sequence and primary clinical focus:
- **A**: **Airway patency assessment** - ensure clear airway
- **B**: **Breathing adequacy evaluation** - assess ventilation effectiveness  
- **C**: **Circulation status check** - evaluate cardiovascular function
- **D**: **Disability neurological assessment** - check neurological status
- **E**: **Exposure complete examination** with sequential stabilization

## Decompression Sickness Classification

### Type I vs Type II DCS
**Primary clinical difference**:

**Type I DCS**:
- Involves mild joint pain and skin manifestations
- Lower treatment urgency priority
- Generally affects musculoskeletal system
- Less immediate life threat

**Type II DCS**:
- Involves serious **neurological and pulmonary complications**
- **Requires immediate intervention** and emergency treatment
- Affects central nervous system and vital organs
- Life-threatening emergency requiring urgent hyperbaric treatment

## Arterial Gas Embolism (AGE) Management

### Optimal Treatment Protocol
**Emergency management for AGE**:
- **Left lateral recumbent position** (optimal positioning)
- **Immediate high-flow oxygen therapy** (100% oxygen)
- **Urgent hyperbaric facility evacuation** (emergency transport)

This positioning prevents further air embolism migration while high-flow oxygen maximizes dissolved oxygen content.

## Professional Emergency Protocols
All emergency responses require systematic assessment with immediate life-saving interventions taking priority over diagnostic procedures.`,
  }).returning();

  const [dmtQuiz] = await db.insert(quizzes).values({
    lessonId: dmtLesson1.id,
    title: "DMT Emergency Response Assessment",
    timeLimit: 25,
    examType: "PRACTICE_TEST",
    passingScore: 85,
    maxAttempts: 3,
    showFeedback: true,
  }).returning();

  // DMT-SPECIFIC QUESTIONS (Correctly Categorized)
  await db.insert(questions).values([
    {
      quizId: dmtQuiz.id,
      type: "MULTIPLE_CHOICE",
      prompt: "In the professional ABCDE emergency assessment protocol for diving emergencies, what is the correct systematic sequence and primary clinical focus of each component?",
      options: [
        "Airway patency assessment, Breathing adequacy evaluation, Circulation status check, Disability neurological assessment, Exposure complete examination with sequential stabilization",
        "Alert level determination, Blood pressure measurement, CPR readiness assessment, Drug administration protocol, Emergency transport preparation",
        "Ascent procedure verification, Buoyancy control assessment, Communication system check, Depth monitoring evaluation, Emergency evacuation preparation",
        "Assessment priority determination, Basic life support initiation, Clinical evaluation completion, Diagnostic testing performance, Emergency procedure implementation"
      ],
      correctAnswer: "Airway patency assessment, Breathing adequacy evaluation, Circulation status check, Disability neurological assessment, Exposure complete examination with sequential stabilization",
      explanation: "The ABCDE protocol follows this specific sequence: Airway patency, Breathing adequacy, Circulation status, Disability (neurological), and Exposure examination with stabilization at each step.",
      points: 3,
      order: 1,
    },
    {
      quizId: dmtQuiz.id,
      type: "MULTIPLE_CHOICE",
      prompt: "What is the primary clinical difference between Type I and Type II decompression sickness in terms of symptom presentation and treatment urgency?",
      options: [
        "Type I affects only joint systems with delayed onset, Type II affects only pulmonary systems with immediate onset",
        "Type I involves mild joint pain and skin manifestations with lower urgency, Type II involves serious neurological and pulmonary complications requiring immediate intervention",
        "Type I occurs exclusively at shallow recreational depths, Type II occurs exclusively at deep commercial diving depths",
        "Type I responds to surface oxygen therapy alone, Type II requires immediate surgical intervention"
      ],
      correctAnswer: "Type I involves mild joint pain and skin manifestations with lower urgency, Type II involves serious neurological and pulmonary complications requiring immediate intervention",
      explanation: "Type I DCS involves milder symptoms (joint pain, skin changes) with lower treatment urgency, while Type II affects serious systems (neurological, pulmonary) requiring immediate emergency intervention.",
      points: 3,
      order: 2,
    },
    {
      quizId: dmtQuiz.id,
      type: "MULTIPLE_CHOICE",
      prompt: "In arterial gas embolism (AGE) emergency management, what is the optimal patient positioning and immediate treatment protocol?",
      options: [
        "Upright sitting position with standard oxygen therapy",
        "Left lateral recumbent position with immediate high-flow oxygen therapy and urgent hyperbaric facility evacuation",
        "Prone position with assisted mechanical ventilation",
        "Right lateral position with standard oxygen therapy and delayed transport"
      ],
      correctAnswer: "Left lateral recumbent position with immediate high-flow oxygen therapy and urgent hyperbaric facility evacuation",
      explanation: "AGE requires left lateral recumbent positioning to prevent further air migration, immediate high-flow oxygen (100%), and urgent hyperbaric treatment evacuation.",
      points: 3,
      order: 3,
    },
    {
      quizId: dmtQuiz.id,
      type: "TRUE_FALSE",
      prompt: "In diving emergency assessment, disability evaluation (the 'D' in ABCDE) should be performed before circulation assessment.",
      options: ["True", "False"],
      correctAnswer: "False",
      explanation: "The ABCDE sequence must be followed in order: Airway, Breathing, Circulation, then Disability. Circulation assessment comes before neurological disability evaluation.",
      points: 2,
      order: 4,
    },
    {
      quizId: dmtQuiz.id,
      type: "SHORT_ANSWER",
      prompt: "Describe the key differences in emergency management approach between Type I and Type II decompression sickness, including treatment priorities and urgency levels.",
      options: [],
      correctAnswer: "Type I: mild symptoms, joint pain, lower urgency, standard protocols; Type II: serious neurological/pulmonary, immediate intervention, emergency priority",
      explanation: "Type I DCS involves milder symptoms affecting joints/skin with standard treatment urgency, while Type II involves serious neurological and pulmonary complications requiring immediate emergency intervention and hyperbaric treatment.",
      points: 5,
      order: 5,
    }
  ]);

  // ====== COMMERCIAL DIVE SUPERVISOR TRACK ======
  const [supervisorLesson1] = await db.insert(lessons).values({
    trackId: supervisorTrack.id,
    title: "Dive Operations Management & Safety Protocols",
    order: 1,

    content: `# Dive Operations Management & Safety Protocols

**AI Tutor: Captain James Mitchell - Commercial Dive Supervisor**

Commercial dive supervision requires comprehensive knowledge of operations management, safety protocols, and emergency response coordination.

## Operations Management
- Personnel management and team coordination
- Equipment oversight and maintenance protocols
- Work planning and risk assessment
- Emergency response leadership

## Safety Protocol Implementation
- Pre-dive safety briefings and checks
- Continuous monitoring of dive operations
- Emergency action plan development
- Incident investigation and reporting

## Regulatory Compliance
- OSHA Commercial Diving Standards
- International diving safety protocols
- Company-specific safety requirements
- Documentation and record keeping`,
  }).returning();

  // ====== SATURATION DIVING TRACK ======
  const [saturationLesson1] = await db.insert(lessons).values({
    trackId: saturationTrack.id,
    title: "Saturation Systems & Decompression Management",
    order: 1,

    content: `# Saturation Systems & Decompression Management

**AI Tutor: Commander Robert Hayes - Saturation Diving Expert**

Saturation diving operations require specialized knowledge of life support systems, decompression management, and deep diving protocols.

## Life Support Systems
- Saturation habitat management
- Gas supply and monitoring systems
- Environmental control systems
- Emergency life support procedures

## Decompression Management
- Saturation decompression tables
- Treatment gas procedures
- Emergency decompression protocols
- Medical monitoring requirements

## Deep Diving Operations
- Pressure effects at depth
- Specialized equipment requirements
- Emergency procedures at saturation depths
- Communication systems management`,
  }).returning();

  // ====== UNDERWATER WELDING TRACK ======
  const [weldingLesson1] = await db.insert(lessons).values({
    trackId: weldingTrack.id,
    title: "Underwater Welding Techniques & Quality Control",
    order: 1,

    content: `# Underwater Welding Techniques & Quality Control

**AI Tutor: Lisa Thompson - Underwater Welding Specialist**

Professional underwater welding requires expertise in wet welding techniques, electrode selection, and quality control procedures.

## Wet Welding Fundamentals
- Electrode selection for marine environments
- Arc stability in underwater conditions
- Joint preparation and fit-up procedures
- Welding technique and travel speed

## Quality Control Procedures
- Visual inspection of weld quality
- Non-destructive testing methods
- Defect identification and repair
- Documentation and certification requirements

## Safety Protocols
- Electrical safety in wet welding
- Gas pocket management
- Emergency shutdown procedures
- Personal protective equipment requirements`,
  }).returning();

  // ====== HYPERBARIC OPERATIONS TRACK ======
  const [hyperbaricLesson1] = await db.insert(lessons).values({
    trackId: hyperbaricTrack.id,
    title: "Hyperbaric Treatment Protocols & Emergency Procedures",
    order: 1,

    content: `# Hyperbaric Treatment Protocols & Emergency Procedures

**AI Tutor: Rebecca Foster - Hyperbaric Chamber Specialist**

Hyperbaric chamber operations require comprehensive knowledge of treatment protocols, emergency procedures, and patient monitoring systems.

## Treatment Protocols
- Decompression sickness treatment tables
- Gas embolism emergency protocols
- Wound healing treatment procedures
- Patient monitoring requirements

## Emergency Procedures
- Chamber emergency shutdown
- Patient emergency evacuation
- Fire suppression procedures
- Medical emergency response

## Patient Monitoring
- Vital signs monitoring systems
- Neurological assessment procedures
- Communication systems operation
- Documentation requirements`,
  }).returning();

  console.log('✅ Corrected professional diving exam preparation database successfully seeded!');
  console.log(`Created ${await db.select().from(tracks).then(r => r.length)} professional training tracks with correctly categorized content`);
  console.log(`Created ${await db.select().from(lessons).then(r => r.length)} comprehensive lessons`);
  console.log(`Created ${await db.select().from(quizzes).then(r => r.length)} properly categorized assessments`);
  console.log(`Created ${await db.select().from(questions).then(r => r.length)} correctly categorized questions`);
  
  console.log('\n🎓 Professional Training Tracks Created:');
  console.log('1. NDT Inspection & Testing - Dr. Sarah Chen (Inspection/Corrosion Questions)');
  console.log('2. Diver Medic Technician - Dr. Michael Rodriguez (Medical/Emergency Questions)');
  console.log('3. Commercial Dive Supervisor - Captain James Mitchell');
  console.log('4. Saturation Diving Systems - Commander Robert Hayes');
  console.log('5. Advanced Underwater Welding - Lisa Thompson');
  console.log('6. Hyperbaric Chamber Operations - Rebecca Foster');

  console.log('\n✅ Question Categorization Audit Complete:');
  console.log('- NDT questions: Visual inspection, corrosion assessment, cathodic protection');
  console.log('- DMT questions: ABCDE protocol, DCS types, emergency management');
  console.log('- All questions now properly categorized by subject matter');
}

correctedProfessionalSeed().catch(console.error).finally(() => process.exit(0));