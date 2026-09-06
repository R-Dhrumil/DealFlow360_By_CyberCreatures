const db = require('../config/db');
const crypto = require('crypto');

class CustomerRepository {
  async findByEmail(email, client = db) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const result = await client.query(
      'SELECT * FROM customers WHERE LOWER(email) = LOWER($1)',
      [cleanEmail]
    );
    return result.rows[0] || null;
  }

  /**
   * Find a customer by ID. Returns full customer row or null.
   */
  async findById(customerId, client = db) {
    const result = await client.query(
      'SELECT * FROM customers WHERE id = $1',
      [customerId]
    );
    return result.rows[0] || null;
  }

  /**
   * Fuzzy match customer by name. Returns first match or null.
   */
  async findByNameLike(name, client = db) {
    const cleanName = (name || '').trim().toLowerCase();
    const result = await client.query(
      'SELECT id FROM customers WHERE LOWER(name) = LOWER($1) OR LOWER(name) LIKE $2 LIMIT 1',
      [cleanName, `%${cleanName}%`]
    );
    return result.rows[0] || null;
  }

  /**
   * Create a customer with an explicit ID (for transactional use).
   * If no id is provided, one is auto-generated.
   */
  async create(name, email, passwordHash, id = null, client = db) {
    const customerId = id || ('cust_' + crypto.randomUUID());
    const result = await client.query(
      'INSERT INTO customers (id, name, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, name, email, created_at',
      [customerId, name, email, passwordHash]
    );
    return result.rows[0];
  }

  /**
   * Find first customer record (fallback).
   */
  async findFirst(client = db) {
    const result = await client.query('SELECT id FROM customers LIMIT 1');
    return result.rows[0] || null;
  }
}

module.exports = new CustomerRepository();

