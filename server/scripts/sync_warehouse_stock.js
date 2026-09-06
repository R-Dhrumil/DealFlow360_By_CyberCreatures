const { pool } = require('../src/config/db');

async function syncWarehouseStock() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Ensuring warehouses for all companies...');

    // 1. Ensure c2 has a warehouse
    await client.query(`
      INSERT INTO warehouses (id, company_id, name, location, shipping_cost_weight)
      VALUES ('w_c2_1', 'c2', 'Vertex Central Logistics Hub', 'Austin, TX', 1.05)
      ON CONFLICT (id) DO NOTHING
    `);

    // 2. Fetch all products
    const productsRes = await client.query('SELECT id, company_id, name, stock FROM products');
    const products = productsRes.rows;

    for (const prod of products) {
      const compId = prod.company_id || 'c1';
      // Get warehouses for this company
      const whRes = await client.query('SELECT id FROM warehouses WHERE company_id = $1 ORDER BY id ASC', [compId]);
      const whs = whRes.rows;

      if (whs.length === 0) continue;

      // Check existing stock entries for this product
      const stockCheck = await client.query(
        'SELECT warehouse_id, quantity_available FROM warehouse_stock WHERE product_id = $1',
        [prod.id]
      );

      if (stockCheck.rows.length === 0) {
        // Distribute stock across warehouses or place in primary
        const baseQty = Math.max(20, parseInt(prod.stock, 10) || 50);
        const primaryWh = whs[0].id;
        const secondaryWh = whs.length > 1 ? whs[1].id : null;

        if (secondaryWh) {
          const qty1 = Math.round(baseQty * 0.65);
          const qty2 = baseQty - qty1;
          await client.query(`
            INSERT INTO warehouse_stock (id, warehouse_id, product_id, quantity_available)
            VALUES ('ws_' || md5(random()::text), $1, $2, $3)
            ON CONFLICT (warehouse_id, product_id) DO NOTHING
          `, [primaryWh, prod.id, qty1]);

          await client.query(`
            INSERT INTO warehouse_stock (id, warehouse_id, product_id, quantity_available)
            VALUES ('ws_' || md5(random()::text), $1, $2, $3)
            ON CONFLICT (warehouse_id, product_id) DO NOTHING
          `, [secondaryWh, prod.id, qty2]);
        } else {
          await client.query(`
            INSERT INTO warehouse_stock (id, warehouse_id, product_id, quantity_available)
            VALUES ('ws_' || md5(random()::text), $1, $2, $3)
            ON CONFLICT (warehouse_id, product_id) DO NOTHING
          `, [primaryWh, prod.id, baseQty]);
        }
      }
    }

    // 3. Sync total product stock to SUM(warehouse_stock.quantity_available)
    await client.query(`
      UPDATE products 
      SET stock = (
        SELECT COALESCE(SUM(quantity_available), 0) 
        FROM warehouse_stock 
        WHERE product_id = products.id
      )
    `);

    await client.query('COMMIT');
    console.log('Warehouse stock synchronized successfully!');

    // Show summary
    const summary = await pool.query(`
      SELECT p.id, p.name, p.stock as total_stock,
             COUNT(ws.id) as warehouse_count,
             STRING_AGG(w.name || ': ' || ws.quantity_available, ' | ') as breakdown
      FROM products p
      LEFT JOIN warehouse_stock ws ON p.id = ws.product_id
      LEFT JOIN warehouses w ON ws.warehouse_id = w.id
      GROUP BY p.id, p.name, p.stock
      ORDER BY p.id ASC
    `);
    console.table(summary.rows);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error syncing warehouse stock:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

syncWarehouseStock();
