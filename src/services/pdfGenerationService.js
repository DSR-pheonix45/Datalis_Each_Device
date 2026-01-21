/**
 * Professional PDF Generation Service
 * Converts markdown reports to formatted PDFs matching HPCL/IOCL standards
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Convert markdown report to professional PDF
 */
export async function convertMarkdownToPDF(markdownContent, reportData) {
  const {
    companyName,
    reportTitle,
    reportType,
    generatedAt
  } = reportData;

  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margins = { top: 20, right: 20, bottom: 20, left: 20 };
    const contentWidth = pageWidth - margins.left - margins.right;
    let yPosition = margins.top;

    // Color scheme (professional blue/grey)
    const colors = {
      primary: [0, 71, 171],      // Deep blue
      secondary: [51, 51, 51],    // Dark grey
      accent: [0, 120, 215],      // Bright blue
      lightGrey: [240, 240, 240],
      text: [33, 33, 33]
    };

    // Helper: Add new page if needed
    const checkPageBreak = (height) => {
      if (yPosition + height > pageHeight - margins.bottom) {
        pdf.addPage();
        yPosition = margins.top;
        return true;
      }
      return false;
    };

    // Helper: Add page numbers
    const addPageNumbers = () => {
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(...colors.secondary);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    };

    // 1. COVER PAGE
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pageWidth, 80, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont('helvetica', 'bold');
    pdf.text(reportTitle || reportType, pageWidth / 2, 40, { align: 'center' });

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text(companyName, pageWidth / 2, 60, { align: 'center' });

    yPosition = 100;

    // Report metadata box
    pdf.setFillColor(...colors.lightGrey);
    pdf.rect(margins.left, yPosition, contentWidth, 40, 'F');

    pdf.setTextColor(...colors.text);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');

    const reportDate = new Date(generatedAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    pdf.text(`Report Type: ${reportType}`, margins.left + 5, yPosition + 10);
    pdf.text(`Generated On: ${reportDate}`, margins.left + 5, yPosition + 20);
    pdf.text(`Status: Confidential`, margins.left + 5, yPosition + 30);

    yPosition += 60;

    // Confidentiality notice
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(
      'This report is confidential and intended solely for the use of the addressee.',
      pageWidth / 2,
      pageHeight - 30,
      { align: 'center', maxWidth: contentWidth }
    );

    // 2. CONTENT PAGES
    pdf.addPage();
    yPosition = margins.top;

    // Parse markdown and render
    const lines = markdownContent.split('\n');
    let inTable = false;
    let tableData = [];
    let tableHeaders = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) {
        yPosition += 3;
        continue;
      }

      checkPageBreak(15);

      // H1 Heading
      if (line.startsWith('# ')) {
        yPosition += 5;
        checkPageBreak(20);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.primary);
        pdf.text(line.substring(2), margins.left, yPosition);
        yPosition += 12;
        
        // Underline
        pdf.setDrawColor(...colors.primary);
        pdf.setLineWidth(0.5);
        pdf.line(margins.left, yPosition, margins.left + contentWidth, yPosition);
        yPosition += 8;
      }
      // H2 Heading
      else if (line.startsWith('## ')) {
        yPosition += 5;
        checkPageBreak(15);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.secondary);
        pdf.text(line.substring(3), margins.left, yPosition);
        yPosition += 10;
      }
      // H3 Heading
      else if (line.startsWith('### ')) {
        yPosition += 3;
        checkPageBreak(12);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(...colors.accent);
        pdf.text(line.substring(4), margins.left, yPosition);
        yPosition += 8;
      }
      // Horizontal rule
      else if (line === '---' || line === '***') {
        yPosition += 3;
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.2);
        pdf.line(margins.left, yPosition, margins.left + contentWidth, yPosition);
        yPosition += 5;
      }
      // Table detection
      else if (line.includes('|')) {
        if (!inTable) {
          // Start of table
          inTable = true;
          tableHeaders = line.split('|').map(h => h.trim()).filter(h => h);
          tableData = [];
        } else if (line.match(/^[|\s:-]+$/)) {
          // Table separator line, skip
          continue;
        } else {
          // Table row
          const rowData = line.split('|').map(d => d.trim()).filter(d => d);
          tableData.push(rowData);
        }

        // Check if next line is not a table (end of table)
        if (i === lines.length - 1 || !lines[i + 1].includes('|')) {
          checkPageBreak(tableData.length * 10 + 20);
          
          autoTable(pdf, {
            head: [tableHeaders],
            body: tableData,
            startY: yPosition,
            margin: { left: margins.left, right: margins.right },
            theme: 'grid',
            headStyles: {
              fillColor: colors.primary,
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              halign: 'left'
            },
            bodyStyles: {
              textColor: colors.text,
              fontSize: 9
            },
            alternateRowStyles: {
              fillColor: colors.lightGrey
            },
            didDrawPage: (data) => {
              yPosition = data.cursor.y + 5;
            }
          });

          inTable = false;
          tableData = [];
          tableHeaders = [];
        }
      }
      // Bullet points
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        checkPageBreak(10);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.text);
        
        const bulletText = line.substring(2);
        const textLines = pdf.splitTextToSize(bulletText, contentWidth - 10);
        
        pdf.circle(margins.left + 2, yPosition - 1, 0.8, 'F');
        pdf.text(textLines, margins.left + 6, yPosition);
        yPosition += textLines.length * 5 + 2;
      }
      // Bold text **text**
      else if (line.includes('**')) {
        checkPageBreak(10);
        pdf.setFontSize(10);
        pdf.setTextColor(...colors.text);
        
        const parts = line.split('**');
        let xPos = margins.left;
        
        for (let j = 0; j < parts.length; j++) {
          if (j % 2 === 0) {
            pdf.setFont('helvetica', 'normal');
          } else {
            pdf.setFont('helvetica', 'bold');
          }
          pdf.text(parts[j], xPos, yPosition);
          xPos += pdf.getTextWidth(parts[j]);
        }
        yPosition += 7;
      }
      // Regular paragraph
      else {
        checkPageBreak(10);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(...colors.text);
        
        const textLines = pdf.splitTextToSize(line, contentWidth);
        pdf.text(textLines, margins.left, yPosition);
        yPosition += textLines.length * 5 + 3;
      }
    }

    // Add page numbers to all pages
    addPageNumbers();

    // Generate filename
    const timestamp = new Date(generatedAt).getTime();
    const filename = `${companyName.replace(/[^a-z0-9]/gi, '_')}_${reportType.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.pdf`;

    // Save the PDF
    pdf.save(filename);

    return {
      success: true,
      filename,
      message: 'PDF generated successfully'
    };

  } catch (error) {
    console.error('PDF generation failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default { convertMarkdownToPDF };
