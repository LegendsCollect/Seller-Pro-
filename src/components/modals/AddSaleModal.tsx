import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { InventoryItem, MarketplaceKey, ProductCategory } from '../../types';
import { computeProfitBreakdown, formatCurrency } from '../../utils/calculations';
import { X, TrendingUp, DollarSign, Package } from 'lucide-react';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedItem?: InventoryItem | null;
}

export const AddSaleModal: React.FC<AddSaleModalProps> = ({
  isOpen,
  onClose,
  preselectedItem,
}) => {
  const { inventory, addSale, updateInventoryItem, marketplaceConfigs, user } = useApp();

  const [selectedInventoryId, setSelectedInventoryId] = useState<string>(
    preselectedItem?.id || ''
  );
  const [productName, setProductName] = useState(preselectedItem?.title || '');
  const [category, setCategory] = useState<ProductCategory>(
    preselectedItem?.category || 'Trading Cards'
  );
  const [marketplace, setMarketplace] = useState<MarketplaceKey>(
    preselectedItem?.marketplace || user?.defaultMarketplace || 'ebay'
  );
  const [salePrice, setSalePrice] = useState<number>(preselectedItem?.expectedSalePrice || 100);
  const [purchasePrice, setPurchasePrice] = useState<number>(
    preselectedItem?.purchasePrice || 40
  );
  const [shippingCharged, setShippingCharged] = useState<number>(10);
  const [shippingPaid, setShippingPaid] = useState<number>(7.50);
  const [otherExpenses, setOtherExpenses] = useState<number>(2.00);
  const [orderReference, setOrderReference] = useState(
    `ORD-${Math.floor(100000 + Math.random() * 900000)}`
  );
  const [dateSold, setDateSold] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Sync when preselectedItem changes
  useEffect(() => {
    if (preselectedItem) {
      setSelectedInventoryId(preselectedItem.id);
      setProductName(preselectedItem.title);
      setCategory(preselectedItem.category);
      setMarketplace(preselectedItem.marketplace);
      setSalePrice(preselectedItem.expectedSalePrice);
      setPurchasePrice(preselectedItem.purchasePrice);
    }
  }, [preselectedItem]);

  // When selecting an item from dropdown
  const handleInventorySelect = (id: string) => {
    setSelectedInventoryId(id);
    const found = inventory.find((i) => i.id === id);
    if (found) {
      setProductName(found.title);
      setCategory(found.category);
      setMarketplace(found.marketplace);
      setSalePrice(found.expectedSalePrice);
      setPurchasePrice(found.purchasePrice);
    }
  };

  const cfg = marketplaceConfigs[marketplace];
  const breakdown = computeProfitBreakdown({
    purchasePrice,
    expectedSalePrice: salePrice,
    marketplace,
    marketplaceFeeRate: cfg.defaultFeeRate,
    paymentFeeRate: cfg.paymentFeeRate,
    paymentFeeFixed: cfg.paymentFeeFixed,
    buyerShipping: shippingCharged,
    sellerShipping: shippingPaid,
    packagingCost: otherExpenses,
    otherExpenses: 0,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addSale({
      inventoryItemId: selectedInventoryId || undefined,
      productName: productName.trim() || 'Untitled Sale',
      category,
      marketplace,
      salePrice: Math.max(0, salePrice),
      purchasePrice: Math.max(0, purchasePrice),
      shippingCharged: Math.max(0, shippingCharged),
      shippingPaid: Math.max(0, shippingPaid),
      marketplaceFees: breakdown.marketplaceFeeAmount,
      paymentFees: breakdown.paymentFeeAmount,
      otherExpenses,
      dateSold,
      orderReference,
      notes,
      grossRevenue: breakdown.grossRevenue,
      totalExpenses: breakdown.totalCosts,
      netProfit: breakdown.netProfit,
      profitMargin: breakdown.profitMargin,
      roi: breakdown.roi,
    });

    // If linked to an active inventory item, mark it as sold
    if (selectedInventoryId) {
      updateInventoryItem(selectedInventoryId, { status: 'sold' });
    }

    onClose();
  };

  const activeInventoryOptions = inventory.filter((i) => i.status !== 'sold');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Record Completed Sale</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Link to Inventory Item */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Link to Existing Listed Inventory Item (Optional)
            </label>
            <select
              value={selectedInventoryId}
              onChange={(e) => handleInventorySelect(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
            >
              <option value="">-- Manual Direct Sale (Not in inventory) --</option>
              {activeInventoryOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} (Cost: ${item.purchasePrice} · List: ${item.expectedSalePrice})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Product Title *
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Nike Air Max 95 Neon Size 11"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Marketplace
              </label>
              <select
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value as MarketplaceKey)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg capitalize"
              >
                <option value="ebay">eBay</option>
                <option value="whatnot">Whatnot</option>
                <option value="amazon">Amazon</option>
                <option value="etsy">Etsy</option>
                <option value="mercari">Mercari</option>
                <option value="poshmark">Poshmark</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="Trading Cards">Trading Cards</option>
                <option value="Sneakers & Streetwear">Sneakers & Streetwear</option>
                <option value="Video Games & Consoles">Video Games & Consoles</option>
                <option value="Electronics & Cameras">Electronics & Cameras</option>
                <option value="Clothing & Apparel">Clothing & Apparel</option>
                <option value="Collectibles & Toys">Collectibles & Toys</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Final Sale Price ($) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={salePrice || ''}
                onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item Cost (COGS) ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice || ''}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buyer Shipping ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingCharged}
                onChange={(e) => setShippingCharged(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seller Label Paid ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingPaid}
                onChange={(e) => setShippingPaid(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Packaging ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={otherExpenses}
                onChange={(e) => setOtherExpenses(parseFloat(e.target.value) || 0)}
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
                value={dateSold}
                onChange={(e) => setDateSold(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Order Reference #
              </label>
              <input
                type="text"
                value={orderReference}
                onChange={(e) => setOrderReference(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
              />
            </div>
          </div>

          {/* Computed Net Payout Box */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Calculated Net Profit
              </span>
              <span
                className={`text-lg font-bold font-mono-numbers ${
                  breakdown.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(breakdown.netProfit)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Profit Margin
              </span>
              <span className="text-sm font-semibold text-white font-mono-numbers">
                {breakdown.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              Confirm & Log Sale
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
