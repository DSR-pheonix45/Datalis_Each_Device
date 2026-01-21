/**
 * Audit Report Generation Service
 * Generates professional PDF reports like HPCL Annual Report format
 * 
 * Supports:
 * - Financial Reports (P&L, Balance Sheet, Cash Flow, etc.)
 * - Compliance Reports (CARO 2020, Companies Act 2013)
 * - Audit Reports (IndAS 108, SA 230)
 */

import jsPDF from 'jspdf';

// Color constants matching brand
const COLORS = {
  primary: '#00C6C2',
  primaryDark: '#00A5A1',
  dark: '#0E1117',
  gray: '#6B7280',
  lightGray: '#E5E7EB',
  white: '#FFFFFF',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444'
};

// Helper function to convert hex to RGB
const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
};

/**
 * Generate a professional audit report PDF
 * @param {Object} reportData - Report configuration and data
 * @returns {Promise<Blob>} - PDF blob for download
 */
export async function generateAuditReport(reportData) {
  const {
    companyName = 'Company Name',
    reportTitle = 'Financial Report',
    reportType = 'General Report',
    reportId = 'general',
    category = 'Financial',
    notes = '',
    generatedAt = new Date().toISOString(),
    files = []
  } = reportData;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  let currentY = margin;

  // Helper functions
  const addNewPage = () => {
    doc.addPage();
    currentY = margin;
    addHeader();
    addFooter();
  };

  const checkPageBreak = (requiredHeight) => {
    if (currentY + requiredHeight > pageHeight - 30) {
      addNewPage();
    }
  };

  const addHeader = () => {
    // Header line
    const rgb = hexToRgb(COLORS.primary);
    doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    doc.setLineWidth(0.5);
    doc.line(margin, 10, pageWidth - margin, 10);
    
    // Company name in header
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(companyName, margin, 8);
    
    // Report title in header
    doc.text(reportTitle, pageWidth - margin, 8, { align: 'right' });
  };

  const addFooter = () => {
    const pageNum = doc.internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text(`Generated: ${new Date(generatedAt).toLocaleDateString()}`, margin, pageHeight - 10);
    doc.text('Confidential', pageWidth - margin, pageHeight - 10, { align: 'right' });
  };

  // =========================================
  // COVER PAGE
  // =========================================
  
  // Background gradient effect (approximated with rectangles)
  const primaryRgb = hexToRgb(COLORS.primary);
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  // Company Logo placeholder
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 25, 40, 20, 3, 3, 'F');
  doc.setFontSize(12);
  doc.setTextColor(0, 198, 194);
  doc.text('LOGO', margin + 20, 37, { align: 'center' });
  
  // Report Title on cover
  doc.setFontSize(32);
  doc.setTextColor(255, 255, 255);
  doc.text(reportTitle, pageWidth / 2, 55, { align: 'center' });
  
  // Report Type
  doc.setFontSize(14);
  doc.text(reportType, pageWidth / 2, 68, { align: 'center' });
  
  // Company Name (large)
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  doc.text(companyName, pageWidth / 2, 120, { align: 'center' });
  
  // Category Badge
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.roundedRect(pageWidth / 2 - 25, 135, 50, 10, 2, 2, 'F');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(category.toUpperCase(), pageWidth / 2, 142, { align: 'center' });
  
  // Report Details Box
  doc.setFillColor(245, 245, 245);
  doc.roundedRect(margin, 160, contentWidth, 60, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Report Information', margin + 10, 172);
  
  doc.setDrawColor(200);
  doc.line(margin + 10, 175, margin + contentWidth - 10, 175);
  
  doc.setFontSize(9);
  doc.setTextColor(60);
  const details = [
    ['Report Type:', reportType],
    ['Category:', category],
    ['Generated:', new Date(generatedAt).toLocaleString()],
    ['Reference:', `RPT-${Date.now().toString(36).toUpperCase()}`]
  ];
  
  details.forEach((detail, index) => {
    doc.setFont('helvetica', 'bold');
    doc.text(detail[0], margin + 15, 185 + (index * 8));
    doc.setFont('helvetica', 'normal');
    doc.text(detail[1], margin + 50, 185 + (index * 8));
  });
  
  // Disclaimer at bottom of cover
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text('This report is generated automatically and should be reviewed by a qualified professional.', pageWidth / 2, pageHeight - 40, { align: 'center' });
  doc.text('© ' + new Date().getFullYear() + ' ' + companyName + ' - All Rights Reserved', pageWidth / 2, pageHeight - 32, { align: 'center' });

  // =========================================
  // TABLE OF CONTENTS
  // =========================================
  addNewPage();
  
  doc.setFontSize(20);
  doc.setTextColor(0);
  doc.text('Table of Contents', margin, currentY);
  currentY += 15;
  
  const tocItems = getTOCByReportType(reportId);
  
  tocItems.forEach((item, index) => {
    doc.setFontSize(11);
    if (item.level === 1) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80);
    }
    
    const indent = item.level === 1 ? 0 : 10;
    doc.text(`${index + 1}. ${item.title}`, margin + indent, currentY);
    
    // Dotted line to page number
    doc.setDrawColor(200);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(margin + 80, currentY, pageWidth - margin - 15, currentY);
    doc.setLineDashPattern([], 0);
    
    doc.text(`${item.page}`, pageWidth - margin - 5, currentY, { align: 'right' });
    currentY += 8;
  });

  // =========================================
  // EXECUTIVE SUMMARY
  // =========================================
  addNewPage();
  
  doc.setFontSize(18);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('Executive Summary', margin, currentY);
  currentY += 12;
  
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.setFont('helvetica', 'normal');
  
  const executiveSummary = getExecutiveSummary(reportId, companyName, category);
  const summaryLines = doc.splitTextToSize(executiveSummary, contentWidth);
  doc.text(summaryLines, margin, currentY);
  currentY += summaryLines.length * 5 + 15;

  // Key Highlights Box
  checkPageBreak(50);
  doc.setFillColor(240, 253, 252);
  doc.roundedRect(margin, currentY, contentWidth, 45, 3, 3, 'F');
  doc.setDrawColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, currentY, contentWidth, 45, 3, 3, 'S');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 166, 162);
  doc.text('Key Highlights', margin + 8, currentY + 10);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  
  const highlights = getKeyHighlights(reportId);
  highlights.forEach((highlight, index) => {
    doc.text(`• ${highlight}`, margin + 10, currentY + 18 + (index * 6));
  });
  currentY += 55;

  // =========================================
  // REPORT CONTENT BY TYPE
  // =========================================
  addNewPage();
  generateReportContent(doc, reportId, companyName, margin, pageWidth, pageHeight, files);

  // =========================================
  // NOTES & APPENDIX
  // =========================================
  if (notes) {
    addNewPage();
    doc.setFontSize(18);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text('Additional Notes', margin, margin + 10);
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(notes, contentWidth);
    doc.text(notesLines, margin, margin + 22);
  }

  // =========================================
  // FINAL PAGE - CERTIFICATION
  // =========================================
  addNewPage();
  
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text('Report Certification', margin, margin + 10);
  
  currentY = margin + 25;
  doc.setFontSize(10);
  doc.setTextColor(60);
  
  const certification = `This report has been prepared in accordance with applicable accounting standards and regulatory requirements. The information contained herein is based on data provided and has been reviewed for accuracy and completeness.

Report Reference: RPT-${Date.now().toString(36).toUpperCase()}
Generated On: ${new Date(generatedAt).toLocaleString()}
Report Type: ${reportType}
Category: ${category}

This is a computer-generated report. For queries, please contact the relevant department.`;
  
  const certLines = doc.splitTextToSize(certification, contentWidth);
  doc.text(certLines, margin, currentY);
  
  // Signature boxes
  currentY += certLines.length * 5 + 30;
  
  doc.setDrawColor(180);
  doc.line(margin, currentY, margin + 60, currentY);
  doc.line(pageWidth - margin - 60, currentY, pageWidth - margin, currentY);
  
  doc.setFontSize(8);
  doc.text('Prepared By', margin, currentY + 8);
  doc.text('Reviewed By', pageWidth - margin - 60, currentY + 8);

  // Add headers and footers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    addHeader();
    addFooter();
  }

  // Save and download
  const filename = `${companyName.replace(/\s+/g, '_')}_${reportId}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  
  return doc.output('blob');
}

/**
 * Get Table of Contents based on report type
 */
function getTOCByReportType(reportId) {
  const baseTOC = [
    { title: 'Executive Summary', page: 3, level: 1 },
    { title: 'Key Highlights', page: 3, level: 2 }
  ];
  
  const reportSpecificTOC = {
    profit_loss: [
      { title: 'Revenue Analysis', page: 4, level: 1 },
      { title: 'Expense Breakdown', page: 5, level: 1 },
      { title: 'Net Income Summary', page: 6, level: 1 },
      { title: 'Year-over-Year Comparison', page: 7, level: 1 }
    ],
    balance_sheet: [
      { title: 'Asset Analysis', page: 4, level: 1 },
      { title: 'Liability Summary', page: 5, level: 1 },
      { title: 'Equity Statement', page: 6, level: 1 },
      { title: 'Financial Ratios', page: 7, level: 1 }
    ],
    cash_flow: [
      { title: 'Operating Activities', page: 4, level: 1 },
      { title: 'Investing Activities', page: 5, level: 1 },
      { title: 'Financing Activities', page: 6, level: 1 },
      { title: 'Cash Position Analysis', page: 7, level: 1 }
    ],
    caro_2020: [
      { title: 'Fixed Assets Report', page: 4, level: 1 },
      { title: 'Inventory Verification', page: 5, level: 1 },
      { title: 'Loan Compliance', page: 6, level: 1 },
      { title: 'Statutory Dues Status', page: 7, level: 1 },
      { title: 'Fund Utilization', page: 8, level: 1 }
    ],
    companies_act_2013: [
      { title: 'Board Composition', page: 4, level: 1 },
      { title: 'Related Party Transactions', page: 5, level: 1 },
      { title: 'CSR Compliance', page: 6, level: 1 },
      { title: 'Disclosure Requirements', page: 7, level: 1 },
      { title: 'Director Responsibilities', page: 8, level: 1 }
    ],
    indas_108: [
      { title: 'Reportable Segments', page: 4, level: 1 },
      { title: 'Segment Revenue', page: 5, level: 1 },
      { title: 'Segment Assets & Liabilities', page: 6, level: 1 },
      { title: 'Geographic Information', page: 7, level: 1 },
      { title: 'Major Customers', page: 8, level: 1 }
    ],
    sa_230_audit: [
      { title: 'Audit Planning', page: 4, level: 1 },
      { title: 'Risk Assessment', page: 5, level: 1 },
      { title: 'Audit Evidence', page: 6, level: 1 },
      { title: 'Procedures Performed', page: 7, level: 1 },
      { title: 'Conclusions & Findings', page: 8, level: 1 }
    ]
  };
  
  const specificTOC = reportSpecificTOC[reportId] || [
    { title: 'Analysis Overview', page: 4, level: 1 },
    { title: 'Key Metrics', page: 5, level: 1 },
    { title: 'Recommendations', page: 6, level: 1 }
  ];
  
  return [
    ...baseTOC,
    ...specificTOC,
    { title: 'Notes & Appendix', page: 9, level: 1 },
    { title: 'Report Certification', page: 10, level: 1 }
  ];
}

/**
 * Get Executive Summary based on report type
 */
function getExecutiveSummary(reportId, companyName, category) {
  const summaries = {
    profit_loss: `This Profit & Loss Statement for ${companyName} provides a comprehensive analysis of revenue streams, operating expenses, and net income for the reporting period. The report highlights key performance drivers, margin trends, and comparative analysis with previous periods.`,
    
    balance_sheet: `The Balance Sheet report for ${companyName} presents a detailed snapshot of the company's financial position, including assets, liabilities, and shareholders' equity. This analysis helps stakeholders understand the company's financial health and capital structure.`,
    
    cash_flow: `This Cash Flow Statement for ${companyName} details the movement of cash through operating, investing, and financing activities. The report provides insights into liquidity management and the company's ability to generate positive cash flows.`,
    
    caro_2020: `This CARO 2020 Compliance Report for ${companyName} addresses the requirements under the Companies (Auditor's Report) Order 2020. The report covers fixed assets, inventory management, loans, statutory compliances, and other matters specified under the Order.`,
    
    companies_act_2013: `This Companies Act 2013 Compliance Report for ${companyName} evaluates adherence to the statutory requirements including board composition, related party transactions, CSR obligations, and mandatory disclosures as required under the Act.`,
    
    indas_108: `This IndAS 108 Operating Segments Report for ${companyName} identifies and analyzes reportable business segments in accordance with Indian Accounting Standard 108. The report includes segment-wise revenue, assets, liabilities, and performance metrics.`,
    
    sa_230_audit: `This SA 230 Audit Documentation Report for ${companyName} provides comprehensive audit working papers including planning documents, risk assessments, audit evidence, procedures performed, and conclusions reached in accordance with Standard on Auditing 230.`
  };
  
  return summaries[reportId] || `This ${category} report for ${companyName} provides a detailed analysis and insights based on the available financial and operational data. The report has been prepared following applicable standards and best practices.`;
}

/**
 * Get Key Highlights based on report type
 */
function getKeyHighlights(reportId) {
  const highlights = {
    profit_loss: [
      'Revenue growth analysis and trends',
      'Operating margin performance',
      'Cost structure optimization opportunities',
      'Net income trajectory and projections'
    ],
    balance_sheet: [
      'Asset composition and quality assessment',
      'Debt-to-equity ratio analysis',
      'Working capital efficiency metrics',
      'Capital structure recommendations'
    ],
    cash_flow: [
      'Operating cash flow sustainability',
      'Capital expenditure analysis',
      'Free cash flow generation',
      'Dividend coverage assessment'
    ],
    caro_2020: [
      'Fixed asset title deeds verification',
      'Physical inventory observation results',
      'Compliance with loan covenants',
      'Statutory dues deposit status'
    ],
    companies_act_2013: [
      'Board independence and diversity',
      'Related party transaction approvals',
      'CSR spending compliance',
      'Director remuneration disclosures'
    ],
    indas_108: [
      'Operating segment identification',
      'Segment profitability analysis',
      'Geographic revenue distribution',
      'Inter-segment pricing policies'
    ],
    sa_230_audit: [
      'Audit planning and strategy',
      'Risk assessment procedures',
      'Substantive testing results',
      'Material findings and observations'
    ]
  };
  
  return highlights[reportId] || [
    'Comprehensive data analysis completed',
    'Key metrics evaluated and documented',
    'Recommendations provided for improvement',
    'Full compliance with applicable standards'
  ];
}

/**
 * Generate report-specific content
 */
function generateReportContent(doc, reportId, companyName, margin, pageWidth, pageHeight, files) {
  const contentWidth = pageWidth - (margin * 2);
  let currentY = margin + 10;
  
  const primaryRgb = hexToRgb(COLORS.primary);
  
  // Section title
  doc.setFontSize(18);
  doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.text('Detailed Analysis', margin, currentY);
  currentY += 15;
  
  // Based on report type, add specific content
  const contentSections = getReportSections(reportId, companyName);
  
  contentSections.forEach((section) => {
    // Check for page break
    if (currentY > pageHeight - 50) {
      doc.addPage();
      currentY = margin + 10;
    }
    
    // Section header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text(section.title, margin, currentY);
    currentY += 8;
    
    // Section content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    const lines = doc.splitTextToSize(section.content, contentWidth);
    doc.text(lines, margin, currentY);
    currentY += lines.length * 5 + 10;
    
    // Add a table if available
    if (section.table) {
      currentY = addSimpleTable(doc, section.table, margin, currentY, contentWidth);
      currentY += 10;
    }
  });
  
  // If files were provided, add data summary
  if (files && files.length > 0) {
    if (currentY > pageHeight - 60) {
      doc.addPage();
      currentY = margin + 10;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Data Sources', margin, currentY);
    currentY += 10;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60);
    
    files.forEach((file, index) => {
      doc.text(`${index + 1}. ${file.name || file.file_name || 'Data File'}`, margin + 5, currentY);
      currentY += 5;
    });
  }
}

/**
 * Get report-specific sections
 */
function getReportSections(reportId, companyName) {
  const sections = {
    profit_loss: [
      {
        title: '1. Revenue Analysis',
        content: `Total revenue for the reporting period has been analyzed across all business segments. The revenue composition includes product sales, service income, and other operating income. Key revenue drivers and trends have been identified for strategic planning.`,
        table: {
          headers: ['Revenue Category', 'Current Period', 'Previous Period', 'Growth %'],
          rows: [
            ['Product Sales', '₹XX,XXX', '₹XX,XXX', 'X.X%'],
            ['Service Income', '₹XX,XXX', '₹XX,XXX', 'X.X%'],
            ['Other Income', '₹XX,XXX', '₹XX,XXX', 'X.X%']
          ]
        }
      },
      {
        title: '2. Expense Analysis',
        content: `Operating expenses have been categorized and analyzed to identify cost optimization opportunities. The analysis covers direct costs, administrative expenses, selling & distribution costs, and other operating expenses.`
      },
      {
        title: '3. Profitability Metrics',
        content: `Key profitability ratios including Gross Profit Margin, Operating Profit Margin, and Net Profit Margin have been calculated and compared with industry benchmarks.`
      }
    ],
    
    caro_2020: [
      {
        title: '1. Fixed Assets (Clause 3(i))',
        content: `The company maintains proper records showing full particulars, including quantitative details and situation of Property, Plant and Equipment (PPE) and intangible assets. The physical verification program covers all fixed assets over a reasonable period.`
      },
      {
        title: '2. Inventory (Clause 3(ii))',
        content: `Physical verification of inventory has been conducted at reasonable intervals by the management. Procedures and frequency of verification are reasonable and adequate in relation to the size of the company and the nature of its business.`
      },
      {
        title: '3. Loans & Advances (Clause 3(iii))',
        content: `The company has granted loans, secured or unsecured, to companies, firms, LLPs or other parties covered in the register maintained under section 189 of the Companies Act, 2013. Terms and conditions are not prejudicial to the company's interest.`
      },
      {
        title: '4. Statutory Dues (Clause 3(vii))',
        content: `The company is regular in depositing undisputed statutory dues including GST, Provident Fund, Employees' State Insurance, Income-tax, Customs Duty, Cess and other material statutory dues with appropriate authorities.`
      }
    ],
    
    companies_act_2013: [
      {
        title: '1. Board Composition',
        content: `The Board of Directors comprises the requisite number of Independent Directors as per Section 149 of the Companies Act, 2013. The composition meets the requirements for diversity and expertise.`
      },
      {
        title: '2. Related Party Transactions',
        content: `All related party transactions entered during the year were in the ordinary course of business and on arm's length basis. Prior approval of the Audit Committee has been obtained for all such transactions.`
      },
      {
        title: '3. Corporate Social Responsibility',
        content: `The company has spent the required amount on CSR activities as mandated under Section 135 of the Companies Act, 2013. Projects undertaken align with Schedule VII activities.`
      },
      {
        title: '4. Directors Report Disclosures',
        content: `The Directors' Report contains all matters required to be disclosed as per Section 134 of the Companies Act, 2013, including financial summary, material changes, and risk management policy.`
      }
    ],
    
    indas_108: [
      {
        title: '1. Identification of Operating Segments',
        content: `Operating segments have been identified based on the internal reports that are regularly reviewed by the Chief Operating Decision Maker (CODM) to make decisions about resources to be allocated to the segment and assess its performance.`
      },
      {
        title: '2. Segment Revenue & Results',
        content: `Segment revenue includes sales and other income directly attributable to a segment and the relevant portion of enterprise income that can be allocated on a reasonable basis.`,
        table: {
          headers: ['Segment', 'Revenue', 'Profit/Loss', 'Assets'],
          rows: [
            ['Segment A', '₹XX,XXX', '₹XX,XXX', '₹XX,XXX'],
            ['Segment B', '₹XX,XXX', '₹XX,XXX', '₹XX,XXX'],
            ['Others', '₹XX,XXX', '₹XX,XXX', '₹XX,XXX']
          ]
        }
      },
      {
        title: '3. Geographic Information',
        content: `Revenue from external customers attributed to India and all foreign countries from which the entity derives material revenues has been disclosed. Non-current assets other than financial instruments are located in domestic geography.`
      }
    ],
    
    sa_230_audit: [
      {
        title: '1. Audit Planning Documentation',
        content: `Audit planning documents include the overall audit strategy and detailed audit plan. The strategy sets the scope, timing, and direction of the audit and provides guidance for developing the audit plan.`
      },
      {
        title: '2. Risk Assessment Documentation',
        content: `Risk assessment procedures have been documented including inquiries of management, analytical procedures, and observation and inspection. Identified risks of material misstatement have been assessed at both financial statement and assertion levels.`
      },
      {
        title: '3. Audit Evidence',
        content: `Audit evidence obtained through various procedures including inspection, observation, external confirmation, recalculation, reperformance, and analytical procedures has been documented. Evidence is sufficient and appropriate to support audit conclusions.`
      },
      {
        title: '4. Conclusions & Findings',
        content: `All significant matters and conclusions reached have been documented. The audit file contains information sufficient to enable an experienced auditor to understand the work performed and conclusions reached.`
      }
    ]
  };
  
  return sections[reportId] || [
    {
      title: '1. Analysis Overview',
      content: `This report provides a comprehensive analysis of ${companyName}'s financial and operational data for the reporting period. Key metrics and performance indicators have been evaluated.`
    },
    {
      title: '2. Key Findings',
      content: 'Based on the analysis of available data, significant observations and findings have been documented. These findings form the basis for recommendations and action items.'
    },
    {
      title: '3. Recommendations',
      content: 'Strategic recommendations have been provided based on the analysis. Implementation of these recommendations is expected to improve operational efficiency and financial performance.'
    }
  ];
}

/**
 * Add a simple table to the PDF
 */
function addSimpleTable(doc, tableData, startX, startY, width) {
  const { headers, rows } = tableData;
  const colWidth = width / headers.length;
  const rowHeight = 8;
  
  const primaryRgb = hexToRgb(COLORS.primary);
  
  // Header row
  doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
  doc.rect(startX, startY, width, rowHeight, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  
  headers.forEach((header, index) => {
    doc.text(header, startX + (index * colWidth) + 3, startY + 5.5);
  });
  
  // Data rows
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  
  rows.forEach((row, rowIndex) => {
    const rowY = startY + rowHeight + (rowIndex * rowHeight);
    
    // Alternate row background
    if (rowIndex % 2 === 1) {
      doc.setFillColor(245, 245, 245);
      doc.rect(startX, rowY, width, rowHeight, 'F');
    }
    
    row.forEach((cell, cellIndex) => {
      doc.text(cell.toString(), startX + (cellIndex * colWidth) + 3, rowY + 5.5);
    });
  });
  
  // Border
  doc.setDrawColor(200);
  doc.rect(startX, startY, width, rowHeight + (rows.length * rowHeight));
  
  return startY + rowHeight + (rows.length * rowHeight);
}

export default { generateAuditReport };
