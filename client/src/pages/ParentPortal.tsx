import React, { useState, useEffect, useMemo } from 'react';
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
  Printer,
  ChevronRight,
  X,
  ExternalLink,
  Radio,
  LogOut,
  Award,
  TrendingUp,
  LayoutDashboard,
  FolderDown,
  Link2,
  Sparkles,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatLKR, formatDate } from '../api';
import { getStudentAvatar } from '../utils/studentAvatars';

export type ParentSubTab = 'overview' | 'attendance' | 'assessments' | 'fees' | 'smartpass' | 'classes';

interface ParentPortalProps {
  onOpenReceipt: (receiptNo: string) => void;
  onOpenIDCard: (studentId: string) => void;
  activeSubTab?: ParentSubTab;
  onChangeSubTab?: (tab: ParentSubTab) => void;
  onNavigateGlobal?: (tab: string) => void;
}

export const ParentPortal: React.FC<ParentPortalProps> = ({
  onOpenReceipt,
  onOpenIDCard,
  activeSubTab = 'overview',
  onChangeSubTab,
  onNavigateGlobal
}) => {
  const { user, logout } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [childData, setChildData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [internalTab, setInternalTab] = useState<ParentSubTab>(activeSubTab);
  const activeTab = onChangeSubTab ? activeSubTab : internalTab;
  const setActiveTab = (t: ParentSubTab) => {
    setInternalTab(t);
    if (onChangeSubTab) onChangeSubTab(t);
  };

  useEffect(() => {
    setInternalTab(activeSubTab);
  }, [activeSubTab]);

  // Filters for Attendance & Assessments
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterClassId, setFilterClassId] = useState<string>('ALL');
  const [examSubjectFilter, setExamSubjectFilter] = useState<string>('ALL');

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
          apiRequest<any[]>('/students').then(all => {
            const myKids = (all || []).slice(0, 2);
            setChildren(myKids);
            if (myKids.length > 0) setSelectedChildId(myKids[0].id);
          });
        }
      })
      .catch(() => {
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

  const formatTime = (isoString?: string) => {
    if (!isoString) return '--:--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '--:--';
    }
  };

  // Attendance Metrics
  const todayStr = new Date().toISOString().substring(0, 10);
  const todayAttendance = childData?.attendances?.find((a: any) => a.date === todayStr);
  const filteredAttendances = (childData?.attendances || []).filter((a: any) => {
    if (filterMonth !== 'ALL' && !a.date.startsWith(filterMonth)) return false;
    if (filterClassId !== 'ALL' && a.classId !== filterClassId) return false;
    return true;
  });
  const totalSessions = childData?.attendances?.length || 0;
  const presentCount = childData?.attendances?.filter((a: any) => a.status === 'PRESENT').length || 0;
  const lateCount = childData?.attendances?.filter((a: any) => a.status === 'LATE').length || 0;
  const absentCount = childData?.attendances?.filter((a: any) => a.status === 'ABSENT').length || 0;
  const attendanceRate = totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 100;

  const availableMonths: string[] = Array.from(
    new Set((childData?.attendances || []).map((a: any) => a.date.substring(0, 7)))
  ).sort().reverse() as string[];

  // Assessments & Student Performance Metrics
  const examResults: any[] = childData?.examResults || [];
  const filteredExamResults = useMemo(() => {
    if (examSubjectFilter === 'ALL') return examResults;
    return examResults.filter((er: any) => {
      const subjName = er.exam?.subject?.name || er.exam?.subjectId || 'General';
      return subjName === examSubjectFilter;
    });
  }, [examResults, examSubjectFilter]);

  const examSubjects = useMemo(() => {
    const set = new Set<string>();
    examResults.forEach((er: any) => {
      if (er.exam?.subject?.name) set.add(er.exam.subject.name);
    });
    return Array.from(set);
  }, [examResults]);

  const avgExamPercentage = useMemo(() => {
    if (examResults.length === 0) return 0;
    const sum = examResults.reduce((s: number, r: any) => {
      const total = r.exam?.totalMarks || 100;
      const pct = r.percentage ?? Math.round((Number(r.marks || 0) / total) * 100);
      return s + pct;
    }, 0);
    return Math.round(sum / examResults.length);
  }, [examResults]);

  const highestExamPercentage = useMemo(() => {
    if (examResults.length === 0) return 0;
    return Math.max(
      ...examResults.map((r: any) => {
        const total = r.exam?.totalMarks || 100;
        return r.percentage ?? Math.round((Number(r.marks || 0) / total) * 100);
      })
    );
  }, [examResults]);

  const bestExamRank = useMemo(() => {
    const ranks = examResults.map((r: any) => Number(r.rank || 0)).filter(r => r > 0);
    if (ranks.length === 0) return null;
    return Math.min(...ranks);
  }, [examResults]);

  // Tuition Fee Metrics
  const pendingTuitionBalance = useMemo(() => {
    return (
      childData?.feeRecords
        ?.filter((f: any) => f.status !== 'PAID')
        ?.reduce((sum: number, f: any) => sum + Number(f.remainingBalance || 0), 0) || 0
    );
  }, [childData]);

  const totalTuitionPaid = useMemo(() => {
    return childData?.payments?.reduce((sum: number, p: any) => sum + Number(p.totalAmount || 0), 0) || 0;
  }, [childData]);

  return (
    <div className="space-y-6 pb-20">
      {/* ======================================================== */}
      {/* HERO STUDENT & GUARDIAN APP HEADER CARD */}
      {/* ======================================================== */}
      <div className="p-5 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 border border-teal-800/50 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/4 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Student + Guardian Identity */}
          <div className="flex items-start sm:items-center gap-4">
            {childData && (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-teal-400 to-emerald-500 p-0.5 shadow-lg shrink-0">
                <img
                  src={getStudentAvatar(childData)}
                  alt={childData.fullName}
                  className="w-full h-full object-cover rounded-2xl bg-slate-900"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold uppercase tracking-widest">
                  Parent & Guardian App
                </span>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                  <CheckCircle2 size={11} />
                  <span>Live Sync Active</span>
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {childData ? childData.fullName : `Welcome, ${user?.name || 'Guardian'}`}
              </h1>

              {childData ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="px-2 py-0.5 rounded-md bg-white/10 font-mono font-bold text-teal-300">
                    {childData.studentIdNumber}
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-white">{childData.grade}</span>
                  {childData.school && (
                    <>
                      <span>•</span>
                      <span className="text-slate-300">{childData.school}</span>
                    </>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-300">
                  Real-time gate attendance, student exam performance, and fee receipts.
                </p>
              )}
            </div>
          </div>

          {/* Right Action Station */}
          <div className="flex flex-wrap items-center gap-2.5">
            {childData && (
              <button
                onClick={() => onOpenIDCard(childData.id)}
                className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-teal-50 font-bold text-xs shadow-md flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <QrCode size={15} className="text-teal-600" />
                <span>QR ID Card</span>
              </button>
            )}

            <button
              onClick={handleInstallClick}
              className="px-4 py-2.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-950/50 flex items-center gap-2 transition-all active:scale-95 border border-teal-400/30 cursor-pointer"
            >
              <Smartphone size={15} />
              <span>Save App</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to log out of the Parent App?')) {
                  logout();
                }
              }}
              title="Log out"
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 border border-white/10 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Multi-Child Selector Bar (When Multiple Siblings share Parent Phone) */}
        {children.length > 1 && (
          <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-bold text-teal-200 shrink-0 mr-1 flex items-center gap-1">
              <Users size={13} />
              <span>Switch Child ({children.length}):</span>
            </span>
            {children.map(child => {
              const isSelected = selectedChildId === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer ${
                    isSelected 
                      ? 'bg-white text-slate-900 shadow-md ring-2 ring-teal-400' 
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-teal-600' : 'bg-teal-400'}`} />
                  <span>{child.fullName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isSelected ? 'bg-slate-200 text-slate-800' : 'bg-white/20 text-teal-200'}`}>
                    {child.grade}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* TOP NAVIGATION PILLS (SYNCHRONIZED WITH FOOTER BAR) */}
      {/* ======================================================== */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <LayoutDashboard size={15} className={activeTab === 'overview' ? 'text-teal-400' : 'text-slate-500'} />
          <span>Main Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('assessments')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'assessments'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Award size={15} className={activeTab === 'assessments' ? 'text-white' : 'text-indigo-600'} />
          <span>Assessments & Performance</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            activeTab === 'assessments' ? 'bg-indigo-800 text-white' : 'bg-indigo-50 text-indigo-700'
          }`}>
            {examResults.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-teal-600 text-white shadow-md shadow-teal-600/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock size={15} className={activeTab === 'attendance' ? 'text-white' : 'text-teal-600'} />
          <span>Attendance & Time</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
            activeTab === 'attendance' ? 'bg-teal-800 text-white' : 'bg-teal-50 text-teal-700'
          }`}>
            {totalSessions}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('fees')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'fees'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CreditCard size={15} className={activeTab === 'fees' ? 'text-white' : 'text-emerald-600'} />
          <span>Tuition Fees & Receipts</span>
        </button>

        <button
          onClick={() => setActiveTab('smartpass')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'smartpass'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <QrCode size={15} className={activeTab === 'smartpass' ? 'text-teal-400' : 'text-slate-600'} />
          <span>Smart QR Pass</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-brand-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen size={15} className={activeTab === 'classes' ? 'text-white' : 'text-brand-600'} />
          <span>Classes & Study Materials</span>
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">Loading student dashboard, exam performance, and attendance...</p>
        </div>
      ) : childData ? (
        <div className="space-y-6">

          {/* ======================================================== */}
          {/* TAB 0: MAIN APP DASHBOARD OVERVIEW (DEFAULT) */}
          {/* ======================================================== */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Live Gate Arrival Strip */}
              <div className={`p-5 rounded-3xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                todayAttendance
                  ? 'bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border-emerald-200'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center gap-3.5">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    todayAttendance
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {todayAttendance ? <CheckCircle2 size={24} /> : <Clock size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        todayAttendance
                          ? 'bg-emerald-200/80 text-emerald-900'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {todayAttendance ? 'CHECKED IN TODAY' : 'TODAY GATE STATUS'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{formatDate(todayStr)}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                      {todayAttendance
                        ? `${childData.fullName} arrived at ${formatTime(todayAttendance.scannedAt)}`
                        : `${childData.fullName} has not checked in at the gate yet today`}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {todayAttendance
                        ? `Verified via ${todayAttendance.method === 'RFID' ? '125kHz RFID Card' : todayAttendance.method} • ${todayAttendance.class?.name || 'Academy Gate'}`
                        : 'Instant check-in timestamp will appear here as soon as the student taps their card.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('attendance')}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <span>Attendance Log</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* 4 MODERN APP DASHBOARD KPI TILES */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Tile 1: Attendance Rate */}
                <div
                  onClick={() => setActiveTab('attendance')}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                      <div className="w-9 h-9 rounded-2xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center">
                        <CheckCircle2 size={18} />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{attendanceRate}%</p>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${attendanceRate}%` }} />
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span><strong>{presentCount + lateCount}</strong> / {totalSessions} Days</span>
                    <span className="text-teal-600 font-bold flex items-center">
                      View <ChevronRight size={12} />
                    </span>
                  </div>
                </div>

                {/* Tile 2: Assessments & Performance */}
                <div
                  onClick={() => setActiveTab('assessments')}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exam Performance</span>
                      <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                        <Award size={18} />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mt-2">
                      <p className="text-2xl sm:text-3xl font-black text-indigo-700">
                        {examResults.length > 0 ? `${avgExamPercentage}%` : 'N/A'}
                      </p>
                      {bestExamRank && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                          Best Rank #{bestExamRank}
                        </span>
                      )}
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${avgExamPercentage}%` }} />
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span><strong>{examResults.length}</strong> Assessments</span>
                    <span className="text-indigo-600 font-bold flex items-center">
                      Marks <ChevronRight size={12} />
                    </span>
                  </div>
                </div>

                {/* Tile 3: Tuition Fees */}
                <div
                  onClick={() => setActiveTab('fees')}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tuition Fee Status</span>
                      <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border ${
                        pendingTuitionBalance > 0
                          ? 'bg-amber-50 text-amber-600 border-amber-100'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        <CreditCard size={18} />
                      </div>
                    </div>
                    <p className={`text-xl sm:text-2xl font-black mt-2 font-mono ${
                      pendingTuitionBalance > 0 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {pendingTuitionBalance > 0 ? formatLKR(pendingTuitionBalance) : 'All Settled'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {pendingTuitionBalance > 0 ? 'Pending Balance Due' : 'No Outstanding Dues'}
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span><strong>{childData.payments?.length || 0}</strong> Receipts</span>
                    <span className="text-emerald-600 font-bold flex items-center">
                      Receipts <ChevronRight size={12} />
                    </span>
                  </div>
                </div>

                {/* Tile 4: Classes & Study Materials */}
                <div
                  onClick={() => setActiveTab('classes')}
                  className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:border-brand-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classes & Notes</span>
                      <div className="w-9 h-9 rounded-2xl bg-brand-50 text-brand-600 border border-brand-100 flex items-center justify-center">
                        <BookOpen size={18} />
                      </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                      {childData.enrollments?.length || 0} <span className="text-xs font-semibold text-slate-400">Classes</span>
                    </p>
                    <p className="text-[10px] text-brand-600 font-semibold mt-1">
                      {childData.learningMaterials?.length || 0} Study Resources / Links
                    </p>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Google Drive & PDFs</span>
                    <span className="text-brand-600 font-bold flex items-center">
                      Open <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>

              {/* MAIN DASHBOARD 2-COLUMN CONTENT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Student Assessments & Performance Snapshot */}
                <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Award size={18} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">Student Assessments & Performance</h3>
                        <p className="text-[11px] text-slate-500">Recent test marks, grades, and class rankings</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('assessments')}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View All</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {examResults.length === 0 ? (
                    <div className="py-10 text-center text-xs text-slate-400 space-y-1">
                      <Award size={26} className="mx-auto text-slate-300" />
                      <p className="font-semibold text-slate-600">No assessment marks published yet</p>
                      <p className="text-[11px] text-slate-400">Exam scores and rankings will appear here once graded.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {examResults.slice(0, 4).map((er: any) => {
                        const totalMarks = er.exam?.totalMarks || 100;
                        const pct = er.percentage ?? Math.round((er.marks / totalMarks) * 100);
                        const avgPct = Math.round(((er.classAverage || er.marks) / totalMarks) * 100);

                        return (
                          <div key={er.id} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                                    {er.exam?.subject?.name || 'Subject'}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {er.exam?.examType || 'Assessment'} • {formatDate(er.exam?.date)}
                                  </span>
                                </div>
                                <h4 className="font-bold text-xs text-slate-900 mt-1">
                                  {er.exam?.title || 'Class Assessment'}
                                </h4>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="flex items-center gap-1.5 justify-end">
                                  <span className="text-base font-black text-slate-900 font-mono">
                                    {er.marks}<span className="text-[11px] text-slate-400">/{totalMarks}</span>
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    er.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                    er.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                    er.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                                    er.grade === 'S' ? 'bg-slate-200 text-slate-800' :
                                    'bg-rose-100 text-rose-800'
                                  }`}>
                                    Grade {er.grade}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono font-bold text-indigo-600">
                                  Rank #{er.rank || 1} {er.totalStudents ? `of ${er.totalStudents}` : ''}
                                </span>
                              </div>
                            </div>

                            {/* Visual Progress vs Class Average */}
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-slate-500">
                                <span>Score: <strong className="text-slate-800">{pct}%</strong></span>
                                <span>Class Avg: <strong className="text-slate-700">{avgPct}%</strong></span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    pct >= 75 ? 'bg-emerald-500' : pct >= 55 ? 'bg-indigo-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                            </div>

                            {er.comment && (
                              <p className="text-[11px] text-slate-600 italic bg-white px-2.5 py-1.5 rounded-xl border border-slate-100">
                                Teacher Remark: "{er.comment}"
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right: Recent Gate Check-Ins & Study Resources */}
                <div className="space-y-6">
                  {/* Recent Gate Check-In Timestamps */}
                  <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                          <Clock size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">Recent Gate Check-In Times</h3>
                          <p className="text-[11px] text-slate-500">Verified arrival timestamps at academy entrance</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('attendance')}
                        className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>Full Log</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    {(childData.attendances || []).length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        No attendance check-ins recorded yet.
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {childData.attendances.slice(0, 4).map((att: any) => (
                          <div key={att.id} className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-2">
                            <div>
                              <p className="font-bold text-xs text-slate-900">{att.class?.name || 'Class Session'}</p>
                              <p className="text-[11px] text-slate-500">{formatDate(att.date)}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-black text-xs text-teal-700 block">
                                {att.scannedAt ? formatTime(att.scannedAt) : '--:--'}
                              </span>
                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                att.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {att.status} • {att.method}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Course Materials / Google Drive Resources */}
                  <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                          <FolderDown size={18} />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900">Study Materials & Google Drive Links</h3>
                          <p className="text-[11px] text-slate-500">Handouts, past papers, and shared drive folders</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('classes')}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>All Files</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>

                    {(childData.learningMaterials || []).length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        No study materials uploaded yet.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {childData.learningMaterials.slice(0, 3).map((m: any) => {
                          const isGDrive = m.fileUrl?.includes('drive.google.com') || m.fileUrl?.includes('docs.google.com');
                          return (
                            <div key={m.id} className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-[9px] font-bold">
                                    {m.subject?.name || m.fileType}
                                  </span>
                                  {isGDrive && (
                                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[9px] font-bold">
                                      Google Drive
                                    </span>
                                  )}
                                </div>
                                <p className="font-bold text-xs text-slate-900 truncate mt-1">{m.title}</p>
                              </div>
                              <a
                                href={m.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-white hover:bg-brand-50 text-brand-700 border border-slate-200 text-xs font-bold flex items-center gap-1 shrink-0"
                              >
                                <ExternalLink size={12} />
                                <span>{isGDrive ? 'Open Drive' : 'Open'}</span>
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: STUDENT ASSESSMENTS & STUDENT PERFORMANCE (NEW!) */}
          {/* ======================================================== */}
          {activeTab === 'assessments' && (
            <div className="space-y-6">
              {/* Academic Performance KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Average</span>
                  <p className="text-2xl sm:text-3xl font-black text-indigo-700 mt-1">
                    {examResults.length > 0 ? `${avgExamPercentage}%` : 'N/A'}
                  </p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${avgExamPercentage}%` }} />
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-amber-50/70 border border-amber-200/80 shadow-sm">
                  <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Best Class Rank</span>
                  <p className="text-2xl sm:text-3xl font-black text-amber-800 mt-1">
                    {bestExamRank ? `#${bestExamRank}` : 'N/A'}
                  </p>
                  <span className="text-[11px] text-amber-700 font-medium">Top position achieved</span>
                </div>

                <div className="p-5 rounded-3xl bg-emerald-50/70 border border-emerald-200/80 shadow-sm">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Highest Score</span>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-800 mt-1">
                    {examResults.length > 0 ? `${highestExamPercentage}%` : 'N/A'}
                  </p>
                  <span className="text-[11px] text-emerald-700 font-medium">Personal best mark</span>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exams Graded</span>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                    {examResults.length}
                  </p>
                  <span className="text-[11px] text-slate-500">
                    {examResults.filter((r: any) => r.grade !== 'F').length} Passed
                  </span>
                </div>
              </div>

              {/* Detailed Exam Performance Report Card */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <Award size={18} className="text-indigo-600" />
                      <span>{childData.fullName}'s Assessment Marks & Class Rankings</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Complete record of monthly tests, term evaluations, subject grades, and lecturer feedback
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={examSubjectFilter}
                      onChange={(e) => setExamSubjectFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                    >
                      <option value="ALL">All Subjects</option>
                      {examSubjects.map(subj => (
                        <option key={subj} value={subj}>{subj}</option>
                      ))}
                    </select>

                    <button
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer size={13} />
                      <span>Print Report Card</span>
                    </button>
                  </div>
                </div>

                {filteredExamResults.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                    <Award size={32} className="mx-auto text-slate-300" />
                    <p className="font-bold text-slate-700">No Assessment Results Found</p>
                    <p className="text-[11px] text-slate-400">
                      When teachers publish exam scores for {childData.fullName}, marks and rankings will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-100">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                        <tr>
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Assessment Title & Type</th>
                          <th className="py-3 px-3">Subject / Class</th>
                          <th className="py-3 px-3">Student Marks</th>
                          <th className="py-3 px-3">Grade</th>
                          <th className="py-3 px-3">Class Rank</th>
                          <th className="py-3 px-3">Class Average</th>
                          <th className="py-3 px-3">Teacher Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredExamResults.map((er: any) => {
                          const totalMarks = er.exam?.totalMarks || 100;
                          const pct = er.percentage ?? Math.round((er.marks / totalMarks) * 100);
                          return (
                            <tr key={er.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-3 font-medium text-slate-600 whitespace-nowrap">
                                {formatDate(er.exam?.date)}
                              </td>
                              <td className="py-3 px-3">
                                <span className="font-bold text-slate-900 block">{er.exam?.title || 'Assessment'}</span>
                                <span className="text-[10px] font-mono text-slate-400">{er.exam?.examType || 'Exam'}</span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                  {er.exam?.subject?.name || 'Subject'}
                                </span>
                                {er.exam?.class?.name && (
                                  <span className="block text-[10px] text-slate-400 mt-0.5">{er.exam.class.name}</span>
                                )}
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-black text-sm text-slate-900 font-mono">
                                  {er.marks} <span className="text-[10px] font-normal text-slate-400">/ {totalMarks}</span>
                                </div>
                                <span className="text-[10px] font-bold text-indigo-600">{pct}%</span>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                  er.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                  er.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                  er.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                                  er.grade === 'S' ? 'bg-slate-200 text-slate-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  Grade {er.grade}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-mono font-black text-xs">
                                  #{er.rank || 1}
                                  {er.totalStudents ? <span className="text-[10px] font-normal text-amber-700"> / {er.totalStudents}</span> : ''}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">
                                {er.classAverage ?? er.marks} / {totalMarks}
                              </td>
                              <td className="py-3 px-3 text-slate-600 italic">
                                {er.comment || 'Satisfactory'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ATTENDANCE RECORD & TIME REPORT */}
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

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={filterMonth}
                      onChange={(e) => setFilterMonth(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                    >
                      <option value="ALL">All Months</option>
                      {availableMonths.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    <select
                      value={filterClassId}
                      onChange={(e) => setFilterClassId(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700"
                    >
                      <option value="ALL">All Classes</option>
                      {childData.enrollments?.map((en: any) => (
                        <option key={en.classId} value={en.classId}>
                          {en.class?.classCode || en.class?.name}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors flex items-center space-x-1"
                    >
                      <Printer size={13} />
                      <span>Print Report</span>
                    </button>
                  </div>
                </div>

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
          {/* TAB 3: TUITION FEES & RECEIPTS */}
          {/* ======================================================== */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Pending Tuition Balance</span>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {formatLKR(pendingTuitionBalance)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">Payable at academy counter</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Paid To Date</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">
                    {formatLKR(totalTuitionPaid)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">{childData.payments?.length || 0} Official Receipts Issued</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Frequency</span>
                  <p className="text-2xl font-black text-slate-800 mt-1">Monthly</p>
                  <p className="text-[11px] text-slate-500 mt-1">Due before 10th of every month</p>
                </div>
              </div>

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
                              className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold transition-colors cursor-pointer"
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
          {/* TAB 4: SMART PASS & RFID */}
          {/* ======================================================== */}
          {activeTab === 'smartpass' && (
            <div className="space-y-6">
              <div className="max-w-md mx-auto p-6 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-600 p-[2px] mx-auto shadow-md shadow-teal-500/20">
                  <img
                    src={getStudentAvatar(childData)}
                    alt={childData.fullName}
                    className="w-full h-full object-cover rounded-full bg-slate-100"
                  />
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">{childData.fullName}</h3>
                  <p className="text-xs font-mono font-bold text-teal-700">{childData.studentIdNumber}</p>
                  <p className="text-xs text-slate-500">{childData.grade} • {childData.school || 'Cambridge Academy'}</p>
                </div>

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
                  className="w-full py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <QrCode size={15} />
                  <span>Open Printable Student ID Card</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: ENROLLED CLASSES & STUDY MATERIALS */}
          {/* ======================================================== */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-3">Enrolled Tuition Classes ({childData.enrollments?.length || 0})</h3>
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
              </div>

              {/* Study Materials & Google Drive Links */}
              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Class Study Materials & Google Drive Links</h3>
                    <p className="text-xs text-slate-500">Handouts, past papers, and shared Google Drive folders for {childData.fullName}</p>
                  </div>
                  {onNavigateGlobal && (
                    <button
                      onClick={() => onNavigateGlobal('materials')}
                      className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 text-xs font-bold hover:bg-brand-100 cursor-pointer"
                    >
                      Open Full Repository
                    </button>
                  )}
                </div>

                {(childData.learningMaterials || []).length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No course materials uploaded yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {childData.learningMaterials.map((m: any) => {
                      const isGDrive = m.fileUrl?.includes('drive.google.com') || m.fileUrl?.includes('docs.google.com');
                      const isExternal = /^https?:\/\//i.test(m.fileUrl || '');
                      return (
                        <div key={m.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] font-bold">
                                {m.subject?.name || m.fileType}
                              </span>
                              {isGDrive && (
                                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                                  Google Drive
                                </span>
                              )}
                            </div>
                            <h5 className="font-bold text-xs text-slate-900 mt-1 truncate">{m.title}</h5>
                            {m.description && <p className="text-[11px] text-slate-500 truncate">{m.description}</p>}
                          </div>
                          <a
                            href={m.fileUrl}
                            download={!isExternal ? true : undefined}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                              isGDrive
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {isExternal ? <ExternalLink size={13} /> : <Download size={13} />}
                            <span>{isGDrive ? 'Open Google Drive' : isExternal ? 'Open Link' : 'Download'}</span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      ) : null}

      {/* PWA INSTALL MODAL */}
      {showPwaModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-slate-100">
            <button
              onClick={() => setShowPwaModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center space-x-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-600 flex items-center justify-center shrink-0 border border-teal-500/30">
                <Smartphone size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Save App to Home Screen</h3>
                <p className="text-xs text-slate-500">1-Tap instant access • Stays logged in permanently</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100">
              <button
                onClick={() => setPwaDeviceTab('android')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  pwaDeviceTab === 'android' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                Android / Chrome
              </button>
              <button
                onClick={() => setPwaDeviceTab('iphone')}
                className={`py-2 rounded-xl text-xs font-bold transition-all ${
                  pwaDeviceTab === 'iphone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                iPhone / Safari
              </button>
            </div>

            {pwaDeviceTab === 'android' ? (
              <div className="space-y-3 text-xs text-slate-700">
                <p>1. Tap the <strong>3-dot menu (⋮)</strong> in the top-right corner of Chrome.</p>
                <p>2. Select <strong>"Add to Home screen"</strong> or <strong>"Install App"</strong>.</p>
                <p>3. Tap <strong>Add</strong> — the Parent App icon will appear on your phone!</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-700">
                <p>1. Tap the <strong>Share button</strong> at the bottom of Safari.</p>
                <p>2. Scroll down and tap <strong>"Add to Home Screen"</strong>.</p>
                <p>3. Tap <strong>Add</strong> in the top-right corner.</p>
              </div>
            )}

            <button
              onClick={() => setShowPwaModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
