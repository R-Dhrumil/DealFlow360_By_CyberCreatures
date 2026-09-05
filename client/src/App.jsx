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
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  useEffect(() => {
    // Fetch and inject global settings on mount
    api.get('/settings/public')
      .then(res => {
        const settings = res.data;
        if (!settings) return;

        // Update document head
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
        if (settings.favicon_url) {
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
          }
          link.href = settings.favicon_url;
        }

        // Inject Google Analytics
        if (settings.google_analytics_id) {
          const gaScript = document.createElement('script');
          gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${settings.google_analytics_id}`;
          gaScript.async = true;
          document.head.appendChild(gaScript);

          const gaInit = document.createElement('script');
          gaInit.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${settings.google_analytics_id}');
          `;
          document.head.appendChild(gaInit);
        }

        // Inject Google Search Console
        if (settings.google_search_console_id) {
          const gscMeta = document.createElement('meta');
          gscMeta.name = 'google-site-verification';
          gscMeta.content = settings.google_search_console_id;
          document.head.appendChild(gscMeta);
        }

        // Inject Meta Pixel
        if (settings.meta_pixel_id) {
          const fbScript = document.createElement('script');
          fbScript.innerHTML = `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${settings.meta_pixel_id}');
            fbq('track', 'PageView');
          `;
          document.head.appendChild(fbScript);
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
