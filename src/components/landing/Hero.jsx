import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { track } from "@vercel/analytics";

export default function Hero() {
  const containerRef = useRef(null);
  const { theme } = useTheme();

  const isLocalhost = 
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' || 
    window.location.hostname === '';

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0.15, 0.25], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.25], [0, -50]);

  const mockupScale = useTransform(
    scrollYProgress,
    [0, 0.1, 0.2],
    [0.9, 0.95, 1]
  );
  const mockupY = useTransform(scrollYProgress, [0, 0.2], [80, 0]);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const lineVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
      },
    },
  };

  return (
    <section ref={containerRef} className="relative min-h-[180vh]">
      {/* Hero Content */}
      <motion.div
        style={{ opacity: heroOpacity, y: heroY }}
        className="sticky top-0 pt-24 md:pt-32 pb-8 px-6 md:px-12 z-10"
      >
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Headline */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`font-display text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold leading-[1.05] tracking-tight mb-6 ${theme === "dark" ? "text-white" : "text-[#1a1a1a]"
              }`}
          >
            <motion.span variants={lineVariants} className="block">
              AI-Powered Financial Intelligence.
            </motion.span>
            <motion.span variants={lineVariants} className="block">
              All together.
            </motion.span>
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`text-lg md:text-xl font-normal leading-relaxed max-w-2xl mx-auto mb-10 ${theme === "dark" ? "text-[#787878]" : "text-gray-600"
              }`}
          >
            Datalis unites your financial data, AI insights, and team
            collaboration for faster, smarter decision-making.
          </motion.p>

          {/* CTA Buttons - Neon yellow in both modes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
          >
            <Link
              to={isLocalhost ? "/signup" : "/maintenance"}
              onClick={() => track('try_datalis_free_clicked')}
              className={`inline-block px-10 py-4 text-base font-semibold text-black bg-[#81E6D9] rounded-full border border-[#81E6D9] hover:bg-transparent transition-all duration-200 ${theme === "dark"
                ? "hover:text-white hover:border-white"
                : "hover:text-[#1a1a1a] hover:border-[#1a1a1a]"
                }`}
            >
              Try Datalis Free
            </Link>

            <a
              href="https://calendly.com/medhansh_k/mk-101"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('talk_to_founder_clicked')}
              className={`px-8 py-3.5 text-base font-semibold rounded-full transition-all duration-200 border ${
                theme === "dark"
                  ? "text-white border-white/30 hover:bg-white/10"
                  : "text-[#1a1a1a] border-[#1a1a1a] hover:bg-gray-100"
              }`}
            >
              Talk to Founder
            </a>
          </motion.div>

          {/* Social Proof */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className={`flex flex-wrap items-center justify-center gap-6 md:gap-10 py-6 border-t border-b ${theme === "dark" ? "border-white/10" : "border-[#1a1a1a]/10"
              }`}
          >
            {/* Product Hunt style badge */}
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium ${theme === "dark" ? "text-[#787878]" : "text-gray-500"
                  }`}
              >
                Product Hunt
              </span>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-3.5 h-3.5 text-[#81E6D9]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span
                  className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-[#1a1a1a]"
                    }`}
                >
                  Featured
                </span>
              </div>
            </div>

            <div
              className={`hidden md:block h-8 w-px ${theme === "dark" ? "bg-white/10" : "bg-[#1a1a1a]/10"
                }`}
            />

            {/* Insights count */}
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-[#1a1a1a]"
                  }`}
              >
                Insights
              </span>
              <div className="flex items-center gap-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-3.5 h-3.5 text-[#81E6D9]"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span
                  className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-[#1a1a1a]"
                    }`}
                >
                  18+
                </span>
              </div>
            </div>

            <div
              className={`hidden md:block h-8 w-px ${theme === "dark" ? "bg-white/10" : "bg-[#1a1a1a]/10"
                }`}
            />

            {/* AI Powered */}
            <div className="flex items-center gap-2">
              <svg
                className={`w-5 h-5 ${theme === "dark" ? "text-[#81E6D9]" : "text-[#0D9488]"
                  }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
              <span
                className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-[#1a1a1a]"
                  }`}
              >
                RAG-Powered AI
              </span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Product Mockup */}
      <motion.div
        style={{ scale: mockupScale, y: mockupY }}
        className="sticky top-[10 vh] z-20 px-4 sm:px-6 md:px-12"
      >
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className={`rounded-2xl md:rounded-3xl overflow-hidden border ${theme === "dark"
              ? "bg-[#111111] border-white/10"
              : "bg-white border-[#1a1a1a]/20 shadow-2xl"
              }`}
          >
            {/* App Interface Mockup */}
            <div
              className={`aspect-auto md:aspect-[16/10] p-3 md:p-6 ${theme === "dark" ? "bg-[#0a0a0a]" : "bg-gray-50"
                }`}
            >
              {/* Top bar */}
              <div className="flex items-center justify-between md:justify-start gap-4 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500/80"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500/80"></div>
                  <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500/80"></div>
                </div>
                <div
                  className={`flex gap-2 overflow-x-auto no-scrollbar ${theme === "dark" ? "text-[#787878]" : "text-gray-500"
                    }`}
                >
                  <span className="px-2 md:px-3 py-1 text-[10px] md:text-xs rounded font-medium bg-[#81E6D9] text-black whitespace-nowrap">
                    Chat
                  </span>
                  <span className="px-2 md:px-3 py-1 text-[10px] md:text-xs whitespace-nowrap">Analysis</span>
                  <span className="px-2 md:px-3 py-1 text-[10px] md:text-xs whitespace-nowrap">Dabby AI</span>
                </div>
              </div>

              {/* Main content - Fuller dashboard */}
              <div className="flex flex-col md:flex-row gap-3 h-full md:h-[calc(100%-40px)]">
                {/* Left Sidebar - Mini Nav - Hidden on very small screens */}
                <div className={`hidden sm:flex w-10 md:w-12 flex-shrink-0 rounded-lg flex-col items-center py-3 gap-3 ${theme === "dark" ? "bg-[#111111] border border-white/5" : "bg-white border border-[#1a1a1a]/10"}`}>
                  <div className="w-6 h-6 md:w-7 md:h-7 rounded-lg bg-[#81E6D9]/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 md:w-4 md:h-4 text-[#81E6D9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`}>
                    <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`}>
                    <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div className="flex-1"></div>
                  <div className={`w-6 h-6 md:w-7 md:h-7 rounded-lg flex items-center justify-center ${theme === "dark" ? "bg-white/5" : "bg-gray-100"}`}>
                    <svg className={`w-3.5 h-3.5 md:w-4 md:h-4 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>

                {/* Main Analysis Area */}
                <div className="flex-1 flex flex-col gap-3 overflow-hidden">
                  {/* Top Analysis Cards Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
                    {[
                      { label: "Revenue Analysis", value: "₹730M", change: "+18%", positive: true },
                      { label: "Profit Insight", value: "₹142M", change: "+24%", positive: true },
                      { label: "Expense Trends", value: "₹88M", change: "-5%", positive: true },
                      { label: "Growth Insight", value: "32.4%", change: "+8%", positive: true }
                    ].map((item, i) => (
                      <div key={i} className={`p-2 md:p-3 rounded-lg border ${theme === "dark" ? "bg-[#111111] border-white/5" : "bg-white border-[#1a1a1a]/10"}`}>
                        <p className={`text-[8px] md:text-[10px] mb-0.5 md:mb-1 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>{item.label}</p>
                        <p className="text-sm md:text-lg font-bold text-[#81E6D9]">{item.value}</p>
                        <p className={`text-[8px] md:text-[10px] ${item.positive ? "text-green-400" : "text-red-400"}`}>{item.change}</p>
                      </div>
                    ))}
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 flex-1 min-h-[150px] md:min-h-0">
                    {/* Revenue Chart - Wider */}
                    <div className={`lg:col-span-2 p-2 md:p-3 rounded-lg border ${theme === "dark" ? "bg-[#111111] border-white/5" : "bg-white border-[#1a1a1a]/10"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[10px] md:text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>Revenue Trend</span>
                        <div className="flex gap-2">
                          <span className={`text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 rounded ${theme === "dark" ? "bg-white/5 text-gray-400" : "bg-gray-100 text-gray-500"}`}>Monthly</span>
                          <span className={`text-[8px] md:text-[9px] px-1.5 md:px-2 py-0.5 rounded ${theme === "dark" ? "bg-[#81E6D9]/20 text-[#81E6D9]" : "bg-[#81E6D9]/20 text-[#0D9488]"}`}>YTD</span>
                        </div>
                      </div>
                      <svg className="w-full h-16 md:h-20" viewBox="0 0 300 60" preserveAspectRatio="none">
                        <path d="M0,45 Q30,42 60,38 T120,30 T180,22 T240,18 T300,12" fill="none" stroke="#81E6D9" strokeWidth="2" />
                        <path d="M0,45 Q30,42 60,38 T120,30 T180,22 T240,18 T300,12 L300,60 L0,60 Z" fill="rgba(129, 230, 217, 0.15)" />
                      </svg>
                      <div className="flex justify-between text-[8px] md:text-[10px] mt-1">
                        <span className={theme === "dark" ? "text-gray-600" : "text-gray-400"}>Jan</span>
                        <span className={theme === "dark" ? "text-gray-600" : "text-gray-400"}>Jun</span>
                        <span className={theme === "dark" ? "text-gray-600" : "text-gray-400"}>Dec</span>
                      </div>
                    </div>

                    {/* Margin Bars - Hidden on mobile to save space */}
                    <div className={`hidden lg:block p-3 rounded-lg border ${theme === "dark" ? "bg-[#111111] border-white/5" : "bg-white border-[#1a1a1a]/10"}`}>
                      <span className="text-xs text-gray-500">Margin by Product</span>
                      <div className="flex items-end gap-1.5 h-16 mt-2">
                        {[60, 80, 45, 90, 70, 55].map((h, i) => (
                          <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, opacity: 0.6 + i * 0.06, backgroundColor: "#81E6D9" }}></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row - Activity & AI */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Recent Activity - Hidden on mobile */}
                    <div className={`hidden lg:block col-span-2 p-3 rounded-lg border ${theme === "dark" ? "bg-[#111111] border-white/5" : "bg-white border-[#1a1a1a]/10"}`}>
                      <span className={`text-xs ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`}>Recent Activity</span>
                      <div className="mt-2 space-y-2">
                        {[
                          { title: "Q4 Analysis Completed", time: "2m ago", icon: "📄" },
                          { title: "New insight discovered", time: "15m ago", icon: "📈" },
                          { title: "Team analysis reviewed", time: "1h ago", icon: "✓" }
                        ].map((item, i) => (
                          <div key={i} className={`flex items-center gap-2 p-2 rounded ${theme === "dark" ? "bg-white/5" : "bg-gray-50"}`}>
                            <span className="text-sm">{item.icon}</span>
                            <span className={`text-[11px] flex-1 ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}>{item.title}</span>
                            <span className={`text-[9px] ${theme === "dark" ? "text-gray-600" : "text-gray-400"}`}>{item.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Insights */}
                    <div className={`p-2 md:p-3 rounded-lg border ${theme === "dark" ? "bg-[#81E6D9]/5 border-[#81E6D9]/20" : "bg-[#81E6D9]/10 border-[#81E6D9]/30"}`}>
                      <div className="flex items-center gap-1.5 mb-1 md:mb-2">
                        <div className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-[#81E6D9]/30 flex items-center justify-center">
                          <svg className="w-2 md:w-2.5 h-2 md:h-2.5 text-[#81E6D9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <span className="text-[9px] md:text-[10px] font-semibold text-[#81E6D9]">Dabby AI Insights</span>
                      </div>
                      <p className={`text-[9px] md:text-[10px] leading-relaxed ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                        Revenue up 18% YoY. Recommend increasing Q1 marketing budget by 12%...
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
