const db = require('../config/db');

class FinanceController {
  async getBillingSchedules(req, res) {
    const companyId = req.companyId;
    
    const result = await db.query(
      `SELECT bs.id, bs.billing_date, bs.amount, bs.status, 
              q.id as quotation_id, c.name as customer_name
       FROM billing_schedules bs
       JOIN quotation_lines ql ON bs.quotation_line_id = ql.id
       JOIN quotations q ON ql.quotation_id = q.id
       JOIN customers c ON q.customer_id = c.id
       WHERE q.company_id = $1
       ORDER BY bs.billing_date ASC`,
      [companyId]
    );

    res.json(result.rows);
  }

  async getCreditNotes(req, res) {
    const companyId = req.companyId;
    
    const result = await db.query(
      `SELECT cn.*, c.name as customer_name
       FROM credit_notes cn
       JOIN customers c ON cn.customer_id = c.id
       WHERE cn.company_id = $1
       ORDER BY cn.issued_date DESC`,
      [companyId]
    );

    res.json(result.rows);
  }
}

module.exports = new FinanceController();
