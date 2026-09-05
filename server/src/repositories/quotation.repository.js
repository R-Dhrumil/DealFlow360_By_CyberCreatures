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
