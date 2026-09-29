import React, { useState } from 'react';
import { 
  X, 
  Radio, 
  Laptop, 
  Smartphone, 
  Network, 
  CheckCircle2, 
  HelpCircle, 
  ExternalLink,
  Zap,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { useRFIDReader } from '../utils/useRFIDReader';
import { apiRequest } from '../api';

interface RFIDGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RFIDGuideModal: React.FC<RFIDGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'windows' | 'multi_pc' | 'android' | 'tester'>('windows');
  const [testScannedTag, setTestScannedTag] = useState<string>('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Live tester listener
  useRFIDReader({
    enabled: isOpen && activeTab === 'tester',
    onScan: async (tag) => {
      setTestScannedTag(tag);
      setTesting(true);
      try {
        const res = await apiRequest(`/students/rfid-lookup/${encodeURIComponent(tag)}`);
        setTestResult(res);
      } catch (err: any) {
        setTestResult({ error: err.message || `No student currently linked to RFID UID: ${tag}` });
      } finally {
        setTesting(false);
      }
    }
  });

  if (!isOpen) return null;

  const currentHost = window.location.hostname;
  const currentPort = window.location.port ? `:${window.location.port}` : '';
  const lanUrl = `http://${currentHost}${currentPort}`;

  const copyLanUrl = () => {
    navigator.clipboard.writeText(lanUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-brand-950 text-white p-5 sm:p-6 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300 shadow-inner">
              <Radio size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">125kHz HID RFID Reader Guide</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Hardware Ready
                </span>
              </div>
              <p className="text-xs text-brand-200/80 mt-0.5">Windows PC/Laptops • Multi-Station LAN • Android USB-C OTG</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-white/10 pt-4 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('windows')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'windows' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Laptop size={14} />
              <span>1. Windows PC/Laptop</span>
            </button>
            <button
              onClick={() => setActiveTab('multi_pc')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'multi_pc' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Network size={14} />
              <span>2. Multi-PC (3 Stations)</span>
            </button>
            <button
              onClick={() => setActiveTab('android')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'android' ? 'bg-white text-slate-900 shadow-md' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Smartphone size={14} />
              <span>3. Android USB-C</span>
            </button>
            <button
              onClick={() => setActiveTab('tester')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                activeTab === 'tester' ? 'bg-brand-400 text-slate-950 font-black shadow-md' : 'bg-brand-500/30 text-brand-200 hover:bg-brand-500/40'
              }`}
            >
              <Zap size={14} />
              <span>Live Card Diagnostic</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs sm:text-sm">
          {/* TAB 1: WINDOWS PC/LAPTOP */}
          {activeTab === 'windows' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-brand-50 border border-brand-100 flex items-start gap-3">
                <ShieldCheck size={20} className="text-brand-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-brand-900">Zero-Driver Plug & Play</h4>
                  <p className="text-xs text-brand-700 mt-0.5">
                    Standard 125kHz USB RFID readers (EM4100 / TK4100 / R65D / Sycreader) use USB HID Keyboard Emulation. Windows 10 & 11 detect them automatically without any drivers or special software.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">How to Connect & Test on Windows:</h4>
                <ol className="list-decimal list-inside space-y-2 text-xs leading-relaxed text-slate-600 pl-1">
                  <li>
                    <strong className="text-slate-800">Plug into USB Port:</strong> Insert the USB cable into any USB-A or USB-C port on your Windows PC or laptop.
                  </li>
                  <li>
                    <strong className="text-slate-800">Hardware Confirmation:</strong> The reader will beep once and its status LED will turn red or green.
                  </li>
                  <li>
                    <strong className="text-slate-800">Automatic Background Listening:</strong> Open the <strong>Attendance</strong> screen in CAMS. Our Global RFID wedge listener runs continuously in the background.
                  </li>
                  <li>
                    <strong className="text-slate-800">Tap Card or Keyfob:</strong> Hold any 125kHz card within 5-8 cm of the reader. The reader beeps, transmits the 10-digit UID, and CAMS marks attendance instantly with a chime!
                  </li>
                </ol>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500">
                💡 <strong>Tip:</strong> You do <em>not</em> need to click inside any text box. You can be anywhere on the Attendance screen and simply tap the card.
              </div>
            </div>
          )}

          {/* TAB 2: MULTI-PC SETUP (3 WINDOWS STATIONS) */}
          {activeTab === 'multi_pc' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3">
                <Network size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-indigo-900">Connecting 3 Windows PCs / Laptops on Local Network</h4>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Run the main server on one PC (Host), and connect up to 3 or more PCs/laptops (e.g. Entrance Gate 1, Entrance Gate 2, Reception Desk) over your local Wi-Fi or LAN.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Step-by-Step Multi-Station Architecture:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="px-2 py-0.5 rounded-md bg-brand-100 text-brand-800 font-bold text-[10px]">PC 1 (Host Server)</span>
                    <p className="font-bold text-slate-800 text-xs mt-2">Central Database</p>
                    <p className="text-[11px] text-slate-500 mt-1">Runs `npm run dev` or production server. Connected to Wi-Fi/LAN router.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">PC 2 (Gate 1 Laptop)</span>
                    <p className="font-bold text-slate-800 text-xs mt-2">Entrance Station 1</p>
                    <p className="text-[11px] text-slate-500 mt-1">Plug 125kHz USB Reader into laptop. Opens CAMS URL in Chrome/Edge.</p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[10px]">PC 3 (Gate 2 Laptop)</span>
                    <p className="font-bold text-slate-800 text-xs mt-2">Entrance Station 2</p>
                    <p className="text-[11px] text-slate-500 mt-1">Plug 125kHz USB Reader into laptop. Fast concurrent student check-ins.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">Connect Other Laptops & Phones to this URL:</span>
                    <button 
                      onClick={copyLanUrl}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white flex items-center gap-1 transition-all"
                    >
                      {copiedUrl ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedUrl ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                  <p className="text-sm font-mono font-bold text-brand-300 break-all">{lanUrl}</p>
                  <p className="text-[11px] text-slate-400">
                    Make sure all 3 computers are connected to the same Wi-Fi router or office local network switch.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ANDROID USB-C → RFID */}
          {activeTab === 'android' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-3">
                <Smartphone size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900">Android Phone / Tablet USB-C RFID Setup</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Transform any Android phone or wall-mounted tablet into a mobile RFID scanning station using a standard USB-A to USB-C OTG adapter.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">How to Connect to Android:</h4>
                <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-600 pl-1">
                  <li>
                    <strong className="text-slate-800">Use a USB-C OTG Adapter:</strong> Plug your 125kHz RFID reader's USB-A plug into a USB-C OTG adapter, then plug it into your Android device.
                  </li>
                  <li>
                    <strong className="text-slate-800">Enable OTG in Android Settings (if required):</strong>
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] mt-1">
                      ⚠️ On devices by <strong>OnePlus, Oppo, Vivo, Realme</strong>: Go to Android <em>Settings &gt; System / Additional Settings &gt; OTG Connection</em> and turn it <strong>ON</strong>. (Samsung, Xiaomi, and Google Pixel enable OTG automatically).
                    </div>
                  </li>
                  <li>
                    <strong className="text-slate-800">Open CAMS on Android:</strong> Open Google Chrome on your phone/tablet and open CAMS (or tap "Install App" to add to Home Screen as a PWA).
                  </li>
                  <li>
                    <strong className="text-slate-800">Tap Any Card:</strong> When a card is tapped, Android sends the keystrokes directly into CAMS. Attendance is recorded instantly!
                  </li>
                  <li>
                    <strong className="text-slate-800">Offline Protection:</strong> Even if Wi-Fi drops at the entrance, Android saves scans locally and synchronizes automatically as soon as reconnected.
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: LIVE DIAGNOSTIC TESTER */}
          {activeTab === 'tester' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-400/40 flex items-center justify-center text-brand-300">
                    <Radio size={20} className="animate-pulse text-brand-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">Live RFID Reader Signal Detector</p>
                    <p className="text-[11px] text-slate-400">Tap any 125kHz card or keyfob on your USB reader right now!</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Listening...
                </span>
              </div>

              {/* Scanned Tag Display */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center text-center min-h-[160px]">
                {testScannedTag ? (
                  <div className="space-y-3 w-full max-w-sm">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detected Hardware Card UID</div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-brand-700 bg-white px-4 py-2 rounded-xl border border-brand-200 shadow-sm">
                      {testScannedTag}
                    </div>

                    {testing ? (
                      <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                        <RefreshCw size={12} className="animate-spin text-brand-600" />
                        <span>Verifying in CAMS database...</span>
                      </div>
                    ) : testResult?.found ? (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-left flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">{testResult.fullName} ({testResult.studentIdNumber})</p>
                          <p className="text-[11px] text-emerald-700 mt-0.5">{testResult.grade} • Status: {testResult.status}</p>
                          <p className="text-[10px] text-emerald-600 font-mono mt-0.5">UID: {testResult.rfidTag}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                        ⚠️ Card UID <strong>{testScannedTag}</strong> is detected, but not yet linked to any student. Go to <strong>Students</strong> to bind this card!
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 mx-auto shadow-sm border border-slate-200">
                      <Radio size={24} />
                    </div>
                    <p className="text-xs font-bold text-slate-700">Waiting for Card Tap...</p>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Hold a 125kHz RFID card or keyfob to your USB reader on Windows PC or Android USB-C.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Radio size={14} className="text-emerald-500" />
            <span>USB HID Keyboard Wedge (125kHz EM4100 / TK4100 Compatible)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
