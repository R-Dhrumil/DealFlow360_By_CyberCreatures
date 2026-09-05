/**
 * Computes the blended risk score for a quotation based on line-item discounts
 * compared against customer tier ceilings and product category ceilings.
 * 
 * The risk score is value-weighted, meaning a 2% violation on a $50,000 line
 * impacts the score much more than a 2% violation on a $100 line.
 * 
 * @param {Array} lines - Array of quotation lines: { productId, quantity, unitPrice, discountPercent, category }
 * @param {Number} customerTierCeiling - Max discount percent allowed for the customer's tier (e.g., 15)
 * @param {Object} categoryCeilings - Map of category names to their max discount percent { 'Hardware': 10, 'Software': 25 }
 * @param {Array} approvalChains - Array of approval rules sorted by min_discount ASC
 * 
 * @returns {Object} { blendedScore, lineDetails, requiredApproval, status }
 */
function computeBlendedRiskScore(lines, customerTierCeiling, categoryCeilings, approvalChains) {
  let totalQuoteValue = 0;
  let totalWeightedExcess = 0;
  
  const lineDetails = [];

  // 1. First pass to calculate total value
  for (const line of lines) {
    totalQuoteValue += (line.quantity * line.unitPrice);
  }

  // 2. Second pass to calculate excesses
  for (const line of lines) {
    const categoryCeiling = categoryCeilings[line.category] !== undefined 
      ? categoryCeilings[line.category] 
      : 100; // Default to 100% if no category ceiling exists
      
    // The allowed discount is the MORE RESTRICTIVE (minimum) of the two ceilings
    const effectiveCeiling = Math.min(customerTierCeiling, categoryCeiling);
    
    // Compute how many percentage points the discount exceeds the ceiling
    const excess = Math.max(0, line.discountPercent - effectiveCeiling);
    
    // Weight the excess by the line's contribution to the total quote value
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

  // Blended score is the sum of weighted excesses
  // If score > 0, it requires approval.
  const blendedScore = parseFloat(totalWeightedExcess.toFixed(4));
  
  let requiredApproval = { requiresManager: false, requiresFinance: false };
  let status = 'approved'; // Default to approved if within bounds

  if (blendedScore > 0) {
    status = 'pending_approval';
    
    // Find applicable approval chain based on blended score
    // E.g., if blendedScore is 5%, and rules are [0-10: manager, 10-100: finance]
    for (const chain of approvalChains) {
      const min = parseFloat(chain.min_discount);
      const max = chain.max_discount ? parseFloat(chain.max_discount) : 100;
      
      if (blendedScore >= min && blendedScore <= max) {
        requiredApproval = {
          requiresManager: chain.requires_manager,
          requiresFinance: chain.requires_finance
        };
        // Use the highest applicable rule if multiple match
      }
    }
    
    // Fallback if no chain specifically matches but score > 0
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
