const approvalRepository = require('../../src/repositories/approval.repository');
const quotationRepository = require('../../src/repositories/quotation.repository');

module.exports = {
  getPendingApprovals: (companyId) => approvalRepository.getPendingApprovalsByStatusFilter(companyId, ['pending_approval']),
  getQuotationLines: (quotationId) => quotationRepository.findQuotationLinesWithCategory(quotationId),
  logApprovalAction: (quotationId, approverId, action, reason) => approvalRepository.logApprovalAction(quotationId, approverId, action, reason),
  updateQuotationStatus: (quotationId, status) => approvalRepository.updateQuotationStatus(quotationId, status)
};
