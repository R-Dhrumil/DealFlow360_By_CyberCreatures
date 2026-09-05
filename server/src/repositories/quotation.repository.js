const db = require('../config/db');
const crypto = require('crypto');
const { logAction } = require('../services/audit.service');

class QuotationRepository {
  async createQuotation(companyId, customerId, salesRepId, status = 'draft', client = db) {
    const qId = 'q_' + Math.floor(1000 + Math.random() * 9000);
    const result = await client.query(
      `INSERT INTO quotations (id, company_id, customer_id, sales_rep_id, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [qId, companyId, customerId, salesRepId, status]
    );
    const newQuote = result.rows[0];
    if (newQuote) {
      await logAction('quotation', newQuote.id, salesRepId, 'created', { status });
    }
    return newQuote;
  }

  async createQuotationLine(quotationId, productId, quantity, unitPrice, discountPercent = 0, lineType = 'one_time', client = db) {
    const qlId = 'ql_' + crypto.randomUUID();
    const result = await client.query(
      `INSERT INTO quotation_lines (id, quotation_id, product_id, quantity, unit_price, discount_percent, line_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [qlId, quotationId, productId, quantity, unitPrice, discountPercent, lineType]
    );
    return result.rows[0];
  }

  async findByCompany(companyId, limit = 50, offset = 0) {
    const countRes = await db.query('SELECT COUNT(*) FROM quotations WHERE company_id = $1', [companyId]);
    const totalCount = parseInt(countRes.rows[0].count, 10);

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
       ORDER BY q.created_at DESC
       LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );
    return { data: result.rows, totalCount };
  }

  async findByCompanyAndSalesRep(companyId, salesRepId, limit = 50, offset = 0) {
    const countRes = await db.query('SELECT COUNT(*) FROM quotations WHERE company_id = $1 AND sales_rep_id = $2', [companyId, salesRepId]);
    const totalCount = parseInt(countRes.rows[0].count, 10);

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
       WHERE q.company_id = $1 AND q.sales_rep_id = $2
       GROUP BY q.id, c.name, c.email, u.name
       ORDER BY q.created_at DESC
       LIMIT $3 OFFSET $4`,
      [companyId, salesRepId, limit, offset]
    );
    return { data: result.rows, totalCount };
  }

  async findByCustomer(customerId, limit = 50, offset = 0) {
    const countRes = await db.query('SELECT COUNT(*) FROM quotations WHERE customer_id = $1', [customerId]);
    const totalCount = parseInt(countRes.rows[0].count, 10);

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
       ORDER BY q.created_at DESC
       LIMIT $2 OFFSET $3`,
      [customerId, limit, offset]
    );
    return { data: result.rows, totalCount };
  }

  async findAll(limit = 50, offset = 0) {
    const countRes = await db.query('SELECT COUNT(*) FROM quotations');
    const totalCount = parseInt(countRes.rows[0].count, 10);

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
       ORDER BY q.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return { data: result.rows, totalCount };
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

    const logRes = await db.query(
      `SELECT al.*, u.name as approver_name
       FROM approvals_log al
       LEFT JOIN users u ON al.approver_id = u.id
       WHERE al.quotation_id = $1
       ORDER BY al.timestamp DESC`,
      [quotationId]
    );

    quote.lines = linesRes.rows;
    quote.approval_history = logRes.rows;
    return quote;
  }

  async getNegotiationMessages(quotationId) {
    const crypto = require('crypto');
    const res = await db.query(
      `SELECT id, quotation_id, sender_type, message as content, message, counter_discount, timestamp as created_at, timestamp
       FROM negotiation_messages
       WHERE quotation_id = $1
       ORDER BY timestamp ASC`,
      [quotationId]
    );
    return res.rows;
  }

  async createNegotiationMessage(quotationId, senderType, message, counterDiscount = null) {
    const msgId = 'msg_' + crypto.randomUUID();
    const normalizedSenderType = (senderType === 'sales_rep' || senderType === 'rep') ? 'rep' : 'customer';
    const res = await db.query(
      `INSERT INTO negotiation_messages (id, quotation_id, sender_type, message, counter_discount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, quotation_id, sender_type, message as content, message, counter_discount, timestamp as created_at, timestamp`,
      [msgId, quotationId, normalizedSenderType, message, counterDiscount]
    );
    return res.rows[0];
  }

  async findByIdAndCompany(quotationId, companyId) {
    const result = await db.query(
      'SELECT * FROM quotations WHERE id = $1 AND company_id = $2',
      [quotationId, companyId]
    );
    return result.rows[0] || null;
  }

  async findByIdAndCompanyForUpdate(quotationId, companyId, client) {
    const result = await client.query(
      companyId 
        ? 'SELECT * FROM quotations WHERE id = $1 AND company_id = $2 FOR UPDATE'
        : 'SELECT * FROM quotations WHERE id = $1 FOR UPDATE',
      companyId ? [quotationId, companyId] : [quotationId]
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

  async updateQuotationStatusAndScore(quotationId, status, blendedRiskScore, client = db) {
    const result = await client.query(
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
          const orderRes = await client.query(
            `INSERT INTO orders (company_id, quotation_id, status) VALUES ($1, $2, 'pending_fulfillment') ON CONFLICT (quotation_id) DO NOTHING RETURNING id`,
            [updatedQuotation.company_id, quotationId]
          );
          
          if (orderRes.rows[0]) {
            // Sum quotation lines for invoice amount
            const linesRes = await client.query(`SELECT SUM(unit_price * quantity * (1 - discount_percent/100)) as total FROM quotation_lines WHERE quotation_id = $1`, [quotationId]);
            const totalAmount = linesRes.rows[0]?.total || 0;

            // Create Invoice
            await client.query(
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
