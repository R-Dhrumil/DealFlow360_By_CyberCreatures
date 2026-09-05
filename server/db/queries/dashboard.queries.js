const dashboardRepository = require('../../src/repositories/dashboard.repository');

module.exports = {
  getDashboardMetrics: (companyId) => dashboardRepository.getDashboardMetrics(companyId),
  getHighRiskDeals: (companyId, limit) => dashboardRepository.getHighRiskDeals(companyId, limit)
};
