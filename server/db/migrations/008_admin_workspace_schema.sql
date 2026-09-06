-- 008: Admin Workspace Schema Synchronization
-- Adds SKU, Stock, Min Margin, Status, Approver, and Category Margins

-- 1. Product Catalog attributes for Admin Workspace
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100);
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_margin NUMERIC(5, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 100;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Active';

-- 2. Discount Tier attributes for Governance & Escalations
ALTER TABLE discount_tiers ADD COLUMN IF NOT EXISTS min_margin_percent NUMERIC(5, 2);
ALTER TABLE discount_tiers ADD COLUMN IF NOT EXISTS approver VARCHAR(100) DEFAULT 'Sales Manager';

-- 3. Category Discount Ceiling target margin
ALTER TABLE category_discount_ceiling ADD COLUMN IF NOT EXISTS default_margin NUMERIC(5, 2);

-- 4. Ensure index on audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
