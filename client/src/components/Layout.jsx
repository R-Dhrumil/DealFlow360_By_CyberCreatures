import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useCurrency } from '../contexts/CurrencyContext';

const DEMO_USERS = [
  { name: 'Alex Rep', email: 'rep@dealflow360.com', role: 'sales_rep', label: 'Sales Rep' },
  { name: 'Sarah Manager', email: 'manager@dealflow360.com', role: 'sales_manager', label: 'Sales Manager' },
  { name: 'Fiona Finance Mgr', email: 'financemanager@cybercreatures.com', role: 'finance_manager', label: 'Finance Manager' },
  { name: 'Elena Admin', email: 'admin@dealflow360.com', role: 'admin', label: 'Admin' },
  { name: 'Omar Operations', email: 'ops@dealflow360.com', role: 'operations', label: 'Operations' }
];

function CurrencyPicker() {
  const { currencies, selected, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 font-bold text-xs shadow-sm transition-all cursor-pointer"
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="font-mono">{selected.code}</span>
        <span className="text-slate-400">{selected.symbol}</span>
        <i className={`fa-solid fa-chevron-down text-[9px] text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}></i>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Display Currency</p>
            <p className="text-[10px] text-slate-400">Base: ₹ INR — converted for display only</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {currencies.map(c => (
              <button
                key={c.code}
                onClick={() => { setCurrency(c.code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                  c.code === selected.code
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="text-xl leading-none">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">{c.code} <span className="font-normal text-slate-400">· {c.symbol}</span></p>
                  <p className="text-[10px] text-slate-500 truncate">{c.name}</p>
                </div>
                {c.code === selected.code && (
                  <i className="fa-solid fa-check text-indigo-500 text-xs shrink-0"></i>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Pipeline', path: '/app/pipeline', icon: 'fa-diagram-project', roles: ['sales_rep', 'sales_manager', 'finance_manager', 'admin'] },
    { name: 'Dashboard', path: '/app/dashboard', icon: 'fa-chart-pie', roles: ['sales_rep', 'sales_manager', 'finance_manager', 'admin'] },
    { name: 'Quotation Builder', path: '/app/quote', icon: 'fa-file-invoice-dollar', roles: ['sales_rep', 'sales_manager', 'finance_manager', 'admin'] },
    { name: 'Inquiries', path: '/app/inquiries', icon: 'fa-inbox', roles: ['sales_rep', 'sales_manager', 'finance_manager', 'admin'] },
    { name: 'Approvals', path: '/app/approvals', icon: 'fa-check-double', roles: ['sales_manager', 'admin', 'finance_manager', 'sales_rep'] },
    { name: 'Operations Hub', path: '/app/operations', icon: 'fa-boxes-packing', roles: ['operations', 'admin'] },
    { name: 'Finance Hub', path: '/app/finance', icon: 'fa-coins', roles: ['finance_manager', 'admin', 'sales_manager'] },
    { name: 'Admin Operations', path: '/app/admin', icon: 'fa-user-gear', roles: ['admin'] },
    { name: 'Reporting', path: '/app/reporting', icon: 'fa-chart-bar', roles: ['sales_manager', 'finance_manager', 'admin'] },
    { name: 'Global Tenants', path: '/app/superadmin', search: '?tab=tenants', icon: 'fa-globe', roles: ['super_admin'] },
    { name: 'Platform Settings', path: '/app/superadmin', search: '?tab=settings', icon: 'fa-gear', roles: ['super_admin'] },
    { name: 'Details of Users', path: '/app/superadmin', search: '?tab=users', icon: 'fa-users', roles: ['super_admin'] },
    { name: 'Currency Settings', path: '/app/currency', icon: 'fa-coins', roles: ['super_admin'] },
  ];

  return (
    <div className="flex h-screen bg-border-soft font-sans">
      {/* Main Sidebar */}
      <aside className="w-64 bg-white text-text-muted flex flex-col print:hidden shadow-lg border-r border-surface-soft">
        <div className="p-4 bg-white border-b border-surface-soft flex items-center space-x-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-on-primary shadow-md font-bold text-lg">
            DF
          </div>
          <div>
            <span className="font-bold text-text-main text-base tracking-wide block leading-tight">DealFlow360</span>
            <span className="text-[11px] text-text-muted font-mono">Sales Operations Engine</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.filter(item => user && item.roles.includes(user.role)).map(item => {
            const fullTarget = item.search ? `${item.path}${item.search}` : item.path;
            const isActive = item.search
              ? location.pathname === item.path && (location.search === item.search || (!location.search && item.search === '?tab=tenants'))
              : location.pathname.startsWith(item.path);

            return (
              <Link
                key={fullTarget}
                to={fullTarget}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-md font-semibold'
                    : 'text-text-muted hover:bg-surface-soft hover:text-text-main'
                }`}
              >
                <i className={`fa-solid ${item.icon} w-5 text-center text-base`}></i>
                <span className="text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-surface-soft bg-white/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-primary/80 border border-primary/30 flex items-center justify-center text-on-primary font-bold">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-main truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-text-muted truncate capitalize">{user?.role?.replace('_', ' ') || 'Internal'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-surface-soft rounded-lg text-xs font-semibold text-text-muted hover:bg-red-500/10 hover:text-rose-status hover:border-red-500/30 transition-all cursor-pointer"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className="flex-1 overflow-hidden bg-border-soft flex flex-col">

        {/* ── Sticky Top Header Bar with Currency Switcher ── */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm print:hidden flex items-center justify-between px-6 py-2.5 gap-4 shrink-0">
          {/* Left: breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:block">DealFlow360</span>
            <i className="fa-solid fa-chevron-right text-[9px] text-slate-300 hidden sm:block"></i>
            <span className="text-xs font-semibold text-slate-700 capitalize truncate">
              {location.pathname.replace('/app/', '').replace('/', ' › ') || 'Dashboard'}
            </span>
          </div>

          {/* Right: Currency picker + user info */}
          <div className="flex items-center gap-3 shrink-0">
            <CurrencyPicker />
            <div className="h-5 w-px bg-slate-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/80 flex items-center justify-center text-white text-xs font-extrabold shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-none">{user?.name || 'User'}</p>
                <p className="text-[10px] text-slate-400 capitalize leading-none mt-0.5">{user?.role?.replace('_', ' ') || 'Internal'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
