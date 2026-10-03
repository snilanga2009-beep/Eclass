import React, { useState, useEffect } from 'react';
import { 
  AlertCircle, 
  Search, 
  Send, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  Phone, 
  MessageSquare,
  Filter
} from 'lucide-react';
import { apiRequest, formatLKR, formatDate } from '../api';

interface PendingFeesProps {
  onOpenPaymentModal: (studentId: string, feeRecordId: string) => void;
  onOpenStudentProfile: (studentId: string) => void;
}

export const PendingFees: React.FC<PendingFeesProps> = ({
  onOpenPaymentModal,
  onOpenStudentProfile
}) => {
  const [data, setData] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'CURRENT_MONTH' | 'OVERDUE'
  const [classFilter, setClassFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [reminderStatus, setReminderStatus] = useState<string | null>(null);

  const fetchPendingFees = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        filter,
        classId: classFilter,
        search
      });
      const res = await apiRequest(`/pending-fees?${q.toString()}`);
      setData(res);
    } catch (err) {
      console.error('Failed to load pending fees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingFees();
    apiRequest<any[]>('/classes').then(res => setClasses(res || []));
  }, [filter, classFilter]);

  // Real-time synchronization: Auto-refresh pending fees on payment or changes
  useEffect(() => {
    const handleDataChanged = () => {
      fetchPendingFees();
    };
    window.addEventListener('cams-data-changed', handleDataChanged);
    return () => window.removeEventListener('cams-data-changed', handleDataChanged);
  }, [filter, classFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPendingFees();
  };

  const handleSendReminder = async (feeRecordId: string, channel: 'SMS' | 'WHATSAPP') => {
    try {
      const res = await apiRequest('/pending-fees/remind', {
        method: 'POST',
        body: JSON.stringify({ feeRecordId, channel })
      });
      setReminderStatus(res.message);
      setTimeout(() => setReminderStatus(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to send reminder');
    }
  };

  const summary = data?.summary || {};
  const records = data?.records || [];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Pending & Overdue Fees</h1>
          <p className="text-xs text-slate-500 mt-0.5">Identify outstanding tuition balances, send automated SMS/WhatsApp alerts, and collect payments</p>
        </div>
      </div>

      {reminderStatus && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
          <span>{reminderStatus}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pending Receivables</span>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">{formatLKR(summary.totalPendingAmount || 0)}</p>
          <p className="text-xs text-slate-500">{summary.totalRecords || 0} unpaid fee items</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Defaulter Students</span>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">{summary.totalPendingStudents || 0}</p>
          <p className="text-xs text-slate-500">Students with at least 1 pending class fee</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overdue (&gt; 30 Days)</span>
          <p className="text-2xl sm:text-3xl font-black text-rose-600">{formatLKR(summary.overdueAmount || 0)}</p>
          <p className="text-xs text-rose-700 font-medium">Critical collection follow-up</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, class name, parent phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex items-center space-x-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'ALL' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Unpaid
            </button>
            <button
              onClick={() => setFilter('CURRENT_MONTH')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'CURRENT_MONTH' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Current Month
            </button>
            <button
              onClick={() => setFilter('OVERDUE')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === 'OVERDUE' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Overdue
            </button>
          </div>

          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none max-w-[150px] truncate"
          >
            <option value="ALL">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Pending Fees Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Month</th>
                <th className="py-3 px-4">Fee Amount</th>
                <th className="py-3 px-4">Paid</th>
                <th className="py-3 px-4">Outstanding Due</th>
                <th className="py-3 px-4">Parent Phone</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading pending fees...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">No pending fees match the selected filter.</td>
                </tr>
              ) : (
                records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <p 
                        onClick={() => onOpenStudentProfile(r.student?.id)}
                        className="font-bold text-slate-900 hover:text-brand-600 cursor-pointer"
                      >
                        {r.student?.fullName || 'Student'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">{r.student?.studentIdNumber}</p>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{r.class?.name}</p>
                      <p className="text-[10px] text-slate-400">{r.teacher?.name}</p>
                    </td>

                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {r.month}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {formatLKR(r.totalDue)}
                    </td>

                    <td className="py-3 px-4 font-medium text-emerald-700">
                      {formatLKR(r.paidAmount)}
                    </td>

                    <td className="py-3 px-4 font-black text-amber-700 text-sm">
                      {formatLKR(r.remainingBalance)}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {r.student?.parentPhone || r.student?.phone || 'N/A'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleSendReminder(r.id, 'SMS')}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 text-brand-700 font-semibold text-[10px] transition-colors"
                          title="Send SMS Fee Reminder"
                        >
                          SMS
                        </button>
                        <button
                          onClick={() => handleSendReminder(r.id, 'WHATSAPP')}
                          className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[10px] transition-colors"
                          title="Send WhatsApp Fee Reminder"
                        >
                          WhatsApp
                        </button>
                        <button
                          onClick={() => onOpenPaymentModal(r.student?.id, r.id)}
                          className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-[10px] shadow-sm transition-all"
                        >
                          Pay
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
