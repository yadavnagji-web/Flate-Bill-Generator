import React, { useState, useEffect } from 'react';
import { Building, Flat, MonthlyBill, Language, OCRBillData } from '../types';
import { getTranslation } from '../utils/translations';
import {
  calculateMonthlyDistribution,
  CalculationInputFlat,
  formatCurrency,
  formatUnits,
  formatBillingMonth,
  formatBillingMonthHindi,
  MONTH_NAMES,
  MONTH_NAMES_HI,
} from '../utils/calculator';
import { getSavedKNumber, saveKNumber, USER_DEFAULT_K_NUMBER } from '../utils/storage';
import { BillDeskAutoFetchModal } from './BillDeskAutoFetchModal';
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  FileCheck,
  Zap,
  Users,
  Eye,
  Check,
  FileText,
  Upload,
} from 'lucide-react';

interface BillEntryWizardProps {
  building: Building;
  flats: Flat[];
  previousBill: MonthlyBill | null;
  initialOcrData?: OCRBillData | null;
  initialBillPhoto?: string | null;
  language: Language;
  onOpenScanner: () => void;
  onSaveBill: (bill: MonthlyBill) => void;
  onCancel: () => void;
}

export const BillEntryWizard: React.FC<BillEntryWizardProps> = ({
  building,
  flats,
  previousBill,
  initialOcrData,
  initialBillPhoto,
  language,
  onOpenScanner,
  onSaveBill,
  onCancel,
}) => {
  const t = getTranslation(language);

  // Wizard Steps: 1: Main Bill, 2: Flat Readings, 3: Calculation Summary, 4: Final Table
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Auto-Fetch Modal
  const [isAutoFetchOpen, setIsAutoFetchOpen] = useState<boolean>(false);

  // Step 1: Main Bill fields
  const [discomName, setDiscomName] = useState<string>(
    initialOcrData?.discomName || 'AVVNL'
  );
  const [billingMonth, setBillingMonth] = useState<string>(
    formatBillingMonth(initialOcrData?.billingMonth || 'September 2026')
  );
  const [billDate, setBillDate] = useState<string>(
    initialOcrData?.billDate || new Date().toISOString().slice(0, 10)
  );
  const [dueDate, setDueDate] = useState<string>(
    initialOcrData?.dueDate || '2026-09-25'
  );
  const [kNumber, setKNumber] = useState<string>(
    initialOcrData?.kNumber || getSavedKNumber() || USER_DEFAULT_K_NUMBER
  );
  const [consumerName, setConsumerName] = useState<string>(
    initialOcrData?.consumerName || building.ownerName
  );
  const [billNumber, setBillNumber] = useState<string>(
    initialOcrData?.billNumber || ''
  );
  const [totalAvvnlBillAmount, setTotalAvvnlBillAmount] = useState<number>(
    initialOcrData?.totalBillAmount ?? 0
  );
  const [totalAvvnlBilledUnits, setTotalAvvnlBilledUnits] = useState<number>(
    initialOcrData?.totalUnits ?? 0
  );

  // Active flats only!
  const activeFlats = flats.filter((f) => f.isActive);

  // Step 2: Global reading mode toggle
  const [globalEntryMode, setGlobalEntryMode] = useState<'reading' | 'used_units'>('reading');

  // Flat unit entries state
  const [flatInputs, setFlatInputs] = useState<CalculationInputFlat[]>([]);

  // Update form if initialOcrData changes
  useEffect(() => {
    if (initialOcrData) {
      if (initialOcrData.discomName !== undefined) setDiscomName(initialOcrData.discomName);
      if (initialOcrData.billingMonth) setBillingMonth(formatBillingMonth(initialOcrData.billingMonth));
      if (initialOcrData.billDate) setBillDate(initialOcrData.billDate);
      if (initialOcrData.dueDate) setDueDate(initialOcrData.dueDate);
      if (initialOcrData.kNumber) setKNumber(initialOcrData.kNumber);
      if (initialOcrData.consumerName) setConsumerName(initialOcrData.consumerName);
      if (initialOcrData.billNumber) setBillNumber(initialOcrData.billNumber);
      if (typeof initialOcrData.totalBillAmount === 'number')
        setTotalAvvnlBillAmount(initialOcrData.totalBillAmount);
      if (typeof initialOcrData.totalUnits === 'number')
        setTotalAvvnlBilledUnits(initialOcrData.totalUnits);
    }
  }, [initialOcrData]);

  // Synchronize month when bill date changes
  const handleBillDateChange = (dateVal: string) => {
    setBillDate(dateVal);
    if (dateVal) {
      const parts = dateVal.split('-');
      if (parts.length === 3) {
        const mIdx = parseInt(parts[1], 10) - 1;
        const yr = parts[0];
        if (mIdx >= 0 && mIdx < 12) {
          setBillingMonth(`${MONTH_NAMES[mIdx]} ${yr}`);
        }
      }
    }
  };

  // Initialize flat readings: Bring previous month's Current Reading automatically
  useEffect(() => {
    const initialized: CalculationInputFlat[] = activeFlats.map((flat) => {
      // Find matching flat in previous bill if available
      const prevEntry = previousBill?.flatEntries.find((e) => e.flatId === flat.id);

      // Automatic previous reading: previous month's Current Reading or flat's current reading
      const prevReading =
        prevEntry && typeof prevEntry.currentReading === 'number'
          ? prevEntry.currentReading
          : flat.currentReading || flat.previousReading || 0;

      // Current reading
      const currReading = flat.currentReading > prevReading ? flat.currentReading : prevReading;

      return {
        flatId: flat.id,
        flatNumber: flat.flatNumber,
        tenantName: flat.tenantName,
        tenantMobile: flat.tenantMobile,
        subMeterNumber: flat.subMeterNumber,
        entryMode: globalEntryMode,
        previousReading: prevReading,
        currentReading: currReading,
        usedUnits: Math.max(0, currReading - prevReading),
      };
    });

    setFlatInputs(initialized);
  }, [activeFlats.length, previousBill?.id]);

  // Handle flat input change
  const handleFlatInputChange = (
    index: number,
    field: keyof CalculationInputFlat,
    val: any
  ) => {
    setFlatInputs((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };

      // Auto compute usedUnits if in reading mode
      if (item.entryMode === 'reading') {
        const prevR = Number(item.previousReading) || 0;
        const currR = Number(item.currentReading) || 0;
        item.usedUnits = Math.max(0, currR - prevR);
      }

      updated[index] = item;
      return updated;
    });
  };

  // Toggle mode for all flats
  const handleToggleGlobalMode = () => {
    const nextMode = globalEntryMode === 'reading' ? 'used_units' : 'reading';
    setGlobalEntryMode(nextMode);
    setFlatInputs((prev) =>
      prev.map((f) => ({
        ...f,
        entryMode: nextMode,
      }))
    );
  };

  // Run validation & calculations
  const calcResult = calculateMonthlyDistribution(
    totalAvvnlBillAmount,
    totalAvvnlBilledUnits,
    flatInputs
  );

  const { isValid, errorMessage, calculations, flatEntries } = calcResult;

  // Final confirmation and save
  const handleConfirmAndSaveFinal = () => {
    if (!isValid) return;

    const newBill: MonthlyBill = {
      id: `bill_${building.id}_${Date.now()}`,
      buildingId: building.id,
      billingMonth: formatBillingMonth(billingMonth),
      billDate,
      dueDate,
      kNumber,
      consumerName,
      billNumber,
      discomName: discomName.trim(),
      totalAvvnlBillAmount,
      totalAvvnlBilledUnits,
      billPhotoUrl: initialBillPhoto || undefined,
      isConfirmed: true,
      createdAt: new Date().toISOString(),
      calculations,
      flatEntries,
      energyCharges: initialOcrData?.energyCharges,
      fixedCharges: initialOcrData?.fixedCharges,
      otherCharges: initialOcrData?.otherCharges,
      electricityDuty: initialOcrData?.electricityDuty,
      arrears: initialOcrData?.arrears,
      netPayableAmount: initialOcrData?.netPayableAmount || totalAvvnlBillAmount,
    };

    onSaveBill(newBill);
    setStep(4);
  };

  return (
    <div className="space-y-5 pb-24 max-w-4xl mx-auto">
      {/* Wizard Progress Stepper */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center justify-between text-xs font-semibold">
          {[
            { s: 1, label: t.stepAvvnl },
            { s: 2, label: t.stepReadings },
            { s: 3, label: t.stepSummary },
            { s: 4, label: t.stepFinal },
          ].map((item, idx) => (
            <React.Fragment key={item.s}>
              <div
                onClick={() => {
                  if (item.s < step || (item.s === 3 && isValid)) setStep(item.s as any);
                }}
                className={`flex items-center gap-1.5 cursor-pointer transition ${
                  step === item.s
                    ? 'text-cyan-400 font-bold'
                    : step > item.s
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    step === item.s
                      ? 'bg-cyan-500 text-slate-950'
                      : step > item.s
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {step > item.s ? '✓' : item.s}
                </div>
                <span className="hidden sm:inline">{item.label}</span>
              </div>
              {idx < 3 && <div className="flex-1 h-0.5 mx-2 bg-slate-800"></div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Validation Error Banner (Critical Business Rule) */}
      {!isValid && errorMessage && (
        <div className="p-4 rounded-xl bg-red-500/15 border-2 border-red-500 text-red-200 text-xs sm:text-sm font-semibold flex items-start gap-2.5 shadow-md animate-pulse">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-red-300">Validation Error:</div>
            <div>{errorMessage}</div>
            <div className="text-xs text-red-400 font-hindi">
              (फ्लैट की कुल यूनिट मुख्य बिजली बिल यूनिट से अधिक नहीं हो सकती)
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 1: MAIN BILL ENTRY ================= */}
      {step === 1 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>
                  1. {discomName ? `${discomName} ` : ''}Bill Information (मुख्य बिजली बिल)
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload electricity bill (PDF / JPEG) with AI OCR or enter values manually.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAutoFetchOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs shadow-md transition transform active:scale-95"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Auto Fetch (AVVNL BijliMitra)</span>
              </button>

              <button
                type="button"
                onClick={onOpenScanner}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-bold text-xs shadow transition"
              >
                <Upload className="w-4 h-4" />
                <span>{t.scanBill}</span>
              </button>
            </div>
          </div>

          {/* Quick Auto-Fetch Feature Banner */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-850 to-slate-900 border border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-5 h-5 fill-amber-400" />
              </div>
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>Consumer K-Number: <span className="font-mono text-amber-300 font-extrabold">{kNumber || '130523024253'}</span></span>
                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                    AVVNL
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  {language === 'hi'
                    ? 'बिजली मित्र पोर्टल द्वारा बिजली बिल, उपभोक्ता नाम एवं यूनिट्स स्वतः प्राप्त करें'
                    : 'Instant BijliMitra sync for consumer name, bill amount & units'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAutoFetchOpen(true)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 shrink-0"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950" />
              <span>{language === 'hi' ? 'बिल प्राप्त करें (Fetch)' : 'Fetch from BijliMitra'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Electricity Board / Discom (Optional / Dynamic) */}
            <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Electricity Board / Discom (बिजली कंपनी / बोर्ड)
              </label>
              <input
                type="text"
                value={discomName}
                onChange={(e) => setDiscomName(e.target.value)}
                placeholder="उदा. AVVNL, JVVNL, JDVVNL, BSES, Tata Power (या खाली छोड़ें)"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                बिल के फोटो पर जो उपलब्ध हो वही लिखें, अन्यथा इसे खाली छोड़ दें।
              </span>
            </div>

            {/* Total Bill Amount - Core */}
            <div className="p-3.5 rounded-xl bg-slate-850 border-2 border-amber-500/50">
              <label className="block text-xs font-bold text-amber-300 mb-1">
                * Total {discomName ? `${discomName} ` : ''}Bill Amount (₹) (कुल बिल राशि)
              </label>
              <input
                type="number"
                value={totalAvvnlBillAmount}
                onChange={(e) => setTotalAvvnlBillAmount(parseFloat(e.target.value) || 0)}
                placeholder="10000"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xl font-black text-amber-400 outline-none focus:border-amber-400 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Total amount payable on the main electricity bill
              </span>
            </div>

            {/* Total Units - Core */}
            <div className="p-3.5 rounded-xl bg-slate-850 border-2 border-cyan-500/50">
              <label className="block text-xs font-bold text-cyan-300 mb-1">
                * Total {discomName ? `${discomName} ` : ''}Billed Units (कुल यूनिट)
              </label>
              <input
                type="number"
                value={totalAvvnlBilledUnits}
                onChange={(e) => setTotalAvvnlBilledUnits(parseFloat(e.target.value) || 0)}
                placeholder="1000"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xl font-black text-cyan-400 outline-none focus:border-cyan-400 font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Total units consumed on the main meter
              </span>
            </div>

            {/* Billing Month */}
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/80">
              <label className="block text-xs text-slate-400 font-medium mb-1">
                Billing Month (बिल माह व वर्ष)
              </label>
              <input
                type="text"
                value={billingMonth}
                onChange={(e) => setBillingMonth(e.target.value)}
                onBlur={() => setBillingMonth(formatBillingMonth(billingMonth))}
                placeholder="e.g. September 2026"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-cyan-400 font-semibold"
              />
              <span className="text-[11px] text-cyan-400 mt-1 block font-medium">
                {formatBillingMonth(billingMonth)} ({formatBillingMonthHindi(billingMonth)})
              </span>
            </div>

            {/* K Number */}
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/80">
              <label className="block text-xs text-slate-400 font-medium mb-1">
                {discomName ? `${discomName} ` : ''}K-Number (के नंबर)
              </label>
              <input
                type="text"
                value={kNumber}
                onChange={(e) => setKNumber(e.target.value)}
                placeholder="2101/0458/9123"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-cyan-400"
              />
            </div>

            {/* Bill Date */}
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/80">
              <label className="block text-xs text-slate-400 font-medium mb-1">
                Bill Date (बिल दिनांक)
              </label>
              <input
                type="date"
                value={billDate}
                onChange={(e) => handleBillDateChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-cyan-400"
              />
            </div>

            {/* Due Date */}
            <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/80">
              <label className="block text-xs text-slate-400 font-medium mb-1">
                Due Date (अंतिम तिथि)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-sm text-slate-200 outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              {t.cancel}
            </button>

            <button
              type="button"
              onClick={() => {
                if (totalAvvnlBillAmount <= 0 || totalAvvnlBilledUnits <= 0) {
                  alert(t.errInvalidBill);
                  return;
                }
                setStep(2);
              }}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              <span>Next: Flat Meter Readings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 2: FLAT-WISE UNIT ENTRY ================= */}
      {step === 2 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <span>2. Flat-Wise Meter Readings ({activeFlats.length} Active Flats)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Previous readings were automatically brought forward from last month.
              </p>
            </div>

            {/* Toggle: Enter Reading vs Enter Used Units */}
            <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
              <span
                className={`text-xs font-medium cursor-pointer ${
                  globalEntryMode === 'reading' ? 'text-cyan-400 font-bold' : 'text-slate-400'
                }`}
                onClick={() => setGlobalEntryMode('reading')}
              >
                {t.modeReading}
              </span>
              <button
                type="button"
                onClick={handleToggleGlobalMode}
                className="text-cyan-400"
              >
                {globalEntryMode === 'reading' ? (
                  <ToggleLeft className="w-6 h-6" />
                ) : (
                  <ToggleRight className="w-6 h-6 text-emerald-400" />
                )}
              </button>
              <span
                className={`text-xs font-medium cursor-pointer ${
                  globalEntryMode === 'used_units' ? 'text-emerald-400 font-bold' : 'text-slate-400'
                }`}
                onClick={() => setGlobalEntryMode('used_units')}
              >
                {t.modeUsedUnits}
              </span>
            </div>
          </div>

          {/* Quick Realtime Unit Ticker */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-850 border border-slate-700/80 text-xs">
            <div className="text-slate-300">
              AVVNL Main Units: <strong>{formatUnits(totalAvvnlBilledUnits)}</strong>
            </div>
            <div className="text-slate-300">
              Total Flat Units: <strong>{formatUnits(calculations.totalFlatUnits)}</strong>
            </div>
            <div
              className={`font-bold ${
                calculations.totalFlatUnits > totalAvvnlBilledUnits
                  ? 'text-red-400'
                  : 'text-violet-400'
              }`}
            >
              Common Units Remaining:{' '}
              {formatUnits(Math.max(0, totalAvvnlBilledUnits - calculations.totalFlatUnits))}
            </div>
          </div>

          {/* Flat Readings Table / Card List */}
          <div className="space-y-2.5">
            {flatInputs.map((flat, idx) => (
              <div
                key={flat.flatId}
                className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* Flat details */}
                <div className="min-w-[130px]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white bg-slate-700 px-2 py-0.5 rounded">
                      Flat {flat.flatNumber}
                    </span>
                    <span className="text-xs text-slate-300 truncate max-w-[140px]">
                      {flat.tenantName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Sub-meter: {flat.subMeterNumber}
                  </div>
                </div>

                {/* Entry Fields */}
                <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                  {globalEntryMode === 'reading' ? (
                    <>
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-0.5">
                          Previous
                        </label>
                        <input
                          type="number"
                          value={flat.previousReading}
                          onChange={(e) =>
                            handleFlatInputChange(
                              idx,
                              'previousReading',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-cyan-300 font-medium mb-0.5">
                          Current
                        </label>
                        <input
                          type="number"
                          value={flat.currentReading}
                          onChange={(e) =>
                            handleFlatInputChange(
                              idx,
                              'currentReading',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-semibold outline-none focus:border-cyan-400"
                        />
                      </div>
                    </>
                  ) : null}

                  <div className={globalEntryMode === 'used_units' ? 'col-span-3 sm:col-span-1' : ''}>
                    <label className="block text-[11px] text-emerald-300 font-bold mb-0.5">
                      Used Units
                    </label>
                    <input
                      type="number"
                      readOnly={globalEntryMode === 'reading'}
                      value={flat.usedUnits}
                      onChange={(e) =>
                        handleFlatInputChange(
                          idx,
                          'usedUnits',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className={`w-full rounded px-2 py-1 text-sm font-bold ${
                        globalEntryMode === 'reading'
                          ? 'bg-slate-900/60 text-emerald-400 border border-slate-700 cursor-not-allowed'
                          : 'bg-slate-900 text-emerald-400 border border-emerald-500/60 focus:border-emerald-400 outline-none'
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              disabled={!isValid}
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-bold text-xs shadow-md transition"
            >
              <span>Review Calculation Summary</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 3: CALCULATION SUMMARY (Section 24) ================= */}
      {step === 3 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg space-y-5">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-cyan-400" />
              <span>3. Calculation Summary (गणना सारांश)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Please review all electricity distribution metrics before generating bills.
            </p>
          </div>

          {/* Metric Cards Grid matching Section 24 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/80">
              <span className="text-xs text-slate-400 block">
                Total {discomName ? `${discomName} ` : ''}Bill
              </span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {formatCurrency(totalAvvnlBillAmount)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/80">
              <span className="text-xs text-slate-400 block">
                Total {discomName ? `${discomName} ` : ''}Units
              </span>
              <span className="text-xl font-black text-cyan-400 font-mono">
                {formatUnits(totalAvvnlBilledUnits)} Units
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/80">
              <span className="text-xs text-slate-400 block">Total Flat Units</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {formatUnits(calculations.totalFlatUnits)} Units
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/80">
              <span className="text-xs text-slate-400 block">Common Units</span>
              <span className="text-xl font-black text-violet-400 font-mono">
                {formatUnits(calculations.commonUnits)} Units
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/80">
              <span className="text-xs text-slate-400 block">Per Unit Rate</span>
              <span className="text-xl font-black text-white font-mono">
                Rs. {calculations.perUnitRate.toFixed(2)} / Unit
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/80">
              <span className="text-xs text-slate-400 block">Common Share per Flat</span>
              <span className="text-xl font-black text-white font-mono">
                {formatCurrency(calculations.commonAmountPerFlat)}{' '}
                <span className="text-xs font-normal text-slate-400 font-sans">
                  ({formatUnits(calculations.commonUnitsPerFlat)} Units)
                </span>
              </span>
            </div>
          </div>

          {/* Rounding Adjustment Info if applicable (Section 9) */}
          {calculations.roundingAdjustment && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center justify-between">
              <div>
                <strong>{t.roundingAdjustmentNote}:</strong> Applied{' '}
                {calculations.roundingAdjustment.adjustmentAmount > 0 ? '+' : ''}
                {formatCurrency(calculations.roundingAdjustment.adjustmentAmount)} to Flat{' '}
                {calculations.roundingAdjustment.flatNumber} so total matches main bill exactly.
              </div>
              <span className="text-xs font-bold text-amber-400">Reconciled</span>
            </div>
          )}

          {/* Action buttons: Edit vs Confirm & Generate Bills */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <span>✏️ {t.edit}</span>
            </button>

            <button
              type="button"
              disabled={!isValid}
              onClick={handleConfirmAndSaveFinal}
              className="w-full sm:w-auto px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-sm shadow-xl flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>{t.confirmAndGenerate}</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= STEP 4: FINAL BILL CALCULATION TABLE (Section 10) ================= */}
      {step === 4 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-full mb-1">
                <Check className="w-3.5 h-3.5" /> Bills Successfully Finalized
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Final Bill Calculation Table ({formatBillingMonth(billingMonth)})
              </h3>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Total Distributed:</span>
              <div className="text-lg font-black text-emerald-400">
                {formatCurrency(calculations.totalDistributedAmount)}
              </div>
            </div>
          </div>

          {/* Table container */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-800 text-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Flat</th>
                  <th className="py-2.5 px-2">Own Units</th>
                  <th className="py-2.5 px-2">Common Units</th>
                  <th className="py-2.5 px-2">Total Units</th>
                  <th className="py-2.5 px-2">Own Amount</th>
                  <th className="py-2.5 px-2">Common Amount</th>
                  <th className="py-2.5 px-3 text-right">Final Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {flatEntries.map((row) => (
                  <tr key={row.flatId} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-white">
                      Flat {row.flatNumber}
                      <span className="block text-[10px] text-slate-400 font-normal">
                        {row.tenantName}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 font-mono">{formatUnits(row.usedUnits)}</td>
                    <td className="py-2.5 px-2 font-mono text-violet-300">
                      {formatUnits(row.commonUnitsShare)}
                    </td>
                    <td className="py-2.5 px-2 font-mono">
                      {formatUnits(row.usedUnits + row.commonUnitsShare)}
                    </td>
                    <td className="py-2.5 px-2 font-mono">{formatCurrency(row.ownAmount)}</td>
                    <td className="py-2.5 px-2 font-mono text-violet-300">
                      {formatCurrency(row.commonAmountShare)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(row.finalPayableAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-850 font-bold border-t-2 border-slate-700 text-slate-200">
                <tr>
                  <td className="py-3 px-3">TOTALS</td>
                  <td className="py-3 px-2 font-mono">{formatUnits(calculations.totalFlatUnits)}</td>
                  <td className="py-3 px-2 font-mono text-violet-300">
                    {formatUnits(calculations.commonUnits)}
                  </td>
                  <td className="py-3 px-2 font-mono">{formatUnits(totalAvvnlBilledUnits)}</td>
                  <td className="py-3 px-2 font-mono">
                    {formatCurrency(
                      flatEntries.reduce((s, r) => s + r.ownAmount, 0)
                    )}
                  </td>
                  <td className="py-3 px-2 font-mono text-violet-300">
                    {formatCurrency(
                      flatEntries.reduce((s, r) => s + r.commonAmountShare, 0)
                    )}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400 text-sm">
                    {formatCurrency(calculations.totalDistributedAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Bottom Summary Callout */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs text-slate-300 pt-2">
            <div>Total AVVNL Units: <strong>{formatUnits(totalAvvnlBilledUnits)}</strong></div>
            <div>Total Flat Units: <strong>{formatUnits(calculations.totalFlatUnits)}</strong></div>
            <div>Total Common Units: <strong>{formatUnits(calculations.commonUnits)}</strong></div>
            <div>Per Unit Rate: <strong>₹{calculations.perUnitRate.toFixed(2)}</strong></div>
            <div>Total AVVNL Bill: <strong>{formatCurrency(totalAvvnlBillAmount)}</strong></div>
            <div>Total Distributed: <strong>{formatCurrency(calculations.totalDistributedAmount)}</strong></div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition"
            >
              <span>View Statements & Share →</span>
            </button>
          </div>
        </div>
      )}

      {/* BillDesk Auto Fetch Modal */}
      <BillDeskAutoFetchModal
        isOpen={isAutoFetchOpen}
        onClose={() => setIsAutoFetchOpen(false)}
        language={language}
        onApplyBillData={(data) => {
          if (data.discomName) setDiscomName(data.discomName);
          if (data.kNumber) setKNumber(data.kNumber);
          if (typeof data.totalBillAmount === 'number') setTotalAvvnlBillAmount(data.totalBillAmount);
          if (typeof data.totalUnits === 'number') setTotalAvvnlBilledUnits(data.totalUnits);
          if (data.consumerName) setConsumerName(data.consumerName);
          if (data.billNumber) setBillNumber(data.billNumber);
          if (data.billingMonth) setBillingMonth(formatBillingMonth(data.billingMonth));
          if (data.billDate) setBillDate(data.billDate);
          if (data.dueDate) setDueDate(data.dueDate);
        }}
      />
    </div>
  );
};
