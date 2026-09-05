const db = require('../config/db');

class ProductRepository {
  async findByCompany(companyId) {
    const result = await db.query(
      'SELECT * FROM products WHERE company_id = $1 ORDER BY name ASC',
      [companyId]
    );
    return result.rows;
  }

  async findMarketplaceProducts({ category, search }) {
    let query = `
      SELECT 
        p.id, p.name, p.category, p.base_price, p.unit, p.description, p.is_promoted,
        c.name as company_name, c.logo_url as company_logo
      FROM products p
      JOIN companies c ON p.company_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (search) {
      query += ` AND p.name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY p.is_promoted DESC, p.name ASC';

    const result = await db.query(query, params);
    return result.rows;
  }
}

module.exports = new ProductRepository();
