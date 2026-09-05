const warehouseRepository = require('../../src/repositories/warehouse.repository');

module.exports = {
  getStockForProducts: (companyId, productIds) => warehouseRepository.getStockForProducts(companyId, productIds),
  saveFulfillmentSplit: (quotationId, splits) => warehouseRepository.saveFulfillmentSplit(quotationId, splits)
};
