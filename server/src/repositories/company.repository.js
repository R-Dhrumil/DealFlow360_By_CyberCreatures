const db = require('../config/db');

class CompanyRepository {
  async getAllCompaniesWithStats() {
    const result = await db.query(
      `WITH user_stats AS (
         SELECT company_id, COUNT(id) as user_count
         FROM users
         GROUP BY company_id
       ),
       quote_stats AS (
         SELECT company_id, 
                COUNT(id) as quotation_count,
                SUM(CASE WHEN status = 'approved' OR status = 'confirmed' THEN 1 ELSE 0 END) as won_deals
         FROM quotations
         GROUP BY company_id
       )
       SELECT 
         c.id, 
         c.name, 
         c.subdomain_slug,
         COALESCE(u.user_count, 0) as user_count,
         COALESCE(q.quotation_count, 0) as quotation_count,
         COALESCE(q.won_deals, 0) as won_deals
       FROM companies c
       LEFT JOIN user_stats u ON c.id = u.company_id
       LEFT JOIN quote_stats q ON c.id = q.company_id
       ORDER BY c.created_at DESC`
    );
    return result.rows;
  }

  async getAllTenantUsers() {
    const result = await db.query(
      `SELECT 
         u.id, 
         u.name, 
         u.email, 
         u.role, 
         u.created_at,
         c.name as company_name,
         c.subdomain_slug
       FROM users u
       LEFT JOIN companies c ON u.company_id = c.id
       ORDER BY u.created_at DESC`
    );
    return result.rows;
  }

  async findById(companyId, client = db) {
    const result = await client.query('SELECT id, name FROM companies WHERE id = $1', [companyId]);
    return result.rows[0] || null;
  }
}

module.exports = new CompanyRepository();
