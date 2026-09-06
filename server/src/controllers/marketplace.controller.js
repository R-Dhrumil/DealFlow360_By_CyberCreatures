const productRepository = require('../repositories/product.repository');
const inventoryRepository = require('../repositories/inventory.repository');
const { pool } = require('../config/db');
const ApiError = require('../utils/apiError');
const crypto = require('crypto');
const { broadcastInventoryUpdate, broadcastPipelineUpdate } = require('../services/socket.service');

class MarketplaceController {
  async getProducts(req, res) {
    const { category, search } = req.query;
    const products = await productRepository.findMarketplaceProducts({ category, search });
    return res.json(products);
  }

  /**
   * POST /marketplace/purchase
   * Direct customer purchase: Decrements stock immediately and creates a confirmed order
   */
  async purchaseProduct(req, res) {
    const { productId, quantity, customerEmail, customerName, paymentMethod = 'cod', notes } = req.body;
    const qty = parseInt(quantity, 10);
    if (!productId || isNaN(qty) || qty <= 0) {
      throw ApiError.badRequest('Valid productId and positive quantity are required');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Fetch product
      const prodRes = await client.query(
        `SELECT p.*, c.name as company_name 
         FROM products p 
         LEFT JOIN companies c ON p.company_id = c.id 
         WHERE p.id = $1`,
        [productId]
      );
      if (prodRes.rows.length === 0) {
        throw ApiError.notFound('Product not found');
      }
      const product = prodRes.rows[0];
      const companyId = product.company_id || 'c1';

      // 2. Check total available stock across all warehouses
      const stockCheckRes = await client.query(
        `SELECT COALESCE(SUM(quantity_available), 0) as total_wh_stock
         FROM warehouse_stock ws
         JOIN warehouses w ON ws.warehouse_id = w.id
         WHERE ws.product_id = $1 AND w.company_id = $2`,
        [productId, companyId]
      );
      const totalAvailable = parseInt(stockCheckRes.rows[0]?.total_wh_stock || product.stock || 0, 10);

      if (totalAvailable < qty) {
        throw ApiError.badRequest(`Insufficient stock. Only ${totalAvailable} unit(s) available in warehouse inventory.`);
      }

      // 3. Resolve or create customer
      let customerId = req.user?.id || req.user?.customerId;
      const email = customerEmail?.trim().toLowerCase();
      if (!customerId && email) {
        const existing = await client.query('SELECT id FROM customers WHERE LOWER(email) = $1', [email]);
        if (existing.rows.length > 0) {
          customerId = existing.rows[0].id;
        } else {
          const newCustId = 'cust_' + crypto.randomUUID().substring(0, 8);
          await client.query(
            'INSERT INTO customers (id, name, email, password_hash) VALUES ($1, $2, $3, $4)',
            [newCustId, customerName || email.split('@')[0], email, 'guest']
          );
          customerId = newCustId;
        }
      }
      if (!customerId) {
        const anyCust = await client.query('SELECT id FROM customers LIMIT 1');
        customerId = anyCust.rows[0]?.id || 'cust1';
      }

      // 4. Check and deduct stock from warehouses via smart deduction
      const deductTxns = await inventoryRepository.deductProductStock(
        client,
        companyId,
        productId,
        qty,
        customerId,
        `Direct Marketplace Purchase (${qty} units of ${product.name})`,
        `ORD-${Date.now()}`
      );

      // 5. Create confirmed quotation / order record for financial tracking & customer history
      const orderId = 'qt_ord_' + crypto.randomUUID().substring(0, 8);
      const unitPrice = parseFloat(product.base_price) || 0;
      const taxRate = parseFloat(product.tax_rate) || 0;
      const subtotal = unitPrice * qty;
      const taxAmount = (subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      // Find an eligible sales rep or admin for this company
      const repRes = await client.query(
        `SELECT id FROM users WHERE company_id = $1 AND role IN ('sales_rep', 'admin') LIMIT 1`,
        [companyId]
      );
      const repId = repRes.rows[0]?.id || 'u2';

      await client.query(
        `INSERT INTO quotations (id, company_id, customer_id, sales_rep_id, status, blended_risk_score, discount_percent, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'confirmed', 0, 0, NOW(), NOW())`,
        [orderId, companyId, customerId, repId]
      );

      const lineId = 'ql_' + crypto.randomUUID().substring(0, 8);
      await client.query(
        `INSERT INTO quotation_lines (id, quotation_id, product_id, quantity, unit_price, discount_percent, line_type)
         VALUES ($1, $2, $3, $4, $5, 0, 'one_time')`,
        [lineId, orderId, productId, qty, unitPrice]
      );

      // 6. Create payment record
      const rawMethod = (paymentMethod || 'cod').toLowerCase();
      let normalizedMethod = 'cod';
      if (rawMethod.includes('upi')) normalizedMethod = 'upi';
      else if (rawMethod === 'cod' || rawMethod.includes('cash')) normalizedMethod = 'cod';
      else normalizedMethod = 'manual';

      const payId = 'pay_' + crypto.randomBytes(6).toString('hex');
      try {
        await client.query('SAVEPOINT payment_savepoint');
        await client.query(
          `INSERT INTO payments (id, quotation_id, company_id, customer_id, amount, payment_type, payment_method, status)
           VALUES ($1, $2, $3, $4, $5, 'one-time', $6, $7)`,
          [payId, orderId, companyId, customerId, totalAmount, normalizedMethod, normalizedMethod === 'cod' ? 'pending' : 'completed']
        );
        await client.query('RELEASE SAVEPOINT payment_savepoint');
      } catch (payErr) {
        await client.query('ROLLBACK TO SAVEPOINT payment_savepoint');
        console.warn('Payment record notice in purchaseProduct:', payErr.message);
      }

      await client.query('COMMIT');

      // 7. Broadcast real-time stock update and pipeline update
      broadcastInventoryUpdate(companyId, { productId, type: 'customer_purchase', quantity: qty });
      broadcastPipelineUpdate(companyId, { quotationId: orderId, newStatus: 'confirmed' });

      // Get updated product stock to return
      const updatedProdRes = await pool.query('SELECT stock FROM products WHERE id = $1', [productId]);
      const newStock = updatedProdRes.rows[0]?.stock ?? 0;

      return res.status(201).json({
        success: true,
        orderId,
        productId,
        productName: product.name,
        quantityPurchased: qty,
        remainingStock: newStock,
        totalAmount,
        paymentMethod,
        deductTxns,
        message: `Purchase successful! Order #${orderId} placed. ${qty} unit(s) deducted from warehouse inventory.`
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Purchase product error:', err);
      if (err.statusCode) throw err;
      throw ApiError.badRequest(err.message || 'Failed to complete product purchase');
    } finally {
      client.release();
    }
  }
}

module.exports = new MarketplaceController();
