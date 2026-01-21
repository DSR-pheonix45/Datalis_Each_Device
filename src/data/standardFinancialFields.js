/**
 * Standard Financial Fields for KPI Mapping
 * 
 * This file defines all standard financial fields that users can map
 * their CSV columns to. These field IDs are used in KPI SQL templates.
 */

// Field categories
export const FIELD_CATEGORIES = {
  INCOME_STATEMENT: 'Income Statement',
  BALANCE_SHEET: 'Balance Sheet',
  CASH_FLOW: 'Cash Flow',
  DIMENSIONS: 'Dimensions & Filters',
};

/**
 * Standard Financial Fields
 * 
 * Each field has:
 * - id: Used in SQL templates as {{id}}
 * - label: Display name for UI
 * - category: Grouping for UI
 * - description: Tooltip/help text
 * - dataType: Expected data type ('numeric', 'text', 'date')
 * - aliases: Common column names that might match this field
 */
export const STANDARD_FIELDS = {
  // ===========================================
  // INCOME STATEMENT FIELDS
  // ===========================================
  
  revenue: {
    id: 'revenue',
    label: 'Revenue / Sales',
    category: FIELD_CATEGORIES.INCOME_STATEMENT,
    description: 'Total revenue or sales income',
    dataType: 'numeric',
    aliases: [
      'revenue', 'sales', 'total_revenue', 'total_sales', 'net_sales',
      'gross_revenue', 'income', 'turnover', 'sales_revenue',
      'revenue_usd', 'sales_usd', 'sales_amount', 'revenue_amount'
    ],
  },
  
  cogs: {
    id: 'cogs',
    label: 'Cost of Goods Sold (COGS)',
    category: FIELD_CATEGORIES.INCOME_STATEMENT,
    description: 'Direct costs of producing goods/services sold',
    dataType: 'numeric',
    aliases: [
      'cogs', 'cost_of_goods_sold', 'cost_of_sales', 'cos',
      'direct_costs', 'cost_of_revenue', 'production_cost',
      'cost_of_goods', 'materials_cost'
    ],
  },
  
  gross_profit: {
    id: 'gross_profit',
    label: 'Gross Profit',
    category: FIELD_CATEGORIES.INCOME_STATEMENT,
    description: 'Revenue minus cost of goods sold',
    dataType: 'numeric',
    aliases: [
      'gross_profit', 'gross_income', 'gross_margin_amount',
      'gross_earnings', 'trading_profit'
    ],
  },
  
  operating_expenses: {
    id: 'operating_expenses',
    label: 'Operating Expenses',
    category: FIELD_CATEGORIES.INCOME_STATEMENT,
    description: 'Expenses from normal business operations (SG&A, R&D, etc.)',
    dataType: 'numeric',
    aliases: [
      'operating_expenses', 'opex', 'operating_costs', 'overhead',
      'sga', 'sg_and_a', 'admin_expenses', 'selling_expenses',
      'general_administrative', 'operating_expense'
    ],
  },
  
  operating_income: {
    id: 'operating_income',
    label: 'Operating Income / EBIT',
    category: FIELD_CATEGORIES.INCOME_STATEMENT,
    description: 'Earnings before interest and taxes',
    dataType: 'numeric',
    aliases: [
      'operating_income', 'operating_profit', 'ebit',
      'earnings_before_interest_tax', 'operating_earnings',
      'income_from_operations', 'ebitda' // Note: EBITDA is different but often mapped here
    ],
  },
  
  interest_expense: {
    id: 'interest_expense',
    label: 'Interest Expense',
    category: FIELD_CATEGORIES.INCOME_STATEMENT,
    description: 'Cost of borrowed funds',
    dataType: 'numeric',
    aliases: [
      'interest_expense', 'interest_cost', 'finance_cost',
      'interest_paid', 'borrowing_cost', 'debt_interest'
    ],
  },
  
  tax_expense: {
    id: 'tax_expense',
    label: 'Tax Expense',
    category: FIELD_CATEGORIES.INCOME_STATEMENT,
    description: 'Income tax expense',
    dataType: 'numeric',
    aliases: [
      'tax_expense', 'income_tax', 'taxes', 'tax_provision',
      'tax_paid', 'corporate_tax', 'tax_amount'
    ],
  },
  
  net_income: {
    id: 'net_income',
    label: 'Net Income / Net Profit',
    category: FIELD_CATEGORIES.INCOME_STATEMENT,
    description: 'Bottom line profit after all expenses',
    dataType: 'numeric',
    aliases: [
      'net_income', 'net_profit', 'net_earnings', 'profit',
      'bottom_line', 'earnings', 'profit_after_tax', 'pat',
      'net_profit_loss', 'income_net', 'total_profit'
    ],
  },

  // ===========================================
  // BALANCE SHEET FIELDS - ASSETS
  // ===========================================
  
  total_assets: {
    id: 'total_assets',
    label: 'Total Assets',
    category: FIELD_CATEGORIES.BALANCE_SHEET,
    description: 'Sum of all assets owned',
    dataType: 'numeric',
    aliases: [
      'total_assets', 'assets', 'total_asset', 'asset_total',
      'assets_total', 'sum_assets'
    ],
  },
  
  current_assets: {
    id: 'current_assets',
    label: 'Current Assets',
    category: FIELD_CATEGORIES.BALANCE_SHEET,
    description: 'Assets expected to be converted to cash within a year',
    dataType: 'numeric',
    aliases: [
      'current_assets', 'short_term_assets', 'liquid_assets',
      'working_capital_assets', 'ca'
    ],
  },
  
  cash: {
    id: 'cash',
    label: 'Cash & Cash Equivalents',
    category: FIELD_CATEGORIES.BALANCE_SHEET,
    description: 'Cash and short-term liquid investments',
    dataType: 'numeric',
    aliases: [
      'cash', 'cash_equivalents', 'cash_and_equivalents',
      'cash_balance', 'liquid_cash', 'bank_balance', 'cce'
    ],
  },
  
  accounts_receivable: {
    id: 'accounts_receivable',
    label: 'Accounts Receivable',
    category: FIELD_CATEGORIES.BALANCE_SHEET,
    description: 'Money owed by customers',
    dataType: 'numeric',
    aliases: [
      'accounts_receivable', 'receivables', 'ar', 'trade_receivables',
      'debtors', 'customer_receivables', 'receivable'
    ],
  },
  
  inventory: {
    id: 'inventory',
    label: 'Inventory',
    category: FIELD_CATEGORIES.BALANCE_SHEET,
    description: 'Value of goods held for sale',
    dataType: 'numeric',
    aliases: [
      'inventory', 'inventories', 'stock', 'goods_inventory',
      'merchandise', 'finished_goods', 'raw_materials'
    ],
  },
  
  fixed_assets: {
    id: 'fixed_assets',
    label: 'Fixed Assets / PPE',
    category: FIELD_CATEGORIES.BALANCE_SHEET,
    description: 'Property, plant, and equipment',
    dataType: 'numeric',
    aliases: [
      'fixed_assets', 'ppe', 'property_plant_equipment',
      'tangible_assets', 'non_current_assets', 'long_term_assets',
      'capital_assets', 'plant_equipment'
    ],
  },

  // ===========================================
  // BALANCE SHEET FIELDS - LIABILITIES
  // ===========================================
  
  total_liabilities: {
    id: 'total_liabilities',
    label: 'Total Liabilities',
    category: FIELD_CATEGORIES.BALANCE_SHEET,
    description: 'Sum of all amounts owed',
    dataType: 'numeric',
    aliases: [
      'total_liabilities', 'liabilities', 'total_liability',
      'liabilities_total', 'sum_liabilities', 'total_debt_liabilities'
    ],
  },
  
  current_liabilities: {
    id: 'current_liabilities',
    label: 'Current Liabilities',
    category: FIELD_CATEGORIES.BALANCE_SHEET,
    description: 'Obligations due within a year',
    dataType: 'numeric',
    aliases: [
      'current_liabilities', 'short_term_liabilities', 'cl',
      'current_debts', 'short_term_debt'
    ],
  },
  
  accounts_payable: {
    id: 'accounts_payable',
    label: 'Accounts Payable',
    category: FIELD_CATEGORIES.BALANCE_SHEET,
    description: 'Money owed to suppliers',
    dataType: 'numeric',
    aliases: [
      'accounts_payable', 'payables', 'ap', 'trade_payables',
      'creditors', 'supplier_payables', 'payable'
    ],
  },
  
  total_debt: {
    id: 'total_debt',
    label: 'Total Debt',
    category: FIELD_CATEGORIES.BALANCE_SHEET,
    description: 'All interest-bearing debt (short + long term)',
    dataType: 'numeric',
    aliases: [
      'total_debt', 'debt', 'borrowings', 'loans',
      'debt_total', 'total_borrowings', 'bank_debt',
      'long_term_debt', 'short_term_debt'
    ],
  },
  
  equity: {
    id: 'equity',
    label: 'Shareholders Equity',
    category: FIELD_CATEGORIES.BALANCE_SHEET,
    description: 'Total equity owned by shareholders',
    dataType: 'numeric',
    aliases: [
      'equity', 'shareholders_equity', 'stockholders_equity',
      'total_equity', 'net_worth', 'book_value', 'owners_equity',
      'share_capital', 'net_assets'
    ],
  },

  // ===========================================
  // CASH FLOW FIELDS
  // ===========================================
  
  operating_cash_flow: {
    id: 'operating_cash_flow',
    label: 'Operating Cash Flow',
    category: FIELD_CATEGORIES.CASH_FLOW,
    description: 'Cash generated from core business operations',
    dataType: 'numeric',
    aliases: [
      'operating_cash_flow', 'ocf', 'cash_from_operations',
      'cfo', 'operating_cf', 'cash_flow_operations'
    ],
  },
  
  capital_expenditure: {
    id: 'capital_expenditure',
    label: 'Capital Expenditure (CapEx)',
    category: FIELD_CATEGORIES.CASH_FLOW,
    description: 'Spending on fixed assets',
    dataType: 'numeric',
    aliases: [
      'capex', 'capital_expenditure', 'capital_spending',
      'fixed_asset_purchases', 'ppe_purchases', 'investments_ppe'
    ],
  },
  
  free_cash_flow: {
    id: 'free_cash_flow',
    label: 'Free Cash Flow',
    category: FIELD_CATEGORIES.CASH_FLOW,
    description: 'Operating cash flow minus capital expenditures',
    dataType: 'numeric',
    aliases: [
      'free_cash_flow', 'fcf', 'cash_flow_free',
      'available_cash_flow', 'discretionary_cash_flow'
    ],
  },

  // ===========================================
  // DIMENSION FIELDS (for filtering)
  // ===========================================
  
  date: {
    id: 'date',
    label: 'Date',
    category: FIELD_CATEGORIES.DIMENSIONS,
    description: 'Transaction or period date',
    dataType: 'date',
    aliases: [
      'date', 'transaction_date', 'period_date', 'report_date',
      'posting_date', 'accounting_date', 'entry_date', 'created_at',
      'period', 'as_of_date'
    ],
  },
  
  quarter: {
    id: 'quarter',
    label: 'Quarter',
    category: FIELD_CATEGORIES.DIMENSIONS,
    description: 'Fiscal quarter (Q1, Q2, Q3, Q4)',
    dataType: 'text',
    aliases: [
      'quarter', 'fiscal_quarter', 'qtr', 'q', 'period_quarter'
    ],
  },
  
  year: {
    id: 'year',
    label: 'Year',
    category: FIELD_CATEGORIES.DIMENSIONS,
    description: 'Fiscal or calendar year',
    dataType: 'text',
    aliases: [
      'year', 'fiscal_year', 'fy', 'calendar_year', 'period_year', 'yr'
    ],
  },
  
  month: {
    id: 'month',
    label: 'Month',
    category: FIELD_CATEGORIES.DIMENSIONS,
    description: 'Month of the period',
    dataType: 'text',
    aliases: [
      'month', 'period_month', 'mo', 'month_name', 'month_num'
    ],
  },
  
  department: {
    id: 'department',
    label: 'Department',
    category: FIELD_CATEGORIES.DIMENSIONS,
    description: 'Business unit or department',
    dataType: 'text',
    aliases: [
      'department', 'dept', 'division', 'business_unit', 'bu',
      'cost_center', 'segment', 'unit'
    ],
  },
  
  region: {
    id: 'region',
    label: 'Region / Geography',
    category: FIELD_CATEGORIES.DIMENSIONS,
    description: 'Geographic region or location',
    dataType: 'text',
    aliases: [
      'region', 'geography', 'country', 'location', 'territory',
      'market', 'area', 'geo', 'zone'
    ],
  },
  
  product: {
    id: 'product',
    label: 'Product / Category',
    category: FIELD_CATEGORIES.DIMENSIONS,
    description: 'Product name or category',
    dataType: 'text',
    aliases: [
      'product', 'product_name', 'category', 'product_category',
      'sku', 'item', 'product_line', 'brand'
    ],
  },
};

/**
 * Get all fields as an array (for dropdowns)
 */
export const getFieldsArray = () => {
  return Object.values(STANDARD_FIELDS).map(field => ({
    ...field,
    value: field.id,
  }));
};

/**
 * Get fields grouped by category
 */
export const getFieldsByCategory = () => {
  const grouped = {};
  
  Object.values(STANDARD_FIELDS).forEach(field => {
    if (!grouped[field.category]) {
      grouped[field.category] = [];
    }
    grouped[field.category].push(field);
  });
  
  return grouped;
};

/**
 * Auto-detect mapping based on column name
 * Returns the best matching standard field ID or null
 */
export const autoDetectFieldMapping = (columnName) => {
  if (!columnName) return null;
  
  const normalizedColumn = columnName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_')        // Remove duplicate underscores
    .replace(/^_|_$/g, '');     // Remove leading/trailing underscores
  
  // Check each field's aliases
  for (const field of Object.values(STANDARD_FIELDS)) {
    for (const alias of field.aliases) {
      if (normalizedColumn === alias || normalizedColumn.includes(alias)) {
        return field.id;
      }
    }
  }
  
  // Fuzzy matching - check if column contains key parts
  const keywordMatches = {
    revenue: ['revenue', 'sales', 'income'],
    net_income: ['net_income', 'net_profit', 'profit', 'earnings'],
    cogs: ['cogs', 'cost_of_goods', 'cost_of_sales'],
    total_assets: ['total_asset', 'assets'],
    total_liabilities: ['total_liab', 'liabilities'],
    equity: ['equity', 'stockholder', 'shareholder'],
    date: ['date', 'period'],
  };
  
  for (const [fieldId, keywords] of Object.entries(keywordMatches)) {
    for (const keyword of keywords) {
      if (normalizedColumn.includes(keyword)) {
        return fieldId;
      }
    }
  }
  
  return null;
};

/**
 * Get field by ID
 */
export const getFieldById = (fieldId) => {
  return STANDARD_FIELDS[fieldId] || null;
};

/**
 * Validate a mapping object
 * Returns { valid: boolean, errors: string[], warnings: string[] }
 */
export const validateMapping = (mapping, requiredFields = []) => {
  const errors = [];
  const warnings = [];
  
  // Check required fields
  for (const field of requiredFields) {
    if (!mapping[field]) {
      errors.push(`Missing required field: ${STANDARD_FIELDS[field]?.label || field}`);
    }
  }
  
  // Check for duplicate column mappings
  const mappedColumns = Object.values(mapping);
  const duplicates = mappedColumns.filter((col, idx) => 
    col && mappedColumns.indexOf(col) !== idx
  );
  
  if (duplicates.length > 0) {
    warnings.push(`Same column mapped to multiple fields: ${[...new Set(duplicates)].join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

export default STANDARD_FIELDS;
