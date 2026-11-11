import React, { useState } from 'react';
import { 
  Download, 
  Smartphone, 
  Laptop, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  Sparkles, 
  X, 
  ArrowRight, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe,
  HardDrive,
  Copy,
  Check,
  QrCode
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { uploadZipToGoogleDrive, DriveUploadResult } from '../../utils/googleDrive';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'mobile' | 'desktop' | 'source'>(
    isIOS || isAndroid ? 'mobile' : 'desktop'
  );
  const [installSuccess, setInstallSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // Google Drive states
  const [showDriveConfirm, setShowDriveConfirm] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);
  const [driveResult, setDriveResult] = useState<DriveUploadResult | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  const handleConfirmDriveUpload = async () => {
    setShowDriveConfirm(false);
    setDriveLoading(true);
    setDriveError(null);
    try {
      const result = await uploadZipToGoogleDrive('/api/download-netlify-bundle', 'sellerpro-netlify-deploy.zip');
      setDriveResult(result);
    } catch (err: any) {
      console.error('Drive upload error:', err);
      setDriveError(err?.message || 'Failed to upload to Google Drive');
    } finally {
      setDriveLoading(false);
    }
  };

  if (!isOpen) return null;

  // The actual live URL where THIS app is running on Google's cloud
  const liveUrl = typeof window !== 'undefined' && window.location.origin 
    ? window.location.origin 
    : 'https://ais-pre-2qven6s6upcfcgq3yboa6f-178189050326.us-east1.run.app';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(liveUrl)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(liveUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
      }
    }
  };

  const handleDownloadOfflineHTML = () => {
    const bookmarkContent = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>SellerPro App Launcher</title>
<meta http-equiv="refresh" content="0; url=${liveUrl}">
<script>window.location.href = "${liveUrl}";</script>
</head>
<body style="font-family:sans-serif;text-align:center;padding:50px;background:#0f172a;color:#fff;">
<h2>Launching SellerPro...</h2>
<p>Opening your app: <a href="${liveUrl}" style="color:#10b981;">${liveUrl}</a></p>
</body>
</html>`;
    const blob = new Blob([bookmarkContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'SellerPro-Launcher.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header gradient banner */}
        <div className="relative bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-full transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-lg">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">Download & Install SellerPro</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-400 text-slate-950 rounded-full">
                  Live on Google Cloud
                </span>
              </div>
              <p className="text-sm text-emerald-100/90 mt-0.5">
                Install directly onto iOS, Android, Mac, or Windows — zero App Store fees!
              </p>
            </div>
          </div>
        </div>

        {/* Live URL Callout Box */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="text-xs text-slate-300 truncate">
              <span className="text-slate-400">Your App on Google: </span>
              <span className="font-mono text-emerald-400 font-semibold">{liveUrl}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
            </button>
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium rounded-lg border border-emerald-500/40 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open</span>
            </a>
          </div>
        </div>

        {/* Platform tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/90 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'mobile'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            iPhone & Android
          </button>
          <button
            onClick={() => setActiveTab('desktop')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'desktop'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            Mac & Windows PC
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'source'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" />
            Launcher / Backup
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* If already running standalone or installed */}
          {isInstalled && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white">SellerPro is running as an installed App!</h4>
                <p className="text-xs text-slate-300">
                  Full standalone display mode is active with offline database caching.
                </p>
              </div>
            </div>
          )}

          {installSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-white">Installation initiated!</h4>
                <p className="text-xs text-slate-300">
                  SellerPro is now added to your device. You can launch it anytime from your home screen or desktop dock.
                </p>
              </div>
            </div>
          )}

          {/* Quick 1-Click Install Button if browser supports beforeinstallprompt */}
          {isInstallable && (
            <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-500/40 rounded-xl p-5 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    Instant 1-Click Install Available
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">Install SellerPro to your device</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Opens like a native desktop/mobile app without browser address bars.
                  </p>
                </div>
                <button
                  onClick={handleInstallClick}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Install App Now
                </button>
              </div>
            </div>
          )}

          {/* Mobile instructions */}
          {activeTab === 'mobile' && (
            <div className="space-y-5">
              {/* Scan with phone camera */}
              <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-5">
                <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                  <img 
                    src={qrCodeUrl} 
                    alt="Scan to open on phone" 
                    className="w-28 h-28 object-contain"
                  />
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wide">
                    <QrCode className="w-4 h-4" />
                    Scan with iPhone or Android Camera
                  </div>
                  <h4 className="text-sm font-semibold text-white">Open directly on your phone</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Point your camera at this QR code to load SellerPro on your phone, then follow the 2 simple steps below to add it to your home screen!
                  </p>
                </div>
              </div>

              {/* iOS Safari Guide */}
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold text-xs">
                      iOS
                    </span>
                    <h3 className="text-sm font-bold text-white">Apple iPhone & iPad (Safari)</h3>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700/50">
                    Step-by-step
                  </span>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">1</div>
                    <p className="pt-0.5">
                      Open this app link on your phone in Safari: <span className="text-emerald-400 font-mono underline break-all">{liveUrl}</span>. Then tap the <strong className="text-emerald-400">Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> at the bottom.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">2</div>
                    <p className="pt-0.5">
                      Scroll down and tap <strong className="text-emerald-400">Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">3</div>
                    <p className="pt-0.5">
                      Tap <strong className="text-white">Add</strong> in the top-right corner. SellerPro will be saved on your phone home screen just like an App Store app!
                    </p>
                  </div>
                </div>
              </div>

              {/* Android Guide */}
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      APK
                    </span>
                    <h3 className="text-sm font-bold text-white">Android Phone & Tablet (Chrome)</h3>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700/50">
                    Chrome / Edge
                  </span>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="flex items-start gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">1</div>
                    <p className="pt-0.5">
                      Open <span className="text-emerald-400 font-mono break-all">{liveUrl}</span> in Chrome, then tap the <strong className="text-white">three dots menu (⋮)</strong>.
                    </p>
                  </div>

                  <div className="flex items-start gap-3 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">2</div>
                    <p className="pt-0.5">
                      Tap <strong className="text-emerald-400">Install app</strong> (or <strong className="text-emerald-400">Add to Home screen</strong>).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Desktop instructions */}
          {activeTab === 'desktop' && (
            <div className="space-y-4">
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-emerald-400" />
                  Install on Mac, Windows PC, or Chromebook
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  SellerPro runs as an independent desktop window with keyboard shortcuts and offline data.
                </p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Google Chrome / Brave
                    </div>
                    <p className="text-slate-300">
                      Look at the right side of the address bar at the top: click the <strong className="text-white">Install (⤓)</strong> icon or menu ⋮ &gt; <em>Install SellerPro</em>.
                    </p>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    <div className="font-semibold text-sky-400 mb-1 flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5" /> Microsoft Edge
                    </div>
                    <p className="text-slate-300">
                      Click the <strong className="text-white">App Available (⊞)</strong> icon in the address bar or menu &gt; <em>Apps &gt; Install this site as an app</em>.
                    </p>
                  </div>
                </div>
              </div>

              {/* Perks */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-xl text-center">
                  <Zap className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                  <div className="text-xs font-bold text-white">Instant Speed</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Pre-cached UI assets</div>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-xl text-center">
                  <ShieldCheck className="w-5 h-5 text-sky-400 mx-auto mb-1.5" />
                  <div className="text-xs font-bold text-white">Secure Sandbox</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Local storage safety</div>
                </div>
                <div className="bg-slate-800/40 border border-slate-700/60 p-3 rounded-xl text-center">
                  <Sparkles className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                  <div className="text-xs font-bold text-white">Always Updated</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Syncs automatically</div>
                </div>
              </div>
            </div>
          )}

          {/* Netlify & GitHub tab */}
          {activeTab === 'source' && (
            <div className="space-y-5">
              {/* Netlify 1-Click Deploy Box */}
              <div className="bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-900 border border-teal-500/40 rounded-xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center font-bold text-xs">
                      ▲
                    </span>
                    <h3 className="text-sm font-bold text-white">Deploy to Netlify (Ready for Google)</h3>
                  </div>
                  <span className="text-[11px] bg-teal-500/20 text-teal-300 px-2 py-0.5 rounded font-mono font-semibold">
                    Pre-Built Bundle
                  </span>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  Download the ready-to-deploy Netlify package containing the production HTML, PWA manifest, and <code className="text-teal-300 bg-slate-950 px-1 py-0.5 rounded">_redirects</code> for flawless client-side routing.
                </p>

                <div className="pt-1 flex flex-wrap gap-2.5">
                  <a
                    href="/api/download-netlify-bundle"
                    download="sellerpro-netlify-deploy.zip"
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold rounded-xl shadow transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Netlify Deploy ZIP (.zip)
                  </a>
                  <button
                    onClick={() => setShowDriveConfirm(true)}
                    disabled={driveLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer disabled:opacity-50"
                  >
                    <HardDrive className="w-4 h-4 text-white" />
                    {driveLoading ? 'Uploading to Drive...' : 'Save to My Google Drive'}
                  </button>
                  <a
                    href="https://app.netlify.com/drop"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-teal-400" />
                    Open Netlify Drop (app.netlify.com/drop)
                  </a>
                </div>

                {driveResult && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <span>Saved <strong>{driveResult.name}</strong> to your Google Drive!</span>
                    </div>
                    {driveResult.webViewLink && (
                      <a
                        href={driveResult.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View in Drive
                      </a>
                    )}
                  </div>
                )}

                {driveError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-2.5 text-xs text-rose-300">
                    {driveError}
                  </div>
                )}

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 space-y-1.5 text-[11px] text-slate-300">
                  <div className="font-semibold text-teal-400">How to put it on Netlify in 30 seconds:</div>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400">
                    <li>Download the <strong className="text-white">Netlify Deploy ZIP</strong> or save it to your Google Drive.</li>
                    <li>Unzip the file into a folder on your computer.</li>
                    <li>Go to <strong className="text-teal-400">app.netlify.com/drop</strong>.</li>
                    <li>Drag and drop the unzipped folder into the box. Netlify deploys your site live instantly!</li>
                    <li>In Netlify, go to <em>Domain Management</em> to connect your domain (e.g., <code className="text-white">sellerprohq.com</code>).</li>
                  </ol>
                </div>
              </div>

              {/* GitHub Status & Export */}
              <div className="bg-slate-800/70 border border-slate-700/80 rounded-xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center font-bold text-xs">
                      GH
                    </span>
                    <h3 className="text-sm font-bold text-white">GitHub Status & Source Code</h3>
                  </div>
                  <span className="text-[11px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                    Git Initialized
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Your code is locally committed in Git. To push it to your personal GitHub account, create a new repo at <a href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="text-purple-400 underline">github.com/new</a> and link it, or download the full source code below:
                </p>

                <div className="flex flex-wrap gap-2.5">
                  <a
                    href="/api/download-source-zip"
                    download="sellerpro-source-code.zip"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                  >
                    <Download className="w-4 h-4 text-purple-400" />
                    Download Full Source Code (.zip)
                  </a>
                  <button
                    onClick={handleDownloadOfflineHTML}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
                  >
                    <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                    Offline Desktop Launcher (.html)
                  </button>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
                  <div className="text-slate-300 font-sans font-semibold mb-1">Push to GitHub commands:</div>
                  <div className="text-emerald-400">git remote add origin https://github.com/YOUR_USERNAME/sellerpro.git</div>
                  <div className="text-emerald-400">git branch -M main</div>
                  <div className="text-emerald-400">git push -u origin main</div>
                </div>
              </div>

              {/* Adding to Google Search */}
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
                  <Globe className="w-4 h-4" />
                  How to Add Your App to Google Search (Google Search Console)
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Once your site is live on Netlify or custom domain:
                </p>
                <ol className="list-decimal list-inside text-xs text-slate-400 space-y-1">
                  <li>Visit <strong className="text-sky-300">search.google.com/search-console</strong>.</li>
                  <li>Click <strong className="text-white">Add Property</strong> and enter your URL.</li>
                  <li>Submit your sitemap at: <code className="text-emerald-400">/sitemap.xml</code> (already included in your download).</li>
                  <li>Googlebot will crawl and index SellerPro on Google search!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Modal footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Hosted on Google Cloud Run • SellerPro
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Done
          </button>
        </div>

        {/* User confirmation dialog for Google Drive upload */}
        {showDriveConfirm && (
          <div className="absolute inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-blue-500/40 rounded-xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Save Package to Google Drive?</h3>
                  <p className="text-xs text-slate-400">File: sellerpro-netlify-deploy.zip</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                This will save the production Netlify bundle directly to your Google Drive account with your permission, so you can easily access it and drag it into Netlify.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDriveConfirm(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDriveUpload}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow transition"
                >
                  Confirm & Save to Drive
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
