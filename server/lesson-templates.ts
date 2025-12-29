// Lesson templates for auto-populating 12 lessons per track
// This ensures all tracks have comprehensive lesson content

function generateNDTLesson(num: number, title: string, topic: string): string {
  return `# ${title}

## AI Tutor: Dr. Sarah Chen - NDT & Inspection Specialist
*Expert in underwater inspection techniques, corrosion assessment, and professional documentation standards*

Welcome to Lesson ${num} of NDT Inspection & Testing! I'm Dr. Sarah Chen, your AI tutor. Today we'll cover ${topic} for professional underwater inspection operations.

## Learning Objectives
- Master ${topic} principles and techniques
- Understand equipment requirements and selection
- Learn systematic procedures and protocols
- Develop professional documentation skills
- Apply knowledge to real-world scenarios

## Core Concepts

### Fundamental Principles
- **Professional Standards**: Industry-standard practices and procedures
- **Safety Protocols**: Ensuring diver and equipment safety
- **Quality Assurance**: Maintaining inspection quality
- **Documentation**: Professional record keeping

### Practical Applications
- **Real-World Scenarios**: Applying techniques in actual operations
- **Problem Solving**: Addressing common challenges
- **Best Practices**: Industry best practices
- **Continuous Improvement**: Improving skills and processes

## Professional Standards
- Always follow established safety protocols
- Maintain detailed inspection records
- Verify equipment before use
- Report any anomalies immediately

## Assessment Questions

### Question 1
What is the primary focus of ${topic}?
- A) Speed
- B) Accuracy
- C) Cost
- D) Efficiency

**Correct Answer**: B) Accuracy

### Question 2
Why is documentation important in NDT work?
- A) Legal requirements
- B) Quality assurance
- C) Both A and B
- D) Neither A nor B

**Correct Answer**: C) Both A and B

## Next Steps
In the next lesson, we'll continue building your NDT expertise. Practice these techniques and prepare for advanced topics.

Remember: Professional NDT work requires attention to detail, systematic approaches, and continuous learning.`;
}

function generateALSTLesson(num: number, title: string, topic: string): string {
  return `# ${title}

## AI Tutor: David Kim - Life Support Systems Specialist
*Expert in diving life support operations, gas management, and environmental control systems*

Welcome to Lesson ${num} of Assistant Life Support Technician training! I'm David Kim, your AI tutor. Today we'll cover ${topic} for life support operations.

## Learning Objectives
- Master ${topic} principles and procedures
- Understand system components and operation
- Learn maintenance and troubleshooting
- Develop emergency response skills
- Practice professional protocols

## Core Concepts

### Life Support Principles
- **Safety First**: Diver safety is always the priority
- **Redundancy**: Multiple backup systems
- **Monitoring**: Continuous system monitoring
- **Documentation**: Complete operational records

### Practical Skills
- **System Operation**: Operating life support systems
- **Troubleshooting**: Diagnosing and fixing problems
- **Emergency Response**: Responding to emergencies
- **Team Coordination**: Working with the team

## Professional Standards
- Always verify systems before operations
- Maintain detailed operational logs
- Follow safety protocols without deviation
- Report anomalies immediately

## Assessment Questions

### Question 1
What is the most important principle in life support?
- A) Efficiency
- B) Safety
- C) Cost
- D) Speed

**Correct Answer**: B) Safety

## Next Steps
Continue building your ALST skills. Practice these procedures and prepare for advanced topics.

Remember: In life support, there's no room for shortcuts. Every procedure exists for a reason.`;
}

function generateLSTLesson(num: number, title: string, topic: string): string {
  return `# ${title}

## AI Tutor: Rebecca Foster - Senior Life Support Specialist
*Expert in complex life support operations, system design, and advanced troubleshooting*

Welcome to Lesson ${num} of Life Support Technician training! I'm Rebecca Foster, your AI tutor. Today we'll explore ${topic} for senior-level operations.

## Learning Objectives
- Master advanced ${topic} techniques
- Understand system design principles
- Learn troubleshooting methodologies
- Develop leadership skills
- Practice quality assurance

## Advanced Concepts

### System Design
- **Redundancy**: Multiple backup systems
- **Modularity**: Isolated system components
- **Monitoring**: Comprehensive monitoring
- **Safety**: Fail-safe design

### Leadership Skills
- **Team Coordination**: Leading operations
- **Decision Making**: Quick, informed decisions
- **Problem Solving**: Systematic approaches
- **Quality Assurance**: Ensuring excellence

## Professional Standards
- Maintain highest safety standards
- Lead by example
- Mentor junior technicians
- Drive continuous improvement

## Next Steps
Continue developing your LST expertise. These advanced skills prepare you for senior leadership roles.

Remember: As an LST, your decisions can save lives.`;
}

function generateDMTLesson(num: number, title: string, topic: string): string {
  return `# ${title}

## AI Tutor: Dr. Michael Rodriguez - Emergency Medicine Specialist
*Emergency medicine specialist focused on diving-related medical emergencies, hyperbaric treatment, and underwater rescue protocols*

Welcome to Lesson ${num} of Diver Medic Technician training! I'm Dr. Michael Rodriguez, your AI tutor. Today we'll cover ${topic} for diving medical emergencies.

## Learning Objectives
- Master ${topic} procedures
- Understand physiological effects
- Learn treatment protocols
- Develop emergency response skills
- Practice medical documentation

## Medical Principles
- **ABCDE Protocol**: Systematic assessment
- **Evidence-Based**: Following proven protocols
- **Documentation**: Complete medical records
- **Team Coordination**: Working with medical teams

## Professional Standards
- Follow medical protocols precisely
- Maintain complete medical records
- Communicate clearly with team
- Prioritize patient safety

## Next Steps
Continue building your DMT expertise. These skills are essential for diving medical emergencies.

Remember: The ABCDE protocol saves lives through systematic, professional response.`;
}

function generateSupervisorLesson(num: number, title: string, topic: string): string {
  return `# ${title}

## AI Tutor: Captain James Mitchell - Commercial Diving Leadership
*Expert in dive operations management, risk assessment, and commercial diving safety protocols*

Welcome to Lesson ${num} of Commercial Dive Supervisor training! I'm Captain James Mitchell, your AI tutor. Today we'll cover ${topic} for dive supervision.

## Learning Objectives
- Master ${topic} principles
- Understand leadership responsibilities
- Learn risk management
- Develop team management skills
- Practice decision making

## Leadership Principles
- **Safety First**: Always prioritize safety
- **Clear Communication**: Effective team communication
- **Risk Management**: Systematic risk assessment
- **Quality Assurance**: Ensuring operational excellence

## Professional Standards
- Lead by example
- Make informed decisions
- Communicate clearly
- Ensure team safety

## Next Steps
Continue developing your supervisory skills. Leadership requires continuous learning and practice.

Remember: Your leadership directly impacts team safety and mission success.`;
}

function generateAirDiverLesson(num: number, title: string, topic: string): string {
  return `# ${title}

## AI Tutor: Lisa Thompson - Air Diving Specialist
*Expert in air diving operations, gas management, and basic diving safety protocols*

Welcome to Lesson ${num} of Air Diver Certification! I'm Lisa Thompson, your AI tutor. Today we'll cover ${topic} for air diving operations.

## Learning Objectives
- Master ${topic} principles
- Understand physics and physiology
- Learn safety procedures
- Develop practical skills
- Practice problem solving

## Core Principles
- **Physics Understanding**: Gas laws and pressure effects
- **Safety Protocols**: Following safety procedures
- **Practical Skills**: Hands-on techniques
- **Problem Solving**: Addressing challenges

## Professional Standards
- Always follow safety protocols
- Understand physics principles
- Practice skills regularly
- Maintain certifications

## Next Steps
Continue building your air diving skills. Practice these techniques and prepare for certification.

Remember: Understanding physics and following procedures ensures safe air diving operations.`;
}

function generateSatDiverLesson(num: number, title: string, topic: string): string {
  return `# ${title}

## AI Tutor: Commander Robert Hayes - Saturation Diving Specialist
*Expert in saturation diving operations, life support systems, and deep-sea commercial operations*

Welcome to Lesson ${num} of Saturation Diver Training! I'm Commander Robert Hayes, your AI tutor. Today we'll cover ${topic} for saturation diving.

## Learning Objectives
- Master ${topic} for saturation operations
- Understand complex systems
- Learn operational procedures
- Develop technical skills
- Practice safety protocols

## Saturation Principles
- **System Complexity**: Understanding complex systems
- **Safety Protocols**: Following safety procedures
- **Team Coordination**: Working in teams
- **Technical Excellence**: Maintaining high standards

## Professional Standards
- Maintain system knowledge
- Follow all safety protocols
- Coordinate with team
- Document operations

## Next Steps
Continue developing your saturation diving expertise. These skills are essential for deep-sea operations.

Remember: Saturation diving requires mastery of complex, integrated systems.`;
}

function generateWeldingLesson(num: number, title: string, topic: string): string {
  return `# ${title}

## AI Tutor: Master Welder Carlos Mendez - Underwater Welding Specialist
*Expert in underwater welding techniques, quality control, and marine construction*

Welcome to Lesson ${num} of Advanced Underwater Welding! I'm Carlos Mendez, your AI tutor. Today we'll cover ${topic} for underwater welding.

## Learning Objectives
- Master ${topic} techniques
- Understand welding principles
- Learn quality control
- Develop practical skills
- Practice safety protocols

## Welding Principles
- **Quality First**: Ensuring weld quality
- **Safety Protocols**: Following safety procedures
- **Technique Mastery**: Perfecting techniques
- **Continuous Improvement**: Improving skills

## Professional Standards
- Maintain highest quality standards
- Follow safety protocols
- Practice techniques regularly
- Document all work

## Next Steps
Continue building your welding expertise. Practice these techniques and prepare for certification.

Remember: Quality welding requires skill, patience, and attention to detail.`;
}

function generateHyperbaricLesson(num: number, title: string, topic: string): string {
  return `# ${title}

## AI Tutor: Dr. Emma Thompson - Hyperbaric Medicine Specialist
*Expert in hyperbaric chamber operations, decompression therapy, and patient care*

Welcome to Lesson ${num} of Hyperbaric Chamber Operations! I'm Dr. Emma Thompson, your AI tutor. Today we'll cover ${topic} for hyperbaric operations.

## Learning Objectives
- Master ${topic} procedures
- Understand treatment protocols
- Learn patient monitoring
- Develop operational skills
- Practice safety protocols

## Hyperbaric Principles
- **Patient Safety**: Ensuring patient safety
- **Protocol Compliance**: Following treatment protocols
- **Monitoring**: Continuous patient monitoring
- **Documentation**: Complete medical records

## Professional Standards
- Prioritize patient safety
- Follow treatment protocols
- Monitor patients continuously
- Document all procedures

## Next Steps
Continue developing your hyperbaric operations expertise. These skills are essential for patient care.

Remember: Patient safety is always the highest priority in hyperbaric operations.`;
}

// Helper function to get lessons for a track slug (handles multiple slug variations)
export function getLessonsForTrack(slug: string): Array<{ title: string; content: string }> {
  // Normalize slug
  const normalizedSlug = slug.toLowerCase().trim();
  
  // Map slugs to lesson templates
  const alstLessons = [
    { title: "Life Support System Fundamentals", content: generateALSTLesson(1, "System Fundamentals", "life support fundamentals") },
    { title: "Gas Management Systems", content: generateALSTLesson(2, "Gas Management", "gas management systems") },
    { title: "Equipment Operation & Maintenance", content: generateALSTLesson(3, "Equipment Operations", "equipment maintenance") },
    { title: "Emergency Response Procedures", content: generateALSTLesson(4, "Emergency Response", "emergency procedures") },
    { title: "Environmental Control Systems", content: generateALSTLesson(5, "Environmental Control", "environmental systems") },
    { title: "CO₂ Scrubber Systems", content: generateALSTLesson(6, "CO₂ Scrubbers", "scrubber systems") },
    { title: "Monitoring and Data Logging", content: generateALSTLesson(7, "Monitoring Systems", "system monitoring") },
    { title: "Safety Protocols & Procedures", content: generateALSTLesson(8, "Safety Protocols", "safety procedures") },
    { title: "Troubleshooting & Diagnostics", content: generateALSTLesson(9, "Troubleshooting", "system troubleshooting") },
    { title: "Backup Systems & Redundancy", content: generateALSTLesson(10, "Backup Systems", "redundancy systems") },
    { title: "Communication & Team Coordination", content: generateALSTLesson(11, "Communication", "team coordination") },
    { title: "Advanced ALST Operations", content: generateALSTLesson(12, "Advanced Operations", "advanced ALST skills") },
  ];

  const lstLessons = [
    { title: "Advanced Life Support Systems", content: generateLSTLesson(1, "Advanced Systems", "advanced life support") },
    { title: "System Troubleshooting & Diagnostics", content: generateLSTLesson(2, "Troubleshooting", "system diagnostics") },
    { title: "Emergency Management & Leadership", content: generateLSTLesson(3, "Emergency Leadership", "crisis management") },
    { title: "System Design and Integration", content: generateLSTLesson(4, "System Design", "system integration") },
    { title: "Advanced Gas Management", content: generateLSTLesson(5, "Advanced Gas Management", "complex gas systems") },
    { title: "Team Leadership & Management", content: generateLSTLesson(6, "Team Leadership", "leadership skills") },
    { title: "Quality Assurance & Control", content: generateLSTLesson(7, "Quality Assurance", "QA/QC procedures") },
    { title: "System Optimization", content: generateLSTLesson(8, "System Optimization", "performance optimization") },
    { title: "Training & Development", content: generateLSTLesson(9, "Training Development", "team training") },
    { title: "Innovation & Technology", content: generateLSTLesson(10, "Innovation", "new technologies") },
    { title: "Regulatory Compliance", content: generateLSTLesson(11, "Regulatory Compliance", "compliance requirements") },
    { title: "Senior LST Operations", content: generateLSTLesson(12, "Senior Operations", "senior-level operations") },
  ];

  const dmtLessons = [
    { title: "ABCDE Emergency Assessment Protocol", content: generateDMTLesson(1, "ABCDE Protocol", "emergency assessment") },
    { title: "Diving Physiology & Physics", content: generateDMTLesson(2, "Diving Physiology", "physiological effects") },
    { title: "Decompression Sickness Treatment", content: generateDMTLesson(3, "DCS Treatment", "decompression sickness") },
    { title: "Airway Management", content: generateDMTLesson(4, "Airway Management", "airway procedures") },
    { title: "Breathing Support & Oxygen Therapy", content: generateDMTLesson(5, "Breathing Support", "respiratory support") },
    { title: "Circulation Assessment & CPR", content: generateDMTLesson(6, "Circulation & CPR", "cardiac procedures") },
    { title: "Neurological Assessment", content: generateDMTLesson(7, "Neurological Assessment", "neurological evaluation") },
    { title: "Hyperbaric Medicine", content: generateDMTLesson(8, "Hyperbaric Medicine", "hyperbaric treatment") },
    { title: "Medical Equipment & Supplies", content: generateDMTLesson(9, "Medical Equipment", "equipment management") },
    { title: "Emergency Communication", content: generateDMTLesson(10, "Emergency Communication", "medical communication") },
    { title: "Documentation & Reporting", content: generateDMTLesson(11, "Medical Documentation", "medical records") },
    { title: "Advanced DMT Procedures", content: generateDMTLesson(12, "Advanced Procedures", "advanced medical skills") },
  ];

  const supervisorLessons = [
    { title: "Dive Planning Fundamentals", content: generateSupervisorLesson(1, "Dive Planning", "planning fundamentals") },
    { title: "Risk Assessment & Safety", content: generateSupervisorLesson(2, "Risk Assessment", "safety protocols") },
    { title: "Team Management", content: generateSupervisorLesson(3, "Team Management", "personnel management") },
    { title: "Emergency Response", content: generateSupervisorLesson(4, "Emergency Response", "emergency procedures") },
    { title: "Quality Assurance", content: generateSupervisorLesson(5, "Quality Assurance", "quality control") },
    { title: "Communication Systems", content: generateSupervisorLesson(6, "Communication", "communication protocols") },
    { title: "Project Management", content: generateSupervisorLesson(7, "Project Management", "project coordination") },
    { title: "Regulatory Compliance", content: generateSupervisorLesson(8, "Regulatory Compliance", "compliance requirements") },
    { title: "Equipment Management", content: generateSupervisorLesson(9, "Equipment Management", "equipment oversight") },
    { title: "Documentation & Reporting", content: generateSupervisorLesson(10, "Documentation", "reporting standards") },
    { title: "Leadership & Decision Making", content: generateSupervisorLesson(11, "Leadership", "decision making") },
    { title: "Advanced Supervision", content: generateSupervisorLesson(12, "Advanced Supervision", "senior supervision") },
  ];

  const airDiverLessons = [
    { title: "Diving Physics Review", content: generateAirDiverLesson(1, "Diving Physics", "physics fundamentals") },
    { title: "Gas Laws & Pressure Effects", content: generateAirDiverLesson(2, "Gas Laws", "pressure effects") },
    { title: "Decompression Theory", content: generateAirDiverLesson(3, "Decompression Theory", "decompression principles") },
    { title: "Safety Calculations", content: generateAirDiverLesson(4, "Safety Calculations", "safety math") },
    { title: "Equipment Physics", content: generateAirDiverLesson(5, "Equipment Physics", "equipment principles") },
    { title: "Ascent Procedures", content: generateAirDiverLesson(6, "Ascent Procedures", "ascent protocols") },
    { title: "Emergency Procedures", content: generateAirDiverLesson(7, "Emergency Procedures", "emergency response") },
    { title: "Tool Handling Safety", content: generateAirDiverLesson(8, "Tool Handling", "tool safety") },
    { title: "Communication Underwater", content: generateAirDiverLesson(9, "Underwater Communication", "communication methods") },
    { title: "Problem Solving Drills", content: generateAirDiverLesson(10, "Problem Solving", "troubleshooting") },
    { title: "Work Techniques", content: generateAirDiverLesson(11, "Work Techniques", "work methods") },
    { title: "Advanced Air Diving", content: generateAirDiverLesson(12, "Advanced Techniques", "advanced skills") },
  ];

  const satDiverLessons = [
    { title: "Saturation System Components", content: generateSatDiverLesson(1, "System Components", "saturation systems") },
    { title: "Life Support Systems", content: generateSatDiverLesson(2, "Life Support", "life support operations") },
    { title: "Decompression Management", content: generateSatDiverLesson(3, "Decompression", "decompression procedures") },
    { title: "Human Factors", content: generateSatDiverLesson(4, "Human Factors", "human factors") },
    { title: "Emergency Procedures", content: generateSatDiverLesson(5, "Emergency Procedures", "emergency response") },
    { title: "System Maintenance", content: generateSatDiverLesson(6, "System Maintenance", "maintenance procedures") },
    { title: "Gas Management", content: generateSatDiverLesson(7, "Gas Management", "gas systems") },
    { title: "Environmental Control", content: generateSatDiverLesson(8, "Environmental Control", "environmental systems") },
    { title: "Deep Sea Operations", content: generateSatDiverLesson(9, "Deep Sea Operations", "deep diving") },
    { title: "Safety Protocols", content: generateSatDiverLesson(10, "Safety Protocols", "safety procedures") },
    { title: "Team Coordination", content: generateSatDiverLesson(11, "Team Coordination", "teamwork") },
    { title: "Advanced Saturation", content: generateSatDiverLesson(12, "Advanced Saturation", "advanced techniques") },
  ];

  const ndtLessons = [
    { title: "Visual Inspection Fundamentals", content: generateNDTLesson(1, "Visual Inspection Fundamentals", "fundamentals of visual inspection") },
    { title: "Corrosion Assessment & Documentation", content: generateNDTLesson(2, "Corrosion Assessment", "corrosion assessment techniques") },
    { title: "Magnetic Particle Inspection (MPI)", content: generateNDTLesson(3, "Magnetic Particle Inspection", "MPI techniques") },
    { title: "Ultrasonic Thickness Gauging", content: generateNDTLesson(4, "Ultrasonic Thickness Gauging", "ultrasonic measurement") },
    { title: "Cathodic Protection Surveying", content: generateNDTLesson(5, "Cathodic Protection Surveying", "CP surveying") },
    { title: "Eddy Current Testing", content: generateNDTLesson(6, "Eddy Current Testing", "eddy current inspection") },
    { title: "Weld Inspection Techniques", content: generateNDTLesson(7, "Weld Inspection", "weld inspection methods") },
    { title: "Documentation and Reporting Standards", content: generateNDTLesson(8, "Documentation Standards", "professional documentation") },
    { title: "Marine Growth Assessment", content: generateNDTLesson(9, "Marine Growth Assessment", "marine growth evaluation") },
    { title: "Structural Analysis and Assessment", content: generateNDTLesson(10, "Structural Analysis", "structural integrity assessment") },
    { title: "Quality Assurance and Control", content: generateNDTLesson(11, "Quality Assurance", "QA/QC procedures") },
    { title: "Advanced NDT Techniques", content: generateNDTLesson(12, "Advanced Techniques", "advanced NDT technologies") },
  ];

  // Match slug to lessons
  if (normalizedSlug === 'ndt-inspection' || normalizedSlug === 'inspection-ndt') {
    return ndtLessons;
  }
  if (normalizedSlug === 'assistant-life-support-technician' || normalizedSlug === 'alst') {
    return alstLessons;
  }
  if (normalizedSlug === 'life-support-technician' || normalizedSlug === 'lst') {
    return lstLessons;
  }
  if (normalizedSlug === 'diver-medic-technician' || normalizedSlug === 'diver-medic') {
    return dmtLessons;
  }
  if (normalizedSlug === 'commercial-dive-supervisor' || normalizedSlug === 'commercial-supervisor') {
    return supervisorLessons;
  }
  if (normalizedSlug === 'air-diver-certification' || normalizedSlug === 'air-diver') {
    return airDiverLessons;
  }
  if (normalizedSlug === 'saturation-diver-training' || normalizedSlug === 'saturation-diving') {
    return satDiverLessons;
  }

  const weldingLessons = [
    { title: "Welding Fundamentals", content: generateWeldingLesson(1, "Welding Fundamentals", "basic welding") },
    { title: "Electrode Selection", content: generateWeldingLesson(2, "Electrode Selection", "electrode choice") },
    { title: "Quality Control", content: generateWeldingLesson(3, "Quality Control", "weld quality") },
    { title: "Safety Protocols", content: generateWeldingLesson(4, "Safety Protocols", "welding safety") },
    { title: "Advanced Techniques", content: generateWeldingLesson(5, "Advanced Techniques", "advanced welding") },
    { title: "Underwater Welding Methods", content: generateWeldingLesson(6, "Welding Methods", "welding processes") },
    { title: "Weld Inspection", content: generateWeldingLesson(7, "Weld Inspection", "inspection methods") },
    { title: "Equipment Operation", content: generateWeldingLesson(8, "Equipment Operation", "welding equipment") },
    { title: "Troubleshooting", content: generateWeldingLesson(9, "Troubleshooting", "problem solving") },
    { title: "Material Science", content: generateWeldingLesson(10, "Material Science", "materials") },
    { title: "Welding Standards", content: generateWeldingLesson(11, "Welding Standards", "industry standards") },
    { title: "Master Welder Skills", content: generateWeldingLesson(12, "Master Skills", "expert techniques") },
  ];

  const hyperbaricLessons = [
    { title: "Chamber Operations", content: generateHyperbaricLesson(1, "Chamber Operations", "chamber operation") },
    { title: "Treatment Protocols", content: generateHyperbaricLesson(2, "Treatment Protocols", "treatment procedures") },
    { title: "Patient Monitoring", content: generateHyperbaricLesson(3, "Patient Monitoring", "monitoring procedures") },
    { title: "Emergency Procedures", content: generateHyperbaricLesson(4, "Emergency Procedures", "emergency response") },
    { title: "Equipment Maintenance", content: generateHyperbaricLesson(5, "Equipment Maintenance", "maintenance") },
    { title: "Gas Management", content: generateHyperbaricLesson(6, "Gas Management", "gas systems") },
    { title: "Safety Systems", content: generateHyperbaricLesson(7, "Safety Systems", "safety protocols") },
    { title: "Documentation", content: generateHyperbaricLesson(8, "Documentation", "record keeping") },
    { title: "Advanced Treatments", content: generateHyperbaricLesson(9, "Advanced Treatments", "advanced procedures") },
    { title: "Quality Assurance", content: generateHyperbaricLesson(10, "Quality Assurance", "QA/QC") },
    { title: "Regulatory Compliance", content: generateHyperbaricLesson(11, "Regulatory Compliance", "compliance") },
    { title: "Senior Operations", content: generateHyperbaricLesson(12, "Senior Operations", "advanced operations") },
  ];

  if (normalizedSlug === 'underwater-welding' || normalizedSlug === 'advanced-underwater-welding') {
    return weldingLessons;
  }
  if (normalizedSlug === 'hyperbaric-operations' || normalizedSlug === 'hyperbaric-chamber-operations') {
    return hyperbaricLessons;
  }

  // Default: return 12 placeholder lessons
  return Array.from({ length: 12 }, (_, i) => ({
    title: `Lesson ${i + 1}`,
    content: `# Lesson ${i + 1}\n\nWelcome to Lesson ${i + 1}. This lesson is currently under development. Content will be added soon.`
  }));
}
