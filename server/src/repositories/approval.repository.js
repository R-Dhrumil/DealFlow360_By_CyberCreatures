const db = require('../config/db');
const crypto = require('crypto');

class ApprovalRepository {
  async getPendingApprovalsByStatusFilter(companyId, statusFilter) {
    const result = await db.query(
      `SELECT q.*, c.name as customer_name, u.name as rep_name
       FROM quotations q
       JOIN customers c ON q.customer_id = c.id
       JOIN users u ON q.sales_rep_id = u.id
       WHERE q.company_id = $1 AND q.status = ANY($2)
       ORDER BY q.created_at ASC`,
      [companyId, statusFilter]
    );
    return result.rows;
  }

  async getCustomerTierCeiling(companyId, customerId) {
    const result = await db.query(
      `SELECT pl.customer_tier, dt.max_discount_percent
       FROM price_lists pl
       JOIN discount_tiers dt ON pl.company_id = dt.company_id AND pl.customer_tier = dt.tier_name
       WHERE pl.company_id = $1
       LIMIT 1`,
      [companyId]
    );
    if (result.rows.length > 0) {
      return parseFloat(result.rows[0].max_discount_percent);
    }
    return 5.0; // Fallback
  }

  async getCategoryCeilings(companyId) {
    const result = await db.query(
      `SELECT category, max_discount_percent
       FROM category_discount_ceiling
       WHERE company_id = $1`,
      [companyId]
    );
    const ceilings = {};
    result.rows.forEach(row => {
      ceilings[row.category] = parseFloat(row.max_discount_percent);
    });
    return ceilings;
  }

  async getApprovalChains(companyId) {
    const result = await db.query(
      `SELECT min_discount, max_discount, requires_manager, requires_finance
       FROM approval_chains
       WHERE company_id = $1
       ORDER BY min_discount ASC`,
      [companyId]
    );
    return result.rows;
  }

  async logApprovalAction(quotationId, approverId, action, reason) {
    const logId = 'appr_' + crypto.randomUUID();
    await db.query(
      `INSERT INTO approvals_log (id, quotation_id, approver_id, action, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [logId, quotationId, approverId, action, reason]
    );
  }

  async updateQuotationStatus(quotationId, status) {
    await db.query(
      `UPDATE quotations
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [status, quotationId]
    );
  }
}

module.exports = new ApprovalRepository();
