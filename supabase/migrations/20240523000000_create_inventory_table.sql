
-- Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workbench_id UUID NOT NULL REFERENCES workbenches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  hsn_code TEXT,
  type TEXT CHECK (type IN ('product', 'service')) DEFAULT 'product',
  classification TEXT CHECK (classification IN ('asset', 'liability')) DEFAULT 'asset',
  amount NUMERIC DEFAULT 0,
  quantity NUMERIC DEFAULT 1,
  unit_price NUMERIC GENERATED ALWAYS AS (CASE WHEN quantity > 0 THEN amount / quantity ELSE 0 END) STORED,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_inventory_workbench ON inventory_items(workbench_id);
CREATE INDEX IF NOT EXISTS idx_inventory_hsn ON inventory_items(hsn_code);
