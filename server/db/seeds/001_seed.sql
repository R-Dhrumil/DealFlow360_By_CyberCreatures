-- DealFlow360 Seed Data for Admin Dashboard & CPQ Engine

-- Clear existing data
TRUNCATE audit_log, negotiation_messages, billing_schedules, fulfillment_splits, approvals_log, quotation_lines, quotations, subscription_plans, approval_chains, category_discount_ceiling, discount_tiers, warehouse_stock, warehouses, price_lists, product_variants, products, customers, users, companies CASCADE;

-- 1. Insert Companies
INSERT INTO companies (id, name, logo_url, subdomain_slug) VALUES 
('11111111-1111-1111-1111-111111111111', 'CyberCreatures Global', 'https://via.placeholder.com/150/702963/FFFFFF?text=CyberCreatures', 'cybercreatures'),
('22222222-2222-2222-2222-222222222222', 'Vertex Cloud Technologies', 'https://via.placeholder.com/150/10B981/FFFFFF?text=Vertex', 'vertex');

-- 2. Insert Users (Password: Admin123! / Manager123! / Sales123! / Finance123! / password123)
-- CyberCreatures Users
INSERT INTO users (id, company_id, name, email, password_hash, role) VALUES 
('11111111-1111-1111-1111-100000000000', '11111111-1111-1111-1111-111111111111', 'Super Admin', 'superadmin@dealflow360.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'super_admin'),
('11111111-1111-1111-1111-100000000001', '11111111-1111-1111-1111-111111111111', 'CyberCreatures Admin', 'admin@cybercreatures.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'admin'),
('11111111-1111-1111-1111-100000000002', '11111111-1111-1111-1111-111111111111', 'Sarah Manager', 'manager@cybercreatures.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'sales_manager'),
('11111111-1111-1111-1111-100000000003', '11111111-1111-1111-1111-111111111111', 'M. Shah', 'sales@cybercreatures.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'sales_rep'),
('11111111-1111-1111-1111-100000000004', '11111111-1111-1111-1111-111111111111', 'Finance Lead', 'finance@cybercreatures.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'finance'),
('11111111-1111-1111-1111-100000000005', '11111111-1111-1111-1111-111111111111', 'J. Rao', 'j.rao@cybercreatures.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'sales_rep'),
('11111111-1111-1111-1111-100000000006', '11111111-1111-1111-1111-111111111111', 'Jim Halpert', 'j.halpert@cybercreatures.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'sales_rep');

-- Vertex Users
INSERT INTO users (id, company_id, name, email, password_hash, role) VALUES 
('22222222-2222-2222-2222-200000000001', '22222222-2222-2222-2222-222222222222', 'Vertex Admin', 'admin@vertex.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'admin'),
('22222222-2222-2222-2222-200000000002', '22222222-2222-2222-2222-222222222222', 'Mike Manager', 'manager@vertex.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'sales_manager'),
('22222222-2222-2222-2222-200000000003', '22222222-2222-2222-2222-222222222222', 'Lisa Rep', 'rep@vertex.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'sales_rep');

-- 3. Insert Customers
INSERT INTO customers (id, name, email, password_hash) VALUES 
('33333333-3333-3333-3333-333333333331', 'Acme Corp', 'customer@acme.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC'),
('33333333-3333-3333-3333-333333333332', 'Globex Corporation', 'purchasing@globex.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC'),
('33333333-3333-3333-3333-333333333333', 'Soylent Corp', 'procurement@soylent.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC'),
('33333333-3333-3333-3333-333333333334', 'Delta Systems LLC', 'contact@deltasystems.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC'),
('33333333-3333-3333-3333-333333333335', 'Hyperion Logistics', 'ops@hyperionlogistics.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC');

-- 4. Insert Products (CyberCreatures - Hardware, Services, Software)
INSERT INTO products (id, company_id, name, category, base_price, unit, tax_rate, description, is_promoted, margin_percent) VALUES 
('11111111-1111-1111-1111-100000000101', '11111111-1111-1111-1111-111111111111', 'Industrial Router Pro', 'Hardware', 1200.00, 'unit', 5.0, 'High-performance industrial grade router', true, 40.0),
('11111111-1111-1111-1111-100000000102', '11111111-1111-1111-1111-111111111111', 'Edge Compute Node X1', 'Hardware', 2500.00, 'unit', 5.0, 'Ruggedized edge computing server for low-latency nodes', false, 35.0),
('11111111-1111-1111-1111-100000000103', '11111111-1111-1111-1111-111111111111', 'IoT Sensor Hub', 'Hardware', 450.00, 'unit', 5.0, 'Central hub for telemetry and industrial IoT sensors', false, 50.0),
('11111111-1111-1111-1111-100000000104', '11111111-1111-1111-1111-111111111111', '24/7 Premium Support SLA', 'Services', 500.00, 'month', 0.0, 'Round-the-clock priority technical support & 99.99% uptime', true, 80.0),
('11111111-1111-1111-1111-100000000105', '11111111-1111-1111-1111-111111111111', 'On-site Systems Integration', 'Services', 1500.00, 'job', 0.0, 'Professional on-site setup and hardware deployment', false, 60.0),
('11111111-1111-1111-1111-100000000106', '11111111-1111-1111-1111-111111111111', 'NextGen Enterprise Firewall', 'Hardware', 3800.00, 'unit', 5.0, 'Zero-Trust network security & deep packet inspection appliance', true, 45.0),
('11111111-1111-1111-1111-100000000107', '11111111-1111-1111-1111-111111111111', 'CPQ Engine Enterprise Suite', 'Software', 350.00, 'user/month', 0.0, 'Multi-tier automated pricing, margin guardrails, and deal desk suite', true, 85.0);

-- Insert Products (Vertex - Software & Services)
INSERT INTO products (id, company_id, name, category, base_price, unit, tax_rate, description, is_promoted, margin_percent) VALUES 
('22222222-2222-2222-2222-200000000101', '22222222-2222-2222-2222-222222222222', 'Vertex Cloud CRM Enterprise', 'Software', 150.00, 'user/month', 0.0, 'Full-featured enterprise CRM platform', true, 90.0),
('22222222-2222-2222-2222-200000000102', '22222222-2222-2222-2222-222222222222', 'Marketing Analytics Suite', 'Software', 400.00, 'month', 0.0, 'Advanced marketing analytics and reporting', false, 85.0);

-- 5. Insert Warehouses
INSERT INTO warehouses (id, company_id, name, location, shipping_cost_weight) VALUES 
('11111111-1111-1111-1111-100000000201', '11111111-1111-1111-1111-111111111111', 'CyberCreatures East Coast Distribution', 'New York, NY', 1.00),
('11111111-1111-1111-1111-100000000202', '11111111-1111-1111-1111-111111111111', 'CyberCreatures West Coast Depot', 'San Jose, CA', 1.15),
('11111111-1111-1111-1111-100000000203', '11111111-1111-1111-1111-111111111111', 'CyberCreatures EMEA Logistics Depot', 'London, UK', 1.50);

-- 6. Insert Warehouse Stock
INSERT INTO warehouse_stock (warehouse_id, product_id, quantity_available) VALUES 
('11111111-1111-1111-1111-100000000201', '11111111-1111-1111-1111-100000000101', 85),
('11111111-1111-1111-1111-100000000202', '11111111-1111-1111-1111-100000000101', 45),
('11111111-1111-1111-1111-100000000201', '11111111-1111-1111-1111-100000000102', 30),
('11111111-1111-1111-1111-100000000202', '11111111-1111-1111-1111-100000000102', 60),
('11111111-1111-1111-1111-100000000201', '11111111-1111-1111-1111-100000000106', 25),
('11111111-1111-1111-1111-100000000203', '11111111-1111-1111-1111-100000000106', 15);

-- 7. Insert Discount Tiers
INSERT INTO discount_tiers (company_id, tier_name, max_discount_percent) VALUES 
('11111111-1111-1111-1111-111111111111', 'Bronze', 5.0),
('11111111-1111-1111-1111-111111111111', 'Silver', 10.0),
('11111111-1111-1111-1111-111111111111', 'Gold', 15.0),
('11111111-1111-1111-1111-111111111111', 'Platinum Enterprise', 22.0);

-- 8. Insert Category Discount Ceilings
INSERT INTO category_discount_ceiling (company_id, category, max_discount_percent) VALUES 
('11111111-1111-1111-1111-111111111111', 'Hardware', 12.0),
('11111111-1111-1111-1111-111111111111', 'Software', 25.0),
('11111111-1111-1111-1111-111111111111', 'Services', 18.0);

-- 9. Insert Approval Chains
INSERT INTO approval_chains (company_id, min_discount, max_discount, requires_manager, requires_finance) VALUES 
('11111111-1111-1111-1111-111111111111', 0.0, 10.0, true, false),
('11111111-1111-1111-1111-111111111111', 10.0, 100.0, true, true);

-- 10. Insert Subscription Plans
INSERT INTO subscription_plans (company_id, product_id, cycle) VALUES 
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-100000000104', 'monthly'),
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-100000000107', 'monthly');

-- 11. Assign Tiers to Customers via Price Lists
INSERT INTO price_lists (company_id, customer_tier) VALUES 
('11111111-1111-1111-1111-111111111111', 'Gold'),
('11111111-1111-1111-1111-111111111111', 'Platinum Enterprise');

-- 12. Insert Live Quotations & Line Items
INSERT INTO quotations (id, company_id, customer_id, sales_rep_id, status, blended_risk_score) VALUES
('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333334', '11111111-1111-1111-1111-100000000003', 'pending_approval', 8.50),
('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333335', '11111111-1111-1111-1111-100000000005', 'negotiating', 2.10),
('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-100000000003', 'approved', 0.00),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-100000000006', 'draft', 0.00);

INSERT INTO quotation_lines (quotation_id, product_id, quantity, unit_price, discount_percent, line_type) VALUES
('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-100000000101', 50, 1200.00, 22.0, 'one_time'),
('44444444-4444-4444-4444-444444444441', '11111111-1111-1111-1111-100000000104', 24, 500.00, 15.0, 'recurring'),
('44444444-4444-4444-4444-444444444442', '11111111-1111-1111-1111-100000000102', 30, 2500.00, 6.0, 'one_time'),
('44444444-4444-4444-4444-444444444443', '11111111-1111-1111-1111-100000000106', 15, 3800.00, 5.0, 'one_time'),
('44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-100000000107', 25, 350.00, 0.0, 'recurring');

-- 13. Insert System Audit Logs for Compliance Dashboard
INSERT INTO audit_log (id, entity_type, entity_id, user_id, action, timestamp, details) VALUES
(
  '55555555-5555-5555-5555-555555555551',
  'Product',
  '11111111-1111-1111-1111-100000000106',
  '11111111-1111-1111-1111-100000000001',
  'PRODUCT_CREATED',
  NOW() - INTERVAL '3 days',
  '{"name": "NextGen Enterprise Firewall", "basePrice": 3800.00, "floorMargin": 45}'::jsonb
),
(
  '55555555-5555-5555-5555-555555555552',
  'DiscountTier',
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-100000000001',
  'TIER_CONFIG_UPDATED',
  NOW() - INTERVAL '2 days',
  '{"tier": "Platinum Enterprise", "maxDiscountPercent": 22.0, "floorMargin": 20}'::jsonb
),
(
  '55555555-5555-5555-5555-555555555553',
  'Quotation',
  '44444444-4444-4444-4444-444444444441',
  '11111111-1111-1111-1111-100000000003',
  'DISCOUNT_ESCALATION_TRIGGERED',
  NOW() - INTERVAL '1 day',
  '{"customer": "Delta Systems LLC", "discountPercent": 22.0, "riskScore": 8.50}'::jsonb
),
(
  '55555555-5555-5555-5555-555555555554',
  'User',
  '11111111-1111-1111-1111-100000000006',
  '11111111-1111-1111-1111-100000000001',
  'USER_PROVISIONED',
  NOW() - INTERVAL '12 hours',
  '{"email": "j.halpert@cybercreatures.com", "role": "sales_rep"}'::jsonb
);

