import React, { useState, useRef } from 'react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';
import { exportAllDataAsJSON, importDataFromJSON, clearAllData, getSavedKNumber, saveKNumber, USER_DEFAULT_K_NUMBER } from '../utils/storage';
import { BillDeskAutoFetchModal } from './BillDeskAutoFetchModal';
import {
  Settings,
  Languages,
  Sparkles,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  Building,
  Info,
  Tv,
  PlaySquare,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Smartphone,
  Zap,
} from 'lucide-react';
import { ADS_CONFIG } from '../utils/adsConfig';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenPrivacyPolicy: () => void;
  onReloadData: () => void;
  isBannerAdActive: boolean;
  onToggleBannerAd: () => void;
  onTriggerTestInterstitial: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  onLanguageChange,
  isDemoMode,
  onToggleDemoMode,
  onOpenPrivacyPolicy,
  onReloadData,
  isBannerAdActive,
  onToggleBannerAd,
  onTriggerTestInterstitial,
}) => {
  const t = getTranslation(language);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentKNumber, setCurrentKNumber] = useState<string>(getSavedKNumber() || USER_DEFAULT_K_NUMBER);
  const [isSavedFeedback, setIsSavedFeedback] = useState<boolean>(false);
  const [isAutoFetchModalOpen, setIsAutoFetchModalOpen] = useState<boolean>(false);

  const handleSaveK = () => {
    saveKNumber(currentKNumber);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2500);
  };

  const handleExport = () => {
    exportAllDataAsJSON();
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const success = await importDataFromJSON(file);
    if (success) {
      alert('Data restored successfully!');
      onReloadData();
    } else {
      alert('Failed to import backup. Please check the JSON file format.');
    }
  };

  const handleClear = () => {
    if (
      confirm(
        'Are you sure you want to clear all data? All buildings, flats, and bills will be erased.'
      )
    ) {
      if (confirm('Please confirm once more. This action cannot be reversed.')) {
        clearAllData();
        onReloadData();
      }
    }
  };

  return (
    <div className="space-y-5 pb-24 max-w-3xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>{t.settings} (सेटिंग्स)</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage language, offline backups, sample data, and privacy settings.
        </p>
      </div>

      {/* Language Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Languages className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">App Language / भाषा</h3>
              <p className="text-xs text-slate-400">Select English or Hindi translation</p>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                language === 'en'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('hi')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                language === 'hi'
                  ? 'bg-cyan-500 text-slate-950 shadow'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>

      {/* Demo Mode / Sample Data */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Demo Mode (सैंपल डेटा)</h3>
              <p className="text-xs text-slate-400">
                Preloads 8 residential flats and realistic AVVNL bill distribution
              </p>
            </div>
          </div>

          <button
            onClick={onToggleDemoMode}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition border ${
              isDemoMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isDemoMode ? 'Demo Active' : 'Load Demo Data'}
          </button>
        </div>
      </div>

      {/* AVVNL BillDesk Auto-Fetch Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Zap className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>AVVNL BijliMitra Portal (बिजली मित्र पोर्टल)</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  LIVE API
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Configure your official AVVNL K-Number for automatic 1-click monthly bill retrieval
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAutoFetchModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Zap className="w-3.5 h-3.5 fill-slate-950" />
            <span>Test Connection / Fetch</span>
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Your 12-Digit AVVNL K-Number (उपभोक्ता के नंबर)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentKNumber}
                onChange={(e) => setCurrentKNumber(e.target.value.replace(/[^0-9]/g, '').slice(0, 12))}
                placeholder="130523024253"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-white outline-none focus:border-amber-400 tracking-wider"
              />
              <button
                type="button"
                onClick={handleSaveK}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5"
              >
                {isSavedFeedback ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300">Saved!</span>
                  </>
                ) : (
                  <span>Save K-No.</span>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Currently saved K-Number: <strong className="text-amber-300 font-mono">{currentKNumber}</strong> (Ajmer Vidyut Vitran Nigam Limited)
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs text-slate-400">
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ELECTRICITY BOARD</span>
              <span className="text-slate-200 font-semibold">Ajmer Discom (AVVNL)</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CUSTOMER PORTAL</span>
              <span className="text-slate-200 font-semibold">AVVNL Bijli Mitra (बिजली मित्र)</span>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>AVVNL Bijli Mitra In-App Services Active</span>
          </div>
        </div>
      </div>

      {/* Progressive Web App (PWA) Installation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>PWA App Installation (ऐप इंस्टॉल करें)</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-cyan-500/20 text-cyan-300">
                  Offline Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Install as a standalone app on your Android phone, Windows PC, or tablet for instant offline access.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PWAInstallButton />
          </div>
        </div>
      </div>

      {/* Backup and Restore */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Download className="w-5 h-5 text-emerald-400" />
          <div>
            <h3 className="text-sm font-bold text-white">{t.backupData} / {t.restoreData}</h3>
            <p className="text-xs text-slate-400">
              Export your buildings, flat sub-meters, and billing history to a JSON file.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t.backupData} (Export JSON)</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition"
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>{t.restoreData} (Import JSON)</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Google AdMob Advertising Units */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Tv className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Google AdMob Integration</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Configured banner and interstitial ad units for monetization.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          {/* Banner Ad Unit Card */}
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Banner Ad (बैनर विज्ञापन)</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300">
                  Fixed Bottom
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono select-all">
                {ADS_CONFIG.bannerAdUnitId}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleBannerAd}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  isBannerAdActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isBannerAdActive ? 'Banner: Visible' : 'Banner: Hidden'}
              </button>
            </div>
          </div>

          {/* Interstitial Ad Unit Card */}
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Interstitial Ad (इंटरस्टीशियल विज्ञापन)</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-500/20 text-amber-300">
                  Full Screen
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono select-all">
                {ADS_CONFIG.interstitialAdUnitId}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onTriggerTestInterstitial}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition shadow-sm"
              >
                <PlaySquare className="w-3.5 h-3.5" />
                <span>Test Interstitial</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Policy & Play Store Compliance */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Privacy Policy & Play Store Readiness</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-cyan-500/20 text-cyan-300">
                  Compliant
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Offline-first data protection, camera permissions & public URL for Google Play Console.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 bg-slate-800 hover:bg-slate-750 px-2.5 py-1.5 rounded-lg border border-slate-700 transition"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Public Link</span>
            </a>
            <button
              onClick={onOpenPrivacyPolicy}
              className="text-xs text-slate-200 hover:text-white font-semibold bg-cyan-600 hover:bg-cyan-500 px-3 py-1.5 rounded-lg transition shadow-sm"
            >
              View In-App
            </button>
          </div>
        </div>
      </div>

      {/* Clear All Data */}
      <div className="bg-slate-950 border border-red-950 rounded-2xl p-4 sm:p-5 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-red-400">
          <Trash2 className="w-5 h-5" />
          <div>
            <h3 className="text-sm font-bold text-red-300">Reset Application</h3>
            <p className="text-xs text-red-400/80">Erase all buildings, flats, and past bills</p>
          </div>
        </div>

        <button
          onClick={handleClear}
          className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-bold transition"
        >
          Clear All Data
        </button>
      </div>

      {/* BillDesk Auto Fetch Modal */}
      <BillDeskAutoFetchModal
        isOpen={isAutoFetchModalOpen}
        onClose={() => setIsAutoFetchModalOpen(false)}
        language={language}
        onApplyBillData={(_data) => {
          setIsAutoFetchModalOpen(false);
          alert(
            language === 'hi'
              ? 'बिल डेटा सफलतापूर्वक लोड हुआ! आप New Monthly Bill में जाकर फ्लैटों का वितरण जनरेट कर सकते हैं।'
              : 'Bill data fetched successfully! You can now generate flat distribution in New Monthly Bill.'
          );
        }}
      />
    </div>
  );
};
