const db = require('../config/db');
const crypto = require('crypto');

class WarehouseRepository {
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
}

module.exports = new WarehouseRepository();
