const db = require('./server/src/config/db');

async function seedRiskRules() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // Check if 'c1' company exists
    const c1Res = await client.query('SELECT id FROM companies WHERE id = $1', ['c1']);
    if (c1Res.rows.length === 0) {
      console.log('Company c1 not found, skipping seed');
      return;
    }
    
    // Insert Gold Category
    const catId = 'cat_gold_123';
    await client.query(`
      INSERT INTO customer_categories (id, company_id, name, default_discount_percent)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET default_discount_percent = EXCLUDED.default_discount_percent
    `, [catId, 'c1', 'Gold', 15.00]);
    
    // Assign ABC Industries to Gold
    // Assuming ABC Industries exists, or we just assign all customers for c1 to Gold for testing
    await client.query(`
      UPDATE customers SET customer_category_id = $1
    `, [catId]);
    
    // Assuming products: p_laptops, p_services, p_monitors exist
    // Insert rules
    const rules = [
      { id: 'rule_1', product_id: 'p1', max_discount_percent: 15.00 }, // Setup Service
      { id: 'rule_2', product_id: 'p2', max_discount_percent: 25.00 }, // Laptop
      { id: 'rule_3', product_id: 'p3', max_discount_percent: 10.00 }  // Monitor
    ];
    
    for (const r of rules) {
      // Find if product exists
      const pRes = await client.query('SELECT id, category FROM products WHERE id = $1 AND company_id = $2', [r.product_id, 'c1']);
      if (pRes.rows.length > 0) {
        await client.query(`
          INSERT INTO product_discount_rules (id, company_id, product_id, category, customer_category_id, max_discount_percent)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (company_id, product_id, category, customer_category_id) 
          DO UPDATE SET max_discount_percent = EXCLUDED.max_discount_percent
        `, [r.id, 'c1', r.product_id, pRes.rows[0].category, catId, r.max_discount_percent]);
      }
    }
    
    await client.query('COMMIT');
    console.log('Seed Risk Rules Complete');
  } catch(e) {
    await client.query('ROLLBACK');
    console.error(e);
  } finally {
    client.release();
  }
}

seedRiskRules().then(() => process.exit(0));
