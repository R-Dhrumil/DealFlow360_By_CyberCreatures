const express = require('express');
const router = express.Router();
const dashboardQueries = require('../db/queries/dashboard.queries');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');

router.use(authenticate, attachCompanyScope);

router.get('/', checkRole('sales_manager', 'admin'), async (req, res) => {
  try {
    const metrics = await dashboardQueries.getDashboardMetrics(req.companyId);
    const highRiskDeals = await dashboardQueries.getHighRiskDeals(req.companyId);
    
    res.json({
      metrics,
      highRiskDeals
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
