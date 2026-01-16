import type { GeneratedLesson } from './content-generator';

export type ValidationSeverity = 'critical' | 'warning' | 'info';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: ValidationSeverity;
}

export interface ValidationReport {
  passed: boolean;
  issues: ValidationIssue[];
  complianceScore: number;
}

const BRAND_REGEX = /\b(3m|dewalt|microsoft|google|apple|facebook|instagram|linkedin|twitter|aws|azure)\b/i;
const REQUIRED_SECTIONS = [
  'Industry Standards and Regulations',
  'Core Concepts',
  'Practical Applications',
  'Safety Protocols',
  'Practice Scenarios',
  'Assessment Preparation',
];

export function validateLesson(generated: GeneratedLesson): ValidationReport {
  const issues: ValidationIssue[] = [];

  // Length check
  if (!generated.content || generated.content.length < 1200) {
    issues.push({
      field: 'content',
      message: 'Content is too short; ensure sufficient technical depth.',
      severity: 'critical',
    });
  }

  // Brand neutrality
  if (BRAND_REGEX.test(generated.content)) {
    issues.push({
      field: 'content',
      message: 'Brand references detected; ensure brand-neutral language.',
      severity: 'critical',
    });
  }

  // Required sections
  for (const section of REQUIRED_SECTIONS) {
    if (!generated.content.includes(section)) {
      issues.push({
        field: 'content',
        message: `Missing required section: ${section}`,
        severity: 'warning',
      });
    }
  }

  // Objectives
  if (!generated.objectives || generated.objectives.length < 3) {
    issues.push({
      field: 'objectives',
      message: 'At least 3 learning objectives are required.',
      severity: 'critical',
    });
  }

  // Quiz sanity
  if (!generated.quiz?.questions?.length) {
    issues.push({
      field: 'quiz',
      message: 'Quiz questions missing.',
      severity: 'critical',
    });
  }

  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const warnings = issues.filter((i) => i.severity === 'warning').length;
  const complianceScore = Math.max(0, 100 - criticalCount * 25 - warnings * 5);

  return {
    passed: criticalCount === 0,
    issues,
    complianceScore,
  };
}

export default {
  validateLesson,
};
