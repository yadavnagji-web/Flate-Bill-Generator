import React, { useState, useEffect, useMemo } from 'react';
import { Language } from '../types';
import {
  Zap,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Calculator,
  Building,
  User,
  Calendar,
  IndianRupee,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText,
  Check,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export interface SavedKNumberItem {
  kNumber: string;
  customerName: string;
  billAmount: number;
  unitsConsumed: number;
  billPeriod: string;
  isPaid: boolean;
  perUnitCost: number;
  lastFetchedAt: number; // timestamp
}

export interface SubMeterItem {
  id: string;
  name: string;
  previousReading: number;
  currentReading: number;
}

const STORAGE_KEY_KNUMBERS = 'master_submeter_k_numbers_v1';
const STORAGE_KEY_SELECTED_K = 'master_submeter_selected_k_v1';
const STORAGE_KEY_SUBMETERS = 'master_submeter_flats_v1';
const STORAGE_KEY_SAVED_NAMES = 'master_submeter_known_names_v1';

export const MasterSubMeterDashboard: React.FC<{ language: Language; onBackToManager?: () => void }> = ({
  language,
  onBackToManager,
}) => {
  // Section A State: K-Number Management
  const [kNumberInput, setKNumberInput] = useState<string>('');
  const [kNumbers, setKNumbers] = useState<SavedKNumberItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_KNUMBERS);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default initial K-Number
    return [
      {
        kNumber: '130523024253',
        customerName: 'Nagji Yadav',
        billAmount: 0,
        unitsConsumed: 0,
        billPeriod: 'September 2026',
        isPaid: true,
        perUnitCost: 10,
        lastFetchedAt: Date.now(),
      },
    ];
  });

  const [selectedK, setSelectedK] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTED_K);
      if (saved) return saved;
    } catch {}
    return '130523024253';
  });

  const [knownNames, setKnownNames] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SAVED_NAMES);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { '130523024253': 'Nagji Yadav' };
  });

  const [isLoadingBill, setIsLoadingBill] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Section C State: Sub-Meters for the active bill
  const [newSubMeterName, setNewSubMeterName] = useState<string>('');
  const [subMeters, setSubMeters] = useState<Record<string, SubMeterItem[]>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SUBMETERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          // Filter out legacy fake demo submeter entries
          const cleaned: Record<string, SubMeterItem[]> = {};
          for (const [k, list] of Object.entries(parsed)) {
            if (Array.isArray(list)) {
              cleaned[k] = list.filter((m: SubMeterItem) => {
                const isLegacyFake =
                  (m.name === 'Flat 1' && m.previousReading === 100 && m.currentReading === 220) ||
                  (m.name === 'Flat 2' && m.previousReading === 200 && m.currentReading === 350) ||
                  (m.name === 'Flat 3' && m.previousReading === 150 && m.currentReading === 260) ||
                  (m.name === 'Flat 4' && m.previousReading === 300 && m.currentReading === 420);
                return !isLegacyFake;
              });
            }
          }
          return cleaned;
        }
      }
    } catch {}
    return {
      '130523024253': [],
    };
  });

  // Active selected bill item
  const activeBillItem = useMemo(() => {
    return kNumbers.find((k) => k.kNumber === selectedK) || kNumbers[0] || null;
  }, [kNumbers, selectedK]);

  // Active submeters list
  const activeSubMeters = useMemo(() => {
    if (!activeBillItem) return [];
    return subMeters[activeBillItem.kNumber] || [];
  }, [activeBillItem, subMeters]);

  // Save state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_KNUMBERS, JSON.stringify(kNumbers));
    } catch {}
  }, [kNumbers]);

  useEffect(() => {
    try {
      if (selectedK) localStorage.setItem(STORAGE_KEY_SELECTED_K, selectedK);
    } catch {}
  }, [selectedK]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SUBMETERS, JSON.stringify(subMeters));
    } catch {}
  }, [subMeters]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SAVED_NAMES, JSON.stringify(knownNames));
    } catch {}
  }, [knownNames]);

  // Auto-Fetch: On mount, loop through saved K-Numbers. If not fetched in 30 days, trigger background fetch
  useEffect(() => {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    kNumbers.forEach((item) => {
      if (!item.lastFetchedAt || now - item.lastFetchedAt > THIRTY_DAYS_MS) {
        // Silent background fetch
        fetchBillForKNumber(item.kNumber, true);
      }
    });
  }, []);

  // Fetch bill via backend endpoint POST /api/avvnl/bill
  const fetchBillForKNumber = async (targetK: string, isSilent: boolean = false) => {
    const cleanK = targetK.trim().replace(/[^0-9]/g, '');
    if (!cleanK || cleanK.length < 10) {
      if (!isSilent) setFetchError('Please enter a valid 12-digit K-Number.');
      return;
    }

    if (!isSilent) {
      setIsLoadingBill(true);
      setFetchError(null);
    }

    try {
      const response = await fetch('/api/avvnl/bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kNumber: cleanK }),
      });

      let resData: any = null;
      try {
        const text = await response.text();
        if (text && text.trim().startsWith('{')) {
          resData = JSON.parse(text);
        }
      } catch (e) {
        console.warn('Non-JSON response in MasterSubMeterDashboard:', e);
      }

      if (resData && resData.success && resData.data) {
        const d = resData.data;
        const isPaid = Boolean(resData.isPaid || d.billAmount === 0);

        // Preserve real customer name from history / localStorage
        let resolvedName = d.customerName;
        if ((!resolvedName || resolvedName.includes('No Dues') || resolvedName.includes('Saved in History')) && knownNames[cleanK]) {
          resolvedName = knownNames[cleanK];
        } else if (resolvedName && !resolvedName.includes('No Dues')) {
          setKnownNames((prev) => ({ ...prev, [cleanK]: resolvedName }));
        }

        const billAmount = Number(d.billAmount || 0);
        const unitsConsumed = Number(d.unitsConsumed || 0);
        const perUnitCost = unitsConsumed > 0 && billAmount > 0 ? Number((billAmount / unitsConsumed).toFixed(2)) : 10;

        setKNumbers((prev) => {
          const exists = prev.find((k) => k.kNumber === cleanK);
          if (exists) {
            return prev.map((k) =>
              k.kNumber === cleanK
                ? {
                    ...k,
                    customerName: resolvedName || k.customerName,
                    billAmount,
                    unitsConsumed: unitsConsumed || (isPaid ? k.unitsConsumed : 0),
                    billPeriod: d.billPeriod || k.billPeriod || 'September 2026',
                    isPaid,
                    perUnitCost: perUnitCost || k.perUnitCost || 10,
                    lastFetchedAt: Date.now(),
                  }
                : k
            );
          } else {
            return [
              ...prev,
              {
                kNumber: cleanK,
                customerName: resolvedName || (cleanK === '130523024253' ? 'Nagji Yadav' : `AVVNL Consumer (${cleanK})`),
                billAmount,
                unitsConsumed: unitsConsumed || 0,
                billPeriod: d.billPeriod || 'September 2026',
                isPaid,
                perUnitCost: perUnitCost || 10,
                lastFetchedAt: Date.now(),
              },
            ];
          }
        });
      } else {
        if (!isSilent) {
          setFetchError(resData.error || 'Failed to fetch bill from AVVNL BBPS.');
        }
      }
    } catch {
      if (!isSilent) {
        setFetchError('Network error while connecting to AVVNL server.');
      }
    } finally {
      if (!isSilent) {
        setIsLoadingBill(false);
      }
    }
  };

  // Section A: Add new K-Number
  const handleAddKNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanK = kNumberInput.trim().replace(/[^0-9]/g, '');
    if (!cleanK || cleanK.length < 10) {
      setFetchError('Please enter a valid 12-digit AVVNL K-Number.');
      return;
    }

    setFetchError(null);
    setSelectedK(cleanK);

    // If already in list, select and refresh
    const existing = kNumbers.find((k) => k.kNumber === cleanK);
    if (existing) {
      fetchBillForKNumber(cleanK);
      setKNumberInput('');
      return;
    }

    // Add placeholder item and trigger fetch
    const newItem: SavedKNumberItem = {
      kNumber: cleanK,
      customerName: knownNames[cleanK] || (cleanK === '130523024253' ? 'Nagji Yadav' : `AVVNL Consumer (${cleanK})`),
      billAmount: 0,
      unitsConsumed: 0,
      billPeriod: 'Current',
      isPaid: false,
      perUnitCost: 10,
      lastFetchedAt: 0,
    };

    setKNumbers((prev) => [...prev, newItem]);
    setKNumberInput('');
    fetchBillForKNumber(cleanK);
  };

  // Section A: Delete K-Number
  const handleDeleteKNumber = (targetK: string) => {
    if (kNumbers.length <= 1) {
      alert('At least one K-Number must be saved.');
      return;
    }
    const updated = kNumbers.filter((k) => k.kNumber !== targetK);
    setKNumbers(updated);
    if (selectedK === targetK) {
      setSelectedK(updated[0].kNumber);
    }
  };

  // Section C: Sub-Meter Management
  const handleAddSubMeter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBillItem) return;
    const name = newSubMeterName.trim();
    if (!name) return;

    const currentList = subMeters[activeBillItem.kNumber] || [];
    const newId = 'sm_' + Date.now().toString().slice(-6);

    const newItem: SubMeterItem = {
      id: newId,
      name,
      previousReading: 0,
      currentReading: 0,
    };

    setSubMeters((prev) => ({
      ...prev,
      [activeBillItem.kNumber]: [...currentList, newItem],
    }));

    setNewSubMeterName('');
  };

  const handleUpdateSubMeterReading = (
    meterId: string,
    field: 'previousReading' | 'currentReading',
    val: number
  ) => {
    if (!activeBillItem) return;
    const currentList = subMeters[activeBillItem.kNumber] || [];
    const updated = currentList.map((m) => (m.id === meterId ? { ...m, [field]: isNaN(val) ? 0 : val } : m));

    setSubMeters((prev) => ({
      ...prev,
      [activeBillItem.kNumber]: updated,
    }));
  };

  const handleDeleteSubMeter = (meterId: string) => {
    if (!activeBillItem) return;
    const currentList = subMeters[activeBillItem.kNumber] || [];
    setSubMeters((prev) => ({
      ...prev,
      [activeBillItem.kNumber]: currentList.filter((m) => m.id !== meterId),
    }));
  };

  // Sub-Meter Calculations
  const calculatedSubMeters = useMemo(() => {
    if (!activeBillItem) return [];
    const perUnitCost = activeBillItem.perUnitCost || 10;

    return activeSubMeters.map((m) => {
      const consumedUnits = Math.max(0, m.currentReading - m.previousReading);
      const subMeterAmount = Math.round(consumedUnits * perUnitCost);
      return {
        ...m,
        consumedUnits,
        subMeterAmount,
      };
    });
  }, [activeSubMeters, activeBillItem]);

  // Real-time Summary
  const summary = useMemo(() => {
    if (!activeBillItem) {
      return { totalSubUnits: 0, totalSubAmount: 0, remainingUnits: 0, remainingAmount: 0 };
    }

    const totalSubUnits = calculatedSubMeters.reduce((acc, m) => acc + m.consumedUnits, 0);
    const totalSubAmount = calculatedSubMeters.reduce((acc, m) => acc + m.subMeterAmount, 0);

    const baseMainUnits = activeBillItem.unitsConsumed > 0 ? activeBillItem.unitsConsumed : 0;
    const baseMainAmount = activeBillItem.billAmount > 0 ? activeBillItem.billAmount : 0;

    const remainingUnits = baseMainUnits > 0 ? baseMainUnits - totalSubUnits : 0;
    const remainingAmount = baseMainAmount > 0 ? baseMainAmount - totalSubAmount : 0;

    return {
      baseMainUnits,
      baseMainAmount,
      totalSubUnits,
      totalSubAmount,
      remainingUnits,
      remainingAmount,
    };
  }, [activeBillItem, calculatedSubMeters]);

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen py-6 px-3 sm:px-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* App Top Bar */}
        <div className="bg-white border-2 border-blue-600/30 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20">
              <Zap className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Master Sub Meter Bill Generator
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Pay2All BBPS API
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Official AVVNL electricity bill fetch & proportional sub-meter unit division.
              </p>
            </div>
          </div>

          {onBackToManager && (
            <button
              onClick={onBackToManager}
              className="self-start sm:self-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>Back to Main Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* SECTION A: K-NUMBER MANAGEMENT */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Section A: K-Number Management
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {kNumbers.length} Saved Connection{kNumbers.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Add K-Number Input Form */}
          <form onSubmit={handleAddKNumber} className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <input
                type="text"
                value={kNumberInput}
                onChange={(e) => setKNumberInput(e.target.value)}
                placeholder="Enter 12-digit AVVNL K-Number (e.g. 130523024253)"
                maxLength={15}
                className="w-full px-4 py-2.5 bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl text-slate-900 font-mono text-sm font-bold outline-none transition placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add & Fetch</span>
            </button>
          </form>

          {fetchError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{fetchError}</span>
            </div>
          )}

          {/* K-Numbers List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {kNumbers.map((item) => {
              const isSelected = item.kNumber === selectedK;
              return (
                <div
                  key={item.kNumber}
                  onClick={() => setSelectedK(item.kNumber)}
                  className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between space-y-2.5 ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-black text-slate-900 tracking-wide">
                          {item.kNumber}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 font-medium truncate max-w-[170px]">
                        {item.customerName || 'Nagji Yadav'}
                      </div>
                    </div>

                    {item.isPaid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✅ PAID
                      </span>
                    ) : (
                      <span className="font-mono text-xs font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                        ₹{item.billAmount.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <span>Cycle: <strong>{item.billPeriod || 'Current'}</strong></span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => fetchBillForKNumber(item.kNumber)}
                        disabled={isLoadingBill && selectedK === item.kNumber}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold flex items-center gap-1 transition"
                        title="Fetch latest bill"
                      >
                        <RefreshCw
                          className={`w-3 h-3 ${isLoadingBill && selectedK === item.kNumber ? 'animate-spin' : ''}`}
                        />
                        <span>Fetch</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteKNumber(item.kNumber)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                        title="Delete K-Number"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION B: BILL DETAILS DISPLAY */}
        {activeBillItem && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    Section B: Bill Details Display
                  </h2>
                  <p className="text-xs text-slate-500">
                    Selected K-No: <strong className="font-mono text-slate-900">{activeBillItem.kNumber}</strong> • AVVNL Discom
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fetchBillForKNumber(activeBillItem.kNumber)}
                  disabled={isLoadingBill}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBill ? 'animate-spin' : ''}`} />
                  <span>{isLoadingBill ? 'Fetching...' : 'Re-Fetch Bill'}</span>
                </button>
              </div>
            </div>

            {/* Bill Details 4-Hero Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* 1. Customer Name */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Customer Name</span>
                </span>
                <span className="text-base font-black text-slate-900 truncate mt-1">
                  {activeBillItem.customerName || 'Nagji Yadav'}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold mt-1">
                  ✓ Preserved in History
                </span>
              </div>

              {/* 2. Bill Month */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Bill Month</span>
                </span>
                <span className="text-base font-black text-slate-900 mt-1">
                  {activeBillItem.billPeriod || 'September 2026'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">Billing Cycle</span>
              </div>

              {/* 3. Total Amount */}
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 flex flex-col justify-between">
                <span className="text-[11px] text-blue-700 font-medium flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
                  <span>Total Amount (₹)</span>
                </span>

                <div className="mt-1">
                  {activeBillItem.isPaid ? (
                    <div className="flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-black bg-emerald-500 text-white shadow-sm">
                        ✅ PAID (NO DUES)
                      </span>
                    </div>
                  ) : (
                    <span className="text-xl font-black text-blue-900 font-mono">
                      ₹{activeBillItem.billAmount.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 mt-1">
                  {activeBillItem.isPaid ? 'No Outstanding Dues' : 'Official Billed Rashi'}
                </span>
              </div>

              {/* 4. Total Units */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between">
                <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-amber-600" />
                  <span>Total Units</span>
                </span>
                <span className="text-xl font-black text-emerald-700 font-mono mt-1">
                  {activeBillItem.unitsConsumed} Units
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {activeBillItem.unitsConsumed > 0 ? 'Main Meter kWh' : 'No Current Units Billed'}
                </span>
              </div>

              {/* 5. Per Unit Cost */}
              <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col justify-between">
                <span className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Per Unit Cost</span>
                </span>
                <span className="text-xl font-black text-emerald-900 font-mono mt-1">
                  ₹{activeBillItem.perUnitCost.toFixed(2)}/unit
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold mt-1">
                  = Total Amount / Units
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION C: SUB-METER CALCULATOR */}
        {activeBillItem && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900">
                    Section C: Sub-Meter Calculator
                  </h2>
                  <p className="text-xs text-slate-500">
                    Rate: <strong className="font-mono text-emerald-700">₹{activeBillItem.perUnitCost.toFixed(2)}/unit</strong> • Add flats and enter meter readings
                  </p>
                </div>
              </div>

              {/* Add Sub-Meter Form */}
              <form onSubmit={handleAddSubMeter} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubMeterName}
                  onChange={(e) => setNewSubMeterName(e.target.value)}
                  placeholder="Sub-Meter Name (e.g. Flat 1)"
                  className="px-3.5 py-1.5 bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl text-xs font-semibold text-slate-900 outline-none w-48"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow transition cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sub-Meter</span>
                </button>
              </form>
            </div>

            {/* Sub-Meters Table / Cards */}
            {calculatedSubMeters.length === 0 ? (
              <div className="p-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <Building className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-600">No sub-meters added yet for this connection.</p>
                <p className="text-xs text-slate-400">Enter a flat name above and click "Add Sub-Meter".</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 rounded-l-lg">Sub-Meter Name</th>
                      <th className="py-2.5 px-3">Previous Reading</th>
                      <th className="py-2.5 px-3">Current Reading</th>
                      <th className="py-2.5 px-3 text-center">Consumed Units</th>
                      <th className="py-2.5 px-3 text-right">Sub-Meter Amount (₹)</th>
                      <th className="py-2.5 px-3 text-center rounded-r-lg">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculatedSubMeters.map((meter) => (
                      <tr key={meter.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {meter.name}
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min={0}
                            value={meter.previousReading}
                            onChange={(e) =>
                              handleUpdateSubMeterReading(meter.id, 'previousReading', parseFloat(e.target.value))
                            }
                            className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-lg text-slate-900 font-mono font-bold outline-none"
                          />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min={0}
                            value={meter.currentReading}
                            onChange={(e) =>
                              handleUpdateSubMeterReading(meter.id, 'currentReading', parseFloat(e.target.value))
                            }
                            className="w-24 px-2.5 py-1.5 bg-slate-50 border border-slate-300 focus:border-blue-600 rounded-lg text-slate-900 font-mono font-bold outline-none"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono font-black text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                            {meter.consumedUnits} Units
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-mono font-black text-sm text-slate-900">
                            ₹{meter.subMeterAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            ({meter.consumedUnits} × ₹{activeBillItem.perUnitCost.toFixed(2)})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteSubMeter(meter.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Remove Sub-Meter"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* REAL-TIME SUMMARY BAR AT BOTTOM */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-800">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-300" />
                  <span>Real-Time Main Bill vs Sub-Meters Summary</span>
                </span>
                <span className="text-xs font-mono text-emerald-300 font-bold">
                  {summary.totalSubUnits} Sub-Meter Units Allocated
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[11px] text-slate-300 block">Total Main Bill Units:</span>
                  <span className="text-lg font-black font-mono text-white">
                    {summary.baseMainUnits} Units
                  </span>
                </div>

                <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-[11px] text-slate-300 block">All Sub-Meters Units:</span>
                  <span className="text-lg font-black font-mono text-cyan-300">
                    {summary.totalSubUnits} Units
                  </span>
                </div>

                <div className="p-2.5 bg-white/10 rounded-xl border border-amber-400/30">
                  <span className="text-[11px] text-amber-200 block font-semibold">
                    Remaining Units (Main):
                  </span>
                  <span
                    className={`text-xl font-black font-mono ${
                      summary.remainingUnits < 0 ? 'text-red-400' : 'text-amber-300'
                    }`}
                  >
                    {summary.remainingUnits} Units
                  </span>
                </div>

                <div className="p-2.5 bg-white/10 rounded-xl border border-emerald-400/30">
                  <span className="text-[11px] text-emerald-200 block font-semibold">
                    Remaining Amount (Main):
                  </span>
                  <span
                    className={`text-xl font-black font-mono ${
                      summary.remainingAmount < 0 ? 'text-red-400' : 'text-emerald-300'
                    }`}
                  >
                    ₹{summary.remainingAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                <span>
                  Remaining units/amount represent common area consumption (water motor, staircase lighting, elevator).
                </span>
                <span className="font-mono text-cyan-200">
                  Per Unit Cost: ₹{activeBillItem.perUnitCost.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
