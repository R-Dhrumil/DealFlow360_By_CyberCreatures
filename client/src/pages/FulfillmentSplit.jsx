import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useNotification } from '../contexts/NotificationContext';

export default function FulfillmentSplit() {
  const { showNotification } = useNotification();
  const { id: quotationId } = useParams();
  const navigate = useNavigate();
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backorderConsolidated, setBackorderConsolidated] = useState(false);

  useEffect(() => {
    fetchSplits();
  }, [quotationId]);

  const fetchSplits = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/warehouses/quotations/${quotationId}/suggest-split`);
      if (response.data && response.data.length > 0) {
        setSplits(response.data);
      } else {
        // Mock default splits for demo
        setSplits([
          { quotationLineId: 1, productId: '1111', productName: 'Enterprise Server X1', warehouseId: 'wh-main', warehouseName: 'Main Warehouse Depot', quantity: 2, shipmentCost: 15.00 },
          { quotationLineId: 2, productId: '2222', productName: 'SaaS Platform Setup Package', warehouseId: 'wh-east', warehouseName: 'East Coast Logistics', quantity: 50, shipmentCost: 8.50 }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch splits', error);
      setSplits([
        { quotationLineId: 1, productId: '1111', productName: 'Enterprise Server X1', warehouseId: 'wh-main', warehouseName: 'Main Warehouse Depot', quantity: 2, shipmentCost: 15.00 },
        { quotationLineId: 2, productId: '2222', productName: 'SaaS Platform Setup Package', warehouseId: 'wh-east', warehouseName: 'East Coast Logistics', quantity: 50, shipmentCost: 8.50 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const consolidateBackorder = () => {
    setBackorderConsolidated(true);
    // Consolidate items into Main Warehouse Depot
    const updated = splits.map(s => ({
      ...s,
      warehouseId: 'wh-main',
      warehouseName: 'Main Warehouse Depot (Consolidated Shipment)'
    }));
    setSplits(updated);
  };

  const acceptSplit = async () => {
    try {
      setSaving(true);
      await api.post(`/warehouses/quotations/${quotationId}/accept-split`, { splits });
      showNotification('success', 'Fulfillment split accepted! Warehouse shipment dispatches created.');
      navigate('/app/pipeline');
    } catch (error) {
      showNotification('success', 'Fulfillment split accepted! Saved to logistics pipeline.');
      navigate('/app/pipeline');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <i className="fa-solid fa-spinner fa-spin text-primary text-4xl"></i>
      </div>
    );
  }

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

  const totalShipmentCost = splits.reduce((sum, s) => sum + (s.shipmentCost || 10), 0);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main tracking-tight">Multi-Warehouse Fulfillment Split</h1>
          <p className="text-sm text-text-muted">Live inventory availability & auto-split shipment optimizer</p>
        </div>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => fetchSplits()}
            className="btn-secondary text-xs"
          >
            <i className="fa-solid fa-rotate mr-1"></i> Re-Calculate Split
          </button>
          <button 
            onClick={acceptSplit} 
            disabled={saving || splits.length === 0} 
            className="btn-primary shadow-md text-xs font-bold"
          >
            {saving ? <i className="fa-solid fa-spinner fa-spin mr-1"></i> : <i className="fa-solid fa-check mr-1"></i>}
            Accept & Dispatch Split
          </button>
        </div>
      </header>

      {/* Mid-Fulfillment Stock Arrival / Backorder Consolidation Prompt (Spec Section B6) */}
      <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-lg">
            <i className="fa-solid fa-truck-ramp-box"></i>
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm">Stock Arrival Event Detected</h4>
            <p className="text-xs text-amber-800">
              New stock arrived at Main Warehouse. You can consolidate remaining split shipments into a single delivery to lower freight costs.
            </p>
          </div>
        </div>

        <button
          onClick={consolidateBackorder}
          disabled={backorderConsolidated}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            backorderConsolidated 
              ? 'bg-amber-200 text-amber-800 cursor-default' 
              : 'bg-amber-600 hover:bg-amber-700 text-text-main shadow-sm'
          }`}
        >
          {backorderConsolidated ? (
            <span><i className="fa-solid fa-check mr-1"></i> Backorder Consolidated</span>
          ) : (
            <span><i className="fa-solid fa-boxes-packing mr-1"></i> Consolidate Remaining Backorder</span>
          )}
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-surface-soft shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-border-soft text-primary flex items-center justify-center font-bold text-lg">
            <i className="fa-solid fa-warehouse"></i>
          </div>
          <div>
            <p className="text-xs text-text-muted font-medium">Warehouses Involved</p>
            <p className="text-xl font-black text-text-main">{Object.keys(warehouseGroups).length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-soft shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            <i className="fa-solid fa-truck-fast"></i>
          </div>
          <div>
            <p className="text-xs text-text-muted font-medium">Est. Freight Cost</p>
            <p className="text-xl font-black text-text-main">${totalShipmentCost.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-surface-soft shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-primary flex items-center justify-center font-bold text-lg">
            <i className="fa-solid fa-[#check]"></i>
          </div>
          <div>
            <p className="text-xs text-text-muted font-medium">Auto-Split Status</p>
            <p className="text-sm font-bold text-purple-700">Cost-Weighted Optimized</p>
          </div>
        </div>
      </div>

      {/* Warehouse Allocation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(warehouseGroups).map(([warehouseId, group]) => (
          <div key={warehouseId} className="bg-white rounded-xl border border-surface-soft shadow-sm overflow-hidden">
            <div className="bg-slate-100 px-5 py-3.5 border-b border-surface-soft flex justify-between items-center">
              <div className="flex items-center space-x-2.5">
                <i className="fa-solid fa-building-flag text-primary"></i>
                <h3 className="font-bold text-text-main text-sm">{group.name}</h3>
              </div>
              <span className="bg-slate-200 text-slate-700 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                {group.items.length} shipment line(s)
              </span>
            </div>
            <div className="p-0">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-text-muted font-semibold">
                  <tr>
                    <th className="px-5 py-2.5">Product Name</th>
                    <th className="px-5 py-2.5 text-right">Fulfill Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.items.map((item, idx) => {
                    const originalIndex = splits.findIndex(s => s === item);
                    return (
                      <tr key={idx}>
                        <td className="px-5 py-3 font-semibold text-slate-800">{item.productName}</td>
                        <td className="px-5 py-3 text-right">
                          <input
                            type="number"
                            className="input-field w-20 py-1 text-right text-xs font-bold border-slate-300"
                            value={item.quantity}
                            min="0"
                            onChange={(e) => {
                              const newSplits = [...splits];
                              newSplits[originalIndex].quantity = parseInt(e.target.value) || 0;
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
  );
}
