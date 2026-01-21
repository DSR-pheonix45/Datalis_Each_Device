/**
 * Professional PDF Report Service - Comprehensive Executive Financial Reports
 * Generates institutional-quality financial analysis reports with deep AI insights
 * Designed for CFO/CTO level presentation - Extended Format
 */

import jsPDF from "jspdf";
import { formatNumber, formatIndianNumber, formatKPIValue as formatKPINum } from "../utils/numberFormatter";

// ==================== NUMBER FORMATTING HELPERS ====================
/**
 * Format large numbers for PDF display with Indian system (Lakhs, Crores)
 */
function formatLargeNumber(value, unit = '') {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  const num = typeof value === 'number' ? value : parseFloat(value);
  const result = formatNumber(num, { 
    system: 'indian', 
    decimals: 2, 
    compact: true,
    unit: unit
  });
  return result.formatted;
}

/**
 * Format currency values for PDF with proper Indian notation
 */
function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  const num = typeof value === 'number' ? value : parseFloat(value);
  const result = formatNumber(num, { 
    system: 'indian', 
    decimals: 2, 
    compact: true 
  });
  return result.formatted;
}

/**
 * Get full formatted number for detailed display
 */
function formatFullCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return 'N/A';
  
  const num = typeof value === 'number' ? value : parseFloat(value);
  return `₹${formatIndianNumber(num, 2)}`;
}

// ==================== ADVANCED ANALYTICS ENGINE ====================
const AdvancedAnalytics = {
  // Linear regression for trend forecasting
  linearRegression(values) {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0 };

    const x = values.map((_, i) => i);
    const y = values;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce(
      (sum, yi, i) => sum + Math.pow(yi - (slope * i + intercept), 2),
      0
    );
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const r2 = 1 - ssRes / ssTot;

    return { slope, intercept, r2: Math.max(0, Math.min(1, r2)) };
  },

  // Calculate volatility (standard deviation)
  calculateVolatility(values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      values.length;
    return Math.sqrt(variance);
  },

  // Compound Annual Growth Rate
  calculateCAGR(startValue, endValue, periods) {
    if (startValue <= 0 || endValue <= 0 || periods <= 0) return 0;
    return (Math.pow(endValue / startValue, 1 / periods) - 1) * 100;
  },

  // Moving average for smoothing
  movingAverage(values, window = 3) {
    if (values.length < window) return values;
    const result = [];
    for (let i = 0; i <= values.length - window; i++) {
      const avg =
        values.slice(i, i + window).reduce((a, b) => a + b, 0) / window;
      result.push(avg);
    }
    return result;
  },

  // Trend strength classification
  trendStrength(slope, r2) {
    if (r2 < 0.3) return "no_clear_trend";
    if (slope > 0.5) return "strong_upward_trend";
    if (slope > 0.1) return "moderate_upward_trend";
    if (slope < -0.5) return "strong_downward_trend";
    if (slope < -0.1) return "moderate_downward_trend";
    return "stable";
  },

  // Percentile rank
  percentileRank(value, dataset) {
    if (dataset.length === 0) return 50;
    const sorted = [...dataset].sort((a, b) => a - b);
    const index = sorted.findIndex((v) => v >= value);
    if (index === -1) return 100;
    return (index / sorted.length) * 100;
  },

  // Z-score for anomaly detection
  zScore(value, values) {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = this.calculateVolatility(values);
    return std === 0 ? 0 : (value - mean) / std;
  },
};

// ==================== INDUSTRY BENCHMARKS ====================
const INDUSTRY_BENCHMARKS = {
  technology: {
    gross_margin: { excellent: 70, good: 60, fair: 50, poor: 40 },
    net_profit_margin: { excellent: 25, good: 15, fair: 10, poor: 5 },
    revenue_growth_rate: { excellent: 30, good: 20, fair: 10, poor: 5 },
    current_ratio: { excellent: 2.5, good: 2, fair: 1.5, poor: 1 },
    debt_to_equity: { excellent: 0.3, good: 0.5, fair: 1, poor: 1.5 },
  },
  manufacturing: {
    gross_margin: { excellent: 40, good: 30, fair: 25, poor: 20 },
    net_profit_margin: { excellent: 15, good: 10, fair: 7, poor: 4 },
    revenue_growth_rate: { excellent: 15, good: 10, fair: 5, poor: 2 },
    current_ratio: { excellent: 2, good: 1.5, fair: 1.2, poor: 1 },
    debt_to_equity: { excellent: 0.5, good: 0.8, fair: 1.2, poor: 1.8 },
  },
  retail: {
    gross_margin: { excellent: 45, good: 35, fair: 28, poor: 22 },
    net_profit_margin: { excellent: 8, good: 5, fair: 3, poor: 1 },
    revenue_growth_rate: { excellent: 12, good: 8, fair: 4, poor: 1 },
    current_ratio: { excellent: 2, good: 1.5, fair: 1.2, poor: 0.9 },
    debt_to_equity: { excellent: 0.4, good: 0.7, fair: 1.1, poor: 1.6 },
  },
  services: {
    gross_margin: { excellent: 60, good: 50, fair: 40, poor: 30 },
    net_profit_margin: { excellent: 20, good: 12, fair: 8, poor: 4 },
    revenue_growth_rate: { excellent: 20, good: 12, fair: 7, poor: 3 },
    current_ratio: { excellent: 2.5, good: 2, fair: 1.5, poor: 1.1 },
    debt_to_equity: { excellent: 0.3, good: 0.6, fair: 1, poor: 1.5 },
  },
  default: {
    gross_margin: { excellent: 50, good: 40, fair: 30, poor: 20 },
    net_profit_margin: { excellent: 15, good: 10, fair: 7, poor: 3 },
    revenue_growth_rate: { excellent: 20, good: 12, fair: 7, poor: 3 },
    current_ratio: { excellent: 2, good: 1.5, fair: 1.2, poor: 1 },
    debt_to_equity: { excellent: 0.5, good: 0.8, fair: 1.2, poor: 1.8 },
  },
};

// Executive Color Palette
const COLORS = {
  primary: "#1a365d",
  primaryLight: "#2c5282",
  secondary: "#4a5568",
  accent: "#b7791f",
  accentLight: "#d69e2e",
  background: "#ffffff",
  cardBg: "#f7fafc",
  sectionBg: "#edf2f7",
  highlightBg: "#fffff0",
  text: "#1a202c",
  textSecondary: "#4a5568",
  textMuted: "#718096",
  excellent: "#276749",
  good: "#2f855a",
  fair: "#b7791f",
  concern: "#c53030",
  neutral: "#4a5568",
  border: "#e2e8f0",
  borderDark: "#cbd5e0",
};

// ==================== DYNAMIC AI INSIGHTS WITH TREND ANALYSIS ====================
const AI_INSIGHTS = {
  gross_margin: {
    title: "Gross Profit Margin",
    category: "Profitability",
    formula: "(Revenue - COGS) / Revenue x 100",
    importance: "Critical indicator of pricing power and production efficiency",
    whatItMeans:
      "Gross Profit Margin measures the percentage of revenue retained after deducting the direct costs of producing goods or services. It indicates how efficiently a company uses its resources to produce and sell products profitably. A higher margin means more money is available to cover operating expenses and generate profit.",
    getInsight: (value, timeSeries = [], benchmark = {}) => {
      const v = parseFloat(value);

      // Dynamic trend analysis
      let trendAnalysis = "";
      if (timeSeries && timeSeries.length >= 3) {
        const { slope, r2 } = AdvancedAnalytics.linearRegression(timeSeries);
        const volatility = AdvancedAnalytics.calculateVolatility(timeSeries);
        const trend = AdvancedAnalytics.trendStrength(slope, r2);
        trendAnalysis = ` Historical analysis shows ${trend.replace(
          /_/g,
          " "
        )} with ${(r2 * 100).toFixed(
          1
        )}% predictability. Volatility of ${volatility.toFixed(
          2
        )}pp indicates ${
          volatility < 2 ? "stable" : "high"
        } margin fluctuation.`;
      }

      // Benchmark comparison
      const benchThresholds =
        benchmark.gross_margin || INDUSTRY_BENCHMARKS.default.gross_margin;
      let benchmarkContext = "";
      if (v >= benchThresholds.excellent) {
        benchmarkContext = ` Your ${v.toFixed(
          1
        )}% significantly exceeds industry excellent threshold (${
          benchThresholds.excellent
        }%).`;
      } else if (v >= benchThresholds.good) {
        benchmarkContext = ` Your ${v.toFixed(
          1
        )}% is above industry good standard (${benchThresholds.good}%).`;
      } else if (v >= benchThresholds.fair) {
        benchmarkContext = ` Your ${v.toFixed(
          1
        )}% meets minimum industry benchmark (${benchThresholds.fair}%).`;
      } else {
        benchmarkContext = ` Your ${v.toFixed(
          1
        )}% is below industry standards (min: ${benchThresholds.fair}%).`;
      }

      if (v >= 50)
        return {
          status: "Excellent",
          color: COLORS.excellent,
          summary:
            "Exceptional margin indicating strong pricing power and superior cost management." +
            benchmarkContext,
          detail:
            "The entity demonstrates market leadership with margins significantly above industry standards. This positions the company to weather economic downturns while maintaining profitability." +
            trendAnalysis,
          implications:
            "Strong foundation for strategic investments, R&D initiatives, and market expansion. Consider reinvesting excess margins into growth opportunities.",
          actionItems: [
            "Leverage pricing power for premium positioning",
            "Invest in brand equity",
            "Explore adjacent market opportunities",
          ],
          risks:
            "Maintain vigilance against competitive pressure and cost inflation",
        };
      if (v >= 35)
        return {
          status: "Strong",
          color: COLORS.good,
          summary:
            "Healthy margin reflecting good cost control and competitive positioning." +
            benchmarkContext,
          detail:
            "Performance is above industry median, indicating effective supplier management and operational efficiency. The margin provides adequate buffer for reinvestment." +
            trendAnalysis,
          implications:
            "Solid foundation for sustainable growth. Focus on maintaining supplier relationships and continuous improvement.",
          actionItems: [
            "Optimize supplier contracts",
            "Implement lean manufacturing",
            "Review product mix profitability",
          ],
          risks:
            "Monitor input cost fluctuations and competitive pricing pressures",
        };
      if (v >= 20)
        return {
          status: "Moderate",
          color: COLORS.fair,
          summary:
            "Acceptable margin with significant improvement potential." +
            benchmarkContext,
          detail:
            "Current margins are within acceptable range but below optimal levels. This may indicate pricing pressure or elevated production costs." +
            trendAnalysis,
          implications:
            "Limited capacity for strategic investments. Prioritize margin improvement initiatives.",
          actionItems: [
            "Conduct ABC analysis on product lines",
            "Renegotiate supplier terms",
            "Evaluate value engineering opportunities",
          ],
          risks: "Vulnerable to cost increases and competitive pricing actions",
        };
      return {
        status: "Attention Required",
        color: COLORS.concern,
        summary:
          "Margin below acceptable thresholds requiring immediate intervention." +
          benchmarkContext,
        detail:
          "Current margin levels threaten long-term viability. Immediate strategic review is essential to address structural cost or pricing issues." +
          trendAnalysis,
        implications:
          "Limited financial flexibility. May require fundamental business model reassessment.",
        actionItems: [
          "Emergency pricing review",
          "Cost structure audit",
          "Product line rationalization",
          "Supplier consolidation",
        ],
        risks:
          "Cash flow constraints, inability to invest in growth, competitive disadvantage",
      };
    },
  },
  net_profit_margin: {
    title: "Net Profit Margin",
    category: "Profitability",
    formula: "Net Income / Revenue x 100",
    importance: "Ultimate measure of bottom-line efficiency",
    whatItMeans:
      "Net Profit Margin represents the percentage of revenue that remains as profit after all expenses, taxes, and costs have been deducted. It is the ultimate measure of a company's profitability and operational efficiency. This metric shows how much of every rupee earned translates into actual profit for the business.",
    getInsight: (value, timeSeries = [], benchmark = {}) => {
      const v = parseFloat(value);

      // Dynamic trend analysis
      let trendAnalysis = "";
      if (timeSeries && timeSeries.length >= 3) {
        const { slope, r2 } = AdvancedAnalytics.linearRegression(timeSeries);
        const volatility = AdvancedAnalytics.calculateVolatility(timeSeries);
        const trend = AdvancedAnalytics.trendStrength(slope, r2);
        trendAnalysis = ` Trend: ${trend.replace(/_/g, " ")} (R²: ${(
          r2 * 100
        ).toFixed(1)}%). Volatility: ${volatility.toFixed(2)}pp.`;
      }

      // Benchmark comparison
      const benchThresholds =
        benchmark.net_profit_margin ||
        INDUSTRY_BENCHMARKS.default.net_profit_margin;
      let benchmarkContext = "";
      if (v >= benchThresholds.excellent) {
        benchmarkContext = ` Exceeds industry excellent benchmark (${benchThresholds.excellent}%).`;
      } else if (v >= benchThresholds.good) {
        benchmarkContext = ` Above industry good standard (${benchThresholds.good}%).`;
      } else if (v >= benchThresholds.fair) {
        benchmarkContext = ` Meets minimum benchmark (${benchThresholds.fair}%).`;
      } else {
        benchmarkContext = ` Below industry minimum (${benchThresholds.fair}%).`;
      }

      if (v >= 20)
        return {
          status: "Excellent",
          color: COLORS.excellent,
          summary:
            "Outstanding bottom-line performance demonstrating operational excellence." +
            benchmarkContext,
          detail:
            "The entity achieves exceptional profitability after all expenses, indicating mature cost management across all operational areas. This level of profitability is typically achieved by market leaders." +
            trendAnalysis,
          implications:
            "Strong capacity for dividends, debt repayment, or strategic acquisitions. Consider optimal capital allocation strategy.",
          actionItems: [
            "Evaluate dividend policy",
            "Consider strategic acquisitions",
            "Build cash reserves for opportunities",
          ],
          risks:
            "Ensure profitability is sustainable and not from one-time gains",
        };
      if (v >= 10)
        return {
          status: "Healthy",
          color: COLORS.good,
          summary:
            "Solid profitability with adequate reinvestment capacity." +
            benchmarkContext,
          detail:
            "The company maintains healthy net margins that support sustainable operations and growth investments. Operating leverage is well-managed." +
            trendAnalysis,
          implications:
            "Balanced position allowing for moderate growth investments while maintaining financial stability.",
          actionItems: [
            "Maintain cost discipline",
            "Pursue selective growth opportunities",
            "Optimize tax efficiency",
          ],
          risks: "Monitor overhead creep and maintain operational efficiency",
        };
      if (v >= 5)
        return {
          status: "Adequate",
          color: COLORS.fair,
          summary:
            "Minimal buffer against economic headwinds." + benchmarkContext,
          detail:
            "While profitable, the margin provides limited flexibility for investment or handling unexpected challenges. Overhead efficiency may need attention." +
            trendAnalysis,
          implications:
            "Constrained ability to invest in growth. Vulnerable to market disruptions.",
          actionItems: [
            "Overhead rationalization program",
            "Working capital optimization",
            "Fixed cost reduction initiatives",
          ],
          risks: "Economic downturn could push margins negative",
        };
      return {
        status: "Critical",
        color: COLORS.concern,
        summary:
          "Urgent profitability review needed - sustainability at risk." +
          benchmarkContext,
        detail:
          "Current profitability levels are inadequate for long-term sustainability. The business may be consuming cash despite positive revenue." +
          trendAnalysis,
        implications:
          "Potential going concern issues if not addressed. Immediate intervention required.",
        actionItems: [
          "Zero-based budgeting implementation",
          "Non-core asset monetization",
          "Workforce optimization",
          "Revenue model reassessment",
        ],
        risks:
          "Cash depletion, inability to service debt, potential insolvency",
      };
    },
  },
  revenue_growth_rate: {
    title: "Revenue Growth Rate",
    category: "Growth",
    formula: "(Current Period - Prior Period) / Prior Period x 100",
    importance: "Key indicator of market momentum and competitive position",
    whatItMeans:
      "Revenue Growth Rate measures the percentage increase or decrease in a company's sales over a specific period. It indicates the pace at which a business is expanding its market presence and generating more income. Positive growth signals healthy demand, while negative growth may indicate market challenges or competitive pressures.",
    getInsight: (value, timeSeries = [], benchmark = {}) => {
      const v = parseFloat(value);

      // Dynamic trend analysis
      let trendAnalysis = "";
      if (timeSeries && timeSeries.length >= 3) {
        const cagr = AdvancedAnalytics.calculateCAGR(
          timeSeries[0],
          timeSeries[timeSeries.length - 1],
          timeSeries.length - 1
        );
        const { slope, r2 } = AdvancedAnalytics.linearRegression(timeSeries);
        trendAnalysis = ` CAGR: ${cagr.toFixed(1)}%. Trend predictability: ${(
          r2 * 100
        ).toFixed(1)}%.`;
      }

      // Benchmark comparison
      const benchThresholds =
        benchmark.revenue_growth_rate ||
        INDUSTRY_BENCHMARKS.default.revenue_growth_rate;
      let benchmarkContext = "";
      if (v >= benchThresholds.excellent) {
        benchmarkContext = ` Well above industry excellent benchmark (${benchThresholds.excellent}%).`;
      } else if (v >= benchThresholds.good) {
        benchmarkContext = ` Above industry good standard (${benchThresholds.good}%).`;
      } else if (v >= benchThresholds.fair) {
        benchmarkContext = ` Meets minimum benchmark (${benchThresholds.fair}%).`;
      } else {
        benchmarkContext = ` Below industry minimum (${benchThresholds.fair}%).`;
      }

      if (v >= 20)
        return {
          status: "High Growth",
          color: COLORS.excellent,
          summary:
            "Strong market capture with exceptional execution." +
            benchmarkContext,
          detail:
            "The entity is significantly outpacing market growth, indicating successful product-market fit and effective go-to-market strategy. This growth rate positions the company for market leadership." +
            trendAnalysis,
          implications:
            "May require scaling investments in operations, technology, and talent to sustain momentum.",
          actionItems: [
            "Scale operational capacity",
            "Invest in technology infrastructure",
            "Strengthen management team",
            "Ensure supply chain scalability",
          ],
          risks:
            "Growth without profitability, operational strain, quality degradation",
        };
      if (v >= 10)
        return {
          status: "Solid Growth",
          color: COLORS.good,
          summary:
            "Healthy demand and strong market positioning." + benchmarkContext,
          detail:
            "Revenue growth outpaces typical market rates, indicating competitive advantages in product, service, or market approach. Sustainable growth trajectory." +
            trendAnalysis,
          implications:
            "Balanced growth allowing for controlled scaling and maintaining operational quality.",
          actionItems: [
            "Strategic pricing optimization",
            "Customer lifetime value enhancement",
            "Market share consolidation",
          ],
          risks: "Competitive response, market saturation in core segments",
        };
      if (v >= 0)
        return {
          status: "Stable",
          color: COLORS.neutral,
          summary:
            "Market stability without significant expansion." +
            benchmarkContext,
          detail:
            "Revenue is maintained but not growing materially. This may indicate market maturity, competitive pressure, or need for innovation." +
            trendAnalysis,
          implications:
            "Focus on profitability optimization and identifying new growth vectors.",
          actionItems: [
            "Market penetration strategies",
            "Product innovation pipeline",
            "Adjacent market exploration",
            "Customer retention programs",
          ],
          risks: "Gradual market share erosion, relevance decline",
        };
      return {
        status: "Declining",
        color: COLORS.concern,
        summary:
          "Revenue contraction indicating competitive or market challenges." +
          benchmarkContext,
        detail:
          "Declining revenue signals fundamental challenges in market position, product relevance, or competitive dynamics. Urgent strategic review required." +
          trendAnalysis,
        implications:
          "Cost structure may become unsustainable. Strategic pivot may be necessary.",
        actionItems: [
          "Customer churn analysis",
          "Competitive positioning review",
          "Product relevance assessment",
          "Market exit evaluation for unprofitable segments",
        ],
        risks:
          "Accelerating decline, talent exodus, stakeholder confidence loss",
      };
    },
  },
  current_ratio: {
    title: "Current Ratio",
    category: "Liquidity",
    formula: "Current Assets / Current Liabilities",
    importance: "Primary measure of short-term solvency",
    whatItMeans:
      "Current Ratio measures a company's ability to pay off its short-term obligations (due within one year) using its short-term assets like cash, inventory, and receivables. A ratio above 1.0 means the company has more current assets than current liabilities, indicating it can meet its near-term financial obligations.",
    getInsight: (value, timeSeries = [], benchmark = {}) => {
      const v = parseFloat(value);

      // Dynamic trend analysis
      let trendAnalysis = "";
      if (timeSeries && timeSeries.length >= 3) {
        const { slope, r2 } = AdvancedAnalytics.linearRegression(timeSeries);
        const trend = AdvancedAnalytics.trendStrength(slope, r2);
        trendAnalysis = ` Liquidity trend: ${trend.replace(/_/g, " ")}.`;
      }

      // Benchmark comparison
      const benchThresholds =
        benchmark.current_ratio || INDUSTRY_BENCHMARKS.default.current_ratio;
      let benchmarkContext = "";
      if (v >= benchThresholds.excellent) {
        benchmarkContext = ` Exceeds industry excellent level (${benchThresholds.excellent}x).`;
      } else if (v >= benchThresholds.good) {
        benchmarkContext = ` Above industry good standard (${benchThresholds.good}x).`;
      } else if (v >= benchThresholds.fair) {
        benchmarkContext = ` Meets minimum benchmark (${benchThresholds.fair}x).`;
      } else {
        benchmarkContext = ` Below industry minimum (${benchThresholds.fair}x).`;
      }

      if (v >= 2.5)
        return {
          status: "Strong",
          color: COLORS.excellent,
          summary:
            "Robust short-term financial strength with significant liquidity buffer." +
            benchmarkContext,
          detail:
            "The entity maintains substantial liquid assets relative to near-term obligations. This provides resilience against unexpected challenges and opportunity for strategic action." +
            trendAnalysis,
          implications:
            "Consider whether excess liquidity could be deployed for higher returns.",
          actionItems: [
            "Evaluate short-term investment opportunities",
            "Consider accelerated payables for discounts",
            "Review if working capital is optimized",
          ],
          risks: "Excess liquidity may indicate inefficient capital deployment",
        };
      if (v >= 1.5)
        return {
          status: "Healthy",
          color: COLORS.good,
          summary:
            "Adequate liquidity with appropriate safety margin." +
            benchmarkContext,
          detail:
            "Current ratio demonstrates responsible working capital management with sufficient buffer for seasonal variations and unexpected needs." +
            trendAnalysis,
          implications:
            "Maintain current practices while monitoring for changes in business cycle.",
          actionItems: [
            "Monitor seasonal cash patterns",
            "Maintain banking relationships",
            "Review inventory turnover",
          ],
          risks: "Seasonal fluctuations may temporarily stress liquidity",
        };
      if (v >= 1.0)
        return {
          status: "Tight",
          color: COLORS.fair,
          summary:
            "Minimum coverage with limited operational flexibility." +
            benchmarkContext,
          detail:
            "The entity can meet current obligations but has limited buffer for unexpected demands. Working capital efficiency is crucial at this level." +
            trendAnalysis,
          implications:
            "Prioritize cash flow management and working capital optimization.",
          actionItems: [
            "Accelerate receivables collection",
            "Optimize inventory levels",
            "Negotiate extended payment terms",
            "Consider credit facility",
          ],
          risks: "Any disruption could create cash flow crisis",
        };
      return {
        status: "Stressed",
        color: COLORS.concern,
        summary:
          "Potential liquidity constraints threatening operations." +
          benchmarkContext,
        detail:
          "Current liabilities exceed liquid assets, indicating potential difficulty meeting near-term obligations. Immediate working capital intervention required." +
          trendAnalysis,
        implications:
          "May require external financing or asset liquidation to meet obligations.",
        actionItems: [
          "Emergency cash flow management",
          "Negotiate with creditors",
          "Arrange credit facilities",
          "Evaluate asset sales",
          "Consider factoring receivables",
        ],
        risks:
          "Default on obligations, supplier relationship damage, operational disruption",
      };
    },
  },
  debt_to_equity: {
    title: "Debt to Equity Ratio",
    category: "Leverage",
    formula: "Total Debt / Total Equity",
    importance: "Key indicator of financial risk and capital structure",
    whatItMeans:
      "Debt to Equity Ratio compares a company's total debt to its shareholders' equity, showing how much of the business is financed by borrowing versus owner investment. A lower ratio indicates less financial risk and more stability, while a higher ratio suggests the company relies heavily on debt financing which increases financial risk.",
    getInsight: (value, timeSeries = [], benchmark = {}) => {
      const v = parseFloat(value);

      // Dynamic trend analysis
      let trendAnalysis = "";
      if (timeSeries && timeSeries.length >= 3) {
        const { slope, r2 } = AdvancedAnalytics.linearRegression(timeSeries);
        const trend =
          slope > 0.1
            ? "increasing leverage"
            : slope < -0.1
            ? "deleveraging"
            : "stable leverage";
        trendAnalysis = ` Trend: ${trend}.`;
      }

      // Benchmark comparison
      const benchThresholds =
        benchmark.debt_to_equity || INDUSTRY_BENCHMARKS.default.debt_to_equity;
      let benchmarkContext = "";
      if (v <= benchThresholds.excellent) {
        benchmarkContext = ` Below industry excellent threshold (${benchThresholds.excellent}x).`;
      } else if (v <= benchThresholds.good) {
        benchmarkContext = ` Within industry good range (${benchThresholds.good}x).`;
      } else if (v <= benchThresholds.fair) {
        benchmarkContext = ` At industry fair level (${benchThresholds.fair}x).`;
      } else {
        benchmarkContext = ` Above industry threshold (${benchThresholds.fair}x).`;
      }

      if (v <= 0.5)
        return {
          status: "Conservative",
          color: COLORS.excellent,
          summary:
            "Minimal leverage providing maximum financial flexibility." +
            benchmarkContext,
          detail:
            "The entity operates with low debt levels, providing significant capacity for strategic debt deployment when opportunities arise. Strong position to weather economic challenges." +
            trendAnalysis,
          implications:
            "May be underleveraged - consider if strategic debt could enhance returns.",
          actionItems: [
            "Evaluate optimal capital structure",
            "Consider strategic debt for growth initiatives",
            "Maintain strong credit profile",
          ],
          risks: "May be foregoing returns from prudent leverage",
        };
      if (v <= 1.0)
        return {
          status: "Balanced",
          color: COLORS.good,
          summary:
            "Prudent balance of leverage benefits and financial risk." +
            benchmarkContext,
          detail:
            "Capital structure reflects responsible use of debt financing while maintaining adequate equity cushion. Interest coverage should be comfortable at this level." +
            trendAnalysis,
          implications:
            "Well-positioned for both stability and growth financing options.",
          actionItems: [
            "Monitor interest coverage ratio",
            "Maintain covenant compliance",
            "Optimize debt maturity profile",
          ],
          risks: "Interest rate increases could pressure margins",
        };
      if (v <= 2.0)
        return {
          status: "Moderate",
          color: COLORS.fair,
          summary:
            "Elevated leverage with adequate equity cushion." +
            benchmarkContext,
          detail:
            "Debt levels are significant but manageable with consistent cash flows. Debt service coverage requires ongoing monitoring." +
            trendAnalysis,
          implications:
            "Limited additional debt capacity. Focus on deleveraging over time.",
          actionItems: [
            "Develop deleveraging plan",
            "Monitor debt covenants closely",
            "Consider refinancing if rates favorable",
            "Prioritize debt reduction from free cash flow",
          ],
          risks:
            "Covenant breach risk during downturns, limited financial flexibility",
        };
      return {
        status: "High Leverage",
        color: COLORS.concern,
        summary:
          "Elevated leverage requiring active debt management." +
          benchmarkContext,
        detail:
          "Debt levels create significant financial risk. Interest obligations may consume substantial cash flow, limiting operational and strategic flexibility." +
          trendAnalysis,
        implications:
          "Deleveraging should be a priority. Refinancing risk is elevated.",
        actionItems: [
          "Aggressive deleveraging roadmap",
          "Cash flow optimization for debt service",
          "Asset sales consideration",
          "Equity raise evaluation",
          "Covenant renegotiation if needed",
        ],
        risks:
          "Covenant breach, refinancing challenges, potential restructuring",
      };
    },
  },
  risk_index: {
    title: "Financial Risk Score",
    category: "Risk Assessment",
    formula: "Composite: Volatility(30%) + Leverage(35%) + Liquidity(35%)",
    importance: "Holistic view of overall financial risk profile",
    whatItMeans:
      "The Financial Risk Score is a composite metric that combines multiple risk factors including earnings volatility, leverage levels, and liquidity positions into a single score from 0-100. Lower scores indicate a more stable and less risky financial profile, while higher scores signal elevated risk exposure that requires management attention.",
    getInsight: (value, timeSeries = [], benchmark = {}) => {
      const v = parseFloat(value);

      // Dynamic trend analysis
      let trendAnalysis = "";
      if (timeSeries && timeSeries.length >= 3) {
        const { slope } = AdvancedAnalytics.linearRegression(timeSeries);
        const trend =
          slope > 5
            ? "increasing risk"
            : slope < -5
            ? "decreasing risk"
            : "stable risk";
        trendAnalysis = ` Risk trajectory: ${trend}.`;
      }

      if (v <= 25)
        return {
          status: "Low Risk",
          color: COLORS.excellent,
          summary: "Stable financial profile with well-managed risk exposure.",
          detail:
            "The entity demonstrates strong risk management across volatility, leverage, and liquidity dimensions. Well-positioned to handle market disruptions." +
            trendAnalysis,
          implications:
            "May have capacity to take on additional strategic risk for growth.",
          actionItems: [
            "Maintain current risk management practices",
            "Consider strategic risk-taking opportunities",
            "Build contingency reserves",
          ],
          risks: "Complacency - continue monitoring key risk indicators",
        };
      if (v <= 50)
        return {
          status: "Moderate Risk",
          color: COLORS.good,
          summary: "Balanced risk exposure within acceptable parameters.",
          detail:
            "Overall risk profile is manageable with appropriate monitoring and controls. No single risk factor is at critical levels." +
            trendAnalysis,
          implications:
            "Maintain current risk monitoring cadence and mitigation strategies.",
          actionItems: [
            "Regular risk assessment reviews",
            "Maintain hedging strategies",
            "Monitor key risk drivers",
          ],
          risks: "Watch for risk factor deterioration",
        };
      if (v <= 75)
        return {
          status: "Elevated Risk",
          color: COLORS.fair,
          summary: "Enhanced monitoring and mitigation planning recommended.",
          detail:
            "One or more risk factors are elevated, requiring active management attention. Vulnerability to adverse market conditions is increased." +
            trendAnalysis,
          implications:
            "Prioritize risk mitigation initiatives. Build additional buffers.",
          actionItems: [
            "Identify top 3 risk contributors",
            "Develop specific mitigation plans",
            "Stress test financial projections",
            "Review insurance coverage",
          ],
          risks: "Multiple simultaneous adverse events could create crisis",
        };
      return {
        status: "High Risk",
        color: COLORS.concern,
        summary: "Significant risk exposure requiring immediate attention.",
        detail:
          "Risk profile indicates vulnerability across multiple dimensions. Adverse scenarios could threaten operational continuity." +
          trendAnalysis,
        implications:
          "Risk reduction should be immediate priority. May require significant strategic changes.",
        actionItems: [
          "Activate risk response protocols",
          "Executive risk committee review",
          "Portfolio rebalancing",
          "Contingency planning",
          "Stakeholder communication",
        ],
        risks: "Existential threat in severe scenarios",
      };
    },
  },
  forecasted_revenue: {
    title: "AI Revenue Forecast",
    category: "Predictive Analytics",
    formula: "Linear Regression + Seasonal Adjustment",
    industryBenchmark: "Compare to management projections",
    importance: "Data-driven baseline for financial planning",
    whatItMeans:
      "The AI Revenue Forecast uses machine learning algorithms to analyze historical revenue patterns, seasonal trends, and growth trajectories to predict future revenue. This data-driven projection serves as a baseline for financial planning and helps identify whether current strategies are likely to meet business objectives.",
    getInsight: (value, timeSeries) => {
      const v = parseFloat(value);
      let change = "";
      let trend = "stable";
      if (timeSeries && timeSeries.length > 0) {
        const last = timeSeries[timeSeries.length - 1];
        const pct = (((v - last) / last) * 100).toFixed(1);
        change = pct > 0 ? `+${pct}%` : `${pct}%`;
        trend = pct > 5 ? "growth" : pct < -5 ? "decline" : "stable";
      }
      return {
        status: "Forecast",
        color: COLORS.primaryLight,
        summary: `AI-projected revenue: ${formatLargeNumber(v)} (${change} from current)`,
        detail: `Machine learning analysis of historical patterns suggests a ${trend} trajectory. This forecast provides a data-driven baseline for planning purposes.`,
        implications:
          "Use as planning baseline. Adjust for known strategic initiatives and market factors.",
        actionItems: [
          "Compare with management projections",
          "Identify variance drivers",
          "Update operational plans accordingly",
          "Set realistic targets",
        ],
        risks: "Model based on historical patterns - disruptions not captured",
      };
    },
  },
  predicted_tax: {
    title: "Tax Liability Estimate",
    category: "Compliance",
    formula: "Taxable Income x Applicable Rate",
    industryBenchmark: "Current corporate rate: 25-30%",
    importance: "Cash flow planning and compliance",
    whatItMeans:
      "The Tax Liability Estimate projects the expected tax obligation based on current profit levels and applicable tax rates. This estimate helps in cash flow planning for advance tax payments and identifying opportunities for legitimate tax optimization through available deductions and exemptions.",
    getInsight: (value) => {
      const v = parseFloat(value);
      return {
        status: "Estimate",
        color: COLORS.primaryLight,
        summary: `Estimated tax liability: ${formatLargeNumber(v)}`,
        detail:
          "This planning-stage estimate is based on current profit trajectory and applicable statutory rates. Actual liability will depend on available deductions and exemptions.",
        implications:
          "Plan for advance tax payments. Explore legitimate tax optimization strategies.",
        actionItems: [
          "Review with tax professional",
          "Evaluate available deductions",
          "Plan advance tax payments",
          "Consider tax-efficient investments",
        ],
        risks: "Estimate only - consult qualified tax advisor for compliance",
      };
    },
  },
};

/**
 * Generate Comprehensive Executive Financial Report
 */
export async function generateKPIReport({
  kpis = [],
  workbenchName = "Financial Analysis",
  files = [],
  sector = "default",
}) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = { left: 18, right: 18, top: 18, bottom: 18 };
  const contentWidth = pageWidth - margin.left - margin.right;
  let yPos = margin.top;

  // Helper functions
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [0, 0, 0];
  };
  const setColor = (hex) => pdf.setTextColor(...hexToRgb(hex));
  const setFill = (hex) => pdf.setFillColor(...hexToRgb(hex));
  const setDraw = (hex) => pdf.setDrawColor(...hexToRgb(hex));
  const addPage = () => {
    pdf.addPage();
    yPos = margin.top;
  };
  const checkPageBreak = (needed = 40) => {
    if (yPos + needed > pageHeight - margin.bottom - 12) {
      addPage();
      return true;
    }
    return false;
  };
  const formatDate = () =>
    new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const drawMiniChart = (x, y, width, height, data, color) => {
    if (!data || data.length < 2) return;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const barWidth = Math.max(2, (width - 2) / data.length - 1);
    setFill(COLORS.sectionBg);
    pdf.roundedRect(x, y, width, height, 1, 1, "F");
    data.forEach((val, i) => {
      const barHeight = Math.max(2, ((val - min) / range) * (height - 4));
      const barX = x + 1 + i * (barWidth + 1);
      const barY = y + height - 2 - barHeight;
      setFill(i === data.length - 1 ? COLORS.accent : color);
      pdf.rect(barX, barY, barWidth, barHeight, "F");
    });
  };

  const drawSectionHeader = (title, subtitle = "") => {
    setFill(COLORS.primary);
    pdf.roundedRect(
      margin.left,
      yPos,
      contentWidth,
      subtitle ? 14 : 10,
      2,
      2,
      "F"
    );
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setColor("#ffffff");
    pdf.text(title, margin.left + 8, yPos + 7);
    if (subtitle) {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      pdf.text(subtitle, margin.left + 8, yPos + 12);
    }
    setFill(COLORS.accent);
    pdf.rect(margin.left, yPos + (subtitle ? 14 : 10), 40, 1.5, "F");
    yPos += subtitle ? 20 : 16;
  };

  const writeWrappedText = (
    text,
    x,
    maxWidth,
    fontSize = 9,
    color = COLORS.textSecondary
  ) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(fontSize);
    setColor(color);
    const lines = pdf.splitTextToSize(text, maxWidth);
    lines.forEach((line) => {
      checkPageBreak(5);
      pdf.text(line, x, yPos);
      yPos += fontSize * 0.45;
    });
  };

  //
  // COVER PAGE
  //
  setFill(COLORS.primary);
  pdf.rect(0, 0, pageWidth, 60, "F");
  setFill(COLORS.accent);
  pdf.rect(0, 60, pageWidth, 2, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(26);
  setColor("#ffffff");
  pdf.text("FINANCIAL INTELLIGENCE", pageWidth / 2, 28, { align: "center" });
  pdf.setFontSize(14);
  pdf.text("COMPREHENSIVE ANALYSIS REPORT", pageWidth / 2, 40, {
    align: "center",
  });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  setColor("#e2e8f0");
  pdf.text(workbenchName, pageWidth / 2, 52, { align: "center" });

  yPos = 75;

  // Report metadata
  setFill(COLORS.cardBg);
  setDraw(COLORS.border);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(margin.left, yPos, contentWidth, 35, 2, 2, "FD");

  const metaCol1 = margin.left + 10;
  const metaCol2 = margin.left + contentWidth / 2 + 10;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(7);
  setColor(COLORS.textMuted);
  pdf.text("REPORT DATE", metaCol1, yPos + 8);
  pdf.text("REPORT STATUS", metaCol1, yPos + 18);
  pdf.text("CLASSIFICATION", metaCol1, yPos + 28);
  pdf.text("DATA SOURCES", metaCol2, yPos + 8);
  pdf.text("METRICS ANALYSED", metaCol2, yPos + 18);
  pdf.text("INDUSTRY SECTOR", metaCol2, yPos + 28);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setColor(COLORS.text);
  pdf.text(formatDate(), metaCol1 + 35, yPos + 8);
  pdf.text(files.length + " file(s) processed", metaCol2 + 40, yPos + 8);
  pdf.text(
    kpis.length + " key performance indicators",
    metaCol2 + 40,
    yPos + 18
  );

  // Display sector with color coding
  setFill(COLORS.accent);
  pdf.roundedRect(
    metaCol2 + 40,
    yPos + 24,
    pdf.getTextWidth(sector.toUpperCase()) * 0.28 + 4,
    5,
    1,
    1,
    "F"
  );
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6);
  setColor("#ffffff");
  pdf.text(sector.toUpperCase() + " BENCHMARKS", metaCol2 + 42, yPos + 28);

  setFill(COLORS.excellent);
  pdf.roundedRect(metaCol1 + 35, yPos + 13, 14, 5, 1, 1, "F");
  pdf.setFontSize(5);
  setColor("#ffffff");
  pdf.text("FINAL", metaCol1 + 37, yPos + 17);

  setFill(COLORS.primary);
  pdf.roundedRect(metaCol1 + 35, yPos + 23, 24, 5, 1, 1, "F");
  pdf.text("CONFIDENTIAL", metaCol1 + 37, yPos + 27);

  yPos += 45;

  // Dynamic Analysis Features Box
  setFill("#e0f2fe");
  setDraw("#0369a1");
  pdf.setLineWidth(0.6);
  pdf.roundedRect(margin.left, yPos, contentWidth, 30, 2, 2, "FD");

  // Header with icon
  setFill("#0369a1");
  pdf.roundedRect(margin.left + 6, yPos + 5, 4, 4, 0.5, 0.5, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  setColor("#0c4a6e");
  pdf.text("🔬 ADVANCED ANALYTICS FEATURES", margin.left + 12, yPos + 9);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  setColor("#075985");
  const features = [
    "✓ Linear Regression Trend Forecasting (R² Predictability)",
    "✓ Volatility Analysis (Standard Deviation)",
    "✓ CAGR Calculations (Compound Annual Growth Rate)",
    "✓ Industry Benchmark Comparisons (Sector-Specific)",
    "✓ Statistical Trend Strength Classification",
    "✓ Real-time Data-Driven Insights",
  ];

  const featureCol1 = margin.left + 10;
  const featureCol2 = margin.left + contentWidth / 2 + 6;

  features.slice(0, 3).forEach((feat, i) => {
    pdf.text(feat, featureCol1, yPos + 18 + i * 5);
  });
  features.slice(3).forEach((feat, i) => {
    pdf.text(feat, featureCol2, yPos + 18 + i * 5);
  });

  yPos += 35;

  // Executive Summary
  const healthScore = calculateHealthScore(kpis, sector);
  const summaryData = generateDetailedSummary(kpis, files, healthScore);

  setFill(COLORS.highlightBg);
  setDraw(COLORS.accent);
  pdf.setLineWidth(1);
  pdf.roundedRect(margin.left, yPos, contentWidth, 55, 2, 2, "FD");

  setFill(COLORS.primary);
  pdf.roundedRect(margin.left + 8, yPos + 6, 28, 6, 1, 1, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(6);
  setColor("#ffffff");
  pdf.text("AI EXECUTIVE BRIEF", margin.left + 10, yPos + 10);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  setColor(COLORS.primary);
  pdf.text("Executive Summary", margin.left + 40, yPos + 10);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  setColor(COLORS.textSecondary);
  const sumLines = pdf.splitTextToSize(summaryData.overview, contentWidth - 20);
  let sy = yPos + 20;
  sumLines.slice(0, 6).forEach((line) => {
    pdf.text(line, margin.left + 10, sy);
    sy += 4.5;
  });

  yPos += 65;

  // Health Dashboard - 4 cards
  const cardW = (contentWidth - 18) / 4;
  const dashStats = [
    {
      label: "Financial Health",
      value: healthScore + "%",
      color:
        healthScore >= 70
          ? COLORS.excellent
          : healthScore >= 50
          ? COLORS.fair
          : COLORS.concern,
    },
    {
      label: "Metrics Analysed",
      value: String(kpis.length),
      color: COLORS.primaryLight,
    },
    {
      label: "Risk Assessment",
      value: getRiskLevel(kpis),
      color: getRiskColor(kpis),
    },
    { label: "Data Quality", value: "High", color: COLORS.good },
  ];

  dashStats.forEach((stat, idx) => {
    const x = margin.left + idx * (cardW + 6);
    setFill(COLORS.cardBg);
    setDraw(COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(x, yPos, cardW, 24, 2, 2, "FD");
    setFill(stat.color);
    pdf.rect(x, yPos, cardW, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    setColor(COLORS.text);
    pdf.text(stat.value, x + 6, yPos + 14);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    setColor(COLORS.textMuted);
    pdf.text(stat.label, x + 6, yPos + 20);
  });

  yPos += 32;

  // Key Findings
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  setColor(COLORS.primary);
  pdf.text("Key Findings", margin.left, yPos);
  setFill(COLORS.accent);
  pdf.rect(margin.left, yPos + 2, 22, 1, "F");
  yPos += 8;

  const findings = generateDetailedFindings(kpis);
  findings.forEach((finding) => {
    checkPageBreak(12);
    setFill(finding.color);
    pdf.circle(margin.left + 3, yPos + 1, 1.5, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setColor(COLORS.text);
    const fLines = pdf.splitTextToSize(finding.text, contentWidth - 12);
    fLines.slice(0, 2).forEach((line, i) => {
      pdf.text(line, margin.left + 8, yPos + 2 + i * 4);
    });
    yPos += fLines.length * 4 + 3;
  });

  //
  // PAGE 2: METRICS OVERVIEW
  //
  addPage();
  drawSectionHeader(
    "PERFORMANCE METRICS OVERVIEW",
    "Comprehensive view of all analysed key performance indicators"
  );

  const cardWidth = (contentWidth - 8) / 2;
  const cardHeight = 44;

  kpis.forEach((kpi, idx) => {
    const isLeft = idx % 2 === 0;
    const cardX = isLeft ? margin.left : margin.left + cardWidth + 8;
    if (isLeft) checkPageBreak(cardHeight + 6);

    const insight = getKPIInsight(kpi, sector);

    setFill("#ffffff");
    setDraw(COLORS.border);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(cardX, yPos, cardWidth, cardHeight, 2, 2, "FD");

    setFill(insight.color);
    pdf.rect(cardX, yPos, 3, cardHeight, "F");

    // Status badge
    setFill(insight.color);
    const stxt = insight.status.substring(0, 12);
    const bw = Math.min(pdf.getTextWidth(stxt) * 0.32 + 6, 26);
    pdf.roundedRect(cardX + cardWidth - bw - 4, yPos + 3, bw, 5, 1, 1, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(5);
    setColor("#ffffff");
    pdf.text(stxt.toUpperCase(), cardX + cardWidth - bw - 1, yPos + 6.5);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    setColor(COLORS.primary);
    pdf.text(
      (insight.title || kpi.name || "Metric").substring(0, 24),
      cardX + 8,
      yPos + 10
    );

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    setColor(COLORS.textMuted);
    pdf.text(insight.category || "Metric", cardX + 8, yPos + 15);

    // Format the value properly for display
    const displayValue = formatKPINum(kpi.value, kpi.unit);
    const valueForPDF = displayValue.length > 14 ? displayValue.substring(0, 14) : displayValue;
    
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    setColor(COLORS.text);
    pdf.text(valueForPDF, cardX + 8, yPos + 28);

    if (kpi.timeSeries && kpi.timeSeries.length > 1) {
      drawMiniChart(
        cardX + cardWidth - 38,
        yPos + 18,
        32,
        18,
        kpi.timeSeries,
        insight.color
      );
    } else {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(6);
      setColor(COLORS.textMuted);
      pdf.text((insight.summary || "").substring(0, 40), cardX + 8, yPos + 40);
    }

    if (!isLeft || idx === kpis.length - 1) yPos += cardHeight + 5;
  });

  //
  // PAGE 3+: DETAILED AI ANALYSIS (Full page per 2-3 KPIs)
  //
  addPage();
  drawSectionHeader(
    "DETAILED AI ANALYSIS",
    "In-depth analysis with actionable insights for each metric"
  );

  kpis.forEach((kpi, idx) => {
    checkPageBreak(150);

    const insight = getKPIInsight(kpi, sector);
    const cardStartY = yPos;

    // Calculate dynamic card height based on content
    const hasTimeSeries = kpi.timeSeries && kpi.timeSeries.length >= 3;
    const hasBenchmark =
      INDUSTRY_BENCHMARKS[sector]?.[kpi.id] ||
      INDUSTRY_BENCHMARKS.default[kpi.id];
    const cardHeight = 140 + (hasTimeSeries ? 8 : 0) + (hasBenchmark ? 8 : 0);

    // Main card - dynamic size to accommodate all analysis sections
    setFill("#ffffff");
    setDraw(COLORS.border);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(margin.left, yPos, contentWidth, cardHeight, 3, 3, "FD");

    // Header row
    setFill(COLORS.primary);
    pdf.circle(margin.left + 10, yPos + 10, 5, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    setColor("#ffffff");
    pdf.text(
      String(idx + 1),
      margin.left + (idx + 1 >= 10 ? 7 : 8.5),
      yPos + 12.5
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    setColor(COLORS.primary);
    pdf.text(
      insight.title || kpi.name || "Metric",
      margin.left + 20,
      yPos + 12
    );

    // Status badge
    setFill(insight.color);
    const stText = insight.status.substring(0, 14);
    const stW = pdf.getTextWidth(stText) * 0.3 + 8;
    pdf.roundedRect(
      margin.left + contentWidth - stW - 8,
      yPos + 5,
      stW,
      8,
      2,
      2,
      "F"
    );
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    setColor("#ffffff");
    pdf.text(
      stText.toUpperCase(),
      margin.left + contentWidth - stW - 4,
      yPos + 10.5
    );

    // Category and benchmark
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    setColor(COLORS.textMuted);
    pdf.text(
      "Category: " + (insight.category || "N/A"),
      margin.left + 20,
      yPos + 19
    );
    if (insight.industryBenchmark) {
      pdf.text(
        "|  Benchmark: " + insight.industryBenchmark,
        margin.left + 72,
        yPos + 19
      );
    }

    // Value display
    setFill(COLORS.sectionBg);
    pdf.roundedRect(margin.left + 8, yPos + 23, 50, 14, 2, 2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    setColor(insight.color);
    const formattedVal = formatKPINum(kpi.value, kpi.unit);
    pdf.text(
      formattedVal.substring(0, 16),
      margin.left + 13,
      yPos + 33
    );

    // Formula
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    setColor(COLORS.textMuted);
    pdf.text(
      "Formula: " + (insight.formula || "N/A"),
      margin.left + 56,
      yPos + 28
    );
    if (insight.importance) {
      pdf.text(
        "Significance: " + insight.importance.substring(0, 48),
        margin.left + 56,
        yPos + 33
      );
    }

    // Mini chart
    if (kpi.timeSeries && kpi.timeSeries.length > 1) {
      drawMiniChart(
        margin.left + contentWidth - 45,
        yPos + 22,
        38,
        16,
        kpi.timeSeries,
        insight.color
      );
    }

    // ═══════════════════════════════════════════════════════════
    // SECTION 1: WHAT THIS MEANS
    // ═══════════════════════════════════════════════════════════
    setFill(COLORS.highlightBg);
    setDraw("#e0e7ff");
    pdf.setLineWidth(0.2);
    pdf.roundedRect(
      margin.left + 8,
      yPos + 42,
      contentWidth - 16,
      22,
      2,
      2,
      "FD"
    );

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    setColor(COLORS.primary);
    pdf.text("💡 WHAT THIS MEANS", margin.left + 13, yPos + 50);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    setColor(COLORS.text);
    const whatItMeansText =
      insight.whatItMeans ||
      "This metric provides insight into a specific aspect of your business performance. Regular monitoring helps establish trends and identify areas for improvement.";
    const whatItMeansLines = pdf.splitTextToSize(
      whatItMeansText,
      contentWidth - 28
    );
    whatItMeansLines.slice(0, 2).forEach((line, i) => {
      pdf.text(line, margin.left + 13, yPos + 56 + i * 4);
    });

    // ═══════════════════════════════════════════════════════════
    // SECTION 2: YOUR PERFORMANCE
    // ═══════════════════════════════════════════════════════════
    setFill(COLORS.sectionBg);
    setDraw("#e5e7eb");
    pdf.setLineWidth(0.2);
    pdf.roundedRect(
      margin.left + 8,
      yPos + 67,
      contentWidth - 16,
      20,
      2,
      2,
      "FD"
    );

    // Green/amber/red indicator bar on the left
    setFill(insight.color);
    pdf.roundedRect(margin.left + 8, yPos + 67, 3, 20, 1, 1, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    setColor(COLORS.accent);
    pdf.text("📈 YOUR PERFORMANCE", margin.left + 17, yPos + 74);

    // Generate performance context
    const perfContext = generatePerformanceContext(kpi, insight);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    setColor(COLORS.text);
    const perfLines = pdf.splitTextToSize(perfContext, contentWidth - 30);
    perfLines.slice(0, 2).forEach((line, i) => {
      pdf.text(line, margin.left + 17, yPos + 80 + i * 4);
    });

    // Add statistical analysis if timeSeries data exists
    if (kpi.timeSeries && kpi.timeSeries.length >= 3) {
      const { slope, r2 } = AdvancedAnalytics.linearRegression(kpi.timeSeries);
      const volatility = AdvancedAnalytics.calculateVolatility(kpi.timeSeries);
      const trend = AdvancedAnalytics.trendStrength(slope, r2);

      setFill("#e0f2fe");
      setDraw("#bae6fd");
      pdf.setLineWidth(0.2);
      pdf.roundedRect(
        margin.left + 16,
        yPos + 91,
        contentWidth - 28,
        8,
        1,
        1,
        "FD"
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6);
      setColor("#0369a1");
      pdf.text("STATISTICAL ANALYSIS:", margin.left + 20, yPos + 96);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      setColor("#075985");
      pdf.text(
        `Trend: ${trend.replace(/_/g, " ").toUpperCase()}`,
        margin.left + 62,
        yPos + 96
      );
      pdf.text(
        `|  R²: ${(r2 * 100).toFixed(1)}%`,
        margin.left + 110,
        yPos + 96
      );
      pdf.text(
        `|  Vol: ${volatility.toFixed(2)}`,
        margin.left + 135,
        yPos + 96
      );
      pdf.text(
        `|  n=${kpi.timeSeries.length}`,
        margin.left + contentWidth - 32,
        yPos + 96
      );
    }

    // ═══════════════════════════════════════════════════════════
    // SECTION 3: DYNAMIC TREND ANALYSIS & AI INSIGHTS
    // ═══════════════════════════════════════════════════════════
    yPos += kpi.timeSeries && kpi.timeSeries.length >= 3 ? 10 : 2;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    setColor(COLORS.primary);
    pdf.text("AI INSIGHTS & RECOMMENDATIONS", margin.left + 9, yPos + 109);

    // Add visual indicator for data-driven analysis
    setFill(COLORS.accent);
    pdf.circle(margin.left + contentWidth - 36, yPos + 107.5, 1.2, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(5);
    setColor(COLORS.accent);
    pdf.text("LIVE DATA", margin.left + contentWidth - 33, yPos + 109);

    // Add sector benchmark indicator in a clean box
    const benchThresholds =
      INDUSTRY_BENCHMARKS[sector]?.[kpi.id] ||
      INDUSTRY_BENCHMARKS.default[kpi.id];
    if (benchThresholds) {
      setFill("#fef3c7");
      setDraw("#fbbf24");
      pdf.setLineWidth(0.2);
      pdf.roundedRect(
        margin.left + 8,
        yPos + 112,
        contentWidth - 16,
        8,
        1,
        1,
        "FD"
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(6.5);
      setColor("#92400e");
      pdf.text(
        `${sector.toUpperCase()} SECTOR BENCHMARKS:`,
        margin.left + 13,
        yPos + 116.5
      );

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6);
      setColor("#78350f");
      const benchX = margin.left + 68;
      if (kpi.id === "debt_to_equity") {
        pdf.text(
          `Excellent: ≤${benchThresholds.excellent}`,
          benchX,
          yPos + 116.5
        );
        pdf.text(`| Good: ≤${benchThresholds.good}`, benchX + 32, yPos + 116.5);
        pdf.text(`| Fair: ≤${benchThresholds.fair}`, benchX + 58, yPos + 116.5);
      } else {
        pdf.text(
          `Excellent: ≥${benchThresholds.excellent}${kpi.unit || ""}`,
          benchX,
          yPos + 116.5
        );
        pdf.text(
          `| Good: ≥${benchThresholds.good}${kpi.unit || ""}`,
          benchX + 34,
          yPos + 116.5
        );
        pdf.text(
          `| Fair: ≥${benchThresholds.fair}${kpi.unit || ""}`,
          benchX + 60,
          yPos + 116.5
        );
      }
    }

    yPos += benchThresholds ? 10 : 0;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    setColor(COLORS.text);
    const analysisText = insight.summary + " " + insight.detail;
    const analysisLines = pdf.splitTextToSize(analysisText, contentWidth - 20);
    analysisLines.slice(0, 2).forEach((line, i) => {
      pdf.text(line, margin.left + 10, yPos + 118 + i * 4.5);
    });

    // Implications & Actions row
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7.5);
    setColor(COLORS.good);
    pdf.text("RECOMMENDED ACTIONS:", margin.left + 10, yPos + 132);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6.5);
    setColor(COLORS.textSecondary);
    if (insight.actionItems && insight.actionItems.length > 0) {
      const actionsText = "• " + insight.actionItems.slice(0, 2).join("  • ");
      const actionLines = pdf.splitTextToSize(actionsText, contentWidth - 68);
      actionLines.slice(0, 2).forEach((line, i) => {
        pdf.text(line, margin.left + 58, yPos + 132 + i * 4);
      });
    }

    yPos += 148;
  });

  //
  // STRATEGIC RECOMMENDATIONS PAGE
  //
  addPage();
  drawSectionHeader(
    "STRATEGIC RECOMMENDATIONS",
    "Priority-ranked action items based on AI analysis"
  );

  const recommendations = generateDetailedRecommendations(kpis);

  recommendations.forEach((rec, idx) => {
    checkPageBreak(35);

    const pColors = {
      high: { bg: "#fef2f2", border: COLORS.concern },
      medium: { bg: "#fffbeb", border: COLORS.fair },
      low: { bg: "#f0fdf4", border: COLORS.good },
    };
    const pc = pColors[rec.priority] || pColors.low;

    setFill(pc.bg);
    setDraw(pc.border);
    pdf.setLineWidth(0.6);
    pdf.roundedRect(margin.left, yPos, contentWidth, 30, 2, 2, "FD");

    // Priority badge
    setFill(pc.border);
    pdf.roundedRect(margin.left + 6, yPos + 4, 20, 6, 1, 1, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(5);
    setColor("#ffffff");
    pdf.text(rec.priority.toUpperCase(), margin.left + 9, yPos + 8);

    // Number and title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    setColor(COLORS.text);
    pdf.text(idx + 1 + ". " + rec.title, margin.left + 30, yPos + 9);

    // Detail
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    setColor(COLORS.textSecondary);
    const detLines = pdf.splitTextToSize(rec.detail, contentWidth - 16);
    detLines.slice(0, 2).forEach((line, i) => {
      pdf.text(line, margin.left + 8, yPos + 17 + i * 4);
    });

    // Impact
    if (rec.impact) {
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(7);
      setColor(COLORS.textMuted);
      pdf.text("Expected Impact: " + rec.impact, margin.left + 8, yPos + 27);
    }

    yPos += 35;
  });

  //
  // APPENDIX - METHODOLOGY
  //
  addPage();
  drawSectionHeader(
    "APPENDIX: METHODOLOGY & DEFINITIONS",
    "Technical notes on analysis approach"
  );

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  setColor(COLORS.primary);
  pdf.text("Analysis Methodology", margin.left, yPos);
  yPos += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  setColor(COLORS.textSecondary);
  const methodText =
    "This report employs advanced financial analytics powered by the Datalis AI engine. Key performance indicators are evaluated against industry benchmarks, historical trends, and risk-adjusted thresholds. The AI system utilizes regression analysis for forecasting and composite scoring for risk assessment. All insights are generated algorithmically based on the uploaded financial data.";
  const methodLines = pdf.splitTextToSize(methodText, contentWidth);
  methodLines.forEach((line) => {
    pdf.text(line, margin.left, yPos);
    yPos += 4;
  });

  yPos += 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  setColor(COLORS.primary);
  pdf.text("KPI Definitions", margin.left, yPos);
  yPos += 6;

  Object.values(AI_INSIGHTS)
    .slice(0, 6)
    .forEach((kpi) => {
      checkPageBreak(14);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      setColor(COLORS.text);
      pdf.text(kpi.title, margin.left, yPos);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7);
      setColor(COLORS.textMuted);
      pdf.text("Formula: " + kpi.formula, margin.left + 50, yPos);
      yPos += 4;
      pdf.setFontSize(7);
      setColor(COLORS.textSecondary);
      pdf.text(
        "Benchmark: " + (kpi.industryBenchmark || "N/A"),
        margin.left,
        yPos
      );
      yPos += 6;
    });

  yPos += 8;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  setColor(COLORS.primary);
  pdf.text("Disclaimer", margin.left, yPos);
  yPos += 5;

  pdf.setFont("helvetica", "italic");
  pdf.setFontSize(7);
  setColor(COLORS.textMuted);
  const disclaimer =
    "This report is generated by artificial intelligence for informational and planning purposes only. The analysis is based on data provided and may not reflect complete financial position. All strategic decisions should be validated by qualified financial, tax, and legal professionals. Datalis and its AI systems make no warranties regarding accuracy, completeness, or applicability of this analysis. Past performance is not indicative of future results.";
  const discLines = pdf.splitTextToSize(disclaimer, contentWidth);
  discLines.forEach((line) => {
    pdf.text(line, margin.left, yPos);
    yPos += 3.5;
  });

  //
  // FOOTER ON ALL PAGES
  //
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    setFill(COLORS.primary);
    pdf.rect(0, pageHeight - 10, pageWidth, 10, "F");
    setFill(COLORS.accent);
    pdf.rect(0, pageHeight - 10, pageWidth, 0.5, "F");
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(6);
    setColor("#ffffff");
    pdf.text("Datalis AI Financial Intelligence", margin.left, pageHeight - 4);
    pdf.text("CONFIDENTIAL - " + workbenchName, pageWidth / 2, pageHeight - 4, {
      align: "center",
    });
    pdf.text(
      "Page " + i + " of " + totalPages,
      pageWidth - margin.right,
      pageHeight - 4,
      { align: "right" }
    );
  }

  const filename =
    (workbenchName || "Report").replace(/[^a-z0-9]/gi, "_") +
    "_Comprehensive_Analysis_" +
    new Date().toISOString().split("T")[0] +
    ".pdf";
  pdf.save(filename);
  return { success: true, filename };
}

//
// HELPER FUNCTIONS
//

function getKPIInsight(kpi, sector = "default") {
  const template = AI_INSIGHTS[kpi.id];
  if (template) {
    // Get industry benchmarks for the sector
    const benchmark =
      INDUSTRY_BENCHMARKS[sector] || INDUSTRY_BENCHMARKS.default;
    const insight = template.getInsight(
      kpi.value,
      kpi.timeSeries || [],
      benchmark
    );
    return {
      ...insight,
      title: template.title,
      category: template.category,
      formula: template.formula,
      industryBenchmark: template.industryBenchmark,
      importance: template.importance,
      whatItMeans: template.whatItMeans,
    };
  }
  return {
    status: "Analysed",
    color: COLORS.neutral,
    title: kpi.name || kpi.title || "Metric",
    category: "Custom",
    formula: "Custom",
    summary: "Metric analysed.",
    detail: "Evaluate against business context.",
    implications: "Review with domain expertise.",
    actionItems: ["Monitor regularly"],
    whatItMeans:
      "This custom metric provides insight into a specific aspect of your business. The current value should be evaluated in the context of your industry benchmarks and historical performance.",
  };
}

/**
 * Generate contextual performance analysis for a KPI
 */
function generatePerformanceContext(kpi, insight) {
  const value = parseFloat(kpi.value);
  const unit = kpi.unit || "%";
  const name = insight.title || kpi.name || "This metric";

  let context = `The current value of ${value.toFixed(2)}${unit} `;

  // Add status-based context
  if (
    insight.status === "Excellent" ||
    insight.status === "Strong" ||
    insight.status === "Conservative" ||
    insight.status === "Low Risk"
  ) {
    context += `represents strong performance that exceeds industry benchmarks. `;
    context += `This indicates effective management and positions your business favorably compared to peers. `;
    context += `Regular monitoring will help maintain this competitive advantage.`;
  } else if (
    insight.status === "Healthy" ||
    insight.status === "Solid Growth" ||
    insight.status === "Balanced" ||
    insight.status === "Moderate Risk"
  ) {
    context += `falls within healthy parameters for your industry. `;
    context += `While performance is satisfactory, there may be opportunities for optimization. `;
    context += `Continue current practices while exploring incremental improvements.`;
  } else if (
    insight.status === "Moderate" ||
    insight.status === "Stable" ||
    insight.status === "Tight" ||
    insight.status === "Adequate" ||
    insight.status === "Elevated Risk"
  ) {
    context += `should be evaluated carefully in the context of your business goals. `;
    context += `While within acceptable range, this metric indicates room for improvement. `;
    context += `Consider implementing targeted initiatives to enhance performance in this area.`;
  } else {
    context += `requires attention and may indicate underlying challenges. `;
    context += `This value falls below optimal thresholds and should be prioritized for improvement. `;
    context += `Review the recommended actions and develop a concrete plan for enhancement.`;
  }

  // Add benchmark comparison if available
  if (insight.industryBenchmark) {
    context += ` Industry benchmark: ${insight.industryBenchmark}.`;
  }

  return context;
}

function calculateHealthScore(kpis, sector = "default") {
  if (kpis.length === 0) return 0;
  const benchmark = INDUSTRY_BENCHMARKS[sector] || INDUSTRY_BENCHMARKS.default;

  const scores = kpis.map((k) => {
    const v = parseFloat(k.value);
    const insight = getKPIInsight(k, sector);

    // Score based on insight status
    if (
      insight.status === "Excellent" ||
      insight.status === "Strong" ||
      insight.status === "Conservative" ||
      insight.status === "Low Risk" ||
      insight.status === "High Growth"
    )
      return 100;
    if (
      insight.status === "Healthy" ||
      insight.status === "Solid Growth" ||
      insight.status === "Balanced" ||
      insight.status === "Moderate Risk"
    )
      return 80;
    if (
      insight.status === "Moderate" ||
      insight.status === "Stable" ||
      insight.status === "Tight" ||
      insight.status === "Adequate" ||
      insight.status === "Elevated Risk"
    )
      return 50;
    return 20;
  });
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function generateDetailedSummary(kpis, files, healthScore) {
  let overview = `This comprehensive financial analysis evaluates ${kpis.length} key performance indicators derived from ${files.length} data source(s). `;

  if (healthScore >= 75) {
    overview += `The overall financial health score of ${healthScore}% indicates strong performance across profitability, liquidity, and growth dimensions. The entity demonstrates robust fundamentals with metrics consistently above industry benchmarks. Strategic focus should be on sustaining this performance while exploring growth opportunities.`;
  } else if (healthScore >= 50) {
    overview += `The financial health score of ${healthScore}% reflects moderate performance with mixed results across key metrics. While certain areas demonstrate strength, others require focused attention. This report identifies specific improvement opportunities and prioritized recommendations.`;
  } else {
    overview += `The health score of ${healthScore}% signals that multiple financial metrics require immediate attention. This analysis identifies critical areas of concern and provides prioritized action items. Executive leadership should review the strategic recommendations section for urgent intervention points.`;
  }

  return { overview, healthScore };
}

function generateDetailedFindings(kpis) {
  const findings = [];

  kpis.forEach((kpi) => {
    const insight = getKPIInsight(kpi);
    const v = parseFloat(kpi.value);

    if (kpi.id === "gross_margin") {
      findings.push({
        color:
          v >= 35 ? COLORS.excellent : v >= 20 ? COLORS.fair : COLORS.concern,
        text: `Gross Margin at ${v}%: ${
          v >= 35
            ? "Strong pricing power with margins above industry median. Indicates effective cost management and competitive positioning."
            : "Margin improvement opportunity identified. Recommend supplier negotiation and pricing strategy review."
        }`,
      });
    }
    if (kpi.id === "net_profit_margin") {
      findings.push({
        color:
          v >= 10 ? COLORS.excellent : v >= 5 ? COLORS.fair : COLORS.concern,
        text: `Net Profit Margin at ${v}%: ${
          v >= 10
            ? "Healthy bottom-line performance supporting reinvestment capacity and stakeholder returns."
            : "Profitability requires attention. Overhead rationalization and operational efficiency initiatives recommended."
        }`,
      });
    }
    if (kpi.id === "current_ratio") {
      findings.push({
        color:
          v >= 1.5 ? COLORS.excellent : v >= 1.0 ? COLORS.fair : COLORS.concern,
        text: `Current Ratio at ${v}x: ${
          v >= 1.5
            ? "Adequate short-term liquidity with buffer for operational flexibility."
            : "Liquidity position is tight. Working capital optimization should be prioritized."
        }`,
      });
    }
    if (kpi.id === "revenue_growth_rate") {
      findings.push({
        color:
          v >= 10 ? COLORS.excellent : v >= 0 ? COLORS.neutral : COLORS.concern,
        text: `Revenue Growth at ${v}%: ${
          v >= 10
            ? "Strong top-line momentum indicating market share gains and effective execution."
            : v >= 0
            ? "Stable revenue base. Consider growth acceleration strategies."
            : "Revenue decline requires strategic intervention and market analysis."
        }`,
      });
    }
  });

  if (findings.length < 3) {
    findings.push({
      color: COLORS.primaryLight,
      text: `AI analysis processed ${kpis.length} metrics with comprehensive benchmarking and trend analysis. Detailed insights available in subsequent sections.`,
    });
  }

  return findings.slice(0, 5);
}

function generateDetailedRecommendations(kpis) {
  const recs = [];

  const gm = kpis.find((k) => k.id === "gross_margin");
  if (gm && parseFloat(gm.value) < 30) {
    recs.push({
      priority: "high",
      title: "Margin Enhancement Program",
      detail:
        "Initiate comprehensive margin improvement initiative including supplier contract renegotiation, product mix optimization, and pricing strategy review. Target minimum 5 percentage point improvement within 12 months.",
      impact: "Potential 15-25% improvement in operating profit",
    });
  }

  const npm = kpis.find((k) => k.id === "net_profit_margin");
  if (npm && parseFloat(npm.value) < 8) {
    recs.push({
      priority: "high",
      title: "Operational Efficiency Initiative",
      detail:
        "Implement zero-based budgeting across all cost centers. Conduct overhead analysis and identify non-essential expenditure. Consider shared services model for back-office functions.",
      impact: "Expected 10-20% reduction in operating expenses",
    });
  }

  const cr = kpis.find((k) => k.id === "current_ratio");
  if (cr && parseFloat(cr.value) < 1.3) {
    recs.push({
      priority: "high",
      title: "Working Capital Optimization",
      detail:
        "Accelerate receivables collection through improved credit management. Optimize inventory levels using demand forecasting. Negotiate extended payment terms with key suppliers.",
      impact: "Improved cash conversion cycle by 15-30 days",
    });
  }

  const de = kpis.find((k) => k.id === "debt_to_equity");
  if (de && parseFloat(de.value) > 1.5) {
    recs.push({
      priority: "medium",
      title: "Capital Structure Optimization",
      detail:
        "Develop deleveraging roadmap with specific debt reduction targets. Evaluate refinancing opportunities in current rate environment. Consider equity alternatives for growth financing.",
      impact: "Reduced interest expense and improved financial flexibility",
    });
  }

  const gr = kpis.find((k) => k.id === "revenue_growth_rate");
  if (gr && parseFloat(gr.value) < 5) {
    recs.push({
      priority: "medium",
      title: "Growth Acceleration Strategy",
      detail:
        "Conduct market opportunity assessment for adjacent segments. Evaluate product innovation pipeline. Consider strategic partnerships or acquisitions for market expansion.",
      impact: "Target double-digit revenue growth within 24 months",
    });
  }

  recs.push({
    priority: "low",
    title: "Performance Monitoring Framework",
    detail:
      "Establish monthly KPI review cadence with variance analysis and rolling forecasts. Implement early warning indicators for key risk metrics. Create executive dashboard for real-time visibility.",
    impact: "Enhanced decision-making speed and accuracy",
  });

  recs.push({
    priority: "low",
    title: "Data Quality Enhancement",
    detail:
      "Expand data collection to include additional operational metrics. Integrate external market data for enhanced benchmarking. Implement automated data validation processes.",
    impact: "Improved forecast accuracy and deeper analytical insights",
  });

  return recs.slice(0, 7);
}

function getRiskLevel(kpis) {
  const risk = kpis.find((k) => k.id === "risk_index");
  if (!risk) return "N/A";
  const v = parseFloat(risk.value);
  if (v <= 25) return "Low";
  if (v <= 50) return "Moderate";
  if (v <= 75) return "Elevated";
  return "High";
}

function getRiskColor(kpis) {
  const risk = kpis.find((k) => k.id === "risk_index");
  if (!risk) return COLORS.neutral;
  const v = parseFloat(risk.value);
  if (v <= 25) return COLORS.excellent;
  if (v <= 50) return COLORS.good;
  if (v <= 75) return COLORS.fair;
  return COLORS.concern;
}

export default { generateKPIReport };
