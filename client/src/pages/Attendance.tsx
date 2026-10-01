import React, { useState, useEffect, useRef } from 'react';
import { 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  Camera, 
  RefreshCw, 
  Clock, 
  Users, 
  Calendar, 
  Wifi, 
  WifiOff, 
  Check, 
  X, 
  Volume2, 
  SwitchCamera, 
  Smartphone,
  Radio,
  Laptop,
  HelpCircle,
  Zap,
  CreditCard
} from 'lucide-react';
import { apiRequest, formatDate, formatLKR } from '../api';
import confetti from 'canvas-confetti';
import { Html5Qrcode } from 'html5-qrcode';
import { QRScannerModal } from '../components/QRScannerModal';
import { decodeQRFromFile } from '../utils/qrScanner';
import { useRFIDReader } from '../utils/useRFIDReader';
import { RFIDGuideModal } from '../components/RFIDGuideModal';

interface AttendanceProps {
  onOpenStudentProfile: (studentId: string) => void;
  autoOpenScanner?: boolean;
  onOpenPaymentModal?: (studentId: string, feeRecordId?: string) => void;
}

export const Attendance: React.FC<AttendanceProps> = ({ 
  onOpenStudentProfile, 
  autoOpenScanner = false,
  onOpenPaymentModal 
}) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [mode, setMode] = useState<'QR_SCANNER' | 'MANUAL_SHEET'>('QR_SCANNER');
  const [manualSheetData, setManualSheetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [feePromptStudent, setFeePromptStudent] = useState<{
    id: string;
    fullName: string;
    studentIdNumber?: string;
    parentPhone?: string;
    hasPendingFees: boolean;
    remainingBalance: number;
    feeRecordId?: string;
  } | null>(null);

  // RFID Hardware State (USB 125kHz HID & Android USB-C)
  const [isRFIDGuideOpen, setIsRFIDGuideOpen] = useState(false);
  const [rfidActive, setRfidActive] = useState(true);
  const [lastRfidTag, setLastRfidTag] = useState<string | null>(null);

  // QR Scanner States
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(autoOpenScanner);
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Offline Attendance Queue
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('cams_offline_attendance');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    apiRequest<any[]>('/attendance/today-classes').then(res => {
      setClasses(res || []);
      if (res && res.length > 0) {
        setSelectedClassId(res[0].id);
      }
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Web Audio API Synthesizer for instant POS scan beeps
  const playBeep = (type: 'SUCCESS' | 'WARN' | 'ERROR') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'SUCCESS') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitch A5
        osc.frequency.setValueAtTime(1174, audioCtx.currentTime + 0.08); // D6
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.2);
      } else if (type === 'WARN') {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.3);
      }
    } catch {
      // Audio context might be restricted before interaction
    }
  };

  // Perform QR or RFID scan evaluation
  const handlePerformScan = async (tokenToScan?: string, scanMethod: string = 'QR_CODE'): Promise<any> => {
    const token = tokenToScan || qrInput.trim();
    if (!token || !selectedClassId) return null;

    setScanLoading(true);

    // If offline, store in offline queue
    if (!navigator.onLine) {
      const offlineItem = {
        qrToken: token,
        rfidTag: scanMethod === 'RFID' ? token : undefined,
        classId: selectedClassId,
        date: selectedDate,
        scannedAt: new Date().toISOString(),
        method: scanMethod
      };
      const updatedQueue = [...offlineQueue, offlineItem];
      setOfflineQueue(updatedQueue);
      localStorage.setItem('cams_offline_attendance', JSON.stringify(updatedQueue));
      playBeep('SUCCESS');
      const offRes = {
        scanResult: 'OFFLINE_SAVED',
        method: scanMethod,
        message: `Offline Scan Stored (${scanMethod}). UID/ID: ${token}. Will synchronize automatically when connected.`,
        student: { fullName: 'Student Scanned (Offline Mode)', studentIdNumber: token }
      };
      setScanResult(offRes);
      setQrInput('');
      setScanLoading(false);
      return offRes;
    }

    try {
      const res = await apiRequest('/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: token,
          rfidTag: scanMethod === 'RFID' ? token : undefined,
          classId: selectedClassId,
          date: selectedDate,
          method: scanMethod
        })
      });

      setScanResult({ ...res, method: scanMethod });

      if (res.scanResult === 'SUCCESS') {
        playBeep('SUCCESS');
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.5 } });
      } else if (res.scanResult === 'ALREADY_RECORDED') {
        playBeep('WARN');
      } else {
        playBeep('ERROR');
      }

      setQrInput('');
      return res;
    } catch (err: any) {
      playBeep('ERROR');
      const errRes = {
        scanResult: 'ERROR',
        method: scanMethod,
        message: err.message || 'Verification failed. Student not enrolled or invalid code.'
      };
      setScanResult(errRes);
      return errRes;
    } finally {
      setScanLoading(false);
    }
  };

  // Global USB 125kHz HID & Android USB-C RFID Reader Listener
  const { simulateScan } = useRFIDReader({
    enabled: mode === 'QR_SCANNER' && rfidActive,
    onScan: (tag) => {
      setLastRfidTag(tag);
      handlePerformScan(tag, 'RFID');
    }
  });

  // Handle QR code scanning directly from captured phone camera photo (works on Android & iPhone)
  const handleScanFromPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanLoading(true);
    setCameraError(null);
    try {
      const decodedText = await decodeQRFromFile(file);
      await handlePerformScan(decodedText);
    } catch (err: any) {
      console.warn('QR scan from photo failed:', err);
      playBeep('ERROR');
      setCameraError(err.message || 'Could not detect a valid QR code in the captured photo. Please make sure the QR code is centered and clearly focused, or enter the Student ID manually.');
    } finally {
      setScanLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  const triggerPhoneCameraSnap = () => {
    setCameraError(null);
    fileInputRef.current?.click();
  };

  // Live Phone Camera Handler via Html5Qrcode
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    // Check if getUserMedia is supported in the current browser/context
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Live camera video stream requires HTTPS or localhost on mobile. Tap "📸 Snap QR with Phone Camera" below to use your phone camera directly!');
      return;
    }

    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        await html5QrCodeRef.current.stop();
      }

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('mobile-qr-reader');
      }

      await html5QrCodeRef.current.start(
        { facingMode: facing },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          handlePerformScan(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );
      setCameraActive(true);
      setCameraFacing(facing);
    } catch (err: any) {
      console.error('Camera activation error:', err);
      setCameraError('Camera access denied or unavailable. Tap "📸 Snap QR with Phone Camera" below to capture with your phone camera directly!');
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }
    setCameraActive(false);
  };

  const switchCamera = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    await stopCamera();
    setTimeout(() => {
      startCamera(nextFacing);
    }, 200);
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // Sync offline captured scans
  const handleSyncOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;
    try {
      const res = await apiRequest('/attendance/sync-offline', {
        method: 'POST',
        body: JSON.stringify({ queue: offlineQueue })
      });
      setOfflineQueue([]);
      localStorage.removeItem('cams_offline_attendance');
      alert(`Synchronized ${res.synced} offline attendances successfully! (${res.skipped} already marked).`);
    } catch (err) {
      alert('Failed to synchronize offline attendance queue.');
    }
  };

  // Load manual batch sheet
  const handleLoadManualSheet = async () => {
    if (!selectedClassId) return;
    setLoading(true);
    try {
      const res = await apiRequest(`/attendance/session/${selectedClassId}/${selectedDate}`);
      setManualSheetData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'MANUAL_SHEET') {
      handleLoadManualSheet();
    }
  }, [selectedClassId, selectedDate, mode]);

  // Mark all present in manual sheet
  const handleMarkAllPresent = async () => {
    if (!manualSheetData?.students) return;
    const records = manualSheetData.students.map((item: any) => ({
      studentId: item.student.id,
      status: 'PRESENT'
    }));

    try {
      await apiRequest('/attendance/batch', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClassId,
          date: selectedDate,
          records
        })
      });
      handleLoadManualSheet();
    } catch (err) {
      alert('Failed to update attendance');
    }
  };

  const handleUpdateSingleManual = async (studentId: string, status: string) => {
    try {
      await apiRequest('/attendance/batch', {
        method: 'POST',
        body: JSON.stringify({
          classId: selectedClassId,
          date: selectedDate,
          records: [{ studentId, status }]
        })
      });
      handleLoadManualSheet();

      // Prompt to ask: "Need to Collect Fee for this student?"
      const stuItem = manualSheetData?.students?.find((s: any) => s.student.id === studentId);
      if (stuItem) {
        setFeePromptStudent({
          id: stuItem.student.id,
          fullName: stuItem.student.fullName,
          studentIdNumber: stuItem.student.studentIdNumber,
          parentPhone: stuItem.student.parentPhone,
          hasPendingFees: !!stuItem.hasPendingFees,
          remainingBalance: stuItem.remainingBalance || 0
        });
      }
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const currentClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Attendance System</h1>
          <p className="text-xs text-slate-500 mt-0.5">High-speed mobile camera QR scanning, duplicate protection, and manual sheet logging</p>
        </div>

        <div className="flex items-center space-x-2">
          {/* Audio Beep Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              soundEnabled ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? 'Beep Sound Enabled' : 'Beep Sound Muted'}
          >
            <Volume2 size={16} className={soundEnabled ? 'text-brand-600' : 'text-slate-400'} />
            <span className="hidden sm:inline">{soundEnabled ? 'Sound ON' : 'Muted'}</span>
          </button>

          {/* Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setMode('QR_SCANNER')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'QR_SCANNER' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              QR Scanner
            </button>
            <button
              onClick={() => setMode('MANUAL_SHEET')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                mode === 'MANUAL_SHEET' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Manual Sheet
            </button>
          </div>
        </div>
      </div>

      {/* Class & Date Selector Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-semibold text-slate-800 focus:outline-none"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.dayOfWeek} {c.startTime}-{c.endTime})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Attendance Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Offline Queue Sync Indicator */}
        <div className="flex items-center space-x-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          {offlineQueue.length > 0 ? (
            <button
              onClick={handleSyncOfflineQueue}
              className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-amber-500/20 animate-pulse"
            >
              <RefreshCw size={14} />
              <span>Sync {offlineQueue.length} Offline Scans</span>
            </button>
          ) : (
            <div className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs font-medium">
              <Wifi size={14} className="text-emerald-500" />
              <span>Online & Synced</span>
            </div>
          )}
        </div>
      </div>

      {/* 125kHz USB HID RFID Reader Live Status & Diagnostic Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-md text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-brand-500/20 border border-brand-400/40 flex items-center justify-center text-brand-300 shrink-0 shadow-inner">
            <Radio size={22} className={rfidActive ? 'animate-pulse text-emerald-400' : 'text-slate-400'} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-white tracking-wide">USB 125kHz HID RFID Reader</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                rfidActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'
              }`}>
                {rfidActive ? '● LISTENING (WINDOWS & ANDROID USB-C)' : 'MUTED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {lastRfidTag ? (
                <span>Last Scanned UID: <strong className="font-mono text-emerald-400 font-bold">{lastRfidTag}</strong> (Recorded via RFID)</span>
              ) : (
                'Zero drivers required. Ready for card or keyfob tap on Windows PC/Laptop or Android USB-C OTG.'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Quick Hardware Simulator / Demo Buttons */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10 text-xs">
            <span className="text-[10px] text-brand-300 font-bold uppercase hidden sm:inline">Simulate Tap:</span>
            <button
              onClick={() => simulateScan('0004928101')}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-emerald-500/30 text-white font-mono text-[11px] font-bold transition-all"
              title="Simulate 125kHz Card Tap for Kasun Kalhara"
            >
              Card 101
            </button>
            <button
              onClick={() => simulateScan('0004928102')}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-emerald-500/30 text-white font-mono text-[11px] font-bold transition-all"
              title="Simulate 125kHz Card Tap for Sithum Dharmapala"
            >
              Card 102
            </button>
          </div>

          {/* Reader Guide Button */}
          <button
            onClick={() => setIsRFIDGuideOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/30 transition-all shrink-0"
          >
            <HelpCircle size={15} />
            <span>Setup &amp; LAN Guide</span>
          </button>
        </div>
      </div>

      {/* MODE 1: QR SCANNER (Mobile & Desk Camera) */}
      {mode === 'QR_SCANNER' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Scanner Input / Camera Box */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live QR Scanner</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  Fast Capture Mode
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">Scan Student ID Card or QR Token</h3>
              <p className="text-xs text-slate-500">Hold the student ID barcode / QR code to camera or type the Student ID.</p>
            </div>

            {/* Scanner Viewport / Live Phone Camera */}
            <div className="relative rounded-2xl bg-slate-900 border-2 border-dashed border-brand-500/50 flex flex-col items-center justify-center text-center text-white min-h-[220px] overflow-hidden">
              {/* HTML5 QR Code Video Anchor */}
              <div id="mobile-qr-reader" className={`w-full ${cameraActive ? 'block' : 'hidden'}`} />

              {!cameraActive && (
                <div className="p-6 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-brand-400 mb-3 backdrop-blur-sm border border-white/20">
                    <QrCode size={32} />
                  </div>
                  <p className="text-xs font-bold text-white">Mobile Camera QR Scanner Ready</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">Tap below to activate phone camera or scan using barcode scanner</p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-1">Accepts: CAMS-STU-XXXX or STU-2026-XXXX</p>
                </div>
              )}

              {cameraActive && (
                <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={switchCamera}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs"
                    title="Switch Front/Back Camera"
                  >
                    <SwitchCamera size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="p-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white text-xs"
                    title="Stop Camera"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Hidden Native Phone Camera Photo Capture Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleScanFromPhoto}
              className="hidden"
            />

            {/* Camera Error Alert if Permission Denied */}
            {cameraError && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Camera Guidance</p>
                    <p className="text-[11px] text-amber-800 mt-0.5">{cameraError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={triggerPhoneCameraSnap}
                  className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                >
                  <Camera size={14} />
                  <span>Open Phone Camera (Take Photo)</span>
                </button>
              </div>
            )}

            {/* Dual Camera Action Buttons (Popup Modal + Direct Snap + Live Stream) */}
            <div className="space-y-2">
              {/* PRIMARY PROMINENT: Dedicated Mobile Camera QR Scanner Popup */}
              <button
                type="button"
                onClick={() => setIsScannerModalOpen(true)}
                disabled={scanLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-bold shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Smartphone size={18} />
                <span>📱 Open Camera QR Scanner (Popup)</span>
              </button>

              {/* Direct Phone Camera Photo Snap (Works on all mobile devices & browsers) */}
              <button
                type="button"
                onClick={triggerPhoneCameraSnap}
                disabled={scanLoading}
                className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-200 transition-all"
              >
                <Camera size={16} className="text-slate-600" />
              </button>

              {/* Secondary: Continuous Live Video Stream (For desktop webcams or secure mobile contexts) */}
              <div>
                {!cameraActive ? (
                  <button
                    type="button"
                    onClick={() => startCamera()}
                    className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-all border border-slate-200"
                  >
                    <QrCode size={15} className="text-slate-500" />
                    <span>Start Continuous Video Stream</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <X size={16} />
                    <span>Close Live Video Stream</span>
                  </button>
                )}
              </div>
            </div>

            {/* Input Form & Quick Demo Trigger */}
            <div className="space-y-3 pt-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Scan barcode or enter Student ID (e.g. STU-2026-0001)..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handlePerformScan();
                    }
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-brand-500"
                />
                <button
                  onClick={() => handlePerformScan()}
                  disabled={scanLoading || !qrInput.trim()}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition-all"
                >
                  {scanLoading ? 'Checking...' : 'Check In'}
                </button>
              </div>

              {/* Fast Test Shortcut Pills */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px]">Quick Demo Scans:</span>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handlePerformScan('STU-2026-0001')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-[10px] font-mono font-semibold"
                  >
                    STU-2026-0001 (Kasun)
                  </button>
                  <button
                    onClick={() => handlePerformScan('STU-2026-0002')}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-[10px] font-mono font-semibold"
                  >
                    STU-2026-0002 (Nimali)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Real-time Scan Result Card Feedback (Requirement #24) */}
          <div className="space-y-4">
            {scanResult ? (
              <div className={`
                p-6 rounded-3xl border shadow-lg transition-all animate-in fade-in slide-in-from-bottom-3
                ${scanResult.scanResult === 'SUCCESS' ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' :
                  scanResult.scanResult === 'ALREADY_RECORDED' ? 'bg-amber-50/80 border-amber-300 text-amber-950' :
                  scanResult.scanResult === 'OFFLINE_SAVED' ? 'bg-blue-50/80 border-blue-300 text-blue-950' :
                  'bg-rose-50/80 border-rose-300 text-rose-950'}
              `}>
                <div className="flex items-center justify-between pb-3 border-b border-black/10">
                  <div className="flex items-center space-x-2">
                    {scanResult.scanResult === 'SUCCESS' && <CheckCircle2 size={22} className="text-emerald-600" />}
                    {scanResult.scanResult === 'ALREADY_RECORDED' && <AlertTriangle size={22} className="text-amber-600" />}
                    {scanResult.scanResult === 'OFFLINE_SAVED' && <WifiOff size={22} className="text-blue-600" />}
                    {scanResult.scanResult === 'ERROR' && <AlertCircle size={22} className="text-rose-600" />}
                    
                    <span className="font-extrabold text-sm uppercase tracking-wider">
                      {scanResult.scanResult === 'SUCCESS' ? 'GREEN: Recorded Present' :
                       scanResult.scanResult === 'ALREADY_RECORDED' ? 'YELLOW: Already Marked Today' :
                       scanResult.scanResult === 'OFFLINE_SAVED' ? 'BLUE: Saved to Offline Queue' :
                       'RED: Attendance Error'}
                    </span>

                    {scanResult.method === 'RFID' ? (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-800 text-[10px] font-black flex items-center gap-1 border border-indigo-500/30">
                        <Radio size={11} className="text-indigo-600" />
                        <span>125kHz RFID</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center gap-1">
                        <QrCode size={11} />
                        <span>QR Code</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-slate-500">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>

                <div className="py-4 flex items-center space-x-4">
                  {scanResult.student?.photo && (
                    <img 
                      src={scanResult.student.photo} 
                      alt="" 
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow-md shrink-0" 
                    />
                  )}
                  <div>
                    <h4 className="font-black text-lg text-slate-900">
                      {scanResult.student?.fullName || 'Unknown Student'}
                    </h4>
                    <p className="text-xs font-mono text-slate-600">
                      {scanResult.student?.studentIdNumber} • {scanResult.student?.grade || ''}
                    </p>
                    <p className="text-xs text-slate-700 mt-1 font-medium">
                      {scanResult.message}
                    </p>
                  </div>
                </div>

                {/* Interactive Fee Collection Decision Prompt */}
                {scanResult.student && (
                  <div className="mt-3 p-4 rounded-2xl bg-gradient-to-b from-amber-50 to-orange-50/70 border-2 border-amber-300 text-amber-950 text-xs space-y-3 shadow-md animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center border border-amber-500/30">
                          <CreditCard size={15} />
                        </div>
                        <span className="font-black text-xs uppercase tracking-wider text-amber-900">
                          Collect Class Fee Prompt
                        </span>
                      </div>

                      {(scanResult.hasPendingFees || (scanResult.pendingFees && scanResult.pendingFees.length > 0)) && (
                        <span className="font-black font-mono text-rose-700 text-xs bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-200">
                          Due: Rs. {Number(scanResult.totalPendingAmount || scanResult.feeWarning?.due || 0).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div>
                      <p className="font-extrabold text-sm text-slate-900">
                        Need to Collect Class Fee now for <span className="text-brand-700">{scanResult.student.fullName}</span>?
                      </p>
                      {!(scanResult.hasPendingFees || (scanResult.pendingFees && scanResult.pendingFees.length > 0)) && (
                        <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                          ✓ All regular monthly fees are clear. Settle advance or extra class?
                        </p>
                      )}
                    </div>

                    {/* Per-subject breakdown */}
                    {scanResult.pendingFees && scanResult.pendingFees.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-amber-200">
                        {scanResult.pendingFees.map((fee: any) => (
                          <div key={fee.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-amber-200 shadow-sm text-[11px]">
                            <div>
                              <p className="font-bold text-slate-800">{fee.className}</p>
                              <p className="text-[10px] text-slate-500 font-mono">Month: {fee.month}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-800">Rs. {Number(fee.remainingBalance).toLocaleString()}</span>
                              {onOpenPaymentModal && (
                                <button
                                  type="button"
                                  onClick={() => onOpenPaymentModal(scanResult.student.id, fee.id)}
                                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-sm transition-all"
                                >
                                  Pay
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Recipient parent SMS badge */}
                    {scanResult.student?.parentPhone && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-600 pt-1 border-t border-amber-200">
                        <Smartphone size={12} className="text-emerald-600 shrink-0" />
                        <span>Instant SMS receipt will be sent to Parent: <strong className="font-mono text-slate-900">{scanResult.student.parentPhone}</strong></span>
                      </div>
                    )}

                    {/* Action Decision Buttons */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const targetFeeId = scanResult.feeWarning?.feeRecordId || scanResult.pendingFees?.[0]?.id;
                          if (onOpenPaymentModal) {
                            onOpenPaymentModal(scanResult.student.id, targetFeeId);
                          }
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                      >
                        <Check size={15} />
                        <span>YES, Collect Fee</span>
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            alert(`Noted: Student ${scanResult.student?.fullName} marked to pay after class finishes.`);
                            setScanResult(null);
                          }}
                          className="py-2 px-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center space-x-1 transition-all active:scale-95"
                          title="Student will pay after class finishes"
                        >
                          <Clock size={13} className="text-amber-700" />
                          <span>⏰ Pay Later</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setScanResult(null)}
                          className="py-2 px-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1 transition-all active:scale-95"
                        >
                          <X size={13} />
                          <span>Dismiss</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full p-8 rounded-3xl bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-center text-slate-400 min-h-[280px]">
                <Clock size={36} className="text-slate-300 mb-2" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">Awaiting Scan</h4>
                <p className="text-xs max-w-xs mt-1">Scan student ID card to immediately view name, photo, status, and fee alert.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 2: MANUAL BATCH ATTENDANCE SHEET */}
      {mode === 'MANUAL_SHEET' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Class Attendance Sheet</h3>
              <p className="text-xs text-slate-500">
                {manualSheetData?.class?.name} • Total Roster: {manualSheetData?.students?.length || 0} Students
              </p>
            </div>

            <button
              onClick={handleMarkAllPresent}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
            >
              <Check size={16} />
              <span>Mark All Present</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Fee Status</th>
                  <th className="py-2.5 px-3">Current Status</th>
                  <th className="py-2.5 px-3 text-right">Quick Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">Loading roster...</td>
                  </tr>
                ) : manualSheetData?.students?.map((item: any) => (
                  <tr key={item.student.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2.5">
                        <img src={item.student.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80"} alt="" className="w-7 h-7 rounded-full object-cover" />
                        <div>
                          <p 
                            onClick={() => onOpenStudentProfile(item.student.id)}
                            className="font-bold text-slate-900 hover:text-brand-600 cursor-pointer"
                          >
                            {item.student.fullName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">{item.student.studentIdNumber}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3">
                      {item.hasPendingFees ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            Fee Due: {formatLKR(item.remainingBalance)}
                          </span>
                          {onOpenPaymentModal && (
                            <button
                              onClick={() => onOpenPaymentModal(item.student.id)}
                              className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                              title="Pay fee & send parent SMS receipt"
                            >
                              <CreditCard size={10} />
                              <span>Pay &amp; SMS</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Fees Clear
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                        item.status === 'LATE' ? 'bg-amber-100 text-amber-800' :
                        item.status === 'ABSENT' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleUpdateSingleManual(item.student.id, 'PRESENT')}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                            item.status === 'PRESENT' ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-emerald-50 text-slate-700'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => handleUpdateSingleManual(item.student.id, 'LATE')}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                            item.status === 'LATE' ? 'bg-amber-600 text-white' : 'bg-slate-100 hover:bg-amber-50 text-slate-700'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          onClick={() => handleUpdateSingleManual(item.student.id, 'ABSENT')}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                            item.status === 'ABSENT' ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-rose-50 text-slate-700'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dedicated High-Tech Mobile Camera QR Scanner Popup Modal */}
      <QRScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScanSuccess={handlePerformScan}
        selectedClassName={currentClass?.name}
        selectedDate={selectedDate}
        onOpenPaymentModal={onOpenPaymentModal}
      />

      {/* Floating Prompt Dialog for Attendance Log: "Need to Collect Fee?" */}
      {feePromptStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border-2 border-indigo-200 space-y-3.5 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-inner">
              <CreditCard size={24} />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                Fee Collection Confirmation
              </span>
              <h3 className="font-black text-base text-slate-900 mt-2">
                Collect Class Fee?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Attendance updated for <strong className="text-slate-900 font-bold">{feePromptStudent.fullName}</strong>.
              </p>
              {feePromptStudent.hasPendingFees ? (
                <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-black flex items-center justify-between">
                  <span>⚠️ Balance Due:</span>
                  <span className="font-mono text-sm">Rs. {Number(feePromptStudent.remainingBalance).toLocaleString()}</span>
                </div>
              ) : (
                <div className="mt-2.5 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                  ✓ Fees are clear. Collect advance or new fee?
                </div>
              )}
              {feePromptStudent.parentPhone && (
                <p className="text-[10px] text-slate-400 mt-1.5 flex items-center justify-center gap-1">
                  <Smartphone size={11} className="text-emerald-500" />
                  <span>SMS receipt on Fee Pay: <strong className="text-slate-700 font-mono">{feePromptStudent.parentPhone}</strong></span>
                </p>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const stu = feePromptStudent;
                  setFeePromptStudent(null);
                  if (onOpenPaymentModal) {
                    onOpenPaymentModal(stu.id, stu.feeRecordId);
                  }
                }}
                className="w-full py-3 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Check size={16} />
                <span>YES, Collect Fee</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    alert(`Noted: Student ${feePromptStudent.fullName} marked to pay after class finishes.`);
                    setFeePromptStudent(null);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  title="Student will pay after class finishes"
                >
                  <Clock size={14} className="text-amber-700" />
                  <span>⏰ Pay Later</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFeePromptStudent(null)}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <X size={14} />
                  <span>NO, Skip</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 125kHz HID RFID Hardware Setup & Multi-PC LAN Guide */}
      <RFIDGuideModal
        isOpen={isRFIDGuideOpen}
        onClose={() => setIsRFIDGuideOpen(false)}
      />
    </div>
  );
};
