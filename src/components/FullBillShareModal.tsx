import React, { useState } from 'react';
import { MonthlyBill, Building, Language } from '../types';
import {
  generateFullBillWhatsAppMessage,
  formatPdfAmount,
  formatUnits,
  formatCurrency,
  formatBillingMonth,
} from '../utils/calculator';
import { generateAllFlatsCombinedPdf, generateFullBillPdfWithHindi } from '../utils/pdfGenerator';
import {
  MessageSquare,
  Copy,
  Check,
  X,
  Share2,
  Download,
  Printer,
  FileText,
  Sparkles,
  Loader2,
} from 'lucide-react';

interface FullBillShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: MonthlyBill | null;
  building: Building;
  language: Language;
}

export const FullBillShareModal: React.FC<FullBillShareModalProps> = ({
  isOpen,
  onClose,
  bill,
  building,
  language,
}) => {
  if (!isOpen || !bill) return null;

  const defaultText = generateFullBillWhatsAppMessage(building, bill);
  const [messageText, setMessageText] = useState<string>(defaultText);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isGeneratingHindiPdf, setIsGeneratingHindiPdf] = useState<boolean>(false);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard write error:', err);
    }
  };

  // Direct WhatsApp Share (wa.me)
  const handleWhatsAppSend = () => {
    const encodedMsg = encodeURIComponent(messageText);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedMsg}`;
    window.open(waUrl, '_blank');
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${building.name} - ${formatBillingMonth(bill.billingMonth)} Electricity Bill`,
          text: messageText,
        });
      } catch (err) {
        console.warn('Native share dismissed', err);
      }
    } else {
      handleCopy();
    }
  };

  // Generate Hindi PDF
  const handleDownloadHindiPdf = async () => {
    setIsGeneratingHindiPdf(true);
    try {
      await generateFullBillPdfWithHindi(building, bill);
    } catch (err) {
      console.error('Error generating Hindi PDF:', err);
      // Fallback to standard PDF
      generateAllFlatsCombinedPdf(building, bill);
    } finally {
      setIsGeneratingHindiPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Share Full Bill (पूरा बिल शेयर करें)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {formatBillingMonth(bill.billingMonth)}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {building.name} • {bill.flatEntries.length} Flats • Total: Rs. {formatPdfAmount(bill.totalAvvnlBillAmount)}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {/* 1. WhatsApp Button */}
            <button
              type="button"
              onClick={handleWhatsAppSend}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-950/40 transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>WhatsApp Share</span>
            </button>

            {/* 2. Copy Text */}
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
              <span>{isCopied ? 'Copied! (कॉपी)' : 'Copy Text (कॉपी)'}</span>
            </button>

            {/* 3. Clean PDF */}
            <button
              type="button"
              disabled={isGeneratingHindiPdf}
              onClick={handleDownloadHindiPdf}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold shadow-md transition"
              title="Download clean simple PDF with proper month and fonts"
            >
              {isGeneratingHindiPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              <span>Clean PDF (हिंदी/Eng)</span>
            </button>

            {/* 4. Standard PDF (Clean simple amounts) */}
            <button
              type="button"
              onClick={() => generateAllFlatsCombinedPdf(building, bill)}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition"
              title="Standard PDF without any broken symbols"
            >
              <Download className="w-4 h-4 text-slate-300" />
              <span>Standard PDF</span>
            </button>
          </div>

          {/* Key Summary Badges */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center text-xs">
            <div>
              <div className="text-slate-400 text-[11px]">
                Total {bill.discomName ? `${bill.discomName} ` : ''}Bill
              </div>
              <div className="text-amber-400 font-bold text-sm">Rs. {formatPdfAmount(bill.totalAvvnlBillAmount)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Total Units</div>
              <div className="text-cyan-400 font-bold text-sm">{formatUnits(bill.totalAvvnlBilledUnits)} U</div>
            </div>
            <div>
              <div className="text-slate-400 text-[11px]">Per Unit Rate</div>
              <div className="text-emerald-400 font-bold text-sm">Rs. {bill.calculations.perUnitRate.toFixed(2)}</div>
            </div>
          </div>

          {/* Editable WhatsApp Text Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <label className="font-semibold text-slate-300">
                Full Bill Message Preview (मैसेज एडिट कर सकते हैं):
              </label>
              <button
                type="button"
                onClick={() => setMessageText(defaultText)}
                className="text-cyan-400 hover:underline text-[11px]"
              >
                Reset to Default
              </button>
            </div>
            <textarea
              rows={12}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed outline-none focus:border-cyan-400 transition"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-850 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400 hidden sm:block">
            Supports WhatsApp Web, Mobile App & Group sharing
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share App</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppSend}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition shadow-lg shadow-emerald-950/50"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send on WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
