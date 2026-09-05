import React from 'react';
import { Link } from 'react-router-dom';

const UniversalDashboard = () => {
  return (
    <div className="flex flex-col w-full px-8 py-8 bg-[#f5e8ff] font-body text-[#4b4356]">
      {/* Executive Action & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#702963] px-2.5 py-0.5 rounded-md bg-white border border-[#e2d0f5] shadow-xs">Executive Cockpit</span>
            <span className="text-[#e2d0f5] text-sm">|</span>
            <span className="text-xs font-medium text-[#6b6278]">Active CPQ Engine: v4.8 Global</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#110d1a] tracking-tight">Revenue Operations Command</h1>
        </div>
        
        {/* Quick Action Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white text-[#110d1a] border border-[#e2d0f5] hover:bg-[#faf2ff] transition-all shadow-sm font-semibold text-xs" type="button">
            <span className="material-symbols-outlined text-[#702963] text-base">public</span>
            <span>Global • Enterprise Tier-1</span>
            <span className="material-symbols-outlined text-[#6b6278] text-base">tune</span>
          </button>
          
          <Link to="/app/approvals" className="relative group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#ea580c] border border-[#fed7aa] hover:bg-[#ffedd5] transition-all shadow-sm font-semibold text-xs">
            <span className="material-symbols-outlined text-base">verified</span>
            <span>Review Approvals</span>
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#ea580c] text-white text-[11px] font-bold">4</span>
          </Link>
          
          <Link to="/app/quote" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#702963] text-white font-semibold text-xs shadow-sm hover:bg-[#5a1f4f] transition-all active:scale-[0.99]">
            <span className="material-symbols-outlined text-base">add_circle</span>
            <span>New Quotation</span>
          </Link>
        </div>
      </div>

      {/* 4 Top Metric Cockpit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 pb-7">
        {/* Metric 1: Pending Approvals */}
        <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-[#e2d0f5] shadow-sm hover:shadow-md transition-all group overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#dc2626]"></div>
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6278]">Gatekeeper Queue</span>
              <span className="font-bold text-sm text-[#110d1a] pt-0.5">Pending Approvals</span>
            </div>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#fee2e2] text-[#dc2626] border border-[#fecaca] text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626]"></span> Critical 4
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#dc2626]">4</span>
              <span className="text-xs text-[#6b6278] font-medium">deals stalled &gt; 24h</span>
            </div>
            <span className="font-mono text-sm font-bold text-[#110d1a]">$1.28M Total</span>
          </div>
          <div className="pt-3 mt-4 border-t border-[#eddffb] flex items-center justify-between">
            <span className="text-xs text-[#6b6278]">2 require Legal, 2 RevOps</span>
            <Link to="/app/approvals" className="text-xs font-semibold text-[#dc2626] hover:underline flex items-center gap-0.5">
              Resolve <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Metric 2: Open Quotations */}
        <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-[#e2d0f5] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6278]">Deal Desk Active</span>
              <span className="font-bold text-sm text-[#110d1a] pt-0.5">Open Quotations</span>
            </div>
            <span className="p-2 rounded-xl bg-[#ffedd5] text-[#ea580c] border border-[#fed7aa]">
              <span className="material-symbols-outlined text-lg">stacked_bar_chart</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#110d1a]">$412K</span>
              <span className="text-xs text-[#ea580c] font-bold">12 active</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-3.5 rounded bg-[#ea580c]"></span>
              <span className="w-1.5 h-5 rounded bg-[#ea580c]"></span>
              <span className="w-1.5 h-6 rounded bg-[#ea580c]"></span>
              <span className="w-1.5 h-2 rounded bg-[#e2d0f5]"></span>
              <span className="text-xs font-semibold text-[#6b6278] ml-1">74% Win Rate</span>
            </div>
          </div>
          <div className="pt-3 mt-4 border-t border-[#eddffb] flex items-center justify-between">
            <span className="text-xs text-[#6b6278]">Median turnaround: 18h</span>
            <span className="font-mono text-xs font-semibold text-[#110d1a]">+3 new today</span>
          </div>
        </div>

        {/* Metric 3: At-Risk Deals */}
        <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-[#e2d0f5] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6278]">AI Deal Sentry</span>
              <span className="font-bold text-sm text-[#110d1a] pt-0.5">At-Risk Deals</span>
            </div>
            <span className="p-2 rounded-xl bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]">
              <span className="material-symbols-outlined text-lg">warning_amber</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#dc2626]">3</span>
              <span className="text-xs text-[#6b6278] font-medium">anomalies tagged</span>
            </div>
            <span className="font-mono text-sm font-bold text-[#dc2626]">$680K value</span>
          </div>
          <div className="pt-3 mt-4 border-t border-[#eddffb] flex items-center justify-between">
            <span className="text-xs font-medium text-[#dc2626]">7+ days idle &amp; high discounts</span>
            <span className="material-symbols-outlined text-[#6b6278] text-sm group-hover:translate-x-0.5 transition-transform">chevron_right</span>
          </div>
        </div>

        {/* Metric 4: Revenue Recognized */}
        <div className="relative flex flex-col justify-between p-5 rounded-2xl bg-white border border-[#e2d0f5] shadow-sm hover:shadow-md transition-all group">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6278]">Financial Performance</span>
              <span className="font-bold text-sm text-[#110d1a] pt-0.5">Revenue Recognized</span>
            </div>
            <span className="p-2 rounded-xl bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0]">
              <span className="material-symbols-outlined text-lg">payments</span>
            </span>
          </div>
          <div className="flex items-baseline justify-between pt-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-[#110d1a]">$1.84M</span>
              <span className="text-xs font-bold text-[#16a34a] bg-[#dcfce7] px-2 py-0.5 rounded border border-[#bbf7d0]">+14.2%</span>
            </div>
            <span className="text-xs text-[#6b6278]">Target $1.6M</span>
          </div>
          <div className="pt-3 mt-4 border-t border-[#eddffb] flex flex-col gap-1.5">
            <div className="w-full bg-[#faf2ff] h-2 rounded-full overflow-hidden border border-[#eddffb]">
              <div className="bg-[#16a34a] h-full rounded-full" style={{ width: '86.2%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-[#6b6278]">
              <span>MTD Quota Pace</span>
              <span className="text-[#16a34a] font-mono font-bold">86.2%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stage Split-Plane Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-7">
        {/* Left / Center Stage: Active Deal Pipeline Board (8 cols) */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl bg-white border border-[#e2d0f5] shadow-sm overflow-hidden">
          {/* Table Header & Quick Stage Filter Pills */}
          <div className="p-5 bg-[#faf2ff] border-b border-[#e2d0f5] flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-white border border-[#e2d0f5] text-[#702963] shadow-xs">
                  <span className="material-symbols-outlined text-xl">account_tree</span>
                </span>
                <div>
                  <h2 className="text-base font-bold text-[#110d1a]">Active Deal Pipeline</h2>
                  <span className="text-xs text-[#6b6278]">Configured products, multi-tier pricing, and signature status</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input className="pl-8 pr-3 py-1.5 rounded-xl bg-white border border-[#e2d0f5] text-[#110d1a] text-xs placeholder:text-[#968c9f] focus:outline-none focus:ring-2 focus:ring-[#702963]/20" placeholder="Filter pipeline..." type="text"/>
                  <span className="material-symbols-outlined absolute left-2.5 top-2 text-[#968c9f] text-sm">search</span>
                </div>
                <button className="p-1.5 rounded-xl bg-white border border-[#e2d0f5] text-[#6b6278] hover:text-[#110d1a] hover:bg-[#faf2ff] transition-colors shadow-xs" title="Export CSV" type="button">
                  <span className="material-symbols-outlined text-base">download</span>
                </button>
              </div>
            </div>
            
            {/* Quick Stage Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button className="stage-pill active px-3.5 py-1.5 rounded-full bg-[#702963] text-white font-semibold text-xs flex items-center gap-2 whitespace-nowrap shadow-sm">
                <span>All Stages</span>
                <span className="w-4 h-4 rounded-full bg-white text-[#702963] text-[10px] flex items-center justify-center font-bold">12</span>
              </button>
              <button className="stage-pill px-3.5 py-1.5 rounded-full bg-white text-[#6b6278] border border-[#e2d0f5] hover:bg-[#faf2ff] hover:text-[#110d1a] font-medium text-xs flex items-center gap-2 whitespace-nowrap transition-colors">
                <span>Draft</span>
                <span className="text-[11px] text-[#968c9f] font-semibold">2</span>
              </button>
              <button className="stage-pill px-3.5 py-1.5 rounded-full bg-white text-[#6b6278] border border-[#e2d0f5] hover:bg-[#faf2ff] hover:text-[#110d1a] font-medium text-xs flex items-center gap-2 whitespace-nowrap transition-colors">
                <span>Approval Gate</span>
                <span className="text-[11px] text-[#ea580c] font-bold">4</span>
              </button>
            </div>
          </div>
          
          {/* High Density Deal Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#faf2ff]/60 border-b border-[#e2d0f5] text-[11px] font-bold uppercase tracking-wider text-[#6b6278]">
                  <th className="py-3 px-5 font-semibold">Account &amp; Deal</th>
                  <th className="py-3 px-4 font-semibold">SKU / Bundle</th>
                  <th className="py-3 px-4 font-semibold">Stage</th>
                  <th className="py-3 px-4 font-semibold text-right">ACV Value</th>
                  <th className="py-3 px-5 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eddffb] text-xs">
                {/* Deal 1: Urgent Approval Pending */}
                <tr className="hover:bg-[#faf2ff]/40 transition-colors group">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <img className="w-8 h-8 rounded-lg object-cover bg-[#faf2ff] border border-[#e2d0f5] flex-shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7d4_smoIo8ZhHw2Nd0i16sQYG7qHCyu4G5d8JlW3uTd4cejRLEIKubHMRz2ygFFmI6p4omkIbCpU6hh6atcsFvMuawu1T7cT1aCAq8vE6O01lXKoobz7IJHZt4xYafmy_9edaxADNdnEUdBZ6pKaXTL9_yI0uZUuYZaE3ffkE4QmBFXomqN-qR3xRhTwWabYz7jhweZJKZmpPA0U_9AVX2xLk_kV5CWf9SFHJKt3OGjU1NHdo8XtYVg" alt="Logo" />
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-[#110d1a] truncate group-hover:text-[#702963] transition-colors">Delta Systems LLC</span>
                        <span className="text-[11px] text-[#6b6278] font-mono">QT-9042 • Rep: M. Shah</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#110d1a] text-xs">Tier-1 Core Cluster</span>
                      <span className="text-[11px] text-[#6b6278]">320 Nodes + SLA</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffedd5] text-[#ea580c] border border-[#fed7aa] text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span> VP RevOps Pending
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-xs text-[#110d1a]">$184,200</span>
                      <span className="text-[11px] font-bold text-[#dc2626] bg-[#fee2e2] px-1 rounded">22% Disc</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Link to="/app/approvals" className="px-2.5 py-1.5 rounded-lg bg-[#702963] text-white text-[11px] font-semibold hover:bg-[#5a1f4f] transition-colors inline-flex items-center gap-1 shadow-xs">
                      <span>Approve</span>
                      <span className="material-symbols-outlined text-xs">check</span>
                    </Link>
                  </td>
                </tr>
                {/* Deal 2: Sent Stage */}
                <tr className="hover:bg-[#faf2ff]/40 transition-colors group">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <img className="w-8 h-8 rounded-lg object-cover bg-[#faf2ff] border border-[#e2d0f5] flex-shrink-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDvJgJPwqA-j6MW7dCI2Fm76My9RV7iacVOzkh--D0ZLXgiXB_V_cdDBF3RM38Z9ZmmZpRNrowckb20vZABS7le1NynvY9sm1kuKPuaVtHHeWIks6u6G8J2RVGUbw2KJ2gcgpuA2UnR-kNnDp5AjLLOt2djHrgiSieegVD6s6JC7g0-YHTj1yF9j9zIVo3OegSf0OoC9s2NR0yniat47yO-PkEXxdTXst6RWYp9rFeNBLbN0ljlnp_5NQ" alt="Logo"/>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs text-[#110d1a] truncate group-hover:text-[#702963] transition-colors">Hyperion Logistics</span>
                        <span className="text-[11px] text-[#6b6278] font-mono">QT-9041 • Rep: J. Rao</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-[#110d1a] text-xs">Multi-Cloud Edge Gateway</span>
                      <span className="text-[11px] text-[#6b6278]">120 Edge Units</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffedd5] text-[#ea580c] border border-[#fed7aa] text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c]"></span> Sent • Viewed
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-mono font-bold text-xs text-[#110d1a]">$96,400</span>
                      <span className="text-[11px] text-[#6b6278]">6% Disc</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <Link to="/app/quote" className="p-1.5 rounded-lg bg-[#faf2ff] border border-[#e2d0f5] text-[#6b6278] hover:text-[#110d1a] hover:bg-white transition-colors inline-flex shadow-xs">
                      <span className="material-symbols-outlined text-sm">visibility</span>
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-[#faf2ff] border-t border-[#e2d0f5] flex items-center justify-between text-xs text-[#6b6278]">
            <div className="flex items-center gap-2 font-medium">
              <span>Showing 2 of 12 active deals</span>
              <span>•</span>
              <span className="text-[#702963] font-bold">Total ACV: $831,100</span>
            </div>
            <Link to="/app/pipeline" className="text-[#702963] font-bold hover:underline flex items-center gap-1 transition-colors">
              View Complete Deal Desk <span className="material-symbols-outlined text-xs">chevron_right</span>
            </Link>
          </div>
        </div>
        
        {/* Right Stage: Deal Health & Risk Feed (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <div className="flex flex-col p-5 rounded-2xl bg-white border border-[#e2d0f5] shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#eddffb]">
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-[#fee2e2] text-[#dc2626] border border-[#fecaca]">
                  <span className="material-symbols-outlined text-lg">crisis_alert</span>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#dc2626] ring-2 ring-white"></span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#110d1a]">Deal Health &amp; Risk Feed</h3>
                  <span className="text-[11px] text-[#6b6278]">Real-time CPQ Guardrail Telemetry</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 pt-3.5">
              <div className="p-3.5 rounded-xl bg-[#faf2ff] border border-[#e2d0f5] flex flex-col gap-2 shadow-2xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#dc2626] flex-shrink-0"></span>
                    <span className="font-bold text-xs text-[#110d1a]">Delta Systems LLC</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#fee2e2] text-[#dc2626] border border-[#fecaca] uppercase">Margin Risk</span>
                </div>
                <p className="text-xs text-[#4b4356] leading-relaxed">
                  Quote line includes <strong className="text-[#dc2626] font-bold">22% discount</strong> vs <strong className="text-[#110d1a] font-bold">8% peer avg</strong> in Tier-1 cluster.
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-5 rounded-2xl bg-white border border-[#e2d0f5] shadow-sm flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#6b6278]">Pipeline Velocity</span>
              <span className="font-bold text-sm text-[#110d1a] pt-0.5">Q3 CPQ Velocity</span>
              <span className="text-xs font-bold text-[#16a34a] pt-0.5">14.8 Days Cycle Time</span>
              <span className="text-[11px] text-[#6b6278] pt-1">-2.4d faster than Q2 benchmark</span>
            </div>
            <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-[#faf2ff] stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3.5"></path>
                <path className="text-[#16a34a] stroke-current" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="82, 100" strokeLinecap="round" strokeWidth="3.5"></path>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="font-extrabold text-sm text-[#110d1a]">82%</span>
                <span className="font-bold text-[#6b6278] text-[8px] tracking-wide uppercase">HEALTH</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalDashboard;
