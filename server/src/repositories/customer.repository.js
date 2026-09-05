const db = require('../config/db');

class CustomerRepository {
  async findByEmail(email) {
    const result = await db.query(
      'SELECT * FROM customers WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async create(name, email, passwordHash) {
    const result = await db.query(
      'INSERT INTO customers (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, passwordHash]
    );
    return result.rows[0];
  }
}

module.exports = new CustomerRepository();
