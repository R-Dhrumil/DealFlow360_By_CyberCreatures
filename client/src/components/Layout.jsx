import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

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
    { name: 'Finance Hub', path: '/app/finance', icon: 'fa-coins', roles: ['finance', 'admin', 'sales_manager'] },
    { name: 'Admin Operations', path: '/app/admin', icon: 'fa-user-gear', roles: ['admin'] },
    { name: 'Reporting', path: '/app/reporting', icon: 'fa-chart-bar', roles: ['sales_manager', 'admin'] },
    { name: 'Super Admin Console', path: '/app/superadmin', icon: 'fa-crown', roles: ['super_admin'] },
  ];


  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Main Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col print:hidden shadow-lg border-r border-slate-800">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center text-white shadow-md font-bold text-lg">
            DF
          </div>
          <div>
            <span className="font-bold text-white text-base tracking-wide block leading-tight">DealFlow360</span>
            <span className="text-[11px] text-slate-400 font-mono">Sales Operations Engine</span>
          </div>
        </div>
        
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navItems.filter(item => user && item.roles.includes(user.role)).map(item => {
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
              <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.replace('_', ' ') || 'Internal'}</p>
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
  );
}
