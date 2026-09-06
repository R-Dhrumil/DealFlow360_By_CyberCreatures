const { pool } = require('../src/config/db');
const productRepository = require('../src/repositories/product.repository');
const inventoryRepository = require('../src/repositories/inventory.repository');
const warehouseRepository = require('../src/repositories/warehouse.repository');

async function testRebalancingWorkflow() {
  console.log('--- STARTING INVENTORY REBALANCING & UNIT LOT VERIFICATION TEST ---');
  const client = await pool.connect();
  try {
    const companyId = 'c1'; // Default test company

    // 1. Get or create 2 warehouses for testing
    let warehouses = await warehouseRepository.findByCompany(companyId);
    if (warehouses.length < 2) {
      console.log('Creating second warehouse for rebalancing test...');
      await warehouseRepository.create(companyId, { name: 'Regional Secondary Depot', location: 'East Hub' });
      warehouses = await warehouseRepository.findByCompany(companyId);
    }

    const wh1 = warehouses[0].id;
    const wh2 = warehouses[1].id;
    console.log(`Testing with Warehouse 1 (${warehouses[0].name}: ${wh1}) and Warehouse 2 (${warehouses[1].name}: ${wh2})`);

    // 2. Create a test product with 1500 unit stock
    const testProductName = 'Industrial Sensor Unit ' + Date.now().toString().slice(-4);
    console.log(`Creating test product: "${testProductName}" with 1500 initial units allocated to ${warehouses[0].name}`);
    
    const prod = await productRepository.create(companyId, {
      name: testProductName,
      category: 'Electronics',
      basePrice: 150.00,
      unit: 'unit',
      stock: 1500,
      warehouseId: wh1
    });

    console.log('Product created successfully with ID:', prod.id);

    // 3. Verify stock in wh1 and initial batch lot
    const overview1 = await inventoryRepository.getStockOverview(companyId);
    const wh1Item = overview1.find(i => i.product_id === prod.id && i.warehouse_id === wh1);
    const wh2Item = overview1.find(i => i.product_id === prod.id && i.warehouse_id === wh2);

    console.log(`Initial Stock Levels -> ${warehouses[0].name}: ${wh1Item?.quantity_available || 0} units, ${warehouses[1].name}: ${wh2Item?.quantity_available || 0} units`);

    // 4. Set wh2 stock below reorder threshold (e.g. 2 units) to create a deficit
    console.log(`Setting ${warehouses[1].name} stock to 2 units (below reorder threshold of 10)...`);
    await client.query(
      `INSERT INTO warehouse_stock (id, warehouse_id, product_id, quantity_available, reorder_threshold, safety_stock)
       VALUES ('ws_' || md5(random()::text), $1, $2, 2, 10, 5)
       ON CONFLICT (warehouse_id, product_id)
       DO UPDATE SET quantity_available = 2, reorder_threshold = 10, safety_stock = 5`,
      [wh2, prod.id]
    );

    // 5. Trigger automated rebalancing check
    console.log('Triggering automated rebalancing engine for product...');
    const rebalanceResults = await inventoryRepository.checkAndAutoBalanceStock(client, companyId, prod.id);
    console.log('Auto-Rebalance Executed Transferred:', JSON.stringify(rebalanceResults));

    // 6. Verify post-rebalance stock levels
    const overview2 = await inventoryRepository.getStockOverview(companyId);
    const wh1ItemPost = overview2.find(i => i.product_id === prod.id && i.warehouse_id === wh1);
    const wh2ItemPost = overview2.find(i => i.product_id === prod.id && i.warehouse_id === wh2);

    console.log(`Post-Rebalance Stock Levels -> ${warehouses[0].name}: ${wh1ItemPost?.quantity_available} units, ${warehouses[1].name}: ${wh2ItemPost?.quantity_available} units`);

    // 7. Verify Rebalance Logs & Inventory Lots
    const rebLogs = await inventoryRepository.getRebalanceLogs(companyId, 5);
    const invLots = await inventoryRepository.getInventoryLots(companyId, 5);

    console.log('Latest Rebalance Log Entry:', rebLogs[0]?.reason || 'None');
    console.log('Latest Batch Code:', invLots[0]?.batch_code || 'None');

    if (wh2ItemPost?.quantity_available >= 10 && rebLogs.length > 0 && invLots.length > 0) {
      console.log('✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
    } else {
      console.error('❌ Verification failed: stock levels or logs not updated as expected');
    }
  } catch (err) {
    console.error('❌ Error during test execution:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

testRebalancingWorkflow();
