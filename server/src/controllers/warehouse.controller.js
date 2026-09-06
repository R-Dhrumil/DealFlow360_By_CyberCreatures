const warehouseRepository = require('../repositories/warehouse.repository');
const quotationRepository = require('../repositories/quotation.repository');
const inventoryRepository = require('../repositories/inventory.repository');
const { pool } = require('../config/db');
const { calculateFulfillmentSplits } = require('../services/fulfillment.service');
const ApiError = require('../utils/apiError');
const { emitRoleNotification, broadcastInventoryUpdate } = require('../services/socket.service');

class WarehouseController {
  async getCompanyWarehouses(req, res) {
    const warehouses = await warehouseRepository.findByCompany(req.companyId);
    return res.json(warehouses);
  }

  async createWarehouse(req, res) {
    const { name, location, shippingCostWeight, stockCount } = req.body;
    if (!name || !name.trim()) {
      throw ApiError.badRequest('Warehouse name is required');
    }
    const created = await warehouseRepository.create(req.companyId, {
      name: name.trim(),
      location: location ? location.trim() : 'Main Depot',
      shippingCostWeight: parseFloat(shippingCostWeight) || 1.0,
      stockCount: parseInt(stockCount, 10) || 0
    });
    return res.status(201).json(created);
  }

  async updateWarehouse(req, res) {
    const { id } = req.params;
    const { name, location, shippingCostWeight, stockCount, status } = req.body;
    const updated = await warehouseRepository.update(req.companyId, id, {
      name: name !== undefined ? name.trim() : undefined,
      location: location !== undefined ? location.trim() : undefined,
      shippingCostWeight: shippingCostWeight !== undefined ? parseFloat(shippingCostWeight) : undefined,
      stockCount: stockCount !== undefined ? parseInt(stockCount, 10) : undefined,
      status
    });
    if (!updated) {
      throw ApiError.notFound('Warehouse not found or access denied');
    }
    return res.json(updated);
  }

  async deleteWarehouse(req, res) {
    const { id } = req.params;
    const deleted = await warehouseRepository.delete(req.companyId, id);
    if (!deleted) {
      throw ApiError.notFound('Warehouse not found or access denied');
    }
    return res.json({ success: true, message: 'Warehouse deleted successfully', id });
  }

  async suggestSplit(req, res) {
    const quotationId = req.params.id;
    const lines = await quotationRepository.findQuotationLinesWithCategory(quotationId);
    
    const productIds = lines.map(l => l.product_id);
    const stockData = await warehouseRepository.getStockForProducts(req.companyId, productIds);
    
    const formattedLines = lines.map(l => ({
      id: l.id,
      productId: l.product_id,
      productName: l.product_name,
      quantity: l.quantity
    }));

    const splits = calculateFulfillmentSplits(formattedLines, stockData);
    return res.json(splits);
  }

  async acceptSplit(req, res) {
    const quotationId = req.params.id;
    const { splits, dispatch = true } = req.body;
    
    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      throw ApiError.badRequest('Splits array data is required');
    }

    await warehouseRepository.saveFulfillmentSplit(quotationId, splits);

    // If dispatch is requested, deduct allocated stock from respective warehouses
    if (dispatch) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        for (const split of splits) {
          const whId = split.warehouseId || split.warehouse_id;
          const prodId = split.productId || split.product_id;
          const qty = parseInt(split.quantity, 10) || 0;
          if (whId && prodId && qty > 0) {
            await inventoryRepository.adjustStock(
              client,
              req.companyId,
              whId,
              prodId,
              req.user?.id || null,
              'out',
              qty,
              `Fulfillment Split Allocation (Quote #${quotationId})`,
              quotationId
            );
          }
        }
        await client.query('COMMIT');
        broadcastInventoryUpdate(req.companyId, { quotationId, type: 'split_allocated' });
      } catch (err) {
        await client.query('ROLLBACK');
        console.warn('Split stock deduction notice:', err.message);
      } finally {
        client.release();
      }
    }

    emitRoleNotification(['operations', 'admin', 'sales_manager'], {
      type: 'success',
      title: '📦 Fulfillment Allocated',
      message: `Fulfillment split saved for Quote #${quotationId}. Stock allocated and dispatches updated.`,
      link: `/app/fulfillment/${quotationId}`
    });

    return res.json({ success: true, message: 'Fulfillment splits accepted and stock allocated successfully.' });
  }
}

module.exports = new WarehouseController();
