import React, { useState } from 'react';
import { 
  FiFileText, FiTrendingUp, FiDollarSign, FiUsers, 
  FiBarChart2, FiPieChart, FiTarget, FiClipboard,
  FiCheckCircle, FiAlertTriangle, FiZap, FiGrid
} from 'react-icons/fi';

const templates = [
  {
    id: 'revenue-analysis',
    category: 'Financial',
    title: 'Revenue Analysis',
    description: 'Analyze revenue trends, top streams, and growth opportunities',
    icon: FiTrendingUp,
    color: '#22c55e',
    prompt: 'Help me analyze our revenue data. I want to understand the key trends, identify top revenue streams, and get insights on growth opportunities. Please provide a detailed breakdown with actionable recommendations.'
  },
  {
    id: 'market-research',
    category: 'Strategy',
    title: 'Market Research',
    description: 'Research market position, competitors, and opportunities',
    icon: FiTarget,
    color: '#3b82f6',
    prompt: 'Conduct a comprehensive market research analysis. Help me understand our market position, identify key competitors, analyze industry trends, and find opportunities for growth and differentiation.'
  },
  {
    id: 'financial-forecast',
    category: 'Financial',
    title: 'Financial Forecast',
    description: 'Create financial projections and budget planning',
    icon: FiDollarSign,
    color: '#f59e0b',
    prompt: 'Help me create a financial forecast. I need to project revenue, expenses, and profitability for the upcoming quarters. Include key assumptions, risk factors, and scenario analysis.'
  },
  {
    id: 'customer-analysis',
    category: 'Analytics',
    title: 'Customer Analysis',
    description: 'Analyze customer behavior, segments, and retention',
    icon: FiUsers,
    color: '#ec4899',
    prompt: 'Analyze our customer data in depth. Help me understand customer segments, behavior patterns, lifetime value, churn risks, and opportunities to improve retention and satisfaction.'
  },
  {
    id: 'performance-review',
    category: 'Analytics',
    title: 'Performance Analytics',
    description: 'Review KPIs, metrics, and performance trends',
    icon: FiBarChart2,
    color: '#8b5cf6',
    prompt: 'Review our performance metrics and KPIs. Analyze current performance against targets, identify trends, highlight areas of concern, and provide actionable recommendations for improvement.'
  },
  {
    id: 'budget-planning',
    category: 'Financial',
    title: 'Budget Planning',
    description: 'Plan and optimize budget allocation',
    icon: FiPieChart,
    color: '#14b8a6',
    prompt: 'Help me create a comprehensive budget plan. Analyze current spending patterns, identify optimization opportunities, and suggest resource allocation strategies for maximum ROI.'
  },
  {
    id: 'compliance-check',
    category: 'Audit',
    title: 'Compliance Review',
    description: 'Review regulatory compliance and identify gaps',
    icon: FiClipboard,
    color: '#f43f5e',
    prompt: 'Conduct a thorough compliance review. Check our data and processes against regulatory requirements, identify any compliance gaps, and provide recommendations for remediation.'
  },
  {
    id: 'report-summary',
    category: 'Documentation',
    title: 'Report Summary',
    description: 'Summarize documents and extract key insights',
    icon: FiFileText,
    color: '#6366f1',
    prompt: 'Help me summarize and extract key insights from the uploaded documents. Provide a comprehensive executive summary with main findings, key metrics, and actionable takeaways.'
  },
  {
    id: 'risk-assessment',
    category: 'Audit',
    title: 'Risk Assessment',
    description: 'Identify and evaluate business risks',
    icon: FiAlertTriangle,
    color: '#ef4444',
    prompt: 'Conduct a risk assessment for our business. Identify potential risks across operations, finance, and compliance. Evaluate likelihood and impact, and suggest mitigation strategies.'
  },
  {
    id: 'quick-insights',
    category: 'Analytics',
    title: 'Quick Insights',
    description: 'Get instant insights from your data',
    icon: FiZap,
    color: '#fbbf24',
    prompt: 'Provide quick insights from the available data. Highlight key metrics, notable trends, anomalies, and areas that need attention. Keep it concise but actionable.'
  },
  {
    id: 'dashboard-setup',
    category: 'Strategy',
    title: 'Dashboard Setup',
    description: 'Help configure KPIs and metrics',
    icon: FiGrid,
    color: '#06b6d4',
    prompt: 'Help me set up an effective dashboard. Recommend the most important KPIs to track based on our business type, suggest visualization approaches, and help define targets and thresholds.'
  },
  {
    id: 'audit-preparation',
    category: 'Audit',
    title: 'Audit Preparation',
    description: 'Prepare for internal or external audits',
    icon: FiCheckCircle,
    color: '#10b981',
    prompt: 'Help me prepare for an upcoming audit. Create a checklist of required documents, identify potential areas of concern, and suggest preparations to ensure a smooth audit process.'
  }
];

const categories = ['All', 'Financial', 'Analytics', 'Strategy', 'Audit', 'Documentation'];

export default function ChatTemplates({ 
  onSelectTemplate, 
  compact = false,
  showAll = false 
}) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredId, setHoveredId] = useState(null);

  const filteredTemplates = activeCategory === 'All' 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  const displayTemplates = compact && !showAll 
    ? filteredTemplates.slice(0, 4) 
    : filteredTemplates;

  // Compact view - horizontal scrolling chips
  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FiZap size={12} className="text-teal-400" />
          <span>Quick Templates</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {displayTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => onSelectTemplate?.(template.prompt)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 hover:border-gray-600/50 rounded-xl transition-all duration-200 text-sm whitespace-nowrap group"
            >
              <template.icon 
                size={14} 
                style={{ color: template.color }} 
                className="group-hover:scale-110 transition-transform"
              />
              <span className="text-gray-300">{template.title}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full view - grid with categories
  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              activeCategory === category
                ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                : 'bg-gray-800/50 text-gray-400 border border-transparent hover:bg-gray-700/50 hover:text-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {displayTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate?.(template.prompt)}
            onMouseEnter={() => setHoveredId(template.id)}
            onMouseLeave={() => setHoveredId(null)}
            className="group flex flex-col items-start gap-3 p-4 bg-[#12121a] hover:bg-[#1a1a2e] border border-gray-800/50 hover:border-gray-700/50 rounded-xl transition-all duration-300 text-left hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
          >
            {/* Header */}
            <div className="flex items-start justify-between w-full">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                style={{ 
                  backgroundColor: `${template.color}15`,
                  boxShadow: hoveredId === template.id ? `0 0 20px ${template.color}30` : 'none'
                }}
              >
                <template.icon size={20} style={{ color: template.color }} />
              </div>
              <span 
                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ 
                  backgroundColor: `${template.color}15`,
                  color: template.color
                }}
              >
                {template.category}
              </span>
            </div>

            {/* Content */}
            <div className="space-y-1">
              <h4 className="text-white font-medium text-sm">{template.title}</h4>
              <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                {template.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

// Export templates for use in other components
export { templates };
