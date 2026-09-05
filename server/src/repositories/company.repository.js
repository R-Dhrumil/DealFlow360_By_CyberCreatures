const db = require('../config/db');

class CompanyRepository {
  async getAllCompaniesWithStats() {
    const result = await db.query(
      `SELECT 
         c.id, 
         c.name, 
         c.subdomain_slug,
         COUNT(DISTINCT u.id) as user_count,
         COUNT(DISTINCT q.id) as quotation_count,
         COALESCE(SUM(CASE WHEN q.status = 'approved' OR q.status = 'accepted' THEN 1 ELSE 0 END), 0) as won_deals
       FROM companies c
       LEFT JOIN users u ON c.id = u.company_id
       LEFT JOIN quotations q ON c.id = q.company_id
       GROUP BY c.id
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
}

module.exports = new CompanyRepository();
