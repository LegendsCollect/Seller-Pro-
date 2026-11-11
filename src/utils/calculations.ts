import { MarketplaceFeeConfig, MarketplaceKey, SaleRecord } from '../types';

export const DEFAULT_MARKETPLACE_CONFIGS: Record<MarketplaceKey, MarketplaceFeeConfig> = {
  ebay: {
    key: 'ebay',
    name: 'eBay',
    description: 'Most categories 13.25% on total amount paid by buyer + $0.30 per order.',
    defaultFeeRate: 0.1325,
    paymentFeeRate: 0, // Managed Payments included in base rate
    paymentFeeFixed: 0.30,
    listingFee: 0, // Free up to 250 listings/month
    notes: 'Category rates range from 8% (sneakers >$150) to 15% (jewelry/watches). Verify category specifics.',
  },
  whatnot: {
    key: 'whatnot',
    name: 'Whatnot',
    description: '8.0% commission + 2.9% payment processing + $0.30 per transaction.',
    defaultFeeRate: 0.08,
    paymentFeeRate: 0.029,
    paymentFeeFixed: 0.30,
    listingFee: 0,
    notes: 'Live auction platform. Rates apply to sale price + shipping + applicable buyer tax.',
  },
  amazon: {
    key: 'amazon',
    name: 'Amazon (FBM)',
    description: '15.0% average referral fee + $0.99 per item (Individual) or flat Pro account.',
    defaultFeeRate: 0.15,
    paymentFeeRate: 0,
    paymentFeeFixed: 0.99,
    listingFee: 0,
    notes: 'Referral fee varies 8%-17% by category. FBA fulfillment adds pick & pack weight handling fees.',
  },
  etsy: {
    key: 'etsy',
    name: 'Etsy',
    description: '6.5% transaction fee + 3.0% + $0.25 payment processing + $0.20 listing fee.',
    defaultFeeRate: 0.065,
    paymentFeeRate: 0.03,
    paymentFeeFixed: 0.25,
    listingFee: 0.20,
    notes: 'Renewable $0.20 listing fee every 4 months or upon sale. 15% offsite ads fee may apply if eligible.',
  },
  mercari: {
    key: 'mercari',
    name: 'Mercari',
    description: '10.0% selling fee + 2.9% + $0.50 payment processing fee.',
    defaultFeeRate: 0.10,
    paymentFeeRate: 0.029,
    paymentFeeFixed: 0.50,
    listingFee: 0,
    notes: 'Mercari seller fee updates periodically; direct deposits under $10 incur $2 fee.',
  },
  poshmark: {
    key: 'poshmark',
    name: 'Poshmark',
    description: 'Flat $2.95 for sales under $15; 20% commission for sales $15 and over.',
    defaultFeeRate: 0.20,
    paymentFeeRate: 0,
    paymentFeeFixed: 0,
    listingFee: 0,
    notes: 'Buyer pays shipping label ($7.97). Seller absorbs 20% on sale price with zero payment fee.',
  },
  custom: {
    key: 'custom',
    name: 'Custom / Other',
    description: 'Configurable fees for local sales, conventions, Instagram, or Shopify.',
    defaultFeeRate: 0.05,
    paymentFeeRate: 0.029,
    paymentFeeFixed: 0.30,
    listingFee: 0,
    notes: 'Manually configure your platform rates and credit card processing charges.',
  },
};

export interface CalculatorInputs {
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
}

export function computeProfitBreakdown(inputs: CalculatorInputs) {
  const salePrice = Math.max(0, inputs.expectedSalePrice || 0);
  const buyerShipping = Math.max(0, inputs.buyerShipping || 0);
  const purchasePrice = Math.max(0, inputs.purchasePrice || 0);
  const sellerShipping = Math.max(0, inputs.sellerShipping || 0);
  const packaging = Math.max(0, inputs.packagingCost || 0);
  const otherExpenses = Math.max(0, inputs.otherExpenses || 0);

  const grossRevenue = salePrice + buyerShipping;
  const mktFeeRate = Math.max(0, inputs.marketplaceFeeRate || 0);
  const payFeeRate = Math.max(0, inputs.paymentFeeRate || 0);
  const payFeeFixed = Math.max(0, inputs.paymentFeeFixed || 0);

  // Platform fee usually calculated on gross amount charged to buyer
  let marketplaceFee = grossRevenue * mktFeeRate;
  if (inputs.marketplace === 'poshmark') {
    marketplaceFee = salePrice < 15 ? 2.95 : salePrice * 0.20;
  }

  const paymentFee = grossRevenue > 0 ? (grossRevenue * payFeeRate + payFeeFixed) : 0;
  const directOutPocket = purchasePrice + sellerShipping + packaging + otherExpenses;
  const totalFees = marketplaceFee + paymentFee;
  const totalCosts = directOutPocket + totalFees;
  const netProfit = grossRevenue - totalCosts;

  const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;
  const roi = directOutPocket > 0 ? (netProfit / directOutPocket) * 100 : 0;

  // Break-even price calculation
  const totalFeePct = mktFeeRate + payFeeRate;
  let breakEvenPrice = 0;
  if (totalFeePct < 1) {
    const numerator = directOutPocket + payFeeFixed;
    const denominator = 1 - totalFeePct;
    breakEvenPrice = Math.max(0, (numerator / denominator) - buyerShipping);
  }

  return {
    grossRevenue,
    marketplaceFeeAmount: marketplaceFee,
    paymentFeeAmount: paymentFee,
    directOutPocket,
    totalFees,
    totalCosts,
    netProfit,
    profitMargin,
    roi,
    breakEvenPrice: Math.round(breakEvenPrice * 100) / 100,
  };
}

export function calculateTargetPrice(
  cogs: number,
  sellerShipping: number,
  packaging: number,
  other: number,
  buyerShipping: number,
  feeRate: number,
  payRate: number,
  payFixed: number,
  targetMarginPct: number // e.g. 20 for 20%
): number {
  const targetMargin = targetMarginPct / 100;
  const outOfPocket = cogs + sellerShipping + packaging + other;
  const totalDeductionPct = feeRate + payRate + targetMargin;

  if (totalDeductionPct >= 1) {
    return 0; // Mathematically impossible to hit margin with these fees
  }

  const requiredGross = (outOfPocket + payFixed) / (1 - totalDeductionPct);
  const targetSalePrice = requiredGross - buyerShipping;
  return Math.max(0, Math.round(targetSalePrice * 100) / 100);
}

export function formatCurrency(amount: number, currency: string = '$'): string {
  const isNegative = amount < 0;
  const absFormatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${isNegative ? '-' : ''}${currency}${absFormatted}`;
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function exportSalesToCSV(sales: SaleRecord[]): void {
  const headers = [
    'Date Sold',
    'Order Ref',
    'Product Name',
    'Category',
    'Marketplace',
    'Sale Price',
    'Buyer Shipping',
    'COGS (Cost)',
    'Seller Shipping',
    'Marketplace Fees',
    'Payment Fees',
    'Other Expenses',
    'Gross Revenue',
    'Total Expenses',
    'Net Profit',
    'Profit Margin (%)',
    'ROI (%)',
    'Notes',
  ];

  const rows = sales.map((sale) => [
    `"${sale.dateSold}"`,
    `"${sale.orderReference || ''}"`,
    `"${(sale.productName || '').replace(/"/g, '""')}"`,
    `"${sale.category}"`,
    `"${sale.marketplace.toUpperCase()}"`,
    sale.salePrice.toFixed(2),
    sale.shippingCharged.toFixed(2),
    sale.purchasePrice.toFixed(2),
    sale.shippingPaid.toFixed(2),
    sale.marketplaceFees.toFixed(2),
    sale.paymentFees.toFixed(2),
    sale.otherExpenses.toFixed(2),
    sale.grossRevenue.toFixed(2),
    sale.totalExpenses.toFixed(2),
    sale.netProfit.toFixed(2),
    sale.profitMargin.toFixed(2),
    sale.roi.toFixed(2),
    `"${(sale.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `sellerpro-sales-ledger-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
