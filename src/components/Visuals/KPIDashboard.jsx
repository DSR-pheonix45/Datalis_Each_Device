/**
 * KPIDashboard Component
 * 
 * Displays real KPI data computed from user's uploaded datasets.
 * Integrates with kpiQueryService for actual KPI computation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  getDatasetKPIs,
  formatKPIValue,
  getKPITrend,
  groupKPIsByCategory
} from '../../services/kpiQueryService';
import { toast } from 'react-hot-toast';
import {
  BsGraphUp, BsDroplet, BsLightning, BsRocketTakeoff, BsGear,
  BsArrowUp, BsArrowDown, BsDatabase, BsArrowRepeat, BsInfoCircle,
  BsExclamationTriangle, BsCheckCircle, BsBarChart
} from 'react-icons/bs';

// Category icons and colors
const CATEGORY_CONFIG = {
  profitability: { icon: BsGraphUp, color: '#10B981', bgColor: 'bg-emerald-500/10', label: 'Profitability' },
  liquidity: { icon: BsDroplet, color: '#3B82F6', bgColor: 'bg-blue-500/10', label: 'Liquidity' },
  leverage: { icon: BsLightning, color: '#F59E0B', bgColor: 'bg-amber-500/10', label: 'Leverage' },
  efficiency: { icon: BsGear, color: '#8B5CF6', bgColor: 'bg-purple-500/10', label: 'Efficiency' },
  growth: { icon: BsRocketTakeoff, color: '#EC4899', bgColor: 'bg-pink-500/10', label: 'Growth' },
  Other: { icon: BsBarChart, color: '#6B7280', bgColor: 'bg-gray-500/10', label: 'Other' }
};

// KPI Card Component
function KPICard({ kpi, isLoading }) {
  const categoryConfig = CATEGORY_CONFIG[kpi.category] || CATEGORY_CONFIG.Other;
  const formattedValue = formatKPIValue(kpi.value, kpi.unit);
  const IconComponent = categoryConfig.icon;

  // Get trend if we have previous value
  const trend = kpi.previousValue !== undefined
    ? getKPITrend(kpi.value, kpi.previousValue, kpi.higherIsBetter !== false)
    : null;

  return (
    <div className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:border-teal-500/40 transition-all duration-300 hover:shadow-md">
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-teal-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg ${categoryConfig.bgColor} flex items-center justify-center`}
              style={{ color: categoryConfig.color }}
            >
              <IconComponent className="text-lg" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm leading-tight">{kpi.name}</h3>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full mt-1 inline-block"
                style={{ backgroundColor: categoryConfig.color + '15', color: categoryConfig.color }}
              >
                {categoryConfig.label}
              </span>
            </div>
          </div>
        </div>

        {/* Value */}
        <div className="mb-4">
          {isLoading ? (
            <div className="h-10 bg-gray-800/50 rounded-lg animate-pulse" />
          ) : (
            <div className="flex items-end gap-3">
              <span className="text-3xl font-bold text-white tracking-tight">{formattedValue}</span>
              {trend && (
                <div className={`flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-md ${trend.isGood
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : 'bg-red-500/10 text-red-400'
                  }`}>
                  {trend.direction === 'up' ? <BsArrowUp /> : <BsArrowDown />}
                  <span>{trend.percentage}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{kpi.description}</p>

        {/* Formula hint */}
        {kpi.formula && (
          <div className="mt-4 pt-3 border-t border-gray-800/60">
            <span className="text-gray-600 text-[10px] font-mono bg-gray-900/50 px-2 py-1 rounded">{kpi.formula}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Empty State Component
function EmptyState({ onSelectDataset }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
      <div className="relative mb-6">
        {/* Removed excessive blur effect */}
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/20 flex items-center justify-center">
          <BsBarChart className="text-3xl text-teal-400" />
        </div>
      </div>
      <h2 className="text-xl font-bold text-white mb-2">No KPIs to Display</h2>
      <p className="text-gray-500 max-w-md mb-6 text-sm">
        Upload a CSV file to your workbench and map its columns to compute financial KPIs automatically.
      </p>
      <button
        onClick={onSelectDataset}
        className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold rounded-xl hover:from-teal-400 hover:to-cyan-500 transition-all shadow-md"
      >
        Select Dataset
      </button>
    </div>
  );
}

// Dataset Selector Component
function DatasetSelector({ datasets, selectedId, onSelect, isLoading }) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-gray-500 text-sm flex items-center gap-2">
        <BsDatabase className="text-teal-400" />
        Dataset:
      </label>
      <select
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value)}
        disabled={isLoading}
        className="bg-white/5 border border-white/10 text-white rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/10 transition-all cursor-pointer hover:border-white/20"
      >
        <option value="">Select a dataset</option>
        {datasets.map(d => (
          <option key={d.id} value={d.id}>
            {d.original_filename} ({new Date(d.created_at).toLocaleDateString()})
          </option>
        ))}
      </select>
      {isLoading && (
        <div className="w-5 h-5 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
      )}
    </div>
  );
}

// Main KPIDashboard Component
export default function KPIDashboard() {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [kpiResults, setKpiResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user datasets
  useEffect(() => {
    if (!user) return;

    const fetchDatasets = async () => {
      try {
        const { data, error } = await supabase
          .from('user_datasets')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setDatasets(data || []);

        // Auto-select first dataset if available
        if (data && data.length > 0 && !selectedDatasetId) {
          setSelectedDatasetId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching datasets:', err);
        toast.error('Failed to load datasets');
      }
    };

    fetchDatasets();
  }, [user, selectedDatasetId]);

  // Compute KPIs when dataset changes
  useEffect(() => {
    if (!selectedDatasetId) {
      setKpiResults([]);
      return;
    }

    const computeKPIs = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await getDatasetKPIs(selectedDatasetId);

        if (result.success) {
          setKpiResults(result.kpis || []);

          if (result.message) {
            toast(result.message, { icon: 'ℹ️' });
          }
        } else {
          setError(result.error);
          toast.error(result.error || 'Failed to compute KPIs');
        }
      } catch (err) {
        console.error('Error computing KPIs:', err);
        setError(err.message);
        toast.error('Failed to compute KPIs');
      } finally {
        setIsLoading(false);
      }
    };

    computeKPIs();
  }, [selectedDatasetId]);

  // Group KPIs by category
  const groupedKPIs = useMemo(() => {
    if (!kpiResults || kpiResults.length === 0) return {};
    return groupKPIsByCategory(kpiResults);
  }, [kpiResults]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      total: kpiResults.length,
      positive: kpiResults.filter(k => k.previousValue && k.value > k.previousValue).length,
      negative: kpiResults.filter(k => k.previousValue && k.value < k.previousValue).length,
      categories: Object.keys(groupedKPIs).length
    };
  }, [kpiResults, groupedKPIs]);

  // Render categories
  const renderCategories = () => {
    const categories = Object.entries(groupedKPIs);

    if (categories.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-xl bg-gray-800/50 flex items-center justify-center mx-auto mb-4">
            <BsInfoCircle className="text-2xl text-gray-600" />
          </div>
          <p className="text-gray-500 mb-2">No KPIs could be computed with the current column mapping.</p>
          <p className="text-gray-600 text-sm">Try mapping more columns to enable additional KPIs.</p>
        </div>
      );
    }

    return categories.map(([category, kpis]) => {
      const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.Other;
      const IconComponent = config.icon;

      return (
        <div key={category} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center`}
              style={{ color: config.color }}
            >
              <IconComponent className="text-sm" />
            </div>
            <h2 className="text-lg font-semibold text-white">{config.label}</h2>
            <span className="text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded-full">
              {kpis.length} KPIs
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {kpis.map(kpi => (
              <KPICard key={kpi.id} kpi={kpi} isLoading={isLoading} />
            ))}
          </div>
        </div>
      );
    });
  };

  // Handle dataset selection from empty state
  const handleSelectDataset = () => {
    toast('Please upload a CSV file to your workbench first.', { icon: '📁' });
  };

  return (
    <div className="h-full bg-[#0a0a0a] overflow-auto font-dm-sans">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-xl blur-lg opacity-60" />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-md">
                <BsBarChart className="text-white text-lg" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                KPI Dashboard
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-teal-500/10 text-teal-400 rounded-full border border-teal-500/20">
                  Live
                </span>
              </h1>
              <p className="text-gray-500 text-sm">
                Computed financial metrics from your data
              </p>
            </div>
          </div>

          {datasets.length > 0 && (
            <DatasetSelector
              datasets={datasets}
              selectedId={selectedDatasetId}
              onSelect={setSelectedDatasetId}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Stats Bar */}
        {kpiResults.length > 0 && (
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-800/40">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{stats.total}</span>
              <span className="text-gray-500 text-sm">Total KPIs</span>
            </div>
            <div className="w-px h-6 bg-gray-800" />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-emerald-400">
                <BsArrowUp className="text-sm" />
                <span className="font-semibold">{stats.positive}</span>
              </div>
              <span className="text-gray-500 text-sm">Trending Up</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-red-400">
                <BsArrowDown className="text-sm" />
                <span className="font-semibold">{stats.negative}</span>
              </div>
              <span className="text-gray-500 text-sm">Trending Down</span>
            </div>
            <div className="w-px h-6 bg-gray-800" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{stats.categories}</span>
              <span className="text-gray-500 text-sm">Categories</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
            <BsExclamationTriangle className="text-red-400" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {datasets.length === 0 ? (
          <EmptyState onSelectDataset={handleSelectDataset} />
        ) : (
          renderCategories()
        )}
      </div>

      {/* Summary Footer */}
      {kpiResults.length > 0 && (
        <div className="sticky bottom-0 bg-[#0E1117]/95 backdrop-blur-xl border-t border-gray-800/60 px-6 py-3">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-500 flex items-center gap-2">
              <BsCheckCircle className="text-teal-400" />
              Showing <span className="text-white font-semibold">{kpiResults.length}</span> KPIs
              from <span className="text-white font-semibold">
                {datasets.find(d => d.id === selectedDatasetId)?.original_filename || 'selected dataset'}
              </span>
            </div>
            <button
              onClick={() => setSelectedDatasetId(selectedDatasetId)}
              className="text-teal-400 hover:text-teal-300 transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-teal-500/10"
            >
              <BsArrowRepeat className="text-sm" />
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
