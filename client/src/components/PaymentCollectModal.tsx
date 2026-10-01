import React, { useState, useEffect } from 'react';
import { X, CreditCard, Check, AlertCircle, DollarSign, Smartphone, CheckCircle2 } from 'lucide-react';
import { apiRequest, formatLKR } from '../api';
import confetti from 'canvas-confetti';

interface PaymentCollectModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudentId?: string | null;
  preselectedFeeRecordId?: string | null;
  onPaymentSuccess: (receiptNumber: string) => void;
}

export const PaymentCollectModal: React.FC<PaymentCollectModalProps> = ({
  isOpen,
  onClose,
  preselectedStudentId,
  preselectedFeeRecordId,
  onPaymentSuccess
}) => {
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [feeInputs, setFeeInputs] = useState<{ [feeId: string]: { amount: number; discount: number } }>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      apiRequest<any[]>('/students?status=ACTIVE').then(res => {
        setStudents(res || []);
        if (preselectedStudentId) {
          setSelectedStudentId(preselectedStudentId);
        } else if (res && res.length > 0) {
          setSelectedStudentId(res[0].id);
        }
      });
    }
  }, [isOpen, preselectedStudentId]);

  useEffect(() => {
    if (!selectedStudentId) {
      setStudentDetails(null);
      return;
    }
    setLoading(true);
    setError(null);
    apiRequest(`/students/${selectedStudentId}`)
      .then(res => {
        setStudentDetails(res);
        // Initialize inputs for pending fee records
        const inputs: any = {};
        const pending = res.feeRecords?.filter((f: any) => f.status !== 'PAID') || [];
        pending.forEach((f: any) => {
          // If preselected, default to paying full remaining balance
          const defaultAmount = (preselectedFeeRecordId && f.id === preselectedFeeRecordId) ? f.remainingBalance : 0;
          inputs[f.id] = {
            amount: defaultAmount,
            discount: 0
          };
        });
        setFeeInputs(inputs);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedStudentId, preselectedFeeRecordId]);

  if (!isOpen) return null;

  const handleInputChange = (feeId: string, field: 'amount' | 'discount', value: number) => {
    setFeeInputs(prev => ({
      ...prev,
      [feeId]: {
        ...prev[feeId],
        [field]: value
      }
    }));
  };

  const handlePayFull = (feeId: string, balance: number) => {
    handleInputChange(feeId, 'amount', balance);
  };

  const calculateGrandTotal = () => {
    return Object.values(feeInputs).reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const itemsToPay = Object.keys(feeInputs)
      .filter(feeId => Number(feeInputs[feeId]?.amount) > 0)
      .map(feeId => ({
        feeRecordId: feeId,
        amountPaid: Number(feeInputs[feeId].amount),
        discount: Number(feeInputs[feeId].discount || 0)
      }));

    if (itemsToPay.length === 0) {
      setError('Please enter a payment amount for at least one class fee');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudentId,
          items: itemsToPay,
          paymentMethod,
          reference,
          notes
        })
      });

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onPaymentSuccess(res.receiptNumber);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setSubmitting(false);
    }
  };

  const grandTotal = calculateGrandTotal();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2">
            <CreditCard size={18} className="text-brand-600" />
            <h3 className="font-bold text-xs sm:text-sm text-slate-800 uppercase tracking-wider">Collect Tuition Fee</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Select Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.studentIdNumber}) - {s.grade}
                </option>
              ))}
            </select>
          </div>

          {/* Pending Fees Table */}
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-400">Loading fee records...</div>
          ) : studentDetails ? (
            <div>
              {/* Parent SMS Receipt Alert Banner */}
              <div className="mb-4 p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/10 border border-indigo-400/30 flex items-center justify-center text-indigo-700 shrink-0">
                    <Smartphone size={16} />
                  </div>
                  <div>
                    <p className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5">
                      <span>Instant SMS &amp; WhatsApp Receipt to Parent</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase tracking-wider">
                        Active
                      </span>
                    </p>
                    <p className="text-[11px] text-indigo-800/90 font-medium">
                      Recipient Mobile: <strong className="font-mono text-slate-900 font-bold">{studentDetails.parentPhone || studentDetails.phone || 'No phone recorded'}</strong>
                      {studentDetails.parentName && <span className="text-slate-600 ml-1">({studentDetails.parentName})</span>}
                    </p>
                  </div>
                </div>
                <div className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 shrink-0 self-end sm:self-auto">
                  <CheckCircle2 size={13} className="text-emerald-600" />
                  <span>Auto-Dispatched on Submit</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Outstanding Monthly Fees</span>
                <span className="text-xs text-slate-500">{studentDetails.fullName}</span>
              </div>

              {studentDetails.feeRecords?.filter((f: any) => f.status !== 'PAID').length === 0 ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-xs">
                  All fees are completely paid for this student! No pending balances.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentDetails.feeRecords?.filter((f: any) => f.status !== 'PAID').map((f: any) => (
                    <div key={f.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-xs text-slate-900">{f.class?.name}</h4>
                          <p className="text-[11px] text-slate-500 font-mono">
                            Month: {f.month} • Due: {formatLKR(f.totalDue)} • Already Paid: {formatLKR(f.paidAmount)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block font-semibold">BALANCE DUE</span>
                          <span className="font-black text-sm text-amber-700">{formatLKR(f.remainingBalance)}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 items-end pt-2 border-t border-slate-200/60">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Pay Amount (Rs.)</label>
                          <input
                            type="number"
                            min="0"
                            max={f.remainingBalance}
                            value={feeInputs[f.id]?.amount ?? 0}
                            onChange={(e) => handleInputChange(f.id, 'amount', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-brand-700 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Discount (Rs.)</label>
                          <input
                            type="number"
                            min="0"
                            value={feeInputs[f.id]?.discount ?? 0}
                            onChange={(e) => handleInputChange(f.id, 'discount', Number(e.target.value))}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs bg-white"
                          />
                        </div>
                        <div className="pt-1 sm:pt-0">
                          <button
                            type="button"
                            onClick={() => handlePayFull(f.id, f.remainingBalance)}
                            className="w-full py-2 rounded-lg bg-slate-200 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-bold transition-colors active:scale-95"
                          >
                            Pay Full ({formatLKR(f.remainingBalance)})
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {/* Payment Method & Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 border-t border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-medium"
              >
                <option value="Cash">Cash (Front Desk)</option>
                <option value="Bank Transfer">Bank Transfer / Deposit Slip</option>
                <option value="Card">Credit / Debit Card</option>
                <option value="Online Payment">Online Payment Gateway</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Reference / Slip No (Optional)</label>
              <input
                type="text"
                placeholder="e.g. BOC-TXN-99812"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white"
              />
            </div>
          </div>

          {/* Sticky Footer on Mobile */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t-2 border-slate-900 bg-white sticky bottom-0 z-10 -mx-3.5 -mb-3.5 p-3.5 sm:mx-0 sm:mb-0 sm:p-0 shadow-lg sm:shadow-none">
            <div className="flex items-center justify-between sm:block">
              <span className="text-xs text-slate-500 block">Total Collection Amount</span>
              <span className="text-lg sm:text-xl font-black text-brand-700">{formatLKR(grandTotal)}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || grandTotal === 0}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Check size={16} />
                <span>{submitting ? 'Processing...' : 'Confirm & Send SMS'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
