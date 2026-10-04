import React, { useState } from 'react';
import { Building, MonthlyBill, FlatBillEntry, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { formatCurrency, formatUnits, formatBillingMonth } from '../utils/calculator';
import {
  generateIndividualFlatPdf,
  generateAllFlatsCombinedPdf,
  generateMonthlySummaryPdf,
  generateFullBillPdfWithHindi,
} from '../utils/pdfGenerator';
import { FullBillShareModal } from './FullBillShareModal';
import {
  FileText,
  Download,
  Share2,
  CheckCircle2,
  Clock,
  Printer,
  Search,
  Filter,
  Users,
  Zap,
  Building2,
  Calendar,
  CreditCard,
  Eye,
  X,
  ExternalLink,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface StatementsViewProps {
  building: Building;
  bill: MonthlyBill | null;
  language: Language;
  onOpenWhatsApp: (entry: FlatBillEntry) => void;
  onUpdatePaymentStatus: (flatId: string, status: 'Pending' | 'Paid') => void;
}

export const StatementsView: React.FC<StatementsViewProps> = ({
  building,
  bill,
  language,
  onOpenWhatsApp,
  onUpdatePaymentStatus,
}) => {
  const t = getTranslation(language);

  const [viewMode, setViewMode] = useState<'individual' | 'combined'>('individual');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Pending'>('all');
  const [selectedFlatId, setSelectedFlatId] = useState<string | null>(null);
  const [showOriginalBillModal, setShowOriginalBillModal] = useState<boolean>(false);
  const [showFullBillShareModal, setShowFullBillShareModal] = useState<boolean>(false);
  const [isGeneratingHindiPdf, setIsGeneratingHindiPdf] = useState<boolean>(false);

  const handleDownloadHindiPdf = async () => {
    if (!bill) return;
    setIsGeneratingHindiPdf(true);
    try {
      await generateFullBillPdfWithHindi(building, bill);
    } catch (err) {
      console.error(err);
      generateAllFlatsCombinedPdf(building, bill);
    } finally {
      setIsGeneratingHindiPdf(false);
    }
  };

  if (!bill) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-3">
        <FileText className="w-12 h-12 mx-auto text-slate-600" />
        <h3 className="text-base font-bold text-white">No Monthly Bill Selected</h3>
        <p className="text-xs text-slate-400">
          Please scan or enter a monthly bill first to view individual flat slips and combined statements.
        </p>
      </div>
    );
  }

  const { flatEntries, calculations } = bill;

  // Filter entries
  const filteredEntries = flatEntries.filter((entry) => {
    const matchSearch =
      entry.flatNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.subMeterNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' ? true : entry.paymentStatus === statusFilter;

    return matchSearch && matchStatus;
  });

  const selectedEntry = selectedFlatId
    ? flatEntries.find((f) => f.flatId === selectedFlatId) || filteredEntries[0]
    : filteredEntries[0];

  return (
    <div className="space-y-5 pb-24 max-w-5xl mx-auto">
      {/* Top Header Card & View Mode Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                Electricity Statements
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {formatBillingMonth(bill.billingMonth)}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{building.name}</h2>
          </div>

          {/* Combined vs Individual Toggle & PDF Export */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
              <button
                onClick={() => setViewMode('individual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'individual'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Individual Slips (पर्ची)
              </button>
              <button
                onClick={() => setViewMode('combined')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'combined'
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Combined Table (संयुक्त)
              </button>
            </div>

            {/* Share Full Bill Button */}
            <button
              onClick={() => setShowFullBillShareModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950/40 transition"
              title="Share Entire Building Bill on WhatsApp / PDF"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share Full Bill (पूरा बिल शेयर करें)</span>
            </button>

            {/* Hindi PDF Button */}
            <button
              onClick={handleDownloadHindiPdf}
              disabled={isGeneratingHindiPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 text-xs font-semibold border border-cyan-500/30 transition disabled:opacity-50"
              title="Download PDF with clean typography"
            >
              {isGeneratingHindiPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              )}
              <span>Clean PDF (हिंदी)</span>
            </button>

            <button
              onClick={() => generateAllFlatsCombinedPdf(building, bill)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Download All Flats PDF"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Print A4"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print</span>
            </button>

            {bill.billPhotoUrl && (
              <button
                onClick={() => setShowOriginalBillModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition"
                title="View Uploaded Electricity Bill (PDF/JPEG)"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Original Bill</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-800">
          <div className="flex-1 flex items-center gap-2 bg-slate-850 border border-slate-750 rounded-xl px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by flat, tenant name..."
              className="w-full bg-transparent text-xs text-slate-200 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e: any) => setStatusFilter(e.target.value)}
              className="bg-slate-850 border border-slate-750 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs outline-none"
            >
              <option value="all">All Payments ({flatEntries.length})</option>
              <option value="Paid">Paid Only</option>
              <option value="Pending">Pending Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: INDIVIDUAL FLAT STATEMENT ================= */}
      {viewMode === 'individual' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Flat Selection List */}
          <div className="space-y-2 lg:max-h-[680px] lg:overflow-y-auto pr-1">
            <div className="text-xs font-semibold text-slate-400 px-1">
              Select Flat ({filteredEntries.length} Flats)
            </div>
            {filteredEntries.map((f) => {
              const isSelected = selectedEntry?.flatId === f.flatId;
              return (
                <div
                  key={f.flatId}
                  onClick={() => setSelectedFlatId(f.flatId)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-800 border-cyan-500/80 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-850'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">Flat {f.flatNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          f.paymentStatus === 'Paid'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {f.paymentStatus}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">
                      {f.tenantName}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-400 font-mono">
                      {formatCurrency(f.finalPayableAmount)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formatUnits(f.usedUnits)} Units
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Individual Statement Slip (Section 11) */}
          <div className="lg:col-span-2">
            {selectedEntry ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 printable-slip">
                {/* Slip Header */}
                <div className="border-b border-slate-800 pb-3 flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-400">
                      {bill.discomName ? `${bill.discomName} ` : ''}Electricity Bill Slip
                    </span>
                    <h3 className="text-xl font-black text-white">{building.name}</h3>
                    <p className="text-xs text-slate-400">{building.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Billing Month</span>
                    <div className="text-base font-bold text-amber-400">
                      {formatBillingMonth(bill.billingMonth)}
                    </div>
                  </div>
                </div>

                {/* Flat & Tenant Badge */}
                <div className="bg-slate-850 p-3.5 rounded-xl border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Flat Number</span>
                    <strong className="text-base text-white font-bold">
                      {selectedEntry.flatNumber}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tenant Name</span>
                    <strong className="text-slate-200">{selectedEntry.tenantName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Sub-meter No.</span>
                    <strong className="text-slate-200">{selectedEntry.subMeterNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Bill Date / Due</span>
                    <strong className="text-slate-200">
                      {bill.billDate} / {bill.dueDate}
                    </strong>
                  </div>
                </div>

                {/* Sub-meter Readings Table */}
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-300">
                    Sub-Meter Consumption (व्यक्तिगत मीटर खपत)
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
                      <span className="text-slate-400 block text-[11px]">Previous Reading</span>
                      <strong className="text-sm text-slate-200 font-mono">
                        {selectedEntry.previousReading}
                      </strong>
                    </div>
                    <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
                      <span className="text-slate-400 block text-[11px]">Current Reading</span>
                      <strong className="text-sm text-cyan-300 font-mono">
                        {selectedEntry.currentReading}
                      </strong>
                    </div>
                    <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/80">
                      <span className="text-slate-400 block text-[11px]">Flat Used Units</span>
                      <strong className="text-sm text-emerald-400 font-mono">
                        {formatUnits(selectedEntry.usedUnits)} Units
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Building Common Distribution Details */}
                <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="text-slate-300 font-bold flex items-center justify-between">
                    <span>Common Units Distribution (सामान्य यूनिट हिस्सा)</span>
                    <span className="text-violet-400">
                      Rate: ₹{calculations.perUnitRate.toFixed(2)} / Unit
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-400">
                    <div>
                      Total {bill.discomName ? `${bill.discomName} ` : ''}Units: <strong className="text-slate-200">{formatUnits(bill.totalAvvnlBilledUnits)}</strong>
                    </div>
                    <div>
                      Total Flat Units: <strong className="text-slate-200">{formatUnits(calculations.totalFlatUnits)}</strong>
                    </div>
                    <div>
                      Common Units: <strong className="text-violet-300">{formatUnits(calculations.commonUnits)}</strong>
                    </div>
                    <div>
                      Active Flats: <strong className="text-slate-200">{calculations.activeFlatsCount} Flats</strong>
                    </div>
                  </div>
                  <div className="text-xs text-slate-300 pt-1 border-t border-slate-750 flex items-center justify-between">
                    <span>This Flat Common Share:</span>
                    <span className="font-bold text-violet-300">
                      {formatUnits(selectedEntry.commonUnitsShare)} Units ={' '}
                      {formatCurrency(selectedEntry.commonAmountShare)}
                    </span>
                  </div>
                </div>

                {/* Financial Breakdown Summary Banner */}
                <div className="bg-gradient-to-br from-slate-850 to-slate-800 border-2 border-emerald-500/50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Own Electricity Amount ({formatUnits(selectedEntry.usedUnits)} U × ₹{calculations.perUnitRate.toFixed(2)}):</span>
                    <span className="font-mono">{formatCurrency(selectedEntry.ownAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Common Electricity Amount ({formatUnits(selectedEntry.commonUnitsShare)} U × ₹{calculations.perUnitRate.toFixed(2)}):</span>
                    <span className="font-mono text-violet-300">
                      {formatCurrency(selectedEntry.commonAmountShare)}
                    </span>
                  </div>
                  <div className="border-t border-slate-700 pt-2 flex items-center justify-between">
                    <span className="text-sm font-black text-white">FINAL PAYABLE AMOUNT:</span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">
                      {formatCurrency(selectedEntry.finalPayableAmount)}
                    </span>
                  </div>
                </div>

                {/* Payment Status & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">Payment Status:</span>
                    <button
                      onClick={() =>
                        onUpdatePaymentStatus(
                          selectedEntry.flatId,
                          selectedEntry.paymentStatus === 'Paid' ? 'Pending' : 'Paid'
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition ${
                        selectedEntry.paymentStatus === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}
                    >
                      {selectedEntry.paymentStatus === 'Paid' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Marked Paid
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5" /> Pending Payment
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenWhatsApp(selectedEntry)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp Share</span>
                    </button>

                    <button
                      onClick={() => generateIndividualFlatPdf(building, bill, selectedEntry)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
                      title="Download PDF Slip"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>PDF Slip</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* ================= VIEW 2: COMBINED STATEMENT TABLE (Section 12) ================= */}
      {viewMode === 'combined' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Combined Building Statement ({formatBillingMonth(bill.billingMonth)})
              </h3>
              <p className="text-xs text-slate-400">
                Complete flat-wise consumption and payment breakdown.
              </p>
            </div>
            <div className="text-xs text-slate-300">
              Per Unit Rate: <strong>₹{calculations.perUnitRate.toFixed(2)}</strong>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-slate-800 text-slate-200 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Flat No</th>
                  <th className="py-2.5 px-2">Tenant</th>
                  <th className="py-2.5 px-2">Prev</th>
                  <th className="py-2.5 px-2">Curr</th>
                  <th className="py-2.5 px-2">Used Units</th>
                  <th className="py-2.5 px-2">Own Amt</th>
                  <th className="py-2.5 px-2">Common Units</th>
                  <th className="py-2.5 px-2">Common Amt</th>
                  <th className="py-2.5 px-2">Total Amt</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredEntries.map((row) => (
                  <tr key={row.flatId} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-white">Flat {row.flatNumber}</td>
                    <td className="py-2.5 px-2 truncate max-w-[120px]">{row.tenantName}</td>
                    <td className="py-2.5 px-2 font-mono">{row.previousReading}</td>
                    <td className="py-2.5 px-2 font-mono text-cyan-300">{row.currentReading}</td>
                    <td className="py-2.5 px-2 font-mono font-bold text-emerald-400">
                      {formatUnits(row.usedUnits)}
                    </td>
                    <td className="py-2.5 px-2 font-mono">{formatCurrency(row.ownAmount)}</td>
                    <td className="py-2.5 px-2 font-mono text-violet-300">
                      {formatUnits(row.commonUnitsShare)}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-violet-300">
                      {formatCurrency(row.commonAmountShare)}
                    </td>
                    <td className="py-2.5 px-2 font-mono font-bold text-emerald-400">
                      {formatCurrency(row.finalPayableAmount)}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        onClick={() =>
                          onUpdatePaymentStatus(
                            row.flatId,
                            row.paymentStatus === 'Paid' ? 'Pending' : 'Paid'
                          )
                        }
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          row.paymentStatus === 'Paid'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {row.paymentStatus}
                      </button>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <button
                        onClick={() => onOpenWhatsApp(row)}
                        className="text-emerald-400 hover:text-emerald-300 p-1"
                        title="Share on WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-850 font-bold border-t-2 border-slate-700 text-slate-200">
                <tr>
                  <td colSpan={4} className="py-3 px-3">
                    TOTALS ({filteredEntries.length} Flats)
                  </td>
                  <td className="py-3 px-2 font-mono">
                    {formatUnits(filteredEntries.reduce((s, r) => s + r.usedUnits, 0))}
                  </td>
                  <td className="py-3 px-2 font-mono">
                    {formatCurrency(filteredEntries.reduce((s, r) => s + r.ownAmount, 0))}
                  </td>
                  <td className="py-3 px-2 font-mono text-violet-300">
                    {formatUnits(filteredEntries.reduce((s, r) => s + r.commonUnitsShare, 0))}
                  </td>
                  <td className="py-3 px-2 font-mono text-violet-300">
                    {formatCurrency(filteredEntries.reduce((s, r) => s + r.commonAmountShare, 0))}
                  </td>
                  <td className="py-3 px-2 font-mono text-emerald-400 font-bold">
                    {formatCurrency(
                      filteredEntries.reduce((s, r) => s + r.finalPayableAmount, 0)
                    )}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
      {/* Original AVVNL Bill Modal (PDF or JPEG) */}
      {showOriginalBillModal && bill.billPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
            <div className="px-4 py-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base">
                    Original {bill.discomName || 'Electricity'} Bill Document (मूल बिजली बिल)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {formatBillingMonth(bill.billingMonth)} • K-Number: {bill.kNumber || 'N/A'} • {bill.billPhotoUrl.startsWith('data:application/pdf') ? 'PDF Document' : 'JPEG Image'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={bill.billPhotoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition"
                  download={bill.billPhotoUrl.startsWith('data:application/pdf') ? `${bill.discomName || 'Bill'}_${bill.billingMonth}.pdf` : `${bill.discomName || 'Bill'}_${bill.billingMonth}.jpg`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setShowOriginalBillModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-slate-950">
              {bill.billPhotoUrl.startsWith('data:application/pdf') ? (
                <div className="w-full flex flex-col items-center gap-3">
                  <object
                    data={bill.billPhotoUrl}
                    type="application/pdf"
                    className="w-full h-[65vh] rounded-xl border border-slate-800"
                  >
                    <div className="p-6 text-center text-slate-300">
                      <FileText className="w-12 h-12 mx-auto text-red-400 mb-2" />
                      <p className="text-sm font-semibold mb-2">PDF Document Ready</p>
                      <a
                        href={bill.billPhotoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Click to view PDF in full tab</span>
                      </a>
                    </div>
                  </object>
                </div>
              ) : (
                <img
                  src={bill.billPhotoUrl}
                  alt="Original Electricity Bill"
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Bill Share Modal */}
      <FullBillShareModal
        isOpen={showFullBillShareModal}
        onClose={() => setShowFullBillShareModal(false)}
        bill={bill}
        building={building}
        language={language}
      />
    </div>
  );
};
