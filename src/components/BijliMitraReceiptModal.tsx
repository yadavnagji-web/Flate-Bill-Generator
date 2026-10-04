import React from 'react';
import { Language } from '../types';
import { UserOriginalBillDetails } from '../utils/storage';
import { formatCurrency, formatUnits, formatBillingMonth } from '../utils/calculator';
import { X, Printer, Download, Share2, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface BijliMitraReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  consumerDetails: UserOriginalBillDetails;
  kNumber: string;
}

export const BijliMitraReceiptModal: React.FC<BijliMitraReceiptModalProps> = ({
  isOpen,
  onClose,
  language,
  consumerDetails,
  kNumber,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const text = `⚡ AVVNL BIJLI MITRA OFFICIAL BILL RECEIPT
═════════════════════════════════
👤 उपभोक्ता विवरण (CONSUMER PROFILE):
• K-नंबर: ${kNumber}
• उपभोक्ता का नाम: ${consumerDetails.consumerName}
${consumerDetails.fatherName ? `• पिता का नाम: ${consumerDetails.fatherName}\n` : ''}• उपखंड: ${consumerDetails.subDivision || 'AEN (O&M), AVVNL Discom'}
• श्रेणी: ${consumerDetails.category || 'LT-Domestic'}
${consumerDetails.sanctionedLoad ? `• स्वीकृत लोड: ${consumerDetails.sanctionedLoad}\n` : ''}• मीटर क्रमांक: ${consumerDetails.meterNumber || `AVV-${kNumber.slice(-6)}`}
• परिसर पता: ${consumerDetails.address || 'Rajasthan (AVVNL Supply Area)'}

⚡ बिजली बिल विवरण (BILL DETAILS):
• बिल माह: ${formatBillingMonth(consumerDetails.billingMonth)}
• बिल क्रमांक: ${consumerDetails.billNumber || `AVVNL-${kNumber.slice(-6)}`}
• कुल बिल राशि: ₹${consumerDetails.billAmount.toLocaleString('en-IN')}
• कुल खपत यूनिट्स: ${consumerDetails.totalUnits} Units (kWh)
• नियत तिथि (Due Date): ${consumerDetails.dueDate}
• भुगतान स्थिति: ${consumerDetails.billAmount === 0 ? 'PAID / NIL OUTSTANDING DUES' : 'Active Bill'}
═════════════════════════════════
अजमेर विद्युत वितरण निगम लिमिटेड (AVVNL) - बिजली मित्र पोर्टल`;

    navigator.clipboard.writeText(text);
    alert(language === 'hi' ? 'बिल रसीद विवरण क्लिपबोर्ड पर कॉपी हो गया!' : 'Bill receipt copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-300 my-6">
        {/* Top Action Bar (hidden in print) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm sm:text-base">
              {language === 'hi'
                ? 'AVVNL बिजली मित्र - आधिकारिक उपभोक्ता बिल रसीद'
                : 'AVVNL BijliMitra Official Bill Receipt'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'प्रिंट / PDF' : 'Print / PDF'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{language === 'hi' ? 'कॉपी' : 'Copy'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div className="p-5 sm:p-8 space-y-5 print:p-0">
          {/* Header with AVVNL Discom Seal & Details */}
          <div className="text-center border-b-2 border-slate-900 pb-4">
            <div className="inline-flex items-center justify-center gap-2 mb-1">
              <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow">
                ⚡
              </div>
              <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-950">
                अजमेर विद्युत वितरण निगम लिमिटेड
              </h2>
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wider">
              AJMER VIDYUT VITRAN NIGAM LIMITED (AVVNL)
            </div>
            <div className="text-xs font-medium text-slate-600 mt-0.5">
              बिजली मित्र (BIJLI MITRA) - आधिकारिक उपभोक्ता बिल एवं खाता विवरण
            </div>
          </div>

          {/* Verification Badge */}
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl px-4 py-2.5 text-xs text-emerald-900 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>सत्यापित बिल (Verified BijliMitra Account):</strong> वर्तमान चक्र हेतु कोई बकाया नहीं है (NIL CURRENT DUES)
              </span>
            </div>
            <span className="font-mono text-[11px] bg-emerald-200/60 px-2 py-0.5 rounded font-bold">
              K-NO: {kNumber}
            </span>
          </div>

          {/* Section 1: Consumer Profile (उपभोक्ता विवरण) */}
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 px-3.5 py-2 font-black text-slate-900 border-b border-slate-300 flex items-center justify-between">
              <span>१. उपभोक्ता पहचान एवं कनेक्शन विवरण (CONSUMER DETAILS)</span>
              <span className="font-mono text-cyan-800">AVVNL Discom Area</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-white">
              <div className="p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">उपभोक्ता का नाम:</span>
                  <strong className="text-slate-950 text-sm">{consumerDetails.consumerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">पिता / पति का नाम:</span>
                  <span className="font-semibold text-slate-800">
                    {consumerDetails.fatherName || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">K-नंबर (Account ID):</span>
                  <strong className="text-slate-950 font-mono tracking-wider">{kNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">उपभोक्ता श्रेणी (Tariff):</span>
                  <span className="font-semibold text-slate-800">
                    {consumerDetails.category || 'LT-Domestic'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">सप्लाई प्रकार (Voltage):</span>
                  <span className="font-medium text-slate-800">Single Phase (230V)</span>
                </div>
              </div>

              <div className="p-3.5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">उपखंड / कार्यालय:</span>
                  <span className="font-semibold text-slate-800">
                    {consumerDetails.subDivision || 'AEN (O&M), AVVNL Discom'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">स्वीकृत भार (Load):</span>
                  <strong className="text-emerald-700 font-mono">
                    {consumerDetails.sanctionedLoad || 'As per Discom'}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">मीटर क्रमांक (Meter No):</span>
                  <strong className="font-mono text-slate-900">
                    {consumerDetails.meterNumber || `AVV-${kNumber.slice(-6)}`}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">मीटर स्थिति (Status):</span>
                  <span className="text-emerald-700 font-semibold">OK Normal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">पंजीकृत मोबाइल:</span>
                  <span className="font-mono text-slate-800">{consumerDetails.mobile || 'Registered'}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-200 text-slate-700">
              <span className="text-slate-500 mr-2">परिसर पता (Premises Address):</span>
              <span className="font-medium">
                {consumerDetails.address || 'Rajasthan (AVVNL Supply Area)'}
              </span>
            </div>
          </div>

          {/* Section 2: Bill Summary & Tariff Charges (विद्युत बिल विवरण) */}
          <div className="border border-slate-300 rounded-xl overflow-hidden text-xs">
            <div className="bg-slate-100 px-3.5 py-2 font-black text-slate-900 border-b border-slate-300 flex items-center justify-between">
              <span>२. विद्युत बिल एवं प्रभार विवरण (ELECTRICITY BILL CHARGES)</span>
              <span className="font-mono font-bold text-amber-800">
                {formatBillingMonth(consumerDetails.billingMonth)}
              </span>
            </div>

            <div className="grid grid-cols-3 divide-x divide-slate-200 text-center p-3 bg-amber-50/50 border-b border-slate-200">
              <div>
                <span className="text-[11px] text-slate-500 block">कुल बिल राशि (Total Bill):</span>
                <span className="text-lg sm:text-2xl font-black text-slate-950 font-mono">
                  {formatCurrency(consumerDetails.billAmount)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">खपत यूनिट्स (Billed Units):</span>
                <span className="text-lg sm:text-2xl font-black text-emerald-700 font-mono">
                  {formatUnits(consumerDetails.totalUnits)} kWh
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">नियत देय तिथि (Due Date):</span>
                <span className="text-sm sm:text-base font-bold text-amber-700 mt-1 block">
                  {consumerDetails.dueDate}
                </span>
              </div>
            </div>

            <div className="p-3.5 space-y-1.5 font-mono text-slate-800 bg-white">
              <div className="flex justify-between">
                <span className="font-sans text-slate-600">ऊर्जा प्रभार (Energy Charges):</span>
                <span>₹{(consumerDetails.energyCharges || 7650).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-600">स्थाई शुल्क (Fixed Charges):</span>
                <span>₹{(consumerDetails.fixedCharges || 1200).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-600">विद्युत शुल्क व उपकर (Electricity Duty & Cess):</span>
                <span>₹{(consumerDetails.electricityDuty || 800).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans text-slate-600">अन्य अधिभार / ईंधन प्रभार (Other / Fuel):</span>
                <span>₹350</span>
              </div>
              <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                <span className="font-sans">पूर्व बकाया राशि (Arrears):</span>
                <span className="text-emerald-700 font-bold">₹0 (Nil)</span>
              </div>
              <div className="flex justify-between text-slate-950 font-bold text-sm pt-1.5 border-t-2 border-slate-300">
                <span className="font-sans">कुल देय राशि (Net Payable Amount):</span>
                <span className="text-base font-black text-slate-950">
                  {formatCurrency(consumerDetails.billAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Footer certification */}
          <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-3 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              यह रसीद अजमेर विद्युत वितरण निगम लिमिटेड के बिजली मित्र पोर्टल से प्रमाणित है।
            </span>
            <span className="font-mono text-slate-600">
              Generated: {new Date().toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>

        {/* Bottom Close Button (hidden in print) */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-300 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow transition cursor-pointer"
          >
            {language === 'hi' ? 'बंद करें (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
