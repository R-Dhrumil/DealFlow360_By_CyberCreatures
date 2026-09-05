const express = require('express');
const router = express.Router();
const approvalQueries = require('../db/queries/approvals.queries');
const authenticate = require('../middleware/authenticate');
const attachCompanyScope = require('../middleware/attachCompanyScope');
const checkRole = require('../middleware/checkRole');
const pool = require('../db/pool');

router.use(authenticate, attachCompanyScope);

// Get pending approvals
router.get('/pending', checkRole('sales_manager', 'finance', 'admin'), async (req, res) => {
  try {
    // If finance, we only want to fetch 'pending_finance_approval'. If manager, 'pending_approval'. If admin, both.
    let statusFilter = ['pending_approval', 'pending_finance_approval'];
    if (req.user.role === 'sales_manager') statusFilter = ['pending_approval'];
    if (req.user.role === 'finance') statusFilter = ['pending_finance_approval'];

    // Update query to handle array of statuses
    const result = await pool.query(`
      SELECT q.*, c.name as customer_name, u.name as rep_name
      FROM quotations q
      JOIN customers c ON q.customer_id = c.id
      JOIN users u ON q.sales_rep_id = u.id
      WHERE q.company_id = $1 AND q.status = ANY($2)
      ORDER BY q.created_at ASC
    `, [req.companyId, statusFilter]);
    
    const approvals = result.rows;
    
    // Fetch line details for each approval
    for (const approval of approvals) {
      approval.lines = await approvalQueries.getQuotationLines(approval.id);
    }
    
    res.json(approvals);
  } catch (error) {
    console.error('Pending approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Action on approval
router.post('/:quotationId/action', checkRole('sales_manager', 'finance', 'admin'), async (req, res) => {
  try {
    const { action, reason } = req.body; // action: 'approve' | 'reject' | 'return'
    const { quotationId } = req.params;

    if (!['approve', 'reject', 'return'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    await approvalQueries.logApprovalAction(quotationId, req.user.userId, action, reason);
    
    let newStatus = '';
    
    if (action === 'approve') {
      // Check if this requires finance approval
      const quotation = await pool.query('SELECT blended_risk_score FROM quotations WHERE id = $1', [quotationId]);
      const score = parseFloat(quotation.rows[0].blended_risk_score);
      
      const chainResult = await pool.query(`
        SELECT * FROM approval_chains 
        WHERE company_id = $1 AND min_discount <= $2 AND (max_discount IS NULL OR max_discount >= $2)
        ORDER BY min_discount DESC LIMIT 1
      `, [req.companyId, score]);
      
      const requiresFinance = chainResult.rows.length > 0 ? chainResult.rows[0].requires_finance : false;
      
      // If we are currently a manager and it requires finance, move it to finance queue
      // Wait, let's look at the current user's role.
      if (req.user.role === 'sales_manager' && requiresFinance) {
        newStatus = 'pending_finance_approval';
      } else {
        newStatus = 'approved';
      }
    }
    
    if (action === 'reject') newStatus = 'rejected';
    if (action === 'return') newStatus = 'draft';

    await approvalQueries.updateQuotationStatus(quotationId, newStatus);

    res.json({ success: true, newStatus });
  } catch (error) {
    console.error('Approval action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
