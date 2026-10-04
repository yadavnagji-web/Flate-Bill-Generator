import { FlatBillEntry, BillCalculationSummary, Building, MonthlyBill } from '../types';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MONTH_NAMES_HI: Record<string, string> = {
  January: 'जनवरी',
  February: 'फ़रवरी',
  March: 'मार्च',
  April: 'अप्रैल',
  May: 'मई',
  June: 'जून',
  July: 'जुलाई',
  August: 'अगस्त',
  September: 'सितंबर',
  October: 'अक्टूबर',
  November: 'नवंबर',
  December: 'दिसंबर',
};

/**
 * Parses any month input (e.g. "202609", "09/2026", "2026-09", "09", "sep 2026") into a clean
 * human-readable Month Name and Year (e.g. "September 2026")
 */
export function formatBillingMonth(input: string | undefined | null): string {
  if (!input || !input.trim()) {
    const now = new Date();
    return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  }
  const str = input.trim().replace(/^['"]|['"]$/g, '');

  // 1. Pure 6-digit numeric formats: "202609" (YYYYMM) or "092026" (MMYYYY)
  const yyyymmMatch = str.match(/^(19\d{2}|20\d{2})(0[1-9]|1[0-2])$/);
  if (yyyymmMatch) {
    const year = yyyymmMatch[1];
    const monthNum = parseInt(yyyymmMatch[2], 10);
    return `${MONTH_NAMES[monthNum - 1]} ${year}`;
  }

  const mmyyyyMatch = str.match(/^(0[1-9]|1[0-2])(19\d{2}|20\d{2})$/);
  if (mmyyyyMatch) {
    const monthNum = parseInt(mmyyyyMatch[1], 10);
    const year = mmyyyyMatch[2];
    return `${MONTH_NAMES[monthNum - 1]} ${year}`;
  }

  // 2. Pure 8-digit numeric dates: "20260915" (YYYYMMDD) or "15092026" (DDMMYYYY)
  const yyyymmddMatch = str.match(/^(19\d{2}|20\d{2})(0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])$/);
  if (yyyymmddMatch) {
    const year = yyyymmddMatch[1];
    const monthNum = parseInt(yyyymmddMatch[2], 10);
    return `${MONTH_NAMES[monthNum - 1]} ${year}`;
  }

  const ddmmyyyyMatch = str.match(/^(?:0[1-9]|[12]\d|3[01])(0[1-9]|1[0-2])(19\d{2}|20\d{2})$/);
  if (ddmmyyyyMatch) {
    const monthNum = parseInt(ddmmyyyyMatch[1], 10);
    const year = ddmmyyyyMatch[2];
    return `${MONTH_NAMES[monthNum - 1]} ${year}`;
  }

  // 3. If already like "September 2026", "Sep 2026", "सितंबर 2026"
  const monthYearRegex = /^([a-zA-Z\u0900-\u097F]+)[\s,-]+(\d{4}|\d{2})$/;
  const myMatch = str.match(monthYearRegex);
  if (myMatch) {
    const rawMonth = myMatch[1].toLowerCase();
    let rawYear = myMatch[2];
    if (rawYear.length === 2) {
      rawYear = `20${rawYear}`;
    }
    const foundIdx = MONTH_NAMES.findIndex(
      (m) => m.toLowerCase().startsWith(rawMonth.slice(0, 3))
    );
    if (foundIdx !== -1) {
      return `${MONTH_NAMES[foundIdx]} ${rawYear}`;
    }
    // Check Hindi month names
    for (const [en, hi] of Object.entries(MONTH_NAMES_HI)) {
      if (hi.includes(rawMonth) || rawMonth.includes(hi.slice(0, 3))) {
        return `${en} ${rawYear}`;
      }
    }
    return `${myMatch[1]} ${rawYear}`;
  }

  // 4. ISO or slash formats with year first: "2026-09", "2026/09", "2026.09", "2026-09-15"
  const isoMatch = str.match(/^(\d{4})[-/. ](0?[1-9]|1[0-2])(?:[-/. ](\d{1,2}))?$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthNum = parseInt(isoMatch[2], 10);
    if (monthNum >= 1 && monthNum <= 12) {
      return `${MONTH_NAMES[monthNum - 1]} ${year}`;
    }
  }

  // 5. Date with day first: "15/09/2026", "15-09-2026", "01.09.2026"
  const dmyMatch = str.match(/^(?:0?[1-9]|[12]\d|3[01])[-/. ](0?[1-9]|1[0-2])[-/. ](\d{4})$/);
  if (dmyMatch) {
    const monthNum = parseInt(dmyMatch[1], 10);
    const year = dmyMatch[2];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${MONTH_NAMES[monthNum - 1]} ${year}`;
    }
  }

  // 6. Month first with separator: "09/2026", "09-2026", "09.2026"
  const slashMatch = str.match(/^(0?[1-9]|1[0-2])[-/. ](\d{4})$/);
  if (slashMatch) {
    const monthNum = parseInt(slashMatch[1], 10);
    const year = slashMatch[2];
    if (monthNum >= 1 && monthNum <= 12) {
      return `${MONTH_NAMES[monthNum - 1]} ${year}`;
    }
  }

  // 7. Embedded 6-digit sequence: e.g. "Month 202609" or "Bill 202609"
  const embedded6Match = str.match(/\b(19\d{2}|20\d{2})(0[1-9]|1[0-2])\b/);
  if (embedded6Match) {
    const year = embedded6Match[1];
    const monthNum = parseInt(embedded6Match[2], 10);
    return `${MONTH_NAMES[monthNum - 1]} ${year}`;
  }

  // 8. If just a single number 1..12 e.g. "9" or "09"
  const singleNumMatch = str.match(/^0?([1-9]|1[0-2])$/);
  if (singleNumMatch) {
    const monthNum = parseInt(singleNumMatch[1], 10);
    const currentYear = new Date().getFullYear();
    return `${MONTH_NAMES[monthNum - 1]} ${currentYear}`;
  }

  return str;
}

export function formatBillingMonthHindi(input: string | undefined | null): string {
  const formatted = formatBillingMonth(input);
  const parts = formatted.split(' ');
  if (parts.length === 2 && MONTH_NAMES_HI[parts[0]]) {
    return `${MONTH_NAMES_HI[parts[0]]} ${parts[1]}`;
  }
  return formatted;
}

export function roundTo(num: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

export function formatCurrency(amount: number): string {
  const val = isNaN(amount) ? 0 : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

/**
 * Format amounts specifically for PDF generation to avoid the '¹' glitch
 * caused by jsPDF's built-in fonts not supporting the Unicode Rupee (₹) symbol.
 */
export function formatPdfAmount(amount: number, withPrefix = false): string {
  const val = isNaN(amount) ? 0 : amount;
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
  return withPrefix ? `Rs. ${formattedNumber}` : formattedNumber;
}

export function formatUnits(units: number): string {
  const val = isNaN(units) ? 0 : units;
  // If whole number, format without decimals, else up to 2 decimal places
  return Number.isInteger(val) ? val.toString() : val.toFixed(2);
}

export function generateWhatsAppMessage(
  flat: FlatBillEntry,
  bill: MonthlyBill,
  building: Building
): string {
  const billTitle = bill.discomName ? `${bill.discomName} Electricity Bill` : 'Electricity Bill';
  return `⚡ *${building.name}*
*Flat ${flat.flatNumber} - ${formatBillingMonth(bill.billingMonth)}*
(${billTitle})

Previous Reading: ${flat.previousReading}
Current Reading: ${flat.currentReading}
Used Units: ${formatUnits(flat.usedUnits)}

Own Amount: ${formatCurrency(flat.ownAmount)}
Common Share: ${formatCurrency(flat.commonAmountShare)} (${formatUnits(flat.commonUnitsShare)} Units)

*Total Payable: ${formatCurrency(flat.finalPayableAmount)}*

Due Date: ${bill.dueDate || 'Immediate'}
Please pay the above amount.
_Manager: ${building.ownerName} (${building.ownerMobile})_`;
}

/**
 * Generates a full building-wide bill summary message for WhatsApp sharing
 */
export function generateFullBillWhatsAppMessage(
  building: Building,
  bill: MonthlyBill
): string {
  const billTitle = bill.discomName ? `${bill.discomName} बिजली बिल` : 'बिजली बिल';
  let msg = `⚡ *${building.name} - मासिक ${billTitle} विवरण*\n`;
  msg += `📅 *महीना:* ${formatBillingMonth(bill.billingMonth)}\n`;
  if (bill.billDate) msg += `🗓️ बिल दिनांक: ${bill.billDate}\n`;
  if (bill.dueDate) msg += `⏳ अंतिम भुगतान तिथि: ${bill.dueDate}\n`;
  if (bill.kNumber) msg += `🔢 K-नंबर: ${bill.kNumber}\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  const mainBillLabel = bill.discomName ? `कुल ${bill.discomName} बिल` : 'कुल मुख्य बिजली बिल';
  msg += `💡 *${mainBillLabel}:* ${formatCurrency(bill.totalAvvnlBillAmount)}\n`;
  msg += `⚡ *कुल बिल यूनिट:* ${formatUnits(bill.totalAvvnlBilledUnits)} Units\n`;
  msg += `📊 *प्रति यूनिट दर:* ${formatCurrency(bill.calculations.perUnitRate)} / Unit\n`;
  msg += `🏢 *समान कॉमन शेयर:* ${formatUnits(bill.calculations.commonUnitsPerFlat)} Units (${formatCurrency(bill.calculations.commonAmountPerFlat)})\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `*फ्लैट-वार भुगतान सूची:*\n`;

  bill.flatEntries.forEach((f) => {
    msg += `\n🏠 *फ्लैट ${f.flatNumber} (${f.tenantName})*\n`;
    msg += `• खुद की यूनिट: ${formatUnits(f.usedUnits)} | कॉमन: ${formatUnits(f.commonUnitsShare)}\n`;
    msg += `• खुद का चार्ज: ${formatCurrency(f.ownAmount)} + कॉमन: ${formatCurrency(f.commonAmountShare)}\n`;
    msg += `👉 *देय राशि: ${formatCurrency(f.finalPayableAmount)}* [${f.paymentStatus === 'Paid' ? '✅ Paid' : '⏳ Pending'}]\n`;
  });

  msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `कृपया अंतिम तिथि से पहले भुगतान करें।\n`;
  msg += `प्रबंधक: ${building.ownerName} (${building.ownerMobile})`;

  return msg;
}

export interface CalculationInputFlat {
  flatId: string;
  flatNumber: string;
  tenantName: string;
  tenantMobile: string;
  subMeterNumber: string;
  entryMode: 'reading' | 'used_units';
  previousReading: number;
  currentReading: number;
  usedUnits: number;
  paymentStatus?: 'Pending' | 'Paid';
  paymentDate?: string;
  paymentMode?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';
  paymentNotes?: string;
}

export interface CalculationResult {
  isValid: boolean;
  errorMessage?: string;
  calculations: BillCalculationSummary;
  flatEntries: FlatBillEntry[];
}

export function calculateMonthlyDistribution(
  totalAvvnlBill: number,
  totalAvvnlUnits: number,
  activeFlats: CalculationInputFlat[]
): CalculationResult {
  // Edge-case checks
  if (totalAvvnlBill < 0 || isNaN(totalAvvnlBill)) {
    return {
      isValid: false,
      errorMessage: 'Please enter a valid Electricity Bill Amount.',
      calculations: createEmptyCalculations(),
      flatEntries: [],
    };
  }

  if (totalAvvnlUnits <= 0 || isNaN(totalAvvnlUnits)) {
    return {
      isValid: false,
      errorMessage: 'Total Main Billed Units must be greater than zero.',
      calculations: createEmptyCalculations(),
      flatEntries: [],
    };
  }

  const activeCount = activeFlats.length;
  if (activeCount === 0) {
    return {
      isValid: false,
      errorMessage: 'No active flats available to distribute bill.',
      calculations: createEmptyCalculations(),
      flatEntries: [],
    };
  }

  // 1. Calculate per-unit consumed units for each flat
  const computedFlats = activeFlats.map((flat) => {
    let units = 0;
    if (flat.entryMode === 'reading') {
      units = Math.max(0, (flat.currentReading || 0) - (flat.previousReading || 0));
    } else {
      units = Math.max(0, flat.usedUnits || 0);
    }
    return {
      ...flat,
      usedUnits: units,
    };
  });

  // 2. Sum of all flat-wise units
  const totalFlatUnits = computedFlats.reduce((sum, f) => sum + f.usedUnits, 0);

  // 3. Validation: Total Flat Units > Total Main Units is strictly forbidden
  if (totalFlatUnits > totalAvvnlUnits) {
    return {
      isValid: false,
      errorMessage:
        'Flat-wise units exceed the total main billed units. Please check the meter readings.',
      calculations: {
        activeFlatsCount: activeCount,
        totalFlatUnits,
        commonUnits: 0,
        perUnitRate: roundTo(totalAvvnlBill / totalAvvnlUnits, 4),
        commonUnitsPerFlat: 0,
        commonAmountPerFlat: 0,
        totalDistributedAmount: 0,
        roundingAdjustment: null,
      },
      flatEntries: [],
    };
  }

  // 4. Common units calculation (difference)
  const commonUnits = Math.max(0, totalAvvnlUnits - totalFlatUnits);

  // 5. Per-unit rate
  const perUnitRate = totalAvvnlBill / totalAvvnlUnits;

  // 6. Common units per active flat
  const commonUnitsPerFlat = activeCount > 0 ? commonUnits / activeCount : 0;
  const commonAmountPerFlat = commonUnitsPerFlat * perUnitRate;

  // 7. Calculate individual flat amounts
  let runningSum = 0;
  let flatEntries: FlatBillEntry[] = computedFlats.map((flat) => {
    const ownAmount = roundTo(flat.usedUnits * perUnitRate, 2);
    const commonAmountShare = roundTo(commonAmountPerFlat, 2);
    const finalPayable = roundTo(ownAmount + commonAmountShare, 2);

    runningSum += finalPayable;

    return {
      flatId: flat.flatId,
      flatNumber: flat.flatNumber,
      tenantName: flat.tenantName,
      tenantMobile: flat.tenantMobile,
      subMeterNumber: flat.subMeterNumber,
      entryMode: flat.entryMode,
      previousReading: flat.previousReading,
      currentReading: flat.currentReading,
      usedUnits: flat.usedUnits,
      ownAmount,
      commonUnitsShare: roundTo(commonUnitsPerFlat, 4),
      commonAmountShare,
      finalPayableAmount: finalPayable,
      roundingAdjustment: 0,
      paymentStatus: flat.paymentStatus || 'Pending',
      paymentDate: flat.paymentDate,
      paymentMode: flat.paymentMode,
      paymentNotes: flat.paymentNotes,
    };
  });

  // 8. Rounding Reconciliation:
  // Grand total of all flat payable amounts must equal totalAvvnlBill EXACTLY.
  runningSum = roundTo(runningSum, 2);
  const diff = roundTo(totalAvvnlBill - runningSum, 2);

  let roundingAdjustmentInfo: {
    flatId: string;
    flatNumber: string;
    adjustmentAmount: number;
  } | null = null;

  if (Math.abs(diff) >= 0.009 && flatEntries.length > 0) {
    // Pick the flat with highest consumption to apply the minor adjustment
    let targetIndex = 0;
    let maxUnits = -1;
    for (let i = 0; i < flatEntries.length; i++) {
      if (flatEntries[i].usedUnits > maxUnits) {
        maxUnits = flatEntries[i].usedUnits;
        targetIndex = i;
      }
    }

    const targetFlat = flatEntries[targetIndex];
    const newFinal = roundTo(targetFlat.finalPayableAmount + diff, 2);

    flatEntries[targetIndex] = {
      ...targetFlat,
      finalPayableAmount: newFinal,
      roundingAdjustment: diff,
    };

    roundingAdjustmentInfo = {
      flatId: targetFlat.flatId,
      flatNumber: targetFlat.flatNumber,
      adjustmentAmount: diff,
    };
  }

  const finalDistributedSum = roundTo(
    flatEntries.reduce((sum, f) => sum + f.finalPayableAmount, 0),
    2
  );

  return {
    isValid: true,
    calculations: {
      activeFlatsCount: activeCount,
      totalFlatUnits: roundTo(totalFlatUnits, 2),
      commonUnits: roundTo(commonUnits, 2),
      perUnitRate: roundTo(perUnitRate, 4),
      commonUnitsPerFlat: roundTo(commonUnitsPerFlat, 4),
      commonAmountPerFlat: roundTo(commonAmountPerFlat, 2),
      totalDistributedAmount: finalDistributedSum,
      roundingAdjustment: roundingAdjustmentInfo,
    },
    flatEntries,
  };
}

function createEmptyCalculations(): BillCalculationSummary {
  return {
    activeFlatsCount: 0,
    totalFlatUnits: 0,
    commonUnits: 0,
    perUnitRate: 0,
    commonUnitsPerFlat: 0,
    commonAmountPerFlat: 0,
    totalDistributedAmount: 0,
    roundingAdjustment: null,
  };
}
