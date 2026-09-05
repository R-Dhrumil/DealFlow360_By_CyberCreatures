const db = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
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
}

module.exports = new UserRepository();
