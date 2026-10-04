import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Check, Smartphone, Building2 } from 'lucide-react';

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
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-40 p-4 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-300 select-none"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-brand-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="font-bold text-xs text-white">Install Campus Portal</h4>
                <span className="px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 text-[9px] font-bold">PWA</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                {isIOS 
                  ? 'Add to iOS Home Screen for instant offline & camera access.'
                  : 'Fast 1-click install for Android & Windows desktop.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400 font-medium">Offline capable</span>
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer active:scale-98"
          >
            <Download size={13} />
            <span>{isIOS ? 'Install on iPhone' : 'Install App'}</span>
          </button>
        </div>
      </aside>

      {/* iOS Safari Home Screen Installation Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-brand-400" />
                <h3 className="font-bold text-sm text-white">Install on iPhone / iPad</h3>
              </div>
              <button 
                onClick={() => setShowIOSModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Add the Class Accounting Portal to your iOS Home Screen in 3 simple steps:
            </p>

            <div className="space-y-3 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-brand-400 font-bold flex items-center justify-center shrink-0 text-[10px] border border-slate-700">1</span>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>Tap Share Button</span>
                    <Share2 size={13} className="text-blue-400" />
                  </p>
                  <p className="text-[11px] text-slate-400">At the bottom of your Safari browser bar.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-brand-400 font-bold flex items-center justify-center shrink-0 text-[10px] border border-slate-700">2</span>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>Select 'Add to Home Screen'</span>
                    <PlusSquare size={13} className="text-slate-300" />
                  </p>
                  <p className="text-[11px] text-slate-400">Scroll down and tap 'Add to Home Screen'.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[10px] border border-slate-700">3</span>
                <div>
                  <p className="font-bold text-white flex items-center gap-1.5">
                    <span>Tap 'Add'</span>
                    <Check size={13} className="text-emerald-400" />
                  </p>
                  <p className="text-[11px] text-slate-400">The app icon is now available on your home screen.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
