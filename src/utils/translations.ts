import { Language } from '../types';

export const translations = {
  en: {
    appName: 'Sub Meter Bill Generator',
    tagline: 'Residential Sub-Meter Electricity Distribution',
    // Navigation
    navDashboard: 'Dashboard',
    navNewBill: 'New Bill',
    navFlats: 'Flats',
    navStatements: 'Statements',
    navReports: 'Reports',
    navHistory: 'History',
    navSettings: 'Settings',

    // Dashboard Cards & Terms
    totalBill: 'Total AVVNL Bill',
    totalUnits: 'Total AVVNL Units',
    totalFlatUnits: 'Total Flat Units',
    commonUnits: 'Common Units',
    perUnitRate: 'Per Unit Rate',
    equalShare: 'Equal Share per Flat',
    totalPayable: 'Total Payable Amount',
    totalDistributed: 'Total Amount Distributed',
    activeFlats: 'Active Flats',
    totalFlats: 'Total Flats',
    currentBillingMonth: 'Current Billing Month',
    pendingStatements: 'Pending Payments',
    collectedAmount: 'Total Collected',
    pendingAmount: 'Total Pending',

    // Buttons
    scanBill: 'Upload / Scan Bill (PDF / JPEG)',
    newMonthlyBill: 'New Monthly Bill',
    manageFlats: 'Manage Flats',
    statements: 'Statements',
    reports: 'Reports',
    settings: 'Settings',
    confirmBill: 'Confirm Bill',
    edit: 'Edit',
    confirmAndGenerate: 'Confirm & Generate Bills',
    shareWhatsApp: 'Share on WhatsApp',
    downloadPdf: 'Download PDF',
    printA4: 'Print Statement',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    addFlat: 'Add Flat',
    addBuilding: 'New Building',
    markPaid: 'Mark Paid',
    markPending: 'Mark Pending',
    backupData: 'Backup Data (JSON)',
    restoreData: 'Restore Data (JSON)',
    privacyPolicy: 'Privacy Policy',

    // Wizard Steps
    stepAvvnl: '1. AVVNL Bill Details',
    stepReadings: '2. Flat Meter Readings',
    stepSummary: '3. Calculation Summary',
    stepFinal: '4. Final Bill & Statements',

    // Toggles
    modeReading: 'Enter Reading',
    modeUsedUnits: 'Enter Used Units',

    // Table Headers
    colFlat: 'Flat',
    colTenant: 'Tenant',
    colPrevReading: 'Prev Reading',
    colCurrReading: 'Curr Reading',
    colOwnUnits: 'Own Units',
    colCommonUnits: 'Common Units',
    colTotalUnits: 'Total Units',
    colOwnAmount: 'Own Amount',
    colCommonAmount: 'Common Amount',
    colFinalAmount: 'Final Amount',
    colStatus: 'Status',
    colActions: 'Actions',

    // Validation Errors
    errUnitsExceed: 'Flat-wise units exceed the total AVVNL billed units. Please check the meter readings.',
    errInvalidBill: 'Please enter a valid AVVNL Bill Amount and Total Billed Units.',
    errNoActiveFlats: 'No active flats found for this building. Please add or activate flats first.',
    errCouldNotRead: 'Could not read this information. Please enter it manually.',
    roundingAdjustmentNote: 'Rounding Adjustment',

    // Statement
    flatStatementTitle: 'FLAT ELECTRICITY STATEMENT',
    building: 'Building',
    flat: 'Flat',
    tenant: 'Tenant',
    subMeterNo: 'Sub-meter Number',
    kNumber: 'K Number',
    billDate: 'Bill Date',
    dueDate: 'Due Date',
    ownConsumption: 'Own Consumption',
    ownElectricityAmount: 'Own Electricity Amount',
    commonShareAmount: 'Common Amount',
    pleasePayNote: 'Please pay the above amount.',

    // Language
    language: 'Language',
    demoMode: 'Demo Mode (Sample Data)',
    demoNotice: 'Demo mode is active with realistic AVVNL 8-flat data.',
  },
  hi: {
    appName: 'सब-मीटर बिल जनरेटर',
    tagline: 'अपार्टमेंट सब-मीटर बिजली बिल वितरण',
    // Navigation
    navDashboard: 'डैशबोर्ड',
    navNewBill: 'नया बिल',
    navFlats: 'फ्लैट्स',
    navStatements: 'स्टेटमेंट',
    navReports: 'रिपोर्ट्स',
    navHistory: 'इतिहास',
    navSettings: 'सेटिंग्स',

    // Dashboard Cards & Terms
    totalBill: 'कुल बिल',
    totalUnits: 'कुल यूनिट',
    totalFlatUnits: 'फ्लैट की यूनिट',
    commonUnits: 'सामान्य यूनिट',
    perUnitRate: 'प्रति यूनिट दर',
    equalShare: 'समान हिस्सा',
    totalPayable: 'कुल देय राशि',
    totalDistributed: 'कुल वितरित राशि',
    activeFlats: 'सक्रिय फ्लैट्स',
    totalFlats: 'कुल फ्लैट्स',
    currentBillingMonth: 'वर्तमान बिलिंग माह',
    pendingStatements: 'बकाया भुगतान',
    collectedAmount: 'कुल प्राप्त राशि',
    pendingAmount: 'कुल बकाया राशि',

    // Buttons
    scanBill: '📷 बिल स्कैन / अपलोड (PDF/JPEG)',
    newMonthlyBill: '➕ नया मासिक बिल',
    manageFlats: '🏢 फ्लैट्स प्रबंधन',
    statements: '📄 स्टेटमेंट',
    reports: '📊 रिपोर्ट्स',
    settings: '⚙️ सेटिंग्स',
    confirmBill: 'बिल सत्यापित करें',
    edit: '✏️ संपादन',
    confirmAndGenerate: '✅ बिल बनाएं और पुष्टि करें',
    shareWhatsApp: 'व्हाट्सएप पर शेयर करें',
    downloadPdf: 'पीडीएफ डाउनलोड',
    printA4: 'प्रिंट निकालें',
    save: 'सुरक्षित करें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    addFlat: 'नया फ्लैट जोड़ें',
    addBuilding: 'नया भवन जोड़ें',
    markPaid: 'भुगतान हुआ चिह्नित करें',
    markPending: 'बकाया चिह्नित करें',
    backupData: 'डेटा बैकअप (JSON)',
    restoreData: 'डेटा पुनर्प्राप्त (JSON)',
    privacyPolicy: 'गोपनीयता नीति',

    // Wizard Steps
    stepAvvnl: '१. AVVNL बिल विवरण',
    stepReadings: '२. फ्लैट मीटर रीडिंग',
    stepSummary: '३. गणना सारांश',
    stepFinal: '४. अंतिम बिल और स्टेटमेंट',

    // Toggles
    modeReading: 'मीटर रीडिंग दर्ज करें',
    modeUsedUnits: 'उपयोग यूनिट दर्ज करें',

    // Table Headers
    colFlat: 'फ्लैट',
    colTenant: 'किरायेदार',
    colPrevReading: 'पिछली रीडिंग',
    colCurrReading: 'वर्तमान रीडिंग',
    colOwnUnits: 'खुद की यूनिट',
    colCommonUnits: 'सामान्य यूनिट',
    colTotalUnits: 'कुल यूनिट',
    colOwnAmount: 'खुद की राशि',
    colCommonAmount: 'सामान्य राशि',
    colFinalAmount: 'अंतिम राशि',
    colStatus: 'स्थिति',
    colActions: 'कार्रवाई',

    // Validation Errors
    errUnitsExceed: 'फ्लैट की कुल यूनिट मुख्य AVVNL बिल यूनिट से अधिक है। कृपया मीटर रीडिंग की जांच करें।',
    errInvalidBill: 'कृपया मान्य AVVNL बिल राशि और कुल यूनिट दर्ज करें।',
    errNoActiveFlats: 'इस बिल्डिंग में कोई सक्रिय फ्लैट नहीं है। कृपया पहले फ्लैट सक्रिय करें।',
    errCouldNotRead: 'इस जानकारी को पढ़ा नहीं जा सका। कृपया इसे मैन्युअल रूप से दर्ज करें।',
    roundingAdjustmentNote: 'राउंडिंग समायोजन',

    // Statement
    flatStatementTitle: 'फ्लैट बिजली बिल स्टेटमेंट',
    building: 'भवन',
    flat: 'फ्लैट',
    tenant: 'किरायेदार',
    subMeterNo: 'सब-मीटर संख्या',
    kNumber: 'के नंबर (K Number)',
    billDate: 'बिल दिनांक',
    dueDate: 'अंतिम तिथि',
    ownConsumption: 'व्यक्तिगत खपत',
    ownElectricityAmount: 'व्यक्तिगत बिजली राशि',
    commonShareAmount: 'सामान्य हिस्सा राशि',
    pleasePayNote: 'कृपया उपर्युक्त राशि का समय पर भुगतान करें।',

    // Language
    language: 'भाषा (Language)',
    demoMode: 'डेमो मोड (नमूना डेटा)',
    demoNotice: 'डेमो मोड सक्रिय है (८ फ्लैट AVVNL गणना के साथ)।',
  },
};

export function getTranslation(lang: Language) {
  return translations[lang] || translations.en;
}
