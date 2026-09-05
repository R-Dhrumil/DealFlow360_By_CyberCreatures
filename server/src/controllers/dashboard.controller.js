const dashboardRepository = require('../repositories/dashboard.repository');

class DashboardController {
  async getMetrics(req, res) {
    const metrics = await dashboardRepository.getDashboardMetrics(req.companyId);
    const highRiskDeals = await dashboardRepository.getHighRiskDeals(req.companyId);
    
    return res.json({
      metrics,
      highRiskDeals
    });
  }
}

module.exports = new DashboardController();
