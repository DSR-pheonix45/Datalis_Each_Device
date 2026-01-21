/**
 * KPI Query Service
 * 
 * Handles fetching KPI templates and executing KPI queries
 * against user datasets through the Edge Function.
 */

import { supabase } from '../lib/supabase';
import { formatKPIValue as formatValue, formatNumber, formatIndianNumber } from '../utils/numberFormatter';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Fetch all available KPI templates
 */
export async function getKPITemplates() {
  try {
    const { data, error } = await supabase
      .from('kpi_templates')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    
    if (error) throw error;
    
    return {
      success: true,
      templates: data || [],
    };
    
  } catch (error) {
    console.error('Error fetching KPI templates:', error);
    return {
      success: false,
      templates: [],
      error: error.message,
    };
  }
}

/**
 * Get available KPIs for a specific mapping
 * Returns which KPIs can be computed based on mapped fields
 */
export async function getAvailableKPIsForMapping(mapping) {
  try {
    const { data, error } = await supabase
      .rpc('get_available_kpis', { p_mapping: mapping });
    
    if (error) throw error;
    
    return {
      success: true,
      kpis: data || [],
    };
    
  } catch (error) {
    console.error('Error fetching available KPIs:', error);
    // Fallback to client-side filtering
    return getAvailableKPIsClientSide(mapping);
  }
}

/**
 * Client-side fallback for getting available KPIs
 */
async function getAvailableKPIsClientSide(mapping) {
  try {
    const { templates } = await getKPITemplates();
    const mappedFields = Object.keys(mapping);
    
    const kpis = templates.map(template => ({
      ...template,
      can_compute: template.required_fields.every(field => mappedFields.includes(field)),
    }));
    
    return {
      success: true,
      kpis,
    };
    
  } catch (error) {
    console.error('Error in client-side KPI check:', error);
    return {
      success: false,
      kpis: [],
      error: error.message,
    };
  }
}

/**
 * Compute a single KPI
 * 
 * @param {string} kpiId - The KPI template ID
 * @param {string} datasetId - The dataset to query
 * @param {object} mapping - Column mapping (standard_field -> user's column)
 * @param {object} filters - Optional date/custom filters
 * @returns {Promise<{success: boolean, kpi?: object, error?: string}>}
 */
export async function computeKPI(kpiId, datasetId, mapping, filters = {}) {
  try {
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('You must be logged in to compute KPIs');
    }
    
    // Call the KPI query edge function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/kpi-query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kpi_id: kpiId,
        dataset_id: datasetId,
        mapping: mapping,
        filters: filters,
      }),
    });
    
    const result = await response.json();
    
    if (!response.ok || !result.success) {
      throw new Error(result.error || 'Failed to compute KPI');
    }
    
    return {
      success: true,
      kpi: result.kpi,
    };
    
  } catch (error) {
    console.error('KPI computation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to compute KPI',
    };
  }
}

/**
 * Compute multiple KPIs in batch
 * 
 * @param {string[]} kpiIds - Array of KPI template IDs
 * @param {string} datasetId - The dataset to query
 * @param {object} mapping - Column mapping
 * @param {object} filters - Optional filters
 * @returns {Promise<{success: boolean, kpis?: object[], errors?: string[]}>}
 */
export async function computeMultipleKPIs(kpiIds, datasetId, mapping, filters = {}) {
  const results = [];
  const errors = [];
  
  // Process KPIs in parallel (with concurrency limit)
  const BATCH_SIZE = 5;
  
  for (let i = 0; i < kpiIds.length; i += BATCH_SIZE) {
    const batch = kpiIds.slice(i, i + BATCH_SIZE);
    
    const batchResults = await Promise.all(
      batch.map(kpiId => computeKPI(kpiId, datasetId, mapping, filters))
    );
    
    batchResults.forEach((result, idx) => {
      if (result.success) {
        results.push(result.kpi);
      } else {
        errors.push(`${batch[idx]}: ${result.error}`);
      }
    });
  }
  
  return {
    success: errors.length === 0,
    kpis: results,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Get all computable KPIs for a dataset
 * Automatically fetches mapping and computes available KPIs
 */
export async function getDatasetKPIs(datasetId, filters = {}) {
  try {
    // 1. Get dataset info
    const { data: dataset, error: datasetError } = await supabase
      .from('user_datasets')
      .select('*')
      .eq('id', datasetId)
      .single();
    
    if (datasetError) throw datasetError;
    
    // 2. Get column mapping
    const { data: mappingData, error: mappingError } = await supabase
      .from('column_mappings')
      .select('*')
      .eq('dataset_id', datasetId)
      .eq('is_default', true)
      .single();
    
    if (mappingError && mappingError.code !== 'PGRST116') {
      throw mappingError;
    }
    
    if (!mappingData) {
      return {
        success: false,
        error: 'No column mapping found for this dataset. Please map your columns first.',
      };
    }
    
    // 3. Get available KPIs
    const { kpis: availableKPIs } = await getAvailableKPIsForMapping(mappingData.mapping);
    
    // 4. Filter to only computable KPIs
    const computableKPIs = availableKPIs.filter(kpi => kpi.can_compute);
    
    if (computableKPIs.length === 0) {
      return {
        success: true,
        kpis: [],
        message: 'No KPIs can be computed with the current mapping. Please map more columns.',
      };
    }
    
    // 5. Compute all available KPIs
    const kpiIds = computableKPIs.map(kpi => kpi.id);
    const results = await computeMultipleKPIs(kpiIds, datasetId, mappingData.mapping, filters);
    
    return {
      success: true,
      dataset: dataset,
      mapping: mappingData,
      kpis: results.kpis,
      errors: results.errors,
    };
    
  } catch (error) {
    console.error('Error getting dataset KPIs:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Format KPI value for display
 * Uses smart formatting for large numbers (Lakhs, Crores, etc.)
 */
export function formatKPIValue(value, unit, decimals = 2) {
  if (value === null || value === undefined) return 'N/A';
  
  // Use the new smart formatter
  return formatValue(value, unit, { 
    system: 'indian', 
    decimals,
    forceCompact: null // Auto-detect based on value size
  });
}

/**
 * Get KPI trend indicator
 */
export function getKPITrend(currentValue, previousValue, higherIsBetter = true) {
  if (previousValue === null || previousValue === undefined || previousValue === 0) {
    return { direction: 'neutral', percentage: 0 };
  }
  
  const change = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  const isPositive = change > 0;
  const isGood = higherIsBetter ? isPositive : !isPositive;
  
  return {
    direction: isPositive ? 'up' : 'down',
    percentage: Math.abs(change).toFixed(1),
    isGood,
  };
}

/**
 * Group KPIs by category
 */
export function groupKPIsByCategory(kpis) {
  const grouped = {};
  
  kpis.forEach(kpi => {
    const category = kpi.category || 'Other';
    if (!grouped[category]) {
      grouped[category] = [];
    }
    grouped[category].push(kpi);
  });
  
  // Sort categories by predefined order
  const categoryOrder = ['profitability', 'liquidity', 'leverage', 'efficiency', 'growth', 'Other'];
  const sortedGrouped = {};
  
  categoryOrder.forEach(cat => {
    if (grouped[cat]) {
      sortedGrouped[cat] = grouped[cat];
    }
  });
  
  return sortedGrouped;
}

export default {
  getKPITemplates,
  getAvailableKPIsForMapping,
  computeKPI,
  computeMultipleKPIs,
  getDatasetKPIs,
  formatKPIValue,
  getKPITrend,
  groupKPIsByCategory,
};
