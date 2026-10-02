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
  CreditCard,
  Sparkles,
  Search,
  Filter,
  Printer,
  LayoutGrid,
  Table as TableIcon,
  MessageCircle,
  BookOpen,
  GraduationCap
} from 'lucide-react';
import { apiRequest, formatDate, formatLKR } from '../api';
import confetti from 'canvas-confetti';
import { Html5Qrcode } from 'html5-qrcode';
import { QRScannerModal } from '../components/QRScannerModal';
import { decodeQRFromFile } from '../utils/qrScanner';
import { useRFIDReader } from '../utils/useRFIDReader';
import { RFIDGuideModal } from '../components/RFIDGuideModal';
import { getStudentAvatar } from '../utils/studentAvatars';

const CLASS_THEMES = [
  {
    gradient: 'from-blue-600 via-indigo-600 to-violet-600',
    headerBg: 'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-violet-500/10',
    border: 'border-indigo-200/80',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    pillActive: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-2 ring-indigo-400 ring-offset-1',
    pillInactive: 'bg-indigo-50/70 text-indigo-800 hover:bg-indigo-100/70 border border-indigo-200/60',
    countBadge: 'bg-white/20 text-white',
    countBadgeInactive: 'bg-indigo-200/60 text-indigo-900',
    ring: 'ring-indigo-400'
  },
  {
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    headerBg: 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10',
    border: 'border-emerald-200/80',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pillActive: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white ring-2 ring-emerald-400 ring-offset-1',
    pillInactive: 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200/60',
    countBadge: 'bg-white/20 text-white',
    countBadgeInactive: 'bg-emerald-200/60 text-emerald-900',
    ring: 'ring-emerald-400'
  },
  {
    gradient: 'from-purple-600 via-fuchsia-600 to-pink-600',
    headerBg: 'bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-pink-500/10',
    border: 'border-purple-200/80',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    pillActive: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white ring-2 ring-purple-400 ring-offset-1',
    pillInactive: 'bg-purple-50/70 text-purple-800 hover:bg-purple-100/70 border border-purple-200/60',
    countBadge: 'bg-white/20 text-white',
    countBadgeInactive: 'bg-purple-200/60 text-purple-900',
    ring: 'ring-purple-400'
  },
  {
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    headerBg: 'bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10',
    border: 'border-amber-200/80',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    pillActive: 'bg-gradient-to-r from-amber-500 to-orange-600 text-white ring-2 ring-amber-400 ring-offset-1',
    pillInactive: 'bg-amber-50/70 text-amber-800 hover:bg-amber-100/70 border border-amber-200/60',
    countBadge: 'bg-white/20 text-white',
    countBadgeInactive: 'bg-amber-200/60 text-amber-900',
    ring: 'ring-amber-400'
  },
  {
    gradient: 'from-rose-600 via-pink-600 to-red-600',
    headerBg: 'bg-gradient-to-r from-rose-500/10 via-pink-500/10 to-red-500/10',
    border: 'border-rose-200/80',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
    pillActive: 'bg-gradient-to-r from-rose-600 to-pink-600 text-white ring-2 ring-rose-400 ring-offset-1',
    pillInactive: 'bg-rose-50/70 text-rose-800 hover:bg-rose-100/70 border border-rose-200/60',
    countBadge: 'bg-white/20 text-white',
    countBadgeInactive: 'bg-rose-200/60 text-rose-900',
    ring: 'ring-rose-400'
  },
  {
    gradient: 'from-cyan-600 via-teal-600 to-blue-600',
    headerBg: 'bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-blue-500/10',
    border: 'border-cyan-200/80',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    pillActive: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white ring-2 ring-cyan-400 ring-offset-1',
    pillInactive: 'bg-cyan-50/70 text-cyan-800 hover:bg-cyan-100/70 border border-cyan-200/60',
    countBadge: 'bg-white/20 text-white',
    countBadgeInactive: 'bg-cyan-200/60 text-cyan-900',
    ring: 'ring-cyan-400'
  }
];

const getClassTheme = (className: string = '', index: number = 0) => {
  let hash = 0;
  for (let i = 0; i < className.length; i++) {
    hash = (hash + className.charCodeAt(i)) % CLASS_THEMES.length;
  }
  return CLASS_THEMES[(hash + index) % CLASS_THEMES.length];
};

interface AttendanceProps {
  onOpenStudentProfile: (studentId: string) => void;
  autoOpenScanner?: boolean;
  onOpenPaymentModal?: (studentId: string, feeRecordId?: string) => void;
  initialMode?: 'QR_SCANNER' | 'ROSTER' | 'MANUAL_SHEET';
}

export const Attendance: React.FC<AttendanceProps> = ({ 
  onOpenStudentProfile, 
  autoOpenScanner = false,
  onOpenPaymentModal,
  initialMode = 'QR_SCANNER'
}) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [mode, setMode] = useState<'QR_SCANNER' | 'ROSTER' | 'MANUAL_SHEET'>(initialMode);
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

  // Today's Attendance Roster States
  const [rosterData, setRosterData] = useState<any>(null);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterClassFilter, setRosterClassFilter] = useState<string>('ALL');
  const [rosterStatusFilter, setRosterStatusFilter] = useState<'ALL' | 'PRESENT' | 'LATE'>('ALL');
  const [rosterFeeFilter, setRosterFeeFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');
  const [rosterSearch, setRosterSearch] = useState('');
  const [rosterViewMode, setRosterViewMode] = useState<'CARDS' | 'TABLE'>('CARDS');

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

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
  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const lastScanAttemptRef = useRef<{ token: string; time: number }>({ token: '', time: 0 });

  // Auto-focus barcode scanner input in PC/laptop mode
  useEffect(() => {
    if (mode === 'QR_SCANNER') {
      setTimeout(() => barcodeInputRef.current?.focus(), 150);
    }
  }, [mode, selectedClassId]);

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

  // Fetch Today's Attendance Roster
  const fetchRoster = async (dateParam?: string) => {
    setRosterLoading(true);
    try {
      const d = dateParam || selectedDate;
      const res = await apiRequest<any>(`/attendance/today-roster?date=${encodeURIComponent(d)}`);
      if (res) {
        setRosterData(res);
        if (res.targetDate && res.targetDate !== selectedDate) {
          setSelectedDate(res.targetDate);
        }
      }
    } catch (err) {
      console.error('Failed to load roster:', err);
    } finally {
      setRosterLoading(false);
    }
  };

  useEffect(() => {
    if (mode === 'ROSTER') {
      fetchRoster(selectedDate);
    }
  }, [mode, selectedDate]);

  const handleSendWhatsApp = (item: any) => {
    const rawPhone = item.parentPhone || '';
    const phone = rawPhone.replace(/\D/g, '');
    if (!phone) {
      alert(`No parent contact phone number found for ${item.studentName}.`);
      return;
    }
    const intlPhone = phone.startsWith('0') ? '94' + phone.substring(1) : (phone.startsWith('94') ? phone : '94' + phone);
    const timeStr = item.scannedAt ? new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'today';
    const feeStatusText = item.feeInfo?.hasPendingFees
      ? `Tuition Fee: Pending Rs. ${item.feeInfo.remainingBalance.toLocaleString()}`
      : `Tuition Fee: Fully Settled`;

    const message = `*CAMS ACADEMY ATTENDANCE RECEIPT*\n\nStudent: *${item.studentName}* (${item.studentIdNumber})\nClass: *${item.className}*\nTeacher: ${item.teacherName}\nDate: ${item.date}\nCheck-in Time: ${timeStr}\nStatus: ${item.status === 'LATE' ? 'Late Arrival ⚠️' : 'Present ✅'}\n${feeStatusText}\n\nThank you for choosing CAMS Academy!`;

    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

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

  // Perform Barcode, QR or RFID scan evaluation
  const handlePerformScan = async (tokenToScan?: string, scanMethod: string = 'BARCODE'): Promise<any> => {
    const token = (tokenToScan || qrInput).trim();
    if (!token || !selectedClassId) return null;

    // Suppress rapid hardware duplicate keypresses within 1000ms
    const now = Date.now();
    if (lastScanAttemptRef.current.token === token && (now - lastScanAttemptRef.current.time) < 1000) {
      return null;
    }
    lastScanAttemptRef.current = { token, time: now };

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
      setTimeout(() => barcodeInputRef.current?.focus(), 150);
      setScanLoading(false);
      return offRes;
    }

    try {
      const res = await apiRequest('/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: token,
          token: token,
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
      setTimeout(() => barcodeInputRef.current?.focus(), 150);
      return res;
    } catch (err: any) {
      playBeep('ERROR');
      const errRes = {
        scanResult: 'ERROR',
        method: scanMethod,
        message: err.message || 'Verification failed. Student not enrolled or invalid barcode/QR.'
      };
      setScanResult(errRes);
      setTimeout(() => barcodeInputRef.current?.focus(), 150);
      return errRes;
    } finally {
      setScanLoading(false);
    }
  };

  // Global USB Barcode Reader & 125kHz HID RFID Reader Listener (PC/Laptop keyboard wedge)
  const { simulateScan } = useRFIDReader({
    enabled: mode === 'QR_SCANNER' && rfidActive,
    onScan: (tag, scanType) => {
      setLastRfidTag(tag);
      handlePerformScan(tag, scanType || 'BARCODE');
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

  // Filtered Roster for Today's Attendance Roster & Attended Classes
  const filteredRoster = (rosterData?.roster || []).filter((item: any) => {
    if (rosterClassFilter !== 'ALL' && item.classId !== rosterClassFilter) {
      return false;
    }
    if (rosterStatusFilter !== 'ALL' && item.status !== rosterStatusFilter) {
      return false;
    }
    if (rosterFeeFilter === 'PAID' && item.feeInfo?.hasPendingFees) {
      return false;
    }
    if (rosterFeeFilter === 'PENDING' && !item.feeInfo?.hasPendingFees) {
      return false;
    }
    if (rosterSearch.trim()) {
      const q = rosterSearch.toLowerCase();
      const matchName = item.studentName?.toLowerCase().includes(q);
      const matchId = item.studentIdNumber?.toLowerCase().includes(q);
      const matchClass = item.className?.toLowerCase().includes(q);
      const matchGrade = item.studentGrade?.toLowerCase().includes(q);
      const matchPhone = item.parentPhone?.includes(q);
      return matchName || matchId || matchClass || matchGrade || matchPhone;
    }
    return true;
  });

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
          <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200 overflow-x-auto touch-scroll-x shadow-inner max-w-full">
            <button
              onClick={() => setMode('QR_SCANNER')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                mode === 'QR_SCANNER' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <QrCode size={14} />
              <span>QR &amp; Barcode Scanner</span>
            </button>
            <button
              onClick={() => setMode('ROSTER')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                mode === 'ROSTER' 
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-extrabold' 
                  : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <Sparkles size={14} className={mode === 'ROSTER' ? 'text-white' : 'text-emerald-500'} />
              <span>Today's Attendance Roster &amp; Attended Classes</span>
              {rosterData?.stats?.totalAttended > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                  mode === 'ROSTER' ? 'bg-white/25 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {rosterData.stats.totalAttended}
                </span>
              )}
            </button>
            <button
              onClick={() => setMode('MANUAL_SHEET')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                mode === 'MANUAL_SHEET' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar size={14} />
              <span>Manual Sheet</span>
            </button>
          </div>
        </div>
      </div>

      {/* Class & Date Selector Bar (Only for Scanner & Manual Sheet modes) */}
      {mode !== 'ROSTER' && (
        <>
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

      {/* PC & Laptop Mode: USB Barcode Scanner & 125kHz RFID Reader Live Status Bar */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-md text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-2xl bg-brand-500/20 border border-brand-400/40 flex items-center justify-center text-brand-300 shrink-0 shadow-inner">
            <Zap size={22} className={rfidActive ? 'animate-pulse text-emerald-400' : 'text-slate-400'} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-extrabold text-xs sm:text-sm text-white tracking-wide">
                PC &amp; Laptop Mode: USB Barcode Scanner &amp; 125kHz RFID
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider ${
                rfidActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-700 text-slate-300'
              }`}>
                {rfidActive ? '● READY FOR BARCODE GUN & RFID TAPS' : 'MUTED'}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              {lastRfidTag ? (
                <span>Last Scanned Token: <strong className="font-mono text-emerald-400 font-bold">{lastRfidTag}</strong> (Recorded Successfully)</span>
              ) : (
                'Zero-click hands-free scanning: Point any USB barcode reader gun at ID card barcode or tap RFID card. Automatically marks attendance, sounds POS beep & prompts fee collection.'
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Quick Hardware Simulator / Demo Buttons */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-xl border border-white/10 text-xs">
            <span className="text-[10px] text-brand-300 font-bold uppercase hidden sm:inline">Simulate:</span>
            <button
              onClick={() => simulateScan('STU-2026-0001')}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-mono text-[11px] font-bold transition-all border border-emerald-500/30"
              title="Simulate Barcode Gun Scan for STU-2026-0001"
            >
              Barcode STU-0001
            </button>
            <button
              onClick={() => simulateScan('0004928101')}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-bold transition-all"
              title="Simulate 125kHz Card Tap for Kasun Kalhara"
            >
              Card 101
            </button>
          </div>

          {/* Reader Guide Button */}
          <button
            onClick={() => setIsRFIDGuideOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/30 transition-all shrink-0"
          >
            <HelpCircle size={15} />
            <span>Hardware Guide</span>
          </button>
        </div>
      </div>
      </>
      )}

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
                  ref={barcodeInputRef}
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
                    ) : scanResult.method === 'BARCODE' ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 text-[10px] font-black flex items-center gap-1 border border-amber-500/30">
                        <Zap size={11} className="text-amber-600" />
                        <span>Barcode Reader</span>
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
                  {scanResult.student && (
                    <img 
                      src={getStudentAvatar(scanResult.student)} 
                      alt="" 
                      className="w-16 h-16 rounded-2xl object-cover ring-2 ring-white shadow-md shrink-0 bg-slate-100" 
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

      {/* MODE 3: TODAY'S ATTENDANCE ROSTER & ATTENDED CLASSES */}
      {mode === 'ROSTER' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Control Bar: Title, Date Picker, Print, View Switcher */}
          <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-xl text-white">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>LIVE ATTENDANCE ROSTER</span>
                  </span>
                  {rosterData?.isToday && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      Today's Real-time Sessions
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Today's Attendance Roster &amp; Attended Classes
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl">
                  Real-time visual monitoring of all student check-ins, multi-class filter, faculty instructors, attendance timestamps &amp; tuition fee clearance status.
                </p>
              </div>

              {/* Date & Action Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Date Dropdown / Quick Select */}
                <div className="flex items-center space-x-1.5 bg-white/10 px-3 py-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                  <Calendar size={14} className="text-brand-300" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      fetchRoster(e.target.value);
                    }}
                    className="bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Today Quick Reset */}
                <button
                  onClick={() => {
                    const today = new Date().toISOString().substring(0, 10);
                    setSelectedDate(today);
                    fetchRoster(today);
                  }}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10"
                >
                  Today
                </button>

                {/* Refresh Roster Button */}
                <button
                  onClick={() => fetchRoster(selectedDate)}
                  disabled={rosterLoading}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all border border-white/10 disabled:opacity-50"
                  title="Refresh Roster"
                >
                  <RefreshCw size={15} className={rosterLoading ? 'animate-spin text-brand-400' : ''} />
                </button>

                {/* View Switcher: Cards vs Table */}
                <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setRosterViewMode('CARDS')}
                    className={`p-1.5 rounded-lg transition-all ${
                      rosterViewMode === 'CARDS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Colorful Cards View"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    onClick={() => setRosterViewMode('TABLE')}
                    className={`p-1.5 rounded-lg transition-all ${
                      rosterViewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Dense Table View"
                  >
                    <TableIcon size={15} />
                  </button>
                </div>

                {/* Print Roster Button */}
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                  title="Print Attendance Roster Sheet"
                >
                  <Printer size={14} />
                  <span className="hidden sm:inline">Print Roster</span>
                </button>
              </div>
            </div>
          </div>

          {/* COLORFUL STATS & SUMMARY KPI CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
            {/* 1. Total Attended */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/20 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">Headcount</span>
                <Users size={18} className="text-emerald-200" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-white leading-none">
                  {rosterData?.stats?.totalAttended || 0}
                </p>
                <p className="text-[11px] font-bold text-emerald-100 mt-1">Total Attended Students</p>
                <p className="text-[10px] text-emerald-200/80 mt-0.5 truncate">Across all tuition classes</p>
              </div>
            </div>

            {/* 2. Active Classes */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-100">Sessions</span>
                <BookOpen size={18} className="text-indigo-200" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-white leading-none">
                  {rosterData?.stats?.uniqueClassesCount || 0}
                </p>
                <p className="text-[11px] font-bold text-indigo-100 mt-1">Classes Conducted</p>
                <p className="text-[10px] text-indigo-200/80 mt-0.5 truncate">Subject lectures active</p>
              </div>
            </div>

            {/* 3. On-Time Rate */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-lg shadow-cyan-600/20 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-100">Punctuality</span>
                <Clock size={18} className="text-cyan-200" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-white leading-none">
                  {rosterData?.stats?.onTimeRate || 100}%
                </p>
                <p className="text-[11px] font-bold text-cyan-100 mt-1">On-Time Arrival Rate</p>
                <p className="text-[10px] text-cyan-200/80 mt-0.5 truncate">
                  {rosterData?.stats?.presentCount || 0} Present • {rosterData?.stats?.lateCount || 0} Late
                </p>
              </div>
            </div>

            {/* 4. Tuition Fee Clearance */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-600 to-rose-700 text-white shadow-lg shadow-amber-600/20 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-100">Fee Status</span>
                <CreditCard size={18} className="text-amber-200" />
              </div>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-white leading-none">
                  {rosterData?.stats?.feesPaidCount || 0} <span className="text-xs font-normal text-amber-100">Paid</span>
                </p>
                <p className="text-[11px] font-bold text-amber-100 mt-1">Fees Paid vs Pending</p>
                <p className="text-[10px] text-amber-200/90 mt-0.5 truncate font-mono">
                  {rosterData?.stats?.feesPendingCount || 0} Due: {formatLKR(rosterData?.stats?.feesPendingAmount || 0)}
                </p>
              </div>
            </div>

            {/* 5. Hardware Scan Methods */}
            <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-600 to-pink-700 text-white shadow-lg shadow-purple-600/20 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute right-[-10px] bottom-[-10px] w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-100">Hardware POS</span>
                <Zap size={18} className="text-purple-200" />
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1"><Zap size={10} /> Barcode Gun:</span>
                  <span className="font-mono bg-white/20 px-1.5 py-0.2 rounded">{rosterData?.stats?.methodsBreakdown?.BARCODE || 0}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1"><QrCode size={10} /> QR Pass:</span>
                  <span className="font-mono bg-white/20 px-1.5 py-0.2 rounded">{rosterData?.stats?.methodsBreakdown?.QR_CODE || 0}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1"><Radio size={10} /> 125kHz RFID:</span>
                  <span className="font-mono bg-white/20 px-1.5 py-0.2 rounded">{rosterData?.stats?.methodsBreakdown?.RFID || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLORFUL CLASS FILTER PILLS & TOOLBAR */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            {/* Dynamic Class Filter Pills */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Filter size={13} className="text-brand-600" />
                  <span>Filter by Attended Class</span>
                </span>
                <span className="text-[11px] text-slate-400 font-semibold">
                  {rosterData?.attendedClasses?.length || 0} Classes in Today's Log
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 touch-scroll-x no-scrollbar">
                {/* All Classes Pill */}
                <button
                  onClick={() => setRosterClassFilter('ALL')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 shadow-sm ${
                    rosterClassFilter === 'ALL'
                      ? 'bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-2 scale-102 shadow-slate-900/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  <span>All Attended Classes</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    rosterClassFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-800'
                  }`}>
                    {rosterData?.stats?.totalAttended || 0}
                  </span>
                </button>

                {/* Individual Class Pills */}
                {rosterData?.attendedClasses?.map((cls: any, idx: number) => {
                  const theme = getClassTheme(cls.name, idx);
                  const isSelected = rosterClassFilter === cls.id;
                  return (
                    <button
                      key={cls.id}
                      onClick={() => setRosterClassFilter(cls.id)}
                      className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 shadow-sm ${
                        isSelected ? theme.pillActive : theme.pillInactive
                      }`}
                    >
                      <div className="text-left">
                        <p className="leading-tight">{cls.name}</p>
                        <p className={`text-[10px] font-medium truncate max-w-[150px] opacity-80 ${isSelected ? 'text-white/90' : 'text-slate-500'}`}>
                          {cls.teacherName || 'Faculty'} {cls.hall ? `• ${cls.hall}` : ''}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        isSelected ? theme.countBadge : theme.countBadgeInactive
                      }`}>
                        {cls.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search Bar & Secondary Filters */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search attended students by name, ID (e.g. STU-0001), grade, phone..."
                  value={rosterSearch}
                  onChange={(e) => setRosterSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all"
                />
                {rosterSearch && (
                  <button
                    onClick={() => setRosterSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status and Fee Filter Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Status Filter */}
                <select
                  value={rosterStatusFilter}
                  onChange={(e: any) => setRosterStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="PRESENT">Present (On-Time)</option>
                  <option value="LATE">Late Arrival</option>
                </select>

                {/* Fee Status Filter */}
                <select
                  value={rosterFeeFilter}
                  onChange={(e: any) => setRosterFeeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Fee Status</option>
                  <option value="PAID">Fees Clear ✓</option>
                  <option value="PENDING">Fees Pending ⚠️</option>
                </select>

                {/* Count Badge */}
                <span className="px-3 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-black shrink-0 font-mono">
                  {filteredRoster.length} Students
                </span>
              </div>
            </div>
          </div>

          {/* STUDENT ROSTER CONTENT (CARDS OR TABLE) */}
          {rosterLoading ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <RefreshCw size={28} className="animate-spin text-brand-600 mx-auto" />
              <p className="font-bold text-slate-700 text-sm">Loading attendance records...</p>
              <p className="text-xs text-slate-400">Fetching student attendance timestamps &amp; tuition fee clearance.</p>
            </div>
          ) : filteredRoster.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white border border-dashed border-slate-300 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="font-black text-slate-800 text-base">No Attended Students Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No students match your selected date or class filter. Scan student ID cards using the QR &amp; Barcode Scanner tab, or select an active session date.
              </p>
              {rosterData?.allAttendanceDates && rosterData.allAttendanceDates.length > 0 && (
                <div className="pt-2 flex flex-wrap justify-center gap-2">
                  <span className="text-[11px] text-slate-400 self-center">Previous Sessions:</span>
                  {rosterData.allAttendanceDates.slice(0, 4).map((d: string) => (
                    <button
                      key={d}
                      onClick={() => {
                        setSelectedDate(d);
                        fetchRoster(d);
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : rosterViewMode === 'CARDS' ? (
            /* CARDS VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredRoster.map((item: any, idx: number) => {
                const theme = getClassTheme(item.className, idx);
                const isLate = item.status === 'LATE';
                const checkInTime = item.scannedAt
                  ? new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : '--:--';

                return (
                  <div 
                    key={item.id}
                    className={`group rounded-3xl bg-white border ${theme.border} hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col justify-between`}
                  >
                    {/* Top Gradient Accent Bar */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${theme.gradient}`} />

                    <div className="p-4 sm:p-5 space-y-4">
                      {/* Student Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="relative shrink-0">
                            <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-2xl overflow-hidden ring-2 ${theme.ring} shadow-md bg-slate-100`}>
                              {item.studentPhoto ? (
                                <img src={item.studentPhoto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-tr ${theme.gradient} text-white font-black text-base flex items-center justify-center`}>
                                  {item.studentName?.charAt(0) || 'S'}
                                </div>
                              )}
                            </div>
                            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white" title="Present Today" />
                          </div>

                          <div className="min-w-0">
                            <h4 
                              onClick={() => onOpenStudentProfile(item.studentId)}
                              className="font-extrabold text-sm sm:text-base text-slate-900 hover:text-brand-600 transition-colors cursor-pointer truncate"
                            >
                              {item.studentName}
                            </h4>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                                {item.studentIdNumber}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium truncate">
                                {item.studentGrade}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Pill */}
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 ${
                          isLate 
                            ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {isLate ? 'Late' : 'Present'}
                        </span>
                      </div>

                      {/* Attended Class Banner */}
                      <div className={`p-3 rounded-2xl ${theme.headerBg} border ${theme.border} space-y-1`}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-900 truncate">
                            {item.className}
                          </span>
                          {item.classCode && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-white/70 text-slate-700">
                              {item.classCode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-600">
                          <span className="flex items-center gap-1 truncate">
                            <GraduationCap size={13} className="text-slate-400 shrink-0" />
                            <strong className="text-slate-800 font-semibold truncate">{item.teacherName}</strong>
                          </span>
                          <span>{item.hall || 'Main Hall'}</span>
                        </div>
                      </div>

                      {/* Check-In Details & Scan Method */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center space-x-1.5">
                          <Clock size={13} className="text-slate-400" />
                          <span className="font-mono font-bold text-slate-800 text-[11px]">{checkInTime}</span>
                        </div>

                        {/* Method badge */}
                        {item.method === 'BARCODE' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                            <Zap size={10} className="text-amber-600" />
                            <span>Barcode Gun</span>
                          </span>
                        ) : item.method === 'RFID' ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold flex items-center gap-1">
                            <Radio size={10} className="text-indigo-600" />
                            <span>125kHz RFID</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                            <QrCode size={10} className="text-emerald-600" />
                            <span>QR Pass</span>
                          </span>
                        )}
                      </div>

                      {/* Tuition Fee Settlement Status */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                            Tuition Fee Status
                          </span>
                          {item.feeInfo?.hasPendingFees ? (
                            <span className="text-xs font-extrabold text-amber-700 flex items-center gap-1 mt-0.5">
                              <AlertTriangle size={12} className="text-amber-600 shrink-0" />
                              <span>Due: {formatLKR(item.feeInfo.remainingBalance)}</span>
                            </span>
                          ) : (
                            <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1 mt-0.5">
                              <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                              <span>Fees Fully Paid</span>
                            </span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-1.5 shrink-0">
                          {onOpenPaymentModal && (
                            <button
                              onClick={() => onOpenPaymentModal(item.studentId, item.feeInfo?.feeRecordId)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm ${
                                item.feeInfo?.hasPendingFees
                                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20 animate-pulse'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                              title="Collect Tuition Fee & send instant SMS receipt"
                            >
                              <CreditCard size={12} />
                              <span>{item.feeInfo?.hasPendingFees ? 'Collect Fee' : 'Payment'}</span>
                            </button>
                          )}

                          {item.parentPhone && (
                            <button
                              onClick={() => handleSendWhatsApp(item)}
                              className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                              title={`Send WhatsApp SMS to Parent (${item.parentPhone})`}
                            >
                              <MessageCircle size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="overflow-x-auto rounded-3xl border border-slate-200/80 bg-white shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class Attended</th>
                    <th className="py-3 px-4">Time &amp; Method</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Tuition Fee</th>
                    <th className="py-3 px-4">Parent Phone</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRoster.map((item: any, idx: number) => {
                    const theme = getClassTheme(item.className, idx);
                    const isLate = item.status === 'LATE';
                    const checkInTime = item.scannedAt
                      ? new Date(item.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                      : '--:--';

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-9 h-9 rounded-xl overflow-hidden ring-1 ${theme.ring} shrink-0`}>
                              {item.studentPhoto ? (
                                <img src={item.studentPhoto} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className={`w-full h-full bg-gradient-to-tr ${theme.gradient} text-white font-bold text-xs flex items-center justify-center`}>
                                  {item.studentName?.charAt(0) || 'S'}
                                </div>
                              )}
                            </div>
                            <div>
                              <p 
                                onClick={() => onOpenStudentProfile(item.studentId)}
                                className="font-bold text-slate-900 hover:text-brand-600 transition-colors cursor-pointer"
                              >
                                {item.studentName}
                              </p>
                              <p className="font-mono text-[10px] text-slate-500">{item.studentIdNumber} • {item.studentGrade}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${theme.badge}`}>
                              {item.className}
                            </span>
                            <p className="text-[10px] text-slate-500 mt-1">Teacher: <strong className="text-slate-700">{item.teacherName}</strong></p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <span className="font-mono font-bold text-slate-800 text-xs flex items-center gap-1">
                              <Clock size={11} className="text-slate-400" />
                              <span>{checkInTime}</span>
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {item.method === 'BARCODE' ? '⚡ Barcode Gun' : item.method === 'RFID' ? '🏷️ 125kHz RFID' : '📱 QR Pass'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isLate ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                            {isLate ? 'Late' : 'Present'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item.feeInfo?.hasPendingFees ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                              Due: {formatLKR(item.feeInfo.remainingBalance)}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              ✓ Paid Clear
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-slate-700 text-xs">{item.parentPhone || 'N/A'}</span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            {onOpenPaymentModal && (
                              <button
                                onClick={() => onOpenPaymentModal(item.studentId, item.feeInfo?.feeRecordId)}
                                className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[11px] font-bold transition-all shadow-sm"
                              >
                                Collect Fee
                              </button>
                            )}
                            {item.parentPhone && (
                              <button
                                onClick={() => handleSendWhatsApp(item)}
                                className="p-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
                                title="Send WhatsApp SMS"
                              >
                                <MessageCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
                        <img src={getStudentAvatar(item.student)} alt="" className="w-7 h-7 rounded-full object-cover bg-slate-100" />
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
