const pool = require('../pool');

async function getProductsByCompany(companyId) {
  const result = await pool.query(
    'SELECT * FROM products WHERE company_id = $1 ORDER BY name ASC',
    [companyId]
  );
  return result.rows;
}

module.exports = {
  getProductsByCompany
};
