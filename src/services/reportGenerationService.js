/**
 * Professional Report Generation Service
 * Uses Groq AI (Llama 3.1) to generate CA-grade audit reports
 * Then converts to professional PDF format
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * CA Expert System Prompt for Professional Report Generation
 */
const CA_EXPERT_PROMPT = `You are a Senior Chartered Accountant and Statutory Auditor with expertise in:
- SA 230 (Audit Documentation)
- CARO 2020
- Companies Act 2013
- Ind AS (especially 1, 2, 7, 108, 109, 115, 116)
- Risk assessment, internal controls, and financial reporting
- Corporate-style reporting like HPCL, GAIL, ONGC annual reports

GOAL:
Generate a clean, professional, audit-grade report in structured markdown
with well-formatted tables, clean headers, and corporate readability.

SUPPORTED REPORT TYPES:
- SA 230 Audit Documentation
- CARO 2020
- Companies Act 2013 Compliance
- IndAS 108 Operating Segments
- Valuation Report (DCF + Multiples)
- Scenario Analysis
- CapEx ROI Report
- Financial Statements (P&L, Balance Sheet, Cash Flow)
- Cost Analysis & Break-even Analysis
- Financial Forecasts

OUTPUT STRUCTURE (strict):

# [Report Title]

**Company Name:** [Company Name]  
**Report Type:** [Report Type]  
**Reporting Period:** [Period]  
**Prepared By:** Datalis AI | Chartered Accountant Services  
**Date of Report:** [Date]  
**Confidentiality:** This report is confidential and intended solely for the use of the addressee.

---

## Executive Summary
Brief overview of key findings, financial position, and critical observations.

## Objectives & Scope
Define the purpose, boundaries, and limitations of this report.

## Methodology & Standards Followed
State the accounting standards, audit procedures, and frameworks used.

## Key Assumptions
List all material assumptions underlying the analysis.

## Detailed Analysis / Findings
Use organized bullet points and sub-sections. Include financial tables using clean markdown:

Example Financial Data Table:
| Line Item | Amount (₹) | YoY Change | Audit Finding |
|-----------|-------------|------------|----------------|
| Revenue | 50,00,000 | +12% | Verified |

Example Ratios/Metrics Table:
| Metric | Formula | Current Year | Previous Year | Industry Avg |
|--------|---------|--------------|---------------|--------------|
| Current Ratio | CA/CL | 1.8 | 1.5 | 1.6 |

## Compliance Checks / Audit Observations
Use a structured table:
| Clause/Section | Requirement | Status | Observation | Recommendation |
|----------------|-------------|--------|-------------|----------------|

## Risks, Issues, Mitigation
Use a three-column table:
| Risk Category | Issue Description | Mitigation Strategy |
|---------------|-------------------|---------------------|

## Conclusion & Recommendations
Summarize findings and provide actionable recommendations.

## Annexures (if applicable)
Supporting schedules, detailed calculations, or additional documentation.

---

FORMATTING RULES:
- Use professional markdown only (no HTML, no code blocks).
- All tables must be clean, aligned, and readable with proper separators.
- Use bold headings (## or ###) for sections.
- Use INR (₹) formatting for all financial values.
- Keep tone: formal, authoritative, Big-4 audit language (KPMG, EY, Deloitte, PwC style).
- No placeholders like [Insert Data] - use realistic estimates or state "Data Not Available".
- Output must be fully ready for PDF conversion.
- Include at least 3-5 well-formatted tables with actual data.
- Use proper number formatting: ₹1,50,00,000 (Indian numbering system).

CRITICAL:
- Deliver the FULL final report in one response.
- Do not repeat these instructions in your output.
- Do not add meta-commentary.
- Only return the final formatted markdown report content.
- Make it indistinguishable from a real HPCL/GAIL/ONGC annual report section.

IMPORTANT - COMPREHENSIVE REPORTING REQUIREMENTS:
If the provided dataset is small or limited, you MUST expand the report using:
- Industry benchmarking and peer comparison
- Multi-year hypothetical trend comparison and analysis
- Detailed Ind AS notes and accounting policy explanations
- Comprehensive ratio explanations with industry standards
- Segment-level commentary and breakdown
- Variance analysis (actual vs budget, YoY, QoQ)
- Risk assessment matrix and mitigation strategies
- Management Discussion & Analysis (MD&A) style elaboration
- Accounting policy details and significant judgments
- Sensitivity analysis and scenario modeling
- Forward-looking statements and projections
- Market trends and economic factors analysis
- Regulatory compliance discussion
- Internal controls assessment
- Audit methodology and procedures followed

LENGTH REQUIREMENTS:
- NEVER shorten sections due to small data availability.
- Minimum length target: 10–15 report pages worth of content.
- Target 10,000-15,000 words for comprehensive reports.
- Each major section should be substantive and detailed.
- Include extensive elaboration, examples, and professional insights.
- Never use generic or template-like language - make it specific and realistic.

SECTION DEPTH REQUIREMENTS:
Each section MUST contain:
- 2–3 detailed, well-written paragraphs minimum (4-6 sentences each)
- At least 2 comprehensive tables per major section
- Clear explanations and step-by-step breakdowns
- Professional commentary and insights as found in corporate annual reports
- Contextual analysis linking data to business implications
- Industry comparison and benchmarking where relevant
- Year-over-year trend analysis with explanations
- Management discussion and strategic insights

EXAMPLE SECTION DEPTH:
For "Detailed Analysis / Findings":
- Revenue Analysis (2-3 paragraphs + 2 tables)
- Cost Structure Analysis (2-3 paragraphs + 2 tables)
- Profitability Metrics (2-3 paragraphs + 2 tables)
- Working Capital Analysis (2-3 paragraphs + 2 tables)
- Cash Flow Analysis (2-3 paragraphs + 1-2 tables)

Use realistic industry data, standard ratios, and professional estimates where actual data is limited.
Make every section valuable, insightful, and audit-grade quality.

CRITICAL FORMATTING RULES:
- Use ONLY ## for main section headings (Executive Summary, Objectives, etc.)
- Use ### for sub-sections within main sections
- Use #### for minor sub-points only when absolutely necessary
- Never use excessive heading levels (##### or deeper)
- Proper markdown heading hierarchy: # (title) → ## (sections) → ### (sub-sections) → #### (points)
- Each section should have substantial content (400-600 words minimum per section)
- Tables must be properly formatted with aligned columns and proper spacing
- Use real company-specific details, not generic placeholders
- Include specific numbers, percentages, and realistic financial figures
- Add year-over-year comparisons with previous 2-3 periods
- Include industry benchmarks and competitor analysis
- Add management commentary and strategic insights after each major table
- Include detailed notes below each major table explaining variances
- Add audit trail references where applicable
- Use professional language throughout - avoid AI-like generic phrases

CONTENT REQUIREMENTS:
- Generate realistic financial figures appropriate for the company size
- Include multiple years of comparative data (current + 2 previous years)
- Add industry averages for benchmarking
- Include ratio analysis with interpretations
- Add variance analysis explaining significant changes
- Include forward-looking statements and projections
- Add risk assessments with specific mitigation strategies
- Include regulatory compliance details
- Add management's perspective and strategic initiatives

DO NOT:
- Use generic phrases like "the company has performed well"
- Create placeholder data marked with brackets like [Insert Data]
- Use excessive heading levels (keep it clean and professional)
- Generate short paragraphs (each should be 4-6 sentences minimum)
- Skip detailed explanations for financial items
- Omit industry context and comparative analysis
- Use AI-like language or template phrases
- Create reports shorter than 10 pages
- Skip tables or reduce content due to limited input data`;

/**
 * Generate report content using Groq AI
 */
export async function generateReportContent(reportData) {
  const {
    companyName,
    reportType,
    reportId,
    category,
    notes,
    files = [],
    generatedAt
  } = reportData;

  try {
    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }

    // Prepare file context
    let fileContext = '';
    if (files && files.length > 0) {
      fileContext = `\n\nAvailable Data Files:\n${files.map((f, i) => 
        `${i + 1}. ${f.name || f.file_name || 'Data File'}`
      ).join('\n')}`;
    }

    // Prepare user prompt based on report type
    const userPrompt = buildReportPrompt(
      reportId,
      reportType,
      companyName,
      category,
      notes,
      fileContext,
      generatedAt
    );

    console.log('Generating professional report with Groq AI...');

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Updated to latest model
        messages: [
          {
            role: 'system',
            content: CA_EXPERT_PROMPT
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_tokens: 16000, // Allow for comprehensive 10+ page reports
        temperature: 0.4, // Balanced for consistency and detailed content
        top_p: 0.95,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error('Groq API error in response:', data.error);
      throw new Error(data.error.message);
    }

    const reportContent = data.choices?.[0]?.message?.content;
    if (!reportContent) {
      throw new Error('No response from Groq API');
    }

    return {
      success: true,
      content: reportContent,
      markdown: reportContent
    };

  } catch (error) {
    console.error('Report generation failed:', error);
    return {
      success: false,
      error: error.message,
      content: getFallbackReport(reportData)
    };
  }
}

/**
 * Build specific prompt based on report type
 */
function buildReportPrompt(reportId, reportType, companyName, category, notes, fileContext, generatedAt) {
  const reportingPeriod = new Date(generatedAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long'
  });

  const reportTypeMap = {
    'caro_2020': 'CARO 2020 Statutory Audit Report',
    'companies_act_2013': 'Companies Act 2013 Compliance Report',
    'indas_108': 'IndAS 108 Operating Segment Report',
    'sa_230_audit': 'SA 230 Audit Documentation Report',
    'scenario_analysis': 'Scenario Analysis Report',
    'capex_reports': 'CapEx ROI / Investment Feasibility Report',
    'valuation_reports': 'Valuation Report (DCF + Market Comparables)',
    'profit_loss': 'Profit & Loss Statement',
    'balance_sheet': 'Balance Sheet Report',
    'cash_flow': 'Cash Flow Statement',
    'cost_analysis': 'Cost Analysis Report',
    'break_even': 'Break-even Analysis Report',
    'financial_forecasts': 'Financial Forecasts & Projections'
  };

  const fullReportType = reportTypeMap[reportId] || reportType;

  let specificInstructions = '';

  // Add report-specific instructions
  switch (reportId) {
    case 'caro_2020':
      specificInstructions = `
Focus on:
- Clause 3(i): Fixed Assets verification
- Clause 3(ii): Inventory management
- Clause 3(iii): Loans & Advances compliance
- Clause 3(vii): Statutory dues
- All 21 clauses as per CARO 2020
Include detailed observations, exceptions, and management responses.`;
      break;

    case 'companies_act_2013':
      specificInstructions = `
Focus on:
- Section 149: Board composition and Independent Directors
- Section 177: Audit Committee
- Section 188: Related Party Transactions
- Section 135: CSR compliance
- Section 134: Directors' Report requirements
Include compliance status and recommendations.`;
      break;

    case 'indas_108':
      specificInstructions = `
Focus on:
- Identification of operating segments
- Segment-wise revenue, profit/loss, assets
- Geographic segment information
- Major customer concentrations
- Inter-segment pricing policies
Include detailed segment tables with figures.`;
      break;

    case 'sa_230_audit':
      specificInstructions = `
Focus on:
- Audit planning documentation
- Risk assessment procedures
- Audit evidence gathered
- Procedures performed
- Conclusions and findings
- Significant matters documentation
Include audit methodology and working paper references.`;
      break;

    case 'capex_reports':
      specificInstructions = `
Focus on:
- Investment details and rationale
- NPV and IRR calculations
- Payback period analysis
- Sensitivity analysis
- Risk assessment
- Recommendation with justification
Include detailed financial calculations and projections.`;
      break;

    case 'valuation_reports':
      specificInstructions = `
Focus on:
- DCF valuation methodology
- WACC calculation
- Free cash flow projections
- Terminal value estimation
- Market multiples comparison (P/E, EV/EBITDA)
- Fair value conclusion
Include detailed valuation tables and comparable companies.`;
      break;
  }

  return `Generate a complete, professional ${fullReportType} for the following:

**Company Name:** ${companyName}
**Report Type:** ${fullReportType}
**Category:** ${category}
**Reporting Period:** ${reportingPeriod}
**Generated On:** ${new Date(generatedAt).toLocaleDateString('en-IN')}

${specificInstructions}

${notes ? `**Special Instructions:**\n${notes}\n` : ''}
${fileContext}

**Important:**
1. Use realistic financial figures appropriate for ${companyName}
2. Follow HPCL/IOCL/NTPC annual report formatting standards
3. Include proper section numbering and professional tables
4. Use INR (₹) for all monetary values
5. Maintain formal, audit-grade language throughout
6. Include all mandatory sections as per the structure
7. Make it ready for PDF export

Generate the COMPLETE report now in professional markdown format:`;
}

/**
 * Fallback report if AI generation fails
 */
function getFallbackReport(reportData) {
  const { companyName, reportType, category, generatedAt } = reportData;
  
  return `# ${reportType}

## ${companyName}

**Reporting Period:** ${new Date(generatedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}  
**Category:** ${category}  
**Generated:** ${new Date(generatedAt).toLocaleDateString('en-IN')}

---

## Executive Summary

This report provides a comprehensive analysis of ${companyName}'s financial and operational performance for the reporting period. The analysis has been conducted in accordance with applicable accounting standards and regulatory requirements.

## Scope & Objectives

The objective of this report is to provide stakeholders with detailed insights into the company's financial position, performance, and compliance status.

## Methodology

The analysis has been performed based on available financial data and industry best practices. All calculations and assessments follow established accounting principles and standards.

## Key Findings

- Comprehensive financial analysis completed
- All regulatory requirements addressed
- Recommendations provided for improvement

## Conclusion

Based on our analysis, the company demonstrates sound financial management practices. Detailed observations and recommendations are provided for management consideration.

---

**Note:** This is an automated report. For detailed analysis, please ensure complete financial data is provided.

**Confidential** | © ${new Date().getFullYear()} ${companyName}`;
}

export default { generateReportContent };
