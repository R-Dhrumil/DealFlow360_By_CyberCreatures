import React, { useState } from 'react';
import { useCurrency } from '../contexts/CurrencyContext';

export default function Reporting() {
  const { formatMoney } = useCurrency();
  const [reports] = useState([
    { id: 1, repName: 'Alice Smith', dealsWon: 12, totalRevenue: 154000, avgMargin: 24.5 },
    { id: 2, repName: 'Bob Jones', dealsWon: 8, totalRevenue: 98500, avgMargin: 22.1 },
    { id: 3, repName: 'Charlie Davis', dealsWon: 15, totalRevenue: 210000, avgMargin: 19.8 },
  ]);

  return (
    <div className="p-6 md:p-12">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-text-main">Sales Reporting</h1>
        <p className="text-text-muted">Performance by sales representative.</p>
      </header>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-text-muted text-xs uppercase tracking-wider border-b border-surface-soft">
                <th className="px-6 py-4 font-medium">Sales Rep</th>
                <th className="px-6 py-4 font-medium text-right">Deals Won</th>
                <th className="px-6 py-4 font-medium text-right">Total Revenue</th>
                <th className="px-6 py-4 font-medium text-right">Avg Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-soft">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-medium text-text-main">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold mr-3 border border-primary/20">
                        {report.repName.charAt(0)}
                      </div>
                      {report.repName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-muted text-right">{report.dealsWon}</td>
                  <td className="px-6 py-4 text-text-main font-bold text-right">{formatMoney(report.totalRevenue)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${report.avgMargin > 20 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                      {report.avgMargin}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
