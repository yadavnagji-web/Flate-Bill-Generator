import React from 'react';
import { Building, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { Building2, Languages, Sparkles, Plus, Settings } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  buildings: Building[];
  activeBuildingId: string;
  onSelectBuilding: (id: string) => void;
  onAddBuilding: () => void;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  buildings,
  activeBuildingId,
  onSelectBuilding,
  onAddBuilding,
  isDemoMode,
  onToggleDemoMode,
  onOpenSettings,
}) => {
  const t = getTranslation(language);
  const activeBuilding = buildings.find((b) => b.id === activeBuildingId) || buildings[0];

  return (
    <header className="sticky top-0 z-30 bg-slate-900 text-white shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2">
        {/* Brand & Building Name */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <span className="text-xl font-black">⚡</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight truncate leading-tight text-white">
                {t.appName}
              </h1>
              {isDemoMode && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> Demo
                </span>
              )}
            </div>

            {/* Building Switcher dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              {buildings.length > 1 ? (
                <select
                  value={activeBuildingId}
                  onChange={(e) => onSelectBuilding(e.target.value)}
                  className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 text-xs focus:ring-1 focus:ring-cyan-400 outline-none truncate max-w-[150px] sm:max-w-[220px]"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="font-medium text-slate-200 truncate max-w-[160px] sm:max-w-[240px]">
                  {activeBuilding ? activeBuilding.name : 'Main Building'}
                </span>
              )}

              <button
                onClick={onAddBuilding}
                title={t.addBuilding}
                className="text-slate-400 hover:text-cyan-300 p-0.5 rounded transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right side controls: PWA Install, Language, Demo toggle, Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <PWAInstallButton />

          <button
            onClick={() => onLanguageChange(language === 'en' ? 'hi' : 'en')}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
            title="Switch Language (English / हिंदी)"
          >
            <Languages className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          <button
            onClick={onToggleDemoMode}
            className={`hidden md:flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition ${
              isDemoMode
                ? 'bg-amber-950/60 border-amber-600/50 text-amber-300 hover:bg-amber-900/60'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
            title="Toggle Demo Mode"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isDemoMode ? 'Demo Active' : 'Sample Data'}</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition"
            title={t.settings}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
