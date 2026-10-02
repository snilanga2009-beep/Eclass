import React, { useState, useEffect } from 'react';
import { X, Printer, Download, QrCode as QrIcon, Sparkles, Radio } from 'lucide-react';
import { apiRequest } from '../api';
import { getStudentAvatar } from '../utils/studentAvatars';
import { useSettings } from '../context/SettingsContext';

interface StudentIDCardModalProps {
  studentId: string | null;
  onClose: () => void;
}

export const StudentIDCardModal: React.FC<StudentIDCardModalProps> = ({ studentId, onClose }) => {
  const { instituteName, instituteTagline } = useSettings();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    apiRequest(`/students/${studentId}`)
      .then(res => setStudent(res))
      .catch(err => console.error('Failed to load student card:', err))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (!studentId) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!student?.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = student.qrDataUrl;
    a.download = `QR_${student.studentIdNumber}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center space-x-2">
            <QrIcon size={18} className="text-brand-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Student ID & Smart QR Card</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadQR}
              className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-white border border-slate-200 shadow-sm transition-colors text-xs font-semibold flex items-center gap-1"
              title="Download QR Image"
            >
              <Download size={14} />
              <span className="hidden sm:inline">QR Image</span>
            </button>
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-white border border-slate-200 shadow-sm transition-colors text-xs font-semibold flex items-center gap-1"
              title="Print Card"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print Card</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-slate-200 shadow-sm transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Card Display Area */}
        <div className="p-6 bg-slate-100 flex flex-col items-center justify-center print:bg-white print:p-0">
          {loading ? (
            <div className="py-16 text-xs text-slate-400">Loading student card...</div>
          ) : student ? (
            <div 
              id="student-id-card"
              className="w-full max-w-sm rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-brand-950 text-white p-5 shadow-2xl relative overflow-hidden border border-slate-700/80"
            >
              {/* Background watermark badge */}
              <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center text-white shadow-md">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs uppercase tracking-wider text-white truncate max-w-[200px]">{instituteName}</h3>
                    <p className="text-[9px] text-brand-300 font-medium truncate max-w-[200px]">{instituteTagline || 'Official Student Smart Pass'}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold">
                  VALID 2026/27
                </span>
              </div>

              {/* Card Body: Photo, Info, and QR */}
              <div className="flex items-start justify-between space-x-4">
                {/* Photo & Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-3">
                    <img 
                      src={getStudentAvatar(student)} 
                      alt="" 
                      className="w-16 h-20 rounded-xl object-cover ring-2 ring-white/20 shadow-md shrink-0 bg-slate-800"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] text-brand-300 uppercase font-mono font-semibold">STUDENT ID</p>
                      <p className="text-sm font-black font-mono text-white tracking-wide">{student.studentIdNumber}</p>
                      <p className="text-xs font-bold text-slate-100 truncate mt-1">{student.fullName}</p>
                      <p className="text-[10px] text-slate-400 truncate">{student.grade}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-[10px] text-slate-300 border-t border-white/10 pt-2 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400">School:</span>
                      <span className="truncate max-w-[140px] text-slate-200">{student.school || 'Private'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Emergency:</span>
                      <span className="text-slate-200">{student.parentPhone || student.emergencyContact || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="bg-white p-2 rounded-xl shadow-lg shrink-0 flex flex-col items-center">
                  {student.qrDataUrl ? (
                    <img src={student.qrDataUrl} alt="QR Code" className="w-24 h-24 rounded-lg" />
                  ) : (
                    <div className="w-24 h-24 bg-slate-200 animate-pulse rounded-lg" />
                  )}
                  <span className="text-[8px] font-mono text-slate-600 mt-1 font-semibold uppercase">Scan at Entrance</span>
                </div>
              </div>

                {/* Barcode & RFID Strip */}
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-20 bg-[repeating-linear-gradient(90deg,#fff,#fff_2px,transparent_2px,transparent_4px)] opacity-60" />
                    {student.rfidTag && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-[9px] font-mono text-emerald-300 font-bold flex items-center gap-1">
                        <Radio size={10} />
                        <span>RFID: {student.rfidTag}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[8px] font-mono text-slate-400">NON-TRANSFERABLE PASS</span>
                </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
