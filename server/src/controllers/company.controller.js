const pool = require('../../db/pool');

const getPaymentSettings = async (req, res) => {
  const companyId = req.user.companyId;

  const result = await pool.query(`
    SELECT is_manual_payment_enabled, is_upi_payment_enabled, is_cod_enabled, upi_id, manual_payment_instructions
    FROM companies
    WHERE id = $1
  `, [companyId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Company not found' });
  }

  res.json(result.rows[0]);
};

const updatePaymentSettings = async (req, res) => {
  const companyId = req.user.companyId;
  const { is_manual_payment_enabled, is_upi_payment_enabled, is_cod_enabled, upi_id, manual_payment_instructions } = req.body;

  const result = await pool.query(`
    UPDATE companies
    SET is_manual_payment_enabled = $1,
        is_upi_payment_enabled = $2,
        is_cod_enabled = $3,
        upi_id = $4,
        manual_payment_instructions = $5
    WHERE id = $6
    RETURNING is_manual_payment_enabled, is_upi_payment_enabled, is_cod_enabled, upi_id, manual_payment_instructions
  `, [
    is_manual_payment_enabled || false,
    is_upi_payment_enabled || false,
    is_cod_enabled || false,
    upi_id || null,
    manual_payment_instructions || null,
    companyId
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Company not found' });
  }

  res.json({ message: 'Payment settings updated successfully', settings: result.rows[0] });
};

const getPublicPaymentOptions = async (req, res) => {
  const companyId = req.params.id;
  const result = await pool.query(`
    SELECT is_manual_payment_enabled, is_upi_payment_enabled, is_cod_enabled, upi_id, manual_payment_instructions
    FROM companies
    WHERE id = $1
  `, [companyId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Company not found' });
  }

  res.json(result.rows[0]);
};

module.exports = {
  getPaymentSettings,
  updatePaymentSettings,
  getPublicPaymentOptions
};
