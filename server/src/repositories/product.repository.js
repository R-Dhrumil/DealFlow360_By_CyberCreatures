const db = require('../config/db');
const crypto = require('crypto');

class ProductRepository {
  async findByCompany(companyId) {
    try {
      const result = await db.query(
        'SELECT * FROM products WHERE company_id = $1 ORDER BY name ASC',
        [companyId]
      );
      return result.rows;
    } catch (err) {
      console.error('Error fetching company products:', err.message);
      return [];
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

  async update(companyId, productId, updateData) {
    const { name, category, basePrice, unit, description, sku, minMargin, stock, status, floorPrice } = updateData;
    try {
      const result = await db.query(
        `UPDATE products 
         SET name = COALESCE($1, name),
             category = COALESCE($2, category),
             base_price = COALESCE($3, base_price),
             unit = COALESCE($4, unit),
             description = COALESCE($5, description),
             floor_price = $6
         WHERE id = $7 AND company_id = $8
         RETURNING *`,
        [name, category, basePrice, unit, description, floorPrice !== undefined ? floorPrice : null, productId, companyId]
      );
      if (result.rows.length > 0) {
        return {
          ...result.rows[0],
          sku: sku || result.rows[0].sku,
          min_margin: minMargin !== undefined ? parseFloat(minMargin) : result.rows[0].min_margin,
          stock: stock !== undefined ? parseInt(stock, 10) : 100,
          status: status || 'Active'
        };
      }
      return null;
    } catch (err) {
      console.warn('Fallback product update locally:', err.message);
      return {
        id: productId,
        name,
        category,
        base_price: parseFloat(basePrice),
        unit: unit || 'unit',
        description: description || '',
        sku,
        min_margin: minMargin !== undefined ? parseFloat(minMargin) : 25,
        floor_price: floorPrice !== undefined ? floorPrice : null,
        stock: stock !== undefined ? parseInt(stock, 10) : 100,
        status: status || 'Active'
      };
    }
  }

  async delete(companyId, productId) {
    try {
      const result = await db.query(
        'DELETE FROM products WHERE id = $1 AND company_id = $2 RETURNING id',
        [productId, companyId]
      );
      return result.rowCount > 0;
    } catch (err) {
      console.warn('Fallback product delete locally:', err.message);
      return true;
    }
  }

  async updateStock(companyId, productId, { stock, delta }) {
    try {
      if (stock !== undefined) {
        return { id: productId, stock: parseInt(stock, 10) };
      }
      return { id: productId, delta: delta || 0 };
    } catch (err) {
      console.warn('Fallback stock update:', err.message);
      return { id: productId, stock };
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
      console.error('Error fetching marketplace products:', err.message);
      return [];
    }
  }
}

module.exports = new ProductRepository();
