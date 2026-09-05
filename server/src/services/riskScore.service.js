/**
 * Computes the blended risk score for a quotation based on line-item discounts,
 * customer tier ceilings, category ceilings, and customer history risk factor (new vs existing).
 * 
 * Auto-Approval & Escalation Rules:
 * - If Final Risk Score == 0: Status = 'approved' (Auto-Approved!)
 * - If 0 < Final Risk Score <= 10: Status = 'pending_approval' (Manager Approval Queue)
 * - If Final Risk Score > 10: Status = 'pending_finance_approval' (Auto-Escalated to Finance)
 */
function computeBlendedRiskScore(lines, customerTierCeiling, categoryCeilings, approvalChains, customerContext = {}) {
  let totalQuoteValue = 0;
  let totalWeightedExcess = 0;
  
  const lineDetails = [];

  // Calculate total quote value
  for (const line of lines) {
    totalQuoteValue += (line.quantity * line.unitPrice);
  }

  // Calculate line excesses
  for (const line of lines) {
    const categoryCeiling = categoryCeilings[line.category] !== undefined 
      ? categoryCeilings[line.category] 
      : 100;
      
    const effectiveCeiling = Math.min(customerTierCeiling, categoryCeiling);
    const excess = Math.max(0, line.discountPercent - effectiveCeiling);
    
    const lineValue = line.quantity * line.unitPrice;
    const weight = totalQuoteValue > 0 ? (lineValue / totalQuoteValue) : 0;
    const weightedExcess = excess * weight;
    
    totalWeightedExcess += weightedExcess;
    
    lineDetails.push({
      ...line,
      effectiveCeiling,
      excess,
      weightedExcess,
      isFlagged: excess > 0
    });
  }

  // Customer History Risk Factor:
  // Existing long-term customer (ordersCount > 0 or isNewCustomer = false) => 0.8x multiplier (lower risk)
  // New customer (isNewCustomer = true or ordersCount == 0) => 1.5x multiplier (higher risk)
  const isNewCustomer = customerContext.isNewCustomer !== undefined ? customerContext.isNewCustomer : true;
  const customerRiskMultiplier = isNewCustomer ? 1.5 : 0.8;

  const rawScore = totalWeightedExcess * customerRiskMultiplier;
  const blendedScore = parseFloat(rawScore.toFixed(4));
  
  let requiredApproval = { requiresManager: false, requiresFinance: false };
  let status = 'approved';

  if (blendedScore <= 0) {
    // Auto-Approved without manager intervention!
    status = 'approved';
  } else if (blendedScore > 0 && blendedScore <= 10.0) {
    // Escalated to Sales Manager
    status = 'pending_approval';
    requiredApproval.requiresManager = true;
  } else {
    // High Risk (> 10%) => Auto-Escalated to Finance 2nd level approval
    status = 'pending_finance_approval';
    requiredApproval.requiresManager = true;
    requiredApproval.requiresFinance = true;
  }

  return {
    blendedScore,
    rawScore: parseFloat(totalWeightedExcess.toFixed(4)),
    customerRiskMultiplier,
    isNewCustomer,
    lineDetails,
    requiredApproval,
    status
  };
}

module.exports = {
  computeBlendedRiskScore
};
