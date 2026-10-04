import React, { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

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
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-slate-950 text-white p-8 transition-opacity duration-400 select-none ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="w-full" />

      {/* Center Brand & Logo */}
      <div className="flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-500">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shadow-xl">
            <Building2 className="w-10 h-10 text-brand-400" />
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-slate-950" />
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
            Apex Academy ERP
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
            Class Accounting & Front Office Portal
          </p>
        </div>
      </div>

      {/* Bottom Startup Progress */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-2.5 pb-6">
        <div className="w-44 h-1 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-brand-500 rounded-full animate-[progress_1s_ease-in-out_infinite]" style={{ width: '75%' }} />
        </div>
        <p className="text-[11px] text-slate-500 font-mono">Initializing System...</p>
      </div>
    </div>
  );
};
