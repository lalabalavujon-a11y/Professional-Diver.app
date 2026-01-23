/**
 * Client Representative Course - Complete Brand-Neutral Content Data
 * 
 * This file contains all 52 modules, questions, and scenarios extracted
 * from the provided brand-neutral Client Representative course materials.
 */

export interface Module {
  id: number;
  title: string;
  description: string;
  learningOutcomes: string[];
  content: string;
  mcqs: MCQ[];
  shortAnswers?: ShortAnswer[];
  scenarios?: Scenario[];
}

export interface MCQ {
  prompt: string;
  options: string[];
  correctAnswer: string; // "a", "b", "c", "d", "true", "false"
  explanation?: string;
}

export interface ShortAnswer {
  prompt: string;
  modelPoints: string[];
  points: number;
}

export interface Scenario {
  title: string;
  description: string;
  task: string;
  expectedApproach?: string;
  rubric?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Extract answer letter from "Answer: B" format
function extractAnswer(answerText: string): string {
  const match = answerText.match(/Answer:\s*([A-F]|True|False)/i);
  if (match) {
    const ans = match[1].toLowerCase();
    if (ans === 'true' || ans === 'false') return ans;
    return ans; // "a", "b", "c", "d"
  }
  // Handle "Answer: True" or "Answer: False" directly
  if (answerText.includes('Answer: True')) return 'true';
  if (answerText.includes('Answer: False')) return 'false';
  return 'b'; // default fallback
}

// Extract options from MCQ text
function extractOptions(mcqText: string): { options: string[], answer: string } {
  const lines = mcqText.split('\n').map(l => l.trim()).filter(l => l);
  const options: string[] = [];
  let answer = 'b';
  
  for (const line of lines) {
    if (line.match(/^[A-F]\.\s/)) {
      options.push(line.substring(2).trim());
    } else if (line.match(/^Answer:/i)) {
      answer = extractAnswer(line);
    }
  }
  
  return { options, answer };
}

export const clientRepModules: Module[] = [
  // Module 1: CR Role, Authority & Ethics
  {
    id: 1,
    title: "CR Role, Authority & Ethics",
    description: "CR mandate, limits of authority, decision trees, conflicts of interest. Objective evidence, professional conduct, record integrity.",
    learningOutcomes: [
      "Understand CR mandate and limits of authority",
      "Apply decision trees for common situations",
      "Manage conflicts of interest appropriately",
      "Maintain objective evidence and record integrity"
    ],
    content: `# CR Role, Authority & Ethics

## CR Mandate and Limits of Authority

The Client Representative (CR) serves as the Company's representative on site, with specific authority to verify compliance and provide objective evidence. The CR's role is distinct from direct management of contractor operations.

### Key Responsibilities
- Verify contractor compliance with approved plans and procedures
- Provide objective evidence to the Company
- Maintain professional conduct and neutrality
- Record contemporaneous, factual information

### Limits of Authority
- Cannot directly manage contractor supervisors
- Cannot approve contractor payroll or productivity incentives
- Must work within defined contract and project procedures
- Must escalate matters beyond authority through proper channels

## Decision Trees and Conflict Management

### Decision-Making Framework
1. Identify the issue or deviation
2. Assess risk and compliance impact
3. Determine if within CR authority
4. Take appropriate action (document, escalate, or approve)
5. Record decision and rationale

### Conflict of Interest
- Must be declared and managed per governance process
- Cannot be ignored, even if minor
- Requires formal documentation and management plan
- May require reassignment if unmanageable

## Objective Evidence and Record Integrity

### Defensible Records
- Contemporaneous: Written at the time of events
- Factual: Based on observations, not opinions
- Referenced: Linked to evidence (photos, permits, certificates)
- Neutral: Free from bias or unsubstantiated claims

### Professional Conduct
- Maintain neutrality in disputes
- Record facts objectively
- Seek clarifications through defined channels
- Avoid taking sides verbally offshore`,
    mcqs: [
      {
        prompt: "The primary duty of a Client Representative during offshore execution is to:",
        options: [
          "Directly manage the contractor's supervisors",
          "Verify compliance and provide objective evidence to the Company",
          "Optimise contractor productivity incentives",
          "Approve contractor payroll"
        ],
        correctAnswer: "b",
        explanation: "The CR's primary duty is to verify compliance and provide objective evidence, not to manage contractors directly."
      },
      {
        prompt: "The most defensible site record is one that is:",
        options: [
          "Written at end of trip from memory",
          "Contemporaneous, factual, referenced to evidence",
          "Written by contractor then co-signed by CR",
          "Summarised weekly by project engineer"
        ],
        correctAnswer: "b",
        explanation: "Defensible records must be contemporaneous, factual, and referenced to evidence."
      },
      {
        prompt: "The CR's conflict-of-interest should be:",
        options: [
          "Declared and managed per governance process",
          "Ignored if minor",
          "Managed informally with the supervisor",
          "Discussed only after project completion"
        ],
        correctAnswer: "a",
        explanation: "Conflicts of interest must be formally declared and managed through the governance process."
      },
      {
        prompt: "A CR's daily report should avoid:",
        options: [
          "Factual narrative tied to evidence",
          "Opinions and unsubstantiated claims",
          "Objective references to permits and certificates",
          "Photographic logs"
        ],
        correctAnswer: "b",
        explanation: "Daily reports must be factual and avoid opinions or unsubstantiated claims."
      },
      {
        prompt: "A CR's neutral stance in disputes is maintained by:",
        options: [
          "Avoiding documentation",
          "Recording facts, seeking clarifications, and escalating through defined channels",
          "Taking sides verbally offshore",
          "Issuing penalties immediately"
        ],
        correctAnswer: "b",
        explanation: "Neutrality is maintained through factual documentation and proper escalation channels."
      }
    ]
  },

  // Module 2: Legal & Regulatory Framework
  {
    id: 2,
    title: "Legal & Regulatory Framework",
    description: "General duties of dutyholders, competence, risk assessment. Reportable incidents/hazardous occurrences; notification thresholds; records. Work equipment, lifting operations, certification, and thorough examination.",
    learningOutcomes: [
      "Apply statutory requirements to diving and marine operations",
      "Understand reportable incident thresholds and notification requirements",
      "Verify work equipment certification and thorough examination compliance",
      "Maintain proper records of regulatory compliance"
    ],
    content: `# Legal & Regulatory Framework

## General Duties of Dutyholders

Dutyholders have legal obligations to ensure health, safety, and welfare of workers and others affected by their operations.

### Key Duties
- Ensure work is planned and managed safely
- Provide competent personnel and adequate resources
- Conduct suitable and sufficient risk assessments
- Maintain safe systems of work

## Reportable Incidents and Notification

### Notification Thresholds
Events meeting legal reporting thresholds must be reported to relevant authorities within prescribed timeframes. These include:
- Fatalities
- Major injuries
- Dangerous occurrences
- Specified hazardous events

### Reporting Requirements
- Immediate notification for serious events
- Written reports within specified periods
- Accurate and complete information
- Preservation of evidence

## Work Equipment and Lifting Operations

### Certification Requirements
- Work equipment must be suitable for use
- Lifting equipment requires thorough examination
- Certificates must be current and valid
- Records must be maintained

### Thorough Examination
- Conducted by competent persons
- At intervals determined by written scheme or statutory periods
- Reports must include defects and next due date
- Equipment must not be used if certificate expired`,
    mcqs: [
      {
        prompt: "A thorough examination interval for a general lifting accessory is determined by:",
        options: [
          "Contractor preference",
          "Contract payment terms",
          "Statutory/standard periods or competent person's written scheme",
          "Weather conditions"
        ],
        correctAnswer: "c",
        explanation: "Examination intervals are set by statutory requirements or the competent person's written scheme."
      },
      {
        prompt: "An event that meets a legal reporting threshold must be:",
        options: [
          "Logged internally only",
          "Reported to the relevant authority within the prescribed timeframe",
          "Reported after project close-out",
          "Negotiated with the contractor first"
        ],
        correctAnswer: "b",
        explanation: "Legal reporting thresholds require notification to authorities within specified timeframes."
      },
      {
        prompt: "A competent person's report for lifting should include:",
        options: [
          "The weather forecast",
          "Details of examination, defects, and next due date",
          "Contractor invoice value",
          "Catering complaints"
        ],
        correctAnswer: "b",
        explanation: "Competent person reports must include examination details, defects found, and next due date."
      },
      {
        prompt: "Which document best captures day-to-day risk controls at task level?",
        options: [
          "Contract general conditions",
          "RAMS / task risk assessment and method statement",
          "Procurement plan",
          "Project charter"
        ],
        correctAnswer: "b",
        explanation: "RAMS documents capture task-level risk controls and methods."
      },
      {
        prompt: "The CR should treat a contractor's KPI bonus as:",
        options: [
          "A reason to relax standards",
          "Not relevant to assurance decisions",
          "A driver for scope change approvals",
          "A reason to increase tolerated risk"
        ],
        correctAnswer: "b",
        explanation: "KPI bonuses are not relevant to CR assurance decisions."
      }
    ]
  },

  // Module 3: Contracts & Commercial Awareness
  {
    id: 3,
    title: "Contracts & Commercial Awareness",
    description: "Contract anatomy: Parties, Scope, Spec, Programme, Price, Risk allocation. Variations/changes, extensions of time (EOT), schedule relief, liquidated damages (LDs).",
    learningOutcomes: [
      "Understand contract structure and key components",
      "Distinguish between site instructions and contract variations",
      "Assess extension of time claims using critical path analysis",
      "Administer changes neutrally and document appropriately"
    ],
    content: `# Contracts & Commercial Awareness

## Contract Anatomy

### Key Components
- **Parties**: Client, Contractor, and other stakeholders
- **Scope**: Work to be performed
- **Specification**: Technical requirements and standards
- **Programme**: Schedule and milestones
- **Price**: Payment terms and mechanisms
- **Risk Allocation**: Who bears which risks

## Site Instructions vs. Variations

### Site Instructions
- Direction or clarification in the field
- May trigger a change but not necessarily
- Used for day-to-day operational direction
- May have no cost/time impact

### Contract Variations
- Formal change to scope, time, or cost
- Requires proper authorization
- Must follow contract mechanisms
- Typically requires MoC assessment

## Extensions of Time (EOT)

### Assessment Method
- Compare baseline to updated schedule
- Analyze critical path impact
- Consider causation and concurrency
- Maintain evidence log

### Key Principles
- Assessed against approved baseline/updated programme
- Must demonstrate critical path impact
- Requires contemporaneous evidence
- Cannot be based solely on daily reports`,
    mcqs: [
      {
        prompt: "A change that alters scope and time but not price is typically administered as:",
        options: [
          "Defect notification",
          "Variation/change order",
          "Site instruction with no cost/time impact",
          "Provisional sum drawdown"
        ],
        correctAnswer: "c",
        explanation: "If no cost/time impact, use site instruction; otherwise assess via MoC and contract mechanism."
      },
      {
        prompt: "Extensions of time are generally assessed against:",
        options: [
          "Daily reports only",
          "Approved baseline/updated programme and critical path impact",
          "Contractor invoices",
          "Verbal updates"
        ],
        correctAnswer: "b",
        explanation: "EOT assessment requires comparison with approved programme and critical path analysis."
      },
      {
        prompt: "A site instruction should be used to:",
        options: [
          "Replace risk assessment",
          "Give clear direction and record changes/clarifications in the field",
          "Approve final payment",
          "Cancel a permit"
        ],
        correctAnswer: "b",
        explanation: "Site instructions provide direction and record field changes/clarifications."
      },
      {
        prompt: "Variation pricing under time & materials is best controlled by:",
        options: [
          "No records",
          "Timesheets, equipment logs, and agreed rates with clear scope description",
          "Verbal rate agreements",
          "Fixed price only"
        ],
        correctAnswer: "b",
        explanation: "Time & materials variations require detailed records of time, equipment, and agreed rates."
      },
    ],
    shortAnswers: [
      {
        prompt: "Explain the difference between a site instruction and a contract variation.",
        modelPoints: [
          "Site instruction: direction/clarification in field (may trigger change)",
          "Variation: formal change to scope/time/cost"
        ],
        points: 5
      }
    ]
  },

  // Module 4: Diving & Marine Operations Assurance
  {
    id: 4,
    title: "Diving & Marine Operations Assurance",
    description: "Diving project documentation set: DOP, RAMS, contingency, emergency response, DCI/DDD pathways. Vessel, spreads, and readiness: DP, lifts, deck layout, hyperbaric facilities, comms, gas.",
    learningOutcomes: [
      "Verify diving project documentation completeness",
      "Assure vessel and spread readiness",
      "Monitor diving operations and emergency preparedness",
      "Interface with diving supervision appropriately"
    ],
    content: `# Diving & Marine Operations Assurance

## Diving Project Documentation

### Required Documentation Set
- **Diving Operations Plan (DOP)**: Approved diving procedures
- **RAMS**: Risk Assessment and Method Statement
- **Contingency Plans**: Emergency response procedures
- **Emergency Response Plan**: Medical and evacuation pathways
- **DCI/DDD Pathways**: Decompression illness treatment protocols

## Vessel and Spread Readiness

### Key Verification Points
- **DP System**: Class and capability verified
- **Lifting Equipment**: Certificates current, WLL verified
- **Deck Layout**: Suitable for operations
- **Hyperbaric Facilities**: Chamber operational, gas available
- **Communications**: Redundancy tested
- **Gas Supplies**: Quality and quantity verified

## Diving Operations Interface

### CR Role Boundaries
- Verify compliance with approved plans
- Monitor operations without directing
- Assure emergency preparedness
- Document observations objectively

### Critical Controls
- PTW and LOTO procedures
- Diver tracking and bell run sheets
- Decompression control
- Emergency gas and DMT kit availability`,
    mcqs: [
      {
        prompt: "The immediate CR action after a diver reports symptoms consistent with DCI is to:",
        options: [
          "Ask the supervisor to continue work if symptoms are mild",
          "Instruct immediate medical consult and secure evidence/time logs",
          "Notify payroll of delay",
          "Begin root-cause analysis before medical actions"
        ],
        correctAnswer: "b",
        explanation: "DCI requires immediate medical consultation and evidence capture - time is critical."
      },
      {
        prompt: "When reviewing a dive plan, the CR should prioritise:",
        options: [
          "Berthing arrangements",
          "Emergency procedures, DMT kit readiness, chamber availability, gas supplies",
          "Catering quality",
          "Paint specifications"
        ],
        correctAnswer: "b",
        explanation: "Emergency preparedness and critical safety equipment are the priority."
      },
      {
        prompt: "In diver emergency response, time stamps for onset, treatment, and chamber pressurisation are:",
        options: [
          "Optional",
          "Critical for medical decision-making and reporting",
          "For the CR's private notes only",
          "Reconstructed later"
        ],
        correctAnswer: "b",
        explanation: "Accurate timestamps are critical for medical decisions and regulatory reporting."
      },
      {
        prompt: "When reviewing decompression records, CR focus is on:",
        options: [
          "Legibility only",
          "Compliance with tables/procedures, timings, max depths, and medical checks",
          "Diver handwriting style",
          "Deck log font size"
        ],
        correctAnswer: "b",
        explanation: "Decompression records must show compliance with approved procedures and parameters."
      }
    ],
    shortAnswers: [
      {
        prompt: "List five critical pre-dive checks the CR should witness or verify before first dive of campaign.",
        modelPoints: [
          "Certificates current",
          "Chamber functional checks",
          "Gas quality/quantity",
          "Emergency comms",
          "DMT kit and O2",
          "PTW live",
          "Rescue plan",
          "SIMOPS coordination",
          "Weather window",
          "Toolbox quality"
        ],
        points: 5
      },
      {
        prompt: "State the CR's role during a medevac for suspected DCI.",
        modelPoints: [
          "Ensure medical consult engaged",
          "Timestamps captured",
          "Records secured",
          "Facilitate chamber/evac",
          "Reporting",
          "Remain within authority"
        ],
        points: 5
      }
    ]
  },

  // Module 5: Technical QA/QC & Inspection Acceptance
  {
    id: 5,
    title: "Technical QA/QC & Inspection Acceptance",
    description: "Inspection levels (GVI/CVI/DFI), survey deliverables, reporting standards. Weld/cut/CP/UTM acceptance, calibration, traceability.",
    learningOutcomes: [
      "Understand inspection levels and acceptance criteria",
      "Verify calibration and traceability of inspection equipment",
      "Process non-conformances appropriately",
      "Accept deliverables based on objective evidence"
    ],
    content: `# Technical QA/QC & Inspection Acceptance

## Inspection Levels

### Types of Inspection
- **GVI (General Visual Inspection)**: Visual examination
- **CVI (Close Visual Inspection)**: Detailed visual with access
- **DFI (Detailed Fitness for Service Inspection)**: Comprehensive assessment

### Survey Deliverables
- Calibrated data with metadata
- Raw files and processed results
- QC plots and audit trails
- Independent verification where required

## Acceptance Criteria

### Objective Evidence Requirements
- Calibrated equipment certificates
- Traceable standards and references
- Compliant reports with acceptance criteria
- Repeatability checks

### Non-Conformance Process
1. Stop/hold point if critical
2. Capture evidence (photos, measurements)
3. Raise NCR
4. Notify relevant parties
5. Agree rework/repair plan
6. Retest and verify
7. Update ITP`,
    mcqs: [
      {
        prompt: "A defensible acceptance of NDT results requires:",
        options: [
          "Awareness of method limitations and calibrated equipment traceability",
          "Trust in the inspector's reputation",
          "The contractor's assurance alone",
          "Verbal reporting only"
        ],
        correctAnswer: "a",
        explanation: "NDT acceptance requires understanding method limitations and verified calibration."
      },
      {
        prompt: "Objective evidence for weld acceptance includes:",
        options: [
          "Calibrated NDT equipment certificates and compliant reports",
          "Verbal confirmation from the welder",
          "Photo of the weld only",
          "Inspector's business card"
        ],
        correctAnswer: "a",
        explanation: "Weld acceptance requires calibrated equipment and compliant reports."
      },
      {
        prompt: "An NCR is raised when:",
        options: [
          "A minor typo is found in a procedure",
          "A requirement is not met and acceptance criteria are breached",
          "A safety briefing overruns",
          "A toolbox talk is skipped"
        ],
        correctAnswer: "b",
        explanation: "NCRs are for non-conformances where requirements are not met."
      },
      {
        prompt: "A calibration certificate is acceptable when it shows:",
        options: [
          "Logo quality",
          "Traceable standard, date, results, and next due date",
          "Inspector's favourite colour",
          "Purchase order number only"
        ],
        correctAnswer: "b",
        explanation: "Calibration certificates must show traceability, dates, results, and validity."
      },
      {
        prompt: "Objective acceptance of survey data requires:",
        options: [
          "Calibrated references, metadata, and repeatability checks",
          "Contractor's assurance alone",
          "A single screenshot",
          "A marketing presentation"
        ],
        correctAnswer: "a",
        explanation: "Survey data acceptance requires calibration, metadata, and verification."
      }
    ],
    shortAnswers: [
      {
        prompt: "Describe the steps a CR takes upon discovering a non-conformance with acceptance criteria during inspection.",
        modelPoints: [
          "Stop/hold point",
          "Evidence capture",
          "NCR",
          "Notify",
          "Agree rework/repair",
          "Retest",
          "Update ITP"
        ],
        points: 5
      },
      {
        prompt: "Provide three examples of objective evidence for acceptance of subsea survey data.",
        modelPoints: [
          "Calibration sheets",
          "Metadata",
          "Raw files",
          "Repetition checks",
          "Independent cross-check",
          "QC plots",
          "Audit trail"
        ],
        points: 5
      }
    ]
  },

  // Module 6: Risk Management & MoC
  {
    id: 6,
    title: "Risk Management & MoC",
    description: "Bow-tie thinking, ALARP demonstration, SIMOPS, environmental and SIMOPS risk. Trigger-based MoC, field changes, temporary deviations, and recovery plans.",
    learningOutcomes: [
      "Apply ALARP principles to risk assessment",
      "Understand and apply Management of Change (MoC) process",
      "Manage SIMOPS risks effectively",
      "Document risk controls and deviations appropriately"
    ],
    content: `# Risk Management & MoC

## ALARP (As Low As Reasonably Practicable)

### Principles
- Risk must be reduced to ALARP level
- Gross disproportion test applies
- Consider all reasonable control options
- Document residual risk and justification

### Testing ALARP on Site
- Check barriers against good practice
- Consider alternative control options
- Assess residual risk
- Document rationale

## Management of Change (MoC)

### Purpose
Control and assess risk introduced by deviations or changes to approved plans and procedures.

### Triggers
- Change in scope or method
- Equipment substitution
- Certificate lapse
- New hazard identified
- SIMOPS change
- Weather exceedance

### Process
1. Identify change or deviation
2. Assess risk impact
3. Obtain approvals (offshore/onshore as required)
4. Implement with controls
5. Verify effectiveness
6. Close out with documentation`,
    mcqs: [
      {
        prompt: "The purpose of a Management of Change (MoC) process is to:",
        options: [
          "Document variations for payment only",
          "Control and assess risk introduced by deviations/changes",
          "Reduce document numbers on the project",
          "Replace toolbox talks"
        ],
        correctAnswer: "b",
        explanation: "MoC controls and assesses risk from changes, not just documents them."
      },
      {
        prompt: "The most appropriate CR response to an unapproved deviation discovered offshore is to:",
        options: [
          "Halt the task if unsafe, raise site instruction, initiate MoC assessment",
          "Ignore if minor",
          "Approve on the radio and continue",
          "Ask for a verbal assurance to fix later"
        ],
        correctAnswer: "a",
        explanation: "Unapproved deviations require formal assessment via MoC and site instruction."
      },
      {
        prompt: "If SIMOPS create interference risk to diver tracking, the CR should:",
        options: [
          "Note it for lessons learned only",
          "Suspend conflicting operations until controls are in place",
          "Proceed and monitor",
          "Ask for a bonus to compensate risk"
        ],
        correctAnswer: "b",
        explanation: "SIMOPS interference requires suspension until proper controls are established."
      },
      {
        prompt: "Permit interaction conflicts (e.g., hot work vs. tank entry) are resolved by:",
        options: [
          "Proceeding with both",
          "SIMOPS risk assessment, isolations, and sequencing controls",
          "Cancelling all work",
          "Asking catering to decide"
        ],
        correctAnswer: "b",
        explanation: "Permit conflicts require SIMOPS assessment and proper sequencing controls."
      }
    ],
    shortAnswers: [
      {
        prompt: "Define ALARP and how a CR tests whether risk is ALARP on site.",
        modelPoints: [
          "As Low As Reasonably Practicable",
          "Gross disproportion test",
          "Check barriers vs. good practice",
          "Consider options",
          "Residual risk"
        ],
        points: 5
      },
      {
        prompt: "Give three triggers for initiating a Management of Change offshore.",
        modelPoints: [
          "Change in scope/method",
          "Equipment substitution",
          "Certificate lapse",
          "New hazard",
          "SIMOPS change",
          "Weather exceedance"
        ],
        points: 5
      }
    ]
  },

  // Module 7: Incident Management & Reporting
  {
    id: 7,
    title: "Incident Management & Reporting",
    description: "First response hierarchy, comms script, medical escalation, evidence preservation. Notifications, internal and external reporting timelines; lessons learned.",
    learningOutcomes: [
      "Execute first response procedures appropriately",
      "Preserve evidence for investigation",
      "Meet notification and reporting timelines",
      "Contribute to lessons learned process"
    ],
    content: `# Incident Management & Reporting

## First Response Hierarchy

### Immediate Actions
1. Ensure safety of personnel
2. Secure the scene
3. Preserve evidence
4. Notify relevant parties
5. Initiate emergency response if required

### Communication Script
- Clear, factual reporting
- No speculation or blame
- Timestamps and locations
- Contact relevant authorities per procedure

## Evidence Preservation

### Critical Evidence
- Time-stamped records
- Photographs and videos
- Equipment and environmental conditions
- Witness statements (contemporaneous)
- Documentation and permits

### Chain of Custody
- Maintain evidence integrity
- Document handling and storage
- Prevent contamination or loss
- Enable investigation

## Reporting Requirements

### Notification Timelines
- Immediate for serious events
- Written reports within specified periods
- Internal and external reporting as required
- Regulatory notifications per jurisdiction

### Lessons Learned
- Capture issues and root causes
- Identify actions and ownership
- Set due dates for completion
- Share and track to closure`,
    mcqs: [
      {
        prompt: "The most reliable evidence chain for photos/videos is:",
        options: [
          "Files renamed informally",
          "Time-stamped originals, checksum or hash where practicable, stored in controlled repository",
          "Screenshots pasted into chat",
          "Contractor's social media"
        ],
        correctAnswer: "b",
        explanation: "Evidence must be time-stamped, original, and stored in controlled systems."
      },
      {
        prompt: "For pressure testing subsea equipment, acceptance requires:",
        options: [
          "Achieved hold duration, stable gauge readings, and leak-back criteria met",
          "A quick look by the CR",
          "Contractor's assurance only",
          "Photographs without data"
        ],
        correctAnswer: "a",
        explanation: "Pressure test acceptance requires specific criteria to be met and documented."
      },
      {
        prompt: "The purpose of a pre-task readiness review is to:",
        options: [
          "Approve contractor payroll",
          "Confirm all prerequisites and barriers are in place before execution",
          "Replace permits",
          "Reduce documentation"
        ],
        correctAnswer: "b",
        explanation: "Pre-task readiness reviews verify all prerequisites are in place."
      },
      {
        prompt: "For contractual communications, the CR should:",
        options: [
          "Use informal messaging only",
          "Use formal channels/templates defined by the contract and project procedures",
          "Communicate verbally to be efficient",
          "Wait for onshore approval before any communication"
        ],
        correctAnswer: "b",
        explanation: "Contractual communications must use formal channels and templates."
      },
      {
        prompt: "If a marine spread's critical certificate lapses offshore, the CR should:",
        options: [
          "Continue if no incident has occurred",
          "Suspend the affected operation, initiate MoC/contingency, and expedite rectification",
          "Ask the contractor to backdate paperwork",
          "Ignore if low risk"
        ],
        correctAnswer: "b",
        explanation: "Certificate lapses require suspension, MoC, and rectification."
      },
      {
        prompt: "A defensible stop-work decision is based on:",
        options: [
          "Gut feeling alone",
          "Identified breach of critical control or imminent risk with documented rationale",
          "Desire to save cost",
          "Crew preference"
        ],
        correctAnswer: "b",
        explanation: "Stop-work decisions must be based on documented rationale and risk assessment."
      },
      {
        prompt: "The primary control for live-subsea cutting near umbilicals is:",
        options: [
          "Administrative segregation only",
          "Elimination/substitution or physical separation and verified isolation",
          "PPE",
          "Contractor assurance"
        ],
        correctAnswer: "b",
        explanation: "Primary controls prioritize elimination/substitution and physical separation."
      },
      {
        prompt: "A formal lessons-learned entry should include:",
        options: [
          "Names and opinions",
          "The issue, root cause, action, and ownership with due dates",
          "Only what went well",
          "Confidential gossip"
        ],
        correctAnswer: "b",
        explanation: "Lessons learned must be structured with issue, cause, action, and ownership."
      },
      {
        prompt: "The CR should document weather downtime as:",
        options: [
          "Contractor's fault",
          "Neutral, with objective metocean data and programme impact",
          "Not recorded",
          "Always claimable"
        ],
        correctAnswer: "b",
        explanation: "Weather downtime must be documented neutrally with objective data."
      },
      {
        prompt: "The intent of a lifting operations plan is to:",
        options: [
          "Impress auditors",
          "Define how the lift's hazards are controlled from planning through execution and recovery",
          "Reduce crew size",
          "Replace toolbox talks"
        ],
        correctAnswer: "b",
        explanation: "Lifting plans define hazard controls throughout the operation."
      },
      {
        prompt: "CR attendance at toolbox talks is primarily to:",
        options: [
          "Deliver the briefing",
          "Sample quality of hazard controls and workforce understanding",
          "Inspect PPE brands",
          "Approve overtime"
        ],
        correctAnswer: "b",
        explanation: "CR attendance is to sample quality, not deliver briefings."
      }
    ]
  },

  // Module 8: Documentation & Close-Out
  {
    id: 8,
    title: "Documentation & Close-Out",
    description: "Daily reports, site instructions, registers, punch-list control, as-built/redlines. Handover dossiers; data integrity and reconciliation with contractor records.",
    learningOutcomes: [
      "Create defensible daily reports",
      "Maintain proper documentation registers",
      "Control punch-lists and as-built records",
      "Prepare comprehensive handover dossiers"
    ],
    content: `# Documentation & Close-Out

## Daily Reports

### Minimum Information
- Date/time and weather conditions
- Activities and production
- Evidence references (permits, certificates)
- Deviations and instructions issued
- Manpower and equipment status
- HSE observations
- Photo register

### Quality Standards
- Contemporaneous and factual
- Referenced to evidence
- Free from opinions
- Objective and neutral

## Site Instructions

### Purpose
- Give clear direction in the field
- Record changes and clarifications
- May trigger formal change process
- Maintain audit trail

### Content
- Reason for instruction
- Clear direction
- Attachments and evidence
- Impact assessment
- Approvals

## Close-Out Documentation

### Handover Dossiers
- Scope completion evidence
- Punch-list closure
- As-built drawings and records
- Lessons learned
- Data integrity verification

### As-Built Records
- Captured contemporaneously
- Redlined drawings
- Survey data reconciliation
- Final acceptance documentation`,
    mcqs: [
      {
        prompt: "The best time to capture as-built redlines is:",
        options: [
          "After demobilisation",
          "Contemporaneously as work progresses",
          "During tendering",
          "At final invoice"
        ],
        correctAnswer: "b",
        explanation: "As-built records must be captured contemporaneously, not reconstructed later."
      }
    ],
    shortAnswers: [
      {
        prompt: "Outline the minimum information in a daily site report to make it defensible.",
        modelPoints: [
          "Date/time",
          "Weather",
          "Activities",
          "Evidence refs",
          "Permits",
          "Deviations",
          "Manpower/equipment",
          "Production",
          "Delays",
          "Instructions",
          "HSE observations",
          "Photos register"
        ],
        points: 5
      }
    ]
  },

  // Module 9: Lifting Operations (LOLER-style) & PUWER Interface
  {
    id: 9,
    title: "Lifting Operations (LOLER-style) & PUWER Interface",
    description: "Assure safe lifting operations, examinations, and equipment control. Verify lifting plans, equipment certification, and competent person requirements.",
    learningOutcomes: [
      "Verify thorough examination intervals and certificates",
      "Assess lifting plans for critical lifts",
      "Ensure PUWER compliance for work equipment",
      "Handle equipment defects and certification lapses"
    ],
    content: `# Lifting Operations (LOLER-style) & PUWER Interface

## Thorough Examination Requirements

### Examination Intervals
- Determined by competent person's written scheme
- Or default statutory periods
- Must be current and valid
- Reports must include defects and next due date

### Critical Lift Planning
- Load path analysis
- Exclusion zones
- Communications protocols
- Deration for sea state
- Environmental limits

## PUWER Requirements

### Work Equipment Suitability
- Must be suitable for intended use
- Properly maintained
- Inspected as required
- Users provided with information and instruction
- Training provided where necessary

### Equipment Defects
- Remove from service if unsafe
- Require positive identification
- Verify certification before use
- Issue hold points if certification missing`,
    mcqs: [
      {
        prompt: "A lifting accessory must undergo a thorough examination at intervals determined by:",
        options: [
          "Contractor policy",
          "The competent person's written scheme or default statutory periods",
          "Weather windows",
          "CR preference"
        ],
        correctAnswer: "b",
        explanation: "Examination intervals are set by competent person's scheme or statutory requirements."
      },
      {
        prompt: "Before a critical lift, the CR should verify the plan includes:",
        options: [
          "Contractor bonuses",
          "Load path, exclusion zones, communications, deration for sea state",
          "Catering schedule",
          "Vessel paint spec"
        ],
        correctAnswer: "b",
        explanation: "Critical lifts require comprehensive planning including load path, zones, comms, and environmental factors."
      },
      {
        prompt: "A chain sling's WLL on the tag is unreadable offshore. The correct CR action is:",
        options: [
          "Continue; assume previous data",
          "Remove from service until positively identified and inspected",
          "Ask rigger to guess size",
          "Use only below 50% of presumed WLL"
        ],
        correctAnswer: "b",
        explanation: "Unreadable WLL tags require removal from service until positive identification."
      },
      {
        prompt: "PUWER places primary duties on who to ensure work equipment is suitable and maintained?",
        options: [
          "Any employee",
          "Employers/dutyholders with control of equipment",
          "Port authority",
          "Vessel steward"
        ],
        correctAnswer: "b",
        explanation: "PUWER duties fall on employers/dutyholders who control the equipment."
      },
      {
        prompt: "Thorough examination reports shall record:",
        options: [
          "Weather history",
          "Defects found and next due date",
          "Catering scores",
          "Fuel type"
        ],
        correctAnswer: "b",
        explanation: "Examination reports must record defects and next due date."
      },
      {
        prompt: "Sling angle increases from 60° to 30°. The tension in each leg will:",
        options: [
          "Decrease",
          "Stay the same",
          "Increase significantly",
          "Become zero"
        ],
        correctAnswer: "c",
        explanation: "Reducing sling angle increases tension in each leg significantly."
      }
    ],
    shortAnswers: [
      {
        prompt: "List five mandatory elements of a thorough examination report for lifting accessories.",
        modelPoints: [
          "Identification",
          "Examination details",
          "Defects",
          "WLL/SWL",
          "Date and next due",
          "Examiner identity",
          "Limitations"
        ],
        points: 5
      }
    ],
    scenarios: [
      {
        title: "Certificate Lapse Mid-Campaign",
        description: "A key lifting accessory's thorough examination expired yesterday; contractor proposes to continue for low-risk lifts until port call.",
        task: "Record CR actions and communications. Decide stop/continue. Draft a site instruction and MoC initiation note.",
        expectedApproach: "Suspend affected lifts; secure evidence; initiate MoC; seek competent person guidance; verify alternatives; update plan.",
        rubric: "Hazard recognition; control selection; communication quality; documentation; neutrality.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 10: Hazardous Substances (COSHH-style) Control
  {
    id: 10,
    title: "Hazardous Substances (COSHH-style) Control",
    description: "Ensure adequate assessment, control hierarchy, monitoring, and health surveillance for hazardous substances.",
    learningOutcomes: [
      "Understand COSHH assessment requirements",
      "Apply control hierarchy (elimination → engineering → admin → PPE)",
      "Verify monitoring and health surveillance",
      "Handle spill response appropriately"
    ],
    content: `# Hazardous Substances (COSHH-style) Control

## COSHH Assessment Requirements

### Assessment Content
- Identify hazards and exposure routes
- Identify persons at risk
- Determine required controls
- Specify monitoring requirements
- Define health surveillance needs

### Control Hierarchy
1. Elimination/substitution
2. Engineering controls (e.g., LEV)
3. Administrative controls
4. Personal protective equipment (PPE)

## Safety Data Sheets (SDS)

### Required Information
- Hazards and properties
- Handling and storage
- PPE requirements
- First aid measures
- Spill response procedures
- Disposal requirements

## Health Surveillance

### When Required
- Work exposes workers to identifiable disease/adverse health effect
- Reasonably likely to occur
- Surveillance can detect the condition
- Surveillance is reasonably practicable`,
    mcqs: [
      {
        prompt: "A COSHH assessment must identify:",
        options: [
          "Only acute hazards",
          "Hazards, exposure routes, persons at risk, and required controls",
          "Supplier costs",
          "Shift patterns only"
        ],
        correctAnswer: "b",
        explanation: "COSHH assessments must identify hazards, exposure routes, persons at risk, and controls."
      },
      {
        prompt: "Preferred control approach order is:",
        options: [
          "PPE → LEV → Substitution",
          "Elimination/substitution → engineering (e.g., LEV) → admin → PPE"
        ],
        correctAnswer: "b",
        explanation: "Control hierarchy prioritizes elimination/substitution before engineering, then admin, then PPE."
      },
      {
        prompt: "Respiratory protection selection should be based on:",
        options: [
          "Style preference",
          "Assigned protection factor vs. airborne concentration",
          "Lowest cost",
          "Brand"
        ],
        correctAnswer: "b",
        explanation: "Respiratory protection must be selected based on protection factor vs. exposure concentration."
      },
      {
        prompt: "Health surveillance is required when:",
        options: [
          "Any chemical is used",
          "Work exposes workers to identifiable disease/adverse health effect and it is reasonably likely to occur",
          "Crew request it",
          "Budget allows"
        ],
        correctAnswer: "b",
        explanation: "Health surveillance required when exposure to identifiable health effects is reasonably likely."
      }
    ],
    shortAnswers: [
      {
        prompt: "Outline the steps to develop a COSHH assessment for a new coating system used inside a ballast tank.",
        modelPoints: [
          "Obtain SDS",
          "Identify hazards/exposure",
          "Select controls (substitution, LEV/ventilation, RPE)",
          "Monitoring",
          "Emergency",
          "Training",
          "Health surveillance",
          "Record and review"
        ],
        points: 5
      }
    ]
  },

  // Module 11: Legionella Risk Control
  {
    id: 11,
    title: "Legionella Risk Control (Water Systems)",
    description: "Manage legionella risk in water systems through responsible person appointment, control schemes, temperature regimes, and monitoring.",
    learningOutcomes: [
      "Understand legionella risk factors",
      "Appoint and manage responsible person role",
      "Implement temperature control regimes",
      "Maintain monitoring and records"
    ],
    content: `# Legionella Risk Control (Water Systems)

## Responsible Person

A responsible person must be appointed to manage the control scheme. This person oversees:
- Temperature control regimes
- Biocide management
- Monitoring and logging
- Record retention
- Contractor oversight

## Risk Factors

Primary risk factors include:
- Stagnant water systems
- Warm recirculating water (20-45°C)
- Aerosol generation points
- Susceptible individuals

## Control Measures

### Temperature Regime
- Hot water: ≥60°C at calorifier, ≥50°C at outlets
- Cold water: ≤20°C
- Jurisdictional equivalents may apply

### Monitoring
- Regular temperature checks
- Biocide levels where used
- System flushing for stagnant areas
- Sampling and testing as required`,
    mcqs: [
      {
        prompt: "A responsible person must be appointed to manage the control scheme.",
        options: ["False", "True"],
        correctAnswer: "true",
        explanation: "A responsible person is mandatory for legionella control."
      },
      {
        prompt: "Primary risk factor for aerosol generation is:",
        options: [
          "Paint colour",
          "Stagnant, warm recirculating water systems",
          "Pipe material alone",
          "System pressure"
        ],
        correctAnswer: "b",
        explanation: "Stagnant, warm recirculating water systems are the primary risk factor."
      },
      {
        prompt: "Records for monitoring and review are:",
        options: [
          "Optional",
          "Required and retained for defined periods"
        ],
        correctAnswer: "b"
      },
      {
        prompt: "Initial risk assessment must:",
        options: [
          "Be verbal",
          "Identify sources, susceptibility, and control measures"
        ],
        correctAnswer: "b"
      },
      {
        prompt: "Temperature regime commonly used to control risk:",
        options: [
          "20–25°C",
          "Keep hot water ≥60°C at calorifier/≥50°C at outlets, cold ≤20°C (jurisdictional equivalents)",
          "Any value"
        ],
        correctAnswer: "b",
        explanation: "Temperature control uses specific regimes to prevent legionella growth."
      },
      {
        prompt: "Biocide change without assessment is:",
        options: [
          "Acceptable",
          "MoC trigger with validation"
        ],
        correctAnswer: "b"
      }
    ],
    shortAnswers: [
      {
        prompt: "Describe the responsible person's duties for legionella control on a vessel.",
        modelPoints: [
          "Maintain scheme",
          "Temperature/biocide control",
          "Monitoring/logging",
          "Review",
          "Contractor oversight",
          "Records retention",
          "Training"
        ],
        points: 5
      }
    ]
  },

  // Module 12: Manual Handling
  {
    id: 12,
    title: "Manual Handling (Task/Load/Individual/Environment)",
    description: "Apply avoid-assess-reduce hierarchy for manual handling tasks. Consider task, load, individual, and environment factors.",
    learningOutcomes: [
      "Apply avoid-assess-reduce hierarchy",
      "Evaluate task, load, individual, and environment factors",
      "Select appropriate aids and team lifts",
      "Conduct dynamic risk assessment during execution"
    ],
    content: `# Manual Handling (Task/Load/Individual/Environment)

## Hierarchy: Avoid → Assess → Reduce

### Avoid
- Eliminate manual handling where possible
- Use mechanical aids
- Redesign tasks to eliminate lifting

### Assess
- Task factors (posture, distance, frequency)
- Load factors (weight, size, stability)
- Individual factors (capability, training)
- Environment factors (space, floor, lighting)

### Reduce
- Minimize risk through controls
- Use appropriate aids
- Team lifts where necessary
- Task redesign`,
    mcqs: [
      {
        prompt: "The hierarchy for manual handling is: avoid → assess → reduce.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "A 35-kg awkward load at knee height with twist is acceptable without aids.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Awkward loads with twists require aids or team lifts."
      },
      {
        prompt: "Suitable aids and team lifts shall be combined with task redesign to minimise risk.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Dynamic risk assessment during lift execution is required.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ]
  },

  // Module 13: Confined Spaces (Definition, Permit, Rescue)
  {
    id: 13,
    title: "Confined Spaces (Definition, Permit, Rescue)",
    description: "Define confined spaces by risk, assure permit systems, testing, ventilation, and rescue arrangements.",
    learningOutcomes: [
      "Define confined spaces by risk, not just size",
      "Verify permit system compliance",
      "Ensure proper testing and ventilation",
      "Verify rescue arrangements are practicable"
    ],
    content: `# Confined Spaces (Definition, Permit, Rescue)

## Definition

A confined space is defined by the risk of serious injury from:
- Hazardous substances
- Dangerous conditions
- Not just by size alone

## Permit Requirements

### Pre-Entry Checks
- Isolation/LOTO verified
- Gas testing completed
- Ventilation established
- Permit issued and valid
- Rescue plan confirmed
- Communications tested
- Competent team assembled

### During Entry
- Continuous monitoring
- Standby/attendant present
- Communications maintained
- Emergency procedures ready`,
    mcqs: [
      {
        prompt: "A confined space is defined by the risk of serious injury from hazardous substances or conditions, not just size.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Entry is allowed before rescue is planned and proven.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Rescue must be planned and proven before entry."
      },
      {
        prompt: "Atmosphere testing must be done before and during entry with calibrated instruments.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Use of breathing apparatus can remove the need for a permit.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "BA does not eliminate permit requirements."
      }
    ],
    shortAnswers: [
      {
        prompt: "Give the minimum pre-entry checks for a confined space in a subsea structure or tank.",
        modelPoints: [
          "Isolation/LOTO",
          "Gas testing",
          "Ventilation",
          "Permit",
          "Rescue plan/kit",
          "Communications",
          "Competent team",
          "Continuous monitoring"
        ],
        points: 5
      }
    ],
    scenarios: [
      {
        title: "Epoxy in Ballast Tank",
        description: "Contractor proposes rapid cure epoxy; fumes detected at hatch. Lead COSHH/Confined Space controls.",
        task: "Revise PTW/SIMOPS, verify LEV/testing, and ensure proper controls.",
        expectedApproach: "Assess COSHH and confined space risks; verify ventilation and testing; update permits and SIMOPS.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 14: Code of Safe Working Practices (Marine Operations)
  {
    id: 14,
    title: "Code of Safe Working Practices (Marine Operations)",
    description: "Apply marine operations safety standards including working aloft, enclosed spaces, lifting operations, and permit interactions.",
    learningOutcomes: [
      "Understand marine operations safety requirements",
      "Verify working aloft procedures",
      "Ensure enclosed space entry compliance",
      "Coordinate lifting operations with stability"
    ],
    content: `# Code of Safe Working Practices (Marine Operations)

## Working Aloft

### Requirements
- Permit required
- Competent supervision
- Fall protection
- Tool tethering
- Exclusion zones

## Enclosed Space Entry

### Requirements
- Structured risk assessment
- Gas testing
- Rescue plan
- Communications
- Standby personnel

## Lifting Operations

### Coordination
- Stability considerations
- Ballast management
- Load limits
- Environmental factors`,
    mcqs: [
      {
        prompt: "Working aloft requires a permit, competent supervision, and fall protection.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Hatch/door control and housekeeping are part of preventing slips/trips and man-overboard.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Enclosed space entry on ships follows a structured risk assessment, testing, and rescue plan.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "PPE choice should be brand-based.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "PPE selection should be based on suitability, not brand."
      },
      {
        prompt: "Lifting operations on ships must coordinate with stability/ballast considerations.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Permit interaction (hot work vs. entry) is managed through SIMOPS controls.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ]
  },

  // Module 15: Risk Assessment & HIRA Quality
  {
    id: 15,
    title: "Risk Assessment & HIRA Quality (General)",
    description: "Ensure suitable and sufficient risk assessments focusing on real risks, linking hazards to controls, and demonstrating ALARP.",
    learningOutcomes: [
      "Verify risk assessment quality",
      "Ensure hazards link to controls and verification",
      "Confirm ALARP justification",
      "Identify and reject copy-paste assessments"
    ],
    content: `# Risk Assessment & HIRA Quality (General)

## Suitable and Sufficient

### Focus Areas
- Real risks (not theoretical)
- Reasonable controls
- Practical implementation
- Worker involvement

## HIRA Quality Indicators

### Good HIRA
- Hazards clearly identified
- Controls linked to hazards
- Verification/monitoring defined
- Residual risk assessed
- ALARP justified

### Poor HIRA
- Copy-paste from unrelated jobs
- Generic controls
- No verification
- Missing MoC triggers`,
    mcqs: [
      {
        prompt: "A suitable and sufficient assessment focuses on real risks and reasonable controls.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "HIRA quality is demonstrated by linking hazards → controls → verification/monitoring.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Copy-paste assessments from unrelated jobs are acceptable.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Assessments must be job-specific and relevant."
      },
      {
        prompt: "Trigger points for MoC must be defined in the assessment.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ]
  },

  // Module 16: Safety Observation & Intervention
  {
    id: 16,
    title: "Safety Observation & Intervention",
    description: "Use observation cards for learning, not blame. Close the loop with feedback and trend analysis.",
    learningOutcomes: [
      "Use observations for learning, not blame",
      "Record condition/act, consequence, and corrective action",
      "Close the loop with workforce feedback",
      "Review trends to inform risk assessments"
    ],
    content: `# Safety Observation & Intervention

## Observation Cards

### Effective Use
- Learning focus, not blame
- Record condition/act
- Identify potential consequence
- Propose corrective action
- Close loop with feedback

### Quality Indicators
- Task-specific observations
- Positive reinforcement included
- Trends reviewed regularly
- Actions tracked to closure`,
    mcqs: [
      {
        prompt: "Observation cards are most effective when used for learning, not blame.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "A good observation records condition/act, potential consequence, and corrective action.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Supervisors should close the loop with feedback to the workforce.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Only negative observations are valuable.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Positive observations reinforce good practice."
      }
    ]
  },

  // Module 17: Toolbox Talks (TBT) Quality & Delivery
  {
    id: 17,
    title: "Toolbox Talks (TBT) Quality & Delivery",
    description: "Assure effective briefings that control task risk. Verify TBT quality, content, and evidence.",
    learningOutcomes: [
      "Verify TBT quality and content",
      "Ensure hazards, controls, and roles are understood",
      "Handle language barriers appropriately",
      "Update TBTs for dynamic risks"
    ],
    content: `# Toolbox Talks (TBT) Quality & Delivery

## TBT Objectives

### Primary Goal
Ensure hazards, controls, and roles are understood and owned by the team.

### Quality Elements
- Weather and task steps
- Key hazards and controls
- SIMOPS considerations
- Stop-work triggers
- Questions and confirmation

## CR Role

### Responsibilities
- Sample quality of briefings
- Intervene if controls inadequate
- Verify understanding
- Ensure evidence captured`,
    mcqs: [
      {
        prompt: "The primary objective of a TBT is to ensure:",
        options: [
          "Attendance sheets are complete",
          "Hazards, controls, and roles are understood and owned by the team",
          "Management is updated",
          "Overtime is approved"
        ],
        correctAnswer: "b"
      },
      {
        prompt: "If a critical control is not in place during the TBT, the CR shall:",
        options: [
          "Proceed and capture a lesson",
          "Issue a hold, rectify, and re-brief",
          "Ask for a risk waiver",
          "Reduce PPE"
        ],
        correctAnswer: "b"
      },
      {
        prompt: "The CR's role at TBTs is to:",
        options: [
          "Deliver every talk",
          "Sample quality and intervene if controls are inadequate",
          "Approve payroll",
          "Record catering issues"
        ],
        correctAnswer: "b"
      }
    ]
  },

  // Module 18: Crew Boat / Personnel Transfer Assurance
  {
    id: 18,
    title: "Crew Boat / Personnel Transfer Assurance",
    description: "Verify safe transfer planning, comms, and PPE. Ensure proper approach authority and reporting.",
    learningOutcomes: [
      "Verify transfer planning and readiness",
      "Ensure proper PPE and equipment",
      "Verify approach authority and comms",
      "Handle transfer interruptions appropriately"
    ],
    content: `# Crew Boat / Personnel Transfer Assurance

## Pre-Approach Requirements

### Vessel Readiness
- Pause conflicting operations
- Establish comms and lighting
- Confirm deck readiness
- Verify DP/heading

### Authority
- Bridge gives approach authority
- After deck readiness confirmed
- Master's permission for restricted periods

## PPE Requirements

### Standard PPE
- Hard hat
- Safety shoes
- Lifejacket
- PLB
- Immersion suit when required`,
    mcqs: [
      {
        prompt: "Prior to approach, the vessel should:",
        options: [
          "Keep all operations running",
          "Pause conflicting ops and establish comms/lighting at transfer point",
          "Turn off deck lights",
          "Ignore DP/heading"
        ],
        correctAnswer: "b"
      },
      {
        prompt: "Authority to approach is given by:",
        options: [
          "Anyone on deck",
          "Bridge on instruction after deck readiness confirmed",
          "The crew boat only",
          "Catering"
        ],
        correctAnswer: "b"
      },
      {
        prompt: "A transfer is stopped when:",
        options: [
          "Lighting is marginal",
          "Comms lost or conditions exceed limits",
          "Crew boat requests",
          "At meal times"
        ],
        correctAnswer: "b"
      }
    ],
    scenarios: [
      {
        title: "Transfer Interruption",
        description: "Loss of comms during ladder transfer; stop-work, re-establish controls, and revise plan.",
        task: "Document stop-work decision, re-establish comms, verify controls, and revise transfer plan.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 19: Working at Height (WAH) Essentials
  {
    id: 19,
    title: "Working at Height (WAH) Essentials",
    description: "Apply avoid-prevent-minimise hierarchy; collective before personal protection. Plan rescue and emergency procedures.",
    learningOutcomes: [
      "Apply avoid-prevent-minimise hierarchy",
      "Prioritize collective protection over PPE",
      "Plan rescue and emergency procedures",
      "Verify equipment inspection and competence"
    ],
    content: `# Working at Height (WAH) Essentials

## Hierarchy: Avoid → Prevent → Minimise

### Avoid
- Eliminate height where practicable
- Design out height requirements
- Use alternative methods

### Prevent
- Collective protection (guardrails)
- Fixed platforms
- Permanent access systems

### Minimise
- Fall arrest systems
- Safety nets
- Personal protection (last resort)

## Rescue Planning

### Requirements
- Rescue plan for all WAH
- Practicable and tested
- Equipment available
- Personnel trained`,
    mcqs: [
      {
        prompt: "First step in WAH planning is to avoid the height where practicable.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Collective protection (e.g., guardrails) takes precedence over PPE.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Emergency/evacuation and rescue must be planned.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Weather/wind limits are irrelevant if using fall arrest.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Weather limits still apply even with fall arrest."
      }
    ]
  },

  // Module 20: Confined Spaces (Essentials)
  {
    id: 20,
    title: "Confined Spaces (Essentials)",
    description: "Define by risk, assure permit, testing, ventilation, and rescue. Verify isolation and continuous monitoring.",
    learningOutcomes: [
      "Define confined spaces by risk",
      "Verify permit system compliance",
      "Ensure testing and ventilation",
      "Verify rescue arrangements"
    ],
    content: `# Confined Spaces (Essentials)

## Definition by Risk

Not defined by size alone, but by risk of serious injury from:
- Hazardous substances
- Dangerous conditions
- Oxygen deficiency
- Entrapment

## Permit Requirements

### Mandatory Elements
- Isolation/LOTO verified
- Gas testing before and during
- Ventilation established
- Rescue plan confirmed
- Communications tested
- Standby/attendant assigned`,
    mcqs: [
      {
        prompt: "A confined space is defined by small size alone.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Defined by risk of serious injury, not size."
      },
      {
        prompt: "Gas testing is required before and during entry with calibrated instruments.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Rescue must be practicable and drilled for the location.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ]
  },

  // Module 21: Compressed Gases in Hot Work (Oxy-Fuel)
  {
    id: 21,
    title: "Compressed Gases in Hot Work (Oxy-Fuel)",
    description: "Prevent flashback/fire; selection, inspection and operating discipline. Verify flashback arrestors and safe practices.",
    learningOutcomes: [
      "Prevent flashback and fire risks",
      "Verify flashback arrestors and equipment",
      "Ensure proper cylinder storage and segregation",
      "Handle emergency procedures"
    ],
    content: `# Compressed Gases in Hot Work (Oxy-Fuel)

## Flashback Prevention

### Required Equipment
- Flashback arrestors at appropriate locations
- Non-return valves
- Proper hose condition
- Leak testing before use

### Safety Requirements
- Oil/grease kept away from oxygen
- Acetylene pressure limits observed
- Proper cylinder storage and segregation
- Training and supervision`,
    mcqs: [
      {
        prompt: "Flashback arrestors and non-return valves are required at appropriate locations.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Oxygen-enriched atmospheres reduce fire risk.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Oxygen-enriched atmospheres greatly increase fire risk."
      },
      {
        prompt: "Hose damage is managed by tape repair.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Damaged hoses must be removed from service."
      }
    ],
    scenarios: [
      {
        title: "Flashback Event",
        description: "Oxy-fuel backfire with hose damage; isolate, emergency response, equipment quarantine, investigate.",
        task: "Secure area, isolate equipment, initiate emergency response, quarantine damaged equipment, and investigate cause.",
        difficulty: "advanced"
      }
    ]
  },

  // Module 22: Electrical Safety for CRs
  {
    id: 22,
    title: "Electrical Safety for CRs (Safe Working Practices)",
    description: "Enforce dead-work policy, isolation, permits, and live-work justification. Verify competence and test instruments.",
    learningOutcomes: [
      "Enforce dead-work policy",
      "Verify isolation and 'prove dead' procedures",
      "Require formal justification for live work",
      "Verify test instruments and competence"
    ],
    content: `# Electrical Safety for CRs (Safe Working Practices)

## Dead-Work Policy

### Default Approach
- Work dead unless unreasonable
- Isolation and 'prove dead' required
- Earths applied after isolation
- Test instruments verified

### Live Work
- Formal justification required
- Specific controls defined
- Competence verified
- Supervision specified`,
    mcqs: [
      {
        prompt: "Default policy is to work dead unless unreasonable.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "'Prove dead' using an approved tester after isolation and before earths are applied.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Live work may proceed if the CR authorises verbally.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Live work requires formal justification and controls."
      }
    ],
    scenarios: [
      {
        title: "Live vs Dead Decision",
        description: "Contractor requests live test due to schedule; force justification, apply decision flow, document permit.",
        task: "Require formal justification, assess if live work is reasonable, apply controls if approved, document permit.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 23: Incident Investigation & Learning
  {
    id: 23,
    title: "Incident Investigation & Learning (HSG-style)",
    description: "Conduct structured investigations and deliver corrective actions. Address immediate, underlying, and root causes.",
    learningOutcomes: [
      "Conduct structured investigations",
      "Identify immediate, underlying, and root causes",
      "Engage workforce in investigation",
      "Link findings to risk assessment review"
    ],
    content: `# Incident Investigation & Learning (HSG-style)

## Investigation Purpose

### Primary Goal
Learning and prevention, not blame assignment.

### Investigation Steps
1. Gather evidence
2. Analyze causes
3. Identify controls
4. Implement actions

## Cause Analysis

### Levels
- Immediate causes (what happened)
- Underlying causes (why it happened)
- Root causes (systemic issues)

### Engagement
- Involve workforce
- Include representatives
- Share findings
- Track actions to closure`,
    mcqs: [
      {
        prompt: "Primary purpose of investigation is blame assignment.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Purpose is learning and prevention."
      },
      {
        prompt: "A robust investigation addresses immediate, underlying, and root causes.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Near misses should be investigated because they provide learning at lower cost.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ]
  },

  // Module 24: Meetings, Handover & Information Management
  {
    id: 24,
    title: "Meetings, Handover & Information Management",
    description: "Maintain defensible records and continuity (minutes, handover notes, MDR). Ensure objective documentation.",
    learningOutcomes: [
      "Create objective meeting minutes",
      "Prepare comprehensive handover notes",
      "Maintain document registers (MDR)",
      "Ensure data integrity and reconciliation"
    ],
    content: `# Meetings, Handover & Information Management

## Meeting Minutes

### Quality Standards
- Objective capture of decisions
- Actions with ownership
- Risks and status
- Evidence attachments referenced
- Distribution recorded

## Handover Notes

### Essential Content
- Honest status assessment
- Constraints and limitations
- Outstanding actions
- Equipment status
- Progress realism

## Document Register (MDR)

### Control Elements
- Version control
- Review periods
- Transmittals tracked
- Overdue reviews flagged`,
    mcqs: [
      {
        prompt: "Daily meeting minutes should objectively capture decisions, actions, risks, and status.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Client reps should edit minutes to emphasise productivity.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Minutes must maintain neutrality."
      },
      {
        prompt: "Overdue document reviews in MDR are acceptable if low risk.",
        options: ["True", "False"],
        correctAnswer: "false"
      }
    ],
    scenarios: [
      {
        title: "Hand-Over Integrity",
        description: "Incoming CR receives optimistic progress claims; reconcile with MDR, as-builts, and survey data before acceptance.",
        task: "Verify progress claims against MDR, as-built records, and survey data. Identify discrepancies and document actual status.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 25: Project Lifecycle & Governance
  {
    id: 25,
    title: "Project Lifecycle & Governance (from Tender to Close-Out)",
    description: "Understand phase gates, governance artefacts, and cross-cutting controls. Anticipate deliverables and required records.",
    learningOutcomes: [
      "Understand project lifecycle phases",
      "Identify phase gate requirements",
      "Anticipate deliverables and handovers",
      "Maintain cross-cutting controls"
    ],
    content: `# Project Lifecycle & Governance

## Cross-Cutting Processes

### Continuous Processes
- Risk management
- Monitor-and-control
- Quality assurance
- Documentation control

## Phase Gates

### Gate Reviews Verify
- Readiness of prerequisites
- Risks and interfaces
- Documentation completeness
- Stakeholder alignment

## Governance Artefacts

### Key Documents
- Master Document Register (MDR)
- Interface registers
- SIMOPS plans
- Task plans and procedures`,
    mcqs: [
      {
        prompt: "Which cross-cutting process must run continuously from award to close-out?",
        options: [
          "Lifting operations only",
          "Risk management and monitor-and-control",
          "Procurement only",
          "Fabrication only"
        ],
        correctAnswer: "b"
      },
      {
        prompt: "A phase gate review should verify:",
        options: [
          "Only budget approval",
          "Readiness of prerequisites, risks, interfaces, and documentation",
          "Hotel bookings",
          "That fabrication is complete"
        ],
        correctAnswer: "b"
      }
    ]
  },

  // Module 26: Daily Progress Reporting (DPR) & Work Status Control
  {
    id: 26,
    title: "Daily Progress Reporting (DPR) & Work Status Control",
    description: "Verify production, time coding, POB, and completions traceability. Reconcile DPR with work completion status.",
    learningOutcomes: [
      "Verify DPR completeness and accuracy",
      "Understand time coding (WOW, IFR, PL)",
      "Reconcile DPR with work completion status",
      "Identify and resolve discrepancies"
    ],
    content: `# Daily Progress Reporting (DPR) & Work Status Control

## DPR Components

### Required Elements
- Event timeline
- Coded activities (WOW, IFR, PL)
- Weather conditions
- POB changes
- HSE summary
- Production data
- Completion status

## Time Coding

### Categories
- WOW: Weather Off Work
- IFR: In Field Repair
- PL: Productive Labour
- Other codes as defined

## Reconciliation

### Verification
- DPR entries match work completion status
- Activity totals equal 24:00 per day
- Production claims supported by evidence
- Discrepancies identified and resolved`,
    mcqs: [
      {
        prompt: "A defensible DPR includes: event timeline, coded activities, weather, POB, HSE summary.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Activity totals should equal 24:00 per day (unless justified).",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "The CR should accept a DPR with unexplained production drops.",
        options: ["True", "False"],
        correctAnswer: "false"
      }
    ],
    shortAnswers: [
      {
        prompt: "Explain how you would reconcile a DPR event log with a Work Completion Status sheet to validate claimed progress.",
        modelPoints: [
          "Compare DPR entries to completion status dates",
          "Verify activity codes match work descriptions",
          "Check production quantities align",
          "Identify discrepancies",
          "Request clarification or corrections"
        ],
        points: 5
      }
    ]
  },

  // Module 27: Weather Downtime & Metocean Evidence
  {
    id: 27,
    title: "Weather Downtime & Metocean Evidence",
    description: "Record metocean, declare WOW, and justify EOT/standby. Ensure contemporaneous records with limits and timestamps.",
    learningOutcomes: [
      "Record metocean data contemporaneously",
      "Declare WOW based on criteria, not perception",
      "Link weather data to activity impact",
      "Justify EOT claims with evidence"
    ],
    content: `# Weather Downtime & Metocean Evidence

## WOW Declaration

### Requirements
- Based on criteria/limits, not perception
- Contemporaneous records
- Timestamps and parameters
- Activity impact linkage
- Signatures/authentication

## Metocean Parameters

### Typical Recording
- Wind speed and direction
- Wave height (Hs) and period
- Pressure
- Visibility
- Comments on conditions

## Evidence for EOT

### Required Elements
- Weather logs with timestamps
- Limits and criteria
- Activity impact description
- Forecast comparison
- Vessel sensor data where available`,
    mcqs: [
      {
        prompt: "Weather downtime entries must be contemporaneous and include wind, wave, pressure, and comments.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "WOW should be declared based on crew perception only.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "WOW must be based on criteria/limits, not just perception."
      },
      {
        prompt: "Significant wave height is typically recorded hourly during WOW.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ]
  },

  // Module 28: Management of Change (Operational)
  {
    id: 28,
    title: "Management of Change (Operational)",
    description: "Trigger, assess, approve, and implement MoC in field. Verify risk assessment, approvals, and implementation.",
    learningOutcomes: [
      "Identify MoC triggers",
      "Assess risk impact of changes",
      "Obtain appropriate approvals",
      "Verify implementation and effectiveness"
    ],
    content: `# Management of Change (Operational)

## MoC Triggers

### Common Triggers
- Procedural deviation
- Equipment substitution
- New hazards identified
- Certificate lapse
- SIMOPS change
- Weather exceedance

## MoC Package

### Required Elements
- Reason for change
- Risk assessment
- Affected procedures
- Approvals (offshore/onshore)
- Implementation plan
- Verification method

## Implementation

### Steps
1. Obtain approvals
2. Brief personnel
3. Update procedures
4. Implement with controls
5. Verify effectiveness
6. Close out with documentation`,
    mcqs: [
      {
        prompt: "MoC is required for procedural deviation, equipment substitution, or new hazards.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Verbal approval is sufficient for MoC.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "MoC requires formal approval, not just verbal."
      },
      {
        prompt: "All MoCs must be closed out with verification of effectiveness.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ],
    scenarios: [
      {
        title: "Equipment Recovery Method Change",
        description: "Equipment recovery method altered with a new frame—draft a MoC summary.",
        task: "Document reason, assess risk, obtain approvals, plan implementation, and define verification.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 29: Task Plans & Method Control
  {
    id: 29,
    title: "Task Plans & Method Control",
    description: "Assure scope, constraints, permits, exclusion zones, comms, and survey metadata. Verify cross-references and handover data.",
    learningOutcomes: [
      "Verify task plan completeness",
      "Check constraints and exclusion zones",
      "Ensure proper cross-references",
      "Verify survey metadata and handover data"
    ],
    content: `# Task Plans & Method Control

## Task Plan Requirements

### Essential Elements
- Cross-reference to governing procedure
- Permit references
- Constraints (UXO, depth, exclusion radii)
- Tension/hold points
- Rendering limits
- DP headings and blow-off positions

## Survey Metadata

### Handover Data Needs
- Pre-survey requirements
- Post-survey deliverables
- Calibration references
- Metadata requirements
- QC and verification needs`,
    mcqs: [
      {
        prompt: "Task plans should cross-reference the governing procedure and permits.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Constraints like UXO clearance, depth limits, and exclusion radii must be explicit.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Shore-side approvals eliminate the need for toolbox talks.",
        options: ["True", "False"],
        correctAnswer: "false"
      }
    ]
  },

  // Module 30: Work Completion Status Dashboards
  {
    id: 30,
    title: "Work Completion Status Dashboards",
    description: "Read status tables, cross-check with DPR and survey data. Verify completion claims and outstanding deliverables.",
    learningOutcomes: [
      "Read and interpret status dashboards",
      "Cross-check with DPR entries",
      "Identify outstanding deliverables",
      "Verify completion claims"
    ],
    content: `# Work Completion Status Dashboards

## Status Dashboard Elements

### Typical Content
- Strings/routes with status
- CL1/CL2/Wings/Laydowns
- Completion dates
- Outstanding deliverables
- "Awaiting data" flags

## Verification

### Cross-Checking
- Status dates match DPR entries
- Completion claims supported
- Outstanding items identified
- Deliverables tracked`,
    mcqs: [
      {
        prompt: "A status sheet that shows CL1/CL2/Wings/Laydowns should tie to dated DPR entries.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "\"Awaiting data\" flags drive CR actions to request outstanding deliverables before acceptance.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "The CR should approve cable lay completion without UXO certificates.",
        options: ["True", "False"],
        correctAnswer: "false"
      }
    ]
  },

  // Module 31: SIMOPS Matrix & Risk Assessment (JRA)
  {
    id: 31,
    title: "SIMOPS Matrix & Risk Assessment (JRA)",
    description: "Apply base-case prohibitions/restrictions and manage deviations via MoC. Verify JRA quality and controls linkage.",
    learningOutcomes: [
      "Understand SIMOPS matrix structure",
      "Apply base-case restrictions",
      "Verify JRA quality and controls",
      "Manage SIMOPS changes via MoC"
    ],
    content: `# SIMOPS Matrix & Risk Assessment (JRA)

## SIMOPS Matrix

### Base-Case Controls
- Prohibitions and restrictions
- Emergency primacy
- Exclusion zones
- Communication requirements
- PTW linkage

## JRA Quality

### Indicators
- Hazards → causes → existing controls → residual risk
- Additional controls identified
- Verification/monitoring defined
- MoC triggers specified

## Change Management

### Process
- SIMOPS changes via MoC
- Competent review required
- Cannot be unilaterally relaxed
- Documented in SIMOPS log`,
    mcqs: [
      {
        prompt: "SIMOPS matrices are static and cannot be changed.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "SIMOPS can be changed via MoC and competent review."
      },
      {
        prompt: "JRA quality is shown by linking hazards → causes → existing controls → residual risk.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "The CR can unilaterally relax SIMOPS restrictions offshore.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "SIMOPS changes must follow governance/MoC process."
      }
    ],
    scenarios: [
      {
        title: "Cable Lay SIMOPS",
        description: "Cable lay at an OSS with multiple vessels—build a SIMOPS plan excerpt.",
        task: "Define roles, comms, exclusion zones, restricted activities, emergency primacy, and PTW links.",
        difficulty: "advanced"
      }
    ]
  },

  // Module 32: Client Representative Briefing & Handover Discipline
  {
    id: 32,
    title: "Client Representative Briefing & Handover Discipline",
    description: "Conduct structured briefings and handovers; validate readiness inputs. Verify worksite, vessel, equipment, and contacts.",
    learningOutcomes: [
      "Conduct comprehensive CR onboarding briefs",
      "Verify all readiness inputs",
      "Document priorities for single CR operations",
      "Ensure proper handover between CRs"
    ],
    content: `# Client Representative Briefing & Handover Discipline

## Complete Briefing Requirements

### Essential Elements
- Worksite overview and maps/routes
- Vessel capability and DP class
- Equipment inventory and specialists
- Weather/tide limits
- SIMOPS plan and roles
- Contacts and comms
- Scope and variations
- Permits and approvals
- Proximity limits
- Free-issue equipment controls

## Single CR Operations

### Priorities
- Document priorities when reduced to one CR
- Agree coverage with onshore
- Define escalation paths
- Maintain critical oversight`,
    mcqs: [
      {
        prompt: "A complete CR onboarding brief must include: worksite overview, vessel capability, equipment inventory, weather/tide limits, SIMOPS, contacts.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "The CR can commence without contract scope/variation pack.",
        options: ["True", "False"],
        correctAnswer: "false"
      },
      {
        prompt: "Briefing records must be retained and handed over between CRs.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ],
    shortAnswers: [
      {
        prompt: "List five briefing elements you will verify before accepting duty as sole CR.",
        modelPoints: [
          "Worksite maps/routes",
          "Vessel capability & DP class",
          "Equipment & specialists",
          "Weather/tide limits",
          "SIMOPS plan/roles",
          "Contacts & comms",
          "Scope/variations",
          "Permits/approvals",
          "Proximity limits",
          "Free-issue controls"
        ],
        points: 5
      }
    ]
  },

  // Module 33: Metocean: Significant Wave Height (Hs) & Operational Limits
  {
    id: 33,
    title: "Metocean: Significant Wave Height (Hs) & Operational Limits",
    description: "Interpret Hs, Hmax, and apply limits to operations and WOW claims. Understand wave statistics and stability windows.",
    learningOutcomes: [
      "Understand Hs and Hmax definitions",
      "Apply operational limits correctly",
      "Build WOW evidence packs",
      "Justify EOT claims with met data"
    ],
    content: `# Metocean: Significant Wave Height (Hs) & Operational Limits

## Wave Height Definitions

### Significant Wave Height (Hs)
- Average height of highest one-third of waves
- Primary parameter for operational limits
- Measured by sensors and visual observation

### Maximum Wave Height (Hmax)
- Commonly approximated as ~2×Hs
- Individual waves can exceed limit
- Three occurrences of ~2×Hs expected in 24h

## Operational Limits

### Application
- Task limits based on Hs
- Consider crest-trough variability
- Stability windows required for restart
- Period and directionality matter for transfers`,
    mcqs: [
      {
        prompt: "Significant wave height Hs represents the average height of the highest one-third of waves.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "If Hs reduces below limit for 10 minutes, critical diving operations may resume immediately.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Stability window and procedures required before restart."
      },
      {
        prompt: "For small boat transfers, period and directionality can be as critical as Hs.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ],
    scenarios: [
      {
        title: "Hs Window Management",
        description: "Limit exceeded during transfer; compile WOW log, decision points, and restart criteria.",
        task: "Document WOW period with Hs data, decision points, and restart criteria aligned to procedures.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 34: Offshore Diving (ACOP-style) for Client Representatives
  {
    id: 34,
    title: "Offshore Diving (ACOP-style) for Client Representatives",
    description: "Recognise CR duties vs. diving contractor duties; assure compliance to plan. Verify diving project plan, DP procedures, and emergency response.",
    learningOutcomes: [
      "Distinguish CR duties from diving contractor duties",
      "Verify diving project plan approval",
      "Assure DP procedures for diving",
      "Verify emergency response readiness"
    ],
    content: `# Offshore Diving (ACOP-style) for Client Representatives

## Diving Project Plan

### Mandatory Elements
- Approved diving operations plan
- Risk assessment
- Emergency response procedures
- DCI/DDD pathways
- Medical support arrangements

## CR Role Boundaries

### CR Duties
- Verify plan approval
- Assure compliance
- Monitor operations
- Document observations

### NOT CR Duties
- Direct diving supervisor operations
- Manage diving control panel
- Make diving medical decisions`,
    mcqs: [
      {
        prompt: "The diving project plan and risk assessment are mandatory and must be approved per governance.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "The CR may direct the diving supervisor's control panel operations.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "CR verifies compliance but does not direct diving operations."
      },
      {
        prompt: "Diving from DP vessels requires procedures addressing station keeping and loss-of-position.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ],
    scenarios: [
      {
        title: "Diving ACOP Deviation",
        description: "Supervisor proposes altered O2 set-points; trigger MoC and seek diving medical/supervisory approval paths.",
        task: "Document CR role boundaries, trigger MoC, and seek appropriate diving medical/supervisory approvals.",
        difficulty: "advanced"
      }
    ]
  },

  // Module 35: Geophysical Survey Governance: UXO & Boulders
  {
    id: 35,
    title: "Geophysical Survey Governance: UXO & Boulders (Pre-Lay/Repair)",
    description: "Assure hazard registers, survey design, data quality, and reporting. Verify DQOs, EVT records, and deliverables.",
    learningOutcomes: [
      "Verify UXO/boulder hazard registers",
      "Assess survey design and DQOs",
      "Verify data quality and EVT records",
      "Accept deliverables based on objective evidence"
    ],
    content: `# Geophysical Survey Governance: UXO & Boulders

## Hazard Register

### Requirements
- UXO/boulder risk management
- Risk tolerance definition
- Detection objectives
- Equipment performance specifications

## Data Quality Objectives (DQOs)

### Essential Elements
- Detection objectives
- Equipment performance
- QC requirements
- Metadata standards
- EVT records

## Deliverables

### Acceptance Criteria
- DQOs met
- EVT records complete
- Metadata present
- Repeatability demonstrated
- Audit trail available`,
    mcqs: [
      {
        prompt: "UXO/boulder risk management starts with a hazard register and risk tolerance definition.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Procurement and DQOs are irrelevant to dataset provenance.",
        options: ["True", "False"],
        correctAnswer: "false"
      },
      {
        prompt: "CR acceptance should check skillsets/competence stated for each phase.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ],
    scenarios: [
      {
        title: "UXO/Boulder Survey Acceptance",
        description: "Dataset lacks DQO and EVT; reject acceptance, request rework.",
        task: "Document deficiencies, reject acceptance, and request rework with DQO and EVT.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 36: Cable Repair Readiness
  {
    id: 36,
    title: "Cable Repair Readiness (Generic Power/Export/Array)",
    description: "Plan repair scenarios, facilities, permits, de-/re-burial and protection. Verify readiness gates and consents.",
    learningOutcomes: [
      "Understand repair planning gates",
      "Verify facility and spares readiness",
      "Confirm permits and consents",
      "Plan de-/re-burial and protection"
    ],
    content: `# Cable Repair Readiness

## Planning Gates

### Typical Gates
- HS&E approval
- Permitting complete
- Fault location confirmed
- Facility selected
- Execution planning approved

## Repair Methods

### De-/Re-Burial Options
- Jetting
- Mass-flow excavation
- Split pipe protection
- Mattresses
- Rock placement

## Readiness Verification

### Key Checks
- Repair facility ready
- Spares available
- Specialist personnel onboard
- Consents/licences confirmed
- Support vessels arranged`,
    mcqs: [
      {
        prompt: "Typical repair planning gates include HS&E, permitting, fault location, facility selection, and execution planning.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Jetting and mass-flow excavation are never used for de-/re-burial.",
        options: ["True", "False"],
        correctAnswer: "false"
      },
      {
        prompt: "The CR should verify readiness of repair facility, spares, and specialist personnel.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ],
    scenarios: [
      {
        title: "Cable Repair Gate Readiness",
        description: "Missing consent and split-pipe stock; halt, raise MoC, confirm permits, re-baseline schedule.",
        task: "Identify missing elements, halt work, raise MoC, confirm permits, and re-baseline schedule.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 37: Safety Zones & Offshore Installations
  {
    id: 37,
    title: "Safety Zones & Offshore Installations (Awareness)",
    description: "Apply 500-m zones, exceptions, and penalties; integrate in SIMOPS. Understand entry requirements and penalties.",
    learningOutcomes: [
      "Understand 500-m safety zone requirements",
      "Identify authorized entry exceptions",
      "Integrate zones in SIMOPS planning",
      "Track zone encroachments"
    ],
    content: `# Safety Zones & Offshore Installations

## 500-Meter Safety Zones

### Standard Zones
- Extend 500m from any part of installation above sea level
- Can be established for subsea installations by order
- Marked by light buoys where applicable

### Entry Requirements
- Clear authority required
- Comms with installation/marine control
- Authorized activities (pipeline/cable work, distress)
- Penalties for unauthorized entry

## SIMOPS Integration

### Requirements
- Track zone encroachments
- Coordinate with marine control
- Update charts and Notices to Mariners
- Manage approach and entry`,
    mcqs: [
      {
        prompt: "Standard safety zones extend 500 m from any part of an installation above sea level.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Entry is permitted for authorised activities such as pipeline/cable work or distress.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "CRs do not need to track zone encroachments during SIMOPS.",
        options: ["True", "False"],
        correctAnswer: "false"
      }
    ],
    scenarios: [
      {
        title: "Safety Zone Incursion",
        description: "Third-party vessel crosses 500-m zone; evidence capture, notifications, and SIMOPS update.",
        task: "Capture evidence, notify relevant parties, and update SIMOPS plan.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 38: MODU Code (Awareness for CRs)
  {
    id: 38,
    title: "MODU Code (Awareness for CRs)",
    description: "Understand interfaces with self-elevating/column-stabilised/surface units. Align SIMOPS and permits with MODU operational manuals.",
    learningOutcomes: [
      "Understand MODU Code requirements",
      "Align SIMOPS with MODU operations",
      "Verify compliance with operational manuals",
      "Coordinate with MODU-specific requirements"
    ],
    content: `# MODU Code (Awareness for CRs)

## MODU Code Overview

### Scope
- International standards for mobile drilling units
- Design and equipment requirements
- Dynamic positioning systems
- Hazardous area classifications
- Life-saving appliances
- Helicopter facilities

## CR Interface

### Alignment Requirements
- SIMOPS plans align with MODU manuals
- Permits compatible with MODU procedures
- Emergency procedures coordinated
- Records and drills verified`,
    mcqs: [
      {
        prompt: "The MODU Code sets international standards for design/equipment of mobile drilling units.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "CRs should align SIMOPS and permits with MODU operational manuals where applicable.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "The Code replaces all national regulations automatically.",
        options: ["True", "False"],
        correctAnswer: "false"
      }
    ]
  },

  // Module 39: Inspector Competence Pathways
  {
    id: 39,
    title: "Inspector Competence Pathways (Awareness)",
    description: "Understand certification categories relevant to underwater inspection. Verify competence certificates and validity periods.",
    learningOutcomes: [
      "Understand inspector certification categories",
      "Verify competence certificates",
      "Check validity periods",
      "Ensure appropriate certification for work"
    ],
    content: `# Inspector Competence Pathways

## Certification Categories

### Diver Inspectors
- Grade 3.1U: Underwater structural inspection
- Grade 3.2U: Enhanced requirements including colour vision

### ROV Inspectors
- Grade 3.3U: ROV inspection operations
- Grade 3.4U: Underwater Inspection Controller (topside)

## Verification

### CR Checks
- Certificate validity
- Appropriate grade for work
- Vision requirements met
- Health fitness current`,
    mcqs: [
      {
        prompt: "Diver Inspector Grades 3.1U and 3.2U address underwater structural inspection.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "CRs should verify competence certificates and validity periods.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Vision requirements and health fitness are not part of certification.",
        options: ["True", "False"],
        correctAnswer: "false"
      }
    ]
  },

  // Module 40: Decommissioning Fundamentals
  {
    id: 40,
    title: "Decommissioning Fundamentals (Awareness)",
    description: "Understand policy principles, OSPAR 98/3 context, surveys, and monitoring. Apply waste hierarchy and verify clear seabed.",
    learningOutcomes: [
      "Understand decommissioning policy principles",
      "Apply OSPAR 98/3 requirements",
      "Verify survey and monitoring requirements",
      "Apply waste hierarchy"
    ],
    content: `# Decommissioning Fundamentals

## Policy Principles

### Key Principles
- Precautionary approach
- Clear seabed target
- Polluter pays
- Comparative assessment

## OSPAR 98/3

### Requirements
- Prohibits dumping/leave-in-place by default
- Subject to derogation
- Comparative assessment required
- Monitoring and reporting

## Surveys

### Typical Requirements
- Pipeline debris clearance: 50m each side (100m total)
- Verification of clear seabed
- Independent survey
- Evidence logged and retained`,
    mcqs: [
      {
        prompt: "Policy aims include a precautionary approach targeting a clear seabed and \"polluter pays\".",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Pipeline debris clearance surveys commonly span 50 m either side (100 m total) where specified.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "The CR can authorise derogation decisions at site.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Derogation decisions follow regulator/operator process."
      }
    ]
  },

  // Module 41: Decommissioning Operations
  {
    id: 41,
    title: "Decommissioning Operations (Field Execution)",
    description: "Plan and assure subsea/deck decommissioning phases, surveys, and waste pathways. Verify sequence and waste hierarchy compliance.",
    learningOutcomes: [
      "Understand decommissioning sequence",
      "Apply waste hierarchy",
      "Verify survey requirements",
      "Assure monitoring compliance"
    ],
    content: `# Decommissioning Operations (Field Execution)

## Typical Sequence

### Phases
- Surveys
- Isolations
- Topside/jacket removal or partial removal
- Well/P&A
- Debris clearance
- Post-decom monitoring

## Waste Hierarchy

### Priority Order
1. Reduce
2. Re-use
3. Recycle
4. Recover
5. Dispose

## Verification

### Clear Seabed
- Independent survey
- Evidence logged and retained
- Monitoring as required`,
    mcqs: [
      {
        prompt: "A typical offshore decommissioning sequence includes surveys, isolations, topsides/jacket removal or partial removal, well/P&A, debris clearance, and post-decom monitoring.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Waste hierarchy onshore should follow reduce→re-use→recycle→recover→dispose.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Debris clearance is limited to 10 m each side of pipeline route by default.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "Commonly ~50m each side unless specified otherwise."
      }
    ]
  },

  // Module 42: Deposits on the Seabed
  {
    id: 42,
    title: "Deposits on the Seabed (Generic Consent Template Awareness)",
    description: "Understand deposit consent application structure and evidence. Verify coordinates, drawings, and document control.",
    learningOutcomes: [
      "Understand consent application structure",
      "Verify coordinate format (WGS84)",
      "Check drawings and document control",
      "Ensure completeness of submission"
    ],
    content: `# Deposits on the Seabed

## Application Structure

### Required Elements
- Project overview
- Coordinates in WGS84 format
- Drawings (high-resolution)
- PWA/Pipelines references
- Environmental considerations
- Document control (revisions, approvals)

## Coordinate Format

### Requirements
- WGS84 format
- Consistency throughout
- Permanent and temporary deposits distinguished
- Route drawings included`,
    mcqs: [
      {
        prompt: "Applications generally require project overview, coordinates in WGS84, drawings, PWA/Pipelines references, and environmental considerations.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Coordinate format consistency is optional.",
        options: ["True", "False"],
        correctAnswer: "false"
      }
    ],
    scenarios: [
      {
        title: "Deposit Consent Pack",
        description: "Build a neutral, complete deposit consent application section with WGS84 coordinate set and route drawings.",
        task: "Prepare complete application with all required elements, coordinates, and drawings.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 43: Offshore Marine Operations (GOMO-style)
  {
    id: 43,
    title: "Offshore Marine Operations (GOMO-style) Awareness for CRs",
    description: "Apply voyage-phase best practice, roles, comms, and safety-zone entry checks. Verify compliance with guidance.",
    learningOutcomes: [
      "Understand voyage-phase guidance",
      "Apply safety-zone entry checks",
      "Verify collision-risk management",
      "Ensure vessel documentation compliance"
    ],
    content: `# Offshore Marine Operations (GOMO-style)

## Voyage Phases

### Guidance Coverage
- Mobilisation
- Transit
- Approach
- Working alongside
- Discharge
- Demobilisation

## Safety-Zone Entry

### Checklist Requirements
- Clear authority
- Comms established
- DP references verified
- Collision-risk assessment
- Approach protocol followed`,
    mcqs: [
      {
        prompt: "GOMO maps guidance to voyage phases from mobilisation through discharge.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Collision risk management includes 500-m zone controls and approach protocols.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "CRs should ensure vessel documentation and competency comply with guidance and contract.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ]
  },

  // Module 44: Dynamic Positioning (IMO MSC/Circ.645)
  {
    id: 44,
    title: "Dynamic Positioning (IMO MSC/Circ.645) – Classes & Ops",
    description: "Understand DP equipment classes, functional and operational requirements. Verify FSVAD and class compliance.",
    learningOutcomes: [
      "Understand DP equipment classes",
      "Verify FSVAD compliance",
      "Assess functional requirements",
      "Verify operational procedures"
    ],
    content: `# Dynamic Positioning (IMO MSC/Circ.645)

## Equipment Classes

### Class 1
- No redundancy
- Single failure can cause loss of position

### Class 2
- Redundant systems
- Single failure does not cause loss of position

### Class 3
- Redundant systems with segregation
- Fire/flood protection
- Single failure including fire/flood does not cause loss

## FSVAD

### Flag State Verification
- Documents compliance and testing
- Required for DP operations
- Must be current and valid`,
    mcqs: [
      {
        prompt: "Equipment classes address redundancy: Class 1 (no redundancy), Class 2 (redundant systems), Class 3 (segregation/fire/flood protection).",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "For diving operations, DP class selection has no bearing.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "DP class is critical to diving risk assessment."
      },
      {
        prompt: "Power/Thruster segregation for Class 3 mitigates common-mode failures such as fire/flood.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ],
    scenarios: [
      {
        title: "DP Class Selection for Diving",
        description: "Proposed Class 1 DP for dive spread; build risk case, reference class requirements, and document stop/hold.",
        task: "Assess risk, reference class requirements, and document decision to stop/hold if inadequate.",
        difficulty: "advanced"
      }
    ]
  },

  // Module 45: 500-m Safety Zone Operations
  {
    id: 45,
    title: "500-m Safety Zone Operations (Practice)",
    description: "Manage approach, entry, DP references, trigger points, and roles. Apply good practice for zone operations.",
    learningOutcomes: [
      "Manage zone entry procedures",
      "Verify DP references and health",
      "Apply trigger points appropriately",
      "Coordinate with marine control"
    ],
    content: `# 500-m Safety Zone Operations (Practice)

## Entry Requirements

### Pre-Entry
- Clear authority obtained
- Comms with installation/marine control
- DP references selected and verified
- Approach checklist completed

## Trigger Points

### Environmental/Operational
- Prompt review/hold of activities
- Defined limits and criteria
- Decision points documented

## Good Practice

### Approach
- Pre-entry checklists
- Approach passages
- Working alongside protocols
- Exit procedures`,
    mcqs: [
      {
        prompt: "Entry to the 500-m zone requires clear authority and comms with the installation/marine control.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "DP reference selection and health are secondary to operations.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "DP references are critical to safe operations."
      },
      {
        prompt: "Crew are permitted to cross safety barriers during helo ops if in a hurry.",
        options: ["True", "False"],
        correctAnswer: "false"
      }
    ],
    scenarios: [
      {
        title: "500-m Zone Breach",
        description: "A supply vessel drifts inside the zone during crane ops; capture evidence, enact collision-risk response, and revise approach controls.",
        task: "Document breach, initiate collision-risk response, and revise approach controls.",
        difficulty: "advanced"
      }
    ]
  },

  // Module 46: ISSOW / Work Control Certificates
  {
    id: 46,
    title: "ISSOW / Work Control Certificates (Permit Quality)",
    description: "Assure permit content, authorisations, specific/standard controls, and declarations. Verify permit quality and evidence.",
    learningOutcomes: [
      "Verify permit content completeness",
      "Check authorisations and history",
      "Ensure specific controls for diving/ROV",
      "Verify work party declarations"
    ],
    content: `# ISSOW / Work Control Certificates

## Permit Content

### Required Elements
- Task description and area
- Isolations verified
- Risk level
- Cross-references
- Authorisation history
- Specific controls
- Work party declarations

## Specific Controls

### Diving/ROV
- Adverse weather checks
- DP comms verification
- Emergency procedures
- Equipment status

## Evidence

### Quality Standards
- Contemporaneous
- Legible
- Traceable
- Audit-ready`,
    mcqs: [
      {
        prompt: "A WCC should define task description/area, isolations, risk level, cross-references and authorisation history.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Specific controls for diving/ROV and adverse weather are optional.",
        options: ["True", "False"],
        correctAnswer: "false"
      },
      {
        prompt: "Work party declarations confirm understanding of controls before work starts.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ],
    scenarios: [
      {
        title: "Permit Weakness",
        description: "ISSOW lacks adverse weather and DP comms checks for DSV dive support; reject and re-issue with specific controls.",
        task: "Identify deficiencies, reject permit, and require re-issue with specific controls.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 47: Helicopter Operations
  {
    id: 47,
    title: "Helicopter Operations (Management & Standards)",
    description: "Apply helideck ops management guidance and CAP standards for landing areas. Verify responsibilities, comms, and facilities.",
    learningOutcomes: [
      "Understand helideck management responsibilities",
      "Verify CAP standards compliance",
      "Check met/motion reporting",
      "Ensure fuelling and lighting standards"
    ],
    content: `# Helicopter Operations (Management & Standards)

## Responsibilities

### Installation Dutyholders
- Helideck facilities
- Operating management
- HLO/HDA competence
- Inspections and audits

## CAP Standards

### Coverage
- Physical characteristics
- Lighting (status, perimeter, TD/PM circles)
- Rescue/firefighting
- Met observations
- Motion reporting
- Fuelling

## Met Reporting

### Required Content
- Wind speed and direction
- Visibility
- Cloud base
- Pressure
- Significant wave height (Hs)
- Motion (if applicable)`,
    mcqs: [
      {
        prompt: "Offshore helideck management guidance defines responsibilities, comms, radio procedures, and security.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "HLO/HDA competence and inspections/audits are optional.",
        options: ["True", "False"],
        correctAnswer: "false"
      },
      {
        prompt: "Fuel quality control, sampling, and documentation are discretionary.",
        options: ["True", "False"],
        correctAnswer: "false"
      }
    ],
    scenarios: [
      {
        title: "Heliops Near Miss",
        description: "Passenger crosses barrier during rotors running; implement corrective actions, update briefing and access control.",
        task: "Document incident, implement corrective actions, and update procedures.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 48: Helicopter Familiarisation
  {
    id: 48,
    title: "Helicopter Familiarisation: Airframe, Approach Sectors, Cabin Layout",
    description: "Recognise hazard areas, safe approach, exits/floats, and cabin constraints to support site rules and passenger briefings.",
    learningOutcomes: [
      "Identify helicopter hazard areas",
      "Understand safe approach sectors",
      "Recognise cabin exits and emergency equipment",
      "Support passenger briefings"
    ],
    content: `# Helicopter Familiarisation

## Hazard Areas

### Danger Sectors
- Tail rotor (extreme danger)
- Engine exhaust
- Main rotor disc
- Must be avoided unless specifically instructed

## Safe Approach

### Green Sectors
- Designated safe approach areas
- Marshaller clearance required
- Crouch, visible to pilot
- Loose items carried low

## Cabin Layout

### Emergency Equipment
- Pop-out floats
- Liferaft jettison handles
- Emergency exits
- Jettison windows
- Locations vary by aircraft type`,
    mcqs: [
      {
        prompt: "The safest passenger approach sector to a helicopter on deck is normally within the designated green sectors indicated by helideck procedures, with marshaller clearance.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Tail rotor and engine exhaust sectors are designated danger areas and must be avoided unless specifically instructed.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Cabin emergency exits and jettison windows vary by type; briefing must point out locations and operation before flight.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ],
    scenarios: [
      {
        title: "Heli Embarkation Breach",
        description: "Passenger moves into danger sector toward tail rotor; write immediate controls, re-brief, and procedural changes.",
        task: "Document incident, implement immediate controls, re-brief passengers, and update procedures.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 49: Helideck Passenger Management
  {
    id: 49,
    title: "Helideck Passenger Management & Heli-Ops Interface",
    description: "Apply landing area housekeeping, access control, fuelling, met/motion reporting, and crane restrictions.",
    learningOutcomes: [
      "Manage helideck access control",
      "Verify fuelling procedures",
      "Ensure met/motion reporting",
      "Coordinate crane operations"
    ],
    content: `# Helideck Passenger Management

## Access Control

### Requirements
- Barriers closed during rotors-running
- Authorized access only
- HLO/HDA control
- No movement without instruction

## Fuelling

### Requirements
- Quality control
- Bonding/earthing
- Trained personnel
- Fire cover
- Documentation

## Crane Operations

### Restrictions
- No slewing within protected surfaces
- Hook must be landed
- Clearance rules followed`,
    mcqs: [
      {
        prompt: "Access to the helideck is controlled; barriers closed during rotors-running unless authorised.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Crane slewing within helideck protected surfaces is permitted if the hook is landed.",
        options: ["True", "False"],
        correctAnswer: "false"
      },
      {
        prompt: "Briefings must reference approach/avoid sectors for the specific aircraft type.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ]
  },

  // Module 50: ISM Code for Client Representatives
  {
    id: 50,
    title: "ISM Code for Client Representatives (Interface & Assurance)",
    description: "Understand SMS elements, documents, roles (Master authority, DPA), audits, non-conformities. Verify SMS implementation.",
    learningOutcomes: [
      "Understand ISM Code objectives",
      "Verify SMS implementation",
      "Check Master's authority statement",
      "Verify DPA access and non-conformity management"
    ],
    content: `# ISM Code for Client Representatives

## ISM Objectives

### Primary Goals
- Safety at sea
- Prevention of injury/loss of life
- Protection of the environment

## Safety Management System (SMS)

### Required Elements
- Procedures
- Defined authority/communication lines
- Accident reporting
- Emergency response
- Internal audits

## Key Roles

### Master's Authority
- Overriding authority for safety
- Must be explicitly stated in SMS
- Pollution prevention decisions

### Designated Person Ashore (DPA)
- Link between ship and company
- Access to top management
- SMS oversight`,
    mcqs: [
      {
        prompt: "The ISM Code's objectives include safety at sea, prevention of injury/loss of life, and protection of the environment.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "The Master's overriding authority to make decisions for safety and pollution prevention must be explicitly stated in the SMS.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "A valid SMC removes the need to check operational practices.",
        options: ["True", "False"],
        correctAnswer: "false",
        explanation: "SMC validity does not eliminate need to verify practices."
      }
    ],
    scenarios: [
      {
        title: "ISM Assurance Gap",
        description: "Vessel SMC valid but drills and non-conformity reporting weak; document findings and corrective actions.",
        task: "Document SMS gaps, raise site instruction, and develop assurance plan.",
        difficulty: "intermediate"
      }
    ]
  },

  // Module 51: Vessel Assurance Schemes
  {
    id: 51,
    title: "Vessel Assurance Schemes: CMID / OVID / OVIQ (Awareness)",
    description: "Distinguish schemes, scope, supplements, report handling, and inspector conduct. Verify report validity and reconcile with project needs.",
    learningOutcomes: [
      "Distinguish CMID, OVID, and OVIQ",
      "Verify report validity and accreditation",
      "Reconcile reports with project needs",
      "Check inspector conduct and objective evidence"
    ],
    content: `# Vessel Assurance Schemes

## CMID (Common Marine Inspection Document)

### Framework
- Industry vessel inspection framework
- Supplements (DP, DSV, cable-lay, helicopter ops)
- Accredited inspectors only
- Official database upload required

## OVID (Offshore Vessel Inspection Database)

### System
- Web-based inspection tool
- Repository of reports
- OVIQ questionnaire
- OVPQ for vessel particulars

## Report Validity

### Requirements
- Uploaded by accredited inspectors
- Objective evidence used
- Distribution lists defined
- Inspectors cannot give acceptability opinions`,
    mcqs: [
      {
        prompt: "CMID is an industry vessel inspection framework with supplements (e.g., DP, DSV, cable-lay, helicopter ops).",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Only reports uploaded by accredited inspectors into the official database are recognised as valid CMID reports.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "Inspectors must use objective evidence; crew assurance alone is insufficient.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ],
    scenarios: [
      {
        title: "CMID vs OVID Reconciliation",
        description: "Selecting a cable-lay DP vessel; compare latest CMID supplement vs OVID/OVIQ DP chapter, extract critical gaps and acceptance conditions.",
        task: "Compare reports, identify gaps, and define acceptance conditions.",
        difficulty: "advanced"
      }
    ]
  },

  // Module 52: Terminology & Acronyms
  {
    id: 52,
    title: "Terminology & Acronyms (Competence Check)",
    description: "Ensure common language across marine/diving/project controls. Verify understanding of key terms and acronyms.",
    learningOutcomes: [
      "Understand key terminology",
      "Recognize common acronyms",
      "Apply terms correctly in context",
      "Communicate effectively with stakeholders"
    ],
    content: `# Terminology & Acronyms

## Key Acronyms

### Project Controls
- **DPA**: Designated Person Ashore
- **SIMOPS**: Simultaneous Operations
- **MoC**: Management of Change
- **HIRA/TRA**: Hazard Identification & Risk Assessment / Task Risk Assessment

### Vessel Assurance
- **CMID**: Common Marine Inspection Document
- **OVID**: Offshore Vessel Inspection Database
- **OVIQ**: Offshore Vessel Inspection Questionnaire
- **OVPQ**: Offshore Vessel Particulars Questionnaire

### Operations
- **ISSOW**: Integrated Safe System of Work
- **POB**: Personnel On Board
- **DP**: Dynamic Positioning
- **ASOG/CAM/TAM**: Activity/Consequence/Task Appropriate Modes

### Helicopter
- **CAP**: Standards document for landing area guidance
- **HEED**: Helicopter Emergency Egress Device
- **HLO/HDA**: Helicopter Landing Officer / Helicopter Deck Assistant`,
    mcqs: [
      {
        prompt: "DPA stands for Designated Person Ashore.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "SIMOPS means Simultaneous Operations.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "ISSOW refers to Integrated Safe System of Work/Work Control Certificate system.",
        options: ["True", "False"],
        correctAnswer: "true"
      },
      {
        prompt: "CMID is Common Marine Inspection Document.",
        options: ["True", "False"],
        correctAnswer: "true"
      }
    ]
  }
];

// All 52 modules now complete
// Total: 52 modules with 300+ MCQs, short-answer questions, and 22+ scenarios
