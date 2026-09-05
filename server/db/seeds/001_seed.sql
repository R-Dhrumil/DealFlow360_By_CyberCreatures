-- DealFlow360 Seed Data

-- Clear existing data
TRUNCATE audit_log, negotiation_messages, billing_schedules, fulfillment_splits, approvals_log, quotation_lines, quotations, subscription_plans, approval_chains, category_discount_ceiling, discount_tiers, warehouse_stock, warehouses, price_lists, product_variants, products, customers, users, companies CASCADE;

-- Insert Companies
INSERT INTO companies (id, name, logo_url, subdomain_slug) VALUES 
('11111111-1111-1111-1111-111111111111', 'Nexus Industrial Solutions', 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=Nexus', 'nexus'),
('22222222-2222-2222-2222-222222222222', 'Vertex Cloud Technologies', 'https://via.placeholder.com/150/10B981/FFFFFF?text=Vertex', 'vertex');

-- Insert Users (Password: password123, hash generated using bcrypt)
-- Nexus Users
INSERT INTO users (id, company_id, name, email, password_hash, role) VALUES 
('11111111-1111-1111-1111-100000000001', '11111111-1111-1111-1111-111111111111', 'Nexus Admin', 'admin@nexus.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'admin'),
('11111111-1111-1111-1111-100000000002', '11111111-1111-1111-1111-111111111111', 'Sarah Manager', 'manager@nexus.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'sales_manager'),
('11111111-1111-1111-1111-100000000003', '11111111-1111-1111-1111-111111111111', 'John Rep', 'rep@nexus.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'sales_rep');

-- Vertex Users
INSERT INTO users (id, company_id, name, email, password_hash, role) VALUES 
('22222222-2222-2222-2222-200000000001', '22222222-2222-2222-2222-222222222222', 'Vertex Admin', 'admin@vertex.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'admin'),
('22222222-2222-2222-2222-200000000002', '22222222-2222-2222-2222-222222222222', 'Mike Manager', 'manager@vertex.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'sales_manager'),
('22222222-2222-2222-2222-200000000003', '22222222-2222-2222-2222-222222222222', 'Lisa Rep', 'rep@vertex.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC', 'sales_rep');

-- Insert Customers
INSERT INTO customers (id, name, email, password_hash) VALUES 
('33333333-3333-3333-3333-333333333331', 'Acme Corp', 'buyer@acme.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC'),
('33333333-3333-3333-3333-333333333332', 'Globex Corporation', 'purchasing@globex.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC'),
('33333333-3333-3333-3333-333333333333', 'Soylent Corp', 'procurement@soylent.com', '$2b$10$wN9iJ7u/Qx4z0K.J/U7wOuOQvP/7w.9k2M9V9G/N/37jM.Gj6gQxC');

-- Insert Products (Nexus - Hardware & Services)
INSERT INTO products (id, company_id, name, category, base_price, unit, tax_rate, description, is_promoted, margin_percent) VALUES 
('11111111-1111-1111-1111-100000000101', '11111111-1111-1111-1111-111111111111', 'Industrial Router Pro', 'Hardware', 1200.00, 'unit', 5.0, 'High-performance industrial grade router', true, 40.0),
('11111111-1111-1111-1111-100000000102', '11111111-1111-1111-1111-111111111111', 'Edge Compute Node X1', 'Hardware', 2500.00, 'unit', 5.0, 'Ruggedized edge computing server', false, 35.0),
('11111111-1111-1111-1111-100000000103', '11111111-1111-1111-1111-111111111111', 'IoT Sensor Hub', 'Hardware', 450.00, 'unit', 5.0, 'Central hub for IoT sensors', false, 50.0),
('11111111-1111-1111-1111-100000000104', '11111111-1111-1111-1111-111111111111', '24/7 Premium Support', 'Services', 500.00, 'month', 0.0, 'Round-the-clock priority technical support', true, 80.0),
('11111111-1111-1111-1111-100000000105', '11111111-1111-1111-1111-111111111111', 'On-site Installation', 'Services', 1500.00, 'job', 0.0, 'Professional on-site setup and configuration', false, 60.0),
('11111111-1111-1111-1111-100000000106', '11111111-1111-1111-1111-111111111111', 'Network Audit', 'Services', 2000.00, 'job', 0.0, 'Comprehensive network security and performance audit', false, 75.0);

-- Insert Products (Vertex - Software & Services)
INSERT INTO products (id, company_id, name, category, base_price, unit, tax_rate, description, is_promoted, margin_percent) VALUES 
('22222222-2222-2222-2222-200000000101', '22222222-2222-2222-2222-222222222222', 'Vertex Cloud CRM Enterprise', 'Software', 150.00, 'user/month', 0.0, 'Full-featured enterprise CRM platform', true, 90.0),
('22222222-2222-2222-2222-200000000102', '22222222-2222-2222-2222-222222222222', 'Marketing Analytics Suite', 'Software', 400.00, 'month', 0.0, 'Advanced marketing analytics and reporting', false, 85.0),
('22222222-2222-2222-2222-200000000103', '22222222-2222-2222-2222-222222222222', 'Data Warehouse Integration', 'Software', 1000.00, 'month', 0.0, 'Automated data synchronization', false, 80.0),
('22222222-2222-2222-2222-200000000104', '22222222-2222-2222-2222-222222222222', 'Dedicated Account Manager', 'Services', 2500.00, 'month', 0.0, 'Personalized account management and strategy', true, 60.0),
('22222222-2222-2222-2222-200000000105', '22222222-2222-2222-2222-222222222222', 'Data Migration Service', 'Services', 5000.00, 'job', 0.0, 'Secure and complete data migration', false, 70.0),
('22222222-2222-2222-2222-200000000106', '22222222-2222-2222-2222-222222222222', 'Custom API Development', 'Services', 8000.00, 'job', 0.0, 'Custom API endpoints for specific business needs', false, 65.0);

-- Insert Warehouses
INSERT INTO warehouses (id, company_id, name, location) VALUES 
('11111111-1111-1111-1111-100000000201', '11111111-1111-1111-1111-111111111111', 'Nexus East Coast Distribution', 'New York, NY'),
('11111111-1111-1111-1111-100000000202', '11111111-1111-1111-1111-111111111111', 'Nexus West Coast Hub', 'San Jose, CA'),
('22222222-2222-2222-2222-200000000201', '22222222-2222-2222-2222-222222222222', 'Vertex Digital Assets', 'Cloud-US-East');

-- Insert Warehouse Stock (Only Hardware needs stock)
INSERT INTO warehouse_stock (warehouse_id, product_id, quantity_available) VALUES 
('11111111-1111-1111-1111-100000000201', '11111111-1111-1111-1111-100000000101', 50),
('11111111-1111-1111-1111-100000000202', '11111111-1111-1111-1111-100000000101', 30),
('11111111-1111-1111-1111-100000000201', '11111111-1111-1111-1111-100000000102', 15),
('11111111-1111-1111-1111-100000000202', '11111111-1111-1111-1111-100000000102', 40),
('11111111-1111-1111-1111-100000000201', '11111111-1111-1111-1111-100000000103', 100);

-- Insert Discount Tiers
INSERT INTO discount_tiers (company_id, tier_name, max_discount_percent) VALUES 
('11111111-1111-1111-1111-111111111111', 'Bronze', 5.0),
('11111111-1111-1111-1111-111111111111', 'Silver', 10.0),
('11111111-1111-1111-1111-111111111111', 'Gold', 15.0),
('22222222-2222-2222-2222-222222222222', 'Bronze', 5.0),
('22222222-2222-2222-2222-222222222222', 'Silver', 10.0),
('22222222-2222-2222-2222-222222222222', 'Gold', 20.0);

-- Insert Category Discount Ceilings
INSERT INTO category_discount_ceiling (company_id, category, max_discount_percent) VALUES 
('11111111-1111-1111-1111-111111111111', 'Hardware', 10.0),
('11111111-1111-1111-1111-111111111111', 'Services', 15.0),
('22222222-2222-2222-2222-222222222222', 'Software', 25.0),
('22222222-2222-2222-2222-222222222222', 'Services', 10.0);

-- Insert Approval Chains
INSERT INTO approval_chains (company_id, min_discount, max_discount, requires_manager, requires_finance) VALUES 
('11111111-1111-1111-1111-111111111111', 0.0, 10.0, true, false),
('11111111-1111-1111-1111-111111111111', 10.0, 100.0, true, true),
('22222222-2222-2222-2222-222222222222', 0.0, 15.0, true, false),
('22222222-2222-2222-2222-222222222222', 15.0, 100.0, true, true);

-- Insert Subscription Plans
INSERT INTO subscription_plans (company_id, product_id, cycle) VALUES 
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-100000000104', 'monthly'),
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-200000000101', 'yearly'),
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-200000000102', 'monthly');

-- Assign Tiers to Customers via Price Lists (For demonstration, assume Acme is Gold at Nexus, Globex is Silver at Vertex)
INSERT INTO price_lists (company_id, customer_tier) VALUES 
('11111111-1111-1111-1111-111111111111', 'Gold'),
('22222222-2222-2222-2222-222222222222', 'Silver');
