/**
 * KPI Engine - Clean, simple KPI calculation engine
 *
 * All calculations are validated and clamped to realistic ranges
 */

import { supabase } from "../lib/supabase";
import { formatKPIValue } from "../utils/numberFormatter";

// ==================== HELPER FUNCTIONS ====================

function safeDivide(numerator, denominator, fallback = null) {
  if (!denominator || denominator === 0 || isNaN(denominator)) return fallback;
  if (numerator === null || isNaN(numerator)) return fallback;
  const result = numerator / denominator;
  return isFinite(result) ? result : fallback;
}

/**
 * Find and aggregate column values from data
 * For large datasets, calculates sum/average instead of just last row
 * @param {Array} data - Array of row objects
 * @param {Array} possibleNames - Possible column name variations
 * @param {string} aggregation - 'last' | 'sum' | 'avg' | 'first' (default: 'sum' for large datasets)
 */
function findColumnValue(data, possibleNames, aggregation = "auto") {
  if (!data || data.length === 0) return null;

  // Find the matching column name
  let matchedKey = null;
  const sampleRow = data[0];

  for (const name of possibleNames) {
    const normalizedName = name.toLowerCase().replace(/[_\s-]/g, "");

    for (const key in sampleRow) {
      const normalizedKey = key.toLowerCase().replace(/[_\s-]/g, "");

      if (
        normalizedKey === normalizedName ||
        normalizedKey.includes(normalizedName) ||
        normalizedName.includes(normalizedKey)
      ) {
        matchedKey = key;
        break;
      }
    }
    if (matchedKey) break;
  }

  if (!matchedKey) return null;

  // Parse all values from the matched column
  const values = [];
  for (const row of data) {
    let value = row[matchedKey];

    if (value === null || value === undefined || value === "") continue;

    if (typeof value === "string") {
      value = value.replace(/[₹$,\s]/g, "").trim();
      value = parseFloat(value);
    }

    if (!isNaN(value) && isFinite(value)) {
      values.push(value);
    }
  }

  if (values.length === 0) return null;

  // Determine aggregation method
  // For small datasets (< 10 rows), use last value (likely period-end values)
  // For large datasets, use sum (likely transactional data) or average for ratios
  const effectiveAggregation =
    aggregation === "auto"
      ? values.length <= 10
        ? "last"
        : "sum"
      : aggregation;

  switch (effectiveAggregation) {
    case "last":
      return values[values.length - 1];
    case "first":
      return values[0];
    case "avg":
      return values.reduce((a, b) => a + b, 0) / values.length;
    case "sum":
    default:
      return values.reduce((a, b) => a + b, 0);
  }
}

/**
 * Get aggregated values for ratio calculations
 * Uses sum for both numerator and denominator to maintain ratio accuracy
 */
export function findColumnValueForRatio(data, possibleNames) {
  return findColumnValue(data, possibleNames, "sum");
}

/**
 * Compute KPI value from parsed data
 */
export function computeKPIValue(parsedData, columnName, operation, columnBName = null) {
  if (!parsedData || !columnName) return null;

  // Get all values for the column across all files
  const values = [];

  Object.values(parsedData).forEach((fileData) => {
    if (fileData.data && Array.isArray(fileData.data)) {
      fileData.data.forEach((row) => {
        const val = parseFloat(row[columnName]);
        if (!isNaN(val)) {
          values.push(val);
        }
      });
    }
  });

  if (values.length === 0) return null;

  let result = null;
  let valuesB = [];

  // Get column B values if needed
  if (columnBName && (operation === "ratio" || operation === "percent")) {
    Object.values(parsedData).forEach((fileData) => {
      if (fileData.data && Array.isArray(fileData.data)) {
        fileData.data.forEach((row) => {
          const val = parseFloat(row[columnBName]);
          if (!isNaN(val)) {
            valuesB.push(val);
          }
        });
      }
    });
  }

  switch (operation) {
    case "sum":
      result = values.reduce((a, b) => a + b, 0);
      break;
    case "avg":
      result = values.reduce((a, b) => a + b, 0) / values.length;
      break;
    case "min":
      result = Math.min(...values);
      break;
    case "max":
      result = Math.max(...values);
      break;
    case "count":
      result = values.length;
      break;
    case "ratio":
      if (valuesB.length > 0) {
        const sumA = values.reduce((a, b) => a + b, 0);
        const sumB = valuesB.reduce((a, b) => a + b, 0);
        result = sumB !== 0 ? sumA / sumB : null;
      }
      break;
    case "percent":
      if (valuesB.length > 0) {
        const sumA = values.reduce((a, b) => a + b, 0);
        const sumB = valuesB.reduce((a, b) => a + b, 0);
        result = sumB !== 0 ? ((sumA - sumB) / sumB) * 100 : null;
      }
      break;
    default:
      result = values.reduce((a, b) => a + b, 0);
  }

  // Round to 2 decimal places
  return result !== null ? Math.round(result * 100) / 100 : null;
}

/**
 * Generate time series from parsed data for a column
 */
export function generateTimeSeriesFromData(parsedData, columnName) {
  if (!parsedData || !columnName) return null;
  const values = [];

  Object.values(parsedData).forEach((fileData) => {
    if (fileData.data && Array.isArray(fileData.data)) {
      // Take up to 12 data points from each file
      fileData.data.slice(0, 12).forEach((row) => {
        const val = parseFloat(row[columnName]);
        if (!isNaN(val)) {
          values.push(val);
        }
      });
    }
  });

  return values.length > 0 ? values : null;
}

/**
 * Helper to generate sample time series for manual KPIs
 */
export function generateSampleTimeSeries(baseValue) {
  const numValue =
    typeof baseValue === "number" ? baseValue : parseFloat(baseValue) || 100;
  const points = [];
  for (let i = 0; i < 8; i++) {
    // Generate slight variations around the base value (+/- 15%)
    const variance = (Math.random() - 0.5) * 0.3 * numValue;
    points.push(Math.round((numValue + variance) * 100) / 100);
  }
  return points;
}

function extractTimeSeriesData(data, columnNames) {
  if (!data || !Array.isArray(data) || data.length === 0) return null;

  // Find the matching column name first
  let matchedKey = null;
  const sampleRow = data[0];

  for (const name of columnNames) {
    const normalizedName = name.toLowerCase().replace(/[_\s-]/g, "");

    for (const key in sampleRow) {
      const normalizedKey = key.toLowerCase().replace(/[_\s-]/g, "");

      if (
        normalizedKey === normalizedName ||
        normalizedKey.includes(normalizedName) ||
        normalizedName.includes(normalizedKey)
      ) {
        matchedKey = key;
        break;
      }
    }
    if (matchedKey) break;
  }

  if (!matchedKey) return null;

  // Extract values from each row
  const values = [];
  for (const row of data) {
    let value = row[matchedKey];

    if (value === null || value === undefined || value === "") continue;

    if (typeof value === "string") {
      value = value.replace(/[₹$,\s]/g, "").trim();
      value = parseFloat(value);
    }

    if (!isNaN(value) && isFinite(value)) {
      values.push(value);
    }
  }

  return values.length >= 2 ? values : null;
}

// ==================== KPI TEMPLATES ====================

export const KPI_TEMPLATES = {
  NET_PROFIT_MARGIN: {
    id: "net_profit_margin",
    category: "Profitability",
    name: "Net Profit Margin (%)",
    description: "Shows how much of total revenue becomes profit",
    formula: "(Net Income / Total Revenue) × 100",
    unit: "%",
    icon: "💰",
    calculate: (data) => {
      const netIncome = findColumnValue(data, [
        "net_income",
        "net_profit",
        "profit",
        "pat",
        "net_earnings",
      ]);
      const revenue = findColumnValue(data, [
        "total_revenue",
        "revenue",
        "sales",
        "total_sales",
        "turnover",
      ]);

      if (netIncome !== null && revenue && revenue !== 0) {
        const margin = safeDivide(netIncome, revenue) * 100;
        return margin !== null
          ? Math.max(-100, Math.min(100, margin)).toFixed(2)
          : null;
      }
      return null;
    },
  },

  GROSS_MARGIN: {
    id: "gross_margin",
    category: "Profitability",
    name: "Gross Margin (%)",
    description: "Indicates the efficiency of production or service delivery",
    formula: "((Revenue - COGS) / Revenue) × 100",
    unit: "%",
    icon: "💰",
    calculate: (data) => {
      const revenue = findColumnValue(data, [
        "revenue",
        "total_revenue",
        "sales",
        "total_sales",
        "turnover",
      ]);
      const cogs = findColumnValue(data, [
        "cogs",
        "cost_of_goods_sold",
        "cost_of_sales",
        "direct_costs",
        "cost_of_revenue",
      ]);

      if (revenue && cogs !== null && revenue !== 0) {
        const margin = safeDivide(revenue - cogs, revenue) * 100;
        return margin !== null
          ? Math.max(0, Math.min(100, margin)).toFixed(2)
          : null;
      }
      return null;
    },
  },

  REVENUE_GROWTH_RATE: {
    id: "revenue_growth_rate",
    category: "Growth",
    name: "Revenue Growth Rate (%)",
    description: "Tracks how quickly revenue is increasing over time",
    formula: "((Current Revenue - Previous Revenue) / Previous Revenue) × 100",
    unit: "%",
    icon: "📈",
    calculate: (data) => {
      const revenues = extractTimeSeriesData(data, [
        "revenue",
        "sales",
        "total_revenue",
        "turnover",
      ]);

      if (revenues && revenues.length >= 2) {
        const current = revenues[revenues.length - 1];
        const previous = revenues[revenues.length - 2];

        if (previous !== 0 && previous !== null) {
          const growth =
            safeDivide(current - previous, Math.abs(previous)) * 100;
          return growth !== null
            ? Math.max(-100, Math.min(500, growth)).toFixed(2)
            : null;
        }
      }
      return null;
    },
  },

  CURRENT_RATIO: {
    id: "current_ratio",
    category: "Liquidity",
    name: "Current Ratio",
    description:
      "Measures short-term liquidity and ability to pay current liabilities",
    formula: "Current Assets / Current Liabilities",
    unit: "x",
    icon: "⚙️",
    calculate: (data) => {
      // Use 'avg' for balance sheet items (snapshot values, not cumulative)
      const currentAssets = findColumnValue(
        data,
        ["current_assets", "total_current_assets", "ca"],
        "avg"
      );
      const currentLiabilities = findColumnValue(
        data,
        ["current_liabilities", "total_current_liabilities", "cl"],
        "avg"
      );

      if (
        currentAssets !== null &&
        currentLiabilities &&
        currentLiabilities !== 0
      ) {
        const ratio = safeDivide(currentAssets, currentLiabilities);
        return ratio !== null
          ? Math.max(0, Math.min(10, ratio)).toFixed(2)
          : null;
      }
      return null;
    },
  },

  DEBT_TO_EQUITY: {
    id: "debt_to_equity",
    category: "Leverage",
    name: "Debt-to-Equity Ratio",
    description: "Indicates leverage and long-term financial stability",
    formula: "Total Debt / Total Equity",
    unit: "x",
    icon: "⚙️",
    calculate: (data) => {
      // Use 'avg' for balance sheet items (snapshot values)
      const debt = findColumnValue(
        data,
        [
          "total_debt",
          "debt",
          "total_liabilities",
          "liabilities",
          "borrowings",
        ],
        "avg"
      );
      const equity = findColumnValue(
        data,
        [
          "total_equity",
          "equity",
          "shareholders_equity",
          "owners_equity",
          "net_worth",
        ],
        "avg"
      );

      if (debt !== null && equity && equity !== 0) {
        const ratio = safeDivide(debt, equity);
        return ratio !== null
          ? Math.max(0, Math.min(10, ratio)).toFixed(2)
          : null;
      }
      return null;
    },
  },

  ROE: {
    id: "roe",
    category: "Profitability",
    name: "Return on Equity (%)",
    description: "Measures profitability relative to shareholder equity",
    formula: "(Net Income / Shareholders Equity) × 100",
    unit: "%",
    icon: "💰",
    calculate: (data) => {
      // Net income is cumulative (sum), equity is a snapshot (avg)
      const netIncome = findColumnValue(
        data,
        ["net_income", "net_profit", "profit", "pat"],
        "sum"
      );
      const equity = findColumnValue(
        data,
        ["total_equity", "equity", "shareholders_equity", "net_worth"],
        "avg"
      );

      if (netIncome !== null && equity && equity !== 0) {
        const roe = safeDivide(netIncome, equity) * 100;
        return roe !== null
          ? Math.max(-100, Math.min(200, roe)).toFixed(2)
          : null;
      }
      return null;
    },
  },

  ROA: {
    id: "roa",
    category: "Profitability",
    name: "Return on Assets (%)",
    description: "Measures how efficiently assets generate profit",
    formula: "(Net Income / Total Assets) × 100",
    unit: "%",
    icon: "💰",
    calculate: (data) => {
      // Net income is cumulative (sum), assets is a snapshot (avg)
      const netIncome = findColumnValue(
        data,
        ["net_income", "net_profit", "profit", "pat"],
        "sum"
      );
      const assets = findColumnValue(data, ["total_assets", "assets"], "avg");

      if (netIncome !== null && assets && assets !== 0) {
        const roa = safeDivide(netIncome, assets) * 100;
        return roa !== null
          ? Math.max(-50, Math.min(50, roa)).toFixed(2)
          : null;
      }
      return null;
    },
  },

  OPERATING_MARGIN: {
    id: "operating_margin",
    category: "Profitability",
    name: "Operating Margin (%)",
    description: "Shows operating efficiency before interest and taxes",
    formula: "(Operating Income / Revenue) × 100",
    unit: "%",
    icon: "💰",
    calculate: (data) => {
      const operatingIncome = findColumnValue(data, [
        "operating_income",
        "operating_profit",
        "ebit",
        "pbit",
      ]);
      const revenue = findColumnValue(data, [
        "revenue",
        "total_revenue",
        "sales",
        "turnover",
      ]);

      if (operatingIncome !== null && revenue && revenue !== 0) {
        const margin = safeDivide(operatingIncome, revenue) * 100;
        return margin !== null
          ? Math.max(-100, Math.min(100, margin)).toFixed(2)
          : null;
      }
      return null;
    },
  },

  QUICK_RATIO: {
    id: "quick_ratio",
    category: "Liquidity",
    name: "Quick Ratio",
    description: "Measures immediate liquidity without inventory",
    formula: "(Current Assets - Inventory) / Current Liabilities",
    unit: "x",
    icon: "⚙️",
    calculate: (data) => {
      // Balance sheet items use average
      const currentAssets = findColumnValue(
        data,
        ["current_assets", "total_current_assets"],
        "avg"
      );
      const inventory =
        findColumnValue(data, ["inventory", "inventories", "stock"], "avg") ||
        0;
      const currentLiabilities = findColumnValue(
        data,
        ["current_liabilities", "total_current_liabilities"],
        "avg"
      );

      if (
        currentAssets !== null &&
        currentLiabilities &&
        currentLiabilities !== 0
      ) {
        const ratio = safeDivide(currentAssets - inventory, currentLiabilities);
        return ratio !== null
          ? Math.max(0, Math.min(10, ratio)).toFixed(2)
          : null;
      }
      return null;
    },
  },

  ASSET_TURNOVER: {
    id: "asset_turnover",
    category: "Efficiency",
    name: "Asset Turnover",
    description: "Measures revenue generated per unit of assets",
    formula: "Revenue / Total Assets",
    unit: "x",
    icon: "💸",
    calculate: (data) => {
      // Revenue is cumulative (sum), assets is a snapshot (avg)
      const revenue = findColumnValue(
        data,
        ["revenue", "total_revenue", "sales", "turnover"],
        "sum"
      );
      const assets = findColumnValue(data, ["total_assets", "assets"], "avg");

      if (revenue !== null && assets && assets !== 0) {
        const ratio = safeDivide(revenue, assets);
        return ratio !== null
          ? Math.max(0, Math.min(10, ratio)).toFixed(2)
          : null;
      }
      return null;
    },
  },

  INVENTORY_TURNOVER: {
    id: "inventory_turnover",
    category: "Efficiency",
    name: "Inventory Turnover",
    description: "Measures how quickly inventory is sold",
    formula: "COGS / Average Inventory",
    unit: "x",
    icon: "💸",
    calculate: (data) => {
      // COGS is cumulative (sum), inventory is a snapshot (avg)
      const cogs = findColumnValue(
        data,
        ["cogs", "cost_of_goods_sold", "cost_of_sales"],
        "sum"
      );
      const inventory = findColumnValue(
        data,
        ["inventory", "inventories", "stock", "avg_inventory"],
        "avg"
      );

      if (cogs !== null && inventory && inventory !== 0) {
        const ratio = safeDivide(cogs, inventory);
        return ratio !== null
          ? Math.max(0, Math.min(50, ratio)).toFixed(2)
          : null;
      }
      return null;
    },
  },

  RECEIVABLES_TURNOVER: {
    id: "receivables_turnover",
    category: "Efficiency",
    name: "Receivables Turnover",
    description: "Measures how quickly customers pay",
    formula: "Revenue / Accounts Receivable",
    unit: "x",
    icon: "💸",
    calculate: (data) => {
      // Revenue is cumulative (sum), receivables is a snapshot (avg)
      const revenue = findColumnValue(
        data,
        ["revenue", "sales", "net_credit_sales"],
        "sum"
      );
      const receivables = findColumnValue(
        data,
        [
          "accounts_receivable",
          "receivables",
          "sundry_debtors",
          "trade_receivables",
        ],
        "avg"
      );

      if (revenue !== null && receivables && receivables !== 0) {
        const ratio = safeDivide(revenue, receivables);
        return ratio !== null
          ? Math.max(0, Math.min(50, ratio)).toFixed(2)
          : null;
      }
      return null;
    },
  },

  INTEREST_COVERAGE: {
    id: "interest_coverage",
    category: "Leverage",
    name: "Interest Coverage Ratio",
    description: "Measures ability to pay interest expenses",
    formula: "EBIT / Interest Expense",
    unit: "x",
    icon: "⚙️",
    calculate: (data) => {
      const ebit = findColumnValue(data, [
        "ebit",
        "operating_income",
        "operating_profit",
        "pbit",
      ]);
      const interest = findColumnValue(data, [
        "interest_expense",
        "interest",
        "finance_costs",
      ]);

      if (ebit !== null && interest && interest !== 0) {
        const ratio = safeDivide(ebit, interest);
        return ratio !== null
          ? Math.max(0, Math.min(50, ratio)).toFixed(2)
          : null;
      }
      return null;
    },
  },

  WORKING_CAPITAL: {
    id: "working_capital",
    category: "Liquidity",
    name: "Working Capital",
    description: "Short-term operational liquidity",
    formula: "Current Assets - Current Liabilities",
    unit: "₹",
    icon: "💸",
    calculate: (data) => {
      // Balance sheet items use average for period representation
      const currentAssets = findColumnValue(
        data,
        ["current_assets", "total_current_assets"],
        "avg"
      );
      const currentLiabilities = findColumnValue(
        data,
        ["current_liabilities", "total_current_liabilities"],
        "avg"
      );

      if (currentAssets !== null && currentLiabilities !== null) {
        return (currentAssets - currentLiabilities).toFixed(2);
      }
      return null;
    },
  },

  NET_PROFIT: {
    id: "net_profit",
    category: "Profitability",
    name: "Net Profit",
    description: "Bottom line profit after all expenses",
    formula: "Total Revenue - All Expenses",
    unit: "₹",
    icon: "💰",
    calculate: (data) => {
      const profit = findColumnValue(data, [
        "net_income",
        "net_profit",
        "profit",
        "pat",
        "net_earnings",
      ]);
      return profit !== null ? profit.toFixed(2) : null;
    },
  },

  TOTAL_REVENUE: {
    id: "total_revenue",
    category: "Performance",
    name: "Total Revenue",
    description: "Total income from operations",
    formula: "Sum of all revenue streams",
    unit: "₹",
    icon: "📊",
    calculate: (data) => {
      const revenue = findColumnValue(data, [
        "total_revenue",
        "revenue",
        "sales",
        "turnover",
        "total_sales",
      ]);
      return revenue !== null ? revenue.toFixed(2) : null;
    },
  },

  EBITDA: {
    id: "ebitda",
    category: "Profitability",
    name: "EBITDA",
    description:
      "Earnings before interest, taxes, depreciation, and amortization",
    formula: "Operating Profit + Depreciation + Amortization",
    unit: "₹",
    icon: "💰",
    calculate: (data) => {
      const directEbitda = findColumnValue(data, ["ebitda"]);
      if (directEbitda !== null) return directEbitda.toFixed(2);

      const operatingProfit = findColumnValue(data, [
        "operating_profit",
        "operating_income",
        "ebit",
      ]);
      const depreciation =
        findColumnValue(data, [
          "depreciation",
          "depreciation_amortization",
          "d_a",
        ]) || 0;
      const amortization = findColumnValue(data, ["amortization"]) || 0;

      if (operatingProfit !== null) {
        return (operatingProfit + depreciation + amortization).toFixed(2);
      }
      return null;
    },
  },

  EBITDA_MARGIN: {
    id: "ebitda_margin",
    category: "Profitability",
    name: "EBITDA Margin (%)",
    description: "EBITDA as percentage of revenue",
    formula: "(EBITDA / Revenue) × 100",
    unit: "%",
    icon: "💰",
    calculate: (data) => {
      const ebitda = findColumnValue(data, ["ebitda"]);
      const revenue = findColumnValue(data, [
        "revenue",
        "total_revenue",
        "sales",
      ]);

      if (ebitda !== null && revenue && revenue !== 0) {
        const margin = safeDivide(ebitda, revenue) * 100;
        return margin !== null
          ? Math.max(-100, Math.min(100, margin)).toFixed(2)
          : null;
      }

      const operatingProfit = findColumnValue(data, [
        "operating_profit",
        "operating_income",
        "ebit",
      ]);
      const depreciation = findColumnValue(data, ["depreciation"]) || 0;

      if (operatingProfit !== null && revenue && revenue !== 0) {
        const calcEbitda = operatingProfit + depreciation;
        const margin = safeDivide(calcEbitda, revenue) * 100;
        return margin !== null
          ? Math.max(-100, Math.min(100, margin)).toFixed(2)
          : null;
      }

      return null;
    },
  },
};

// ==================== MAIN ANALYSIS FUNCTIONS ====================

/**
 * Analyze uploaded file and detect available KPIs
 */
export async function analyzeFileForKPIs(fileData, fileName) {
  try {
    const data = typeof fileData === "string" ? JSON.parse(fileData) : fileData;

    console.log("🔍 KPI Analysis starting for:", fileName);
    console.log("📊 Data type:", typeof data, "Is Array:", Array.isArray(data));

    if (!Array.isArray(data) || data.length === 0) {
      console.error("❌ Invalid data format - not an array or empty");
      return { success: false, error: "Invalid file data format", kpis: [] };
    }

    console.log("📈 Data rows:", data.length);
    console.log("📋 Columns detected:", Object.keys(data[0]));

    const columns = Object.keys(data[0]).map((col) => col.toLowerCase());
    const availableKPIs = [];

    for (const [key, kpiTemplate] of Object.entries(KPI_TEMPLATES)) {
      try {
        const value = kpiTemplate.calculate(data);

        if (
          value !== null &&
          value !== undefined &&
          !isNaN(parseFloat(value))
        ) {
          console.log(`✅ ${kpiTemplate.name}: ${value}${kpiTemplate.unit}`);
          const timeSeries = extractKPITimeSeries(data, kpiTemplate);

          availableKPIs.push({
            id: kpiTemplate.id,
            name: kpiTemplate.name,
            category: kpiTemplate.category,
            description: kpiTemplate.description,
            formula: kpiTemplate.formula,
            value: parseFloat(value),
            unit: kpiTemplate.unit,
            icon: kpiTemplate.icon,
            timeSeries,
            formattedValue: formatKPIValue(parseFloat(value), kpiTemplate.unit),
            calculatedAt: new Date().toISOString(),
            sourceFile: fileName,
            dataPoints: data.length,
          });
        } else {
          console.log(
            `⚠️ ${kpiTemplate.name}: Could not calculate (missing columns or zero division)`
          );
        }
      } catch (err) {
        console.warn(`Error calculating ${key}:`, err.message);
      }
    }

    console.log(`🎯 Total KPIs detected: ${availableKPIs.length}`);

    return {
      success: true,
      kpis: availableKPIs,
      fileInfo: {
        name: fileName,
        rows: data.length,
        columns: columns.length,
        detectedColumns: columns,
      },
    };
  } catch (error) {
    console.error("Error analyzing file for KPIs:", error);
    return { success: false, error: error.message, kpis: [] };
  }
}

/**
 * V2 version - same as V1 for now
 */
export async function analyzeFileForKPIsV2(fileData, fileName, options = {}) {
  return analyzeFileForKPIs(fileData, fileName);
}

/**
 * Extract time-series data for charts
 */
function extractKPITimeSeries(data, kpiTemplate) {
  if (!data || data.length === 0) return null;

  const kpiId = kpiTemplate.id;

  switch (kpiId) {
    case "gross_margin":
      return data
        .map((row) => {
          const revenue = findColumnValue(
            [row],
            ["revenue", "total_revenue", "sales"]
          );
          const cogs = findColumnValue(
            [row],
            ["cogs", "cost_of_goods_sold", "cost_of_sales"]
          );
          if (revenue && cogs && revenue !== 0) {
            return ((revenue - cogs) / revenue) * 100;
          }
          return null;
        })
        .filter((v) => v !== null);

    case "net_profit_margin":
      return data
        .map((row) => {
          const netIncome = findColumnValue(
            [row],
            ["net_income", "net_profit", "profit"]
          );
          const revenue = findColumnValue(
            [row],
            ["total_revenue", "revenue", "sales"]
          );
          if (netIncome !== null && revenue && revenue !== 0) {
            return (netIncome / revenue) * 100;
          }
          return null;
        })
        .filter((v) => v !== null);

    case "revenue_growth_rate":
    case "total_revenue":
      return extractTimeSeriesData(data, [
        "revenue",
        "sales",
        "total_revenue",
        "turnover",
      ]);

    case "net_profit":
      return extractTimeSeriesData(data, [
        "net_income",
        "net_profit",
        "profit",
        "pat",
      ]);

    default:
      return null;
  }
}

/**
 * Calculate all KPIs for a workbench
 */
export async function calculateAllKPIs(workbenchId) {
  try {
    const { data: files, error } = await supabase
      .from("workbench_files")
      .select("*")
      .eq("workbench_id", workbenchId);

    if (error) throw error;

    const allKPIs = [];

    for (const file of files) {
      const { data: fileContent } = await supabase.storage
        .from("workbench-files")
        .download(file.file_path);

      if (fileContent) {
        const text = await fileContent.text();
        const analysis = await analyzeFileForKPIs(text, file.file_name);

        if (analysis.success) {
          allKPIs.push(...analysis.kpis);
        }
      }
    }

    return { success: true, kpis: allKPIs };
  } catch (error) {
    console.error("Error calculating all KPIs:", error);
    return { success: false, error: error.message, kpis: [] };
  }
}

export async function calculateAllKPIsV2(workbenchId) {
  return calculateAllKPIs(workbenchId);
}

export async function calculateKPIWithAI(kpiId, fileData, workbenchId) {
  try {
    const kpiTemplateKey = Object.keys(KPI_TEMPLATES).find(
      (key) => KPI_TEMPLATES[key].id === kpiId
    );

    if (!kpiTemplateKey) {
      return { success: false, error: "KPI template not found" };
    }

    const kpiTemplate = KPI_TEMPLATES[kpiTemplateKey];
    const data = typeof fileData === "string" ? JSON.parse(fileData) : fileData;
    const value = kpiTemplate.calculate(data);

    if (value === null) {
      return {
        success: false,
        error: "Unable to calculate KPI - missing required data",
      };
    }

    return {
      success: true,
      kpi: {
        id: kpiTemplate.id,
        name: kpiTemplate.name,
        value: parseFloat(value),
        unit: kpiTemplate.unit,
        category: kpiTemplate.category,
        description: kpiTemplate.description,
        formattedValue: formatKPIValue(parseFloat(value), kpiTemplate.unit),
        calculatedAt: new Date().toISOString(),
        formula: kpiTemplate.formula,
        icon: kpiTemplate.icon,
      },
    };
  } catch (error) {
    console.error("Error calculating KPI with AI:", error);
    return { success: false, error: error.message };
  }
}

export function getKPIDefinitions() {
  return KPI_TEMPLATES;
}

export function getFinancialHealthScore(data) {
  try {
    const parsedData = typeof data === "string" ? JSON.parse(data) : data;

    let score = 50;
    let metrics = 0;

    const netMargin = KPI_TEMPLATES.NET_PROFIT_MARGIN.calculate(parsedData);
    if (netMargin !== null) {
      score +=
        parseFloat(netMargin) > 10 ? 10 : parseFloat(netMargin) > 0 ? 5 : -10;
      metrics++;
    }

    const currentRatio = KPI_TEMPLATES.CURRENT_RATIO.calculate(parsedData);
    if (currentRatio !== null) {
      score +=
        parseFloat(currentRatio) > 1.5
          ? 10
          : parseFloat(currentRatio) > 1
          ? 5
          : -10;
      metrics++;
    }

    const debtEquity = KPI_TEMPLATES.DEBT_TO_EQUITY.calculate(parsedData);
    if (debtEquity !== null) {
      score +=
        parseFloat(debtEquity) < 1 ? 10 : parseFloat(debtEquity) < 2 ? 5 : -10;
      metrics++;
    }

    score = Math.max(0, Math.min(100, score));

    let health, message;
    if (score >= 70) {
      health = "Excellent";
      message = "Strong financial position";
    } else if (score >= 50) {
      health = "Good";
      message = "Healthy financials";
    } else if (score >= 30) {
      health = "Fair";
      message = "Some areas need attention";
    } else {
      health = "Concerning";
      message = "Multiple areas need improvement";
    }

    return { health, score, message, metricsAnalyzed: metrics };
  } catch (error) {
    console.error("Error calculating health score:", error);
    return { health: "Unknown", score: 0, message: "Unable to calculate" };
  }
}
