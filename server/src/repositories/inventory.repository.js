const { pool } = require('../config/db');

class InventoryRepository {
  async getStockOverview(companyId) {
    const result = await pool.query(
      `SELECT 
         p.id as product_id,
         p.name as product_name,
         p.category,
         p.base_price,
         p.unit,
         w.id as warehouse_id,
         w.name as warehouse_name,
         COALESCE(ws.quantity_available, 0) as quantity_available,
         COALESCE(ws.reorder_threshold, 10) as reorder_threshold,
         COALESCE(ws.safety_stock, 5) as safety_stock
       FROM products p
       CROSS JOIN warehouses w
       LEFT JOIN warehouse_stock ws ON p.id = ws.product_id AND w.id = ws.warehouse_id
       WHERE p.company_id = $1 AND w.company_id = $1
       ORDER BY p.name ASC, w.name ASC`,
      [companyId]
    );
    return result.rows;
  }

  async adjustStock(client, companyId, warehouseId, productId, userId, type, quantity, reason, referenceId) {
    // Upsert the stock amount
    let qtyChange = quantity;
    if (type === 'out') qtyChange = -quantity;

    await client.query(
      `INSERT INTO warehouse_stock (id, warehouse_id, product_id, quantity_available, reorder_threshold, safety_stock)
       VALUES ('ws_' || md5(random()::text), $1, $2, GREATEST(0, $3), 10, 5)
       ON CONFLICT (warehouse_id, product_id)
       DO UPDATE SET quantity_available = GREATEST(0, warehouse_stock.quantity_available + $3)`,
      [warehouseId, productId, qtyChange]
    );

    // Sync total stock in products table
    await client.query(
      `UPDATE products 
       SET stock = (SELECT COALESCE(SUM(quantity_available), 0) FROM warehouse_stock WHERE product_id = $1)
       WHERE id = $1`,
      [productId]
    );

    // Ensure valid user_id for foreign key constraint (users table)
    let validUserId = null;
    if (userId) {
      try {
        const uRes = await client.query('SELECT id FROM users WHERE id = $1', [userId]);
        if (uRes.rows.length > 0) validUserId = userId;
      } catch {
        validUserId = null;
      }
    }

    // Record the transaction
    const txnId = 'txn_' + Date.now().toString() + Math.floor(Math.random() * 1000);
    await client.query(
      `INSERT INTO inventory_transactions 
         (id, company_id, warehouse_id, product_id, user_id, type, quantity, reason, reference_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [txnId, companyId, warehouseId, productId, validUserId, type, quantity, reason || null, referenceId || null]
    );
    
    return txnId;
  }

  async checkAndAutoBalanceStock(client, companyId, productId) {
    try {
      const dbClient = client || pool;
      const res = await dbClient.query(
        `SELECT ws.warehouse_id, w.name as warehouse_name, ws.quantity_available, 
                COALESCE(ws.reorder_threshold, 10) as reorder_threshold,
                COALESCE(ws.safety_stock, 5) as safety_stock
         FROM warehouse_stock ws
         JOIN warehouses w ON ws.warehouse_id = w.id
         WHERE w.company_id = $1 AND ws.product_id = $2`,
        [companyId, productId]
      );

      const rows = res.rows;
      if (rows.length < 2) return [];

      const deficitNodes = [];
      const surplusNodes = [];

      for (const r of rows) {
        const qty = parseInt(r.quantity_available, 10) || 0;
        const reorder = parseInt(r.reorder_threshold, 10) || 10;
        const safety = parseInt(r.safety_stock, 10) || 5;

        if (qty < reorder) {
          const targetQty = reorder + safety;
          deficitNodes.push({
            warehouseId: r.warehouse_id,
            warehouseName: r.warehouse_name,
            currentQty: qty,
            needed: targetQty - qty
          });
        } else if (qty > safety * 2) {
          surplusNodes.push({
            warehouseId: r.warehouse_id,
            warehouseName: r.warehouse_name,
            currentQty: qty,
            surplusAvailable: qty - safety * 2
          });
        }
      }

      if (deficitNodes.length === 0 || surplusNodes.length === 0) return [];

      const executedRebalances = [];

      for (const deficit of deficitNodes) {
        let needed = deficit.needed;

        for (const surplus of surplusNodes) {
          if (needed <= 0) break;
          if (surplus.surplusAvailable <= 0) continue;

          const transferAmount = Math.min(needed, surplus.surplusAvailable);
          if (transferAmount > 0) {
            await this.transferStock(
              dbClient,
              companyId,
              surplus.warehouseId,
              deficit.warehouseId,
              productId,
              null,
              transferAmount,
              `Auto-Rebalance: Stock low at ${deficit.warehouseName} (< reorder threshold)`,
              `AUTO-BAL-${Date.now()}`
            );

            const rebalanceLogId = 'reb_' + Date.now() + Math.floor(Math.random() * 1000);
            await dbClient.query(
              `INSERT INTO stock_rebalance_logs 
                 (id, company_id, from_warehouse_id, to_warehouse_id, product_id, quantity, status, reason)
               VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7)`,
              [
                rebalanceLogId,
                companyId,
                surplus.warehouseId,
                deficit.warehouseId,
                productId,
                transferAmount,
                `System auto-rebalanced ${transferAmount} units from ${surplus.warehouseName} to ${deficit.warehouseName}`
              ]
            );

            surplus.surplusAvailable -= transferAmount;
            needed -= transferAmount;
            executedRebalances.push({
              fromWarehouseId: surplus.warehouseId,
              toWarehouseId: deficit.warehouseId,
              quantity: transferAmount
            });
          }
        }
      }

      return executedRebalances;
    } catch (err) {
      console.warn('[System Auto-Rebalance Warning]:', err.message);
      return [];
    }
  }

  async deductProductStock(client, companyId, productId, quantity, userId, reason, referenceId, preferredWarehouseId = null) {
    let remainingQty = parseInt(quantity, 10) || 0;
    if (remainingQty <= 0) return [];

    const executedTxns = [];

    // 1. If preferred warehouse is provided, check its stock first
    if (preferredWarehouseId) {
      const prefWhRes = await client.query(
        `SELECT ws.quantity_available FROM warehouse_stock ws WHERE ws.warehouse_id = $1 AND ws.product_id = $2`,
        [preferredWarehouseId, productId]
      );
      const avail = prefWhRes.rows[0]?.quantity_available || 0;
      const toDeduct = Math.min(avail, remainingQty);
      if (toDeduct > 0) {
        const txnId = await this.adjustStock(client, companyId, preferredWarehouseId, productId, userId, 'out', toDeduct, reason, referenceId);
        executedTxns.push({ warehouseId: preferredWarehouseId, quantity: toDeduct, txnId });
        remainingQty -= toDeduct;
      }
    }

    // 2. Fulfill remaining quantity from company warehouses that have available stock
    if (remainingQty > 0) {
      const stockRes = await client.query(
        `SELECT ws.warehouse_id, ws.quantity_available
         FROM warehouse_stock ws
         JOIN warehouses w ON ws.warehouse_id = w.id
         WHERE w.company_id = $1 AND ws.product_id = $2 AND ws.quantity_available > 0
         ORDER BY ws.quantity_available DESC`,
        [companyId, productId]
      );

      for (const row of stockRes.rows) {
        if (remainingQty <= 0) break;
        if (preferredWarehouseId && row.warehouse_id === preferredWarehouseId) continue;

        const toDeduct = Math.min(row.quantity_available, remainingQty);
        if (toDeduct > 0) {
          const txnId = await this.adjustStock(client, companyId, row.warehouse_id, productId, userId, 'out', toDeduct, reason, referenceId);
          executedTxns.push({ warehouseId: row.warehouse_id, quantity: toDeduct, txnId });
          remainingQty -= toDeduct;
        }
      }
    }

    // 3. Fallback: If unstocked or remaining, deduct remainder from primary warehouse
    if (remainingQty > 0) {
      const defaultWhRes = await client.query(
        `SELECT id FROM warehouses WHERE company_id = $1 ORDER BY created_at ASC LIMIT 1`,
        [companyId]
      );
      const fallbackWhId = defaultWhRes.rows[0]?.id || preferredWarehouseId || 'w1';
      const txnId = await this.adjustStock(client, companyId, fallbackWhId, productId, userId, 'out', remainingQty, reason, referenceId);
      executedTxns.push({ warehouseId: fallbackWhId, quantity: remainingQty, txnId });
    }

    // 4. Trigger automated rebalancing check across warehouses
    await this.checkAndAutoBalanceStock(client, companyId, productId);

    return executedTxns;
  }

  async transferStock(client, companyId, fromWarehouseId, toWarehouseId, productId, userId, quantity, reason, referenceId) {
    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) throw new Error('Quantity must be a positive number');

    const whRes = await client.query(
      `SELECT id, name FROM warehouses WHERE id IN ($1, $2)`,
      [fromWarehouseId, toWarehouseId]
    );
    const whMap = {};
    whRes.rows.forEach(w => { whMap[w.id] = w.name; });

    const fromName = whMap[fromWarehouseId] || 'Source Warehouse';
    const toName = whMap[toWarehouseId] || 'Destination Warehouse';
    const ref = referenceId || `TRF-${Date.now()}`;

    // Deduct from source warehouse
    const outTxnId = await this.adjustStock(
      client,
      companyId,
      fromWarehouseId,
      productId,
      userId,
      'out',
      qty,
      `Transfer to ${toName}${reason ? ` (${reason})` : ''}`,
      ref
    );

    // Add to target warehouse
    const inTxnId = await this.adjustStock(
      client,
      companyId,
      toWarehouseId,
      productId,
      userId,
      'in',
      qty,
      `Transfer from ${fromName}${reason ? ` (${reason})` : ''}`,
      ref
    );

    return { outTxnId, inTxnId };
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

  async getRebalanceLogs(companyId, limit = 50) {
    const result = await pool.query(
      `SELECT 
         l.id,
         l.quantity,
         l.status,
         l.reason,
         l.timestamp,
         p.name as product_name,
         fw.name as from_warehouse_name,
         tw.name as to_warehouse_name
       FROM stock_rebalance_logs l
       JOIN products p ON l.product_id = p.id
       JOIN warehouses fw ON l.from_warehouse_id = fw.id
       JOIN warehouses tw ON l.to_warehouse_id = tw.id
       WHERE l.company_id = $1
       ORDER BY l.timestamp DESC
       LIMIT $2`,
      [companyId, limit]
    );
    return result.rows;
  }

  async getInventoryLots(companyId, limit = 100) {
    const result = await pool.query(
      `SELECT 
         lot.id,
         lot.batch_code,
         lot.quantity,
         lot.unit_cost,
         lot.created_at,
         p.name as product_name,
         p.unit,
         w.name as warehouse_name
       FROM inventory_lots lot
       JOIN products p ON lot.product_id = p.id
       JOIN warehouses w ON lot.warehouse_id = w.id
       WHERE lot.company_id = $1
       ORDER BY lot.created_at DESC
       LIMIT $2`,
      [companyId, limit]
    );
    return result.rows;
  }

  async triggerFullRebalance(companyId) {
    const prods = await pool.query(`SELECT id FROM products WHERE company_id = $1`, [companyId]);
    const allRebalances = [];
    for (const p of prods.rows) {
      const res = await this.checkAndAutoBalanceStock(pool, companyId, p.id);
      if (res.length > 0) {
        allRebalances.push(...res);
      }
    }
    return allRebalances;
  }
}

module.exports = new InventoryRepository();
