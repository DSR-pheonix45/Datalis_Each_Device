/**
 * File Parser Service - Parse CSV and Excel files for KPI calculations
 */

/**
 * Parse CSV file content to JSON
 * @param {string} csvText - Raw CSV text content
 * @param {Object} options - Parsing options
 * @param {boolean} options.strictMode - If false, handle column mismatches gracefully (default: false)
 */
export function parseCSV(csvText, options = {}) {
  const { strictMode = false } = options;

  try {
    const lines = csvText.trim().split(/\r?\n/);

    if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
      return { success: false, error: "Empty file" };
    }

    // Detect delimiter
    const firstLine = lines[0];
    const delimiters = [",", ";", "\t", "|"];
    let delimiter = ",";
    let maxCols = 0;

    delimiters.forEach((d) => {
      const cols = parseCSVLine(firstLine, d).length;
      if (cols > maxCols) {
        maxCols = cols;
        delimiter = d;
      }
    });

    console.log(`📊 Detected delimiter: "${delimiter}" with ${maxCols} columns`);

    // Get headers from first line
    const headers = parseCSVLine(lines[0], delimiter).map((h) =>
      h.trim().replace(/['"]*/g, "")
    );

    if (headers.length === 0 || (headers.length === 1 && !headers[0])) {
      return { success: false, error: "No headers found in CSV" };
    }

    // Parse data rows
    const data = [];
    const warnings = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      const values = parseCSVLine(line, delimiter);
      const row = {};

      // Handle column count mismatches
      if (values.length !== headers.length) {
        if (strictMode) {
          warnings.push(
            `Row ${i}: Column count mismatch (expected ${headers.length}, got ${values.length})`
          );
          continue; // Skip row in strict mode
        }
      }

      headers.forEach((header, index) => {
        // Fill missing values with null, ignore extra values
        row[header] = index < values.length ? values[index] : null;
      });

      data.push(row);
    }

    const normalized = normalizeDatasetOrientation(data, headers);

    return {
      success: true,
      data: normalized.data,
      headers: normalized.headers,
      rowCount: normalized.data.length,
      warnings: warnings.length > 0 ? warnings.slice(0, 10) : undefined,
      orientation: normalized.orientation,
      sourceHeaders: headers,
      pivotMeta: normalized.pivotMeta,
      delimiter,
    };
  } catch (error) {
    console.error("Error parsing CSV:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Parse a single CSV line (handles quoted values with escaped quotes)
 */
function parseCSVLine(line, delimiter = ",") {
  if (!line || !line.trim()) return [];

  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quoted string
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim().replace(/^["']|["']$/g, ""));
      current = "";
    } else {
      current += char;
    }
  }

  // Add last value
  values.push(current.trim().replace(/^["']|["']$/g, ""));

  return values;
}

/**
 * Parse Excel file (requires external library or convert to CSV first)
 * For now, we'll handle it through backend conversion
 */
export async function parseExcel(file) {
  try {
    // This would typically use a library like xlsx
    // For now, return placeholder
    return {
      success: false,
      error:
        "Excel parsing requires backend processing. Please convert to CSV first.",
    };
  } catch (error) {
    console.error("Error parsing Excel:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Detect file type from extension
 */
export function getFileType(fileName) {
  const ext = fileName.split(".").pop().toLowerCase();

  if (ext === "csv") return "csv";
  if (["xlsx", "xls"].includes(ext)) return "excel";
  if (ext === "json") return "json";

  return "unknown";
}

/**
 * Parse file based on type
 */
export async function parseFile(file, fileContent) {
  const fileType = getFileType(file.name);

  switch (fileType) {
    case "csv":
      return parseCSV(fileContent);

    case "json":
      try {
        const data = JSON.parse(fileContent);
        return {
          success: true,
          data: Array.isArray(data) ? data : [data],
          headers: data.length > 0 ? Object.keys(data[0]) : [],
          rowCount: Array.isArray(data) ? data.length : 1,
        };
      } catch (error) {
        return { success: false, error: "Invalid JSON format" };
      }

    case "excel":
      return parseExcel(file);

    default:
      return { success: false, error: "Unsupported file type" };
  }
}

/**
 * Validate data for KPI calculation
 */
export function validateDataForKPIs(data) {
  if (!Array.isArray(data) || data.length === 0) {
    return { valid: false, error: "Data must be a non-empty array" };
  }

  // Check if all rows have consistent structure
  const firstRowKeys = Object.keys(data[0]);

  for (const row of data) {
    const rowKeys = Object.keys(row);

    if (rowKeys.length !== firstRowKeys.length) {
      return { valid: false, error: "Inconsistent row structure" };
    }
  }

  return { valid: true, columns: firstRowKeys, rows: data.length };
}

/**
 * Normalize column names for better matching
 */
export function normalizeColumnName(columnName) {
  return columnName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Detect financial data columns
 */
export function detectFinancialColumns(headers) {
  const financialKeywords = {
    revenue: ["revenue", "sales", "income", "turnover"],
    profit: ["profit", "net_income", "earnings", "pl"],
    cost: ["cost", "expense", "cogs", "expenditure"],
    assets: ["assets", "asset"],
    liabilities: ["liabilities", "liability", "debt"],
    equity: ["equity", "capital", "shareholders"],
    cashFlow: ["cash_flow", "cash", "ocf"],
    date: ["date", "period", "month", "quarter", "year"],
  };

  const detected = {};

  for (const [category, keywords] of Object.entries(financialKeywords)) {
    detected[category] = headers.filter((header) => {
      const normalized = normalizeColumnName(header);
      return keywords.some((keyword) => normalized.includes(keyword));
    });
  }

  return detected;
}

/**
 * Attempt to normalize dataset orientation (row vs column aligned)
 * Detects if data is row-oriented (metrics in rows, dates in columns)
 * and pivots it to column-oriented format for KPI calculation
 */
function normalizeDatasetOrientation(data, headers) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      orientation: "column_aligned",
      data,
      headers,
    };
  }

  if (!Array.isArray(headers) || headers.length === 0) {
    return {
      orientation: "column_aligned",
      data,
      headers,
    };
  }

  const firstHeader = headers[0]?.toLowerCase() || "";

  // Check if first header suggests this is a row-oriented file
  const isAttributeHeader =
    /(period|metric|indicator|kpi|measure|item|account|attribute|parameter|row|field|name)/i.test(
      firstHeader
    );

  // Check if other headers look like dates (e.g., "1995_01_01", "2020-01-01", "Jan 2020")
  const datePatterns = [
    /^\d{4}[-_]\d{2}[-_]\d{2}$/, // 1995_01_01 or 1995-01-01
    /^\d{4}[-_]\d{2}$/, // 1995_01 or 1995-01
    /^\d{4}$/, // 1995
    /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i, // Jan 2020
    /^\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}$/, // 01/01/2020
  ];

  const otherHeaders = headers.slice(1, Math.min(10, headers.length)); // Check first 10 headers
  const dateHeaderCount = otherHeaders.filter((h) =>
    datePatterns.some((pattern) => pattern.test(String(h).trim()))
  ).length;

  const looksLikeDateColumns = dateHeaderCount >= otherHeaders.length * 0.5;

  // Check if first column values look like financial metrics
  const financialMetrics = [
    "revenue",
    "net_income",
    "profit",
    "cogs",
    "assets",
    "liabilities",
    "equity",
    "cash",
    "debt",
    "ebitda",
    "ebit",
    "opex",
    "capex",
    "sales",
    "income",
    "expense",
  ];
  const firstColumnValues = data.map((row) =>
    String(row[headers[0]] || "").toLowerCase()
  );
  const metricMatchCount = firstColumnValues.filter((v) =>
    financialMetrics.some((metric) => v.includes(metric))
  ).length;
  const looksLikeMetricRows =
    metricMatchCount >= 2 || metricMatchCount >= firstColumnValues.length * 0.3;

  console.log(
    `🔄 Orientation detection: isAttributeHeader=${isAttributeHeader}, looksLikeDateColumns=${looksLikeDateColumns}, looksLikeMetricRows=${looksLikeMetricRows}`
  );

  // If headers look like dates and first column has metric names, this is row-oriented
  const needsPivot =
    (isAttributeHeader || looksLikeMetricRows) && looksLikeDateColumns;

  if (!needsPivot) {
    return {
      orientation: "column_aligned",
      data,
      headers,
    };
  }

  console.log("🔄 Pivoting row-oriented data to column-oriented format...");
  const pivoted = pivotAttributeRowsDataset(data, headers);
  console.log(
    `✅ Pivoted: ${pivoted.data.length} rows, columns: ${pivoted.headers
      .slice(0, 10)
      .join(", ")}...`
  );

  return {
    orientation: "row_aligned",
    data: pivoted.data,
    headers: pivoted.headers,
    pivotMeta: {
      attributeColumn: headers[0],
      periodHeaders: headers.slice(1),
      attributeCount: pivoted.headers.length - 1,
    },
  };
}

function pivotAttributeRowsDataset(data, headers) {
  if (headers.length < 2) {
    return { data, headers };
  }

  const attributeKey = headers[0];
  const periodHeaders = headers.slice(1);
  const attributeMap = new Map();

  const pivotedRows = periodHeaders
    .map((periodHeader) => {
      const record = { period: periodHeader };
      let hasValue = false;

      data.forEach((row, index) => {
        const attributeLabel = row[attributeKey];
        if (!attributeLabel) return;

        const normalizedAttr =
          normalizeColumnName(String(attributeLabel)) || `attribute_${index}`;
        attributeMap.set(normalizedAttr, attributeLabel);

        const rawValue = row[periodHeader];
        if (
          rawValue === undefined ||
          rawValue === null ||
          `${rawValue}`.trim() === ""
        ) {
          return;
        }

        const numericValue = parseNumericValue(rawValue);
        record[normalizedAttr] =
          numericValue !== null ? numericValue : rawValue;
        hasValue = true;
      });

      return hasValue ? record : null;
    })
    .filter(Boolean);

  const pivotHeaders = ["period", ...attributeMap.keys()];

  return {
    data: pivotedRows,
    headers: pivotHeaders,
    attributeMap,
  };
}

function isNumericValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "number") {
    return !isNaN(value) && isFinite(value);
  }

  const cleaned = String(value).replace(/[₹$,]/g, "").trim();
  if (cleaned === "") return false;
  return !isNaN(Number(cleaned));
}

function parseNumericValue(value) {
  if (typeof value === "number") {
    return !isNaN(value) && isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[₹$,]/g, "").trim();
    if (cleaned === "") return null;
    const parsed = Number(cleaned);
    return !isNaN(parsed) && isFinite(parsed) ? parsed : null;
  }

  return null;
}
