const quotationRepository = require('../repositories/quotation.repository');
const approvalRepository = require('../repositories/approval.repository');
const db = require('../config/db');
const { computeBlendedRiskScore } = require('./riskScore.service');
const ApiError = require('../utils/apiError');

class QuotationService {
  async createQuotation(companyId, salesRepId, customerId, lines) {
    if (!customerId || !lines || !Array.isArray(lines) || lines.length === 0) {
      throw ApiError.badRequest('Customer ID and non-empty quotation lines array are required');
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      const quotation = await quotationRepository.createQuotation(
        companyId,
        customerId,
        salesRepId,
        'draft',
        client
      );

      for (const line of lines) {
        await quotationRepository.createQuotationLine(
          quotation.id,
          line.productId,
          line.quantity,
          line.unitPrice,
          line.discountPercent || 0,
          line.lineType || 'one_time',
          client
        );
      }

      await client.query('COMMIT');
      return { quotationId: quotation.id };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async submitQuotation(companyId, quotationId) {
    const client = await db.pool.connect();
    let riskResult;

    try {
      await client.query('BEGIN');

      // 1. Lock the row to prevent race conditions
      const quotation = await quotationRepository.findByIdAndCompanyForUpdate(quotationId, companyId, client);
      if (!quotation) {
        throw ApiError.notFound('Quotation not found');
      }

      // 2. State Validation
      if (quotation.status !== 'draft') {
        throw ApiError.conflict(`Quotation is already processed (Status: ${quotation.status})`);
      }

      // 3. Fetch dependencies and compute score
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

      riskResult = computeBlendedRiskScore(lines, tierCeiling, categoryCeilings, chains);

      // 4. Update status and auto-generate related records
      await quotationRepository.updateQuotationStatusAndScore(
        quotationId,
        riskResult.status,
        riskResult.blendedScore,
        client
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return {
      quotationId,
      status: riskResult.status,
      blendedScore: riskResult.blendedScore,
      requiredApproval: riskResult.requiredApproval
    };
  }
}

module.exports = new QuotationService();
