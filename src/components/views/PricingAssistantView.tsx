import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MarketplaceKey } from '../../types';
import { calculateTargetPrice, computeProfitBreakdown, formatCurrency } from '../../utils/calculations';
import {
  Sparkles,
  ArrowRight,
  Target,
  Copy,
  Check,
  Package,
  Layers,
  Percent,
  Sliders,
} from 'lucide-react';

export const PricingAssistantView: React.FC = () => {
  const { marketplaceConfigs, addInventoryItem } = useApp();

  const [itemTitle, setItemTitle] = useState('Sony WH-1000XM4 Noise Canceling Headphones');
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceKey>('ebay');
  const [cogs, setCogs] = useState<number>(110);
  const [sellerShipping, setSellerShipping] = useState<number>(10.50);
  const [buyerShipping, setBuyerShipping] = useState<number>(0); // e.g. Free shipping
  const [packaging, setPackaging] = useState<number>(2.50);
  const [otherCost, setOtherCost] = useState<number>(0);
  const [customTargetMargin, setCustomTargetMargin] = useState<number>(35);

  const [copiedPrice, setCopiedPrice] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  const cfg = marketplaceConfigs[selectedMarketplace];

  // Calculate listing prices for:
  // 1. Break-Even (0% margin)
  // 2. 20% margin
  // 3. 30% margin
  // 4. 40% margin
  // 5. Custom margin
  const targets = [
    { label: 'Break-Even Floor', margin: 0, tag: 'Minimum price to avoid loss' },
    { label: 'Standard Flip', margin: 20, tag: 'Quick liquidation velocity' },
    { label: 'Healthy Target', margin: 30, tag: 'Recommended benchmark' },
    { label: 'Grail / High Return', margin: 40, tag: 'Collectibles & rare finds' },
    { label: `Custom (${customTargetMargin}%)`, margin: customTargetMargin, tag: 'User goal' },
  ];

  const calculatedTiers = targets.map((t) => {
    const listPrice = calculateTargetPrice(
      cogs,
      sellerShipping,
      packaging,
      otherCost,
      buyerShipping,
      cfg.defaultFeeRate,
      cfg.paymentFeeRate,
      cfg.paymentFeeFixed,
      t.margin
    );

    const breakdown = computeProfitBreakdown({
      purchasePrice: cogs,
      expectedSalePrice: listPrice,
      marketplace: selectedMarketplace,
      marketplaceFeeRate: cfg.defaultFeeRate,
      paymentFeeRate: cfg.paymentFeeRate,
      paymentFeeFixed: cfg.paymentFeeFixed,
      buyerShipping,
      sellerShipping,
      packagingCost: packaging,
      otherExpenses: otherCost,
    });

    return {
      ...t,
      listPrice,
      netProfit: breakdown.netProfit,
      roi: breakdown.roi,
      totalFees: breakdown.totalFees,
    };
  });

  const handleCopy = (price: number, label: string) => {
    navigator.clipboard.writeText(price.toFixed(2));
    setCopiedPrice(label);
    setTimeout(() => setCopiedPrice(null), 2000);
  };

  const handlePushToInventory = (price: number) => {
    const res = addInventoryItem({
      title: itemTitle || 'Priced Item',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Electronics & Cameras',
      purchasePrice: cogs,
      expectedSalePrice: price,
      quantity: 1,
      purchaseDate: new Date().toISOString().slice(0, 10),
      status: 'listed',
      marketplace: selectedMarketplace,
      notes: `Priced via Pricing Assistant for ${selectedMarketplace.toUpperCase()}`,
    });

    if (res.success) {
      setStatusNotice(`Saved to Inventory at ${formatCurrency(price)}!`);
      setTimeout(() => setStatusNotice(null), 3000);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {statusNotice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{statusNotice}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Pricing Assistant
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Mathematically solves the exact listing price required to hit 20%, 30%, 40%, or custom net margin goals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Inputs */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700">Item Title</label>
            <input
              type="text"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Target Marketplace
            </label>
            <select
              value={selectedMarketplace}
              onChange={(e) => setSelectedMarketplace(e.target.value as MarketplaceKey)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg capitalize"
            >
              <option value="ebay">eBay ({((cfg.defaultFeeRate + cfg.paymentFeeRate) * 100).toFixed(1)}% est)</option>
              <option value="whatnot">Whatnot (8% + 2.9% + $0.30)</option>
              <option value="amazon">Amazon (15% referral)</option>
              <option value="etsy">Etsy (6.5% + 3% + fees)</option>
              <option value="mercari">Mercari (10% + 2.9% + $0.50)</option>
              <option value="poshmark">Poshmark (20% flat)</option>
              <option value="custom">Custom Platform</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item Cost (COGS) ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={cogs}
                onChange={(e) => setCogs(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seller Shipping Label ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sellerShipping}
                onChange={(e) => setSellerShipping(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buyer Shipping Charged ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={buyerShipping}
                onChange={(e) => setBuyerShipping(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
              />
              <span className="text-[10px] text-slate-400">0 for Free Shipping listings</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Packaging Supplies ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={packaging}
                onChange={(e) => setPackaging(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">Custom Margin Goal (%)</label>
              <span className="text-xs font-bold font-mono-numbers text-emerald-600">
                {customTargetMargin}%
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="70"
              value={customTargetMargin}
              onChange={(e) => setCustomTargetMargin(parseInt(e.target.value) || 20)}
              className="w-full accent-emerald-600 cursor-pointer"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <strong>Formula Note:</strong> As selling price rises, marketplace percentage fees also rise. SellerPro iteratively calculates the gross price required to protect your exact take-home dollar profit.
          </div>
        </div>

        {/* Right Output Cards */}
        <div className="lg:col-span-7 space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-900">
              Recommended Listing Price Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Select or copy the price that matches your inventory strategy.
            </p>
          </div>

          <div className="space-y-3">
            {calculatedTiers.map((tier, idx) => {
              const isRecommended = tier.margin === 30;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isRecommended
                      ? 'border-emerald-500 bg-emerald-50/20 shadow-xs'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{tier.label}</span>
                      {isRecommended && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                          Target Sweet Spot
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">{tier.tag}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-600 pt-1 font-mono-numbers">
                      <span>
                        Net Profit:{' '}
                        <strong className="text-emerald-600">{formatCurrency(tier.netProfit)}</strong>
                      </span>
                      <span>·</span>
                      <span>ROI: <strong>{tier.roi.toFixed(1)}%</strong></span>
                      <span>·</span>
                      <span>Fees: -{formatCurrency(tier.totalFees)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Listing Price
                      </span>
                      <span className="text-2xl font-black text-slate-900 font-mono-numbers">
                        {formatCurrency(tier.listPrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(tier.listPrice, tier.label)}
                        className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
                        title="Copy price to clipboard"
                      >
                        {copiedPrice === tier.label ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handlePushToInventory(tier.listPrice)}
                        className="p-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors"
                        title="Save to Inventory"
                      >
                        <Package className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
