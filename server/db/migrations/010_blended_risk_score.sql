-- 010_blended_risk_score.sql

-- 1. Create customer_categories table
CREATE TABLE IF NOT EXISTS customer_categories (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  default_discount_percent NUMERIC(5, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add customer_category_id to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_category_id VARCHAR(100) REFERENCES customer_categories(id) ON DELETE SET NULL;

-- 3. Create product_discount_rules table
CREATE TABLE IF NOT EXISTS product_discount_rules (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE,
  category VARCHAR(255),
  customer_category_id VARCHAR(100) REFERENCES customer_categories(id) ON DELETE CASCADE,
  max_discount_percent NUMERIC(5, 2) NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  -- Ensure we don't duplicate rules for the same product/category and customer category
  UNIQUE(company_id, product_id, category, customer_category_id)
);

-- 4. Update quotations table
ALTER TABLE quotations 
  ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50),
  ADD COLUMN IF NOT EXISTS manager_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS finance_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS total_discount_amount NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allowed_discount_amount NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS excess_discount_amount NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_calculated_at TIMESTAMP WITH TIME ZONE;

-- Update the CHECK constraint on quotations status to ensure pending_manager and pending_finance are valid if missing
DO $$
BEGIN
  ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check;
  ALTER TABLE quotations ADD CONSTRAINT quotations_status_check
    CHECK (status IN (
      'draft',
      'pending_approval',
      'pending_manager',          -- new
      'manager_approved',         -- new
      'pending_finance_approval',
      'pending_finance',          -- new
      'pending_admin_approval',
      'approved',
      'sent',
      'rejected',
      'negotiating',
      'confirmed',
      'closed',
      'blocked',
      'accepted',
      'signed',
      'cancelled'
    ));
EXCEPTION WHEN others THEN
  -- ignore if constraint already matches
  NULL;
END;
$$;

-- 5. Update quotation_lines table
ALTER TABLE quotation_lines
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS allowed_discount_percent NUMERIC(5, 2),
  ADD COLUMN IF NOT EXISTS excess_discount_percent NUMERIC(5, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_risk_score NUMERIC(10, 4) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS line_risk_weight NUMERIC(10, 4) DEFAULT 0;

-- 6. Update approvals_log table
ALTER TABLE approvals_log
  ADD COLUMN IF NOT EXISTS approver_role VARCHAR(50),
  ADD COLUMN IF NOT EXISTS previous_status VARCHAR(50),
  ADD COLUMN IF NOT EXISTS new_status VARCHAR(50);
