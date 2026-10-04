import React, { useState, useEffect, useMemo } from 'react';
import { Building, Flat, MonthlyBill, Language, FlatBillEntry } from '../types';
import { formatCurrency, formatUnits, formatBillingMonth } from '../utils/calculator';
import { generateAllFlatsCombinedPdf, generateIndividualFlatPdf } from '../utils/pdfGenerator';
import { getSavedKNumber, saveKNumber, USER_DEFAULT_K_NUMBER } from '../utils/storage';
import {
  Zap,
  Plus,
  Trash2,
  RefreshCw,
  FileDown,
  Share2,
  CheckCircle2,
  Calculator,
  Building as BuildingIcon,
  User,
  Layers,
  Edit3,
  Calendar,
  IndianRupee,
  Download,
  Check,
  RotateCcw,
  Clock,
  Sparkles,
  Phone,
  FileText,
} from 'lucide-react';

interface SubMeterFlatRow {
  id: string;
  name: string;
  units: number;
  customPayable: number | null; // null if auto, number if landlord manually corrected
  mobile: string;
}

const STORAGE_SAVED_K_LIST = 'app_saved_k_numbers_list_v2';
const STORAGE_FLAT_ROWS_PREFIX = 'app_submeters_by_k_';

interface DashboardViewProps {
  building: Building;
  flats: Flat[];
  currentBill: MonthlyBill | null;
  language: Language;
  onSaveBill: (bill: MonthlyBill) => void;
  onUpdateBuildingManager?: (name: string, mobile: string) => void;
  onViewHistory?: () => void;
  onOpenSettings?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  building,
  flats: initialFlats,
  currentBill,
  language,
  onSaveBill,
  onViewHistory,
}) => {
  // ==========================================
  // STEP 1 & 2: ENTER K-NO & ADD K-NO
  // ==========================================
  const [kNumberInput, setKNumberInput] = useState<string>('');
  const [savedKNumbers, setSavedKNumbers] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SAVED_K_LIST);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    const defaultK = getSavedKNumber() || USER_DEFAULT_K_NUMBER;
    return [defaultK];
  });

  const [activeKNumber, setActiveKNumber] = useState<string>(() => {
    const saved = getSavedKNumber();
    return saved && saved.length >= 10 ? saved : USER_DEFAULT_K_NUMBER;
  });

  // Save K-Number list
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SAVED_K_LIST, JSON.stringify(savedKNumbers));
    } catch {}
  }, [savedKNumbers]);

  // Sync active K-Number to storage
  useEffect(() => {
    if (activeKNumber) {
      saveKNumber(activeKNumber);
    }
  }, [activeKNumber]);

  // ==========================================
  // STEP 3 & 5: AUTO OR MANUAL FETCH & MAIN METER UNITS
  // ==========================================
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSuccessMsg, setFetchSuccessMsg] = useState<string | null>(null);

  // Active Main Bill Data
  const [consumerName, setConsumerName] = useState<string>('Nagji Yadav');
  const [billingMonth, setBillingMonth] = useState<string>('September 2026');
  const [billDate, setBillDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)
  );
  const [billAmount, setBillAmount] = useState<number>(0);
  const [mainUnits, setMainUnits] = useState<number>(0);
  const [billStatus, setBillStatus] = useState<'PAID' | 'DUE' | 'UNFETCHED'>('UNFETCHED');

  // Manual Edit Overlay State
  const [isManualEditOpen, setIsManualEditOpen] = useState<boolean>(false);

  // ==========================================
  // STEP 4: SUB-METER UNITS INPUT
  // ==========================================
  const [flatRows, setFlatRows] = useState<SubMeterFlatRow[]>(() => {
    // Try to load saved sub-meters for this K-Number
    try {
      const raw = localStorage.getItem(STORAGE_FLAT_ROWS_PREFIX + (getSavedKNumber() || USER_DEFAULT_K_NUMBER));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    // Default clean 4 flats with 0 initial units
    return [
      { id: 'flat_1', name: 'Flat 1', units: 0, customPayable: null, mobile: '' },
      { id: 'flat_2', name: 'Flat 2', units: 0, customPayable: null, mobile: '' },
      { id: 'flat_3', name: 'Flat 3', units: 0, customPayable: null, mobile: '' },
      { id: 'flat_4', name: 'Flat 4', units: 0, customPayable: null, mobile: '' },
    ];
  });

  // Save flats per active K-Number
  useEffect(() => {
    try {
      if (activeKNumber) {
        localStorage.setItem(STORAGE_FLAT_ROWS_PREFIX + activeKNumber, JSON.stringify(flatRows));
      }
    } catch {}
  }, [flatRows, activeKNumber]);

  // When active K-Number switches, load its saved flats
  const handleSelectKNumber = (targetK: string) => {
    setActiveKNumber(targetK);
    try {
      const raw = localStorage.getItem(STORAGE_FLAT_ROWS_PREFIX + targetK);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFlatRows(parsed);
          return;
        }
      }
    } catch {}
  };

  // Add new K-Number
  const handleAddKNumber = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = kNumberInput.trim().replace(/[^0-9]/g, '');
    if (!clean || clean.length < 10) {
      setFetchError(
        language === 'hi'
          ? 'कृपया मान्य 12-अंकों का K-नंबर दर्ज करें।'
          : 'Please enter a valid 10-12 digit K-Number.'
      );
      return;
    }
    setFetchError(null);
    if (!savedKNumbers.includes(clean)) {
      setSavedKNumbers((prev) => [clean, ...prev]);
    }
    setActiveKNumber(clean);
    setKNumberInput('');
    // Auto-trigger fetch for the newly added K-Number
    triggerAutoFetch(clean);
  };

  // Delete K-Number
  const handleDeleteKNumber = (targetK: string) => {
    if (savedKNumbers.length <= 1) {
      alert(language === 'hi' ? 'कम से कम एक K-नंबर रहना आवश्यक है।' : 'At least one K-Number is required.');
      return;
    }
    const updated = savedKNumbers.filter((k) => k !== targetK);
    setSavedKNumbers(updated);
    if (activeKNumber === targetK) {
      setActiveKNumber(updated[0]);
      handleSelectKNumber(updated[0]);
    }
  };

  // ==========================================
  // AUTO FETCH LOGIC (AVVNL BBPS & BillDesk API)
  // ==========================================
  const triggerAutoFetch = async (kNumToFetch?: string) => {
    const targetK = (kNumToFetch || activeKNumber).trim().replace(/[^0-9]/g, '');
    if (!targetK || targetK.length < 10) {
      setFetchError('Invalid K-Number.');
      return;
    }

    setIsFetching(true);
    setFetchError(null);
    setFetchSuccessMsg(null);

    try {
      // Call official Pay2All BBPS endpoint
      const res = await fetch('/api/avvnl/bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kNumber: targetK }),
      });
      const data = await res.json();

      if (data.success && data.data) {
        const d = data.data;
        const fetchedAmt = Number(d.billAmount || 0);
        const fetchedUnits = Number(d.unitsConsumed || 0);
        const isPaid = Boolean(data.isPaid || fetchedAmt === 0);

        setBillAmount(fetchedAmt);
        setMainUnits(fetchedUnits);
        if (d.customerName && !d.customerName.includes('No Dues')) {
          setConsumerName(d.customerName);
        } else if (targetK === '130523024253') {
          setConsumerName('Nagji Yadav');
        }
        if (d.billPeriod && d.billPeriod !== 'Paid') {
          setBillingMonth(d.billPeriod);
        }
        setBillStatus(isPaid ? 'PAID' : 'DUE');

        const msg = isPaid
          ? language === 'hi'
            ? `✅ AVVNL से प्राप्त: बिल जमा है (PAID / NO DUES)। यदि आप निश्चित मासिक राशि बांटना चाहते हैं, तो 'Manual Edit' में राशि दर्ज करें।`
            : `✅ Fetched from AVVNL: Bill is PAID / NO DUES. If you want to distribute a custom amount, use 'Manual Edit'.`
          : language === 'hi'
          ? `✅ AVVNL से ₹${fetchedAmt.toLocaleString('en-IN')} का बिल सफलतापूर्वक प्राप्त हुआ!`
          : `✅ Bill of ₹${fetchedAmt.toLocaleString('en-IN')} fetched successfully from AVVNL!`;

        setFetchSuccessMsg(msg);
      } else {
        // Fallback to billdesk-fetch endpoint
        const fbRes = await fetch('/api/billdesk-fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kNumber: targetK }),
        });
        const fbData = await fbRes.json();
        if (fbData.success) {
          const fbAmt = Number(fbData.billAmount || 0);
          const fbUnits = Number(fbData.totalUnits || 0);
          setBillAmount(fbAmt);
          setMainUnits(fbUnits);
          if (fbData.consumerName) setConsumerName(fbData.consumerName);
          if (fbData.billingMonth) setBillingMonth(fbData.billingMonth);
          setBillStatus(fbAmt > 0 ? 'DUE' : 'PAID');
          setFetchSuccessMsg(
            language === 'hi'
              ? `AVVNL बिजली मित्र से डेटा प्राप्त हुआ (स्थिति: ${fbData.statusMessageHi || fbData.statusMessage})`
              : `Fetched from AVVNL BijliMitra Portal`
          );
        } else {
          setFetchError(data.error || fbData.error || 'Could not fetch bill from AVVNL biller.');
        }
      }
    } catch (err: any) {
      setFetchError(err.message || 'Network error connecting to AVVNL bill gateway.');
    } finally {
      setIsFetching(false);
    }
  };

  // Fetch on mount if first time
  useEffect(() => {
    if (activeKNumber && billStatus === 'UNFETCHED') {
      triggerAutoFetch(activeKNumber);
    }
  }, [activeKNumber]);

  // ==========================================
  // STEP 6: INTERNAL PROCESS AUTOMATIC CALCULATION
  // ==========================================
  const totalFlatUnits = useMemo(() => {
    return flatRows.reduce((sum, f) => sum + (Number(f.units) || 0), 0);
  }, [flatRows]);

  // Main units: if user has entered mainUnits, use it; otherwise fallback to totalFlatUnits
  const effectiveMainUnits = mainUnits > 0 ? mainUnits : totalFlatUnits;

  // Rate per unit: Total Bill Amount ÷ Effective Main Units
  const perUnitRate = useMemo(() => {
    if (effectiveMainUnits > 0 && billAmount > 0) {
      return Number((billAmount / effectiveMainUnits).toFixed(2));
    }
    return 10.0; // standard base rate if bill is zero/paid
  }, [billAmount, effectiveMainUnits]);

  // Common units = Max(0, Main Meter Units - Total Flat Units)
  const commonUnits = useMemo(() => {
    if (effectiveMainUnits > totalFlatUnits) {
      return effectiveMainUnits - totalFlatUnits;
    }
    return 0;
  }, [effectiveMainUnits, totalFlatUnits]);

  // Common units per flat = Common Units ÷ Total Active Flats
  const activeFlatsCount = flatRows.length;
  const commonUnitsPerFlat = useMemo(() => {
    if (activeFlatsCount > 0 && commonUnits > 0) {
      return Number((commonUnits / activeFlatsCount).toFixed(2));
    }
    return 0;
  }, [activeFlatsCount, commonUnits]);

  // Flatwise calculated & custom corrected amounts
  const flatCalculations = useMemo(() => {
    return flatRows.map((flat) => {
      const ownAmount = Math.round((flat.units || 0) * perUnitRate);
      const commonAmount = Math.round(commonUnitsPerFlat * perUnitRate);
      const autoCalculatedTotal = ownAmount + commonAmount;

      // If user has provided a custom manual override, use it! Otherwise use autoCalculatedTotal
      const finalAmount =
        flat.customPayable !== null && !isNaN(flat.customPayable)
          ? flat.customPayable
          : autoCalculatedTotal;

      return {
        ...flat,
        ownAmount,
        commonUnitsShare: commonUnitsPerFlat,
        commonAmountShare: commonAmount,
        autoCalculatedTotal,
        finalAmount,
        isManuallyAdjusted: flat.customPayable !== null,
      };
    });
  }, [flatRows, perUnitRate, commonUnitsPerFlat]);

  // Total Distributed Amount across all flats
  const totalDistributedAmount = useMemo(() => {
    return flatCalculations.reduce((sum, f) => sum + f.finalAmount, 0);
  }, [flatCalculations]);

  // ==========================================
  // SUB-METER HANDLERS
  // ==========================================
  const handleAddFlat = () => {
    const nextNumber = flatRows.length + 1;
    const newRow: SubMeterFlatRow = {
      id: `flat_${Date.now()}`,
      name: `Flat ${nextNumber}`,
      units: 0,
      customPayable: null,
      mobile: '',
    };
    setFlatRows((prev) => [...prev, newRow]);
  };

  const handleUpdateFlatName = (id: string, name: string) => {
    setFlatRows((prev) => prev.map((f) => (f.id === id ? { ...f, name } : f)));
  };

  const handleUpdateFlatUnits = (id: string, unitsStr: string) => {
    const val = parseFloat(unitsStr);
    setFlatRows((prev) =>
      prev.map((f) => (f.id === id ? { ...f, units: isNaN(val) ? 0 : val } : f))
    );
  };

  // STEP 6: EDIT BILL RS FLATWISE IF CORRECTION
  const handleUpdateFlatPayable = (id: string, payableStr: string) => {
    if (payableStr === '') {
      // Reset to auto-calculated
      setFlatRows((prev) =>
        prev.map((f) => (f.id === id ? { ...f, customPayable: null } : f))
      );
      return;
    }
    const val = parseFloat(payableStr);
    setFlatRows((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, customPayable: isNaN(val) ? null : val } : f
      )
    );
  };

  const handleResetFlatCorrection = (id: string) => {
    setFlatRows((prev) =>
      prev.map((f) => (f.id === id ? { ...f, customPayable: null } : f))
    );
  };

  const handleDeleteFlat = (id: string) => {
    if (flatRows.length <= 1) {
      alert(language === 'hi' ? 'कम से कम 1 फ्लैट होना आवश्यक है।' : 'At least one flat is required.');
      return;
    }
    setFlatRows((prev) => prev.filter((f) => f.id !== id));
  };

  const handlePresetFlats = (count: number) => {
    const newFlats: SubMeterFlatRow[] = [];
    for (let i = 1; i <= count; i++) {
      newFlats.push({
        id: `flat_${Date.now()}_${i}`,
        name: `Flat ${i}`,
        units: 0,
        customPayable: null,
        mobile: '',
      });
    }
    setFlatRows(newFlats);
  };

  // ==========================================
  // STEP 7: GENERATE SUMMARY & DOWNLOAD ALL PDF FLATWISE
  // ==========================================
  const buildMonthlyBillObject = (): MonthlyBill => {
    const calcFlats: FlatBillEntry[] = flatCalculations.map((f, idx) => ({
      flatId: f.id,
      flatNumber: f.name.replace(/[^0-9]/g, '') || String(idx + 1),
      tenantName: f.name,
      tenantMobile: f.mobile || '',
      subMeterNumber: `SM-${f.name}`,
      entryMode: 'used_units',
      previousReading: 0,
      currentReading: f.units,
      usedUnits: f.units,
      ownAmount: f.ownAmount,
      commonUnitsShare: f.commonUnitsShare,
      commonAmountShare: f.commonAmountShare,
      finalPayableAmount: f.finalAmount,
      paymentStatus: 'Pending',
    }));

    return {
      id: `bill_${activeKNumber}_${Date.now()}`,
      buildingId: building.id,
      billingMonth: formatBillingMonth(billingMonth),
      billDate: billDate,
      dueDate: dueDate,
      kNumber: activeKNumber,
      consumerName: consumerName,
      billNumber: `AVVNL-${activeKNumber.slice(-6)}`,
      discomName: 'AVVNL',
      totalAvvnlBillAmount: billAmount,
      totalAvvnlBilledUnits: effectiveMainUnits,
      energyCharges: Math.round(billAmount * 0.765),
      fixedCharges: Math.round(billAmount * 0.12),
      otherCharges: Math.round(billAmount * 0.035),
      electricityDuty: Math.round(billAmount * 0.08),
      arrears: 0,
      netPayableAmount: billAmount,
      isConfirmed: true,
      createdAt: new Date().toISOString(),
      calculations: {
        perUnitRate: perUnitRate,
        totalFlatUnits: totalFlatUnits,
        commonUnits: commonUnits,
        activeFlatsCount: activeFlatsCount,
        commonUnitsPerFlat: commonUnitsPerFlat,
        commonAmountPerFlat: Math.round(commonUnitsPerFlat * perUnitRate),
        totalDistributedAmount: totalDistributedAmount,
        roundingAdjustment: null,
      },
      flatEntries: calcFlats,
    };
  };

  // Download All PDF Flatwise (Combined Master PDF)
  const handleDownloadAllPdf = () => {
    const billObj = buildMonthlyBillObject();
    generateAllFlatsCombinedPdf(building, billObj);
  };

  // Download Single Flat PDF
  const handleDownloadSinglePdf = (flatId: string) => {
    const billObj = buildMonthlyBillObject();
    const entry = billObj.flatEntries.find((e) => e.flatId === flatId);
    if (entry) {
      generateIndividualFlatPdf(building, billObj, entry);
    }
  };

  // WhatsApp Share Single Flat
  const handleWhatsAppShare = (f: typeof flatCalculations[0]) => {
    const text = `⚡ *AVVNL SUB-METER ELECTRICITY BILL*\n` +
      `═════════════════════════════════\n` +
      `👤 *उपभोक्ता:* ${consumerName}\n` +
      `🔢 *K-Number:* ${activeKNumber}\n` +
      `📅 *बिल माह:* ${billingMonth}\n` +
      `🏠 *फ्लैट / किरायेदार:* ${f.name}\n` +
      `═════════════════════════════════\n` +
      `📊 सब-मीटर खपत: *${f.units} यूनिट*\n` +
      `⚡ बिजली दर: *₹${perUnitRate.toFixed(2)} / यूनिट*\n` +
      `🏢 सामान्य एरिया शेयर: *${f.commonUnitsShare} यूनिट* (₹${f.commonAmountShare})\n` +
      `═════════════════════════════════\n` +
      `💰 *कुल देय राशि:* *₹${f.finalAmount.toLocaleString('en-IN')}*\n` +
      `📅 अंतिम तिथि (Due Date): ${dueDate}\n` +
      `═════════════════════════════════\n` +
      `✅ AVVNL अजमेर डिस्कॉम प्रमाणित गणना।`;

    const encoded = encodeURIComponent(text);
    const phoneClean = (f.mobile || '').replace(/[^0-9]/g, '');
    const url = phoneClean ? `https://wa.me/91${phoneClean}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Save to Archive / History
  const handleSaveToHistory = () => {
    const billObj = buildMonthlyBillObject();
    onSaveBill(billObj);
    alert(
      language === 'hi'
        ? '✅ बिल सफलतापूर्वक इतिहास (History Archive) में सुरक्षित कर दिया गया है!'
        : '✅ Bill saved successfully to History Archive!'
    );
  };

  return (
    <div className="space-y-5 pb-24 max-w-4xl mx-auto font-sans">
      {/* ============================================================== */}
      {/* 1 & 2: ENTER K-NO & ADD K-NO BAR */}
      {/* ============================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Zap className="w-5 h-5 fill-amber-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>AVVNL Bijli Mitra Portal</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  LIVE API
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                1. Enter K-No &bull; 2. Add K-No &bull; 3. Auto/Manual Fetch &bull; 4. Sub-Meter Units &bull; 5. Main Units &bull; 6. Auto Calculate
              </p>
            </div>
          </div>

          {/* Quick Saved K-Number Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {savedKNumbers.map((k) => (
              <div
                key={k}
                onClick={() => handleSelectKNumber(k)}
                className={`group flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-mono font-bold cursor-pointer transition border ${
                  activeKNumber === k
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <span>{k}</span>
                {savedKNumbers.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteKNumber(k);
                    }}
                    className="p-0.5 hover:text-red-600 rounded"
                    title="Remove K-No"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enter K-Number & Add Form */}
        <form onSubmit={handleAddKNumber} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">
              K-NO:
            </span>
            <input
              type="text"
              value={kNumberInput}
              onChange={(e) => setKNumberInput(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="1. Enter 12-Digit AVVNL K-No (e.g. 130523024253)"
              maxLength={15}
              className="w-full pl-16 pr-4 py-2.5 bg-slate-950 border-2 border-slate-700 focus:border-amber-400 rounded-xl text-white font-mono text-sm font-bold outline-none transition tracking-wider"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>2. Add K-No</span>
          </button>
        </form>

        {/* ============================================================== */}
        {/* 3: AUTO OR MANUAL FETCH ACTION BOX */}
        {/* ============================================================== */}
        <div className="bg-slate-950/80 rounded-xl p-3.5 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">
                Active Selected K-Number:
              </span>
              <span className="text-base font-black text-amber-300 font-mono tracking-wider">
                {activeKNumber}
              </span>
              <span className="text-xs text-slate-400 ml-2">
                ({consumerName} &bull; {billingMonth})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => triggerAutoFetch(activeKNumber)}
                disabled={isFetching}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                <span>{isFetching ? 'Fetching from AVVNL...' : '3. ⚡ Auto Fetch Bill'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManualEditOpen(!isManualEditOpen)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isManualEditOpen ? 'Hide Manual Edit' : '✏️ Manual Enter / Edit'}</span>
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {fetchError && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300">
              {fetchError}
            </div>
          )}
          {fetchSuccessMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center justify-between">
              <span>{fetchSuccessMsg}</span>
              <span className="text-[10px] text-emerald-400 font-bold ml-2">VERIFIED</span>
            </div>
          )}

          {/* 3B: MANUAL EDIT FORM ACCORDION */}
          {isManualEditOpen && (
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs animate-in fade-in">
              <div>
                <label className="text-slate-400 font-medium block mb-1">Consumer Name</label>
                <input
                  type="text"
                  value={consumerName}
                  onChange={(e) => setConsumerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Total Bill Amount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={billAmount}
                  onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-300 font-mono font-bold outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Billing Month</label>
                <input
                  type="text"
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-bold outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 font-medium block mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* 5: MAIN METERS UNITS ENTER (AUTO OR MANUAL) */}
      {/* ============================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-black text-white">
                5. Main Meter Units (मुख्य मीटर की कुल यूनिट)
              </h2>
              <p className="text-xs text-slate-400">
                Auto-populated from AVVNL bill, or enter manually to calculate rate per unit.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="number"
                min={0}
                value={mainUnits === 0 && effectiveMainUnits > 0 ? '' : mainUnits}
                placeholder={String(totalFlatUnits || 500)}
                onChange={(e) => setMainUnits(parseFloat(e.target.value) || 0)}
                className="w-36 bg-slate-950 border-2 border-cyan-500/50 focus:border-cyan-400 rounded-xl px-3 py-2 text-cyan-300 font-mono font-black text-lg text-right outline-none"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                kWh
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Auto Rate</span>
              <span className="text-sm font-black text-emerald-400 font-mono">
                ₹{perUnitRate.toFixed(2)}/unit
              </span>
            </div>
          </div>
        </div>

        {/* Quick calculation hint */}
        <div className="text-[11px] text-slate-400 flex flex-wrap items-center gap-4 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
          <span>⚡ Billed Amount: <strong className="text-amber-300 font-mono">{formatCurrency(billAmount)}</strong></span>
          <span>⚡ Main Meter Units: <strong className="text-cyan-300 font-mono">{formatUnits(effectiveMainUnits)} Units</strong></span>
          <span>⚡ Per Unit Rate: <strong className="text-emerald-300 font-mono">₹{perUnitRate.toFixed(2)}/unit</strong> (Amount ÷ Units)</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4 & 6: ENTER SUB METER UNITS & EDIT BILL RS FLATWISE */}
      {/* ============================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                4. Enter Sub-Meter Units &bull; 6. Edit Bill (₹) Flatwise
              </h2>
              <p className="text-xs text-slate-400">
                Enter each flat's consumed units. The system auto-calculates own + common share. You can also manually edit the final ₹ bill.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddFlat}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow transition cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add Flat</span>
            </button>

            {/* Quick preset buttons */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
              <span className="text-[10px] text-slate-400 px-1">Presets:</span>
              <button
                type="button"
                onClick={() => handlePresetFlats(4)}
                className="px-2 py-0.5 rounded text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-700"
              >
                4 Flats
              </button>
              <button
                type="button"
                onClick={() => handlePresetFlats(6)}
                className="px-2 py-0.5 rounded text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-700"
              >
                6 Flats
              </button>
              <button
                type="button"
                onClick={() => handlePresetFlats(8)}
                className="px-2 py-0.5 rounded text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-700"
              >
                8 Flats
              </button>
            </div>
          </div>
        </div>

        {/* Flats Sub-Meter Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                <th className="py-2.5 px-3 rounded-l-xl">Flat / Sub-Meter</th>
                <th className="py-2.5 px-3">Units Consumed (खपत)</th>
                <th className="py-2.5 px-3 text-right">Own Amt (₹)</th>
                <th className="py-2.5 px-3 text-right">Common Share (₹)</th>
                <th className="py-2.5 px-3 text-center">Edit Bill Rs Flatwise (अंतिम राशि ₹)</th>
                <th className="py-2.5 px-3 text-center rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {flatCalculations.map((flat) => (
                <tr key={flat.id} className="hover:bg-slate-800/40 transition">
                  {/* Flat Name */}
                  <td className="py-3 px-3">
                    <input
                      type="text"
                      value={flat.name}
                      onChange={(e) => handleUpdateFlatName(flat.id, e.target.value)}
                      className="bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs font-bold text-white w-28 outline-none"
                    />
                  </td>

                  {/* 4. Units Consumed */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        value={flat.units === 0 ? '' : flat.units}
                        placeholder="0"
                        onChange={(e) => handleUpdateFlatUnits(flat.id, e.target.value)}
                        className="w-24 px-2.5 py-1.5 bg-slate-950 border-2 border-slate-700 focus:border-cyan-400 rounded-lg text-cyan-300 font-mono font-bold text-sm outline-none text-right"
                      />
                      <span className="text-slate-400 text-xs">units</span>
                    </div>
                  </td>

                  {/* Own Amount */}
                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-300">
                    ₹{flat.ownAmount.toLocaleString('en-IN')}
                    <span className="text-[10px] text-slate-500 block">
                      ({flat.units} × ₹{perUnitRate.toFixed(2)})
                    </span>
                  </td>

                  {/* Common Area Share */}
                  <td className="py-3 px-3 text-right font-mono font-semibold text-violet-300">
                    ₹{flat.commonAmountShare.toLocaleString('en-IN')}
                    <span className="text-[10px] text-slate-500 block">
                      ({flat.commonUnitsShare} u/flat)
                    </span>
                  </td>

                  {/* 6. Edit Bill Rs Flatwise */}
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-400">₹</span>
                      <input
                        type="number"
                        value={flat.finalAmount}
                        onChange={(e) => handleUpdateFlatPayable(flat.id, e.target.value)}
                        className={`w-28 px-2.5 py-1.5 rounded-lg font-mono font-black text-sm text-right outline-none transition border-2 ${
                          flat.isManuallyAdjusted
                            ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                            : 'bg-slate-950 border-emerald-500/50 focus:border-emerald-400 text-emerald-300'
                        }`}
                      />
                      {flat.isManuallyAdjusted && (
                        <button
                          type="button"
                          onClick={() => handleResetFlatCorrection(flat.id)}
                          className="p-1 text-slate-400 hover:text-amber-400 rounded"
                          title="Reset to auto-calculated"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {flat.isManuallyAdjusted && (
                      <span className="text-[10px] text-amber-400 block text-center mt-0.5">
                        Manual Override (सुधार किया गया)
                      </span>
                    )}
                  </td>

                  {/* Actions: WhatsApp / PDF / Delete */}
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleWhatsAppShare(flat)}
                        className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadSinglePdf(flat.id)}
                        className="p-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 transition"
                        title="Download Flat Slip PDF"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteFlat(flat.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/15 transition"
                        title="Delete Flat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 7: GENERATE SUMMARY & DOWNLOAD ALL PDF FLATWISE */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border-2 border-cyan-500/40 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
              Calculation Summary & Reconciliation
            </span>
            <h3 className="text-lg font-black text-white">
              7. कुल बिल सारांश व एक साथ सभी PDF डाउनलोड
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadAllPdf}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              <FileDown className="w-4 h-4" />
              <span>Download All PDF Flatwise (सभी फ्लैट्स की PDF)</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToHistory}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Save to History</span>
            </button>
          </div>
        </div>

        {/* 4-Box Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">AVVNL Main Bill</span>
            <span className="text-lg font-black text-amber-400 font-mono">
              {formatCurrency(billAmount)}
            </span>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Main Units / Rate</span>
            <span className="text-lg font-black text-cyan-300 font-mono">
              {formatUnits(effectiveMainUnits)} u &bull; ₹{perUnitRate.toFixed(2)}
            </span>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Sub-Meters + Common</span>
            <span className="text-lg font-black text-violet-300 font-mono">
              {formatUnits(totalFlatUnits)} + {formatUnits(commonUnits)} u
            </span>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-slate-400 block text-[11px]">Total Distributed (वितरित)</span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {formatCurrency(totalDistributedAmount)}
            </span>
          </div>
        </div>

        {/* Reconciliation Status */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80 text-slate-400">
          <div className="flex items-center gap-1.5">
            {totalDistributedAmount === billAmount ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> कुल वितरित राशि मुख्य AVVNL बिल से 100% मेल खाती है।
              </span>
            ) : (
              <span className="text-amber-400 font-medium">
                वितरित राशि: {formatCurrency(totalDistributedAmount)} | मुख्य बिल: {formatCurrency(billAmount)} (अंतर: {formatCurrency(Math.abs(billAmount - totalDistributedAmount))})
              </span>
            )}
          </div>

          {onViewHistory && (
            <button
              onClick={onViewHistory}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
            >
              View Saved History &rarr;
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
