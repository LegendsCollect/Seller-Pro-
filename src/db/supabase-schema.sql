-- =========================================================================
-- SellerPro Supabase PostgreSQL Database Schema
-- Production Row Level Security (RLS) & Multi-Tenant Separation
-- =========================================================================

-- 1. PROFILES (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  store_name TEXT DEFAULT 'My Reseller Store',
  default_marketplace TEXT DEFAULT 'ebay',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'business')),
  stripe_customer_id TEXT,
  subscription_status TEXT DEFAULT 'active',
  currency TEXT DEFAULT '$',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. INVENTORY TABLE
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  sku TEXT,
  category TEXT NOT NULL,
  purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  expected_sale_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  quantity INTEGER NOT NULL DEFAULT 1,
  purchase_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'listed' CHECK (status IN ('draft', 'listed', 'sold', 'removed')),
  image_url TEXT,
  marketplace TEXT DEFAULT 'ebay',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON public.inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON public.inventory(status);

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory" 
ON public.inventory FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory" 
ON public.inventory FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory" 
ON public.inventory FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory" 
ON public.inventory FOR DELETE 
USING (auth.uid() = user_id);

-- 3. SALES TABLE
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  category TEXT DEFAULT 'Other',
  marketplace TEXT NOT NULL,
  sale_price NUMERIC(10, 2) NOT NULL,
  purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  shipping_charged NUMERIC(10, 2) DEFAULT 0.00,
  shipping_paid NUMERIC(10, 2) DEFAULT 0.00,
  marketplace_fees NUMERIC(10, 2) DEFAULT 0.00,
  payment_fees NUMERIC(10, 2) DEFAULT 0.00,
  other_expenses NUMERIC(10, 2) DEFAULT 0.00,
  date_sold DATE DEFAULT CURRENT_DATE,
  order_reference TEXT,
  notes TEXT,
  gross_revenue NUMERIC(10, 2) NOT NULL,
  total_expenses NUMERIC(10, 2) NOT NULL,
  net_profit NUMERIC(10, 2) NOT NULL,
  profit_margin NUMERIC(6, 2) NOT NULL,
  roi NUMERIC(6, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_date_sold ON public.sales(date_sold);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sales" 
ON public.sales FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales" 
ON public.sales FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales" 
ON public.sales FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales" 
ON public.sales FOR DELETE 
USING (auth.uid() = user_id);

-- 4. SAVED PROFIT CALCULATIONS
CREATE TABLE IF NOT EXISTS public.profit_calculations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  purchase_price NUMERIC(10, 2) NOT NULL,
  expected_sale_price NUMERIC(10, 2) NOT NULL,
  marketplace TEXT NOT NULL,
  marketplace_fee_rate NUMERIC(6, 4) NOT NULL,
  payment_fee_rate NUMERIC(6, 4) NOT NULL,
  payment_fee_fixed NUMERIC(10, 2) NOT NULL,
  buyer_shipping NUMERIC(10, 2) DEFAULT 0.00,
  seller_shipping NUMERIC(10, 2) DEFAULT 0.00,
  packaging_cost NUMERIC(10, 2) DEFAULT 0.00,
  other_expenses NUMERIC(10, 2) DEFAULT 0.00,
  net_profit NUMERIC(10, 2) NOT NULL,
  profit_margin NUMERIC(6, 2) NOT NULL,
  roi NUMERIC(6, 2) NOT NULL,
  break_even_price NUMERIC(10, 2) NOT NULL,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profit_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own calculations" 
ON public.profit_calculations FOR ALL 
USING (auth.uid() = user_id);

-- 5. SAVED DEALS (BUY-SIDE EVALUATIONS)
CREATE TABLE IF NOT EXISTS public.saved_deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  purchase_price NUMERIC(10, 2) NOT NULL,
  expected_sale_price NUMERIC(10, 2) NOT NULL,
  shipping_cost NUMERIC(10, 2) DEFAULT 0.00,
  marketplace TEXT DEFAULT 'ebay',
  expected_selling_time TEXT,
  net_profit NUMERIC(10, 2) NOT NULL,
  margin NUMERIC(6, 2) NOT NULL,
  roi NUMERIC(6, 2) NOT NULL,
  risk_rating TEXT CHECK (risk_rating IN ('low', 'moderate', 'high')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.saved_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own deals" 
ON public.saved_deals FOR ALL 
USING (auth.uid() = user_id);

-- 6. SUBSCRIPTIONS & BILLING
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'pro', 'business')),
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription" 
ON public.subscriptions FOR SELECT 
USING (auth.uid() = user_id);
