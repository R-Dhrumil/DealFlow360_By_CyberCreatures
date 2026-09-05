import React, { useState, useEffect } from 'react';
import api from '../api/client';

const INITIAL_PRODUCTS = [
  { id: 'p1', sku: 'HW-SRV-01', name: 'Enterprise Server X1', category: 'Hardware', base_price: 5000, min_margin: 30, unit: 'unit', stock: 120, status: 'Active' },
  { id: 'p2', sku: 'SW-LIC-01', name: 'SaaS Platform License', category: 'Software', base_price: 100, min_margin: 20, unit: 'user/month', stock: 999, status: 'Active' },
  { id: 'p3', sku: 'SVC-ONB-01', name: 'Implementation Services', category: 'Services', base_price: 2500, min_margin: 40, unit: 'package', stock: 50, status: 'Active' },
  { id: 'p4', sku: 'HW-NET-02', name: 'Gigabit Switch 48-Port', category: 'Hardware', base_price: 1800, min_margin: 25, unit: 'unit', stock: 75, status: 'Active' },
  { id: 'p5', sku: 'SW-SEC-05', name: 'Endpoint Security Suite', category: 'Software', base_price: 45, min_margin: 15, unit: 'device/month', stock: 500, status: 'Active' },
];

const INITIAL_TIERS = [
  { id: 't1', tier: 'Bronze', maxDiscount: 5.0, minMargin: 35.0, approver: 'Auto-Approve', maxQty: 10 },
  { id: 't2', tier: 'Silver', maxDiscount: 10.0, minMargin: 25.0, approver: 'Sales Manager', maxQty: 50 },
  { id: 't3', tier: 'Gold', maxDiscount: 15.0, minMargin: 15.0, approver: 'Finance Lead', maxQty: 200 },
  { id: 't4', tier: 'Platinum', maxDiscount: 25.0, minMargin: 10.0, approver: 'Admin Override', maxQty: 1000 },
];

const CATEGORY_DISCOUNT_RULES = [
  { category: 'Hardware', maxDiscount: 12.0, defaultMargin: 30.0 },
  { category: 'Software', maxDiscount: 20.0, defaultMargin: 70.0 },
  { category: 'Services', maxDiscount: 15.0, defaultMargin: 50.0 },
];

const INITIAL_TEAM = [
  { id: 1, name: 'Alex Rep', email: 'sales@cybercreatures.com', role: 'sales_rep', status: 'Active', dealsCount: 14 },
  { id: 2, name: 'Sarah Manager', email: 'manager@cybercreatures.com', role: 'sales_manager', status: 'Active', dealsCount: 42 },
  { id: 3, name: 'David Finance', email: 'finance@cybercreatures.com', role: 'finance', status: 'Active', dealsCount: 29 },
  { id: 4, name: 'Elena Admin', email: 'admin@cybercreatures.com', role: 'admin', status: 'Active', dealsCount: 0 }
];

const INITIAL_WAREHOUSES = [
  { id: 'wh-main', name: 'Main Warehouse Depot', location: 'Chicago, IL', shippingCostWeight: 1.0, stockCount: 1420 },
  { id: 'wh-east', name: 'East Coast Logistics', location: 'Newark, NJ', shippingCostWeight: 1.2, stockCount: 850 }
];

const INITIAL_AUDIT_LOGS = [
  { id: 'L-901', action: 'CREATE_PRODUCT', entity: 'Product #HW-SRV-01', user: 'Elena Admin', role: 'admin', timestamp: '2026-09-05 14:10:00', details: 'Added Enterprise Server X1 at base price $5,000' },
  { id: 'L-902', action: 'UPDATE_TIER_CONFIG', entity: 'Tier #Gold', user: 'Elena Admin', role: 'admin', timestamp: '2026-09-05 13:45:00', details: 'Updated max discount ceiling to 15% for Gold Tier' },
  { id: 'L-903', action: 'APPROVE_QUOTATION', entity: 'Quotation #Q-104', user: 'Sarah Manager', role: 'sales_manager', timestamp: '2026-09-05 13:15:00', details: 'Approved discount of 8.5% within tier limit' },
];

export default function AdminWorkspace() {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'tiers' | 'team' | 'warehouses' | 'audit'

  // Products State
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [prodSearch, setProdSearch] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Hardware');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdMargin, setNewProdMargin] = useState('25');
  const [newProdUnit, setNewProdUnit] = useState('unit');

  // Governance Tiers State
  const [tiers, setTiers] = useState(INITIAL_TIERS);
  const [categoryRules, setCategoryRules] = useState(CATEGORY_DISCOUNT_RULES);
  const [newTierName, setNewTierName] = useState('');
  const [newTierDiscount, setNewTierDiscount] = useState('');
  const [newTierMargin, setNewTierMargin] = useState('');
  const [newTierApprover, setNewTierApprover] = useState('Sales Manager');

  // Team State
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('sales_rep');

  // Warehouses State
  const [warehouses, setWarehouses] = useState(INITIAL_WAREHOUSES);
  const [newWhName, setNewWhName] = useState('');
  const [newWhLoc, setNewWhLoc] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      if (res.data && res.data.length > 0) {
        setProducts(res.data);
      }
    } catch (err) {
      console.warn('Using seeded products in Admin workspace');
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;

    const newProd = {
      id: 'p-' + Date.now(),
      sku: newProdSku || 'SKU-' + Date.now().toString().slice(-4),
      name: newProdName,
      category: newProdCategory,
      base_price: parseFloat(newProdPrice),
      min_margin: parseFloat(newProdMargin || 25),
      unit: newProdUnit,
      stock: 100,
      status: 'Active'
    };

    try {
      await api.post('/products', {
        name: newProdName,
        category: newProdCategory,
        basePrice: newProdPrice,
        unit: newProdUnit,
        sku: newProdSku,
        minMargin: newProdMargin
      });
    } catch (err) {
      console.warn('Stored product locally');
    }

    setProducts([newProd, ...products]);
    setNewProdName('');
    setNewProdSku('');
    setNewProdPrice('');
    alert(`Product '${newProd.name}' successfully added to catalog at $${newProd.base_price}!`);
  };

  const handleAddTier = (e) => {
    e.preventDefault();
    if (!newTierName.trim() || !newTierDiscount) return;

    const newTierObj = {
      id: 't-' + Date.now(),
      tier: newTierName,
      maxDiscount: parseFloat(newTierDiscount),
      minMargin: parseFloat(newTierMargin || 20),
      approver: newTierApprover,
      maxQty: 100
    };

    setTiers([...tiers, newTierObj]);
    setNewTierName('');
    setNewTierDiscount('');
    setNewTierMargin('');
    alert(`Discount Tier '${newTierObj.tier}' configured with max ${newTierObj.maxDiscount}% discount ceiling!`);
  };

  const handleAddTeamMember = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newMember = {
      id: Date.now(),
      name: newName,
      email: newEmail,
      role: newRole,
      status: 'Active',
      dealsCount: 0
    };

    setTeam([...team, newMember]);
    setNewName('');
    setNewEmail('');
    alert(`Successfully provisioned ${newMember.name} as ${newMember.role.replace('_', ' ')}!`);
  };

  const handleAddWarehouse = (e) => {
    e.preventDefault();
    if (!newWhName.trim()) return;

    const newWh = {
      id: 'wh-' + Date.now(),
      name: newWhName,
      location: newWhLoc || 'Main Center',
      shippingCostWeight: 1.0,
      stockCount: 500
    };

    setWarehouses([...warehouses, newWh]);
    setNewWhName('');
    setNewWhLoc('');
    alert(`Warehouse '${newWh.name}' configured!`);
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(prodSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300 font-bold flex items-center justify-center text-lg">
              <i className="fa-solid fa-user-gear"></i>
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Admin Operations Suite
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Backend Governance: Product & Price Catalog, Discount Tier Configurations, Roles & Warehouse Logistics
          </p>
        </div>

        <span className="bg-purple-900 text-purple-200 border border-purple-700 px-3 py-1 rounded-xl text-xs font-mono font-bold">
          Admin Role Active
        </span>
      </header>

      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white rounded-2xl p-1.5 shadow-sm gap-1">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'products'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-boxes-stacked"></i>
          <span>Product & Price Listing</span>
        </button>

        <button
          onClick={() => setActiveTab('tiers')}
          className={`py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'tiers'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-tags"></i>
          <span>Discount Tier Config</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'team'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-users-gear"></i>
          <span>Team & Role Access</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouses')}
          className={`py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'warehouses'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-warehouse"></i>
          <span>Warehouses & Stock</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 ${
            activeTab === 'audit'
              ? 'bg-purple-600 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <i className="fa-solid fa-list-check"></i>
          <span>Audit Log</span>
        </button>
      </div>

      {/* TAB 1: Product & Price Listing Management */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Product Catalog List */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Product & Price Catalog Listing</h3>
                <p className="text-xs text-slate-500">Live inventory price list and floor margin boundaries for sales reps</p>
              </div>

              <input
                type="text"
                placeholder="Filter by product name, SKU..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-purple-500"
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Base Price ($)</th>
                    <th className="p-3 text-center">Floor Margin</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-400">{p.sku || 'SKU-00' + p.id}</td>
                      <td className="p-3 font-extrabold text-slate-900">{p.name}</td>
                      <td className="p-3">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-purple-700">
                        ${typeof p.base_price === 'number' ? p.base_price.toLocaleString() : p.base_price}
                        <span className="text-[10px] text-slate-400 font-normal block">/ {p.unit || 'unit'}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                          Min {p.min_margin || 25}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Product & Price Listing Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Add New Product & Price</h3>
              <p className="text-xs text-slate-500">Configure base selling price and margin floor</p>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NextGen Firewall Appliance"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    placeholder="e.g. HW-FW-09"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Services">Services</option>
                    <option value="Cloud License">Cloud License</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    required
                    placeholder="2500"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Floor Margin (%)</label>
                  <input
                    type="number"
                    placeholder="25"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={newProdMargin}
                    onChange={(e) => setNewProdMargin(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Unit Pricing Model</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={newProdUnit}
                  onChange={(e) => setNewProdUnit(e.target.value)}
                >
                  <option value="unit">Per Unit</option>
                  <option value="user/month">Per User / Month</option>
                  <option value="package">Package / Fixed</option>
                  <option value="device/month">Per Device / Month</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow text-xs flex justify-center items-center space-x-2"
              >
                <i className="fa-solid fa-plus"></i>
                <span>Add Product to Catalog</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Discount Tier & Governance Configuration */}
      {activeTab === 'tiers' && (
        <div className="space-y-6">
          {/* Tier Governance Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Customer Level Discount Tiers</h3>
                <p className="text-xs text-slate-500">Configure discount ceilings per tier level and approval escalation limits</p>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs font-mono font-bold px-3 py-1 rounded-xl">
                Governance Rules Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map(t => (
                <div key={t.id || t.tier} className="bg-slate-50 rounded-2xl border border-slate-200 p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-slate-900 text-base">{t.tier} Tier</h4>
                      <span className="bg-purple-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                        Max {t.maxDiscount}%
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <div className="flex justify-between bg-white p-2 rounded-xl border border-slate-100">
                        <span>Max Allowed Discount:</span>
                        <strong className="text-purple-700">{t.maxDiscount}%</strong>
                      </div>
                      <div className="flex justify-between bg-white p-2 rounded-xl border border-slate-100">
                        <span>Minimum Margin:</span>
                        <strong className="text-slate-800">{t.minMargin}%</strong>
                      </div>
                      <div className="flex justify-between bg-white p-2 rounded-xl border border-slate-100">
                        <span>Escalation Approver:</span>
                        <strong className="text-indigo-600">{t.approver}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add New Tier Config Form & Category Ceilings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Tier Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Configure New Discount Tier</h3>
              <form onSubmit={handleAddTier} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tier Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Enterprise"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={newTierName}
                    onChange={(e) => setNewTierName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Max Discount %</label>
                    <input
                      type="number"
                      required
                      placeholder="18"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={newTierDiscount}
                      onChange={(e) => setNewTierDiscount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Min Margin %</label>
                    <input
                      type="number"
                      placeholder="20"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={newTierMargin}
                      onChange={(e) => setNewTierMargin(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Escalation Approver Required</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={newTierApprover}
                    onChange={(e) => setNewTierApprover(e.target.value)}
                  >
                    <option value="Auto-Approve">Auto-Approve (No Escalation)</option>
                    <option value="Sales Manager">Sales Manager Approval</option>
                    <option value="Finance Lead">Finance Lead Approval</option>
                    <option value="Admin Override">Admin Executive Override</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow text-xs flex justify-center items-center space-x-2"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Save Discount Tier Config</span>
                </button>
              </form>
            </div>

            {/* Category Level Discount Rules */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base">Category-Level Discount Ceilings</h3>
              <p className="text-xs text-slate-500">Override discount ceilings specifically by product category</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {categoryRules.map((c, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-900 text-sm">{c.category}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Rule Active
                      </span>
                    </div>
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>Category Max Discount: <strong className="text-purple-700">{c.maxDiscount}%</strong></p>
                      <p>Target Default Margin: <strong className="text-slate-800">{c.defaultMargin}%</strong></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Team & Role Provisioning */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Active Team Directory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Deals Handled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {team.map(m => (
                    <tr key={m.id} className="hover:bg-purple-50/40 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{m.name}</td>
                      <td className="p-3 text-slate-600 font-mono">{m.email}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          m.role === 'sales_rep' ? 'bg-blue-100 text-blue-800' :
                          m.role === 'sales_manager' ? 'bg-purple-100 text-purple-800' :
                          m.role === 'finance' ? 'bg-amber-100 text-amber-800' :
                          'bg-slate-200 text-slate-800'
                        }`}>
                          {m.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-black text-slate-800">{m.dealsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Add New Team Member</h3>
            <form onSubmit={handleAddTeamMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael Scott"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. michael@cybercreatures.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Role</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="sales_rep">Sales Rep / Salesperson</option>
                  <option value="sales_manager">Sales Manager / Approver</option>
                  <option value="finance">Finance User</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow text-xs flex justify-center items-center space-x-2">
                <i className="fa-solid fa-user-plus"></i>
                <span>Provision Team Member</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: Warehouses & Stock Rules */}
      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Configured Warehouses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warehouses.map(w => (
                <div key={w.id} className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm">{w.name}</h4>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Active Depot
                    </span>
                  </div>
                  <p className="text-xs text-slate-500"><i className="fa-solid fa-location-dot mr-1"></i> {w.location}</p>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-xs font-semibold text-slate-700">
                    <span>Stock Units: {w.stockCount}</span>
                    <span>Cost Weight: {w.shippingCostWeight}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-slate-900 text-base">Add Warehouse Depot</h3>
            <form onSubmit={handleAddWarehouse} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Warehouse Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. West Coast Depot"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Los Angeles, CA"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={newWhLoc}
                  onChange={(e) => setNewWhLoc(e.target.value)}
                />
              </div>

              <button type="submit" className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow text-xs flex justify-center items-center space-x-2">
                <i className="fa-solid fa-plus"></i>
                <span>Configure Depot</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900 text-base">System Audit Log</h3>
            <span className="text-xs text-slate-500 font-mono">Immutable Compliance Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50">
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Action Event</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">Actor / Role</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {INITIAL_AUDIT_LOGS.map(log => (
                  <tr key={log.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-slate-400">{log.id}</td>
                    <td className="p-3 font-bold text-purple-700">{log.action}</td>
                    <td className="p-3 font-semibold text-slate-800">{log.entity}</td>
                    <td className="p-3 text-slate-700">{log.user} ({log.role})</td>
                    <td className="p-3 text-slate-500 font-mono">{log.timestamp}</td>
                    <td className="p-3 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
