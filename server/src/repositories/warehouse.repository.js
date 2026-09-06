const db = require('../config/db');
const crypto = require('crypto');

class WarehouseRepository {
  async findByCompany(companyId) {
    const result = await db.query(
      `SELECT w.id, w.company_id, w.name, w.location, w.shipping_cost_weight,
              COALESCE(SUM(ws.quantity_available), 0) AS stock_count
       FROM warehouses w
       LEFT JOIN warehouse_stock ws ON w.id = ws.warehouse_id
       WHERE w.company_id = $1
       GROUP BY w.id, w.company_id, w.name, w.location, w.shipping_cost_weight
       ORDER BY w.name ASC`,
      [companyId]
    );

    return result.rows.map(row => ({
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      location: row.location || '',
      shippingCostWeight: parseFloat(row.shipping_cost_weight) || 1.0,
      stockCount: parseInt(row.stock_count, 10) || 0,
      status: 'Active'
    }));
  }

  async create(companyId, data) {
    const id = 'wh_' + crypto.randomUUID().substring(0, 8);
    const name = data.name;
    const location = data.location || 'Main Depot';
    const shippingCostWeight = parseFloat(data.shippingCostWeight) || 1.0;
    const stockCount = parseInt(data.stockCount, 10) || 0;

    const result = await db.query(
      `INSERT INTO warehouses (id, company_id, name, location, shipping_cost_weight)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, company_id, name, location, shipping_cost_weight`,
      [id, companyId, name, location, shippingCostWeight]
    );

    const row = result.rows[0];
    return {
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      location: row.location,
      shippingCostWeight: parseFloat(row.shipping_cost_weight) || 1.0,
      stockCount,
      status: 'Active'
    };
  }

  async update(companyId, id, data) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.location !== undefined) {
      fields.push(`location = $${idx++}`);
      values.push(data.location);
    }
    if (data.shippingCostWeight !== undefined) {
      fields.push(`shipping_cost_weight = $${idx++}`);
      values.push(parseFloat(data.shippingCostWeight) || 1.0);
    }

    if (fields.length === 0) {
      const existing = await db.query(
        `SELECT id, company_id, name, location, shipping_cost_weight FROM warehouses WHERE id = $1 AND company_id = $2`,
        [id, companyId]
      );
      if (existing.rows.length === 0) return null;
      const row = existing.rows[0];
      return {
        id: row.id,
        companyId: row.company_id,
        name: row.name,
        location: row.location,
        shippingCostWeight: parseFloat(row.shipping_cost_weight) || 1.0,
        stockCount: data.stockCount !== undefined ? parseInt(data.stockCount, 10) : 0,
        status: data.status || 'Active'
      };
    }

    values.push(id, companyId);
    const queryStr = `UPDATE warehouses SET ${fields.join(', ')} WHERE id = $${idx++} AND company_id = $${idx++} RETURNING id, company_id, name, location, shipping_cost_weight`;

    const result = await db.query(queryStr, values);
    if (result.rows.length === 0) return null;
    const row = result.rows[0];

    return {
      id: row.id,
      companyId: row.company_id,
      name: row.name,
      location: row.location,
      shippingCostWeight: parseFloat(row.shipping_cost_weight) || 1.0,
      stockCount: data.stockCount !== undefined ? parseInt(data.stockCount, 10) : 0,
      status: data.status || 'Active'
    };
  }

  async delete(companyId, id) {
    try {
      await db.query(`DELETE FROM fulfillment_splits WHERE warehouse_id = $1`, [id]);
    } catch { }
    try {
      await db.query(`DELETE FROM warehouse_stock WHERE warehouse_id = $1`, [id]);
    } catch { }

    const result = await db.query(
      `DELETE FROM warehouses WHERE id = $1 AND company_id = $2 RETURNING id`,
      [id, companyId]
    );
    return result.rows.length > 0;
  }

  async getStockForProducts(companyId, productIds) {
    if (!productIds || productIds.length === 0) return [];
    
    const result = await db.query(
      `SELECT ws.warehouse_id, w.name as warehouse_name, w.shipping_cost_weight, 
              ws.product_id, ws.quantity_available
       FROM warehouse_stock ws
       JOIN warehouses w ON ws.warehouse_id = w.id
       WHERE w.company_id = $1 AND ws.product_id = ANY($2)`,
      [companyId, productIds]
    );
    
    return result.rows.map(row => ({
      warehouseId: row.warehouse_id,
      warehouseName: row.warehouse_name,
      productId: row.product_id,
      quantityAvailable: row.quantity_available,
      shippingCost: parseFloat(row.shipping_cost_weight)
    }));
  }

  async saveFulfillmentSplit(quotationId, splits) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM fulfillment_splits WHERE quotation_id = $1', [quotationId]);
      
      for (const split of splits) {
        const splitId = 'split_' + crypto.randomUUID();
        await client.query(
          `INSERT INTO fulfillment_splits (id, quotation_id, warehouse_id, quantity, shipment_cost)
           VALUES ($1, $2, $3, $4, $5)`,
          [splitId, quotationId, split.warehouseId, split.quantity, split.shipmentCost]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  /**
   * Find first available warehouse for a company, or global fallback.
   */
  async findFirstWarehouse(companyId, client = db) {
    if (companyId) {
      const whRes = await client.query(
        'SELECT id FROM warehouses WHERE company_id = $1 ORDER BY created_at ASC LIMIT 1',
        [companyId]
      );
      if (whRes.rows.length > 0) return whRes.rows[0].id;
    }
    const anyWh = await client.query('SELECT id FROM warehouses LIMIT 1');
    return anyWh.rows[0]?.id || 'w1';
  }

  /**
   * Get fulfillment splits joined with product_id for a quotation.
   */
  async getFulfillmentSplitsWithProducts(quotationId, client = db) {
    const result = await client.query(
      `SELECT fs.warehouse_id, fs.quantity, ql.product_id
       FROM fulfillment_splits fs
       JOIN quotation_lines ql ON fs.quotation_id = ql.quotation_id
       WHERE fs.quotation_id = $1`,
      [quotationId]
    );
    return result.rows;
  }
}

module.exports = new WarehouseRepository();
