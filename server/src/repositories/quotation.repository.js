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
         COALESCE(SUM(ql.unit_price * ql.quantity), 0) as base_amount,
         COALESCE(SUM(ql.unit_price * ql.quantity * (ql.discount_percent/100)), 0) as total_discount,
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
         COALESCE(SUM(ql.unit_price * ql.quantity), 0) as base_amount,
         COALESCE(SUM(ql.unit_price * ql.quantity * (ql.discount_percent/100)), 0) as total_discount,
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

  async findByCustomer(customerId, customerEmail = null, customerName = null, limit = 50, offset = 0) {
    const cleanEmail = customerEmail ? customerEmail.trim().toLowerCase() : null;
    const emailDomain = cleanEmail && cleanEmail.includes('@') ? cleanEmail.split('@')[1] : null;
    const cleanName = customerName ? customerName.trim() : null;

    const countRes = await db.query(
      `SELECT COUNT(*) as count FROM (
         SELECT q.id FROM quotations q 
         LEFT JOIN customers c ON q.customer_id = c.id
         WHERE ($1::text IS NOT NULL AND q.customer_id = $1::text)
            OR ($2::text IS NOT NULL AND LOWER(c.email) = LOWER($2::text))
            OR ($3::text IS NOT NULL AND c.name IS NOT NULL AND TRIM(c.name) != '' AND (
                  LOWER(c.name) ILIKE '%' || LOWER($3::text) || '%'
               OR LOWER($3::text) ILIKE '%' || LOWER(c.name) || '%'
            ))
            OR ($4::text IS NOT NULL AND LOWER(c.email) ILIKE '%@' || $4::text)
         UNION ALL
         SELECT i.id FROM inquiries i
         LEFT JOIN customers c ON i.customer_id = c.id
         WHERE (($1::text IS NOT NULL AND i.customer_id = $1::text)
            OR ($2::text IS NOT NULL AND LOWER(c.email) = LOWER($2::text))
            OR ($3::text IS NOT NULL AND c.name IS NOT NULL AND TRIM(c.name) != '' AND (
                  LOWER(c.name) ILIKE '%' || LOWER($3::text) || '%'
               OR LOWER($3::text) ILIKE '%' || LOWER(c.name) || '%'
            ))
            OR ($4::text IS NOT NULL AND LOWER(c.email) ILIKE '%@' || $4::text))
            AND (i.status IS NULL OR i.status NOT IN ('in_progress', 'converted', 'closed', 'completed'))
            AND NOT EXISTS (SELECT 1 FROM quotations q WHERE q.inquiry_id = i.id OR q.customer_id = i.customer_id)
        ) as total`,
      [customerId || null, cleanEmail, cleanName, emailDomain]
    );
    const totalCount = parseInt(countRes.rows[0]?.count || 0, 10);

    const result = await db.query(
      `SELECT * FROM (
         SELECT 
           q.id, q.status, q.blended_risk_score, q.created_at, q.updated_at,
           c.name as customer_name, c.email as customer_email, c.customer_tier,
           u.name as sales_rep_name,
           u.role as sales_rep_role,
           COALESCE(STRING_AGG(DISTINCT p.name, ', '), 'Custom Proposal') as product_summary,
           COALESCE(SUM(ql.unit_price * ql.quantity * (1 - ql.discount_percent/100)), 0) as total_amount,
           COALESCE(SUM(ql.unit_price * ql.quantity), 0) as base_amount,
           COALESCE(SUM(ql.unit_price * ql.quantity * (ql.discount_percent/100)), 0) as total_discount,
           COUNT(ql.id) as lines_count,
           q.approval_level,
           latest_appr.approver_name,
           latest_appr.reason as approval_reason,
           latest_appr.action as approval_action,
           latest_appr.timestamp as approval_timestamp
         FROM quotations q
         LEFT JOIN customers c ON q.customer_id = c.id
         LEFT JOIN users u ON q.sales_rep_id = u.id
         LEFT JOIN quotation_lines ql ON q.id = ql.quotation_id
         LEFT JOIN products p ON ql.product_id = p.id
         LEFT JOIN LATERAL (
           SELECT al.action, al.reason, al.timestamp, au.name as approver_name
           FROM approvals_log al
           LEFT JOIN users au ON al.approver_id = au.id
           WHERE al.quotation_id = q.id
           ORDER BY al.timestamp DESC
           LIMIT 1
         ) latest_appr ON true
         WHERE ($1::text IS NOT NULL AND q.customer_id = $1::text)
            OR ($2::text IS NOT NULL AND LOWER(c.email) = LOWER($2::text))
            OR ($3::text IS NOT NULL AND c.name IS NOT NULL AND TRIM(c.name) != '' AND (
                  LOWER(c.name) ILIKE '%' || LOWER($3::text) || '%'
               OR LOWER($3::text) ILIKE '%' || LOWER(c.name) || '%'
            ))
            OR ($4::text IS NOT NULL AND LOWER(c.email) ILIKE '%@' || $4::text)
         GROUP BY q.id, c.name, c.email, c.customer_tier, u.name, u.role, q.approval_level,
                  latest_appr.approver_name, latest_appr.reason, latest_appr.action, latest_appr.timestamp
         
         UNION ALL
         
         SELECT 
           i.id, 'pending_rep_quote' as status, 0 as blended_risk_score, i.created_at, i.updated_at,
           c.name as customer_name, c.email as customer_email, c.customer_tier,
           'Pending Assignment' as sales_rep_name,
           'sales_rep' as sales_rep_role,
           p.name as product_summary,
           (p.base_price * i.quantity) as total_amount,
           (p.base_price * i.quantity) as base_amount,
           0 as total_discount,
           1 as lines_count,
           NULL as approval_level,
           NULL as approver_name,
           NULL as approval_reason,
           NULL as approval_action,
           NULL as approval_timestamp
         FROM inquiries i
         LEFT JOIN customers c ON i.customer_id = c.id
         LEFT JOIN products p ON i.product_id = p.id
         WHERE (($1::text IS NOT NULL AND i.customer_id = $1::text)
            OR ($2::text IS NOT NULL AND LOWER(c.email) = LOWER($2::text))
            OR ($3::text IS NOT NULL AND c.name IS NOT NULL AND TRIM(c.name) != '' AND (
                  LOWER(c.name) ILIKE '%' || LOWER($3::text) || '%'
               OR LOWER($3::text) ILIKE '%' || LOWER(c.name) || '%'
            ))
            OR ($4::text IS NOT NULL AND LOWER(c.email) ILIKE '%@' || $4::text))
            AND (i.status IS NULL OR i.status NOT IN ('in_progress', 'converted', 'closed', 'completed'))
           AND NOT EXISTS (SELECT 1 FROM quotations q WHERE q.inquiry_id = i.id OR q.customer_id = i.customer_id)
       ) as combined
       ORDER BY 
         COALESCE(updated_at, created_at) DESC,
         created_at DESC
       LIMIT $5 OFFSET $6`,
      [customerId || null, cleanEmail, cleanName, emailDomain, limit, offset]
    );
    return { data: result.rows, totalCount };
  }

  async findAllQuotations(limit = 50, offset = 0) {
    const countRes = await db.query('SELECT COUNT(*) FROM quotations');
    const totalCount = parseInt(countRes.rows[0]?.count || 0, 10);

    const result = await db.query(
      `SELECT 
         q.id, q.status, q.blended_risk_score, q.created_at, q.updated_at,
         c.name as customer_name, c.email as customer_email,
         u.name as sales_rep_name,
         comp.name as company_name,
         COALESCE(STRING_AGG(DISTINCT p.name, ', '), 'Custom Proposal') as product_summary,
         COALESCE(SUM(ql.unit_price * ql.quantity * (1 - ql.discount_percent/100)), 0) as total_amount,
         COALESCE(SUM(ql.unit_price * ql.quantity), 0) as base_amount,
         COALESCE(SUM(ql.unit_price * ql.quantity * (ql.discount_percent/100)), 0) as total_discount,
         COUNT(ql.id) as lines_count
       FROM quotations q
       LEFT JOIN customers c ON q.customer_id = c.id
       LEFT JOIN users u ON q.sales_rep_id = u.id
       LEFT JOIN companies comp ON q.company_id = comp.id
       LEFT JOIN quotation_lines ql ON q.id = ql.quotation_id
       LEFT JOIN products p ON ql.product_id = p.id
       GROUP BY q.id, c.name, c.email, u.name, comp.name
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
         q.approval_level, q.inquiry_id,
         c.name as customer_name, c.email as customer_email, c.customer_tier,
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
    quote.total_amount = linesRes.rows.reduce(
      (sum, l) => sum + (parseFloat(l.unit_price) * parseInt(l.quantity, 10) * (1 - parseFloat(l.discount_percent || 0) / 100)),
      0
    );

    // Check if there is a newer quotation for the same customer/account
    try {
      const newerRes = await db.query(
        `SELECT id, created_at, status 
         FROM quotations 
         WHERE customer_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [quote.customer_id]
      );
      if (newerRes.rows.length > 0) {
        quote.latest_quotation_id = newerRes.rows[0].id;
        quote.is_latest = (newerRes.rows[0].id === quote.id);
      } else {
        quote.latest_quotation_id = quote.id;
        quote.is_latest = true;
      }
    } catch (e) {
      quote.latest_quotation_id = quote.id;
      quote.is_latest = true;
    }

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
      `SELECT ql.*, p.name as product_name, p.category, p.margin_percent, p.floor_price
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

  // ─────────────────────────────────────────────────────────────────────────────
  //  New semantic methods — Phase 5 backend layering
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Fetch quotation lines joined with product floor prices for floor-price validation.
   */
  async findLinesForFloorCheck(quotationId) {
    const result = await db.query(
      `SELECT ql.product_id, ql.unit_price, ql.quantity, ql.discount_percent,
              p.name as product_name, p.floor_price,
              (ql.unit_price * (1 - ql.discount_percent / 100)) as net_unit_price,
              (ql.unit_price * ql.quantity * (1 - ql.discount_percent / 100)) as line_total
       FROM quotation_lines ql
       JOIN products p ON ql.product_id = p.id
       WHERE ql.quotation_id = $1`,
      [quotationId]
    );
    return result.rows;
  }

  /**
   * Fetch line-level discount percents for authority checking.
   */
  async findLineDiscounts(quotationId) {
    const result = await db.query(
      'SELECT product_id, discount_percent FROM quotation_lines WHERE quotation_id = $1',
      [quotationId]
    );
    return result.rows;
  }

  /**
   * Fetch quotation lines with full product data (name, floor_price, net_unit_price).
   * Used during approval checks.
   */
  async findLinesWithProducts(quotationId, client = db) {
    const result = await client.query(
      `SELECT ql.*, p.name as product_name, p.floor_price,
              (ql.unit_price * (1 - ql.discount_percent / 100)) as net_unit_price
       FROM quotation_lines ql
       JOIN products p ON ql.product_id = p.id
       WHERE ql.quotation_id = $1`,
      [quotationId]
    );
    return result.rows;
  }

  /**
   * PERF-01 FIX: Batch update line items using a single UNNEST-based SQL statement.
   * Replaces the N+1 sequential UPDATE loop with 1 query regardless of line count.
   *
   * @param {string} quotationId
   * @param {Array<{id: string, discountPercent?: number, quantity?: number}>} lines
   * @param {object} client - DB client or pool (for transactional use)
   */
  async batchUpdateLineItems(quotationId, lines, client = db) {
    if (!lines || lines.length === 0) return;

    const ids = [];
    const discounts = [];
    const quantities = [];

    for (const l of lines) {
      ids.push(l.id);
      discounts.push(Math.max(0, Math.min(100, parseFloat(l.discountPercent || l.discount_percent || 0))));
      quantities.push(Math.max(1, parseInt(l.quantity, 10) || 1));
    }

    await client.query(
      `UPDATE quotation_lines AS ql SET
         discount_percent = batch.discount,
         quantity = batch.qty
       FROM (
         SELECT UNNEST($1::varchar[]) AS id,
                UNNEST($2::numeric[]) AS discount,
                UNNEST($3::int[]) AS qty
       ) AS batch
       WHERE ql.id = batch.id AND ql.quotation_id = $4`,
      [ids, discounts, quantities, quotationId]
    );
  }

  /**
   * Update quotation status, risk score, and approval level in one query.
   */
  async updateStatusAndApproval(quotationId, status, blendedRiskScore, approvalLevel, client = db) {
    const result = await client.query(
      `UPDATE quotations
       SET status = $1, blended_risk_score = $2, approval_level = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [status, blendedRiskScore, approvalLevel, quotationId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find the most recent quotation for a given customer.
   */
  async findLatestByCustomer(customerId) {
    const result = await db.query(
      'SELECT id FROM quotations WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 1',
      [customerId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find the most recent quotation for a given company.
   */
  async findLatestByCompany(companyId) {
    const result = await db.query(
      'SELECT id FROM quotations WHERE company_id = $1 ORDER BY created_at DESC LIMIT 1',
      [companyId]
    );
    return result.rows[0] || null;
  }

  /**
   * Find the most recent quotation across all companies.
   */
  async findLatestGlobal() {
    const result = await db.query(
      'SELECT id FROM quotations ORDER BY created_at DESC LIMIT 1'
    );
    return result.rows[0] || null;
  }

  /**
   * Create a quotation record with explicit fields (for transactional creation).
   */
  async createQuotationRecord({ id, companyId, customerId, salesRepId, status = 'draft', inquiryId = null, discountPercent = 0 }, client = db) {
    const qId = id || ('q_' + Math.floor(1000 + Math.random() * 9000));
    const result = await client.query(
      `INSERT INTO quotations (id, company_id, customer_id, sales_rep_id, status, inquiry_id, discount_percent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [qId, companyId, customerId, salesRepId, status, inquiryId || null, discountPercent]
    );
    return result.rows[0];
  }

  /**
   * Create multiple quotation lines (for transactional creation).
   */
  async createQuotationLines(lines, client = db) {
    if (!lines || lines.length === 0) return [];
    const inserted = [];
    for (const line of lines) {
      const qlId = line.id || ('ql_' + crypto.randomUUID());
      const result = await client.query(
        `INSERT INTO quotation_lines (id, quotation_id, product_id, quantity, unit_price, discount_percent, line_type, customer_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [qlId, line.quotationId, line.productId, line.quantity || 1, line.unitPrice, line.discountPercent || 0, line.lineType || 'one_time', line.customerId]
      );
      inserted.push(result.rows[0]);
    }
    return inserted;
  }

  /**
   * Update payment attempts and optionally status on a quotation.
   */
  async updatePaymentAttempts(quotationId, attempts, status = null, client = db) {
    if (status) {
      return await client.query(
        'UPDATE quotations SET status = $1, payment_attempts = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [status, attempts, quotationId]
      );
    }
    return await client.query(
      'UPDATE quotations SET payment_attempts = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [attempts, quotationId]
    );
  }

  /**
   * Ensure payments table exists.
   */
  async ensurePaymentTable(client = db) {
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id VARCHAR(100) PRIMARY KEY,
          quotation_id VARCHAR(100),
          company_id VARCHAR(100),
          customer_id VARCHAR(100),
          amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
          payment_type VARCHAR(50) DEFAULT 'one-time',
          payment_method VARCHAR(50) DEFAULT 'cod',
          status VARCHAR(50) DEFAULT 'pending',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (e) {
      console.warn('Could not auto-ensure payments table:', e.message);
    }
  }

  /**
   * Insert a payment record with fallbacks.
   */
  async recordPayment({ id, quotationId, companyId, customerId, amount, paymentType, paymentMethod, status }, client = db) {
    await this.ensurePaymentTable(client);
    try {
      await client.query(
        `INSERT INTO payments (id, quotation_id, company_id, customer_id, amount, payment_type, payment_method, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, quotationId, companyId, customerId, amount, paymentType, paymentMethod, status]
      );
    } catch (insertErr) {
      console.warn('Payment record insert notice:', insertErr.message);
      try {
        await client.query(
          `INSERT INTO payments (id, quotation_id, amount, payment_method, status)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, quotationId, amount, paymentMethod, status]
        );
      } catch (fallbackErr) {
        console.warn('Payment record fallback notice:', fallbackErr.message);
      }
    }
  }
}

module.exports = new QuotationRepository();
