import React from 'react';
import { Language } from '../types';
import { getTranslation } from '../utils/translations';
import {
  LayoutDashboard,
  History,
  Settings as SettingsIcon,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'history' | 'settings';

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  language: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, language }) => {
  const t = getTranslation(language);

  const tabs: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'dashboard',
      label: language === 'hi' ? 'K-नंबर बिल जनरेटर' : 'K-No Generator',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: 'history',
      label: language === 'hi' ? 'बिल इतिहास (PDFs)' : 'History Archive',
      icon: <History className="w-5 h-5" />,
    },
    {
      id: 'settings',
      label: t.settings || (language === 'hi' ? 'सेटिंग्स' : 'Settings'),
      icon: <SettingsIcon className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 shadow-xl px-2 sm:px-6 py-2 pb-safe">
      <div className="max-w-md md:max-w-lg mx-auto flex items-center justify-around gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 px-3 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="p-0.5">
                {tab.icon}
              </div>
              <span className="text-xs leading-none mt-1 font-semibold truncate text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
