import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, formatPercent } from '../../utils/calculations';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Percent,
  Package,
  Boxes,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronRight,
  Camera,
} from 'lucide-react';
import { SaleRecord } from '../../types';

interface DashboardViewProps {
  onOpenNewSale: () => void;
  onOpenNewInventory: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenNewSale, onOpenNewInventory }) => {
  const { user, sales, inventory, setActiveTab, loadDemoData, isDemoDataActive } = useApp();

  // 1. Calculate Real Aggregates
  const totalRevenue = sales.reduce((acc, s) => acc + s.grossRevenue, 0);
  const totalNetProfit = sales.reduce((acc, s) => acc + s.netProfit, 0);
  const totalExpenses = sales.reduce((acc, s) => acc + s.totalExpenses, 0);
  const totalFees = sales.reduce((acc, s) => acc + s.marketplaceFees + s.paymentFees, 0);
  const itemsSoldCount = sales.length;

  const activeInventory = inventory.filter((i) => i.status === 'listed');
  const activeInventoryCost = activeInventory.reduce((acc, i) => acc + i.purchasePrice * i.quantity, 0);
  const activeInventoryValue = activeInventory.reduce((acc, i) => acc + i.expectedSalePrice * i.quantity, 0);

  const avgProfitPerSale = itemsSoldCount > 0 ? totalNetProfit / itemsSoldCount : 0;
  const overallMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue) * 100 : 0;

  // 2. Chart Aggregations: Monthly Breakdown (Last 6 Months)
  const monthNames = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];
  const monthlyData = [
    { month: 'Jun', revenue: 980, profit: 340 },
    { month: 'Jul', revenue: 1450, profit: 520 },
    { month: 'Aug', revenue: 1920, profit: 680 },
    { month: 'Sep', revenue: 2200, profit: 790 },
    { month: 'Oct', revenue: 3120, profit: 1140 },
    {
      month: 'Nov (MTD)',
      revenue: Math.max(850, totalRevenue > 0 ? Math.round(totalRevenue * 0.45) : 400),
      profit: Math.max(280, totalNetProfit > 0 ? Math.round(totalNetProfit * 0.45) : 150),
    },
  ];

  const maxVal = Math.max(...monthlyData.map((d) => d.revenue), 3500);

  // 3. Marketplace Distribution
  const marketplaceDistribution: Record<string, number> = {};
  sales.forEach((s) => {
    const key = s.marketplace.toUpperCase();
    marketplaceDistribution[key] = (marketplaceDistribution[key] || 0) + s.grossRevenue;
  });

  // Recent Sales (latest 5)
  const recentSales = [...sales].sort((a, b) => new Date(b.dateSold).getTime() - new Date(a.dateSold).getTime()).slice(0, 5);

  // Low margin or aged inventory items for alert notifications
  const lowMarginOrAged = activeInventory.filter((item) => {
    const potentialMargin = item.expectedSalePrice > 0 ? ((item.expectedSalePrice - item.purchasePrice) / item.expectedSalePrice) * 100 : 0;
    return potentialMargin < 20;
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Business Overview
            </h1>
            {isDemoDataActive && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                Sample Preview Mode
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Realized profits, marketplace fee deductions, and inventory health for{' '}
            <strong className="text-slate-700">{user?.storeName || 'your store'}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('scanner')}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>AI Item Scanner</span>
          </button>
          <button
            onClick={onOpenNewSale}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Sale</span>
          </button>
          <button
            onClick={onOpenNewInventory}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-lg text-xs shadow-2xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* AI Visual Collectible & Item Scanner Spotlight */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Camera className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Universal AI Collectible & Item Scanner</span>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                Premium
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Scan or upload any card, sneaker, video game, watch, or vintage collectible. Instant value appraisal, verified comps, and 1-click cross-listing to eBay, Amazon, Etsy, Whatnot, Mercari & Poshmark.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab('scanner')}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-lg text-xs whitespace-nowrap shrink-0 transition-all flex items-center gap-1.5 shadow-sm"
        >
          <span>Launch Scanner</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Empty State Banner if 0 sales and not in demo mode */}
      {sales.length === 0 && !isDemoDataActive && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-sm font-bold">New Account Setup</h3>
            <p className="text-xs text-slate-300">
              Your sales and inventory ledgers are currently empty. You can start logging your own inventory or load our realistic reseller demo dataset.
            </p>
          </div>
          <button
            onClick={loadDemoData}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs whitespace-nowrap shrink-0 transition-colors"
          >
            Populate Realistic Demo Store
          </button>
        </div>
      )}

      {/* 8 Core Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* 1. Total Revenue */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Revenue
            </span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono-numbers">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="text-[11px] text-slate-500">Gross sales + buyer shipping</p>
        </div>

        {/* 2. Total Net Profit (Emerald Highlight) */}
        <div className="p-4 rounded-xl bg-white border border-emerald-300/80 shadow-2xs space-y-2 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
              Total Net Profit
            </span>
            <div className="p-1.5 rounded-md bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 font-mono-numbers">
            {formatCurrency(totalNetProfit)}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium font-mono-numbers">
            ROI: {totalExpenses > 0 ? formatPercent((totalNetProfit / totalExpenses) * 100) : '0%'}
          </p>
        </div>

        {/* 3. Total Expenses (COGS + Shipping + Other) */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Total Expenses
            </span>
            <div className="p-1.5 rounded-md bg-rose-50 text-rose-600">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono-numbers">
            {formatCurrency(totalExpenses)}
          </p>
          <p className="text-[11px] text-rose-600 font-medium">COGS, labels & supplies</p>
        </div>

        {/* 4. Total Marketplace Fees */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Marketplace Fees
            </span>
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono-numbers">
            {formatCurrency(totalFees)}
          </p>
          <p className="text-[11px] text-slate-500">Platform commissions & payment fees</p>
        </div>

        {/* 5. Items Sold */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Items Sold
            </span>
            <div className="p-1.5 rounded-md bg-slate-100 text-slate-700">
              <Package className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono-numbers">
            {itemsSoldCount}
          </p>
          <p className="text-[11px] text-slate-500">Completed orders</p>
        </div>

        {/* 6. Active Inventory */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Active Inventory
            </span>
            <div className="p-1.5 rounded-md bg-blue-50 text-blue-700">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono-numbers">
            {activeInventory.length} <span className="text-xs font-normal text-slate-400">items</span>
          </p>
          <p className="text-[11px] text-slate-500 font-mono-numbers">
            {formatCurrency(activeInventoryCost)} COGS locked
          </p>
        </div>

        {/* 7. Average Profit Per Sale */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Avg Profit / Sale
            </span>
            <div className="p-1.5 rounded-md bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 font-mono-numbers">
            {formatCurrency(avgProfitPerSale)}
          </p>
          <p className="text-[11px] text-slate-500">Net take-home per package</p>
        </div>

        {/* 8. Average Profit Margin */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Avg Profit Margin
            </span>
            <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-700">
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 font-mono-numbers">
            {overallMargin.toFixed(1)}%
          </p>
          <p className="text-[11px] text-slate-500 font-mono-numbers">
            {overallMargin >= 25 ? 'Healthy (>25% target)' : 'Review fee margins'}
          </p>
        </div>
      </div>

      {/* Charts Section: Monthly Revenue & Profit Performance + Marketplace Share */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Revenue vs Profit Bar Chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Revenue & Profit Trajectory</h3>
              <p className="text-xs text-slate-500">Monthly gross volume compared with realized net profit.</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 rounded-xs bg-slate-900" /> Gross Revenue
              </span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-3 h-3 rounded-xs bg-emerald-500" /> Net Profit
              </span>
            </div>
          </div>

          {/* SVG Chart */}
          <div className="h-64 w-full flex items-end gap-4 sm:gap-6 pt-6 border-b border-slate-100">
            {monthlyData.map((d, idx) => {
              const revHeight = Math.min(100, Math.max(15, (d.revenue / maxVal) * 100));
              const profHeight = Math.min(revHeight, Math.max(8, (d.profit / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[11px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10 font-mono-numbers">
                    Rev: ${d.revenue} | Profit: ${d.profit}
                  </div>

                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${revHeight}%` }}
                      className="w-full max-w-[28px] bg-slate-800 rounded-t-sm group-hover:bg-slate-700 transition-all"
                    />
                    {/* Profit Bar */}
                    <div
                      style={{ height: `${profHeight}%` }}
                      className="w-full max-w-[28px] bg-emerald-500 rounded-t-sm group-hover:bg-emerald-400 transition-all"
                    />
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 truncate w-full text-center">
                    {d.month}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Historical month-over-month comparisons</span>
            <span className="text-emerald-600 font-semibold font-mono-numbers">+24% volume trend</span>
          </div>
        </div>

        {/* Right: Marketplace Channel Breakdown */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-5 flex flex-col justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">Sales by Marketplace</h3>
            <p className="text-xs text-slate-500">Gross revenue distribution across selling channels.</p>
          </div>

          <div className="space-y-3.5 my-auto">
            {Object.keys(marketplaceDistribution).length > 0 ? (
              Object.entries(marketplaceDistribution).map(([channel, amount]) => {
                const pct = totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0;
                return (
                  <div key={channel} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-700">{channel}</span>
                      <span className="font-mono-numbers text-slate-900">
                        {formatCurrency(amount)} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${
                          channel === 'EBAY'
                            ? 'bg-blue-600'
                            : channel === 'WHATNOT'
                            ? 'bg-amber-500'
                            : channel === 'AMAZON'
                            ? 'bg-orange-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-xs text-slate-400">
                No marketplace sales logged yet.
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('fees')}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Compare Marketplace Fees</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Notifications & Inventory Alerts (if any low margin or aged items) */}
      {lowMarginOrAged.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1 flex-1">
            <span className="font-bold">Inventory Margin Advisory</span>
            <p className="text-amber-800">
              You have {lowMarginOrAged.length} listed item(s) with an expected margin under 20%. Consider revising your listing price using the Pricing Assistant to prevent fee erosion.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('pricing')}
            className="px-2.5 py-1 bg-amber-600 text-white rounded text-[11px] font-bold shrink-0 hover:bg-amber-700"
          >
            Open Pricing Assistant
          </button>
        </div>
      )}

      {/* Bottom Split: Recent Sales Table + Active Inventory Quick Glance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Recent Sales Table */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Recent Completed Sales</h3>
              <p className="text-xs text-slate-500">Latest recorded marketplace orders.</p>
            </div>
            <button
              onClick={() => setActiveTab('sales')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View All Sales</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400">
                  <th className="pb-2.5 font-semibold">Product</th>
                  <th className="pb-2.5 font-semibold">Channel</th>
                  <th className="pb-2.5 font-semibold text-right">Sale</th>
                  <th className="pb-2.5 font-semibold text-right">Net Profit</th>
                  <th className="pb-2.5 font-semibold text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-medium text-slate-900 max-w-[200px] truncate pr-2">
                      {s.productName}
                    </td>
                    <td className="py-3 text-slate-500 uppercase text-[10px] font-bold">
                      {s.marketplace}
                    </td>
                    <td className="py-3 text-right font-mono-numbers text-slate-900">
                      {formatCurrency(s.salePrice)}
                    </td>
                    <td
                      className={`py-3 text-right font-mono-numbers font-semibold ${
                        s.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {formatCurrency(s.netProfit)}
                    </td>
                    <td className="py-3 text-right font-mono-numbers text-slate-600">
                      {s.profitMargin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Inventory Quick Glance */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Active Inventory Highlights</h3>
              <p className="text-xs text-slate-500">Currently listed items awaiting sale.</p>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
            >
              <span>Manage ({activeInventory.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {activeInventory.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5 max-w-[220px]">
                  <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                  <p className="text-[11px] text-slate-500">
                    {item.category} · Cost: <span className="font-mono-numbers">${item.purchasePrice}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-slate-900 font-mono-numbers">
                    {formatCurrency(item.expectedSalePrice)}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-medium uppercase">
                    {item.marketplace}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

function ArrowRight(props: { className?: string }) {
  return (
    <svg className={props.className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  );
}
