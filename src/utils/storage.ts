import { AppState, Building, Flat, MonthlyBill } from '../types';
import { calculateMonthlyDistribution, formatBillingMonth } from './calculator';

const STORAGE_KEY = 'flat_bill_manager_app_data_v1';

export function getDefaultBuilding(): Building {
  return {
    id: 'bld_1',
    name: 'Nagji Yadav Premises',
    address: 'Jaipur, Rajasthan',
    ownerName: 'Nagji Yadav',
    ownerMobile: '',
    createdAt: new Date().toISOString(),
  };
}

export function generatePresetFlats(buildingId: string, count: number): Flat[] {
  const flats: Flat[] = [];
  for (let i = 1; i <= count; i++) {
    const flatNo = `Flat ${i}`;
    flats.push({
      id: `flat_${buildingId}_${i}`,
      buildingId,
      flatNumber: `${i}`,
      tenantName: flatNo,
      tenantMobile: '',
      subMeterNumber: `SM-${i}`,
      previousReading: 0,
      currentReading: 0,
      isActive: true,
    });
  }
  return flats;
}

export function createDemoState(): AppState {
  const building = getDefaultBuilding();

  const demoFlatsData = [
    { no: '1', name: 'Flat 1', mobile: '', prev: 100, curr: 220, used: 120 },
    { no: '2', name: 'Flat 2', mobile: '', prev: 200, curr: 350, used: 150 },
    { no: '3', name: 'Flat 3', mobile: '', prev: 150, curr: 260, used: 110 },
    { no: '4', name: 'Flat 4', mobile: '', prev: 300, curr: 420, used: 120 },
  ];

  const flats: Flat[] = demoFlatsData.map((d) => ({
    id: `flat_${building.id}_${d.no}`,
    buildingId: building.id,
    flatNumber: d.no,
    tenantName: d.name,
    tenantMobile: d.mobile,
    subMeterNumber: `SM-${d.no}`,
    previousReading: d.prev,
    currentReading: d.curr,
    isActive: true,
  }));

  const calcInput = flats.map((f, idx) => ({
    flatId: f.id,
    flatNumber: f.flatNumber,
    tenantName: f.tenantName,
    tenantMobile: f.tenantMobile,
    subMeterNumber: f.subMeterNumber,
    entryMode: 'reading' as const,
    previousReading: f.previousReading,
    currentReading: f.currentReading,
    usedUnits: demoFlatsData[idx].used,
    paymentStatus: 'Pending' as const,
  }));

  const calcResult = calculateMonthlyDistribution(5000, 500, calcInput);

  const demoBill: MonthlyBill = {
    id: `bill_${building.id}_2026_09`,
    buildingId: building.id,
    billingMonth: 'September 2026',
    billDate: '2026-09-10',
    dueDate: '2026-09-25',
    kNumber: '130523024253',
    consumerName: 'Nagji Yadav',
    billNumber: 'AVVNL-130523024253',
    totalAvvnlBillAmount: 5000,
    totalAvvnlBilledUnits: 500,
    energyCharges: 3825,
    fixedCharges: 600,
    otherCharges: 175,
    electricityDuty: 400,
    arrears: 0,
    netPayableAmount: 5000,
    isConfirmed: true,
    createdAt: new Date().toISOString(),
    calculations: calcResult.calculations,
    flatEntries: calcResult.flatEntries,
  };

  return {
    buildings: [building],
    activeBuildingId: building.id,
    flats,
    monthlyBills: [demoBill],
    selectedBillId: demoBill.id,
    language: 'en',
    isDemoMode: false,
  };
}

export function createEmptyInitialState(): AppState {
  const building = getDefaultBuilding();
  const defaultFlats = generatePresetFlats(building.id, 8);

  return {
    buildings: [building],
    activeBuildingId: building.id,
    flats: defaultFlats,
    monthlyBills: [],
    selectedBillId: null,
    language: 'en',
    isDemoMode: false,
  };
}

export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createEmptyInitialState();
    }
    const parsed = JSON.parse(raw);
    if (!parsed.buildings || parsed.buildings.length === 0) {
      return createEmptyInitialState();
    }
    if (parsed.monthlyBills && Array.isArray(parsed.monthlyBills)) {
      // Clean out legacy fake demo bills
      parsed.monthlyBills = parsed.monthlyBills
        .filter((b: MonthlyBill) => b.id !== 'bill_bld_1_2026_09' && !b.id.includes('demo'))
        .map((b: MonthlyBill) => ({
          ...b,
          billingMonth: formatBillingMonth(b.billingMonth),
        }));

      if (parsed.monthlyBills.length === 0) {
        parsed.selectedBillId = null;
      }
    } else {
      parsed.monthlyBills = [];
      parsed.selectedBillId = null;
    }

    // Clean out legacy fake flat readings
    if (parsed.flats && Array.isArray(parsed.flats)) {
      parsed.flats = parsed.flats.map((f: Flat) => {
        if (
          (f.previousReading === 100 && f.currentReading === 220) ||
          (f.previousReading === 200 && f.currentReading === 350) ||
          (f.previousReading === 150 && f.currentReading === 260) ||
          (f.previousReading === 300 && f.currentReading === 420)
        ) {
          return { ...f, previousReading: 0, currentReading: 0 };
        }
        return f;
      });
    }

    return parsed;
  } catch (err) {
    console.error('Error loading app state from localStorage:', err);
    return createEmptyInitialState();
  }
}

export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving app state to localStorage:', err);
  }
}

export function exportAllDataAsJSON(): void {
  const raw = localStorage.getItem(STORAGE_KEY);
  const data = raw ? JSON.parse(raw) : createEmptyInitialState();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('download', `flat_bill_manager_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export async function importDataFromJSON(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.buildings && Array.isArray(parsed.buildings)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (err) {
        console.error('Import parse error:', err);
        resolve(false);
      }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}

export function clearAllData(): AppState {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem('master_submeter_flats_v1');
  localStorage.removeItem('master_submeter_k_numbers_v1');
  localStorage.removeItem('master_submeter_selected_k_v1');
  localStorage.removeItem('master_submeter_known_names_v1');
  localStorage.removeItem(LIVE_BILL_DATA_KEY);
  localStorage.removeItem(CUSTOM_BILL_DETAILS_KEY);
  return createEmptyInitialState();
}

const K_NUMBER_KEY = 'avvnl_default_k_number';
export const USER_DEFAULT_K_NUMBER = '130523024253';

export function getSavedKNumber(): string {
  try {
    const saved = localStorage.getItem(K_NUMBER_KEY);
    return saved ? saved.trim() : USER_DEFAULT_K_NUMBER;
  } catch {
    return USER_DEFAULT_K_NUMBER;
  }
}

export function saveKNumber(kNumber: string): void {
  try {
    if (kNumber && kNumber.trim()) {
      localStorage.setItem(K_NUMBER_KEY, kNumber.trim());
    }
  } catch (err) {
    console.error('Error saving K-number to localStorage:', err);
  }
}

const LIVE_BILL_DATA_KEY = 'avvnl_cached_live_bill_data';

export function getSavedLiveBill(): any | null {
  try {
    const raw = localStorage.getItem(LIVE_BILL_DATA_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveLiveBill(data: any | null): void {
  try {
    if (data) {
      localStorage.setItem(LIVE_BILL_DATA_KEY, JSON.stringify(data));
    } else {
      localStorage.removeItem(LIVE_BILL_DATA_KEY);
    }
  } catch (err) {
    console.error('Error saving live bill data to localStorage:', err);
  }
}

const CUSTOM_BILL_DETAILS_KEY = 'avvnl_user_custom_bill_details';

export interface UserOriginalBillDetails {
  consumerName: string;
  fatherName?: string;
  address?: string;
  subDivision?: string;
  category?: string;
  meterNumber?: string;
  meterStatus?: string;
  sanctionedLoad?: string;
  phase?: string;
  mobile?: string;
  email?: string;
  connectionStatus?: string;
  billingMonth: string;
  billAmount: number;
  totalUnits: number;
  dueDate: string;
  billNumber?: string;
  billDate?: string;
  energyCharges?: number;
  fixedCharges?: number;
  electricityDuty?: number;
  arrears?: number;
  netPayableAmount?: number;
  paymentStatus?: 'PAID' | 'NIL_DUE' | 'UNPAID';
  isCustomVerified?: boolean;
}

export function getCustomBillDetails(): UserOriginalBillDetails | null {
  try {
    const raw = localStorage.getItem(CUSTOM_BILL_DETAILS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const isPaid = parsed.paymentStatus === 'PAID' || parsed.billAmount === 0;
    return {
      consumerName: String(parsed.consumerName || 'Nagji Yadav'),
      fatherName: parsed.fatherName ? String(parsed.fatherName) : undefined,
      address: parsed.address ? String(parsed.address) : 'Rajasthan (AVVNL Supply Area)',
      subDivision: parsed.subDivision ? String(parsed.subDivision) : 'AEN (O&M), AVVNL Discom',
      category: parsed.category ? String(parsed.category) : 'LT-Domestic',
      meterNumber: parsed.meterNumber ? String(parsed.meterNumber) : undefined,
      meterStatus: parsed.meterStatus ? String(parsed.meterStatus) : 'OK Normal',
      sanctionedLoad: parsed.sanctionedLoad ? String(parsed.sanctionedLoad) : undefined,
      phase: parsed.phase ? String(parsed.phase) : 'Single Phase (230V)',
      mobile: parsed.mobile ? String(parsed.mobile) : undefined,
      email: parsed.email ? String(parsed.email) : 'yadavnagji@gmail.com',
      connectionStatus: parsed.connectionStatus ? String(parsed.connectionStatus) : 'Active',
      billingMonth: String(parsed.billingMonth || 'September 2026'),
      billAmount: typeof parsed.billAmount === 'number' && !isNaN(parsed.billAmount) ? parsed.billAmount : (isPaid ? 0 : 0),
      totalUnits: typeof parsed.totalUnits === 'number' && !isNaN(parsed.totalUnits) ? parsed.totalUnits : (isPaid ? 0 : 0),
      dueDate: String(parsed.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10)),
      billDate: String(parsed.billDate || new Date().toISOString().slice(0, 10)),
      billNumber: parsed.billNumber ? String(parsed.billNumber) : undefined,
      energyCharges: typeof parsed.energyCharges === 'number' ? parsed.energyCharges : 0,
      fixedCharges: typeof parsed.fixedCharges === 'number' ? parsed.fixedCharges : 0,
      electricityDuty: typeof parsed.electricityDuty === 'number' ? parsed.electricityDuty : 0,
      arrears: typeof parsed.arrears === 'number' ? parsed.arrears : 0,
      netPayableAmount: typeof parsed.netPayableAmount === 'number' ? parsed.netPayableAmount : (isPaid ? 0 : 0),
      paymentStatus: parsed.paymentStatus || 'PAID',
      isCustomVerified: Boolean(parsed.isCustomVerified),
    };
  } catch {
    return null;
  }
}

export function saveCustomBillDetails(details: UserOriginalBillDetails | null): void {
  try {
    if (details) {
      localStorage.setItem(CUSTOM_BILL_DETAILS_KEY, JSON.stringify(details));
    } else {
      localStorage.removeItem(CUSTOM_BILL_DETAILS_KEY);
    }
  } catch (err) {
    console.error('Error saving custom bill details:', err);
  }
}

