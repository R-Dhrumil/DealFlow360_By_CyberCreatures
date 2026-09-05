const pool = require('../pool');

async function getPendingApprovals(companyId) {
  const result = await pool.query(`
    SELECT q.id, q.status, q.blended_risk_score, q.created_at,
           c.name as customer_name,
           u.name as rep_name
    FROM quotations q
    JOIN customers c ON q.customer_id = c.id
    JOIN users u ON q.sales_rep_id = u.id
    WHERE q.company_id = $1 AND q.status = 'pending_approval'
    ORDER BY q.created_at ASC
  `, [companyId]);
  return result.rows;
}

async function getQuotationLines(quotationId) {
  const result = await pool.query(`
    SELECT ql.*, p.name as product_name, p.category, p.margin_percent
    FROM quotation_lines ql
    JOIN products p ON ql.product_id = p.id
    WHERE ql.quotation_id = $1
  `, [quotationId]);
  return result.rows;
}

async function logApprovalAction(quotationId, approverId, action, reason) {
  await pool.query(`
    INSERT INTO approvals_log (quotation_id, approver_id, action, reason)
    VALUES ($1, $2, $3, $4)
  `, [quotationId, approverId, action, reason]);
}

async function updateQuotationStatus(quotationId, status) {
  await pool.query(`
    UPDATE quotations
    SET status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
  `, [status, quotationId]);
}

module.exports = {
  getPendingApprovals,
  getQuotationLines,
  logApprovalAction,
  updateQuotationStatus
};
