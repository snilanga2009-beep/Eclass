import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface MobileSplashScreenProps {
  onFinish?: () => void;
}

export const MobileSplashScreen: React.FC<MobileSplashScreenProps> = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Only show on first launch or reload
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        setVisible(false);
        if (onFinish) onFinish();
      }, 400);
    }, 1100);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-gradient-to-b from-[#0b111e] via-[#0f172a] to-[#070b13] text-white p-8 transition-opacity duration-400 ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="w-full" />

      {/* Center Brand & Logo */}
      <div className="flex flex-col items-center text-center space-y-5 animate-in zoom-in-95 duration-500">
        <div className="relative">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 p-[2px] shadow-2xl shadow-indigo-500/40">
            <div className="w-full h-full bg-[#0d1424] rounded-[22px] flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#0b111e] animate-ping" />
          <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-4 border-[#0b111e]" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Class Accounting
          </h1>
          <p className="text-xs font-semibold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-pink-400 uppercase tracking-widest mt-1">
            Student • Attendance • Fees • Accounting
          </p>
        </div>
      </div>

      {/* Bottom Startup Progress */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-3 pb-6">
        <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full animate-[progress_1s_ease-in-out_infinite]" style={{ width: '70%' }} />
        </div>
        <p className="text-[11px] text-slate-400 font-mono">Launching Standalone PWA...</p>
      </div>
    </div>
  );
};
