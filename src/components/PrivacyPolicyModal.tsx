import React, { useState } from 'react';
import { X, ShieldCheck, Lock, Camera, HardDrive, Cpu, ExternalLink, Copy, Check } from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const privacyUrl = typeof window !== 'undefined' ? `${window.location.origin}/privacy-policy` : '/privacy-policy';

  const handleCopy = () => {
    navigator.clipboard.writeText(privacyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Privacy Policy & Data Security</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex items-start gap-2.5">
            <HardDrive className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">1. Local Storage on Device</strong>
              All building records, sub-meter readings, tenant names, mobile numbers, and calculation records are stored directly in your local browser storage.
            </div>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex items-start gap-2.5">
            <Camera className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">2. Camera & Photo Permissions</strong>
              Camera and gallery access permissions are requested solely for capturing photos of the official AVVNL electricity bills. The application does not access your personal photo library without your explicit selection.
            </div>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex items-start gap-2.5">
            <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">3. AI OCR Bill Extraction</strong>
              When scanning a bill photo, the image is passed securely to the optical character recognition model to extract the billed units, tariff breakdown, and total amounts. No sensitive personal sub-meter data is sent.
            </div>
          </div>

          <div className="p-3 bg-slate-850 rounded-xl border border-slate-800 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">4. Complete User Control</strong>
              You can export or backup your entire database at any time from the Settings menu as a portable JSON file, and restore or erase it at will.
            </div>
          </div>
        </div>

        {/* Public Play Store URL Box */}
        <div className="p-3 bg-slate-950 rounded-xl border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-cyan-400">
              🌐 Google Play Store Privacy Policy Link:
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={privacyUrl}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-slate-300 select-all"
            />
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 shrink-0"
              title="Open Privacy Policy in New Tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800 flex justify-end gap-2">
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Public Page</span>
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
