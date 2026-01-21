import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { formatKPIValue } from "../../utils/numberFormatter";
import {
  computeKPIValue,
  generateTimeSeriesFromData,
  generateSampleTimeSeries,
} from "../../services/kpiEngine";
import {
  BsX,
  BsPlus,
  BsHash,
  BsGraphUp,
  BsCheck2,
  BsCalculator,
  BsFileEarmarkSpreadsheet,
  BsColumns,
  BsLightning,
  BsStars,
  BsArrowRight,
  BsPerson,
  BsBuilding,
} from "react-icons/bs";

// Smart KPI suggestions based on column names
function generateSmartSuggestions(columns) {
  const suggestions = [];
  const colNames = columns.map((c) => c.name.toLowerCase());

  // Find common columns for multiple suggestions
  const revenueCol = columns.find(
    (c) =>
      c.name.toLowerCase().includes("revenue") ||
      c.name.toLowerCase().includes("sales") ||
      c.name.toLowerCase().includes("income")
  );

  const costCol = columns.find(
    (c) =>
      c.name.toLowerCase().includes("cost") ||
      c.name.toLowerCase().includes("cogs") ||
      c.name.toLowerCase().includes("expense")
  );

  // Revenue-related
  if (revenueCol) {
    suggestions.push({
      name: "Total Revenue",
      description: "Sum of all revenue",
      operation: "sum",
      colA: revenueCol.id,
      category: "Revenue",
      icon: "💰",
    });
  }

  // Profit-related
  if (revenueCol && costCol) {
    suggestions.push({
      name: "Gross Profit",
      description: "Revenue minus costs",
      operation: "custom",
      expression: `SUM("${revenueCol.name}") - SUM("${costCol.name}")`,
      category: "Profitability",
      icon: "📈",
    });
    suggestions.push({
      name: "Gross Margin %",
      description: "Profit as percentage of revenue",
      operation: "custom",
      expression: `(SUM("${revenueCol.name}") - SUM("${costCol.name}")) / SUM("${revenueCol.name}") * 100`,
      category: "Profitability",
      icon: "📊",
    });
  }

  // Count-based
  if (
    colNames.some(
      (n) =>
        n.includes("customer") || n.includes("user") || n.includes("client")
    )
  ) {
    const customerCol = columns.find(
      (c) =>
        c.name.toLowerCase().includes("customer") ||
        c.name.toLowerCase().includes("user") ||
        c.name.toLowerCase().includes("client")
    );
    if (customerCol) {
      suggestions.push({
        name: "Total Customers",
        description: "Count of unique customers",
        operation: "count",
        colA: customerCol.id,
        category: "Customers",
        icon: "👥",
      });
    }
  }

  // Date-based growth
  if (
    colNames.some(
      (n) => n.includes("date") || n.includes("month") || n.includes("year")
    )
  ) {
    suggestions.push({
      name: "Period over Period Growth",
      description: "Growth rate compared to previous period",
      operation: "custom",
      expression: "Calculated from time series data",
      category: "Growth",
      icon: "📈",
    });
  }

  // Average metrics
  if (
    colNames.some(
      (n) => n.includes("amount") || n.includes("value") || n.includes("price")
    )
  ) {
    const amountCol = columns.find(
      (c) =>
        c.name.toLowerCase().includes("amount") ||
        c.name.toLowerCase().includes("value") ||
        c.name.toLowerCase().includes("price")
    );
    if (amountCol) {
      suggestions.push({
        name: "Average Transaction Value",
        description: "Mean value per transaction",
        operation: "avg",
        colA: amountCol.id,
        category: "Performance",
        icon: "💵",
      });
    }
  }

  // If we have numeric columns, suggest basic aggregations
  columns.slice(0, 3).forEach((col) => {
    if (!suggestions.find((s) => s.colA === col.id)) {
      suggestions.push({
        name: `Sum of ${col.name}`,
        description: `Total sum of ${col.name}`,
        operation: "sum",
        colA: col.id,
        category: "Metrics",
        icon: "📐",
      });
    }
  });

  return suggestions.slice(0, 6); // Limit to 6 suggestions
}

// Responsive, dynamic KPI Builder Modal
// Props: isOpen, onClose, files, columns, parsedData, onCreateKPI
export default function KPIBuilderModal({
  isOpen,
  onClose,
  files = [],
  columns = [],
  parsedData = {},
  onCreateKPI,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [manualColName, setManualColName] = useState("");
  const [manualCols, setManualCols] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isCompanyKpi, setIsCompanyKpi] = useState(false);

  const [renderType, setRenderType] = useState("numeric"); // 'numeric' | 'graph'
  // Manual value for KPIs without data
  const [manualValue, setManualValue] = useState("");
  const [manualUnit, setManualUnit] = useState("");
  // Numeric config
  const [numericOp, setNumericOp] = useState("sum");
  const [colA, setColA] = useState("");
  const [colB, setColB] = useState("");
  const [label, setLabel] = useState("");
  // Graph config
  const [xCol, setXCol] = useState("");
  const [yCol, setYCol] = useState("");
  const [graphType, setGraphType] = useState("line");

  const [expression, setExpression] = useState("");
  const [selectedColumns, setSelectedColumns] = useState([]);

  const fileColumns = useMemo(() => {
    const base = columns.filter(
      (c) => selectedFileIds.length === 0 || selectedFileIds.includes(c.fileId)
    );
    return [...base, ...manualCols];
  }, [columns, selectedFileIds, manualCols]);

  // Generate smart suggestions based on available columns
  const smartSuggestions = useMemo(() => {
    return generateSmartSuggestions(fileColumns);
  }, [fileColumns]);

  // Apply a suggestion
  const applySuggestion = (suggestion) => {
    setName(suggestion.name);
    setDescription(suggestion.description);
    if (suggestion.colA) setColA(suggestion.colA);
    if (suggestion.operation && suggestion.operation !== "custom") {
      setNumericOp(suggestion.operation);
    }
    if (suggestion.expression) {
      setExpression(suggestion.expression);
    }
    setShowSuggestions(false);
  };

  const addManualColumn = () => {
    const n = manualColName.trim();
    if (!n) return;
    const id = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setManualCols((prev) => [
      ...prev,
      { id, name: n, fileId: selectedFileIds[0] || "manual" },
    ]);
    setManualColName("");
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Please enter a KPI name");
      return;
    }

    // Check if this is a manual KPI (no columns/files) - require manual value
    const hasDataSource = fileColumns.length > 0;

    if (!hasDataSource && renderType === "numeric" && !manualValue.trim()) {
      toast.error("Please enter a value for this KPI");
      return;
    }

    if (
      hasDataSource &&
      renderType === "numeric" &&
      !colA &&
      !expression.trim()
    ) {
      toast.error(
        "Please select a column for numeric calculation or enter a custom expression"
      );
      return;
    }

    if (
      hasDataSource &&
      renderType === "graph" &&
      (!xCol || !yCol) &&
      !expression.trim()
    ) {
      toast.error(
        "Please select both X and Y columns for graph or enter a custom expression"
      );
      return;
    }

    // Build expression from config if not provided
    let expr = expression.trim();
    const q = (n) => (n ? `"${n}"` : "");
    const aName = fileColumns.find((c) => c.id === colA)?.name;
    const bName = fileColumns.find((c) => c.id === colB)?.name;
    const xName = fileColumns.find((c) => c.id === xCol)?.name;
    const yName = fileColumns.find((c) => c.id === yCol)?.name;

    if (!expr && hasDataSource) {
      if (renderType === "numeric") {
        switch (numericOp) {
          case "sum":
            expr = `SUM("${aName}")`;
            break;
          case "avg":
            expr = `AVG("${aName}")`;
            break;
          case "min":
            expr = `MIN("${aName}")`;
            break;
          case "max":
            expr = `MAX("${aName}")`;
            break;
          case "count":
            expr = `COUNT("${aName}")`;
            break;
          case "ratio":
            expr = `SUM("${aName}") / SUM("${bName}")`;
            break;
          case "percent":
            expr = `(SUM("${aName}") - SUM("${bName}")) / SUM("${bName}") * 100`;
            break;
          default:
            break;
        }
      } else {
        expr = `${q(yName)} by ${q(xName)}`;
      }
    } else if (!expr) {
      // Manual KPI without data source
      expr = `Manual: ${name.trim()}`;
    }

    // Parse manual value OR compute from data
    let computedValue = null;
    let timeSeries = null;

    if (manualValue) {
      // Use manual value
      computedValue = parseFloat(manualValue) || manualValue;
      timeSeries = generateSampleTimeSeries(computedValue);
    } else if (hasDataSource && aName) {
      // Compute value from actual data
      computedValue = computeKPIValue(parsedData, aName, numericOp, bName);
      timeSeries = generateTimeSeriesFromData(parsedData, aName);

      // If no time series from data, generate sample based on computed value
      if (!timeSeries && computedValue !== null) {
        timeSeries = generateSampleTimeSeries(computedValue);
      }
    }

    // Determine unit based on operation
    let unit = manualUnit || "";
    if (!unit && numericOp === "percent") {
      unit = "%";
    } else if (!unit && numericOp === "ratio") {
      unit = "x";
    }

    const kpi = {
      id: `userkpi_${Date.now()}`,
      title: name.trim(),
      name: name.trim(),
      description: description.trim() || expr || "User defined KPI",
      expression: expr,
      columns: selectedColumns,
      // Add computed value
      value: computedValue,
      computedValue: computedValue,
      unit: unit,
      category: hasDataSource ? "Custom" : "Manual",
      is_company_kpi: isCompanyKpi,
      // Time series for visualization
      timeSeries: timeSeries,
      meta: {
        renderType,
        label: label || name.trim(),
        numericOp,
        colA,
        colB,
        colAName: aName,
        colBName: bName,
        xCol,
        yCol,
        graphType,
        files: selectedFileIds,
        isManual: !hasDataSource,
      },
    };

    console.log("Creating KPI from modal:", kpi);
    onCreateKPI?.(kpi);
    onClose?.();
    // reset
    setName("");
    setDescription("");
    setSelectedFileIds([]);
    setManualCols([]);
    setManualColName("");
    setRenderType("numeric");
    setNumericOp("sum");
    setColA("");
    setColB("");
    setLabel("");
    setXCol("");
    setYCol("");
    setGraphType("line");
    setExpression("");
    setSelectedColumns([]);
    setManualValue("");
    setManualUnit("");
    setIsCompanyKpi(false);
    setShowSuggestions(true);
  };

  if (!isOpen) return null;

  const operationOptions = [
    { value: "sum", label: "Sum" },
    { value: "avg", label: "Average" },
    { value: "min", label: "Min" },
    { value: "max", label: "Max" },
    { value: "count", label: "Count" },
    { value: "ratio", label: "Ratio (A/B)" },
    { value: "percent", label: "% Change" },
  ];

  const graphOptions = [
    { value: "line", label: "Line Chart" },
    { value: "bar", label: "Bar Chart" },
    { value: "area", label: "Area Chart" },
  ];

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center lg:p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full lg:max-w-3xl bg-[#0a0a0a] lg:bg-[#0a0a0a]/90 backdrop-blur-xl border-t lg:border border-white/10 lg:rounded-2xl shadow-2xl shadow-black/50 h-[90vh] lg:h-auto lg:max-h-[90vh] overflow-auto rounded-t-2xl lg:rounded-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0a] lg:bg-transparent border-b border-white/10 p-4 lg:p-6">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-transparent rounded-t-2xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
                <BsCalculator className="text-white text-base lg:text-lg" />
              </div>
              <div>
                <h2 className="text-base lg:text-lg font-bold text-white">
                  Create Custom KPI
                </h2>
                <p className="text-gray-500 text-xs lg:text-sm">
                  Build a new metric from your data
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <BsX className="text-xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6 pb-8">
          {/* Name & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                KPI Name *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-gray-600"
                placeholder="e.g., Gross Margin %"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Description (optional)
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-gray-600"
                placeholder="Brief description of this KPI"
              />
            </div>
          </div>

          {/* Visibility Toggle */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${isCompanyKpi
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-teal-500/20 text-teal-400"
                    }`}
                >
                  {isCompanyKpi ? (
                    <BsBuilding className="text-lg" />
                  ) : (
                    <BsPerson className="text-lg" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">
                    KPI Visibility
                  </div>
                  <div className="text-xs text-gray-500">
                    {isCompanyKpi
                      ? "Available to the entire company"
                      : "Only visible in your personal dashboard"}
                  </div>
                </div>
              </div>
              <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCompanyKpi(false)}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${!isCompanyKpi
                      ? "bg-teal-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                    }`}
                >
                  Personal
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompanyKpi(true)}
                  className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${isCompanyKpi
                      ? "bg-purple-500 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                    }`}
                >
                  Company
                </button>
              </div>
            </div>
          </div>

          {/* Smart Suggestions - AI-powered KPI recommendations */}
          {showSuggestions && smartSuggestions.length > 0 && (
            <div className="bg-gradient-to-r from-purple-500/5 via-teal-500/5 to-cyan-500/5 border border-purple-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BsStars className="text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">
                    Smart Suggestions
                  </span>
                  <span className="text-xs text-gray-500">
                    Based on your data columns
                  </span>
                </div>
                <button
                  onClick={() => setShowSuggestions(false)}
                  className="text-xs text-gray-500 hover:text-gray-400"
                >
                  Hide
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {smartSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => applySuggestion(suggestion)}
                    className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-lg transition-all text-left group"
                  >
                    <span className="text-lg">{suggestion.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium truncate group-hover:text-purple-300 transition-colors">
                        {suggestion.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {suggestion.category}
                      </div>
                    </div>
                    <BsArrowRight className="text-gray-600 group-hover:text-purple-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No Data Notice - when no files/columns available */}
          {fileColumns.length === 0 && (
            <div className="bg-gradient-to-r from-amber-500/5 to-orange-500/5 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                  <BsLightning className="text-amber-400" />
                </div>
                <div>
                  <div className="text-sm font-medium text-amber-400 mb-1">
                    No Data Source Connected
                  </div>
                  <div className="text-xs text-gray-400">
                    You can create a manual KPI by entering a value below, or
                    import a CSV file to enable data-driven KPIs with smart
                    calculations.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Files Selection */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BsFileEarmarkSpreadsheet className="text-teal-400" />
              <label className="text-gray-400 text-sm font-medium">
                Source Files
              </label>
              {selectedFileIds.length > 0 && (
                <span className="text-xs text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
                  {selectedFileIds.length} selected
                </span>
              )}
            </div>
            <div className="bg-black/20 border border-white/10 rounded-xl p-3 max-h-24 overflow-auto">
              {files.length === 0 ? (
                <div className="text-gray-500 text-sm py-2 text-center">
                  No files in workbench
                </div>
              ) : (
                <div className="space-y-1">
                  {files.map((f) => (
                    <label
                      key={f.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800/30 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFileIds.includes(f.id)}
                        onChange={() =>
                          setSelectedFileIds((prev) =>
                            prev.includes(f.id)
                              ? prev.filter((id) => id !== f.id)
                              : [...prev, f.id]
                          )
                        }
                        className="w-4 h-4 rounded border-gray-600 text-teal-500 focus:ring-teal-500/20 bg-gray-800"
                      />
                      <span className="text-white text-sm truncate">
                        {f.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Columns */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BsColumns className="text-teal-400" />
              <label className="text-gray-400 text-sm font-medium">
                Data Columns
              </label>
              {selectedColumns.length > 0 && (
                <span className="text-xs text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded-full">
                  {selectedColumns.length} selected
                </span>
              )}
            </div>
            <div className="bg-black/20 border border-white/10 rounded-xl p-3 max-h-32 overflow-auto">
              {fileColumns.length === 0 ? (
                <div className="text-gray-500 text-sm py-2 text-center">
                  No columns detected. Add manually below or import CSV for
                  auto-detect.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {fileColumns.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        setSelectedColumns((prev) =>
                          prev.includes(c.id)
                            ? prev.filter((id) => id !== c.id)
                            : [...prev, c.id]
                        )
                      }
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${selectedColumns.includes(c.id)
                        ? "bg-teal-500/20 border-teal-500/50 text-teal-400"
                        : "bg-gray-800/50 border-gray-700/50 text-gray-300 hover:border-teal-500/30"
                        }`}
                    >
                      {selectedColumns.includes(c.id) && (
                        <span className="mr-1">✓</span>
                      )}
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input
                value={manualColName}
                onChange={(e) => setManualColName(e.target.value)}
                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500/50 placeholder:text-gray-600"
                placeholder="Add column manually..."
              />
              <button
                type="button"
                onClick={addManualColumn}
                className="px-4 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:border-teal-500/30 transition-all flex items-center gap-2"
              >
                <BsPlus className="text-lg" />
                Add
              </button>
            </div>
          </div>

          {/* Output Type Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BsLightning className="text-teal-400" />
              <label className="text-gray-400 text-sm font-medium">
                Output Type
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                type="button"
                onClick={() => setRenderType("numeric")}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${renderType === "numeric"
                  ? "bg-teal-500/10 border-teal-500/50"
                  : "bg-gray-900/50 border-gray-800/60 hover:border-gray-700"
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${renderType === "numeric"
                    ? "bg-teal-500/20 text-teal-400"
                    : "bg-gray-800/50 text-gray-400"
                    }`}
                >
                  <BsHash className="text-lg" />
                </div>
                <div className="text-left">
                  <div
                    className={`font-medium text-sm ${renderType === "numeric" ? "text-white" : "text-gray-300"
                      }`}
                  >
                    Numeric
                  </div>
                  <div className="text-xs text-gray-500">
                    Single calculated value
                  </div>
                </div>
                {renderType === "numeric" && (
                  <BsCheck2 className="ml-auto text-teal-400" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setRenderType("graph")}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${renderType === "graph"
                  ? "bg-teal-500/10 border-teal-500/50"
                  : "bg-gray-900/50 border-gray-800/60 hover:border-gray-700"
                  }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${renderType === "graph"
                    ? "bg-teal-500/20 text-teal-400"
                    : "bg-gray-800/50 text-gray-400"
                    }`}
                >
                  <BsGraphUp className="text-lg" />
                </div>
                <div className="text-left">
                  <div
                    className={`font-medium text-sm ${renderType === "graph" ? "text-white" : "text-gray-300"
                      }`}
                  >
                    Graph
                  </div>
                  <div className="text-xs text-gray-500">
                    Visual chart display
                  </div>
                </div>
                {renderType === "graph" && (
                  <BsCheck2 className="ml-auto text-teal-400" />
                )}
              </button>
            </div>

            {/* Manual Value Entry - shown when no files available */}
            {fileColumns.length === 0 && renderType === "numeric" && (
              <div className="p-4 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 border border-teal-500/20 rounded-xl mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <BsHash className="text-teal-400" />
                  <span className="text-sm font-medium text-teal-400">
                    Manual KPI Value
                  </span>
                  <span className="text-xs text-gray-500">
                    (No data source connected)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">
                      KPI Value *
                    </label>
                    <input
                      type="text"
                      value={manualValue}
                      onChange={(e) => setManualValue(e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 placeholder:text-gray-600"
                      placeholder="e.g., 150000 or 25.5%"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">
                      Unit (optional)
                    </label>
                    <input
                      value={manualUnit}
                      onChange={(e) => setManualUnit(e.target.value)}
                      className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 placeholder:text-gray-600"
                      placeholder="e.g., $, %, units"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Numeric Configuration - only when columns available */}
            {renderType === "numeric" && fileColumns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-900/30 border border-gray-800/40 rounded-xl">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Operation
                  </label>
                  <select
                    value={numericOp}
                    onChange={(e) => setNumericOp(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    {operationOptions.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Column A *
                  </label>
                  <select
                    value={colA}
                    onChange={(e) => setColA(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    <option value="">Select...</option>
                    {fileColumns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Column B
                  </label>
                  <select
                    value={colB}
                    onChange={(e) => setColB(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    <option value="">Optional</option>
                    {fileColumns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Tile Label
                  </label>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 placeholder:text-gray-600"
                    placeholder="Display name"
                  />
                </div>
              </div>
            ) : renderType === "graph" ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-gray-900/30 border border-gray-800/40 rounded-xl">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    X Axis *
                  </label>
                  <select
                    value={xCol}
                    onChange={(e) => setXCol(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    <option value="">Select...</option>
                    {fileColumns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Y Axis *
                  </label>
                  <select
                    value={yCol}
                    onChange={(e) => setYCol(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    <option value="">Select...</option>
                    {fileColumns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Chart Type
                  </label>
                  <select
                    value={graphType}
                    onChange={(e) => setGraphType(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 cursor-pointer"
                  >
                    {graphOptions.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">
                    Tile Label
                  </label>
                  <input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="w-full bg-gray-800/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500/50 placeholder:text-gray-600"
                    placeholder="Chart title"
                  />
                </div>
              </div>
            ) : null}

            {/* Live Preview - Show computed value when column is selected */}
            {renderType === "numeric" && colA && fileColumns.length > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BsCheck2 className="text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-400">
                      Preview
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {(() => {
                        const aName = fileColumns.find(
                          (c) => c.id === colA
                        )?.name;
                        const bName = fileColumns.find(
                          (c) => c.id === colB
                        )?.name;
                        const val = aName
                          ? computeKPIValue(parsedData, aName, numericOp, bName)
                          : null;
                        if (val === null) return "--";
                        // Use the new formatter for proper display
                        const unit = numericOp === "percent" ? "%" : numericOp === "ratio" ? "x" : "";
                        return formatKPIValue(val, unit);
                      })()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {numericOp.toUpperCase()} of{" "}
                      {fileColumns.find((c) => c.id === colA)?.name || "column"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Expression */}
          <div>
            <label className="block text-gray-400 text-sm font-medium mb-2">
              Custom Expression (Advanced)
            </label>
            <textarea
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              rows={3}
              className="w-full bg-gray-900/50 border border-gray-800/60 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all placeholder:text-gray-600"
              placeholder='Example: ("Revenue" - "COGS") / "Revenue" * 100'
            />
            <p className="text-gray-600 text-xs mt-1">
              Leave blank to auto-generate from selected options
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0E1117] border-t border-gray-800/60 p-4 lg:p-6 flex gap-3 pb-safe">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-800/50 text-gray-300 rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm lg:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl font-semibold hover:from-teal-400 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md disabled:shadow-none flex items-center justify-center gap-2 text-sm lg:text-base"
          >
            <BsPlus className="text-lg" />
            Create KPI
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
