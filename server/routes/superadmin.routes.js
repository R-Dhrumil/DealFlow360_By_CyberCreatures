const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const authenticate = require('../middleware/authenticate');
const checkRole = require('../middleware/checkRole');

router.use(authenticate, checkRole('super_admin'));

router.get('/companies', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id, 
        c.name, 
        c.subdomain_slug,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT q.id) as quotation_count,
        COALESCE(SUM(CASE WHEN q.status = 'approved' OR q.status = 'accepted' THEN 1 ELSE 0 END), 0) as won_deals
      FROM companies c
      LEFT JOIN users u ON c.id = u.company_id
      LEFT JOIN quotations q ON c.id = q.company_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Superadmin companies error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
