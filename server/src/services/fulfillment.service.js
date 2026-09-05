function calculateFulfillmentSplits(lineItems, stockData) {
  const splits = [];

  for (const line of lineItems) {
    let remainingQuantity = line.quantity;
    const productStock = stockData.filter(s => s.productId === line.productId);
    
    productStock.sort((a, b) => {
      const aCanFulfill = a.quantityAvailable >= remainingQuantity;
      const bCanFulfill = b.quantityAvailable >= remainingQuantity;
      
      if (aCanFulfill && !bCanFulfill) return -1;
      if (!aCanFulfill && bCanFulfill) return 1;
      
      return b.quantityAvailable - a.quantityAvailable;
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
        shipmentCost: stock.shippingCost
      });
      
      remainingQuantity -= fulfillQuantity;
    }
  }

  return splits;
}

module.exports = {
  calculateFulfillmentSplits
};
