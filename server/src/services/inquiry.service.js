/**
 * inquiry.service.js
 *
 * Manages the Inquiry lifecycle:
 *  - Customer creates an inquiry (via marketplace or customer portal)
 *  - All eligible sales reps are notified
 *  - Each rep independently creates a quotation linked to the inquiry
 */
const db = require('../config/db');
const crypto = require('crypto');
const ApiError = require('../utils/apiError');
const { logAction } = require('./audit.service');
const {
  emitCompanyRoleNotification,
  emitUserNotification,
  broadcastPipelineUpdate
} = require('./socket.service');

class InquiryService {
  /**
   * Create a new inquiry from a customer product request.
   * Notifies all sales reps and managers of the company.
   */
  async createInquiry(companyId, customerId, productId, quantity, notes = '') {
    // Validate product belongs to company
    const prodRes = await db.query(
      'SELECT id, name, base_price, floor_price FROM products WHERE id = $1 AND company_id = $2',
      [productId, companyId]
    );
    if (prodRes.rows.length === 0) {
      throw ApiError.notFound('Product not found or does not belong to company');
    }
    const product = prodRes.rows[0];

    // Validate customer exists
    const custRes = await db.query(
      'SELECT id, name, customer_tier FROM customers WHERE id = $1',
      [customerId]
    );
    if (custRes.rows.length === 0) {
      throw ApiError.notFound('Customer not found');
    }
    const customer = custRes.rows[0];

    // Create inquiry
    const inquiryId = 'inq_' + crypto.randomUUID().substring(0, 8);
    const result = await db.query(
      `INSERT INTO inquiries (id, company_id, customer_id, product_id, quantity, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'open')
       RETURNING *`,
      [inquiryId, companyId, customerId, productId, Math.max(1, parseInt(quantity) || 1), notes]
    );
    const inquiry = result.rows[0];

    await logAction('inquiry', inquiryId, customerId, 'created', {
      product_name: product.name,
      quantity,
      customer_tier: customer.customer_tier
    });

    // Notify all sales reps + managers of this company
    emitCompanyRoleNotification(companyId, ['sales_rep', 'sales_manager', 'admin'], {
      type: 'info',
      title: '📋 New Customer Inquiry',
      message: `${customer.name} requested a quote for ${product.name} (Qty: ${quantity}).`,
      link: `/app/inquiries`
    });

    return { inquiry, product, customer };
  }

  /**
   * Get inquiries for a company, filtered by role:
   * - sales_rep: open inquiries for their company (all, since any rep can respond)
   * - sales_manager / admin: all inquiries
   */
  async getInquiries(companyId, role, limit = 50, offset = 0) {
    const countRes = await db.query(
      `SELECT COUNT(*) FROM inquiries WHERE company_id = $1 AND status != 'cancelled'`,
      [companyId]
    );
    const totalCount = parseInt(countRes.rows[0].count, 10);

    const result = await db.query(
      `SELECT 
         i.id, i.status, i.quantity, i.notes, i.created_at, i.updated_at,
         c.id as customer_id, c.name as customer_name, c.email as customer_email,
         c.customer_tier,
         p.id as product_id, p.name as product_name, p.category as product_category,
         p.base_price, p.floor_price,
         (SELECT COUNT(*) FROM quotations q WHERE q.inquiry_id = i.id) as quotation_count
       FROM inquiries i
       JOIN customers c ON i.customer_id = c.id
       JOIN products p ON i.product_id = p.id
       WHERE i.company_id = $1 AND i.status != 'cancelled'
       ORDER BY i.created_at DESC
       LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );

    return { data: result.rows, totalCount };
  }

  /**
   * Get a single inquiry with all its quotations.
   */
  async getInquiryWithQuotations(inquiryId, companyId) {
    const result = await db.query(
      `SELECT 
         i.*, 
         c.name as customer_name, c.email as customer_email, c.customer_tier,
         p.name as product_name, p.category as product_category,
         p.base_price, p.floor_price
       FROM inquiries i
       JOIN customers c ON i.customer_id = c.id
       JOIN products p ON i.product_id = p.id
       WHERE i.id = $1 AND i.company_id = $2`,
      [inquiryId, companyId]
    );
    if (result.rows.length === 0) {
      throw ApiError.notFound('Inquiry not found');
    }
    const inquiry = result.rows[0];

    // Get all quotations for this inquiry
    const quotationsRes = await db.query(
      `SELECT 
         q.id, q.status, q.approval_level, q.blended_risk_score, q.created_at, q.updated_at,
         u.name as sales_rep_name, u.role as sales_rep_role,
         COALESCE(SUM(ql.unit_price * ql.quantity * (1 - ql.discount_percent/100)), 0) as total_amount,
         COALESCE(MAX(ql.discount_percent), 0) as max_discount
       FROM quotations q
       LEFT JOIN users u ON q.sales_rep_id = u.id
       LEFT JOIN quotation_lines ql ON q.id = ql.quotation_id
       WHERE q.inquiry_id = $1
       GROUP BY q.id, u.name, u.role
       ORDER BY q.created_at ASC`,
      [inquiryId]
    );
    inquiry.quotations = quotationsRes.rows;

    return inquiry;
  }

  /**
   * Close an inquiry (when all quotations are sent or cancelled).
   */
  async closeInquiry(inquiryId, companyId) {
    const result = await db.query(
      `UPDATE inquiries SET status = 'closed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND company_id = $2 RETURNING *`,
      [inquiryId, companyId]
    );
    return result.rows[0];
  }

  /**
   * Mark inquiry in_progress when first quotation is created.
   */
  async markInProgress(inquiryId) {
    await db.query(
      `UPDATE inquiries SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND status = 'open'`,
      [inquiryId]
    );
  }
}

module.exports = new InquiryService();
