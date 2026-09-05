const db = require('../config/db');
const crypto = require('crypto');

class ApprovalRepository {
  /**
   * Get pending quotations filtered by status array.
   * If repId is provided, only return that rep's quotations (for sales_rep role).
   */
  async getPendingApprovalsByStatusFilter(companyId, statusFilter, repId = null) {
    let query = `
      SELECT 
        q.*,
        q.approval_level,
        q.inquiry_id,
        c.name as customer_name,
        c.customer_tier,
        u.name as rep_name,
        u.role as rep_role,
        COALESCE(SUM(ql.unit_price * ql.quantity * (1 - ql.discount_percent/100)), 0) as total_amount,
        COALESCE(MAX(ql.discount_percent), 0) as max_discount_applied
      FROM quotations q
      JOIN customers c ON q.customer_id = c.id
      JOIN users u ON q.sales_rep_id = u.id
      LEFT JOIN quotation_lines ql ON q.id = ql.quotation_id
      WHERE q.company_id = $1 AND q.status = ANY($2)
    `;
    const params = [companyId, statusFilter];

    if (repId) {
      query += ` AND q.sales_rep_id = $${params.length + 1}`;
      params.push(repId);
    }

    query += ' GROUP BY q.id, c.name, c.customer_tier, u.name, u.role ORDER BY q.created_at ASC';

    const result = await db.query(query, params);
    return result.rows;
  }

  async getCustomerTierCeiling(companyId, customerId) {
    // First get customer tier
    const custRes = await db.query(
      'SELECT customer_tier FROM customers WHERE id = $1',
      [customerId]
    );
    const tier = custRes.rows[0]?.customer_tier;

    if (tier) {
      const tierRes = await db.query(
        'SELECT max_discount_percent FROM discount_tiers WHERE company_id = $1 AND tier_name = $2',
        [companyId, tier]
      );
      if (tierRes.rows.length > 0) {
        return parseFloat(tierRes.rows[0].max_discount_percent);
      }
    }

    // Fall back to any tier ceiling for the company
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
      'SELECT category, max_discount_percent FROM category_discount_ceiling WHERE company_id = $1',
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
      'INSERT INTO approvals_log (id, quotation_id, approver_id, action, reason) VALUES ($1, $2, $3, $4, $5)',
      [logId, quotationId, approverId, action, reason]
    );
  }

  async updateQuotationStatus(quotationId, status) {
    await db.query(
      'UPDATE quotations SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, quotationId]
    );
  }

  // ── Dashboard Stats ──────────────────────────────────────────────────────────

  async getRepQuotationStats(companyId, repId) {
    const result = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status != 'rejected') as my_quotations,
         COUNT(*) FILTER (WHERE status = 'draft') as my_drafts,
         COUNT(*) FILTER (WHERE status IN ('pending_approval','pending_finance_approval','pending_admin_approval')) as pending_approval,
         COUNT(*) FILTER (WHERE status = 'approved') as approved,
         COUNT(*) FILTER (WHERE status = 'rejected') as rejected
       FROM quotations
       WHERE company_id = $1 AND sales_rep_id = $2`,
      [companyId, repId]
    );
    return result.rows[0] || {};
  }

  async getManagerApprovalStats(companyId) {
    const result = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending_approval') as pending_approval,
         COUNT(*) FILTER (WHERE status = 'pending_admin_approval') as pending_admin_approval,
         COUNT(*) FILTER (WHERE status = 'approved') as approved,
         COUNT(*) FILTER (WHERE status = 'rejected') as rejected
       FROM quotations
       WHERE company_id = $1`,
      [companyId]
    );
    return result.rows[0] || {};
  }

  async getAdminApprovalStats(companyId) {
    const result = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending_admin_approval') as pending_admin_approval,
         COUNT(*) FILTER (WHERE status = 'pending_approval') as pending_approval,
         COUNT(*) FILTER (WHERE status = 'approved') as approved,
         COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
         COUNT(*) FILTER (WHERE status NOT IN ('rejected','confirmed')) as total_active
       FROM quotations
       WHERE company_id = $1`,
      [companyId]
    );
    return result.rows[0] || {};
  }

  // ── Discount Tier Config ─────────────────────────────────────────────────────

  async getDiscountTiers(companyId) {
    const result = await db.query(
      'SELECT * FROM discount_tiers WHERE company_id = $1 ORDER BY tier_name',
      [companyId]
    );
    return result.rows;
  }

  async upsertDiscountTier(companyId, tierName, maxDiscountPercent, minMarginPercent = null, approver = null) {
    const id = 'dt_' + crypto.randomUUID().substring(0, 8);
    const result = await db.query(
      `INSERT INTO discount_tiers (id, company_id, tier_name, max_discount_percent, min_margin_percent, approver)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (company_id, tier_name)
       DO UPDATE SET 
         max_discount_percent = EXCLUDED.max_discount_percent,
         min_margin_percent = COALESCE(EXCLUDED.min_margin_percent, discount_tiers.min_margin_percent),
         approver = COALESCE(EXCLUDED.approver, discount_tiers.approver)
       RETURNING *`,
      [id, companyId, tierName, maxDiscountPercent, minMarginPercent, approver]
    );
    return result.rows[0];
  }

  async getCategoryDiscounts(companyId) {
    const result = await db.query(
      'SELECT * FROM category_discount_ceiling WHERE company_id = $1 ORDER BY category',
      [companyId]
    );
    return result.rows;
  }

  async upsertCategoryDiscount(companyId, category, maxDiscountPercent) {
    const id = 'cdc_' + crypto.randomUUID().substring(0, 8);
    const result = await db.query(
      `INSERT INTO category_discount_ceiling (id, company_id, category, max_discount_percent)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (company_id, category)
       DO UPDATE SET max_discount_percent = EXCLUDED.max_discount_percent
       RETURNING *`,
      [id, companyId, category, maxDiscountPercent]
    );
    return result.rows[0];
  }
}

module.exports = new ApprovalRepository();
