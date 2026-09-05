const approvalRepository = require('../repositories/approval.repository');
const quotationRepository = require('../repositories/quotation.repository');
const ApiError = require('../utils/apiError');

class ApprovalService {
  async getPendingApprovals(companyId, role) {
    let statusFilter = ['pending_approval', 'pending_finance_approval'];
    if (role === 'sales_manager') statusFilter = ['pending_approval'];
    if (role === 'finance') statusFilter = ['pending_finance_approval'];

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

    let newStatus = '';

    if (action === 'approve') {
      const quotation = await quotationRepository.findByIdAndCompany(quotationId, companyId);
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

    return { quotationId, newStatus };
  }
}

module.exports = new ApprovalService();
