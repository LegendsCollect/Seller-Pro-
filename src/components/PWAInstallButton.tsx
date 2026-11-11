import React, { useState } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { DownloadAppModal } from './modals/DownloadAppModal';

interface PWAInstallButtonProps {
  variant?: 'nav' | 'sidebar' | 'hero' | 'minimal';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'nav',
  className = ''
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [modalOpen, setModalOpen] = useState(false);

  // If already running standalone and in minimal/nav mode, hide or show installed badge
  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setModalOpen(true);
      }
    } else {
      setModalOpen(true);
    }
  };

  if (isInstalled && variant === 'minimal') {
    return null;
  }

  if (variant === 'sidebar') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500/10 via-emerald-500/15 to-teal-500/10 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/50 hover:bg-emerald-500/20 transition group ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
              <Download className="w-3.5 h-3.5" />
            </div>
            <span>Download App</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
            {isInstalled ? 'ACTIVE' : 'FREE'}
          </span>
        </button>
        <DownloadAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  if (variant === 'hero') {
    return (
      <>
        <button
          onClick={handleClick}
          className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer ${className}`}
        >
          <Download className="w-4 h-4 text-slate-950" />
          <span>Download & Install App</span>
          <span className="text-xs bg-slate-950/20 text-slate-950 px-2 py-0.5 rounded-full font-semibold">
            PWA
          </span>
        </button>
        <DownloadAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  // Default navbar variant
  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 hover:border-emerald-500/50 transition cursor-pointer ${className}`}
        title="Download / Install SellerPro to your phone or desktop"
      >
        <Download className="w-3.5 h-3.5 animate-bounce-subtle" />
        <span className="hidden sm:inline">Download App</span>
        <span className="sm:hidden">Install</span>
      </button>
      <DownloadAppModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
