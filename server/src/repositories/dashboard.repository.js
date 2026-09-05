const db = require('../config/db');

class DashboardRepository {
  async getDashboardMetrics(companyId) {
    const result = await db.query(
      `SELECT 
         COUNT(*) as total_quotes,
         SUM(CASE WHEN status = 'approved' OR status = 'accepted' THEN 1 ELSE 0 END) as won_quotes,
         SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending_quotes,
         AVG(blended_risk_score) as avg_risk_score
       FROM quotations
       WHERE company_id = $1`,
      [companyId]
    );
    
    const row = result.rows[0];
    const total = parseInt(row.total_quotes, 10) || 0;
    const won = parseInt(row.won_quotes, 10) || 0;
    
    return {
      totalQuotes: total,
      winRate: total > 0 ? ((won / total) * 100).toFixed(1) : '0.0',
      pendingApprovals: parseInt(row.pending_quotes, 10) || 0,
      avgRiskScore: parseFloat(row.avg_risk_score || 0).toFixed(2)
    };
  }

  async getHighRiskDeals(companyId, limit = 5) {
    const result = await db.query(
      `SELECT q.id, q.status, q.blended_risk_score, c.name as customer_name, u.name as rep_name
       FROM quotations q
       JOIN customers c ON q.customer_id = c.id
       JOIN users u ON q.sales_rep_id = u.id
       WHERE q.company_id = $1 AND q.blended_risk_score > 0
       ORDER BY q.blended_risk_score DESC
       LIMIT $2`,
      [companyId, limit]
    );
    return result.rows;
  }
}

module.exports = new DashboardRepository();
