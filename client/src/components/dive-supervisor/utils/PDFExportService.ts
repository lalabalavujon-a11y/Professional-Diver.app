/**
 * PDF Export Service
 * 
 * Generates PDF documents for DPRs and dive plans
 * Uses jsPDF for PDF generation
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

export class PDFExportService {
  /**
   * Export DPR to PDF
   */
  static async exportDPR(dpr: DPRData): Promise<Blob> {
    // Dynamic import to avoid loading jsPDF if not needed
    const { default: jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;

    // Title
    doc.setFontSize(18);
    doc.text('Daily Project Report (DPR)', margin, yPos);
    yPos += 10;

    // Report Date
    doc.setFontSize(12);
    doc.text(`Report Date: ${new Date(dpr.reportDate).toLocaleDateString()}`, margin, yPos);
    yPos += 10;

    if (dpr.operationTitle) {
      doc.text(`Operation: ${dpr.operationTitle}`, margin, yPos);
      yPos += 10;
    }

    yPos += 5;

    // Sections
    const sections = [
      { title: 'Weather', content: dpr.reportData.weather },
      { title: 'Sea Conditions', content: dpr.reportData.seaConditions },
      { title: 'Visibility', content: dpr.reportData.visibility },
      { title: 'Work Completed', content: dpr.reportData.workCompleted },
      { title: 'Equipment Used', content: dpr.reportData.equipmentUsed },
      { title: 'Personnel', content: dpr.reportData.personnel },
      { title: 'Hours Worked', content: dpr.reportData.hoursWorked },
      { title: 'Issues Encountered', content: dpr.reportData.issues },
      { title: 'Safety Notes', content: dpr.reportData.safetyNotes },
      { title: 'Next Steps', content: dpr.reportData.nextSteps },
    ];

    doc.setFontSize(10);
    sections.forEach((section) => {
      if (section.content) {
        // Check if we need a new page
        if (yPos > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          yPos = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.text(`${section.title}:`, margin, yPos);
        yPos += 5;

        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(section.content || '', pageWidth - 2 * margin);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 5 + 5;
      }
    });

    // Generate blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }

  /**
   * Export dive plan to PDF
   */
  static async exportDivePlan(plan: any): Promise<Blob> {
    const { default: jsPDF } = await import('jspdf');
    
    const doc = new jsPDF();
    const margin = 20;
    let yPos = margin;

    // Title
    doc.setFontSize(18);
    doc.text('Dive Plan', margin, yPos);
    yPos += 15;

    doc.setFontSize(12);
    if (plan.maxDepth) {
      doc.text(`Max Depth: ${plan.maxDepth}m`, margin, yPos);
      yPos += 7;
    }
    if (plan.bottomTime) {
      doc.text(`Bottom Time: ${plan.bottomTime} minutes`, margin, yPos);
      yPos += 7;
    }

    yPos += 5;

    // Decompression Profile
    if (plan.decompressionProfile && plan.decompressionProfile.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Decompression Profile:', margin, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      plan.decompressionProfile.forEach((stop: any) => {
        doc.text(`  ${stop.depth}m for ${stop.time} minutes`, margin, yPos);
        yPos += 7;
      });
      yPos += 5;
    }

    // Gas Mixtures
    if (plan.gasMixtures && plan.gasMixtures.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Gas Mixtures:', margin, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      plan.gasMixtures.forEach((gas: any) => {
        doc.text(`  ${gas.type}: ${gas.percentage}%`, margin, yPos);
        yPos += 7;
      });
    }

    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }
}







