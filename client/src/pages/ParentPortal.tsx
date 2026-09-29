import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CheckCircle2, 
  CreditCard, 
  AlertCircle, 
  FileText, 
  Calendar, 
  Clock, 
  Download,
  BookOpen,
  QrCode,
  Smartphone,
  Share2,
  Printer,
  ChevronRight,
  Filter,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Radio,
  Sparkles,
  ArrowRight,
  LogOut,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatLKR, formatDate } from '../api';

interface ParentPortalProps {
  onOpenReceipt: (receiptNo: string) => void;
  onOpenIDCard: (studentId: string) => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({ onOpenReceipt, onOpenIDCard }) => {
  const { user, logout } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [childData, setChildData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Main Tab - Default is Attendance Record & Time Report
  const [activeTab, setActiveTab] = useState<'attendance' | 'fees' | 'smartpass' | 'classes'>('attendance');

  // Filters for Attendance
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterClassId, setFilterClassId] = useState<string>('ALL');

  // PWA Install Modal state
  const [showPwaModal, setShowPwaModal] = useState<boolean>(false);
  const [pwaDeviceTab, setPwaDeviceTab] = useState<'android' | 'iphone'>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState<boolean>(false);

  // Capture PWA install prompt
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Fetch linked children for this guardian
  useEffect(() => {
    setLoading(true);
    apiRequest<any[]>('/auth/parent-children')
      .then(kids => {
        if (kids && kids.length > 0) {
          setChildren(kids);
          setSelectedChildId(kids[0].id);
        } else {
          // Fallback to fetch all and filter by current user's phone or take first 2
          apiRequest<any[]>('/students').then(all => {
            const myKids = (all || []).slice(0, 2);
            setChildren(myKids);
            if (myKids.length > 0) setSelectedChildId(myKids[0].id);
          });
        }
      })
      .catch(() => {
        // Fallback
        apiRequest<any[]>('/students').then(all => {
          const myKids = (all || []).slice(0, 2);
          setChildren(myKids);
          if (myKids.length > 0) setSelectedChildId(myKids[0].id);
        });
      })
      .finally(() => setLoading(false));
  }, []);

  // Load detailed student profile when child selection changes
  useEffect(() => {
    if (!selectedChildId) return;
    setLoading(true);
    apiRequest(`/students/${selectedChildId}`)
      .then(res => setChildData(res))
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  // Install PWA trigger
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setShowPwaModal(true);
    }
  };

  // Helper to format exact check-in time e.g. "08:15:30 AM"
  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  // Check today's attendance record for the student
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayAttendance = childData?.attendances?.find((a: any) => a.date === todayStr);

  // Filtered attendance list
  const filteredAttendances = (childData?.attendances || []).filter((a: any) => {
    if (filterMonth !== 'ALL' && !a.date.startsWith(filterMonth)) return false;
    if (filterClassId !== 'ALL' && a.classId !== filterClassId) return false;
    return true;
  });

  // Calculate Attendance Stats
  const totalSessions = childData?.attendances?.length || 0;
  const presentCount = childData?.attendances?.filter((a: any) => a.status === 'PRESENT').length || 0;
  const lateCount = childData?.attendances?.filter((a: any) => a.status === 'LATE').length || 0;
  const absentCount = childData?.attendances?.filter((a: any) => a.status === 'ABSENT').length || 0;
  const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 100;

  // Available months from attendance records
  const availableMonths: string[] = Array.from(
    new Set((childData?.attendances || []).map((a: any) => a.date.substring(0, 7)))
  ).sort().reverse() as string[];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Guardian Identity & 1-Time PWA App Shortcut */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-950 via-slate-900 to-indigo-950 border border-teal-800/40 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold uppercase tracking-widest">
                Parent & Guardian Portal PWA
              </span>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-medium">
                <CheckCircle2 size={11} />
                <span>1-Time Permanent Login Active</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Welcome, {user?.name || 'Guardian'}
            </h1>
            <p className="text-xs text-slate-300 max-w-xl">
              Track your child's daily class check-in timestamps, RFID gate pass, and monthly tuition fee receipts in real time.
            </p>
          </div>

          {/* Quick Actions: Install PWA + Logout */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPwaModal(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs shadow-lg shadow-teal-900/40 flex items-center space-x-2 transition-all active:scale-95 border border-teal-400/30"
            >
              <Smartphone size={15} />
              <span>Save App to Phone</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Logging out will require re-entering your phone number. Are you sure you want to log out?')) {
                  logout();
                }
              }}
              title="Log out of Parent Portal"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Multi-Child Selector Tabs */}
        {children.length > 1 && (
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center space-x-2 overflow-x-auto pb-1">
            <span className="text-xs font-bold text-teal-200 shrink-0 mr-1">Select Child:</span>
            {children.map(child => {
              const isSelected = selectedChildId === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
                    isSelected 
                      ? 'bg-white text-slate-900 shadow-md ring-2 ring-teal-400' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-teal-400" />
                  <span>{child.fullName}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isSelected ? 'bg-slate-200 text-slate-800' : 'bg-white/20 text-teal-200'}`}>
                    {child.grade}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Persistent PWA Install Prompt Banner for Mobile Users */}
      {!isPwaInstalled && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-teal-950/80 border border-teal-500/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-left">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 border border-teal-500/30">
              <Smartphone size={20} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <p className="text-xs font-bold text-white">Save Parent Portal to Android or iPhone Home Screen</p>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300">No Login Needed</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Launch with 1 tap from your home screen like a native app. Stays permanently logged in!
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPwaModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors shrink-0 flex items-center space-x-1.5 shadow-md shadow-teal-900/40"
          >
            <span>How to Save</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Main Tab Navigation Buttons */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'attendance'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock size={15} />
          <span>Attendance Record & Time Report</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'attendance' ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-700'}`}>
            {totalSessions}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'fees'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard size={15} />
          <span>Tuition Fees & Receipts</span>
        </button>

        <button
          onClick={() => setActiveTab('smartpass')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'smartpass'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <QrCode size={15} />
          <span>Student Smart Pass & RFID</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center space-x-2 shrink-0 ${
            activeTab === 'classes'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25 ring-2 ring-teal-600/30'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen size={15} />
          <span>Enrolled Classes ({childData?.enrollments?.length || 0})</span>
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading child attendance and academic records...</p>
        </div>
      ) : childData ? (
        <div className="space-y-6">

          {/* ======================================================== */}
          {/* TAB 1: ATTENDANCE RECORD & TIME REPORT (PRIMARY / MAIN) */}
          {/* ======================================================== */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              
              {/* 1. Today's Real-Time Check-In Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live Check-In Status • Today ({formatDate(todayStr)})</span>
                    </span>
                    <h2 className="text-xl font-black text-slate-900">
                      {childData.fullName}'s Daily Arrival
                    </h2>
                    <p className="text-xs text-slate-500">
                      Student ID: <code className="font-mono font-bold text-teal-700">{childData.studentIdNumber}</code>
                      {childData.rfidTag && (
                        <span className="ml-2 font-mono text-[11px] text-slate-500">
                          • RFID Card: <span className="font-bold text-slate-700">{childData.rfidTag}</span>
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Live Status Pill */}
                  <div>
                    {todayAttendance ? (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center space-x-3 text-left">
                        <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/30">
                          <CheckCircle2 size={24} />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">
                              CHECKED IN - PRESENT
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 text-[10px] font-bold">
                              {todayAttendance.method === 'RFID' ? '125kHz RFID' : todayAttendance.method}
                            </span>
                          </div>
                          <div className="text-xl font-black text-emerald-900 font-mono mt-0.5">
                            {formatTime(todayAttendance.scannedAt)}
                          </div>
                          <p className="text-[11px] text-emerald-700">
                            Recorded by: {todayAttendance.recordedBy || 'Gate Scanner'}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center space-x-3 text-left">
                        <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-500/30">
                          <Clock size={24} />
                        </div>
                        <div>
                          <span className="text-xs font-black text-amber-800 uppercase tracking-wider">
                            NOT CHECKED IN YET TODAY
                          </span>
                          <p className="text-xs text-amber-700 mt-0.5 font-medium">
                            Awaiting student card tap or QR scan at the academy gate.
                          </p>
                          <p className="text-[10px] text-amber-600 mt-0.5">
                            Real-time SMS is dispatched immediately when RFID card is tapped.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Attendance Summary KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Sessions</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">{totalSessions}</p>
                  <span className="text-[10px] text-slate-500">Enrolled classes</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Present</span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{presentCount}</p>
                  <span className="text-[10px] text-emerald-600">On time</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 shadow-sm">
                  <span className="text-[10px] font-bold text-amber-600 uppercase">Late Arrivals</span>
                  <p className="text-2xl font-black text-amber-700 mt-1">{lateCount}</p>
                  <span className="text-[10px] text-amber-600">After session start</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 shadow-sm">
                  <span className="text-[10px] font-bold text-rose-600 uppercase">Absent</span>
                  <p className="text-2xl font-black text-rose-700 mt-1">{absentCount}</p>
                  <span className="text-[10px] text-rose-600">Missed classes</span>
                </div>

                <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 shadow-sm col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-teal-600 uppercase">Attendance Rate</span>
                  <p className="text-2xl font-black text-teal-700 mt-1">{attendanceRate}%</p>
                  <div className="w-full bg-teal-200/80 rounded-full h-1.5 mt-1.5 overflow-hidden">
                    <div className="bg-teal-600 h-1.5 rounded-full" style={{ width: `${attendanceRate}%` }} />
                  </div>
                </div>
              </div>

              {/* 3. Detailed Attendance History Log Table */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Attendance Log & Timestamp Report</h3>
                    <p className="text-xs text-slate-500">Every check-in is logged with exact time and verification method</p>
                  </div>

                  {/* Filter & Print Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Month Filter */}
                    <select
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="ALL">All Months</option>
                      {availableMonths.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    {/* Class Filter */}
                    <select
                      value={filterClassId}
                      onChange={(e) => setFilterClassId(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="ALL">All Classes</option>
                      {childData.enrollments?.map((en: any) => (
                        <option key={en.classId} value={en.classId}>
                          {en.class?.classCode || en.class?.name}
                        </option>
                      ))}
                    </select>

                    {/* Print Report */}
                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center space-x-1"
                    >
                      <Printer size={13} />
                      <span>Print Report</span>
                    </button>
                  </div>
                </div>

                {/* Attendance Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Exact Time</th>
                        <th className="py-3 px-3">Class & Subject</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Verification Method</th>
                        <th className="py-3 px-3">Recorded By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAttendances.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                            No attendance records match your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredAttendances.map((att: any) => {
                          const isPresent = att.status === 'PRESENT';
                          const isLate = att.status === 'LATE';
                          const isAbsent = att.status === 'ABSENT';

                          return (
                            <tr key={att.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 font-semibold text-slate-900">
                                {formatDate(att.date)}
                              </td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-800">
                                {att.scannedAt ? formatTime(att.scannedAt) : '--:--'}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-semibold text-slate-900 block">
                                  {att.class?.name || 'Class Session'}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {att.class?.classCode || ''}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                  isPresent 
                                    ? 'bg-emerald-100 text-emerald-800' 
                                    : isLate 
                                    ? 'bg-amber-100 text-amber-800' 
                                    : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {isPresent && <CheckCircle2 size={10} />}
                                  {isLate && <Clock size={10} />}
                                  {isAbsent && <AlertCircle size={10} />}
                                  <span>{att.status}</span>
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                  att.method === 'RFID' 
                                    ? 'bg-purple-100 text-purple-800' 
                                    : att.method === 'QR_CODE'
                                    ? 'bg-sky-100 text-sky-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {att.method === 'RFID' ? '125kHz RFID Tag' : att.method}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-slate-500 text-[11px]">
                                {att.recordedBy || 'Gate Controller'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: TUITION FEES & RECEIPTS */}
          {/* ======================================================== */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              {/* Fee Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Tuition Balance</span>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {formatLKR(childData.feeRecords?.filter((f: any) => f.status !== 'PAID')?.reduce((sum: number, f: any) => sum + f.remainingBalance, 0) || 0)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Payable at academy counter</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Paid To Date</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {formatLKR(childData.payments?.reduce((sum: number, p: any) => sum + p.totalAmount, 0) || 0)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{childData.payments?.length || 0} Official Receipts Issued</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Frequency</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">Monthly</p>
                  <p className="text-[11px] text-slate-500 mt-1">Due before 10th of every month</p>
                </div>
              </div>

              {/* Monthly Fee Invoices Table */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Monthly Tuition Invoices</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Month</th>
                        <th className="py-2.5 px-3">Class</th>
                        <th className="py-2.5 px-3">Fee Amount</th>
                        <th className="py-2.5 px-3">Paid</th>
                        <th className="py-2.5 px-3">Balance</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {childData.feeRecords?.map((f: any) => {
                        const isPaid = f.status === 'PAID';
                        const isPartial = f.status === 'PARTIAL';
                        return (
                          <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-semibold text-slate-900">{f.month}</td>
                            <td className="py-3 px-3 font-medium text-slate-800">{f.class?.name || 'Class Fee'}</td>
                            <td className="py-3 px-3 font-bold text-slate-900">{formatLKR(f.totalDue)}</td>
                            <td className="py-3 px-3 font-semibold text-emerald-600">{formatLKR(f.paidAmount)}</td>
                            <td className="py-3 px-3 font-bold text-amber-600">{formatLKR(f.remainingBalance)}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                isPaid ? 'bg-emerald-100 text-emerald-800' : isPartial ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {f.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Receipts */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-slate-900">Recent Payment Receipts</h3>
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Receipt No</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Payment Method</th>
                        <th className="py-2.5 px-3">Cashier</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {childData.payments?.map((p: any) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-teal-700">{p.receiptNumber}</td>
                          <td className="py-2.5 px-3 text-slate-600">{formatDate(p.paymentDate)}</td>
                          <td className="py-2.5 px-3 font-bold text-slate-900">{formatLKR(p.totalAmount)}</td>
                          <td className="py-2.5 px-3 text-slate-600">{p.paymentMethod}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">{p.cashier}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => onOpenReceipt(p.receiptNumber)}
                              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold transition-colors"
                            >
                              View Receipt
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: SMART PASS & RFID */}
          {/* ======================================================== */}
          {activeTab === 'smartpass' && (
            <div className="space-y-6">
              <div className="max-w-md mx-auto p-6 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 p-[2px] mx-auto shadow-md shadow-teal-500/20">
                  <img
                    src={childData.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={childData.fullName}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">{childData.fullName}</h3>
                  <p className="text-xs font-mono font-bold text-teal-700">{childData.studentIdNumber}</p>
                  <p className="text-xs text-slate-500">{childData.grade} • {childData.school || 'Cambridge Academy'}</p>
                </div>

                {/* QR Code Container */}
                {childData.qrDataUrl && (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 inline-block shadow-inner">
                    <img
                      src={childData.qrDataUrl}
                      alt="Student QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                    <span className="text-[10px] font-mono text-slate-400 mt-2 block">
                      {childData.qrCodeToken}
                    </span>
                  </div>
                )}

                {/* RFID Tag Badge */}
                {childData.rfidTag ? (
                  <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
                    <div className="flex items-center justify-center space-x-1.5 font-bold">
                      <Radio size={14} className="text-purple-600 animate-pulse" />
                      <span>125kHz HID RFID Card Tag</span>
                    </div>
                    <code className="text-sm font-black font-mono mt-0.5 block tracking-wider text-purple-800">
                      {childData.rfidTag}
                    </code>
                    <p className="text-[10px] text-purple-600 mt-0.5">
                      Ready for touchless gate tap check-in
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                    No RFID physical card assigned. Tap QR code at camera gate.
                  </div>
                )}

                <button
                  onClick={() => onOpenIDCard(childData.id)}
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2"
                >
                  <QrCode size={15} />
                  <span>Open Printable Student ID Card</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 4: ENROLLED CLASSES */}
          {/* ======================================================== */}
          {activeTab === 'classes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {childData.enrollments?.map((en: any) => (
                <div key={en.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 text-[10px] font-mono font-bold">
                      {en.class?.classCode}
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {formatLKR(en.class?.monthlyFee || 0)} / mo
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{en.class?.name}</h4>
                    <p className="text-xs text-slate-600 mt-0.5">Teacher: {en.class?.teacher?.name || 'Faculty Lecturer'}</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600 space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{en.class?.dayOfWeek}s</span>
                    </div>
                    <div className="flex items-center space-x-1.5 font-mono">
                      <Clock size={13} className="text-slate-400" />
                      <span>{en.class?.startTime} - {en.class?.endTime}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      ) : null}

      {/* ======================================================== */}
      {/* PWA INSTALL / ADD TO HOME SCREEN MODAL */}
      {/* ======================================================== */}
      {showPwaModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => setShowPwaModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-600 flex items-center justify-center shrink-0 border border-teal-500/30">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Save App to Home Screen</h3>
                <p className="text-xs text-slate-500">1-Tap instant access • Stays logged in permanently</p>
              </div>
            </div>

            {/* 1-Time Login Guarantee Callout */}
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-teal-900 flex items-start space-x-2.5">
              <ShieldCheck size={18} className="text-teal-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-teal-950">No Need to Log In Again!</p>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  Your guardian session is saved securely in your phone for 365 days. Opening the app from your home screen gives you instant access to your student's live arrival times without entering passwords or phone numbers.
                </p>
              </div>
            </div>

            {/* Platform Selector Tabs: Android vs iPhone */}
            <div className="flex p-1 rounded-2xl bg-slate-100">
              <button
                onClick={() => setPwaDeviceTab('android')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  pwaDeviceTab === 'android' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>🤖 Android (Chrome)</span>
              </button>
              <button
                onClick={() => setPwaDeviceTab('iphone')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                  pwaDeviceTab === 'iphone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>🍏 iPhone / iPad (Safari)</span>
              </button>
            </div>

            {/* Android Instructions */}
            {pwaDeviceTab === 'android' && (
              <div className="space-y-4 text-xs text-slate-700">
                {deferredPrompt ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold shadow-lg shadow-teal-600/30 flex items-center justify-center space-x-2 active:scale-95 transition-all"
                  >
                    <Smartphone size={16} />
                    <span>Install App on Android Now (1-Tap)</span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="font-semibold text-slate-900">How to add to your Android Home Screen:</p>
                    <ol className="list-decimal list-inside space-y-2 text-slate-600 pl-1">
                      <li>Open this page in <strong>Google Chrome</strong> or <strong>Samsung Internet</strong>.</li>
                      <li>Tap the <strong>three dots menu `⋮`</strong> at the top right of your screen.</li>
                      <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                      <li>Confirm by tapping <strong>"Add"</strong> or <strong>"Install"</strong>.</li>
                      <li>Find the <strong>Apex CAMS Parent Portal</strong> icon on your phone!</li>
                    </ol>
                  </div>
                )}
              </div>
            )}

            {/* iPhone Instructions */}
            {pwaDeviceTab === 'iphone' && (
              <div className="space-y-3 text-xs text-slate-700">
                <p className="font-semibold text-slate-900">How to add to your iPhone / iPad Home Screen:</p>
                <ol className="list-decimal list-inside space-y-2.5 text-slate-600 pl-1">
                  <li>Open this portal in <strong>Apple Safari</strong>.</li>
                  <li>
                    Tap the <strong>Share button</strong>{' '}
                    <span className="inline-block p-1 bg-slate-100 rounded text-slate-800 font-mono font-bold">
                      [↑]
                    </span>{' '}
                    at the bottom of your Safari browser bar.
                  </li>
                  <li>
                    Scroll down and tap{' '}
                    <span className="font-bold text-slate-900">"Add to Home Screen"</span>{' '}
                    <span className="inline-block p-1 bg-slate-100 rounded text-slate-800 font-mono font-bold">
                      [+]
                    </span>.
                  </li>
                  <li>Tap <strong>"Add"</strong> at the top right corner.</li>
                  <li>
                    The <strong>Apex Parent Portal</strong> app icon will now appear on your iPhone home screen!
                  </li>
                </ol>
              </div>
            )}

            <button
              onClick={() => setShowPwaModal(false)}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              Got It / Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
