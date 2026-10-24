import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Camera, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw, 
  SwitchCamera, 
  Sparkles,
  UserCheck,
  Lock
} from 'lucide-react';
import { apiRequest } from '../api';
import { loadFaceRecognitionModels, extractFaceDescriptorFromMedia } from '../utils/faceRecognition';

interface FaceEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    fullName: string;
    studentIdNumber: string;
    photo?: string;
    parentName?: string;
    parentPhone?: string;
  } | null;
  onEnrolledSuccess?: () => void;
}

export const FaceEnrollmentModal: React.FC<FaceEnrollmentModalProps> = ({
  isOpen,
  onClose,
  student,
  onEnrolledSuccess
}) => {
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [modelLoading, setModelLoading] = useState<boolean>(true);
  const [modelsReady, setModelsReady] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Consent State
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [consentBy, setConsentBy] = useState<string>('');

  // Detection & Capture State
  const [capturing, setCapturing] = useState<boolean>(false);
  const [faceDetected, setFaceDetected] = useState<boolean>(false);
  const [detectionQuality, setDetectionQuality] = useState<number>(0);
  const [capturedDescriptor, setCapturedDescriptor] = useState<number[] | null>(null);
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Pre-fill consent party name when modal opens
  useEffect(() => {
    if (student) {
      setConsentBy(student.parentName || student.fullName || '');
    }
  }, [student]);

  // Load models when modal opens
  useEffect(() => {
    if (isOpen) {
      setModelLoading(true);
      loadFaceRecognitionModels().then(ok => {
        setModelsReady(ok);
        setModelLoading(false);
        if (ok) {
          startCamera(cameraFacing);
        } else {
          setCameraError('Failed to load neural face recognition models. Please refresh page.');
        }
      });
    } else {
      stopCamera();
      setCapturedDescriptor(null);
      setCapturedThumbnail(null);
      setConsentGiven(false);
      setStatusMessage('');
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async (facing: 'user' | 'environment' = 'user') => {
    setCameraError(null);
    stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera video stream requires HTTPS or localhost in modern browsers.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      streamRef.current = stream;
      setCameraActive(true);
      setCameraFacing(facing);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.muted = true;
        await videoRef.current.play().catch(() => {});
      }

      startDetectionLoop();
    } catch (err: any) {
      console.error('Camera startup error:', err);
      setCameraError(err.message || 'Could not access camera. Please allow camera permissions in browser.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
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

  const switchCameraFacing = async () => {
    const next = cameraFacing === 'user' ? 'environment' : 'user';
    await startCamera(next);
  };

  // Continuous loop to check if face is well-aligned before capture
  const startDetectionLoop = () => {
    const loop = async () => {
      if (videoRef.current && !videoRef.current.paused && !capturedDescriptor) {
        try {
          const res = await extractFaceDescriptorFromMedia(videoRef.current);
          if (res) {
            setFaceDetected(true);
            setDetectionQuality(Math.round(res.score * 100));
          } else {
            setFaceDetected(false);
            setDetectionQuality(0);
          }
        } catch {
          setFaceDetected(false);
        }
      }
      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
  };

  // Capture face descriptor from video
  const handleCaptureFace = async () => {
    if (!videoRef.current) return;
    setCapturing(true);
    setStatusMessage('Analyzing biometric facial features...');

    try {
      const res = await extractFaceDescriptorFromMedia(videoRef.current);
      if (!res || res.score < 0.6) {
        alert('Could not get a clear face scan. Please position face directly in the center oval with good lighting.');
        setCapturing(false);
        return;
      }

      // Convert Float32Array to standard number array
      const descArray = Array.from(res.descriptor);
      setCapturedDescriptor(descArray);

      // Create snapshot thumbnail from current frame
      if (canvasRef.current && videoRef.current) {
        const c = canvasRef.current;
        c.width = 160;
        c.height = 160;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, 160, 160);
          const thumbData = c.toDataURL('image/jpeg', 0.8);
          setCapturedThumbnail(thumbData);
        }
      }

      setStatusMessage(`Biometric template extracted with ${Math.round(res.score * 100)}% quality score.`);
    } catch (err: any) {
      alert('Capture error: ' + (err.message || 'Face analysis failed'));
    } finally {
      setCapturing(false);
    }
  };

  // Submit enrollment with consent to backend
  const handleSaveEnrollment = async () => {
    if (!student || !capturedDescriptor) {
      alert('Please capture a face scan first.');
      return;
    }
    if (!consentGiven) {
      alert('Consent checkbox must be checked to confirm voluntary biometric template storage.');
      return;
    }
    if (!consentBy.trim()) {
      alert('Please enter the name of the consenting parent, guardian or student.');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/face/enroll', {
        method: 'POST',
        body: JSON.stringify({
          studentId: student.id,
          descriptor: capturedDescriptor,
          consentGiven: true,
          consentBy: consentBy.trim(),
          qualityScore: detectionQuality / 100,
          photoSampleUrl: capturedThumbnail || undefined
        })
      });

      alert(`Biometric face template registered successfully for ${student.fullName}!`);
      if (onEnrolledSuccess) {
        onEnrolledSuccess();
      }
      onClose();
    } catch (err: any) {
      alert('Enrollment failed: ' + (err.message || 'Server error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Top Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-none">Biometric Face Enrollment</h3>
              <p className="text-[11px] text-purple-200 mt-0.5">
                {student.fullName} ({student.studentIdNumber})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-800">

          {/* Privacy & Template Disclosure */}
          <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex items-start space-x-2.5 text-xs text-purple-900">
            <Lock size={16} className="text-purple-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Secure Template Storage:</strong> Only a 128-dimensional mathematical vector is stored. No raw video or surveillance recordings are kept.
            </div>
          </div>

          {/* Camera Viewport & Center Oval Guide */}
          <div className="relative w-full aspect-video sm:aspect-square max-h-64 rounded-2xl bg-black border-2 border-dashed border-indigo-400 overflow-hidden flex items-center justify-center shadow-inner">
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className={`w-full h-full object-cover ${capturedThumbnail ? 'hidden' : 'block'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Display Captured Snapshot if Frozen */}
            {capturedThumbnail && (
              <img
                src={capturedThumbnail}
                alt="Captured Face"
                className="w-full h-full object-cover"
              />
            )}

            {/* Oval Face Guide when Camera Active */}
            {cameraActive && !capturedThumbnail && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className={`w-36 h-48 sm:w-44 sm:h-56 rounded-[50%] border-2 transition-colors duration-200 ${
                  faceDetected ? 'border-emerald-400 shadow-[0_0_15px_#10b981]' : 'border-amber-300 border-dashed'
                }`} />
                <span className={`absolute bottom-3 px-2.5 py-1 rounded-full text-[10px] font-extrabold backdrop-blur-md ${
                  faceDetected ? 'bg-emerald-600/90 text-white' : 'bg-black/60 text-amber-200'
                }`}>
                  {faceDetected ? `✓ Face Detected (${detectionQuality}%)` : 'Center Face in Oval'}
                </span>
              </div>
            )}

            {/* Camera Switch Controls */}
            {cameraActive && !capturedThumbnail && (
              <button
                type="button"
                onClick={switchCameraFacing}
                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80 text-xs backdrop-blur cursor-pointer"
                title="Switch Camera (Front/Back)"
              >
                <SwitchCamera size={15} />
              </button>
            )}

            {/* Model Loading State */}
            {modelLoading && (
              <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center text-white space-y-2">
                <div className="w-8 h-8 border-3 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold">Loading Neural Biometrics Engine...</p>
              </div>
            )}
          </div>

          {/* Camera Error Alert */}
          {cameraError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-600 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Capture / Re-take Button */}
          <div className="flex gap-2">
            {!capturedDescriptor ? (
              <button
                type="button"
                onClick={handleCaptureFace}
                disabled={!cameraActive || capturing || !faceDetected}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Camera size={15} />
                <span>{capturing ? 'Extracting Template...' : 'Capture Biometric Face Scan'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setCapturedDescriptor(null);
                  setCapturedThumbnail(null);
                  setStatusMessage('');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw size={14} />
                <span>Retake Face Scan</span>
              </button>
            )}
          </div>

          {/* Biometric Consent Form Section */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <ShieldCheck size={16} className="text-indigo-600" />
              <span>Biometric Consent Verification (Mandatory)</span>
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-[11px] text-slate-700 leading-tight">
                I hereby grant consent for {student.fullName} ({student.studentIdNumber}) to have a mathematical face recognition template stored in the academy LMS for automated gate attendance.
              </span>
            </label>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Name of Consenting Parent / Student
              </label>
              <input
                type="text"
                value={consentBy}
                onChange={(e) => setConsentBy(e.target.value)}
                placeholder="Parent/Guardian Full Name"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {statusMessage && (
            <p className="text-[11px] text-emerald-700 font-semibold text-center">{statusMessage}</p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSaveEnrollment}
              disabled={!capturedDescriptor || !consentGiven || !consentBy.trim() || submitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Check size={16} />
              <span>{submitting ? 'Saving Biometric...' : 'Confirm & Save Face Template'}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
