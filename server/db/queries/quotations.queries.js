const quotationRepository = require('../../src/repositories/quotation.repository');

module.exports = {
  createQuotation: (companyId, customerId, salesRepId, status) =>
    quotationRepository.createQuotation(companyId, customerId, salesRepId, status),
  createQuotationLine: (quotationId, productId, quantity, unitPrice, discountPercent, lineType) =>
    quotationRepository.createQuotationLine(quotationId, productId, quantity, unitPrice, discountPercent, lineType)
};
