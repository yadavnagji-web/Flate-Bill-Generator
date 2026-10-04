import React, { useState } from 'react';
import { FlatBillEntry, MonthlyBill, Building, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { generateWhatsAppMessage, formatCurrency, formatUnits, formatBillingMonth } from '../utils/calculator';
import {
  MessageSquare,
  Copy,
  Check,
  X,
  Share2,
  ExternalLink,
  Phone,
} from 'lucide-react';

interface WhatsAppShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  flatEntry: FlatBillEntry | null;
  bill: MonthlyBill | null;
  building: Building;
  language: Language;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  isOpen,
  onClose,
  flatEntry,
  bill,
  building,
  language,
}) => {
  const t = getTranslation(language);

  if (!isOpen || !flatEntry || !bill) return null;

  // Initial message text
  const defaultText = generateWhatsAppMessage(flatEntry, bill, building);
  const [messageText, setMessageText] = useState<string>(defaultText);
  const [isCopied, setIsCopied] = useState<boolean>(false);

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

  // Direct WhatsApp Share (wa.me link)
  const handleWhatsAppSend = () => {
    const cleanPhone = flatEntry.tenantMobile ? flatEntry.tenantMobile.replace(/\D/g, '') : '';
    // If phone has 10 digits (India), prefix 91 if not present
    let targetPhone = cleanPhone;
    if (targetPhone.length === 10) {
      targetPhone = `91${targetPhone}`;
    }

    const encodedMsg = encodeURIComponent(messageText);
    const waUrl = targetPhone
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encodedMsg}`
      : `https://api.whatsapp.com/send?text=${encodedMsg}`;

    window.open(waUrl, '_blank');
  };

  // Native Web Share API if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Flat ${flatEntry.flatNumber} Electricity Bill - ${formatBillingMonth(bill.billingMonth)}`,
          text: messageText,
        });
      } catch (err) {
        console.warn('Native share dismissed or failed', err);
      }
    } else {
      handleWhatsAppSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Share Bill via WhatsApp
              </h3>
              <p className="text-xs text-slate-400">
                Flat {flatEntry.flatNumber} • {flatEntry.tenantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant contact preview */}
        <div className="flex items-center justify-between bg-slate-850 p-2.5 rounded-xl border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Phone className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mobile: <strong>{flatEntry.tenantMobile || 'Not entered'}</strong></span>
          </div>
          <span className="font-bold text-emerald-400 font-mono text-sm">
            {formatCurrency(flatEntry.finalPayableAmount)}
          </span>
        </div>

        {/* Message preview / editable box */}
        <div className="space-y-1">
          <label className="block text-xs text-slate-400 font-medium">
            WhatsApp Message Preview (Editable):
          </label>
          <textarea
            rows={10}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 rounded-xl p-3 outline-none focus:border-cyan-400 leading-relaxed resize-none shadow-inner"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            {isCopied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Message</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleWhatsAppSend}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition"
          >
            <MessageSquare className="w-4 h-4 fill-white text-emerald-600" />
            <span>Open in WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full py-2 text-xs text-slate-400 hover:text-cyan-300 flex items-center justify-center gap-1.5 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Or use Device Native Share Sheet</span>
          </button>
        )}
      </div>
    </div>
  );
};
