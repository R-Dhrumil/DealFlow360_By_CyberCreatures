const pool = require('../pool');

async function getQuotationsByCompany(companyId) {
  const result = await pool.query(`
    SELECT q.*, c.name as customer_name 
    FROM quotations q
    JOIN customers c ON q.customer_id = c.id
    WHERE q.company_id = $1
    ORDER BY q.updated_at DESC
  `, [companyId]);
  return result.rows;
}

async function createQuotation(companyId, customerId, salesRepId, status) {
  const result = await pool.query(`
    INSERT INTO quotations (company_id, customer_id, sales_rep_id, status)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [companyId, customerId, salesRepId, status]);
  return result.rows[0];
}

async function createQuotationLine(quotationId, productId, quantity, unitPrice, discountPercent, lineType) {
  const result = await pool.query(`
    INSERT INTO quotation_lines (quotation_id, product_id, quantity, unit_price, discount_percent, line_type)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [quotationId, productId, quantity, unitPrice, discountPercent, lineType]);
  return result.rows[0];
}

module.exports = {
  getQuotationsByCompany,
  createQuotation,
  createQuotationLine
};
