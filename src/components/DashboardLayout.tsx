import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { DashboardView } from './views/DashboardView';
import { CardScannerView } from './views/CardScannerView';
import { NewsView } from './views/NewsView';
import { ProfitCalculatorView } from './views/ProfitCalculatorView';
import { InventoryManagerView } from './views/InventoryManagerView';
import { SalesTrackerView } from './views/SalesTrackerView';
import { MarketplaceFeesView } from './views/MarketplaceFeesView';
import { PricingAssistantView } from './views/PricingAssistantView';
import { DealFinderView } from './views/DealFinderView';
import { AIAssistantView } from './views/AIAssistantView';
import { SettingsView } from './views/SettingsView';
import { AddItemModal } from './modals/AddItemModal';
import { AddSaleModal } from './modals/AddSaleModal';
import { CrossListModal } from './modals/CrossListModal';
import { InventoryItem } from '../types';
import { Menu } from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [salePreselectedItem, setSalePreselectedItem] = useState<InventoryItem | null>(null);

  const handleOpenSaleForItem = (item: InventoryItem) => {
    setSalePreselectedItem(item);
    setIsAddSaleOpen(true);
  };

  const handleOpenQuickSale = () => {
    setSalePreselectedItem(null);
    setIsAddSaleOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <Navbar
        onOpenQuickSale={handleOpenQuickSale}
        onOpenQuickInventory={() => setIsAddItemOpen(true)}
      />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
        <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
          {/* Mobile subheader with hamburger toggle */}
          <div className="lg:hidden flex items-center justify-between px-4 py-2.5 bg-white border-b border-slate-200">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-2 text-xs font-semibold"
            >
              <Menu className="w-5 h-5 text-slate-700" />
              <span>Menu</span>
            </button>
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {activeTab}
            </span>
          </div>

          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenNewSale={handleOpenQuickSale}
                onOpenNewInventory={() => setIsAddItemOpen(true)}
              />
            )}
            {activeTab === 'scanner' && <CardScannerView />}
            {activeTab === 'news' && <NewsView />}
            {activeTab === 'calculator' && <ProfitCalculatorView />}
            {activeTab === 'inventory' && (
              <InventoryManagerView
                onOpenAddItemModal={() => setIsAddItemOpen(true)}
                onOpenSaleModalForItem={handleOpenSaleForItem}
              />
            )}
            {activeTab === 'sales' && (
              <SalesTrackerView onOpenAddSaleModal={handleOpenQuickSale} />
            )}
            {activeTab === 'fees' && <MarketplaceFeesView />}
            {activeTab === 'pricing' && <PricingAssistantView />}
            {activeTab === 'deals' && <DealFinderView />}
            {activeTab === 'ai' && <AIAssistantView />}
            {activeTab === 'settings' && <SettingsView />}
          </main>
        </div>
      </div>

      {/* Shared Modals */}
      <AddItemModal
        isOpen={isAddItemOpen}
        onClose={() => setIsAddItemOpen(false)}
      />

      <AddSaleModal
        isOpen={isAddSaleOpen}
        onClose={() => {
          setIsAddSaleOpen(false);
          setSalePreselectedItem(null);
        }}
        preselectedItem={salePreselectedItem}
      />

      <CrossListModal />
    </div>
  );
};
