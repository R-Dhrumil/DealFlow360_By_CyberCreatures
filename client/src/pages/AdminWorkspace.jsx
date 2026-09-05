import React, { useState } from 'react';

const INITIAL_TEAM = [
  { id: 1, name: 'Alex Rep', email: 'rep@dealflow360.com', role: 'sales_rep', status: 'Active', dealsCount: 14 },
  { id: 2, name: 'Sarah Manager', email: 'manager@dealflow360.com', role: 'sales_manager', status: 'Active', dealsCount: 42 },
  { id: 3, name: 'David Finance', email: 'finance@dealflow360.com', role: 'finance', status: 'Active', dealsCount: 29 },
  { id: 4, name: 'Elena Admin', email: 'admin@dealflow360.com', role: 'admin', status: 'Active', dealsCount: 0 }
];

const INITIAL_TIERS = [
  { tier: 'Bronze', maxDiscount: 5.0, minMargin: 35.0 },
  { tier: 'Silver', maxDiscount: 10.0, minMargin: 25.0 },
  { tier: 'Gold', maxDiscount: 15.0, minMargin: 15.0 }
];

const INITIAL_WAREHOUSES = [
  { id: 'wh-main', name: 'Main Warehouse Depot', location: 'Chicago, IL', shippingCostWeight: 1.0, stockCount: 1420 },
  { id: 'wh-east', name: 'East Coast Logistics', location: 'Newark, NJ', shippingCostWeight: 1.2, stockCount: 850 }
];

const INITIAL_AUDIT_LOGS = [
  { id: 'L-901', action: 'APPROVE_QUOTATION', entity: 'Quotation #Q-104', user: 'Sarah Manager', role: 'sales_manager', timestamp: '2026-09-05 13:15:00', details: 'Approved discount of 8.5% within tier limit' },
  { id: 'L-902', action: 'CREATE_QUOTATION', entity: 'Quotation #Q-102', user: 'Alex Rep', role: 'sales_rep', timestamp: '2026-09-05 12:40:00', details: 'Created draft quote for Acme Corp' },
  { id: 'L-903', action: 'COUNTER_PROPOSAL', entity: 'Quotation #Q-102', user: 'Acme Corp Customer', role: 'customer', timestamp: '2026-09-05 12:55:00', details: 'Customer proposed 18% counter discount. Triggered governance re-approval.' }
];

export default function AdminWorkspace() {
  const [activeTab, setActiveTab] = useState('team');

  // Team Member Form State
  const [team, setTeam] = useState(INITIAL_TEAM);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('sales_rep');

  // Governance Tiers State
  const [tiers, setTiers] = useState(INITIAL_TIERS);

  // Warehouses State
  const [warehouses, setWarehouses] = useState(INITIAL_WAREHOUSES);
  const [newWhName, setNewWhName] = useState('');
  const [newWhLoc, setNewWhLoc] = useState('');

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
    alert(`Successfully added ${newMember.name} as ${newMember.role.replace('_', ' ')}!`);
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

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 space-y-6">
      <header className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Operations Suite</h1>
          <p className="text-sm text-slate-500">Backend configuration area: Team setup, price lists, discount tiers, warehouses & audit trail</p>
        </div>

        <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs font-bold font-mono">
          <i className="fa-solid fa-user-gear mr-1"></i> Admin Privileges Active
        </span>
      </header>

      {/* Admin Tabbed Navigation */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-sm space-x-2">
        <button
          onClick={() => setActiveTab('team')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center ${
            activeTab === 'team'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <i className="fa-solid fa-users-gear mr-2"></i> Team & Roles (Sales, Manager, Finance)
        </button>

        <button
          onClick={() => setActiveTab('tiers')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center ${
            activeTab === 'tiers'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <i className="fa-solid fa-sliders mr-2"></i> Discount Tiers & Approval Chains
        </button>

        <button
          onClick={() => setActiveTab('warehouses')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center ${
            activeTab === 'warehouses'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <i className="fa-solid fa-warehouse mr-2"></i> Warehouses & Stock Rules
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition-all flex items-center ${
            activeTab === 'audit'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <i className="fa-solid fa-list-check mr-2"></i> System Audit Log
        </button>
      </div>

      {/* TAB 1: Team & User Management */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-base mb-4">Active Team Directory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Assigned Role</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Deals Handled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {team.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">{m.name}</td>
                      <td className="p-3 text-slate-600 font-mono">{m.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                          m.role === 'sales_rep' ? 'bg-blue-100 text-blue-800' :
                          m.role === 'sales_manager' ? 'bg-purple-100 text-purple-800' :
                          m.role === 'finance' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-slate-200 text-slate-800'
                        }`}>
                          {m.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          {m.status}
                        </span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">{m.dealsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Team Member Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add New Team Member</h3>
            <p className="text-xs text-slate-500">Create access credentials for Sales Rep, Sales Manager, or Finance Users.</p>

            <form onSubmit={handleAddTeamMember} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael Scott"
                  className="input-field text-xs"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. michael@dealflow360.com"
                  className="input-field text-xs"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Role</label>
                <select
                  className="input-field text-xs font-semibold"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="sales_rep">Sales Rep / Salesperson</option>
                  <option value="sales_manager">Sales Manager / Approver</option>
                  <option value="finance">Finance / Operations User</option>
                  <option value="admin">System Admin</option>
                </select>
              </div>

              <button type="submit" className="btn-primary w-full text-xs font-bold shadow-md">
                <i className="fa-solid fa-user-plus mr-1"></i> Provision User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Discount Tiers & Approval Chain Setup */}
      {activeTab === 'tiers' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Customer Tier & Category Discount Governance</h3>
            <p className="text-xs text-slate-500">Configure discount ceilings per tier level and approval escalation boundaries.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tiers.map(t => (
              <div key={t.tier} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 text-sm">{t.tier} Tier</h4>
                  <span className="bg-primary-100 text-primary-800 text-xs font-bold px-2 py-0.5 rounded">
                    Max {t.maxDiscount}% Disc
                  </span>
                </div>
                <div className="text-xs text-slate-600 space-y-1">
                  <p>Allowed Max Discount: <strong className="text-slate-800">{t.maxDiscount}%</strong></p>
                  <p>Minimum Margin Threshold: <strong className="text-slate-800">{t.minMargin}%</strong></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Warehouses & Stock Rules */}
      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-bold text-slate-900 text-base mb-4">Configured Warehouses</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {warehouses.map(w => (
                <div key={w.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm">{w.name}</h4>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">
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

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add Warehouse Depot</h3>
            <form onSubmit={handleAddWarehouse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Warehouse Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. West Coast Depot"
                  className="input-field text-xs"
                  value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  placeholder="e.g. Los Angeles, CA"
                  className="input-field text-xs"
                  value={newWhLoc}
                  onChange={(e) => setNewWhLoc(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-primary w-full text-xs font-bold shadow-md">
                <i className="fa-solid fa-plus mr-1"></i> Configure Depot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: System Audit Trail */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">System-Wide Audit Trail</h3>
            <span className="text-xs text-slate-500 font-mono">Immutable Compliance Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50">
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
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-500">{log.id}</td>
                    <td className="p-3 font-bold text-primary-600">{log.action}</td>
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
