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
}

module.exports = new UserRepository();
