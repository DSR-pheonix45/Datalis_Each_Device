import React from "react";
import {
  BsTrophy,
  BsLightning,
  BsFileText,
  BsGraphUp,
  BsSearch,
  BsCalculator,
  BsBarChart,
  BsPeople,
  BsShield,
  BsArrowRight,
  BsGrid3X3Gap,
} from "react-icons/bs";

export default function ActionCards({
  onReportBuilderClick,
  canvas = [],
  onVisualDashboardClick,
  onQuestionCardClick,
  onQuickAnalysisClick,
}) {
  // Calculate active KPI count (cards that have KPIs assigned)
  const activeKPICount = canvas.filter((slot) => slot.kpiId).length;

  const mainCards = [
    {
      title: "Visual Dashboard",
      subtitle: `${activeKPICount} KPIs active`,
      icon: BsBarChart,
      onClick: onVisualDashboardClick,
      visible: true,
    },
    {
      title: "Quick Analysis",
      subtitle: "Ready",
      icon: BsLightning,
      onClick: onQuickAnalysisClick,
      visible: true,
    },
    {
      title: "Report Builder",
      subtitle: "3 templates",
      icon: BsFileText,
      onClick: onReportBuilderClick,
      visible: true,
    },
  ].filter(card => card.visible);

  const subCards = [
    {
      title: "Revenue Analysis",
      description: "What are our top revenue streams?",
      category: "FINANCE",
      icon: BsGraphUp,
      onClick: () => onQuestionCardClick?.("What are our top revenue streams?"),
    },
    {
      title: "Market Research",
      description: "Analyze our market position",
      category: "STRATEGY",
      icon: BsSearch,
      onClick: () => onQuestionCardClick?.("Analyze our market position"),
    },
    {
      title: "Financial Planning",
      description: "Create a financial forecast",
      category: "PLANNING",
      icon: BsCalculator,
      onClick: () => onQuestionCardClick?.("Create a financial forecast"),
    },
    {
      title: "Performance Analytics",
      description: "Compare quarterly performance",
      category: "ANALYTICS",
      icon: BsBarChart,
      onClick: () => onQuestionCardClick?.("Compare quarterly performance"),
    },
    {
      title: "Customer Analysis",
      description: "Break down our customer segments",
      category: "INSIGHTS",
      icon: BsPeople,
      onClick: () => onQuestionCardClick?.("Break down our customer segments"),
    },
    {
      title: "Compliance",
      description: "Generate compliance report",
      category: "LEGAL",
      icon: BsShield,
      onClick: () => onQuestionCardClick?.("Generate compliance report"),
    },
  ];

  return (
    <div className="px-3 sm:px-5 lg:px-8 py-4 sm:py-6 max-w-5xl mx-auto">
      {/* Quick Actions Section */}
      <div className="mb-6 sm:mb-10">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/5 border border-teal-500/10">
            <BsGrid3X3Gap className="text-teal-400 text-xs" />
            <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest">
              Quick Actions
            </span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-teal-500/20 to-transparent" />
        </div>

        {/* Mobile: Single column, Tablet: 2 col, Desktop: 3 col */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {mainCards.map((card, idx) => (
            <button
              key={idx}
              onClick={card.onClick}
              className="group relative bg-[#0a0a0a] border border-white/10 rounded-xl p-4 sm:p-5 cursor-pointer transition-all duration-300 hover:border-teal-500/50 hover:shadow-lg hover:shadow-teal-500/10 hover:-translate-y-0.5 text-left w-full overflow-hidden active:scale-[0.98]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:border-teal-500/30 group-hover:bg-teal-500/10 transition-all duration-300 flex-shrink-0">
                  <card.icon className="text-teal-400 text-lg sm:text-xl group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold text-sm font-dm-sans mb-0.5">
                    {card.title}
                  </div>
                  <div className="text-teal-500/80 text-[10px] font-medium uppercase tracking-wide">
                    {card.subtitle}
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-teal-500 text-gray-500 group-hover:text-black transition-all duration-300 flex-shrink-0">
                  <BsArrowRight className="text-xs transform group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Ask Dabby Section - Hidden on mobile, visible tablet+ */}
      <div className="hidden sm:block">
        <div className="flex items-center gap-3 mb-3 sm:mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2">
            Ask Dabby
          </span>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        {/* Tablet: 2 col, Desktop: 3 col */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {subCards.map((card, idx) => (
            <button
              key={idx}
              onClick={card.onClick}
              className="group bg-[#0a0a0a] hover:bg-white/5 border border-white/5 hover:border-teal-500/30 rounded-xl p-3 sm:p-4 lg:p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-0.5 text-left w-full overflow-hidden active:scale-[0.98]"
            >
              <div className="flex items-start gap-2 sm:gap-3">
                <div className="mt-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:border-teal-500/30 group-hover:bg-teal-500/10 transition-colors duration-300">
                  <card.icon className="text-xs text-gray-400 group-hover:text-teal-400 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] sm:text-[9px] font-bold text-gray-600 group-hover:text-teal-500/70 uppercase tracking-wider border border-white/5 px-1.5 py-0.5 rounded transition-colors">
                      {card.category}
                    </span>
                  </div>
                  <div className="text-white text-xs sm:text-sm font-medium font-dm-sans group-hover:text-teal-400 transition-colors">
                    {card.title}
                  </div>
                  <div className="text-gray-500 text-[10px] sm:text-xs leading-snug font-dm-sans group-hover:text-gray-400 line-clamp-1 mt-1 hidden lg:block">
                    {card.description}
                  </div>
                </div>
                <BsArrowRight className="text-gray-700 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all text-xs opacity-0 group-hover:opacity-100 self-center flex-shrink-0 hidden sm:block" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
