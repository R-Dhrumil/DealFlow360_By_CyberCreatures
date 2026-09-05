const express = require('express');
const router = express.Router();
const warehouseQueries = require('../db/queries/warehouses.queries');
const approvalQueries = require('../db/queries/approvals.queries');
const { calculateFulfillmentSplits } = require('../services/fulfillment');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');

router.use(authenticate, attachCompanyScope);

// Get suggested splits for a quotation
router.get('/quotations/:id/suggest-split', checkRole('sales_manager', 'admin', 'sales_rep'), async (req, res) => {
  try {
    const quotationId = req.params.id;
    
    // Get quotation lines
    const lines = await approvalQueries.getQuotationLines(quotationId);
    
    // Get stock data for the products in the quotation
    const productIds = lines.map(l => l.product_id);
    const stockData = await warehouseQueries.getStockForProducts(req.companyId, productIds);
    
    // Map lines to expected format for calculation
    const formattedLines = lines.map(l => ({
      id: l.id,
      productId: l.product_id,
      productName: l.product_name,
      quantity: l.quantity
    }));

    // Calculate splits
    const splits = calculateFulfillmentSplits(formattedLines, stockData);
    
    res.json(splits);
  } catch (error) {
    console.error('Suggest split error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save accepted split
router.post('/quotations/:id/accept-split', checkRole('sales_manager', 'admin', 'sales_rep'), async (req, res) => {
  try {
    const quotationId = req.params.id;
    const { splits } = req.body;
    
    if (!splits || splits.length === 0) {
      return res.status(400).json({ error: 'Splits data is required' });
    }

    await warehouseQueries.saveFulfillmentSplit(quotationId, splits);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Accept split error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
