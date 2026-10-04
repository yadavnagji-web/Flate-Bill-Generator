import React, { useEffect, useState, useRef } from 'react';
import { ADS_CONFIG, notifyNativeAdMob } from '../utils/adsConfig';
import { Sparkles, X, ChevronUp, ChevronDown, ExternalLink, ShieldCheck } from 'lucide-react';

interface AdBannerProps {
  isVisible?: boolean;
  onClose?: () => void;
  className?: string;
  variant?: 'sticky' | 'inline';
}

export const AdBanner: React.FC<AdBannerProps> = ({
  isVisible = true,
  onClose,
  className = '',
  variant = 'sticky',
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [adLoaded, setAdLoaded] = useState<boolean>(false);
  const adRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    if (!isVisible) {
      notifyNativeAdMob('HIDE_BANNER');
      return;
    }

    notifyNativeAdMob('SHOW_BANNER');

    // Attempt to load AdSense/AdMob web script tags safely
    try {
      if (typeof window !== 'undefined') {
        const win = window as any;
        win.adsbygoogle = win.adsbygoogle || [];
        win.adsbygoogle.push({});
        setAdLoaded(true);
      }
    } catch (err) {
      console.debug('AdMob Web Banner push error (benign):', err);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <div
        id="admob-banner-minimized"
        className={`fixed bottom-14 right-3 z-30 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-cyan-500/40 text-cyan-400 text-[10px] shadow-lg backdrop-blur-md cursor-pointer hover:bg-slate-800 transition ${className}`}
        onClick={() => setIsMinimized(false)}
        title="Expand Advertisement"
      >
        <Sparkles className="w-3 h-3 text-amber-400" />
        <span className="font-semibold tracking-wider uppercase">AdMob Banner</span>
        <ChevronUp className="w-3.5 h-3.5" />
      </div>
    );
  }

  const containerClasses =
    variant === 'sticky'
      ? `fixed bottom-14 left-0 right-0 z-30 px-2 sm:px-4 py-1.5 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl transition-all ${className}`
      : `w-full my-3 p-2 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-md ${className}`;

  return (
    <div id="admob-banner-container" className={containerClasses}>
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Ad Tag Container */}
        <div className="w-full flex-1 flex flex-col items-center sm:items-start min-h-[50px] justify-center overflow-hidden">
          {/* Official Google AdSense / AdMob Ins Element */}
          <div className="w-full overflow-hidden flex justify-center sm:justify-start">
            <ins
              ref={adRef}
              className="adsbygoogle"
              style={{ display: 'inline-block', minWidth: '300px', height: '50px' }}
              data-ad-client={ADS_CONFIG.publisherId}
              data-ad-slot={ADS_CONFIG.bannerSlotId}
              data-ad-format="horizontal"
              data-full-width-responsive="true"
            />
          </div>

          {/* Fallback / Preview Sponsor Display (Ensures clean appearance in development & preview) */}
          <div className="w-full flex items-center justify-between bg-slate-850/90 rounded-xl px-3 py-1.5 border border-slate-750">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[9px] uppercase tracking-wider shrink-0 border border-amber-500/30">
                Ad
              </span>
              <div className="truncate text-left">
                <p className="text-[11px] font-semibold text-white truncate flex items-center gap-1">
                  <span>Smart Solar Subsidies & Rajasthan AVVNL Meters</span>
                  <span className="text-[9px] text-emerald-400 font-normal hidden sm:inline">
                    • 0% Interest EMI
                  </span>
                </p>
                <p className="text-[9px] text-slate-400 font-mono truncate">
                  Unit ID: {ADS_CONFIG.bannerAdUnitId}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 pl-2">
              <a
                href="https://energy.rajasthan.gov.in/avvnl"
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[10px] font-semibold transition"
              >
                <span>Details</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
          <button
            id="btn-minimize-admob-banner"
            onClick={() => setIsMinimized(true)}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
            title="Minimize ad"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              id="btn-close-admob-banner"
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
              title="Close ad"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
