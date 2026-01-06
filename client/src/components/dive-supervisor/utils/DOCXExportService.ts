/**
 * DOCX Export Service
 * 
 * Generates DOCX documents for DPRs and dive plans
 * Uses docx library for DOCX generation
 */

export interface DPRData {
  reportDate: string;
  reportData: {
    weather?: string;
    seaConditions?: string;
    visibility?: string;
    workCompleted?: string;
    issues?: string;
    nextSteps?: string;
    safetyNotes?: string;
    equipmentUsed?: string;
    personnel?: string;
    hoursWorked?: string;
  };
  operationTitle?: string;
}

export class DOCXExportService {
  /**
   * Export DPR to DOCX
   */
  static async exportDPR(dpr: DPRData): Promise<Blob> {
    // Dynamic import to avoid loading docx if not needed
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: 'Daily Project Report (DPR)',
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: `Report Date: ${new Date(dpr.reportDate).toLocaleDateString()}`,
            }),
            ...(dpr.operationTitle
              ? [
                  new Paragraph({
                    text: `Operation: ${dpr.operationTitle}`,
                  }),
                ]
              : []),
            new Paragraph({ text: '' }),
            ...this.createSection('Weather', dpr.reportData.weather),
            ...this.createSection('Sea Conditions', dpr.reportData.seaConditions),
            ...this.createSection('Visibility', dpr.reportData.visibility),
            ...this.createSection('Work Completed', dpr.reportData.workCompleted),
            ...this.createSection('Equipment Used', dpr.reportData.equipmentUsed),
            ...this.createSection('Personnel', dpr.reportData.personnel),
            ...this.createSection('Hours Worked', dpr.reportData.hoursWorked),
            ...this.createSection('Issues Encountered', dpr.reportData.issues),
            ...this.createSection('Safety Notes', dpr.reportData.safetyNotes),
            ...this.createSection('Next Steps', dpr.reportData.nextSteps),
          ],
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    return blob;
  }

  /**
   * Create a section with title and content
   */
  private static createSection(title: string, content?: string) {
    const { Paragraph, TextRun, HeadingLevel } = require('docx');
    
    if (!content) return [];
    
    return [
      new Paragraph({
        text: title,
        heading: HeadingLevel.HEADING_2,
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: content,
          }),
        ],
      }),
      new Paragraph({ text: '' }),
    ];
  }

  /**
   * Export dive plan to DOCX
   */
  static async exportDivePlan(plan: any): Promise<Blob> {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');

    const children: any[] = [
      new Paragraph({
        text: 'Dive Plan',
        heading: HeadingLevel.HEADING_1,
      }),
    ];

    if (plan.maxDepth) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Max Depth: ${plan.maxDepth}m`,
              bold: true,
            }),
          ],
        })
      );
    }

    if (plan.bottomTime) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Bottom Time: ${plan.bottomTime} minutes`,
              bold: true,
            }),
          ],
        })
      );
    }

    children.push(new Paragraph({ text: '' }));

    // Decompression Profile
    if (plan.decompressionProfile && plan.decompressionProfile.length > 0) {
      children.push(
        new Paragraph({
          text: 'Decompression Profile',
          heading: HeadingLevel.HEADING_2,
        })
      );
      plan.decompressionProfile.forEach((stop: any) => {
        children.push(
          new Paragraph({
            text: `  ${stop.depth}m for ${stop.time} minutes`,
          })
        );
      });
      children.push(new Paragraph({ text: '' }));
    }

    // Gas Mixtures
    if (plan.gasMixtures && plan.gasMixtures.length > 0) {
      children.push(
        new Paragraph({
          text: 'Gas Mixtures',
          heading: HeadingLevel.HEADING_2,
        })
      );
      plan.gasMixtures.forEach((gas: any) => {
        children.push(
          new Paragraph({
            text: `  ${gas.type}: ${gas.percentage}%`,
          })
        );
      });
    }

    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    return blob;
  }

  /**
   * Import DPR from DOCX file
   * Note: This is a placeholder - full implementation would require parsing DOCX
   */
  static async importDPR(file: File): Promise<DPRData | null> {
    // TODO: Implement DOCX parsing
    // This would require a library like mammoth or docx-parser
    throw new Error('DOCX import not yet implemented');
  }
}


