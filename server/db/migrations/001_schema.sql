-- DealFlow360 Initial Schema with Short Flexible Primary Keys

CREATE TABLE IF NOT EXISTS otps (
  id VARCHAR(100) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS global_settings (
  id VARCHAR(100) PRIMARY KEY,
  site_name VARCHAR(255) DEFAULT 'DealFlow360',
  tagline VARCHAR(255) DEFAULT 'B2B Sales Operations Platform',
  logo_url VARCHAR(1024),
  favicon_url VARCHAR(1024),
  google_analytics_id VARCHAR(100),
  google_search_console_id VARCHAR(100),
  meta_pixel_id VARCHAR(100),
  custom_meta_tags JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS companies (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url VARCHAR(1024),
  subdomain_slug VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('super_admin', 'admin', 'sales_manager', 'finance_manager', 'sales_rep', 'operations')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_new_customer BOOLEAN DEFAULT true,
  orders_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(255) NOT NULL,
  base_price NUMERIC(15, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  tax_rate NUMERIC(5, 2) DEFAULT 0,
  description TEXT,
  is_promoted BOOLEAN DEFAULT false,
  margin_percent NUMERIC(5, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_variants (
  id VARCHAR(100) PRIMARY KEY,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  attribute_name VARCHAR(100) NOT NULL,
  attribute_value VARCHAR(255) NOT NULL,
  extra_price NUMERIC(15, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS price_lists (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  customer_tier VARCHAR(50) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  rules JSONB
);

CREATE TABLE IF NOT EXISTS warehouses (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  shipping_cost_weight NUMERIC(10, 2) DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS warehouse_stock (
  id VARCHAR(100) PRIMARY KEY,
  warehouse_id VARCHAR(100) REFERENCES warehouses(id) ON DELETE CASCADE NOT NULL,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  UNIQUE(warehouse_id, product_id)
);

CREATE TABLE IF NOT EXISTS discount_tiers (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  tier_name VARCHAR(50) NOT NULL,
  max_discount_percent NUMERIC(5, 2) NOT NULL,
  UNIQUE(company_id, tier_name)
);

CREATE TABLE IF NOT EXISTS category_discount_ceiling (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(255) NOT NULL,
  max_discount_percent NUMERIC(5, 2) NOT NULL,
  UNIQUE(company_id, category)
);

CREATE TABLE IF NOT EXISTS approval_chains (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  min_discount NUMERIC(5, 2) NOT NULL,
  max_discount NUMERIC(5, 2),
  requires_manager BOOLEAN DEFAULT true,
  requires_finance BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  cycle VARCHAR(50) NOT NULL CHECK (cycle IN ('monthly', 'quarterly', 'yearly')),
  proration_rules JSONB,
  UNIQUE(company_id, product_id, cycle)
);

CREATE TABLE IF NOT EXISTS quotations (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  customer_id VARCHAR(100) REFERENCES customers(id) ON DELETE CASCADE NOT NULL,
  sales_rep_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'pending_approval', 'pending_finance_approval', 'approved', 'rejected', 'negotiating', 'confirmed')),
  blended_risk_score NUMERIC(10, 4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quotation_lines (
  id VARCHAR(100) PRIMARY KEY,
  quotation_id VARCHAR(100) REFERENCES quotations(id) ON DELETE CASCADE NOT NULL,
  product_id VARCHAR(100) REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(15, 2) NOT NULL,
  discount_percent NUMERIC(5, 2) DEFAULT 0,
  line_type VARCHAR(50) NOT NULL CHECK (line_type IN ('one_time', 'recurring'))
);

CREATE TABLE IF NOT EXISTS approvals_log (
  id VARCHAR(100) PRIMARY KEY,
  quotation_id VARCHAR(100) REFERENCES quotations(id) ON DELETE CASCADE NOT NULL,
  approver_id VARCHAR(100) REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL CHECK (action IN ('approve', 'reject', 'return')),
  reason TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fulfillment_splits (
  id VARCHAR(100) PRIMARY KEY,
  quotation_id VARCHAR(100) REFERENCES quotations(id) ON DELETE CASCADE NOT NULL,
  warehouse_id VARCHAR(100) REFERENCES warehouses(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  shipment_cost NUMERIC(15, 2) DEFAULT 0
);

CREATE TABLE IF NOT EXISTS billing_schedules (
  id VARCHAR(100) PRIMARY KEY,
  quotation_line_id VARCHAR(100) REFERENCES quotation_lines(id) ON DELETE CASCADE NOT NULL,
  billing_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS negotiation_messages (
  id VARCHAR(100) PRIMARY KEY,
  quotation_id VARCHAR(100) REFERENCES quotations(id) ON DELETE CASCADE NOT NULL,
  sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('customer', 'rep')),
  message TEXT,
  counter_discount NUMERIC(5, 2),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_log (
  id VARCHAR(100) PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  details JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_quotations_company ON quotations(company_id);
CREATE INDEX IF NOT EXISTS idx_quotations_customer ON quotations(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotations_rep ON quotations(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_quotation_lines_quotation ON quotation_lines(quotation_id);
