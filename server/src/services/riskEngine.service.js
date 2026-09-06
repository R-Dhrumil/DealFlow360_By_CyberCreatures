const db = require('../config/db');
const quotationRepository = require('../repositories/quotation.repository');
const customerRepository = require('../repositories/customer.repository');
const productRepository = require('../repositories/product.repository');

class RiskEngineService {
  /**
   * Calculates real-time risk for Quotation Builder UI without persisting.
   * This is used by the frontend when discounts are edited.
   */
  async calculateLiveRisk(companyId, customerId, lines) {
    return this._performRiskCalculation(companyId, customerId, lines);
  }

  /**
   * The main authoritative risk calculation function for a saved quotation.
   * Calculates everything and persists it to the database.
   */
  async calculateQuotationRisk(quotationId, companyId, client = null) {
    const shouldManageTransaction = !client;
    if (shouldManageTransaction) {
      client = await db.pool.connect();
      await client.query('BEGIN');
    }

    try {
      // 1. Load quotation
      const quotation = await quotationRepository.findByIdAndCompanyForUpdate(quotationId, companyId, client);
      if (!quotation) {
        throw new Error('Quotation not found or company mismatch');
      }

      // 2. Load quotation lines
      const linesRaw = await quotationRepository.findLinesWithProducts(quotationId, client);
      if (!linesRaw || linesRaw.length === 0) {
        return null;
      }

      const lines = linesRaw.map(l => ({
        id: l.id,
        productId: l.product_id,
        productName: l.product_name,
        category: l.category,
        quantity: parseInt(l.quantity, 10),
        unitPrice: parseFloat(l.unit_price),
        discountPercent: parseFloat(l.discount_percent || 0),
        netUnitPrice: parseFloat(l.unit_price) * (1 - parseFloat(l.discount_percent || 0) / 100)
      }));

      // Perform calculation
      const riskData = await this._performRiskCalculation(companyId, quotation.customer_id, lines, client);

      // Persist to Quotation Lines
      for (const line of riskData.lineDetails) {
        if (line.id) {
          await client.query(
            `UPDATE quotation_lines 
             SET discount_amount = $1, allowed_discount_percent = $2, excess_discount_percent = $3, 
                 line_risk_score = $4, line_risk_weight = $5
             WHERE id = $6`,
            [line.discountAmount, line.allowedDiscount, line.excessDiscount, line.lineRisk, line.lineWeight, line.id]
          );
        }
      }

      // Persist to Quotation
      await client.query(
        `UPDATE quotations
         SET risk_level = $1, manager_required = $2, finance_required = $3, total_discount_amount = $4,
             allowed_discount_amount = $5, excess_discount_amount = $6, blended_risk_score = $7,
             risk_calculated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [
          riskData.riskLevel,
          riskData.requiresManager,
          riskData.requiresFinance,
          riskData.totalDiscountAmount,
          riskData.allowedDiscountAmount,
          riskData.excessDiscountAmount,
          riskData.riskScore,
          quotationId
        ]
      );

      if (shouldManageTransaction) await client.query('COMMIT');
      return riskData;
    } catch (error) {
      if (shouldManageTransaction) await client.query('ROLLBACK');
      throw error;
    } finally {
      if (shouldManageTransaction) client.release();
    }
  }

  async _performRiskCalculation(companyId, customerId, lines, client = null) {
    const query = client ? client.query.bind(client) : db.pool.query.bind(db.pool);

    // Load customer
    let customer = null;
    if (customerId) {
      const resCust = await query('SELECT * FROM customers WHERE id = $1 AND (company_id = $2 OR company_id IS NULL)', [customerId, companyId]);
      customer = resCust.rows[0];
    }

    // Load customer category
    let customerCategory = null;
    let customerCategoryLimit = 0;
    if (customer && customer.customer_category_id) {
      const resCat = await query('SELECT * FROM customer_categories WHERE id = $1 AND company_id = $2', [customer.customer_category_id, companyId]);
      if (resCat.rows.length > 0) {
        customerCategory = resCat.rows[0];
        customerCategoryLimit = parseFloat(customerCategory.default_discount_percent || 0);
      }
    }

    // Fetch product discount rules for this company and customer category
    let rules = [];
    if (customerCategory) {
      const resRules = await query(`
        SELECT product_id, category, max_discount_percent 
        FROM product_discount_rules 
        WHERE company_id = $1 AND customer_category_id = $2 AND active = true
      `, [companyId, customerCategory.id]);
      rules = resRules.rows;
    }

    // Fetch general category ceilings (fallback)
    const resGenCeiling = await query(`SELECT category, max_discount_percent FROM category_discount_ceiling WHERE company_id = $1`, [companyId]);
    const generalCeilings = {};
    resGenCeiling.rows.forEach(r => {
      generalCeilings[r.category] = parseFloat(r.max_discount_percent);
    });

    let totalQuotationValue = 0;
    let totalDiscountAmount = 0;
    let allowedDiscountAmount = 0;
    let excessDiscountAmount = 0;

    for (const line of lines) {
      const lineGross = line.quantity * line.unitPrice;
      totalQuotationValue += lineGross;
    }

    let blendedExcessSum = 0;
    let violationsCount = 0;
    let maxLineExcess = 0;
    
    const lineDetails = lines.map(line => {
      const lineGross = line.quantity * line.unitPrice;
      const givenDiscount = line.discountPercent;
      const givenDiscountAmount = lineGross * (givenDiscount / 100);

      // Determine product specific limit
      let productLimit = null;
      
      // 1. Check Product Discount Rule (exact product)
      const exactRule = rules.find(r => r.product_id === line.productId);
      if (exactRule) {
        productLimit = parseFloat(exactRule.max_discount_percent);
      } 
      // 2. Check Product Discount Rule (category)
      else {
        const catRule = rules.find(r => r.category && line.category && r.category.toLowerCase() === line.category.toLowerCase());
        if (catRule) {
          productLimit = parseFloat(catRule.max_discount_percent);
        }
      }

      // 3. Fallback to general category ceiling if no rule found
      if (productLimit === null && line.category && generalCeilings[line.category] !== undefined) {
        productLimit = generalCeilings[line.category];
      }
      
      // If still null, default to 100% or fallback. Let's use 100% so we don't accidentally block.
      if (productLimit === null) productLimit = 100;

      // Allowed Discount = min(Customer Category Limit, Product/Category Limit)
      // If customer has no category, customerCategoryLimit is 0. 
      // But if there is no category, we might want to just rely on product limits.
      let allowedDiscount = productLimit;
      if (customerCategory) {
        allowedDiscount = Math.min(customerCategoryLimit, productLimit);
      } else {
         // Guest / unassigned customer fallback
        allowedDiscount = Math.min(10, productLimit); 
      }

      const excessDiscount = Math.max(0, givenDiscount - allowedDiscount);
      const lineAllowedAmount = lineGross * (allowedDiscount / 100);
      const lineExcessAmount = Math.max(0, givenDiscountAmount - lineAllowedAmount);

      const lineWeight = totalQuotationValue > 0 ? (lineGross / totalQuotationValue) : 0;
      const lineRiskScore = excessDiscount * lineWeight; // Weighted Line Risk

      blendedExcessSum += lineRiskScore;
      
      if (excessDiscount > 0) violationsCount++;
      if (excessDiscount > maxLineExcess) maxLineExcess = excessDiscount;

      totalDiscountAmount += givenDiscountAmount;
      allowedDiscountAmount += lineAllowedAmount;
      excessDiscountAmount += lineExcessAmount;

      return {
        ...line,
        allowedDiscount,
        excessDiscount,
        discountAmount: givenDiscountAmount,
        lineWeight,
        lineRisk: lineRiskScore,
        isViolation: excessDiscount > 0
      };
    });

    // Final Risk Score calculation (0-100)
    // - Blended Excess represents the average percentage points over the limit.
    // - Let's scale it. If blended excess is 10%, that's highly risky. 
    // - Let's multiply blendedExcessSum by 4 so 25% excess = 100 score.
    // - Add penalty for number of violations (e.g. +2 points per violation).
    // - Add penalty for severe single-line violation (e.g. maxLineExcess / 2).
    
    let rawScore = (blendedExcessSum * 4) + (violationsCount * 2) + (maxLineExcess * 0.5);
    let riskScore = Math.min(100, Math.max(0, parseFloat(rawScore.toFixed(2))));

    // Determine Risk Level & Approvals
    // LOW: 0-19, MEDIUM: 20-49, HIGH: 50-69, CRITICAL: 70-100
    let riskLevel = 'LOW';
    let requiresManager = false;
    let requiresFinance = false;

    if (riskScore >= 70) {
      riskLevel = 'CRITICAL';
      requiresManager = true;
      requiresFinance = true;
    } else if (riskScore >= 50) {
      riskLevel = 'HIGH';
      requiresManager = true;
      requiresFinance = true;
    } else if (riskScore >= 20) {
      riskLevel = 'MEDIUM';
      requiresManager = true;
      requiresFinance = false;
    } else {
      // Small penalty, e.g. 5 score, still auto-approve if under 20.
      riskLevel = 'LOW'; 
    }

    // Edge case: If there are ANY violations at all, we might want to force Manager review regardless of score.
    // The prompt says "Auto approve -> below 20". So we stick strictly to the score threshold.
    
    return {
      riskScore,
      riskLevel,
      requiresManager,
      requiresFinance,
      violationsCount,
      maxLineExcess,
      totalQuotationValue,
      totalDiscountAmount,
      allowedDiscountAmount,
      excessDiscountAmount,
      lineDetails,
      customerCategoryName: customerCategory ? customerCategory.name : 'None',
      customerCategoryLimit
    };
  }
}

module.exports = new RiskEngineService();
