const db = require('../config/db');
const crypto = require('crypto');

class ProductRepository {
  async findByCompany(companyId) {
    try {
      const result = await db.query(
        `SELECT p.*, 
          COALESCE((SELECT SUM(ws.quantity_available) FROM warehouse_stock ws WHERE ws.product_id = p.id), p.stock) as stock
         FROM products p 
         WHERE p.company_id = $1 
         ORDER BY p.name ASC`,
        [companyId]
      );
      return result.rows;
    } catch (err) {
      console.error('Error fetching company products:', err.message);
      return [];
    }
  }

  async create(companyId, productData) {
    const { name, category, basePrice, unit, description, sku, minMargin, stock, status, warehouseId } = productData;
    const productId = 'p_' + crypto.randomUUID();
    const initStock = stock !== undefined ? parseInt(stock, 10) : 100;
    try {
      const result = await db.query(
        `INSERT INTO products (id, company_id, name, category, base_price, unit, description, sku, min_margin, stock, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [productId, companyId, name, category, basePrice, unit || 'unit', description || '', sku || null, minMargin || 25, initStock, status || 'Active']
      );

      const createdProduct = result.rows[0];

      // Auto-allocate stock to warehouse(s) and record initial inventory lot
      if (initStock > 0) {
        try {
          let targetWhId = warehouseId;
          if (!targetWhId) {
            const whRes = await db.query(
              `SELECT id FROM warehouses WHERE company_id = $1 ORDER BY created_at ASC LIMIT 1`,
              [companyId]
            );
            targetWhId = whRes.rows[0]?.id || 'w1';
          }

          // Upsert stock into target warehouse
          await db.query(
            `INSERT INTO warehouse_stock (id, warehouse_id, product_id, quantity_available, reorder_threshold, safety_stock)
             VALUES ('ws_' || md5(random()::text), $1, $2, $3, 10, 5)
             ON CONFLICT (warehouse_id, product_id)
             DO UPDATE SET quantity_available = warehouse_stock.quantity_available + $3`,
            [targetWhId, productId, initStock]
          );

          // Record batch/lot entry
          const lotId = 'lot_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
          const batchCode = 'BATCH-' + Date.now().toString().slice(-6);
          await db.query(
            `INSERT INTO inventory_lots (id, company_id, warehouse_id, product_id, batch_code, quantity, unit_cost)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [lotId, companyId, targetWhId, productId, batchCode, initStock, basePrice || 0]
          );

          // Log initial transaction
          const txnId = 'txn_' + Date.now() + Math.floor(Math.random() * 1000);
          await db.query(
            `INSERT INTO inventory_transactions 
               (id, company_id, warehouse_id, product_id, type, quantity, reason, reference_id)
             VALUES ($1, $2, $3, $4, 'in', $5, $6, $7)`,
            [txnId, companyId, targetWhId, productId, initStock, `Initial Product Intake (${batchCode})`, lotId]
          );
        } catch (allocErr) {
          console.warn('[Inventory] Failed to auto-allocate warehouse stock on product create:', allocErr.message);
        }
      }

      return createdProduct;
    } catch (err) {
      const newProd = {
        id: 'prod-' + Date.now(),
        sku: sku || 'PRD-' + Date.now().toString().slice(-4),
        name,
        category,
        base_price: parseFloat(basePrice),
        min_margin: parseFloat(minMargin || 25),
        unit: unit || 'unit',
        stock: initStock,
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
        const updatedRow = result.rows[0];
        if (stock !== undefined) {
          try {
            await this.updateStock(companyId, productId, { stock: parseInt(stock, 10) });
          } catch (syncErr) {
            console.warn('[Product Update] Warehouse stock sync warning:', syncErr.message);
          }
        }
        return updatedRow;
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
      let updatedProd;
      const targetStock = stock !== undefined ? parseInt(stock, 10) : null;
      const targetDelta = delta !== undefined ? parseInt(delta, 10) : null;

      if (targetStock !== null) {
        const result = await db.query(
          'UPDATE products SET stock = $1 WHERE id = $2 AND company_id = $3 RETURNING *',
          [targetStock, productId, companyId]
        );
        updatedProd = result.rows[0] || { id: productId, stock: targetStock };
      } else if (targetDelta !== null) {
        const result = await db.query(
          'UPDATE products SET stock = GREATEST(0, COALESCE(stock, 0) + $1) WHERE id = $2 AND company_id = $3 RETURNING *',
          [targetDelta, productId, companyId]
        );
        updatedProd = result.rows[0] || { id: productId, delta: targetDelta };
      }

      // Sync warehouse_stock and log inventory transaction
      try {
        const whRes = await db.query('SELECT id FROM warehouses WHERE company_id = $1 ORDER BY created_at ASC LIMIT 1', [companyId]);
        const whId = whRes.rows[0]?.id || 'w1';

        if (targetStock !== null) {
          await db.query(
            `INSERT INTO warehouse_stock (id, warehouse_id, product_id, quantity_available, reorder_threshold, safety_stock)
             VALUES ('ws_' || md5(random()::text), $1, $2, $3, 10, 5)
             ON CONFLICT (warehouse_id, product_id)
             DO UPDATE SET quantity_available = $3`,
            [whId, productId, targetStock]
          );

          const txnId = 'txn_' + Date.now() + Math.floor(Math.random() * 1000);
          await db.query(
            `INSERT INTO inventory_transactions (id, company_id, warehouse_id, product_id, type, quantity, reason)
             VALUES ($1, $2, $3, $4, 'adjustment', $5, 'Admin Stock Sync Update')`,
            [txnId, companyId, whId, productId, targetStock]
          );
        } else if (targetDelta !== null) {
          const type = targetDelta >= 0 ? 'in' : 'out';
          const absQty = Math.abs(targetDelta);
          await db.query(
            `INSERT INTO warehouse_stock (id, warehouse_id, product_id, quantity_available, reorder_threshold, safety_stock)
             VALUES ('ws_' || md5(random()::text), $1, $2, GREATEST(0, $3), 10, 5)
             ON CONFLICT (warehouse_id, product_id)
             DO UPDATE SET quantity_available = GREATEST(0, warehouse_stock.quantity_available + $3)`,
            [whId, productId, targetDelta]
          );

          const txnId = 'txn_' + Date.now() + Math.floor(Math.random() * 1000);
          await db.query(
            `INSERT INTO inventory_transactions (id, company_id, warehouse_id, product_id, type, quantity, reason)
             VALUES ($1, $2, $3, $4, $5, $6, 'Admin Stock Delta Update')`,
            [txnId, companyId, whId, productId, type, absQty]
          );
        }
      } catch (syncErr) {
        console.warn('[Inventory Sync Warning]:', syncErr.message);
      }

      return updatedProd;
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
          p.margin_percent, p.floor_price, p.sku, p.company_id,
          COALESCE((SELECT SUM(ws.quantity_available) FROM warehouse_stock ws WHERE ws.product_id = p.id), p.stock) as stock,
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
