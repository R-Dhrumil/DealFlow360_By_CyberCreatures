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
      
      // 🚨 FIX: Price Manipulation Vulnerability
      const productIds = lines.map(l => l.productId);
      const productsRes = await client.query(
        'SELECT id, base_price FROM products WHERE id = ANY($1::varchar[]) AND company_id = $2', 
        [productIds, companyId]
      );
      
      const securePrices = {};
      productsRes.rows.forEach(p => {
        securePrices[p.id] = parseFloat(p.base_price);
      });

      const quotation = await quotationRepository.createQuotation(
        companyId,
        customerId,
        salesRepId,
        'draft',
        client
      );

      for (const line of lines) {
        const truePrice = securePrices[line.productId];
        if (truePrice === undefined) {
          throw ApiError.badRequest(`Product ID ${line.productId} is invalid or does not belong to your company.`);
        }

        // Clamp discount between 0 and 100 to prevent negative discounts (which would increase price)
        const safeDiscount = Math.max(0, Math.min(100, parseFloat(line.discountPercent || 0)));

        await quotationRepository.createQuotationLine(
          quotation.id,
          line.productId,
          line.quantity,
          truePrice,
          safeDiscount,
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
