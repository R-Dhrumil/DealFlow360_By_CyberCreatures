-- DealFlow360 Seed Data for Admin Dashboard & CPQ Engine

-- 1. Insert Companies
INSERT INTO companies (id, name, logo_url, subdomain_slug) VALUES 
('c1', 'CyberCreatures Global', 'https://via.placeholder.com/150/702963/FFFFFF?text=CyberCreatures', 'cybercreatures'),
('c2', 'Vertex Cloud Technologies', 'https://via.placeholder.com/150/10B981/FFFFFF?text=Vertex', 'vertex')
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Users (Password: SuperAdmin123! / Admin123! / Manager123! / Sales123! / Finance123!)
-- CyberCreatures Users
INSERT INTO users (id, company_id, name, email, password_hash, role) VALUES 
('u1', 'c1', 'Super Admin', 'superadmin@dealflow360.com', '$2b$10$kCMIb1hLJGj03WoNSADWK.QSTqRSJ6Htn3o7iXKn6dRIQXgtyTMT6', 'super_admin'),
('u2', 'c1', 'CyberCreatures Admin', 'admin@cybercreatures.com', '$2b$10$pD7pRAT.XkYzwIpr/jlzpujw84rgWR98turse0M22P/YSXZ6CMNgm', 'admin'),
('u3', 'c1', 'Sarah Manager', 'manager@cybercreatures.com', '$2b$10$LDSmhVjVVS3v0pYUnQ4WxO07aLpIo0h6USxnqvySqBKV6LP4eam2i', 'sales_manager'),
('u4', 'c1', 'M. Shah', 'sales@cybercreatures.com', '$2b$10$oyAD0GU22wk712.zDbS/E.FaiijyBrsnOd7w7X0JVZ8XXJOXxmyGS', 'sales_rep'),
('u5', 'c1', 'Finance Lead', 'finance@cybercreatures.com', '$2b$10$7dUTsQ9oFpY7X1/JJOg7FOxA/TR0iL2fKiqD0kOEXkC3Q45q8G2P.', 'finance_manager'),
('u6', 'c1', 'J. Rao', 'j.rao@cybercreatures.com', '$2b$10$oyAD0GU22wk712.zDbS/E.FaiijyBrsnOd7w7X0JVZ8XXJOXxmyGS', 'sales_rep'),
('u7', 'c1', 'Jim Halpert', 'j.halpert@cybercreatures.com', '$2b$10$oyAD0GU22wk712.zDbS/E.FaiijyBrsnOd7w7X0JVZ8XXJOXxmyGS', 'sales_rep')
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role;

-- Vertex Users
INSERT INTO users (id, company_id, name, email, password_hash, role) VALUES 
('u8', 'c2', 'Vertex Admin', 'admin@vertex.com', '$2b$10$pD7pRAT.XkYzwIpr/jlzpujw84rgWR98turse0M22P/YSXZ6CMNgm', 'admin'),
('u9', 'c2', 'Mike Manager', 'manager@vertex.com', '$2b$10$LDSmhVjVVS3v0pYUnQ4WxO07aLpIo0h6USxnqvySqBKV6LP4eam2i', 'sales_manager'),
('u10', 'c2', 'Lisa Rep', 'rep@vertex.com', '$2b$10$oyAD0GU22wk712.zDbS/E.FaiijyBrsnOd7w7X0JVZ8XXJOXxmyGS', 'sales_rep')
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- 3. Insert Customers
INSERT INTO customers (id, name, email, password_hash) VALUES 
('cust1', 'Acme Corp', 'customer@acme.com', '$2b$10$1mei/6Yi3zPvmEKKPZIEN.lh9ZUYHsAoDNZO5NSUbxlDNRVunrqaW'),
('cust2', 'Globex Corporation', 'purchasing@globex.com', '$2b$10$1mei/6Yi3zPvmEKKPZIEN.lh9ZUYHsAoDNZO5NSUbxlDNRVunrqaW'),
('cust3', 'Soylent Corp', 'procurement@soylent.com', '$2b$10$1mei/6Yi3zPvmEKKPZIEN.lh9ZUYHsAoDNZO5NSUbxlDNRVunrqaW'),
('cust4', 'Delta Systems LLC', 'contact@deltasystems.com', '$2b$10$1mei/6Yi3zPvmEKKPZIEN.lh9ZUYHsAoDNZO5NSUbxlDNRVunrqaW'),
('cust5', 'Hyperion Logistics', 'ops@hyperionlogistics.com', '$2b$10$1mei/6Yi3zPvmEKKPZIEN.lh9ZUYHsAoDNZO5NSUbxlDNRVunrqaW')
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- 4. Insert Products with complete AdminWorkspace specifications
INSERT INTO products (id, company_id, name, category, base_price, unit, tax_rate, description, is_promoted, margin_percent, sku, min_margin, stock, status) VALUES 
('p1', 'c1', 'Industrial Router Pro', 'Hardware', 1200.00, 'unit', 5.0, 'High-performance industrial grade router', true, 40.0, 'HW-RTR-01', 40.0, 85, 'Active'),
('p2', 'c1', 'Edge Compute Node X1', 'Hardware', 2500.00, 'unit', 5.0, 'Ruggedized edge computing server for low-latency nodes', false, 35.0, 'HW-NODE-01', 35.0, 45, 'Active'),
('p3', 'c1', 'IoT Sensor Hub', 'Hardware', 450.00, 'unit', 5.0, 'Central hub for telemetry and industrial IoT sensors', false, 50.0, 'HW-IOT-01', 50.0, 120, 'Active'),
('p4', 'c1', '24/7 Premium Support SLA', 'Services', 500.00, 'month', 0.0, 'Round-the-clock priority technical support & 99.99% uptime', true, 80.0, 'SVC-SLA-01', 80.0, 100, 'Active'),
('p5', 'c1', 'On-site Systems Integration', 'Services', 1500.00, 'job', 0.0, 'Professional on-site setup and hardware deployment', false, 60.0, 'SVC-INT-01', 60.0, 50, 'Active'),
('p6', 'c1', 'NextGen Enterprise Firewall', 'Hardware', 3800.00, 'unit', 5.0, 'Zero-Trust network security & deep packet inspection appliance', true, 45.0, 'SEC-FW-01', 45.0, 30, 'Active'),
('p7', 'c1', 'CPQ Engine Enterprise Suite', 'Software', 350.00, 'user/month', 0.0, 'Multi-tier automated pricing, margin guardrails, and deal desk suite', true, 85.0, 'SW-CPQ-01', 85.0, 999, 'Active'),
('p8', 'c2', 'Vertex Cloud CRM Enterprise', 'Software', 150.00, 'user/month', 0.0, 'Full-featured enterprise CRM platform', true, 90.0, 'VTX-CRM-01', 90.0, 100, 'Active'),
('p9', 'c2', 'Marketing Analytics Suite', 'Software', 400.00, 'month', 0.0, 'Advanced marketing analytics and reporting', false, 85.0, 'VTX-MKT-01', 85.0, 100, 'Active')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  base_price = EXCLUDED.base_price,
  unit = EXCLUDED.unit,
  description = EXCLUDED.description,
  sku = EXCLUDED.sku,
  min_margin = EXCLUDED.min_margin,
  margin_percent = EXCLUDED.margin_percent,
  stock = EXCLUDED.stock,
  status = EXCLUDED.status;

-- 5. Insert Warehouses
INSERT INTO warehouses (id, company_id, name, location, shipping_cost_weight) VALUES 
('w1', 'c1', 'CyberCreatures East Coast Distribution', 'New York, NY', 1.00),
('w2', 'c1', 'CyberCreatures West Coast Depot', 'San Jose, CA', 1.15),
('w3', 'c1', 'CyberCreatures EMEA Logistics Depot', 'London, UK', 1.50)
ON CONFLICT (id) DO NOTHING;

-- 6. Insert Warehouse Stock
INSERT INTO warehouse_stock (id, warehouse_id, product_id, quantity_available) VALUES 
('ws1', 'w1', 'p1', 85),
('ws2', 'w2', 'p1', 45),
('ws3', 'w1', 'p2', 30),
('ws4', 'w2', 'p2', 60),
('ws5', 'w1', 'p6', 25),
('ws6', 'w3', 'p6', 15)
ON CONFLICT (id) DO NOTHING;

-- 7. Insert Discount Tiers with Governance & Escalations
INSERT INTO discount_tiers (id, company_id, tier_name, max_discount_percent, min_margin_percent, approver) VALUES 
('dt1', 'c1', 'Bronze', 5.0, 35.0, 'Sales Manager'),
('dt2', 'c1', 'Silver', 10.0, 30.0, 'Sales Manager'),
('dt3', 'c1', 'Gold', 15.0, 25.0, 'Finance Lead'),
('dt4', 'c1', 'Platinum Enterprise', 22.0, 20.0, 'Admin Override')
ON CONFLICT (company_id, tier_name) DO UPDATE SET
  max_discount_percent = EXCLUDED.max_discount_percent,
  min_margin_percent = EXCLUDED.min_margin_percent,
  approver = EXCLUDED.approver;

-- 8. Insert Category Discount Ceilings with Default Margins
INSERT INTO category_discount_ceiling (id, company_id, category, max_discount_percent, default_margin) VALUES 
('cdc1', 'c1', 'Hardware', 12.0, 35.0),
('cdc2', 'c1', 'Software', 18.0, 80.0),
('cdc3', 'c1', 'Services', 10.0, 60.0)
ON CONFLICT (company_id, category) DO UPDATE SET
  max_discount_percent = EXCLUDED.max_discount_percent,
  default_margin = EXCLUDED.default_margin;

-- 9. Insert Approval Chains
INSERT INTO approval_chains (id, company_id, min_discount, max_discount, requires_manager, requires_finance) VALUES 
('ac1', 'c1', 0.0, 10.0, true, false),
('ac2', 'c1', 10.0, 100.0, true, true)
ON CONFLICT (id) DO NOTHING;

-- 10. Insert Subscription Plans
INSERT INTO subscription_plans (id, company_id, product_id, cycle) VALUES 
('sp1', 'c1', 'p4', 'monthly'),
('sp2', 'c1', 'p7', 'monthly')
ON CONFLICT (id) DO NOTHING;

-- 11. Assign Tiers to Customers via Price Lists
INSERT INTO price_lists (id, company_id, customer_tier) VALUES 
('pl1', 'c1', 'Gold'),
('pl2', 'c1', 'Platinum Enterprise')
ON CONFLICT (id) DO NOTHING;

-- 12. Insert Live Quotations & Line Items
INSERT INTO quotations (id, company_id, customer_id, sales_rep_id, status, blended_risk_score) VALUES
('q101', 'c1', 'cust4', 'u4', 'pending_approval', 8.50),
('q102', 'c1', 'cust5', 'u6', 'negotiating', 2.10),
('q103', 'c1', 'cust1', 'u4', 'approved', 0.00),
('q104', 'c1', 'cust2', 'u7', 'draft', 0.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO quotation_lines (id, quotation_id, product_id, quantity, unit_price, discount_percent, line_type) VALUES
('ql1', 'q101', 'p1', 50, 1200.00, 22.0, 'one_time'),
('ql2', 'q101', 'p4', 24, 500.00, 15.0, 'recurring'),
('ql3', 'q102', 'p2', 30, 2500.00, 6.0, 'one_time'),
('ql4', 'q103', 'p6', 15, 3800.00, 5.0, 'one_time'),
('ql5', 'q104', 'p7', 25, 350.00, 0.0, 'recurring')
ON CONFLICT (id) DO NOTHING;

-- 13. Insert System Audit Logs matching AdminWorkspace Audit Trail
INSERT INTO audit_log (id, entity_type, entity_id, user_id, action, timestamp, details) VALUES
(
  'LOG-9081',
  'Product',
  'p6',
  'u2',
  'PRODUCT_CREATED',
  '2026-09-02 14:22:00+00',
  '{"entity": "NextGen Enterprise Firewall", "user": "CyberCreatures Admin", "role": "admin", "details": "Added to catalog at $3,800 base price"}'::jsonb
),
(
  'LOG-9082',
  'DiscountTier',
  'c1',
  'u2',
  'TIER_CONFIG_UPDATED',
  '2026-09-03 09:15:00+00',
  '{"entity": "Platinum Enterprise", "user": "CyberCreatures Admin", "role": "admin", "details": "Updated max discount ceiling to 22.0%"}'::jsonb
),
(
  'LOG-9083',
  'Quotation',
  'q101',
  'u4',
  'DISCOUNT_ESCALATED',
  '2026-09-04 16:40:00+00',
  '{"entity": "Quotation QT-44444444", "user": "M. Shah", "role": "sales_rep", "details": "Escalated 22% discount on Delta Systems LLC deal"}'::jsonb
),
(
  'LOG-9084',
  'User',
  'u7',
  'u2',
  'USER_PROVISIONED',
  '2026-09-05 10:05:00+00',
  '{"entity": "Jim Halpert", "user": "CyberCreatures Admin", "role": "admin", "details": "Provisioned as Sales Representative"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  action = EXCLUDED.action,
  details = EXCLUDED.details;
