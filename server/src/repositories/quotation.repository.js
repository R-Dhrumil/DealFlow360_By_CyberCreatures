const db = require('../config/db');

class QuotationRepository {
  async createQuotation(companyId, customerId, salesRepId, status = 'draft') {
    const result = await db.query(
      `INSERT INTO quotations (company_id, customer_id, sales_rep_id, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [companyId, customerId, salesRepId, status]
    );
    return result.rows[0];
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
    return result.rows[0];
  }
}

module.exports = new QuotationRepository();
