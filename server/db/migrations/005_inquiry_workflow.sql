-- 005: Hierarchical Quotation & Discount Approval Workflow
-- Adds: inquiries table, floor_price, customer_tier, approval_level, 3rd approval tier

-- 1. Add floor_price to products (configurable per product by Company Admin)
ALTER TABLE products ADD COLUMN IF NOT EXISTS floor_price NUMERIC(15,2);

-- 2. Add customer_tier to customers (M1/M2/M3 or custom, set by Admin)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_tier VARCHAR(50);

-- 3. Add per-user max discount override (NULL = use role-level discount_tier)
ALTER TABLE users ADD COLUMN IF NOT EXISTS max_discount_percent NUMERIC(5,2);

-- 4. Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  customer_id VARCHAR(100) REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'in_progress', 'closed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inquiries_company ON inquiries(company_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_customer ON inquiries(customer_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_product ON inquiries(product_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(company_id, status);

-- 5. Add inquiry_id to quotations (nullable for backward compat with existing records)
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS inquiry_id VARCHAR(100)
  REFERENCES inquiries(id) ON DELETE SET NULL;

-- 6. Add approval_level to quotations ('manager' | 'admin' | NULL)
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS approval_level VARCHAR(50);

-- 7. Extend quotations status CHECK to include pending_admin_approval and sent
--    Drop & recreate the constraint (idempotent using DO block)
DO $$
BEGIN
  ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check;
  ALTER TABLE quotations ADD CONSTRAINT quotations_status_check
    CHECK (status IN (
      'draft',
      'pending_approval',
      'pending_finance_approval',
      'pending_admin_approval',
      'approved',
      'sent',
      'rejected',
      'negotiating',
      'confirmed'
    ));
EXCEPTION WHEN others THEN
  -- ignore if constraint already matches
  NULL;
END;
$$;

-- 8. Index for inquiry_id on quotations
CREATE INDEX IF NOT EXISTS idx_quotations_inquiry ON quotations(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_quotations_approval_level ON quotations(company_id, approval_level);
