import React from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import {
  LayoutDashboard,
  Calculator,
  Boxes,
  TrendingUp,
  Percent,
  Sparkles,
  Search,
  Bot,
  Settings,
  CreditCard,
  ChevronRight,
  Database,
  Camera,
  Newspaper,
} from 'lucide-react';
import { ViewTab } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, activeTab, setActiveTab, setIsStripeModalOpen, setPendingUpgradePlan, isDemoDataActive } = useApp();

  const navItems: { tab: ViewTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    {
      tab: 'dashboard',
      label: 'Main Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      tab: 'scanner',
      label: 'AI Item & Collectibles Scanner',
      icon: <Camera className="w-4 h-4 shrink-0" />,
      badge: 'PREMIUM',
    },
    {
      tab: 'news',
      label: 'Hobby News & Drops',
      icon: <Newspaper className="w-4 h-4 shrink-0" />,
      badge: 'LIVE',
    },
    {
      tab: 'calculator',
      label: 'Profit Calculator',
      icon: <Calculator className="w-4 h-4 shrink-0" />,
    },
    {
      tab: 'inventory',
      label: 'Inventory Manager',
      icon: <Boxes className="w-4 h-4 shrink-0" />,
    },
    {
      tab: 'sales',
      label: 'Sales Tracker',
      icon: <TrendingUp className="w-4 h-4 shrink-0" />,
    },
    {
      tab: 'fees',
      label: 'Marketplace Fees',
      icon: <Percent className="w-4 h-4 shrink-0" />,
    },
    {
      tab: 'pricing',
      label: 'Pricing Assistant',
      icon: <Sparkles className="w-4 h-4 shrink-0" />,
    },
    {
      tab: 'deals',
      label: 'Deal Finder',
      icon: <Search className="w-4 h-4 shrink-0" />,
    },
    {
      tab: 'ai',
      label: 'AI Seller Assistant',
      icon: <Bot className="w-4 h-4 shrink-0" />,
      badge: 'PRO',
    },
    {
      tab: 'settings',
      label: 'Settings & Supabase',
      icon: <Settings className="w-4 h-4 shrink-0" />,
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <Logo theme="dark" size="md" />
        </div>

        {/* Demo banner if active */}
        {isDemoDataActive && (
          <div className="mx-4 mt-3 px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center justify-between">
            <span className="font-medium">Demo Data Loaded</span>
            <button
              onClick={() => setActiveTab('settings')}
              className="text-[10px] underline hover:text-amber-100"
            >
              Reset
            </button>
          </div>
        )}

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.tab}
                onClick={() => {
                  setActiveTab(item.tab);
                  onClose();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-emerald-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Subscription / Plan footer card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <PWAInstallButton variant="sidebar" className="mb-3" />
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                {user?.isAdmin ? 'Admin Status' : 'Current Plan'}
              </span>
              <span className={`font-extrabold uppercase text-[11px] ${user?.isAdmin ? 'text-amber-400' : 'text-emerald-400'}`}>
                {user?.isAdmin ? '★ VIP Master Admin' : (user?.plan || 'Free')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
              {user?.isAdmin
                ? 'All features 100% free with unlimited AI scanning & cross-listing.'
                : user?.plan === 'business'
                ? 'Unlimited AI & Analytics active.'
                : user?.plan === 'pro'
                ? 'Unlimited items & CSV export.'
                : '15 inventory limit.'}
            </p>
            {!user?.isAdmin && user?.plan !== 'business' && (
              <button
                onClick={() => {
                  setPendingUpgradePlan('business');
                  setIsStripeModalOpen(true);
                  onClose();
                }}
                className="w-full py-1.5 px-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded text-[11px] flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Upgrade to Business</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
