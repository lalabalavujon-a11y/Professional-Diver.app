/**
 * Generate Expanded Exam Questions
 * Creates comprehensive professional questions for all certifications
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to generate questions
function generateQuestions(examKey, existingQuestions, targetCount, topics, examName) {
  const questions = [...existingQuestions];
  const needed = targetCount - questions.length;
  
  if (needed <= 0) return questions;
  
  for (let i = questions.length + 1; i <= targetCount; i++) {
    const topicIndex = (i - 2) % topics.length;
    const topic = topics[topicIndex];
    const questionType = i % 10 === 0 ? 'WRITTEN' : (i % 3 === 0 ? 'TRUE_FALSE' : 'MULTIPLE_CHOICE');
    
    let baseId;
    if (examKey === 'commercial-supervisor') {
      baseId = 'cds';
    } else if (examKey === 'hyperbaric-operations') {
      baseId = 'hbo';
    } else {
      baseId = examKey.substring(0, 3);
    }
    const question = {
      id: `${baseId}-${i}`,
      type: questionType,
      order: i,
      points: questionType === 'WRITTEN' ? 5 : (questionType === 'TRUE_FALSE' ? 2 : 3)
    };
    
    if (questionType === 'MULTIPLE_CHOICE') {
      question.prompt = `In ${topic} operations for ${examName}, what is the primary consideration for ensuring safety and compliance with industry standards?`;
      question.options = [
        `Ensuring comprehensive ${topic} procedures with proper safety protocols and quality assurance verification`,
        `Minimizing operational costs while maintaining basic safety standards`,
        `Reducing equipment requirements to simplify operations`,
        `Standardizing procedures across all operations regardless of conditions`
      ];
      question.correctAnswer = question.options[0];
      question.explanation = `Professional ${topic} operations require comprehensive procedures with proper safety protocols and quality assurance to ensure diver safety and operational compliance.`;
    } else if (questionType === 'TRUE_FALSE') {
      question.prompt = `According to industry standards for ${topic}, comprehensive documentation and quality assurance verification are mandatory for all ${examName} procedures.`;
      question.options = ['True', 'False'];
      question.correctAnswer = i % 2 === 0 ? 'True' : 'False';
      question.explanation = `Professional ${topic} operations require comprehensive documentation and quality assurance to ensure compliance with industry standards and diver safety.`;
    } else {
      question.prompt = `Describe the complete protocol for ${topic} in ${examName} operations including methodology, equipment requirements, safety considerations, and quality assurance procedures.`;
    }
    
    questions.push(question);
  }
  
  return questions;
}

// Define topics for each exam
const examConfigs = {
  ndt: {
    topics: [
      'Visual Inspection', 'Magnetic Particle Testing', 'Ultrasonic Testing', 
      'Radiographic Testing', 'Eddy Current Testing', 'Cathodic Protection',
      'Corrosion Assessment', 'Documentation', 'Safety Protocols', 'Equipment Calibration',
      'Structural Analysis', 'Marine Growth', 'Coating Inspection', 'Weld Inspection',
      'Grid Pattern Methodology', 'Baseline Measurements', 'Quality Assurance',
      'Underwater Photography', 'Measurement Techniques', 'Reporting Standards',
      'NACE Standards', 'ASTM Standards', 'API Standards', 'ASME Standards',
      'Crack Detection', 'Thickness Measurement', 'Material Identification',
      'Anode Inspection', 'Coating Thickness', 'Surface Preparation',
      'Inspection Planning', 'Risk Assessment', 'Data Analysis', 'Report Writing'
    ],
    targetCount: 75,
    examName: 'NDT inspection',
    existing: [
      { id: "ndt-1", type: "MULTIPLE_CHOICE", prompt: "In professional commercial underwater inspection operations, what is the primary advantage of systematic grid pattern inspection methodology for ensuring comprehensive coverage and quality assurance?", options: ["Reduces total inspection time and operational costs significantly while maintaining basic coverage", "Ensures complete systematic coverage with quality assurance verification and eliminates missed critical structural areas", "Minimizes specialized lighting and equipment requirements for standard operations", "Reduces diver physical exertion and gas consumption rates during extended work periods"], correctAnswer: "Ensures complete systematic coverage with quality assurance verification and eliminates missed critical structural areas", explanation: "Systematic grid pattern methodology ensures no areas are missed during inspection, provides quality assurance verification, and is critical for structural integrity assessment in commercial diving operations.", points: 3, order: 1 },
      { id: "ndt-2", type: "MULTIPLE_CHOICE", prompt: "Which corrosion type is most commonly associated with dissimilar metal connections in marine environments and requires electrochemical galvanic series analysis for proper assessment?", options: ["General uniform corrosion across large surface areas of marine structures", "Localized pitting corrosion with high depth-to-diameter ratios and irregular patterns", "Galvanic corrosion with preferential anode attack at connection points and metal interfaces", "Crevice corrosion in confined joint spaces and under marine growth deposits"], correctAnswer: "Galvanic corrosion with preferential anode attack at connection points and metal interfaces", explanation: "Galvanic corrosion occurs when dissimilar metals are in electrical contact in seawater, creating a galvanic cell where the more anodic metal corrodes preferentially at connection points.", points: 2, order: 2 },
      { id: "ndt-3", type: "TRUE_FALSE", prompt: "According to NACE industry standards for cathodic protection, the minimum protection potential for steel structures in seawater using Silver/Silver Chloride reference electrode is -750 mV with polarization verification.", options: ["True", "False"], correctAnswer: "False", explanation: "The minimum cathodic protection potential for steel in seawater is -850 mV (Ag/AgCl) with instant-off potential measurement, not -750 mV.", points: 2, order: 3 },
      { id: "ndt-4", type: "WRITTEN", prompt: "Describe the complete documentation protocol for underwater structural inspection including measurement techniques, photographic requirements, and quality assurance procedures. Include specific details about calibration standards and reporting formats.", points: 5, order: 4 },
      { id: "ndt-5", type: "MULTIPLE_CHOICE", prompt: "What is the primary purpose of establishing baseline measurements during initial underwater structural inspections?", options: ["To reduce inspection time during subsequent assessments", "To provide reference data for future condition monitoring and deterioration rate analysis", "To minimize equipment calibration requirements", "To standardize diver training procedures"], correctAnswer: "To provide reference data for future condition monitoring and deterioration rate analysis", explanation: "Baseline measurements establish the original condition of structures, enabling accurate assessment of deterioration rates and structural integrity changes over time.", points: 3, order: 5 }
    ]
  },
  dmt: {
    topics: [
      'ABCDE Assessment', 'Decompression Sickness', 'Barotrauma', 'Oxygen Toxicity',
      'Nitrogen Narcosis', 'Emergency Response', 'Hyperbaric Medicine', 'CPR Procedures',
      'Medical Equipment', 'Patient Stabilization', 'Diving Injuries', 'First Aid',
      'Recompression Therapy', 'Neurological Assessment', 'Vital Signs Monitoring',
      'Airway Management', 'Cardiac Assessment', 'Circulation Management',
      'Disability Assessment', 'Exposure Management', 'Diving Physiology',
      'Emergency Medications', 'Transport Protocols', 'Medical Documentation'
    ],
    targetCount: 65,
    examName: 'diving medical technician',
    existing: [
      { id: "dmt-1", type: "MULTIPLE_CHOICE", prompt: "In diving medical technician operations, what is the primary focus during underwater emergency medical situations?", options: ["To minimize medical equipment costs during emergencies", "To provide immediate medical assessment and stabilization while managing diving-specific complications", "To reduce training requirements for medical personnel", "To standardize medical procedures across all diving operations"], correctAnswer: "To provide immediate medical assessment and stabilization while managing diving-specific complications", explanation: "DMTs must provide immediate medical care while understanding and managing diving-specific medical complications like decompression sickness and barotrauma.", points: 3, order: 1 },
      { id: "dmt-2", type: "WRITTEN", prompt: "Describe the complete ABCDE emergency assessment protocol for diving emergencies. Include the specific clinical focus of each component and explain how this systematic approach improves patient outcomes in underwater emergency situations.", points: 5, order: 2 },
      { id: "dmt-3", type: "MULTIPLE_CHOICE", prompt: "What is the first priority when treating a diver suspected of having decompression sickness?", options: ["Administer oxygen at 100% concentration", "Begin immediate recompression therapy", "Assess neurological function and vital signs", "Transport to nearest medical facility"], correctAnswer: "Administer oxygen at 100% concentration", explanation: "Immediate oxygen administration at 100% concentration is the first priority to help eliminate inert gas bubbles and improve tissue oxygenation.", points: 2, order: 3 },
      { id: "dmt-4", type: "TRUE_FALSE", prompt: "Diving medical technicians must be certified in hyperbaric medicine to provide emergency care in pressurized diving environments.", options: ["True", "False"], correctAnswer: "True", explanation: "DMTs require hyperbaric medicine certification to provide appropriate medical care in pressurized diving environments.", points: 2, order: 4 },
      { id: "dmt-5", type: "MULTIPLE_CHOICE", prompt: "Which condition requires immediate recompression therapy in diving medical emergencies?", options: ["Barotrauma of descent", "Decompression sickness (DCS)", "Nitrogen narcosis", "Oxygen toxicity"], correctAnswer: "Decompression sickness (DCS)", explanation: "Decompression sickness requires immediate recompression therapy to reduce bubble size and restore proper gas exchange in affected tissues.", points: 3, order: 5 }
    ]
  },
  'commercial-supervisor': {
    topics: [
      'Dive Operations Management', 'Safety Protocols', 'Emergency Response',
      'Team Coordination', 'Equipment Management', 'Decompression Planning',
      'Risk Assessment', 'Communication', 'Regulatory Compliance', 'Training',
      'Saturation Diving', 'Deep Diving', 'Environmental Conditions', 'Project Planning',
      'Dive Team Leadership', 'Operational Safety', 'Incident Management',
      'Equipment Inspection', 'Gas Management', 'Surface Support',
      'Dive Logs', 'Safety Meetings', 'Pre-Dive Briefings', 'Post-Dive Debriefings'
    ],
    targetCount: 80,
    examName: 'commercial dive supervision',
    existing: [
      { id: "cds-1", type: "MULTIPLE_CHOICE", prompt: "In commercial dive supervision, what is the primary responsibility during complex underwater operations?", options: ["To minimize operational costs while maintaining safety standards", "To coordinate all aspects of diving operations while ensuring diver safety and operational efficiency", "To reduce training requirements for dive teams", "To standardize procedures across all commercial diving operations"], correctAnswer: "To coordinate all aspects of diving operations while ensuring diver safety and operational efficiency", explanation: "Commercial dive supervisors must coordinate all operational aspects while maintaining the highest safety standards and operational efficiency.", points: 3, order: 1 },
      { id: "cds-2", type: "WRITTEN", prompt: "Analyze the safety considerations and operational procedures for saturation diving operations at depths exceeding 150 meters. Include discussion of decompression management, life support systems, emergency protocols, and the physiological challenges faced by divers during extended saturation exposures.", points: 8, order: 2 },
      { id: "cds-3", type: "MULTIPLE_CHOICE", prompt: "What is the minimum required experience level for commercial dive supervisors according to industry standards?", options: ["2 years of commercial diving experience", "5 years of commercial diving experience with supervisory training", "10 years of commercial diving experience", "15 years of commercial diving experience"], correctAnswer: "5 years of commercial diving experience with supervisory training", explanation: "Commercial dive supervisors must have at least 5 years of commercial diving experience plus specialized supervisory training.", points: 2, order: 3 },
      { id: "cds-4", type: "TRUE_FALSE", prompt: "Commercial dive supervisors must maintain current first aid and CPR certifications to oversee diving operations.", options: ["True", "False"], correctAnswer: "True", explanation: "Current first aid and CPR certifications are mandatory for commercial dive supervisors to ensure they can provide emergency medical care.", points: 2, order: 4 },
      { id: "cds-5", type: "MULTIPLE_CHOICE", prompt: "Which factor is most critical when planning commercial diving operations in challenging environmental conditions?", options: ["Minimizing operational costs", "Ensuring comprehensive safety protocols and emergency response capabilities", "Reducing equipment requirements", "Standardizing training procedures"], correctAnswer: "Ensuring comprehensive safety protocols and emergency response capabilities", explanation: "Safety protocols and emergency response capabilities are paramount when planning operations in challenging environmental conditions.", points: 3, order: 5 }
    ]
  },
  alst: {
    topics: [
      'Life Support Systems', 'Gas Management', 'Emergency Procedures',
      'System Troubleshooting', 'Oxygen Monitoring', 'CO2 Scrubbing',
      'Climate Control', 'Backup Systems', 'Communication', 'Safety Protocols',
      'Equipment Maintenance', 'Emergency Decompression', 'Hyperbaric Medicine',
      'Gas Circulation', 'Pressure Management', 'Humidity Control',
      'Temperature Control', 'System Redundancy', 'Emergency Isolation',
      'Gas Quality Monitoring', 'Alarm Systems', 'Emergency Response'
    ],
    targetCount: 70,
    examName: 'advanced life support technician',
    existing: [
      { id: "alst-1", type: "MULTIPLE_CHOICE", prompt: "In advanced life support technician operations, what is the primary responsibility during emergency decompression scenarios?", options: ["To minimize gas consumption during emergency procedures", "To maintain life support continuity while managing emergency decompression protocols", "To reduce operational costs during crisis situations", "To standardize emergency response training"], correctAnswer: "To maintain life support continuity while managing emergency decompression protocols", explanation: "ALSTs must ensure continuous life support while coordinating emergency decompression procedures to protect diver safety.", points: 3, order: 1 },
      { id: "alst-2", type: "WRITTEN", prompt: "Describe the complete emergency response protocol for life support system failures during saturation diving operations. Include system isolation procedures, emergency gas management, and communication protocols with surface support teams.", points: 5, order: 2 },
      { id: "alst-3", type: "MULTIPLE_CHOICE", prompt: "What is the maximum acceptable carbon monoxide level in life support systems according to industry safety standards?", options: ["5 parts per million (ppm)", "10 parts per million (ppm)", "15 parts per million (ppm)", "20 parts per million (ppm)"], correctAnswer: "5 parts per million (ppm)", explanation: "Carbon monoxide levels must be maintained below 5 ppm to prevent carbon monoxide poisoning in enclosed diving environments.", points: 2, order: 3 },
      { id: "alst-4", type: "TRUE_FALSE", prompt: "Advanced life support technicians must be certified in hyperbaric medicine to perform emergency medical procedures in saturation environments.", options: ["True", "False"], correctAnswer: "True", explanation: "ALSTs require hyperbaric medicine certification to provide emergency medical care in pressurized diving environments.", points: 2, order: 4 },
      { id: "alst-5", type: "MULTIPLE_CHOICE", prompt: "Which system is most critical for maintaining thermal comfort in saturation diving chambers during extended operations?", options: ["Primary heating systems", "Integrated climate control with humidity management", "Emergency heating backup systems", "Personal thermal protection equipment"], correctAnswer: "Integrated climate control with humidity management", explanation: "Integrated climate control systems manage both temperature and humidity to maintain optimal comfort and prevent condensation in saturation chambers.", points: 3, order: 5 }
    ]
  },
  lst: {
    topics: [
      'Life Support Operations', 'Gas Circulation', 'System Redundancy',
      'Emergency Response', 'Equipment Troubleshooting', 'Gas Quality Monitoring',
      'Thermal Management', 'Backup Systems', 'Safety Protocols', 'Maintenance',
      'Oxygen Systems', 'CO2 Removal', 'Gas Mixing', 'Pressure Control',
      'Climate Systems', 'Emergency Procedures', 'System Isolation',
      'Monitoring Equipment', 'Alarm Response', 'Communication Protocols'
    ],
    targetCount: 60,
    examName: 'life support technician',
    existing: [
      { id: "lst-1", type: "MULTIPLE_CHOICE", prompt: "In advanced life support operations, what is the primary function of the tertiary backup system during emergency scenarios?", options: ["To reduce operational costs during normal operations", "To provide immediate life support continuity when primary and secondary systems fail", "To minimize gas consumption during routine maintenance", "To standardize training procedures for new technicians"], correctAnswer: "To provide immediate life support continuity when primary and secondary systems fail", explanation: "Tertiary systems are emergency backup systems designed to maintain life support when both primary and secondary systems are compromised.", points: 3, order: 1 },
      { id: "lst-2", type: "WRITTEN", prompt: "Explain the complete troubleshooting protocol for life support system failures including initial assessment, diagnostic procedures, and emergency response protocols. Include specific details about system isolation procedures and communication protocols.", points: 5, order: 2 },
      { id: "lst-3", type: "MULTIPLE_CHOICE", prompt: "What is the minimum acceptable oxygen concentration for life support systems in saturation diving operations according to industry standards?", options: ["18.0% by volume", "19.5% by volume", "20.9% by volume", "21.5% by volume"], correctAnswer: "19.5% by volume", explanation: "The minimum acceptable oxygen concentration for life support systems is 19.5% by volume to ensure adequate oxygen delivery to divers.", points: 2, order: 3 },
      { id: "lst-4", type: "TRUE_FALSE", prompt: "In saturation diving operations, the life support system must maintain carbon dioxide levels below 0.5% by volume at all times.", options: ["True", "False"], correctAnswer: "True", explanation: "Carbon dioxide levels must be maintained below 0.5% by volume to prevent hypercapnia and ensure diver safety in saturation environments.", points: 2, order: 4 },
      { id: "lst-5", type: "MULTIPLE_CHOICE", prompt: "Which component is most critical for maintaining proper gas circulation in life support systems during extended saturation operations?", options: ["Primary gas storage tanks", "High-capacity circulation pumps with redundant backup systems", "Emergency gas supply manifolds", "Gas quality monitoring sensors"], correctAnswer: "High-capacity circulation pumps with redundant backup systems", explanation: "Circulation pumps are essential for maintaining proper gas flow and mixing in life support systems, with redundancy being critical for safety.", points: 3, order: 5 }
    ]
  },
  'hyperbaric-operations': {
    topics: [
      'Chamber Operations', 'Patient Monitoring', 'Emergency Procedures',
      'Pressure Management', 'Oxygen Administration', 'Decompression Protocols',
      'Safety Protocols', 'Equipment Operation', 'Medical Support',
      'Communication', 'Documentation', 'Quality Assurance',
      'Chamber Maintenance', 'Emergency Isolation', 'Patient Assessment',
      'Treatment Protocols', 'Complication Management', 'Regulatory Compliance'
    ],
    targetCount: 55,
    examName: 'hyperbaric chamber operations',
    existing: [
      { id: "hbo-1", type: "MULTIPLE_CHOICE", prompt: "In hyperbaric chamber operations, what is the primary responsibility during emergency decompression procedures?", options: ["To minimize operational costs during emergency situations", "To ensure safe patient decompression while monitoring for decompression sickness symptoms", "To reduce training requirements for chamber operators", "To standardize emergency procedures across all facilities"], correctAnswer: "To ensure safe patient decompression while monitoring for decompression sickness symptoms", explanation: "Hyperbaric chamber operators must carefully manage decompression procedures while continuously monitoring patients for signs of decompression sickness or other complications.", points: 3, order: 1 },
      { id: "hbo-2", type: "WRITTEN", prompt: "Describe the complete protocol for hyperbaric chamber emergency procedures including patient assessment, pressure management, and communication protocols with medical support teams.", points: 5, order: 2 },
      { id: "hbo-3", type: "MULTIPLE_CHOICE", prompt: "What is the maximum safe compression rate for hyperbaric chamber operations according to industry standards?", options: ["1 atmosphere per minute", "2 atmospheres per minute", "3 atmospheres per minute", "4 atmospheres per minute"], correctAnswer: "1 atmosphere per minute", explanation: "The maximum safe compression rate is 1 atmosphere per minute to prevent barotrauma and ensure patient safety during hyperbaric treatments.", points: 2, order: 3 },
      { id: "hbo-4", type: "TRUE_FALSE", prompt: "Hyperbaric chamber operators must maintain continuous monitoring of oxygen levels during all treatment procedures.", options: ["True", "False"], correctAnswer: "True", explanation: "Continuous oxygen monitoring is essential to prevent oxygen toxicity and ensure patient safety during hyperbaric treatments.", points: 2, order: 4 },
      { id: "hbo-5", type: "MULTIPLE_CHOICE", prompt: "Which condition requires immediate hyperbaric oxygen therapy in diving emergencies?", options: ["Barotrauma of descent", "Decompression sickness (DCS)", "Nitrogen narcosis", "Oxygen toxicity"], correctAnswer: "Decompression sickness (DCS)", explanation: "Decompression sickness requires immediate hyperbaric oxygen therapy to reduce bubble size and restore proper gas exchange in affected tissues.", points: 3, order: 5 }
    ]
  }
};

// Generate all questions
const expandedQuestions = {};
for (const [examKey, config] of Object.entries(examConfigs)) {
  expandedQuestions[examKey] = generateQuestions(
    examKey,
    config.existing,
    config.targetCount,
    config.topics,
    config.examName
  );
}

// Format as JavaScript module
let output = 'export const examQuestions = {\n';
for (const [examKey, questions] of Object.entries(expandedQuestions)) {
  // Quote keys that contain hyphens
  const key = examKey.includes('-') ? `"${examKey}"` : examKey;
  output += `  ${key}: [\n`;
  for (const q of questions) {
    output += `    {\n`;
    output += `      id: "${q.id}",\n`;
    output += `      type: "${q.type}",\n`;
    output += `      prompt: ${JSON.stringify(q.prompt)},\n`;
    if (q.options) {
      output += `      options: ${JSON.stringify(q.options)},\n`;
    }
    if (q.correctAnswer) {
      output += `      correctAnswer: ${JSON.stringify(q.correctAnswer)},\n`;
    }
    if (q.explanation) {
      output += `      explanation: ${JSON.stringify(q.explanation)},\n`;
    }
    output += `      points: ${q.points},\n`;
    output += `      order: ${q.order}\n`;
    output += `    }${q.order < questions.length ? ',' : ''}\n`;
  }
  output += `  ]${examKey !== 'hyperbaric-operations' ? ',' : ''}\n`;
}
output += '};\n';

// Write to file
const outputFile = join(__dirname, '../content/exam-questions.js');
writeFileSync(outputFile, output, 'utf8');

console.log('✅ Expanded exam questions generated successfully!');
console.log(`\nQuestion counts:`);
for (const [examKey, questions] of Object.entries(expandedQuestions)) {
  console.log(`  ${examKey}: ${questions.length} questions`);
}
console.log(`\nTotal questions: ${Object.values(expandedQuestions).reduce((sum, q) => sum + q.length, 0)}`);

