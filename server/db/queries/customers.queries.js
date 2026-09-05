const pool = require('../pool');

async function getCustomerByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM customers WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

async function createCustomer(name, email, passwordHash) {
  const result = await pool.query(
    'INSERT INTO customers (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
    [name, email, passwordHash]
  );
  return result.rows[0];
}

module.exports = {
  getCustomerByEmail,
  createCustomer
};
