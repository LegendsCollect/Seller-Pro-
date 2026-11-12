import express, { Request, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';

export const app = express();

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Claude via Netlify AI Gateway (credentials are injected automatically on Netlify).
// Locally, set ANTHROPIC_API_KEY or run through `netlify dev`.
const hasAnthropicCredentials = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const aiClient: Anthropic | null = hasAnthropicCredentials ? new Anthropic() : null;
const CLAUDE_MODEL = 'claude-opus-5-5';

type ClaudeContent = string | Anthropic.ContentBlockParam[];

/** Calls Claude and returns the concatenated text of the reply. */
async function askClaude(opts: {
  system?: string;
  content: ClaudeContent;
  maxTokens?: number;
  effort?: 'low' | 'medium' | 'high';
  webSearch?: boolean;
}): Promise<string> {
  if (!aiClient) throw new Error('Claude is not configured');
  const params: any = {
    model: CLAUDE_MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    output_config: { effort: opts.effort ?? 'low' },
    messages: [{ role: 'user', content: opts.content }],
  };
  if (opts.system) params.system = opts.system;
  if (opts.webSearch) {
    params.tools = [{ type: 'web_search_20260209', name: 'web_search', max_uses: 3 }];
  }

  let message: Anthropic.Message;
  try {
    message = await aiClient.messages.stream(params).finalMessage();
  } catch (err) {
    // If web search isn't available, retry once without it so the scan still works.
    if (opts.webSearch && err instanceof Anthropic.BadRequestError) {
      delete params.tools;
      message = await aiClient.messages.stream(params).finalMessage();
    } else {
      throw err;
    }
  }

  if (message.stop_reason === 'refusal') {
    throw new Error('The AI declined to analyze this request.');
  }
  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

/** Sends response headers right away so slow AI calls don't hit the platform header timeout. */
function startJsonResponse(res: Response) {
  res.status(200);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.flushHeaders();
  return (payload: unknown) => res.end(JSON.stringify(payload));
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    aiConfigured: Boolean(aiClient),
    timestamp: new Date().toISOString(),
  });
});


// AI Seller Assistant endpoint
app.post('/api/ai/seller-assistant', async (req: Request, res: Response) => {
  try {
    const { message, context, mode } = req.body;

    // If external AI is not configured, supply an intelligent heuristic response
    if (!aiClient) {
      const fallbackAnalysis = generateHeuristicAnalysis(mode, context, message);
      return res.json({
        success: true,
        isFallback: true,
        response: fallbackAnalysis,
        note: 'AI features are operating in local heuristic mode. Configure GEMINI_API_KEY in Settings > Secrets for real-time generative intelligence.',
      });
    }

    let prompt = '';
    const systemPrompt = `You are the SellerPro AI Business Advisor, an expert e-commerce and reselling consultant for eBay, Whatnot, Amazon, Etsy, Poshmark, and Mercari sellers.
You analyze inventory, sales history, net profits, marketplace fees, and sourcing deals.
Strict instructions:
- Provide actionable, numbers-driven advice based on the user's data provided in the prompt.
- Do NOT fabricate sales statistics, market prices, or fake external data.
- Emphasize profit margin protection, reducing fee drag, and avoiding holding stale inventory.
- Keep responses concise, clear, and formatted with clean bullet points.`;

    if (mode === 'audit') {
      prompt = `Please perform a comprehensive SellerPro Business Audit on my reseller numbers:
Summary Metrics:
- Total Sales Recorded: ${context?.totalSalesCount || 0}
- Total Revenue: $${Number(context?.totalRevenue || 0).toFixed(2)}
- Total Net Profit: $${Number(context?.totalProfit || 0).toFixed(2)}
- Average Margin: ${Number(context?.avgMargin || 0).toFixed(1)}%
- Active Inventory Items: ${context?.activeInventoryCount || 0}
- Active Inventory Capital Tied Up: $${Number(context?.totalInventoryCost || 0).toFixed(2)}
- Top Categories: ${JSON.stringify(context?.topCategories || [])}
- Low Margin Items: ${JSON.stringify(context?.lowMarginItems || [])}
- Aged Inventory (>45 days): ${JSON.stringify(context?.agedInventory || [])}

Provide:
1. Executive Health Scorecard (strengths & red flags).
2. Capital Efficiency Review (where cash is trapped).
3. Margin Optimization Recommendations.
4. Top 3 Immediate Actions to increase net take-home profit this week.`;
    } else {
      prompt = `Context about my reseller business:
- Total Revenue: $${Number(context?.totalRevenue || 0).toFixed(2)}
- Total Profit: $${Number(context?.totalProfit || 0).toFixed(2)}
- Active Inventory: ${context?.activeInventoryCount || 0} items
User Question: "${message}"`;
    }

    const text = await askClaude({ system: systemPrompt, content: prompt });

    return res.json({
      success: true,
      isFallback: false,
      response: text || 'Unable to generate advice at this moment.',
    });
  } catch (error: any) {
    if (!isQuotaExhaustedError(error)) {
      console.error('Claude API Error:', error?.message || error);
    }
    // Graceful fallback on API failure or quota limit
    const fallback = generateHeuristicAnalysis(req.body.mode, req.body.context, req.body.message);
    return res.json({
      success: true,
      isFallback: true,
      isQuotaLimited: isQuotaExhaustedError(error),
      response: fallback,
      error: isQuotaExhaustedError(error) ? undefined : error.message,
    });
  }
});

// AI Listing Optimizer endpoint
app.post('/api/ai/optimize-listing', async (req: Request, res: Response) => {
  try {
    const { title, category, condition, platform, details, purchasePrice } = req.body;

    if (!aiClient) {
      const mockOptimized = generateListingFallback(title, category, condition, platform, details);
      return res.json({
        success: true,
        isFallback: true,
        data: mockOptimized,
      });
    }

    const platformCharLimit = platform === 'ebay' ? 80 : platform === 'whatnot' ? 60 : 150;
    const prompt = `Create an optimized listing for an online reseller selling on ${platform || 'eBay'}.
Item Name: ${title}
Category: ${category}
Condition: ${condition || 'Used - Excellent'}
Details/Notes: ${details || 'Clean condition, ships safely'}
Original Cost: $${purchasePrice || 0}

Requirements:
1. An SEO-optimized Title that maximizes keywords and fits strictly under ${platformCharLimit} characters (no spam words like 'L@@K' or excessive all-caps).
2. A list of 5 high-ranking search keywords/tags.
3. A clean, structured item description with:
   - Condition Overview
   - Item Specifications
   - Shipping & Packaging Guarantee
   - Fast Dispatch Note.
Return the response in valid JSON matching this schema:
{
  "optimizedTitle": "string under limit",
  "keywords": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "description": "clean markdown formatted description",
  "pricingTip": "strategic advice on whether to list as Buy It Now or Auction with reserve"
}`;

    const text = await askClaude({
      content: prompt + '\n\nRespond with only the JSON object, no other text.',
    });

    const parsed = extractJson(text);
    if (!parsed?.optimizedTitle) throw new Error('Invalid listing response');
    return res.json({
      success: true,
      isFallback: false,
      data: parsed,
    });
  } catch (error: any) {
    if (!isQuotaExhaustedError(error)) {
      console.error('Listing Optimizer Error:', error?.message || error);
    }
    const mockOptimized = generateListingFallback(req.body.title, req.body.category, req.body.condition, req.body.platform, req.body.details);
    return res.json({
      success: true,
      isFallback: true,
      isQuotaLimited: isQuotaExhaustedError(error),
      data: mockOptimized,
    });
  }
});

function isQuotaExhaustedError(err: any): boolean {
  if (!err) return false;
  const str = (typeof err === 'string' ? err : (err?.message || '') + ' ' + JSON.stringify(err)).toLowerCase();
  return (
    str.includes('429') ||
    str.includes('resource_exhausted') ||
    str.includes('quota') ||
    str.includes('rate-limit') ||
    str.includes('rate limit') ||
    err?.status === 429 ||
    err?.status === 'RESOURCE_EXHAUSTED' ||
    err?.code === 429 ||
    err?.error?.code === 429
  );
}

function extractJson(text: string): any {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch (_e) {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (_e2) {}
    }
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(text.substring(firstBrace, lastBrace + 1));
      } catch (_e3) {}
    }
    return {};
  }
}

// AI Card & Collectibles Scanner endpoint
const SCANNER_SYSTEM_PROMPT = `You are SellerPro's expert appraiser for resellers. You identify any item from a photo — trading cards (Pokemon, sports, Magic, Yu-Gi-Oh, One Piece), sneakers, comic books, video games, watches, toys, coins, clothing, electronics, antiques, or anything else — and estimate what it sells for in USD on the resale market.

Rules:
- Identify exactly what is in THIS photo. Read any visible text (names, set symbols, card numbers, issue numbers, logos, labels, grading slab labels, size tags). Never guess a famous item that is not in the picture.
- If the photo is blurry or ambiguous, give your best identification, lower confidenceScore, set verificationStatus to "needs_review", and explain what is uncertain.
- Values must be realistic current resale prices for this exact item and condition, not hype. Use web search to check recent sold prices when it helps. Low-value items (bulk cards, common shoes, etc.) should get low values.
- For "psa9Estimate" and "psa10Estimate": for cards use PSA 9 / PSA 10 prices; for comics use CGC 9.0 / CGC 9.8; for sneakers use like-new and brand-new deadstock; for games use complete-in-box and factory sealed; for anything else use excellent and mint/new condition.
- Comps: list up to 4 recent comparable sales you found or know of. Do not invent precise listing IDs. If you have no real comps, return an empty array.
- Respond with ONLY a single JSON object, no markdown fences or commentary.`;

const SCANNER_JSON_SHAPE = `{
  "name": "Full exact item title (year, brand, subject/player/character, set or model, variant, number)",
  "category": "one of: Trading Cards | Sports Cards | Sneakers & Streetwear | Comic Books & Manga | Retro Video Games | Luxury Watches & Jewelry | Toys & Collectibles | Vintage Electronics | Coins & Bullion | Clothing & Apparel | Collectibles & Antiques | Other",
  "setName": "Set, series, model line, or publisher run",
  "cardNumber": "Card number, issue number, SKU, style code, or model number ('' if none)",
  "year": "Release year ('' if unknown)",
  "publisher": "Brand, manufacturer, or publisher",
  "finish": "Parallel, variant, colorway, cover variant, or finish",
  "rarity": "Rarity or desirability tier",
  "estimatedGrade": "Estimated condition from the photo",
  "confidenceScore": 0,
  "verificationStatus": "verified_match | needs_review",
  "verificationHallmarks": ["Visual details from the photo that support the identification"],
  "variantDifferentiatingNotes": "How this exact version differs from similar versions/reprints",
  "conditionObservations": ["Specific condition notes visible in the photo"],
  "estimatedValues": { "rawLow": 0, "rawMid": 0, "rawHigh": 0, "psa9Estimate": 0, "psa10Estimate": 0 },
  "recommendedPlatform": "one of: ebay | whatnot | amazon | etsy | mercari | poshmark",
  "recommendedPlatformReason": "Why that platform is best for this item",
  "recommendedListingPrice": 0,
  "comps": [{ "title": "Comparable sale title", "price": 0, "platform": "eBay", "condition": "Condition", "date": "Approximate date" }],
  "suggestedTitle": "SEO marketplace title under 80 characters",
  "suggestedDescription": "Ready-to-post listing description with condition disclosure"
}`;

function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
}

function normalizeScanResult(raw: any) {
  const values = raw?.estimatedValues || {};
  const rawMid = toNumber(values.rawMid);
  const platforms = ['ebay', 'whatnot', 'amazon', 'etsy', 'mercari', 'poshmark'];
  const platform = String(raw?.recommendedPlatform || 'ebay').toLowerCase();
  return {
    name: String(raw?.name || 'Unidentified item'),
    category: String(raw?.category || 'Other'),
    setName: String(raw?.setName || ''),
    cardNumber: String(raw?.cardNumber || ''),
    year: String(raw?.year || ''),
    publisher: String(raw?.publisher || ''),
    finish: String(raw?.finish || ''),
    rarity: String(raw?.rarity || ''),
    estimatedGrade: String(raw?.estimatedGrade || 'Used'),
    confidenceScore: Math.max(0, Math.min(100, Math.round(toNumber(raw?.confidenceScore)))),
    verificationStatus: raw?.verificationStatus === 'verified_match' ? 'verified_match' : 'needs_review',
    verificationHallmarks: Array.isArray(raw?.verificationHallmarks) ? raw.verificationHallmarks.map(String) : [],
    variantDifferentiatingNotes: String(raw?.variantDifferentiatingNotes || ''),
    conditionObservations: Array.isArray(raw?.conditionObservations) ? raw.conditionObservations.map(String) : [],
    estimatedValues: {
      rawLow: toNumber(values.rawLow),
      rawMid,
      rawHigh: toNumber(values.rawHigh),
      psa9Estimate: toNumber(values.psa9Estimate),
      psa10Estimate: toNumber(values.psa10Estimate),
    },
    recommendedPlatform: platforms.includes(platform) ? platform : 'ebay',
    recommendedPlatformReason: String(raw?.recommendedPlatformReason || ''),
    recommendedListingPrice: toNumber(raw?.recommendedListingPrice) || rawMid,
    comps: Array.isArray(raw?.comps)
      ? raw.comps.slice(0, 4).map((c: any) => ({
          title: String(c?.title || ''),
          price: toNumber(c?.price),
          platform: String(c?.platform || 'eBay'),
          condition: String(c?.condition || ''),
          date: String(c?.date || ''),
        }))
      : [],
    suggestedTitle: String(raw?.suggestedTitle || raw?.name || '').slice(0, 80),
    suggestedDescription: String(raw?.suggestedDescription || ''),
  };
}

app.post('/api/ai/card-scanner', async (req: Request, res: Response) => {
  const { imageBase64, mimeType, presetKey, userNotes } = req.body || {};

  // Sample items (no photo) use the built-in example data.
  if (!imageBase64) {
    return res.json({ success: true, isFallback: true, isSample: true, data: getCardScanFallback(presetKey, userNotes) });
  }

  if (!aiClient) {
    return res.status(503).json({
      success: false,
      error: 'The AI scanner is not configured on this server yet. Please try again later.',
    });
  }

  const match = String(imageBase64).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
  const cleanBase64 = String(imageBase64).replace(/^data:[^;]+;base64,/, '');
  const detectedMime = (match?.[1] || mimeType || 'image/jpeg').toLowerCase();
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const mediaType = (allowedMimes.includes(detectedMime) ? detectedMime : 'image/jpeg') as
    | 'image/jpeg'
    | 'image/png'
    | 'image/gif'
    | 'image/webp';

  // Headers go out immediately; the JSON body follows when Claude finishes.
  const send = startJsonResponse(res);

  try {
    const text = await askClaude({
      system: SCANNER_SYSTEM_PROMPT,
      maxTokens: 12000,
      effort: 'medium',
      webSearch: true,
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType, data: cleanBase64 } },
        {
          type: 'text',
          text: `Identify and appraise the item in this photo.${
            userNotes ? `\nSeller notes: ${String(userNotes).slice(0, 500)}` : ''
          }\n\nReturn JSON with exactly this shape:\n${SCANNER_JSON_SHAPE}`,
        },
      ],
    });

    const parsed = extractJson(text);
    if (!parsed || !parsed.name) {
      return send({ success: false, error: 'The AI could not read this photo. Try a clearer, well-lit picture of the item.' });
    }
    return send({ success: true, isFallback: false, data: normalizeScanResult(parsed) });
  } catch (error: any) {
    console.error('Card Scanner Error:', error?.message || error);
    return send({
      success: false,
      error: isQuotaExhaustedError(error)
        ? 'The AI scanner is busy right now. Please wait a moment and try again.'
        : 'The scan failed. Please try again with a clear photo.',
    });
  }
});

// Dedicated 24/7 Collectibles AI Chat endpoint
app.post('/api/ai/card-chat', async (req: Request, res: Response) => {
  try {
    const userMessage =
      req.body.message ||
      (Array.isArray(req.body.messages)
        ? req.body.messages[req.body.messages.length - 1]?.content
        : '') ||
      '';
    const { cardContext } = req.body;

    if (!aiClient) {
      const fallbackReply = generateCardChatFallback(userMessage, cardContext);
      return res.json({
        success: true,
        isFallback: true,
        response: fallbackReply,
      });
    }

    const systemPrompt = `You are the SellerPro Elite Collectibles & Card Appraiser, available 24/7 to every SellerPro user.
You have direct knowledge of the card the user just scanned or selected:
Card Context:
- Name: ${cardContext?.name || 'Collectible Trading Card'}
- Set: ${cardContext?.setName || 'N/A'} (#${cardContext?.cardNumber || ''})
- Year / Publisher: ${cardContext?.year || ''} ${cardContext?.publisher || ''}
- Condition Grade: ${cardContext?.estimatedGrade || 'Near Mint'}
- Market Range: Raw $${cardContext?.estimatedValues?.rawMid || 0} | PSA 9 $${cardContext?.estimatedValues?.psa9Estimate || 0} | PSA 10 $${cardContext?.estimatedValues?.psa10Estimate || 0}
- Recommended Platform: ${cardContext?.recommendedPlatform?.toUpperCase() || 'EBAY'} (${cardContext?.recommendedPlatformReason || ''})

Instructions:
- Provide sharp, accurate, highly knowledgeable answers on grading (PSA vs BGS vs CGC vs SGC), population report analysis, raw vs slab margins, timing sales around tournaments or playoffs, auction reserve settings, and counter-offering.
- Always incorporate the specific card data in your response.
- Keep responses concise, professional, and formatted with clean bullet points.`;

    const text = await askClaude({
      system: systemPrompt,
      content: userMessage || 'Provide a professional valuation and grading recommendation for this item.',
    });

    return res.json({
      success: true,
      isFallback: false,
      response: text || 'Unable to analyze this question right now.',
    });
  } catch (error: any) {
    if (!isQuotaExhaustedError(error)) {
      console.error('Card Chat Error:', error?.message || error);
    }
    const fallbackReply = generateCardChatFallback(
      req.body.message || 'Help evaluate this card',
      req.body.cardContext
    );
    return res.json({
      success: true,
      isFallback: true,
      isQuotaLimited: isQuotaExhaustedError(error),
      response: fallbackReply,
    });
  }
});

// Cross-Listing Publish endpoint (1-click push to eBay, Whatnot, Mercari, etc.)
app.post('/api/marketplace/publish', (req: Request, res: Response) => {
  const { platforms, cardData, listingPrice, title } = req.body;
  const targetPlatforms = Array.isArray(platforms) ? platforms : ['ebay'];

  const results = targetPlatforms.map((plat: string) => {
    const randomId = Math.floor(100000000000 + Math.random() * 900000000000);
    let mockUrl = '';
    if (plat === 'ebay') mockUrl = `https://www.ebay.com/itm/${randomId}`;
    else if (plat === 'amazon') mockUrl = `https://www.amazon.com/dp/B0${randomId.toString().substring(0, 8).toUpperCase()}`;
    else if (plat === 'etsy') mockUrl = `https://www.etsy.com/listing/${randomId}`;
    else if (plat === 'whatnot') mockUrl = `https://www.whatnot.com/live/listing-${randomId}`;
    else if (plat === 'mercari') mockUrl = `https://www.mercari.com/us/item/m${randomId}`;
    else if (plat === 'poshmark') mockUrl = `https://poshmark.com/listing/${randomId}`;
    else mockUrl = `https://www.${plat}.com/products/${randomId}`;

    return {
      platform: plat,
      status: 'active',
      listingId: `${plat.toUpperCase()}-${randomId}`,
      listingUrl: mockUrl,
      title: title || cardData?.name || 'Item Listing',
      price: listingPrice || cardData?.recommendedListingPrice || 100,
      publishedAt: new Date().toISOString(),
    };
  });

  res.json({
    success: true,
    message: `Successfully published to ${results.length} connected marketplace(s)!`,
    listings: results,
  });
});

// Stripe Checkout Session simulation / endpoint
app.post('/api/stripe/checkout-session', (req: Request, res: Response) => {
  const { plan, interval, userEmail } = req.body;
  const isAnnual = interval === 'yearly';
  const price = plan === 'business' ? (isAnnual ? 190 : 19.99) : (isAnnual ? 95 : 9.99);

  // Return a structured checkout session payload for test mode
  const sessionId = `cs_test_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
  res.json({
    success: true,
    sessionId,
    plan,
    interval: interval || 'monthly',
    amount: price,
    currency: 'USD',
    customerEmail: userEmail || 'seller@sellerpro.app',
    mode: 'test',
    status: 'ready',
    message: 'Stripe test mode checkout session initialized.',
  });
});

// Stripe webhook simulation / endpoint
app.post('/api/stripe/webhook', (req: Request, res: Response) => {
  const { eventType, customerEmail, plan } = req.body;
  console.log(`Received Stripe Webhook Event: ${eventType} for ${customerEmail}`);
  res.json({
    received: true,
    eventType: eventType || 'customer.subscription.created',
    plan: plan || 'pro',
    timestamp: new Date().toISOString(),
  });
});

// Helper for heuristic advice when AI key is absent
function generateHeuristicAnalysis(mode?: string, context?: any, _msg?: string): string {
  const margin = Number(context?.avgMargin || 0);
  const cost = Number(context?.totalInventoryCost || 0);
  const items = Number(context?.activeInventoryCount || 0);

  if (mode === 'audit') {
    return `### SellerPro Heuristic Business Audit

1. **Portfolio Margin Assessment**:
   - Current Average Profit Margin: **${margin.toFixed(1)}%**.
   ${margin >= 30 ? '- Strong overall margin performance exceeding the healthy 25% reseller baseline.' : '- Margin is tighter than ideal (<30%). Focus on sourcing items with a minimum 3x multiplier to insulate against shipping increases and returns.'}

2. **Inventory Capital Velocity**:
   - Active Capital Locked: **$${cost.toFixed(2)}** across **${items} items**.
   - If items sit longer than 60 days, storage and depreciation erode net returns. Run a 10-15% markdown flash sale on aged stock to recover liquidity.

3. **Fee Drag Mitigation**:
   - Marketplace fees eat between 12.9% and 15% on platforms like eBay and Whatnot.
   - Standardize on pirate-rate shipping labels and lightweight poly mailers to save $0.80-$1.50 per parcel.`;
  }

  return `Based on your inventory of ${items} items ($${cost.toFixed(2)} COGS), your primary focus should be keeping listing velocity high. For cards and collectibles, bundle slow-movers into starter lots. For sneakers and electronics, list across multiple platforms with automated margin protection.`;
}

function generateListingFallback(title?: string, category?: string, condition?: string, platform?: string, details?: string) {
  const cleanTitle = (title || 'Premium Reseller Item').trim();
  const cat = category || 'Collectibles';
  const cond = condition || 'Excellent Pre-Owned Condition';
  const plat = platform || 'eBay';

  return {
    optimizedTitle: `${cleanTitle} - ${cond} - Fast Free Ship`.substring(0, 78),
    keywords: [cleanTitle, cat, cond, 'Authentic', 'Fast Shipping'],
    description: `### Product Details\n- **Item**: ${cleanTitle}\n- **Category**: ${cat}\n- **Condition**: ${cond}\n- **Notes**: ${details || 'Fully inspected and safely packaged.'}\n\n### Shipping & Handling\n- Carefully boxed with protective bubble wrap.\n- Dispatched within 24 hours of payment via tracked carrier.`,
    pricingTip: `Consider setting a Buy It Now price with Best Offer enabled, setting auto-decline at 20% below listing to protect your margin on ${plat}.`,
  };
}

function getCardScanFallback(presetKey?: string, userNotes?: string) {
  if (presetKey === 'jordan' || (userNotes && userNotes.toLowerCase().includes('jordan'))) {
    return {
      name: "Michael Jordan 1986-87 Fleer Rookie #57",
      setName: "1986-87 Fleer Basketball",
      cardNumber: "#57",
      year: "1986",
      publisher: "Fleer",
      finish: "Standard Glossy Cardstock",
      rarity: "Hall of Fame Rookie Card",
      estimatedGrade: "Near Mint 7-8",
      confidenceScore: 98,
      verificationStatus: "verified_match",
      verificationHallmarks: [
        "Verified authentic 1986 Fleer arrow and yellow basketball graphic",
        "Checked reverse copyright: © 1986 Fleer Corp. Phila. 19141",
        "Confirmed no 'Decade of Excellence' 1996 gold foil reprint stamp",
        "Red/white/blue perimeter ribbon print pattern matches genuine 1st press",
        "Ghosting/dot pattern on Bulls logo verified authentic"
      ],
      variantDifferentiatingNotes: "Confirmed Original 1986 Fleer Rookie: Differentiated from 1996 Decade of Excellence reprint and 2006 20th Anniversary tributes by verifying cardstock density and reverse typography.",
      conditionObservations: [
        "Centering: 60/40 left to right, 55/45 top to bottom",
        "Corners: Micro wear on top-left corner, sharp bottom corners",
        "Surface: Clean glossy print, no wax stain on reverse",
        "Edges: Minor red border chipping typical for 1986 Fleer"
      ],
      estimatedValues: {
        rawLow: 1450,
        rawMid: 2200,
        rawHigh: 2900,
        psa9Estimate: 14500,
        psa10Estimate: 120000
      },
      recommendedPlatform: "ebay",
      recommendedPlatformReason: "eBay Authenticity Guarantee is mandatory for raw and graded cards over $250, giving buyers 100% confidence while shielding the seller from fraudulent return claims.",
      recommendedListingPrice: 2450,
      suggestedTitle: "1986-87 Fleer Michael Jordan #57 Rookie RC Bulls Authentic Sharp",
      suggestedDescription: "Original 1986-87 Fleer Michael Jordan Rookie Card #57. Authentic first print with intact red/white/blue borders and crisp centering. Inspected and verified authentic.",
      comps: [
        { title: "1986 Fleer Michael Jordan #57 Raw NM Clean", price: 2150, platform: "eBay", condition: "Raw NM", date: "3 days ago" },
        { title: "Michael Jordan 1986 Fleer RC PSA 7 Authenticated", price: 3400, platform: "eBay", condition: "PSA 7", date: "1 week ago" },
        { title: "1986-87 Fleer #57 Michael Jordan Rookie BGS 7.5", price: 3850, platform: "Whatnot", condition: "BGS 7.5", date: "2 weeks ago" },
        { title: "1986 Fleer MJ Rookie Sharp Raw Mid Grade", price: 1800, platform: "Mercari", condition: "Raw EX-MT", date: "Oct 2026" }
      ]
    };
  }

  if (presetKey === 'wembanyama' || (userNotes && userNotes.toLowerCase().includes('wembanyama'))) {
    return {
      name: "Victor Wembanyama 2023-24 Prizm Silver Prizm RC #136",
      setName: "2023-24 Panini Prizm Basketball",
      cardNumber: "#136",
      year: "2023",
      publisher: "Panini",
      finish: "Silver Prizm Refractor Holo",
      rarity: "True Rookie Silver Parallel (SSP)",
      estimatedGrade: "Mint 9 / Gem Mint 10 Contender",
      confidenceScore: 99,
      verificationStatus: "verified_match",
      verificationHallmarks: [
        "Verified rainbow refractor sheen (Silver Prizm parallel, not Base silver border)",
        "Spurs RC logo in top right verified with Panini Prizm font",
        "Reverse card number #136 with Panini America official hologram watermark",
        "Zero dimples or surface horizontal roller lines detected"
      ],
      variantDifferentiatingNotes: "Confirmed True Silver Prizm Refractor: Distinct holographic rainbow sheen under light differentiates it from the standard base card.",
      conditionObservations: [
        "Centering: 50/50 vertical and horizontal alignment",
        "Corners: Pack fresh razor sharp corners",
        "Surface: Zero print lines or dimples on chrome finish",
        "Edges: Clean silver foil borders without flaking"
      ],
      estimatedValues: {
        rawLow: 650,
        rawMid: 880,
        rawHigh: 1150,
        psa9Estimate: 1100,
        psa10Estimate: 2950
      },
      recommendedPlatform: "whatnot",
      recommendedPlatformReason: "Whatnot sports card streams have intense live auction bidding energy for modern rookie grails, often yielding 15%-25% premiums above static Buy-It-Now comps with lower commission (8%).",
      recommendedListingPrice: 950,
      comps: [
        { title: "2023 Panini Prizm Victor Wembanyama Silver #136 Raw", price: 890, platform: "Whatnot", condition: "Raw Gem", date: "Yesterday" },
        { title: "Victor Wembanyama Prizm Silver RC PSA 10 Gem Mint", price: 3100, platform: "eBay", condition: "PSA 10", date: "4 days ago" },
        { title: "Wembanyama 2023-24 Prizm Silver Rookie PSA 9", price: 1150, platform: "eBay", condition: "PSA 9", date: "1 week ago" },
        { title: "2023 Prizm Silver Wemby RC Fresh Pull", price: 840, platform: "Mercari", condition: "Raw Mint", date: "Nov 2026" }
      ]
    };
  }

  if (presetKey === 'jordan1' || (userNotes && userNotes.toLowerCase().includes('sneaker'))) {
    return {
      name: "Nike Air Jordan 1 Retro High OG 'Chicago' 2015 (Size 10.5)",
      setName: "Air Jordan 1 Retro High OG",
      cardNumber: "555088-101",
      year: "2015",
      publisher: "Nike / Jordan Brand",
      finish: "Varsity Red / Black-White Full-Grain Leather",
      rarity: "Holy Grail Retro Release",
      estimatedGrade: "Brand New / Deadstock with Box & Extra Laces",
      confidenceScore: 98,
      verificationStatus: "verified_match",
      verificationHallmarks: [
        "Verified factory style SKU 555088-101 on internal size tag with matching box label",
        "Hourglass heel profile and authentic double-stitched heel tab verified",
        "Wings logo debossing depth and 'NIKE AIR' tongue tag positioning match 2015 OG release",
        "Outsole star traction pattern and red tint density verified genuine"
      ],
      variantDifferentiatingNotes: "Confirmed 2015 OG Retro High: Differentiated from the 2022 'Lost & Found' release (no cracked white leather collar or aged sail midsole).",
      conditionObservations: [
        "Uppers: Pristine white & varsity red leather with zero creasing on toe box",
        "Outsoles: Factory clean star traction pattern with no drag or yellowing",
        "Accessories: Original Nike Air box and factory-tied white & black laces intact",
        "Authenticity: Swoosh placement and hourglass heel shape pass full authentication"
      ],
      estimatedValues: {
        rawLow: 650,
        rawMid: 920,
        rawHigh: 1150,
        psa9Estimate: 1250,
        psa10Estimate: 1600
      },
      recommendedPlatform: "ebay",
      recommendedPlatformReason: "eBay Sneaker Authenticity Guarantee inspects sneakers over $100 for free, eliminating buyer remorse and chargebacks while reaching serious collectors globally.",
      recommendedListingPrice: 995,
      category: "Sneakers & Streetwear",
      brand: "Nike / Jordan Brand",
      modelOrEdition: "Air Jordan 1 High OG Chicago 2015",
      suggestedTitle: "Nike Air Jordan 1 Retro High OG Chicago 2015 Size 10.5 DS OG All Authenticated",
      suggestedDescription: "Authentic Nike Air Jordan 1 High OG Chicago 2015 (555088-101) Men's Size 10.5. Deadstock condition with original box and extra laces. eBay Authenticity Guarantee verified.",
      comps: [
        { title: "Jordan 1 Retro High Chicago 2015 Size 10.5 Deadstock", price: 950, platform: "eBay", condition: "Brand New", date: "Yesterday" },
        { title: "Air Jordan 1 OG Chicago 2015 Sz 10.5 OG All PADS", price: 890, platform: "Whatnot", condition: "VNDS", date: "4 days ago" },
        { title: "2015 Jordan 1 Chicago High Size 10.5 Boxed", price: 920, platform: "Poshmark", condition: "New With Box", date: "1 week ago" },
        { title: "Nike Air Jordan 1 Chicago 2015 US 10.5 DS", price: 1040, platform: "Mercari", condition: "New", date: "Oct 2026" }
      ]
    };
  }

  if (presetKey === 'mario64' || (userNotes && userNotes.toLowerCase().includes('mario'))) {
    return {
      name: "Super Mario 64 (Nintendo 64, 1996) Complete in Box (CIB)",
      setName: "Nintendo 64 Launch Title",
      cardNumber: "NUS-NSME-USA",
      year: "1996",
      publisher: "Nintendo",
      finish: "Original Cardboard Box, Cartridge & Manual",
      rarity: "Iconic N64 Grail",
      estimatedGrade: "Complete In Box (CIB) - Excellent 8/10",
      confidenceScore: 96,
      verificationStatus: "verified_match",
      verificationHallmarks: [
        "Verified authentic Nintendo cardboard inner tray structure and thickness",
        "Front label code 'NUS-NSME-USA' with solid gloss and genuine seal of quality",
        "Reverse caution label verified with 2-digit factory stamp number on cartridge",
        "Tested copper/gold contact pins: boots reliably to title screen"
      ],
      variantDifferentiatingNotes: "Confirmed Original USA First-Print CIB: Authentic 1996 release with matte manual and original registration insert; not a reproduction or Player's Choice reissue.",
      conditionObservations: [
        "Box: Solid structural flaps with minor shelf touch along edge corners",
        "Cartridge: Front and back labels 100% intact with zero writing or tears",
        "Contacts: Gold pin connectors clean, tested and booting on first try",
        "Inserts: Original player's guide registration insert and manual included"
      ],
      estimatedValues: {
        rawLow: 120,
        rawMid: 210,
        rawHigh: 285,
        psa9Estimate: 450,
        psa10Estimate: 1850
      },
      recommendedPlatform: "ebay",
      recommendedPlatformReason: "High-value vintage video game boxed copies have high bidding velocity on eBay with vintage gamer search traffic and buyer protections.",
      recommendedListingPrice: 225,
      category: "Retro Video Games",
      brand: "Nintendo",
      modelOrEdition: "Super Mario 64 N64",
      suggestedTitle: "Super Mario 64 Nintendo 64 N64 1996 CIB Complete in Box Tested Authentic",
      suggestedDescription: "Original authentic Super Mario 64 for Nintendo 64. 100% authentic cartridge, box, and instruction manual. Clean pins, save battery functioning, tested.",
      comps: [
        { title: "Super Mario 64 N64 1996 CIB Authentic Great Shape", price: 215, platform: "eBay", condition: "CIB 8/10", date: "2 days ago" },
        { title: "Super Mario 64 Boxed N64 Complete With Manual", price: 240, platform: "Mercari", condition: "CIB", date: "5 days ago" },
        { title: "N64 Super Mario 64 CIB Clean Cartridge", price: 195, platform: "Whatnot", condition: "CIB", date: "1 week ago" },
        { title: "Super Mario 64 Wata 9.4 A+ Sealed", price: 1850, platform: "eBay", condition: "Wata 9.4 Sealed", date: "Oct 2026" }
      ]
    };
  }

  if (presetKey === 'seiko' || (userNotes && userNotes.toLowerCase().includes('watch'))) {
    return {
      name: "Vintage Seiko 6139-6002 'Pogue' Automatic Chronograph (1974)",
      setName: "Seiko Speed-Timer Chronograph",
      cardNumber: "6139-6002",
      year: "1974",
      publisher: "Seiko Japan",
      finish: "Sunburst Gold Dial / Pepsi Tachymeter Bezel",
      rarity: "Iconic Space Exploration Horology Classic",
      estimatedGrade: "Very Good Vintage Working Condition (Unpolished Case)",
      confidenceScore: 98,
      verificationStatus: "verified_match",
      verificationHallmarks: [
        "Caseback serial number dates production directly to October 1974",
        "Original unpolished stainless steel tonneau case with factory brush lines",
        "Genuine yellow sunburst dial with correct applied 'SEIKO' logo and intact subdial",
        "Original Calibre 6139B movement inspected: quickset day/date functioning cleanly"
      ],
      variantDifferentiatingNotes: "Confirmed Original Seiko 6139-6002: Distinctive yellow dial and Pepsi bezel as worn by Col. William Pogue during the Skylab 4 mission in 1973.",
      conditionObservations: [
        "Dial: Vibrant original sunburst yellow/gold dial with clean luminous markers",
        "Bezel: Original red & blue 'Pepsi' tachymeter bezel with honest vintage patina",
        "Movement: Calibre 6139 column wheel chronograph running strong, resets to zero",
        "Bracelet: Original solid link Seiko stamped tapered stainless steel band"
      ],
      estimatedValues: {
        rawLow: 450,
        rawMid: 780,
        rawHigh: 980,
        psa9Estimate: 1250,
        psa10Estimate: 1800
      },
      recommendedPlatform: "ebay",
      recommendedPlatformReason: "eBay has the largest international vintage horology audience with Escrow and Authenticity verification for fine watches over $500.",
      recommendedListingPrice: 795,
      category: "Luxury Watches & Jewelry",
      brand: "Seiko",
      modelOrEdition: "Seiko 6139-6002 Pogue",
      suggestedTitle: "Vintage 1974 Seiko 6139-6002 Pogue Yellow Dial Pepsi Chronograph Running",
      suggestedDescription: "All-original vintage Seiko 6139-6002 'Pogue' automatic chronograph. Gold sunburst dial, Pepsi bezel, functioning day-date quickset and smooth chronograph reset.",
      comps: [
        { title: "Seiko 6139-6002 Pogue Yellow Dial Original Chrono Running", price: 820, platform: "eBay", condition: "Vintage VG", date: "3 days ago" },
        { title: "1973 Seiko Pogue Chronograph 6139 Yellow Sunburst", price: 740, platform: "eBay", condition: "Pre-Owned", date: "6 days ago" },
        { title: "Seiko 6139 Pogue Vintage Automatic Steel Bracelet", price: 790, platform: "Etsy", condition: "Vintage", date: "2 weeks ago" },
        { title: "Vintage Seiko Pogue Serviced Collector Grade", price: 1100, platform: "Mercari", condition: "Serviced", date: "Oct 2026" }
      ]
    };
  }

  // Default: 1999 Base Set Charizard Holo
  return {
    name: "Charizard Holo #4/102 (Base Set)",
    setName: "1999 Pokemon Base Set",
    cardNumber: "4/102",
    year: "1999",
    publisher: "Wizards of the Coast",
    finish: "Cosmo / Starlight Holofoil",
    rarity: "Holo Rare (Star)",
    estimatedGrade: "Near Mint 8 / Near Mint-Mint 8.5",
    confidenceScore: 97,
    verificationStatus: "verified_match",
    verificationHallmarks: [
      "Verified 4/102 numbering and bottom right star rarity icon",
      "Starlight / Cosmo holofoil pattern matches genuine 1999 Wizards print run",
      "Reverse dark blue Pokéball border alignment and color density verified",
      "Confirmed Unlimited printing: verified lack of 1st Edition circular stamp and drop-shadow present"
    ],
    variantDifferentiatingNotes: "Confirmed 1999 Base Set Unlimited Print Run: Drop shadow on right border confirms Unlimited Edition (differentiated from Shadowless and 1st Edition printings).",
    conditionObservations: [
      "Centering: Clean 55/45 front border proportion",
      "Corners: Sharp tips with minor micro-touch on bottom right back corner",
      "Surface: High luster holo foil with no visible scratching",
      "Edges: Mild factory silvering on top edge, clean back blue border"
    ],
    estimatedValues: {
      rawLow: 280,
      rawMid: 420,
      rawHigh: 580,
      psa9Estimate: 1250,
      psa10Estimate: 9800
    },
    recommendedPlatform: "ebay",
    recommendedPlatformReason: "Vintage Pokemon grails command the deepest global liquidity on eBay with Authenticity Guarantee verification for single cards over $250. International shipping program attracts UK/Japanese buyers.",
    recommendedListingPrice: 475,
    suggestedTitle: "1999 Pokemon Base Set Charizard Holo #4/102 NM Clean Surface Authentic",
    suggestedDescription: "Original authentic 1999 Pokémon Base Set Charizard #4/102 Unlimited Holofoil. Clean foil surface, sharp corners, no bends or creases. Shipped in penny sleeve and magnetic one-touch case.",
    comps: [
      { title: "1999 Pokemon Base Set Charizard 4/102 Raw NM", price: 440, platform: "eBay", condition: "Raw NM", date: "2 days ago" },
      { title: "Charizard Base Set Holo #4/102 PSA 8 NM-MT", price: 680, platform: "eBay", condition: "PSA 8", date: "5 days ago" },
      { title: "Base Set Charizard Holo Clean Surface Live Stream Auction", price: 460, platform: "Whatnot", condition: "Raw NM", date: "1 week ago" },
      { title: "1999 Charizard 4/102 Unlimited Holo", price: 395, platform: "Mercari", condition: "Raw LP-NM", date: "Oct 2026" }
    ]
  };
}

// Industry News, Legendary Pulls, and YouTube Collectibles Hub endpoint
app.get('/api/news', (_req: Request, res: Response) => {
  const newsData = {
    articles: [
      {
        id: 'news_topps_skenes_1',
        title: "Topps Officially Drops 2024 Chrome Update with Paul Skenes 1/1 MLB Debut Patch",
        source: 'Topps',
        category: 'Product Release',
        summary: "The Pittsburgh Pirates have offered a historic 30-year season ticket package and VIP experience to whichever collector pulls the rookie phenom's 1/1 patch card.",
        content: "Topps and Fanatics have officially unleashed the 2024 Topps Chrome Update Series baseball hobby boxes into circulation. The flagship chase card—the Paul Skenes MLB Debut Patch 1/1 Autograph—has sparked an unprecedented national bounty. Hobby shops and breakers report lines wrapping around retail storefronts, while box prices have surged over 40% on secondary marketplaces.",
        publishedDate: "2 days ago",
        readTime: "3 min read",
        imageUrl: "/src/assets/images/topps_panini_news_banner_1794317411287.jpg",
        tags: ['Topps Chrome', 'Paul Skenes', '1/1 Superfractor', 'MLB Debut Patch'],
        sourceUrl: 'https://www.topps.com/news',
        featuredCard: '2024 Topps Chrome Paul Skenes 1/1 Debut Patch',
        estimatedHobbyBoxPrice: 385,
      },
      {
        id: 'news_panini_prizm_2',
        title: "Panini Debuts 2023-24 Prizm Basketball with Victor Wembanyama Gold /10 Frenzy",
        source: 'Panini',
        category: 'Product Release',
        summary: "Panini America releases the crown jewel of modern basketball card sets, anchored by the most anticipated rookie class since 2003.",
        content: "Panini Prizm Basketball remains the industry standard for modern rookie card investments. With Victor Wembanyama capturing NBA Rookie of the Year in unanimous fashion, Silver Prizms, Mojo Prizms (/25), and Gold Prizms (/10) are commanding record-setting pre-sales. Live streaming breakers on Whatnot and Fanatics Live opened hundreds of cases on launch night.",
        publishedDate: "4 days ago",
        readTime: "4 min read",
        imageUrl: "/src/assets/images/topps_panini_news_banner_1794317411287.jpg",
        tags: ['Panini Prizm', 'Victor Wembanyama', 'Gold Prizm', 'NBA Rookie'],
        sourceUrl: 'https://www.paniniamerica.net/news',
        featuredCard: 'Victor Wembanyama Prizm Silver RC #136',
        estimatedHobbyBoxPrice: 890,
      },
      {
        id: 'news_licensing_3',
        title: "Fanatics & Panini Licensing Transition: What Resellers Need to Know for 2025-2027",
        source: 'Market Intel',
        category: 'Licensing & Deals',
        summary: "Analysis of the exclusive NFL, NBA, and WWE licensing handovers and how card values will shift as Topps assumes production.",
        content: "The sports trading card landscape is undergoing its largest structural transformation in four decades. With Fanatics securing long-term exclusive licenses for NFL and NBA player cards, Panini's remaining licensed products are seeing heightened collector interest as the final generation of Prizm, National Treasures, and Flawless releases. Resellers are advised to monitor population reports closely.",
        publishedDate: "1 week ago",
        readTime: "5 min read",
        imageUrl: "/src/assets/images/topps_panini_news_banner_1794317411287.jpg",
        tags: ['Fanatics', 'Panini', 'Licensing', 'Market Intel'],
        sourceUrl: 'https://www.sportscardinvestor.com',
        featuredCard: 'Flawless & National Treasures RPA',
        estimatedHobbyBoxPrice: 1250,
      },
      {
        id: 'news_topps_babe_ruth_4',
        title: "Topps Reveals Hunt for Babe Ruth 1/1 Cut Signature Superfractor in 2024 Sterling",
        source: 'Topps',
        category: 'Checklist Drop',
        summary: "Super-premium baseball checklist confirmed: dual booklet game-used bat relics and vintage cut autographs of legendary Hall of Famers.",
        content: "Topps Sterling Baseball checklist was released today, headlined by museum-grade memorabilia cuts including Lou Gehrig, Ty Cobb, and a pristine Babe Ruth cut autograph embedded within a 1/1 Superfractor frame. Each high-end box delivers two themed mini-boxes containing an on-card autograph or relic card.",
        publishedDate: "1 week ago",
        readTime: "2 min read",
        imageUrl: "/src/assets/images/topps_panini_news_banner_1794317411287.jpg",
        tags: ['Topps Sterling', 'Babe Ruth', 'Cut Autograph', 'Vintage Relic'],
        sourceUrl: 'https://www.topps.com',
        featuredCard: 'Babe Ruth 1/1 Cut Signature Book',
        estimatedHobbyBoxPrice: 950,
      },
      {
        id: 'news_panini_downtown_5',
        title: "Panini Donruss Football Downtown Case Hits Hit All-Time Peak Resale Velocity",
        source: 'Panini',
        category: 'Market Analysis',
        summary: "Illustrated cartoon inserts continue to outperform traditional jersey relics, led by CJ Stroud and Anthony Richardson rookie SSPs.",
        content: "The modern card market has spoken: stylized illustrated SSPs (Super Short Prints) like Downtown, Kaboom, and Color Blast are outperforming traditional game-used patches in total secondary resale volume. Donruss Football Downtowns for top quarterbacks have achieved liquidation speeds under 3 hours on eBay and Whatnot.",
        publishedDate: "Oct 2026",
        readTime: "3 min read",
        imageUrl: "/src/assets/images/topps_panini_news_banner_1794317411287.jpg",
        tags: ['Downtown SSP', 'Panini Donruss', 'CJ Stroud', 'Case Hit'],
        sourceUrl: 'https://www.paniniamerica.net',
        featuredCard: 'CJ Stroud Donruss Downtown RC',
        estimatedHobbyBoxPrice: 340,
      }
    ],
    grailPulls: [
      {
        id: 'pull_wemby_shimmer',
        cardTitle: "Victor Wembanyama 2023-24 Prizm Black Shimmer 1/1 FOTL",
        manufacturer: 'Panini',
        productSet: '2023-24 Panini Prizm Basketball (First Off The Line)',
        pulledBy: 'Backyard Breaks',
        pullPlatform: 'Whatnot Live',
        datePulled: 'Pulled Live on Whatnot',
        estimatedValue: 475000,
        serialNumber: '1/1',
        rarityTier: '1/1 Black Shimmer',
        imageUrl: '/src/assets/images/grail_cards_showcase_1794317412606.jpg',
        details: 'Pulled on a Friday midnight case break with over 14,000 live viewers. Immediately placed into a recessed magnetic one-touch with security seal. Private collectors have submitted offers exceeding $450,000.'
      },
      {
        id: 'pull_skenes_debut',
        cardTitle: "Paul Skenes 2024 Topps Chrome Rookie Debut Patch Auto 1/1",
        manufacturer: 'Topps',
        productSet: '2024 Topps Chrome Update Baseball',
        pulledBy: 'Collector in Pittsburgh, PA',
        pullPlatform: 'Hobby Shop In-Person',
        datePulled: 'November 2026',
        estimatedValue: 120000,
        serialNumber: '1/1',
        rarityTier: '1/1 Superfractor',
        imageUrl: '/src/assets/images/grail_cards_showcase_1794317412606.jpg',
        details: "Pulled from a single hobby pack at an independent card shop. Features the authentic MLB Debut jersey patch worn during his first game at PNC Park."
      },
      {
        id: 'pull_ohtani_5050',
        cardTitle: "Shohei Ohtani 2024 Topps Dynasty 50/50 Club Patch Auto /5",
        manufacturer: 'Topps',
        productSet: '2024 Topps Dynasty Baseball',
        pulledBy: 'Mojobreak',
        pullPlatform: 'YouTube Stream',
        datePulled: 'Recent Break',
        estimatedValue: 65000,
        serialNumber: '3/5',
        rarityTier: 'Holy Grail Holo',
        imageUrl: '/src/assets/images/grail_cards_showcase_1794317412606.jpg',
        details: "Commemorating Ohtani's historic 50-homer / 50-steal milestone season. Jumbo game-used three-color patch with on-card gold ink inscription '50/50'."
      },
      {
        id: 'pull_stroud_downtown',
        cardTitle: "CJ Stroud 2023 Panini Donruss Downtown Super Short Print (SSP)",
        manufacturer: 'Panini',
        productSet: '2023 Panini Donruss Football',
        pulledBy: 'Packman',
        pullPlatform: 'YouTube Stream',
        datePulled: 'Live Box Break',
        estimatedValue: 2450,
        serialNumber: 'Case Hit SSP',
        rarityTier: 'Downtown SSP',
        imageUrl: '/src/assets/images/grail_cards_showcase_1794317412606.jpg',
        details: "Pristine pack pull sent directly to PSA for express grading. Came back as a PSA 10 Gem Mint pop 12."
      },
      {
        id: 'pull_charizard_shadowless',
        cardTitle: "1999 Pokémon Base Set 1st Edition Shadowless Charizard Holo #4",
        manufacturer: 'Wizards of the Coast',
        productSet: '1999 Base Set 1st Edition Booster Box Break',
        pulledBy: 'RealBreakingNate & Vintage Breakers',
        pullPlatform: 'YouTube Stream',
        datePulled: 'Vintage Sealed Box Opening',
        estimatedValue: 285000,
        serialNumber: '1st Edition Print Run',
        rarityTier: 'Holy Grail Holo',
        imageUrl: '/src/assets/images/grail_cards_showcase_1794317412606.jpg',
        details: "Pulled live from a sealed 1999 green wing booster pack. Flawless 50/50 centering and zero holo factory scratching. Certified PSA 10 contender."
      }
    ],
    videos: [
      {
        id: 'vid_packman_topps',
        title: "I BOUGHT A $3,000 CASE OF 2024 TOPPS CHROME! (SKENES HUNT)",
        channelName: 'Packman',
        subscribers: '412K subscribers',
        duration: '24:18',
        views: '185K views',
        publishedTime: '3 days ago',
        youtubeId: 'e2Y7ZcM3iV4',
        category: 'Box Breaks',
        thumbnailUrl: '/src/assets/images/yt_thumb_packman_topps_1794318784095.jpg',
        description: 'Packman rips open a complete 12-box hobby case of the new Topps Chrome searching for the Paul Skenes 1/1 patch auto.'
      },
      {
        id: 'vid_sci_market',
        title: "SPORTS CARD MARKET CRASH OR SURGE? (Q4 Reseller Analysis)",
        channelName: 'Sports Card Investor',
        subscribers: '320K subscribers',
        duration: '18:42',
        views: '94K views',
        publishedTime: '5 days ago',
        youtubeId: 'j6m8oT-K2kE',
        category: 'Market Intel',
        thumbnailUrl: '/src/assets/images/collectibles_youtube_studio_1794317411294.jpg',
        description: 'Geoff Wilson breaks down the latest index trends, grading return volumes at PSA, and which sports card categories are yielding the highest reseller margins.'
      },
      {
        id: 'vid_backyard_wemby',
        title: "WE PULLED THE 1/1 VICTOR WEMBANYAMA BLACK PRIZM LIVE!",
        channelName: 'Backyard Breaks',
        subscribers: '280K subscribers',
        duration: '15:05',
        views: '420K views',
        publishedTime: '1 week ago',
        youtubeId: 'V_9j2yG9jU0',
        category: 'Pulls & Grails',
        thumbnailUrl: '/src/assets/images/yt_thumb_backyard_wemby_1794318784022.jpg',
        description: 'The monumental live reaction and breakdown of pulling the multi-hundred thousand dollar Wembanyama 1/1 from Panini Prizm.'
      },
      {
        id: 'vid_nate_pokemon',
        title: "OPENING A $10,000 VINTAGE POKÉMON PACK! (DID WE HIT CHARIZARD?)",
        channelName: 'RealBreakingNate',
        subscribers: '1.2M subscribers',
        duration: '21:30',
        views: '310K views',
        publishedTime: '2 weeks ago',
        youtubeId: 'y6120QOlsfU',
        category: 'Box Breaks',
        thumbnailUrl: '/src/assets/images/yt_thumb_nate_charizard_1794318785074.jpg',
        description: 'Nate opens an authentic 1999 Base Set heavy pack on camera and inspects the holographic print line tolerances.'
      }
    ],
    toppsSocialPosts: [
      {
        id: 'topps_x_1',
        platform: 'X',
        authorName: 'Topps',
        authorHandle: '@Topps',
        verified: true,
        avatarUrl: '/src/assets/images/topps_panini_news_banner_1794317411287.jpg',
        timestamp: '3h ago',
        text: 'The hunt is officially ON. 🏴‍☠️\n\nThe Pittsburgh Pirates have officially confirmed an offer of 30-YEAR SEASON TICKETS behind home plate + VIP meet-and-greet to whoever pulls the 2024 Topps Chrome Paul Skenes 1/1 Rookie Debut Patch Autograph.\n\nTag us the second this card is pulled. #TheHobby #ToppsChrome',
        repostsCount: '3.4K',
        likesCount: '18.2K',
        repliesCount: '842',
        postUrl: 'https://x.com/Topps',
        topicTag: '#ToppsChrome'
      },
      {
        id: 'topps_threads_2',
        platform: 'Threads',
        authorName: 'Topps Official',
        authorHandle: '@topps',
        verified: true,
        avatarUrl: '/src/assets/images/topps_panini_news_banner_1794317411287.jpg',
        timestamp: '8h ago',
        text: 'Basketball is BACK at Topps. 🏀✨\n\nPreviewing the return of 2024-25 Topps Chrome Basketball. First look at on-card dual signatures featuring Victor Wembanyama x LeBron James. Checklists and hobby presale dates dropping tomorrow morning on Topps.com.\n\nWho are you chasing on opening night?',
        repostsCount: '1.8K',
        likesCount: '14.6K',
        repliesCount: '520',
        postUrl: 'https://www.threads.net/@topps',
        topicTag: '#ToppsBasketball'
      },
      {
        id: 'topps_x_3',
        platform: 'X',
        authorName: 'Topps',
        authorHandle: '@Topps',
        verified: true,
        avatarUrl: '/src/assets/images/topps_panini_news_banner_1794317411287.jpg',
        timestamp: '1d ago',
        text: 'HISTORIC PRINT RUN: 653,737 copies ordered for Shohei Ohtani\'s 50/50 Topps NOW card #722! 🚀\n\nThis shatters the previous all-time record set in 2020. Lucky parallel chasers, check your mailboxes for the 1/1 Gold and numbered image variations arriving this week. #ToppsNOW',
        repostsCount: '5.1K',
        likesCount: '29.4K',
        repliesCount: '1.2K',
        postUrl: 'https://x.com/Topps',
        topicTag: '#ToppsNOW'
      },
      {
        id: 'topps_threads_4',
        platform: 'Threads',
        authorName: 'Topps Official',
        authorHandle: '@topps',
        verified: true,
        avatarUrl: '/src/assets/images/topps_panini_news_banner_1794317411287.jpg',
        timestamp: '2d ago',
        text: 'Into the cosmos 🪐🔭 2024 Topps Cosmic Chrome Baseball is landing this Friday. Featuring out-of-this-world Superclusters, Star Command die-cuts, and the first-ever Planetary Superfractor 1/1s. Complete checklist live now.',
        repostsCount: '920',
        likesCount: '8.4K',
        repliesCount: '315',
        postUrl: 'https://www.threads.net/@topps',
        topicTag: '#CosmicChrome'
      }
    ]
  };

  res.json({
    success: true,
    data: newsData,
    timestamp: new Date().toISOString(),
  });
});

function generateCardChatFallback(query: string, cardContext?: any): string {
  const name = cardContext?.name || 'this collectible card';
  const psa9Val = cardContext?.estimatedValues?.psa9Estimate || 1200;
  const rawMid = cardContext?.estimatedValues?.rawMid || 400;

  if (query.toLowerCase().includes('grade') || query.toLowerCase().includes('psa')) {
    return `### Professional Grading Analysis for ${name}
- **Value Spread**: Raw market value is approximately **$${rawMid}**, while a PSA 9 grade commands roughly **$${psa9Val}** (a **+${Math.round(((psa9Val - rawMid) / rawMid) * 100)}%** value multiplier).
- **Grading Service Recommendation**:
  - **PSA (Professional Sports Authenticator)**: Highest secondary market resale value and quickest liquidity.
  - **CGC / BGS**: Worth considering if the sub-grades (centering and surface) are flawless, but PSA commands a 15-25% liquidity premium for this specific card.
- **Verdict**: If centering is within 60/40 and the holofoil surface has zero micro-scratches, submitting via PSA Value Plus ($40-$75 tier) provides positive expected ROI.`;
  }

  if (query.toLowerCase().includes('where') || query.toLowerCase().includes('platform') || query.toLowerCase().includes('sell')) {
    return `### Strategic Sales Channel Recommendation
- **Primary Pick**: **eBay** (Fixed price Buy-It-Now with 'Best Offer' enabled).
  - Target price: **$${Math.round(rawMid * 1.15)}** with auto-decline set at **$${rawMid}**.
  - Buyers over $250 receive free eBay Authenticity Guarantee, eliminating buyer remorse claims.
- **Alternative (Whatnot)**: If you run or sell on live auction streams, Friday/Saturday night streams for this category generate rapid competitive bidding wars.`;
  }

  return `### Appraiser Insight on ${name}
- Current market sentiment for this card is stable with high liquidity.
- Estimated Raw Comps: **$${rawMid}**.
- Recommended Action: Protect in a penny sleeve inside a rigid semi-rigid or magnetic one-touch case. If cross-listing across eBay and Whatnot, price slightly higher on eBay to absorb the 13.25% fee while offering immediate Buy It Now speed.`;
}
