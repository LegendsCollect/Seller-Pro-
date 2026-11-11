import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MarketplaceKey, SavedDeal } from '../../types';
import { computeProfitBreakdown, formatCurrency, formatPercent } from '../../utils/calculations';
import {
  Search,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  Clock,
  Plus,
  Trash2,
  Check,
  PackageCheck,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export const DealFinderView: React.FC = () => {
  const {
    marketplaceConfigs,
    savedDeals,
    saveDeal,
    deleteDeal,
    addInventoryItem,
  } = useApp();

  const [productName, setProductName] = useState('Vintage Polaroid SX-70 Land Camera');
  const [askingPrice, setAskingPrice] = useState<number>(65);
  const [expectedCompPrice, setExpectedCompPrice] = useState<number>(185);
  const [shippingCost, setShippingCost] = useState<number>(12);
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceKey>('ebay');
  const [turnaroundTime, setTurnaroundTime] = useState<string>('1-2 weeks');
  const [sourcingNotes, setSourcingNotes] = useState('Estate sale find; optical lens looks crystal clear.');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const cfg = marketplaceConfigs[selectedMarketplace];

  const breakdown = computeProfitBreakdown({
    purchasePrice: askingPrice,
    expectedSalePrice: expectedCompPrice,
    marketplace: selectedMarketplace,
    marketplaceFeeRate: cfg.defaultFeeRate,
    paymentFeeRate: cfg.paymentFeeRate,
    paymentFeeFixed: cfg.paymentFeeFixed,
    buyerShipping: 0,
    sellerShipping: shippingCost,
    packagingCost: 2.00,
    otherExpenses: 0,
  });

  // Risk Rating Calculation based on user-entered metrics
  let riskRating: 'low' | 'moderate' | 'high' = 'low';
  let riskReason = 'Strong margin safety buffer above 35% with high ROI.';

  if (breakdown.profitMargin < 15 || breakdown.roi < 25) {
    riskRating = 'high';
    riskReason = 'Thin margin buffer (<15%). One return, shipping surcharge, or fee increase could trigger a loss.';
  } else if (breakdown.profitMargin < 30 || breakdown.roi < 50) {
    riskRating = 'moderate';
    riskReason = 'Acceptable margin (15%-30%), but requires strict packaging cost control.';
  }

  // Max Buy Offer Solver to guarantee at least 30% margin
  const maxSafeOffer = Math.max(
    0,
    expectedCompPrice * (1 - cfg.defaultFeeRate - cfg.paymentFeeRate - 0.30) -
      shippingCost -
      2.00 -
      cfg.paymentFeeFixed
  );

  const handleSaveDeal = () => {
    saveDeal({
      productName: productName.trim() || 'Untitled Deal',
      purchasePrice: askingPrice,
      expectedSalePrice: expectedCompPrice,
      shippingCost,
      marketplace: selectedMarketplace,
      expectedSellingTime: turnaroundTime,
      netProfit: breakdown.netProfit,
      margin: breakdown.profitMargin,
      roi: breakdown.roi,
      breakEvenPrice: breakdown.breakEvenPrice,
      riskRating,
      notes: sourcingNotes,
    });
    showToast('Deal saved to sourcing evaluation list!');
  };

  const handleConvertToInventory = () => {
    const res = addInventoryItem({
      title: productName || 'Sourced Inventory Item',
      sku: `SRC-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Electronics & Cameras',
      purchasePrice: askingPrice,
      expectedSalePrice: expectedCompPrice,
      quantity: 1,
      purchaseDate: new Date().toISOString().slice(0, 10),
      status: 'listed',
      marketplace: selectedMarketplace,
      notes: `Sourced with Deal Finder. Expected profit: ${formatCurrency(breakdown.netProfit)}`,
    });

    if (res.success) {
      showToast('Deal officially converted to Active Inventory!');
    } else {
      showToast(res.error || 'Could not add to inventory');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Sourcing Deal Finder & Comps Evaluator
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Assess purchase safety, net ROI, and margin buffers on the go before committing capital.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Deal Input Form */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Item / Lot Name
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Graded Card, Sneaker restock, Retro console lot"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Seller Asking / Cost Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={askingPrice}
                onChange={(e) => setAskingPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400">Negotiated buy price</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Sold Comps ($)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={expectedCompPrice}
                onChange={(e) => setExpectedCompPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400">Realistic recent sold listings</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Estimated Shipping Cost ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={shippingCost}
                onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marketplace Channel
              </label>
              <select
                value={selectedMarketplace}
                onChange={(e) => setSelectedMarketplace(e.target.value as MarketplaceKey)}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Turnaround Time
              </label>
              <select
                value={turnaroundTime}
                onChange={(e) => setTurnaroundTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="1-3 days">1-3 days (High velocity / Hot flip)</option>
                <option value="1-2 weeks">1-2 weeks (Standard turn)</option>
                <option value="1 month">1 month (Seasonal demand)</option>
                <option value="2-3 months">2-3 months (Long-tail collectible)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Recommended Buy Offer
              </label>
              <div className="px-3 py-2 text-xs bg-emerald-50 border border-emerald-200 rounded-lg font-mono-numbers font-bold text-emerald-800">
                {formatCurrency(maxSafeOffer)}
              </div>
              <span className="text-[10px] text-emerald-700">Counter-offer ceiling for 30% margin</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Sourcing Notes & Condition Observations
            </label>
            <textarea
              rows={2}
              value={sourcingNotes}
              onChange={(e) => setSourcingNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSaveDeal}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save to Shortlist</span>
            </button>

            <button
              onClick={handleConvertToInventory}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Purchase & Add to Inventory</span>
            </button>
          </div>
        </div>

        {/* Right Output & Risk Rating */}
        <div className="lg:col-span-6 space-y-6">
          {/* Risk Card */}
          <div
            className={`p-6 rounded-2xl border text-white space-y-5 ${
              riskRating === 'low'
                ? 'bg-slate-900 border-emerald-500/80'
                : riskRating === 'moderate'
                ? 'bg-slate-900 border-amber-500/80'
                : 'bg-slate-900 border-rose-500/80'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                {riskRating === 'low' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                ) : riskRating === 'moderate' ? (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                )}
                <span className="font-bold text-sm uppercase tracking-wider">
                  Risk Assessment: {riskRating} Risk
                </span>
              </div>
              <span className="text-xs text-slate-400">{turnaroundTime}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{riskReason}</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono-numbers pt-2 border-t border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 font-sans">Net Payout</span>
                <p className="text-2xl font-bold text-emerald-400">
                  {formatCurrency(breakdown.netProfit)}
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-sans">Profit Margin</span>
                <p className="text-2xl font-bold text-white">
                  {breakdown.profitMargin.toFixed(1)}%
                </p>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-sans">Expected ROI</span>
                <p className="text-2xl font-bold text-white">
                  {formatPercent(breakdown.roi)}
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-300 pt-2 border-t border-slate-800">
              <span>Break-Even Comp Price:</span>
              <span className="font-mono-numbers font-bold text-emerald-400">
                {formatCurrency(breakdown.breakEvenPrice)}
              </span>
            </div>
          </div>

          {/* Shortlist of Evaluated Deals */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Saved Sourcing Shortlist</h3>
              <span className="text-xs text-slate-400 font-mono-numbers">
                {savedDeals.length} deals
              </span>
            </div>

            {savedDeals.length > 0 ? (
              <div className="space-y-3">
                {savedDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 truncate flex-1">
                      <p className="font-semibold text-slate-900 truncate">{deal.productName}</p>
                      <p className="text-[11px] text-slate-500">
                        Buy ${deal.purchasePrice} → Comp ${deal.expectedSalePrice} · {deal.expectedSellingTime}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-bold text-emerald-600 font-mono-numbers">
                        +{formatCurrency(deal.netProfit)}
                      </p>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          deal.riskRating === 'low'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {deal.riskRating} risk
                      </span>
                    </div>

                    <button
                      onClick={() => deleteDeal(deal.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                      title="Remove deal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                No sourcing deals saved yet. Use this tool while at thrift stores or flea markets to compare comps.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
