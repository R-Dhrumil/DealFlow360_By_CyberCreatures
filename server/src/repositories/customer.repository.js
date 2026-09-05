const db = require('../config/db');
const crypto = require('crypto');

class CustomerRepository {
  async findByEmail(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const result = await db.query(
      'SELECT * FROM customers WHERE LOWER(email) = LOWER($1)',
      [cleanEmail]
    );
    return result.rows[0] || null;
  }

  async create(name, email, passwordHash) {
    const customerId = 'cust_' + crypto.randomUUID();
    const result = await db.query(
      'INSERT INTO customers (id, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, created_at',
      [customerId, name, email, passwordHash]
    );
    return result.rows[0];
  }
}

module.exports = new CustomerRepository();
