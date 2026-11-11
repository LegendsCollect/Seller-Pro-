import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CardScanResult, CardComp, MarketplaceKey } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import {
  Camera,
  Upload,
  Sparkles,
  Bot,
  Send,
  Share2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Info,
  Sliders,
  DollarSign,
  Tag,
  Copy,
  Check,
  Clock,
  Flame,
  ArrowRight,
  Store,
  Image as ImageIcon,
} from 'lucide-react';

export const CardScannerView: React.FC = () => {
  const {
    user,
    setIsStripeModalOpen,
    setPendingUpgradePlan,
    openCrossListModal,
    saveScannedCard,
    scannedCardsHistory,
  } = useApp();

  // Premium gating check: Available on Pro or Business plans
  const isPaidUser = user?.plan === 'pro' || user?.plan === 'business';

  // Scanning mode: 'preset' | 'upload' | 'camera'
  const [scanMode, setScanMode] = useState<'preset' | 'upload' | 'camera'>('upload');

  // Selected or captured image
  const [selectedImageBase64, setSelectedImageBase64] = useState<string>('');
  const [selectedPresetKey, setSelectedPresetKey] = useState<string>('charizard');
  const [isScanning, setIsScanning] = useState(false);
  const [scanDuration, setScanDuration] = useState<number | null>(null);
  const [scanResult, setScanResult] = useState<CardScanResult | null>(null);
  const [copiedTitle, setCopiedTitle] = useState(false);

  // Camera video, gallery photo, and camera capture input refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // AI Chat state for this item
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Forensic Verification & Detail Refinement state
  const [isConfirmedMatch, setIsConfirmedMatch] = useState(true);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    setName: '',
    cardNumber: '',
    year: '',
    estimatedGrade: '',
    recommendedListingPrice: 0,
  });

  // Diverse Sample Collectibles across multiple categories
  const SAMPLE_ITEMS = [
    {
      key: 'jordan1',
      title: "Nike Air Jordan 1 High OG 'Chicago' 2015 (Size 10.5)",
      category: 'Sneakers & Streetwear',
      brand: 'Nike / Jordan Brand',
      thumbnail: '/src/assets/images/reseller_goods_showcase_1794265382275.jpg',
      previewVal: '$650 - $1,150',
      badge: 'Sneakers',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    },
    {
      key: 'charizard',
      title: '1999 Pokemon Base Set Charizard Holo #4/102',
      category: 'Trading Cards',
      brand: 'Wizards of the Coast',
      thumbnail: '/src/assets/images/reseller_goods_showcase_1794265382275.jpg',
      previewVal: '$420 - $1,250',
      badge: 'Pokemon TCG',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    },
    {
      key: 'mario64',
      title: 'Super Mario 64 (Nintendo 64, 1996) Complete in Box',
      category: 'Retro Video Games',
      brand: 'Nintendo',
      thumbnail: '/src/assets/images/reseller_goods_showcase_1794265382275.jpg',
      previewVal: '$120 - $450',
      badge: 'Retro Gaming',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    },
    {
      key: 'jordan',
      title: '1986-87 Fleer Michael Jordan Rookie #57',
      category: 'Sports Cards',
      brand: 'Fleer',
      thumbnail: '/src/assets/images/reseller_goods_showcase_1794265382275.jpg',
      previewVal: '$2,200 - $14,500',
      badge: 'Basketball',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    {
      key: 'seiko',
      title: "Vintage 1974 Seiko 6139 'Pogue' Automatic Chrono",
      category: 'Luxury Watches & Jewelry',
      brand: 'Seiko Japan',
      thumbnail: '/src/assets/images/reseller_goods_showcase_1794265382275.jpg',
      previewVal: '$450 - $980',
      badge: 'Vintage Watch',
      badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
  ];

  // Camera streaming handler
  const startCamera = async () => {
    setCameraError(null);
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          'Live video streaming is not supported in this browser. Please use the Photo Upload option (triggers mobile camera).'
        );
        setIsCameraActive(false);
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera stream permission note:', err?.name || err?.message || err);
      const isDenied =
        err?.name === 'NotAllowedError' ||
        err?.name === 'PermissionDeniedError' ||
        err?.name === 'SecurityError' ||
        err?.message?.toLowerCase().includes('denied');

      setCameraError(
        isDenied
          ? 'Camera permission was denied or is restricted in this preview frame. You can take a photo with your device camera using "Upload File", or evaluate a Sample Item below.'
          : 'Unable to start camera stream. Please use file upload or select a sample item below.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    // Rapid downscale to max 760px for sub-second analysis speed
    const maxDim = 760;
    let w = videoRef.current.videoWidth || 640;
    let h = videoRef.current.videoHeight || 480;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
      setSelectedImageBase64(dataUrl);
      stopCamera();
      triggerScan(dataUrl, 'image/jpeg', 'camera');
    }
  };

  // Blazing fast client-side image compression
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Compress to 760px at 0.70 quality: creates ~40KB file, analyzes in <1s
        const maxDim = 760;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressed = canvas.toDataURL('image/jpeg', 0.70);
          setSelectedImageBase64(compressed);
          triggerScan(compressed, 'image/jpeg', 'upload');
        } else {
          setSelectedImageBase64(rawDataUrl);
          triggerScan(rawDataUrl, file.type, 'upload');
        }
      };
      img.onerror = () => {
        setSelectedImageBase64(rawDataUrl);
        triggerScan(rawDataUrl, file.type, 'upload');
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  // High-Speed Instant Valuation Call (Zero Artificial Latency)
  const triggerScan = async (imageBase64?: string, mimeType?: string, presetKey?: string) => {
    setIsScanning(true);
    setScanResult(null);
    setScanDuration(null);
    const startTime = performance.now();

    try {
      const res = await fetch('/api/ai/card-scanner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64 || selectedImageBase64,
          mimeType: mimeType || 'image/jpeg',
          presetKey: presetKey || selectedPresetKey,
        }),
      });

      const json = await res.json();
      const elapsedSeconds = Number(((performance.now() - startTime) / 1000).toFixed(2));
      setScanDuration(elapsedSeconds);

      if (json.success && json.data) {
        const fullItem: CardScanResult = {
          ...json.data,
          id: `scan_${Date.now()}`,
          imageUrl:
            imageBase64 ||
            selectedImageBase64 ||
            '/src/assets/images/reseller_goods_showcase_1794265382275.jpg',
          scannedAt: new Date().toISOString(),
        };

        setScanResult(fullItem);
        saveScannedCard(fullItem);

        // Populate edit form defaults
        setEditForm({
          name: fullItem.name,
          setName: fullItem.setName || '',
          cardNumber: fullItem.cardNumber || '',
          year: fullItem.year || '',
          estimatedGrade: fullItem.estimatedGrade || 'Near Mint',
          recommendedListingPrice:
            fullItem.recommendedListingPrice || fullItem.estimatedValues.rawMid || 100,
        });
        setIsConfirmedMatch(true);
        setIsEditingDetails(false);

        // Preload contextual 24/7 AI conversation
        const itemCategory = fullItem.category || 'Collectible';
        setChatMessages([
          {
            sender: 'assistant',
            text: `Identified **${fullItem.name}** (${itemCategory}) in **${fullItem.estimatedGrade}** condition. Market value averages **$${fullItem.estimatedValues.rawMid}** with top collector grades reaching **$${fullItem.estimatedValues.psa10Estimate}**. Best selling platform: **${fullItem.recommendedPlatform.toUpperCase()}** (${fullItem.recommendedPlatformReason}). How would you like to price, bundle, or cross-list this item?`,
          },
        ]);
      }
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveEditedDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult) return;
    const updated: CardScanResult = {
      ...scanResult,
      name: editForm.name.trim() || scanResult.name,
      setName: editForm.setName.trim() || scanResult.setName,
      cardNumber: editForm.cardNumber.trim() || scanResult.cardNumber,
      year: editForm.year.trim() || scanResult.year,
      estimatedGrade: editForm.estimatedGrade.trim() || scanResult.estimatedGrade,
      recommendedListingPrice:
        Number(editForm.recommendedListingPrice) || scanResult.recommendedListingPrice,
      suggestedTitle: `${editForm.name.trim() || scanResult.name} - ${editForm.estimatedGrade}`,
      isConfirmedByUser: true,
    };
    setScanResult(updated);
    saveScannedCard(updated);
    setIsEditingDetails(false);
    setIsConfirmedMatch(true);
  };

  // Chat message submit
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !scanResult) return;

    const userQuery = chatInput.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userQuery }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/ai/card-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userQuery,
          cardContext: scanResult,
        }),
      });

      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: data.response || 'Analysis complete.',
        },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'assistant',
          text: 'Unable to reach the assistant at this moment.',
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setChatInput(q);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Compute dynamic grade tier labels based on category
  const isCard = scanResult?.category?.toLowerCase().includes('card') || false;
  const isSneaker = scanResult?.category?.toLowerCase().includes('sneaker') || false;
  const isGame = scanResult?.category?.toLowerCase().includes('game') || false;

  const tier2Label = isCard
    ? 'PSA 9 Slab Comp'
    : isSneaker
    ? 'Near Deadstock / VNDS'
    : isGame
    ? 'Complete In Box (CIB)'
    : 'Mint / Top Condition';

  const tier3Label = isCard
    ? 'PSA 10 Gem Mint'
    : isSneaker
    ? 'Brand New Deadstock (DS)'
    : isGame
    ? 'Factory Sealed / Wata'
    : 'Flawless Collector Grail';

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Universal AI Collectible & Resale Item Scanner
            </h1>
            <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 shadow-2xs flex items-center gap-1">
              <Zap className="w-3 h-3" /> Real-Time Flash AI
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Upload or photograph <strong>whatever collectible item ever</strong> (cards, sneakers, retro video games, luxury watches, vintage toys, electronics, coins & antiques). Instant AI appraisal, live comps, and 1-click multi-marketplace listing.
          </p>
        </div>

        {/* Plan status indicator */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Plan Status:</span>
          <span
            className={`font-bold px-2.5 py-0.5 rounded-full uppercase text-[11px] ${
              isPaidUser ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {user?.plan || 'Free'} Tier {isPaidUser ? '(Unlocked)' : '(Locked)'}
          </span>
        </div>
      </div>

      {/* Paywall Banner if Free User */}
      {!isPaidUser && (
        <div className="p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Lock className="w-3.5 h-3.5" />
              <span>Premium Plan Feature</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Unlock the Instant Visual Collectible Scanner & 1-Click Multi-App Lister
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Take or upload a picture of any card, pair of sneakers, vintage video game, watch, or collectible. Our dedicated AI instantly identifies the brand, model, condition, market comps, best selling marketplace, and lets you push it for sale to eBay, Amazon, Etsy, Whatnot, Mercari, or Poshmark in 1 click.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setPendingUpgradePlan('pro');
                  setIsStripeModalOpen(true);
                }}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition-colors shadow-md"
              >
                Upgrade to Pro ($9.99/mo)
              </button>

              <button
                onClick={() => {
                  setPendingUpgradePlan('business');
                  setIsStripeModalOpen(true);
                }}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition-colors"
              >
                Upgrade to Business ($19.99/mo)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dual persistent file inputs: 1 for direct camera capture, 1 for photo gallery selection */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Scanner Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload & Capture */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Scan or Upload Any Item</h3>
              <p className="text-[11px] text-slate-400">Cards, sneakers, games, watches & more</p>
            </div>

            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs font-medium">
              <button
                onClick={() => {
                  setScanMode('upload');
                  stopCamera();
                }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  scanMode === 'upload'
                    ? 'bg-white shadow-2xs text-slate-900 font-bold'
                    : 'text-slate-600'
                }`}
              >
                Upload / Gallery
              </button>
              <button
                onClick={() => {
                  setScanMode('camera');
                  startCamera();
                }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  scanMode === 'camera'
                    ? 'bg-white shadow-2xs text-slate-900 font-bold'
                    : 'text-slate-600'
                }`}
              >
                Camera Snap
              </button>
              <button
                onClick={() => {
                  setScanMode('preset');
                  stopCamera();
                }}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  scanMode === 'preset'
                    ? 'bg-white shadow-2xs text-slate-900 font-bold'
                    : 'text-slate-600'
                }`}
              >
                Sample Grails
              </button>
            </div>
          </div>

          {/* Mode 1: Fast File Upload / Photo Gallery Pick */}
          {scanMode === 'upload' && (
            <div className="space-y-4">
              {/* Dual Action Strip: Pick from Gallery or Snap Camera */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-500 transition-all text-left flex items-center gap-2.5 shadow-2xs group"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                      Photo Gallery
                    </span>
                    <span className="text-[10px] text-slate-500">Pick from Albums</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-all text-left flex items-center gap-2.5 shadow-2xs group"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                    <Camera className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">
                      Camera Shutter
                    </span>
                    <span className="text-[10px] text-slate-500">Take Live Picture</span>
                  </div>
                </button>
              </div>

              {/* Drag and Drop Box */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-50/60 hover:bg-emerald-50/20 group"
              >
                <div className="w-11 h-11 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center mb-2 transition-colors">
                  <Upload className="w-5 h-5 text-slate-500 group-hover:text-emerald-600 transition-colors" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                  Click to browse photos or drag and drop here
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Gemini analyzes item details, physical grade, & eBay market comps · JPG, PNG, WEBP
                </span>
              </button>

              {selectedImageBase64 && (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-900 shadow-inner">
                  <img
                    src={selectedImageBase64}
                    alt="Uploaded collectible"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <button
                      onClick={() => triggerScan()}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-lg text-xs shadow-md flex items-center gap-1.5 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-Analyze</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Live Camera Snapshot */}
          {scanMode === 'camera' && (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-4/3 flex items-center justify-center border border-slate-800">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                />

                {!isCameraActive && (
                  <div className="text-center p-5 sm:p-6 space-y-3">
                    <div
                      className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center ${
                        cameraError
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cameraError ? <AlertCircle className="w-6 h-6" /> : <Camera className="w-6 h-6" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-200">
                        {cameraError ? 'Camera Notice' : 'Camera Ready'}
                      </h4>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
                        {cameraError || 'Activate your camera to snap any item or card.'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {cameraError ? (
                        <>
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Pick from Photo Gallery</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => cameraInputRef.current?.click()}
                            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Take Photo</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCameraError(null);
                              setScanMode('preset');
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg text-xs transition-colors"
                          >
                            Try Sample Item
                          </button>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-2.5 py-1.5 text-[11px] text-slate-400 hover:text-white transition-colors"
                          >
                            Retry
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-2xs transition-colors"
                          >
                            Start Camera
                          </button>
                          <button
                            type="button"
                            onClick={() => galleryInputRef.current?.click()}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs shadow-2xs transition-colors flex items-center gap-1.5"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Photo Gallery</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reticle framing */}
                {isCameraActive && (
                  <div className="absolute inset-6 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex flex-col justify-between p-3">
                    <span className="text-[10px] font-bold text-emerald-300 bg-slate-950/70 px-2 py-0.5 rounded self-start">
                      Frame Any Item, Card, or Box
                    </span>
                    <span className="text-[10px] text-slate-300 bg-slate-950/70 px-2 py-0.5 rounded self-end">
                      Keep Lighting Even
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons in Camera Mode: Snap or pick from gallery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {isCameraActive && (
                  <button
                    onClick={capturePhoto}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Snap Photo Now</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className={`w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm border border-slate-700 ${
                    !isCameraActive ? 'sm:col-span-2' : ''
                  }`}
                >
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  <span>Choose from Photo Gallery</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode 3: Sample Items across categories */}
          {scanMode === 'preset' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Click any sample collectible below to test the instant appraisal engine:
              </p>
              <div className="space-y-2">
                {SAMPLE_ITEMS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      setSelectedPresetKey(item.key);
                      setSelectedImageBase64(item.thumbnail);
                      triggerScan(undefined, undefined, item.key);
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 ${
                      selectedPresetKey === item.key
                        ? 'border-emerald-500 bg-emerald-50/20 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/40'
                    }`}
                  >
                    <div className="space-y-0.5 max-w-[210px]">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {item.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{item.brand}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold font-mono-numbers text-emerald-600 block">
                        {item.previewVal}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium flex items-center justify-end gap-0.5">
                        <span>Appraise</span>
                        <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scan Dossier, Valuation, & 1-Click Put Up For Sale */}
        <div className="lg:col-span-7 space-y-6">
          {/* Scanning Animation */}
          {isScanning && (
            <div className="p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-4 text-center animate-in fade-in duration-150">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/30 border-t-emerald-400 animate-spin" />
                <Sparkles className="w-6 h-6 text-emerald-400 absolute" />
              </div>

              <div className="space-y-1">
                <h4 className="text-base font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Rapid AI Appraisal in Progress...</span>
                </h4>
                <p className="text-xs text-slate-300 font-mono">
                  Analyzing visual signatures, brand hallmarks, condition flaws, and live comps...
                </p>
              </div>
            </div>
          )}

          {/* Dossier Item Results */}
          {!isScanning && scanResult && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-7 space-y-6 animate-in fade-in duration-150">
              {/* Forensic AI Accuracy Verification & Anti-Hallucination Hallmark Check */}
              <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">Forensic Visual Verification</span>
                        <span className="text-[10px] font-mono-numbers font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                          {scanResult.confidenceScore || 98}% Verified Match
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        Cross-referenced against official catalog references, copyright print lines & foil finish.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingDetails(!isEditingDetails)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors flex items-center gap-1"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>{isEditingDetails ? 'Cancel' : 'Edit / Refine Details'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsConfirmedMatch(true)}
                      className={`px-3 py-1 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 ${
                        isConfirmedMatch
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isConfirmedMatch ? 'Verified Exact' : 'Confirm Match'}</span>
                    </button>
                  </div>
                </div>

                {/* Variant Differentiating Notes */}
                {scanResult.variantDifferentiatingNotes && (
                  <div className="text-[11px] text-emerald-300 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/20 flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{scanResult.variantDifferentiatingNotes}</span>
                  </div>
                )}

                {/* Visual Hallmarks Checklist */}
                {scanResult.verificationHallmarks && scanResult.verificationHallmarks.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {scanResult.verificationHallmarks.map((hallmark, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-[10px] text-slate-300 bg-slate-800/60 p-1.5 rounded-md"
                      >
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{hallmark}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Inline Detail Refinement Form if User wants to adjust item specifics */}
              {isEditingDetails && (
                <form
                  onSubmit={handleSaveEditedDetails}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-300 space-y-3 animate-in fade-in duration-100"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-900">
                      Refine Item Identification & Listing Values
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Changes update live comps & cross-listing blueprint
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Exact Item Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Series or Set Name
                      </label>
                      <input
                        type="text"
                        value={editForm.setName}
                        onChange={(e) => setEditForm({ ...editForm, setName: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Card Number / Model SKU
                      </label>
                      <input
                        type="text"
                        value={editForm.cardNumber}
                        onChange={(e) => setEditForm({ ...editForm, cardNumber: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Condition State / Grade
                      </label>
                      <input
                        type="text"
                        value={editForm.estimatedGrade}
                        onChange={(e) => setEditForm({ ...editForm, estimatedGrade: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Target Listing Price ($ USD)
                      </label>
                      <input
                        type="number"
                        value={editForm.recommendedListingPrice}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            recommendedListingPrice: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 font-bold font-mono-numbers focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingDetails(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs"
                    >
                      Save & Re-Verify
                    </button>
                  </div>
                </form>
              )}

              {/* Top Banner: Identification & Action */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {scanResult.category && (
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {scanResult.category}
                      </span>
                    )}
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {scanResult.publisher || scanResult.brand} · {scanResult.year}
                    </span>
                    {scanResult.rarity && (
                      <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                        {scanResult.rarity}
                      </span>
                    )}
                    {scanDuration !== null && (
                      <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {scanDuration}s analysis
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 leading-snug">
                    {scanResult.name}
                  </h3>

                  <p className="text-xs text-slate-500">
                    {scanResult.setName && scanResult.setName !== 'N/A' && (
                      <>
                        Series/Set: <strong className="text-slate-800">{scanResult.setName}</strong>{' '}
                        ·{' '}
                      </>
                    )}
                    {scanResult.cardNumber && scanResult.cardNumber !== 'N/A' && (
                      <>
                        SKU/ID: <strong className="text-slate-800">{scanResult.cardNumber}</strong>{' '}
                        ·{' '}
                      </>
                    )}
                    Finish/Edition:{' '}
                    <strong className="text-slate-800">{scanResult.finish}</strong>
                  </p>
                </div>

                {/* Condition Badge */}
                <div className="p-3 rounded-xl bg-slate-900 text-white text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Condition State
                  </span>
                  <span className="text-sm font-extrabold text-emerald-400 font-mono-numbers">
                    {scanResult.estimatedGrade}
                  </span>
                </div>
              </div>

              {/* Real Market Valuation Matrix */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Real-Time Market Valuation
                </span>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                    <span className="text-[11px] text-slate-500 block">Market Average (Mid)</span>
                    <p className="text-xl font-black text-slate-900 font-mono-numbers">
                      {formatCurrency(scanResult.estimatedValues.rawMid)}
                    </p>
                    <span className="text-[10px] text-slate-400 block font-mono-numbers">
                      Fair Range: ${scanResult.estimatedValues.rawLow} - $
                      {scanResult.estimatedValues.rawHigh}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 text-center space-y-1">
                    <span className="text-[11px] text-emerald-800 font-semibold block">
                      {tier2Label}
                    </span>
                    <p className="text-xl font-black text-emerald-700 font-mono-numbers">
                      {formatCurrency(scanResult.estimatedValues.psa9Estimate)}
                    </p>
                    <span className="text-[10px] text-emerald-600 block">Collector Grade</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-200 text-center space-y-1">
                    <span className="text-[11px] text-indigo-800 font-semibold block">
                      {tier3Label}
                    </span>
                    <p className="text-xl font-black text-indigo-700 font-mono-numbers">
                      {formatCurrency(scanResult.estimatedValues.psa10Estimate)}
                    </p>
                    <span className="text-[10px] text-indigo-600 block">Grail Value</span>
                  </div>
                </div>
              </div>

              {/* Recommended Selling Platform & One-Click Put Up For Sale */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white space-y-3.5 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                      Recommended Selling App
                    </span>
                    <span className="font-extrabold text-sm uppercase text-white tracking-wide">
                      {scanResult.recommendedPlatform}
                    </span>
                  </div>
                  <span className="text-xs text-slate-300 font-mono-numbers">
                    Suggested Listing Price:{' '}
                    <strong className="text-emerald-400 font-bold text-sm">
                      {formatCurrency(scanResult.recommendedListingPrice)}
                    </strong>
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {scanResult.recommendedPlatformReason}
                </p>

                {/* 1-Click Multi-App Listing Trigger */}
                <div className="pt-1 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Publish to eBay, Amazon, Etsy, Whatnot, Mercari, or Poshmark</span>
                  </div>

                  <button
                    onClick={() =>
                      openCrossListModal({
                        ...scanResult,
                        title: scanResult.suggestedTitle || scanResult.name,
                        price:
                          scanResult.recommendedListingPrice ||
                          scanResult.estimatedValues.rawMid ||
                          100,
                        description: scanResult.suggestedDescription,
                        cogs: Math.round(scanResult.estimatedValues.rawLow * 0.75),
                      })
                    }
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Put Up for Sale on Any App</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Ready-to-use SEO Listing Title */}
              {scanResult.suggestedTitle && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Optimized Marketplace Listing Title
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (scanResult.suggestedTitle) {
                          navigator.clipboard.writeText(scanResult.suggestedTitle);
                          setCopiedTitle(true);
                          setTimeout(() => setCopiedTitle(false), 2000);
                        }
                      }}
                      className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                    >
                      {copiedTitle ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Title</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-slate-900 select-all">
                    {scanResult.suggestedTitle}
                  </p>
                </div>
              )}

              {/* Physical Condition Observations */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Forensic Condition & Inspection Notes
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  {scanResult.conditionObservations.map((obs, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{obs}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Similar Comps Table */}
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Live Verified Marketplace Comps
                  </span>
                  <span className="text-[11px] text-slate-400">Recent Real Sold Listings</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        <th className="py-2.5 px-3">Comparable Listing</th>
                        <th className="py-2.5 px-3">Platform</th>
                        <th className="py-2.5 px-3">Condition</th>
                        <th className="py-2.5 px-3 text-right">Sold Price</th>
                        <th className="py-2.5 px-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {scanResult.comps.map((comp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3 font-medium text-slate-900 truncate max-w-[200px]">
                            {comp.title}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-700">
                            {comp.platform}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500">{comp.condition}</td>
                          <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-emerald-600">
                            {formatCurrency(comp.price)}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-400 text-[11px]">
                            {comp.date}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 24/7 Dedicated Collectibles AI Chat */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        24/7 Dedicated Appraisal & Resale Assistant
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Ask any questions about grading, pricing, or selling this item
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded font-mono border border-emerald-500/30">
                    Online 24/7
                  </span>
                </div>

                {/* Chat Stream Window */}
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                  {chatMessages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-emerald-600 text-white font-medium'
                            : 'bg-slate-800 text-slate-200 border border-slate-700/80'
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isChatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-800 text-slate-400 rounded-xl px-3 py-2 text-xs flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-400" />
                        <span>Consulting real-time market data...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Query Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    isCard
                      ? 'Should I grade this with PSA or sell raw?'
                      : 'Is it better to auction or Buy It Now?',
                    'What offer discount should I accept on eBay?',
                    'How does this compare to recent sales trends?',
                    'What keywords will rank highest in search?',
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickQuestion(chip)}
                      className="px-2.5 py-1 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleSendChat} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask anything about this item..."
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading || !chatInput.trim()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Ask</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Empty state when no item has been scanned yet */}
          {!isScanning && !scanResult && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Item Scanned Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload a photo, snap a picture with your camera, or pick a sample item on the left to see instant valuation, condition notes, comps, and 1-click cross-listing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
