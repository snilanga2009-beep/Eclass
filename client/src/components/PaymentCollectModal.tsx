import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Check, 
  AlertCircle, 
  Calendar, 
  Smartphone, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Clock
} from 'lucide-react';
import { apiRequest, formatLKR } from '../api';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { getStudentAvatar } from '../utils/studentAvatars';

interface PaymentCollectModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedStudentId?: string | null;
  preselectedFeeRecordId?: string | null;
  onPaymentSuccess: (receiptNumber: string, studentId?: string) => void;
}

interface ManualFeeItem {
  id: string;
  classId: string;
  className: string;
  month: string;
  monthLabel: string;
  monthlyFee: number;
}

// Generate Month Options: from -6 months to +3 months relative to current date
const generateMonthList = () => {
  const list = [];
  const now = new Date();
  for (let i = -6; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const code = `${y}-${m}`;
    const name = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    list.push({
      code,
      name,
      isCurrent: i === 0,
      isPrevious: i === -1
    });
  }
  return list;
};

export const PaymentCollectModal: React.FC<PaymentCollectModalProps> = ({
  isOpen,
  onClose,
  preselectedStudentId,
  preselectedFeeRecordId,
  onPaymentSuccess
}) => {
  const { user } = useAuth();
  const isStudentOrParent = user?.role === 'STUDENT' || user?.role === 'PARENT';

  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isChangingStudent, setIsChangingStudent] = useState(false);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [feeInputs, setFeeInputs] = useState<{ [feeId: string]: { amount: number; discount: number } }>({});
  const [manualFeeItems, setManualFeeItems] = useState<ManualFeeItem[]>([]);
  
  // Manual month selection state
  const monthList = generateMonthList();
  const currentMonthObj = monthList.find(m => m.isCurrent) || monthList[6];
  const previousMonthObj = monthList.find(m => m.isPrevious) || monthList[5];

  const [selectedManualMonth, setSelectedManualMonth] = useState<string>(currentMonthObj.code);
  const [selectedManualClassId, setSelectedManualClassId] = useState<string>('');
  const [showManualMonthPicker, setShowManualMonthPicker] = useState(false);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial student list and full class directory
  useEffect(() => {
    if (isOpen) {
      setIsChangingStudent(false);
      setManualFeeItems([]);
      setShowManualMonthPicker(false);

      const effectiveStudentId = isStudentOrParent ? (user?.studentId || preselectedStudentId) : preselectedStudentId;
      if (isStudentOrParent && effectiveStudentId) {
        setSelectedStudentId(effectiveStudentId);
      } else {
        apiRequest<any[]>('/students?status=ACTIVE').then(res => {
          setStudents(res || []);
          if (effectiveStudentId) {
            setSelectedStudentId(effectiveStudentId);
          } else if (res && res.length > 0) {
            setSelectedStudentId(res[0].id);
          }
        });
      }

      apiRequest<any[]>('/classes').then(res => {
        setAllClasses(res || []);
      }).catch(() => {});
    }
  }, [isOpen, preselectedStudentId, isStudentOrParent, user?.studentId]);

  // Load student profile & calculate pending fee records
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
        // Initialize inputs for existing pending fee records
        const inputs: any = {};
        const pending = res.feeRecords?.filter((f: any) => f.status !== 'PAID') || [];
        pending.forEach((f: any) => {
          const defaultAmount = (preselectedFeeRecordId && f.id === preselectedFeeRecordId) ? f.remainingBalance : 0;
          inputs[f.id] = {
            amount: defaultAmount,
            discount: 0
          };
        });
        setFeeInputs(inputs);

        // Pre-select first enrolled class in manual month selector
        const enrolledClasses = (res.enrollments || [])
          .map((en: any) => en.classId || en.class?.id)
          .filter(Boolean);
        if (enrolledClasses.length > 0) {
          setSelectedManualClassId(enrolledClasses[0]);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [selectedStudentId, preselectedFeeRecordId]);

  if (!isOpen) return null;

  // Last Month Fee Analysis
  const lastMonthCode = previousMonthObj.code;
  const lastMonthName = previousMonthObj.name;
  const lastMonthFeeRecords = (studentDetails?.feeRecords || []).filter((f: any) => f.month === lastMonthCode);
  const lastMonthPendingRecords = lastMonthFeeRecords.filter((f: any) => f.status !== 'PAID');
  const totalLastMonthPending = lastMonthPendingRecords.reduce((sum: number, f: any) => sum + (Number(f.remainingBalance) || 0), 0);

  const handleInputChange = (feeId: string, field: 'amount' | 'discount', value: number) => {
    setFeeInputs(prev => ({
      ...prev,
      [feeId]: {
        ...(prev[feeId] || { amount: 0, discount: 0 }),
        [field]: value
      }
    }));
  };

  const handlePayFull = (feeId: string, balance: number) => {
    handleInputChange(feeId, 'amount', balance);
  };

  const handlePayLastMonthFirst = () => {
    lastMonthPendingRecords.forEach((f: any) => {
      handlePayFull(f.id, f.remainingBalance);
    });
  };

  // Add Manual Month Fee Collection
  const handleAddManualMonth = () => {
    if (!selectedManualMonth || !selectedManualClassId) {
      setError('Please select both a month and a class to collect tuition fees.');
      return;
    }

    const monthObj = monthList.find(m => m.code === selectedManualMonth);
    const monthLabel = monthObj ? monthObj.name : selectedManualMonth;

    // Check if an existing fee record exists for this class & month
    const existingRecord = studentDetails?.feeRecords?.find(
      (f: any) => (f.classId === selectedManualClassId || f.class?.id === selectedManualClassId) && f.month === selectedManualMonth
    );

    if (existingRecord) {
      // If already exists, set its amount to remaining balance (or total due)
      const payAmt = existingRecord.remainingBalance > 0 ? existingRecord.remainingBalance : existingRecord.baseFee;
      setFeeInputs(prev => ({
        ...prev,
        [existingRecord.id]: {
          amount: payAmt,
          discount: 0
        }
      }));
      setError(null);
      return;
    }

    // Look up class details
    const cls = allClasses.find(c => c.id === selectedManualClassId) || 
      studentDetails?.enrollments?.find((e: any) => (e.classId || e.class?.id) === selectedManualClassId)?.class;

    const className = cls?.name || 'Selected Class';
    const monthlyFee = Number(cls?.monthlyFee) || 0;
    const customId = `manual-${selectedManualClassId}-${selectedManualMonth}`;

    setManualFeeItems(prev => {
      if (prev.some(m => m.id === customId)) return prev;
      return [
        ...prev,
        {
          id: customId,
          classId: selectedManualClassId,
          className,
          month: selectedManualMonth,
          monthLabel,
          monthlyFee
        }
      ];
    });

    setFeeInputs(prev => ({
      ...prev,
      [customId]: {
        amount: monthlyFee,
        discount: 0
      }
    }));

    setError(null);
  };

  const handleRemoveManualItem = (customId: string) => {
    setManualFeeItems(prev => prev.filter(m => m.id !== customId));
    setFeeInputs(prev => {
      const copy = { ...prev };
      delete copy[customId];
      return copy;
    });
  };

  const calculateGrandTotal = () => {
    return Object.values(feeInputs).reduce((sum, item) => sum + (Number(item?.amount) || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const itemsToPay = Object.keys(feeInputs)
      .filter(feeId => Number(feeInputs[feeId]?.amount) > 0)
      .map(feeId => {
        const manual = manualFeeItems.find(m => m.id === feeId);
        if (manual) {
          return {
            classId: manual.classId,
            month: manual.month,
            amountPaid: Number(feeInputs[feeId].amount),
            discount: Number(feeInputs[feeId].discount || 0)
          };
        }
        const existing = studentDetails?.feeRecords?.find((f: any) => f.id === feeId);
        return {
          feeRecordId: feeId,
          classId: existing?.classId,
          month: existing?.month,
          amountPaid: Number(feeInputs[feeId].amount),
          discount: Number(feeInputs[feeId].discount || 0)
        };
      });

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

      onPaymentSuccess(res.receiptNumber, selectedStudentId);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment processing failed');
    } finally {
      setSubmitting(false);
    }
  };

  const grandTotal = calculateGrandTotal();

  // Filter student's enrolled classes to show in dropdown
  const studentEnrolledClasses = studentDetails?.enrollments?.map((en: any) => en.class).filter(Boolean) || [];
  const displayClasses = studentEnrolledClasses.length > 0 ? studentEnrolledClasses : allClasses;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] sm:max-h-[92vh]">
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

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Student Selector / Targeted Student View */}
          {(isStudentOrParent || (preselectedStudentId && !isChangingStudent)) && studentDetails ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-3 min-w-0">
                <img 
                  src={getStudentAvatar(studentDetails)} 
                  alt="" 
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-500/30 shrink-0 bg-slate-100" 
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                    {isStudentOrParent ? 'My Student Account' : 'Student Selected'}
                  </span>
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">{studentDetails.fullName}</h4>
                  <p className="text-xs font-mono text-slate-600 truncate">{studentDetails.studentIdNumber} • {studentDetails.grade}</p>
                </div>
              </div>
              {!isStudentOrParent && (
                <button
                  type="button"
                  onClick={() => setIsChangingStudent(true)}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 shadow-sm transition-all shrink-0 ml-2"
                >
                  Change
                </button>
              )}
            </div>
          ) : !isStudentOrParent ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Select Student</label>
                {preselectedStudentId && isChangingStudent && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(preselectedStudentId);
                      setIsChangingStudent(false);
                    }}
                    className="text-[11px] font-bold text-brand-600 hover:underline"
                  >
                    Back to Scanned Student
                  </button>
                )}
              </div>
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
          ) : null}

          {/* Loading state */}
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-400">Loading student details &amp; fee records...</div>
          ) : studentDetails ? (
            <div className="space-y-4">
              {/* SECTION: CHECK LAST MONTH STATUS BANNER */}
              <div className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm ${
                lastMonthPendingRecords.length > 0 
                  ? 'bg-amber-50/90 border-amber-300 text-amber-950' 
                  : lastMonthFeeRecords.length > 0
                    ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-start sm:items-center space-x-2.5 min-w-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                    lastMonthPendingRecords.length > 0 
                      ? 'bg-amber-500/20 text-amber-700' 
                      : lastMonthFeeRecords.length > 0
                        ? 'bg-emerald-500/20 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                  }`}>
                    {lastMonthPendingRecords.length > 0 ? (
                      <AlertCircle size={18} className="text-amber-700" />
                    ) : lastMonthFeeRecords.length > 0 ? (
                      <CheckCircle2 size={18} className="text-emerald-700" />
                    ) : (
                      <Clock size={18} className="text-slate-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 font-bold">
                      <span>Last Month Fee Check: {lastMonthName}</span>
                      {lastMonthPendingRecords.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black uppercase">
                          {lastMonthPendingRecords.length} Unpaid Class(es)
                        </span>
                      ) : lastMonthFeeRecords.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase">
                          Fully Settled ✅
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-semibold">
                          No Record Logged
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] opacity-90 mt-0.5 leading-snug">
                      {lastMonthPendingRecords.length > 0
                        ? `Pending balance for ${lastMonthName}: ${formatLKR(totalLastMonthPending)} (${lastMonthPendingRecords.map((f: any) => f.class?.name || 'Class').join(', ')})`
                        : lastMonthFeeRecords.length > 0
                          ? `All enrolled classes for ${lastMonthName} are fully paid.`
                          : `No record for ${lastMonthName}. Use the Manual Month Selection below to collect for this or any month.`}
                    </p>
                  </div>
                </div>

                {lastMonthPendingRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={handlePayLastMonthFirst}
                    className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all shrink-0 self-end sm:self-auto flex items-center gap-1.5 active:scale-95"
                  >
                    <Check size={14} />
                    <span>Pay Last Month ({formatLKR(totalLastMonthPending)})</span>
                  </button>
                )}
              </div>

              {/* SECTION: MANUAL MONTH SELECTOR & COLLECTION */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/90 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar size={15} className="text-indigo-600" />
                    <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                      Manual Month Fee Selection
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualMonthPicker(prev => !prev)}
                    className="text-[11px] font-bold text-indigo-700 hover:underline flex items-center gap-1"
                  >
                    <span>{showManualMonthPicker ? 'Hide Selector' : '+ Select Any Month'}</span>
                  </button>
                </div>

                {/* Dropdowns for Month and Class */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-1">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-1">Select Month</label>
                    <select
                      value={selectedManualMonth}
                      onChange={e => setSelectedManualMonth(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs font-medium text-slate-800"
                    >
                      {monthList.map(m => (
                        <option key={m.code} value={m.code}>
                          {m.name} {m.isCurrent ? '⭐ (Current)' : m.isPrevious ? '⚡ (Last Month)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-indigo-900 uppercase mb-1">Select Class</label>
                    <select
                      value={selectedManualClassId}
                      onChange={e => setSelectedManualClassId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-white text-xs font-medium text-slate-800"
                    >
                      {displayClasses.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({formatLKR(c.monthlyFee)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddManualMonth}
                      className="w-full py-1.5 px-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1 active:scale-95"
                      title="Add selected month fee to collection"
                    >
                      <Plus size={14} />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION: PARENT SMS RECEIPT BANNER */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-700 flex items-center justify-center shrink-0">
                    <Smartphone size={15} />
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-slate-900 block text-[11px]">
                      Instant Parent SMS &amp; WhatsApp Receipt
                    </span>
                    <p className="text-[11px] text-slate-500 font-mono truncate">
                      To: {studentDetails.parentPhone || studentDetails.phone || 'No phone recorded'}
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0 self-end sm:self-auto">
                  Auto-Dispatched
                </span>
              </div>

              {/* SECTION: OUTSTANDING & ACTIVE FEE ITEMS TO COLLECT */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Tuition Fees to Collect
                  </span>
                  <span className="text-xs text-slate-500">{studentDetails.fullName}</span>
                </div>

                {/* Existing Pending Fee Records from DB */}
                {studentDetails.feeRecords?.filter((f: any) => f.status !== 'PAID').map((f: any) => (
                  <div key={f.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{f.class?.name || 'Enrolled Class'}</h4>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Month: <strong className="text-slate-700 font-bold">{f.month}</strong> &bull; Total Due: {formatLKR(f.totalDue)} &bull; Paid: {formatLKR(f.paidAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">BALANCE DUE</span>
                        <span className="font-black text-sm text-amber-700">{formatLKR(f.remainingBalance)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end pt-2 border-t border-slate-200/60">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Pay Amount (Rs.)</label>
                        <input
                          type="number"
                          min="0"
                          max={f.remainingBalance}
                          value={feeInputs[f.id]?.amount ?? 0}
                          onChange={(e) => handleInputChange(f.id, 'amount', Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-brand-700 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Discount (Rs.)</label>
                        <input
                          type="number"
                          min="0"
                          value={feeInputs[f.id]?.discount ?? 0}
                          onChange={(e) => handleInputChange(f.id, 'discount', Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div className="pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handlePayFull(f.id, f.remainingBalance)}
                          className="w-full py-1.5 rounded-lg bg-slate-200 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-bold transition-colors active:scale-95"
                        >
                          Pay Full ({formatLKR(f.remainingBalance)})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Manually Added Month Fee Items */}
                {manualFeeItems.map((m) => (
                  <div key={m.id} className="p-3.5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[9px] font-extrabold uppercase">
                          Manual Month
                        </span>
                        <div>
                          <h4 className="font-bold text-xs text-indigo-950">{m.className}</h4>
                          <p className="text-[11px] text-indigo-700 font-mono font-medium">
                            Month: <strong>{m.monthLabel}</strong> ({m.month}) &bull; Class Fee: {formatLKR(m.monthlyFee)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveManualItem(m.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Remove this month fee"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-end pt-2 border-t border-indigo-200/50">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Pay Amount (Rs.)</label>
                        <input
                          type="number"
                          min="0"
                          value={feeInputs[m.id]?.amount ?? m.monthlyFee}
                          onChange={(e) => handleInputChange(m.id, 'amount', Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg border border-indigo-300 text-xs font-bold text-brand-700 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Discount (Rs.)</label>
                        <input
                          type="number"
                          min="0"
                          value={feeInputs[m.id]?.discount ?? 0}
                          onChange={(e) => handleInputChange(m.id, 'discount', Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs bg-white"
                        />
                      </div>
                      <div className="pt-1 sm:pt-0">
                        <button
                          type="button"
                          onClick={() => handlePayFull(m.id, m.monthlyFee)}
                          className="w-full py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-800 text-xs font-bold transition-colors active:scale-95"
                        >
                          Pay Full ({formatLKR(m.monthlyFee)})
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {studentDetails.feeRecords?.filter((f: any) => f.status !== 'PAID').length === 0 && manualFeeItems.length === 0 && (
                  <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center text-xs">
                    All pre-generated fees are completely paid for this student!
                    <p className="mt-1 text-slate-600">
                      To collect advance or past fees for another month, select a month above and click <strong>Add</strong>.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Payment Method & Reference */}
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

          {/* Sticky Footer */}
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
