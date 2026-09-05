const approvalRepository = require('../../src/repositories/approval.repository');

module.exports = {
  getCustomerTierCeiling: (companyId, customerId) => approvalRepository.getCustomerTierCeiling(companyId, customerId),
  getCategoryCeilings: (companyId) => approvalRepository.getCategoryCeilings(companyId),
  getApprovalChains: (companyId) => approvalRepository.getApprovalChains(companyId)
};
