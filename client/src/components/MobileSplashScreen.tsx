import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

interface MobileSplashScreenProps {
  onFinish?: () => void;
}

export const MobileSplashScreen: React.FC<MobileSplashScreenProps> = ({ onFinish }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        setVisible(false);
        if (onFinish) onFinish();
      }, 350);
    }, 900);

    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-[#0055FF] text-white p-8 transition-opacity duration-350 select-none ${fading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="w-full" />

      {/* Center Brand & Logo matching Vibrant Royal Blue Theme */}
      <div className="flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-500">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-[#5B8DEF] border-2 border-white/30 flex flex-col items-center justify-center shadow-2xl overflow-hidden">
            <Users className="w-10 h-10 text-white" />
            <div className="w-full bg-white/25 text-[9px] font-black tracking-widest py-0.5 mt-1">
              CAMS
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 ring-4 ring-[#0055FF]" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Apex Academy
          </h1>
          <p className="text-xs font-semibold text-blue-100 tracking-wide mt-1">
            Parent Portal & Smart Class System
          </p>
        </div>
      </div>

      {/* Bottom Startup Progress */}
      <div className="w-full max-w-xs flex flex-col items-center space-y-2.5 pb-6">
        <div className="w-44 h-1.5 bg-white/25 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full animate-[progress_1s_ease-in-out_infinite]" style={{ width: '75%' }} />
        </div>
        <p className="text-[11px] text-blue-100 font-medium">Loading Smart Portal...</p>
      </div>
    </div>
  );
};
