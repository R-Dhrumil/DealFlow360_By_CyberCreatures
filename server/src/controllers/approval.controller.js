const approvalService = require('../services/approval.service');

class ApprovalController {
  async getPending(req, res) {
    const approvals = await approvalService.getPendingApprovals(req.companyId, req.user.role);
    return res.json(approvals);
  }

  async processAction(req, res) {
    const { action, reason } = req.body;
    const { quotationId } = req.params;
    const result = await approvalService.processApprovalAction(
      req.companyId,
      req.user.userId,
      req.user.role,
      quotationId,
      action,
      reason
    );
    return res.json({ success: true, ...result });
  }
}

module.exports = new ApprovalController();
