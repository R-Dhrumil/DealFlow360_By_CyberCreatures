const db = require('../config/db');
const { logAction } = require('../services/audit.service');

class QuotationRepository {
  async createQuotation(companyId, customerId, salesRepId, status = 'draft') {
    const result = await db.query(
      `INSERT INTO quotations (company_id, customer_id, sales_rep_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [companyId, customerId, salesRepId, status]
    );
    const newQuote = result.rows[0];
    if (newQuote) {
      await logAction('quotation', newQuote.id, salesRepId, 'created', { status });
    }
    return newQuote;
  }

  async createQuotationLine(quotationId, productId, quantity, unitPrice, discountPercent = 0, lineType = 'one_time') {
    const result = await db.query(
      `INSERT INTO quotation_lines (quotation_id, product_id, quantity, unit_price, discount_percent, line_type)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [quotationId, productId, quantity, unitPrice, discountPercent, lineType]
    );
    return result.rows[0];
  }

  async findByCompany(companyId) {
    const result = await db.query(
      `SELECT 
         q.id, q.status, q.blended_risk_score, q.created_at, q.updated_at,
         c.name as customer_name, c.email as customer_email,
         u.name as sales_rep_name,
         COALESCE(STRING_AGG(DISTINCT p.name, ', '), 'Custom Proposal') as product_summary,
         COALESCE(SUM(ql.unit_price * ql.quantity * (1 - ql.discount_percent/100)), 0) as total_amount,
         COUNT(ql.id) as lines_count
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       LEFT JOIN users u ON q.sales_rep_id = u.id
       LEFT JOIN quotation_lines ql ON q.id = ql.quotation_id
       LEFT JOIN products p ON ql.product_id = p.id
       WHERE q.company_id = $1
       GROUP BY q.id, c.name, c.email, u.name
       ORDER BY q.created_at DESC`,
      [companyId]
    );
    return result.rows;
  }

  async findByCustomer(customerId) {
    const result = await db.query(
      `SELECT 
         q.id, q.status, q.blended_risk_score, q.created_at, q.updated_at,
         c.name as customer_name, c.email as customer_email,
         u.name as sales_rep_name,
         COALESCE(STRING_AGG(DISTINCT p.name, ', '), 'Custom Proposal') as product_summary,
         COALESCE(SUM(ql.unit_price * ql.quantity * (1 - ql.discount_percent/100)), 0) as total_amount,
         COUNT(ql.id) as lines_count
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       LEFT JOIN users u ON q.sales_rep_id = u.id
       LEFT JOIN quotation_lines ql ON q.id = ql.quotation_id
       LEFT JOIN products p ON ql.product_id = p.id
       WHERE q.customer_id = $1
       GROUP BY q.id, c.name, c.email, u.name
       ORDER BY q.created_at DESC`,
      [customerId]
    );
    return result.rows;
  }

  async findAll() {
    const result = await db.query(
      `SELECT 
         q.id, q.status, q.blended_risk_score, q.created_at, q.updated_at,
         c.name as customer_name, c.email as customer_email,
         u.name as sales_rep_name,
         COALESCE(STRING_AGG(DISTINCT p.name, ', '), 'Custom Proposal') as product_summary,
         COALESCE(SUM(ql.unit_price * ql.quantity * (1 - ql.discount_percent/100)), 0) as total_amount,
         COUNT(ql.id) as lines_count
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       LEFT JOIN users u ON q.sales_rep_id = u.id
       LEFT JOIN quotation_lines ql ON q.id = ql.quotation_id
       LEFT JOIN products p ON ql.product_id = p.id
       GROUP BY q.id, c.name, c.email, u.name
       ORDER BY q.created_at DESC`
    );
    return result.rows;
  }

  async findDetailById(quotationId) {
    const qRes = await db.query(
      `SELECT 
         q.id, q.status, q.company_id, q.customer_id, q.sales_rep_id, q.blended_risk_score, q.created_at,
         c.name as customer_name, c.email as customer_email,
         u.name as sales_rep_name,
         comp.name as company_name, comp.logo_url as company_logo
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       LEFT JOIN users u ON q.sales_rep_id = u.id
       LEFT JOIN companies comp ON q.company_id = comp.id
       WHERE q.id = $1`,
      [quotationId]
    );

    if (qRes.rows.length === 0) return null;
    const quote = qRes.rows[0];

    const linesRes = await db.query(
      `SELECT ql.*, p.name as product_name, p.category, p.margin_percent
       FROM quotation_lines ql
       JOIN products p ON ql.product_id = p.id
       WHERE ql.quotation_id = $1`,
      [quotationId]
    );

    quote.lines = linesRes.rows;
    return quote;
  }

  async findByIdAndCompany(quotationId, companyId) {
    const result = await db.query(
      'SELECT * FROM quotations WHERE id = $1 AND company_id = $2',
      [quotationId, companyId]
    );
    return result.rows[0] || null;
  }

  async findQuotationLinesWithCategory(quotationId) {
    const result = await db.query(
      `SELECT ql.*, p.name as product_name, p.category, p.margin_percent 
       FROM quotation_lines ql
       JOIN products p ON ql.product_id = p.id
       WHERE ql.quotation_id = $1`,
      [quotationId]
    );
    return result.rows;
  }

  async updateQuotationStatusAndScore(quotationId, status, blendedRiskScore) {
    const result = await db.query(
      `UPDATE quotations 
       SET status = $1, blended_risk_score = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, blendedRiskScore, quotationId]
    );
    const updatedQuotation = result.rows[0];

    if (updatedQuotation) {
      await logAction('quotation', quotationId, null, 'status_updated', { status, risk_score: blendedRiskScore });
      
      // Auto-generate Order and Invoice if confirmed
      if (status === 'confirmed') {
        try {
          // Create Order
          const orderRes = await db.query(
            `INSERT INTO orders (company_id, quotation_id, status) VALUES ($1, $2, 'pending_fulfillment') ON CONFLICT (quotation_id) DO NOTHING RETURNING id`,
            [updatedQuotation.company_id, quotationId]
          );
          
          if (orderRes.rows[0]) {
            // Sum quotation lines for invoice amount
            const linesRes = await db.query(`SELECT SUM(unit_price * quantity * (1 - discount_percent/100)) as total FROM quotation_lines WHERE quotation_id = $1`, [quotationId]);
            const totalAmount = linesRes.rows[0]?.total || 0;

            // Create Invoice
            await db.query(
              `INSERT INTO invoices (company_id, order_id, amount, status) VALUES ($1, $2, $3, 'unpaid')`,
              [updatedQuotation.company_id, orderRes.rows[0].id, totalAmount]
            );
            await logAction('order', orderRes.rows[0].id, null, 'auto_created_from_quote', { quotation_id: quotationId });
          }
        } catch (err) {
          console.error('[System] Error auto-generating order/invoice:', err);
        }
      }
    }
    
    return updatedQuotation;
  }
}

module.exports = new QuotationRepository();
