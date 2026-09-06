const { pool } = require('../config/db');

class InventoryRepository {
  async getStockOverview(companyId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT 
         p.id as product_id,
         p.name as product_name,
         p.category,
         p.base_price,
         p.unit,
         w.id as warehouse_id,
         w.name as warehouse_name,
         COALESCE(ws.quantity_available, 0) as quantity_available
       FROM products p
       CROSS JOIN warehouses w
       LEFT JOIN warehouse_stock ws ON p.id = ws.product_id AND w.id = ws.warehouse_id
       WHERE p.company_id = $1 AND w.company_id = $1
       ORDER BY p.name ASC, w.name ASC
       LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );
    return result.rows;
  }

  async adjustStock(client, companyId, warehouseId, productId, userId, type, quantity, reason, referenceId) {
    // Upsert the stock amount
    let qtyChange = quantity;
    if (type === 'out') qtyChange = -quantity;

    await client.query(
      `INSERT INTO warehouse_stock (id, warehouse_id, product_id, quantity_available)
       VALUES ('ws_' || md5(random()::text), $1, $2, GREATEST(0, $3))
       ON CONFLICT (warehouse_id, product_id)
       DO UPDATE SET quantity_available = GREATEST(0, warehouse_stock.quantity_available + EXCLUDED.quantity_available)`,
      [warehouseId, productId, qtyChange]
    );

    // Sync total stock in products table
    await client.query(
      `UPDATE products 
       SET stock = (SELECT COALESCE(SUM(quantity_available), 0) FROM warehouse_stock WHERE product_id = $1)
       WHERE id = $1`,
      [productId]
    );

    // Record the transaction
    const txnId = 'txn_' + Date.now().toString() + Math.floor(Math.random() * 1000);
    await client.query(
      `INSERT INTO inventory_transactions 
         (id, company_id, warehouse_id, product_id, user_id, type, quantity, reason, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [txnId, companyId, warehouseId, productId, userId, type, quantity, reason || null, referenceId || null]
    );
    
    return txnId;
  }

  async getTransactions(companyId, limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT 
         t.id,
         t.type,
         t.quantity,
         t.reason,
         t.reference_id,
         t.timestamp,
         p.name as product_name,
         w.name as warehouse_name,
         u.name as user_name
       FROM inventory_transactions t
       JOIN products p ON t.product_id = p.id
       JOIN warehouses w ON t.warehouse_id = w.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE t.company_id = $1
       ORDER BY t.timestamp DESC
       LIMIT $2 OFFSET $3`,
      [companyId, limit, offset]
    );
    return result.rows;
  }
}

module.exports = new InventoryRepository();
