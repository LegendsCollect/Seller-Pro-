import React from 'react';
import { useApp } from '../context/AppContext';
import { Logo } from './Logo';
import { LogOut, User as UserIcon, Plus } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  onOpenQuickSale?: () => void;
  onOpenQuickInventory?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenQuickSale, onOpenQuickInventory }) => {
  const { user, activeTab, setActiveTab, logout, setIsAuthModalOpen, loginAsDemoUser } = useApp();

  const isLanding = activeTab === 'landing';

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => setActiveTab(user ? 'dashboard' : 'landing')}
          className="flex items-center text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md"
        >
          <Logo size="md" />
        </button>

        {/* Zone 2: 4-5 concise single-line nav links */}
        {isLanding ? (
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a
              href="#features"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Features
            </a>
            <a
              href="#calculator-preview"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Fee Calculator
            </a>
            <a
              href="#how-it-works"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#pricing"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="hover:text-slate-900 transition-colors whitespace-nowrap shrink-0"
            >
              FAQ
            </a>
          </nav>
        ) : (
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <span className="font-semibold text-slate-800 uppercase tracking-wider">
              {activeTab}
            </span>
            <span>·</span>
            <span>{user?.storeName || 'Reseller Workspace'}</span>
            <span>·</span>
            <span className="text-emerald-600 font-medium">
              {user?.plan?.toUpperCase()} TIER
            </span>
          </div>
        )}

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {isLanding ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <PWAInstallButton variant="nav" />
              <button
                onClick={() => {
                  loginAsDemoUser();
                }}
                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                Instant Demo
              </button>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <PWAInstallButton variant="nav" />
              {onOpenQuickSale && (
                <button
                  onClick={onOpenQuickSale}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Sale</span>
                </button>
              )}

              {onOpenQuickInventory && (
                <button
                  onClick={onOpenQuickInventory}
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Account Settings"
              >
                <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px]">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden lg:inline-block max-w-[120px] truncate">
                  {user?.name || user?.email}
                </span>
              </button>

              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
