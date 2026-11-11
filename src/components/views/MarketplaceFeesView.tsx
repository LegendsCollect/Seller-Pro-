import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MarketplaceKey } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import {
  Percent,
  RotateCcw,
  Sliders,
  DollarSign,
  ArrowRight,
  Info,
  Check,
  CheckCircle2,
} from 'lucide-react';

export const MarketplaceFeesView: React.FC = () => {
  const { marketplaceConfigs, updateMarketplaceConfig, resetMarketplaceConfigs } = useApp();

  const [activeTabKey, setActiveTabKey] = useState<MarketplaceKey>('ebay');
  const [comparisonPrice, setComparisonPrice] = useState<number>(150);
  const [comparisonShipping, setComparisonShipping] = useState<number>(10);
  const [comparisonSellerShippingCost, setComparisonSellerShippingCost] = useState<number>(7.50);

  const activeConfig = marketplaceConfigs[activeTabKey];

  // Side-by-side comparison computation for all platforms
  const platforms: MarketplaceKey[] = ['ebay', 'whatnot', 'amazon', 'etsy', 'mercari', 'poshmark'];

  const calculatePayoutForPlatform = (key: MarketplaceKey) => {
    const cfg = marketplaceConfigs[key];
    const gross = comparisonPrice + comparisonShipping;
    let fee = 0;

    if (key === 'poshmark') {
      fee = comparisonPrice < 15 ? 2.95 : comparisonPrice * 0.20;
    } else {
      const commFee = gross * cfg.defaultFeeRate;
      const payFee = gross * cfg.paymentFeeRate + cfg.paymentFeeFixed;
      fee = commFee + payFee + (cfg.listingFee || 0);
    }

    const netPayout = gross - fee - comparisonSellerShippingCost;
    const feePct = gross > 0 ? (fee / gross) * 100 : 0;

    return {
      fee,
      feePct,
      netPayout,
      gross,
    };
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Marketplace Fee Calculators & Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configurable fee schedules for eBay, Whatnot, Amazon, Etsy, Mercari, and Poshmark.
          </p>
        </div>

        <button
          onClick={resetMarketplaceConfigs}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Default Fee Rates</span>
        </button>
      </div>

      {/* Interactive Platform Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100">
          {(['ebay', 'whatnot', 'amazon', 'etsy', 'mercari', 'poshmark', 'custom'] as MarketplaceKey[]).map(
            (key) => (
              <button
                key={key}
                onClick={() => setActiveTabKey(key)}
                className={`py-2 px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-all capitalize ${
                  activeTabKey === key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {key === 'custom' ? 'Custom / Offline' : key}
              </button>
            )
          )}
        </div>

        {/* Selected Config Editor */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-7 space-y-4">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 capitalize">
                {activeConfig.name} Fee Structure
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {activeConfig.description}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={(activeConfig.defaultFeeRate * 100).toFixed(2)}
                  onChange={(e) =>
                    updateMarketplaceConfig(activeTabKey, {
                      defaultFeeRate: parseFloat(e.target.value) / 100 || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Processing Rate (%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={(activeConfig.paymentFeeRate * 100).toFixed(2)}
                  onChange={(e) =>
                    updateMarketplaceConfig(activeTabKey, {
                      paymentFeeRate: parseFloat(e.target.value) / 100 || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fixed Fee Per Order ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={activeConfig.paymentFeeFixed}
                  onChange={(e) =>
                    updateMarketplaceConfig(activeTabKey, {
                      paymentFeeFixed: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:outline-none"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <span className="font-bold text-slate-800">Category Notes & Rules:</span>
              <p>{activeConfig.notes}</p>
            </div>
          </div>

          {/* Quick Sandbox Payout Box */}
          <div className="md:col-span-5 bg-slate-900 text-white rounded-xl p-5 space-y-4">
            <span className="text-[11px] uppercase font-bold tracking-wider text-slate-400">
              {activeConfig.name} Instant Payout Test
            </span>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-300">Test Sale Price:</span>
                <span className="font-mono-numbers font-semibold">
                  {formatCurrency(comparisonPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Estimated Total Fees:</span>
                <span className="font-mono-numbers text-rose-400">
                  -{formatCurrency(calculatePayoutForPlatform(activeTabKey).fee)} (
                  {calculatePayoutForPlatform(activeTabKey).feePct.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-bold text-emerald-400">
                <span>Net Payout to Seller:</span>
                <span className="font-mono-numbers text-base">
                  {formatCurrency(calculatePayoutForPlatform(activeTabKey).netPayout)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Marketplace Comparison Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Side-by-Side Platform Payout Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Where do you keep the most money for a given sale price?
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Item Price:</span>
            <input
              type="number"
              min="1"
              step="5"
              value={comparisonPrice}
              onChange={(e) => setComparisonPrice(parseFloat(e.target.value) || 0)}
              className="w-28 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {platforms.map((key) => {
            const data = calculatePayoutForPlatform(key);
            const isHighest = platforms.every(
              (p) => calculatePayoutForPlatform(p).netPayout <= data.netPayout
            );

            return (
              <div
                key={key}
                className={`p-5 rounded-xl border transition-all space-y-3 ${
                  isHighest
                    ? 'border-emerald-500 bg-emerald-50/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-900 uppercase">
                    {marketplaceConfigs[key].name}
                  </span>
                  {isHighest && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Top Payout
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500">Estimated Net Payout</span>
                  <p className="text-2xl font-black text-slate-900 font-mono-numbers">
                    {formatCurrency(data.netPayout)}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 text-xs space-y-1 text-slate-600">
                  <div className="flex justify-between">
                    <span>Platform Fee:</span>
                    <span className="font-mono-numbers text-rose-600">
                      -{formatCurrency(data.fee)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Effective Take Rate:</span>
                    <span className="font-mono-numbers">{data.feePct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
