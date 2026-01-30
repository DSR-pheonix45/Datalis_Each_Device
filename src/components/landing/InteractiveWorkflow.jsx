import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useTheme } from "../../context/ThemeContext";

const workflowSteps = [
  {
    id: 1,
    title: "KPI Dashboard",
    heading: "Key Metrics Calculated Instantly",
    description: "Our AI engine automatically calculates profitability ratios, liquidity metrics, efficiency indicators, and growth KPIs without manual formulas.",
    cta: "See all KPI metrics",
    ctaLink: "/features/kpis",
  },
  {
    id: 2,
    title: "Dabby AI",
    heading: "Chat with Your Financial Data",
    description: "Ask complex financial questions in natural language. Dabby uses RAG technology to provide context-aware answers backed by your actual data.",
    cta: "Try Dabby AI",
    ctaLink: "/features/dabby",
  },
  {
    id: 3,
    title: "Workbenches",
    heading: "Organize by Projects",
    description: "Create project-based workspaces for your financial data. Map columns, manage files, and switch between personal and company scope seamlessly.",
    cta: "Learn about workbenches",
    ctaLink: "/features/workbenches",
  },
  {
    id: 4,
    title: "Reports",
    heading: "Professional PDF Reports",
    description: "Generate beautiful, branded reports in seconds. Choose from customizable templates, add your logo, and export to PDF for stakeholder reviews.",
    cta: "See report templates",
    ctaLink: "/features/reports",
  },
];

export default function InteractiveWorkflow() {
  const [activeStep, setActiveStep] = useState(0);
  const { theme } = useTheme();
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Section Header - Centered */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${theme === "dark" ? "text-white" : "text-[#1a1a1a]"
              }`}
          >
            Financial Intelligence Made Simple
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.1, duration: 0.5 }}
            className={`text-base md:text-lg max-w-2xl mx-auto ${theme === "dark" ? "text-[#787878]" : "text-gray-600"
              }`}
          >
            Empower your finance team to explore, analyze, and act on data—in the way that works for them.
          </motion.p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 md:mb-12 px-4">
          <div className={`inline-flex flex-wrap justify-center rounded-2xl md:rounded-full p-1.5 border transition-colors ${theme === "dark" ? "bg-[#111111] border-white/10" : "bg-white border-gray-200 shadow-sm"}`}>
            {workflowSteps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => setActiveStep(index)}
                className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-full text-xs md:text-sm font-medium transition-all duration-300 ${activeStep === index
                  ? theme === "dark"
                    ? "bg-[#81E6D9] text-black shadow-lg shadow-[#81E6D9]/20"
                    : "bg-[#1a1a1a] text-white shadow-lg shadow-black/10"
                  : theme === "dark"
                    ? "text-[#787878] hover:text-white"
                    : "text-gray-500 hover:text-[#1a1a1a]"
                  }`}
              >
                {step.title}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Display */}
        <div className="max-w-5xl mx-auto px-4">
          <div className="relative group">
            {/* Background Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#81E6D9]/20 to-[#4FD1C5]/20 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-75 transition duration-1000"></div>

            {/* Main Container */}
            <div className={`relative rounded-[2rem] border overflow-hidden shadow-2xl transition-colors ${theme === "dark" ? "bg-[#0a0a0a] border-white/10" : "bg-white border-gray-200"}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="grid grid-cols-1 lg:grid-cols-2"
                >
            {/* Left: Text Content */}
            <div className="order-2 lg:order-1">
              <motion.h3
                key={`heading-${activeStep}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className={`text-2xl md:text-3xl font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-[#1a1a1a]"
                  }`}
              >
                {workflowSteps[activeStep].heading}
              </motion.h3>
              <motion.p
                key={`desc-${activeStep}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className={`text-base leading-relaxed mb-6 ${theme === "dark" ? "text-[#787878]" : "text-gray-600"
                  }`}
              >
                {workflowSteps[activeStep].description}
              </motion.p>
              {/* Link */}
              <motion.a
                key={`cta-${activeStep}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                href={workflowSteps[activeStep].ctaLink}
                className={`inline-flex items-center gap-2 font-medium transition-colors ${theme === "dark"
                  ? "text-[#81E6D9] hover:text-[#4FD1C5]"
                  : "text-[#1a1a1a] hover:text-black underline underline-offset-4"
                  }`}
              >
                {workflowSteps[activeStep].cta}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </motion.a>
            </div>

            {/* Right: Screenshot/Visual */}
            <div className="order-1 lg:order-2">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`rounded-2xl overflow-hidden border ${theme === "dark"
                  ? "bg-[#111111] border-white/10"
                  : "bg-white border-gray-200 shadow-lg"
                  }`}
              >
                {/* Browser chrome */}
                <div className={`flex items-center gap-2 px-4 py-3 border-b ${theme === "dark" ? "bg-[#0a0a0a] border-white/5" : "bg-gray-50 border-gray-100"
                  }`}>
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-[#81E6D9]/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className={`rounded-md px-3 py-1.5 text-xs max-w-xs mx-auto text-center ${theme === "dark" ? "bg-[#1a1a1a] text-[#787878]" : "bg-gray-100 text-gray-500"
                      }`}>
                      dabby
                    </div>
                  </div>
                </div>

                {/* App content mockup */}
                <div className={`aspect-auto sm:aspect-[4/3] p-4 md:p-6 ${theme === "dark" ? "bg-[#0a0a0a]" : "bg-gray-50"
                  }`}>
                  {/* KPI mockup */}
                  {activeStep === 0 && (
                    <div className="h-full flex flex-col gap-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className={`rounded-lg p-2 md:p-3 ${theme === "dark" ? "bg-[#111111]" : "bg-white border border-gray-200"}`}>
                            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-lg mb-2 ${theme === "dark" ? "bg-[#81E6D9]/20" : "bg-[#1a1a1a]"}`}></div>
                            <div className={`h-3 md:h-4 rounded w-12 md:w-16 mb-1 ${theme === "dark" ? "bg-white/10" : "bg-gray-100"}`}></div>
                            <div className={`h-4 md:h-6 rounded w-16 md:w-20 ${theme === "dark" ? "bg-[#81E6D9]/10" : "bg-gray-200"}`}></div>
                          </div>
                        ))}
                      </div>
                      <div className={`flex-1 min-h-[100px] rounded-lg p-4 flex items-end gap-1 md:gap-2 ${theme === "dark" ? "bg-[#111111]" : "bg-white border border-gray-200"}`}>
                        {[40, 65, 45, 80, 55, 70, 90, 60].map((h, i) => (
                          <div key={i} className={`flex-1 rounded-t ${theme === "dark" ? "bg-[#81E6D9]" : "bg-[#1a1a1a]"}`} style={{ height: `${h}%`, opacity: 0.5 + (i * 0.06) }}></div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Chat mockup */}
                  {activeStep === 1 && (
                    <div className="h-full flex flex-col min-h-[250px]">
                      <div className={`flex-1 rounded-lg p-3 md:p-4 flex flex-col gap-3 ${theme === "dark" ? "bg-[#111111]" : "bg-white border border-gray-200"}`}>
                        <div className="flex gap-3">
                          <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0 ${theme === "dark" ? "bg-white/10" : "bg-gray-200"}`}></div>
                          <div className={`rounded-2xl rounded-tl-none p-2 md:p-3 max-w-[80%] sm:max-w-[70%] ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`}>
                            <div className={`h-2 md:h-3 rounded w-full mb-2 ${theme === "dark" ? "bg-white/10" : "bg-gray-200"}`}></div>
                            <div className={`h-2 md:h-3 rounded w-3/4 ${theme === "dark" ? "bg-white/10" : "bg-gray-200"}`}></div>
                          </div>
                        </div>
                        <div className="flex gap-3 justify-end">
                          <div className={`rounded-2xl rounded-tr-none p-2 md:p-3 max-w-[80%] sm:max-w-[70%] ${theme === "dark" ? "bg-[#81E6D9]/20" : "bg-[#1a1a1a]/10"}`}>
                            <div className={`h-2 md:h-3 rounded w-full mb-2 ${theme === "dark" ? "bg-[#81E6D9]/30" : "bg-[#1a1a1a]/20"}`}></div>
                            <div className={`h-2 md:h-3 rounded w-2/3 ${theme === "dark" ? "bg-[#81E6D9]/30" : "bg-[#1a1a1a]/20"}`}></div>
                          </div>
                          <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex-shrink-0 ${theme === "dark" ? "bg-[#81E6D9]/50" : "bg-[#1a1a1a]"}`}></div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <div className={`flex-1 h-8 md:h-10 rounded-full ${theme === "dark" ? "bg-[#111111]" : "bg-gray-100"}`}></div>
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full ${theme === "dark" ? "bg-[#81E6D9]" : "bg-[#1a1a1a]"}`}></div>
                      </div>
                    </div>
                  )}
                  {/* Workbench mockup */}
                  {activeStep === 2 && (
                    <div className="h-full flex flex-col sm:flex-row gap-4">
                      <div className={`w-full sm:w-48 rounded-lg p-3 ${theme === "dark" ? "bg-[#111111]" : "bg-white border border-gray-200"}`}>
                        <div className={`h-4 rounded w-20 mb-4 ${theme === "dark" ? "bg-white/10" : "bg-gray-100"}`}></div>
                        <div className="flex flex-row sm:flex-col gap-2 overflow-x-auto sm:overflow-x-visible no-scrollbar">
                          {[...Array(5)].map((_, i) => (
                            <div key={i} className={`h-8 rounded-lg flex items-center gap-2 px-2 flex-shrink-0 sm:flex-shrink ${i === 1 ? (theme === "dark" ? "bg-[#81E6D9]/20" : "bg-[#1a1a1a]/10") : (theme === "dark" ? "bg-white/5" : "bg-gray-50")
                              }`}>
                              <div className={`w-4 h-4 rounded ${theme === "dark" ? "bg-white/10" : "bg-gray-200"}`}></div>
                              <div className={`h-3 w-16 sm:flex-1 rounded ${theme === "dark" ? "bg-white/10" : "bg-gray-200"}`}></div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className={`flex-1 rounded-lg p-4 ${theme === "dark" ? "bg-[#111111]" : "bg-white border border-gray-200"}`}>
                        <div className={`h-6 rounded w-32 mb-4 ${theme === "dark" ? "bg-white/10" : "bg-gray-100"}`}></div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className={`h-16 md:h-20 rounded-lg ${theme === "dark" ? "bg-white/5" : "bg-gray-50"}`}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {/* Reports mockup */}
                  {activeStep === 3 && (
                    <div className={`h-full rounded-lg p-3 md:p-4 flex flex-col ${theme === "dark" ? "bg-[#111111]" : "bg-white border border-gray-200"}`}>
                      <div className="flex justify-between items-center mb-4">
                        <div className={`h-5 md:h-6 rounded w-32 md:w-40 ${theme === "dark" ? "bg-white/10" : "bg-gray-100"}`}></div>
                        <div className={`h-7 md:h-8 rounded-lg w-20 md:w-24 ${theme === "dark" ? "bg-[#81E6D9]" : "bg-[#1a1a1a]"}`}></div>
                      </div>
                      <div className={`flex-1 border-2 border-dashed rounded-lg p-3 md:p-4 ${theme === "dark" ? "border-white/10" : "border-gray-200"}`}>
                        <div className={`h-6 md:h-8 rounded w-full mb-3 ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`}></div>
                        <div className="space-y-2">
                          {[...Array(4)].map((_, i) => (
                            <div key={i} className={`h-3 md:h-4 rounded ${theme === "dark" ? "bg-white/5" : "bg-gray-50"}`} style={{ width: `${100 - i * 15}%` }}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
