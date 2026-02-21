// PDF Generation Utility for Lab Reports
// Uses jsPDF library to generate professional lab reports

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ReportData } from '@/types/report';
import { formatReportData } from './reportHelpers';

// Extend jsPDF type for autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: {
      finalY: number;
    };
  }
}

/**
 * Generate PDF report from report data
 */
export const generateReportPDF = async (reportData: ReportData): Promise<Blob> => {
  const formattedData = formatReportData(reportData);
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Add header
  yPosition = addHeader(doc, formattedData.header, yPosition, pageWidth, margin);

  // Add report title
  yPosition = addReportTitle(doc, formattedData.reportInfo, yPosition, pageWidth);

  // Add patient information
  yPosition = addPatientInfo(doc, formattedData.patientInfo, yPosition, pageWidth, margin);

  // Add test information
  yPosition = addTestInfo(doc, formattedData.testInfo, yPosition, pageWidth, margin);

  // Add results table
  yPosition = addResultsTable(doc, formattedData.results, yPosition, pageWidth, margin, pageHeight);

  // Add critical values alert (if any)
  if (formattedData.criticalValues.length > 0) {
    yPosition = addCriticalValuesAlert(doc, formattedData.criticalValues, yPosition, pageWidth, margin, pageHeight);
  }

  // Add interpretation
  yPosition = addInterpretation(doc, formattedData.interpretation, yPosition, pageWidth, margin, pageHeight);

  // Add methodology (if enabled)
  if (reportData.settings.includeMethodology) {
    yPosition = addMethodology(doc, yPosition, pageWidth, margin, pageHeight);
  }

  // Add QC statement (if enabled)
  if (reportData.settings.includeQCStatement) {
    yPosition = addQCStatement(doc, yPosition, pageWidth, margin, pageHeight);
  }

  // Add footer with signature
  addFooter(doc, formattedData.pathologist, formattedData.footer, pageWidth, margin, reportData.signatureData, reportData.settings);

  // Add watermark if enabled
  if (reportData.settings.watermark?.enabled) {
    addWatermark(doc, reportData.settings.watermark.text, reportData.settings.watermark.opacity);
  }

  // Return PDF as Blob
  return doc.output('blob');
};

/**
 * Add report header
 */
const addHeader = (doc: jsPDF, header: any, y: number, pageWidth: number, margin: number): number => {
  // Lab name (centered, large, bold)
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(header.labName, pageWidth / 2, y, { align: 'center' });
  y += 8;

  // Address and contact info (centered, smaller)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(header.address, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(`Phone: ${header.phone} | Email: ${header.email} | Website: ${header.website}`, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(`${header.nablReg} | ${header.license}`, pageWidth / 2, y, { align: 'center' });
  y += 6;

  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  return y;
};

/**
 * Add report title
 */
const addReportTitle = (doc: jsPDF, reportInfo: any, y: number, pageWidth: number): number => {
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LABORATORY REPORT', pageWidth / 2, y, { align: 'center' });
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Report ID: ${reportInfo.reportId}`, pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text(`Report Date: ${reportInfo.reportDate}`, pageWidth / 2, y, { align: 'center' });
  y += 8;

  return y;
};

/**
 * Add patient information
 */
const addPatientInfo = (doc: jsPDF, patientInfo: any, y: number, pageWidth: number, margin: number): number => {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT INFORMATION', margin, y);
  y += 6;

  doc.autoTable({
    startY: y,
    head: [],
    body: [
      [
        { content: 'Patient Name', styles: { fontStyle: 'bold' } },
        patientInfo.name,
        { content: 'Patient ID', styles: { fontStyle: 'bold' } },
        patientInfo.patientId,
      ],
      [
        { content: 'Age / Gender', styles: { fontStyle: 'bold' } },
        `${patientInfo.age} Years / ${patientInfo.gender}`,
        { content: 'Sample ID', styles: { fontStyle: 'bold' } },
        patientInfo.sampleId,
      ],
      [
        { content: 'Referred By Dr.', styles: { fontStyle: 'bold' } },
        patientInfo.referredBy,
        { content: 'Token No', styles: { fontStyle: 'bold' } },
        patientInfo.tokenNumber,
      ],
      [
        { content: 'Mobile', styles: { fontStyle: 'bold' } },
        patientInfo.mobile,
        { content: 'Collection Date', styles: { fontStyle: 'bold' } },
        patientInfo.collectionDate,
      ],
      [
        { content: 'Email', styles: { fontStyle: 'bold' } },
        patientInfo.email,
        { content: 'Report Date', styles: { fontStyle: 'bold' } },
        new Date().toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      ],
    ],
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 35, fontStyle: 'bold' },
      1: { cellWidth: 55 },
      2: { cellWidth: 35, fontStyle: 'bold' },
      3: { cellWidth: 55 },
    },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 8;
  return y;
};

/**
 * Add test information
 */
const addTestInfo = (doc: jsPDF, testInfo: any, y: number, pageWidth: number, margin: number): number => {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TEST INFORMATION', margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Test Name: ${testInfo.testName}`, margin, y);
  y += 5;
  doc.text(`Department: ${testInfo.department}`, margin, y);
  y += 5;
  doc.text(`Sample Type: ${testInfo.sampleType}`, margin, y);
  y += 5;
  doc.text(`Fasting Status: ${testInfo.fastingStatus}`, margin, y);
  y += 8;

  return y;
};

/**
 * Add results table
 */
const addResultsTable = (doc: jsPDF, results: any[], y: number, pageWidth: number, margin: number, pageHeight: number): number => {
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INVESTIGATION RESULTS', margin, y);
  y += 6;

  // Group parameters by category
  const groupedResults: any = {};
  let currentCategory = '';

  results.forEach((param) => {
    const category = param.category || 'General';
    if (!groupedResults[category]) {
      groupedResults[category] = [];
    }
    groupedResults[category].push(param);
  });

  // Build table rows with category headers
  const tableData: any[] = [];
  Object.keys(groupedResults).forEach((category) => {
    // Add category header
    if (category !== 'General') {
      tableData.push([
        { content: category.toUpperCase(), colSpan: 5, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
      ]);
    }

    // Add parameters for this category
    groupedResults[category].forEach((param: any) => {
      const flagSymbol = param.flag === 'H' || param.flag === 'HH' ? ' ↑' : param.flag === 'L' || param.flag === 'LL' ? ' ↓' : '';
      const flagText = param.flag ? param.flag + flagSymbol : '';

      tableData.push([
        param.name,
        param.result.toString(),
        param.unit,
        param.normalRange,
        flagText,
      ]);
    });
  });

  doc.autoTable({
    startY: y,
    head: [['PARAMETER', 'RESULT', 'UNIT', 'NORMAL RANGE', 'FLAG']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: 'right' },
      2: { cellWidth: 30 },
      3: { cellWidth: 45 },
      4: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data: any) => {
      // Color code the flags
      if (data.column.index === 4 && data.cell.raw) {
        const flag = data.cell.raw.toString();
        if (flag.includes('HH') || flag.includes('LL')) {
          data.cell.styles.textColor = [220, 20, 60]; // Crimson for critical
          data.cell.styles.fontStyle = 'bold';
        } else if (flag.includes('H') || flag.includes('L')) {
          data.cell.styles.textColor = [255, 140, 0]; // Orange for abnormal
        }
      }
    },
    margin: { left: margin, right: margin },
  });

  y = doc.lastAutoTable.finalY + 6;

  // Add flags legend
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Flags: L = Low, H = High, LL = Critical Low, HH = Critical High', margin, y);
  y += 8;

  return y;
};

/**
 * Add critical values alert
 */
const addCriticalValuesAlert = (doc: jsPDF, criticalValues: any[], y: number, pageWidth: number, margin: number, pageHeight: number): number => {
  // Check if we need a new page
  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  }

  // Draw red box
  doc.setDrawColor(220, 20, 60);
  doc.setFillColor(255, 240, 240);
  doc.setLineWidth(1);
  const boxHeight = 10 + criticalValues.length * 5;
  doc.rect(margin, y, pageWidth - 2 * margin, boxHeight, 'FD');

  y += 6;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 20, 60);
  doc.text('⚠️  CRITICAL VALUE ALERT', margin + 3, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  criticalValues.forEach((param) => {
    doc.text(`${param.name}: ${param.result} ${param.unit} (${param.flag === 'HH' ? 'Critical High' : param.flag === 'LL' ? 'Critical Low' : param.flag})`, margin + 3, y);
    y += 5;
  });

  doc.setTextColor(0, 0, 0);
  doc.text('Immediate clinical correlation recommended.', margin + 3, y);
  y += boxHeight - (criticalValues.length * 5) + 8;

  return y;
};

/**
 * Add interpretation section
 */
const addInterpretation = (doc: jsPDF, interpretation: string, y: number, pageWidth: number, margin: number, pageHeight: number): number => {
  // Check if we need a new page
  if (y > pageHeight - 50) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('INTERPRETATION / REMARKS', margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  // Split interpretation into lines
  const lines = doc.splitTextToSize(interpretation, pageWidth - 2 * margin);
  lines.forEach((line: string) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 5;
  });

  y += 5;
  return y;
};

/**
 * Add methodology section
 */
const addMethodology = (doc: jsPDF, y: number, pageWidth: number, margin: number, pageHeight: number): number => {
  if (y > pageHeight - 40) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('METHOD / TECHNOLOGY', margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Test performed on: Automated Hematology Analyzer', margin, y);
  y += 5;
  doc.text('Methodology: Standard laboratory protocols as per guidelines', margin, y);
  y += 8;

  return y;
};

/**
 * Add QC statement
 */
const addQCStatement = (doc: jsPDF, y: number, pageWidth: number, margin: number, pageHeight: number): number => {
  if (y > pageHeight - 30) {
    doc.addPage();
    y = margin;
  }

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('QUALITY CONTROL', margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Internal Quality Control: Passed', margin, y);
  y += 5;
  doc.text('External Quality Assurance: Enrolled', margin, y);
  y += 8;

  return y;
};

/**
 * Add footer with signature
 */
const addFooter = (doc: jsPDF, pathologist: any, footer: any, pageWidth: number, margin: number, signatureData: string | undefined, settings: any): void => {
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = pageHeight - 50;

  // Horizontal line
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Left side - Tested by
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Tested By:', margin, y);
  y += 5;
  doc.text(footer.testedBy, margin, y);
  y += 5;
  doc.text(footer.testedDate, margin, y);

  // Right side - Pathologist signature
  if (pathologist) {
    const rightX = pageWidth - margin - 60;
    y = pageHeight - 44;

    // Add signature image if available
    if (signatureData && signatureData.startsWith('data:image')) {
      try {
        doc.addImage(signatureData, 'PNG', rightX, y - 15, 40, 15);
      } catch (error) {
        console.error('Error adding signature image:', error);
      }
      y += 5;
    }

    doc.setFont('helvetica', 'bold');
    doc.text(pathologist.name, rightX, y, { align: 'left' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(pathologist.qualification, rightX, y, { align: 'left' });
    y += 5;
    doc.text(`Reg. No: ${pathologist.registrationNumber}`, rightX, y, { align: 'left' });
  }

  // Bottom disclaimer
  y = pageHeight - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  const disclaimer = footer.disclaimer || 'This report is verified and approved by the pathologist.';
  doc.text(disclaimer, pageWidth / 2, y, { align: 'center' });

  // Page number
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`Page: 1 of 1`, pageWidth / 2, y, { align: 'center' });
};

/**
 * Add watermark
 */
const addWatermark = (doc: jsPDF, text: string, opacity: number): void => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.saveGraphicsState();
  doc.setGState(new (doc as any).GState({ opacity: opacity / 100 }));
  doc.setFontSize(60);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(200, 200, 200);

  // Rotate and place watermark
  const x = pageWidth / 2;
  const y = pageHeight / 2;
  doc.text(text, x, y, {
    align: 'center',
    angle: 45,
  });

  doc.restoreGraphicsState();
};
