import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  CheckCircle2, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  ArrowUpRight, 
  QrCode, 
  ChevronRight, 
  Clock, 
  Search, 
  Filter, 
  MessageCircle, 
  RefreshCw,
  Eye,
  Check
} from 'lucide-react';
import { apiRequest, formatLKR, formatDate } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import { getStudentAvatar } from '../utils/studentAvatars';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onOpenReceipt: (receiptNo: string) => void;
  onOpenQuickScan: () => void;
  onOpenStudentProfile?: (studentId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenReceipt,
  onOpenQuickScan,
  onOpenStudentProfile
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Attendance Section Filters & Date
  const [selectedAttDate, setSelectedAttDate] = useState<string>('');
  const [attSearch, setAttSearch] = useState<string>('');
  const [attClassFilter, setAttClassFilter] = useState<string>('ALL');
  const [attStatusFilter, setAttStatusFilter] = useState<string>('ALL');

  const loadDashboard = (attDate?: string, silent: boolean = false) => {
    if (!silent) setRefreshing(true);
    const url = attDate ? `/dashboard?attendanceDate=${attDate}` : '/dashboard';
    apiRequest(url)
      .then(res => {
        setData(res);
        if (res?.attendanceDate && !selectedAttDate) {
          setSelectedAttDate(res.attendanceDate);
        }
      })
      .catch(err => console.error('Failed to load dashboard:', err))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadDashboard();

    // Real-time synchronization: listen for custom event across modules (payments, scans, profile updates)
    const handleDataChanged = () => {
      loadDashboard(selectedAttDate, true);
    };

    window.addEventListener('cams-data-changed', handleDataChanged);

    // Auto-poll every 8 seconds for background real-time updates
    const pollTimer = setInterval(() => {
      loadDashboard(selectedAttDate, true);
    }, 8000);

    // Refresh when user returns to tab
    const handleFocus = () => {
      loadDashboard(selectedAttDate, true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('cams-data-changed', handleDataChanged);
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollTimer);
    };
  }, [selectedAttDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-semibold">Loading Campus Dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const recentPayments = data?.recentPayments || [];
  const recentRegistrations = data?.recentRegistrations || [];
  const todaysClasses = data?.todaysClasses || [];
  const todaysAttendanceList = data?.todaysAttendanceList || [];
  const allAttendanceDates = data?.allAttendanceDates || [];
  const todayStr = new Date().toISOString().substring(0, 10);
  const currentAttendanceDate = selectedAttDate || data?.attendanceDate || todayStr;

  // Filtered attendance list
  const filteredAttendanceList = todaysAttendanceList.filter((a: any) => {
    if (attClassFilter !== 'ALL' && a.classId !== attClassFilter) return false;
    if (attStatusFilter !== 'ALL' && a.status !== attStatusFilter) return false;
    if (attSearch) {
      const q = attSearch.toLowerCase();
      return (
        a.studentName?.toLowerCase().includes(q) ||
        a.studentIdNumber?.toLowerCase().includes(q) ||
        a.className?.toLowerCase().includes(q) ||
        (a.teacherName && a.teacherName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* PROFESSIONAL EXECUTIVE HEADER */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Real-Time Sync Active
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Tuition Management & Operations Dashboard
            </h1>
            <p className="text-xs text-slate-500">
              Welcome back, <strong className="text-slate-800">{user?.name}</strong>. Monitor live attendance scans, tuition fee collections, and financial accounts.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={onOpenQuickScan}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <QrCode size={16} />
              <span>QR / Barcode Scanner</span>
            </button>

            <button
              onClick={() => onNavigate('payments')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <CreditCard size={16} />
              <span>Collect Fee</span>
            </button>

            <button
              onClick={() => loadDashboard(selectedAttDate)}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-sm transition-all"
              title="Refresh Dashboard"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-slate-800' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* EXECUTIVE KPI STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Monthly Tuition Revenue */}
        <div 
          onClick={() => onNavigate('payments')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Monthly Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-mono">
              {formatLKR(kpis.monthlyRevenue || 0)}
            </h3>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Today Collected:</span>
            <strong className="text-slate-800 font-mono">{formatLKR(kpis.todayRevenue || 0)}</strong>
          </div>
        </div>

        {/* KPI 2: Active Student Enrollment */}
        <div 
          onClick={() => onNavigate('students')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Students</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {kpis.activeStudents || 0}
            </h3>
            <span className="text-xs text-slate-400 font-medium">/ {kpis.totalStudents || 0} registered</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Status:</span>
            <span className="text-emerald-700 font-semibold">100% Active Enrollment</span>
          </div>
        </div>

        {/* KPI 3: Today's Gate Attendance */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Attendance</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {kpis.todaysPresentCount || 0}
            </h3>
            <span className="text-xs text-slate-400 font-medium">Present Scans</span>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Absentees:</span>
            <strong className="text-slate-700">{kpis.todaysAbsentCount || 0} Students</strong>
          </div>
        </div>

        {/* KPI 4: Outstanding Tuition Fees */}
        <div 
          onClick={() => onNavigate('pending-fees')}
          className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Outstanding Dues</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight font-mono">
              {formatLKR(kpis.pendingFees || 0)}
            </h3>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Overdue Balance:</span>
            <span className="text-amber-700 font-semibold cursor-pointer group-hover:underline">Reconcile Fees →</span>
          </div>
        </div>

      </div>

      {/* TODAY'S ATTENDANCE ROSTER & ATTENDED CLASSES */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                Live Scan Feed
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Date: <strong>{currentAttendanceDate}</strong>
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              Today's Attendance Roster & Attended Classes
            </h3>
            <p className="text-xs text-slate-500">
              Live verification of student arrivals, tuition subjects attended, arrival timestamps, and fee balance status.
            </p>
          </div>

          {/* Quick Date and Filter Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <input 
              type="text"
              placeholder="Search student or class..."
              value={attSearch}
              onChange={e => setAttSearch(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800"
            />
            <input 
              type="date"
              value={currentAttendanceDate}
              onChange={e => {
                setSelectedAttDate(e.target.value);
                loadDashboard(e.target.value);
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
            />
          </div>
        </div>

        {/* Table of Scanned Students */}
        <div className="overflow-x-auto">
          {filteredAttendanceList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <CheckCircle2 size={22} />
              </div>
              <p className="text-xs font-bold text-slate-600">No attendance scans recorded for this session yet.</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Scan student QR passes or barcodes at the gate using the scanner button above to view live arrivals here.
              </p>
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Enrolled Class</th>
                  <th className="py-3 px-3">Time Checked-In</th>
                  <th className="py-3 px-3">Method</th>
                  <th className="py-3 px-3">Tuition Fee Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttendanceList.map((att: any) => (
                  <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2.5">
                        <img 
                          src={getStudentAvatar(att)} 
                          alt="" 
                          className="w-8 h-8 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0" 
                        />
                        <div>
                          <p className="font-bold text-slate-900">{att.studentName}</p>
                          <p className="text-[10px] font-mono text-slate-500">{att.studentIdNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-800">{att.className}</p>
                      <p className="text-[10px] text-slate-500">{att.teacherName}</p>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {att.scannedAt ? new Date(att.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {att.method || 'QR_CODE'}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {att.feeInfo?.hasPendingFees ? (
                        <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                          ⚠️ Due: {formatLKR(att.feeInfo.remainingBalance)}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          ✓ Settled
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {att.parentPhone && (
                          <a
                            href={`https://wa.me/${att.parentPhone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1"
                            title="Open WhatsApp chat with parent"
                          >
                            <MessageCircle size={13} />
                            <span>WhatsApp</span>
                          </a>
                        )}
                        <button
                          onClick={() => onNavigate('attendance')}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-all"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* TWO COLUMNS: FINANCIAL CASH FLOW CHART & RECENT RECEIPTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tuition Revenue 6-Month Trend */}
        <div className="lg:col-span-2 bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Monthly Tuition Cash Flow Trend</h3>
              <p className="text-xs text-slate-500">6-Month historical collections vs operational expenditures</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900" /> Revenue
              </span>
              <span className="flex items-center gap-1.5 text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Expenses
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenueChart || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `Rs.${val/1000}k`} />
                <Tooltip 
                  formatter={(val: any) => formatLKR(val)}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Scheduled Classes */}
        <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Today's Class Timetable</h3>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
              {todaysClasses.length} Scheduled
            </span>
          </div>

          <div className="flex-1 space-y-2.5">
            {todaysClasses.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No classes scheduled for today ({new Date().toLocaleDateString('en-GB', { weekday: 'long' })}).
              </div>
            ) : (
              todaysClasses.slice(0, 4).map((c: any) => (
                <div key={c.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-slate-300 transition-all space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 text-[10px] font-mono font-bold">
                      {c.classCode}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Clock size={12} /> {c.startTime} - {c.endTime}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-900 leading-snug">{c.name}</h5>
                  <p className="text-[11px] text-slate-500">Hall: {c.room || c.hall || 'Main Hall'}</p>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigate('attendance')}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm mt-auto"
          >
            Open Attendance System
          </button>
        </div>

      </div>

      {/* RECENT FEE RECEIPTS LOG TABLE */}
      <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Recent Cashier Receipts & Transactions</h3>
            <p className="text-xs text-slate-500">Real-time ledger of tuition fees received at front desk</p>
          </div>
          <button
            onClick={() => onNavigate('payments')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            <span>View All Payments</span>
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentPayments.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No payments recorded yet. Click "Collect Fee" above to log a student payment.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Receipt No</th>
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Amount Paid</th>
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments.slice(0, 6).map((pay: any) => (
                  <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">{pay.receiptNumber}</td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{pay.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{pay.studentIdNumber}</p>
                    </td>
                    <td className="py-3 px-3 font-black text-slate-900 font-mono">{formatLKR(pay.totalAmount)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {pay.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{formatDate(pay.paymentDate)}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onOpenReceipt(pay.receiptNumber)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
};
