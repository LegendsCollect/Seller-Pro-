import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  InventoryItem,
  SaleRecord,
  ProfitCalculation,
  SavedDeal,
  MarketplaceFeeConfig,
  MarketplaceKey,
  PlanType,
  ViewTab,
  SupabaseConfig,
  CardScanResult,
  MarketplaceConnection,
} from '../types';
import { DEFAULT_MARKETPLACE_CONFIGS } from '../utils/calculations';
import { SAMPLE_INVENTORY, SAMPLE_SALES, SAMPLE_DEALS } from '../data/sampleData';

const DEFAULT_MARKETPLACE_CONNECTIONS: Record<MarketplaceKey, MarketplaceConnection> = {
  ebay: {
    key: 'ebay',
    name: 'eBay Managed Payments',
    connected: true,
    username: 'alex_grailvault',
    storeName: 'Grail Vault Collectibles (Top Rated Plus)',
    connectedAt: '2026-09-01T12:00:00Z',
  },
  whatnot: {
    key: 'whatnot',
    name: 'Whatnot Live Streams',
    connected: true,
    username: 'vaultbreaks_live',
    storeName: 'Vault Breaks & Singles',
    connectedAt: '2026-09-15T15:30:00Z',
  },
  mercari: {
    key: 'mercari',
    name: 'Mercari Marketplace',
    connected: false,
  },
  poshmark: {
    key: 'poshmark',
    name: 'Poshmark Closet',
    connected: false,
  },
  amazon: {
    key: 'amazon',
    name: 'Amazon Seller Central',
    connected: false,
  },
  etsy: {
    key: 'etsy',
    name: 'Etsy Vintage & Handmade',
    connected: false,
  },
  custom: {
    key: 'custom',
    name: 'Custom Shopify / Local Store',
    connected: false,
  },
};

interface AppContextType {
  user: UserProfile | null;
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  // Auth methods
  login: (email: string, password?: string) => Promise<boolean>;
  signup: (email: string, name: string, storeName?: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  loginAsDemoUser: () => void;
  loginAsAdmin: (password: string) => boolean;
  // Modals
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  authModalMode: 'signin' | 'signup' | 'forgot' | 'admin';
  setAuthModalMode: (mode: 'signin' | 'signup' | 'forgot' | 'admin') => void;
  openAdminModal: () => void;
  isStripeModalOpen: boolean;
  setIsStripeModalOpen: (open: boolean) => void;
  pendingUpgradePlan: PlanType | null;
  setPendingUpgradePlan: (plan: PlanType | null) => void;
  // Inventory
  inventory: InventoryItem[];
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'userId' | 'createdAt'>) => { success: boolean; error?: string };
  updateInventoryItem: (id: string, updates: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;
  markItemAsSold: (itemId: string, saleDetails: Partial<SaleRecord>) => void;
  // Sales
  sales: SaleRecord[];
  addSale: (sale: Omit<SaleRecord, 'id' | 'userId'>) => void;
  updateSale: (id: string, updates: Partial<SaleRecord>) => void;
  deleteSale: (id: string) => void;
  // Calculations
  savedCalculations: ProfitCalculation[];
  saveCalculation: (calc: Omit<ProfitCalculation, 'id' | 'userId' | 'savedAt'>) => void;
  deleteCalculation: (id: string) => void;
  // Deals
  savedDeals: SavedDeal[];
  saveDeal: (deal: Omit<SavedDeal, 'id' | 'userId' | 'createdAt'>) => void;
  deleteDeal: (id: string) => void;
  // Fee configs
  marketplaceConfigs: Record<MarketplaceKey, MarketplaceFeeConfig>;
  updateMarketplaceConfig: (key: MarketplaceKey, updates: Partial<MarketplaceFeeConfig>) => void;
  resetMarketplaceConfigs: () => void;
  // Supabase
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (config: Partial<SupabaseConfig>) => void;
  // Marketplace Connections (log in once & cross-list)
  marketplaceConnections: Record<MarketplaceKey, MarketplaceConnection>;
  connectMarketplace: (key: MarketplaceKey, storeName: string, username: string) => void;
  disconnectMarketplace: (key: MarketplaceKey) => void;
  // Scanned Card Dossiers
  scannedCardsHistory: CardScanResult[];
  saveScannedCard: (card: CardScanResult) => void;
  // 1-Click Cross-Listing modal
  isCrossListModalOpen: boolean;
  crossListTargetItem: any | null;
  openCrossListModal: (item: any) => void;
  closeCrossListModal: () => void;
  // Demo Mode helpers
  isDemoDataActive: boolean;
  loadDemoData: () => void;
  clearUserData: () => void;
  // Billing
  upgradePlan: (newPlan: PlanType) => void;
  cancelSubscription: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEMO_USER: UserProfile = {
  id: 'demo-user-1',
  email: 'collector_alex@sellerpro.app',
  name: 'Alex Chen',
  storeName: 'Grail Vault & Collectibles',
  defaultMarketplace: 'ebay',
  plan: 'pro',
  subscriptionStatus: 'active',
  currency: '$',
  createdAt: '2026-08-15T00:00:00Z',
};

const ADMIN_USER: UserProfile = {
  id: 'admin-master-user',
  email: 'admin@sellerpro.app',
  name: 'Master Admin',
  storeName: 'SellerPro VIP Free Vault',
  defaultMarketplace: 'ebay',
  plan: 'business', // Top tier plan with 100% free unlocked access to all features
  subscriptionStatus: 'active',
  currency: '$',
  createdAt: '2026-01-01T00:00:00Z',
  isAdmin: true,
};

// Safe localStorage wrapper to prevent QuotaExceededError and browser sandbox exceptions
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[SafeStorage] Failed to read key: ${key}`, e);
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err: any) {
      console.warn(`[SafeStorage] Quota exceeded or write error on "${key}":`, err?.message || err);
      // Attempt self-healing eviction of oversized cards history or caches to free up quota
      try {
        const keysToPurge = Object.keys(localStorage).filter(
          (k) => k.includes('_scanned_cards') || k.includes('image_cache') || k.includes('base64')
        );
        for (const k of keysToPurge) {
          localStorage.removeItem(k);
        }
        // Retry once with purged space
        localStorage.setItem(key, value);
        return true;
      } catch {
        // If still full, fail gracefully without throwing an uncaught exception
        return false;
      }
    }
  },
  removeItem: (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  },
};

// Immediate self-healing on boot: clean up any legacy oversized scanned_cards exceeding quota limit
try {
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.includes('_scanned_cards')) {
      const item = localStorage.getItem(k);
      if (item && (item.includes('data:image') || item.length > 80000)) {
        localStorage.removeItem(k);
      }
    }
  }
} catch {}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = safeStorage.getItem('sellerpro_current_user');
    return saved ? JSON.parse(saved) : DEMO_USER;
  });

  const [activeTab, setActiveTab] = useState<ViewTab>(() => {
    return user ? 'dashboard' : 'landing';
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot' | 'admin'>('signin');
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  const [pendingUpgradePlan, setPendingUpgradePlan] = useState<PlanType | null>(null);

  const openAdminModal = () => {
    setAuthModalMode('admin');
    setIsAuthModalOpen(true);
  };

  // Storage keys helper based on userId
  const getUserKey = (prefix: string) => `sellerpro_${user ? user.id : 'guest'}_${prefix}`;

  // Multi-tenant state
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [savedCalculations, setSavedCalculations] = useState<ProfitCalculation[]>([]);
  const [savedDeals, setSavedDeals] = useState<SavedDeal[]>([]);
  const [marketplaceConfigs, setMarketplaceConfigs] = useState<Record<MarketplaceKey, MarketplaceFeeConfig>>(() => {
    const saved = safeStorage.getItem('sellerpro_fee_configs');
    return saved ? JSON.parse(saved) : DEFAULT_MARKETPLACE_CONFIGS;
  });

  const [marketplaceConnections, setMarketplaceConnections] = useState<Record<MarketplaceKey, MarketplaceConnection>>(() => {
    const saved = safeStorage.getItem('sellerpro_marketplace_connections');
    return saved ? JSON.parse(saved) : DEFAULT_MARKETPLACE_CONNECTIONS;
  });

  const [scannedCardsHistory, setScannedCardsHistory] = useState<CardScanResult[]>([]);
  const [isCrossListModalOpen, setIsCrossListModalOpen] = useState(false);
  const [crossListTargetItem, setCrossListTargetItem] = useState<any | null>(null);

  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() => {
    const saved = safeStorage.getItem('sellerpro_supabase_config');
    return saved ? JSON.parse(saved) : { url: '', anonKey: '', connected: false };
  });

  const [isDemoDataActive, setIsDemoDataActive] = useState(false);

  // Load user data on user switch
  useEffect(() => {
    if (!user) {
      setInventory([]);
      setSales([]);
      setSavedCalculations([]);
      setSavedDeals([]);
      setScannedCardsHistory([]);
      setIsDemoDataActive(false);
      return;
    }

    safeStorage.setItem('sellerpro_current_user', JSON.stringify(user));

    const savedInv = safeStorage.getItem(getUserKey('inventory'));
    const savedSales = safeStorage.getItem(getUserKey('sales'));
    const savedCalcs = safeStorage.getItem(getUserKey('calculations'));
    const savedDealsData = safeStorage.getItem(getUserKey('deals'));

    if (savedInv) {
      try { setInventory(JSON.parse(savedInv)); } catch { setInventory([]); }
    } else if (user.id === DEMO_USER.id) {
      setInventory(SAMPLE_INVENTORY);
      setIsDemoDataActive(true);
    } else {
      setInventory([]);
    }

    if (savedSales) {
      try { setSales(JSON.parse(savedSales)); } catch { setSales([]); }
    } else if (user.id === DEMO_USER.id) {
      setSales(SAMPLE_SALES);
      setIsDemoDataActive(true);
    } else {
      setSales([]);
    }

    if (savedCalcs) {
      try { setSavedCalculations(JSON.parse(savedCalcs)); } catch { setSavedCalculations([]); }
    } else {
      setSavedCalculations([]);
    }

    if (savedDealsData) {
      try { setSavedDeals(JSON.parse(savedDealsData)); } catch { setSavedDeals([]); }
    } else if (user.id === DEMO_USER.id) {
      setSavedDeals(SAMPLE_DEALS);
    } else {
      setSavedDeals([]);
    }

    const savedCards = safeStorage.getItem(getUserKey('scanned_cards'));
    if (savedCards) {
      try { setScannedCardsHistory(JSON.parse(savedCards)); } catch { setScannedCardsHistory([]); }
    } else {
      setScannedCardsHistory([]);
    }
  }, [user?.id]);

  // Sync to local storage with safeStorage and quota protection
  useEffect(() => {
    if (user) {
      safeStorage.setItem(getUserKey('inventory'), JSON.stringify(inventory));
    }
  }, [inventory, user?.id]);

  useEffect(() => {
    if (user) {
      safeStorage.setItem(getUserKey('sales'), JSON.stringify(sales));
    }
  }, [sales, user?.id]);

  useEffect(() => {
    if (user) {
      safeStorage.setItem(getUserKey('calculations'), JSON.stringify(savedCalculations));
    }
  }, [savedCalculations, user?.id]);

  useEffect(() => {
    if (user) {
      safeStorage.setItem(getUserKey('deals'), JSON.stringify(savedDeals));
    }
  }, [savedDeals, user?.id]);

  useEffect(() => {
    if (user) {
      // Never store full base64 image strings in persistent localStorage to avoid QuotaExceededError
      const safeCompactHistory = scannedCardsHistory.slice(0, 20).map((card) => ({
        ...card,
        imageUrl: card.imageUrl && card.imageUrl.startsWith('data:')
          ? ''
          : card.imageUrl,
      }));
      safeStorage.setItem(getUserKey('scanned_cards'), JSON.stringify(safeCompactHistory));
    }
  }, [scannedCardsHistory, user?.id]);

  useEffect(() => {
    safeStorage.setItem('sellerpro_marketplace_connections', JSON.stringify(marketplaceConnections));
  }, [marketplaceConnections]);

  useEffect(() => {
    safeStorage.setItem('sellerpro_fee_configs', JSON.stringify(marketplaceConfigs));
  }, [marketplaceConfigs]);

  useEffect(() => {
    safeStorage.setItem('sellerpro_supabase_config', JSON.stringify(supabaseConfig));
  }, [supabaseConfig]);

  // Auth operations
  const login = async (email: string, _password?: string): Promise<boolean> => {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    
    // Check if account exists in registry
    const accountsRaw = safeStorage.getItem('sellerpro_registered_users');
    const accounts: UserProfile[] = accountsRaw ? JSON.parse(accountsRaw) : [];
    
    let existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);
    if (!existing) {
      if (cleanEmail === DEMO_USER.email) {
        existing = DEMO_USER;
      } else {
        // Create standard account
        existing = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          email: cleanEmail,
          name: cleanEmail.split('@')[0],
          storeName: `${cleanEmail.split('@')[0]}'s Store`,
          defaultMarketplace: 'ebay',
          plan: 'free',
          subscriptionStatus: 'active',
          currency: '$',
          createdAt: new Date().toISOString(),
        };
        accounts.push(existing);
        safeStorage.setItem('sellerpro_registered_users', JSON.stringify(accounts));
      }
    }
    
    setUser(existing);
    setActiveTab('dashboard');
    setIsAuthModalOpen(false);
    return true;
  };

  const signup = async (email: string, name: string, storeName?: string): Promise<boolean> => {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    
    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      email: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      storeName: storeName || 'My Reseller Store',
      defaultMarketplace: 'ebay',
      plan: 'free',
      subscriptionStatus: 'active',
      currency: '$',
      createdAt: new Date().toISOString(),
    };

    const accountsRaw = safeStorage.getItem('sellerpro_registered_users');
    const accounts: UserProfile[] = accountsRaw ? JSON.parse(accountsRaw) : [];
    accounts.push(newUser);
    safeStorage.setItem('sellerpro_registered_users', JSON.stringify(accounts));

    setUser(newUser);
    setActiveTab('dashboard');
    setIsAuthModalOpen(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    safeStorage.removeItem('sellerpro_current_user');
    setActiveTab('landing');
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    safeStorage.setItem('sellerpro_current_user', JSON.stringify(updated));

    // Update in registered accounts too
    const accountsRaw = safeStorage.getItem('sellerpro_registered_users');
    if (accountsRaw) {
      const accounts: UserProfile[] = JSON.parse(accountsRaw);
      const idx = accounts.findIndex((a) => a.id === user.id);
      if (idx !== -1) {
        accounts[idx] = updated;
        safeStorage.setItem('sellerpro_registered_users', JSON.stringify(accounts));
      }
    }
  };

  const loginAsDemoUser = () => {
    setUser(DEMO_USER);
    setActiveTab('dashboard');
    setIsAuthModalOpen(false);
  };

  const loginAsAdmin = (password: string): boolean => {
    if (password === 'MiniDad2013!') {
      setUser(ADMIN_USER);
      safeStorage.setItem('sellerpro_current_user', JSON.stringify(ADMIN_USER));
      setActiveTab('dashboard');
      setIsAuthModalOpen(false);
      return true;
    }
    return false;
  };

  // Inventory operations with plan limits
  const addInventoryItem = (itemData: Omit<InventoryItem, 'id' | 'userId' | 'createdAt'>): { success: boolean; error?: string } => {
    if (!user) return { success: false, error: 'Must be logged in' };

    // Plan limit: Free plan max 15 items
    const activeCount = inventory.filter((i) => i.status !== 'removed').length;
    if (user.plan === 'free' && activeCount >= 15) {
      return {
        success: false,
        error: 'Free plan limit reached (15 items). Upgrade to Pro for unlimited inventory tracking.',
      };
    }

    const newItem: InventoryItem = {
      ...itemData,
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };

    setInventory((prev) => [newItem, ...prev]);
    return { success: true };
  };

  const updateInventoryItem = (id: string, updates: Partial<InventoryItem>) => {
    setInventory((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteInventoryItem = (id: string) => {
    setInventory((prev) => prev.filter((item) => item.id !== id));
  };

  const markItemAsSold = (itemId: string, saleDetails: Partial<SaleRecord>) => {
    const item = inventory.find((i) => i.id === itemId);
    if (!item) return;

    // Update item status
    updateInventoryItem(itemId, { status: 'sold' });

    // Auto-record in Sales Tracker
    const salePrice = saleDetails.salePrice ?? item.expectedSalePrice;
    const shippingCharged = saleDetails.shippingCharged ?? 0;
    const grossRevenue = salePrice + shippingCharged;
    const purchasePrice = item.purchasePrice;
    const shippingPaid = saleDetails.shippingPaid ?? 0;
    const marketplaceFees = saleDetails.marketplaceFees ?? (grossRevenue * 0.13);
    const paymentFees = saleDetails.paymentFees ?? 0.30;
    const otherExpenses = saleDetails.otherExpenses ?? 0;
    const totalExpenses = purchasePrice + shippingPaid + marketplaceFees + paymentFees + otherExpenses;
    const netProfit = grossRevenue - totalExpenses;
    const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
    const roi = (purchasePrice + shippingPaid + otherExpenses) > 0 
      ? (netProfit / (purchasePrice + shippingPaid + otherExpenses)) * 100 
      : 0;

    const newSale: SaleRecord = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user ? user.id : 'demo-user-1',
      inventoryItemId: item.id,
      productName: item.title,
      category: item.category,
      marketplace: item.marketplace,
      salePrice,
      purchasePrice,
      shippingCharged,
      shippingPaid,
      marketplaceFees,
      paymentFees,
      otherExpenses,
      dateSold: saleDetails.dateSold || new Date().toISOString().slice(0, 10),
      orderReference: saleDetails.orderReference || `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: saleDetails.notes || `Sold via inventory converter`,
      grossRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      roi,
    };

    setSales((prev) => [newSale, ...prev]);
  };

  // Sales operations
  const addSale = (saleData: Omit<SaleRecord, 'id' | 'userId'>) => {
    if (!user) return;
    const newSale: SaleRecord = {
      ...saleData,
      id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
    };
    setSales((prev) => [newSale, ...prev]);
  };

  const updateSale = (id: string, updates: Partial<SaleRecord>) => {
    setSales((prev) => prev.map((sale) => (sale.id === id ? { ...sale, ...updates } : sale)));
  };

  const deleteSale = (id: string) => {
    setSales((prev) => prev.filter((sale) => sale.id !== id));
  };

  // Calculations operations
  const saveCalculation = (calcData: Omit<ProfitCalculation, 'id' | 'userId' | 'savedAt'>) => {
    if (!user) return;
    const newCalc: ProfitCalculation = {
      ...calcData,
      id: `calc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      savedAt: new Date().toISOString(),
    };
    setSavedCalculations((prev) => [newCalc, ...prev]);
  };

  const deleteCalculation = (id: string) => {
    setSavedCalculations((prev) => prev.filter((c) => c.id !== id));
  };

  // Deals operations
  const saveDeal = (dealData: Omit<SavedDeal, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    const newDeal: SavedDeal = {
      ...dealData,
      id: `deal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: user.id,
      createdAt: new Date().toISOString(),
    };
    setSavedDeals((prev) => [newDeal, ...prev]);
  };

  const deleteDeal = (id: string) => {
    setSavedDeals((prev) => prev.filter((d) => d.id !== id));
  };

  // Marketplace configs
  const updateMarketplaceConfig = (key: MarketplaceKey, updates: Partial<MarketplaceFeeConfig>) => {
    setMarketplaceConfigs((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...updates,
      },
    }));
  };

  const resetMarketplaceConfigs = () => {
    setMarketplaceConfigs(DEFAULT_MARKETPLACE_CONFIGS);
  };

  // Supabase
  const updateSupabaseConfig = (cfg: Partial<SupabaseConfig>) => {
    setSupabaseConfig((prev) => ({ ...prev, ...cfg }));
  };

  // Demo data loaders
  const loadDemoData = () => {
    if (!user) return;
    setInventory(SAMPLE_INVENTORY);
    setSales(SAMPLE_SALES);
    setSavedDeals(SAMPLE_DEALS);
    setIsDemoDataActive(true);
  };

  const clearUserData = () => {
    setInventory([]);
    setSales([]);
    setSavedCalculations([]);
    setSavedDeals([]);
    setIsDemoDataActive(false);
  };

  // Billing & Subscriptions
  const upgradePlan = (newPlan: PlanType) => {
    if (!user) return;
    updateProfile({
      plan: newPlan,
      subscriptionStatus: 'active',
    });
    setIsStripeModalOpen(false);
    setPendingUpgradePlan(null);
  };

  const cancelSubscription = () => {
    if (!user) return;
    updateProfile({
      plan: 'free',
      subscriptionStatus: 'canceled',
    });
  };

  const connectMarketplace = (key: MarketplaceKey, storeName: string, username: string) => {
    setMarketplaceConnections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        connected: true,
        storeName: storeName || prev[key].name,
        username: username || 'connected_seller',
        connectedAt: new Date().toISOString(),
      },
    }));
  };

  const disconnectMarketplace = (key: MarketplaceKey) => {
    setMarketplaceConnections((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        connected: false,
      },
    }));
  };

  const saveScannedCard = (card: CardScanResult) => {
    setScannedCardsHistory((prev) => [card, ...prev.filter((c) => c.id !== card.id)]);
  };

  const openCrossListModal = (item: any) => {
    setCrossListTargetItem(item);
    setIsCrossListModalOpen(true);
  };

  const closeCrossListModal = () => {
    setIsCrossListModalOpen(false);
    setCrossListTargetItem(null);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        activeTab,
        setActiveTab,
        login,
        signup,
        logout,
        updateProfile,
        loginAsDemoUser,
        loginAsAdmin,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authModalMode,
        setAuthModalMode,
        openAdminModal,
        isStripeModalOpen,
        setIsStripeModalOpen,
        pendingUpgradePlan,
        setPendingUpgradePlan,
        inventory,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        markItemAsSold,
        sales,
        addSale,
        updateSale,
        deleteSale,
        savedCalculations,
        saveCalculation,
        deleteCalculation,
        savedDeals,
        saveDeal,
        deleteDeal,
        marketplaceConfigs,
        updateMarketplaceConfig,
        resetMarketplaceConfigs,
        marketplaceConnections,
        connectMarketplace,
        disconnectMarketplace,
        scannedCardsHistory,
        saveScannedCard,
        isCrossListModalOpen,
        crossListTargetItem,
        openCrossListModal,
        closeCrossListModal,
        supabaseConfig,
        updateSupabaseConfig,
        isDemoDataActive,
        loadDemoData,
        clearUserData,
        upgradePlan,
        cancelSubscription,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
