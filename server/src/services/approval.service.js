const approvalRepository = require('../repositories/approval.repository');
const quotationRepository = require('../repositories/quotation.repository');
const quotationService = require('./quotation.service');
const ApiError = require('../utils/apiError');
const { emitUserNotification, emitCompanyRoleNotification, broadcastPipelineUpdate } = require('./socket.service');
const { logAction } = require('./audit.service');

class ApprovalService {
  /**
   * Get pending approvals filtered strictly by the caller's authorized approval level:
   * - sales_manager: pending_approval (manager review level)
   * - finance/finance_manager: pending_finance_approval (finance level)
   * - admin/super_admin: all pending tiers (pending_admin_approval, pending_finance_approval, pending_approval)
   * - sales_rep: their own quotations awaiting approval
   * Pass scope='all' to see all company pending approvals across tiers.
   */
  async getPendingApprovals(companyId, role, userId = null, scope = null) {
    let statusFilter;

    if (scope === 'all' || ['admin', 'super_admin'].includes(role)) {
      statusFilter = ['pending_admin_approval', 'pending_finance_approval', 'pending_approval'];
    } else if (role === 'sales_manager') {
      statusFilter = ['pending_approval'];
    } else if (['finance', 'finance_manager'].includes(role)) {
      statusFilter = ['pending_finance_approval'];
    } else if (role === 'sales_rep') {
      statusFilter = ['pending_approval', 'pending_finance_approval', 'pending_admin_approval'];
    } else {
      statusFilter = ['pending_approval', 'pending_finance_approval', 'pending_admin_approval'];
    }

    const approvals = await approvalRepository.getPendingApprovalsByStatusFilter(
      companyId, statusFilter, role === 'sales_rep' ? userId : null
    );

    for (const approval of approvals) {
      approval.lines = await quotationRepository.findQuotationLinesWithCategory(approval.id);
    }

    return approvals;
  }

  /**
   * Process an approval action: approve | reject | return | modify_and_approve
   *
   * 'modify_and_approve': Manager/Admin can submit updated line discounts along with approval.
   */
  async processApprovalAction(companyId, userId, userRole, quotationId, action, reason, modifiedLines = null) {
    if (!['approve', 'reject', 'return', 'modify_and_approve'].includes(action)) {
      throw ApiError.badRequest('Invalid action. Must be approve, reject, return, or modify_and_approve');
    }

    // Log the approval action record
    const actionLabel = action === 'modify_and_approve' ? 'approve' : action;
    await approvalRepository.logApprovalAction(quotationId, userId, actionLabel, reason);

    const quotation = await quotationRepository.findByIdAndCompany(quotationId, companyId);
    if (!quotation) throw ApiError.notFound('Quotation not found');

    let newStatus = '';
    let newApprovalLevel = null;

    if (action === 'approve' || action === 'modify_and_approve') {
      const result = await quotationService.approveQuotation(
        companyId, quotationId, userRole, userId,
        (action === 'modify_and_approve' && modifiedLines) ? modifiedLines : null
      );
      newStatus = result.status;
      newApprovalLevel = result.approvalLevel;
    } else if (action === 'reject') {
      const result = await quotationService.rejectQuotation(companyId, quotationId, userRole, userId, reason);
      newStatus = result.status;
    } else if (action === 'return') {
      // Return to draft for salesperson to revise
      await approvalRepository.updateQuotationStatus(quotationId, 'draft');
      await logAction('quotation', quotationId, userId, `returned_by_${userRole}`, { reason });
      broadcastPipelineUpdate(companyId, { quotationId, newStatus: 'draft' });
      newStatus = 'draft';

      if (quotation) {
        emitUserNotification(quotation.sales_rep_id, {
          type: 'warning',
          title: '↩️ Quotation Returned',
          message: `Quote #${quotationId} was returned for revision. ${reason ? `Reason: ${reason}` : ''}`,
          link: `/app/quote/${quotationId}`
        });
      }
    }

    return { quotationId, newStatus, approvalLevel: newApprovalLevel };
  }

  /**
   * Get counts for dashboard widgets per role.
   */
  async getApprovalStats(companyId, role, userId) {
    const stats = {};

    if (role === 'sales_rep') {
      const res = await approvalRepository.getRepQuotationStats(companyId, userId);
      stats.myQuotations = parseInt(res.my_quotations || 0);
      stats.myDrafts = parseInt(res.my_drafts || 0);
      stats.pendingApproval = parseInt(res.pending_approval || 0);
      stats.approved = parseInt(res.approved || 0);
      stats.rejected = parseInt(res.rejected || 0);
    } else if (['sales_manager', 'finance', 'finance_manager'].includes(role)) {
      const res = await approvalRepository.getManagerApprovalStats(companyId);
      stats.pendingApproval = parseInt(res.pending_approval || 0);
      stats.pendingFinanceApproval = parseInt(res.pending_finance_approval || 0);
      stats.escalatedToAdmin = parseInt(res.pending_admin_approval || 0);
      stats.approved = parseInt(res.approved || 0);
      stats.rejected = parseInt(res.rejected || 0);
    } else if (['admin', 'super_admin'].includes(role)) {
      const res = await approvalRepository.getAdminApprovalStats(companyId);
      stats.adminApprovals = parseInt(res.pending_admin_approval || 0);
      stats.pendingApproval = parseInt(res.pending_approval || 0);
      stats.approved = parseInt(res.approved || 0);
      stats.rejected = parseInt(res.rejected || 0);
      stats.totalActive = parseInt(res.total_active || 0);
    }

    return stats;
  }
}

module.exports = new ApprovalService();
