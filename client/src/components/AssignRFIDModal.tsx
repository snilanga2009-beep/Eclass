import React, { useState } from 'react';
import { X, Radio, CheckCircle2, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import { useRFIDReader } from '../utils/useRFIDReader';
import { apiRequest } from '../api';

interface AssignRFIDModalProps {
  student: {
    id: string;
    fullName: string;
    studentIdNumber: string;
    rfidTag?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedStudent: any) => void;
}

export const AssignRFIDModal: React.FC<AssignRFIDModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [rfidInput, setRfidInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Hook listening for USB 125kHz card tap
  useRFIDReader({
    enabled: isOpen,
    onScan: (tag) => {
      setRfidInput(tag);
      handleAssign(tag);
    }
  });

  if (!isOpen || !student) return null;

  const handleAssign = async (tagToAssign?: string) => {
    const finalTag = (tagToAssign || rfidInput).trim();
    if (!finalTag) {
      setError('Please tap a 125kHz RFID card or enter the card UID number');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await apiRequest<{ success: boolean; message: string; student: any }>('/students/assign-rfid', {
        method: 'POST',
        body: JSON.stringify({
          studentId: student.id,
          rfidTag: finalTag
        })
      });

      setSuccessMsg(`Card ${finalTag} linked successfully to ${student.fullName}!`);
      setTimeout(() => {
        onSuccess(res.student);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to assign RFID card.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-400/30 flex items-center justify-center text-brand-300">
              <Radio size={18} className="animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Assign 125kHz RFID Card</h3>
              <p className="text-[11px] text-brand-200">{student.fullName} ({student.studentIdNumber})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Signal Indicator Box */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-col items-center justify-center text-center space-y-2 border-2 border-dashed border-brand-500/40">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-brand-300 animate-bounce">
              <Radio size={24} />
            </div>
            <p className="text-xs font-bold text-white">Tap Card on USB Reader Now</p>
            <p className="text-[11px] text-slate-400 max-w-xs">
              Place the 125kHz card or keyfob on the reader connected to this PC or Android USB-C device.
            </p>
            {student.rfidTag && (
              <span className="text-[10px] font-mono text-brand-300 bg-brand-950/80 px-2.5 py-1 rounded-md border border-brand-800">
                Current Card: {student.rfidTag}
              </span>
            )}
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Manual Input or Confirmation */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Card UID Number (10-Digit Decimal or Hex)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="e.g. 0004928172"
                value={rfidInput}
                onChange={(e) => setRfidInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAssign();
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => handleAssign()}
                disabled={loading || !rfidInput.trim()}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition-all flex items-center gap-1.5"
              >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                <span>Save</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
