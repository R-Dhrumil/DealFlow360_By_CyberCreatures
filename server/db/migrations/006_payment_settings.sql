ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS is_manual_payment_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_upi_payment_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_cod_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS upi_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS manual_payment_instructions TEXT;


CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(100) PRIMARY KEY,
  quotation_id VARCHAR(100) REFERENCES quotations(id) ON DELETE CASCADE,
  company_id VARCHAR(100) REFERENCES companies(id) ON DELETE CASCADE,
  customer_id VARCHAR(100) REFERENCES customers(id) ON DELETE CASCADE,
  amount NUMERIC(15, 2) NOT NULL,
  payment_type VARCHAR(50) CHECK (payment_type IN ('one-time', 'subscription-monthly', 'subscription-yearly')),
  payment_method VARCHAR(50) CHECK (payment_method IN ('manual', 'upi', 'cod')),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
