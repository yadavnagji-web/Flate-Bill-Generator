import React, { useState } from 'react';
import { usePWAInstall } from '../utils/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed or running standalone, hide the button
  if (isInstalled) {
    return null;
  }

  // Android / Chrome / Windows / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md transition animate-pulse"
        title="Install Sub Meter Bill Generator App on your device"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-cyan-500/40 text-xs font-semibold transition"
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-left">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="font-bold text-cyan-400">1.</span>
                  <span>Safari ब्राउज़र के निचले बार में <strong>Share (शेयर)</strong> बटन दबाएं।</span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="font-bold text-cyan-400">2.</span>
                  <span>नीचे स्क्रॉल करके <strong>Add to Home Screen (होम स्क्रीन में जोड़ें)</strong> चुनें।</span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
                  <span className="font-bold text-cyan-400">3.</span>
                  <span>ऊपर दाईं ओर <strong>Add (जोड़ें)</strong> पर टैप करें। ऐप फोन में इंस्टॉल हो जाएगा!</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
