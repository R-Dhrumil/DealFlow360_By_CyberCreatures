-- 008: Inventory Transactions Audit Trail
-- Adds an audit table to track all stock movements

CREATE TABLE IF NOT EXISTS inventory_transactions (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  warehouse_id VARCHAR(100) REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  user_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('in', 'out', 'adjustment', 'transfer')),
  quantity INTEGER NOT NULL,
  reason VARCHAR(255),
  reference_id VARCHAR(100), -- E.g., Order ID or Quotation ID
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_txn_company ON inventory_transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_warehouse_product ON inventory_transactions(warehouse_id, product_id);
