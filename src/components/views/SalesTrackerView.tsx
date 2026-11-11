import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SaleRecord, MarketplaceKey, ProductCategory } from '../../types';
import { formatCurrency, formatPercent, exportSalesToCSV } from '../../utils/calculations';
import {
  TrendingUp,
  Plus,
  Download,
  Search,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  X,
  FileSpreadsheet,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

interface SalesTrackerViewProps {
  onOpenAddSaleModal: () => void;
}

export const SalesTrackerView: React.FC<SalesTrackerViewProps> = ({ onOpenAddSaleModal }) => {
  const { sales, deleteSale, updateSale } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>('all');
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);

  // Filter Sales
  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sale.orderReference && sale.orderReference.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (sale.notes && sale.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesMkt = selectedMarketplace === 'all' || sale.marketplace === selectedMarketplace;
    return matchesSearch && matchesMkt;
  });

  // Sort Sales by Date Sold descending
  filteredSales.sort((a, b) => new Date(b.dateSold).getTime() - new Date(a.dateSold).getTime());

  // Aggregate Totals for the filtered set
  const filteredRevenue = filteredSales.reduce((acc, s) => acc + s.grossRevenue, 0);
  const filteredProfit = filteredSales.reduce((acc, s) => acc + s.netProfit, 0);
  const filteredFees = filteredSales.reduce((acc, s) => acc + s.marketplaceFees + s.paymentFees, 0);
  const filteredMargin = filteredRevenue > 0 ? (filteredProfit / filteredRevenue) * 100 : 0;

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    // Recompute financials
    const grossRevenue = editingSale.salePrice + editingSale.shippingCharged;
    const directExpenses = editingSale.purchasePrice + editingSale.shippingPaid + editingSale.otherExpenses;
    const totalFees = editingSale.marketplaceFees + editingSale.paymentFees;
    const totalExpenses = directExpenses + totalFees;
    const netProfit = grossRevenue - totalExpenses;
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    const roi = directExpenses > 0 ? (netProfit / directExpenses) * 100 : 0;

    updateSale(editingSale.id, {
      ...editingSale,
      grossRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      roi,
    });
    setEditingSale(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sales & Orders Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Realized gross revenue, deducted fees, shipping costs, and final take-home net profit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => exportSalesToCSV(filteredSales)}
            disabled={filteredSales.length === 0}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-2xs disabled:opacity-50 shrink-0"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV Report</span>
          </button>

          <button
            onClick={onOpenAddSaleModal}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Sale</span>
          </button>
        </div>
      </div>

      {/* Realized Ledger Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Recorded Orders
          </span>
          <p className="text-xl font-extrabold text-slate-900 font-mono-numbers">
            {filteredSales.length}
          </p>
          <p className="text-[11px] text-slate-500">Delivered & verified</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Filtered Gross Volume
          </span>
          <p className="text-xl font-extrabold text-slate-900 font-mono-numbers">
            {formatCurrency(filteredRevenue)}
          </p>
          <p className="text-[11px] text-slate-500">Item + buyer shipping</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-emerald-300 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            Realized Net Profit
          </span>
          <p className="text-xl font-extrabold text-emerald-600 font-mono-numbers">
            {formatCurrency(filteredProfit)}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium">
            Overall Margin: {filteredMargin.toFixed(1)}%
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Fees Deducted
          </span>
          <p className="text-xl font-extrabold text-rose-600 font-mono-numbers">
            -{formatCurrency(filteredFees)}
          </p>
          <p className="text-[11px] text-slate-500">Marketplace & processors</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order ref, item name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedMarketplace}
            onChange={(e) => setSelectedMarketplace(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none capitalize"
          >
            <option value="all">All Marketplaces</option>
            <option value="ebay">eBay</option>
            <option value="whatnot">Whatnot</option>
            <option value="amazon">Amazon</option>
            <option value="etsy">Etsy</option>
            <option value="poshmark">Poshmark</option>
            <option value="mercari">Mercari</option>
            <option value="custom">Custom</option>
          </select>
        </div>
      </div>

      {/* Sales Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 font-semibold">Date / Ref</th>
                <th className="py-3 px-3 font-semibold">Product Name</th>
                <th className="py-3 px-3 font-semibold">Channel</th>
                <th className="py-3 px-3 font-semibold text-right">Sale Price</th>
                <th className="py-3 px-3 font-semibold text-right">COGS (Cost)</th>
                <th className="py-3 px-3 font-semibold text-right">Platform Fees</th>
                <th className="py-3 px-3 font-semibold text-right">Carrier Ship</th>
                <th className="py-3 px-3 font-semibold text-right">Net Profit</th>
                <th className="py-3 px-3 font-semibold text-right">Margin</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono-numbers text-slate-600">
                      <p className="font-semibold text-slate-900">{sale.dateSold}</p>
                      <p className="text-[10px] text-slate-400">{sale.orderReference || 'N/A'}</p>
                    </td>

                    <td className="py-3.5 px-3 max-w-[200px]">
                      <p className="font-semibold text-slate-900 truncate">{sale.productName}</p>
                      <p className="text-[10px] text-slate-400">{sale.category}</p>
                    </td>

                    <td className="py-3.5 px-3 uppercase text-[10px] font-bold text-slate-700">
                      {sale.marketplace}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono-numbers text-slate-900">
                      {formatCurrency(sale.salePrice)}
                      {sale.shippingCharged > 0 && (
                        <span className="block text-[10px] text-slate-400">
                          +{formatCurrency(sale.shippingCharged)} ship
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono-numbers text-rose-600">
                      -{formatCurrency(sale.purchasePrice)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono-numbers text-rose-600">
                      -{formatCurrency(sale.marketplaceFees + sale.paymentFees)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono-numbers text-slate-600">
                      -{formatCurrency(sale.shippingPaid)}
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono-numbers">
                      <span
                        className={`font-bold ${
                          sale.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatCurrency(sale.netProfit)}
                      </span>
                    </td>

                    <td className="py-3.5 px-3 text-right font-mono-numbers font-medium text-slate-700">
                      {sale.profitMargin.toFixed(1)}%
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingSale(sale)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                          title="Edit Sale"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteSale(sale.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                          title="Delete Sale"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                    No sales recorded yet. Click "Record New Sale" to add completed orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Sale Modal */}
      {editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Edit Sale Record</h3>
              <button
                onClick={() => setEditingSale(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={editingSale.productName}
                  onChange={(e) =>
                    setEditingSale({ ...editingSale, productName: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Sale Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSale.salePrice}
                    onChange={(e) =>
                      setEditingSale({
                        ...editingSale,
                        salePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cost of Goods (COGS) ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSale.purchasePrice}
                    onChange={(e) =>
                      setEditingSale({
                        ...editingSale,
                        purchasePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Platform Fees ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSale.marketplaceFees}
                    onChange={(e) =>
                      setEditingSale({
                        ...editingSale,
                        marketplaceFees: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Carrier Shipping Paid ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingSale.shippingPaid}
                    onChange={(e) =>
                      setEditingSale({
                        ...editingSale,
                        shippingPaid: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date Sold
                  </label>
                  <input
                    type="date"
                    value={editingSale.dateSold}
                    onChange={(e) =>
                      setEditingSale({ ...editingSale, dateSold: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Order Reference #
                  </label>
                  <input
                    type="text"
                    value={editingSale.orderReference || ''}
                    onChange={(e) =>
                      setEditingSale({ ...editingSale, orderReference: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingSale(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg"
                >
                  Update Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
