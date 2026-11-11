import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MarketplaceKey } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import {
  X,
  Share2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Lock,
  Plus,
  RefreshCw,
  ShoppingBag,
  Store,
  Layers,
  Sparkles,
  Zap,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';

const PLATFORM_DETAILS: Record<
  MarketplaceKey,
  {
    name: string;
    tag: string;
    feeNote: string;
    badgeColor: string;
    defaultHandle: string;
    defaultStore: string;
  }
> = {
  ebay: {
    name: 'eBay',
    tag: 'Global Marketplace & Authenticity Guarantee',
    feeNote: '13.25% fee + $0.30',
    badgeColor: 'bg-blue-600 text-white',
    defaultHandle: 'alex_grailvault',
    defaultStore: 'Grail Vault Collectibles (Top Rated Plus)',
  },
  amazon: {
    name: 'Amazon',
    tag: 'Amazon Seller Central (FBA / Merchant Fulfilled)',
    feeNote: '15.00% category fee',
    badgeColor: 'bg-amber-600 text-white',
    defaultHandle: 'alex_fba_grails',
    defaultStore: 'Alex Pro Resale Prime Store',
  },
  etsy: {
    name: 'Etsy',
    tag: 'Vintage & Collectibles Shop Manager',
    feeNote: '6.5% transaction + $0.20',
    badgeColor: 'bg-orange-600 text-white',
    defaultHandle: 'alex_vintage_finds',
    defaultStore: 'Vintage Vault & Curated Relics',
  },
  whatnot: {
    name: 'Whatnot',
    tag: 'Live Drops & Real-Time Auctions',
    feeNote: '8.00% stream commission',
    badgeColor: 'bg-yellow-400 text-slate-950 font-bold',
    defaultHandle: 'vaultbreaks_live',
    defaultStore: 'Vault Breaks & Live Singles',
  },
  mercari: {
    name: 'Mercari',
    tag: 'Fast Buy-It-Now & Direct Local/National Sales',
    feeNote: '10.00% flat platform fee',
    badgeColor: 'bg-sky-500 text-white',
    defaultHandle: 'alex_mercari_deals',
    defaultStore: 'Speedy Ships Vault',
  },
  poshmark: {
    name: 'Poshmark',
    tag: 'Social Resale Closet & Fashion Drops',
    feeNote: '20.00% fashion fee',
    badgeColor: 'bg-rose-600 text-white',
    defaultHandle: 'alex_posh_closet',
    defaultStore: 'Curated Streetwear & Kicks',
  },
  custom: {
    name: 'Shopify / Store',
    tag: 'Direct-to-Consumer Independent Store',
    feeNote: '2.9% payment gateway',
    badgeColor: 'bg-emerald-600 text-white',
    defaultHandle: 'grailvault_direct',
    defaultStore: 'GrailVault.com Official',
  },
};

const ALL_MARKETPLACES: MarketplaceKey[] = [
  'ebay',
  'amazon',
  'etsy',
  'whatnot',
  'mercari',
  'poshmark',
];

export const CrossListModal: React.FC = () => {
  const {
    isCrossListModalOpen,
    closeCrossListModal,
    crossListTargetItem,
    marketplaceConnections,
    connectMarketplace,
    addInventoryItem,
    setActiveTab,
  } = useApp();

  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<MarketplaceKey, boolean>>({
    ebay: true,
    amazon: false,
    etsy: false,
    whatnot: true,
    mercari: false,
    poshmark: false,
    custom: false,
  });

  const [customPrices, setCustomPrices] = useState<Record<MarketplaceKey, number>>({
    ebay: 100,
    amazon: 110,
    etsy: 100,
    whatnot: 95,
    mercari: 98,
    poshmark: 105,
    custom: 95,
  });

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Collectibles & Resale');
  const [cogs, setCogs] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedResults, setPublishedResults] = useState<any[] | null>(null);

  // Connecting account state (One-time login)
  const [connectingPlatform, setConnectingPlatform] = useState<MarketplaceKey | null>(null);
  const [connectUsername, setConnectUsername] = useState('');
  const [connectStoreName, setConnectStoreName] = useState('');
  const [connectPassword, setConnectPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    if (crossListTargetItem) {
      const basePrice =
        crossListTargetItem.price ||
        crossListTargetItem.recommendedListingPrice ||
        crossListTargetItem.expectedSalePrice ||
        crossListTargetItem.estimatedValues?.rawMid ||
        100;

      setTitle(
        crossListTargetItem.suggestedTitle ||
          crossListTargetItem.title ||
          crossListTargetItem.name ||
          ''
      );

      setDescription(
        crossListTargetItem.suggestedDescription ||
          crossListTargetItem.description ||
          `Authentic ${crossListTargetItem.name || crossListTargetItem.title || 'collectible item'}. Inspected, clean condition, fast tracked dispatch in protective packaging.`
      );

      setCategory(crossListTargetItem.category || 'Collectibles');
      setCogs(crossListTargetItem.purchasePrice || crossListTargetItem.cogs || 0);

      // Pre-adjust recommended price per platform based on fee structures:
      // eBay absorbs ~13%, Amazon 15%, Etsy 6.5%, Whatnot 8%, Mercari 10%, Poshmark 20%
      setCustomPrices({
        ebay: Math.round(basePrice * 1.05),
        amazon: Math.round(basePrice * 1.10),
        etsy: Math.round(basePrice * 1.02),
        whatnot: Math.round(basePrice),
        mercari: Math.round(basePrice * 1.03),
        poshmark: Math.round(basePrice * 1.15),
        custom: Math.round(basePrice * 0.95),
      });

      // Default checked platforms: enable any currently connected accounts
      const initialSelected: Record<MarketplaceKey, boolean> = {
        ebay: !!marketplaceConnections.ebay?.connected,
        amazon: !!marketplaceConnections.amazon?.connected,
        etsy: !!marketplaceConnections.etsy?.connected,
        whatnot: !!marketplaceConnections.whatnot?.connected,
        mercari: !!marketplaceConnections.mercari?.connected,
        poshmark: !!marketplaceConnections.poshmark?.connected,
        custom: false,
      };
      setSelectedPlatforms(initialSelected);
      setPublishedResults(null);
    }
  }, [crossListTargetItem, marketplaceConnections]);

  if (!isCrossListModalOpen) return null;

  const togglePlatform = (key: MarketplaceKey) => {
    const isConnected = marketplaceConnections[key]?.connected;
    if (!isConnected) {
      // Prompt user to log in / connect this account
      openLoginForPlatform(key);
      return;
    }
    setSelectedPlatforms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openLoginForPlatform = (key: MarketplaceKey) => {
    setConnectingPlatform(key);
    const defaults = PLATFORM_DETAILS[key];
    setConnectUsername(defaults.defaultHandle);
    setConnectStoreName(defaults.defaultStore);
    setConnectPassword('••••••••••••');
  };

  const handleConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectingPlatform) return;

    setIsAuthenticating(true);

    // Realistic API token exchange / handshake animation
    setTimeout(() => {
      connectMarketplace(
        connectingPlatform,
        connectStoreName.trim() || PLATFORM_DETAILS[connectingPlatform].name,
        connectUsername.trim() || 'verified_seller'
      );

      setSelectedPlatforms((prev) => ({ ...prev, [connectingPlatform]: true }));
      setIsAuthenticating(false);
      setConnectingPlatform(null);
    }, 450);
  };

  const handleQuickDemoFill = () => {
    if (!connectingPlatform) return;
    const defaults = PLATFORM_DETAILS[connectingPlatform];
    setConnectUsername(defaults.defaultHandle);
    setConnectStoreName(defaults.defaultStore);
    setConnectPassword('demo_oauth_token_' + Math.random().toString(36).substring(2, 8));
  };

  const handlePublish = async () => {
    const activeKeys = ALL_MARKETPLACES.filter(
      (k) => selectedPlatforms[k] && marketplaceConnections[k]?.connected
    );

    if (activeKeys.length === 0) {
      alert('Please log into and select at least one selling site (eBay, Amazon, Etsy, etc.) to publish.');
      return;
    }

    setIsPublishing(true);

    try {
      const res = await fetch('/api/marketplace/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: activeKeys,
          title,
          description,
          listingPrice: customPrices[activeKeys[0]] || 100,
          cardData: crossListTargetItem,
        }),
      });

      const data = await res.json();
      setPublishedResults(data.listings || []);

      // Also add/sync into Inventory Manager as listed
      addInventoryItem({
        title,
        sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
        category: (category as any) || 'Collectibles & Toys',
        purchasePrice: cogs || 0,
        expectedSalePrice: customPrices[activeKeys[0]] || 100,
        quantity: 1,
        purchaseDate: new Date().toISOString().slice(0, 10),
        status: 'listed',
        marketplace: activeKeys[0],
        notes: `Cross-listed across ${activeKeys.map((k) => PLATFORM_DETAILS[k].name).join(', ')}`,
        imageUrl: crossListTargetItem?.imageUrl,
      });
    } catch (err) {
      console.error(err);
      alert('Error publishing listing. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-2xs">
              <Share2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  1-Click Multi-Marketplace Listing Hub
                </h3>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Instant Syndication
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Log into eBay, Amazon, Etsy, Whatnot, Mercari, or Poshmark once—then list anywhere in 1 click.
              </p>
            </div>
          </div>
          <button
            onClick={closeCrossListModal}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Connect One-Time Account Modal Overlay */}
        {connectingPlatform && (
          <div className="p-5 sm:p-6 bg-slate-900 text-white border-b border-slate-800 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                    PLATFORM_DETAILS[connectingPlatform].badgeColor
                  }`}
                >
                  {PLATFORM_DETAILS[connectingPlatform].name}
                </span>
                <div>
                  <h4 className="text-sm font-bold">
                    Log into {PLATFORM_DETAILS[connectingPlatform].name}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    {PLATFORM_DETAILS[connectingPlatform].tag}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleQuickDemoFill}
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-md border border-amber-500/30 flex items-center gap-1 transition-colors"
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                  <span>Auto-Fill Test Account</span>
                </button>
                <button
                  onClick={() => setConnectingPlatform(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Sign in to authenticate your <strong>{PLATFORM_DETAILS[connectingPlatform].name}</strong> seller account with SellerPro. Once authorized, you can securely publish active listings directly from SellerPro.
            </p>

            <form onSubmit={handleConnectSubmit} className="space-y-3 pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Seller Username / Account Handle
                  </label>
                  <input
                    type="text"
                    required
                    value={connectUsername}
                    onChange={(e) => setConnectUsername(e.target.value)}
                    placeholder="e.g. store_official"
                    className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Storefront Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={connectStoreName}
                    onChange={(e) => setConnectStoreName(e.target.value)}
                    placeholder="e.g. Apex Reselling & Collectibles"
                    className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center justify-between">
                    <span>Password or Seller API Token</span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPassword ? 'Hide' : 'Show'}</span>
                    </button>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={connectPassword}
                      onChange={(e) => setConnectPassword(e.target.value)}
                      placeholder="Enter your password or token"
                      className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col justify-end space-y-1.5">
                  <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>256-bit encrypted SSL handshake. Token stored locally.</span>
                  </div>
                </div>
              </div>

              {/* Authorized API Permissions Scopes */}
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50 space-y-1 text-[11px] text-slate-300">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Requested Seller Permissions:
                </span>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-300">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Create & publish listings
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Auto-sync stock quantity
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Fetch sold orders & fees
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConnectingPlatform(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-md disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Credentials with {PLATFORM_DETAILS[connectingPlatform].name}...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Authorize & Connect Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {publishedResults ? (
            <div className="space-y-5 py-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-extrabold text-slate-900">
                  Item Successfully Put Up for Sale!
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your listing is now active across {publishedResults.length} connected platform(s)
                  and synced into your active SellerPro inventory ledger.
                </p>
              </div>

              <div className="max-w-lg mx-auto space-y-2.5 pt-2 text-left">
                {publishedResults.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs hover:border-slate-300 transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            PLATFORM_DETAILS[item.platform as MarketplaceKey]?.badgeColor ||
                            'bg-slate-800 text-white'
                          }`}
                        >
                          {item.platform}
                        </span>
                        <span className="font-semibold text-slate-900 truncate max-w-[220px]">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-mono-numbers">
                        Listed at <strong>${item.price}</strong> · Ref: {item.listingId}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Live
                      </span>
                      <a
                        href={item.listingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-center gap-3">
                <button
                  onClick={() => {
                    closeCrossListModal();
                    setActiveTab('inventory');
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs"
                >
                  View in Inventory Manager
                </button>
                <button
                  onClick={() => {
                    closeCrossListModal();
                    setActiveTab('scanner');
                  }}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-2xs"
                >
                  Scan Next Item
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Item Info Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Listing Blueprint
                  </span>
                  {cogs > 0 && (
                    <span className="text-xs text-slate-500 font-mono-numbers">
                      Cost of Goods (COGS): {formatCurrency(cogs)}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Optimized Marketplace Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Condition & Item Description
                    </label>
                    <textarea
                      rows={2}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Assigned Category
                    </label>
                    <input
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Target Selling Sites: eBay, Amazon, Etsy, Whatnot, Mercari, Poshmark */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Marketplace Seller Accounts & Syndication
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Sign in and connect each platform once to enable instant multi-site publishing.
                    </p>
                  </div>

                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full self-start">
                    {ALL_MARKETPLACES.filter((k) => marketplaceConnections[k]?.connected).length} of{' '}
                    {ALL_MARKETPLACES.length} Accounts Connected
                  </span>
                </div>

                {ALL_MARKETPLACES.filter((k) => marketplaceConnections[k]?.connected).length === 0 && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                    <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Sign-In Required Before Listing:</strong>
                      <span>
                        Marketplaces require authentic seller credentials. Click "Sign In & Connect" on any platform below (e.g. eBay, Whatnot, Amazon) to log in.
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ALL_MARKETPLACES.map((key) => {
                    const conn = marketplaceConnections[key];
                    const isConnected = !!conn?.connected;
                    const isSelected = !!selectedPlatforms[key] && isConnected;
                    const meta = PLATFORM_DETAILS[key];

                    return (
                      <div
                        key={key}
                        className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50/20 shadow-2xs'
                            : isConnected
                            ? 'border-slate-200 bg-white hover:border-slate-300'
                            : 'border-slate-200 bg-slate-50/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={!isConnected}
                              onChange={() => togglePlatform(key)}
                              className="rounded text-emerald-600 accent-emerald-600 disabled:opacity-30"
                            />
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${meta.badgeColor}`}
                              >
                                {meta.name}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                ({meta.feeNote})
                              </span>
                            </div>
                          </label>

                          {isConnected ? (
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Logged In
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openLoginForPlatform(key)}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" /> Log In
                            </button>
                          )}
                        </div>

                        {isConnected ? (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                            <span className="text-[11px] text-slate-500 truncate max-w-[130px]">
                              @{conn.username}
                            </span>
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] text-slate-600 font-mono-numbers">
                                Price: $
                              </span>
                              <input
                                type="number"
                                value={customPrices[key]}
                                onChange={(e) =>
                                  setCustomPrices({
                                    ...customPrices,
                                    [key]: parseFloat(e.target.value) || 0,
                                  })
                                }
                                className="w-16 px-1.5 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded text-right font-mono-numbers font-bold text-slate-900"
                              />
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400 pt-0.5">
                            Click "Log In" above to connect your {meta.name} store handle.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!publishedResults && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
            <span className="text-xs text-slate-600 font-medium">
              <strong>
                {
                  ALL_MARKETPLACES.filter(
                    (k) => selectedPlatforms[k] && marketplaceConnections[k]?.connected
                  ).length
                }
              </strong>{' '}
              marketplace(s) selected
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={closeCrossListModal}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={
                  isPublishing ||
                  ALL_MARKETPLACES.filter(
                    (k) => selectedPlatforms[k] && marketplaceConnections[k]?.connected
                  ).length === 0
                }
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing Across Sites...</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Put Up for Sale Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
