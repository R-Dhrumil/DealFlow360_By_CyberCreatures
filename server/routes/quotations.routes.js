const express = require('express');
const router = express.Router();
const quotationQueries = require('../db/queries/quotations.queries');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');

router.use(authenticate, attachCompanyScope);

const riskQueries = require('../db/queries/riskScore.queries');
const { computeBlendedRiskScore } = require('../services/riskScore');
const pool = require('../db/pool'); // needed for updating status if we don't have a query function yet

// Create a new quotation
router.post('/', checkRole('sales_rep'), async (req, res) => {
  try {
    const { customerId, lines } = req.body;
    
    // Create draft quotation
    const quotation = await quotationQueries.createQuotation(
      req.companyId,
      customerId,
      req.user.userId,
      'draft'
    );

    // Add lines
    for (const line of lines) {
      await quotationQueries.createQuotationLine(
        quotation.id,
        line.productId,
        line.quantity,
        line.unitPrice,
        line.discountPercent || 0,
        line.lineType || 'one_time'
      );
    }

    res.status(201).json({ success: true, quotationId: quotation.id });
  } catch (error) {
    console.error('Create quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit a quotation (triggers risk score)
router.put('/:id/submit', checkRole('sales_rep'), async (req, res) => {
  try {
    const quotationId = req.params.id;
    
    // Fetch quotation to verify ownership
    const qResult = await pool.query('SELECT * FROM quotations WHERE id = $1 AND company_id = $2', [quotationId, req.companyId]);
    if (qResult.rows.length === 0) return res.status(404).json({ error: 'Quotation not found' });
    const quotation = qResult.rows[0];

    // Fetch lines with category
    const linesResult = await pool.query(`
      SELECT ql.*, p.category 
      FROM quotation_lines ql
      JOIN products p ON ql.product_id = p.id
      WHERE ql.quotation_id = $1
    `, [quotationId]);
    
    const lines = linesResult.rows.map(row => ({
      productId: row.product_id,
      quantity: row.quantity,
      unitPrice: parseFloat(row.unit_price),
      discountPercent: parseFloat(row.discount_percent),
      category: row.category
    }));

    // Fetch rules
    const tierCeiling = await riskQueries.getCustomerTierCeiling(req.companyId, quotation.customer_id);
    const categoryCeilings = await riskQueries.getCategoryCeilings(req.companyId);
    const chains = await riskQueries.getApprovalChains(req.companyId);

    // Compute score
    const riskResult = computeBlendedRiskScore(lines, tierCeiling, categoryCeilings, chains);

    // Update quotation status and score
    await pool.query(`
      UPDATE quotations 
      SET status = $1, blended_risk_score = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [riskResult.status, riskResult.blendedScore, quotationId]);

    res.json({
      success: true,
      quotationId,
      status: riskResult.status,
      blendedScore: riskResult.blendedScore,
      requiredApproval: riskResult.requiredApproval
    });

  } catch (error) {
    console.error('Submit quotation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
