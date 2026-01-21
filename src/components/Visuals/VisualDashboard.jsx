import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import KPIBuilderModal from "../KPIBuilder/KPIBuilderModal";
import { decrementCredits, CREDIT_COSTS, getUserCredits } from "../../services/creditsService";
import {
  analyzeFileForKPIs,
  analyzeFileForKPIsV2,
  computeKPIValue,
  generateTimeSeriesFromData,
} from "../../services/kpiEngine";
import { parseFile } from "../../services/fileParser";
import { generateKPIReport } from "../../services/pdfReportService";
import { supabase } from "../../lib/supabase";
import {
  getFileLocally,
  listAllFilesLocally,
} from "../../utils/localFileStorage";
import { formatKPIValue } from "../../utils/numberFormatter";
import {
  BsBarChart,
  BsPlus,
  BsTrash,
  BsDownload,
  BsArrowUp,
  BsArrowDown,
  BsChevronRight,
  BsChevronLeft,
  BsFolder2Open,
  BsFileEarmarkSpreadsheet,
  BsLightningCharge,
  BsGrid,
  BsEye,
  BsGripVertical,
  BsPerson,
  BsBuilding,
} from "react-icons/bs";

// Professional Bar Chart Component - Power BI style
function ProfessionalChart({ data, color = "#00C6C2", showTrend = true }) {
  if (!data || data.length === 0) {
    // Show placeholder bars when no data
    return (
      <div className="flex items-end gap-[3px] h-12 px-1">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="flex-1 bg-white/10 rounded-t-sm"
            style={{ height: `${20 + (i % 4) * 8}px` }}
          />
        ))}
      </div>
    );
  }

  const w = 160,
    h = 48,
    pad = 4;
  const numericData = data.map((v) =>
    typeof v === "number" ? v : parseFloat(v) || 0
  );
  const max = Math.max(...numericData);
  const min = Math.min(...numericData);
  const range = max - min || 1;

  // Calculate trend
  const isPositiveTrend =
    numericData.length >= 2 &&
    numericData[numericData.length - 1] >= numericData[0];

  const barCount = numericData.length;
  const barWidth = Math.max((w - pad * 2) / barCount - 3, 6);
  const gap = 3;

  return (
    <svg width={w} height={h} className="block">
      <defs>
        <linearGradient
          id={`barGrad-${color.replace("#", "")}`}
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Horizontal grid lines for professional look */}
      <line
        x1={pad}
        y1={h * 0.25}
        x2={w - pad}
        y2={h * 0.25}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />
      <line
        x1={pad}
        y1={h * 0.5}
        x2={w - pad}
        y2={h * 0.5}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />
      <line
        x1={pad}
        y1={h * 0.75}
        x2={w - pad}
        y2={h * 0.75}
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />

      {/* Bars */}
      {numericData.map((v, i) => {
        const barHeight = Math.max(((v - min) / range) * (h - pad * 2), 4);
        const x = pad + i * (barWidth + gap);
        const isLast = i === numericData.length - 1;

        return (
          <rect
            key={i}
            x={x}
            y={h - pad - barHeight}
            width={barWidth}
            height={barHeight}
            fill={isLast ? color : `url(#barGrad-${color.replace("#", "")})`}
            opacity={isLast ? 1 : 0.7}
            rx={2}
            ry={2}
          />
        );
      })}

      {/* Trend line overlay */}
      {showTrend && numericData.length > 1 && (
        <polyline
          fill="none"
          stroke={isPositiveTrend ? "#10B981" : "#EF4444"}
          strokeWidth="1.5"
          strokeDasharray="3,2"
          opacity="0.6"
          points={numericData
            .map((v, i) => {
              const barHeight = ((v - min) / range) * (h - pad * 2);
              const x = pad + i * (barWidth + gap) + barWidth / 2;
              const y = h - pad - barHeight;
              return `${x},${y}`;
            })
            .join(" ")}
        />
      )}
    </svg>
  );
}

// Trend indicator component
function TrendIndicator({ current, previous }) {
  if (!current || !previous || previous === 0) return null;

  const change = ((current - previous) / Math.abs(previous)) * 100;
  const isPositive = change >= 0;

  return (
    <div
      className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
        isPositive
          ? "bg-emerald-500/10 text-emerald-400"
          : "bg-red-500/10 text-red-400"
      }`}
    >
      {isPositive ? (
        <BsArrowUp className="text-[10px]" />
      ) : (
        <BsArrowDown className="text-[10px]" />
      )}
      <span>{Math.abs(change).toFixed(1)}%</span>
    </div>
  );
}

// KPI Card component - Refined Power BI style with real data
function KPICard({
  kpi,
  selected,
  onSelect,
  onDropKPI,
  index,
  timeSeriesData,
}) {
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.classList.add(
      "border-teal-500/50",
      "shadow-lg",
      "shadow-teal-500/10"
    );
  };

  const handleDragLeave = (e) => {
    if (!selected) {
      e.currentTarget.classList.remove(
        "border-teal-500/50",
        "shadow-md",
        "shadow-teal-500/5"
      );
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.classList.remove(
      "border-teal-500/50",
      "shadow-md",
      "shadow-teal-500/5"
    );
    const data = e.dataTransfer.getData("text/plain");
    if (data) onDropKPI(index, data);
  };

  // Use computed value if available and format it properly
  const rawValue = kpi?.computedValue ?? kpi?.value ?? null;
  const displayUnit = kpi?.unit || "";

  // Format the value for display using our smart formatter
  const displayValue =
    rawValue !== null ? formatKPIValue(rawValue, displayUnit) : "--";

  // Get chart data for this KPI
  const chartData = timeSeriesData?.[kpi?.id] || kpi?.timeSeries || null;

  // Calculate trend from time series
  const getTrend = () => {
    if (!chartData || chartData.length < 2) return null;
    const current = chartData[chartData.length - 1];
    const previous = chartData[chartData.length - 2];
    return { current, previous };
  };

  const trend = getTrend();

  // Determine chart color based on category or trend
  const getChartColor = () => {
    const category = kpi?.category?.toLowerCase() || "";
    if (category.includes("stability") || category.includes("risk"))
      return "#F59E0B"; // amber
    if (category.includes("liquidity")) return "#3B82F6"; // blue
    return "#00C6C2"; // teal default
  };

  // Get category color and background
  const getCategoryStyle = () => {
    const category = kpi?.category?.toLowerCase() || "";
    if (category.includes("profit"))
      return {
        bg: "bg-emerald-500/10",
        text: "text-emerald-400",
        border: "border-emerald-500/20",
      };
    if (category.includes("growth"))
      return {
        bg: "bg-purple-500/10",
        text: "text-purple-400",
        border: "border-purple-500/20",
      };
    if (category.includes("stability"))
      return {
        bg: "bg-amber-500/10",
        text: "text-amber-400",
        border: "border-amber-500/20",
      };
    if (category.includes("liquidity"))
      return {
        bg: "bg-blue-500/10",
        text: "text-blue-400",
        border: "border-blue-500/20",
      };
    if (category.includes("ai") || category.includes("predictive"))
      return {
        bg: "bg-pink-500/10",
        text: "text-pink-400",
        border: "border-pink-500/20",
      };
    return {
      bg: "bg-teal-500/10",
      text: "text-teal-400",
      border: "border-teal-500/20",
    };
  };

  const categoryStyle = getCategoryStyle();

  return (
    <div
      onClick={() => onSelect(index)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`group relative bg-white/5 border ${
        selected
          ? "border-teal-500 shadow-lg shadow-teal-500/20 ring-2 ring-teal-500/30"
          : "border-white/10 hover:border-white/20"
      } rounded-xl p-4 sm:p-5 cursor-pointer hover:border-white/20 transition-all min-h-[180px] sm:min-h-[220px] active:scale-[0.98]`}
    >
      {/* Selection indicator for mobile */}
      {selected && (
        <div className="lg:hidden absolute -top-2 -right-2 w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center z-10">
          <svg className="w-3.5 h-3.5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
      
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      {kpi ? (
        <div className="relative">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <h3 className="text-white font-semibold text-sm leading-tight pr-2 flex-1">
              {kpi?.title || kpi?.name || "KPI"}
            </h3>
            <div className="flex items-center gap-1.5">
              {kpi.is_company_kpi && (
                <span className="flex items-center gap-1 text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full">
                  <BsBuilding className="text-[8px]" />
                  Company
                </span>
              )}
              <span
                className={`text-[10px] ${categoryStyle.bg} ${categoryStyle.text} ${categoryStyle.border} border px-2 py-0.5 rounded-full whitespace-nowrap`}
              >
                {kpi?.category || "Metric"}
              </span>
            </div>
          </div>

          {/* Value Section */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-3xl font-bold text-white tracking-tight">
                {displayValue}
              </span>
              {trend && (
                <TrendIndicator
                  current={trend.current}
                  previous={trend.previous}
                />
              )}
            </div>
            {kpi.formula && (
              <div className="text-[10px] text-gray-600 mt-1.5 font-mono bg-gray-900/50 px-2 py-1 rounded inline-block">
                {kpi.formula}
              </div>
            )}
          </div>

          {/* Professional Chart Section */}
          <div className="mb-3 bg-black/20 rounded-lg p-2">
            <ProfessionalChart
              data={chartData}
              color={getChartColor()}
              showTrend={true}
            />
          </div>

          {/* Description */}
          <div className="text-gray-500 text-xs leading-relaxed line-clamp-2">
            {kpi?.description}
          </div>
        </div>
      ) : (
        <>
          {/* Empty state */}
          <div className="flex flex-col h-full justify-between opacity-60 hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
                <BsPlus className="text-teal-400 text-xl" />
              </div>
              <div>
                <span className="text-gray-300 text-sm font-medium block">
                  Available Slot
                </span>
                <span className="text-[10px] text-gray-500">
                  Ready for data
                </span>
              </div>
            </div>

            <div className="flex-1 bg-black/20 rounded-lg p-2 flex items-center justify-center border border-white/5 border-dashed">
              <div className="text-center">
                <BsBarChart className="text-2xl text-gray-700 mx-auto mb-2" />
                <div className="h-1 w-16 bg-gray-800 rounded mx-auto mb-1"></div>
                <div className="h-1 w-12 bg-gray-800 rounded mx-auto"></div>
              </div>
            </div>

            <div className="mt-3 text-teal-500/80 text-[10px] uppercase tracking-wider font-semibold flex items-center justify-center gap-2 bg-teal-500/5 py-1.5 rounded border border-teal-500/10">
              <BsGripVertical />
              Drag KPI Here
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Inline KPIBuilderModal removed; using external component instead.

export default function VisualDashboard() {
  const { user } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isKpiModalOpen, setIsKpiModalOpen] = useState(false);
  const [autoDetectedKPIs, setAutoDetectedKPIs] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSavingLayout, setIsSavingLayout] = useState(false);
  const [kpis, setKpis] = useState([]);
  const [canvas, setCanvas] = useState([]);
  const demoInitialized = useRef(false);
  
  // Mobile panel state for bottom sheet
  const [mobilePanel, setMobilePanel] = useState(null); // 'workbench' | 'kpis' | null

  // Missing state variables - add these
  const [workbench, setWorkbench] = useState(null);
  const [files, setFiles] = useState([]);
  const [columns, setColumns] = useState([]);
  const [parsedData, setParsedData] = useState({}); // Store parsed CSV data by fileId

  // Compute KPI values based on parsedData
  const computedKPIs = useMemo(() => {
    return kpis.map((kpi) => {
      // If it's a manual KPI or already has a value and no config, return as is
      const config = kpi.calculation_config;
      if (!config || Object.keys(config).length === 0) {
        return kpi;
      }

      // If we have parsed data, we can try to re-calculate
      if (Object.keys(parsedData).length > 0) {
        // The config might be nested under 'config' or have meta fields
        const meta = config.meta || config;
        const colA = meta.colA;
        const colB = meta.colB;
        const op = meta.operation || meta.numericOp;

        // Find column names
        const aName = columns.find((c) => c.id === colA)?.name;
        const bName = columns.find((c) => c.id === colB)?.name;

        if (aName) {
          const newVal = computeKPIValue(parsedData, aName, op, bName);
          const newSeries = generateTimeSeriesFromData(parsedData, aName);

          return {
            ...kpi,
            title: kpi.name || kpi.title, // Handle name/title mismatch
            value: newVal !== null ? newVal : kpi.value,
            computedValue: newVal !== null ? newVal : kpi.value,
            timeSeries: newSeries || kpi.timeSeries,
          };
        }
      }

      return {
        ...kpi,
        title: kpi.name || kpi.title,
      };
    });
  }, [kpis, parsedData, columns]);

  // Workbench selector states
  const [availableWorkbenches, setAvailableWorkbenches] = useState([]);
  const [selectedWorkbenchId, setSelectedWorkbenchId] = useState("");
  const [workbenchFiles, setWorkbenchFiles] = useState([]);
  const [loadingWorkbenches, setLoadingWorkbenches] = useState(false);
  const [selectedWorkbenchFileIds, setSelectedWorkbenchFileIds] = useState([]);

  const getKPI = useCallback(
    (kpiId) => {
      // Search in computed KPIs first, then auto-detected KPIs
      return (
        computedKPIs.find((k) => k.id === kpiId) ||
        autoDetectedKPIs.find((k) => k.id === kpiId)
      );
    },
    [computedKPIs, autoDetectedKPIs]
  );

  // Add new KPI
  const addKPI = useCallback((kpi) => {
    setKpis((prev) => [...prev, { ...kpi, id: kpi.id || `kpi_${Date.now()}` }]);
  }, []);

  // Save Layout to Supabase
  const saveLayout = useCallback(async (newCanvas) => {
    if (!selectedWorkbenchId || !user?.id) return;
    
    setIsSavingLayout(true);
    try {
      const { error } = await supabase
        .from("kpi_dashboard_layouts")
        .upsert({
          workbench_id: selectedWorkbenchId,
          user_id: user.id,
          layout: newCanvas,
          updated_at: new Date().toISOString()
        }, { onConflict: 'workbench_id,user_id' });

      if (error) throw error;
    } catch (err) {
      console.error("Error saving layout:", err);
    } finally {
      setIsSavingLayout(false);
    }
  }, [selectedWorkbenchId, user?.id]);

  // Set KPI for a specific tile
  const setTileKPI = useCallback(
    (tileIndex, kpiId) => {
      setCanvas((prev) => {
        const newCanvas = [...prev];
        newCanvas[tileIndex] = { ...newCanvas[tileIndex], kpiId };
        saveLayout(newCanvas);
        return newCanvas;
      });
    },
    [saveLayout]
  );

  // Add a new tile to the canvas
  const addTile = useCallback(() => {
    setCanvas((prev) => {
      const newCanvas = [
        ...prev,
        { id: `tile_${Date.now()}`, kpiId: null },
      ];
      saveLayout(newCanvas);
      return newCanvas;
    });
  }, [saveLayout]);

  // Remove a tile from the canvas
  const removeTile = useCallback(
    (index) => {
      setCanvas((prev) => {
        const newCanvas = prev.filter((_, i) => i !== index);
        saveLayout(newCanvas);
        return newCanvas;
      });
    },
    [saveLayout]
  );

  // Create a new workbench
  const createWorkbench = useCallback(() => {
    const name = prompt("Enter workbench name:");
    if (name) {
      setWorkbench({ id: `wb_${Date.now()}`, name });
    }
  }, []);

  // Fetch available workbenches from Supabase
  const fetchWorkbenches = useCallback(async () => {
    if (!user?.id) return;

    setLoadingWorkbenches(true);
    try {
      const { data, error } = await supabase
        .from("workbenches")
        .select("id, name, description, created_at, company_id")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching workbenches:", error);
      } else {
        setAvailableWorkbenches(data || []);
      }
    } catch (err) {
      console.error("Error in fetchWorkbenches:", err);
    } finally {
      setLoadingWorkbenches(false);
    }
  }, [user?.id]);

  // Fetch KPIs for the selected workbench
  const fetchKPIs = useCallback(async (workbenchId) => {
    if (!workbenchId) return;
    try {
      const { data, error } = await supabase
        .from("kpis")
        .select("*")
        .eq("workbench_id", workbenchId);

      if (error) throw error;
      
      // Map DB KPIs to include data from calculation_config for UI consistency
      const mappedKPIs = (data || []).map(k => ({
        ...k,
        ...k.calculation_config, // Flatten config into the object
        id: k.id, // Ensure DB ID is used
      }));
      
      setKpis(mappedKPIs);
    } catch (err) {
      console.error("Error fetching KPIs:", err);
    }
  }, []);

  // Fetch Layout for the selected workbench
  const fetchLayout = useCallback(async (workbenchId) => {
    if (!workbenchId || !user?.id) return;
    try {
      const { data, error } = await supabase
        .from("kpi_dashboard_layouts")
        .select("layout")
        .eq("workbench_id", workbenchId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (data && data.layout) {
        setCanvas(data.layout);
      } else {
        // Default layout if none exists
        setCanvas([
          { id: "tile_1", kpiId: null },
          { id: "tile_2", kpiId: null },
          { id: "tile_3", kpiId: null },
          { id: "tile_4", kpiId: null },
        ]);
      }
    } catch (err) {
      console.error("Error fetching layout:", err);
    }
  }, [user?.id]);

  // Fetch files for selected workbench
  const fetchWorkbenchFiles = useCallback(
    async (workbenchId) => {
      if (!workbenchId || !user?.id) return;

      // Update last_used_by for the workbench
      supabase
        .from("workbenches")
        .update({ last_used_by: user.id })
        .eq("id", workbenchId)
        .then(({ error }) => {
          if (error && error.code === "PGRST204") {
            console.warn("last_used_by column missing in workbenches table. Please run the migration.");
          }
        });

      try {
        const { data, error } = await supabase
          .from("workbench_files")
          .select("id, file_name, bucket_path, file_size, created_at")
          .eq("workbench_id", workbenchId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching workbench files:", error);
          setWorkbenchFiles([]);
        } else {
          setWorkbenchFiles(data || []);
        }
      } catch (err) {
        console.error("Error in fetchWorkbenchFiles:", err);
        setWorkbenchFiles([]);
      }
    },
    [user?.id]
  );

  // Process selected workbench files and add them to the files array
  const processWorkbenchFiles = useCallback(
    async (selectedFileIds) => {
      if (!selectedFileIds || selectedFileIds.length === 0) return;

      // Clear previous workbench files
      setFiles((prev) => prev.filter((f) => !f.workbenchFile));
      setColumns((prev) =>
        prev.filter((c) => !c.fileId.startsWith("wb_file_"))
      );

      const newFiles = [];
      const detectedKPIs = [];
      const allColumns = [];

      // Filter to only selected files
      const selectedWbFiles = workbenchFiles.filter((wbFile) =>
        selectedFileIds.includes(wbFile.id)
      );

      // DEBUG: List all files in IndexedDB
      console.log("🗂️ === DEBUGGING LOCAL STORAGE ===");
      const allStoredPaths = await listAllFilesLocally();
      console.log("📋 All files in IndexedDB:", allStoredPaths);
      console.log(
        "🎯 Looking for these files:",
        selectedWbFiles.map((f) => f.bucket_path)
      );
      console.log("🗂️ === END DEBUG ===");

      setIsAnalyzing(true);

      for (const wbFile of selectedWbFiles) {
        try {
          let content = null;

          // Try method 1: Get from local storage (IndexedDB) - primary method
          console.log(`🔍 Attempting to load "${wbFile.file_name}" from local storage...`);
          try {
            const localFile = await getFileLocally(wbFile.bucket_path);
            if (localFile && localFile.content) {
              content = localFile.content;
              console.log(`✅ Loaded from local storage (${content.length} chars)`);
            }
          } catch (localError) {
            console.error("❌ Local storage error:", localError);
          }

          // Try method 2: Get public URL from Supabase storage (fallback)
          if (!content) {
            console.log(`🔍 Attempting to load "${wbFile.file_name}" from Supabase Storage...`);
            try {
              const { data: urlData } = supabase.storage
                .from("workbench-files")
                .getPublicUrl(wbFile.bucket_path);

              if (urlData?.publicUrl) {
                const response = await fetch(urlData.publicUrl);
                if (response.ok) {
                  content = await response.text();
                  console.log(`✅ Loaded from public URL (${content.length} chars)`);
                }
              }
            } catch (storageError) {
              console.warn("Storage fetch failed:", storageError);
            }
          }

          // Try method 3: Download from storage directly (last resort)
          if (!content) {
            console.log(`🔍 Attempting direct download for "${wbFile.file_name}"...`);
            try {
              const { data, error } = await supabase.storage
                .from("workbench-files")
                .download(wbFile.bucket_path);

              if (!error && data) {
                content = await data.text();
                console.log(`✅ Downloaded directly (${content.length} chars)`);
              } else if (error) {
                console.error("Direct download error:", error);
              }
            } catch (downloadError) {
              console.error("Direct download exception:", downloadError);
            }
          }

          if (!content || content.trim().length === 0) {
            console.error(`❌ Could not retrieve content for file: ${wbFile.file_name}`);
            continue;
          }

          const fileObj = {
            id: `wb_file_${wbFile.id}`,
            name: wbFile.file_name,
            data: content,
            size: wbFile.file_size,
            workbenchFile: true,
            workbenchFileId: wbFile.id,
          };
          newFiles.push(fileObj);

          // Parse and analyze the file
          console.log(`⚙️ Parsing "${wbFile.file_name}"...`);
          const blob = new Blob([content], { type: "text/csv" });
          const file = new File([blob], wbFile.file_name, { type: "text/csv" });
          const parseResult = await parseFile(file, content);

          if (parseResult.success) {
            console.log(`✅ Parse successful: ${parseResult.headers.length} columns, ${parseResult.data.length} rows`);
            
            setParsedData((prev) => ({
              ...prev,
              [fileObj.id]: {
                data: parseResult.data,
                headers: parseResult.headers,
                fileName: wbFile.file_name,
              },
            }));

            if (parseResult.headers && parseResult.headers.length > 0) {
              parseResult.headers.forEach((header, idx) => {
                allColumns.push({
                  id: `col_${fileObj.id}_${idx}`,
                  name: header,
                  fileId: fileObj.id,
                });
              });
            } else {
              console.warn(`⚠️ No headers found in "${wbFile.file_name}"`);
            }

            // Analyze for KPIs
            console.log(`🤖 Analyzing "${wbFile.file_name}" for KPIs...`);
            let analysis;
            try {
              analysis = await analyzeFileForKPIsV2(
                parseResult.data,
                wbFile.file_name
              );
            } catch (v2Error) {
              console.warn("Analysis failed:", v2Error);
              analysis = { success: false };
            }

            if (analysis.success && analysis.kpis && analysis.kpis.length > 0) {
              console.log(`✅ Detected ${analysis.kpis.length} KPIs in "${wbFile.file_name}"`);
              detectedKPIs.push(
                ...analysis.kpis.map((kpi, idx) => ({
                  ...kpi,
                  id: `auto_${fileObj.id}_${idx}_${Date.now()}`,
                  sourceFile: wbFile.file_name,
                  displayValue:
                    kpi.formattedValue || formatKPIValue(kpi.value, kpi.unit),
                }))
              );
            } else {
              console.log(`ℹ️ No KPIs detected in "${wbFile.file_name}"`);
            }
          } else {
            console.error(`❌ Parse failed for "${wbFile.file_name}":`, parseResult.error);
          }
        } catch (err) {
          console.error(`❌ Error processing "${wbFile.file_name}":`, err);
        }
      }

      setFiles((prev) => [...prev, ...newFiles]);
      setColumns((prev) => [...prev, ...allColumns]);

      if (detectedKPIs.length > 0) {
        setAutoDetectedKPIs((prev) => [...prev, ...detectedKPIs]);
        console.log(
          `✅ Auto-detected ${detectedKPIs.length} KPIs from workbench files`
        );

        // Show toast notification
        toast.success(`Detected ${detectedKPIs.length} KPIs from your data!`);

        // Auto-assign detected KPIs to tiles (replace demo KPIs or add new tiles)
        setCanvas((prevCanvas) => {
          let newCanvas = [...prevCanvas];
          let kpiIndex = 0;

          // First, try to fill empty tiles
          for (
            let i = 0;
            i < newCanvas.length && kpiIndex < detectedKPIs.length;
            i++
          ) {
            if (!newCanvas[i].kpiId) {
              newCanvas[i] = {
                ...newCanvas[i],
                kpiId: detectedKPIs[kpiIndex].id,
              };
              kpiIndex++;
            }
          }

          // If we still have KPIs left, replace demo KPIs with real ones
          if (kpiIndex < detectedKPIs.length) {
            for (
              let i = 0;
              i < newCanvas.length && kpiIndex < detectedKPIs.length;
              i++
            ) {
              // Replace demo KPIs (they start with "demo_")
              if (newCanvas[i].kpiId && newCanvas[i].kpiId.startsWith("demo_")) {
                newCanvas[i] = {
                  ...newCanvas[i],
                  kpiId: detectedKPIs[kpiIndex].id,
                };
                kpiIndex++;
              }
            }
          }

          // If we STILL have KPIs left, add new tiles for them
          while (kpiIndex < detectedKPIs.length) {
            newCanvas.push({
              id: `tile_${Date.now()}_${kpiIndex}`,
              kpiId: detectedKPIs[kpiIndex].id,
            });
            kpiIndex++;
          }

          return newCanvas;
        });
      } else {
        toast(
          "No KPIs could be auto-detected. Check column names in your CSV.",
          { icon: "ℹ️" }
        );
      }

      setIsAnalyzing(false);
    },
    [workbenchFiles]
  );

  // Handle workbench selection
  const handleWorkbenchSelect = useCallback(
    async (workbenchId) => {
      setSelectedWorkbenchId(workbenchId);
      setSelectedWorkbenchFileIds([]); // Reset file selection
      if (workbenchId) {
        // Find the workbench object from availableWorkbenches
        const wb = availableWorkbenches.find((w) => w.id === workbenchId);
        if (wb) setWorkbench(wb);

        await fetchWorkbenchFiles(workbenchId);
        await fetchKPIs(workbenchId);
        await fetchLayout(workbenchId);
      } else {
        setWorkbench(null);
        setWorkbenchFiles([]);
        setKpis([]);
        setCanvas([
          { id: "tile_1", kpiId: null },
          { id: "tile_2", kpiId: null },
          { id: "tile_3", kpiId: null },
          { id: "tile_4", kpiId: null },
        ]);
      }
    },
    [fetchWorkbenchFiles, fetchKPIs, fetchLayout, availableWorkbenches]
  );

  // Handle workbench file selection
  const handleWorkbenchFileSelect = useCallback((fileId) => {
    setSelectedWorkbenchFileIds((prev) => {
      if (prev.includes(fileId)) {
        // Deselect file
        return prev.filter((id) => id !== fileId);
      } else {
        // Select file
        return [...prev, fileId];
      }
    });
  }, []);

  // Load selected workbench files for visualization
  const loadSelectedWorkbenchFiles = useCallback(() => {
    if (selectedWorkbenchFileIds.length > 0) {
      processWorkbenchFiles(selectedWorkbenchFileIds);
    }
  }, [selectedWorkbenchFileIds, processWorkbenchFiles]);

  // Fetch workbenches on component mount
  useEffect(() => {
    if (user?.id) {
      fetchWorkbenches();
    }
  }, [user?.id, fetchWorkbenches]);

  // Import files handler with automatic KPI detection
  const importFiles = useCallback(async (fileList) => {
    if (!fileList || fileList.length === 0) return;

    // Convert FileList to array
    const filesArray = Array.from(fileList);
    console.log(
      "📂 Starting file import:",
      filesArray.map((f) => f.name)
    );

    setIsAnalyzing(true);
    const newFiles = [];
    const detectedKPIs = [];
    const allColumns = [];

    for (const file of filesArray) {
      try {
        console.log("📄 Processing file:", file.name);
        const content = await file.text();
        const fileId = `file_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}`;

        const fileObj = {
          id: fileId,
          name: file.name,
          data: content,
          size: file.size,
          type: file.type,
        };
        newFiles.push(fileObj);

        // Parse the file and analyze for KPIs
        const parseResult = await parseFile(file, content);
        console.log(
          "📊 Parse result:",
          parseResult.success
            ? `${parseResult.data?.length} rows, ${parseResult.headers?.length} columns`
            : parseResult.error
        );

        if (parseResult.success) {
          // Store parsed data for KPI calculations
          setParsedData((prev) => ({
            ...prev,
            [fileId]: {
              data: parseResult.data,
              headers: parseResult.headers,
              fileName: file.name,
              orientation: parseResult.orientation || "column_aligned",
              pivotMeta: parseResult.pivotMeta || null,
              sourceHeaders: parseResult.sourceHeaders || parseResult.headers,
            },
          }));

          // Extract columns in the correct format for KPIBuilderModal: [{id, name, fileId}]
          if (parseResult.headers && parseResult.headers.length > 0) {
            parseResult.headers.forEach((header, idx) => {
              allColumns.push({
                id: `col_${fileId}_${idx}`,
                name: header,
                fileId: fileId,
              });
            });
          }

          // Analyze file for automatic KPI detection using V2 engine
          let analysis;
          try {
            console.log("🔍 Analyzing file for KPIs...");
            analysis = await analyzeFileForKPIsV2(parseResult.data, file.name);
            console.log(
              "📈 KPI Analysis result:",
              analysis.success
                ? `Found ${analysis.kpis?.length || 0} KPIs`
                : analysis.error
            );
          } catch (v2Error) {
            console.warn("V2 analysis failed, falling back to V1:", v2Error);
            analysis = await analyzeFileForKPIs(parseResult.data, file.name);
          }

          if (analysis.success && analysis.kpis && analysis.kpis.length > 0) {
            console.log(
              "✅ Detected KPIs:",
              analysis.kpis.map((k) => k.name)
            );
            detectedKPIs.push(
              ...analysis.kpis.map((kpi, idx) => ({
                ...kpi,
                id: `auto_${fileId}_${idx}_${Date.now()}`,
                sourceFile: file.name,
                sourceOrientation: parseResult.orientation || "column_aligned",
                displayValue:
                  kpi.formattedValue || formatKPIValue(kpi.value, kpi.unit),
              }))
            );
          } else {
            console.log(
              "⚠️ No KPIs detected. Check if your CSV has financial columns like: revenue, net_income, cogs, total_assets, etc."
            );
          }
        } else {
          console.error("❌ Failed to parse file:", parseResult.error);
        }
      } catch (err) {
        console.error("Error reading file:", err);
      }
    }

    setFiles((prev) => [...prev, ...newFiles]);
    setColumns((prev) => [...prev, ...allColumns]);

    // Set auto-detected KPIs
    if (detectedKPIs.length > 0) {
      setAutoDetectedKPIs((prev) => [...prev, ...detectedKPIs]);
      console.log(
        `✅ Auto-detected ${detectedKPIs.length} KPIs from uploaded files`
      );

      // Show toast notification
      toast.success(`Detected ${detectedKPIs.length} KPIs from your data!`);

      // Auto-assign detected KPIs to tiles (replace demo KPIs or add new tiles)
      setCanvas((prevCanvas) => {
        let newCanvas = [...prevCanvas];
        let kpiIndex = 0;

        // First, try to fill empty tiles
        for (
          let i = 0;
          i < newCanvas.length && kpiIndex < detectedKPIs.length;
          i++
        ) {
          if (!newCanvas[i].kpiId) {
            newCanvas[i] = {
              ...newCanvas[i],
              kpiId: detectedKPIs[kpiIndex].id,
            };
            kpiIndex++;
          }
        }

        // If we still have KPIs left, replace demo KPIs with real ones
        if (kpiIndex < detectedKPIs.length) {
          for (
            let i = 0;
            i < newCanvas.length && kpiIndex < detectedKPIs.length;
            i++
          ) {
            // Replace demo KPIs (they start with "demo_")
            if (newCanvas[i].kpiId && newCanvas[i].kpiId.startsWith("demo_")) {
              newCanvas[i] = {
                ...newCanvas[i],
                kpiId: detectedKPIs[kpiIndex].id,
              };
              kpiIndex++;
            }
          }
        }

        // If we STILL have KPIs left, add new tiles for them
        while (kpiIndex < detectedKPIs.length) {
          newCanvas.push({
            id: `tile_${Date.now()}_${kpiIndex}`,
            kpiId: detectedKPIs[kpiIndex].id,
          });
          kpiIndex++;
        }

        return newCanvas;
      });
    } else {
      toast(
        "No KPIs could be auto-detected. Try the sample file or check column names.",
        { icon: "ℹ️" }
      );
    }

    setIsAnalyzing(false);
  }, []);

  // Load workbench files when component mounts
  useEffect(() => {
    // Initialize with 4 empty tiles
    if (canvas.length === 0) {
      setCanvas([
        { id: "tile_1", kpiId: null },
        { id: "tile_2", kpiId: null },
        { id: "tile_3", kpiId: null },
        { id: "tile_4", kpiId: null },
      ]);
    }
  }, [canvas.length]);

  // Note: File analysis for KPI detection is now done automatically in importFiles

  // Handle KPI creation with credit deduction
  const handleCreateKPI = async (kpiData) => {
    if (!user) {
      toast.error("You must be logged in to create KPIs");
      return;
    }

    if (!selectedWorkbenchId) {
      toast.error("Please select a workbench first");
      return;
    }

    // Credit check before KPI creation
    const creditsNeeded = CREDIT_COSTS.create_kpi;
    const creditResponse = await getUserCredits(user.id);
    const storedCredits = creditResponse.success ? creditResponse.credits : 0;

    if (storedCredits < creditsNeeded) {
      toast.error(
        `Insufficient credits! Creating a KPI costs ${creditsNeeded} credits. You have ${storedCredits}.`
      );
      return;
    }

    try {
      // Deduct credits for KPI creation
      const creditResult = await decrementCredits(
        user.id,
        creditsNeeded,
        "create_kpi"
      );

      if (!creditResult.success) {
        toast.error(
          creditResult.message || "Failed to deduct credits. Please try again."
        );
        return;
      }

      // Prepare KPI for DB
      const dbKPI = {
        workbench_id: selectedWorkbenchId,
        owner_id: user.id,
        name: kpiData.title || kpiData.name,
        description: kpiData.description,
        type: kpiData.type || "numeric",
        source_type: "calculated",
        calculation_config: kpiData,
        unit: kpiData.unit,
        category: kpiData.category,
        is_personal: !kpiData.is_company_kpi,
        company_id: workbench?.company_id || null,
      };

      const { data, error } = await supabase
        .from("kpis")
        .insert(dbKPI)
        .select()
        .single();

      if (error) throw error;
      
      // Map DB KPI to include data from calculation_config for UI consistency
      const mappedKPI = {
        ...data,
        ...data.calculation_config,
        id: data.id,
      };
      
      // Update UI
      setKpis((prev) => [...prev, mappedKPI]);
      window.dispatchEvent(new Event("creditsUpdated"));
      toast.success("KPI created and saved successfully!");
      setIsKpiModalOpen(false);
    } catch (error) {
      console.error("Error creating KPI:", error);
      toast.error("Failed to create KPI");
    }
  };

  // --- Demo KPIs & mock data ---
  const demoKpis = useMemo(
    () => [
      {
        id: "demo:revenue_growth",
        title: "Revenue Growth %",
        description: "QoQ growth in revenue",
        expression: '("Revenue" - "PrevRevenue") / "PrevRevenue" * 100',
        value: 12.5,
        unit: "%",
        category: "Growth",
        timeSeries: [8.2, 9.1, 10.5, 11.2, 12.5],
      },
      {
        id: "demo:gross_margin",
        title: "Gross Margin %",
        description: "Gross margin percentage",
        expression: '("Revenue" - "COGS") / "Revenue" * 100',
        value: 42.3,
        unit: "%",
        category: "Profitability",
        timeSeries: [38.5, 40.1, 41.2, 41.8, 42.3],
      },
      {
        id: "demo:net_profit",
        title: "Net Profit",
        description: "Total net profit",
        expression: '"NetIncome"',
        value: 2450000,
        unit: "₹",
        category: "Profitability",
        timeSeries: [1800000, 2100000, 2200000, 2350000, 2450000],
      },
      {
        id: "demo:current_ratio",
        title: "Current Ratio",
        description: "Liquidity ratio",
        expression: '"CurrentAssets" / "CurrentLiabilities"',
        value: 1.85,
        unit: "x",
        category: "Liquidity",
        timeSeries: [1.5, 1.6, 1.7, 1.8, 1.85],
      },
      {
        id: "demo:debt_to_equity",
        title: "Debt to Equity",
        description: "Leverage ratio",
        expression: '"TotalDebt" / "Equity"',
        value: 0.65,
        unit: "x",
        category: "Leverage",
        timeSeries: [0.8, 0.75, 0.72, 0.68, 0.65],
      },
      {
        id: "demo:operating_cash_flow",
        title: "Operating Cash Flow",
        description: "OCF over time",
        expression: '"OCF"',
        value: 850000,
        unit: "₹",
        category: "Liquidity",
        timeSeries: [650000, 720000, 780000, 810000, 850000],
      },
    ],
    []
  );

  // Auto-populate first tiles with demo KPIs in an empty canvas (visual hint)
  // Using ref to prevent infinite loop
  useEffect(() => {
    if (
      !selectedWorkbenchId &&
      !demoInitialized.current &&
      canvas.length > 0 &&
      canvas.every((s) => !s.kpiId) &&
      demoKpis.length >= 3 &&
      kpis.length === 0 &&
      autoDetectedKPIs.length === 0
    ) {
      demoInitialized.current = true;

      // Add first 3 demo KPIs to user list with their values
      const demoKpiIds = [];
      const newKpis = [];

      demoKpis.slice(0, 3).forEach((d, i) => {
        const newId = `demo_${d.id}_${Date.now()}_${i}`;
        newKpis.push({
          id: newId,
          title: d.title,
          description: d.description,
          expression: d.expression,
          columns: [],
          value: d.value,
          unit: d.unit,
          category: d.category,
          timeSeries: d.timeSeries,
        });
        demoKpiIds.push(newId);
      });

      // Batch add all demo KPIs at once
      setKpis((prev) => [...prev, ...newKpis]);

      // Assign demo KPIs to first 3 tiles
      setCanvas((prevCanvas) => {
        const newCanvas = [...prevCanvas];
        demoKpiIds.forEach((kpiId, i) => {
          if (newCanvas[i]) {
            newCanvas[i] = { ...newCanvas[i], kpiId };
          }
        });
        return newCanvas;
      });
    }
  }, [canvas, demoKpis, kpis.length, autoDetectedKPIs.length, selectedWorkbenchId]);

  const handleDropKPI = (slotIndex, dropped) => {
    let droppedId = dropped;
    
    // Handle "kpi:" prefix for user-created KPIs
    if (typeof dropped === "string" && dropped.startsWith("kpi:")) {
      droppedId = dropped.slice(4);
    }
    
    let exists = getKPI(droppedId);
    
    // If it is a demo KPI, it might not be in the 'kpis' state yet
    if (!exists && typeof dropped === "string" && (dropped.startsWith("demo:") || dropped.includes(":"))) {
      const demo = demoKpis.find((d) => d.id === dropped);
      if (demo) {
        // Create a new local KPI from the demo template if it's dropped onto the canvas
        const newId = `demo_${demo.id}_${Date.now()}`;
        const newKpi = {
          id: newId,
          title: demo.title,
          description: demo.description,
          expression: demo.expression,
          columns: [],
          value: demo.value,
          unit: demo.unit,
          category: demo.category,
          timeSeries: demo.timeSeries,
        };
        addKPI(newKpi);
        droppedId = newId;
        exists = newKpi;
      }
    }
    
    if (!exists) return;
    setTileKPI(slotIndex, droppedId);
  };

  const handleCanvasClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedIndex(null);
    }
  };

  const SelectedKPI =
    selectedIndex != null ? getKPI(canvas[selectedIndex]?.kpiId) : null;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-56px)] lg:h-[calc(100vh-60px)] bg-[#0a0a0f] overflow-hidden">
      {/* subtract header height */}
      {/* Center Canvas */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 lg:pb-0" onClick={handleCanvasClick}>
        {/* Dashboard Header */}
        <div className="sticky top-0 z-10 bg-[#0a0a0f]/95 backdrop-blur-xl border-b border-gray-800/60 px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-xl blur-lg opacity-60" />
                <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
                  <BsBarChart className="text-white text-base sm:text-lg" />
                </div>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 flex-wrap">
                  {workbench?.name || "Visual Dashboard"}
                  {autoDetectedKPIs.length > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20">
                      {autoDetectedKPIs.length} KPIs
                    </span>
                  )}
                </h1>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Drag and drop KPIs to build your dashboard
                </p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2 sm:gap-3 flex-wrap">
              <button
                onClick={addTile}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-[#161B22] border border-[#21262D] text-[#E6EDF3] hover:bg-[#1C2128] hover:border-teal-500/40 hover:text-teal-400 transition-all text-xs sm:text-sm group"
              >
                <BsPlus className="text-base sm:text-lg text-teal-400" />
                <span className="hidden xs:inline">Add Tile</span>
              </button>
              {autoDetectedKPIs.length > 0 && (
                <button
                  onClick={async () => {
                    // Credit check before PDF export
                    const creditsNeeded = CREDIT_COSTS.generate_basic_report;
                    const storedCredits = parseInt(
                      localStorage.getItem("message_tokens") || "0",
                      10
                    );

                    if (storedCredits < creditsNeeded) {
                      toast.error(
                        `Insufficient credits! Exporting PDF costs ${creditsNeeded} credits. You have ${storedCredits}.`
                      );
                      return;
                    }

                    if (!user) {
                      toast.error("You must be logged in to export reports");
                      return;
                    }

                    setIsGeneratingPDF(true);
                    try {
                      // Deduct credits for PDF export
                      const creditResult = await decrementCredits(
                        user.id,
                        creditsNeeded,
                        "generate_basic_report"
                      );

                      if (!creditResult.success) {
                        toast.error(
                          creditResult.message ||
                            "Failed to deduct credits. Please try again."
                        );
                        return;
                      }

                      // Notify UI to update credits display
                      window.dispatchEvent(new Event("creditsUpdated"));

                      await generateKPIReport({
                        kpis: autoDetectedKPIs,
                        workbenchName: workbench?.name || "Financial Analysis",
                        files: files.map((f) => f.name),
                        summary: {
                          totalKPIs: autoDetectedKPIs.length,
                          healthyKPIs: autoDetectedKPIs.filter(
                            (k) => k.status === "good"
                          ).length,
                        },
                      });
                    } catch (err) {
                      console.error("PDF generation error:", err);
                    } finally {
                      setIsGeneratingPDF(false);
                    }
                  }}
                  disabled={isGeneratingPDF}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#161B22] border border-[#21262D] text-[#E6EDF3] font-medium hover:bg-[#1C2128] hover:border-teal-500/40 hover:text-teal-400 disabled:opacity-50 disabled:hover:border-[#21262D] transition-all text-sm group"
                >
                  {isGeneratingPDF ? (
                    <>
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full"></span>
                      Generating...
                    </>
                  ) : (
                    <>
                      <BsDownload className="text-sm text-teal-400" />
                      Export PDF
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Canvas Grid */}
        <div className="p-3 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {canvas.map((slot, idx) => (
              <div key={slot.id} className="relative group">
                <button
                  onClick={() => removeTile(idx)}
                  title="Remove tile"
                  className="absolute right-2 sm:right-3 top-2 sm:top-3 z-10 p-1.5 sm:p-2 rounded-lg bg-gray-900/80 border border-gray-700/50 text-gray-500 hover:text-red-400 hover:border-red-500/30 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all"
                >
                  <BsTrash className="text-xs" />
                </button>
                <KPICard
                  index={idx}
                  selected={selectedIndex === idx}
                  kpi={getKPI(slot.kpiId)}
                  onSelect={setSelectedIndex}
                  onDropKPI={handleDropKPI}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 sm:mt-6 flex items-center gap-2 text-xs text-gray-600">
            <BsLightningCharge className="text-teal-500" />
            <span className="hidden lg:inline">
              Tip: Drag KPIs from the right panel and drop them on any card to
              assign it.
            </span>
            <span className="lg:hidden">
              Tap a tile, then select a KPI to assign
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Action Bar - Only visible on mobile/tablet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a] backdrop-blur-xl border-t border-white/10 px-4 py-3 z-40 pb-safe">
        <div className="flex items-center gap-3 max-w-md mx-auto">
          <button
            onClick={() => setMobilePanel('workbench')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              mobilePanel === 'workbench' 
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            <BsFolder2Open className="text-sm" />
            <span>Data</span>
          </button>
          <button
            onClick={() => setMobilePanel('kpis')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              mobilePanel === 'kpis' 
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' 
                : 'bg-white/5 text-gray-400 border border-white/10'
            }`}
          >
            <BsBarChart className="text-sm" />
            <span>KPIs ({autoDetectedKPIs.length + computedKPIs.length})</span>
          </button>
          <button
            onClick={() => setIsKpiModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 text-black text-xs font-semibold"
          >
            <BsPlus className="text-lg" />
          </button>
        </div>
      </div>

      {/* Mobile Panel Overlay */}
      {mobilePanel && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobilePanel(null)}
          />
          
          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#0E1117] rounded-t-2xl max-h-[75vh] overflow-hidden animate-slide-up">
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-gray-600 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-4 pb-3 border-b border-white/10">
              <h3 className="text-white font-semibold">
                {mobilePanel === 'workbench' ? 'Import Data' : 'Select KPI'}
              </h3>
              <button
                onClick={() => setMobilePanel(null)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh] pb-8">
              {mobilePanel === 'workbench' ? (
                <div className="space-y-4">
                  {/* Workbench Select */}
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                      <BsFolder2Open className="text-teal-400" />
                      Select Workbench
                    </div>
                    <select
                      value={selectedWorkbenchId}
                      onChange={(e) => handleWorkbenchSelect(e.target.value)}
                      className="w-full px-3 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-teal-500/50"
                    >
                      <option value="">-- Select a workbench --</option>
                      {availableWorkbenches.map((wb) => (
                        <option key={wb.id} value={wb.id}>
                          {wb.name}
                        </option>
                      ))}
                    </select>
                    
                    {/* File Selection */}
                    {selectedWorkbenchId && workbenchFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-xs text-gray-400">
                          Select files ({selectedWorkbenchFileIds.length} selected):
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {workbenchFiles.map((wbFile) => (
                            <div
                              key={wbFile.id}
                              onClick={() => handleWorkbenchFileSelect(wbFile.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                                selectedWorkbenchFileIds.includes(wbFile.id)
                                  ? "bg-teal-500/20 border border-teal-500/40"
                                  : "bg-white/5 border border-white/10"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={selectedWorkbenchFileIds.includes(wbFile.id)}
                                onChange={() => {}}
                                className="w-5 h-5 rounded"
                              />
                              <BsFileEarmarkSpreadsheet className="text-teal-400" />
                              <span className="text-sm text-white truncate flex-1">{wbFile.file_name}</span>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            loadSelectedWorkbenchFiles();
                            setMobilePanel(null);
                          }}
                          disabled={selectedWorkbenchFileIds.length === 0}
                          className="w-full py-3 rounded-xl bg-teal-500 text-black font-semibold text-sm disabled:opacity-50"
                        >
                          Load Files ({selectedWorkbenchFileIds.length})
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Or Upload Files */}
                  <div className="relative flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-gray-500">or</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>
                  
                  <label className="block">
                    <div className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed border-white/20 hover:border-teal-500/50 transition-all cursor-pointer">
                      <BsPlus className="text-2xl text-teal-400" />
                      <div>
                        <div className="text-white font-medium text-sm">Upload Files</div>
                        <div className="text-xs text-gray-500">CSV or Excel files</div>
                      </div>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept=".csv,.xlsx"
                      className="hidden"
                      onChange={(e) => {
                        importFiles(e.target.files);
                        setMobilePanel(null);
                      }}
                    />
                  </label>
                  
                  {/* Imported Files List */}
                  {files.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400">Imported files:</div>
                      {files.map((f) => (
                        <div key={f.id} className="flex items-center gap-2 p-3 bg-white/5 rounded-xl">
                          <BsFileEarmarkSpreadsheet className="text-teal-400" />
                          <span className="text-sm text-white truncate">{f.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* KPIs Panel */
                <div className="space-y-3">
                  {selectedIndex !== null && (
                    <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl mb-4">
                      <div className="text-xs text-teal-400 font-medium">
                        ✓ Tile {selectedIndex + 1} selected — tap a KPI below to assign
                      </div>
                    </div>
                  )}
                  
                  {autoDetectedKPIs.length === 0 && computedKPIs.length === 0 && (
                    <div className="text-center py-8">
                      <BsBarChart className="text-4xl text-gray-600 mx-auto mb-3" />
                      <p className="text-gray-400 text-sm">No KPIs yet</p>
                      <p className="text-gray-500 text-xs mt-1">Import data to auto-detect KPIs</p>
                    </div>
                  )}
                  
                  {/* Auto-detected KPIs */}
                  {autoDetectedKPIs.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold flex items-center gap-2">
                        <BsLightningCharge className="text-amber-400" />
                        Auto-Detected ({autoDetectedKPIs.length})
                      </div>
                      <div className="space-y-2">
                        {autoDetectedKPIs.map((kpi) => (
                          <button
                            key={kpi.id}
                            onClick={() => {
                              if (selectedIndex !== null) {
                                handleDropKPI(selectedIndex, kpi.id);
                                setMobilePanel(null);
                              }
                            }}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                              selectedIndex !== null
                                ? 'bg-white/5 border-white/10 hover:border-teal-500/50 hover:bg-teal-500/10'
                                : 'bg-white/5 border-white/10 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white text-sm">{kpi.name}</span>
                              <span className="text-teal-400 font-bold text-sm">
                                {formatKPIValue(kpi.value, kpi.unit)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 truncate">{kpi.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Custom KPIs */}
                  {computedKPIs.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold mt-4">
                        My Custom KPIs ({computedKPIs.length})
                      </div>
                      <div className="space-y-2">
                        {computedKPIs.map((kpi) => (
                          <button
                            key={kpi.id}
                            onClick={() => {
                              if (selectedIndex !== null) {
                                handleDropKPI(selectedIndex, `kpi:${kpi.id}`);
                                setMobilePanel(null);
                              }
                            }}
                            className={`w-full text-left p-4 rounded-xl border transition-all ${
                              selectedIndex !== null
                                ? 'bg-white/5 border-white/10 hover:border-teal-500/50 hover:bg-teal-500/10'
                                : 'bg-white/5 border-white/10 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white text-sm">{kpi.title}</span>
                              <span className="text-teal-400 font-bold text-sm">
                                {formatKPIValue(kpi.computedValue, kpi.unit)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 truncate">{kpi.description}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {selectedIndex === null && (autoDetectedKPIs.length > 0 || computedKPIs.length > 0) && (
                    <div className="text-center text-xs text-gray-500 py-4">
                      Select a tile on the dashboard first, then choose a KPI
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Right Sidebar - Desktop only */}
      <div
        className={`hidden lg:block transition-all duration-300 ${
          sidebarCollapsed ? "w-12" : "w-80"
        } bg-[#0a0a0a]/95 backdrop-blur-xl border-l border-white/5 relative`}
      >
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="absolute -left-3 top-6 z-10 w-6 h-6 rounded-full bg-white/10 border border-white/10 text-gray-300 hover:text-white hover:border-teal-500/30 transition-all flex items-center justify-center shadow-lg"
          title={sidebarCollapsed ? "Expand" : "Collapse"}
        >
          {sidebarCollapsed ? (
            <BsChevronLeft className="text-xs" />
          ) : (
            <BsChevronRight className="text-xs" />
          )}
        </button>

        {!sidebarCollapsed && (
          <div className="h-full p-5 overflow-y-auto space-y-5">
            {/* Workbench Selector Section */}
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 text-white font-semibold text-sm mb-3">
                <BsFolder2Open className="text-teal-400" />
                Select Existing Workbench
              </div>
              <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mb-3">
                ⚠️ Note: Files must be uploaded with content saved locally. Use
                "Import Files" below to upload files directly.
              </div>
              {loadingWorkbenches ? (
                <div className="text-sm text-gray-400 flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-teal-400 border-t-transparent rounded-full"></div>
                  Loading workbenches...
                </div>
              ) : (
                <>
                  <select
                    value={selectedWorkbenchId}
                    onChange={(e) => handleWorkbenchSelect(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-teal-500/50 hover:border-white/20 transition-all"
                  >
                    <option value="">-- Select a workbench --</option>
                    {availableWorkbenches.map((wb) => (
                      <option key={wb.id} value={wb.id}>
                        {wb.name}
                      </option>
                    ))}
                  </select>

                  {/* File Selection from Workbench */}
                  {selectedWorkbenchId && workbenchFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs text-gray-400 mb-2">
                        Select files to visualize (
                        {selectedWorkbenchFileIds.length} selected):
                      </div>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {workbenchFiles.map((wbFile) => (
                          <div
                            key={wbFile.id}
                            onClick={() => handleWorkbenchFileSelect(wbFile.id)}
                            className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                              selectedWorkbenchFileIds.includes(wbFile.id)
                                ? "bg-teal-500/20 border border-teal-500/40"
                                : "bg-white/5 border border-white/5 hover:border-white/20"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedWorkbenchFileIds.includes(
                                wbFile.id
                              )}
                              onChange={() => {}}
                              className="w-4 h-4 rounded border-gray-600 text-teal-500 focus:ring-teal-500 focus:ring-offset-0"
                            />
                            <BsFileEarmarkSpreadsheet
                              className={`flex-shrink-0 ${
                                selectedWorkbenchFileIds.includes(wbFile.id)
                                  ? "text-teal-400"
                                  : "text-teal-400/50"
                              }`}
                            />
                            <span
                              className={`text-xs truncate ${
                                selectedWorkbenchFileIds.includes(wbFile.id)
                                  ? "text-white"
                                  : "text-gray-400"
                              }`}
                            >
                              {wbFile.file_name}
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={loadSelectedWorkbenchFiles}
                        disabled={selectedWorkbenchFileIds.length === 0}
                        className={`w-full px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          selectedWorkbenchFileIds.length === 0
                            ? "bg-gray-800/50 text-gray-600 cursor-not-allowed"
                            : "bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-400 hover:to-cyan-500 shadow-md"
                        }`}
                      >
                        Load Selected Files ({selectedWorkbenchFileIds.length})
                      </button>
                    </div>
                  )}

                  {selectedWorkbenchId && workbenchFiles.length === 0 && (
                    <div className="mt-3 text-xs text-gray-500 text-center p-3 bg-gray-800/20 rounded-lg">
                      No files found in this workbench
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Create New Workbench Section */}
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-white font-semibold text-sm">
                  <BsFolder2Open className="text-teal-400" />
                  Workbench
                </div>
                <button
                  onClick={createWorkbench}
                  className="text-xs px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-teal-400 hover:border-teal-500/40 transition-all"
                >
                  {workbench ? "New" : "Create"}
                </button>
              </div>
              {workbench ? (
                <div className="text-sm text-gray-400">
                  Active:{" "}
                  <span className="text-white font-medium">
                    {workbench.name}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-gray-500">
                  No workbench selected. Click "Create" to add one.
                </div>
              )}
            </div>

            {/* Import Files */}
            <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
              <div className="flex items-center gap-2 text-white font-semibold text-sm mb-2">
                <BsFileEarmarkSpreadsheet className="text-teal-400" />
                Import Files for Visualization
              </div>
              <div className="text-xs text-gray-500 mb-3">
                📊 Upload CSV/Excel files to create KPIs and visualizations
              </div>
              <label className="block w-full cursor-pointer">
                <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-black/40 border border-white/10 hover:border-teal-500/40 transition-all text-gray-400 hover:text-teal-400 text-sm font-medium">
                  <BsPlus className="text-xl text-teal-400" />
                  <span>Choose files (.csv, .xlsx)</span>
                </div>
                <input
                  type="file"
                  multiple
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={(e) => importFiles(e.target.files)}
                />
              </label>
              {files.length > 0 && (
                <div className="mt-3 space-y-1">
                  {files.map((f) => (
                    <div
                      key={f.id}
                      className="text-xs text-gray-400 truncate flex items-center gap-2 p-2 bg-white/5 rounded-lg"
                    >
                      <BsFileEarmarkSpreadsheet className="text-teal-400/50 flex-shrink-0" />
                      {f.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Create KPI */}
            <button
              onClick={() => setIsKpiModalOpen(true)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-200 font-semibold hover:bg-white/10 hover:border-teal-500/40 hover:text-teal-400 transition-all flex items-center justify-center gap-2 group"
            >
              <BsPlus className="text-lg text-teal-400" />
              Create Custom KPI
            </button>
            {files.length === 0 && (
              <div className="text-xs text-gray-500 text-center -mt-2">
                Upload files to enable column selection.
              </div>
            )}

            {/* Sidebar body: Library vs Inspector */}
            {SelectedKPI ? (
              <div className="p-4 bg-white/5 border border-white/5 rounded-xl">
                <div className="flex items-center gap-2 text-white font-semibold text-sm mb-3">
                  <BsEye className="text-teal-400" />
                  KPI Inspector
                </div>
                <div className="p-4 bg-black/40 border border-white/10 rounded-xl">
                  <div className="text-white font-medium text-sm">
                    {SelectedKPI.title || SelectedKPI.name}
                  </div>
                  <div className="text-3xl font-bold text-teal-400 my-3">
                    {formatKPIValue(SelectedKPI.value, SelectedKPI.unit)}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    {SelectedKPI.description}
                  </div>
                  <div className="mt-4 bg-white/5 rounded-lg p-2">
                    <ProfessionalChart
                      data={SelectedKPI.timeSeries}
                      color="#00C6C2"
                    />
                  </div>
                  {SelectedKPI.formula && (
                    <div className="mt-3 text-[10px] text-gray-500 bg-gray-900/50 p-2 rounded-lg font-mono">
                      {SelectedKPI.formula}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Auto-Detected KPIs from Files */}
                {isAnalyzing && (
                  <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                    <div className="flex items-center gap-3 text-teal-400 text-sm">
                      <div className="animate-spin w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full"></div>
                      <span>Analyzing files for KPIs...</span>
                    </div>
                  </div>
                )}

                {autoDetectedKPIs.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-white font-semibold text-sm">
                        <BsLightningCharge className="text-teal-400" />
                        Detected KPIs
                        <span className="text-xs bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-2 py-0.5 rounded-full">
                          {autoDetectedKPIs.length}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {autoDetectedKPIs.map((kpi, idx) => (
                        <div
                          key={`auto-${idx}`}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", kpi.id);
                          }}
                          className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:border-teal-500/40 cursor-move transition-all"
                          title="Drag to canvas"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white text-sm truncate flex-1">
                              {kpi.name}
                            </span>
                            <span className="text-teal-400 font-bold text-sm">
                              {formatKPIValue(kpi.value, kpi.unit)}
                            </span>
                          </div>
                          {/* Professional bar chart from real data */}
                          {kpi.timeSeries && kpi.timeSeries.length > 0 && (
                            <div className="my-2 bg-gray-900/30 rounded-lg p-1">
                              <ProfessionalChart
                                data={kpi.timeSeries}
                                color="#00C6C2"
                              />
                            </div>
                          )}
                          <div className="text-xs text-gray-500 truncate">
                            {kpi.description}
                          </div>
                          <div className="text-[10px] text-gray-600 mt-1 flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-gray-800/50 rounded">
                              {kpi.category}
                            </span>
                            <span>{kpi.dataPoints} data points</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 text-white font-semibold text-sm mb-3">
                    <BsBarChart className="text-teal-400" />
                    KPI Library
                  </div>
                  
                  {autoDetectedKPIs.length > 0 && (
                    <div className="mb-6">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold flex items-center gap-2">
                        <BsLightningCharge className="text-amber-400" />
                        Auto-Detected
                      </div>
                      <div className="space-y-3">
                        {autoDetectedKPIs.map((k) => (
                          <div
                            key={k.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", `kpi:${k.id}`);
                            }}
                            className="group p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl hover:border-amber-500/40 cursor-move transition-all"
                            title="Drag to canvas"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-white text-sm truncate flex-1">
                                {k.title}
                              </span>
                              <span className="text-amber-400 font-bold text-sm">
                                {formatKPIValue(k.value, k.unit)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {k.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {computedKPIs.length === 0 && autoDetectedKPIs.length === 0 && (
                    <div className="text-xs text-gray-500 mb-3 p-3 bg-white/5 rounded-lg">
                      Upload financial data files to auto-detect KPIs, or create
                      custom KPIs.
                    </div>
                  )}
                  {computedKPIs.length > 0 && (
                    <div className="space-y-3 mb-4">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-semibold">
                        My Custom KPIs
                      </div>
                      {computedKPIs.map((k) => (
                        <div
                          key={k.id}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", `kpi:${k.id}`);
                          }}
                          className="group p-4 bg-white/5 border border-white/10 rounded-xl hover:border-teal-500/40 cursor-move transition-all"
                          title="Drag to canvas"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-white text-sm truncate flex-1">
                              {k.title}
                            </span>
                            {k.computedValue !== undefined && (
                              <span className="text-teal-400 font-bold text-sm">
                                {formatKPIValue(k.computedValue, k.unit)}
                              </span>
                            )}
                          </div>
                          {k.timeSeries && k.timeSeries.length > 0 && (
                            <div className="my-2 bg-gray-900/30 rounded-lg p-1">
                              <ProfessionalChart
                                data={k.timeSeries}
                                color="#00C6C2"
                              />
                            </div>
                          )}
                          <div className="text-xs text-gray-500 truncate">
                            {k.description}
                          </div>
                          <div className="text-[10px] text-gray-600 mt-1 flex items-center justify-between">
                            <span className="px-1.5 py-0.5 bg-gray-800/50 rounded">
                              {k.category}
                            </span>
                            <div className="flex items-center gap-1.5">
                              {k.is_company_kpi ? (
                                <span className="flex items-center gap-1 text-purple-400/80 bg-purple-500/5 px-1.5 py-0.5 rounded border border-purple-500/10">
                                  <BsBuilding className="text-[10px]" />
                                  Company
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-teal-400/80 bg-teal-500/5 px-1.5 py-0.5 rounded border border-teal-500/10">
                                  <BsPerson className="text-[10px]" />
                                  Personal
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2 text-white font-semibold text-sm mb-3">
                    <BsGrid className="text-gray-500" />
                    Demo KPIs
                  </div>
                  <div className="space-y-2">
                    {demoKpis.map((d) => (
                      <div
                        key={d.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData("text/plain", d.id);
                        }}
                        className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white hover:border-gray-700 cursor-move transition-all"
                        title="Drag to canvas"
                      >
                        <div className="font-medium truncate">{d.title}</div>
                        <div className="text-xs text-gray-500 truncate mt-1">
                          {d.description}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer tip */}
            <div className="text-xs text-gray-600 pt-2 border-t border-gray-800/40 flex items-center gap-2">
              <BsGripVertical className="text-gray-700" />
              Drag KPIs to tiles. Select a tile to inspect.
            </div>
          </div>
        )}
      </div>

      {/* KPI Modal */}
      <KPIBuilderModal
        isOpen={isKpiModalOpen}
        onClose={() => setIsKpiModalOpen(false)}
        files={files}
        columns={columns}
        parsedData={parsedData}
        onCreateKPI={handleCreateKPI}
      />
    </div>
  );
}
