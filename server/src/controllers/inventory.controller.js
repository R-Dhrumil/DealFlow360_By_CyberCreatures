const inventoryRepository = require('../repositories/inventory.repository');
const { pool } = require('../config/db');
const ApiError = require('../utils/apiError');
const { broadcastInventoryUpdate } = require('../services/socket.service');

class InventoryController {
  async getOverview(req, res) {
    const stock = await inventoryRepository.getStockOverview(req.companyId);
    return res.json(stock);
  }

  async adjustStock(req, res) {
    const { warehouseId, fromWarehouseId, toWarehouseId, productId, type, quantity, reason, referenceId } = req.body;
    
    if (!productId || !type || quantity === undefined) {
      throw ApiError.badRequest('Missing required fields (productId, type, quantity)');
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

      let resultData;
      if (type === 'transfer') {
        const sourceWh = fromWarehouseId || warehouseId;
        if (!sourceWh || !toWarehouseId) {
          throw ApiError.badRequest('Transfer requires both source and destination warehouses');
        }
        if (sourceWh === toWarehouseId) {
          throw ApiError.badRequest('Source and destination warehouses cannot be the same');
        }
        resultData = await inventoryRepository.transferStock(
          client,
          req.companyId,
          sourceWh,
          toWarehouseId,
          productId,
          req.user.id,
          qty,
          reason,
          referenceId
        );
      } else {
        const targetWh = warehouseId || fromWarehouseId;
        if (!targetWh) {
          throw ApiError.badRequest('Warehouse ID is required for stock adjustment');
        }
        const txnId = await inventoryRepository.adjustStock(
          client,
          req.companyId,
          targetWh,
          productId,
          req.user.id,
          type,
          qty,
          reason,
          referenceId
        );
        resultData = { txnId };
      }

      await client.query('COMMIT');
      broadcastInventoryUpdate(req.companyId, { productId, type, quantity: qty });
      return res.json({ success: true, ...resultData });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Stock adjustment error:', err);
      if (err.statusCode) throw err;
      throw ApiError.badRequest(err.message || 'Failed to adjust stock');
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
