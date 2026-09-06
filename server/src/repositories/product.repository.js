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
    const { name, category, basePrice, unit, description, sku, minMargin, stock, status } = productData;
    const productId = 'p_' + crypto.randomUUID();
    try {
      const result = await db.query(
        `INSERT INTO products (id, company_id, name, category, base_price, unit, description, sku, min_margin, stock, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [productId, companyId, name, category, basePrice, unit || 'unit', description || '', sku || null, minMargin || 25, stock !== undefined ? parseInt(stock, 10) : 100, status || 'Active']
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
        stock: stock !== undefined ? parseInt(stock, 10) : 100,
        status: status || 'Active',
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
             floor_price = $6,
             sku = COALESCE($7, sku),
             min_margin = COALESCE($8, min_margin),
             stock = COALESCE($9, stock),
             status = COALESCE($10, status)
         WHERE id = $11 AND company_id = $12
         RETURNING *`,
        [name, category, basePrice, unit, description, floorPrice !== undefined ? floorPrice : null, sku || null, minMargin !== undefined ? parseFloat(minMargin) : null, stock !== undefined ? parseInt(stock, 10) : null, status || null, productId, companyId]
      );
      if (result.rows.length > 0) {
        return result.rows[0];
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
        const result = await db.query(
          'UPDATE products SET stock = $1 WHERE id = $2 AND company_id = $3 RETURNING *',
          [parseInt(stock, 10), productId, companyId]
        );
        return result.rows[0] || { id: productId, stock: parseInt(stock, 10) };
      }
      if (delta !== undefined) {
        const result = await db.query(
          'UPDATE products SET stock = GREATEST(0, COALESCE(stock, 0) + $1) WHERE id = $2 AND company_id = $3 RETURNING *',
          [parseInt(delta, 10), productId, companyId]
        );
        return result.rows[0] || { id: productId, delta };
      }
      return { id: productId };
    } catch (err) {
      console.warn('Fallback stock update:', err.message);
      return { id: productId, stock };
    }
  }

  async findMarketplaceProducts({ category, search }) {
    try {
      let query = `
        SELECT 
          p.id, p.name, p.category, p.base_price, p.unit, p.tax_rate, p.description, p.is_promoted,
          p.margin_percent, p.floor_price, p.stock, p.sku, p.company_id,
          c.name as company_name, c.logo_url as company_logo
        FROM products p
        LEFT JOIN companies c ON p.company_id = c.id
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

  /**
   * Find a single product by ID. Returns full product row or null.
   */
  async findById(productId) {
    const result = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [productId]
    );
    return result.rows[0] || null;
  }

  /**
   * Batch fetch id, base_price, floor_price for an array of product IDs.
   * Returns rows array: [{ id, base_price, floor_price }, ...]
   */
  async findPricesByIds(productIds, client = db) {
    if (!productIds || productIds.length === 0) return [];
    const result = await client.query(
      'SELECT id, base_price, floor_price FROM products WHERE id = ANY($1::varchar[])',
      [productIds]
    );
    return result.rows;
  }
}

module.exports = new ProductRepository();
