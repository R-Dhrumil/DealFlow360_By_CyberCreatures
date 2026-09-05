-- 002: Add Operations Role, Orders, and Invoices

-- 1. Safely add 'operations' role by replacing the check constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('super_admin', 'admin', 'sales_manager', 'finance', 'finance_manager', 'sales_rep', 'operations'));

-- 2. Create Orders table
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  quotation_id VARCHAR(100) REFERENCES quotations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending_fulfillment' CHECK (status IN ('pending_fulfillment', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);

-- 3. Create Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  order_id VARCHAR(100) REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partially_paid', 'paid', 'overdue', 'cancelled')),
  due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_invoices_company ON invoices(company_id);
