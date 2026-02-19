import React, { useState, useEffect, useCallback } from "react";
import { BsArrowRight } from "react-icons/bs";
import Card from "../../shared/Card";
import { intelligenceService } from "../../../services/intelligenceService";

export default function BudgetingView({ workbenchId }) {
  const [summary, setSummary] = useState([
    { label: "TOTAL BUDGET", value: "₹0" },
    { label: "ACTUAL SPEND", value: "₹0" },
    { label: "VARIANCE", value: "₹0", color: "text-gray-500" },
  ]);

  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (workbenchId) {
      fetchBudgetData();
    }

    const handleRefresh = () => {
      console.log("Refreshing BudgetingView data...");
      fetchBudgetData();
    };

    window.addEventListener('refresh-workbench-data', handleRefresh);
    return () => window.removeEventListener('refresh-workbench-data', handleRefresh);
  }, [workbenchId, fetchBudgetData]);

  const fetchBudgetData = useCallback(async () => {
    try {
      const metrics = await intelligenceService.getBudgetMetrics(workbenchId);

      if (metrics) {
        const formatCurrency = (val) => {
          if (!val && val !== 0) return "₹0";
          if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
          if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
          return `₹${val.toFixed(0)}`;
        };

        const overallVariance = metrics.totalBudget - metrics.totalActualSpend;

        setSummary([
          { label: "TOTAL BUDGET", value: formatCurrency(metrics.totalBudget) },
          { label: "ACTUAL SPEND", value: formatCurrency(metrics.totalActualSpend) },
          {
            label: "VARIANCE",
            value: formatCurrency(overallVariance),
            color: overallVariance >= 0 ? "text-emerald-500" : "text-red-500"
          },
        ]);

        setAccounts(metrics.budgetMetrics.map(item => ({
          name: item.category,
          budgeted: formatCurrency(item.budget),
          actual: formatCurrency(item.actual),
          variance: formatCurrency(item.variance),
          varianceColor: item.variance >= 0 ? 'text-emerald-500' : 'text-red-500',
          progress: Math.round(item.utilization),
          color: item.utilization > 100 ? "bg-red-500" : "bg-primary-300"
        })));
      } else {
        setAccounts([]);
      }
    } catch (err) {
      console.error("Error fetching budget data:", err);
    }
  }, [workbenchId]);

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-bold text-white mb-1">Budget vs Actual</h3>
        <p className="text-gray-500 text-xs mb-6">Real-time budget utilization & variance analysis</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {summary.map((s, i) => (
            <Card key={i} variant="dark" className="border-white/5 p-6 bg-[#0E1117]/80">
              <span className="text-[10px] font-bold text-gray-500 tracking-wider uppercase block mb-3">{s.label}</span>
              <div className={`text-2xl font-bold ${s.color || 'text-white'}`}>{s.value}</div>
            </Card>
          ))}
        </div>

        {/* Account Table */}
        <Card variant="dark" className="border-white/5 overflow-hidden bg-[#0E1117]/80">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 text-right">Budget Limit</th>
                  <th className="px-6 py-4 text-right">Actual Spend</th>
                  <th className="px-6 py-4 text-right">Variance</th>
                  <th className="px-6 py-4 min-w-[200px]">Utilization %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {accounts.length === 0 ? (
                    <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-xs text-gray-500">
                            No budgets defined. Create a budget to see metrics.
                        </td>
                    </tr>
                ) : (
                    accounts.map((acc, i) => (
                      <tr key={i} className="group hover:bg-white/5 transition-colors">
                        <td className="px-6 py-5 text-sm font-medium text-gray-300 group-hover:text-primary-300 transition-colors">{acc.name}</td>
                        <td className="px-6 py-5 text-sm text-right text-gray-500">{acc.budgeted}</td>
                        <td className="px-6 py-5 text-sm text-right text-white font-medium">{acc.actual}</td>
                        <td className={`px-6 py-5 text-sm text-right font-medium ${acc.varianceColor}`}>
                          {acc.variance}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${acc.color} rounded-full`}
                                style={{ width: `${Math.min(acc.progress, 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-bold text-gray-500 w-8">{acc.progress}%</span>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
