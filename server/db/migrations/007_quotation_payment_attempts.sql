ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS payment_attempts INT DEFAULT 0;

ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check;

ALTER TABLE quotations 
ADD CONSTRAINT quotations_status_check 
CHECK (status IN ('draft', 'pending_approval', 'pending_finance_approval', 'approved', 'rejected', 'negotiating', 'confirmed', 'closed', 'blocked'));
