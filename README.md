# SellerPro — All-in-One Reseller & Marketplace Management Platform

> **"Sell smarter. Keep more profit."**

SellerPro is a modern, high-performance web platform built for professional online resellers, card dealers, and marketplace sellers. It equips sellers across **eBay, Whatnot, Amazon, Etsy, Poshmark, and Mercari** with accurate profit calculations, real-time inventory management, visual AI collectible grading with eBay comps, live industry drop feeds, and 1-click cross-listing publishing.

---

## 🌟 Key Features

### 1. Multi-Marketplace Profit & Fee Calculator
- Real-time net profit, ROI, margin percentage, and break-even sales price calculations.
- Pre-configured fee structures for **eBay** (13.25% + $0.40), **Whatnot** (8.0% + 2.9% + $0.30), **Amazon** (15% referral fee), **Etsy** (6.5% transaction + 3% + $0.25 payment + $0.20 listing), **Poshmark** (20%), and **Mercari** (0% seller fee + 2.9% + $0.50 cash-out).
- Adjustable category fee overrides and payment processing adjustments.
- Save, export, and load historical deal calculations.

### 2. Gemini-Powered AI Visual Collectible & Card Scanner
- **Multimodal Visual Inspection**: Take a live camera photo or pick an image from your device photo gallery. Powered by `gemini-3.8-flash`.
- **Accurate Identification**: Identifies player/subject, set/series, card number, release year, manufacturer, and finish (Base, Refractor, Silver Prizm, Holofoil, 1/1, etc.).
- **Live eBay Sold Comps & Valuation Matrix**: Calculates realistic fair market values across Raw Low/Mid/High and PSA 9 / PSA 10 slabs, complete with verified sold comp listings and platform recommendations.
- **Forensic Verification**: Inspects centering ratios (e.g. 55/45), corner sharpness, edge silvering, and surface luster.

### 3. Industry News Wire & Curated Breaker Video Hub
- **Topps & Panini Product Releases**: Stay updated on the latest hobby box drops, retail checklists, and licensing transitions.
- **Official Topps Feeds from X (@Topps) and Threads (@topps)**: Live bounty confirmations (e.g., Paul Skenes 1/1 Pirates season ticket bounty), print-run records, and official announcements with direct links.
- **Verified Grail Pulls**: Gallery of 1/1s, Downtown SSPs, and vintage grails pulled live on Whatnot and YouTube streams.
- **YouTube Video Hub**: Curated high-roller breaks and market analysis from creators like Packman, Backyard Breaks, and RealBreakingNate.

### 4. 1-Click Multi-App Cross-Listing & Store Integration
- Push any scanned item or active inventory piece directly to eBay, Whatnot, Mercari, Poshmark, Amazon, or Etsy.
- Connect and authenticate marketplace accounts directly within the platform.
- AI-generated SEO listing titles under 78 characters and professional disclosure descriptions.

### 5. Inventory & Sales Management
- Track active items, Cost of Goods Sold (COGS), purchase locations, and days held in stock.
- Log sales, track marketplace fee drag, and generate profit & loss summaries.

### 6. 24/7 AI Collectibles Appraiser & Reseller Consultant
- Chat with an AI appraiser on grading submissions (PSA vs BGS vs CGC), auction reserve strategies, and market timing.

---

## 🚀 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite
- **Backend**: Node.js, Express
- **AI Engine**: Google Gemini API (`@google/genai` with `gemini-3.8-flash`)
- **SEO & Googlebot**: Schema.org JSON-LD structured data, OpenGraph, dynamic `sitemap.xml`, and `robots.txt`

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/sellerpro.git
   cd sellerpro
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in the project root:
   ```env
   # Required for Gemini AI visual scanning and chat features
   GEMINI_API_KEY="your-gemini-api-key"

   # App URL (optional, defaults to http://localhost:3000)
   APP_URL="http://localhost:3000"
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔍 Getting SellerPro on Google (Search Console)

SellerPro includes built-in SEO optimizations for Google Search:

1. **Structured Data**: Schema.org `WebApplication` & `Organization` JSON-LD embedded in `<head>`.
2. **Sitemap**: Available at `/sitemap.xml`.
3. **Robots.txt**: Available at `/robots.txt`.
4. **Social Cards**: Complete OpenGraph and Twitter/X summary cards.

### How to Index in Google Search:
1. Go to [Google Search Console](https://search.google.com/search-console).
2. Add your property using your public deployment URL or custom domain.
3. Submit your sitemap: `https://your-domain.com/sitemap.xml`.
4. Use the **URL Inspection** tool on your home page and click **Request Indexing**.

---

## 📦 Production Build

```bash
npm run build
npm start
```

---

## 📄 License
This project is licensed under the Apache-2.0 License.
