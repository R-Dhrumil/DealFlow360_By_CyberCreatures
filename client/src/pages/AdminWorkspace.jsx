import React, { useState, useEffect } from 'react';
import api from '../api/client';
import { useNotification } from '../contexts/NotificationContext';
import { useAlert } from '../contexts/AlertContext';
import { useCurrency } from '../contexts/CurrencyContext';

// ── Role-Level Discount Authority Configuration Panel ──────────────────────────
function DiscountAuthorityPanel({ showNotification }) {
  const ROLES = [
    {
      key: 'sales_rep',
      label: 'Sales Rep',
      tierBadge: 'Tier 1 • Frontline',
      icon: 'fa-user',
      color: 'blue',
      defaultMax: 10,
      description: 'Standard discount limit for direct quote generation without requiring escalation.',
    },
    {
      key: 'sales_manager',
      label: 'Sales Manager',
      tierBadge: 'Tier 2 • Escalation',
      icon: 'fa-user-tie',
      color: 'purple',
      defaultMax: 20,
      description: 'Can approve quotes exceeding rep limits or approaching minimum floor margin.',
    },
    {
      key: 'admin',
      label: 'Admin (Floor Override)',
      tierBadge: 'Tier 3 • Executive',
      icon: 'fa-shield-halved',
      color: 'rose',
      defaultMax: 100,
      description: 'Executive floor override ceiling; allows quoting below standard floor prices.',
    },
  ];

  const [roleLimits, setRoleLimits] = useState(
    ROLES.reduce((acc, r) => { acc[r.key] = r.defaultMax; return acc; }, {})
  );
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    api.get('/approvals/config/discount-tiers').then(res => {
      if (res.data && Array.isArray(res.data)) {
        const loaded = {};
        res.data.forEach(t => { loaded[t.tier_name] = parseFloat(t.max_discount_percent); });
        setRoleLimits(prev => ({ ...prev, ...loaded }));
      }
    }).catch(() => { });
  }, []);

  const saveRoleLimit = async (roleKey) => {
    try {
      setSavingKey(roleKey);
      await api.put('/approvals/config/discount-tiers', {
        tierName: roleKey,
        maxDiscountPercent: roleLimits[roleKey]
      });
      showNotification('success', `Discount authority for ${roleKey.replace('_', ' ')} saved.`);
    } catch {
      showNotification('error', 'Failed to save discount authority.');
    } finally {
      setSavingKey(null);
    }
  };

  const roleStyles = {
    blue: {
      card: 'bg-gradient-to-b from-blue-50/70 to-white border-blue-200/80 hover:border-blue-300',
      iconBg: 'bg-blue-100 text-blue-600',
      badge: 'bg-blue-100/80 text-blue-700 border-blue-200',
      inputFocus: 'focus:border-blue-400 focus:ring-blue-100',
      sliderAccent: 'accent-blue-600',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs',
    },
    purple: {
      card: 'bg-gradient-to-b from-purple-50/70 to-white border-purple-200/80 hover:border-purple-300',
      iconBg: 'bg-purple-100 text-purple-600',
      badge: 'bg-purple-100/80 text-purple-700 border-purple-200',
      inputFocus: 'focus:border-purple-400 focus:ring-purple-100',
      sliderAccent: 'accent-purple-600',
      btn: 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs',
    },
    rose: {
      card: 'bg-gradient-to-b from-rose-50/70 to-white border-rose-200/80 hover:border-rose-300',
      iconBg: 'bg-rose-100 text-rose-600',
      badge: 'bg-rose-100/80 text-rose-700 border-rose-200',
      inputFocus: 'focus:border-rose-400 focus:ring-rose-100',
      sliderAccent: 'accent-rose-600',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs',
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-soft shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <i className="fa-solid fa-scale-balanced text-lg"></i>
        </div>
        <div>
          <h3 className="font-extrabold text-text-main text-base sm:text-lg">Salesperson Discount Authority</h3>
          <p className="text-xs text-text-muted">
            Configure the maximum discount percentage each sales role can offer before triggering automated escalation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
        {ROLES.map(role => {
          const style = roleStyles[role.color];
          const currentVal = roleLimits[role.key] ?? 0;
          const isSaving = savingKey === role.key;

          return (
            <div
              key={role.key}
              className={`rounded-2xl border p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md ${style.card}`}
            >
              <div>
                {/* Header: Icon + Title + Tier Pill */}
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-base shadow-xs ${style.iconBg}`}>
                      <i className={`fa-solid ${role.icon}`}></i>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm sm:text-base leading-tight">
                        {role.label}
                      </h4>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${style.badge}`}>
                        {role.tierBadge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Description */}
                <p className="text-xs text-slate-600 leading-relaxed min-h-[38px] mb-4">
                  {role.description}
                </p>

                {/* Numeric Input & Range */}
                <div className="bg-white/90 rounded-xl p-3.5 border border-slate-200/80 space-y-2.5 mb-5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Discount Ceiling</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        className={`w-20 px-2.5 py-1.5 text-sm font-extrabold bg-slate-50 border border-slate-200 rounded-lg outline-none text-slate-800 text-right focus:ring-2 ${style.inputFocus}`}
                        value={currentVal}
                        onChange={e => {
                          const val = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                          setRoleLimits(prev => ({ ...prev, [role.key]: val }));
                        }}
                      />
                      <span className="text-sm font-black text-slate-700">%</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.5"
                    value={currentVal}
                    onChange={e => setRoleLimits(prev => ({ ...prev, [role.key]: parseFloat(e.target.value) || 0 }))}
                    className={`w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer ${style.sliderAccent}`}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>0% (Floor)</span>
                    <span>50%</span>
                    <span>100% (Full)</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => saveRoleLimit(role.key)}
                disabled={isSaving}
                className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${style.btn}`}
              >
                {isSaving ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin text-xs"></i>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-floppy-disk text-xs"></i>
                    <span>Save {role.label} Limit</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-600 bg-slate-50/80 rounded-xl p-3.5 border border-slate-200 flex flex-wrap items-center gap-2">
        <span className="font-bold text-slate-700 flex items-center gap-1.5">
          <i className="fa-solid fa-arrow-right-arrow-left text-primary text-[11px]"></i>
          Escalation Chain:
        </span>
        <span className="text-blue-700 font-semibold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 text-[11px]">
          Sales Rep <span className="text-slate-400 font-normal">(auto-approve within limit)</span>
        </span>
        <i className="fa-solid fa-arrow-right text-slate-400 text-[10px]"></i>
        <span className="text-purple-700 font-semibold bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200 text-[11px]">
          Sales Manager <span className="text-slate-400 font-normal">(if limit exceeded or &lt; floor margin)</span>
        </span>
        <i className="fa-solid fa-arrow-right text-slate-400 text-[10px]"></i>
        <span className="text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 text-[11px]">
          Company Admin <span className="text-slate-400 font-normal">(floor price override / final sign-off)</span>
        </span>
      </div>
    </div>
  );
}

export default function AdminWorkspace() {
  const { formatMoney } = useCurrency();
  const { showNotification } = useNotification();
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'tiers' | 'team' | 'warehouses' | 'audit'

  // Initial Product Catalog Fallback (CyberCreatures Company Catalog)
  const INITIAL_PRODUCTS = [
    {
      id: 'p1',
      sku: 'HW-RTR-01',
      name: 'Industrial Router Pro',
      category: 'Hardware',
      base_price: 1200.00,
      min_margin: 40.00,
      unit: 'unit',
      stock: 85,
      status: 'Active',
      description: 'High-performance industrial grade router'
    },
    {
      id: 'p2',
      sku: 'HW-NODE-01',
      name: 'Edge Compute Node X1',
      category: 'Hardware',
      base_price: 2500.00,
      min_margin: 35.00,
      unit: 'unit',
      stock: 45,
      status: 'Active',
      description: 'Ruggedized edge computing server for low-latency nodes'
    },
    {
      id: 'p3',
      sku: 'HW-IOT-01',
      name: 'IoT Sensor Hub',
      category: 'Hardware',
      base_price: 450.00,
      min_margin: 50.00,
      unit: 'unit',
      stock: 120,
      status: 'Active',
      description: 'Central hub for telemetry and industrial IoT sensors'
    },
    {
      id: 'p6',
      sku: 'SEC-FW-01',
      name: 'NextGen Enterprise Firewall',
      category: 'Hardware',
      base_price: 3800.00,
      min_margin: 45.00,
      unit: 'unit',
      stock: 30,
      status: 'Active',
      description: 'Zero-Trust network security & deep packet inspection appliance'
    },
    {
      id: 'p7',
      sku: 'SW-CPQ-01',
      name: 'CPQ Engine Enterprise Suite',
      category: 'Software',
      base_price: 350.00,
      min_margin: 85.00,
      unit: 'user/month',
      stock: 999,
      status: 'Active',
      description: 'Multi-tier automated pricing, margin guardrails, and deal desk suite'
    },
    {
      id: 'p4',
      sku: 'SVC-SLA-01',
      name: '24/7 Premium Support SLA',
      category: 'Services',
      base_price: 500.00,
      min_margin: 80.00,
      unit: 'month',
      stock: 100,
      status: 'Active',
      description: 'Round-the-clock priority technical support & 99.99% uptime'
    }
  ];

  // Products State
  const [products, setProducts] = useState([]);
  const [prodSearch, setProdSearch] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdSku, setNewProdSku] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('Hardware');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdMargin, setNewProdMargin] = useState('25');
  const [newProdUnit, setNewProdUnit] = useState('unit');
  const [newProdStock, setNewProdStock] = useState('100');

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Governance Tiers State
  const [tiers, setTiers] = useState([
    { id: 'dt-1', tier: 'Bronze', maxDiscount: 5.0, minMargin: 35.0, approver: 'Sales Manager' },
    { id: 'dt-2', tier: 'Silver', maxDiscount: 10.0, minMargin: 30.0, approver: 'Sales Manager' },
    { id: 'dt-3', tier: 'Gold', maxDiscount: 15.0, minMargin: 25.0, approver: 'Finance Lead' },
    { id: 'dt-4', tier: 'Platinum Enterprise', maxDiscount: 22.0, minMargin: 20.0, approver: 'Admin Override' }
  ]);
  const [newTierName, setNewTierName] = useState('');
  const [newTierDiscount, setNewTierDiscount] = useState('');
  const [newTierMargin, setNewTierMargin] = useState('');
  const [newTierApprover, setNewTierApprover] = useState('Sales Manager');

  // Category-Level Discount Ceiling Rules
  const [categoryRules] = useState([
    { category: 'Hardware', maxDiscount: 12.0, defaultMargin: 35.0 },
    { category: 'Software', maxDiscount: 18.0, defaultMargin: 80.0 },
    { category: 'Services', maxDiscount: 10.0, defaultMargin: 60.0 },
  ]);

  // Fallback Team Directory
  const INITIAL_TEAM = [
    { id: 'u-1', name: 'Super Admin', email: 'superadmin@dealflow360.com', role: 'super_admin', status: 'Active', dealsCount: 0 },
    { id: 'u-2', name: 'CyberCreatures Admin', email: 'admin@cybercreatures.com', role: 'admin', status: 'Active', dealsCount: 1 },
    { id: 'u-3', name: 'Sarah Manager', email: 'manager@cybercreatures.com', role: 'sales_manager', status: 'Active', dealsCount: 0 },
    { id: 'u-4', name: 'M. Shah', email: 'sales@cybercreatures.com', role: 'sales_rep', status: 'Active', dealsCount: 16 },
    { id: 'u-5', name: 'Finance Lead', email: 'finance@cybercreatures.com', role: 'finance', status: 'Active', dealsCount: 0 },
    { id: 'u-6', name: 'J. Rao', email: 'j.rao@cybercreatures.com', role: 'sales_rep', status: 'Active', dealsCount: 1 },
    { id: 'u-7', name: 'Jim Halpert', email: 'j.halpert@cybercreatures.com', role: 'sales_rep', status: 'Active', dealsCount: 1 },
  ];

  // Team State
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('sales_rep');

  // Warehouses State
  const [warehouses, setWarehouses] = useState([]);
  const [newWhName, setNewWhName] = useState('');
  const [newWhLoc, setNewWhLoc] = useState('');
  const [newWhCostWeight, setNewWhCostWeight] = useState('1.0');
  const [newWhStock, setNewWhStock] = useState('100');
  const [newWhStatus, setNewWhStatus] = useState('Active');

  // Edit Warehouse Modal State
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [isEditWarehouseModalOpen, setIsEditWarehouseModalOpen] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([
    { id: 'LOG-9081', action: 'PRODUCT_CREATED', entity: 'NextGen Enterprise Firewall', user: 'CyberCreatures Admin', role: 'admin', timestamp: '2026-09-02 14:22', details: 'Added to catalog at $3,800 base price' },
    { id: 'LOG-9082', action: 'TIER_CONFIG_UPDATED', entity: 'Platinum Enterprise', user: 'CyberCreatures Admin', role: 'admin', timestamp: '2026-09-03 09:15', details: 'Updated max discount ceiling to 22.0%' },
    { id: 'LOG-9083', action: 'DISCOUNT_ESCALATED', entity: 'Quotation QT-44444444', user: 'M. Shah', role: 'sales_rep', timestamp: '2026-09-04 16:40', details: 'Escalated 22% discount on Delta Systems LLC deal' },
    { id: 'LOG-9084', action: 'USER_PROVISIONED', entity: 'Jim Halpert', user: 'CyberCreatures Admin', role: 'admin', timestamp: '2026-09-05 10:05', details: 'Provisioned as Sales Representative' }
  ]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      if (res.data && Array.isArray(res.data)) {
        setProducts(res.data.map(p => ({
          ...p,
          base_price: parseFloat(p.base_price) || 0,
          stock: p.stock !== undefined && p.stock !== null ? parseInt(p.stock, 10) : 100,
          min_margin: p.min_margin !== undefined ? parseFloat(p.min_margin) : (parseFloat(p.margin_percent) || 25),
          status: p.status || 'Active'
        })));
      }
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts(INITIAL_PRODUCTS);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await api.get('/users');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setTeam(res.data);
      } else {
        setTeam(INITIAL_TEAM);
      }
    } catch (err) {
      console.warn('Failed to fetch team from API, using fallback:', err);
      setTeam(INITIAL_TEAM);
    }
  };

  const fetchTiers = async () => {
    try {
      const res = await api.get('/approvals/config/discount-tiers');
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setTiers(prev => {
          const updated = [...prev];
          res.data.forEach(dbTier => {
            const idx = updated.findIndex(t => t.tier?.toLowerCase() === dbTier.tier_name?.toLowerCase());
            if (idx !== -1) {
              updated[idx] = {
                ...updated[idx],
                maxDiscount: parseFloat(dbTier.max_discount_percent),
                minMargin: dbTier.min_margin_percent ? parseFloat(dbTier.min_margin_percent) : updated[idx].minMargin,
                approver: dbTier.approver || updated[idx].approver
              };
            } else {
              updated.push({
                id: dbTier.id,
                tier: dbTier.tier_name,
                maxDiscount: parseFloat(dbTier.max_discount_percent),
                minMargin: dbTier.min_margin_percent ? parseFloat(dbTier.min_margin_percent) : 20.0,
                approver: dbTier.approver || 'Sales Manager'
              });
            }
          });
          return updated;
        });
      }
    } catch {
      console.warn('Could not fetch tiers from API');
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await api.get('/warehouses');
      if (res.data && Array.isArray(res.data)) {
        setWarehouses(res.data.map(w => ({
          ...w,
          shippingCostWeight: parseFloat(w.shippingCostWeight || w.shipping_cost_weight) || 1.0,
          stockCount: parseInt(w.stockCount !== undefined ? w.stockCount : w.stock_count, 10) || 0,
          status: w.status || 'Active'
        })));
      }
    } catch (err) {
      console.warn('Failed to fetch warehouses from API:', err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchTeam();
    fetchTiers();
    fetchWarehouses();
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;

    const stockVal = parseInt(newProdStock || 100, 10);
    const newProd = {
      id: 'p-' + Date.now(),
      sku: newProdSku || 'SKU-' + Date.now().toString().slice(-4),
      name: newProdName,
      category: newProdCategory,
      base_price: parseFloat(newProdPrice),
      min_margin: parseFloat(newProdMargin || 25),
      unit: newProdUnit,
      stock: stockVal,
      status: 'Active'
    };

    try {
      await api.post('/products', {
        name: newProdName,
        category: newProdCategory,
        basePrice: newProdPrice,
        unit: newProdUnit,
        sku: newProdSku,
        minMargin: newProdMargin,
        stock: stockVal
      });
    } catch {
      console.warn('Stored product locally');
    }

    setProducts([newProd, ...products]);

    // Audit log entry
    setAuditLogs(prev => [
      {
        id: 'LOG-' + Date.now().toString().slice(-4),
        action: 'PRODUCT_CREATED',
        entity: newProd.name,
        user: 'CyberCreatures Admin',
        role: 'admin',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        details: `Added to catalog at $${newProd.base_price} base price, initial stock ${newProd.stock}`
      },
      ...prev
    ]);

    setNewProdName('');
    setNewProdSku('');
    setNewProdPrice('');
    setNewProdStock('100');
    showNotification('success', `Product '${newProd.name}' successfully added to catalog at $${newProd.base_price}!`);
  };

  // Stock Increment / Decrement Handlers
  const handleIncrementStock = async (productId) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const currentStock = prod.stock !== undefined ? parseInt(prod.stock, 10) : 100;
    const newStock = currentStock + 1;

    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    try {
      await api.patch(`/products/${productId}/stock`, { stock: newStock });
    } catch {
      console.warn('Updated stock locally');
    }
    showNotification('success', `Incremented stock for '${prod.name}' to ${newStock} units`);
  };

  const handleDecrementStock = async (productId) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const currentStock = prod.stock !== undefined ? parseInt(prod.stock, 10) : 100;
    if (currentStock <= 0) return;
    const newStock = currentStock - 1;

    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    try {
      await api.patch(`/products/${productId}/stock`, { stock: newStock });
    } catch {
      console.warn('Updated stock locally');
    }
    showNotification('info', `Decremented stock for '${prod.name}' to ${newStock} units`);
  };

  const handleStockChange = async (productId, val) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const newStock = Math.max(0, parseInt(val, 10) || 0);

    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    try {
      await api.patch(`/products/${productId}/stock`, { stock: newStock });
    } catch {
      console.warn('Updated stock locally');
    }
  };

  // Quick Price Stepper Handlers (+/- $10)
  const handleAdjustPrice = async (productId, delta) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    const currentPrice = typeof prod.base_price === 'number' ? prod.base_price : parseFloat(prod.base_price) || 0;
    const newPrice = Math.max(1, Math.round((currentPrice + delta) * 100) / 100);

    setProducts(prev => prev.map(p => p.id === productId ? { ...p, base_price: newPrice } : p));
    try {
      await api.put(`/products/${productId}`, { ...prod, basePrice: newPrice });
    } catch {
      console.warn('Updated price locally');
    }
    showNotification('success', `Updated price for '${prod.name}' to $${newPrice.toLocaleString()}`);
  };

  // Edit Product Handlers
  const handleEditProduct = (prod) => {
    setEditingProduct({
      ...prod,
      base_price: prod.base_price,
      min_margin: prod.min_margin !== undefined ? prod.min_margin : (prod.margin_percent || 25),
      stock: prod.stock !== undefined ? prod.stock : 100,
      status: prod.status || 'Active'
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEditedProduct = async (e) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name.trim() || !editingProduct.base_price) return;

    const updatedProd = {
      ...editingProduct,
      base_price: parseFloat(editingProduct.base_price),
      min_margin: parseFloat(editingProduct.min_margin || 25),
      stock: parseInt(editingProduct.stock !== undefined ? editingProduct.stock : 100, 10)
    };

    try {
      await api.put(`/products/${editingProduct.id}`, {
        name: updatedProd.name,
        category: updatedProd.category,
        basePrice: updatedProd.base_price,
        unit: updatedProd.unit,
        sku: updatedProd.sku,
        minMargin: updatedProd.min_margin,
        floorPrice: editingProduct.floor_price !== null && editingProduct.floor_price !== undefined
          ? parseFloat(editingProduct.floor_price)
          : null,
        stock: updatedProd.stock,
        status: updatedProd.status
      });
    } catch {
      console.warn('Product updated locally');
    }

    setProducts(prev => prev.map(p => p.id === editingProduct.id ? updatedProd : p));

    // Add audit log entry
    setAuditLogs(prev => [
      {
        id: 'LOG-' + Date.now().toString().slice(-4),
        action: 'PRODUCT_UPDATED',
        entity: updatedProd.name,
        user: 'CyberCreatures Admin',
        role: 'admin',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        details: `Updated price to $${updatedProd.base_price}, stock to ${updatedProd.stock} units`
      },
      ...prev
    ]);

    setIsEditModalOpen(false);
    setEditingProduct(null);
    showNotification('success', `Product '${updatedProd.name}' updated successfully!`);
  };

  // Delete Product Handler
  const handleDeleteProduct = (prod) => {
    showAlert(
      'Delete Product',
      `Are you sure you want to remove "${prod.name}" (${prod.sku || prod.id}) from your company catalog? This will remove it from future quotation selections.`,
      'warning',
      async () => {
        try {
          await api.delete(`/products/${prod.id}`);
        } catch {
          console.warn('Deleted product locally');
        }

        setProducts(prev => prev.filter(p => p.id !== prod.id));

        // Add audit log entry
        setAuditLogs(prev => [
          {
            id: 'LOG-' + Date.now().toString().slice(-4),
            action: 'PRODUCT_DELETED',
            entity: prod.name,
            user: 'CyberCreatures Admin',
            role: 'admin',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            details: `Removed SKU ${prod.sku || prod.id} from catalog`
          },
          ...prev
        ]);

        showNotification('success', `Product '${prod.name}' was removed from catalog.`);
      },
      () => { } // Cancelled, do nothing
    );
  };

  const handleSaveTierConfig = async (tierObj) => {
    try {
      await api.put('/approvals/config/discount-tiers', {
        tierName: tierObj.tier,
        maxDiscountPercent: tierObj.maxDiscount,
        minMarginPercent: tierObj.minMargin,
        approver: tierObj.approver
      });

      setAuditLogs(prev => [
        {
          id: 'LOG-' + Date.now().toString().slice(-4),
          action: 'TIER_CONFIG_UPDATED',
          entity: `${tierObj.tier} Tier`,
          user: 'CyberCreatures Admin',
          role: 'admin',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          details: `Updated max discount to ${tierObj.maxDiscount}%, min margin to ${tierObj.minMargin}%, approver: ${tierObj.approver}`
        },
        ...prev
      ]);

      showNotification('success', `Saved configuration for ${tierObj.tier} Tier!`);
    } catch {
      showNotification('error', `Failed to save ${tierObj.tier} Tier configuration.`);
    }
  };

  const handleAddTier = async (e) => {
    e.preventDefault();
    if (!newTierName.trim() || !newTierDiscount) return;

    const newTierObj = {
      id: 't-' + Date.now(),
      tier: newTierName,
      maxDiscount: parseFloat(newTierDiscount),
      minMargin: parseFloat(newTierMargin || 20),
      approver: newTierApprover
    };

    try {
      await api.put('/approvals/config/discount-tiers', {
        tierName: newTierName,
        maxDiscountPercent: parseFloat(newTierDiscount),
        minMarginPercent: parseFloat(newTierMargin || 20),
        approver: newTierApprover
      });
    } catch { }

    setTiers(prev => [...prev.filter(t => t.tier !== newTierName), newTierObj]);
    setNewTierName('');
    setNewTierDiscount('');
    setNewTierMargin('');
    showNotification('success', `Discount Tier '${newTierObj.tier}' configured with max ${newTierObj.maxDiscount}% discount ceiling!`);
  };

  const handleAddTeamMember = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;

    try {
      const res = await api.post('/users', {
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole
      });

      const newMember = res.data;
      setTeam(prev => [newMember, ...prev]);
      setNewName('');
      setNewEmail('');
      setNewPassword('');

      setAuditLogs(prev => [
        {
          id: 'LOG-' + Date.now().toString().slice(-4),
          action: 'USER_PROVISIONED',
          entity: newMember.name,
          user: 'CyberCreatures Admin',
          role: 'admin',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          details: `Provisioned as ${newMember.role.replace('_', ' ')}`
        },
        ...prev
      ]);

      showNotification('success', `Successfully provisioned ${newMember.name} as ${newMember.role.replace('_', ' ')}!`);
    } catch (err) {
      showNotification('error', err.response?.data?.message || 'Failed to provision team member');
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    const member = team.find(m => m.id === memberId);
    if (!member || member.role === newRole) return;

    const oldRole = member.role;
    setTeam(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));

    try {
      await api.put(`/users/${memberId}/role`, { role: newRole });
    } catch (_err) {
      console.warn('Updated role locally');
    }

    const formattedRole = newRole.replace('_', ' ').toUpperCase();
    showNotification('success', `Updated role for ${member.name} to ${formattedRole}`);

    setAuditLogs(prev => [
      {
        id: 'LOG-' + Date.now().toString().slice(-4),
        action: 'USER_ROLE_UPDATED',
        entity: member.name,
        user: 'CyberCreatures Admin',
        role: 'admin',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        details: `Role updated from ${oldRole.replace('_', ' ')} to ${newRole.replace('_', ' ')}`
      },
      ...prev
    ]);
  };

  const handleAddWarehouse = async (e) => {
    e.preventDefault();
    if (!newWhName.trim()) return;

    const payload = {
      name: newWhName.trim(),
      location: newWhLoc.trim() || 'Main Depot',
      shippingCostWeight: parseFloat(newWhCostWeight) || 1.0,
      stockCount: parseInt(newWhStock, 10) || 100,
      status: newWhStatus || 'Active'
    };

    let createdWh = {
      id: 'wh-' + Date.now(),
      ...payload
    };

    try {
      const res = await api.post('/warehouses', payload);
      if (res.data && res.data.id) {
        createdWh = {
          ...createdWh,
          ...res.data,
          shippingCostWeight: parseFloat(res.data.shippingCostWeight || res.data.shipping_cost_weight) || payload.shippingCostWeight,
          stockCount: parseInt(res.data.stockCount !== undefined ? res.data.stockCount : res.data.stock_count, 10) || payload.stockCount
        };
      }
    } catch (err) {
      console.warn('Warehouse created locally:', err);
    }

    setWarehouses(prev => [...prev, createdWh]);

    // Audit log
    setAuditLogs(prev => [
      {
        id: 'LOG-' + Date.now().toString().slice(-4),
        action: 'WAREHOUSE_CREATED',
        entity: createdWh.name,
        user: 'CyberCreatures Admin',
        role: 'admin',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        details: `Configured depot in ${createdWh.location} (weight: ${createdWh.shippingCostWeight}x, stock: ${createdWh.stockCount})`
      },
      ...prev
    ]);

    setNewWhName('');
    setNewWhLoc('');
    setNewWhCostWeight('1.0');
    setNewWhStock('100');
    setNewWhStatus('Active');
    showNotification('success', `Warehouse '${createdWh.name}' configured successfully!`);
  };

  const handleEditWarehouse = (wh) => {
    setEditingWarehouse({
      id: wh.id,
      name: wh.name,
      location: wh.location || '',
      shippingCostWeight: wh.shippingCostWeight !== undefined ? wh.shippingCostWeight : 1.0,
      stockCount: wh.stockCount !== undefined ? wh.stockCount : 0,
      status: wh.status || 'Active'
    });
    setIsEditWarehouseModalOpen(true);
  };

  const handleSaveEditedWarehouse = async (e) => {
    e.preventDefault();
    if (!editingWarehouse || !editingWarehouse.name.trim()) return;

    const updatedWh = {
      ...editingWarehouse,
      name: editingWarehouse.name.trim(),
      location: editingWarehouse.location?.trim() || 'Main Depot',
      shippingCostWeight: parseFloat(editingWarehouse.shippingCostWeight) || 1.0,
      stockCount: parseInt(editingWarehouse.stockCount, 10) || 0,
      status: editingWarehouse.status || 'Active'
    };

    try {
      await api.put(`/warehouses/${editingWarehouse.id}`, {
        name: updatedWh.name,
        location: updatedWh.location,
        shippingCostWeight: updatedWh.shippingCostWeight,
        stockCount: updatedWh.stockCount,
        status: updatedWh.status
      });
    } catch (err) {
      console.warn('Warehouse updated locally:', err);
    }

    setWarehouses(prev => prev.map(w => w.id === editingWarehouse.id ? updatedWh : w));

    setAuditLogs(prev => [
      {
        id: 'LOG-' + Date.now().toString().slice(-4),
        action: 'WAREHOUSE_UPDATED',
        entity: updatedWh.name,
        user: 'CyberCreatures Admin',
        role: 'admin',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        details: `Updated parameters: location "${updatedWh.location}", weight ${updatedWh.shippingCostWeight}x, stock ${updatedWh.stockCount}`
      },
      ...prev
    ]);

    setIsEditWarehouseModalOpen(false);
    setEditingWarehouse(null);
    showNotification('success', `Warehouse '${updatedWh.name}' updated successfully!`);
  };

  const handleDeleteWarehouse = (wh) => {
    showAlert(
      'Delete Warehouse Depot',
      `Are you sure you want to delete warehouse "${wh.name}" (${wh.location || 'Main Depot'})? Any quotation stock fulfillment routes assigned to this depot will be removed.`,
      'warning',
      async () => {
        try {
          await api.delete(`/warehouses/${wh.id}`);
        } catch (err) {
          console.warn('Deleted warehouse locally:', err);
        }

        setWarehouses(prev => prev.filter(w => w.id !== wh.id));

        setAuditLogs(prev => [
          {
            id: 'LOG-' + Date.now().toString().slice(-4),
            action: 'WAREHOUSE_DELETED',
            entity: wh.name,
            user: 'CyberCreatures Admin',
            role: 'admin',
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            details: `Removed warehouse depot "${wh.name}" (${wh.id}) from catalog`
          },
          ...prev
        ]);

        showNotification('success', `Warehouse '${wh.name}' was removed.`);
      },
      () => { } // Cancelled
    );
  };

  const filteredProducts = products.filter(p =>
    p.name?.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.category?.toLowerCase().includes(prodSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(prodSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap justify-between items-center gap-4 bg-white text-text-main p-6 rounded-2xl shadow-md border border-surface-soft">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="w-9 h-9 rounded-xl bg-primary/30 border border-purple-500/40 text-purple-300 font-bold flex items-center justify-center text-lg">
              <i className="fa-solid fa-user-gear text-primary"></i>
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-text-main">
              Admin Operations Suite
            </h1>
          </div>
          <p className="text-xs text-text-muted">
            Backend Governance: Product & Price Catalog, Discount Tier Configurations, Roles & Warehouse Logistics
          </p>
        </div>


      </header>

      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-surface-soft bg-white rounded-2xl p-1.5 shadow-sm gap-1">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 ${activeTab === 'products'
              ? 'bg-primary text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <i className="fa-solid fa-boxes-stacked"></i>
          <span>Product &amp; Price Listing</span>
        </button>

        <button
          onClick={() => setActiveTab('tiers')}
          className={`py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 ${activeTab === 'tiers'
              ? 'bg-primary text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <i className="fa-solid fa-tags"></i>
          <span>Discount Tier Config</span>
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 ${activeTab === 'team'
              ? 'bg-primary text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <i className="fa-solid fa-users-gear"></i>
          <span>Team &amp; Role Access</span>
        </button>

        <button
          onClick={() => setActiveTab('warehouses')}
          className={`py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 ${activeTab === 'warehouses'
              ? 'bg-primary text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
            }`}
        >
          <i className="fa-solid fa-warehouse"></i>
          <span>Warehouses &amp; Stock</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center space-x-2 ${activeTab === 'audit'
              ? 'bg-primary text-white shadow'
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
          <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-soft shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="font-extrabold text-text-main text-base">Product & Price Catalog Listing</h3>
                <p className="text-xs text-text-muted">Live inventory price list and floor margin boundaries for sales reps</p>
              </div>

              <input
                type="text"
                placeholder="Filter by product name, SKU..."
                className="bg-slate-50 border border-surface-soft rounded-xl px-3 py-1.5 text-xs text-slate-800 w-full sm:w-60 focus:outline-none focus:ring-2 focus:ring-primary"
                value={prodSearch}
                onChange={(e) => setProdSearch(e.target.value)}
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-soft text-text-muted font-bold bg-slate-50">
                    <th className="p-3">SKU</th>
                    <th className="p-3">Product Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Base Price ($)</th>
                    <th className="p-3 text-center">Floor Margin</th>
                    <th className="p-3 text-center">Stock Units</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="p-8 text-center text-text-muted">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <i className="fa-solid fa-box-open text-2xl text-slate-300"></i>
                          <p className="font-medium text-slate-600">No products in catalog</p>
                          <p className="text-xs text-text-muted">Use the form to add products for your company over time.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-purple-50/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-text-muted">{p.sku || 'SKU-00' + p.id}</td>
                        <td className="p-3">
                          <div className="font-extrabold text-text-main">{p.name}</div>
                          {p.description && (
                            <div className="text-[10px] text-text-muted truncate max-w-xs">{p.description}</div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                            {p.category}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <div className="text-right">
                              <span className="font-black text-purple-700 block">
                                {formatMoney(p.base_price)}
                              </span>
                              <span className="text-[10px] text-text-muted font-normal block">/ {p.unit || 'unit'}</span>
                            </div>
                            <div className="flex flex-col ml-1">
                              <button
                                type="button"
                                onClick={() => handleAdjustPrice(p.id, 10)}
                                title="Quick increment price (+$10)"
                                className="w-5 h-4 flex items-center justify-center text-[9px] text-slate-500 hover:text-primary hover:bg-purple-100 rounded transition-colors"
                              >
                                <i className="fa-solid fa-chevron-up"></i>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAdjustPrice(p.id, -10)}
                                title="Quick decrement price (-$10)"
                                className="w-5 h-4 flex items-center justify-center text-[9px] text-slate-500 hover:text-primary hover:bg-purple-100 rounded transition-colors"
                              >
                                <i className="fa-solid fa-chevron-down"></i>
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                            Min {p.min_margin || 25}%
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center border border-surface-soft rounded-lg bg-slate-50 overflow-hidden shadow-xs">
                            <button
                              type="button"
                              onClick={() => handleDecrementStock(p.id)}
                              disabled={(p.stock !== undefined ? p.stock : 100) <= 0}
                              className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-200 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                              title="Decrement stock quantity"
                            >
                              <i className="fa-solid fa-minus text-[9px]"></i>
                            </button>
                            <input
                              type="number"
                              min="0"
                              value={p.stock !== undefined ? p.stock : 100}
                              onChange={(e) => handleStockChange(p.id, e.target.value)}
                              className="w-10 text-center font-bold text-text-main text-xs bg-transparent border-0 focus:ring-0 p-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              title="In-stock inventory units"
                            />
                            <button
                              type="button"
                              onClick={() => handleIncrementStock(p.id)}
                              className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-primary hover:bg-slate-200 transition-colors"
                              title="Increment stock quantity"
                            >
                              <i className="fa-solid fa-plus text-[9px]"></i>
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${p.status === 'Inactive'
                              ? 'bg-slate-100 text-slate-600'
                              : p.status === 'Archived'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                            {p.status || 'Active'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(p)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-primary hover:bg-purple-100 transition-colors"
                              title="Edit Product & Pricing"
                            >
                              <i className="fa-solid fa-pen-to-square text-xs"></i>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete Product from Company Catalog"
                            >
                              <i className="fa-solid fa-trash-can text-xs"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Product & Price Listing Form */}
          <div className="bg-white rounded-2xl border border-surface-soft shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-text-main text-base">Add New Product & Price</h3>
              <p className="text-xs text-text-muted">Configure base selling price, margin floor, and stock count</p>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NextGen Firewall Appliance"
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newProdSku}
                    onChange={(e) => setNewProdSku(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
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
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Floor Margin (%)</label>
                  <input
                    type="number"
                    placeholder="25"
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newProdMargin}
                    onChange={(e) => setNewProdMargin(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Pricing Model</label>
                  <select
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                  >
                    <option value="unit">Per Unit</option>
                    <option value="user/month">Per User / Month</option>
                    <option value="package">Package / Fixed</option>
                    <option value="device/month">Per Device / Month</option>
                    <option value="month">Per Month</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Stock Units</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="100"
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-primary text-white font-bold rounded-xl transition-all shadow text-xs flex justify-center items-center space-x-2 hover:bg-primary-dark"
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
          <div className="bg-white rounded-2xl border border-surface-soft shadow-sm p-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-text-main text-base">Customer Level Discount Tiers</h3>
                <p className="text-xs text-text-muted">Configure discount ceilings per tier level and approval escalation limits</p>
              </div>
              <span className="bg-purple-100 text-purple-800 text-xs font-mono font-bold px-3 py-1 rounded-xl">
                Governance Rules Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map(t => (
                <div key={t.id || t.tier} className="bg-slate-50 rounded-2xl border border-surface-soft p-5 space-y-3 flex flex-col justify-between hover:border-purple-200 transition-all shadow-xs">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                      <h4 className="font-black text-text-main text-base">{t.tier} Tier</h4>
                      <span className="bg-primary text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                        Max {t.maxDiscount}%
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1 flex justify-between">
                          <span>Max Allowed Discount:</span>
                          <span className="text-purple-700 font-extrabold">{t.maxDiscount}%</span>
                        </label>
                        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            className="w-full text-xs font-bold text-purple-700 bg-transparent outline-none px-1"
                            value={t.maxDiscount}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setTiers(prev => prev.map(item => item.tier === t.tier ? { ...item, maxDiscount: val } : item));
                            }}
                          />
                          <span className="text-slate-400 font-bold text-xs pr-1">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1 flex justify-between">
                          <span>Minimum Margin:</span>
                          <span className="text-slate-800 font-extrabold">{t.minMargin}%</span>
                        </label>
                        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            className="w-full text-xs font-bold text-slate-800 bg-transparent outline-none px-1"
                            value={t.minMargin}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setTiers(prev => prev.map(item => item.tier === t.tier ? { ...item, minMargin: val } : item));
                            }}
                          />
                          <span className="text-slate-400 font-bold text-xs pr-1">%</span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Escalation Approver:</label>
                        <select
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-semibold text-primary outline-none focus:ring-2 focus:ring-primary"
                          value={t.approver}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTiers(prev => prev.map(item => item.tier === t.tier ? { ...item, approver: val } : item));
                          }}
                        >
                          <option value="Auto-Approve">Auto-Approve</option>
                          <option value="Sales Manager">Sales Manager</option>
                          <option value="Finance Lead">Finance Lead</option>
                          <option value="Finance Manager">Finance Manager</option>
                          <option value="Admin Override">Admin Override</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveTierConfig(t)}
                    className="w-full mt-2 py-1.5 px-3 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl transition-all shadow flex justify-center items-center gap-1.5"
                  >
                    <i className="fa-solid fa-floppy-disk"></i>
                    <span>Save {t.tier} Config</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ── NEW: Role-Level Discount Authority Config ── */}
          <DiscountAuthorityPanel showNotification={showNotification} />

          {/* Add New Tier Config Form & Category Ceilings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Tier Form */}
            <div className="bg-white rounded-2xl border border-surface-soft shadow-sm p-6 space-y-4">
              <h3 className="font-extrabold text-text-main text-base">Configure New Discount Tier</h3>
              <form onSubmit={handleAddTier} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tier Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Enterprise"
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
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
                      className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newTierDiscount}
                      onChange={(e) => setNewTierDiscount(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Min Margin %</label>
                    <input
                      type="number"
                      placeholder="20"
                      className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      value={newTierMargin}
                      onChange={(e) => setNewTierMargin(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Escalation Approver Required</label>
                  <select
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newTierApprover}
                    onChange={(e) => setNewTierApprover(e.target.value)}
                  >
                    <option value="Auto-Approve">Auto-Approve (No Escalation)</option>
                    <option value="Sales Manager">Sales Manager Approval</option>
                    <option value="Finance Lead">Finance Lead Approval</option>
                    <option value="Finance Manager">Finance Manager Approval</option>
                    <option value="Admin Override">Admin Executive Override</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-primary text-white text-text-main font-bold rounded-xl transition-all shadow text-xs flex justify-center items-center space-x-2"
                >
                  <i className="fa-solid fa-plus"></i>
                  <span>Save Discount Tier Config</span>
                </button>
              </form>
            </div>

            {/* Category Level Discount Rules */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-soft shadow-sm p-6 space-y-4">
              <h3 className="font-extrabold text-text-main text-base">Category-Level Discount Ceilings</h3>
              <p className="text-xs text-text-muted">Override discount ceilings specifically by product category</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {categoryRules.map((c, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-surface-soft space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-text-main text-sm">{c.category}</span>
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

              <div className="mt-2 bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700">
                <i className="fa-solid fa-info-circle mr-1.5"></i>
                <strong>Floor Price</strong> — Set per-product in the <strong>Product & Price Listing</strong> tab.
                When a quotation's net price falls below a product's floor price, it escalates to Manager and then Admin approval automatically.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Team & Role Provisioning */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-soft shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-text-main text-base">Active Team Directory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-soft text-text-muted font-bold bg-slate-50">
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
                      <td className="p-3 font-bold text-text-main">{m.name}</td>
                      <td className="p-3 text-slate-600 font-mono">{m.email}</td>
                      <td className="p-3">
                        <div className="relative inline-flex items-center group" title="Click to change team member role">
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.id, e.target.value)}
                            className={`cursor-pointer appearance-none pl-3 pr-7 py-1 rounded-full text-[10px] font-extrabold uppercase border focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all ${m.role === 'super_admin' ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200' :
                                m.role === 'admin' ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200' :
                                  m.role === 'sales_manager' ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200' :
                                    m.role === 'sales_rep' ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200' :
                                      m.role === 'finance' ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' :
                                        m.role === 'finance_manager' ? 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200' :
                                          'bg-slate-200 text-slate-800 border-slate-300 hover:bg-slate-300'
                              }`}
                          >
                            <option value="super_admin" className="bg-white text-slate-800 font-bold">SUPER ADMIN</option>
                            <option value="admin" className="bg-white text-slate-800 font-bold">ADMIN</option>
                            <option value="sales_manager" className="bg-white text-slate-800 font-bold">SALES MANAGER</option>
                            <option value="sales_rep" className="bg-white text-slate-800 font-bold">SALES REP</option>
                            <option value="finance_manager" className="bg-white text-slate-800 font-bold">FINANCE MANAGER</option>
                          </select>
                          <i className="fa-solid fa-chevron-down text-[8px] pointer-events-none absolute right-2.5 opacity-60 text-current"></i>
                        </div>
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

          <div className="bg-white rounded-2xl border border-surface-soft shadow-sm p-6 space-y-4">
            <h3 className="font-extrabold text-text-main text-base">Add New Team Member</h3>
            <form onSubmit={handleAddTeamMember} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael Scott"
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
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
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Account Password</label>
                <input
                  type="password"
                  required
                  placeholder="Set account password"
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Role</label>
                <select
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="sales_rep">Sales Rep / Salesperson</option>
                  <option value="sales_manager">Sales Manager / Approver</option>
                  <option value="finance_manager">Finance Manager</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 px-4 bg-primary  text-text-main text-white font-bold rounded-xl transition-all shadow text-xs flex justify-center items-center space-x-2">
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
          <div className="lg:col-span-2 bg-white rounded-2xl border border-surface-soft shadow-sm p-6 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-text-main text-base flex items-center gap-2">
                  <span>Configured Warehouses</span>
                  <span className="bg-primary/10 text-primary text-xs font-black px-2.5 py-0.5 rounded-full">
                    {warehouses.length}
                  </span>
                </h3>
                <p className="text-xs text-text-muted">
                  Logistics nodes, regional distribution depots, and quotation fulfillment routing
                </p>
              </div>
            </div>

            {warehouses.length === 0 ? (
              <div className="text-center py-12 px-4 border-2 border-dashed border-slate-200 rounded-2xl space-y-3 bg-slate-50/50">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-primary text-2xl shadow-xs">
                  <i className="fa-solid fa-warehouse"></i>
                </div>
                <h4 className="font-bold text-slate-800 text-sm">No Warehouses Configured</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Add your first depot or regional distribution center using the form on the right to configure inventory allocation and automatic fulfillment splits.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {warehouses.map(w => (
                  <div
                    key={w.id}
                    className="border border-surface-soft rounded-2xl p-4 bg-slate-50 hover:bg-white hover:shadow-md transition-all duration-200 space-y-3 relative group"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-text-main text-sm leading-snug">{w.name}</h4>
                        <p className="text-xs text-text-muted flex items-center gap-1.5">
                          <i className="fa-solid fa-location-dot text-rose-500 text-[11px]"></i>
                          <span>{w.location || 'Main Depot'}</span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          w.status === 'Inactive' || w.status === 'Decommissioned'
                            ? 'bg-slate-200 text-slate-700'
                            : w.status === 'Maintenance'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {w.status || 'Active Depot'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEditWarehouse(w)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-purple-100 transition-colors"
                          title="Edit Warehouse & Stock Rules"
                        >
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteWarehouse(w)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Warehouse Depot"
                        >
                          <i className="fa-solid fa-trash-can text-xs"></i>
                        </button>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-surface-soft grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white/80 rounded-xl p-2.5 border border-slate-200/60 shadow-2xs">
                        <span className="text-[10px] text-text-muted block font-semibold">Available Units</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <i className="fa-solid fa-boxes-stacked text-[11px] text-primary"></i>
                          <span>{w.stockCount !== undefined ? w.stockCount : 0} units</span>
                        </span>
                      </div>
                      <div className="bg-white/80 rounded-xl p-2.5 border border-slate-200/60 shadow-2xs">
                        <span className="text-[10px] text-text-muted block font-semibold">Logistics Weight</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1.5 mt-0.5">
                          <i className="fa-solid fa-truck-fast text-[11px] text-blue-600"></i>
                          <span>{w.shippingCostWeight}x rate</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-surface-soft shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-text-main text-base">Add Warehouse Depot</h3>
              <p className="text-xs text-text-muted">Register a new physical or virtual depot for fulfillment splits</p>
            </div>

            <form onSubmit={handleAddWarehouse} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. West Coast Distribution Hub"
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary font-medium"
                  value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Location / Hub City</label>
                <input
                  type="text"
                  placeholder="e.g. Los Angeles, CA"
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newWhLoc}
                  onChange={(e) => setNewWhLoc(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shipping Cost Weight</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    placeholder="1.0"
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newWhCostWeight}
                    onChange={(e) => setNewWhCostWeight(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">1.0 = standard</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Initial Stock Units</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="100"
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    value={newWhStock}
                    onChange={(e) => setNewWhStock(e.target.value)}
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Depot inventory</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Depot Status</label>
                <select
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  value={newWhStatus}
                  onChange={(e) => setNewWhStatus(e.target.value)}
                >
                  <option value="Active">Active Depot (Available for Split Routing)</option>
                  <option value="Maintenance">Maintenance Mode</option>
                  <option value="Inactive">Inactive / Decommissioned</option>
                </select>
              </div>

              <button type="submit" className="w-full py-2.5 px-4 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow text-xs flex justify-center items-center space-x-2">
                <i className="fa-solid fa-plus"></i>
                <span>Configure Depot</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-surface-soft shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-text-main text-base">System Audit Log</h3>
            <span className="text-xs text-text-muted font-mono">Immutable Compliance Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-surface-soft text-text-muted font-bold bg-slate-50">
                  <th className="p-3">Log ID</th>
                  <th className="p-3">Action Event</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">Actor / Role</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-purple-50/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-text-muted">{log.id}</td>
                    <td className="p-3 font-bold text-purple-700">{log.action}</td>
                    <td className="p-3 font-semibold text-slate-800">{log.entity}</td>
                    <td className="p-3 text-slate-700">{log.user} ({log.role})</td>
                    <td className="p-3 text-text-muted font-mono">{log.timestamp}</td>
                    <td className="p-3 text-slate-600">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-surface-soft shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
            <div className="flex justify-between items-center p-5 border-b border-surface-soft bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                  <i className="fa-solid fa-pen-to-square"></i>
                </span>
                <div>
                  <h3 className="font-extrabold text-text-main text-sm">Edit Product &amp; Pricing</h3>
                  <p className="text-[11px] text-text-muted">Modify catalog listing for {editingProduct.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEditedProduct} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU Code</label>
                  <input
                    type="text"
                    value={editingProduct.sku || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, sku: e.target.value })}
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Services">Services</option>
                    <option value="Cloud License">Cloud License</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingProduct.base_price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, base_price: e.target.value })}
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Floor Margin (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingProduct.min_margin}
                    onChange={(e) => setEditingProduct({ ...editingProduct, min_margin: e.target.value })}
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Floor Price field — triggers Manager→Admin escalation if net price falls below */}
              <div className="mt-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center gap-2">
                  <i className="fa-solid fa-shield-halved text-rose-500 text-xs"></i>
                  Floor Price (₹)
                  <span className="text-[10px] font-normal text-slate-400 ml-1">— Optional. Discount cannot bring net price below this value without Admin approval.</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 850 — leave blank for no floor"
                  value={editingProduct.floor_price || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, floor_price: e.target.value ? parseFloat(e.target.value) : null })}
                  className="w-full bg-rose-50 border border-rose-200 rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-rose-300 placeholder:text-slate-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit Pricing Model</label>
                  <select
                    value={editingProduct.unit || 'unit'}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="unit">Per Unit</option>
                    <option value="user/month">Per User / Month</option>
                    <option value="package">Package / Fixed</option>
                    <option value="device/month">Per Device / Month</option>
                    <option value="month">Per Month</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inventory / Stock Count</label>
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(prev => ({ ...prev, stock: Math.max(0, (parseInt(prev.stock, 10) || 0) - 1) }))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                      title="Decrement stock"
                    >
                      <i className="fa-solid fa-minus text-[10px]"></i>
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={editingProduct.stock !== undefined ? editingProduct.stock : 100}
                      onChange={(e) => setEditingProduct({ ...editingProduct, stock: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="flex-1 text-center bg-slate-50 border border-surface-soft rounded-lg py-1.5 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setEditingProduct(prev => ({ ...prev, stock: (parseInt(prev.stock, 10) || 0) + 1 }))}
                      className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors"
                      title="Increment stock"
                    >
                      <i className="fa-solid fa-plus text-[10px]"></i>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catalog Status</label>
                <select
                  value={editingProduct.status || 'Active'}
                  onChange={(e) => setEditingProduct({ ...editingProduct, status: e.target.value })}
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Active">Active (Available for Quotes)</option>
                  <option value="Inactive">Inactive (Hidden from Reps)</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingProduct(null); }}
                  className="px-4 py-2 rounded-xl border border-surface-soft text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-sm flex items-center space-x-1.5"
                >
                  <i className="fa-solid fa-check text-xs"></i>
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Warehouse Modal */}
      {isEditWarehouseModalOpen && editingWarehouse && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-surface-soft shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-primary flex items-center justify-center font-bold">
                  <i className="fa-solid fa-warehouse text-sm"></i>
                </div>
                <div>
                  <h3 className="font-extrabold text-text-main text-base">Edit Warehouse Depot</h3>
                  <p className="text-xs text-text-muted">Update location, logistics weight multiplier, and stock parameters</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsEditWarehouseModalOpen(false); setEditingWarehouse(null); }}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <form onSubmit={handleSaveEditedWarehouse} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Warehouse Name *</label>
                <input
                  type="text"
                  required
                  value={editingWarehouse.name}
                  onChange={(e) => setEditingWarehouse({ ...editingWarehouse, name: e.target.value })}
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Physical Location / Hub City</label>
                <input
                  type="text"
                  value={editingWarehouse.location || ''}
                  onChange={(e) => setEditingWarehouse({ ...editingWarehouse, location: e.target.value })}
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="e.g. Frankfurt, Germany"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shipping Cost Multiplier</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    required
                    value={editingWarehouse.shippingCostWeight}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, shippingCostWeight: e.target.value })}
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">1.0 = baseline freight cost</p>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Stock Units Available</label>
                  <input
                    type="number"
                    min="0"
                    value={editingWarehouse.stockCount}
                    onChange={(e) => setEditingWarehouse({ ...editingWarehouse, stockCount: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                    className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Capacity across product SKUs</p>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Depot Operational Status</label>
                <select
                  value={editingWarehouse.status || 'Active'}
                  onChange={(e) => setEditingWarehouse({ ...editingWarehouse, status: e.target.value })}
                  className="w-full bg-slate-50 border border-surface-soft rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="Active">Active Depot (Available for Split Routing)</option>
                  <option value="Maintenance">Maintenance Mode (Temporary Hold)</option>
                  <option value="Inactive">Inactive / Decommissioned</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsEditWarehouseModalOpen(false); setEditingWarehouse(null); }}
                  className="px-4 py-2 rounded-xl border border-surface-soft text-slate-600 font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-sm flex items-center space-x-1.5"
                >
                  <i className="fa-solid fa-check text-xs"></i>
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
