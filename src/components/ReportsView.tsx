import React, { useState } from 'react';
import { Building, MonthlyBill, FlatBillEntry, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { formatCurrency, formatUnits, formatBillingMonth } from '../utils/calculator';
import { generateMonthlySummaryPdf } from '../utils/pdfGenerator';
import {
  BarChart3,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  CreditCard,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  Search,
} from 'lucide-react';

interface ReportsViewProps {
  building: Building;
  bills: MonthlyBill[];
  currentBill: MonthlyBill | null;
  language: Language;
  onUpdateFlatPayment: (
    billId: string,
    flatId: string,
    status: 'Pending' | 'Paid',
    mode?: string,
    date?: string,
    notes?: string
  ) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  building,
  bills,
  currentBill,
  language,
  onUpdateFlatPayment,
}) => {
  const t = getTranslation(language);

  const [selectedBillId, setSelectedBillId] = useState<string>(
    currentBill?.id || (bills.length > 0 ? bills[0].id : '')
  );

  const [paymentModalFlat, setPaymentModalFlat] = useState<FlatBillEntry | null>(null);
  const [payStatus, setPayStatus] = useState<'Pending' | 'Paid'>('Paid');
  const [payMode, setPayMode] = useState<'Cash' | 'UPI' | 'Bank Transfer' | 'Other'>('UPI');
  const [payDate, setPayDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [payNotes, setPayNotes] = useState<string>('');

  const activeBill = bills.find((b) => b.id === selectedBillId) || currentBill;

  if (!activeBill) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto space-y-3">
        <BarChart3 className="w-12 h-12 mx-auto text-slate-600" />
        <h3 className="text-base font-bold text-white">No Reports Available</h3>
        <p className="text-xs text-slate-400">
          Create or generate at least one monthly bill to view analytics, payment collection, and dues reports.
        </p>
      </div>
    );
  }

  // Summary Metrics
  const totalPayable = activeBill.calculations.totalDistributedAmount;
  const paidEntries = activeBill.flatEntries.filter((f) => f.paymentStatus === 'Paid');
  const pendingEntries = activeBill.flatEntries.filter((f) => f.paymentStatus === 'Pending');

  const collectedAmount = paidEntries.reduce((sum, f) => sum + f.finalPayableAmount, 0);
  const pendingAmount = pendingEntries.reduce((sum, f) => sum + f.finalPayableAmount, 0);
  const collectionRate = totalPayable > 0 ? (collectedAmount / totalPayable) * 100 : 0;

  const handleOpenPaymentModal = (flat: FlatBillEntry) => {
    setPaymentModalFlat(flat);
    setPayStatus(flat.paymentStatus);
    setPayMode((flat.paymentMode as any) || 'UPI');
    setPayDate(flat.paymentDate || new Date().toISOString().slice(0, 10));
    setPayNotes(flat.paymentNotes || '');
  };

  const handleSavePaymentModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalFlat) return;

    onUpdateFlatPayment(
      activeBill.id,
      paymentModalFlat.flatId,
      payStatus,
      payStatus === 'Paid' ? payMode : undefined,
      payStatus === 'Paid' ? payDate : undefined,
      payNotes
    );
    setPaymentModalFlat(null);
  };

  return (
    <div className="space-y-5 pb-24 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">
                Payment Tracking & Analytics
              </span>
              <span className="text-xs text-slate-400">{building.name}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">
              Monthly Dues & Collection Report
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Bill Month Selector */}
            {bills.length > 1 && (
              <select
                value={selectedBillId}
                onChange={(e) => setSelectedBillId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 outline-none"
              >
                {bills.map((b) => (
                  <option key={b.id} value={b.id}>
                    {formatBillingMonth(b.billingMonth)}
                  </option>
                ))}
              </select>
            )}

            <button
              onClick={() => generateMonthlySummaryPdf(building, activeBill)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Download Report PDF"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Report PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
              title="Print Report"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards: Total Billed, Collected, Pending */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750">
            <span className="text-xs text-slate-400 block">Total Billed Amount</span>
            <span className="text-xl font-bold text-white mt-0.5 block">
              {formatCurrency(totalPayable)}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {activeBill.flatEntries.length} Flats ({formatBillingMonth(activeBill.billingMonth)})
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850 border border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-semibold">Total Collected</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">
              {formatCurrency(collectedAmount)}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {paidEntries.length} Flats Paid ({collectionRate.toFixed(1)}%)
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850 border border-amber-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs text-amber-400 font-semibold">Pending / Unpaid Dues</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xl font-bold text-amber-400 mt-0.5 block">
              {formatCurrency(pendingAmount)}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {pendingEntries.length} Flats Remaining
            </span>
          </div>
        </div>

        {/* Collection Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Payment Recovery Progress</span>
            <span className="font-bold text-cyan-400">{collectionRate.toFixed(1)}%</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              style={{ width: `${Math.min(100, collectionRate)}%` }}
              className="bg-emerald-500 h-full transition-all"
            ></div>
          </div>
        </div>
      </div>

      {/* Flat Payment Status Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Flat Payment Ledger</h3>
          <span className="text-xs text-slate-400">Click any row to update payment mode/date</span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="bg-slate-800 text-slate-200 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Flat</th>
                <th className="py-2.5 px-2">Tenant Name</th>
                <th className="py-2.5 px-2">Units</th>
                <th className="py-2.5 px-2">Amount</th>
                <th className="py-2.5 px-2 text-center">Status</th>
                <th className="py-2.5 px-2">Payment Mode</th>
                <th className="py-2.5 px-2">Date</th>
                <th className="py-2.5 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {activeBill.flatEntries.map((row) => (
                <tr key={row.flatId} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-white">Flat {row.flatNumber}</td>
                  <td className="py-2.5 px-2">{row.tenantName}</td>
                  <td className="py-2.5 px-2 font-mono">{formatUnits(row.usedUnits)} U</td>
                  <td className="py-2.5 px-2 font-mono font-bold text-emerald-400">
                    {formatCurrency(row.finalPayableAmount)}
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${
                        row.paymentStatus === 'Paid'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {row.paymentStatus === 'Paid' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Paid
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3" /> Pending
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-slate-300">
                    {row.paymentStatus === 'Paid' ? row.paymentMode || 'Cash' : '—'}
                  </td>
                  <td className="py-2.5 px-2 text-slate-400">
                    {row.paymentStatus === 'Paid' ? row.paymentDate || '—' : '—'}
                  </td>
                  <td className="py-2.5 px-2 text-right">
                    <button
                      onClick={() => handleOpenPaymentModal(row)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold border border-slate-700"
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Update Modal */}
      {paymentModalFlat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form
            onSubmit={handleSavePaymentModal}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl"
          >
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Record Payment - Flat {paymentModalFlat.flatNumber}
              </h3>
              <p className="text-xs text-slate-400">
                {paymentModalFlat.tenantName} • Amount:{' '}
                <strong className="text-emerald-400">
                  {formatCurrency(paymentModalFlat.finalPayableAmount)}
                </strong>
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Payment Status</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayStatus('Paid')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      payStatus === 'Paid'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    ✓ Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayStatus('Pending')}
                    className={`py-2 rounded-xl font-bold border transition ${
                      payStatus === 'Pending'
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    ⏳ Pending
                  </button>
                </div>
              </div>

              {payStatus === 'Paid' && (
                <>
                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Payment Mode</label>
                    <select
                      value={payMode}
                      onChange={(e: any) => setPayMode(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none"
                    >
                      <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                      <option value="Cash">Cash (नकद)</option>
                      <option value="Bank Transfer">Bank Transfer / NEFT / IMPS</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-medium">Payment Date</label>
                    <input
                      type="date"
                      value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Paid via PhonePe UTR #9281938"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentModalFlat(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow"
              >
                Save Payment Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
