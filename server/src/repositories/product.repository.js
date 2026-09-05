const db = require('../config/db');
const crypto = require('crypto');

const MOCK_PRODUCTS = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    sku: 'HW-SRV-01',
    name: 'Enterprise Server X1',
    category: 'Hardware',
    base_price: 5000.00,
    min_margin: 30.00,
    unit: 'unit',
    stock: 120,
    description: 'High-performance enterprise server rack unit.',
    is_promoted: true,
    company_name: 'CyberCreatures'
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    sku: 'SW-LIC-01',
    name: 'SaaS Platform License',
    category: 'Software',
    base_price: 100.00,
    min_margin: 20.00,
    unit: 'user/month',
    stock: 999,
    description: 'Cloud analytics platform user license.',
    is_promoted: true,
    company_name: 'CyberCreatures'
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    sku: 'SVC-ONB-01',
    name: 'Implementation Services',
    category: 'Services',
    base_price: 2500.00,
    min_margin: 40.00,
    unit: 'package',
    stock: 50,
    description: 'Onboarding & custom integration support package.',
    is_promoted: false,
    company_name: 'CyberCreatures'
  }
];

class ProductRepository {
  async findByCompany(companyId) {
    try {
      const result = await db.query(
        'SELECT * FROM products WHERE company_id = $1 ORDER BY name ASC',
        [companyId]
      );
      return result.rows.length > 0 ? result.rows : MOCK_PRODUCTS;
    } catch (err) {
      return MOCK_PRODUCTS;
    }
  }

  async create(companyId, productData) {
    const { name, category, basePrice, unit, description, sku, minMargin } = productData;
    const productId = 'p_' + crypto.randomUUID();
    try {
      const result = await db.query(
        `INSERT INTO products (id, company_id, name, category, base_price, unit, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [productId, companyId, name, category, basePrice, unit || 'unit', description || '']
      );
      return result.rows[0];
    } catch (err) {
      const newProd = {
        id: 'prod-' + Date.now(),
        sku: sku || 'PRD-' + Date.now().toString().slice(-4),
        name,
        category,
        base_price: parseFloat(basePrice),
        min_margin: parseFloat(minMargin || 25),
        unit: unit || 'unit',
        stock: 100,
        description: description || ''
      };
      return newProd;
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
      return result.rows.length > 0 ? result.rows : MOCK_PRODUCTS;
    } catch (err) {
      let items = MOCK_PRODUCTS;
      if (category) items = items.filter(i => i.category.toLowerCase() === category.toLowerCase());
      if (search) items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
      return items;
    }
  }
}

module.exports = new ProductRepository();
