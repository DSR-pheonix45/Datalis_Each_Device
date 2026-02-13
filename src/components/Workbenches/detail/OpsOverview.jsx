import React, { useState, useEffect } from "react";
import { 
  BsCashStack, 
  BsArrowUpRight, 
  BsArrowDownLeft, 
  BsHeartPulse,
  BsExclamationCircle,
  BsClockHistory
} from "react-icons/bs";
import Card from "../../shared/Card";
import { supabase } from "../../../lib/supabase";

export default function OpsOverview({ workbenchId }) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState([
    { 
      label: "CASH POSITION", 
      value: "₹0", 
      change: "Loading...", 
      changeType: "neutral",
      icon: BsCashStack,
      color: "amber",
      subValue: "Net: ₹0"
    },
    { 
      label: "PAYABLES", 
      value: "₹0", 
      change: "No bills due", 
      changeType: "neutral",
      icon: BsArrowUpRight,
      color: "red"
    },
    { 
      label: "RECEIVABLES", 
      value: "₹0", 
      change: "No overdue invoices", 
      changeType: "neutral",
      icon: BsArrowDownLeft,
      color: "emerald"
    },
    { 
      label: "HEALTH SCORE", 
      value: "--/100", 
      change: "Calculating...", 
      changeType: "neutral",
      icon: BsHeartPulse,
      color: "teal"
    },
  ]);

  const [exceptions, setExceptions] = useState([]);
  const [expenses, setExpenses] = useState([]);

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
  }, [workbenchId]);

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

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // --- DEBUG SECTION ---
      // Fetch all transaction records for this workbench to see what's actually there
      const { data: rawRecords, error: rawError } = await supabase
        .from('workbench_records')
        .select('*')
        .eq('workbench_id', workbenchId);
      
      console.log("RAW RECORDS DEBUG:", { 
        workbenchId, 
        count: rawRecords?.length, 
        records: rawRecords,
        error: rawError 
      });
      // ---------------------

      // Fetch Cash Position
      const { data: cashData, error: cashError } = await supabase
        .from('view_cash_position')
        .select('*')
        .eq('workbench_id', workbenchId)
        .maybeSingle();
      
      if (cashError) console.error("Cash Error:", cashError);

      // Fetch Draft Impact
      const { data: draftData, error: draftError } = await supabase
        .from('view_draft_impact')
        .select('*')
        .eq('workbench_id', workbenchId)
        .maybeSingle();
      
      if (draftError) console.error("Draft Error:", draftError);
      
      console.log("Dashboard Data Fetch:", { workbenchId, cashData, draftData });

      // Fetch Payables
      const { data: payablesData } = await supabase
        .from('view_payables')
        .select('*')
        .eq('workbench_id', workbenchId);

      // Fetch Receivables
      const { data: receivablesData } = await supabase
        .from('view_receivables')
        .select('*')
        .eq('workbench_id', workbenchId);

      // Fetch Exceptions
      const { data: exceptionsData } = await supabase
        .from('view_exception_flags')
        .select('*')
        .eq('workbench_id', workbenchId);

      // Fetch Expenses
      const { data: expensesData } = await supabase
        .from('view_expense_categorization')
        .select('*')
        .eq('workbench_id', workbenchId);

      // Update metrics
      const newMetrics = [...metrics];
      
      const confirmedBalance = cashData?.balance || 0;
      const draftBalance = draftData?.draft_balance || 0;

      console.log("METRICS CALCULATION:", {
        confirmedBalance,
        draftBalance,
        cashData,
        draftData
      });

      // Fallback: If views return 0, let's calculate from rawRecords just to be sure
      let manualConfirmed = 0;
      let manualDraft = 0;
      let manualPayables = 0;
      let manualReceivables = 0;

      if (rawRecords) {
        rawRecords.forEach(r => {
          const amount = r.net_amount || 0;
          const direction = r.metadata?.direction; // 'credit' = In, 'debit' = Out
          const status = r.status;
          const type = r.record_type;
          
          if (type === 'transaction') {
            if (status === 'confirmed') {
              manualConfirmed += (direction === 'credit' ? amount : -amount);
            } else {
              manualDraft += (direction === 'credit' ? amount : -amount);
            }

            // Logic for Receivables/Payables based on direction
            // User says: Credit = Invoice/Receivable, Debit = Bill/Payable
            if (direction === 'credit') {
              manualReceivables += amount;
            } else if (direction === 'debit') {
              manualPayables += amount;
            }
          } else if (type === 'bill') {
            manualPayables += amount;
          } else if (type === 'invoice') {
            manualReceivables += amount;
          } else if (type === 'adjustment') {
            // Adjustments affect confirmed balance
            const adjDir = r.metadata?.direction || 'credit';
            manualConfirmed += (adjDir === 'credit' ? amount : -amount);
          }
        });
      }

      const finalConfirmed = confirmedBalance || manualConfirmed;
      const finalDraft = draftBalance || manualDraft;
      const totalBalance = finalConfirmed + finalDraft;

      newMetrics[0].value = formatAmount(finalConfirmed);
      newMetrics[0].subValue = finalDraft !== 0 ? `Proj: ${formatAmount(totalBalance)}` : `Net: ${formatAmount(finalConfirmed)}`;
      newMetrics[0].change = finalDraft !== 0 ? "Includes draft txns" : "Updated just now";
      newMetrics[0].changeType = finalDraft !== 0 ? "warning" : "neutral";

      const totalPayables = (payablesData?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0) || manualPayables;
      newMetrics[1].value = formatAmount(totalPayables);
      newMetrics[1].change = `${payablesData?.length || rawRecords?.filter(r => r.record_type === 'bill' || (r.record_type === 'transaction' && r.metadata?.direction === 'debit' && r.status === 'draft')).length || 0} items due`;

      const totalReceivables = (receivablesData?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0) || manualReceivables;
      newMetrics[2].value = formatAmount(totalReceivables);
      newMetrics[2].change = `${receivablesData?.length || rawRecords?.filter(r => r.record_type === 'invoice' || (r.record_type === 'transaction' && r.metadata?.direction === 'credit' && r.status === 'draft')).length || 0} overdue`;

      setMetrics(newMetrics);
      setExceptions(exceptionsData?.map(e => ({ text: e.message, type: e.severity })) || []);
      
      setExpenses(expensesData?.map(e => ({
        category: e.category,
        progress: e.percentage,
        count: `${e.transaction_count} txns`,
        color: getCategoryColor(e.category)
      })) || []);

    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

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
        <h3 className="text-lg font-bold text-white mb-1">Daily Operations</h3>
        <p className="text-gray-500 text-xs mb-6">Cash position, payables, receivables & health metrics</p>
        
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
                  <div className={`text-[11px] ${
                    m.changeType === 'positive' ? 'text-emerald-500' : 
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
              className={`p-3 rounded-xl border flex items-center space-x-3 text-sm ${
                ex.type === 'danger' ? 'bg-red-500/5 border-red-500/10 text-red-400' :
                ex.type === 'warning' ? 'bg-amber-500/5 border-amber-500/10 text-amber-400' :
                'bg-white/5 border-white/5 text-gray-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                ex.type === 'danger' ? 'bg-red-500' :
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
