import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, InventoryStatus, ProductCategory, MarketplaceKey } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Edit2,
  Trash2,
  CheckCircle,
  ExternalLink,
  Tag,
  DollarSign,
  TrendingUp,
  Image as ImageIcon,
  Check,
  X,
  ShoppingBag,
  Share2,
} from 'lucide-react';

interface InventoryManagerViewProps {
  onOpenAddItemModal: () => void;
  onOpenSaleModalForItem?: (item: InventoryItem) => void;
}

export const InventoryManagerView: React.FC<InventoryManagerViewProps> = ({
  onOpenAddItemModal,
  onOpenSaleModalForItem,
}) => {
  const { inventory, updateInventoryItem, deleteInventoryItem, user, openCrossListModal } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'price' | 'profit'>('date');

  // Filter & Search Logic
  const filteredItems = inventory.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Sorting
  filteredItems.sort((a, b) => {
    if (sortBy === 'price') return b.expectedSalePrice - a.expectedSalePrice;
    if (sortBy === 'profit') {
      const profitA = (a.expectedSalePrice - a.purchasePrice) * a.quantity;
      const profitB = (b.expectedSalePrice - b.purchasePrice) * b.quantity;
      return profitB - profitA;
    }
    return new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime();
  });

  // Metrics
  const activeItems = inventory.filter((i) => i.status === 'listed');
  const totalCost = activeItems.reduce((acc, i) => acc + i.purchasePrice * i.quantity, 0);
  const totalEstimatedValue = activeItems.reduce((acc, i) => acc + i.expectedSalePrice * i.quantity, 0);
  const expectedProfit = totalEstimatedValue - totalCost;

  // Edit item state
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateInventoryItem(editingItem.id, editingItem);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory Manager
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track capital allocation, cost-of-goods-sold (COGS), listing statuses, and expected returns.
          </p>
        </div>

        <button
          onClick={onOpenAddItemModal}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Active Products
          </span>
          <p className="text-xl font-extrabold text-slate-900 font-mono-numbers">
            {activeItems.length}{' '}
            <span className="text-xs font-normal text-slate-400">
              ({inventory.reduce((sum, i) => sum + i.quantity, 0)} units)
            </span>
          </p>
          <p className="text-[11px] text-slate-500">
            {user?.plan === 'free' ? `${activeItems.length}/15 free limit` : 'Unlimited tier'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Total Inventory Cost (COGS)
          </span>
          <p className="text-xl font-extrabold text-slate-900 font-mono-numbers">
            {formatCurrency(totalCost)}
          </p>
          <p className="text-[11px] text-slate-500">Active capital deployed</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Estimated Market Value
          </span>
          <p className="text-xl font-extrabold text-slate-900 font-mono-numbers">
            {formatCurrency(totalEstimatedValue)}
          </p>
          <p className="text-[11px] text-slate-500">Target list price sum</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-emerald-300 shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-800">
            Expected Pipeline Profit
          </span>
          <p className="text-xl font-extrabold text-emerald-600 font-mono-numbers">
            {formatCurrency(expectedProfit)}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium">
            Margin: {totalEstimatedValue > 0 ? ((expectedProfit / totalEstimatedValue) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search title, SKU, or notes..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Trading Cards">Trading Cards</option>
            <option value="Sneakers & Streetwear">Sneakers & Streetwear</option>
            <option value="Video Games & Consoles">Video Games & Consoles</option>
            <option value="Electronics & Cameras">Electronics & Cameras</option>
            <option value="Clothing & Apparel">Clothing & Apparel</option>
            <option value="Collectibles & Toys">Collectibles & Toys</option>
            <option value="Other">Other</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="listed">Listed Only</option>
            <option value="draft">Draft Only</option>
            <option value="sold">Sold</option>
            <option value="removed">Removed</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
          >
            <option value="date">Sort: Newest Purchase</option>
            <option value="price">Sort: Highest Price</option>
            <option value="profit">Sort: Highest Expected Profit</option>
          </select>
        </div>
      </div>

      {/* Inventory Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4 font-semibold">Product Title & SKU</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-3 font-semibold">Marketplace</th>
                <th className="py-3 px-3 font-semibold text-right">Cost (COGS)</th>
                <th className="py-3 px-3 font-semibold text-right">Target Price</th>
                <th className="py-3 px-3 font-semibold text-right">Est. Profit</th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => {
                  const unitProfit = item.expectedSalePrice - item.purchasePrice;
                  const totalItemProfit = unitProfit * item.quantity;
                  const marginPct =
                    item.expectedSalePrice > 0 ? (unitProfit / item.expectedSalePrice) * 100 : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Product Title & Image */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="space-y-0.5 max-w-xs">
                            <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span>SKU: {item.sku || 'N/A'}</span>
                              <span>·</span>
                              <span>Qty: {item.quantity}</span>
                              <span>·</span>
                              <span>Bought: {item.purchaseDate}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 text-slate-600">
                        <span className="truncate max-w-[120px] inline-block">{item.category}</span>
                      </td>

                      {/* Marketplace */}
                      <td className="py-3.5 px-3 uppercase text-[10px] font-bold text-slate-700">
                        {item.marketplace}
                      </td>

                      {/* Purchase Price */}
                      <td className="py-3.5 px-3 text-right font-mono-numbers text-slate-800">
                        {formatCurrency(item.purchasePrice)}
                      </td>

                      {/* Expected Sale Price */}
                      <td className="py-3.5 px-3 text-right font-mono-numbers font-semibold text-slate-900">
                        {formatCurrency(item.expectedSalePrice)}
                      </td>

                      {/* Est. Profit */}
                      <td className="py-3.5 px-3 text-right font-mono-numbers">
                        <span
                          className={`font-semibold ${
                            totalItemProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {formatCurrency(totalItemProfit)}
                        </span>
                        <p className="text-[10px] text-slate-400">{marginPct.toFixed(1)}%</p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'listed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : item.status === 'sold'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : item.status === 'draft'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status !== 'sold' && onOpenSaleModalForItem && (
                            <button
                              onClick={() => onOpenSaleModalForItem(item)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                              title="Convert to Sale Record"
                            >
                              <ShoppingBag className="w-3 h-3" />
                              <span>Mark Sold</span>
                            </button>
                          )}

                          {item.status !== 'sold' && (
                            <button
                              onClick={() => openCrossListModal(item)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                              title="1-Click Multi-Marketplace Cross-List"
                            >
                              <Share2 className="w-3 h-3 text-indigo-600" />
                              <span>Cross-List</span>
                            </button>
                          )}

                          <button
                            onClick={() => setEditingItem(item)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => deleteInventoryItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    No items found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">Edit Inventory Item</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Price (COGS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.purchasePrice}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        purchasePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Selling Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingItem.expectedSalePrice}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        expectedSalePrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={editingItem.status}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        status: e.target.value as InventoryStatus,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="draft">Draft</option>
                    <option value="listed">Listed</option>
                    <option value="sold">Sold</option>
                    <option value="removed">Removed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marketplace
                  </label>
                  <select
                    value={editingItem.marketplace}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        marketplace: e.target.value as MarketplaceKey,
                      })
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg capitalize"
                  >
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Notes / Sourcing Origin
                </label>
                <textarea
                  rows={2}
                  value={editingItem.notes || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
