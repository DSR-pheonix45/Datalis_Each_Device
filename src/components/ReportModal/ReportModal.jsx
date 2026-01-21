import React, { useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import {
  BsFileText,
  BsBuilding,
  BsFolder,
  BsStars,
  BsCreditCard,
  BsX,
  BsShieldCheck,
  BsFileEarmarkRuled,
  BsGraphUp,
  BsClipboardData,
  BsBank,
  BsCash,
  BsCalculator,
  BsPieChart,
  BsBarChart,
  BsFileEarmarkSpreadsheet,
  BsCheckCircle,
  BsExclamationTriangle,
  BsLightning,
  BsArrowRight,
  BsSpeedometer,
} from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";
import { decrementCredits, CREDIT_COSTS } from "../../services/creditsService";
import { generateReportContent } from "../../services/reportGenerationService";
import { convertMarkdownToPDF } from "../../services/pdfGenerationService";
import { supabase } from "../../lib/supabase";

export default function ReportModal({
  isOpen,
  onClose,
  companies = [],
  workbenches = [],
  userCredits = 100,
}) {
  const { user, profile } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedWorkbench, setSelectedWorkbench] = useState("");
  const [selectedReportType, setSelectedReportType] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatus, setGenerationStatus] = useState("");

  const reportTypes = [
    // Financial Reports
    {
      id: "profit_loss",
      name: "Profit & Loss Statement",
      description:
        "Comprehensive income statement tracking revenues, expenses, and net income over a period",
      cost: CREDIT_COSTS.REPORT_GENERATE,
      category: "Financial",
      icon: BsCash,
    },
    {
      id: "balance_sheet",
      name: "Balance Sheet",
      description:
        "Snapshot of assets, liabilities, and shareholders equity at a specific date",
      cost: CREDIT_COSTS.REPORT_GENERATE,
      category: "Financial",
      icon: BsBank,
    },
    {
      id: "cash_flow",
      name: "Cash Flow Statement",
      description:
        "Operating, investing, and financing activities showing cash movements",
      cost: CREDIT_COSTS.REPORT_GENERATE,
      category: "Financial",
      icon: BsGraphUp,
    },
    {
      id: "cost_analysis",
      name: "Cost Analysis Report",
      description:
        "Detailed breakdown of fixed vs. variable costs with overhead allocation",
      cost: CREDIT_COSTS.REPORT_GENERATE,
      category: "Financial",
      icon: BsCalculator,
    },
    {
      id: "break_even",
      name: "Break-even Analysis",
      description:
        "Contribution margin analysis and sales threshold calculations for profitability",
      cost: CREDIT_COSTS.REPORT_GENERATE,
      category: "Financial",
      icon: BsPieChart,
    },
    {
      id: "financial_forecasts",
      name: "Financial Forecasts",
      description: "3-5 year projections for P&L, cash flow, and balance sheet",
      cost: CREDIT_COSTS.REPORT_GENERATE,
      category: "Financial",
      icon: BsBarChart,
    },
    {
      id: "scenario_analysis",
      name: "Scenario Analysis",
      description:
        "What-if models analyzing impacts of interest rates, demand shocks, market changes",
      cost: CREDIT_COSTS.REPORT_GENERATE,
      category: "Financial",
      icon: BsFileEarmarkSpreadsheet,
    },
    {
      id: "capex_reports",
      name: "CapEx Reports",
      description:
        "Capital expenditure analysis with ROI calculations for investments and projects",
      cost: CREDIT_COSTS.REPORT_GENERATE,
      category: "Financial",
      icon: BsBuilding,
    },
    {
      id: "valuation_reports",
      name: "Valuation Reports",
      description:
        "Enterprise value, DCF analysis, and market comparables assessment",
      cost: CREDIT_COSTS.REPORT_GENERATE,
      category: "Financial",
      icon: BsFileText,
    },

    // Compliance Reports (New)
    {
      id: "caro_2020",
      name: "CARO 2020 Report",
      description:
        "Companies (Auditor's Report) Order 2020 compliance report covering fixed assets, inventory, loans, and statutory compliances",
      cost: 15,
      category: "Compliance",
      icon: BsShieldCheck,
    },
    {
      id: "companies_act_2013",
      name: "Companies Act 2013",
      description:
        "Comprehensive compliance report under the Companies Act 2013 including board composition, related party transactions, and disclosures",
      cost: 20,
      category: "Compliance",
      icon: BsFileEarmarkRuled,
    },

    // Audit Reports (New)
    {
      id: "indas_108",
      name: "IndAS 108 Operating Segments",
      description:
        "Segment reporting as per Indian Accounting Standard 108 - identifying reportable segments and disclosures",
      cost: 18,
      category: "Audit",
      icon: BsClipboardData,
    },
    {
      id: "sa_230_audit",
      name: "SA 230 Audit Documentation",
      description:
        "Standard on Auditing 230 compliant audit documentation including audit evidence, procedures performed, and conclusions",
      cost: 12,
      category: "Audit",
      icon: BsFileText,
    },
  ];

  const categories = [
    { id: "all", name: "All Reports", count: reportTypes.length },
    {
      id: "Financial",
      name: "Financial",
      count: reportTypes.filter((r) => r.category === "Financial").length,
    },
    {
      id: "Compliance",
      name: "Compliance",
      count: reportTypes.filter((r) => r.category === "Compliance").length,
    },
    {
      id: "Audit",
      name: "Audit",
      count: reportTypes.filter((r) => r.category === "Audit").length,
    },
  ];

  const filteredReportTypes =
    activeCategory === "all"
      ? reportTypes
      : reportTypes.filter((r) => r.category === activeCategory);

  // Show all workbenches - both personal (no company_id) and company-linked ones
  // If a company is selected, show workbenches that either match the company or are personal
  const filteredWorkbenches = selectedCompany
    ? workbenches.filter(
      (wb) => wb.company_id === selectedCompany || !wb.company_id
    )
    : workbenches;

  const selectedReport = reportTypes.find((rt) => rt.id === selectedReportType);
  const canGenerate =
    selectedCompany &&
    selectedWorkbench &&
    selectedReportType &&
    reportTitle.trim();

  // Check if user has enough credits for the selected report
  const storedCredits = parseInt(
    localStorage.getItem("message_tokens") || "0",
    10
  );
  const hasEnoughCredits = selectedReport
    ? storedCredits >= selectedReport.cost
    : true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canGenerate) return;

    if (!user) {
      toast.error("You must be logged in to generate reports");
      return;
    }

    // Check credits before generating
    const creditsNeeded = CREDIT_COSTS.generate_basic_report;
    const storedCredits = parseInt(
      localStorage.getItem("message_tokens") || "0",
      10
    );

    if (storedCredits < creditsNeeded) {
      toast.error(
        `Insufficient credits! Report costs ${creditsNeeded} credits. You have ${storedCredits}.`
      );
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationStatus("Initializing report generation...");

    try {
      // Progress simulation for better UX
      const updateProgress = (progress, status) => {
        setGenerationProgress(progress);
        setGenerationStatus(status);
      };

      updateProgress(10, "Validating credentials...");

      // Deduct credits for report generation
      const creditResult = await decrementCredits(
        user.id,
        creditsNeeded,
        "generate_basic_report"
      );

      if (!creditResult.success) {
        toast.error(
          creditResult.message || "Failed to deduct credits. Please try again."
        );
        setIsGenerating(false);
        return;
      }

      // Notify UI to update credits display
      window.dispatchEvent(new Event("creditsUpdated"));

      updateProgress(20, "Fetching workbench data...");

      // Get company details
      const selectedCompanyData = companies.find(
        (c) => c.company_id === selectedCompany
      );
      const companyName = selectedCompanyData?.company_name || "Company";

      // Get workbench files for data
      let workbenchFiles = [];
      try {
        const { data: files } = await supabase
          .from("workbench_files")
          .select("*")
          .eq("workbench_id", selectedWorkbench);

        workbenchFiles = files || [];
        console.log(
          `Found ${workbenchFiles.length} files in workbench for analysis`
        );
      } catch (err) {
        console.warn("Could not fetch workbench files:", err);
      }

      updateProgress(35, "Preparing data for AI analysis...");

      // Prepare report data
      const reportData = {
        companyName,
        reportTitle,
        reportType: selectedReport.name,
        reportId: selectedReportType,
        category: selectedReport.category,
        notes: additionalNotes,
        workbenchId: selectedWorkbench,
        files: workbenchFiles,
        generatedAt: new Date().toISOString(),
      };

      updateProgress(
        50,
        "Generating professional report content with Groq AI..."
      );

      // Generate report content using Groq AI (CA Expert)
      console.log("Calling Groq AI to generate CA-grade report...");
      const contentResult = await generateReportContent(reportData);

      if (!contentResult.success) {
        throw new Error(
          contentResult.error || "Failed to generate report content"
        );
      }

      updateProgress(75, "Converting to professional PDF format...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Convert markdown to PDF
      const pdfResult = await convertMarkdownToPDF(
        contentResult.markdown,
        reportData
      );

      if (!pdfResult.success) {
        throw new Error(pdfResult.error || "Failed to generate PDF");
      }

      updateProgress(100, "Report generated successfully!");

      // Update UI credits
      window.dispatchEvent(new Event("creditsUpdated"));

      // Show success for a moment before closing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success(
        `${selectedReport.name} generated successfully! Downloading ${pdfResult.filename}`
      );

      onClose?.();
    } catch (error) {
      console.error("Report generation failed:", error);
      toast.error("Report generation failed: " + error.message);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatus("");
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
        {/* Header - Sleek gradient */}
        <div className="relative px-6 py-5 border-b border-white/10 overflow-hidden">
          {/* Background gradient glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 via-transparent to-cyan-500/5" />


          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-br from-teal-500/30 to-cyan-500/30 rounded-xl blur-lg opacity-60" />
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
                  <BsFileText className="text-white text-xl" />
                </div>
              </div>
              <div>
                <h2 className="text-white text-xl font-bold flex items-center gap-2">
                  Report Builder
                  <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-gradient-to-r from-teal-500/20 to-cyan-500/20 text-teal-400 rounded-full border border-teal-500/30">
                    AI Powered
                  </span>
                </h2>
                <p className="text-gray-500 text-sm mt-0.5">
                  Generate professional financial, compliance & audit reports
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-gray-500 hover:text-white hover:bg-gray-800/80 transition-all duration-200"
            >
              <BsX className="text-2xl" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {profile?.plans?.name !== 'Enterprise' ? (
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="relative">
                <div className="absolute -inset-4 bg-teal-500/20 rounded-full blur-2xl" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 flex items-center justify-center">
                  <BsShieldCheck className="text-teal-400 text-4xl" />
                </div>
              </div>
              
              <div className="max-w-md space-y-3">
                <h3 className="text-2xl font-bold text-white">Unlock Enterprise Reports</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Our professional AI-powered Report Builder is exclusive to Enterprise users. 
                  Generate comprehensive financial statements, compliance audits, and advanced valuation reports in seconds.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg mt-4">
                {[
                  { title: "CARO 2020", icon: BsShieldCheck },
                  { title: "IndAS 108", icon: BsClipboardData },
                  { title: "P&L Analysis", icon: BsCash },
                  { title: "Valuations", icon: BsFileText }
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                    <feature.icon className="text-teal-400" />
                    <span className="text-xs font-medium text-gray-300">{feature.title}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  onClose();
                  // Trigger navigation to pricing or open upgrade modal
                  window.location.hash = "pricing";
                }}
                className="mt-6 px-8 py-3.5 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
              >
                Upgrade to Enterprise
                <BsArrowRight />
              </button>
              
              <p className="text-gray-500 text-[10px] uppercase tracking-widest font-bold">
                Join 500+ businesses using Dabby Enterprise
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Company and Workbench Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-bold">
                  1
                </div>
                <span className="text-sm font-medium text-white">
                  Select Source Data
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <BsBuilding className="text-teal-400" />
                    Company
                  </label>
                  <select
                    value={selectedCompany}
                    onChange={(e) => {
                      setSelectedCompany(e.target.value);
                      setSelectedWorkbench("");
                    }}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition-all duration-200 cursor-pointer hover:border-white/20"
                    required
                  >
                    <option value="">Select company...</option>
                    {companies.length > 0 ? (
                      companies.map((company) => (
                        <option
                          key={company.company_id}
                          value={company.company_id}
                        >
                          {company.company_name}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No companies found
                      </option>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                    <BsFolder className="text-teal-400" />
                    Workbench
                  </label>
                  <select
                    value={selectedWorkbench}
                    onChange={(e) => setSelectedWorkbench(e.target.value)}
                    disabled={!selectedCompany}
                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer hover:border-white/20"
                    required
                  >
                    <option value="">
                      {selectedCompany
                        ? "Select workbench..."
                        : "Select company first"}
                    </option>
                    {filteredWorkbenches.map((workbench) => (
                      <option key={workbench.id} value={workbench.id}>
                        {workbench.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Step 2: Report Title */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-bold">
                  2
                </div>
                <span className="text-sm font-medium text-white">
                  Report Title
                </span>
              </div>
              <input
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="e.g., Q4 2024 Annual Financial Analysis"
                className="w-full px-4 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition-all duration-200"
                required
              />
            </div>

            {/* Step 3: Report Type Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-xs font-bold">
                    3
                  </div>
                  <span className="text-sm font-medium text-white">
                    Choose Report Type
                  </span>
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-lg border border-white/5">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${activeCategory === cat.id
                        ? "bg-teal-500 text-gray-900"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                        }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Report Type Cards - Enhanced Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredReportTypes.map((report) => {
                  const IconComponent = report.icon || BsFileText;
                  const isSelected = selectedReportType === report.id;
                  return (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => setSelectedReportType(report.id)}
                      className={`relative p-4 rounded-xl text-left transition-all duration-200 group ${isSelected
                        ? "bg-teal-500/10 border-2 border-teal-500/50 shadow-md"
                        : "bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10"
                        }`}
                    >
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className="absolute top-3 right-3">
                          <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                            <BsCheckCircle className="text-white text-xs" />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${isSelected
                              ? "bg-teal-500 text-white"
                              : "bg-black/40 text-teal-400 group-hover:bg-teal-500/20"
                              }`}
                          >
                            <IconComponent className="text-base" />
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <BsLightning className="text-amber-400" />
                            <span className="text-gray-400">
                              {report.cost} credits
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4
                            className={`font-semibold text-sm leading-tight ${isSelected ? "text-teal-300" : "text-white"
                              }`}
                          >
                            {report.name}
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {report.description}
                          </p>
                        </div>

                        <span
                          className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium ${report.category === "Financial"
                            ? "bg-blue-500/15 text-blue-400 border border-blue-500/20"
                            : report.category === "Compliance"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                              : "bg-purple-500/15 text-purple-400 border border-purple-500/20"
                            }`}
                        >
                          {report.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Additional Notes - Collapsible feel */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                <BsClipboardData className="text-teal-400" />
                Additional Notes
                <span className="text-gray-600 normal-case tracking-normal">
                  (optional)
                </span>
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Specific requirements, focus areas, or context for the AI..."
                rows={2}
                className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/10 resize-none transition-all duration-200"
              />
            </div>

            {/* Cost Summary - Compact and elegant */}
            {selectedReport && (
              <div className="relative overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800/40 border border-white/10 rounded-xl p-4">


                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center border border-teal-500/20">
                      <BsSpeedometer className="text-teal-400 text-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {selectedReport.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        AI-generated professional report
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-white">
                        {selectedReport.cost}
                      </span>
                      <span className="text-xs text-gray-500">credits</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Balance:{" "}
                      <span
                        className={
                          userCredits >= selectedReport.cost
                            ? "text-teal-400"
                            : "text-red-400"
                        }
                      >
                        {userCredits}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Generation Progress - Sleek */}
            {isGenerating && (
              <div className="bg-black/40 border border-teal-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-sm text-white font-medium">
                      {generationStatus}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-teal-400">
                    {generationProgress}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions - Clean footer */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <p className="text-xs text-gray-600 flex items-center gap-1.5">
                <BsFileEarmarkSpreadsheet className="text-gray-500" />
                Exported as professional PDF
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isGenerating}
                  className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 font-medium text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!canGenerate || !hasEnoughCredits || isGenerating}
                  className="group px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold text-sm hover:from-teal-400 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 shadow-md"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Report
                      <BsArrowRight className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
          )}
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #374151;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #4B5563;
        }
      `}</style>
    </div>
  );

  return createPortal(modalContent, document.body);
}
