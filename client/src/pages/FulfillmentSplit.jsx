import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function FulfillmentSplit() {
  const { id: quotationId } = useParams();
  const navigate = useNavigate();
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSplits();
  }, [quotationId]);

  const fetchSplits = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/warehouses/quotations/${quotationId}/suggest-split`);
      setSplits(response.data);
    } catch (error) {
      console.error('Failed to fetch splits', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptSplit = async () => {
    try {
      setSaving(true);
      await api.post(`/warehouses/quotations/${quotationId}/accept-split`, { splits });
      alert('Fulfillment split accepted!');
      navigate('/app/approvals'); // or wherever makes sense
    } catch (error) {
      console.error('Failed to accept splits', error);
      alert('Failed to accept splits');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <i className="fa-solid fa-spinner fa-spin text-primary-600 text-4xl"></i>
      </div>
    );
  }

  // Group by warehouse for display
  const warehouseGroups = splits.reduce((acc, split) => {
    if (!acc[split.warehouseId]) {
      acc[split.warehouseId] = {
        name: split.warehouseName,
        items: []
      };
    }
    acc[split.warehouseId].items.push(split);
    return acc;
  }, {});

  return (
    <div className="p-6 md:p-12">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fulfillment Split</h1>
          <p className="text-slate-500">Suggested warehouse allocations for Quotation #{quotationId?.split('-')[0]}</p>
        </div>
        <button 
          onClick={acceptSplit} 
          disabled={saving || splits.length === 0} 
          className="btn-primary"
        >
          {saving ? <i className="fa-solid fa-spinner fa-spin mr-2"></i> : <i className="fa-solid fa-check mr-2"></i>}
          Accept Suggested Split
        </button>
      </header>

      {splits.length === 0 ? (
        <div className="card p-12 text-center">
          <i className="fa-solid fa-box-open text-slate-300 text-5xl mb-4"></i>
          <h3 className="text-lg font-medium text-slate-800">No stock available</h3>
          <p className="text-slate-500 mt-2">Cannot fulfill this quotation with current warehouse stock.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-md p-4 flex items-start space-x-3">
            <i className="fa-solid fa-circle-info mt-1 text-blue-500"></i>
            <div>
              <h4 className="font-semibold text-sm">Automated Split Logic Applied</h4>
              <p className="text-sm mt-1 text-blue-700">The system has optimized this order to minimize the number of shipments while fulfilling the requested quantities from available stock.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(warehouseGroups).map(([warehouseId, group]) => (
              <div key={warehouseId} className="card overflow-hidden">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <i className="fa-solid fa-warehouse text-slate-500"></i>
                    <h3 className="font-semibold text-slate-800">{group.name}</h3>
                  </div>
                  <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded">
                    {group.items.length} items
                  </span>
                </div>
                <div className="p-0">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <tr>
                        <th className="px-4 py-2 font-medium">Product</th>
                        <th className="px-4 py-2 font-medium text-right">Quantity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {group.items.map((item, idx) => {
                        const originalSplitIndex = splits.findIndex(s => s === item);
                        return (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-medium text-slate-800">{item.productName}</td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                className="input-field w-20 py-1 text-right text-sm"
                                value={item.quantity}
                                min="0"
                                onChange={(e) => {
                                  const newSplits = [...splits];
                                  newSplits[originalSplitIndex].quantity = parseInt(e.target.value) || 0;
                                  setSplits(newSplits);
                                }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
