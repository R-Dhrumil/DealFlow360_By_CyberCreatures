const quotationRepository = require('../repositories/quotation.repository');
const approvalRepository = require('../repositories/approval.repository');
const db = require('../config/db');
const { computeBlendedRiskScore } = require('./riskScore.service');
const ApiError = require('../utils/apiError');
const { emitCompanyRoleNotification, emitUserNotification, broadcastPipelineUpdate } = require('./socket.service');

class QuotationService {
  async createQuotation(companyId, salesRepId, customerId, lines) {
    if (!customerId || !lines || !Array.isArray(lines) || lines.length === 0) {
      throw ApiError.badRequest('Customer ID and non-empty quotation lines array are required');
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // FIX: Price Manipulation Vulnerability
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

      // Emit Notification for quote draft creation & pipeline refresh
      emitCompanyRoleNotification(companyId, ['sales_manager', 'admin'], {
        type: 'info',
        title: 'New Quotation Draft',
        message: `Quotation #${quotation.id} created by Sales Rep.`,
        link: `/app/quote/${quotation.id}`
      });
      broadcastPipelineUpdate(companyId, { quotationId: quotation.id, newStatus: 'draft' });

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
    let quotation;

    try {
      await client.query('BEGIN');

      // 1. Lock the row to prevent race conditions
      quotation = await quotationRepository.findByIdAndCompanyForUpdate(quotationId, companyId, client);
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

    // Broadcast live pipeline move across all clients
    broadcastPipelineUpdate(companyId, { quotationId, newStatus: riskResult.status });

    // Real-time notifications on submit
    if (quotation) {
      const salesRepId = quotation.sales_rep_id;
      if (riskResult.status === 'approved') {
        emitUserNotification(salesRepId, {
          type: 'success',
          title: 'Quote Auto-Approved',
          message: `Quote #${quotationId} met discount threshold rules and was auto-approved!`,
          link: `/app/quote/${quotationId}`
        });
      } else if (riskResult.status === 'pending_approval') {
        emitCompanyRoleNotification(companyId, ['sales_manager', 'admin'], {
          type: 'warning',
          title: 'Approval Request',
          message: `Quote #${quotationId} requires management discount approval.`,
          link: `/app/approvals`
        });
        emitUserNotification(salesRepId, {
          type: 'info',
          title: 'Submitted for Approval',
          message: `Quote #${quotationId} submitted to Sales Manager for review.`,
          link: `/app/quote/${quotationId}`
        });
      } else if (riskResult.status === 'pending_finance_approval') {
        emitCompanyRoleNotification(companyId, ['finance', 'admin'], {
          type: 'warning',
          title: 'High-Risk Finance Review',
          message: `Quote #${quotationId} requires finance approval.`,
          link: `/app/approvals`
        });
      }
    }

    return {
      quotationId,
      status: riskResult.status,
      blendedScore: riskResult.blendedScore,
      requiredApproval: riskResult.requiredApproval
    };
  }

  async approveQuotation(companyId, quotationId, userRole) {
    const client = await db.pool.connect();
    let quotation;
    try {
      await client.query('BEGIN');
      quotation = await quotationRepository.findByIdAndCompanyForUpdate(quotationId, companyId, client);
      if (!quotation) throw ApiError.notFound('Quotation not found');

      if (quotation.status === 'pending_finance_approval' && userRole !== 'finance' && userRole !== 'admin') {
        throw ApiError.forbidden('Only Finance can approve this high-risk quotation');
      }
      if (quotation.status !== 'pending_approval' && quotation.status !== 'pending_finance_approval') {
        throw ApiError.conflict(`Cannot approve a quotation with status: ${quotation.status}`);
      }

      await quotationRepository.updateQuotationStatusAndScore(
        quotationId,
        'approved',
        quotation.blended_risk_score,
        client
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    broadcastPipelineUpdate(companyId, { quotationId, newStatus: 'approved' });

    if (quotation) {
      emitUserNotification(quotation.sales_rep_id, {
        type: 'success',
        title: 'Quotation Approved',
        message: `Quote #${quotationId} has been approved.`,
        link: `/app/quote/${quotationId}`
      });
      emitCompanyRoleNotification(companyId, ['admin', 'sales_manager'], {
        type: 'success',
        title: 'Quotation Approved',
        message: `Quote #${quotationId} approved by ${userRole.replace('_', ' ')}.`,
        link: `/app/quote/${quotationId}`
      });
    }

    return { quotationId, status: 'approved' };
  }

  async rejectQuotation(companyId, quotationId, userRole) {
    const client = await db.pool.connect();
    let quotation;
    try {
      await client.query('BEGIN');
      quotation = await quotationRepository.findByIdAndCompanyForUpdate(quotationId, companyId, client);
      if (!quotation) throw ApiError.notFound('Quotation not found');

      if (quotation.status === 'pending_finance_approval' && userRole !== 'finance' && userRole !== 'admin') {
        throw ApiError.forbidden('Only Finance can reject this high-risk quotation');
      }
      if (quotation.status !== 'pending_approval' && quotation.status !== 'pending_finance_approval') {
        throw ApiError.conflict(`Cannot reject a quotation with status: ${quotation.status}`);
      }

      await quotationRepository.updateQuotationStatusAndScore(
        quotationId,
        'rejected',
        quotation.blended_risk_score,
        client
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    broadcastPipelineUpdate(companyId, { quotationId, newStatus: 'rejected' });

    if (quotation) {
      emitUserNotification(quotation.sales_rep_id, {
        type: 'error',
        title: 'Quotation Rejected',
        message: `Quote #${quotationId} was rejected by ${userRole.replace('_', ' ')}.`,
        link: `/app/quote/${quotationId}`
      });
    }

    return { quotationId, status: 'rejected' };
  }

  async confirmQuotation(companyId, quotationId) {
    const client = await db.pool.connect();
    let quotation;
    try {
      await client.query('BEGIN');
      // companyId may be null for customer role — repository handles both cases
      quotation = await quotationRepository.findByIdAndCompanyForUpdate(quotationId, companyId || null, client);
      if (!quotation) throw ApiError.notFound('Quotation not found');

      // Terminal states that cannot be re-confirmed
      const terminalStates = ['confirmed', 'rejected'];
      if (terminalStates.includes(quotation.status)) {
        throw ApiError.conflict(`Quotation is already ${quotation.status}.`);
      }

      await quotationRepository.updateQuotationStatusAndScore(
        quotationId,
        'confirmed',
        quotation.blended_risk_score || 0,
        client
      );

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    const effectiveCompanyId = companyId || quotation.company_id;
    broadcastPipelineUpdate(effectiveCompanyId, { quotationId, newStatus: 'confirmed' });

    if (quotation) {
      emitCompanyRoleNotification(effectiveCompanyId, ['admin', 'sales_manager', 'operations'], {
        type: 'success',
        title: '🎉 Deal Confirmed!',
        message: `Quotation #${quotationId} was accepted & confirmed! Operations hub notified.`,
        link: `/app/operations`
      });
      emitUserNotification(quotation.sales_rep_id, {
        type: 'success',
        title: '🎉 Deal Confirmed!',
        message: `Your Quote #${quotationId} was accepted & confirmed by the customer!`,
        link: `/app/quote/${quotationId}`
      });
    }

    return { quotationId, status: 'confirmed' };
  }
}

module.exports = new QuotationService();
