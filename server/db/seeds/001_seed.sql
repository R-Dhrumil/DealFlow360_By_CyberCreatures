-- DealFlow360 Seed Data for Admin Dashboard & CPQ Engine

-- Clear existing data
TRUNCATE audit_log, negotiation_messages, billing_schedules, fulfillment_splits, approvals_log, quotation_lines, quotations, subscription_plans, approval_chains, category_discount_ceiling, discount_tiers, warehouse_stock, warehouses, price_lists, product_variants, products, customers, users, companies CASCADE;

-- 1. Insert Companies
INSERT INTO companies (id, name, logo_url, subdomain_slug) VALUES 
('c1', 'CyberCreatures Global', 'https://via.placeholder.com/150/702963/FFFFFF?text=CyberCreatures', 'cybercreatures'),
('c2', 'Vertex Cloud Technologies', 'https://via.placeholder.com/150/10B981/FFFFFF?text=Vertex', 'vertex');

-- 2. Insert Users (Password: SuperAdmin123! / Admin123! / Manager123! / Sales123! / Finance123!)
-- CyberCreatures Users
INSERT INTO users (id, company_id, name, email, password_hash, role) VALUES 
('u1', 'c1', 'Super Admin', 'superadmin@dealflow360.com', '$2b$10$kCMIb1hLJGj03WoNSADWK.QSTqRSJ6Htn3o7iXKn6dRIQXgtyTMT6', 'super_admin'),
('u2', 'c1', 'CyberCreatures Admin', 'admin@cybercreatures.com', '$2b$10$pD7pRAT.XkYzwIpr/jlzpujw84rgWR98turse0M22P/YSXZ6CMNgm', 'admin'),
('u3', 'c1', 'Sarah Manager', 'manager@cybercreatures.com', '$2b$10$LDSmhVjVVS3v0pYUnQ4WxO07aLpIo0h6USxnqvySqBKV6LP4eam2i', 'sales_manager'),
('u4', 'c1', 'M. Shah', 'sales@cybercreatures.com', '$2b$10$oyAD0GU22wk712.zDbS/E.FaiijyBrsnOd7w7X0JVZ8XXJOXxmyGS', 'sales_rep'),
('u5', 'c1', 'Finance Lead', 'finance@cybercreatures.com', '$2b$10$7dUTsQ9oFpY7X1/JJOg7FOxA/TR0iL2fKiqD0kOEXkC3Q45q8G2P.', 'finance'),
('u11', 'c1', 'Fiona Finance Mgr', 'financemanager@cybercreatures.com', '$2b$10$7dUTsQ9oFpY7X1/JJOg7FOxA/TR0iL2fKiqD0kOEXkC3Q45q8G2P.', 'finance_manager'),
('u6', 'c1', 'J. Rao', 'j.rao@cybercreatures.com', '$2b$10$oyAD0GU22wk712.zDbS/E.FaiijyBrsnOd7w7X0JVZ8XXJOXxmyGS', 'sales_rep'),
('u7', 'c1', 'Jim Halpert', 'j.halpert@cybercreatures.com', '$2b$10$oyAD0GU22wk712.zDbS/E.FaiijyBrsnOd7w7X0JVZ8XXJOXxmyGS', 'sales_rep');

-- Vertex Users
INSERT INTO users (id, company_id, name, email, password_hash, role) VALUES 
('u8', 'c2', 'Vertex Admin', 'admin@vertex.com', '$2b$10$pD7pRAT.XkYzwIpr/jlzpujw84rgWR98turse0M22P/YSXZ6CMNgm', 'admin'),
('u9', 'c2', 'Mike Manager', 'manager@vertex.com', '$2b$10$LDSmhVjVVS3v0pYUnQ4WxO07aLpIo0h6USxnqvySqBKV6LP4eam2i', 'sales_manager'),
('u10', 'c2', 'Lisa Rep', 'rep@vertex.com', '$2b$10$oyAD0GU22wk712.zDbS/E.FaiijyBrsnOd7w7X0JVZ8XXJOXxmyGS', 'sales_rep');

-- 3. Insert Customers
INSERT INTO customers (id, name, email, password_hash) VALUES 
('cust1', 'Acme Corp', 'customer@acme.com', '$2b$10$1mei/6Yi3zPvmEKKPZIEN.lh9ZUYHsAoDNZO5NSUbxlDNRVunrqaW'),
('cust2', 'Globex Corporation', 'purchasing@globex.com', '$2b$10$1mei/6Yi3zPvmEKKPZIEN.lh9ZUYHsAoDNZO5NSUbxlDNRVunrqaW'),
('cust3', 'Soylent Corp', 'procurement@soylent.com', '$2b$10$1mei/6Yi3zPvmEKKPZIEN.lh9ZUYHsAoDNZO5NSUbxlDNRVunrqaW'),
('cust4', 'Delta Systems LLC', 'contact@deltasystems.com', '$2b$10$1mei/6Yi3zPvmEKKPZIEN.lh9ZUYHsAoDNZO5NSUbxlDNRVunrqaW'),
('cust5', 'Hyperion Logistics', 'ops@hyperionlogistics.com', '$2b$10$1mei/6Yi3zPvmEKKPZIEN.lh9ZUYHsAoDNZO5NSUbxlDNRVunrqaW');

-- 4. Insert Products (CyberCreatures - Hardware, Services, Software)
INSERT INTO products (id, company_id, name, category, base_price, unit, tax_rate, description, is_promoted, margin_percent) VALUES 
('p1', 'c1', 'Industrial Router Pro', 'Hardware', 1200.00, 'unit', 5.0, 'High-performance industrial grade router', true, 40.0),
('p2', 'c1', 'Edge Compute Node X1', 'Hardware', 2500.00, 'unit', 5.0, 'Ruggedized edge computing server for low-latency nodes', false, 35.0),
('p3', 'c1', 'IoT Sensor Hub', 'Hardware', 450.00, 'unit', 5.0, 'Central hub for telemetry and industrial IoT sensors', false, 50.0),
('p4', 'c1', '24/7 Premium Support SLA', 'Services', 500.00, 'month', 0.0, 'Round-the-clock priority technical support & 99.99% uptime', true, 80.0),
('p5', 'c1', 'On-site Systems Integration', 'Services', 1500.00, 'job', 0.0, 'Professional on-site setup and hardware deployment', false, 60.0),
('p6', 'c1', 'NextGen Enterprise Firewall', 'Hardware', 3800.00, 'unit', 5.0, 'Zero-Trust network security & deep packet inspection appliance', true, 45.0),
('p7', 'c1', 'CPQ Engine Enterprise Suite', 'Software', 350.00, 'user/month', 0.0, 'Multi-tier automated pricing, margin guardrails, and deal desk suite', true, 85.0);

-- Insert Products (Vertex - Software & Services)
INSERT INTO products (id, company_id, name, category, base_price, unit, tax_rate, description, is_promoted, margin_percent) VALUES 
('p8', 'c2', 'Vertex Cloud CRM Enterprise', 'Software', 150.00, 'user/month', 0.0, 'Full-featured enterprise CRM platform', true, 90.0),
('p9', 'c2', 'Marketing Analytics Suite', 'Software', 400.00, 'month', 0.0, 'Advanced marketing analytics and reporting', false, 85.0);

-- 5. Insert Warehouses
INSERT INTO warehouses (id, company_id, name, location, shipping_cost_weight) VALUES 
('w1', 'c1', 'CyberCreatures East Coast Distribution', 'New York, NY', 1.00),
('w2', 'c1', 'CyberCreatures West Coast Depot', 'San Jose, CA', 1.15),
('w3', 'c1', 'CyberCreatures EMEA Logistics Depot', 'London, UK', 1.50);

-- 6. Insert Warehouse Stock
INSERT INTO warehouse_stock (id, warehouse_id, product_id, quantity_available) VALUES 
('ws1', 'w1', 'p1', 85),
('ws2', 'w2', 'p1', 45),
('ws3', 'w1', 'p2', 30),
('ws4', 'w2', 'p2', 60),
('ws5', 'w1', 'p6', 25),
('ws6', 'w3', 'p6', 15);

-- 7. Insert Discount Tiers
INSERT INTO discount_tiers (id, company_id, tier_name, max_discount_percent) VALUES 
('dt1', 'c1', 'Bronze', 5.0),
('dt2', 'c1', 'Silver', 10.0),
('dt3', 'c1', 'Gold', 15.0),
('dt4', 'c1', 'Platinum Enterprise', 22.0);

-- 8. Insert Category Discount Ceilings
INSERT INTO category_discount_ceiling (id, company_id, category, max_discount_percent) VALUES 
('cdc1', 'c1', 'Hardware', 12.0),
('cdc2', 'c1', 'Software', 25.0),
('cdc3', 'c1', 'Services', 18.0);

-- 9. Insert Approval Chains
INSERT INTO approval_chains (id, company_id, min_discount, max_discount, requires_manager, requires_finance) VALUES 
('ac1', 'c1', 0.0, 10.0, true, false),
('ac2', 'c1', 10.0, 100.0, true, true);

-- 10. Insert Subscription Plans
INSERT INTO subscription_plans (id, company_id, product_id, cycle) VALUES 
('sp1', 'c1', 'p4', 'monthly'),
('sp2', 'c1', 'p7', 'monthly');

-- 11. Assign Tiers to Customers via Price Lists
INSERT INTO price_lists (id, company_id, customer_tier) VALUES 
('pl1', 'c1', 'Gold'),
('pl2', 'c1', 'Platinum Enterprise');

-- 12. Insert Live Quotations & Line Items
INSERT INTO quotations (id, company_id, customer_id, sales_rep_id, status, blended_risk_score) VALUES
('q101', 'c1', 'cust4', 'u4', 'pending_approval', 8.50),
('q102', 'c1', 'cust5', 'u6', 'negotiating', 2.10),
('q103', 'c1', 'cust1', 'u4', 'approved', 0.00),
('q104', 'c1', 'cust2', 'u7', 'draft', 0.00);

INSERT INTO quotation_lines (id, quotation_id, product_id, quantity, unit_price, discount_percent, line_type) VALUES
('ql1', 'q101', 'p1', 50, 1200.00, 22.0, 'one_time'),
('ql2', 'q101', 'p4', 24, 500.00, 15.0, 'recurring'),
('ql3', 'q102', 'p2', 30, 2500.00, 6.0, 'one_time'),
('ql4', 'q103', 'p6', 15, 3800.00, 5.0, 'one_time'),
('ql5', 'q104', 'p7', 25, 350.00, 0.0, 'recurring');

-- 13. Insert System Audit Logs for Compliance Dashboard
INSERT INTO audit_log (id, entity_type, entity_id, user_id, action, timestamp, details) VALUES
(
  'log1',
  'Product',
  'p6',
  'u2',
  'PRODUCT_CREATED',
  NOW() - INTERVAL '3 days',
  '{"name": "NextGen Enterprise Firewall", "basePrice": 3800.00, "floorMargin": 45}'::jsonb
),
(
  'log2',
  'DiscountTier',
  'c1',
  'u2',
  'TIER_CONFIG_UPDATED',
  NOW() - INTERVAL '2 days',
  '{"tier": "Platinum Enterprise", "maxDiscountPercent": 22.0, "floorMargin": 20}'::jsonb
),
(
  'log3',
  'Quotation',
  'q101',
  'u4',
  'DISCOUNT_ESCALATION_TRIGGERED',
  NOW() - INTERVAL '1 day',
  '{"customer": "Delta Systems LLC", "discountPercent": 22.0, "riskScore": 8.50}'::jsonb
),
(
  'log4',
  'User',
  'u7',
  'u2',
  'USER_PROVISIONED',
  NOW() - INTERVAL '12 hours',
  '{"email": "j.halpert@cybercreatures.com", "role": "sales_rep"}'::jsonb
);
