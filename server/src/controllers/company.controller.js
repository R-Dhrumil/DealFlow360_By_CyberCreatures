const pool = require('../../db/pool');

let columnsChecked = false;
async function ensurePaymentColumns() {
  if (columnsChecked) return;
  try {
    await pool.query(`
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
    `);
    columnsChecked = true;
  } catch (err) {
    console.warn('Payment schema auto-verification notice:', err.message);
  }
}

const getPaymentSettings = async (req, res) => {
  await ensurePaymentColumns();
  let companyId = req.user?.companyId || req.user?.company_id || req.query?.companyId;

  let result = null;
  if (companyId) {
    result = await pool.query(`
      SELECT is_manual_payment_enabled, is_upi_payment_enabled, is_cod_enabled, upi_id, manual_payment_instructions
      FROM companies
      WHERE id = $1
    `, [companyId]);
  }

  if (!result || result.rows.length === 0) {
    result = await pool.query(`
      SELECT is_manual_payment_enabled, is_upi_payment_enabled, is_cod_enabled, upi_id, manual_payment_instructions
      FROM companies
      LIMIT 1
    `);
  }

  if (!result || result.rows.length === 0) {
    return res.json({
      is_manual_payment_enabled: false,
      is_upi_payment_enabled: false,
      is_cod_enabled: false,
      upi_id: '',
      manual_payment_instructions: ''
    });
  }

  const row = result.rows[0];
  res.json({
    is_manual_payment_enabled: !!row.is_manual_payment_enabled,
    is_upi_payment_enabled: !!row.is_upi_payment_enabled,
    is_cod_enabled: !!row.is_cod_enabled,
    upi_id: row.upi_id || '',
    manual_payment_instructions: row.manual_payment_instructions || ''
  });
};

const updatePaymentSettings = async (req, res) => {
  await ensurePaymentColumns();
  let companyId = req.user?.companyId || req.user?.company_id || req.body?.companyId;
  const { is_manual_payment_enabled, is_upi_payment_enabled, is_cod_enabled, upi_id, manual_payment_instructions } = req.body;

  let result = null;
  if (companyId) {
    result = await pool.query(`
      UPDATE companies
      SET is_manual_payment_enabled = $1,
          is_upi_payment_enabled = $2,
          is_cod_enabled = $3,
          upi_id = $4,
          manual_payment_instructions = $5
      WHERE id = $6
      RETURNING is_manual_payment_enabled, is_upi_payment_enabled, is_cod_enabled, upi_id, manual_payment_instructions
    `, [
      Boolean(is_manual_payment_enabled),
      Boolean(is_upi_payment_enabled),
      Boolean(is_cod_enabled),
      upi_id || null,
      manual_payment_instructions || null,
      companyId
    ]);
  }

  if (!result || result.rows.length === 0) {
    result = await pool.query(`
      UPDATE companies
      SET is_manual_payment_enabled = $1,
          is_upi_payment_enabled = $2,
          is_cod_enabled = $3,
          upi_id = $4,
          manual_payment_instructions = $5
      WHERE id = (SELECT id FROM companies LIMIT 1)
      RETURNING is_manual_payment_enabled, is_upi_payment_enabled, is_cod_enabled, upi_id, manual_payment_instructions
    `, [
      Boolean(is_manual_payment_enabled),
      Boolean(is_upi_payment_enabled),
      Boolean(is_cod_enabled),
      upi_id || null,
      manual_payment_instructions || null
    ]);
  }

  if (!result || result.rows.length === 0) {
    return res.status(404).json({ message: 'Company not found' });
  }

  const row = result.rows[0];
  res.json({
    message: 'Payment settings updated successfully',
    settings: {
      is_manual_payment_enabled: !!row.is_manual_payment_enabled,
      is_upi_payment_enabled: !!row.is_upi_payment_enabled,
      is_cod_enabled: !!row.is_cod_enabled,
      upi_id: row.upi_id || '',
      manual_payment_instructions: row.manual_payment_instructions || ''
    }
  });
};

const getPublicPaymentOptions = async (req, res) => {
  await ensurePaymentColumns();
  const companyId = req.params.id;
  let result = await pool.query(`
    SELECT is_manual_payment_enabled, is_upi_payment_enabled, is_cod_enabled, upi_id, manual_payment_instructions
    FROM companies
    WHERE id = $1
  `, [companyId]);

  if (result.rows.length === 0) {
    result = await pool.query(`
      SELECT is_manual_payment_enabled, is_upi_payment_enabled, is_cod_enabled, upi_id, manual_payment_instructions
      FROM companies
      LIMIT 1
    `);
  }

  if (result.rows.length === 0) {
    return res.json({
      is_manual_payment_enabled: false,
      is_upi_payment_enabled: false,
      is_cod_enabled: false,
      upi_id: '',
      manual_payment_instructions: ''
    });
  }

  const row = result.rows[0];
  res.json({
    is_manual_payment_enabled: !!row.is_manual_payment_enabled,
    is_upi_payment_enabled: !!row.is_upi_payment_enabled,
    is_cod_enabled: !!row.is_cod_enabled,
    upi_id: row.upi_id || '',
    manual_payment_instructions: row.manual_payment_instructions || ''
  });
};

module.exports = {
  getPaymentSettings,
  updatePaymentSettings,
  getPublicPaymentOptions
};
