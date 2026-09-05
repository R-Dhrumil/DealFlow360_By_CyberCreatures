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
}

module.exports = new UserRepository();
