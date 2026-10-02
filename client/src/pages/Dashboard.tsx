import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  CheckCircle2, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight,
  QrCode,
  Sparkles,
  ChevronRight,
  Clock,
  Search,
  Filter,
  Eye,
  Radio,
  GraduationCap
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

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

  // Attendance Section Filters & Date
  const [selectedAttDate, setSelectedAttDate] = useState<string>('');
  const [attSearch, setAttSearch] = useState<string>('');
  const [attClassFilter, setAttClassFilter] = useState<string>('ALL');
  const [attStatusFilter, setAttStatusFilter] = useState<string>('ALL');

  const loadDashboard = (attDate?: string) => {
    const url = attDate ? `/dashboard?attendanceDate=${attDate}` : '/dashboard';
    apiRequest(url)
      .then(res => {
        setData(res);
        if (res?.attendanceDate) {
          setSelectedAttDate(res.attendanceDate);
        }
      })
      .catch(err => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading CAMS Dashboard...</p>
        </div>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const charts = data?.charts || {};
  const recentPayments = data?.recentPayments || [];
  const recentRegistrations = data?.recentRegistrations || [];
  const todaysClasses = data?.todaysClasses || [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Mobile Role-Adaptive Greeting & Quick Action Hero */}
      <div className="md:hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-brand-950 p-4 text-white shadow-lg border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center font-bold text-base shadow text-white">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Welcome back,</p>
              <h2 className="text-base font-bold text-white tracking-tight leading-tight">{user?.name}</h2>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-brand-500/20 text-brand-300 border border-brand-500/30">
            {user?.role}
          </span>
        </div>

        {/* Quick Action Buttons for Mobile */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenQuickScan}
            className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
          >
            <QrCode size={16} />
            <span>Scan QR Pass</span>
          </button>
          <button
            onClick={() => onNavigate('payments')}
            className="flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 active:scale-95 transition-all"
          >
            <CreditCard size={16} />
            <span>Fee Payment</span>
          </button>
        </div>

        {user?.role === 'TEACHER' && todaysClasses.length > 0 && (
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1">
            <div className="flex items-center justify-between text-[11px] text-brand-300 font-bold">
              <span>TODAY'S CLASS</span>
              <span className="text-emerald-400">Ready for Attendance</span>
            </div>
            <p className="font-semibold text-white truncate">{todaysClasses[0]?.name}</p>
            <p className="text-[11px] text-slate-400">{todaysClasses[0]?.time} • {todaysClasses[0]?.hall}</p>
          </div>
        )}
      </div>

      {/* Welcome Banner (Desktop & Tablet) */}
      <div className="hidden md:block relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-3 border border-brand-500/30">
              <Sparkles size={13} />
              <span>Academic Year 2026/2027 Active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Tuition Management & Financial Overview
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Real-time monitoring of student attendance, monthly tuition fees collection, and operational accounting.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenQuickScan}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-500/30 transition-all"
            >
              <QrCode size={16} />
              <span>Launch QR Scanner</span>
            </button>
            <button
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/10 transition-all"
            >
              Today's Schedule
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div 
          onClick={() => onNavigate('students')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-brand-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Students</span>
            <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600 group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{kpis.activeStudents}</span>
            <span className="text-xs text-slate-400">/ {kpis.totalStudents} total</span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-emerald-600 font-semibold">
            <ArrowUpRight size={14} className="mr-0.5" />
            <span>100% active cohort</span>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div 
          onClick={() => onNavigate('payments')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">{formatLKR(kpis.monthlyRevenue)}</span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-slate-500">
            <span>Today: <strong className="text-slate-800">{formatLKR(kpis.todayRevenue)}</strong></span>
          </div>
        </div>

        {/* Pending Fees */}
        <div 
          onClick={() => onNavigate('pending-fees')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Fees</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <AlertCircle size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-amber-600">{formatLKR(kpis.pendingFees)}</span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-amber-700 font-medium">
            <span>Overdue tuition balances</span>
          </div>
        </div>

        {/* Net Income */}
        <div 
          onClick={() => onNavigate('accounting')}
          className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Operating Surplus</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-black text-purple-700">{formatLKR(kpis.netIncome)}</span>
          </div>
          <div className="mt-2 flex items-center text-[11px] text-slate-500">
            <span>Expenses: {formatLKR(kpis.monthlyExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row: Classes & Attendance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm text-blue-600">
              <Calendar size={18} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Classes</span>
              <p className="text-lg font-bold text-slate-900">{kpis.todaysClassesCount} Scheduled Sessions</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Attendance</span>
              <p className="text-lg font-bold text-emerald-700">{kpis.todaysPresentCount} Present</p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm text-rose-600">
              <AlertCircle size={18} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">Absentees Today</span>
              <p className="text-lg font-bold text-rose-600">{kpis.todaysAbsentCount} Marked Absent</p>
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S LIVE ATTENDANCE ROSTER & CLASS ATTENDED CARD */}
      {(() => {
        const todayStr = new Date().toISOString().substring(0, 10);
        const todaysAttendanceList: any[] = data?.todaysAttendanceList || [];
        const allAttendanceDates: string[] = data?.allAttendanceDates || [];
        const currentAttendanceDate = selectedAttDate || data?.attendanceDate || todayStr;

        // Unique classes represented in this session
        const uniqueAttClasses = Array.from(
          new Map(todaysAttendanceList.map((a: any) => [a.classId, { id: a.classId, name: a.className, code: a.classCode }])).values()
        );

        // Filtered attendance list
        const filteredAttendanceList = todaysAttendanceList.filter((a: any) => {
          if (attClassFilter !== 'ALL' && a.classId !== attClassFilter) return false;
          if (attStatusFilter !== 'ALL' && a.status !== attStatusFilter) return false;
          if (attSearch) {
            const q = attSearch.toLowerCase();
            return (
              a.studentName.toLowerCase().includes(q) ||
              a.studentIdNumber.toLowerCase().includes(q) ||
              a.className.toLowerCase().includes(q) ||
              (a.teacherName && a.teacherName.toLowerCase().includes(q))
            );
          }
          return true;
        });

        const presentCount = todaysAttendanceList.filter(a => a.status === 'PRESENT').length;
        const lateCount = todaysAttendanceList.filter(a => a.status === 'LATE').length;

        return (
          <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
            {/* Header & Date Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Gate Check-In Feed</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Session: <strong>{currentAttendanceDate}</strong>
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Today's Attendance Roster & Attended Classes
                </h3>
                <p className="text-xs text-slate-500">
                  Full list of students who attended today, which tuition class they checked into, and exact arrival timestamps.
                </p>
              </div>

              {/* Date & Action Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Quick Date Pills */}
                <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    onClick={() => {
                      setSelectedAttDate(todayStr);
                      loadDashboard(todayStr);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      currentAttendanceDate === todayStr
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Today
                  </button>
                  {allAttendanceDates.filter(d => d !== todayStr).slice(0, 1).map(dateStr => (
                    <button
                      key={dateStr}
                      onClick={() => {
                        setSelectedAttDate(dateStr);
                        loadDashboard(dateStr);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        currentAttendanceDate === dateStr
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-emerald-700 hover:text-emerald-900'
                      }`}
                    >
                      Active Session ({dateStr})
                    </button>
                  ))}
                </div>

                {/* Custom Date Input */}
                <input
                  type="date"
                  value={currentAttendanceDate}
                  onChange={(e) => {
                    setSelectedAttDate(e.target.value);
                    loadDashboard(e.target.value);
                  }}
                  className="px-3 py-1.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />

                {/* Launch Scanner */}
                <button
                  onClick={onOpenQuickScan}
                  className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95"
                >
                  <QrCode size={14} />
                  <span>Scan QR / RFID</span>
                </button>

                {/* Open Attendance Roster Tab */}
                <button
                  onClick={() => onNavigate('attendance-roster')}
                  className="px-3.5 py-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-sm flex items-center space-x-1.5"
                  title="Open Today's Attendance Roster & Attended Classes"
                >
                  <Sparkles size={13} className="text-emerald-400" />
                  <span>Attended Roster</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Attendance KPI Summary & Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student name, ID (STU-...), class, teacher..."
                  value={attSearch}
                  onChange={(e) => setAttSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 touch-scroll-x no-scrollbar">
                {/* Class Filter Dropdown */}
                <select
                  value={attClassFilter}
                  onChange={(e) => setAttClassFilter(e.target.value)}
                  className="px-3 py-2 rounded-2xl border border-slate-200 text-xs bg-slate-50 font-semibold text-slate-700 focus:outline-none shrink-0"
                >
                  <option value="ALL">All Enrolled Classes ({todaysAttendanceList.length})</option>
                  {uniqueAttClasses.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>

                {/* Status Filter Dropdown */}
                <select
                  value={attStatusFilter}
                  onChange={(e) => setAttStatusFilter(e.target.value)}
                  className="px-3 py-2 rounded-2xl border border-slate-200 text-xs bg-slate-50 font-semibold text-slate-700 focus:outline-none shrink-0"
                >
                  <option value="ALL">All Status</option>
                  <option value="PRESENT">Present ({presentCount})</option>
                  <option value="LATE">Late ({lateCount})</option>
                </select>

                {/* Active Count Badge */}
                <span className="px-3 py-2 rounded-2xl bg-slate-100 text-slate-700 text-xs font-bold shrink-0">
                  {filteredAttendanceList.length} of {todaysAttendanceList.length} Students
                </span>
              </div>
            </div>

            {/* Quick Class Filter Pills */}
            {uniqueAttClasses.length > 1 && (
              <div className="flex items-center space-x-2 touch-scroll-x no-scrollbar pb-1 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
                  Classes:
                </span>
                <button
                  onClick={() => setAttClassFilter('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    attClassFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({todaysAttendanceList.length})
                </button>
                {uniqueAttClasses.map(c => {
                  const count = todaysAttendanceList.filter(a => a.classId === c.id).length;
                  const isSelected = attClassFilter === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setAttClassFilter(c.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span>{c.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-brand-700 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Desktop Table View (Visible on md and up) */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Student Name & ID</th>
                    <th className="py-3 px-4">Class Attended</th>
                    <th className="py-3 px-4">Check-In Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Scan Method</th>
                    <th className="py-3 px-4">Gate Operator</th>
                    <th className="py-3 px-4 text-right">Student Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendanceList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <div className="space-y-2">
                          <CheckCircle2 size={32} className="text-slate-300 mx-auto" />
                          <p className="font-semibold text-slate-600">No attendance records found for this date/filter.</p>
                          <p className="text-[11px] text-slate-400">
                            Scan a student ID card with the QR scanner, or switch to an active session date.
                          </p>
                          {allAttendanceDates.length > 0 && currentAttendanceDate !== allAttendanceDates[0] && (
                            <button
                              onClick={() => {
                                setSelectedAttDate(allAttendanceDates[0]);
                                loadDashboard(allAttendanceDates[0]);
                              }}
                              className="mt-2 px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-sm hover:bg-slate-800 transition-colors"
                            >
                              View Active Session ({allAttendanceDates[0]})
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredAttendanceList.map((att: any) => {
                      const checkInTime = att.scannedAt
                        ? new Date(att.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : '--:--';

                      return (
                        <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* 1. Student Name & ID */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                {att.studentPhoto ? (
                                  <img src={att.studentPhoto} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  att.studentName.charAt(0)
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 leading-tight">{att.studentName}</p>
                                <div className="flex items-center space-x-1.5 mt-0.5">
                                  <span className="font-mono text-[10px] text-slate-500">{att.studentIdNumber}</span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[10px] text-slate-500">{att.studentGrade}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 2. Class Attended */}
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-bold text-slate-900">{att.className}</p>
                              <div className="flex items-center space-x-1.5 mt-0.5">
                                {att.classCode && (
                                  <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                                    {att.classCode}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-500">
                                  Teacher: <strong className="text-slate-700">{att.teacherName}</strong>
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* 3. Check-In Time */}
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center space-x-1 text-slate-700 font-mono text-xs font-semibold">
                              <Clock size={12} className="text-slate-400" />
                              <span>{checkInTime}</span>
                            </span>
                          </td>

                          {/* 4. Status */}
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                              att.status === 'PRESENT'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${att.status === 'PRESENT' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span>{att.status}</span>
                            </span>
                          </td>

                          {/* 5. Scan Method */}
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-mono text-[10px] font-bold flex items-center gap-1 w-fit">
                              {att.method === 'RFID' ? (
                                <>
                                  <Radio size={11} className="text-indigo-600" />
                                  <span>125kHz RFID</span>
                                </>
                              ) : att.method === 'QR_CODE' ? (
                                <>
                                  <QrCode size={11} className="text-amber-600" />
                                  <span>QR Scan</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 size={11} className="text-teal-600" />
                                  <span>{att.method || 'ID Card'}</span>
                                </>
                              )}
                            </span>
                          </td>

                          {/* 6. Gate Operator */}
                          <td className="py-3 px-4 text-slate-500 font-medium">
                            {att.recordedBy}
                          </td>

                          {/* 7. Action */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => {
                                if (onOpenStudentProfile) {
                                  onOpenStudentProfile(att.studentId);
                                } else {
                                  onNavigate('students');
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-bold text-xs transition-all shadow-sm"
                            >
                              Profile
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch-Friendly Cards (Visible on mobile < md) */}
            <div className="md:hidden space-y-3">
              {filteredAttendanceList.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  No attendance records found for this date.
                </div>
              ) : (
                filteredAttendanceList.map((att: any) => {
                  const checkInTime = att.scannedAt
                    ? new Date(att.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--';

                  return (
                    <div key={att.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            att.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {att.status}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                            <Clock size={11} /> {checkInTime}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                          {att.method || 'QR_CODE'}
                        </span>
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm text-slate-900">{att.studentName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{att.studentIdNumber} • {att.studentGrade}</p>
                        </div>
                        <button
                          onClick={() => {
                            if (onOpenStudentProfile) {
                              onOpenStudentProfile(att.studentId);
                            } else {
                              onNavigate('students');
                            }
                          }}
                          className="px-3 py-1 rounded-xl bg-slate-900 text-white font-bold text-xs shadow-sm"
                        >
                          Profile
                        </button>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-brand-700 leading-tight">{att.className}</p>
                          <p className="text-[10px] text-slate-500">Teacher: {att.teacherName}</p>
                        </div>
                        <span className="text-[10px] text-slate-400">By: {att.recordedBy}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Expenses Trend Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Revenue & Expense Cashflow (LKR)</h3>
              <p className="text-xs text-slate-500">6-month comparison of fee collections vs operating overhead</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-brand-500" />
                <span className="text-slate-600">Tuition Revenue</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="text-slate-600">Expenses</span>
              </div>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenueChart || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
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
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Distribution by Grade */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Student Distribution</h3>
            <p className="text-xs text-slate-500">Active enrollments categorized by Grade</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.studentGrowthChart || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="grade" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
            <span>Largest Batch: <strong>Grade 12 (A/L)</strong></span>
            <span className="text-brand-600 font-semibold cursor-pointer" onClick={() => onNavigate('students')}>View Roster →</span>
          </div>
        </div>
      </div>

      {/* Two Columns: Recent Payments & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Payments Table */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Recent Fee Collections</h3>
              <p className="text-xs text-slate-500">Latest cashier receipts issued at front counter</p>
            </div>
            <button
              onClick={() => onNavigate('payments')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Receipt</th>
                  <th className="py-2.5 px-3">Student</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentPayments.slice(0, 6).map((pay: any) => (
                  <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-brand-700">{pay.receiptNumber}</td>
                    <td className="py-3 px-3">
                      <p className="font-semibold text-slate-900">{pay.studentName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{pay.studentIdNumber}</p>
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{formatLKR(pay.totalAmount)}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium">
                        {pay.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">{formatDate(pay.paymentDate)}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onOpenReceipt(pay.receiptNumber)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-semibold transition-colors"
                      >
                        Receipt
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Today's Schedule Card */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Today's Live Classes</h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
              {todaysClasses.length} Active
            </span>
          </div>

          <div className="flex-1 space-y-3">
            {todaysClasses.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No classes scheduled for today ({new Date().toLocaleDateString('en-GB', { weekday: 'long' })}).
              </div>
            ) : (
              todaysClasses.slice(0, 4).map((c: any) => (
                <div key={c.id} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 hover:border-brand-300 transition-all space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] font-mono font-bold">
                      {c.classCode}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                      <Clock size={12} /> {c.startTime} - {c.endTime}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-slate-900 leading-snug">{c.name}</h5>
                  <p className="text-[11px] text-slate-500">Hall: {c.room || 'Main Hall'}</p>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onNavigate('attendance')}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md mt-auto"
          >
            Open Attendance System
          </button>
        </div>
      </div>
    </div>
  );
};
