import React, { useState, useEffect, useCallback } from "react";
import {
  BsCashStack,
  BsArrowUpRight,
  BsArrowDownLeft,
  BsHeartPulse,
  BsExclamationCircle,
  BsClockHistory,
  BsGraphUp,
  BsGraphDown,
  BsActivity
} from "react-icons/bs";
import Card from "../../shared/Card";
import { intelligenceService } from "../../../services/intelligenceService";

export default function OpsOverview({ workbenchId }) {
  const [timeRange, setTimeRange] = useState('monthly'); // Default to monthly
  const [metrics, setMetrics] = useState([
    {
      label: "REVENUE",
      value: "₹0",
      change: "Today",
      changeType: "neutral",
      icon: BsGraphUp,
      color: "emerald",
      subValue: null
    },
    {
      label: "EXPENSES",
      value: "₹0",
      change: "Today",
      changeType: "neutral",
      icon: BsGraphDown,
      color: "red",
      subValue: null
    },
    {
      label: "NET CHANGE",
      value: "₹0",
      change: "Revenue - Expenses",
      changeType: "neutral",
      icon: BsCashStack,
      color: "amber",
      subValue: null
    },
    {
      label: "TRANSACTIONS",
      value: "0",
      change: "Transactions today",
      changeType: "neutral",
      icon: BsActivity,
      color: "teal",
      subValue: null
    },
  ]);

  const [exceptions, setExceptions] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return "₹0";
    const absAmount = Math.abs(amount);
    if (absAmount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)}Cr`;
    } else if (absAmount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (absAmount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    } else {
      return `₹${Math.round(amount).toLocaleString()}`;
    }
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch Operations Metrics from Intelligence Service
      const opsMetrics = await intelligenceService.getOperationsMetrics(workbenchId, timeRange);
      
      if (opsMetrics) {
        setMetrics(prevMetrics => {
          const newMetrics = prevMetrics.map(m => ({ ...m }));
          
          // Revenue
          newMetrics[0].label = `${timeRange.toUpperCase()} REVENUE`;
          newMetrics[0].value = formatAmount(opsMetrics.totalRevenue);
          newMetrics[0].change = `${formatAmount(opsMetrics.dailyRevenue)} Today`;
          newMetrics[0].changeType = opsMetrics.dailyRevenue > 0 ? "positive" : "neutral";
          
          // Expenses
          newMetrics[1].label = `${timeRange.toUpperCase()} EXPENSES`;
          newMetrics[1].value = formatAmount(opsMetrics.totalExpenses);
          newMetrics[1].change = `${formatAmount(opsMetrics.dailyExpenses)} Today`;
          newMetrics[1].changeType = opsMetrics.dailyExpenses > 0 ? "danger" : "neutral";
          
          // Net Change
          newMetrics[2].label = `${timeRange.toUpperCase()} NET CHANGE`;
          newMetrics[2].value = formatAmount(opsMetrics.netTotalChange);
          newMetrics[2].change = `${formatAmount(opsMetrics.netDailyChange)} Today`;
          newMetrics[2].changeType = opsMetrics.netDailyChange >= 0 ? "positive" : "danger";
          
          // Transactions
          newMetrics[3].label = `${timeRange.toUpperCase()} TRANSACTIONS`;
          newMetrics[3].value = (opsMetrics.totalTransactions || 0).toString();
          newMetrics[3].change = `${opsMetrics.transactionVelocity} Today`;
          newMetrics[3].changeType = opsMetrics.transactionVelocity > 10 ? "positive" : "neutral";
          
          return newMetrics;
        });
      }

      // Fetch Exceptions
      const exceptionsData = await intelligenceService.getWorkbenchExceptions(workbenchId);

      // Fetch Expenses
      const expensesData = await intelligenceService.getExpenseCategorization(workbenchId);

      setExceptions(exceptionsData?.map(e => ({ 
        text: e.message, 
        type: e.severity === 'critical' ? 'danger' : (e.severity === 'high' || e.severity === 'medium') ? 'warning' : 'default' 
      })) || []);

      setExpenses(expensesData?.map(e => ({
        category: e.category,
        progress: e.percentage || 0, // Ensure percentage exists
        count: `${e.transaction_count} txns`,
        color: getCategoryColor(e.category)
      })) || []);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    }
  }, [workbenchId, timeRange]);

  useEffect(() => {
    if (workbenchId) {
      fetchDashboardData();
    }

    const handleRefresh = () => {
      console.log("Refreshing OpsOverview data...");
      fetchDashboardData();
    };

    window.addEventListener('refresh-workbench-data', handleRefresh);
    return () => window.removeEventListener('refresh-workbench-data', handleRefresh);
  }, [workbenchId, fetchDashboardData]); // Refetch when fetchDashboardData changes (which depends on timeRange)

  const getCategoryColor = (category) => {
    const colors = ["bg-primary-300", "bg-primary-200", "bg-primary-400", "bg-primary-100", "bg-gray-600"];
    const index = Math.abs(category.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length;
    return colors[index];
  };

  const getMetricStyles = (color) => {
    switch (color) {
      case 'amber': return 'bg-primary-300/10 text-primary-300 group-hover:bg-primary-300/20';
      case 'red': return 'bg-red-500/10 text-red-400 group-hover:bg-red-500/20';
      case 'emerald': return 'bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20';
      case 'teal': return 'bg-primary-200/10 text-primary-200 group-hover:bg-primary-200/20';
      default: return 'bg-gray-500/10 text-gray-400 group-hover:bg-gray-500/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Daily Operations Metrics */}
      <div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Operations Overview</h3>
            <p className="text-gray-500 text-xs">Cash position, payables, receivables & health metrics</p>
          </div>
          <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
             {['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'all'].map((range) => (
               <button
                 key={range}
                 onClick={() => setTimeRange(range)}
                 className={`px-3 py-1.5 text-[10px] font-medium rounded-md transition-all uppercase ${
                   timeRange === range 
                     ? 'bg-primary-500 text-white shadow-lg' 
                     : 'text-gray-400 hover:text-white hover:bg-white/5'
                 }`}
               >
                 {range}
               </button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((m, i) => (
            <Card key={i} variant="dark" className="border-white/5 p-6 hover:border-white/10 transition-all group">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg transition-all ${getMetricStyles(m.color)}`}>
                  <m.icon className="text-lg" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">{m.label}</span>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">{m.value}</div>
                <div className="flex justify-between items-center">
                  <div className={`text-[11px] ${m.changeType === 'positive' ? 'text-emerald-500' :
                    m.changeType === 'warning' ? 'text-amber-500' :
                      m.changeType === 'danger' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                    {m.change}
                  </div>
                  {m.subValue && (
                    <div className="text-[10px] text-gray-500 font-medium bg-white/5 px-1.5 py-0.5 rounded">
                      {m.subValue}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Exception Flags */}
      <Card variant="dark" className="border-white/5 p-6 bg-[#0E1117]/80">
        <div className="flex items-center space-x-2 mb-6">
          <BsExclamationCircle className="text-amber-500" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Exception Flags</h3>
        </div>
        <div className="space-y-3">
          {exceptions.map((ex, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border flex items-center space-x-3 text-sm ${ex.type === 'danger' ? 'bg-red-500/5 border-red-500/10 text-red-400' :
                ex.type === 'warning' ? 'bg-amber-500/5 border-amber-500/10 text-amber-400' :
                  'bg-white/5 border-white/5 text-gray-400'
                }`}
            >
              <div className={`w-2 h-2 rounded-full ${ex.type === 'danger' ? 'bg-red-500' :
                ex.type === 'warning' ? 'bg-amber-500' :
                  'bg-gray-500'
                }`} />
              <span>{ex.text}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Expense Categorization Health */}
      <Card variant="dark" className="border-white/5 p-6 bg-[#0E1117]/80">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Expense Categorization Health</h3>
        <div className="space-y-6">
          {expenses.map((exp, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300 font-medium">{exp.category}</span>
                <span className="text-gray-500 text-xs">{exp.count}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${exp.color} rounded-full transition-all duration-1000 ease-out`}
                  style={{ width: `${exp.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
