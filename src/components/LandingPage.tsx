import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import {
  TrendingUp,
  ShieldCheck,
  Calculator,
  Boxes,
  Sparkles,
  Search,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  Layers,
  Zap,
  BarChart3,
  DollarSign,
  Package,
} from 'lucide-react';
import { computeProfitBreakdown, formatCurrency } from '../utils/calculations';
import { MarketplaceKey, PlanType } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

export const LandingPage: React.FC = () => {
  const {
    setActiveTab,
    setIsAuthModalOpen,
    loginAsDemoUser,
    setIsStripeModalOpen,
    setPendingUpgradePlan,
    openAdminModal,
  } = useApp();

  // Interactive Live Calculator Sandbox on Landing Page
  const [calcMarketplace, setCalcMarketplace] = useState<MarketplaceKey>('ebay');
  const [calcSalePrice, setCalcSalePrice] = useState<number>(140);
  const [calcPurchasePrice, setCalcPurchasePrice] = useState<number>(45);
  const [calcShippingCharged, setCalcShippingCharged] = useState<number>(10);
  const [calcShippingCost, setCalcShippingCost] = useState<number>(7.50);

  // Fee rates lookup
  const feeRateMap: Record<MarketplaceKey, { mkt: number; pay: number; fixed: number }> = {
    ebay: { mkt: 0.1325, pay: 0, fixed: 0.30 },
    whatnot: { mkt: 0.08, pay: 0.029, fixed: 0.30 },
    amazon: { mkt: 0.15, pay: 0, fixed: 0.99 },
    etsy: { mkt: 0.065, pay: 0.03, fixed: 0.45 },
    mercari: { mkt: 0.10, pay: 0.029, fixed: 0.50 },
    poshmark: { mkt: 0.20, pay: 0, fixed: 0 },
    custom: { mkt: 0.05, pay: 0.029, fixed: 0.30 },
  };

  const currentRates = feeRateMap[calcMarketplace];
  const quickCalc = computeProfitBreakdown({
    purchasePrice: calcPurchasePrice,
    expectedSalePrice: calcSalePrice,
    marketplace: calcMarketplace,
    marketplaceFeeRate: currentRates.mkt,
    paymentFeeRate: currentRates.pay,
    paymentFeeFixed: currentRates.fixed,
    buyerShipping: calcShippingCharged,
    sellerShipping: calcShippingCost,
    packagingCost: 2.00,
    otherExpenses: 0,
  });

  // Annual billing toggle for pricing section (-20%)
  const [isAnnual, setIsAnnual] = useState(false);

  // FAQ Accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Which marketplaces does SellerPro support?',
      a: 'SellerPro has built-in presets for eBay, Whatnot, Amazon FBM, Etsy, Poshmark, Mercari, as well as a customizable rate engine for local cash sales, conventions, Instagram sales, and Shopify.',
    },
    {
      q: 'How does SellerPro handle variable category fee rates?',
      a: 'Every platform fee rate is completely editable. For instance, while eBay standard is 13.25%, sneakers over $150 or trading cards have distinct rates. You can freely adjust the percentage and fixed fee per calculation or customize default presets.',
    },
    {
      q: 'Can I export my sales and inventory for tax season and accounting?',
      a: 'Yes. With one click, download complete CSV ledgers showing date sold, gross revenue, cost of goods sold (COGS), marketplace fee breakdowns, seller shipping, and realized net profit.',
    },
    {
      q: 'Is my reseller business data private?',
      a: 'Yes. Every user account has an isolated database sandbox. You can also connect your own Supabase PostgreSQL database directly using our supplied Row Level Security (RLS) schema.',
    },
    {
      q: 'How does the Deal Finder work?',
      a: 'When thrifting, attending card shows, or buying bulk inventory lots, you enter the asking price and realistic comps. SellerPro immediately calculates your net profit, ROI, break-even target, and flags margin risks before you commit capital.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-28 border-b border-slate-200 bg-white">
        {/* Subtle geometric background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Headline Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Engineered specifically for online resellers & volume flippers</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1] text-balance">
                Your entire reselling business. <span className="text-emerald-600">One powerful dashboard.</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl text-balance">
                Track inventory, calculate profits, manage sales, and make smarter buying decisions with SellerPro.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-2 text-sm sm:text-base group"
                >
                  <span>Start Free Account</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>

                <PWAInstallButton variant="hero" />

                <button
                  onClick={loginAsDemoUser}
                  className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 font-semibold border border-slate-300 rounded-xl transition-colors text-sm sm:text-base flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <span>Explore Live Demo Store</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-500">
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> No credit card required
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> 100% private data isolation
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5 font-medium text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant CSV accounting export
                </span>
              </div>
            </div>

            {/* Right Column: Hero Visual Asset */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 shadow-xl bg-slate-900">
                <img
                  src="/src/assets/images/sellerpro_hero_mockup_1794265382959.jpg"
                  alt="SellerPro Dashboard Interface Mockup"
                  className="w-full h-auto object-cover transform hover:scale-[1.01] transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-5">
                  <div className="text-white space-y-1">
                    <p className="text-xs uppercase font-bold tracking-wider text-emerald-400">
                      Realized Profit Tracking
                    </p>
                    <p className="text-sm font-semibold">
                      Automated fee deductions for eBay, Whatnot, Amazon, and Etsy.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Item KPI Proof Strip */}
      <section className="bg-slate-900 text-white py-8 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono-numbers">
                6+ Platforms
              </p>
              <p className="text-xs text-slate-400">eBay, Whatnot, Amazon, Etsy, Poshmark & Custom</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono-numbers">
                100% Tax Ready
              </p>
              <p className="text-xs text-slate-400">Accurate COGS tracking & instant Schedule C export</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono-numbers">
                Break-Even Math
              </p>
              <p className="text-xs text-slate-400">Algorithmic floor prices so you never flip at a loss</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl sm:text-3xl font-extrabold text-white font-mono-numbers">
                Sourcing Score
              </p>
              <p className="text-xs text-slate-400">Buy-side margin & ROI risk evaluation on the go</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Fee & Profit Sandbox on Landing Page */}
      <section id="calculator-preview" className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Interactive Sandbox
            </span>
            <h2 className="text-3xl font-bold text-slate-900">
              See exactly what you keep on your next flip
            </h2>
            <p className="text-slate-600 text-sm sm:text-base">
              Try the live fee engine right now. Adjust your purchase cost and expected price to reveal your true net profit.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Inputs */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Selling Marketplace
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['ebay', 'whatnot', 'amazon', 'etsy', 'poshmark', 'mercari'] as MarketplaceKey[]).map(
                      (mk) => (
                        <button
                          key={mk}
                          type="button"
                          onClick={() => setCalcMarketplace(mk)}
                          className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors capitalize ${
                            calcMarketplace === mk
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {mk}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Sale Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={calcSalePrice}
                      onChange={(e) => setCalcSalePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Purchase Cost / COGS ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={calcPurchasePrice}
                      onChange={(e) => setCalcPurchasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Buyer Shipping ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={calcShippingCharged}
                      onChange={(e) => setCalcShippingCharged(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Actual Shipping Cost ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={calcShippingCost}
                      onChange={(e) => setCalcShippingCost(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg font-mono-numbers focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Computed Output Box */}
              <div className="bg-slate-900 rounded-xl p-6 text-white space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Net Take-Home Profit
                  </span>
                  <span
                    className={`text-2xl font-bold font-mono-numbers ${
                      quickCalc.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(quickCalc.netProfit)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs font-mono-numbers">
                  <div>
                    <p className="text-slate-400 font-sans text-[11px]">Profit Margin</p>
                    <p
                      className={`text-base font-semibold ${
                        quickCalc.profitMargin >= 25 ? 'text-emerald-400' : 'text-amber-300'
                      }`}
                    >
                      {quickCalc.profitMargin.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 font-sans text-[11px]">Return on Investment (ROI)</p>
                    <p className="text-base font-semibold text-white">
                      {quickCalc.roi.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Gross Buyer Total:</span>
                    <span className="font-mono-numbers">{formatCurrency(quickCalc.grossRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Est. Marketplace & Payment Fees:</span>
                    <span className="font-mono-numbers text-rose-400">
                      -{formatCurrency(quickCalc.totalFees)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Direct Expenses (COGS + Ship + Pack):</span>
                    <span className="font-mono-numbers text-rose-400">
                      -{formatCurrency(quickCalc.directOutPocket)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-semibold pt-1 border-t border-slate-800/60">
                    <span>Break-Even Price:</span>
                    <span className="font-mono-numbers">{formatCurrency(quickCalc.breakEvenPrice)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    loginAsDemoUser();
                    setActiveTab('calculator');
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Open Full Calculator in App</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Breakdown */}
      <section id="features" className="py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Purpose-Built Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Everything your reselling business requires
            </h2>
            <p className="text-slate-600">
              From calculating listing fees to tracking every dollar of profit across all your marketplaces.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-7 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Calculator className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Multi-Marketplace Profit Engine</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Calculate eBay final value fees, Whatnot commission, Amazon referral percentages, and Etsy processing charges in seconds. Automatically computes exact break-even pricing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-7 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Boxes className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Cost-of-Goods Inventory Manager</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Log every item with purchase date, category, status, and photos. Monitor your total active inventory cost and know exactly how much capital you have deployed.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-7 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Realized Sales & CSV Ledger</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Convert inventory into sales records with 1 click. Record actual shipping paid vs charged, net profit, and download tax-ready CSV reports for Schedule C filing.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-7 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Margin Target Pricing Assistant</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Enter your item cost and target profit margin (20%, 30%, 40%). SellerPro mathematically solves the required listing price accounting for all marketplace deductions.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="p-7 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Sourcing Deal Finder</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Grade potential yard sale, thrift, and estate finds before purchasing. Evaluates capital exposure, ROI, margin safety buffer, and calculates the maximum buy offer.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="p-7 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all space-y-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">AI Seller Assistant</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Audit your sales data to uncover slow-moving stock, generate high-ranking SEO titles within marketplace character limits, and craft condition-graded product descriptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Curated Reseller Showcase Section */}
      <section className="py-20 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                Reseller-Grade Workflows
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Built for every high-velocity category
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Whether you specialize in graded sports & TCG cards, limited-edition sneakers, retro video games, vintage apparel, or refurbished electronics—SellerPro provides the exact fee rates, category tags, and inventory metrics your workflow demands.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Graded Trading Cards (PSA / BGS / CGC)</h4>
                    <p className="text-xs text-slate-500">Track certification numbers, grading slab costs, and Whatnot live auction fees.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Sneakers & Streetwear</h4>
                    <p className="text-xs text-slate-500">Calculate tiered authentication fees on eBay and compare payouts against StockX or GOAT.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Vintage & Retro Gaming</h4>
                    <p className="text-xs text-slate-500">Log repair/testing expenses, replacement save batteries, and accessory bundles into true COGS.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-900">
              <img
                src="/src/assets/images/reseller_goods_showcase_1794265382275.jpg"
                alt="Curated Reseller Goods: Graded Pokemon Cards, Air Jordan 1s, and Game Boy"
                className="w-full h-auto object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Simple 3-Step Lifecycle
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              How SellerPro drives your business
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <span className="text-2xl font-black text-emerald-600 font-mono-numbers">01</span>
              <h3 className="text-base font-bold text-slate-900">Evaluate with Deal Finder</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Before spending capital at estate sales or online auctions, calculate your exact net payout and break-even comps.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <span className="text-2xl font-black text-emerald-600 font-mono-numbers">02</span>
              <h3 className="text-base font-bold text-slate-900">List & Price for 30%+ Margins</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Use the Pricing Assistant to automatically solve required prices and let the AI generate high-converting listing titles and condition notes.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <span className="text-2xl font-black text-emerald-600 font-mono-numbers">03</span>
              <h3 className="text-base font-bold text-slate-900">Record Sales & Export Taxes</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Click "Mark as Sold" to transfer items to your sales ledger. Track monthly revenue growth and export clean CSV spreadsheets for tax preparation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Transparent Pricing
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              Plans built to pay for themselves on your first sale
            </h2>
            <p className="text-slate-600">
              Start with the free basic tier or unlock advanced analytics, unlimited inventory, and AI tools.
            </p>

            {/* Monthly / Annual Toggle */}
            <div className="pt-4 flex items-center justify-center gap-3">
              <span className={`text-xs font-semibold ${!isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
                Monthly
              </span>
              <button
                type="button"
                onClick={() => setIsAnnual(!isAnnual)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  isAnnual ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    isAnnual ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-semibold ${isAnnual ? 'text-slate-900' : 'text-slate-500'}`}>
                Annual <span className="text-emerald-600 font-bold">(Save 20%)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* Free Tier */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Free
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 font-mono-numbers">$0</span>
                  <span className="text-xs text-slate-500">/ forever</span>
                </div>
                <p className="text-xs text-slate-600">
                  Ideal for casual garage sale flippers and beginner resellers.
                </p>

                <ul className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Basic profit calculator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Up to 15 active inventory items</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Basic dashboard metrics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Manual sales tracking</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="mt-8 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
              >
                Get Started Free
              </button>
            </div>

            {/* Pro Tier (Featured) */}
            <div className="bg-white rounded-2xl border-2 border-emerald-500 p-8 flex flex-col justify-between shadow-lg relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-3 py-0.5 rounded-full tracking-wider shadow-xs">
                Most Popular
              </div>

              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  Pro
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 font-mono-numbers">
                    {isAnnual ? '$7.92' : '$9.99'}
                  </span>
                  <span className="text-xs text-slate-500">
                    / mo {isAnnual ? '(billed $95/yr)' : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  For active resellers who source weekly and need unlimited tracking.
                </p>

                <ul className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-700">
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Unlimited inventory tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Advanced profit calculations & presets</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Comprehensive sales reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tax-ready CSV export</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Margin Target Pricing Assistant</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Sourcing Deal Finder with risk scores</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setPendingUpgradePlan('pro');
                  setIsStripeModalOpen(true);
                }}
                className="mt-8 w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Upgrade to Pro (Test Checkout)
              </button>
            </div>

            {/* Business Tier */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-between shadow-xs">
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Business
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 font-mono-numbers">
                    {isAnnual ? '$15.83' : '$19.99'}
                  </span>
                  <span className="text-xs text-slate-500">
                    / mo {isAnnual ? '(billed $190/yr)' : ''}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  For high-volume sellers, card shops, and live stream businesses.
                </p>

                <ul className="space-y-3 pt-4 border-t border-slate-100 text-xs text-slate-600">
                  <li className="flex items-center gap-2 font-medium text-slate-800">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Everything in Pro, plus:</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>AI Seller Assistant & portfolio audit</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>AI Listing Title & SEO Optimizer</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Condition-graded description generator</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>Direct Supabase PostgreSQL connection</span>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setPendingUpgradePlan('business');
                  setIsStripeModalOpen(true);
                }}
                className="mt-8 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Upgrade to Business (Test Checkout)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-20 bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-bold text-slate-900">
              Clear answers for reseller questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-slate-900 text-sm focus:outline-none"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${
                        isOpen ? 'rotate-180 text-emerald-600' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-slate-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Stop guessing fees. Start keeping more profit.
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Join online resellers scaling their eBay, Whatnot, Amazon, and Etsy businesses with SellerPro.
          </p>
          <div className="pt-2 flex flex-wrap justify-center items-center gap-4">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-lg transition-all text-sm"
            >
              Create Free Account
            </button>
            <PWAInstallButton variant="hero" />
            <button
              onClick={loginAsDemoUser}
              className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-700 transition-colors text-sm"
            >
              Explore Live Demo
            </button>
          </div>

          {/* Admin link before signing in */}
          <div className="pt-2 flex items-center justify-center">
            <button
              type="button"
              onClick={openAdminModal}
              className="text-xs text-slate-500 hover:text-emerald-400 font-mono tracking-widest cursor-pointer transition-colors py-1 px-3 rounded hover:bg-slate-800/60"
            >
              admin
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-slate-950 text-slate-500 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo theme="dark" size="sm" showTagline />
          <div className="flex items-center gap-6">
            <p>© {new Date().getFullYear()} SellerPro (sellerprohq.com). All rights reserved.</p>
            <button
              type="button"
              onClick={openAdminModal}
              className="text-slate-500 hover:text-emerald-400 font-mono text-[11px] transition-colors tracking-wider"
            >
              admin
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
