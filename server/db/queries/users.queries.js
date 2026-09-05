const pool = require('../pool');

async function getUserByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0];
}

async function getUserById(id, companyId) {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1 AND company_id = $2',
    [id, companyId]
  );
  return result.rows[0];
}

module.exports = {
  getUserByEmail,
  getUserById
};
