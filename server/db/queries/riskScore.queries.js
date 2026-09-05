const pool = require('../pool');

async function getCustomerTierCeiling(companyId, customerId) {
  // Try to find if customer is in price_lists for this company
  // For demo purposes, we simplify by just getting the tier from price_lists
  // Real app would link customer -> price_list more robustly
  const result = await pool.query(`
    SELECT pl.customer_tier, dt.max_discount_percent
    FROM price_lists pl
    JOIN discount_tiers dt ON pl.company_id = dt.company_id AND pl.customer_tier = dt.tier_name
    WHERE pl.company_id = $1
    LIMIT 1
  `, [companyId]);
  
  if (result.rows.length > 0) {
    return parseFloat(result.rows[0].max_discount_percent);
  }
  return 5.0; // Default fallback tier (Bronze)
}

async function getCategoryCeilings(companyId) {
  const result = await pool.query(`
    SELECT category, max_discount_percent
    FROM category_discount_ceiling
    WHERE company_id = $1
  `, [companyId]);
  
  const ceilings = {};
  result.rows.forEach(row => {
    ceilings[row.category] = parseFloat(row.max_discount_percent);
  });
  return ceilings;
}

async function getApprovalChains(companyId) {
  const result = await pool.query(`
    SELECT min_discount, max_discount, requires_manager, requires_finance
    FROM approval_chains
    WHERE company_id = $1
    ORDER BY min_discount ASC
  `, [companyId]);
  return result.rows;
}

module.exports = {
  getCustomerTierCeiling,
  getCategoryCeilings,
  getApprovalChains
};
