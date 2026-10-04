export type Language = 'en' | 'hi';

export interface Building {
  id: string;
  name: string;
  address: string;
  ownerName: string;
  ownerMobile: string;
  createdAt: string;
}

export interface Flat {
  id: string;
  buildingId: string;
  flatNumber: string;
  tenantName: string;
  tenantMobile: string;
  subMeterNumber: string;
  previousReading: number;
  currentReading: number;
  isActive: boolean;
}

export interface FlatBillEntry {
  flatId: string;
  flatNumber: string;
  tenantName: string;
  tenantMobile: string;
  subMeterNumber: string;
  entryMode: 'reading' | 'used_units';
  previousReading: number;
  currentReading: number;
  usedUnits: number;
  ownAmount: number;
  commonUnitsShare: number;
  commonAmountShare: number;
  finalPayableAmount: number;
  roundingAdjustment?: number;
  paymentStatus: 'Pending' | 'Paid';
  paymentDate?: string;
  paymentMode?: 'Cash' | 'UPI' | 'Bank Transfer' | 'Other';
  paymentNotes?: string;
}

export interface BillCalculationSummary {
  activeFlatsCount: number;
  totalFlatUnits: number;
  commonUnits: number;
  perUnitRate: number;
  commonUnitsPerFlat: number;
  commonAmountPerFlat: number;
  totalDistributedAmount: number;
  roundingAdjustment: {
    flatId: string;
    flatNumber: string;
    adjustmentAmount: number;
  } | null;
}

export interface MonthlyBill {
  id: string;
  buildingId: string;
  billingMonth: string; // e.g., "September 2026"
  billDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  kNumber: string;
  consumerName: string;
  billNumber: string;
  discomName?: string; // Electricity Board/Provider name from bill photo or empty if none
  totalAvvnlBillAmount: number;
  totalAvvnlBilledUnits: number;
  billPhotoUrl?: string;
  isConfirmed: boolean;
  createdAt: string;
  calculations: BillCalculationSummary;
  flatEntries: FlatBillEntry[];
  // Additional OCR breakdown fields
  energyCharges?: number;
  fixedCharges?: number;
  otherCharges?: number;
  electricityDuty?: number;
  arrears?: number;
  netPayableAmount?: number;
}

export interface OCRBillData {
  discomName?: string;
  kNumber?: string;
  consumerName?: string;
  billNumber?: string;
  billDate?: string;
  billingMonth?: string;
  previousReading?: number;
  currentReading?: number;
  totalUnits?: number;
  energyCharges?: number;
  fixedCharges?: number;
  otherCharges?: number;
  electricityDuty?: number;
  arrears?: number;
  totalBillAmount?: number;
  netPayableAmount?: number;
  dueDate?: string;
  confidenceNotes?: string;
}

export interface AppState {
  buildings: Building[];
  activeBuildingId: string;
  flats: Flat[];
  monthlyBills: MonthlyBill[];
  selectedBillId: string | null;
  language: Language;
  isDemoMode: boolean;
}

export interface BijliMitraConsumerProfile {
  kNumber: string;
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
  billingMonth?: string;
  billNumber?: string;
  billDate?: string;
  dueDate?: string;
  totalUnits?: number;
  billAmount?: number;
  energyCharges?: number;
  fixedCharges?: number;
  electricityDuty?: number;
  urbanCess?: number;
  fuelSurcharge?: number;
  otherCharges?: number;
  arrears?: number;
  netPayableAmount?: number;
  paymentStatus?: 'PAID' | 'NIL_DUE' | 'UNPAID';
  isCustomVerified?: boolean;
}

export interface DiscomAutoFetchResult {
  success: boolean;
  kNumber: string;
  discomName: string;
  merchantName?: string;
  transactionId?: string;
  consumerName?: string;
  consumerProfile?: BijliMitraConsumerProfile;
  billAmount?: number;
  netPayableAmount?: number;
  currentOutstanding?: number;
  totalUnits?: number;
  billNumber?: string;
  billDate?: string;
  dueDate?: string;
  billingMonth?: string;
  energyCharges?: number;
  fixedCharges?: number;
  otherCharges?: number;
  electricityDuty?: number;
  billerErrorCode?: string;
  billerErrorDesc?: string;
  isOriginalDiscomData?: boolean;
  status: 'fetched' | 'zero_due_or_paid' | 'not_generated' | 'biller_unavailable' | 'invalid_account' | 'account_verified' | 'error';
  statusMessage: string;
  statusMessageHi: string;
  directBilldeskUrl: string;
  bijliMitraUrl: string;
  samplePreFill?: any;
  rawResponse?: any;
}
