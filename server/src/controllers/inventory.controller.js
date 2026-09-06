const inventoryRepository = require('../repositories/inventory.repository');
const { pool } = require('../config/db');
const ApiError = require('../utils/apiError');
const { broadcastInventoryUpdate } = require('../services/socket.service');

class InventoryController {
  async getOverview(req, res) {
    const limit = parseInt(req.query.limit, 10) || 100;
    const offset = parseInt(req.query.offset, 10) || 0;
    
    const stock = await inventoryRepository.getStockOverview(req.companyId, limit, offset);
    return res.json(stock);
  }

  async adjustStock(req, res) {
    const { warehouseId, productId, type, quantity, reason, referenceId } = req.body;
    
    if (!warehouseId || !productId || !type || quantity === undefined) {
      throw ApiError.badRequest('Missing required fields for stock adjustment');
    }

    const qty = parseInt(quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      throw ApiError.badRequest('Quantity must be a positive integer');
    }

    if (!['in', 'out', 'adjustment', 'transfer'].includes(type)) {
      throw ApiError.badRequest('Invalid transaction type');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const txnId = await inventoryRepository.adjustStock(
        client,
        req.companyId,
        warehouseId,
        productId,
        req.user.id,
        type,
        qty,
        reason,
        referenceId
      );
      await client.query('COMMIT');
      broadcastInventoryUpdate(req.companyId, { productId, warehouseId, type, quantity: qty });
      return res.json({ success: true, txnId });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Stock adjustment error:', err);
      throw ApiError.internal('Failed to adjust stock');
    } finally {
      client.release();
    }
  }

  async getTransactions(req, res) {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    
    const history = await inventoryRepository.getTransactions(req.companyId, limit, offset);
    return res.json(history);
  }
}

module.exports = new InventoryController();
