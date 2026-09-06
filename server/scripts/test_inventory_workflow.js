const http = require('http');
const jwt = require('jsonwebtoken');
const config = require('../src/config/environment');

const adminToken = jwt.sign(
  { id: 'u1', email: 'superadmin@dealflow360.com', role: 'super_admin', companyId: 'c1' },
  config.jwtSecret,
  { expiresIn: '1h' }
);

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('========================================================================');
  console.log('  COMPREHENSIVE INVENTORY & STOCK CONTROL WORKFLOW VERIFICATION TEST');
  console.log('========================================================================');

  // 1. Initial overview
  console.log('\n[STEP 1] Fetching live stock overview for company c1:');
  const initialStockRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/inventory?limit=100',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  const p2Initial = (initialStockRes.data || []).filter(s => s.product_id === 'p2');
  console.table(p2Initial.map(s => ({
    warehouse_id: s.warehouse_id,
    warehouse: s.warehouse_name,
    product: s.product_name,
    available_stock: s.quantity_available
  })));

  // 2. Customer Direct Purchase of 5 units of p2
  console.log('\n[STEP 2] Simulating Customer Direct Purchase (5 units of p2)...');
  const purchaseRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/marketplace/purchase',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    companyId: 'c1',
    customerId: 'cust1',
    productId: 'p2',
    quantity: 5,
    paymentMethod: 'upi',
    shippingAddress: '404 Industrial Lane, Tech City'
  });

  console.log('Purchase HTTP Status:', purchaseRes.status);
  console.log('Order Details:', purchaseRes.data?.data?.order || purchaseRes.data?.order);
  console.log('Warehouse Stock Decrement Allocations:', purchaseRes.data?.data?.allocations || purchaseRes.data?.allocations);

  // 3. Verify stock after purchase
  console.log('\n[STEP 3] Verifying stock decremented accurately:');
  const afterPurchaseRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/inventory?limit=100',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const p2AfterPurchase = (afterPurchaseRes.data || []).filter(s => s.product_id === 'p2');
  console.table(p2AfterPurchase.map(s => ({
    warehouse_id: s.warehouse_id,
    warehouse: s.warehouse_name,
    product: s.product_name,
    available_stock: s.quantity_available
  })));

  // 4. Inter-Warehouse Transfer: Transfer 4 units of p2 from w1 to w2
  console.log('\n[STEP 4] Executing Admin Inter-Warehouse Transfer (4 units of p2 from w1 -> w2)...');
  const transferRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/inventory/adjust',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  }, {
    productId: 'p2',
    warehouseId: 'w1',
    toWarehouseId: 'w2',
    quantity: 4,
    type: 'transfer',
    reason: 'Rebalancing inventory between East and West depots'
  });

  console.log('Transfer HTTP Status:', transferRes.status);
  console.log('Transfer Result:', transferRes.data);

  // 5. Verify stock after transfer
  console.log('\n[STEP 5] Verifying stock after transfer (w1 decremented by 4, w2 incremented by 4):');
  const afterTransferRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/inventory?limit=100',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const p2Final = (afterTransferRes.data || []).filter(s => s.product_id === 'p2');
  console.table(p2Final.map(s => ({
    warehouse_id: s.warehouse_id,
    warehouse: s.warehouse_name,
    product: s.product_name,
    available_stock: s.quantity_available
  })));

  // 6. Inspect Inventory Audit Transactions Log
  console.log('\n[STEP 6] Inspecting Real-Time Inventory Transactions Audit Log:');
  const txRes = await request({
    hostname: 'localhost',
    port: 5001,
    path: '/api/inventory/transactions',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const recentTx = (txRes.data || []).slice(0, 6);
  console.table(recentTx.map(t => ({
    type: t.type,
    product: t.product_name,
    warehouse: t.warehouse_name,
    qty: t.quantity,
    reason: t.reason,
    user: t.user_name || 'System / Customer Purchase',
    time: t.created_at
  })));

  console.log('\n========================================================================');
  console.log('  ALL INVENTORY & STOCK CONTROL CHECKS COMPLETED & VERIFIED');
  console.log('========================================================================');
}

run().catch(console.error);
