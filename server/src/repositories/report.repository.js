const db = require('../config/db');

class ReportRepository {
  /**
   * Fetch distinct filter options available for the company (sales reps, categories, products)
   */
  async getFilterOptions(companyId) {
    const [repsRes, catsRes, prodsRes] = await Promise.all([
      db.query(
        `SELECT id, name, email, role 
         FROM users 
         WHERE company_id = $1 AND role IN ('sales_rep', 'sales_manager', 'admin')
         ORDER BY name ASC`,
        [companyId]
      ),
      db.query(
        `SELECT DISTINCT category 
         FROM products 
         WHERE company_id = $1 AND category IS NOT NULL 
         ORDER BY category ASC`,
        [companyId]
      ),
      db.query(
        `SELECT id, name, category, base_price 
         FROM products 
         WHERE company_id = $1 
         ORDER BY name ASC`,
        [companyId]
      )
    ]);

    return {
      salesReps: repsRes.rows,
      categories: catsRes.rows.map(r => r.category),
      products: prodsRes.rows
    };
  }

  /**
   * Build parameterized SQL WHERE clause conditions based on reporting filters
   */
  buildWhereClause(companyId, filters = {}) {
    const conditions = ['q.company_id = $1'];
    const params = [companyId];
    let idx = 2;

    const { period, startDate, endDate, repId, status, category, productId } = filters;

    // 1. Period Filter (today, week, month, custom, all)
    if (period === 'today') {
      conditions.push(`q.created_at >= CURRENT_DATE`);
    } else if (period === 'week') {
      conditions.push(`q.created_at >= CURRENT_DATE - INTERVAL '7 days'`);
    } else if (period === 'month') {
      conditions.push(`q.created_at >= CURRENT_DATE - INTERVAL '30 days'`);
    } else if (period === 'custom' || (startDate && endDate)) {
      if (startDate) {
        conditions.push(`q.created_at >= $${idx}::timestamp`);
        params.push(startDate);
        idx++;
      }
      if (endDate) {
        conditions.push(`q.created_at <= ($${idx}::date + INTERVAL '1 day')`);
        params.push(endDate);
        idx++;
      }
    }

    // 2. Sales Team / Rep Filter
    if (repId && repId !== 'all') {
      conditions.push(`q.sales_rep_id = $${idx}`);
      params.push(repId);
      idx++;
    }

    // 3. Approval Status Filter
    if (status && status !== 'all') {
      if (status === 'pending') {
        conditions.push(`q.status IN ('pending_approval', 'pending_finance_approval', 'pending_admin_approval')`);
      } else if (status === 'approved' || status === 'won') {
        conditions.push(`q.status IN ('approved', 'confirmed', 'accepted')`);
      } else if (status === 'rejected') {
        conditions.push(`q.status = 'rejected'`);
      } else if (status === 'draft') {
        conditions.push(`q.status = 'draft'`);
      } else {
        conditions.push(`q.status = $${idx}`);
        params.push(status);
        idx++;
      }
    }

    // 4. Product / Category Filter
    if (category && category !== 'all') {
      conditions.push(`EXISTS (
        SELECT 1 FROM quotation_lines ql_cat 
        JOIN products p_cat ON ql_cat.product_id = p_cat.id 
        WHERE ql_cat.quotation_id = q.id AND p_cat.category = $${idx}
      )`);
      params.push(category);
      idx++;
    }

    if (productId && productId !== 'all') {
      conditions.push(`EXISTS (
        SELECT 1 FROM quotation_lines ql_prd 
        WHERE ql_prd.quotation_id = q.id AND ql_prd.product_id = $${idx}
      )`);
      params.push(productId);
      idx++;
    }

    return {
      whereSql: conditions.join(' AND '),
      params
    };
  }

  /**
   * Fetch complete reporting dataset including KPIs, Rep breakdown, Product breakdown, and Quotation list
   */
  async getReportingData(companyId, filters = {}) {
    const { whereSql, params } = this.buildWhereClause(companyId, filters);

    // 1. KPI Summary Aggregation
    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT q.id) as total_quotations,
        COUNT(DISTINCT CASE WHEN q.status IN ('approved', 'confirmed', 'accepted') THEN q.id END) as won_deals,
        COUNT(DISTINCT CASE WHEN q.status IN ('pending_approval', 'pending_finance_approval', 'pending_admin_approval') THEN q.id END) as pending_deals,
        COUNT(DISTINCT CASE WHEN q.status = 'rejected' THEN q.id END) as rejected_deals,
        COALESCE(SUM(CASE WHEN q.status IN ('approved', 'confirmed', 'accepted') THEN ql.unit_price * ql.quantity * (1 - ql.discount_percent/100) ELSE 0 END), 0) as total_won_revenue,
        COALESCE(SUM(ql.unit_price * ql.quantity * (1 - ql.discount_percent/100)), 0) as total_pipeline_value,
        COALESCE(AVG(ql.discount_percent), 0) as avg_discount,
        COALESCE(AVG(q.blended_risk_score), 0) as avg_risk_score
      FROM quotations q
      LEFT JOIN quotation_lines ql ON q.id = ql.quotation_id
      LEFT JOIN products p ON ql.product_id = p.id
      WHERE ${whereSql}
    `;

    // 2. Sales Rep Performance Breakdown
    const repQuery = `
      SELECT 
        u.id as rep_id,
        u.name as rep_name,
        u.email as rep_email,
        u.role as rep_role,
        COUNT(DISTINCT q.id) as total_quotes,
        COUNT(DISTINCT CASE WHEN q.status IN ('approved', 'confirmed', 'accepted') THEN q.id END) as deals_won,
        COUNT(DISTINCT CASE WHEN q.status IN ('pending_approval', 'pending_finance_approval', 'pending_admin_approval') THEN q.id END) as deals_pending,
        COALESCE(SUM(CASE WHEN q.status IN ('approved', 'confirmed', 'accepted') THEN ql.unit_price * ql.quantity * (1 - ql.discount_percent/100) ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(ql.unit_price * ql.quantity * (1 - ql.discount_percent/100)), 0) as pipeline_value,
        COALESCE(AVG(ql.discount_percent), 0) as avg_discount
      FROM users u
      JOIN quotations q ON u.id = q.sales_rep_id
      LEFT JOIN quotation_lines ql ON q.id = ql.quotation_id
      LEFT JOIN products p ON ql.product_id = p.id
      WHERE ${whereSql}
      GROUP BY u.id, u.name, u.email, u.role
      ORDER BY total_revenue DESC, deals_won DESC, total_quotes DESC
    `;

    // 3. Product & Category Performance Breakdown (Best Selling & Most Discounted Items)
    const productQuery = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.category,
        p.base_price,
        p.floor_price,
        COUNT(DISTINCT q.id) as quotes_count,
        COALESCE(SUM(ql.quantity), 0) as total_units,
        COALESCE(SUM(CASE WHEN q.status IN ('approved', 'confirmed', 'accepted') THEN ql.unit_price * ql.quantity * (1 - ql.discount_percent/100) ELSE 0 END), 0) as won_revenue,
        COALESCE(SUM(ql.unit_price * ql.quantity * (1 - ql.discount_percent/100)), 0) as total_revenue,
        COALESCE(AVG(ql.discount_percent), 0) as avg_discount,
        COALESCE(MAX(ql.discount_percent), 0) as max_discount
      FROM products p
      JOIN quotation_lines ql ON p.id = ql.product_id
      JOIN quotations q ON ql.quotation_id = q.id
      WHERE ${whereSql}
      GROUP BY p.id, p.name, p.category, p.base_price, p.floor_price
      ORDER BY total_revenue DESC, total_units DESC
    `;

    // 4. Quotations Activity Log
    const quotationsQuery = `
      SELECT 
        q.id,
        q.status,
        q.blended_risk_score,
        q.created_at,
        c.name as customer_name,
        c.customer_tier,
        u.name as sales_rep_name,
        u.role as sales_rep_role,
        COALESCE(STRING_AGG(DISTINCT p.name, ', '), 'Standard Quote') as product_summary,
        COALESCE(SUM(ql.unit_price * ql.quantity * (1 - ql.discount_percent/100)), 0) as total_amount,
        COALESCE(MAX(ql.discount_percent), 0) as max_discount_applied,
        COUNT(ql.id) as lines_count
      FROM quotations q
      LEFT JOIN customers c ON q.customer_id = c.id
      LEFT JOIN users u ON q.sales_rep_id = u.id
      LEFT JOIN quotation_lines ql ON q.id = ql.quotation_id
      LEFT JOIN products p ON ql.product_id = p.id
      WHERE ${whereSql}
      GROUP BY q.id, c.name, c.customer_tier, u.name, u.role
      ORDER BY q.created_at DESC
      LIMIT 100
    `;

    // Execute queries in parallel
    const [summaryRes, repsRes, prodsRes, quotesRes] = await Promise.all([
      db.query(summaryQuery, params),
      db.query(repQuery, params),
      db.query(productQuery, params),
      db.query(quotationsQuery, params)
    ]);

    const sRow = summaryRes.rows[0] || {};
    const totalQuotations = parseInt(sRow.total_quotations || 0, 10);
    const wonDeals = parseInt(sRow.won_deals || 0, 10);
    const pendingDeals = parseInt(sRow.pending_deals || 0, 10);
    const rejectedDeals = parseInt(sRow.rejected_deals || 0, 10);
    const totalWonRevenue = parseFloat(sRow.total_won_revenue || 0);
    const totalPipelineValue = parseFloat(sRow.total_pipeline_value || 0);
    const avgDiscount = parseFloat(parseFloat(sRow.avg_discount || 0).toFixed(1));
    const winRate = totalQuotations > 0 ? parseFloat(((wonDeals / totalQuotations) * 100).toFixed(1)) : 0;
    // Estimated average margin proxy
    const avgMargin = Math.max(5, Math.min(85, parseFloat((38.0 - avgDiscount * 0.4).toFixed(1))));

    // Format Reps Performance
    const repPerformance = repsRes.rows.map(r => {
      const tQuotes = parseInt(r.total_quotes || 0, 10);
      const dWon = parseInt(r.deals_won || 0, 10);
      const repAvgDisc = parseFloat(parseFloat(r.avg_discount || 0).toFixed(1));
      const repWinRate = tQuotes > 0 ? parseFloat(((dWon / tQuotes) * 100).toFixed(1)) : 0;
      const repAvgMargin = Math.max(5, Math.min(85, parseFloat((40.0 - repAvgDisc * 0.5).toFixed(1))));

      return {
        id: r.rep_id,
        repName: r.rep_name,
        repEmail: r.rep_email,
        repRole: r.rep_role,
        totalQuotes: tQuotes,
        dealsWon: dWon,
        dealsPending: parseInt(r.deals_pending || 0, 10),
        totalRevenue: parseFloat(r.total_revenue || 0),
        pipelineValue: parseFloat(r.pipeline_value || 0),
        avgDiscount: repAvgDisc,
        avgMargin: repAvgMargin,
        winRate: repWinRate
      };
    });

    // Format Product Performance (Flag best sellers and most discounted)
    const productPerformance = prodsRes.rows.map((p, index) => {
      const pAvgDisc = parseFloat(parseFloat(p.avg_discount || 0).toFixed(1));
      const pMaxDisc = parseFloat(parseFloat(p.max_discount || 0).toFixed(1));
      const pTotalRev = parseFloat(p.total_revenue || 0);
      const pUnits = parseInt(p.total_units || 0, 10);

      return {
        id: p.product_id,
        name: p.product_name,
        category: p.category,
        basePrice: parseFloat(p.base_price || 0),
        floorPrice: p.floor_price ? parseFloat(p.floor_price) : null,
        quotesCount: parseInt(p.quotes_count || 0, 10),
        unitsQuoted: pUnits,
        totalRevenue: pTotalRev,
        wonRevenue: parseFloat(p.won_revenue || 0),
        avgDiscount: pAvgDisc,
        maxDiscount: pMaxDisc,
        isBestSeller: index < 2 && pTotalRev > 0, // Top 2 by revenue
        isMostDiscounted: pAvgDisc >= 12.0 || pMaxDisc >= 20.0
      };
    });

    return {
      summary: {
        totalQuotations,
        wonDeals,
        pendingDeals,
        rejectedDeals,
        totalWonRevenue,
        totalPipelineValue,
        avgDiscount,
        avgMargin,
        winRate
      },
      repPerformance,
      productPerformance,
      recentQuotations: quotesRes.rows
    };
  }
}

module.exports = new ReportRepository();
