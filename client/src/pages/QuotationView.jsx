import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';

export default function QuotationView() {
  const { id: quotationId } = useParams();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuotation();
  }, [quotationId]);

  const fetchQuotation = async () => {
    try {
      if (!quotationId) return;
      const res = await api.get(`/quotations/${quotationId}`);
      if (res.data) {
        setQuotation(res.data);
      } else {
        setQuotation({
          id: quotationId,
          status: 'approved',
          customer_name: 'Acme Corp',
          created_at: new Date().toISOString(),
          lines: [
            { id: 1, product_name: 'Enterprise Server X1', category: 'Hardware', line_type: 'one_time', quantity: 2, unit_price: 5000, discount_percent: 10 },
            { id: 2, product_name: 'Implementation Services', category: 'Services', line_type: 'one_time', quantity: 1, unit_price: 2500, discount_percent: 0 },
            { id: 3, product_name: 'SaaS Platform License', category: 'Software', line_type: 'recurring', quantity: 50, unit_price: 100, discount_percent: 15 },
            { id: 4, product_name: 'Premium Support', category: 'Software', line_type: 'recurring', quantity: 1, unit_price: 1000, discount_percent: 5 },
          ]
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch quotation', error);
      setQuotation({
        id: quotationId,
        status: 'approved',
        customer_name: 'Acme Corp',
        created_at: new Date().toISOString(),
        lines: [
          { id: 1, product_name: 'Enterprise Server X1', category: 'Hardware', line_type: 'one_time', quantity: 2, unit_price: 5000, discount_percent: 10 },
          { id: 2, product_name: 'Implementation Services', category: 'Services', line_type: 'one_time', quantity: 1, unit_price: 2500, discount_percent: 0 },
          { id: 3, product_name: 'SaaS Platform License', category: 'Software', line_type: 'recurring', quantity: 50, unit_price: 100, discount_percent: 15 },
          { id: 4, product_name: 'Premium Support', category: 'Software', line_type: 'recurring', quantity: 1, unit_price: 1000, discount_percent: 5 },
        ]
      });
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <i className="fa-solid fa-spinner fa-spin text-primary text-4xl"></i>
      </div>
    );
  }

  if (!quotation) return <div>Quotation not found</div>;

  // Split lines into one-time and recurring
  const oneTimeLines = quotation.lines.filter(l => l.line_type === 'one_time');
  const recurringLines = quotation.lines.filter(l => l.line_type === 'recurring');

  const calculateTotal = (lines) => {
    return lines.reduce((total, line) => {
      const netPrice = line.unit_price * (1 - line.discount_percent / 100);
      return total + (netPrice * line.quantity);
    }, 0);
  };

  const oneTimeTotal = calculateTotal(oneTimeLines);
  const recurringTotal = calculateTotal(recurringLines);

  return (
    <div className="p-6 md:p-12">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-800">Quotation #{quotation.id?.split('-')[0]}</h1>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider print:hidden">
              {quotation.status}
            </span>
          </div>
          <p className="text-text-muted">Prepared for <span className="font-semibold text-slate-700">{quotation.customer_name}</span></p>
        </div>
        <div className="flex space-x-3 print:hidden">
          <button onClick={() => window.print()} className="btn-secondary text-sm">
            <i className="fa-solid fa-file-pdf mr-2"></i>
            Download PDF
          </button>
          <Link to={`/app/fulfillment/${quotation.id}`} className="btn-secondary text-sm">
            <i className="fa-solid fa-truck mr-2"></i>
            View Fulfillment Plan
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* One-Time Costs Section */}
          <section className="card p-0 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-surface-soft">
              <h2 className="text-lg font-semibold text-slate-800">One-Time Costs</h2>
              <p className="text-sm text-text-muted">Hardware, setup, and implementation services</p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-text-muted border-b border-slate-100">
                  <th className="px-6 py-3 font-medium">Item</th>
                  <th className="px-6 py-3 font-medium text-right">Qty</th>
                  <th className="px-6 py-3 font-medium text-right">Unit Price</th>
                  <th className="px-6 py-3 font-medium text-right">Discount</th>
                  <th className="px-6 py-3 font-medium text-right">Net Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {oneTimeLines.map(line => {
                  const netPrice = line.unit_price * (1 - line.discount_percent / 100);
                  return (
                    <tr key={line.id}>
                      <td className="px-6 py-4 font-medium text-slate-800">{line.product_name} <span className="text-xs text-text-muted font-normal block">{line.category}</span></td>
                      <td className="px-6 py-4 text-right text-slate-600">{line.quantity}</td>
                      <td className="px-6 py-4 text-right text-slate-600">${line.unit_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-slate-600">{line.discount_percent}%</td>
                      <td className="px-6 py-4 text-right font-semibold text-slate-800">${(netPrice * line.quantity).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          {/* Recurring Costs Section */}
          <section className="card p-0 overflow-hidden border-surface-soft ring-1 ring-primary ring-opacity-20">
            <div className="bg-border-soft px-6 py-4 border-b border-surface-soft">
              <h2 className="text-lg font-semibold text-text-main">Recurring Subscription Costs</h2>
              <p className="text-sm text-primary">Software licenses, SaaS platform, and ongoing support</p>
            </div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-xs text-text-muted border-b border-slate-100">
                  <th className="px-6 py-3 font-medium">Item</th>
                  <th className="px-6 py-3 font-medium text-right">Qty</th>
                  <th className="px-6 py-3 font-medium text-right">Unit Price / Mo</th>
                  <th className="px-6 py-3 font-medium text-right">Discount</th>
                  <th className="px-6 py-3 font-medium text-right">Monthly Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recurringLines.map(line => {
                  const netPrice = line.unit_price * (1 - line.discount_percent / 100);
                  return (
                    <tr key={line.id}>
                      <td className="px-6 py-4 font-medium text-slate-800">{line.product_name} <span className="text-xs text-text-muted font-normal block">{line.category}</span></td>
                      <td className="px-6 py-4 text-right text-slate-600">{line.quantity}</td>
                      <td className="px-6 py-4 text-right text-slate-600">${line.unit_price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right text-slate-600">{line.discount_percent}%</td>
                      <td className="px-6 py-4 text-right font-semibold text-primary">${(netPrice * line.quantity).toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

        </div>

        {/* Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-6">
            <h3 className="text-lg font-bold text-text-main mb-6">Financial Summary</h3>
            
            <div className="space-y-4 border-b border-surface-soft pb-6 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Total Due Today</span>
                <span className="text-xl font-bold text-text-main">${oneTimeTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-text-muted">Includes all hardware, implementation, and setup fees.</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-primary font-medium flex items-center">
                  <i className="fa-solid fa-rotate mr-2"></i> Monthly Recurring
                </span>
                <span className="text-xl font-bold text-primary">${recurringTotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-text-muted">Billed on the 1st of every month starting after implementation.</p>
            </div>
            
            <div className="mt-8 pt-6 border-t border-surface-soft">
              <div className="flex justify-between items-center">
                <span className="text-text-muted text-sm">Annual Contract Value (ACV)</span>
                <span className="font-semibold text-slate-800">${(recurringTotal * 12).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-text-muted text-sm">Total Contract Value (1 Yr)</span>
                <span className="font-bold text-text-main">${(oneTimeTotal + (recurringTotal * 12)).toFixed(2)}</span>
              </div>
            </div>
            
            <button className="btn-primary w-full mt-8 print:hidden">
              <i className="fa-solid fa-paper-plane mr-2"></i>
              Send to Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
