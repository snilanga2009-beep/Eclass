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
  Clock
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
}

export const Dashboard: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenReceipt,
  onOpenQuickScan
}) => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest('/dashboard')
      .then(res => setData(res))
      .catch(err => console.error('Failed to load dashboard:', err))
      .finally(() => setLoading(false));
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
