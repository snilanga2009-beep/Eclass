import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  SwitchCamera, 
  Volume2, 
  VolumeX, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  QrCode,
  RefreshCw,
  CreditCard,
  Check,
  Clock,
  MessageCircle,
  Users
} from 'lucide-react';
import { decodeQRFromFile, decodeQRFromVideo } from '../utils/qrScanner';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedToken: string) => Promise<any>;
  selectedClassName?: string;
  selectedDate?: string;
  onOpenPaymentModal?: (studentId: string, feeRecordId?: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  selectedClassName = 'Selected Class',
  onOpenPaymentModal
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>('');
  const [lastScanResult, setLastScanResult] = useState<any | null>(null);
  const [scannedHistory, setScannedHistory] = useState<Array<{ id: string; name: string; code: string; time: string; status: string }>>([]);
  const [autoWhatsApp, setAutoWhatsApp] = useState<boolean>(false);

  // Live refs so the continuous requestAnimationFrame loop NEVER reads stale state or stops after 1 student
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const processingRef = useRef<boolean>(false);
  const onScanSuccessRef = useRef(onScanSuccess);
  const soundEnabledRef = useRef(soundEnabled);
  const autoWhatsAppRef = useRef(autoWhatsApp);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastScannedTokenRef = useRef<{ token: string; timestamp: number }>({ token: '', timestamp: 0 });

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    autoWhatsAppRef.current = autoWhatsApp;
  }, [autoWhatsApp]);

  const toggleAutoWhatsApp = () => {
    const next = !autoWhatsApp;
    setAutoWhatsApp(next);
    autoWhatsAppRef.current = next;
    try {
      localStorage.setItem('cams_auto_whatsapp_scan', next ? '1' : '0');
    } catch {}
  };

  // Reusable Web Audio API synthesizer (avoids hitting mobile browser AudioContext limit after 6 scans)
  const playBeep = (type: 'SUCCESS' | 'WARN' | 'ERROR') => {
    if (!soundEnabledRef.current) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContextClass();
      }
      const audioCtx = audioCtxRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'SUCCESS') {
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1174, audioCtx.currentTime + 0.08);
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
      // Ignore audio errors on restricted devices
    }
  };

  // Handle detected token without ever stopping the camera stream or loop
  const handleTokenDetected = async (rawToken: string) => {
    const token = (rawToken || '').trim();
    if (!token || processingRef.current) return;

    processingRef.current = true;
    setProcessing(true);

    try {
      const result = await onScanSuccessRef.current(token);
      setLastScanResult(result);

      if (result?.scanResult === 'SUCCESS') {
        playBeep('SUCCESS');
        if (result.student) {
          setScannedHistory(prev => [
            {
              id: result.student.id || token,
              name: result.student.fullName || 'Student',
              code: result.student.studentIdNumber || token,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              status: 'PRESENT'
            },
            ...prev.filter(item => item.id !== (result.student.id || token)).slice(0, 19)
          ]);
        }
        if (autoWhatsAppRef.current && result.whatsapp?.url) {
          try {
            window.open(result.whatsapp.url, '_blank');
          } catch {}
        }
      } else if (result?.scanResult === 'ALREADY_RECORDED') {
        playBeep('WARN');
        if (result.student) {
          setScannedHistory(prev => [
            {
              id: result.student.id || token,
              name: result.student.fullName || 'Student',
              code: result.student.studentIdNumber || token,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              status: 'ALREADY'
            },
            ...prev.filter(item => item.id !== (result.student.id || token)).slice(0, 19)
          ]);
        }
      } else {
        playBeep('ERROR');
      }
    } catch (err: any) {
      playBeep('ERROR');
      setLastScanResult({
        scanResult: 'ERROR',
        message: err.message || 'Verification failed. Student not enrolled or invalid QR code.'
      });
    } finally {
      // Ensure video stream stays playing on mobile after scan completes
      if (videoRef.current && videoRef.current.paused && streamRef.current?.active) {
        videoRef.current.play().catch(() => {});
      }
      // Release lock after 350ms so the NEXT student's QR code can be scanned immediately
      setTimeout(() => {
        processingRef.current = false;
        setProcessing(false);
      }, 350);
    }
  };

  // Persistent, non-stop video frame scanning loop
  const scanLoop = () => {
    if (!isScanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas) {
      // Automatically wake video if mobile browser paused it during audio beep
      if (video.paused && streamRef.current?.active) {
        video.play().catch(() => {});
      }

      if (!processingRef.current) {
        try {
          const decoded = decodeQRFromVideo(video, canvas);
          if (decoded) {
            const now = Date.now();
            const prevToken = lastScannedTokenRef.current.token;
            const elapsed = now - lastScannedTokenRef.current.timestamp;

            // If it is the SAME student's QR card still held in front of the camera, wait 3.5s before re-evaluating.
            // If it is a DIFFERENT student's QR card, scan IMMEDIATELY (after 400ms)!
            const shouldScan = decoded !== prevToken ? elapsed > 400 : elapsed > 3500;

            if (shouldScan) {
              lastScannedTokenRef.current = { token: decoded, timestamp: now };
              handleTokenDetected(decoded);
            }
          }
        } catch (err) {
          // Ignore single frame decode errors and keep scanning
        }
      }
    }

    // ALWAYS schedule next frame so continuous scanning never stops
    animFrameRef.current = requestAnimationFrame(scanLoop);
  };

  // Start live camera stream
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Live video stream requires HTTPS. Tap "Single Photo Fallback" below if live camera is blocked.');
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch {
        // Fallback for mobile phones that reject explicit resolution constraints
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false
        });
      }

      streamRef.current = stream;
      setCameraActive(true);
      setCameraFacing(facing);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('webkit-playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      isScanningRef.current = true;
      processingRef.current = false;
      animFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      setCameraActive(false);
      isScanningRef.current = false;
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission was denied. Please allow camera permission in your browser settings.');
      } else {
        setCameraError('Could not start live camera stream. Tap "Restart Live Camera" below.');
      }
    }
  };

  // Stop camera stream & scan loop ONLY when modal is closed
  const stopCameraStream = () => {
    isScanningRef.current = false;
    processingRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Switch front/back camera without closing modal
  const toggleCameraFacing = async () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    await startCamera(next);
  };

  // Handle optional single-photo fallback capture
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCameraError(null);
    try {
      const decodedText = await decodeQRFromFile(file);
      await handleTokenDetected(decodedText);
    } catch (err: any) {
      playBeep('ERROR');
      setCameraError(err.message || 'Could not detect a QR code in the photo.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Open camera automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      setLastScanResult(null);
      setCameraError(null);
      lastScannedTokenRef.current = { token: '', timestamp: 0 };
      startCamera('environment');
    } else {
      stopCameraStream();
    }

    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[96vh] overflow-hidden text-white">
        
        {/* Top Header Bar */}
        <div className="px-3.5 sm:px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-[#0055FF] text-white z-20">
          <div className="flex items-center space-x-2 min-w-0 mr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 shrink-0">
              <QrCode size={17} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">Continuous QR Scanner</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping shrink-0" />
              </div>
              <p className="text-[10px] sm:text-[11px] text-blue-100 truncate max-w-[150px] sm:max-w-xs">
                {selectedClassName} • Scanned: {scannedHistory.length}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Auto WhatsApp Toggle */}
            <button
              type="button"
              onClick={toggleAutoWhatsApp}
              className={`p-1.5 sm:px-2 rounded-lg border text-[11px] font-bold flex items-center space-x-1 transition-all cursor-pointer ${
                autoWhatsApp
                  ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                  : 'bg-white/15 border-white/25 text-white'
              }`}
              title={autoWhatsApp ? 'Auto WhatsApp is ON' : 'Auto WhatsApp is OFF'}
            >
              <MessageCircle size={14} />
              <span className="hidden sm:inline">WA:{autoWhatsApp ? 'ON' : 'OFF'}</span>
            </button>

            {/* Audio Beep Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                soundEnabled 
                  ? 'bg-white/15 border-white/25 text-white' 
                  : 'bg-black/30 border-white/10 text-blue-200'
              }`}
              title={soundEnabled ? 'Mute Beep' : 'Enable Beep'}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            {/* Camera Switcher (Front/Back) */}
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="p-1.5 rounded-lg bg-white/15 border border-white/25 text-white hover:bg-white/25 transition-colors cursor-pointer"
              title="Switch Camera (Front/Back)"
            >
              <SwitchCamera size={14} />
            </button>

            {/* Close Button (Only closes when user explicitly taps Close) */}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center space-x-1 shadow-lg transition-transform active:scale-95 shrink-0 border border-rose-400 cursor-pointer"
              title="Close Scanner"
            >
              <X size={15} className="stroke-[3]" />
              <span className="text-[11px] font-extrabold">Done</span>
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col items-center justify-start overflow-y-auto space-y-2.5 w-full">
          
          {/* Live Camera Viewfinder Box (Always Visible & Active) */}
          <div className="relative w-full aspect-square max-w-[240px] sm:max-w-[260px] rounded-2xl bg-black border-2 border-emerald-500/60 overflow-hidden shadow-lg flex items-center justify-center shrink-0">
            
            {/* Native Video Stream (NEVER display:none so mobile stream never pauses) */}
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className={`w-full h-full object-cover transition-opacity duration-200 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Offscreen Canvas for Frame Extraction */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Laser Line Scanning Effect when active */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-5">
                <div className="flex justify-between">
                  <div className="w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-[0_0_10px_#34d399]" />
                  <div className="w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-[0_0_10px_#34d399]" />
                </div>

                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-pulse" />

                <div className="flex justify-between">
                  <div className="w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-[0_0_10px_#34d399]" />
                  <div className="w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-[0_0_10px_#34d399]" />
                </div>
              </div>
            )}

            {/* Brief Non-Blocking Indicator During API Request */}
            {processing && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-extrabold shadow-lg flex items-center gap-1.5 z-30">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Marking Present...</span>
              </div>
            )}

            {/* Idle State when camera is inactive */}
            {!cameraActive && !processing && (
              <div className="absolute inset-0 p-5 text-center flex flex-col items-center justify-center space-y-2.5 bg-slate-950">
                <Camera size={28} className="text-blue-400" />
                <p className="text-xs font-bold text-white">Starting Live Camera...</p>
                <button
                  type="button"
                  onClick={() => startCamera(cameraFacing)}
                  className="px-4 py-2 rounded-xl bg-[#0055FF] hover:bg-[#0044CC] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <RefreshCw size={14} />
                  <span>Start Live Camera</span>
                </button>
              </div>
            )}
          </div>

          {/* Continuous Scan Radar Status Bar */}
          <div className="w-full max-w-[340px] py-1.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-between text-[11px] text-emerald-300 font-bold">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span>Continuous Scan ON — Hold next student QR to camera</span>
            </div>
            <span className="font-mono text-white bg-emerald-600/40 px-2 py-0.5 rounded-md text-[10px]">
              {scannedHistory.length} Scanned
            </span>
          </div>

          {/* Last Scanned Student Banner (Stays open mientras camera continues scanning next student!) */}
          {lastScanResult && (
            <div className={`w-full max-w-[340px] p-3 rounded-2xl border text-xs animate-in zoom-in-95 duration-150 ${
              lastScanResult.scanResult === 'SUCCESS'
                ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-100'
                : lastScanResult.scanResult === 'ALREADY_RECORDED'
                ? 'bg-amber-500/20 border-amber-400/60 text-amber-100'
                : 'bg-rose-500/20 border-rose-400/60 text-rose-100'
            }`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start space-x-2 min-w-0">
                  {lastScanResult.scanResult === 'SUCCESS' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />}
                  {lastScanResult.scanResult === 'ALREADY_RECORDED' && <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />}
                  {lastScanResult.scanResult === 'ERROR' && <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />}

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold uppercase tracking-wider text-[10px]">
                        {lastScanResult.scanResult === 'SUCCESS'
                          ? '✓ Marked Present — Ready for Next Student!'
                          : lastScanResult.scanResult === 'ALREADY_RECORDED'
                          ? 'Already Checked In — Ready for Next!'
                          : 'Scan Notice'}
                      </span>
                    </div>

                    {lastScanResult.student && (
                      <p className="font-black text-sm text-white truncate mt-0.5">
                        {lastScanResult.student.fullName} ({lastScanResult.student.studentIdNumber})
                      </p>
                    )}
                    <p className="text-[11px] opacity-90">{lastScanResult.message}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    lastScannedTokenRef.current = { token: '', timestamp: 0 };
                    setLastScanResult(null);
                  }}
                  className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold shrink-0 cursor-pointer"
                >
                  Next
                </button>
              </div>

              {/* Compact Fee Status & Actions (Does NOT close scanner unless Collect Fee is clicked) */}
              {lastScanResult.student && (
                <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <CreditCard size={12} className="text-amber-300" />
                    {(lastScanResult.hasPendingFees || (lastScanResult.pendingFees && lastScanResult.pendingFees.length > 0) || lastScanResult.feeWarning) ? (
                      <span className="text-[10px] font-bold text-rose-300">
                        Due: Rs. {Number(lastScanResult.totalPendingAmount || lastScanResult.pendingAmount || lastScanResult.feeWarning?.due || 0).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-300">Tuition Paid</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(lastScanResult.whatsapp?.url || lastScanResult.student?.parentPhone) && (
                      <a
                        href={lastScanResult.whatsapp?.url || `https://wa.me/${(lastScanResult.student?.parentPhone || lastScanResult.student?.phone || '').replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1"
                      >
                        <MessageCircle size={11} />
                        <span>WA</span>
                      </a>
                    )}
                    {onOpenPaymentModal && (
                      <button
                        type="button"
                        onClick={() => {
                          const targetFeeId = lastScanResult.feeWarning?.feeRecordId || lastScanResult.pendingFees?.[0]?.id;
                          onOpenPaymentModal(lastScanResult.student.id, targetFeeId);
                        }}
                        className="py-1 px-2 rounded-lg bg-[#0055FF] hover:bg-[#0044CC] text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        <Check size={11} />
                        <span>Collect Fee</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recent Scanned Students Feed in Current Session */}
          {scannedHistory.length > 0 && (
            <div className="w-full max-w-[340px] bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <span className="flex items-center gap-1">
                  <Users size={11} className="text-emerald-400" />
                  <span>Scanned Students ({scannedHistory.length})</span>
                </span>
                <span>Time</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                {scannedHistory.slice(0, 6).map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-900 text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${item.status === 'PRESENT' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span className="font-bold text-white truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({item.code})</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono shrink-0 ml-2">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Camera Error Notice */}
          {cameraError && (
            <div className="w-full max-w-[340px] p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2">
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-amber-300">Camera Notice</p>
                <p className="text-[11px] text-amber-200/90 mt-0.5">{cameraError}</p>
              </div>
            </div>
          )}

          {/* Manual ID Input + Secondary Single-Photo Fallback */}
          <div className="w-full max-w-[340px] pt-2 border-t border-slate-800 space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && manualToken.trim()) {
                    e.preventDefault();
                    handleTokenDetected(manualToken.trim());
                    setManualToken('');
                  }
                }}
                placeholder="Or type Student ID (e.g. STU-2026-0001)"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  if (manualToken.trim()) {
                    handleTokenDetected(manualToken.trim());
                    setManualToken('');
                  }
                }}
                disabled={!manualToken.trim() || processing}
                className="px-3.5 py-2 rounded-xl bg-[#0055FF] hover:bg-[#0044CC] text-white text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                Mark
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <button
                type="button"
                onClick={() => startCamera(cameraFacing)}
                className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Refresh Live Camera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-slate-400 hover:text-white font-medium flex items-center gap-1 cursor-pointer"
              >
                <Camera size={12} />
                <span>Upload / Photo Fallback</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoCapture}
                className="hidden"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
