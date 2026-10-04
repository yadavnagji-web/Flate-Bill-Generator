import React, { useState, useEffect } from 'react';
import {
  Building,
  Flat,
  MonthlyBill,
  Language,
  FlatBillEntry,
  OCRBillData,
} from './types';
import {
  loadAppState,
  saveAppState,
  createDemoState,
  createEmptyInitialState,
  clearAllData,
  generatePresetFlats,
} from './utils/storage';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { MasterSubMeterDashboard } from './components/MasterSubMeterDashboard';
import { FlatsManagerView } from './components/FlatsManagerView';
import { BillEntryWizard } from './components/BillEntryWizard';
import { StatementsView } from './components/StatementsView';
import { ReportsView } from './components/ReportsView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { BillScannerModal } from './components/BillScannerModal';
import { BillDeskAutoFetchModal } from './components/BillDeskAutoFetchModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { AdBanner } from './components/AdBanner';
import { InterstitialAdModal } from './components/InterstitialAdModal';
import { isBannerAdEnabled, setBannerAdEnabled } from './utils/adsConfig';
import { Plus, X } from 'lucide-react';

export default function App() {
  // Navigation & Language
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [language, setLanguage] = useState<Language>('en');

  // AdMob State
  const [showBannerAd, setShowBannerAd] = useState<boolean>(isBannerAdEnabled());
  const [isInterstitialOpen, setIsInterstitialOpen] = useState<boolean>(false);
  const [interstitialReason, setInterstitialReason] = useState<string>('');

  // Core Data
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [activeBuildingId, setActiveBuildingId] = useState<string>('');
  const [flats, setFlats] = useState<Flat[]>([]);
  const [bills, setBills] = useState<MonthlyBill[]>([]);
  const [currentBillId, setCurrentBillId] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Modals & Wizard Flow
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isAutoFetchOpen, setIsAutoFetchOpen] = useState<boolean>(false);
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState<boolean>(false);
  const [isAddBuildingOpen, setIsAddBuildingOpen] = useState<boolean>(false);
  const [newBuildingName, setNewBuildingName] = useState<string>('');
  const [newBuildingAddress, setNewBuildingAddress] = useState<string>('');
  const [newBuildingOwner, setNewBuildingOwner] = useState<string>('');
  const [newBuildingMobile, setNewBuildingMobile] = useState<string>('');

  const [whatsAppModalFlat, setWhatsAppModalFlat] = useState<FlatBillEntry | null>(null);
  const [initialOcrData, setInitialOcrData] = useState<OCRBillData | null>(null);
  const [initialBillPhoto, setInitialBillPhoto] = useState<string | null>(null);

  // Initial Load from localStorage or Clean initialization
  const loadData = () => {
    try {
      const rawSub = localStorage.getItem('master_submeter_flats_v1');
      if (rawSub && (rawSub.includes('sm_1') || rawSub.includes('220'))) {
        localStorage.removeItem('master_submeter_flats_v1');
      }
    } catch {}

    const data = loadAppState();
    if (data && data.buildings.length > 0) {
      setBuildings(data.buildings);
      setActiveBuildingId(data.activeBuildingId || data.buildings[0].id);
      setFlats(data.flats);
      setBills(data.monthlyBills);
      setCurrentBillId(data.selectedBillId || (data.monthlyBills.length > 0 ? data.monthlyBills[0].id : null));
      setLanguage(data.language || 'en');
      setIsDemoMode(data.isDemoMode);
    } else {
      const empty = createEmptyInitialState();
      setBuildings(empty.buildings);
      setActiveBuildingId(empty.activeBuildingId);
      setFlats(empty.flats);
      setBills(empty.monthlyBills);
      setCurrentBillId(null);
      setIsDemoMode(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync to localStorage whenever data changes
  useEffect(() => {
    if (buildings.length > 0) {
      saveAppState({
        buildings,
        activeBuildingId,
        flats,
        monthlyBills: bills,
        selectedBillId: currentBillId,
        language,
        isDemoMode,
      });
    }
  }, [buildings, flats, bills, activeBuildingId, language, isDemoMode, currentBillId]);

  // Active Building and Current Bill
  const activeBuilding =
    buildings.find((b) => b.id === activeBuildingId) ||
    buildings[0] || {
      id: 'bld_default',
      name: 'Nagji Yadav Premises',
      address: 'Jaipur, Rajasthan',
      ownerName: 'Nagji Yadav',
      ownerMobile: '',
      createdAt: new Date().toISOString(),
    };

  const buildingBills = bills.filter((b) => b.buildingId === activeBuilding.id);
  const currentBill =
    buildingBills.find((b) => b.id === currentBillId) ||
    (buildingBills.length > 0 ? buildingBills[0] : null);

  // Toggle Demo Mode
  const handleToggleDemoMode = () => {
    if (!isDemoMode) {
      const demo = createDemoState();
      setBuildings(demo.buildings);
      setActiveBuildingId(demo.activeBuildingId);
      setFlats(demo.flats);
      setBills(demo.monthlyBills);
      setCurrentBillId(demo.monthlyBills[0].id);
      setIsDemoMode(true);
    } else {
      setIsDemoMode(false);
    }
  };

  // Switch Active Building
  const handleSelectBuilding = (id: string) => {
    setActiveBuildingId(id);
    const relatedBills = bills.filter((b) => b.buildingId === id);
    setCurrentBillId(relatedBills.length > 0 ? relatedBills[0].id : null);
  };

  // Add Building
  const handleCreateBuilding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBuildingName.trim()) return;

    const newBld: Building = {
      id: `bld_${Date.now()}`,
      name: newBuildingName.trim(),
      address: newBuildingAddress.trim() || 'Jaipur, Rajasthan',
      ownerName: newBuildingOwner.trim() || 'Building Owner',
      ownerMobile: newBuildingMobile.trim() || '',
      createdAt: new Date().toISOString(),
    };

    const newBuildingFlats = generatePresetFlats(newBld.id, 8);

    setBuildings((prev) => [...prev, newBld]);
    setFlats((prev) => [...prev, ...newBuildingFlats]);
    setActiveBuildingId(newBld.id);
    setCurrentBillId(null);
    setIsAddBuildingOpen(false);
    setNewBuildingName('');
    setNewBuildingAddress('');
    setNewBuildingOwner('');
    setNewBuildingMobile('');
  };

  // Update Building Details
  const handleUpdateBuilding = (updated: Building) => {
    setBuildings((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  // Add Single Flat
  const handleAddFlat = (newFlat: Flat) => {
    setFlats((prev) => [...prev, newFlat]);
  };

  // Update Single Flat
  const handleUpdateFlat = (updated: Flat) => {
    setFlats((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  // Delete Single Flat
  const handleDeleteFlat = (flatId: string) => {
    setFlats((prev) => prev.filter((f) => f.id !== flatId));
  };

  // Batch generate flats (e.g. 5, 8, 10, 12, 20 or custom count)
  const handleBatchGenerateFlats = (count: number) => {
    const generated = generatePresetFlats(activeBuilding.id, count);
    // Replace current building's flats with newly generated set
    setFlats((prev) => [
      ...prev.filter((f) => f.buildingId !== activeBuilding.id),
      ...generated,
    ]);
  };

  // Handle OCR Confirm Bill
  const handleOcrConfirm = (data: OCRBillData, imageBase64?: string) => {
    setInitialOcrData(data);
    if (imageBase64) setInitialBillPhoto(imageBase64);
    setActiveTab('dashboard');
  };

  // Save new or edited Monthly Bill
  const handleSaveBill = (newBill: MonthlyBill) => {
    setBills((prev) => {
      const existsIndex = prev.findIndex((b) => b.id === newBill.id);
      if (existsIndex >= 0) {
        const copy = [...prev];
        copy[existsIndex] = newBill;
        return copy;
      }
      return [newBill, ...prev];
    });
    setCurrentBillId(newBill.id);

    // Trigger AdMob Interstitial Ad on bill completion
    setInterstitialReason('Bill Generated & Saved');
    setIsInterstitialOpen(true);

    // Also update flats' previousReading and currentReading in state for subsequent cycles
    setFlats((prev) =>
      prev.map((flat) => {
        const entry = newBill.flatEntries.find((e) => e.flatId === flat.id);
        if (entry) {
          return {
            ...flat,
            previousReading: entry.previousReading,
            currentReading: entry.currentReading,
          };
        }
        return flat;
      })
    );
  };

  // Delete Bill
  const handleDeleteBill = (billId: string) => {
    setBills((prev) => prev.filter((b) => b.id !== billId));
    if (currentBillId === billId) {
      const remaining = bills.filter((b) => b.id !== billId && b.buildingId === activeBuilding.id);
      setCurrentBillId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Update Payment Status of a Flat
  const handleUpdatePaymentStatus = (flatId: string, status: 'Pending' | 'Paid') => {
    if (!currentBill) return;

    const updatedFlatEntries = currentBill.flatEntries.map((f) => {
      if (f.flatId === flatId) {
        return {
          ...f,
          paymentStatus: status,
          paymentDate: status === 'Paid' ? new Date().toISOString().slice(0, 10) : undefined,
          paymentMode: status === 'Paid' ? (f.paymentMode || 'UPI') : undefined,
        };
      }
      return f;
    });

    const updatedBill: MonthlyBill = {
      ...currentBill,
      flatEntries: updatedFlatEntries,
    };

    handleSaveBill(updatedBill);
  };

  // Update Flat Payment with full metadata from Reports modal
  const handleUpdateFlatPayment = (
    billId: string,
    flatId: string,
    status: 'Pending' | 'Paid',
    mode?: string,
    date?: string,
    notes?: string
  ) => {
    setBills((prev) =>
      prev.map((b) => {
        if (b.id === billId) {
          const updatedEntries = b.flatEntries.map((f) => {
            if (f.flatId === flatId) {
              return {
                ...f,
                paymentStatus: status,
                paymentMode: mode as 'Cash' | 'UPI' | 'Bank Transfer' | 'Other' | undefined,
                paymentDate: date,
                paymentNotes: notes,
              };
            }
            return f;
          });
          return { ...b, flatEntries: updatedEntries };
        }
        return b;
      })
    );
  };

  const handleUpdateBuildingManager = (name: string, mobile: string) => {
    setBuildings((prev) =>
      prev.map((b) => (b.id === activeBuilding.id ? { ...b, ownerName: name, ownerMobile: mobile } : b))
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header Bar */}
      <Header
        language={language}
        onLanguageChange={setLanguage}
        buildings={buildings}
        activeBuildingId={activeBuilding.id}
        onSelectBuilding={handleSelectBuilding}
        onAddBuilding={() => setIsAddBuildingOpen(true)}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleToggleDemoMode}
        onOpenSettings={() => setActiveTab('history')}
      />

      {/* Main App Content View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 md:p-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            building={activeBuilding}
            flats={flats.filter((f) => f.buildingId === activeBuilding.id)}
            currentBill={currentBill}
            language={language}
            onSaveBill={handleSaveBill}
            onUpdateBuildingManager={handleUpdateBuildingManager}
            onViewHistory={() => setActiveTab('history')}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            building={activeBuilding}
            bills={buildingBills}
            language={language}
            onSelectBill={(b) => {
              setCurrentBillId(b.id);
            }}
            onDeleteBill={handleDeleteBill}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            language={language}
            onLanguageChange={setLanguage}
            isDemoMode={isDemoMode}
            onToggleDemoMode={handleToggleDemoMode}
            onOpenPrivacyPolicy={() => setIsPrivacyPolicyOpen(true)}
            onReloadData={loadData}
            isBannerAdActive={showBannerAd}
            onToggleBannerAd={() => {
              setShowBannerAd((prev) => {
                const next = !prev;
                setBannerAdEnabled(next);
                return next;
              });
            }}
            onTriggerTestInterstitial={() => {
              setInterstitialReason('AdMob Interstitial Test');
              setIsInterstitialOpen(true);
            }}
          />
        )}
      </main>

      {/* Google AdMob Banner Ad (Sticky above bottom navigation) */}
      <AdBanner
        isVisible={showBannerAd}
        onClose={() => {
          setShowBannerAd(false);
          setBannerAdEnabled(false);
        }}
      />

      {/* Android Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        language={language}
      />

      {/* Google AdMob Interstitial Ad Modal */}
      <InterstitialAdModal
        isOpen={isInterstitialOpen}
        onClose={() => setIsInterstitialOpen(false)}
        reason={interstitialReason}
      />

      {/* Bill Scanner & OCR Verification Modal */}
      <BillScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        language={language}
        onConfirmBill={handleOcrConfirm}
      />

      {/* AVVNL BillDesk Auto Fetch Modal */}
      <BillDeskAutoFetchModal
        isOpen={isAutoFetchOpen}
        onClose={() => setIsAutoFetchOpen(false)}
        language={language}
        onApplyBillData={(data) => {
          setInitialOcrData(data);
          setIsAutoFetchOpen(false);
          setActiveTab('dashboard');
        }}
      />

      {/* WhatsApp Message Generator & Share Modal */}
      <WhatsAppShareModal
        isOpen={Boolean(whatsAppModalFlat)}
        onClose={() => setWhatsAppModalFlat(null)}
        flatEntry={whatsAppModalFlat}
        bill={currentBill}
        building={activeBuilding}
        language={language}
      />

      {/* Privacy Policy Modal */}
      <PrivacyPolicyModal
        isOpen={isPrivacyPolicyOpen}
        onClose={() => setIsPrivacyPolicyOpen(false)}
      />

      {/* Add Building Modal */}
      {isAddBuildingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleCreateBuilding}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Add New Building / Apartment</h3>
              <button
                type="button"
                onClick={() => setIsAddBuildingOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">* Building Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Balaji Heights"
                  value={newBuildingName}
                  onChange={(e) => setNewBuildingName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Mansarovar, Jaipur"
                  value={newBuildingAddress}
                  onChange={(e) => setNewBuildingAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Owner / Manager Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Patel"
                  value={newBuildingOwner}
                  onChange={(e) => setNewBuildingOwner(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Owner Mobile</label>
                <input
                  type="text"
                  placeholder="10-digit mobile number"
                  value={newBuildingMobile}
                  onChange={(e) => setNewBuildingMobile(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddBuildingOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow"
              >
                Create Building
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
