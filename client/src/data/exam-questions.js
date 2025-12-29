export const examQuestions = {
  ndt: [
    {
      id: "ndt-1",
      type: "MULTIPLE_CHOICE",
      prompt: "In professional commercial underwater inspection operations, what is the primary advantage of systematic grid pattern inspection methodology for ensuring comprehensive coverage and quality assurance?",
      options: [
        "Reduces total inspection time and operational costs significantly while maintaining basic coverage",
        "Ensures complete systematic coverage with quality assurance verification and eliminates missed critical structural areas",
        "Minimizes specialized lighting and equipment requirements for standard operations",
        "Reduces diver physical exertion and gas consumption rates during extended work periods"
      ],
      correctAnswer: "Ensures complete systematic coverage with quality assurance verification and eliminates missed critical structural areas",
      explanation: "Systematic grid pattern methodology ensures no areas are missed during inspection, provides quality assurance verification, and is critical for structural integrity assessment in commercial diving operations.",
      points: 3,
      order: 1
    },
    {
      id: "ndt-2",
      type: "MULTIPLE_CHOICE",
      prompt: "Which corrosion type is most commonly associated with dissimilar metal connections in marine environments and requires electrochemical galvanic series analysis for proper assessment?",
      options: [
        "General uniform corrosion across large surface areas of marine structures",
        "Localized pitting corrosion with high depth-to-diameter ratios and irregular patterns",
        "Galvanic corrosion with preferential anode attack at connection points and metal interfaces",
        "Crevice corrosion in confined joint spaces and under marine growth deposits"
      ],
      correctAnswer: "Galvanic corrosion with preferential anode attack at connection points and metal interfaces",
      explanation: "Galvanic corrosion occurs when dissimilar metals are in electrical contact in seawater, creating a galvanic cell where the more anodic metal corrodes preferentially at connection points.",
      points: 2,
      order: 2
    },
    {
      id: "ndt-3",
      type: "TRUE_FALSE",
      prompt: "According to NACE industry standards for cathodic protection, the minimum protection potential for steel structures in seawater using Silver/Silver Chloride reference electrode is -750 mV with polarization verification.",
      options: ["True", "False"],
      correctAnswer: "False",
      explanation: "The minimum cathodic protection potential for steel in seawater is -850 mV (Ag/AgCl) with instant-off potential measurement, not -750 mV.",
      points: 2,
      order: 3
    },
    {
      id: "ndt-4",
      type: "WRITTEN",
      prompt: "Describe the complete documentation protocol for underwater structural inspection including measurement techniques, photographic requirements, and quality assurance procedures. Include specific details about calibration standards and reporting formats.",
      points: 5,
      order: 4
    },
    {
      id: "ndt-5",
      type: "MULTIPLE_CHOICE",
      prompt: "What is the primary purpose of establishing baseline measurements during initial underwater structural inspections?",
      options: [
        "To reduce inspection time during subsequent assessments",
        "To provide reference data for future condition monitoring and deterioration rate analysis",
        "To minimize equipment calibration requirements",
        "To standardize diver training procedures"
      ],
      correctAnswer: "To provide reference data for future condition monitoring and deterioration rate analysis",
      explanation: "Baseline measurements establish the original condition of structures, enabling accurate assessment of deterioration rates and structural integrity changes over time.",
      points: 3,
      order: 5
    }
  ],

  lst: [
    {
      id: "lst-1",
      type: "MULTIPLE_CHOICE",
      prompt: "In advanced life support operations, what is the primary function of the tertiary backup system during emergency scenarios?",
      options: [
        "To reduce operational costs during normal operations",
        "To provide immediate life support continuity when primary and secondary systems fail",
        "To minimize gas consumption during routine maintenance",
        "To standardize training procedures for new technicians"
      ],
      correctAnswer: "To provide immediate life support continuity when primary and secondary systems fail",
      explanation: "Tertiary systems are emergency backup systems designed to maintain life support when both primary and secondary systems are compromised.",
      points: 3,
      order: 1
    },
    {
      id: "lst-2",
      type: "WRITTEN",
      prompt: "Explain the complete troubleshooting protocol for life support system failures including initial assessment, diagnostic procedures, and emergency response protocols. Include specific details about system isolation procedures and communication protocols.",
      points: 5,
      order: 2
    },
    {
      id: "lst-3",
      type: "MULTIPLE_CHOICE",
      prompt: "What is the minimum acceptable oxygen concentration for life support systems in saturation diving operations according to industry standards?",
      options: [
        "18.0% by volume",
        "19.5% by volume", 
        "20.9% by volume",
        "21.5% by volume"
      ],
      correctAnswer: "19.5% by volume",
      explanation: "The minimum acceptable oxygen concentration for life support systems is 19.5% by volume to ensure adequate oxygen delivery to divers.",
      points: 2,
      order: 3
    },
    {
      id: "lst-4",
      type: "TRUE_FALSE",
      prompt: "In saturation diving operations, the life support system must maintain carbon dioxide levels below 0.5% by volume at all times.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Carbon dioxide levels must be maintained below 0.5% by volume to prevent hypercapnia and ensure diver safety in saturation environments.",
      points: 2,
      order: 4
    },
    {
      id: "lst-5",
      type: "MULTIPLE_CHOICE",
      prompt: "Which component is most critical for maintaining proper gas circulation in life support systems during extended saturation operations?",
      options: [
        "Primary gas storage tanks",
        "High-capacity circulation pumps with redundant backup systems",
        "Emergency gas supply manifolds",
        "Gas quality monitoring sensors"
      ],
      correctAnswer: "High-capacity circulation pumps with redundant backup systems",
      explanation: "Circulation pumps are essential for maintaining proper gas flow and mixing in life support systems, with redundancy being critical for safety.",
      points: 3,
      order: 5
    }
  ],

  alst: [
    {
      id: "alst-1",
      type: "MULTIPLE_CHOICE",
      prompt: "In assistant life support technician operations, what is the primary responsibility during emergency decompression scenarios?",
      options: [
        "To minimize gas consumption during emergency procedures",
        "To maintain life support continuity while managing emergency decompression protocols",
        "To reduce operational costs during crisis situations",
        "To standardize emergency response training"
      ],
      correctAnswer: "To maintain life support continuity while managing emergency decompression protocols",
      explanation: "Assistant Life Support Technicians must ensure continuous life support while coordinating emergency decompression procedures to protect diver safety.",
      points: 3,
      order: 1
    },
    {
      id: "alst-2",
      type: "WRITTEN",
      prompt: "Describe the complete emergency response protocol for life support system failures during saturation diving operations. Include system isolation procedures, emergency gas management, and communication protocols with surface support teams.",
      points: 5,
      order: 2
    },
    {
      id: "alst-3",
      type: "MULTIPLE_CHOICE",
      prompt: "What is the maximum acceptable carbon monoxide level in life support systems according to industry safety standards?",
      options: [
        "5 parts per million (ppm)",
        "10 parts per million (ppm)",
        "15 parts per million (ppm)",
        "20 parts per million (ppm)"
      ],
      correctAnswer: "5 parts per million (ppm)",
      explanation: "Carbon monoxide levels must be maintained below 5 ppm to prevent carbon monoxide poisoning in enclosed diving environments.",
      points: 2,
      order: 3
    },
    {
      id: "alst-4",
      type: "TRUE_FALSE",
      prompt: "Assistant life support technicians must be certified in hyperbaric medicine to perform emergency medical procedures in saturation environments.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Assistant Life Support Technicians require hyperbaric medicine certification to provide emergency medical care in pressurized diving environments.",
      points: 2,
      order: 4
    },
    {
      id: "alst-5",
      type: "MULTIPLE_CHOICE",
      prompt: "Which system is most critical for maintaining thermal comfort in saturation diving chambers during extended operations?",
      options: [
        "Primary heating systems",
        "Integrated climate control with humidity management",
        "Emergency heating backup systems",
        "Personal thermal protection equipment"
      ],
      correctAnswer: "Integrated climate control with humidity management",
      explanation: "Integrated climate control systems manage both temperature and humidity to maintain optimal comfort and prevent condensation in saturation chambers.",
      points: 3,
      order: 5
    }
  ],

  dmt: [
    {
      id: "dmt-1",
      type: "MULTIPLE_CHOICE",
      prompt: "In diving medical technician operations, what is the primary focus during underwater emergency medical situations?",
      options: [
        "To minimize medical equipment costs during emergencies",
        "To provide immediate medical assessment and stabilization while managing diving-specific complications",
        "To reduce training requirements for medical personnel",
        "To standardize medical procedures across all diving operations"
      ],
      correctAnswer: "To provide immediate medical assessment and stabilization while managing diving-specific complications",
      explanation: "DMTs must provide immediate medical care while understanding and managing diving-specific medical complications like decompression sickness and barotrauma.",
      points: 3,
      order: 1
    },
    {
      id: "dmt-2",
      type: "WRITTEN",
      prompt: "Describe the complete ABCDE emergency assessment protocol for diving emergencies. Include the specific clinical focus of each component and explain how this systematic approach improves patient outcomes in underwater emergency situations.",
      points: 5,
      order: 2
    },
    {
      id: "dmt-3",
      type: "MULTIPLE_CHOICE",
      prompt: "What is the first priority when treating a diver suspected of having decompression sickness?",
      options: [
        "Administer oxygen at 100% concentration",
        "Begin immediate recompression therapy",
        "Assess neurological function and vital signs",
        "Transport to nearest medical facility"
      ],
      correctAnswer: "Administer oxygen at 100% concentration",
      explanation: "Immediate oxygen administration at 100% concentration is the first priority to help eliminate inert gas bubbles and improve tissue oxygenation.",
      points: 2,
      order: 3
    },
    {
      id: "dmt-4",
      type: "TRUE_FALSE",
      prompt: "Diving medical technicians must be certified in hyperbaric medicine to provide emergency care in pressurized diving environments.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "DMTs require hyperbaric medicine certification to provide appropriate medical care in pressurized diving environments.",
      points: 2,
      order: 4
    },
    {
      id: "dmt-5",
      type: "MULTIPLE_CHOICE",
      prompt: "Which condition requires immediate recompression therapy in diving medical emergencies?",
      options: [
        "Barotrauma of descent",
        "Decompression sickness (DCS)",
        "Nitrogen narcosis",
        "Oxygen toxicity"
      ],
      correctAnswer: "Decompression sickness (DCS)",
      explanation: "Decompression sickness requires immediate recompression therapy to reduce bubble size and restore proper gas exchange in affected tissues.",
      points: 3,
      order: 5
    }
  ],

  "commercial-supervisor": [
    {
      id: "cds-1",
      type: "MULTIPLE_CHOICE",
      prompt: "In commercial dive supervision, what is the primary responsibility during complex underwater operations?",
      options: [
        "To minimize operational costs while maintaining safety standards",
        "To coordinate all aspects of diving operations while ensuring diver safety and operational efficiency",
        "To reduce training requirements for dive teams",
        "To standardize procedures across all commercial diving operations"
      ],
      correctAnswer: "To coordinate all aspects of diving operations while ensuring diver safety and operational efficiency",
      explanation: "Commercial dive supervisors must coordinate all operational aspects while maintaining the highest safety standards and operational efficiency.",
      points: 3,
      order: 1
    },
    {
      id: "cds-2",
      type: "WRITTEN",
      prompt: "Analyze the safety considerations and operational procedures for saturation diving operations at depths exceeding 150 meters. Include discussion of decompression management, life support systems, emergency protocols, and the physiological challenges faced by divers during extended saturation exposures.",
      points: 8,
      order: 2
    },
    {
      id: "cds-3",
      type: "MULTIPLE_CHOICE",
      prompt: "What is the minimum required experience level for commercial dive supervisors according to industry standards?",
      options: [
        "2 years of commercial diving experience",
        "5 years of commercial diving experience with supervisory training",
        "10 years of commercial diving experience",
        "15 years of commercial diving experience"
      ],
      correctAnswer: "5 years of commercial diving experience with supervisory training",
      explanation: "Commercial dive supervisors must have at least 5 years of commercial diving experience plus specialized supervisory training.",
      points: 2,
      order: 3
    },
    {
      id: "cds-4",
      type: "TRUE_FALSE",
      prompt: "Commercial dive supervisors must maintain current first aid and CPR certifications to oversee diving operations.",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Current first aid and CPR certifications are mandatory for commercial dive supervisors to ensure they can provide emergency medical care.",
      points: 2,
      order: 4
    },
    {
      id: "cds-5",
      type: "MULTIPLE_CHOICE",
      prompt: "Which factor is most critical when planning commercial diving operations in challenging environmental conditions?",
      options: [
        "Minimizing operational costs",
        "Ensuring comprehensive safety protocols and emergency response capabilities",
        "Reducing equipment requirements",
        "Standardizing training procedures"
      ],
      correctAnswer: "Ensuring comprehensive safety protocols and emergency response capabilities",
      explanation: "Safety protocols and emergency response capabilities are paramount when planning operations in challenging environmental conditions.",
      points: 3,
      order: 5
    }
  ]
};
