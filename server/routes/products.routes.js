const express = require('express');
const router = express.Router();
const productQueries = require('../db/queries/products.queries');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');

router.use(authenticate, attachCompanyScope);

// Get products for the current company
router.get('/', checkRole('sales_rep', 'sales_manager', 'admin'), async (req, res) => {
  try {
    const products = await productQueries.getProductsByCompany(req.companyId);
    res.json(products);
  } catch (error) {
    console.error('Products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
