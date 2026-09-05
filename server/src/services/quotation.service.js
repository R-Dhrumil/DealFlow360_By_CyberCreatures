const quotationRepository = require('../repositories/quotation.repository');
const approvalRepository = require('../repositories/approval.repository');
const { computeBlendedRiskScore } = require('./riskScore.service');
const ApiError = require('../utils/apiError');

class QuotationService {
  async createQuotation(companyId, salesRepId, customerId, lines) {
    if (!customerId || !lines || !Array.isArray(lines) || lines.length === 0) {
      throw ApiError.badRequest('Customer ID and non-empty quotation lines array are required');
    }

    const quotation = await quotationRepository.createQuotation(
      companyId,
      customerId,
      salesRepId,
      'draft'
    );

    for (const line of lines) {
      await quotationRepository.createQuotationLine(
        quotation.id,
        line.productId,
        line.quantity,
        line.unitPrice,
        line.discountPercent || 0,
        line.lineType || 'one_time'
      );
    }

    return { quotationId: quotation.id };
  }

  async submitQuotation(companyId, quotationId) {
    const quotation = await quotationRepository.findByIdAndCompany(quotationId, companyId);
    if (!quotation) {
      throw ApiError.notFound('Quotation not found');
    }

    const linesRaw = await quotationRepository.findQuotationLinesWithCategory(quotationId);
    const lines = linesRaw.map(row => ({
      productId: row.product_id,
      quantity: row.quantity,
      unitPrice: parseFloat(row.unit_price),
      discountPercent: parseFloat(row.discount_percent),
      category: row.category
    }));

    const tierCeiling = await approvalRepository.getCustomerTierCeiling(companyId, quotation.customer_id);
    const categoryCeilings = await approvalRepository.getCategoryCeilings(companyId);
    const chains = await approvalRepository.getApprovalChains(companyId);

    const riskResult = computeBlendedRiskScore(lines, tierCeiling, categoryCeilings, chains);

    await quotationRepository.updateQuotationStatusAndScore(
      quotationId,
      riskResult.status,
      riskResult.blendedScore
    );

    return {
      quotationId,
      status: riskResult.status,
      blendedScore: riskResult.blendedScore,
      requiredApproval: riskResult.requiredApproval
    };
  }
}

module.exports = new QuotationService();
