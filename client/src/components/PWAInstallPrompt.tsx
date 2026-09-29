import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Check, Smartphone, Sparkles } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if already installed & running in standalone mode
    const checkStandalone = () => {
      try {
        const isStandaloneMode = 
          Boolean(window.matchMedia && window.matchMedia('(display-mode: standalone)')?.matches) ||
          (window.navigator as any)?.standalone === true ||
          Boolean(document.referrer && document.referrer.includes('android-app://'));
        setIsStandalone(Boolean(isStandaloneMode));
      } catch {
        setIsStandalone(false);
      }
    };
    checkStandalone();

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isAppleDevice);

    // 3. Listen for Android/Chrome beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 4. Listen for appinstalled
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  // If already running standalone or user dismissed banner, hide
  if (isStandalone || dismissed) {
    return null;
  }

  // If Android has deferredPrompt OR iOS device
  const canInstall = Boolean(deferredPrompt) || isIOS;
  if (!canInstall) return null;

  return (
    <>
      {/* Sleek Floating Install Banner */}
      <aside 
        aria-label="PWA Installation Prompt"
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/40 shadow-2xl shadow-indigo-950/60 backdrop-blur-md animate-in slide-in-from-bottom duration-300"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-[1.5px] shrink-0 shadow-md">
              <div className="w-full h-full bg-[#0d1424] rounded-[14px] flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-xs text-white">Install Class Accounting App</h4>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">PWA</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                {isIOS 
                  ? 'Add to iPhone / iPad Home Screen for full offline & camera scanner access.'
                  : 'Fast 1-click install for Android & Desktop without app stores.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400">Works 100% offline</span>
          <button
            onClick={handleInstallClick}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all shrink-0"
          >
            <Download size={14} />
            <span>{isIOS ? 'How to Install on iPhone' : 'Install App'}</span>
          </button>
        </div>
      </aside>

      {/* iOS Safari Home Screen Installation Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-400" />
                <h3 className="font-bold text-sm text-white">Install on iPhone / iPad</h3>
              </div>
              <button 
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Apple Safari does not require the App Store. You can add Class Accounting directly to your iPhone Home Screen in 3 quick steps:
            </p>

            <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>Tap Share Button</span>
                    <Share2 size={13} className="text-blue-400" />
                  </p>
                  <p className="text-[11px] text-slate-400">At the bottom of your Safari browser bar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>Select 'Add to Home Screen'</span>
                    <PlusSquare size={13} className="text-purple-400" />
                  </p>
                  <p className="text-[11px] text-slate-400">Scroll down the share sheet and tap the plus icon.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>Tap 'Add' at top right</span>
                    <Check size={13} className="text-emerald-400" />
                  </p>
                  <p className="text-[11px] text-slate-400">The app icon will immediately appear on your home screen!</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
