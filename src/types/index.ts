export type PlanType = 'free' | 'pro' | 'business';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  storeName: string;
  defaultMarketplace: MarketplaceKey;
  plan: PlanType;
  stripeCustomerId?: string;
  subscriptionStatus: 'active' | 'trialing' | 'canceled' | 'past_due';
  currency: string;
  createdAt: string;
  isAdmin?: boolean;
}

export type MarketplaceKey = 'ebay' | 'whatnot' | 'amazon' | 'etsy' | 'mercari' | 'poshmark' | 'custom';

export interface MarketplaceFeeConfig {
  key: MarketplaceKey;
  name: string;
  description: string;
  defaultFeeRate: number; // e.g. 13.25% = 0.1325
  paymentFeeRate: number; // e.g. 2.9% = 0.029
  paymentFeeFixed: number; // e.g. $0.30
  listingFee: number; // e.g. $0.20 for Etsy
  notes: string;
}

export type InventoryStatus = 'draft' | 'listed' | 'sold' | 'removed';

export type ProductCategory = 
  | 'Trading Cards'
  | 'Sneakers & Streetwear'
  | 'Collectibles & Toys'
  | 'Video Games & Consoles'
  | 'Electronics & Cameras'
  | 'Clothing & Apparel'
  | 'Vintage & Antiques'
  | 'Books & Media'
  | 'Other';

export interface InventoryItem {
  id: string;
  userId: string;
  title: string;
  sku: string;
  category: ProductCategory;
  purchasePrice: number; // COGS
  expectedSalePrice: number;
  quantity: number;
  purchaseDate: string;
  notes?: string;
  status: InventoryStatus;
  imageUrl?: string;
  marketplace: MarketplaceKey;
  targetProfit?: number;
  condition?: string;
  createdAt: string;
}

export interface SaleRecord {
  id: string;
  userId: string;
  inventoryItemId?: string;
  productName: string;
  category: ProductCategory;
  marketplace: MarketplaceKey;
  salePrice: number;
  purchasePrice: number; // COGS
  shippingCharged: number; // paid by buyer
  shippingPaid: number; // paid by seller
  marketplaceFees: number;
  paymentFees: number;
  otherExpenses: number;
  dateSold: string;
  orderReference?: string;
  notes?: string;
  // Computed fields
  grossRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
}

export interface ProfitCalculation {
  id: string;
  userId: string;
  productName: string;
  purchasePrice: number;
  expectedSalePrice: number;
  marketplace: MarketplaceKey;
  marketplaceFeeRate: number;
  paymentFeeRate: number;
  paymentFeeFixed: number;
  buyerShipping: number;
  sellerShipping: number;
  packagingCost: number;
  otherExpenses: number;
  // Results
  grossRevenue: number;
  marketplaceFeeAmount: number;
  paymentFeeAmount: number;
  totalCosts: number;
  netProfit: number;
  profitMargin: number;
  roi: number;
  breakEvenPrice: number;
  savedAt: string;
}

export interface SavedDeal {
  id: string;
  userId: string;
  productName: string;
  purchasePrice: number;
  expectedSalePrice: number;
  shippingCost: number;
  marketplace: MarketplaceKey;
  expectedSellingTime: string;
  netProfit: number;
  margin: number;
  roi: number;
  breakEvenPrice: number;
  riskRating: 'low' | 'moderate' | 'high';
  notes?: string;
  createdAt: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected: boolean;
  lastChecked?: string;
}

export interface CardComp {
  title: string;
  price: number;
  platform: string;
  condition: string;
  date: string;
}

export interface CardScanResult {
  id: string;
  name: string;
  setName: string;
  cardNumber: string;
  year: string;
  publisher: string;
  finish: string;
  rarity: string;
  estimatedGrade: string;
  conditionObservations: string[];
  estimatedValues: {
    rawLow: number;
    rawMid: number;
    rawHigh: number;
    psa9Estimate: number;
    psa10Estimate: number;
  };
  recommendedPlatform: MarketplaceKey;
  recommendedPlatformReason: string;
  recommendedListingPrice: number;
  comps: CardComp[];
  imageUrl: string;
  scannedAt: string;
  category?: string;
  brand?: string;
  modelOrEdition?: string;
  suggestedTitle?: string;
  suggestedDescription?: string;
  // Forensic verification & accuracy fields
  confidenceScore?: number; // 0 - 100
  verificationStatus?: 'verified_match' | 'probable_match' | 'variant_check_needed';
  verificationHallmarks?: string[];
  variantDifferentiatingNotes?: string;
  isConfirmedByUser?: boolean;
}

export interface MarketplaceConnection {
  key: MarketplaceKey;
  name: string;
  connected: boolean;
  username?: string;
  storeName?: string;
  connectedAt?: string;
  scopes?: string[];
}

export interface NewsArticle {
  id: string;
  title: string;
  source: 'Topps' | 'Panini' | 'Hobby News' | 'Market Intel';
  category: 'Product Release' | 'Licensing & Deals' | 'Checklist Drop' | 'Market Analysis';
  summary: string;
  content: string;
  publishedDate: string;
  readTime: string;
  imageUrl: string;
  tags: string[];
  sourceUrl?: string;
  featuredCard?: string;
  estimatedHobbyBoxPrice?: number;
}

export interface GrailPull {
  id: string;
  cardTitle: string;
  manufacturer: 'Topps' | 'Panini' | 'Upper Deck' | 'Wizards of the Coast';
  productSet: string;
  pulledBy: string;
  pullPlatform: 'Whatnot Live' | 'YouTube Stream' | 'Hobby Shop In-Person' | 'TikTok Live';
  datePulled: string;
  estimatedValue: number;
  serialNumber: string; // e.g. "1/1", "10/25"
  rarityTier: '1/1 Superfractor' | '1/1 Black Shimmer' | 'Downtown SSP' | 'Kaboom!' | 'Flawless Diamond' | 'Holy Grail Holo';
  imageUrl: string;
  details: string;
}

export interface CollectiblesVideo {
  id: string;
  title: string;
  channelName: string;
  subscribers: string;
  duration: string;
  views: string;
  publishedTime: string;
  youtubeId: string;
  category: 'Box Breaks' | 'Market Intel' | 'Pulls & Grails' | 'Grading Advice';
  thumbnailUrl: string;
  description: string;
}

export interface ToppsSocialPost {
  id: string;
  platform: 'X' | 'Threads';
  authorName: string;
  authorHandle: string;
  verified: boolean;
  avatarUrl: string;
  timestamp: string;
  text: string;
  mediaUrl?: string;
  repostsCount: string;
  likesCount: string;
  repliesCount: string;
  postUrl: string;
  topicTag?: string;
}

export type ViewTab = 
  | 'landing'
  | 'dashboard'
  | 'scanner'
  | 'news'
  | 'calculator'
  | 'inventory'
  | 'sales'
  | 'fees'
  | 'pricing'
  | 'deals'
  | 'ai'
  | 'settings';

