import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bot,
  Sparkles,
  Send,
  Zap,
  TrendingDown,
  FileText,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  Layers,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { formatCurrency } from '../../utils/calculations';

export const AIAssistantView: React.FC = () => {
  const { user, sales, inventory, setIsStripeModalOpen, setPendingUpgradePlan } = useApp();

  const [activeAITool, setActiveAITool] = useState<'audit' | 'listing' | 'chat'>('audit');

  // Audit State
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [auditFallbackNote, setAuditFallbackNote] = useState<string | null>(null);

  // Listing Generator State
  const [listingItemTitle, setListingItemTitle] = useState('1999 Pokemon Base Set Charizard Holo PSA 8');
  const [listingCategory, setListingCategory] = useState('Trading Cards');
  const [listingCondition, setListingCondition] = useState('Graded PSA 8 NM-MT');
  const [listingPlatform, setListingPlatform] = useState('ebay');
  const [listingDetails, setListingDetails] = useState('Fresh slab from PSA submission. Clean holo foil, minor silvering on left border. Shipped in bubble mailer inside box.');
  const [isGeneratingListing, setIsGeneratingListing] = useState(false);
  const [optimizedListingData, setOptimizedListingData] = useState<any>(null);
  const [copiedTitle, setCopiedTitle] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: "Hello! I'm your SellerPro AI business consultant. I have real-time visibility into your inventory and sales ledger. You can ask me about margin leaks, slow-moving items, or advice on counter-offers.",
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);

  // Real aggregate context for AI prompt
  const totalRevenue = sales.reduce((acc, s) => acc + s.grossRevenue, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.netProfit, 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const activeItems = inventory.filter((i) => i.status === 'listed');
  const totalCost = activeItems.reduce((acc, i) => acc + i.purchasePrice * i.quantity, 0);

  const lowMarginItems = activeItems
    .filter((i) => {
      const margin = i.expectedSalePrice > 0 ? ((i.expectedSalePrice - i.purchasePrice) / i.expectedSalePrice) * 100 : 0;
      return margin < 25;
    })
    .map((i) => ({ title: i.title, cost: i.purchasePrice, price: i.expectedSalePrice }));

  const businessContext = {
    totalSalesCount: sales.length,
    totalRevenue,
    totalProfit,
    avgMargin,
    activeInventoryCount: activeItems.length,
    totalInventoryCost: totalCost,
    lowMarginItems,
  };

  const runBusinessAudit = async () => {
    setIsAuditing(true);
    setAuditResult(null);
    setAuditFallbackNote(null);

    try {
      const res = await fetch('/api/ai/seller-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'audit',
          context: businessContext,
        }),
      });

      const data = await res.json();
      setAuditResult(data.response || 'No audit response received.');
      if (data.isFallback && data.note) {
        setAuditFallbackNote(data.note);
      }
    } catch (err: any) {
      setAuditResult('Error connecting to business auditor. Switched to offline heuristic analysis.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleGenerateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingListing(true);
    setOptimizedListingData(null);

    try {
      const res = await fetch('/api/ai/optimize-listing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: listingItemTitle,
          category: listingCategory,
          condition: listingCondition,
          platform: listingPlatform,
          details: listingDetails,
        }),
      });

      const json = await res.json();
      setOptimizedListingData(json.data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsGeneratingListing(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputQuery('');
    setIsQuerying(true);

    try {
      const res = await fetch('/api/ai/seller-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          context: businessContext,
          mode: 'chat',
        }),
      });

      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.response || 'No response returned from model.',
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Unable to reach the assistant service right now. Please try again shortly.',
        },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              AI Seller Assistant
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
              Gemini 3.8 Flash
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit your sales, identify low margin products, optimize listing titles, and diagnose inventory velocity.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveAITool('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeAITool === 'audit'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Business Audit
          </button>
          <button
            onClick={() => setActiveAITool('listing')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeAITool === 'listing'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Listing Optimizer
          </button>
          <button
            onClick={() => setActiveAITool('chat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeAITool === 'chat'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ask SellerPro AI
          </button>
        </div>
      </div>

      {/* Tool 1: Business Audit */}
      {activeAITool === 'audit' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Run Real-Time Portfolio & Sales Audit
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                The assistant analyzes your <strong>{sales.length} sales</strong> and{' '}
                <strong>{activeItems.length} active inventory items</strong> to spotlight fee drainers,
                margin risks, and trapped capital.
              </p>
            </div>

            <button
              onClick={runBusinessAudit}
              disabled={isAuditing}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAuditing ? 'Analyzing Store Numbers...' : 'Generate Store Audit'}</span>
            </button>
          </div>

          {auditFallbackNote && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{auditFallbackNote}</span>
            </div>
          )}

          {auditResult && (
            <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  SellerPro Strategic Intelligence Report
                </span>
                <span className="text-[11px] text-slate-400">
                  Generated {new Date().toLocaleTimeString()}
                </span>
              </div>

              <div className="prose prose-sm max-w-none text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans">
                {auditResult}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tool 2: Listing Optimizer */}
      {activeAITool === 'listing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Listing Form */}
          <form
            onSubmit={handleGenerateListing}
            className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item Title
              </label>
              <input
                type="text"
                required
                value={listingItemTitle}
                onChange={(e) => setListingItemTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={listingCategory}
                  onChange={(e) => setListingCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="Trading Cards">Trading Cards</option>
                  <option value="Sneakers & Streetwear">Sneakers & Streetwear</option>
                  <option value="Video Games">Video Games</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Clothing">Clothing</option>
                  <option value="Collectibles">Collectibles</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Marketplace
                </label>
                <select
                  value={listingPlatform}
                  onChange={(e) => setListingPlatform(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg capitalize"
                >
                  <option value="ebay">eBay (80 char limit)</option>
                  <option value="whatnot">Whatnot (Stream title)</option>
                  <option value="amazon">Amazon</option>
                  <option value="mercari">Mercari</option>
                  <option value="etsy">Etsy</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Condition Grade
              </label>
              <input
                type="text"
                value={listingCondition}
                onChange={(e) => setListingCondition(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Condition Notes & Inclusions
              </label>
              <textarea
                rows={3}
                value={listingDetails}
                onChange={(e) => setListingDetails(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isGeneratingListing}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isGeneratingListing ? 'Optimizing Listing...' : 'Generate SEO Listing'}</span>
            </button>
          </form>

          {/* Generated Listing Preview */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
            {optimizedListingData ? (
              <div className="space-y-4">
                {/* Optimized Title */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      SEO Optimized Title ({optimizedListingData.optimizedTitle?.length || 0} chars)
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(optimizedListingData.optimizedTitle);
                        setCopiedTitle(true);
                        setTimeout(() => setCopiedTitle(false), 2000);
                      }}
                      className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      {copiedTitle ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTitle ? 'Copied' : 'Copy Title'}</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 font-mono">
                    {optimizedListingData.optimizedTitle}
                  </div>
                </div>

                {/* Keywords Tags */}
                {optimizedListingData.keywords && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-slate-600">Search Keyword Tags:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {optimizedListingData.keywords.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Condition-Graded Description
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(optimizedListingData.description);
                        setCopiedDesc(true);
                        setTimeout(() => setCopiedDesc(false), 2000);
                      }}
                      className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      {copiedDesc ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDesc ? 'Copied' : 'Copy Description'}</span>
                    </button>
                  </div>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                    {optimizedListingData.description}
                  </div>
                </div>

                {/* Pricing Strategy Advice */}
                {optimizedListingData.pricingTip && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                    <strong>Listing Format Tip:</strong> {optimizedListingData.pricingTip}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p>Fill in item details on the left and click "Generate SEO Listing" to create high-ranking copy.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tool 3: Chat Assistant */}
      {activeAITool === 'chat' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col h-[520px] overflow-hidden">
          {/* Chat Feed */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`p-3.5 rounded-2xl max-w-lg ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs whitespace-pre-wrap'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isQuerying && (
              <div className="flex gap-3 text-xs text-slate-400 items-center">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <span>SellerPro AI is calculating response...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-4 border-t border-slate-100 flex items-center gap-2 bg-slate-50/50"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about sales trends, fee advice, or sourcing strategies..."
              className="flex-1 px-3.5 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              type="submit"
              disabled={isQuerying || !inputQuery.trim()}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
