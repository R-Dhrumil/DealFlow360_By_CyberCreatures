import React, { useState, useEffect } from 'react';
import api from '../api/client';

export default function QuotationBuilder() {
  const [products, setProducts] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const addLine = (product) => {
    setLines([...lines, { 
      productId: product.id, 
      productName: product.name,
      basePrice: parseFloat(product.base_price),
      quantity: 1, 
      discountPercent: 0,
      marginPercent: parseFloat(product.margin_percent)
    }]);
  };

  const updateLine = (index, field, value) => {
    const newLines = [...lines];
    newLines[index][field] = value;
    setLines(newLines);
  };

  const removeLine = (index) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return lines.reduce((total, line) => {
      const priceAfterDiscount = line.basePrice * (1 - line.discountPercent / 100);
      return total + (priceAfterDiscount * line.quantity);
    }, 0);
  };

  const getMarginIndicator = (line) => {
    const marginImpact = line.discountPercent;
    // Simple logic: if discount > margin/2, it's red. If > margin/4, yellow, else green.
    if (marginImpact > line.marginPercent / 2) return 'text-red-500';
    if (marginImpact > line.marginPercent / 4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const submitQuotation = async () => {
    try {
      // Mock customer ID for now, in a real app this would be selected from a dropdown
      const customerId = '33333333-3333-3333-3333-333333333331'; 
      await api.post('/quotations', {
        customerId,
        lines: lines.map(l => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.basePrice,
          discountPercent: l.discountPercent,
          lineType: 'one_time' // simplified for now
        }))
      });
      alert('Quotation saved successfully!');
      setLines([]);
    } catch (error) {
      console.error('Failed to submit quotation', error);
      alert('Failed to submit quotation');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <i className="fa-solid fa-spinner fa-spin text-primary-600 text-4xl"></i>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quotation Builder</h1>
          <p className="text-slate-500">Create and manage new quotations for your customers.</p>
        </div>
        <div className="space-x-3">
          <button className="btn-secondary" onClick={() => alert('Saved as draft')}>Save Draft</button>
          <button className="btn-primary" onClick={submitQuotation} disabled={lines.length === 0}>
            Submit Quotation
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Line Items</h2>
            
            {lines.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 border border-dashed border-slate-300 rounded-lg">
                <i className="fa-solid fa-cart-arrow-down text-slate-400 text-3xl mb-2"></i>
                <p className="text-slate-500">No products added yet. Select products from the catalog to begin.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-sm text-slate-500">
                      <th className="pb-3 font-medium">Product</th>
                      <th className="pb-3 font-medium">Qty</th>
                      <th className="pb-3 font-medium">Unit Price</th>
                      <th className="pb-3 font-medium">Discount %</th>
                      <th className="pb-3 font-medium">Net Price</th>
                      <th className="pb-3 font-medium text-right">Margin</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, idx) => {
                      const netPrice = line.basePrice * (1 - line.discountPercent / 100);
                      return (
                        <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                          <td className="py-4 text-slate-800 font-medium">{line.productName}</td>
                          <td className="py-4">
                            <input 
                              type="number" 
                              className="input-field w-20 py-1" 
                              value={line.quantity}
                              min="1"
                              onChange={(e) => updateLine(idx, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </td>
                          <td className="py-4 text-slate-600">${line.basePrice.toFixed(2)}</td>
                          <td className="py-4">
                            <input 
                              type="number" 
                              className="input-field w-20 py-1" 
                              value={line.discountPercent}
                              min="0"
                              max="100"
                              onChange={(e) => updateLine(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                            />
                          </td>
                          <td className="py-4 text-slate-800 font-semibold">${(netPrice * line.quantity).toFixed(2)}</td>
                          <td className="py-4 text-right">
                            <i className={`fa-solid fa-circle text-xs ${getMarginIndicator(line)}`}></i>
                          </td>
                          <td className="py-4 text-right">
                            <button onClick={() => removeLine(idx)} className="text-slate-400 hover:text-red-500 p-1">
                              <i className="fa-solid fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <div className="bg-slate-50 p-4 rounded-lg min-w-[250px]">
                <div className="flex justify-between text-slate-500 mb-2">
                  <span>Subtotal:</span>
                  <span>${lines.reduce((acc, l) => acc + (l.basePrice * l.quantity), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500 mb-2">
                  <span>Discount:</span>
                  <span>-${(lines.reduce((acc, l) => acc + (l.basePrice * l.quantity), 0) - calculateTotal()).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Upsell/Cross-sell Panel */}
            {lines.length > 0 && products.filter(p => !lines.find(l => l.productId === p.id)).length > 0 && (
              <div className="mt-8 border border-indigo-200 rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="bg-indigo-50 px-5 py-3 border-b border-indigo-100 flex items-center">
                  <i className="fa-solid fa-lightbulb text-indigo-500 mr-2"></i>
                  <h3 className="font-bold text-indigo-900 text-sm">Recommended Add-ons</h3>
                </div>
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-indigo-50/30">
                  {products
                    .filter(p => !lines.find(l => l.productId === p.id))
                    .slice(0, 2)
                    .map(product => (
                      <div key={product.id} className="bg-white border border-indigo-100 rounded-lg p-3 flex justify-between items-center shadow-sm">
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{product.name}</h4>
                          <span className="text-xs text-slate-500">{product.category}</span>
                        </div>
                        <div className="text-right flex flex-col justify-between items-end">
                          <span className="font-bold text-slate-800 text-sm mb-1">${parseFloat(product.base_price).toLocaleString()}</span>
                          <button 
                            onClick={() => addLine(product)}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded"
                          >
                            <i className="fa-solid fa-plus mr-1"></i> Add
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card p-6 h-full">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Product Catalog</h2>
            <div className="relative mb-4">
              <i className="fa-solid fa-search absolute left-3 top-3 text-slate-400 text-sm"></i>
              <input type="text" className="input-field pl-9 py-2 text-sm" placeholder="Search internal products..." />
            </div>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {products.map(product => (
                <div key={product.id} className="border border-slate-200 rounded p-3 hover:border-primary-300 transition-colors cursor-pointer group flex justify-between items-center" onClick={() => addLine(product)}>
                  <div>
                    <h4 className="font-medium text-slate-800 text-sm group-hover:text-primary-600 transition-colors">{product.name}</h4>
                    <span className="text-xs text-slate-500">{product.category} &bull; ${parseFloat(product.base_price).toFixed(2)}</span>
                  </div>
                  <i className="fa-solid fa-plus text-slate-300 group-hover:text-primary-500"></i>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
