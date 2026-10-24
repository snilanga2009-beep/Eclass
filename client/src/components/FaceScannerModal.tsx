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
  RefreshCw,
  CreditCard,
  Check,
  Clock,
  MessageCircle,
  Users,
  ShieldCheck,
  UserCheck,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '../api';
import { 
  loadFaceRecognitionModels, 
  extractFaceDescriptorFromMedia, 
  matchCandidateAgainstEnrolled,
  EnrolledFace,
  MatchEvaluation
} from '../utils/faceRecognition';

interface FaceScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClassId?: string;
  selectedClassName?: string;
  selectedDate?: string;
  onOpenPaymentModal?: (studentId: string, feeRecordId?: string) => void;
}

export const FaceScannerModal: React.FC<FaceScannerModalProps> = ({
  isOpen,
  onClose,
  selectedClassId,
  selectedClassName = "Today's Class",
  selectedDate,
  onOpenPaymentModal
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [modelLoading, setModelLoading] = useState<boolean>(true);

  // Enrolled face templates from backend
  const [enrolledFaces, setEnrolledFaces] = useState<EnrolledFace[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true);

  // Scanning & Detection State
  const [processing, setProcessing] = useState<boolean>(false);
  const [lastScanResult, setLastScanResult] = useState<any | null>(null);
  const [scannedHistory, setScannedHistory] = useState<Array<{ id: string; name: string; code: string; time: string; status: string }>>([]);
  
  // Manual Review State for uncertain matches
  const [uncertainCandidate, setUncertainCandidate] = useState<MatchEvaluation | null>(null);

  // Refs for non-stop continuous loop
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const processingRef = useRef<boolean>(false);
  const soundEnabledRef = useRef<boolean>(soundEnabled);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastScannedStudentRef = useRef<{ studentId: string; timestamp: number }>({ studentId: '', timestamp: 0 });

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Reusable Web Audio API synthesizer for instant audio beeps
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
      // Ignore audio restriction errors
    }
  };

  // Fetch enrolled templates
  const fetchEnrolledTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const res = await apiRequest<any>('/face/templates');
      if (res && Array.isArray(res.templates)) {
        setEnrolledFaces(res.templates);
      }
    } catch (err) {
      console.error('Failed to load face templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  // Process attendance recording for a confirmed face match
  const recordFaceAttendance = async (
    studentId: string, 
    reviewStatus: 'AUTO_VERIFIED' | 'MANUAL_CONFIRMED' = 'AUTO_VERIFIED',
    confidenceScore?: number
  ) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setProcessing(true);

    try {
      const today = selectedDate || new Date().toISOString().substring(0, 10);
      const res = await apiRequest<any>('/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({
          token: studentId,
          classId: selectedClassId,
          date: today,
          method: 'FACE',
          reviewStatus,
          confidenceScore
        })
      });

      setLastScanResult(res);

      if (res.scanResult === 'SUCCESS') {
        playBeep('SUCCESS');
        if (res.student) {
          setScannedHistory(prev => [
            {
              id: res.student.id || studentId,
              name: res.student.fullName || 'Student',
              code: res.student.studentIdNumber || studentId,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              status: 'PRESENT'
            },
            ...prev.filter(item => item.id !== (res.student.id || studentId)).slice(0, 19)
          ]);
        }
      } else if (res.scanResult === 'ALREADY_RECORDED') {
        playBeep('WARN');
        if (res.student) {
          setScannedHistory(prev => [
            {
              id: res.student.id || studentId,
              name: res.student.fullName || 'Student',
              code: res.student.studentIdNumber || studentId,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              status: 'ALREADY'
            },
            ...prev.filter(item => item.id !== (res.student.id || studentId)).slice(0, 19)
          ]);
        }
      } else {
        playBeep('ERROR');
      }
    } catch (err: any) {
      playBeep('ERROR');
      setLastScanResult({
        scanResult: 'ERROR',
        message: err.message || 'Face attendance verification failed'
      });
    } finally {
      // Clear uncertain prompt if open
      setUncertainCandidate(null);
      // Brief 400ms cooldown so next student can scan immediately
      setTimeout(() => {
        processingRef.current = false;
        setProcessing(false);
      }, 400);
    }
  };

  // Continuous real-time video frame recognition loop
  const faceScanLoop = async () => {
    if (!isScanningRef.current) return;

    const video = videoRef.current;
    if (video && !video.paused && !processingRef.current && !uncertainCandidate && enrolledFaces.length > 0) {
      try {
        const detectionResult = await extractFaceDescriptorFromMedia(video);
        if (detectionResult) {
          const evalResult = matchCandidateAgainstEnrolled(detectionResult.descriptor, enrolledFaces, 0.45, 0.58);
          
          if (evalResult.status === 'MATCH' && evalResult.student) {
            const now = Date.now();
            const lastStuId = lastScannedStudentRef.current.studentId;
            const elapsed = now - lastScannedStudentRef.current.timestamp;

            // Debounce same student for 3.5s; allow different student after 400ms
            const shouldMark = evalResult.student.id !== lastStuId ? elapsed > 400 : elapsed > 3500;
            if (shouldMark) {
              lastScannedStudentRef.current = { studentId: evalResult.student.id, timestamp: now };
              await recordFaceAttendance(evalResult.student.id, 'AUTO_VERIFIED', evalResult.similarity / 100);
            }
          } else if (evalResult.status === 'UNCERTAIN' && evalResult.student) {
            // Flag for manual review
            setUncertainCandidate(evalResult);
          }
        }
      } catch (err) {
        // Ignore single frame detection errors
      }
    }

    animFrameRef.current = requestAnimationFrame(faceScanLoop);
  };

  // Start Camera Stream
  const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
    setCameraError(null);
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Live video stream requires HTTPS or localhost in modern browsers.');
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
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      isScanningRef.current = true;
      processingRef.current = false;
      animFrameRef.current = requestAnimationFrame(faceScanLoop);
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraActive(false);
      setCameraError('Camera access denied or unavailable. Please grant camera permissions.');
    }
  };

  const stopCameraStream = () => {
    isScanningRef.current = false;
    processingRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const toggleCameraFacing = async () => {
    const next = cameraFacing === 'user' ? 'environment' : 'user';
    await startCamera(next);
  };

  useEffect(() => {
    if (isOpen) {
      setLastScanResult(null);
      setUncertainCandidate(null);
      setModelLoading(true);

      // Load models & templates concurrently
      Promise.all([
        loadFaceRecognitionModels(),
        fetchEnrolledTemplates()
      ]).then(([modelsOk]) => {
        setModelLoading(false);
        if (modelsOk) {
          startCamera(cameraFacing);
        } else {
          setCameraError('Failed to load neural face recognition weights.');
        }
      });
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

        {/* Top Header */}
        <div className="px-3.5 sm:px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white z-20">
          <div className="flex items-center space-x-2 min-w-0 mr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 text-white flex items-center justify-center border border-white/30 shrink-0">
              <UserCheck size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">Face Recognition Attendance</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              </div>
              <p className="text-[10px] sm:text-[11px] text-purple-200 truncate max-w-[170px] sm:max-w-xs">
                {selectedClassName} • Enrolled: {enrolledFaces.length}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {/* Audio Toggle */}
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg border text-xs transition-colors cursor-pointer ${
                soundEnabled ? 'bg-white/15 border-white/25 text-white' : 'bg-black/30 border-white/10 text-purple-200'
              }`}
              title={soundEnabled ? 'Mute Audio' : 'Enable Audio'}
            >
              {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
            </button>

            {/* Front/Back Camera Switch */}
            <button
              type="button"
              onClick={toggleCameraFacing}
              className="p-1.5 rounded-lg bg-white/15 border border-white/25 text-white hover:bg-white/25 transition-colors cursor-pointer"
              title="Switch Front/Back Camera"
            >
              <SwitchCamera size={14} />
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center space-x-1 shadow-lg transition-transform active:scale-95 shrink-0 border border-rose-400 cursor-pointer"
            >
              <X size={15} className="stroke-[3]" />
              <span className="text-[11px] font-extrabold">Done</span>
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col items-center justify-start overflow-y-auto space-y-2.5 w-full">

          {/* Live Video Camera Box */}
          <div className="relative w-full aspect-square max-w-[260px] sm:max-w-[280px] rounded-2xl bg-black border-2 border-purple-500/60 overflow-hidden shadow-lg flex items-center justify-center shrink-0">
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className={`w-full h-full object-cover transition-opacity duration-200 ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Continuous Face Scanner Reticle Effect */}
            {cameraActive && !uncertainCandidate && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                <div className="flex justify-between">
                  <div className="w-8 h-8 border-t-4 border-l-4 border-purple-400 rounded-tl-2xl shadow-[0_0_12px_#a855f7]" />
                  <div className="w-8 h-8 border-t-4 border-r-4 border-purple-400 rounded-tr-2xl shadow-[0_0_12px_#a855f7]" />
                </div>

                {/* Laser Scanning Pulse */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-purple-400 to-transparent shadow-[0_0_15px_#c084fc] animate-pulse" />

                <div className="flex justify-between">
                  <div className="w-8 h-8 border-b-4 border-l-4 border-purple-400 rounded-bl-2xl shadow-[0_0_12px_#a855f7]" />
                  <div className="w-8 h-8 border-b-4 border-r-4 border-purple-400 rounded-br-2xl shadow-[0_0_12px_#a855f7]" />
                </div>
              </div>
            )}

            {/* Processing Indicator */}
            {processing && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-purple-600 text-white text-[11px] font-extrabold shadow-lg flex items-center gap-1.5 z-30">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Marking Attendance...</span>
              </div>
            )}

            {/* Loading Indicator */}
            {(modelLoading || loadingTemplates) && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-white space-y-2 p-4 text-center">
                <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-bold">Initializing Face Recognition...</p>
                <p className="text-[10px] text-slate-400">Loading neural models & registered templates</p>
              </div>
            )}
          </div>

          {/* Continuous Status Radar Bar */}
          <div className="w-full max-w-[340px] py-1.5 px-3 rounded-xl bg-purple-500/15 border border-purple-500/40 flex items-center justify-between text-[11px] text-purple-200 font-bold">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping shrink-0" />
              <span>Face Scanner Active — Look directly at camera</span>
            </div>
            <span className="font-mono text-white bg-purple-600/40 px-2 py-0.5 rounded-md text-[10px]">
              {scannedHistory.length} Scanned
            </span>
          </div>

          {/* UNCERTAIN MATCH: Manual Review Confirmation Prompt */}
          {uncertainCandidate && (
            <div className="w-full max-w-[340px] p-3 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-100 text-xs space-y-2.5 animate-in zoom-in-95 duration-150">
              <div className="flex items-center space-x-2">
                <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">
                    Manual Review Needed ({uncertainCandidate.similarity}% Match)
                  </h4>
                  <p className="text-[11px] text-amber-200">
                    Confidence is borderline. Confirm candidate student below:
                  </p>
                </div>
              </div>

              {/* Candidate Selection List */}
              <div className="space-y-1.5">
                {(uncertainCandidate.candidates || (uncertainCandidate.student ? [uncertainCandidate.student as any] : [])).map((cand, idx) => (
                  <div key={`${cand.id}-${idx}`} className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-amber-400/40">
                    <div className="flex items-center space-x-2 min-w-0">
                      {cand.studentPhoto ? (
                        <img src={cand.studentPhoto} alt="" className="w-8 h-8 rounded-lg object-cover ring-1 ring-amber-300 shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold text-xs shrink-0">
                          {cand.studentName?.substring(0, 1) || 'S'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-black text-white text-xs truncate">{cand.studentName}</p>
                        <p className="text-[10px] text-amber-300 font-mono">ID: {cand.studentIdNumber} • {cand.similarity || uncertainCandidate.similarity}%</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => recordFaceAttendance(cand.id, 'MANUAL_CONFIRMED', (cand.similarity || uncertainCandidate.similarity) / 100)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] flex items-center gap-1 shadow-md cursor-pointer shrink-0"
                    >
                      <Check size={13} />
                      <span>Confirm</span>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setUncertainCandidate(null)}
                  className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 text-[10px] font-bold cursor-pointer"
                >
                  Skip / Not This Student
                </button>
              </div>
            </div>
          )}

          {/* Last Confirmed Scanned Student Result Banner */}
          {lastScanResult && !uncertainCandidate && (
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
                    <span className="font-extrabold uppercase tracking-wider text-[10px]">
                      {lastScanResult.scanResult === 'SUCCESS'
                        ? '✓ Face Recognized & Marked Present!'
                        : lastScanResult.scanResult === 'ALREADY_RECORDED'
                        ? 'Already Checked In Today'
                        : 'Face Notice'}
                    </span>

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
                  onClick={() => setLastScanResult(null)}
                  className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[10px] font-bold shrink-0 cursor-pointer"
                >
                  Next
                </button>
              </div>

              {/* Compact Fee Status & Collect Fee Action */}
              {lastScanResult.student && (
                <div className="mt-2 pt-2 border-t border-white/15 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <CreditCard size={12} className="text-amber-300" />
                    {(lastScanResult.hasPendingFees || (lastScanResult.pendingFees && lastScanResult.pendingFees.length > 0)) ? (
                      <span className="text-[10px] font-bold text-rose-300">
                        Due: Rs. {Number(lastScanResult.totalPendingAmount || 0).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-300">Tuition Paid</span>
                    )}
                  </div>

                  {onOpenPaymentModal && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetFeeId = lastScanResult.feeWarning?.feeRecordId || lastScanResult.pendingFees?.[0]?.id;
                        onOpenPaymentModal(lastScanResult.student.id, targetFeeId);
                      }}
                      className="py-1 px-2.5 rounded-lg bg-[#0055FF] hover:bg-[#0044CC] text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Check size={11} />
                      <span>Collect Fee</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recent Scanned Students Feed */}
          {scannedHistory.length > 0 && (
            <div className="w-full max-w-[340px] bg-slate-950/90 border border-slate-800 rounded-2xl p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                <span className="flex items-center gap-1">
                  <Users size={11} className="text-purple-400" />
                  <span>Face Verified ({scannedHistory.length})</span>
                </span>
                <span>Time</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                {scannedHistory.slice(0, 6).map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex items-center justify-between px-2 py-1 rounded-lg bg-slate-900 text-[11px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${item.status === 'PRESENT' ? 'bg-purple-400' : 'bg-amber-400'}`} />
                      <span className="font-bold text-white truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({item.code})</span>
                    </div>
                    <span className="text-[10px] text-purple-300 font-mono shrink-0 ml-2">{item.time}</span>
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

          {/* Bottom Actions */}
          <div className="w-full max-w-[340px] pt-1 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-1">
            <button
              type="button"
              onClick={() => {
                fetchEnrolledTemplates();
                startCamera(cameraFacing);
              }}
              className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Refresh Templates & Camera</span>
            </button>

            <span className="text-[10px] text-slate-500">
              Templates: {enrolledFaces.length} active
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
