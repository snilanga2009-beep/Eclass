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
  Check,
  UserPlus,
  Receipt,
  FileText,
  DollarSign,
  Building2,
  Phone,
  Radio,
  ArrowRight,
  ShieldCheck,
  Sparkles
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
  CartesianGrid
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

  // Live Colombo digital clock
  const [liveClock, setLiveClock] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const datePart = now.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      const timePart = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      setLiveClock(`${datePart} • ${timePart}`);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

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

    // Auto-poll every 10 seconds for background real-time updates
    const pollTimer = setInterval(() => {
      loadDashboard(selectedAttDate, true);
    }, 10000);

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
          <p className="text-xs text-slate-500 font-semibold tracking-wide">Loading Campus Command Dashboard...</p>
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

  // Calculate Attendance Metrics
  const presentCount = kpis.todaysPresentCount || 0;
  const absentCount = kpis.todaysAbsentCount || 0;
  const totalAttExpected = presentCount + absentCount;
  const attendanceRate = totalAttExpected > 0 
    ? Math.round((presentCount / totalAttExpected) * 100) 
    : (kpis.activeStudents > 0 ? Math.min(100, Math.round((presentCount / kpis.activeStudents) * 100)) : 0);

  return (
    <div className="space-y-6 pb-8">
      
      {/* EXECUTIVE CONTROL STATION HEADER */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Subtle background glow effect */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Real-Time Sync Active
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono text-slate-300 bg-slate-800/80 border border-slate-700/80">
                <Clock size={12} className="text-slate-400" />
                <span>{liveClock || 'Live Sri Lanka Time'}</span>
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Campus Operations & Management Control
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Welcome, <strong className="text-white font-semibold">{user?.name}</strong>. Monitor real-time gate RFID/QR attendance, cashier collections, admission fees, and timetable sessions.
              </p>
            </div>
          </div>

          {/* Quick Header Operational Station */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={onOpenQuickScan}
              className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer"
            >
              <QrCode size={16} />
              <span>Gate QR Scanner</span>
            </button>

            <button
              onClick={() => onNavigate('students')}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <UserPlus size={16} className="text-brand-600" />
              <span>New Admission</span>
            </button>

            <button
              onClick={() => onNavigate('payments')}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <CreditCard size={16} className="text-amber-400" />
              <span>Collect Fee</span>
            </button>

            <button
              onClick={() => loadDashboard(selectedAttDate)}
              disabled={refreshing}
              className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin text-white' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* 5 EXECUTIVE HIGH-UTILITY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* KPI 1: Today's Cash Intake */}
        <div 
          onClick={() => onNavigate('daily-earnings')}
          className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today's Collections</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <Receipt size={16} />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {formatLKR(kpis.todayRevenue || 0)}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Cash Desk Intake</span>
            <span className="text-emerald-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>View Ledger</span>
              <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* KPI 2: Monthly Tuition Revenue */}
        <div 
          onClick={() => onNavigate('payments')}
          className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <CreditCard size={16} />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {formatLKR(kpis.monthlyRevenue || 0)}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Gross MTD Revenue</span>
            <span className="text-indigo-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>All Receipts</span>
              <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* KPI 3: Today's Gate Attendance */}
        <div 
          onClick={() => onNavigate('attendance')}
          className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gate Attendance</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {presentCount}
              </h3>
              <span className="text-xs text-slate-400 font-medium">/ {presentCount + absentCount} scanned</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, attendanceRate)}%` }}
              />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Turnout: <strong className="text-teal-700 font-bold">{attendanceRate}%</strong></span>
            <span className="text-slate-500 font-medium">{absentCount} Absent</span>
          </div>
        </div>

        {/* KPI 4: Active Student Body */}
        <div 
          onClick={() => onNavigate('students')}
          className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Students</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline gap-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                {kpis.activeStudents || 0}
              </h3>
              <span className="text-xs text-slate-400 font-medium">/ {kpis.totalStudents || 0} total</span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Active Enrollments</span>
            <span className="text-blue-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>Directory</span>
              <ChevronRight size={12} />
            </span>
          </div>
        </div>

        {/* KPI 5: Outstanding Tuition Fees */}
        <div 
          onClick={() => onNavigate('pending-fees')}
          className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overdue Fees</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <AlertCircle size={16} />
              </div>
            </div>
            <div className="mt-2.5">
              <h3 className="text-2xl font-black text-amber-600 tracking-tight font-mono">
                {formatLKR(kpis.pendingFees || 0)}
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Receivables</span>
            <span className="text-amber-700 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              <span>Settle Dues</span>
              <ChevronRight size={12} />
            </span>
          </div>
        </div>

      </div>

      {/* OPERATIONS WORKBENCH: 2 COLUMNS (LEFT 2/3, RIGHT 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: LIVE ATTENDANCE ROSTER + CASH FLOW CHART */}
        <div className="lg:col-span-2 space-y-6">

          {/* SECTION: TODAY'S LIVE ATTENDANCE ROSTER & GATE ARRIVALS */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                    Gate Check-in Stream
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Session: <strong>{currentAttendanceDate}</strong>
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  Live Attendance Roster & Arrival Verification
                </h3>
                <p className="text-xs text-slate-500">
                  Verification of arrival timestamps, RFID card swipes, classes attended, and real-time fee balance.
                </p>
              </div>

              {/* Quick Search & Session Date Picker */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search student or class..."
                    value={attSearch}
                    onChange={e => setAttSearch(e.target.value)}
                    className="pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-800"
                  />
                </div>
                <input 
                  type="date"
                  value={currentAttendanceDate}
                  onChange={e => {
                    setSelectedAttDate(e.target.value);
                    loadDashboard(e.target.value);
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                />
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto">
              {filteredAttendanceList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                    <CheckCircle2 size={22} />
                  </div>
                  <p className="text-xs font-bold text-slate-700">No attendance scans recorded for this session yet.</p>
                  <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                    Tap 125kHz RFID cards or scan student QR passes at the entrance to view real-time arrivals here.
                  </p>
                  <button
                    onClick={onOpenQuickScan}
                    className="mt-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <QrCode size={13} />
                    <span>Launch Gate Scanner</span>
                  </button>
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-3">Student</th>
                      <th className="py-3 px-3">Tuition Class & Teacher</th>
                      <th className="py-3 px-3">Time Checked-In</th>
                      <th className="py-3 px-3">Method</th>
                      <th className="py-3 px-3">Tuition Fee Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttendanceList.map((att: any) => {
                      const rawPhone = (att.parentPhone || att.phone || '').replace(/[^0-9]/g, '');
                      const cleanPhone = rawPhone.startsWith('0') ? '94' + rawPhone.substring(1) : rawPhone;

                      return (
                        <tr key={att.id} className="hover:bg-slate-50/70 transition-colors group">
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2.5">
                              <img 
                                src={getStudentAvatar(att)} 
                                alt="" 
                                className="w-8 h-8 rounded-full object-cover bg-slate-100 border border-slate-200 shrink-0" 
                              />
                              <div className="min-w-0">
                                <p 
                                  onClick={() => onOpenStudentProfile && onOpenStudentProfile(att.studentId)}
                                  className="font-bold text-slate-900 group-hover:text-brand-600 cursor-pointer truncate"
                                >
                                  {att.studentName}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400">{att.studentIdNumber}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-3">
                            <p className="font-semibold text-slate-800 truncate max-w-[150px]">{att.className}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{att.teacherName || 'Assigned Faculty'}</p>
                          </td>

                          <td className="py-3 px-3 font-mono text-slate-600">
                            {att.scannedAt ? new Date(att.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </td>

                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold">
                              {att.method || 'QR_CODE'}
                            </span>
                          </td>

                          <td className="py-3 px-3">
                            {att.feeInfo?.hasPendingFees ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                ⚠️ Due: {formatLKR(att.feeInfo.remainingBalance)}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                ✓ Settled
                              </span>
                            )}
                          </td>

                          <td className="py-3 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/${cleanPhone}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 transition-colors"
                                  title="Open WhatsApp chat with parent"
                                >
                                  <MessageCircle size={13} />
                                  <span className="hidden sm:inline">WhatsApp</span>
                                </a>
                              )}
                              <button
                                onClick={() => onOpenStudentProfile ? onOpenStudentProfile(att.studentId) : onNavigate('attendance')}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition-all"
                              >
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* SECTION: 6-MONTH TUITION CASH FLOW TREND */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Monthly Tuition Cash Flow & Revenue Trend</h3>
                <p className="text-xs text-slate-500">6-Month historical collections vs operational expenditures</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-900" /> Revenue
                </span>
                <span className="flex items-center gap-1.5 text-rose-600 font-semibold">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Expenses
                </span>
              </div>
            </div>

            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.revenueChart || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f172a" stopOpacity={0.18}/>
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
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '14px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#0f172a" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: TIMETABLE + RECENT RECEIPTS + NEW ADMISSIONS */}
        <div className="space-y-6">

          {/* SECTION: TODAY'S CLASS TIMETABLE & HALLS */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Today's Class Timetable</h3>
                <p className="text-[11px] text-slate-500">Scheduled tuition batches for today</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                {todaysClasses.length} Batches
              </span>
            </div>

            <div className="space-y-2.5">
              {todaysClasses.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No classes scheduled for today ({new Date().toLocaleDateString('en-GB', { weekday: 'long' })}).
                </div>
              ) : (
                todaysClasses.slice(0, 4).map((c: any) => (
                  <div key={c.id} className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/70 hover:border-slate-300 transition-all space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-white text-slate-800 border border-slate-200 text-[10px] font-mono font-bold">
                        {c.classCode || 'BATCH'}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1 font-mono">
                        <Clock size={11} className="text-slate-400" />
                        <span>{c.startTime} - {c.endTime}</span>
                      </span>
                    </div>
                    <h5 className="font-bold text-xs text-slate-900 leading-snug">{c.name}</h5>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>{c.teacher?.name || 'Assigned Faculty'}</span>
                      <span className="font-medium text-slate-600">Hall: {c.room || c.hall || 'Main Hall'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onNavigate('attendance')}
              className="w-full py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Take Class Attendance</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* SECTION: RECENT CASHIER RECEIPTS */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Recent Cashier Receipts</h3>
                <p className="text-[11px] text-slate-500">Tuition fees collected at reception</p>
              </div>
              <button
                onClick={() => onNavigate('payments')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5"
              >
                <span>All Receipts</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="space-y-2">
              {recentPayments.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No payment receipts recorded yet.
                </div>
              ) : (
                recentPayments.slice(0, 5).map((pay: any) => (
                  <div 
                    key={pay.id} 
                    className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-2 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-slate-900">{pay.receiptNumber}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-white border border-slate-200 text-slate-600">
                          {pay.paymentMethod}
                        </span>
                      </div>
                      <p className="text-[11px] font-medium text-slate-700 truncate mt-0.5">{pay.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{formatDate(pay.paymentDate)}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-black text-xs text-slate-900 font-mono">{formatLKR(pay.totalAmount)}</p>
                      <button
                        onClick={() => onOpenReceipt(pay.receiptNumber)}
                        className="mt-1 px-2.5 py-0.5 rounded-lg bg-white hover:bg-slate-200 text-slate-800 text-[10px] font-bold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                      >
                        Print
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION: NEW STUDENT ADMISSIONS */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">New Student Admissions</h3>
                <p className="text-[11px] text-slate-500">Recent student registrations & admission fees</p>
              </div>
              <button
                onClick={() => onNavigate('students')}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-0.5"
              >
                <span>View All</span>
                <ChevronRight size={13} />
              </button>
            </div>

            <div className="space-y-2">
              {recentRegistrations.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No registered students yet.
                </div>
              ) : (
                recentRegistrations.slice(0, 4).map((s: any) => (
                  <div 
                    key={s.id} 
                    className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-2 hover:bg-slate-100/80 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img 
                        src={getStudentAvatar(s)} 
                        alt="" 
                        className="w-8 h-8 rounded-full object-cover bg-white border border-slate-200 shrink-0" 
                      />
                      <div className="min-w-0">
                        <p 
                          onClick={() => onOpenStudentProfile && onOpenStudentProfile(s.id)}
                          className="font-bold text-xs text-slate-900 hover:text-brand-600 cursor-pointer truncate"
                        >
                          {s.fullName}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{s.studentIdNumber} &bull; {s.grade}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {s.registrationFeeStatus === 'PAID' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                          Adm: Paid
                        </span>
                      ) : s.registrationFeeStatus === 'WAIVED' ? (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
                          Adm: Free
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          Adm: Due
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
