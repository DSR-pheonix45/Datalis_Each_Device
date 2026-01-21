import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useTheme } from "../../context/ThemeContext";

const steps = [
  {
    number: "1",
    title: "Upload Your Data",
    description: "Connect your spreadsheets, CSV files, or database directly. Datalis automatically detects columns and data types.",
    mockup: "upload"
  },
  {
    number: "2",
    title: "AI Calculates KPIs",
    description: "Our AI engine instantly calculates 18+ financial metrics including profitability, liquidity, and growth ratios.",
    mockup: "kpi"
  },
  {
    number: "3",
    title: "Get Insights & Reports",
    description: "Chat with Dabby AI, generate professional PDF reports, and make data-driven decisions in real-time.",
    mockup: "insights"
  }
];

function UploadMockup({ theme }) {
  const isDark = theme === "dark";
  return (
    <div className={`p-6 rounded-xl border ${isDark ? "bg-[#0a0a0a] border-white/5" : "bg-white border-[#1a1a1a]/10"
      }`}>
      {/* Email Input */}
      <div className="mb-4">
        <label className={`text-xs font-medium mb-2 block ${isDark ? "text-gray-400" : "text-gray-500"
          }`}>
          Email
        </label>
        <div className={`px-4 py-2.5 rounded-lg border ${isDark ? "bg-[#111111] border-white/10" : "bg-gray-50 border-[#1a1a1a]/10"
          }`}>
          <span className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>
            rahul@company.com
          </span>
        </div>
      </div>

      {/* File Upload Area */}
      <div className="mb-5">
        <label className={`text-xs font-medium mb-2 block ${isDark ? "text-gray-400" : "text-gray-500"
          }`}>
          Upload File
        </label>
        <div className={`px-4 py-8 rounded-lg border-2 border-dashed text-center ${isDark ? "border-white/10 bg-[#111111]" : "border-[#1a1a1a]/20 bg-gray-50"
          }`}>
          <svg className={`w-8 h-8 mx-auto mb-2 ${isDark ? "text-gray-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}>
            Drop CSV or Excel
          </span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-3 rounded-full text-sm font-semibold text-black bg-[#81E6D9] border border-[#81E6D9] hover:bg-transparent transition-colors ${isDark
            ? "hover:text-white hover:border-white"
            : "hover:text-[#1a1a1a] hover:border-[#1a1a1a]"
          }`}
      >
        Upload Data
      </motion.button>
    </div>
  );
}

function KPIMockup({ theme }) {
  const isDark = theme === "dark";
  return (
    <div className={`p-6 rounded-xl border ${isDark ? "bg-[#0a0a0a] border-white/5" : "bg-white border-[#1a1a1a]/10"
      }`}>
      {/* Header */}
      <div className="mb-4">
        <span className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
          Amount to Process
        </span>
      </div>

      {/* Amount Display */}
      <div className={`px-4 py-4 rounded-lg mb-5 border flex items-center justify-between ${isDark ? "bg-[#111111] border-white/10" : "bg-gray-50 border-[#1a1a1a]/10"
        }`}>
        <span className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
          ₹7,24,500
        </span>
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#81E6D9] text-black flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-black"></span>
          INR
        </span>
      </div>

      {/* KPI Metrics */}
      <div className="space-y-2.5">
        {[
          { label: "Gross Margin", value: "42.8%" },
          { label: "Net Profit Ratio", value: "18.2%" },
          { label: "YoY Growth", value: "+24.5%" }
        ].map((item, i) => (
          <div key={i} className={`flex justify-between items-center px-4 py-3 rounded-lg ${isDark ? "bg-[#111111]" : "bg-gray-50"
            }`}>
            <span className={`text-xs font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}>
              {item.label}
            </span>
            <span className={`text-sm font-bold ${isDark ? "text-white" : "text-gray-900"}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function InsightsMockup({ theme }) {
  const isDark = theme === "dark";
  const reportItems = [
    { name: "Q4 Revenue Report", value: "₹2.4M", color: isDark ? "#81E6D9" : "#0D9488" },
    { name: "Growth Analysis", value: "+18%", color: isDark ? "#4FD1C5" : "#14b8a6" },
    { name: "Cash Flow Summary", value: "₹890K", color: isDark ? "#81E6D9" : "#0D9488" }
  ];

  return (
    <div className={`p-6 rounded-xl border ${isDark ? "bg-[#0a0a0a] border-white/5" : "bg-white border-[#1a1a1a]/10"
      }`}>
      {/* Report Cards */}
      <div className="space-y-3 mb-5">
        {reportItems.map((item, i) => (
          <div key={i} className={`flex items-center justify-between px-4 py-3 rounded-lg border ${isDark ? "bg-[#111111] border-white/5" : "bg-gray-50 border-[#1a1a1a]/5"
            }`}>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${item.color}20` }}
              >
                <svg className="w-4 h-4" fill="none" stroke={item.color} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                {item.name}
              </span>
            </div>
            <span className="text-sm font-bold" style={{ color: item.color }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Export Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full py-3 rounded-full text-sm font-semibold text-black bg-[#81E6D9] border border-[#81E6D9] hover:bg-transparent transition-colors ${isDark
            ? "hover:text-white hover:border-white"
            : "hover:text-[#1a1a1a] hover:border-[#1a1a1a]"
          }`}
      >
        Export as PDF
      </motion.button>
    </div>
  );
}

export default function FeaturesGrid() {
  const { theme } = useTheme();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });
  const isDark = theme === "dark";

  const getMockup = (type) => {
    switch (type) {
      case "upload": return <UploadMockup theme={theme} />;
      case "kpi": return <KPIMockup theme={theme} />;
      case "insights": return <InsightsMockup theme={theme} />;
      default: return null;
    }
  };

  return (
    <section ref={sectionRef} className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section Header */}
        <div className="text-center mb-14">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${isDark ? "text-white" : "text-[#1a1a1a]"
              }`}
          >
            How It Works
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.5 }}
            className={`text-base md:text-lg max-w-xl mx-auto mb-6 ${isDark ? "text-[#787878]" : "text-gray-600"
              }`}
          >
            A simple, fast, and secure platform to manage your financial data in just a few steps.
          </motion.p>

          {/* Cyan link */}
          <motion.a
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
            href="/signup"
            className={`inline-flex items-center gap-2 font-medium transition-colors ${isDark ? "text-[#81E6D9] hover:text-[#4FD1C5]" : "text-[#0D9488] hover:text-[#14b8a6]"
              }`}
          >
            Get started now
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </motion.a>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
              className={`p-8 rounded-2xl border transition-all duration-300 ${isDark
                ? "bg-[#111111] border-white/5 hover:border-[#81E6D9]/30"
                : "bg-white border-[#1a1a1a]/10 hover:border-[#81E6D9]/50 shadow-sm"
                }`}
            >
              {/* Numbered Badge - Cyan */}
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold mb-6 text-black bg-[#81E6D9]">
                {step.number}
              </div>

              {/* Mockup */}
              <div className="mb-6">
                {getMockup(step.mockup)}
              </div>

              {/* Title */}
              <h3 className={`text-xl font-semibold mb-3 ${isDark ? "text-white" : "text-[#1a1a1a]"
                }`}>
                {step.title}
              </h3>

              {/* Description */}
              <p className={`text-sm leading-relaxed ${isDark ? "text-[#787878]" : "text-gray-600"
                }`}>
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
