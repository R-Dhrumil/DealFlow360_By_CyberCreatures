const warehouseRepository = require('../repositories/warehouse.repository');
const quotationRepository = require('../repositories/quotation.repository');
const { calculateFulfillmentSplits } = require('../services/fulfillment.service');
const ApiError = require('../utils/apiError');

class WarehouseController {
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
    const { splits } = req.body;
    
    if (!splits || !Array.isArray(splits) || splits.length === 0) {
      throw ApiError.badRequest('Splits array data is required');
    }

    await warehouseRepository.saveFulfillmentSplit(quotationId, splits);
    return res.json({ success: true });
  }
}

module.exports = new WarehouseController();
