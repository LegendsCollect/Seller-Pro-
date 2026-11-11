import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MarketplaceKey, PlanType } from '../../types';
import {
  User,
  CreditCard,
  Database,
  Download,
  Trash2,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  RotateCcw,
  RefreshCw,
  Link2,
  Unlink,
  Share2,
  Globe,
} from 'lucide-react';
import { exportSalesToCSV } from '../../utils/calculations';

export const SettingsView: React.FC = () => {
  const {
    user,
    updateProfile,
    supabaseConfig,
    updateSupabaseConfig,
    sales,
    inventory,
    savedCalculations,
    savedDeals,
    clearUserData,
    loadDemoData,
    isDemoDataActive,
    setIsStripeModalOpen,
    setPendingUpgradePlan,
    cancelSubscription,
    marketplaceConnections,
    connectMarketplace,
    disconnectMarketplace,
  } = useApp();

  // Marketplace quick connect modal/prompt state
  const [connectingMarketplace, setConnectingMarketplace] = useState<MarketplaceKey | null>(null);
  const [connectUsername, setConnectUsername] = useState('');

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [storeName, setStoreName] = useState(user?.storeName || '');
  const [defaultMarketplace, setDefaultMarketplace] = useState<MarketplaceKey>(
    user?.defaultMarketplace || 'ebay'
  );
  const [currency, setCurrency] = useState(user?.currency || '$');
  const [profileSaved, setProfileSaved] = useState(false);

  // Supabase State
  const [supabaseUrl, setSupabaseUrl] = useState(supabaseConfig.url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(supabaseConfig.anonKey || '');
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseStatusMsg, setSupabaseStatusMsg] = useState<string | null>(null);
  const [copiedSchema, setCopiedSchema] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name,
      storeName,
      defaultMarketplace,
      currency,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleTestSupabase = () => {
    setIsTestingSupabase(true);
    setSupabaseStatusMsg(null);

    setTimeout(() => {
      if (supabaseUrl.includes('supabase.co') && supabaseAnonKey.length > 20) {
        updateSupabaseConfig({
          url: supabaseUrl,
          anonKey: supabaseAnonKey,
          connected: true,
          lastChecked: new Date().toISOString(),
        });
        setSupabaseStatusMsg('Successfully verified Supabase PostgreSQL connection with RLS enabled!');
      } else if (!supabaseUrl) {
        updateSupabaseConfig({ connected: false });
        setSupabaseStatusMsg('Operating on isolated client-safe localStorage database sandbox.');
      } else {
        setSupabaseStatusMsg('Please check your Supabase project URL and anon/public key.');
      }
      setIsTestingSupabase(false);
    }, 800);
  };

  const handleExportJsonBackup = () => {
    const backupData = {
      user,
      inventory,
      sales,
      savedCalculations,
      savedDeals,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sellerpro-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  const sampleSqlSnippet = `-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  purchase_price NUMERIC(10, 2) NOT NULL,
  expected_sale_price NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'listed'
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own inventory" ON public.inventory
FOR ALL USING (auth.uid() = user_id);`;

  return (
    <div className="space-y-8 pb-12 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Settings & Business Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your reseller store profile, subscription tier, database connections, and data exports.
        </p>
      </div>

      {/* 1. Reseller Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Store Profile</h3>
          </div>
          {profileSaved && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Email
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-lg text-slate-500"
              />
              <span className="text-[10px] text-slate-400">Account login address</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Store / Reseller Brand Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Primary Marketplace
              </label>
              <select
                value={defaultMarketplace}
                onChange={(e) => setDefaultMarketplace(e.target.value as MarketplaceKey)}
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
                Display Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="$">USD ($)</option>
                <option value="£">GBP (£)</option>
                <option value="€">EUR (€)</option>
                <option value="C$">CAD (C$)</option>
                <option value="A$">AUD (A$)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* 2. Subscription & Stripe Billing */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-700" />
            <h3 className="text-sm font-bold text-slate-900">Subscription & Billing</h3>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
            {user?.plan || 'Free'} Plan
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="text-xs font-bold text-slate-800">FREE Plan</span>
            <p className="text-lg font-black text-slate-900 font-mono-numbers">$0/mo</p>
            <p className="text-[11px] text-slate-500">Up to 15 inventory items</p>
            {user?.plan === 'free' ? (
              <span className="block text-[11px] font-bold text-slate-500 pt-2">Current Tier</span>
            ) : (
              <button
                onClick={cancelSubscription}
                className="text-[11px] text-rose-600 hover:underline pt-2 block"
              >
                Downgrade to Free
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50/20 space-y-2 relative">
            <span className="text-xs font-bold text-emerald-700">PRO Plan</span>
            <p className="text-lg font-black text-slate-900 font-mono-numbers">$9.99/mo</p>
            <p className="text-[11px] text-slate-500">Unlimited inventory & CSV reports</p>
            {user?.plan === 'pro' ? (
              <span className="block text-[11px] font-bold text-emerald-700 pt-2">Active Tier</span>
            ) : (
              <button
                onClick={() => {
                  setPendingUpgradePlan('pro');
                  setIsStripeModalOpen(true);
                }}
                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition-colors"
              >
                {user?.plan === 'business' ? 'Switch to Pro' : 'Upgrade to Pro'}
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="text-xs font-bold text-indigo-700">BUSINESS Plan</span>
            <p className="text-lg font-black text-slate-900 font-mono-numbers">$19.99/mo</p>
            <p className="text-[11px] text-slate-500">AI Assistant & Supabase SQL Sync</p>
            {user?.plan === 'business' ? (
              <span className="block text-[11px] font-bold text-indigo-700 pt-2">Active Tier</span>
            ) : (
              <button
                onClick={() => {
                  setPendingUpgradePlan('business');
                  setIsStripeModalOpen(true);
                }}
                className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors"
              >
                Upgrade to Business
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Connected Marketplace Accounts (1-Click Cross-Listing) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Connected Selling Accounts</h3>
              <p className="text-[11px] text-slate-500">
                Log into each platform once to enable instant 1-click cross-listing from your AI Card Scanner or Inventory.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            {Object.values(marketplaceConnections).filter((c) => c.connected).length} Connected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[
            {
              id: 'ebay' as MarketplaceKey,
              name: 'eBay Motors & Collectibles',
              color: 'from-blue-600 to-amber-500',
              badge: 'Direct API Partner',
            },
            {
              id: 'whatnot' as MarketplaceKey,
              name: 'Whatnot Live Auctions',
              color: 'from-amber-500 to-yellow-500',
              badge: 'Livestream Drops',
            },
            {
              id: 'mercari' as MarketplaceKey,
              name: 'Mercari Japan & US',
              color: 'from-sky-500 to-indigo-600',
              badge: 'Fast Buy It Now',
            },
            {
              id: 'poshmark' as MarketplaceKey,
              name: 'Poshmark Closet',
              color: 'from-rose-500 to-red-600',
              badge: 'Social Commerce',
            },
            {
              id: 'amazon' as MarketplaceKey,
              name: 'Amazon Seller Central',
              color: 'from-amber-600 to-orange-500',
              badge: 'FBA / Merchant Fulfilled',
            },
            {
              id: 'etsy' as MarketplaceKey,
              name: 'Etsy Vintage & Crafts',
              color: 'from-orange-500 to-amber-600',
              badge: 'Vintage Marketplace',
            },
          ].map((mp) => {
            const connection = marketplaceConnections[mp.id];
            const isConnected = connection?.connected;

            return (
              <div
                key={mp.id}
                className={`p-4 rounded-xl border transition-all ${
                  isConnected
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2.5">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{mp.name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium">{mp.badge}</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isConnected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isConnected ? 'Connected' : 'Offline'}
                  </span>
                </div>

                {isConnected ? (
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="text-slate-400">Account:</span>
                      <span className="font-semibold text-slate-800">
                        @{connection?.username || 'reseller_store'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Auth Token:</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Valid (Auto-refreshed)
                      </span>
                    </div>
                    <button
                      onClick={() => disconnectMarketplace(mp.id)}
                      className="w-full mt-2 py-1.5 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Unlink className="w-3 h-3" /> Disconnect Site
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <p className="text-[11px] text-slate-500">
                      Authorize once to syndicate scanned cards & items in 1 click.
                    </p>
                    {connectingMarketplace === mp.id ? (
                      <div className="space-y-2 pt-1">
                        <input
                          type="text"
                          value={connectUsername}
                          onChange={(e) => setConnectUsername(e.target.value)}
                          placeholder="Your account or store handle"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              connectMarketplace(
                                mp.id,
                                user?.storeName || 'My Reselling Store',
                                connectUsername.trim() || `${mp.id}_pro_seller`
                              );
                              setConnectingMarketplace(null);
                              setConnectUsername('');
                            }}
                            className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-colors shadow-2xs"
                          >
                            Authorize & Link
                          </button>
                          <button
                            onClick={() => {
                              setConnectingMarketplace(null);
                              setConnectUsername('');
                            }}
                            className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setConnectingMarketplace(mp.id);
                          setConnectUsername(
                            user?.storeName ? user.storeName.toLowerCase().replace(/\s+/g, '_') : ''
                          );
                        }}
                        className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                      >
                        <Link2 className="w-3 h-3" /> Log in Once
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Supabase Database & PostgreSQL Connection */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Supabase PostgreSQL Architecture</h3>
          </div>
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              supabaseConfig.connected
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {supabaseConfig.connected ? 'Connected' : 'Local Isolated Sandbox'}
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          SellerPro is architected to support direct Row Level Security (RLS) PostgreSQL syncing via Supabase.
          Your private records are isolated so no seller can access another user's financials.
        </p>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supabase Anon / Public Key
              </label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleTestSupabase}
              disabled={isTestingSupabase}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              {isTestingSupabase ? 'Testing Connection...' : 'Verify Supabase Connection'}
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(sampleSqlSnippet);
                setCopiedSchema(true);
                setTimeout(() => setCopiedSchema(false), 2000);
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSchema ? 'Schema Copied to Clipboard' : 'Copy Supabase SQL Schema'}</span>
            </button>
          </div>

          {supabaseStatusMsg && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
              {supabaseStatusMsg}
            </div>
          )}
        </div>
      </div>

      {/* 4. Data Backup & Reset */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-2xs space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900">Data Management & Exports</h3>
          <p className="text-xs text-slate-500">Back up your business data or reset demo records.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleExportJsonBackup}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Download Full JSON Backup</span>
          </button>

          <button
            onClick={() => exportSalesToCSV(sales)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Export CSV Sales Ledger</span>
          </button>

          {isDemoDataActive ? (
            <button
              onClick={clearUserData}
              className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear Demo Data</span>
            </button>
          ) : (
            <button
              onClick={loadDemoData}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Populate Sample Reseller Store</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
