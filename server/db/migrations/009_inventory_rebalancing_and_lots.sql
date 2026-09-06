-- 009: Inventory Rebalancing & Unit/Lot Tracking

-- 1. Add reorder threshold and safety stock to warehouse_stock table
ALTER TABLE warehouse_stock 
ADD COLUMN IF NOT EXISTS reorder_threshold INTEGER NOT NULL DEFAULT 10,
ADD COLUMN IF NOT EXISTS safety_stock INTEGER NOT NULL DEFAULT 5;

-- 2. Create inventory_lots table for tracking batches/lots/units
CREATE TABLE IF NOT EXISTS inventory_lots (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  warehouse_id VARCHAR(100) REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  batch_code VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost NUMERIC(15, 2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inv_lots_wh_prod ON inventory_lots(warehouse_id, product_id);
CREATE INDEX IF NOT EXISTS idx_inv_lots_company ON inventory_lots(company_id);

-- 3. Create stock_rebalance_logs table to track automated inter-warehouse rebalancing
CREATE TABLE IF NOT EXISTS stock_rebalance_logs (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  from_warehouse_id VARCHAR(100) REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  to_warehouse_id VARCHAR(100) REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'completed',
  reason TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rebalance_company ON stock_rebalance_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_rebalance_product ON stock_rebalance_logs(product_id);
