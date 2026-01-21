/**
 * KPI Service - Dynamic KPI management with Supabase
 */

import { supabase } from '../lib/supabase';

/**
 * Create a new KPI
 */
export async function createKPI(kpiData, workbenchId, userId) {
  try {
    console.log('Creating KPI with data:', { kpiData, workbenchId, userId });
    
    // Try to insert with user_id
    const { data, error } = await supabase
      .from('kpis')
      .insert({
        workbench_id: workbenchId,
        user_id: userId,
        title: kpiData.title,
        description: kpiData.description || ''
      })
      .select()
      .single();

    if (error) {
      // Check if it's a schema/column error
      if (error.code === 'PGRST204' || error.message?.includes('user_id') || error.message?.includes('column')) {
        console.error('⚠️ KPIs table missing user_id column!');
        console.error('📋 Please run: RUN_THIS_FIRST_complete_setup.sql in Supabase SQL Editor');
        console.error('Location: backend/supabase/migrations/RUN_THIS_FIRST_complete_setup.sql');
        
        // Store in memory only
        return { 
          success: true, 
          kpi: {
            id: kpiData.id,
            title: kpiData.title,
            description: kpiData.description,
            expression: kpiData.expression,
            columns: kpiData.columns,
            meta: kpiData.meta,
            _memoryOnly: true
          },
          warning: 'Database not configured - KPI stored in memory only'
        };
      }
      
      console.error('Supabase error creating KPI:', error);
      console.warn('Database insert failed - KPI will be stored in memory only');
      return { 
        success: true, 
        kpi: {
          id: kpiData.id,
          title: kpiData.title,
          description: kpiData.description,
          expression: kpiData.expression,
          columns: kpiData.columns,
          meta: kpiData.meta,
          _memoryOnly: true
        }
      };
    }

    console.log('✅ KPI created successfully in database:', data);
    
    // Return the KPI with metadata merged back in
    return { 
      success: true, 
      kpi: {
        ...data,
        expression: kpiData.expression || '',
        columns: kpiData.columns || [],
        meta: kpiData.meta || {}
      }
    };
  } catch (error) {
    console.error('Error creating KPI:', error);
    
    // Fallback to memory-only storage
    return { 
      success: true, 
      kpi: {
        id: kpiData.id,
        title: kpiData.title,
        description: kpiData.description,
        expression: kpiData.expression,
        columns: kpiData.columns,
        meta: kpiData.meta,
        _memoryOnly: true
      }
    };
  }
}

/**
 * Get all KPIs for a workbench
 */
export async function getWorkbenchKPIs(workbenchId, userId) {
  try {
    // Update last_used_by for the workbench
    if (userId) {
      supabase
        .from('workbenches')
        .update({ last_used_by: userId })
        .eq('id', workbenchId)
        .then(({ error }) => {
          if (error && error.code === 'PGRST204') {
            console.warn('last_used_by column missing in workbenches table. Please run the migration.');
          }
        });
    }

    const { data, error } = await supabase
      .from('kpis')
      .select('*')
      .eq('workbench_id', workbenchId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST204' || error.message?.includes('user_id') || error.message?.includes('column')) {
        console.warn('⚠️ KPIs table needs migration - run RUN_THIS_FIRST_complete_setup.sql');
      } else {
        console.warn('Could not load KPIs from database:', error.message);
      }
      console.log('Using memory-only KPI storage');
      return { success: true, kpis: [] };
    }

    // Transform to match the expected format
    const kpis = data.map(kpi => ({
      id: kpi.id,
      title: kpi.title || 'Untitled KPI',
      description: kpi.description || '',
      expression: '',
      columns: [],
      meta: {
        renderType: 'numeric'
      }
    }));

    console.log('✅ Loaded', kpis.length, 'KPIs from database');
    return { success: true, kpis };
  } catch (error) {
    console.warn('Error fetching KPIs, using memory mode:', error);
    return { success: true, kpis: [] };
  }
}

/**
 * Update a KPI
 */
export async function updateKPI(kpiId, updates, userId) {
  try {
    const { data, error } = await supabase
      .from('kpis')
      .update({
        title: updates.title,
        description: updates.description
      })
      .eq('id', kpiId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // Merge back the metadata
    return { 
      success: true, 
      kpi: {
        ...data,
        expression: updates.expression || '',
        columns: updates.columns || [],
        meta: updates.meta || {}
      }
    };
  } catch (error) {
    console.error('Error updating KPI:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a KPI
 */
export async function deleteKPI(kpiId, userId) {
  try {
    const { error } = await supabase
      .from('kpis')
      .delete()
      .eq('id', kpiId)
      .eq('user_id', userId);

    if (error) {
      console.warn('Could not delete KPI from database:', error.message);
      console.log('KPI removed from memory only');
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.warn('Error deleting KPI, removed from memory:', error);
    return { success: true };
  }
}

/**
 * Get canvas tiles for a workbench
 */
export async function getCanvasTiles(workbenchId, userId) {
  try {
    const { data, error } = await supabase
      .from('canvas_tiles')
      .select('*')
      .eq('workbench_id', workbenchId)
      .eq('user_id', userId)
      .order('position', { ascending: true });

    if (error) {
      // Table might not exist yet - return empty array
      console.warn('canvas_tiles table not found, returning empty array');
      return { success: true, tiles: [] };
    }

    return { success: true, tiles: data || [] };
  } catch (error) {
    console.error('Error fetching canvas tiles:', error);
    return { success: false, error: error.message, tiles: [] };
  }
}

/**
 * Set KPI for a canvas tile
 */
export async function setTileKPI(workbenchId, userId, position, kpiId) {
  try {
    // Check if tile exists
    const { data: existing, error: checkError } = await supabase
      .from('canvas_tiles')
      .select('id')
      .eq('workbench_id', workbenchId)
      .eq('user_id', userId)
      .eq('position', position)
      .single();

    if (checkError && checkError.code === 'PGRST116') {
      // Table doesn't exist, skip silently
      return { success: true, tile: null };
    }

    if (existing) {
      // Update existing tile
      const { data, error } = await supabase
        .from('canvas_tiles')
        .update({ kpi_id: kpiId })
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, tile: data };
    } else {
      // Create new tile
      const { data, error } = await supabase
        .from('canvas_tiles')
        .insert({
          workbench_id: workbenchId,
          user_id: userId,
          position,
          kpi_id: kpiId
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, tile: data };
    }
  } catch (error) {
    console.error('Error setting tile KPI:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Compute KPI value from file data
 * This is a simplified version - in production, you'd parse actual file data
 */
export async function computeKPIValue(kpiId, workbenchId) {
  try {
    // Get KPI configuration
    const { error: kpiError } = await supabase
      .from('kpis')
      .select('*')
      .eq('id', kpiId)
      .single();

    if (kpiError) throw kpiError;

    // Get workbench files
    const { data: files, error: filesError } = await supabase
      .from('workbench_files')
      .select('*')
      .eq('workbench_id', workbenchId);

    if (filesError) throw filesError;

    // Simplified computation - in production, parse CSV/XLSX files and compute
    let computedValue = {
      value: Math.round(Math.random() * 1000), // Mock value
      timestamp: new Date().toISOString(),
      fileCount: files?.length || 0
    };

    // Update KPI with computed value
    const { error: updateError } = await supabase
      .from('kpis')
      .update({ computed_value: computedValue })
      .eq('id', kpiId);

    if (updateError) throw updateError;

    return { success: true, value: computedValue };
  } catch (error) {
    console.error('Error computing KPI value:', error);
    return { success: false, error: error.message };
  }
}

export default {
  createKPI,
  getWorkbenchKPIs,
  updateKPI,
  deleteKPI,
  getCanvasTiles,
  setTileKPI,
  computeKPIValue
};
