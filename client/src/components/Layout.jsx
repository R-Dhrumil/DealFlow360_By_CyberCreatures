import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/client';
import { useNotification } from '../contexts/NotificationContext';
import { formatQuoteCode } from '../utils/formatters';

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
  const { showNotification } = useNotification();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const knownApprovalsRef = useRef(null);

  // Background real-time listener for incoming approvals
  useEffect(() => {
    if (!user) return;
    const canViewApprovals = ['sales_manager', 'admin', 'super_admin', 'finance', 'sales_rep'].includes(user.role);
    if (!canViewApprovals) return;

    const checkNewApprovals = async () => {
      try {
        const res = await api.get('/approvals/pending');
        if (res.data && Array.isArray(res.data)) {
          const currentSet = new Set(res.data.map(item => item.id));
          
          if (knownApprovalsRef.current !== null) {
            const newRequests = res.data.filter(item => !knownApprovalsRef.current.has(item.id));
            newRequests.forEach(req => {
              showNotification(
                'warning',
                `🔔 New Approval Request: Quote ${formatQuoteCode(req.id)} (${req.customer_name || 'Customer'}) requires management review!`,
                6000
              );
            });
          }
          knownApprovalsRef.current = currentSet;
        }
      } catch (err) {
        // silent fail during polling
      }
    };

    checkNewApprovals();
    const interval = setInterval(checkNewApprovals, 3500);
    return () => clearInterval(interval);
  }, [user?.role, showNotification]);

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
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-surface-soft rounded-lg text-xs font-semibold text-text-muted hover:bg-red-500/10 hover:text-rose-status hover:border-red-500/30 transition-all"
          >
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className="flex-1 overflow-auto bg-border-soft flex flex-col">

        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-surface-soft shadow-sm print:hidden">
          <div className="flex items-center justify-between px-6 py-3">

            {/* Left: current page breadcrumb feel */}
            <div className="flex items-center space-x-2 text-text-muted text-xs font-medium">
              <i className="fa-solid fa-building text-primary"></i>
              <span className="text-text-main font-semibold">{user?.companyName || 'DealFlow360'}</span>
              <i className="fa-solid fa-chevron-right text-[10px]"></i>
              <span className="capitalize">{user?.role?.replace(/_/g, ' ') || 'Internal'}</span>
            </div>

            {/* Right: Personal Profile button */}
            <div className="flex items-center space-x-3">
              {/* Notification bell */}
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-text-muted hover:bg-surface-soft hover:text-text-main transition-all relative" title="Notifications">
                <i className="fa-regular fa-bell text-base"></i>
              </button>

              {/* Personal Profile pill */}
              <button
                className="flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-semibold text-sm px-4 py-2 rounded-full shadow-md transition-all cursor-pointer"
                title={`Logged in as ${user?.name || 'User'}`}
              >
                <i className="fa-solid fa-address-card text-base"></i>
                <span>Personal Profile</span>
              </button>

              {/* Avatar with role */}
              <div className="flex items-center space-x-2 pl-3 border-l border-surface-soft">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm shadow">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-text-main leading-tight">{user?.name || 'User'}</p>
                  <p className="text-[10px] text-text-muted capitalize">{user?.role?.replace(/_/g, ' ')}</p>
                </div>
              </div>
            </div>

          </div>
        </header>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
