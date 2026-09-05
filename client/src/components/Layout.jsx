import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';

const DEMO_USERS = [
  { name: 'Alex Rep', email: 'rep@dealflow360.com', role: 'sales_rep', label: 'Sales Rep' },
  { name: 'Sarah Manager', email: 'manager@dealflow360.com', role: 'sales_manager', label: 'Sales Manager' },
  { name: 'David Finance', email: 'finance@dealflow360.com', role: 'finance', label: 'Finance' },
  { name: 'Elena Admin', email: 'admin@dealflow360.com', role: 'admin', label: 'Admin' }
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { name: 'Alex Rep', role: 'sales_rep', companyId: '11111111-1111-1111-1111-111111111111' };
  const [siteName, setSiteName] = useState('DealFlow360');

  useEffect(() => {
    api.get('/settings/public').then(res => {
      if (res.data?.site_name) setSiteName(res.data.site_name);
    }).catch(console.error);
  }, []);

  const handleRoleSwitch = (demoUser) => {
    const newUser = {
      id: 'demo-' + demoUser.role,
      name: demoUser.name,
      email: demoUser.email,
      role: demoUser.role,
      companyId: '11111111-1111-1111-1111-111111111111'
    };
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('token', 'demo-token-' + demoUser.role);
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Pipeline', path: '/app/pipeline', icon: 'fa-diagram-project', roles: ['sales_rep', 'sales_manager', 'finance', 'admin', 'super_admin'] },
    { name: 'Dashboard', path: '/app/dashboard', icon: 'fa-chart-pie', roles: ['sales_rep', 'sales_manager', 'admin', 'super_admin'] },
    { name: 'Quotation Builder', path: '/app/quote', icon: 'fa-file-invoice-dollar', roles: ['sales_rep', 'sales_manager', 'admin'] },
    { name: 'Approvals', path: '/app/approvals', icon: 'fa-check-double', roles: ['sales_manager', 'admin', 'finance', 'sales_rep'] },
    { name: 'Reporting', path: '/app/reporting', icon: 'fa-chart-bar', roles: ['sales_manager', 'admin', 'super_admin'] },
    { name: 'Global Tenants', path: '/app/superadmin', icon: 'fa-globe', roles: ['super_admin', 'admin'] },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans">
      {/* Top Demo Bar for Hackathon Presentation */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex flex-wrap justify-between items-center text-xs text-slate-300 print:hidden z-20">
        <div className="flex items-center space-x-3">
          <span className="bg-primary-600 text-white px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">Odoo Hackathon Demo</span>
          <span className="text-slate-400">Current Role: <strong className="text-white capitalize">{user.role?.replace('_', ' ')}</strong> ({user.name})</span>
        </div>
        
        <div className="flex items-center space-x-2 my-1 sm:my-0">
          <span className="text-slate-400 font-medium mr-1">Switch Role:</span>
          {DEMO_USERS.map(u => (
            <button
              key={u.role}
              onClick={() => handleRoleSwitch(u)}
              className={`px-2.5 py-1 rounded text-xs transition-all font-medium ${
                user.role === u.role 
                  ? 'bg-primary-500 text-white ring-2 ring-primary-300' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {u.label}
            </button>
          ))}
          <Link
            to="/portal/demo-quote-1"
            className="px-2.5 py-1 rounded text-xs bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors ml-2"
          >
            <i className="fa-solid fa-external-link mr-1"></i> Open Customer Portal
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Sidebar */}
        <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col print:hidden shadow-lg border-r border-slate-800">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center space-x-3">
            <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-md font-bold text-lg">
              DF
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-wide block leading-tight">{siteName}</span>
              <span className="text-[11px] text-slate-400 font-mono">Self-Governing Engine</span>
            </div>
          </div>
          
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {navItems.filter(item => item.roles.includes(user?.role)).map(item => {
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-primary-600 text-white shadow-md font-semibold' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <i className={`fa-solid ${item.icon} w-5 text-center text-base`}></i>
                  <span className="text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-800 bg-slate-900/50">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-primary-900/80 border border-primary-500/30 flex items-center justify-center text-primary-300 font-bold">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              <i className="fa-solid fa-arrow-right-from-bracket"></i>
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* Main Page Area */}
        <main className="flex-1 overflow-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
