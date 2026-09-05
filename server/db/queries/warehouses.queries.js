const pool = require('../pool');

async function getStockForProducts(companyId, productIds) {
  if (!productIds || productIds.length === 0) return [];
  
  const result = await pool.query(`
    SELECT ws.warehouse_id, w.name as warehouse_name, w.shipping_cost_weight, 
           ws.product_id, ws.quantity_available
    FROM warehouse_stock ws
    JOIN warehouses w ON ws.warehouse_id = w.id
    WHERE w.company_id = $1 AND ws.product_id = ANY($2)
  `, [companyId, productIds]);
  
  return result.rows.map(row => ({
    warehouseId: row.warehouse_id,
    warehouseName: row.warehouse_name,
    productId: row.product_id,
    quantityAvailable: row.quantity_available,
    shippingCost: parseFloat(row.shipping_cost_weight)
  }));
}

async function saveFulfillmentSplit(quotationId, splits) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Clear existing splits if any
    await client.query('DELETE FROM fulfillment_splits WHERE quotation_id = $1', [quotationId]);
    
    // Insert new splits
    for (const split of splits) {
      await client.query(`
        INSERT INTO fulfillment_splits (quotation_id, warehouse_id, quantity, shipment_cost)
        VALUES ($1, $2, $3, $4)
      `, [quotationId, split.warehouseId, split.quantity, split.shipmentCost]);
    }
    
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = {
  getStockForProducts,
  saveFulfillmentSplit
};
