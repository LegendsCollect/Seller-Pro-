import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { computeProfitBreakdown, formatCurrency, formatPercent } from '../../utils/calculations';
import { MarketplaceKey, ProfitCalculation } from '../../types';
import {
  Calculator,
  Save,
  RotateCcw,
  ArrowRight,
  PlusCircle,
  Trash2,
  ExternalLink,
  Info,
  Check,
  Package,
} from 'lucide-react';

export const ProfitCalculatorView: React.FC = () => {
  const {
    marketplaceConfigs,
    savedCalculations,
    saveCalculation,
    deleteCalculation,
    addInventoryItem,
    addSale,
    setActiveTab,
  } = useApp();

  const [productName, setProductName] = useState('1999 Base Set Charizard PSA 9');
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceKey>('ebay');
  const [purchasePrice, setPurchasePrice] = useState<number>(450);
  const [expectedSalePrice, setExpectedSalePrice] = useState<number>(850);
  const [buyerShipping, setBuyerShipping] = useState<number>(14);
  const [sellerShipping, setSellerShipping] = useState<number>(9.50);
  const [packagingCost, setPackagingCost] = useState<number>(3.00);
  const [otherExpenses, setOtherExpenses] = useState<number>(0);

  // Editable fee settings initialized from marketplace configs
  const currentConfig = marketplaceConfigs[selectedMarketplace];
  const [mktFeeRatePct, setMktFeeRatePct] = useState<number>(currentConfig.defaultFeeRate * 100);
  const [payFeeRatePct, setPayFeeRatePct] = useState<number>(currentConfig.paymentFeeRate * 100);
  const [payFeeFixed, setPayFeeFixed] = useState<number>(currentConfig.paymentFeeFixed);

  // Sync fee rates when changing marketplace
  const handleMarketplaceChange = (key: MarketplaceKey) => {
    setSelectedMarketplace(key);
    const cfg = marketplaceConfigs[key];
    setMktFeeRatePct(cfg.defaultFeeRate * 100);
    setPayFeeRatePct(cfg.paymentFeeRate * 100);
    setPayFeeFixed(cfg.paymentFeeFixed);
  };

  const results = computeProfitBreakdown({
    purchasePrice,
    expectedSalePrice,
    marketplace: selectedMarketplace,
    marketplaceFeeRate: mktFeeRatePct / 100,
    paymentFeeRate: payFeeRatePct / 100,
    paymentFeeFixed: payFeeFixed,
    buyerShipping,
    sellerShipping,
    packagingCost,
    otherExpenses,
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveCalculation = () => {
    saveCalculation({
      productName: productName.trim() || 'Untitled Item',
      purchasePrice,
      expectedSalePrice,
      marketplace: selectedMarketplace,
      marketplaceFeeRate: mktFeeRatePct / 100,
      paymentFeeRate: payFeeRatePct / 100,
      paymentFeeFixed: payFeeFixed,
      buyerShipping,
      sellerShipping,
      packagingCost,
      otherExpenses,
      grossRevenue: results.grossRevenue,
      marketplaceFeeAmount: results.marketplaceFeeAmount,
      paymentFeeAmount: results.paymentFeeAmount,
      totalCosts: results.totalCosts,
      netProfit: results.netProfit,
      profitMargin: results.profitMargin,
      roi: results.roi,
      breakEvenPrice: results.breakEvenPrice,
    });
    showToast('Calculation saved to history!');
  };

  const handleTransferToInventory = () => {
    const res = addInventoryItem({
      title: productName || 'New Inventory Item',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Trading Cards',
      purchasePrice,
      expectedSalePrice,
      quantity: 1,
      purchaseDate: new Date().toISOString().slice(0, 10),
      status: 'listed',
      marketplace: selectedMarketplace,
      notes: `Estimated profit: ${formatCurrency(results.netProfit)} (${results.profitMargin.toFixed(1)}% margin)`,
    });

    if (res.success) {
      showToast('Item added to Inventory Manager!');
    } else {
      showToast(res.error || 'Failed to add to inventory');
    }
  };

  const handleLogAsSold = () => {
    addSale({
      productName: productName || 'Item Sold',
      category: 'Other',
      marketplace: selectedMarketplace,
      salePrice: expectedSalePrice,
      purchasePrice,
      shippingCharged: buyerShipping,
      shippingPaid: sellerShipping,
      marketplaceFees: results.marketplaceFeeAmount,
      paymentFees: results.paymentFeeAmount,
      otherExpenses: packagingCost + otherExpenses,
      dateSold: new Date().toISOString().slice(0, 10),
      orderReference: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: 'Logged directly from profit calculator',
      grossRevenue: results.grossRevenue,
      totalExpenses: results.totalCosts,
      netProfit: results.netProfit,
      profitMargin: results.profitMargin,
      roi: results.roi,
    });
    showToast('Direct sale logged in Sales Tracker!');
  };

  const loadPreviousCalc = (calc: ProfitCalculation) => {
    setProductName(calc.productName);
    setSelectedMarketplace(calc.marketplace);
    setPurchasePrice(calc.purchasePrice);
    setExpectedSalePrice(calc.expectedSalePrice);
    setBuyerShipping(calc.buyerShipping);
    setSellerShipping(calc.sellerShipping);
    setPackagingCost(calc.packagingCost);
    setOtherExpenses(calc.otherExpenses);
    setMktFeeRatePct(calc.marketplaceFeeRate * 100);
    setPayFeeRatePct(calc.paymentFeeRate * 100);
    setPayFeeFixed(calc.paymentFeeFixed);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Profit & Margin Calculator
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Calculate net earnings, marketplace commissions, payment processor drag, and break-even thresholds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Inputs Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Product / Item Title
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Vintage Nike Windbreaker / Pokemon Booster Box"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Marketplace Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Selling Marketplace
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {(['ebay', 'whatnot', 'amazon', 'etsy', 'mercari', 'poshmark', 'custom'] as MarketplaceKey[]).map(
                (m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => handleMarketplaceChange(m)}
                    className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all capitalize text-center truncate ${
                      selectedMarketplace === m
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {m === 'custom' ? 'Custom' : m}
                  </button>
                )
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{currentConfig.description}</span>
            </p>
          </div>

          {/* Primary Financial Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Purchase Price (COGS) ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400">What you paid for the item</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expected Selling Price ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={expectedSalePrice}
                onChange={(e) => setExpectedSalePrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400">Item list price (excluding shipping)</span>
            </div>
          </div>

          {/* Shipping & Handling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400">0 if offering free shipping</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Actual Seller Shipping Label ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={sellerShipping}
                onChange={(e) => setSellerShipping(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400">Cost of USPS/UPS carrier label</span>
            </div>
          </div>

          {/* Packaging & Additional Costs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Packaging & Box Cost ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={packagingCost}
                onChange={(e) => setPackagingCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400">Poly mailer, tape, bubble wrap</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Other Expenses ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={otherExpenses}
                onChange={(e) => setOtherExpenses(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400">Cleaning, authentication, batteries</span>
            </div>
          </div>

          {/* Fee Adjustments Drawer (Editable Fee Rates) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-bold text-slate-800">
              Editable Marketplace Fee Rates (Customizable)
            </span>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  Commission %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.05"
                  value={mktFeeRatePct}
                  onChange={(e) => setMktFeeRatePct(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded font-mono-numbers"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  Processing %
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.05"
                  value={payFeeRatePct}
                  onChange={(e) => setPayFeeRatePct(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded font-mono-numbers"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  Fixed Fee ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={payFeeFixed}
                  onChange={(e) => setPayFeeFixed(parseFloat(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded font-mono-numbers"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500">
              *Category fee schedules vary. Adjust these percentages to match specific category promotional rates.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveCalculation}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Calculation</span>
            </button>

            <button
              type="button"
              onClick={handleTransferToInventory}
              className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Package className="w-3.5 h-3.5 text-emerald-600" />
              <span>Push to Inventory</span>
            </button>

            <button
              type="button"
              onClick={handleLogAsSold}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Log Direct Sale</span>
            </button>
          </div>
        </div>

        {/* Right Column: Calculated Results Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Net Realized Profit
                </span>
                <p
                  className={`text-3xl sm:text-4xl font-extrabold font-mono-numbers ${
                    results.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(results.netProfit)}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  Profit Margin
                </span>
                <p
                  className={`text-2xl font-bold font-mono-numbers ${
                    results.profitMargin >= 25 ? 'text-emerald-400' : 'text-amber-300'
                  }`}
                >
                  {results.profitMargin.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Core Financial KPI Row */}
            <div className="grid grid-cols-2 gap-4 text-xs font-mono-numbers bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-[11px] text-slate-400 font-sans">Return on Investment (ROI)</span>
                <p className="text-lg font-bold text-white mt-0.5">
                  {formatPercent(results.roi)}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 font-sans">Break-Even Sale Price</span>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">
                  {formatCurrency(results.breakEvenPrice)}
                </p>
              </div>
            </div>

            {/* Granular Cost Ledger */}
            <div className="space-y-2.5 text-xs border-t border-slate-800 pt-4">
              <div className="flex justify-between text-slate-300">
                <span>Gross Revenue (Item + Buyer Shipping):</span>
                <span className="font-mono-numbers text-white">{formatCurrency(results.grossRevenue)}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Purchase Cost (COGS):</span>
                <span className="font-mono-numbers text-rose-400">-{formatCurrency(purchasePrice)}</span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Estimated Marketplace Commission:</span>
                <span className="font-mono-numbers text-rose-400">
                  -{formatCurrency(results.marketplaceFeeAmount)}
                </span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Payment Processing Fee:</span>
                <span className="font-mono-numbers text-rose-400">
                  -{formatCurrency(results.paymentFeeAmount)}
                </span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Actual Carrier Shipping Paid:</span>
                <span className="font-mono-numbers text-rose-400">
                  -{formatCurrency(sellerShipping)}
                </span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Packaging Supplies & Other:</span>
                <span className="font-mono-numbers text-rose-400">
                  -{formatCurrency(packagingCost + otherExpenses)}
                </span>
              </div>

              <div className="flex justify-between text-slate-300 border-t border-slate-800/80 pt-2 font-semibold">
                <span>Total Deductions & Costs:</span>
                <span className="font-mono-numbers text-rose-400">
                  -{formatCurrency(results.totalCosts)}
                </span>
              </div>
            </div>

            {/* Mandatory Regulatory/Transparency Disclaimer */}
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed">
              <strong>Important Notice:</strong> Fee calculations are estimates based on standard published schedules. Exact marketplace fees vary by category, seller status, promotional rates, and state sales taxes collected. Never rely on estimates as guaranteed official figures.
            </div>
          </div>

          {/* Saved Calculations Drawer */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Saved Profit Calculations</h3>
              <span className="text-xs text-slate-400 font-mono-numbers">
                {savedCalculations.length} saved
              </span>
            </div>

            {savedCalculations.length > 0 ? (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {savedCalculations.map((calc) => (
                  <div
                    key={calc.id}
                    className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 transition-colors flex items-center justify-between gap-3 text-xs"
                  >
                    <div
                      onClick={() => loadPreviousCalc(calc)}
                      className="cursor-pointer space-y-0.5 flex-1 truncate"
                    >
                      <p className="font-semibold text-slate-900 truncate">{calc.productName}</p>
                      <p className="text-[11px] text-slate-500">
                        {calc.marketplace.toUpperCase()} · Cost ${calc.purchasePrice} → Sale ${calc.expectedSalePrice}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 font-mono-numbers">
                          {formatCurrency(calc.netProfit)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono-numbers">
                          {calc.profitMargin.toFixed(1)}%
                        </p>
                      </div>

                      <button
                        onClick={() => deleteCalculation(calc.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="Delete calculation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                No calculations saved yet. Hit "Save Calculation" to store items for future reference.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
