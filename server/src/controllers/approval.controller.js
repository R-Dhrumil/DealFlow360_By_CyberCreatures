const approvalService = require('../services/approval.service');
const approvalRepository = require('../repositories/approval.repository');

class ApprovalController {
  /** GET /approvals/pending */
  async getPending(req, res) {
    const userId = req.user?.userId || req.user?.id;
    const { scope } = req.query;
    const approvals = await approvalService.getPendingApprovals(req.companyId, req.user.role, userId, scope || null);
    return res.json(approvals);
  }

  /** POST /approvals/:quotationId/action */
  async processAction(req, res) {
    const { action, reason, modifiedLines } = req.body;
    const { quotationId } = req.params;
    const userId = req.user?.userId || req.user?.id;
    const result = await approvalService.processApprovalAction(
      req.companyId,
      userId,
      req.user.role,
      quotationId,
      action,
      reason,
      modifiedLines || null
    );
    return res.json({ success: true, ...result });
  }

  /** GET /approvals/stats — Role-specific dashboard counts */
  async getStats(req, res) {
    const userId = req.user?.userId || req.user?.id;
    const stats = await approvalService.getApprovalStats(req.companyId, req.user.role, userId);
    return res.json(stats);
  }

  /** GET /approvals/config/discount-tiers — Company discount tier config */
  async getDiscountTiers(req, res) {
    const tiers = await approvalRepository.getDiscountTiers(req.companyId);
    return res.json(tiers);
  }

  /** PUT /approvals/config/discount-tiers — Upsert a discount tier */
  async upsertDiscountTier(req, res) {
    const { tierName, maxDiscountPercent, minMarginPercent, approver } = req.body;
    if (!tierName || maxDiscountPercent === undefined) {
      return res.status(400).json({ error: 'tierName and maxDiscountPercent are required' });
    }
    const tier = await approvalRepository.upsertDiscountTier(
      req.companyId,
      tierName,
      maxDiscountPercent,
      minMarginPercent,
      approver
    );
    return res.json({ success: true, tier });
  }

  /** GET /approvals/config/category-discounts */
  async getCategoryDiscounts(req, res) {
    const discounts = await approvalRepository.getCategoryDiscounts(req.companyId);
    return res.json(discounts);
  }

  /** PUT /approvals/config/category-discounts */
  async upsertCategoryDiscount(req, res) {
    const { category, maxDiscountPercent, defaultMargin } = req.body;
    if (!category || maxDiscountPercent === undefined) {
      return res.status(400).json({ error: 'category and maxDiscountPercent are required' });
    }
    const discount = await approvalRepository.upsertCategoryDiscount(
      req.companyId,
      category,
      maxDiscountPercent,
      defaultMargin !== undefined ? defaultMargin : null
    );
    return res.json({ success: true, discount });
  }

  /** GET /approvals/audit-logs */
  async getAuditLogs(req, res) {
    const limit = parseInt(req.query.limit, 10) || 50;
    const logs = await approvalRepository.getAuditLogs(req.companyId, limit);
    return res.json(logs);
  }
}

module.exports = new ApprovalController();
