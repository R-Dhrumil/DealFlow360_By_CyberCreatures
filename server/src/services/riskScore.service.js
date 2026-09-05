/**
 * Computes the blended risk score for a quotation based on line-item discounts
 * compared against customer tier ceilings and product category ceilings.
 */
function computeBlendedRiskScore(lines, customerTierCeiling, categoryCeilings, approvalChains) {
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

  const blendedScore = parseFloat(totalWeightedExcess.toFixed(4));
  
  let requiredApproval = { requiresManager: false, requiresFinance: false };
  let status = 'approved';

  if (blendedScore > 0) {
    status = 'pending_approval';
    
    for (const chain of approvalChains) {
      const min = parseFloat(chain.min_discount);
      const max = chain.max_discount ? parseFloat(chain.max_discount) : 100;
      
      if (blendedScore >= min && blendedScore <= max) {
        requiredApproval = {
          requiresManager: chain.requires_manager,
          requiresFinance: chain.requires_finance
        };
      }
    }
    
    if (!requiredApproval.requiresManager && !requiredApproval.requiresFinance) {
      requiredApproval.requiresManager = true;
    }
  }

  return {
    blendedScore,
    lineDetails,
    requiredApproval,
    status
  };
}

module.exports = {
  computeBlendedRiskScore
};
