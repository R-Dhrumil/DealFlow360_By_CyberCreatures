const db = require('../config/db');

const MOCK_PRODUCTS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Enterprise Server X1',
    category: 'Hardware',
    base_price: 5000.00,
    unit: 'unit',
    description: 'High-performance enterprise server rack unit.',
    is_promoted: true,
    company_name: 'CyberCreatures',
    company_logo: null
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'SaaS Platform License',
    category: 'Software',
    base_price: 100.00,
    unit: 'user/month',
    description: 'Cloud analytics platform user license.',
    is_promoted: true,
    company_name: 'CyberCreatures',
    company_logo: null
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Implementation Services',
    category: 'Services',
    base_price: 2500.00,
    unit: 'package',
    description: 'Onboarding & custom integration support package.',
    is_promoted: false,
    company_name: 'CyberCreatures',
    company_logo: null
  }
];

class ProductRepository {
  async findByCompany(companyId) {
    try {
      const result = await db.query(
        'SELECT * FROM products WHERE company_id = $1 ORDER BY name ASC',
        [companyId]
      );
      return result.rows;
    } catch (err) {
      if (err.code === 'ENOTFOUND' || err.message.includes('ENOTFOUND')) {
        return MOCK_PRODUCTS;
      }
      throw err;
    }
  }

  async findMarketplaceProducts({ category, search }) {
    try {
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
    } catch (err) {
      if (err.code === 'ENOTFOUND' || err.message.includes('ENOTFOUND')) {
        let items = MOCK_PRODUCTS;
        if (category) items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
        if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
        return items;
      }
      throw err;
    }
  }
}

module.exports = new ProductRepository();
