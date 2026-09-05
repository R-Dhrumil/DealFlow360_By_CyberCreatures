/**
 * Warehouse fulfillment split algorithm.
 * For each line item in a quotation, it determines which warehouse(s) should
 * fulfill the order based on available stock.
 * 
 * It prefers fulfilling from a single warehouse to minimize shipments.
 * 
 * @param {Array} lineItems - Array of quotation lines: { id, productId, quantity, productName }
 * @param {Array} stockData - Array of available stock: { warehouseId, warehouseName, productId, quantityAvailable, shippingCost }
 * 
 * @returns {Array} Array of fulfillment splits: { quotationLineId, productId, warehouseId, warehouseName, quantity, shipmentCost }
 */
function calculateFulfillmentSplits(lineItems, stockData) {
  const splits = [];

  for (const line of lineItems) {
    let remainingQuantity = line.quantity;
    
    // Filter stock for this product
    const productStock = stockData.filter(s => s.productId === line.productId);
    
    // Sort warehouses: first by those that can fulfill the entire line, then by available quantity descending
    productStock.sort((a, b) => {
      const aCanFulfill = a.quantityAvailable >= remainingQuantity;
      const bCanFulfill = b.quantityAvailable >= remainingQuantity;
      
      if (aCanFulfill && !bCanFulfill) return -1;
      if (!aCanFulfill && bCanFulfill) return 1;
      
      return b.quantityAvailable - a.quantityAvailable; // fallback to largest stock
    });

    for (const stock of productStock) {
      if (remainingQuantity <= 0) break;
      if (stock.quantityAvailable <= 0) continue;

      const fulfillQuantity = Math.min(remainingQuantity, stock.quantityAvailable);
      
      splits.push({
        quotationLineId: line.id,
        productId: line.productId,
        productName: line.productName,
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouseName,
        quantity: fulfillQuantity,
        shipmentCost: stock.shippingCost // simplified
      });
      
      remainingQuantity -= fulfillQuantity;
    }

    if (remainingQuantity > 0) {
      // In a real app, this would trigger backorder logic
      console.warn(`Insufficient stock for product ${line.productId}. Missing: ${remainingQuantity}`);
    }
  }

  return splits;
}

module.exports = {
  calculateFulfillmentSplits
};
