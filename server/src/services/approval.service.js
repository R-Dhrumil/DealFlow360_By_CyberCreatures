const approvalRepository = require('../repositories/approval.repository');
const quotationRepository = require('../repositories/quotation.repository');
const ApiError = require('../utils/apiError');
const { emitUserNotification, emitCompanyRoleNotification, broadcastPipelineUpdate } = require('./socket.service');

class ApprovalService {
  async getPendingApprovals(companyId, role) {
    let statusFilter = ['pending_approval', 'pending_finance_approval'];
    if (role === 'sales_manager') statusFilter = ['pending_approval', 'pending_finance_approval'];
    if (role === 'finance') statusFilter = ['pending_finance_approval'];
    if (role === 'admin' || role === 'super_admin') statusFilter = ['pending_approval', 'pending_finance_approval', 'draft'];

    const approvals = await approvalRepository.getPendingApprovalsByStatusFilter(companyId, statusFilter);

    for (const approval of approvals) {
      approval.lines = await quotationRepository.findQuotationLinesWithCategory(approval.id);
    }

    return approvals;
  }

  async processApprovalAction(companyId, userId, userRole, quotationId, action, reason) {
    if (!['approve', 'reject', 'return'].includes(action)) {
      throw ApiError.badRequest('Invalid approval action. Must be approve, reject, or return');
    }

    await approvalRepository.logApprovalAction(quotationId, userId, action, reason);

    const quotation = await quotationRepository.findByIdAndCompany(quotationId, companyId);
    let newStatus = '';

    if (action === 'approve') {
      if (!quotation) {
        throw ApiError.notFound('Quotation not found');
      }
      const score = parseFloat(quotation.blended_risk_score);
      const chains = await approvalRepository.getApprovalChains(companyId);

      const matchingChain = chains.find(chain => {
        const min = parseFloat(chain.min_discount);
        const max = chain.max_discount ? parseFloat(chain.max_discount) : 100;
        return score >= min && score <= max;
      });

      const requiresFinance = matchingChain ? matchingChain.requires_finance : false;

      if (userRole === 'sales_manager' && requiresFinance) {
        newStatus = 'pending_finance_approval';
      } else {
        newStatus = 'approved';
      }
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'return') {
      newStatus = 'draft';
    }

    await approvalRepository.updateQuotationStatus(quotationId, newStatus);

    // Emit real-time pipeline update so Kanban boards refresh automatically
    broadcastPipelineUpdate(companyId, { quotationId, newStatus });

    // Emit Real-time Toast Notifications to dedicated company admin/roles & user
    if (quotation) {
      const salesRepId = quotation.sales_rep_id;
      if (newStatus === 'approved') {
        emitUserNotification(salesRepId, {
          type: 'success',
          title: 'Quotation Approved',
          message: `Quote #${quotationId} has been approved by ${userRole.replace('_', ' ')}.`,
          link: `/app/quote/${quotationId}`
        });
        emitCompanyRoleNotification(companyId, ['admin', 'sales_manager'], {
          type: 'success',
          title: 'Quotation Approved',
          message: `Quote #${quotationId} was approved.`,
          link: `/app/quote/${quotationId}`
        });
      } else if (newStatus === 'pending_finance_approval') {
        emitUserNotification(salesRepId, {
          type: 'info',
          title: 'Finance Review Required',
          message: `Quote #${quotationId} passed Manager review and is now pending Finance approval.`,
          link: `/app/quote/${quotationId}`
        });
        emitCompanyRoleNotification(companyId, ['finance', 'admin'], {
          type: 'warning',
          title: 'Finance Approval Needed',
          message: `Quote #${quotationId} requires finance team review and approval.`,
          link: `/app/approvals`
        });
      } else if (newStatus === 'rejected') {
        emitUserNotification(salesRepId, {
          type: 'error',
          title: 'Quotation Rejected',
          message: `Quote #${quotationId} was rejected. ${reason ? `Reason: ${reason}` : ''}`,
          link: `/app/quote/${quotationId}`
        });
        emitCompanyRoleNotification(companyId, ['admin'], {
          type: 'error',
          title: 'Quotation Rejected',
          message: `Quote #${quotationId} was rejected by ${userRole.replace('_', ' ')}.`,
          link: `/app/approvals`
        });
      } else if (newStatus === 'draft') {
        emitUserNotification(salesRepId, {
          type: 'warning',
          title: 'Quotation Returned',
          message: `Quote #${quotationId} was returned to draft for revision. ${reason ? `Reason: ${reason}` : ''}`,
          link: `/app/quote/${quotationId}`
        });
      }
    }

    return { quotationId, newStatus };
  }
}

module.exports = new ApprovalService();
