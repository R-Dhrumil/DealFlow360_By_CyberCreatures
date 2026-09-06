import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useAlert } from '../contexts/AlertContext';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${hostname}:5001`;
};

export default function InventoryManagement() {
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState('overview');
  const [stock, setStock] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Adjustment form state
  const [adjustForm, setAdjustForm] = useState({
    warehouseId: '',
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
    if (uniqueWarehouses.length > 0 && !adjustForm.warehouseId) {
      setAdjustForm(prev => ({ ...prev, warehouseId: uniqueWarehouses[0].id }));
    }
    if (uniqueProducts.length > 0 && !adjustForm.productId) {
      setAdjustForm(prev => ({ ...prev, productId: uniqueProducts[0].id }));
    }
  }, [stock]);

  const fetchData = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const [stockRes, txnRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/transactions')
      ]);
      setStock(stockRes.data || []);
      setTransactions(txnRes.data || []);
    } catch (err) {
      showAlert('Error', 'Failed to fetch inventory data', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(true);

    // Socket.IO real-time listener for customer purchases & stock adjustments
    const socketUrl = getSocketUrl();
    const socket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionAttempts: 5,
    });

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    socket.on('connect', () => {
      if (user) {
        socket.emit('register_user', {
          userId: user.id || user.userId,
          role: user.role,
          companyId: user.company_id || user.companyId || 'c1',
        });
      }
    });

    // Real-time stock refresh on stock movement or deal confirmation
    socket.on('inventory_updated', () => {
      fetchData(false);
    });

    socket.on('pipeline_updated', (data) => {
      if (data?.newStatus === 'confirmed' || data?.newStatus === 'closed') {
        fetchData(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustForm.warehouseId || !adjustForm.productId) {
      return showAlert('Warning', 'Please select warehouse and product', 'warning');
    }
    try {
      await api.post('/inventory/adjust', adjustForm);
      showAlert('Success', 'Stock adjusted successfully! Inventory updated across all modules.', 'success');
      setAdjustForm(prev => ({ ...prev, quantity: 1, reason: '' }));
      fetchData(false);
      setActiveTab('overview');
    } catch (err) {
      showAlert('Error', err.response?.data?.error || 'Failed to adjust stock', 'error');
    }
  };

  // Filtered Stock calculation
  const filteredStock = stock.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (item.warehouse_name && item.warehouse_name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (!matchesSearch) return false;

    if (statusFilter === 'out') return item.quantity_available <= 0;
    if (statusFilter === 'low') return item.quantity_available > 0 && item.quantity_available < 10;
    if (statusFilter === 'in') return item.quantity_available >= 10;
    return true;
  });

  // Calculate Metrics
  const totalStockItems = stock.reduce((sum, item) => sum + parseInt(item.quantity_available || 0, 10), 0);
  const lowStockCount = stock.filter(item => item.quantity_available > 0 && item.quantity_available < 10).length;
  const outOfStockCount = stock.filter(item => item.quantity_available <= 0).length;
  const selectedProductStock = stock.find(s => s.product_id === adjustForm.productId && s.warehouse_id === adjustForm.warehouseId);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 flex items-center justify-between shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800">Inventory & Stock Control</h1>
            <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Sync
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">Automated stock calculations on customer purchases and admin stock entries</p>
        </div>
        <button 
          onClick={() => fetchData(true)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm transition flex items-center gap-2"
        >
          <i className="fa-solid fa-arrows-rotate"></i> Refresh Data
        </button>
      </header>

      <main className="flex-1 overflow-auto p-8">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Products</p>
              <h3 className="text-2xl font-extrabold text-slate-800 mt-1">{uniqueProducts.length}</h3>
              <p className="text-xs text-slate-400 mt-1">Across all warehouses</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-boxes-stacked"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Quantity</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{totalStockItems.toLocaleString()}</h3>
              <p className="text-xs text-slate-400 mt-1">Available units</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-layer-group"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Low Stock Alerts</p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-1">{lowStockCount}</h3>
              <p className="text-xs text-amber-600 font-medium mt-1">Require re-stocking</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Out of Stock</p>
              <h3 className="text-2xl font-extrabold text-red-600 mt-1">{outOfStockCount}</h3>
              <p className="text-xs text-red-500 font-medium mt-1">Needs immediate action</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center text-xl font-bold">
              <i className="fa-solid fa-[#fa5252] fa-ban"></i>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-slate-200 pb-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary bg-primary/10' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <i className="fa-solid fa-boxes-stacked"></i> Stock Overview ({stock.length})
          </button>
          <button 
            onClick={() => setActiveTab('adjust')}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'adjust' ? 'text-primary border-b-2 border-primary bg-primary/10' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <i className="fa-solid fa-plus-minus"></i> Stock Adjustment (Admin Entry)
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-5 py-2.5 font-bold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === 'history' ? 'text-primary border-b-2 border-primary bg-primary/10' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <i className="fa-solid fa-clock-rotate-left"></i> Transaction History ({transactions.length})
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
                        <th className="p-4">Warehouse Location</th>
                        <th className="p-4 text-right">Available Qty</th>
                        <th className="p-4">Stock Status</th>
                        <th className="p-4 text-center">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStock.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="p-12 text-center text-slate-500">
                            <i className="fa-solid fa-box-open text-3xl mb-2 text-slate-300"></i>
                            <p className="font-semibold">No stock records found</p>
                          </td>
                        </tr>
                      ) : (
                        filteredStock.map((item, idx) => (
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
                              <i className="fa-solid fa-warehouse mr-1.5 text-slate-400"></i>
                              {item.warehouse_name}
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
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span> Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> In Stock
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Warehouse Location</label>
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
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Movement Type</label>
                      <select 
                        className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary bg-white"
                        value={adjustForm.type}
                        onChange={e => setAdjustForm({...adjustForm, type: e.target.value})}
                      >
                        <option value="in">📦 Stock In (Received from Supplier)</option>
                        <option value="out">📤 Stock Out (Deduction / Removal)</option>
                        <option value="adjustment">⚖️ Audit Adjustment</option>
                      </select>
                    </div>

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
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Reason / Reference Notes</label>
                    <input 
                      type="text" 
                      className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-primary" 
                      placeholder="e.g. PO-8821 Supplier Batch, Inventory Audit, Damaged Return"
                      value={adjustForm.reason}
                      onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})}
                    />
                  </div>

                  <button type="submit" className="w-full py-3.5 bg-primary text-black font-bold rounded-lg shadow-sm hover:bg-primary-dark transition flex items-center justify-center gap-2">
                    <i className="fa-solid fa-check-circle"></i> Save & Commit Stock Movement
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
                              txn.type === 'out' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
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
