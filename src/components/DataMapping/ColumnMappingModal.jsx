/**
 * Column Mapping Modal
 * 
 * Allows users to map their CSV columns to standard financial fields.
 * This mapping is crucial for KPI calculation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  STANDARD_FIELDS, 
  getFieldsByCategory, 
  autoDetectFieldMapping
} from '../../data/standardFinancialFields';

// Icons from lucide-react
import { X, Check, AlertTriangle, Wand2, Save, RefreshCw } from 'lucide-react';

/**
 * Individual mapping row component
 */
const MappingRow = ({ 
  csvColumn, 
  selectedField, 
  onFieldChange, 
  suggestedField,
  fieldsByCategory 
}) => {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-[#1F242C] last:border-0">
      {/* CSV Column Name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium truncate">{csvColumn.originalName}</span>
          <span className="text-xs text-[#9BA3AF] bg-[#1F242C] px-2 py-0.5 rounded">
            {csvColumn.type}
          </span>
        </div>
        {csvColumn.sampleValues && csvColumn.sampleValues.length > 0 && (
          <div className="text-xs text-[#6B7280] mt-1 truncate">
            Sample: {csvColumn.sampleValues.slice(0, 2).join(', ')}
          </div>
        )}
      </div>
      
      {/* Arrow */}
      <div className="text-[#9BA3AF]">→</div>
      
      {/* Field Selector */}
      <div className="flex-1 relative">
        <select
          value={selectedField || ''}
          onChange={(e) => onFieldChange(csvColumn.name, e.target.value || null)}
          className="w-full bg-[#161B22] border border-[#1F242C] rounded-lg px-3 py-2 text-white appearance-none cursor-pointer hover:border-[#00C6C2] focus:border-[#00C6C2] focus:outline-none"
        >
          <option value="">-- Skip this column --</option>
          {Object.entries(fieldsByCategory).map(([category, fields]) => (
            <optgroup key={category} label={category}>
              {fields.map(field => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        
        {/* Auto-detected indicator */}
        {suggestedField && !selectedField && (
          <button
            onClick={() => onFieldChange(csvColumn.name, suggestedField)}
            className="absolute right-10 top-1/2 -translate-y-1/2 text-xs text-[#00C6C2] hover:text-[#00B5B1] flex items-center gap-1"
            title={`Suggested: ${STANDARD_FIELDS[suggestedField]?.label}`}
          >
            <Wand2 className="w-3 h-3" />
            Auto
          </button>
        )}
      </div>
      
      {/* Status indicator */}
      <div className="w-6">
        {selectedField && (
          <Check className="w-5 h-5 text-green-500" />
        )}
      </div>
    </div>
  );
};

/**
 * Main Column Mapping Modal
 */
const ColumnMappingModal = ({
  isOpen,
  onClose,
  dataset,
  onSaveMapping,
  existingMapping = null,
}) => {
  // State for current mapping
  const [mapping, setMapping] = useState({});
  const [mappingName, setMappingName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Get fields grouped by category
  const fieldsByCategory = useMemo(() => getFieldsByCategory(), []);
  
  // Auto-detect suggestions for each column
  const suggestions = useMemo(() => {
    if (!dataset?.columns) return {};
    
    const detected = {};
    dataset.columns.forEach(col => {
      const suggested = autoDetectFieldMapping(col.originalName);
      if (suggested) {
        detected[col.name] = suggested;
      }
    });
    return detected;
  }, [dataset?.columns]);
  
  // Initialize mapping from existing or auto-detect
  useEffect(() => {
    if (existingMapping) {
      setMapping(existingMapping.mapping || {});
      setMappingName(existingMapping.mapping_name || '');
    } else {
      // Start with empty mapping, user can apply suggestions
      setMapping({});
      setMappingName(`Mapping for ${dataset?.original_filename || 'file'}`);
    }
  }, [existingMapping, dataset]);
  
  // Handle field change
  const handleFieldChange = (csvColumn, standardField) => {
    setMapping(prev => {
      const newMapping = { ...prev };
      
      // Remove the column from any existing mapping
      Object.keys(newMapping).forEach(key => {
        if (newMapping[key] === csvColumn) {
          delete newMapping[key];
        }
      });
      
      // Add new mapping if a field was selected
      if (standardField) {
        // Create inverted mapping (standardField -> csvColumn)
        // We store as { revenue: "sales_usd", net_income: "profit" }
        newMapping[standardField] = csvColumn;
      }
      
      return newMapping;
    });
  };
  
  // Get the standard field mapped to a CSV column
  const getFieldForColumn = (csvColumnName) => {
    return Object.keys(mapping).find(field => mapping[field] === csvColumnName);
  };
  
  // Apply all auto-detected suggestions
  const applyAllSuggestions = () => {
    const newMapping = { ...mapping };
    Object.entries(suggestions).forEach(([csvCol, suggestedField]) => {
      if (!Object.values(newMapping).includes(csvCol)) {
        newMapping[suggestedField] = csvCol;
      }
    });
    setMapping(newMapping);
  };
  
  // Clear all mappings
  const clearAllMappings = () => {
    setMapping({});
  };
  
  // Validate current mapping
  const validation = useMemo(() => {
    // Check which KPIs can be computed with current mapping
    const mappedFields = Object.keys(mapping);
    
    // Count mapped vs total columns
    const mappedCount = mappedFields.length;
    const totalColumns = dataset?.columns?.length || 0;
    
    return {
      mappedCount,
      totalColumns,
      percentage: totalColumns > 0 ? Math.round((mappedCount / totalColumns) * 100) : 0,
      hasMinimumMapping: mappedFields.some(f => ['revenue', 'net_income', 'cogs'].includes(f)),
    };
  }, [mapping, dataset?.columns]);
  
  // Save mapping
  const handleSave = async () => {
    if (Object.keys(mapping).length === 0) {
      setError('Please map at least one column before saving.');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      await onSaveMapping({
        dataset_id: dataset.id,
        mapping: mapping,
        mapping_name: mappingName || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save mapping');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#0E1117] border border-[#1F242C] rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F242C]">
          <div>
            <h2 className="text-xl font-semibold text-white">Map Columns</h2>
            <p className="text-sm text-[#9BA3AF] mt-1">
              Map your CSV columns to standard financial fields for KPI calculation
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#9BA3AF] hover:text-white p-2 rounded-lg hover:bg-[#1F242C]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* File info bar */}
        <div className="px-6 py-3 bg-[#161B22] border-b border-[#1F242C] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-white font-medium">{dataset?.original_filename}</span>
            <span className="text-sm text-[#9BA3AF]">
              {dataset?.columns?.length || 0} columns • {dataset?.row_count || 0} rows
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={applyAllSuggestions}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-[#00C6C2]/10 text-[#00C6C2] rounded-lg hover:bg-[#00C6C2]/20"
            >
              <Wand2 className="w-4 h-4" />
              Auto-detect All
            </button>
            <button
              onClick={clearAllMappings}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#9BA3AF] hover:text-white rounded-lg hover:bg-[#1F242C]"
            >
              <RefreshCw className="w-4 h-4" />
              Clear
            </button>
          </div>
        </div>
        
        {/* Mapping name input */}
        <div className="px-6 py-3 border-b border-[#1F242C]">
          <input
            type="text"
            value={mappingName}
            onChange={(e) => setMappingName(e.target.value)}
            placeholder="Mapping name (optional)"
            className="w-full bg-[#161B22] border border-[#1F242C] rounded-lg px-3 py-2 text-white placeholder:text-[#6B7280] focus:border-[#00C6C2] focus:outline-none"
          />
        </div>
        
        {/* Column mappings */}
        <div className="px-6 py-4 max-h-[400px] overflow-y-auto">
          {dataset?.columns?.map(column => (
            <MappingRow
              key={column.name}
              csvColumn={column}
              selectedField={getFieldForColumn(column.name)}
              onFieldChange={handleFieldChange}
              suggestedField={suggestions[column.name]}
              fieldsByCategory={fieldsByCategory}
            />
          ))}
          
          {(!dataset?.columns || dataset.columns.length === 0) && (
            <div className="text-center py-8 text-[#9BA3AF]">
              No columns found in this dataset
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="px-6 py-3 border-t border-[#1F242C] bg-[#161B22]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#9BA3AF]">Mapping Progress</span>
            <span className="text-sm text-white font-medium">
              {validation.mappedCount} of {validation.totalColumns} columns mapped
            </span>
          </div>
          <div className="h-2 bg-[#1F242C] rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#00C6C2] transition-all duration-300"
              style={{ width: `${validation.percentage}%` }}
            />
          </div>
        </div>
        
        {/* Error message */}
        {error && (
          <div className="px-6 py-3 bg-red-900/20 border-t border-red-900/50">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1F242C]">
          <div className="text-sm text-[#9BA3AF]">
            {validation.hasMinimumMapping ? (
              <span className="flex items-center gap-1 text-green-400">
                <Check className="w-4 h-4" />
                Ready to compute KPIs
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-400">
                <AlertTriangle className="w-4 h-4" />
                Map at least Revenue, Net Income, or COGS
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#9BA3AF] hover:text-white rounded-lg hover:bg-[#1F242C]"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || Object.keys(mapping).length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-[#00C6C2] text-[#0E1117] font-medium rounded-lg hover:bg-[#00B5B1] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Mapping
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColumnMappingModal;
