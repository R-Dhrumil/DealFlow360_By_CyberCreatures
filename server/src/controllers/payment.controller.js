const db = require('../config/db');

class PaymentController {
  async getCompanyPayments(req, res) {
    try {
      const companyId = req.companyId;

      if (!companyId) {
        return res.status(400).json({ error: 'Company scope required' });
      }

      // Fetch all payments for this company, joining customers and quotations for display names
      const result = await db.query(`
        SELECT 
          p.id,
          p.amount,
          p.payment_type,
          p.payment_method,
          p.status,
          p.created_at,
          q.id as quotation_id,
          c.name as customer_name
        FROM payments p
        LEFT JOIN quotations q ON p.quotation_id = q.id
        LEFT JOIN customers c ON p.customer_id = c.id
        WHERE p.company_id = $1
        ORDER BY p.created_at DESC
      `, [companyId]);

      return res.json({
        success: true,
        payments: result.rows
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
      return res.status(500).json({ error: 'Failed to fetch transaction history' });
    }
  }
}

module.exports = new PaymentController();
