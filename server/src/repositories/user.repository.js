const db = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [cleanEmail]
    );
    return result.rows[0] || null;
  }

  async findById(id, companyId) {
    const result = await db.query(
      'SELECT * FROM users WHERE id = $1 AND company_id = $2',
      [id, companyId]
    );
    return result.rows[0] || null;
  }

  async findByCompanyId(companyId) {
    const result = await db.query(
      `SELECT 
         u.id, 
         u.name, 
         u.email, 
         u.role, 
         u.created_at,
         (SELECT COUNT(*) FROM quotations q WHERE q.sales_rep_id = u.id) as deals_count
       FROM users u
       WHERE u.company_id = $1
       ORDER BY u.created_at DESC`,
      [companyId]
    );
    return result.rows;
  }

  async createUser({ id, companyId, name, email, passwordHash, role }) {
    const result = await db.query(
      `INSERT INTO users (id, company_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, company_id, name, email, role, created_at`,
      [id, companyId, name, email, passwordHash, role]
    );
    return result.rows[0];
  }

  async updateUserRole(id, role, companyId = null) {
    let query = `UPDATE users SET role = $1 WHERE id = $2`;
    let params = [role, id];
    if (companyId) {
      query += ` AND company_id = $3`;
      params.push(companyId);
    }
    query += ` RETURNING id, company_id, name, email, role, created_at`;
    const result = await db.query(query, params);
    return result.rows[0] || null;
  }

  /**
   * Fetch a user's role and per-user discount authority.
   * Returns { role, max_discount_percent } or null if not found.
   */
  async findDiscountAuthority(userId, companyId) {
    const result = await db.query(
      'SELECT role, max_discount_percent FROM users WHERE id = $1 AND (company_id = $2 OR company_id IS NULL)',
      [userId, companyId]
    );
    return result.rows[0] || null;
  }

  /**
   * Fetch the role-level discount ceiling from the discount_tiers table.
   * Returns { max_discount_percent } or null.
   */
  async findDiscountTierByRole(companyId, roleName) {
    const result = await db.query(
      'SELECT max_discount_percent FROM discount_tiers WHERE company_id = $1 AND LOWER(tier_name) = LOWER($2)',
      [companyId, roleName]
    );
    return result.rows[0] || null;
  }

  /**
   * Find the first active sales rep for a company.
   * Falls back to any user in the company if no sales_rep exists.
   * Returns user id string or null.
   */
  async findSalesRepByCompany(companyId) {
    const repRes = await db.query(
      "SELECT id FROM users WHERE company_id = $1 AND role = 'sales_rep' ORDER BY created_at ASC LIMIT 1",
      [companyId]
    );
    if (repRes.rows.length > 0) return repRes.rows[0].id;

    const anyRes = await db.query(
      "SELECT id FROM users WHERE company_id = $1 LIMIT 1",
      [companyId]
    );
    return anyRes.rows[0]?.id || null;
  }
}

module.exports = new UserRepository();
