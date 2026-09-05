const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Public route to get products across all companies
router.get('/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    
    let query = `
      SELECT 
        p.id, p.name, p.category, p.base_price, p.unit, p.description, p.is_promoted,
        c.name as company_name, c.logo_url as company_logo
      FROM products p
      JOIN companies c ON p.company_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND p.category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }

    if (search) {
      query += ` AND p.name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY p.is_promoted DESC, p.name ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Marketplace error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
