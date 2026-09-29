import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  SwitchCamera, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle,
  QrCode,
  ArrowRight,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import { decodeQRFromFile, decodeQRFromVideo } from '../utils/qrScanner';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedToken: string) => Promise<any>;
  selectedClassName?: string;
  selectedDate?: string;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  selectedClassName = 'Selected Class',
  selectedDate
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isSecureCtx, setIsSecureCtx] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [processing, setProcessing] = useState<boolean>(false);
  const [manualToken, setManualToken] = useState<string>('');
  const [lastScanResult, setLastScanResult] = useState<any | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);

  // Sound beep synthesizer
  const playBeep = (type: 'SUCCESS' | 'WARN' | 'ERROR') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      // AudioContext muted/restricted before user gesture
    }
  };

  // Check secure context on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isSec = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      setIsSecureCtx(isSec);
    }
  }, []);

  // Live video frame processing loop
  const scanLoop = () => {
    if (!isScanningRef.current) return;

    if (videoRef.current && canvasRef.current) {
      try {
        const decoded = decodeQRFromVideo(videoRef.current, canvasRef.current);
        if (decoded && !processing) {
          handleTokenDetected(decoded);
          return;
        }
      } catch (err) {
        console.warn('Frame scan err:', err);
      }
    }

    animFrameRef.current = requestAnimationFrame(scanLoop);
  };

  // Start live camera stream
  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Live video stream requires HTTPS on mobile devices. Use the "📸 Open Phone Camera" button below to scan effortlessly!');
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        await videoRef.current.play();
      }

      setCameraActive(true);
      setCameraFacing(facing);
      isScanningRef.current = true;
      animFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err: any) {
      console.warn('getUserMedia error:', err);
      setCameraActive(false);
      isScanningRef.current = false;
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera permission was denied. Tap "📸 Open Phone Camera" below or allow camera in browser settings.');
      } else {
        setCameraError('Live camera video stream unavailable. Tap "📸 Open Phone Camera" below to take a photo of the QR code directly!');
      }
    }
  };

  // Stop camera stream & scan loop
  const stopCameraStream = () => {
    isScanningRef.current = false;
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

  // Handle detected token
  const handleTokenDetected = async (token: string) => {
    if (!token || processing) return;
    setProcessing(true);
    isScanningRef.current = false;

    try {
      const result = await onScanSuccess(token);
      setLastScanResult(result);
      if (result?.scanResult === 'SUCCESS') {
        playBeep('SUCCESS');
      } else if (result?.scanResult === 'ALREADY_RECORDED') {
        playBeep('WARN');
      } else {
        playBeep('ERROR');
      }
    } catch (err: any) {
      playBeep('ERROR');
      setLastScanResult({
        scanResult: 'ERROR',
        message: err.message || 'Verification failed. Student not enrolled or invalid code.'
      });
    } finally {
      setProcessing(false);
      // Resume scanning after 2.5 seconds if camera still active
      setTimeout(() => {
        if (isOpen && cameraActive) {
          isScanningRef.current = true;
          animFrameRef.current = requestAnimationFrame(scanLoop);
        }
      }, 2500);
    }
  };

  // Switch front/back camera
  const toggleCameraFacing = async () => {
    const next = cameraFacing === 'environment' ? 'user' : 'environment';
    await startCamera(next);
  };

  // Handle native camera photo capture (Android & iOS file input)
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setCameraError(null);

    try {
      const decodedText = await decodeQRFromFile(file);
      await handleTokenDetected(decodedText);
    } catch (err: any) {
      console.warn('decodeQRFromFile failed:', err);
      playBeep('ERROR');
      setCameraError(err.message || 'Could not detect a QR code in the captured photo. Please hold the phone closer and ensure good lighting.');
    } finally {
      setProcessing(false);
      if (e.target) e.target.value = '';
    }
  };

  // Trigger native phone camera photo capture
  const triggerNativeCamera = () => {
    setCameraError(null);
    fileInputRef.current?.click();
  };

  // Open camera automatically when modal opens
  useEffect(() => {
    if (isOpen) {
      setLastScanResult(null);
      setCameraError(null);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-white">
        
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <QrCode size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-white">Camera QR Scanner</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-xs">{selectedClassName}</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Audio Beep Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                soundEnabled 
                  ? 'bg-slate-800 border-slate-700 text-slate-200' 
                  : 'bg-slate-800/50 border-slate-800 text-slate-500'
              }`}
              title={soundEnabled ? 'Mute Beep' : 'Enable Beep'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Camera Switcher (Front/Back) */}
            {cameraActive && (
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors"
                title="Switch Camera (Front/Back)"
              >
                <SwitchCamera size={16} />
              </button>
            )}

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 border border-slate-700 text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="p-4 sm:p-6 flex-1 flex flex-col items-center justify-center overflow-y-auto space-y-4">
          
          {/* Live Camera Viewfinder Box */}
          <div className="relative w-full aspect-square max-w-[320px] rounded-3xl bg-black border-2 border-slate-800 overflow-hidden shadow-inner flex items-center justify-center">
            
            {/* Native Video Stream */}
            <video
              ref={videoRef}
              muted
              playsInline
              className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
            />

            {/* Offscreen Canvas for Frame Extraction */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Laser Line Scanning Effect when active */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                {/* 4 Corner Targeting Reticles */}
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl shadow-[0_0_10px_#34d399]" />
                  <div className="w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl shadow-[0_0_10px_#34d399]" />
                </div>

                {/* Animated Laser Bar */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#10b981] animate-bounce" />

                <div className="flex justify-between">
                  <div className="w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl shadow-[0_0_10px_#34d399]" />
                  <div className="w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl shadow-[0_0_10px_#34d399]" />
                </div>
              </div>
            )}

            {/* Processing Overlay Spinner */}
            {processing && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-30">
                <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs font-bold text-white">Verifying Student QR Code...</p>
                <p className="text-[10px] text-slate-400 mt-1">Checking enrollment & attendance balance</p>
              </div>
            )}

            {/* Idle State when camera is inactive */}
            {!cameraActive && !processing && (
              <div className="p-6 text-center flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                  <Camera size={32} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Camera Viewfinder</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">
                    Tap below to open your phone camera to snap student QR card.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input for Native Phone Camera Snapshot */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            className="hidden"
          />

          {/* Primary Action Button: Open Native Phone Camera (100% Works on Android & iPhone) */}
          <div className="w-full max-w-[320px] space-y-2">
            <button
              type="button"
              onClick={triggerNativeCamera}
              disabled={processing}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 hover:from-emerald-400 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center space-x-2 active:scale-95 transition-all"
            >
              <Camera size={18} />
              <span>📸 Open Phone Camera (Take Photo)</span>
            </button>

            {!cameraActive && (
              <button
                type="button"
                onClick={() => startCamera('environment')}
                disabled={processing}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center space-x-2 border border-slate-700 transition-all"
              >
                <RefreshCw size={14} />
                <span>Retry Live Continuous Stream</span>
              </button>
            )}
          </div>

          {/* Camera Guidance Alert */}
          {cameraError && (
            <div className="w-full max-w-[320px] p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-2">
              <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-amber-300">Camera Notice</p>
                <p className="text-[11px] text-amber-200/90 mt-0.5">{cameraError}</p>
              </div>
            </div>
          )}

          {/* Last Scan Result Card */}
          {lastScanResult && (
            <div className={`w-full max-w-[320px] p-3.5 rounded-2xl border text-xs animate-in zoom-in-95 duration-200 ${
              lastScanResult.scanResult === 'SUCCESS'
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                : lastScanResult.scanResult === 'ALREADY_RECORDED'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-200'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
            }`}>
              <div className="flex items-start space-x-2">
                {lastScanResult.scanResult === 'SUCCESS' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />}
                {lastScanResult.scanResult === 'ALREADY_RECORDED' && <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />}
                {lastScanResult.scanResult === 'ERROR' && <AlertCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase tracking-wider text-[10px]">
                      {lastScanResult.scanResult === 'SUCCESS' ? 'Present Recorded!' : lastScanResult.scanResult === 'ALREADY_RECORDED' ? 'Already Checked In' : 'Attendance Failed'}
                    </span>
                    <span className="text-[10px] opacity-75 font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {lastScanResult.student && (
                    <p className="font-extrabold text-sm text-white truncate mt-1">
                      {lastScanResult.student.fullName}
                    </p>
                  )}
                  <p className="text-[11px] mt-0.5 opacity-90">{lastScanResult.message}</p>

                  {/* Fee Balance Warning Banner if defaulter */}
                  {lastScanResult.hasPendingFees && (
                    <div className="mt-2 p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-[10px] font-bold flex items-center justify-between">
                      <span>⚠️ Pending Balance Due:</span>
                      <span className="font-mono text-white">Rs. {Number(lastScanResult.pendingAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Manual ID Input Accordion */}
          <div className="w-full max-w-[320px] pt-2 border-t border-slate-800">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Or Type Student ID / QR Token
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualToken.trim()) {
                      handleTokenDetected(manualToken.trim());
                      setManualToken('');
                    }
                  }}
                  placeholder="e.g. CAMS-STU-1001"
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
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Guidance */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 text-center text-[10px] text-slate-500 flex items-center justify-center space-x-1.5">
          <Info size={12} className="text-slate-400" />
          <span>Point camera at Student ID QR Pass or CR80 Barcode Card</span>
        </div>

      </div>
    </div>
  );
};
