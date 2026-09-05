import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

const DEMO_USERS = [
  { name: 'Alex Rep', email: 'rep@dealflow360.com', role: 'sales_rep', label: 'Sales Rep' },
  { name: 'Sarah Manager', email: 'manager@dealflow360.com', role: 'sales_manager', label: 'Sales Manager' },
  { name: 'David Finance', email: 'finance@dealflow360.com', role: 'finance', label: 'Finance' },
  { name: 'Elena Admin', email: 'admin@dealflow360.com', role: 'admin', label: 'Admin' },
  { name: 'Omar Operations', email: 'ops@dealflow360.com', role: 'operations', label: 'Operations' }
];

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
    { name: 'Pipeline', path: '/app/pipeline', icon: 'fa-diagram-project', roles: ['sales_rep', 'sales_manager', 'finance', 'admin'] },
    { name: 'Dashboard', path: '/app/dashboard', icon: 'fa-chart-pie', roles: ['sales_rep', 'sales_manager', 'admin'] },
    { name: 'Quotation Builder', path: '/app/quote', icon: 'fa-file-invoice-dollar', roles: ['sales_rep', 'sales_manager', 'admin'] },
    { name: 'Approvals', path: '/app/approvals', icon: 'fa-check-double', roles: ['sales_manager', 'admin', 'finance', 'sales_rep'] },
    { name: 'Operations Hub', path: '/app/operations', icon: 'fa-boxes-packing', roles: ['operations', 'admin'] },
    { name: 'Finance Hub', path: '/app/finance', icon: 'fa-coins', roles: ['finance', 'admin', 'sales_manager'] },
    { name: 'Admin Operations', path: '/app/admin', icon: 'fa-user-gear', roles: ['admin'] },
    { name: 'Reporting', path: '/app/reporting', icon: 'fa-chart-bar', roles: ['sales_manager', 'admin'] },
    { name: 'Global Tenants', path: '/app/superadmin', search: '?tab=tenants', icon: 'fa-globe', roles: ['super_admin'] },
    { name: 'Platform Settings', path: '/app/superadmin', search: '?tab=settings', icon: 'fa-gear', roles: ['super_admin'] },
    { name: 'Details of Users', path: '/app/superadmin', search: '?tab=users', icon: 'fa-users', roles: ['super_admin'] },
  ];


  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Main Sidebar */}
      <aside className="w-64 bg-white text-text-muted flex flex-col print:hidden shadow-lg border-r border-surface-soft">
        <div className="p-4 bg-white border-b border-surface-soft flex items-center space-x-3">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-text-main shadow-md font-bold text-lg">
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
                    ? 'bg-purple-600 text-white shadow-md font-semibold' 
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
            <div className="w-9 h-9 rounded-full bg-primary-900/80 border border-primary-500/30 flex items-center justify-center text-primary-300 font-bold">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-text-main truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-text-muted truncate capitalize">{user?.role?.replace('_', ' ') || 'Internal'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-surface-soft rounded-lg text-xs font-semibold text-text-muted hover:bg-red-500/10 hover:text-rose-status hover:border-red-500/30 transition-all"
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
  );
}
