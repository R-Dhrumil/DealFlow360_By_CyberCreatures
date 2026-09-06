import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import { useAlert } from '../contexts/AlertContext';
import { useAuth } from '../contexts/AuthContext';
import { useSocketEvent } from '../hooks/useSocket';

export default function InventoryManagement() {
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stock, setStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [rebalanceLogs, setRebalanceLogs] = useState([]);
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rebalancing, setRebalancing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Adjustment form state
  const [adjustForm, setAdjustForm] = useState({
    warehouseId: '',
    toWarehouseId: '',
    productId: '',
    type: 'in',
    quantity: 1,
    reason: ''
  });

  // Derived unique lists for dropdowns
  const uniqueProducts = Array.from(
    new Set(stock.map(s => JSON.stringify({ id: s.product_id, name: s.product_name })))
  ).map(s => JSON.parse(s));

  const uniqueWarehouses = Array.from(
    new Set(stock.map(s => JSON.stringify({ id: s.warehouse_id, name: s.warehouse_name })))
  ).map(s => JSON.parse(s));

  // Auto-select initial dropdown defaults if available
  useEffect(() => {
    if (uniqueWarehouses.length > 0) {
      if (!adjustForm.warehouseId) {
        setAdjustForm(prev => ({ ...prev, warehouseId: uniqueWarehouses[0].id }));
      }
      if (!adjustForm.toWarehouseId && uniqueWarehouses.length > 1) {
        setAdjustForm(prev => ({ ...prev, toWarehouseId: uniqueWarehouses[1].id }));
      }
    }
    if (uniqueProducts.length > 0 && !adjustForm.productId) {
      setAdjustForm(prev => ({ ...prev, productId: uniqueProducts[0].id }));
    }
  }, [stock]);

  const fetchData = useCallback(async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const [stockRes, txnRes, rebRes, lotsRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/transactions'),
        api.get('/inventory/rebalance-logs').catch(() => ({ data: [] })),
        api.get('/inventory/lots').catch(() => ({ data: [] }))
      ]);
      setStock(stockRes.data || []);
      setTransactions(txnRes.data || []);
      setRebalanceLogs(rebRes.data || []);
      setLots(lotsRes.data || []);
    } catch (err) {
      showAlert('Error', 'Failed to fetch inventory data', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchData(true);
    // Poll every 10 seconds to keep stock data fresh
    const interval = setInterval(() => fetchData(false), 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Real-time stock refresh via shared socket
  useSocketEvent('inventory_updated', useCallback(() => {
    fetchData(false);
  }, [fetchData]));

  useSocketEvent('pipeline_updated', useCallback((data) => {
    if (data?.newStatus === 'confirmed' || data?.newStatus === 'closed') {
      fetchData(false);
    }
  }, [fetchData]));

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustForm.warehouseId || !adjustForm.productId) {
      return showAlert('Warning', 'Please select warehouse and product', 'warning');
    }
    if (adjustForm.type === 'transfer') {
      if (!adjustForm.toWarehouseId) {
        return showAlert('Warning', 'Please select a destination warehouse for stock transfer', 'warning');
      }
      if (adjustForm.warehouseId === adjustForm.toWarehouseId) {
        return showAlert('Warning', 'Source and destination warehouses cannot be the same', 'warning');
      }
    }
    try {
      await api.post('/inventory/adjust', {
        ...adjustForm,
        fromWarehouseId: adjustForm.warehouseId,
        toWarehouseId: adjustForm.toWarehouseId
      });
      showAlert('Success', adjustForm.type === 'transfer' ? 'Stock transferred successfully between warehouses!' : 'Stock adjusted successfully! Inventory updated across all modules.', 'success');
      setAdjustForm(prev => ({ ...prev, quantity: 1, reason: '' }));
      fetchData(false);
      setActiveTab('overview');
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Failed to adjust stock', 'error');
    }
  };

  const handleTriggerRebalance = async () => {
    try {
      setRebalancing(true);
      const res = await api.post('/inventory/rebalance');
      if (res.data?.rebalancesExecuted > 0) {
        showAlert('Auto-Rebalancing Complete', `Successfully rebalanced ${res.data.rebalancesExecuted} low-stock depot locations!`, 'success');
      } else {
        showAlert('Stock Balanced', 'All warehouse locations are currently balanced and within safety thresholds.', 'info');
      }
      fetchData(false);
    } catch (err) {
      showAlert('Error', 'Failed to trigger stock rebalancing', 'error');
    } finally {
      setRebalancing(false);
    }
  };

  // Filtered and Grouped Stock calculation
  const rawFiltered = stock.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.warehouse_name && item.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (!matchesSearch) return false;
    return true;
  });

  const groupedStock = Object.values(rawFiltered.reduce((acc, item) => {
    if (!acc[item.product_id]) {
      acc[item.product_id] = { 
        ...item, 
        quantity_available: 0,
        warehouse_names: new Set(),
        warehouses_breakdown: []
      };
    }
    const qty = parseInt(item.quantity_available || 0, 10);
    acc[item.product_id].quantity_available += qty;
    acc[item.product_id].warehouses_breakdown.push({
      id: item.warehouse_id,
      name: item.warehouse_name,
      qty,
      reorder: item.reorder_threshold || 10,
      safety: item.safety_stock || 5
    });
    if (qty > 0) {
      acc[item.product_id].warehouse_names.add(item.warehouse_name);
    }
    return acc;
  }, {})).map(group => ({
    ...group,
    warehouse_summary: group.warehouse_names.size > 1 
      ? `${group.warehouse_names.size} Locations` 
      : (Array.from(group.warehouse_names)[0] || 'All Locations (0 Stock)')
  })).filter(item => {
    if (statusFilter === 'out') return item.quantity_available <= 0;
    if (statusFilter === 'low') return item.quantity_available > 0 && item.quantity_available < 10;
    if (statusFilter === 'in') return item.quantity_available >= 10;
    return true;
  });

  // Calculate Metrics
  const fullGroupedStock = Object.values(stock.reduce((acc, item) => {
    if (!acc[item.product_id]) acc[item.product_id] = 0;
    acc[item.product_id] += parseInt(item.quantity_available || 0, 10);
    return acc;
  }, {}));

  const totalStockItems = fullGroupedStock.reduce((sum, qty) => sum + qty, 0);
  const lowStockCount = fullGroupedStock.filter(qty => qty > 0 && qty < 10).length;
  const outOfStockCount = fullGroupedStock.filter(qty => qty <= 0).length;
  const selectedProductStock = stock.find(s => s.product_id === adjustForm.productId && s.warehouse_id === adjustForm.warehouseId);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 flex items-center justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Inventory, Warehouses & Stock Control</h1>
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-Rebalance Active
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">3-Tier Warehouse Inventory System: Unit Lots, Depot Allocation & Automated Rebalancing</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleTriggerRebalance}
            disabled={rebalancing}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <i className={`fa-solid ${rebalancing ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
            {rebalancing ? 'Rebalancing...' : 'Run Auto-Rebalance'}
          </button>
          <button 
            onClick={() => fetchData(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm transition flex items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-arrows-rotate"></i> Refresh
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Products</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{uniqueProducts.length}</h3>
              <p className="text-xs text-slate-400 mt-1">Across {uniqueWarehouses.length || 1} Depots</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-boxes-stacked"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Stock Units</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{totalStockItems.toLocaleString()}</h3>
              <p className="text-xs text-slate-400 mt-1">Allocated in warehouses</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-layer-group"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Auto-Rebalance Events</p>
              <h3 className="text-2xl font-extrabold text-purple-600 mt-1">{rebalanceLogs.length}</h3>
              <p className="text-xs text-purple-600 font-medium mt-1">Depot transfers executed</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-arrows-split-up-and-left"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Inventory Lots & Batches</p>
              <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">{lots.length}</h3>
              <p className="text-xs text-slate-400 mt-1">Unit lot records</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-barcode"></i>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-slate-200 pb-2 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary bg-primary/10' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <i className="fa-solid fa-boxes-stacked"></i> Stock Overview Matrix ({stock.length})
          </button>
          <button 
            onClick={() => setActiveTab('rebalance')}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'rebalance' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <i className="fa-solid fa-wand-magic-sparkles"></i> Auto-Rebalancing System ({rebalanceLogs.length})
          </button>
          <button 
            onClick={() => setActiveTab('lots')}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'lots' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <i className="fa-solid fa-barcode"></i> Batches & Unit Lots ({lots.length})
          </button>
          <button 
            onClick={() => setActiveTab('adjust')}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'adjust' ? 'text-primary border-b-2 border-primary bg-primary/10' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <i className="fa-solid fa-plus-minus"></i> Stock Adjustment
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'history' ? 'text-primary border-b-2 border-primary bg-primary/10' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <i className="fa-solid fa-clock-rotate-left"></i> Transaction Log ({transactions.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <i className="fa-solid fa-spinner fa-spin text-4xl text-primary"></i>
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div className="relative flex-1 min-w-[260px]">
                    <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-3 text-slate-400"></i>
                    <input 
                      type="text"
                      placeholder="Search product, category, or warehouse..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase">Filter Status:</span>
                    <button 
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      All
                    </button>
                    <button 
                      onClick={() => setStatusFilter('in')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${statusFilter === 'in' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      In Stock
                    </button>
                    <button 
                      onClick={() => setStatusFilter('low')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${statusFilter === 'low' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
                    >
                      Low Stock
                    </button>
                    <button 
                      onClick={() => setStatusFilter('out')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${statusFilter === 'out' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                    >
                      Out of Stock
                    </button>
                  </div>
                </div>

                {/* Stock Table */}
                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                      <tr>
                        <th className="p-4">Product Details</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Warehouse Breakdown</th>
                        <th className="p-4 text-right">Total Available</th>
                        <th className="p-4">Rebalance Status</th>
                        <th className="p-4 text-center">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {groupedStock.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-12 text-center text-slate-500">
                            <i className="fa-solid fa-box-open text-3xl mb-2 text-slate-300"></i>
                            <p className="font-semibold">No stock records found</p>
                          </td>
                        </tr>
                      ) : (
                        groupedStock.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-4 font-bold text-slate-800">
                              {item.product_name}
                              <div className="text-xs font-normal text-slate-500">Unit: {item.unit || 'units'}</div>
                            </td>
                            <td className="p-4">
                              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                                {item.category || 'General'}
                              </span>
                            </td>
                            <td className="p-4 text-slate-700">
                              <div className="flex flex-wrap gap-1.5 max-w-md">
                                {item.warehouses_breakdown.map((wh, wIdx) => (
                                  <span key={wIdx} className={`px-2 py-0.5 rounded text-xs font-medium border ${
                                    wh.qty < wh.reorder ? 'bg-amber-50 text-amber-800 border-amber-300' : 'bg-slate-50 text-slate-700 border-slate-200'
                                  }`}>
                                    <i className="fa-solid fa-warehouse text-slate-400 mr-1"></i>
                                    {wh.name}: <strong className="font-bold">{wh.qty}</strong>
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="p-4 text-right font-extrabold text-slate-800 text-base">
                              {item.quantity_available}
                            </td>
                            <td className="p-4">
                              {item.quantity_available <= 0 ? (
                                <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full text-xs font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span> Out of Stock
                                </span>
                              ) : item.quantity_available < 10 ? (
                                <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Needs Rebalance
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> Optimal Stock
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <button 
                                onClick={() => {
                                  setAdjustForm({
                                    warehouseId: item.warehouse_id,
                                    productId: item.product_id,
                                    type: 'in',
                                    quantity: 10,
                                    reason: 'Re-stocking'
                                  });
                                  setActiveTab('adjust');
                                }}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                              >
                                + Add Stock
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* AUTO-REBALANCING TAB */}
            {activeTab === 'rebalance' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold flex items-center gap-2">
                      <i className="fa-solid fa-wand-magic-sparkles text-amber-300"></i>
                      Automated Stock Rebalancing Engine
                    </h2>
                    <p className="text-purple-200 text-sm mt-1 max-w-2xl">
                      When customer purchases or dispatches reduce a warehouse stock below its reorder threshold, 
                      the system automatically calculates surplus across other depots and triggers inter-warehouse stock transfers.
                    </p>
                  </div>
                  <button
                    onClick={handleTriggerRebalance}
                    disabled={rebalancing}
                    className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <i className={`fa-solid ${rebalancing ? 'fa-spinner fa-spin' : 'fa-play'}`}></i>
                    Force Full Rebalance Scan
                  </button>
                </div>

                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                  <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Auto-Rebalancing Audit Log</h3>
                    <span className="text-xs text-slate-500 font-medium">Real-time System Actions</span>
                  </div>
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                      <tr>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Product</th>
                        <th className="p-4">Source Depot (From)</th>
                        <th className="p-4">Deficit Depot (To)</th>
                        <th className="p-4 text-right">Qty Transferred</th>
                        <th className="p-4">System Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rebalanceLogs.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-12 text-center text-slate-500">
                            <i className="fa-solid fa-shield-check text-3xl mb-2 text-emerald-400"></i>
                            <p className="font-semibold text-slate-700">No rebalance events logged yet</p>
                            <p className="text-xs text-slate-400">System automatically logs transfers when stock falls below thresholds</p>
                          </td>
                        </tr>
                      ) : (
                        rebalanceLogs.map(log => (
                          <tr key={log.id} className="hover:bg-purple-50/50 transition-colors">
                            <td className="p-4 font-mono text-xs text-slate-500">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                            <td className="p-4 font-bold text-slate-800">
                              {log.product_name}
                            </td>
                            <td className="p-4">
                              <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">
                                <i className="fa-solid fa-warehouse mr-1 text-slate-400"></i>
                                {log.from_warehouse_name}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="bg-purple-100 text-purple-800 px-2.5 py-1 rounded-md text-xs font-semibold">
                                <i className="fa-solid fa-warehouse mr-1 text-purple-500"></i>
                                {log.to_warehouse_name}
                              </span>
                            </td>
                            <td className="p-4 text-right font-extrabold text-purple-700 text-base">
                              +{log.quantity}
                            </td>
                            <td className="p-4 text-slate-600 text-xs">
                              {log.reason}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BATCHES & LOTS TAB */}
            {activeTab === 'lots' && (
              <div className="space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800">Batch & Unit Lot Traceability</h3>
                    <p className="text-xs text-slate-500">Every product intake generates a unique batch code for precise unit cost and origin tracking.</p>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                      <tr>
                        <th className="p-4">Batch Code</th>
                        <th className="p-4">Product Name</th>
                        <th className="p-4">Warehouse Depot</th>
                        <th className="p-4 text-right">Lot Quantity</th>
                        <th className="p-4 text-right">Unit Cost</th>
                        <th className="p-4">Creation Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lots.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-12 text-center text-slate-500">
                            <i className="fa-solid fa-barcode text-3xl mb-2 text-slate-300"></i>
                            <p className="font-semibold">No lot records logged yet</p>
                          </td>
                        </tr>
                      ) : (
                        lots.map(lot => (
                          <tr key={lot.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-mono font-bold text-indigo-700">
                              <i className="fa-solid fa-barcode mr-1.5 text-slate-400"></i>
                              {lot.batch_code}
                            </td>
                            <td className="p-4 font-bold text-slate-800">
                              {lot.product_name}
                            </td>
                            <td className="p-4 text-slate-700">
                              <i className="fa-solid fa-warehouse text-slate-400 mr-1"></i>
                              {lot.warehouse_name}
                            </td>
                            <td className="p-4 text-right font-extrabold text-slate-800">
                              {lot.quantity} {lot.unit || 'units'}
                            </td>
                            <td className="p-4 text-right font-mono text-slate-700">
                              ${parseFloat(lot.unit_cost || 0).toFixed(2)}
                            </td>
                            <td className="p-4 text-slate-500 font-mono text-xs">
                              {new Date(lot.created_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ADJUSTMENT TAB */}
            {activeTab === 'adjust' && (
              <div className="max-w-2xl bg-white rounded-xl shadow-xs border border-slate-200 p-8">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Admin Stock Adjustment</h2>
                    <p className="text-xs text-slate-500">Record physical stock intake, deductions, or audit adjustments</p>
                  </div>
                  {selectedProductStock && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-right">
                      <span className="text-xs font-bold text-slate-500 uppercase block">Current Stock</span>
                      <span className="text-lg font-extrabold text-slate-800">{selectedProductStock.quantity_available} units</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAdjustSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Movement Type</label>
                      <select 
                        className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary bg-white font-semibold"
                        value={adjustForm.type}
                        onChange={e => setAdjustForm({...adjustForm, type: e.target.value})}
                      >
                        <option value="in">📦 Stock In (Received from Supplier)</option>
                        <option value="out">📤 Stock Out (Deduction / Removal)</option>
                        <option value="transfer">🔄 Inter-Warehouse Transfer</option>
                        <option value="adjustment">⚖️ Audit Adjustment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Target Product</label>
                      <select 
                        required
                        className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary bg-white"
                        value={adjustForm.productId}
                        onChange={e => setAdjustForm({...adjustForm, productId: e.target.value})}
                      >
                        <option value="">Select Product</option>
                        {uniqueProducts.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        {adjustForm.type === 'transfer' ? 'Source Warehouse (From)' : 'Warehouse Location'}
                      </label>
                      <select 
                        required
                        className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary bg-white"
                        value={adjustForm.warehouseId}
                        onChange={e => setAdjustForm({...adjustForm, warehouseId: e.target.value})}
                      >
                        <option value="">Select Warehouse</option>
                        {uniqueWarehouses.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                    </div>

                    {adjustForm.type === 'transfer' ? (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-purple-700 mb-1.5">
                          Destination Warehouse (To)
                        </label>
                        <select 
                          required
                          className="w-full p-3 rounded-lg border border-purple-300 text-sm focus:outline-none focus:border-purple-500 bg-purple-50/50"
                          value={adjustForm.toWarehouseId}
                          onChange={e => setAdjustForm({...adjustForm, toWarehouseId: e.target.value})}
                        >
                          <option value="">Select Target Warehouse</option>
                          {uniqueWarehouses
                            .filter(w => w.id !== adjustForm.warehouseId)
                            .map(w => (
                              <option key={w.id} value={w.id}>{w.name}</option>
                            ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Quantity</label>
                        <input 
                          type="number" 
                          min="1" 
                          required
                          className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary" 
                          value={adjustForm.quantity}
                          onChange={e => setAdjustForm({...adjustForm, quantity: parseInt(e.target.value, 10) || 1})}
                        />
                      </div>
                    )}
                  </div>

                  {adjustForm.type === 'transfer' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Transfer Quantity</label>
                        <input 
                          type="number" 
                          min="1" 
                          required
                          className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary font-bold text-purple-700" 
                          value={adjustForm.quantity}
                          onChange={e => setAdjustForm({...adjustForm, quantity: parseInt(e.target.value, 10) || 1})}
                        />
                      </div>
                      <div className="flex items-center text-xs text-slate-500 pt-5">
                        <i className="fa-solid fa-arrow-right-arrow-left text-purple-600 mr-2 text-base"></i>
                        <span>Units will be deducted from source depot and credited to destination depot.</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Reason / Reference Notes</label>
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary" 
                      placeholder={adjustForm.type === 'transfer' ? 'e.g. Rebalancing regional stock, Emergency transfer' : 'e.g. PO-8821 Supplier Batch, Inventory Audit, Damaged Return'}
                      value={adjustForm.reason}
                      onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}
                    />
                  </div>

                  <button type="submit" className={`w-full py-3.5 font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                    adjustForm.type === 'transfer'
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'bg-primary text-black hover:bg-primary-dark'
                  }`}>
                    <i className="fa-solid fa-check-circle"></i>
                    <span>{adjustForm.type === 'transfer' ? 'Execute Warehouse Transfer' : 'Save & Commit Stock Movement'}</span>
                  </button>
                </form>
              </div>
            )}

            {/* TRANSACTION HISTORY TAB */}
            {activeTab === 'history' && (
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-xs">
                    <tr>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4">Transaction Type</th>
                      <th className="p-4">Product & Warehouse</th>
                      <th className="p-4 text-right">Quantity</th>
                      <th className="p-4">Reason / Source</th>
                      <th className="p-4">Executed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="p-12 text-center text-slate-500">No stock transactions logged yet</td>
                      </tr>
                    ) : (
                      transactions.map(txn => (
                        <tr key={txn.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 text-slate-500 font-mono text-xs">
                            {new Date(txn.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                              txn.type === 'in' ? 'bg-emerald-100 text-emerald-800' :
                              txn.type === 'out' ? 'bg-red-100 text-red-800' :
                              txn.type === 'transfer' ? 'bg-purple-100 text-purple-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {txn.type}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{txn.product_name}</div>
                            <div className="text-xs text-slate-500"><i className="fa-solid fa-warehouse mr-1 text-slate-400"></i>{txn.warehouse_name}</div>
                          </td>
                          <td className="p-4 text-right font-extrabold text-base">
                            <span className={txn.type === 'out' ? 'text-red-600' : 'text-emerald-600'}>
                              {txn.type === 'out' ? '-' : '+'}{txn.quantity}
                            </span>
                          </td>
                          <td className="p-4 text-slate-700">
                            {txn.reason || (txn.reference_id ? `Ref: ${txn.reference_id}` : 'Direct Stock Entry')}
                          </td>
                          <td className="p-4 text-slate-600 font-medium">
                            {txn.user_name || 'System Auto-Deduction'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
