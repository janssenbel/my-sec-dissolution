import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Share, PlusSquare, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        type="button"
        className="min-h-[40px] px-3 py-1.5 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
        title="Install SEC Docs App to your Home Screen"
      >
        <Smartphone className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Add App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          type="button"
          className="min-h-[40px] px-3 py-1.5 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
          title="Add to iPhone Home Screen"
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Add to iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-4 duration-150">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={`${import.meta.env.BASE_URL}apple-touch-icon.png`}
                    alt="SEC Docs Icon"
                    referrerPolicy="no-referrer"
                    className="w-11 h-11 rounded-xl shadow-xs"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Add to Home Screen
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Install on iPhone or iPad
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  type="button"
                  className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4" />
                  </div>
                  <span>
                    1. Tap the <strong>Share</strong> button at the bottom of Safari.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <span>
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                type="button"
                className="mt-5 w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
