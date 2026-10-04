import React, { useState, useEffect } from 'react';
import { ADS_CONFIG, notifyNativeAdMob } from '../utils/adsConfig';
import { X, Sparkles, ExternalLink, Zap, ShieldCheck, SunMedium } from 'lucide-react';

interface InterstitialAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export const InterstitialAdModal: React.FC<InterstitialAdModalProps> = ({
  isOpen,
  onClose,
  reason = 'Transaction Complete',
}) => {
  const [countdown, setCountdown] = useState<number>(5);
  const [canSkip, setCanSkip] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    // Notify native bridge if running inside Android WebView / Capacitor / Cordova
    notifyNativeAdMob('SHOW_INTERSTITIAL');

    // Attempt web ads push
    try {
      if (typeof window !== 'undefined') {
        const win = window as any;
        win.adsbygoogle = win.adsbygoogle || [];
        win.adsbygoogle.push({});
      }
    } catch (e) {
      console.debug('AdMob Interstitial push error (benign):', e);
    }

    // Reset countdown
    setCountdown(5);
    setCanSkip(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="admob-interstitial-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="admob-interstitial-card"
        className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* AdMob Top Status Bar */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px] tracking-wider uppercase border border-amber-500/30">
              Ad • AdMob Interstitial
            </span>
            <span className="text-slate-400 font-mono text-[10px] hidden sm:inline truncate max-w-[200px]">
              {ADS_CONFIG.interstitialAdUnitId}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {canSkip ? (
              <button
                id="btn-skip-interstitial-ad"
                onClick={onClose}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg transition"
              >
                <span>Skip Ad (विज्ञापन छोड़ें)</span>
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-slate-400 text-[11px] font-mono bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700">
                Reward / Skip in {countdown}s
              </span>
            )}
          </div>
        </div>

        {/* Ad Content Area */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Real Google AdSense/AdMob Ins Container */}
          <div className="w-full flex justify-center overflow-hidden">
            <ins
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', minHeight: '100px' }}
              data-ad-client={ADS_CONFIG.publisherId}
              data-ad-slot={ADS_CONFIG.interstitialSlotId}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>

          {/* High-value Rajasthan Energy & AVVNL Solar Sponsored Showcase */}
          <div className="bg-gradient-to-br from-slate-850 via-slate-850 to-slate-800 border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-inner">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow">
                <SunMedium className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-0.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Rajasthan Rooftop Solar Scheme 2026</span>
                </div>
                <h3 className="text-base font-bold text-white leading-snug">
                  Save up to 80% on AVVNL Common & Flat Electricity Bills
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Install PM Surya Ghar Muft Bijli Yojana approved grid-connected solar systems for multi-flat apartments in Ajmer, Jaipur, and across Rajasthan. Get direct subsidy up to <strong className="text-emerald-400">₹78,000</strong> credited directly to your bank account.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Govt Subsidy</span>
                <span className="text-xs font-bold text-emerald-400">Up to ₹78,000</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Net Metering</span>
                <span className="text-xs font-bold text-cyan-400">Approved AVVNL Meter</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5">
              <a
                href="https://pmsuryaghar.gov.in"
                target="_blank"
                rel="noreferrer"
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
              >
                <span>Apply for Solar Subsidy</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {canSkip && (
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
                >
                  Close Ad
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>Verified AdMob Partner Slot</span>
            </span>
            <span className="font-mono">{reason}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
