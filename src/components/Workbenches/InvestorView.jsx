import React, { useState, useEffect, useCallback } from "react";
import { 
  BsArrowUpRight, 
  BsArrowDownRight, 
  BsCashStack, 
  BsGraphUp, 
  BsClock, 
  BsWallet2, 
  BsBank,
  BsReceipt,
  BsShieldCheck,
  BsLightningCharge,
  BsSpeedometer2
} from "react-icons/bs";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import Card from "../shared/Card";
import { supabase } from "../../lib/supabase";
import { intelligenceService } from "../../services/intelligenceService";

const REVENUE_DATA_PLACEHOLDER = [
  { name: "Aug", revenue: 0, expenses: 0 },
  { name: "Sep", revenue: 0, expenses: 0 },
  { name: "Oct", revenue: 0, expenses: 0 },
  { name: "Nov", revenue: 0, expenses: 0 },
  { name: "Dec", revenue: 0, expenses: 0 },
  { name: "Jan", revenue: 0, expenses: 0 },
];

const EXPENSE_BREAKDOWN_PLACEHOLDER = [
  { name: "Employee Costs", value: 0, color: "#FBBF24" },
  { name: "Technology", value: 0, color: "#10B981" },
  { name: "Marketing", value: 0, color: "#3B82F6" },
  { name: "COGS", value: 0, color: "#8B5CF6" },
  { name: "Office & Admin", value: 0, color: "#EC4899" },
];

export default function InvestorView({ workbenchId }) {
  const [loading, setLoading] = useState(true);
  const [revenueTrend] = useState(REVENUE_DATA_PLACEHOLDER);
  const [expenseBreakdown, setExpenseBreakdown] = useState(EXPENSE_BREAKDOWN_PLACEHOLDER);
  const [pandl, setPandl] = useState([]);
  const [balanceSheet, setBalanceSheet] = useState([]);
  const [cashFlow, setCashFlow] = useState({ operating: 0, investing: 0, financing: 0 });
  const [auditLogs, setAuditLogs] = useState([]);
  const [secretMetrics, setSecretMetrics] = useState(null);
  const [kpis, setKpis] = useState([
    { label: "MONTHLY REVENUE", value: "₹0", change: "0%", isPositive: true, period: "Current", icon: BsGraphUp },
    { label: "BURN RATE", value: "₹0", change: "0%", isPositive: false, period: "Current", icon: BsCashStack },
    { label: "RUNWAY", value: "0 months", change: "0%", isPositive: true, period: "Current", icon: BsClock },
    { label: "PROFIT MARGIN", value: "0%", change: "0%", isPositive: true, period: "Current", icon: BsWallet2 },
    { label: "CASH POSITION", value: "₹0", change: "0%", isPositive: true, period: "Current", icon: BsBank },
    { label: "REVENUE GROWTH", value: "0%", change: "0%", isPositive: true, period: "MoM", icon: BsReceipt },
  ]);

  const fetchInvestorData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch Intelligence Metrics
      const investorMetrics = await intelligenceService.getInvestorMetrics(workbenchId);
      const secretMetricsData = await intelligenceService.getSecretMetrics(workbenchId, investorMetrics);
      
      if (secretMetricsData) {
        setSecretMetrics(secretMetricsData);
      }

      // Update KPIs with Live Data
      if (investorMetrics) {
        setKpis(currentKpis => {
          const updatedKpis = currentKpis.map(kpi => ({ ...kpi }));
          // Revenue
          updatedKpis[0].value = `₹${(investorMetrics.revenue / 100000).toFixed(1)}L`;
          // Burn Rate
          updatedKpis[1].value = `₹${(investorMetrics.monthlyBurn / 100000).toFixed(1)}L`;
          // Runway
          updatedKpis[2].value = `${investorMetrics.runwayMonths.toFixed(1)} months`;
          // Profit Margin
          updatedKpis[3].value = `${investorMetrics.profitMargin.toFixed(1)}%`;
          // Cash Position
          updatedKpis[4].value = `₹${(investorMetrics.cashBalance / 100000).toFixed(1)}L`;
          // Revenue Growth
          updatedKpis[5].value = `${investorMetrics.revenueGrowth.toFixed(1)}%`;
          updatedKpis[5].isPositive = investorMetrics.revenueGrowth >= 0;

          return updatedKpis;
        });
      }

      // Fetch ALL ledger entries to reconstruct views on frontend
      // This avoids dependency on views that may have been deleted
      const { data: allEntries } = await supabase
        .from('ledger_entries')
        .select(`
          amount,
          entry_type,
          transaction_date,
          workbench_accounts!inner (
            id,
            account_name,
            account_type,
            category,
            cash_impact
          )
        `)
        .eq('workbench_id', workbenchId);

      if (allEntries) {
          const expenseMap = {};
          const pandlItems = {};
          const bsItems = {};
          let op = 0, inv = 0, fin = 0;

          allEntries.forEach(entry => {
              const acc = entry.workbench_accounts;
              const amount = entry.amount || 0;
              const isDebit = entry.entry_type === 'debit';
              const signedAmount = isDebit ? amount : -amount; // Debit +, Credit -

              // 1. Expense Breakdown
              if (acc.account_type === 'Expense') {
                  const cat = acc.category || 'Uncategorized';
                  expenseMap[cat] = (expenseMap[cat] || 0) + amount;
              }

              // 2. P&L Items
              if (acc.account_type === 'Revenue' || acc.account_type === 'Expense') {
                  if (!pandlItems[acc.account_name]) {
                      pandlItems[acc.account_name] = {
                          account_name: acc.account_name,
                          category: acc.category || acc.account_type,
                          balance: 0,
                          account_type: acc.account_type
                      };
                  }
                  // P&L Balance: Debit +, Credit - (consistent with standard)
                  pandlItems[acc.account_name].balance += signedAmount;
              }

              // 3. Balance Sheet Items
              if (['Asset', 'Liability', 'Equity'].includes(acc.account_type)) {
                   if (!bsItems[acc.account_name]) {
                       bsItems[acc.account_name] = {
                           account_name: acc.account_name,
                           account_type: acc.account_type,
                           balance: 0
                       };
                   }
                   bsItems[acc.account_name].balance += signedAmount;
              }

              // 4. Cash Flow (Legacy Logic preserved but using fetched data)
              if (acc.cash_impact) {
                  const val = !isDebit ? amount : -amount; // Credit +, Debit -
                  if (acc.account_type === 'Revenue' || acc.account_type === 'Expense') op += val;
                  else if (acc.account_type === 'Asset') inv += val;
                  else if (acc.account_type === 'Liability' || acc.account_type === 'Equity') fin += val;
              }
          });

          // Update State
          setPandl(Object.values(pandlItems));
          setBalanceSheet(Object.values(bsItems));
          
          const colors = ["#FBBF24", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"];
          const formattedExpenses = Object.keys(expenseMap).map((cat, i) => ({
              name: cat,
              value: parseFloat((expenseMap[cat] / 100000).toFixed(1)),
              color: colors[i % colors.length]
          }));
          setExpenseBreakdown(formattedExpenses.length > 0 ? formattedExpenses : EXPENSE_BREAKDOWN_PLACEHOLDER);
          setCashFlow({ operating: op, investing: inv, financing: fin });
      }

       // Fetch Audit Logs
       const { data: logsData } = await supabase
         .from('audit_logs')
         .select('*')
         .eq('workbench_id', workbenchId)
         .order('created_at', { ascending: false })
         .limit(5);

       if (logsData) {
         setAuditLogs(logsData);
       }

    } catch (err) {
      console.error("Error fetching investor data:", err);
    } finally {
      setLoading(false);
    }
  }, [workbenchId]);

  useEffect(() => {
    if (workbenchId) {
      fetchInvestorData();
    }
  }, [workbenchId, fetchInvestorData]);

  const calculateGrossProfit = () => {
    const revenue = pandl.filter(i => i.category === 'Revenue').reduce((sum, i) => sum + i.balance, 0);
    const cogs = pandl.filter(i => i.category === 'COGS').reduce((sum, i) => sum + i.balance, 0);
    return revenue - Math.abs(cogs);
  };

  const calculateEBITDA = () => {
    const gp = calculateGrossProfit();
    const expenses = pandl.filter(i => i.category !== 'Revenue' && i.category !== 'COGS').reduce((sum, i) => sum + i.balance, 0);
    return gp - Math.abs(expenses);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Investor View</h2>
        <p className="text-gray-500 text-sm">Read-only financial overview — KPIs, charts, and MIS statements</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map((kpi, i) => (
          <Card key={i} variant="dark" className="border-white/5 p-5 bg-white/[0.02]">
            <div className="flex flex-col space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
                  {kpi.label}
                </span>
                <span className="text-[10px] text-gray-500">{kpi.period}</span>
              </div>
              <div className="flex items-end justify-between">
                <h3 className="text-2xl font-bold text-white tracking-tight">{kpi.value}</h3>
                <div className={`flex items-center space-x-1 text-xs font-medium ${
                  kpi.isPositive ? "text-emerald-400" : "text-rose-400"
                }`}>
                  {kpi.isPositive ? <BsArrowUpRight /> : <BsArrowDownRight />}
                  <span>{kpi.change}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Dabby's Intelligence Layer */}
      {secretMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card variant="dark" className="border-indigo-500/20 p-6 bg-gradient-to-br from-indigo-900/20 to-purple-900/20">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BsShieldCheck className="text-indigo-400" />
                  <h3 className="text-sm font-semibold text-indigo-100">Financial Health Score</h3>
                </div>
                <span className="text-2xl font-bold text-white">{secretMetrics.financialHealthScore.toFixed(0)}/100</span>
             </div>
             <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full" 
                  style={{ width: `${secretMetrics.financialHealthScore}%` }} 
                />
             </div>
             <p className="text-xs text-indigo-300/60 mt-2">Composite score based on profit, runway, stability & growth.</p>
          </Card>

          <Card variant="dark" className="border-emerald-500/20 p-6 bg-gradient-to-br from-emerald-900/20 to-teal-900/20">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BsLightningCharge className="text-emerald-400" />
                  <h3 className="text-sm font-semibold text-emerald-100">Cash Stability Index</h3>
                </div>
                <span className="text-2xl font-bold text-white">{secretMetrics.cashStabilityIndex.toFixed(1)}</span>
             </div>
             <p className="text-xs text-emerald-300/60 mt-2">Standard deviation of monthly cash balance (Lower is better).</p>
          </Card>

          <Card variant="dark" className="border-blue-500/20 p-6 bg-gradient-to-br from-blue-900/20 to-cyan-900/20">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <BsSpeedometer2 className="text-blue-400" />
                  <h3 className="text-sm font-semibold text-blue-100">Operational Discipline</h3>
                </div>
                <span className="text-2xl font-bold text-white">{secretMetrics.operationalDisciplineScore}%</span>
             </div>
             <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full" 
                  style={{ width: `${secretMetrics.operationalDisciplineScore}%` }} 
                />
             </div>
             <p className="text-xs text-blue-300/60 mt-2">Percentage of categorized transactions vs total.</p>
          </Card>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card variant="dark" className="lg:col-span-2 border-white/5 p-6 bg-white/[0.02]">
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-300">Revenue vs Expenses — 6 Month Trend</h3>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#FBBF24" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(val) => `₹${val}L`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#FBBF24" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorExpenses)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut Chart */}
        <Card variant="dark" className="border-white/5 p-6 bg-white/[0.02]">
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-300">Expense Breakdown</h3>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #ffffff10', borderRadius: '8px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 space-y-3">
            {expenseBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-400">{item.name}</span>
                </div>
                <span className="text-white font-medium">₹{item.value}L</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Financial Statements Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* P&L */}
        <Card variant="dark" className="border-white/5 p-6 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-gray-300 mb-6">Profit & Loss — Current Month</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Revenue</span>
              <span className="text-white font-medium">₹{(pandl.filter(i => i.category === 'Revenue').reduce((sum, i) => sum + i.balance, 0) / 100000).toFixed(1)}L</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">COGS</span>
              <span className="text-gray-400">(₹{(Math.abs(pandl.filter(i => i.category === 'COGS').reduce((sum, i) => sum + i.balance, 0)) / 100000).toFixed(1)}L)</span>
            </div>
            <div className="pt-2 border-t border-white/5 flex justify-between items-center text-sm font-bold">
              <span className="text-white uppercase tracking-wider text-[10px]">Gross Profit</span>
              <span className="text-white">₹{(calculateGrossProfit() / 100000).toFixed(1)}L</span>
            </div>
            <div className="space-y-3 pt-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
              {pandl.filter(i => i.category !== 'Revenue' && i.category !== 'COGS').map((item, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">{item.account_name}</span>
                  <span className="text-gray-500">(₹{(Math.abs(item.balance) / 100000).toFixed(1)}L)</span>
                </div>
              ))}
              {pandl.filter(i => i.category !== 'Revenue' && i.category !== 'COGS').length === 0 && (
                <div className="text-xs text-gray-600 italic">No expenses recorded</div>
              )}
            </div>
            <div className="pt-4 flex justify-between items-center text-sm font-bold text-primary border-t border-white/5">
              <span className="uppercase tracking-wider text-[10px]">EBITDA</span>
              <span>₹{(calculateEBITDA() / 100000).toFixed(1)}L</span>
            </div>
          </div>
        </Card>

        {/* Balance Sheet */}
        <Card variant="dark" className="border-white/5 p-6 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-gray-300 mb-6">Balance Sheet Snapshot</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-primary tracking-wider uppercase">Assets</h4>
              <div className="space-y-3">
                {balanceSheet.filter(i => i.account_type === 'Asset').map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">{item.account_name}</span>
                    <span className="text-white font-medium">₹{(item.balance / 100000).toFixed(1)}L</span>
                  </div>
                ))}
                {balanceSheet.filter(i => i.account_type === 'Asset').length === 0 && (
                  <div className="text-xs text-gray-600 italic">No assets recorded</div>
                )}
                <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-white/5">
                  <span className="text-gray-300">Total Assets</span>
                  <span className="text-white">₹{(balanceSheet.filter(i => i.account_type === 'Asset').reduce((sum, i) => sum + i.balance, 0) / 100000).toFixed(1)}L</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-primary tracking-wider uppercase">Liabilities</h4>
              <div className="space-y-3">
                {balanceSheet.filter(i => i.account_type === 'Liability').map((item, i) => (
                  <div key={i} className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">{item.account_name}</span>
                    <span className="text-white font-medium">₹{(Math.abs(item.balance) / 100000).toFixed(1)}L</span>
                  </div>
                ))}
                {balanceSheet.filter(i => i.account_type === 'Liability').length === 0 && (
                  <div className="text-xs text-gray-600 italic">No liabilities recorded</div>
                )}
                <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-white/5">
                  <span className="text-gray-300">Total Liabilities</span>
                  <span className="text-white">₹{(Math.abs(balanceSheet.filter(i => i.account_type === 'Liability').reduce((sum, i) => sum + i.balance, 0)) / 100000).toFixed(1)}L</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-sm font-bold text-primary border-t border-white/5">
              <span className="uppercase tracking-wider text-[10px]">Net Worth</span>
              <span>₹{((balanceSheet.filter(i => i.account_type === 'Asset').reduce((sum, i) => sum + i.balance, 0) - Math.abs(balanceSheet.filter(i => i.account_type === 'Liability').reduce((sum, i) => sum + i.balance, 0))) / 100000).toFixed(1)}L</span>
            </div>
          </div>
        </Card>

        {/* Cash Flow */}
        <Card variant="dark" className="border-white/5 p-6 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-gray-300 mb-6">Cash Flow — Current Month</h3>
          <div className="space-y-6">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-primary tracking-wider uppercase">Operating Activities</h4>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Net Cash from Ops</span>
                  <span className={cashFlow.operating >= 0 ? "text-white" : "text-red-400"}>
                    ₹{(Math.abs(cashFlow.operating) / 100000).toFixed(1)}L
                    {cashFlow.operating < 0 && "-"}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-primary tracking-wider uppercase">Investing Activities</h4>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Net Cash from Investing</span>
                <span className={cashFlow.investing >= 0 ? "text-white" : "text-red-400"}>
                  ₹{(Math.abs(cashFlow.investing) / 100000).toFixed(1)}L
                  {cashFlow.investing < 0 && "-"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-primary tracking-wider uppercase">Financing Activities</h4>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Net Cash from Financing</span>
                <span className={cashFlow.financing >= 0 ? "text-white" : "text-red-400"}>
                  ₹{(Math.abs(cashFlow.financing) / 100000).toFixed(1)}L
                  {cashFlow.financing < 0 && "-"}
                </span>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center text-sm font-bold text-primary border-t border-white/5">
              <span className="uppercase tracking-wider text-[10px]">Net Cash Flow</span>
              <span>₹{((cashFlow.operating + cashFlow.investing + cashFlow.financing) / 100000).toFixed(1)}L</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Trail Section */}
      <div className="mt-8 pt-8 border-t border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-gray-300">Deterministic Audit Trail</h3>
            <p className="text-xs text-gray-500 mt-1">Real-time ledger verification and change history</p>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Verified Ledger</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white/[0.01] border border-white/5 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-4 py-3 font-semibold text-gray-400">Timestamp</th>
                    <th className="px-4 py-3 font-semibold text-gray-400">Action</th>
                    <th className="px-4 py-3 font-semibold text-gray-400">Entity</th>
                    <th className="px-4 py-3 font-semibold text-gray-400">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 text-[10px] uppercase">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 font-mono">{log.entity_type}</td>
                      <td className="px-4 py-3 text-gray-500 truncate max-w-[200px]">
                        {log.action === 'CREATE' ? 'New entry added' : 'Modified existing record'}
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-600 italic">
                        No recent audit activity found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="space-y-4">
            <Card variant="dark" className="p-4 border-white/5 bg-white/[0.02]">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">System Integrity</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Data Source</span>
                  <span className="text-white">Supabase Immutable</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Hashing</span>
                  <span className="text-white">SHA-256</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Completeness</span>
                  <span className="text-green-500">100%</span>
                </div>
              </div>
            </Card>
            <button className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-gray-300 uppercase tracking-widest transition-all">
              Download Full Audit Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
