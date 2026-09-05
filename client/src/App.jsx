import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './api/client';
import LandingPage from './pages/LandingPage';
import Marketplace from './pages/Marketplace';
import Login from './pages/Login';
import Pipeline from './pages/Pipeline';
import QuotationBuilder from './pages/QuotationBuilder';
import QuotationView from './pages/QuotationView';
import ApprovalQueue from './pages/ApprovalQueue';
import FulfillmentSplit from './pages/FulfillmentSplit';
import CustomerPortal from './pages/CustomerPortal';
import DealHealthDashboard from './pages/DealHealthDashboard';
import Reporting from './pages/Reporting';
import SuperAdminConsole from './pages/SuperAdminConsole';
import SuperAdminSettings from './pages/SuperAdminSettings';
import AdminWorkspace from './pages/AdminWorkspace';
import FinanceOperations from './pages/FinanceOperations';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  useEffect(() => {
    // Fetch and inject global settings on mount
    api.get('/settings/public')
      .then(res => {
        const settings = res.data;
        if (!settings) return;

        if (settings.site_name) document.title = settings.site_name;
        if (settings.tagline) {
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.name = 'description';
            document.head.appendChild(metaDesc);
          }
          metaDesc.content = settings.tagline;
        }
      })
      .catch(err => console.error('Error fetching global settings:', err));
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/portal/:id" element={<CustomerPortal />} />
        <Route path="/login" element={<Login />} />
        <Route path="/customer/login" element={<Login />} />

        {/* Internal Protected Routes */}
        <Route path="/app" element={<ProtectedRoute allowedRoles={['sales_rep', 'sales_manager', 'finance', 'admin', 'super_admin']} />}>
          <Route element={<Layout />}>
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="dashboard" element={<DealHealthDashboard />} />
            <Route path="quote" element={<QuotationBuilder />} />
            <Route path="quote/:id" element={<QuotationView />} />
            <Route path="approvals" element={<ApprovalQueue />} />
            <Route path="fulfillment/:id" element={<FulfillmentSplit />} />
            <Route path="reporting" element={<Reporting />} />
            <Route path="superadmin" element={<SuperAdminConsole />} />
            <Route path="settings" element={<SuperAdminSettings />} />
            <Route path="admin" element={<AdminWorkspace />} />
            <Route path="finance" element={<FinanceOperations />} />
            {/* Redirect /app to pipeline by default */}
            <Route index element={<Navigate to="pipeline" replace />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
