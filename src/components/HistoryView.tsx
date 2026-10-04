import React, { useState } from 'react';
import { Building, MonthlyBill, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { formatCurrency, formatUnits, formatBillingMonth } from '../utils/calculator';
import {
  generateAllFlatsCombinedPdf,
  generateMonthlySummaryPdf,
  generateFullBillPdfWithHindi,
} from '../utils/pdfGenerator';
import { FullBillShareModal } from './FullBillShareModal';
import {
  History,
  Calendar,
  FileText,
  Download,
  Trash2,
  ExternalLink,
  Zap,
  Users,
  Share2,
  Sparkles,
} from 'lucide-react';

interface HistoryViewProps {
  building: Building;
  bills: MonthlyBill[];
  language: Language;
  onSelectBill: (bill: MonthlyBill) => void;
  onDeleteBill: (billId: string) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  building,
  bills,
  language,
  onSelectBill,
  onDeleteBill,
}) => {
  const t = getTranslation(language);
  const [shareModalBill, setShareModalBill] = useState<MonthlyBill | null>(null);

  // Filter bills belonging to current building
  const buildingBills = bills.filter((b) => b.buildingId === building.id);

  if (buildingBills.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-3">
        <History className="w-12 h-12 mx-auto text-slate-600" />
        <h3 className="text-base font-bold text-white">No Bill History Found</h3>
        <p className="text-xs text-slate-400">
          Saved monthly bills for {building.name} will appear here chronologically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 max-w-4xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <span>Bill History Archive (पिछला बिल इतिहास)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {buildingBills.length} recorded monthly cycles for {building.name}.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {buildingBills.map((bill) => {
          const totalPaid = bill.flatEntries.filter((f) => f.paymentStatus === 'Paid').length;
          const totalFlats = bill.flatEntries.length;

          return (
            <div
              key={bill.id}
              className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 shadow-md transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {formatBillingMonth(bill.billingMonth)}
                    </h3>
                    <div className="text-[11px] text-slate-400">
                      Created on: {new Date(bill.createdAt).toLocaleDateString()} • Due: {bill.dueDate}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onSelectBill(bill)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => setShareModalBill(bill)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
                    title="Share Full Bill on WhatsApp / PDF"
                  >
                    <Share2 className="w-3 h-3" />
                    <span>Share Bill (शेयर)</span>
                  </button>

                  <button
                    onClick={() => generateFullBillPdfWithHindi(building, bill)}
                    className="p-1.5 rounded-lg bg-cyan-900/40 hover:bg-cyan-800/60 text-cyan-300 border border-cyan-700/50 transition"
                    title="Download Clean PDF"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => generateAllFlatsCombinedPdf(building, bill)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                    title="Download Combined PDF"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (confirm(`Delete bill for ${formatBillingMonth(bill.billingMonth)}? This cannot be undone.`)) {
                        onDeleteBill(bill.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 transition"
                    title="Delete Record"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Bill Details Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-750">
                  <span className="text-slate-400 text-[11px] block">
                    {bill.discomName ? `${bill.discomName} ` : ''}Bill
                  </span>
                  <span className="font-bold text-amber-400 font-mono">
                    {formatCurrency(bill.totalAvvnlBillAmount)}
                  </span>
                </div>

                <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-750">
                  <span className="text-slate-400 text-[11px] block">
                    {bill.discomName ? `${bill.discomName} ` : ''}Units
                  </span>
                  <span className="font-bold text-cyan-400 font-mono">
                    {formatUnits(bill.totalAvvnlBilledUnits)} U
                  </span>
                </div>

                <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-750">
                  <span className="text-slate-400 text-[11px] block">Flat / Common</span>
                  <span className="font-bold text-white font-mono">
                    {formatUnits(bill.calculations.totalFlatUnits)} / {formatUnits(bill.calculations.commonUnits)}
                  </span>
                </div>

                <div className="bg-slate-850 p-2.5 rounded-xl border border-slate-750">
                  <span className="text-slate-400 text-[11px] block">Payments</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    {totalPaid} / {totalFlats} Paid
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Bill Share Modal for Archive */}
      {shareModalBill && (
        <FullBillShareModal
          isOpen={true}
          onClose={() => setShareModalBill(null)}
          bill={shareModalBill}
          building={building}
          language={language}
        />
      )}
    </div>
  );
};
