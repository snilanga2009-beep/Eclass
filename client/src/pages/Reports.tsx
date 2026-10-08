import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  FileText, 
  Users, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  CheckCircle2,
  DollarSign,
  Share2,
  MessageSquare,
  Sparkles,
  Building,
  GraduationCap,
  Copy,
  Clock,
  ArrowUpRight,
  Filter,
  Check,
  BookOpen,
  Layers,
  RotateCcw
} from 'lucide-react';
import { apiRequest, formatLKR } from '../api';
import { useSettings } from '../context/SettingsContext';

export const Reports: React.FC = () => {
  const { instituteName } = useSettings();
  // Navigation View Tab: Teacher Commission Hub vs Standard Master Reports
  const [activeView, setActiveView] = useState<'commission-hub' | 'master-reports'>('commission-hub');

  // Teacher Commission & Remuneration State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('monthly');
  const [commissionData, setCommissionData] = useState<any>(null);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [copyNotice, setCopyNotice] = useState<string | null>(null);

  // General Dashboard & Master Export State
  const [reportData, setReportData] = useState<any>(null);
  const [selectedReportId, setSelectedReportId] = useState('students');
  const [exportContent, setExportContent] = useState<any>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // Load KPI overview
  useEffect(() => {
    apiRequest('/reports/dashboard').then(res => setReportData(res));
  }, []);

  // Fetch Teacher Commissions Report with multi-course & class filters
  const fetchCommissionReport = () => {
    setCommissionLoading(true);
    const query = new URLSearchParams({
      teacherId: selectedTeacherId,
      period,
      subject: selectedSubject,
      classId: selectedClassId
    }).toString();

    apiRequest(`/reports/teacher-commissions?${query}`)
      .then(res => setCommissionData(res))
      .catch(err => console.error('Failed to load commission report:', err))
      .finally(() => setCommissionLoading(false));
  };

  useEffect(() => {
    fetchCommissionReport();
  }, [selectedTeacherId, period, selectedSubject, selectedClassId]);

  // Fetch Master Export Table
  useEffect(() => {
    if (!selectedReportId || activeView !== 'master-reports') return;
    setExportLoading(true);
    apiRequest(`/reports/export/${selectedReportId}`)
      .then(res => setExportContent(res))
      .finally(() => setExportLoading(false));
  }, [selectedReportId, activeView]);

  // WhatsApp Report Generator
  const handleSendWhatsAppReport = () => {
    if (!commissionData) return;
    const teacherName = selectedTeacherId === 'ALL' 
      ? 'All Faculty Teachers (Institute Summary)' 
      : (commissionData.teachers?.find((t: any) => t.id === selectedTeacherId)?.name || 'Teacher');

    const selectedClassName = selectedClassId === 'ALL'
      ? null
      : commissionData.availableClasses?.find((c: any) => c.id === selectedClassId)?.name;

    const courseScopeLines = (selectedSubject !== 'ALL' || selectedClassName)
      ? `${selectedSubject !== 'ALL' ? `📚 *Subject / Course:* ${selectedSubject}\n` : ''}${selectedClassName ? `🏫 *Class / Batch:* ${selectedClassName}\n` : ''}`
      : '';
    
    const periodLabel = period === 'daily' 
      ? `Today (${new Date().toLocaleDateString('en-GB')})` 
      : period === 'weekly' 
      ? 'This Week (Last 7 Days)' 
      : period === 'monthly' 
      ? `This Month (${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })})` 
      : 'All Time';

    const stats = commissionData.activeStats || {};
    const totalCollected = stats.totalCollections || 0;
    const teacherEarnings = stats.teacherEarnings || 0;
    const academyProfit = stats.academyProfit || 0;
    const studentCount = stats.studentCount || 0;
    const transactions = stats.transactionCount || 0;

    const message = 
`📊 *${instituteName.toUpperCase()} - REMUNERATION & PROFIT REPORT*
━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 *Teacher:* ${teacherName}
${courseScopeLines}📅 *Period:* ${periodLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *Total Fees Collected:* Rs. ${totalCollected.toLocaleString()}
👨‍🏫 *Teacher Earnings (Commission):* Rs. ${teacherEarnings.toLocaleString()}
🏛️ *Academy Net Profit:* Rs. ${academyProfit.toLocaleString()}
👥 *Enrolled Students:* ${studentCount}
🧾 *Total Class Payments:* ${transactions}
━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 *Academy Profit Margin:* ${totalCollected > 0 ? Math.round((academyProfit / totalCollected) * 100) : 0}%
📱 *Generated automatically by ${instituteName} System*`;

    // Try finding teacher's phone number
    const teacherObj = commissionData.teachers?.find((t: any) => t.id === selectedTeacherId);
    let targetPhone = '';
    if (teacherObj?.phone) {
      targetPhone = teacherObj.phone.replace(/[^0-9]/g, '');
      if (targetPhone.startsWith('0')) targetPhone = '94' + targetPhone.substring(1);
    }

    const waUrl = targetPhone 
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    // Copy to clipboard
    navigator.clipboard.writeText(message);
    setCopyNotice('Report copied to clipboard & WhatsApp opened!');
    setTimeout(() => setCopyNotice(null), 3500);

    window.open(waUrl, '_blank');
  };

  // CSV Export for Commissions
  const handleDownloadCommissionCSV = () => {
    if (!commissionData?.records || commissionData.records.length === 0) return;
    const headers = ['Date', 'Receipt No', 'Student Name', 'Student ID', 'Subject / Course', 'Class Name', 'Teacher Name', 'Commission Rate', 'Collected Amount (Rs)', 'Teacher Earning (Rs)', 'Academy Profit (Rs)'];
    const rows = commissionData.records.map((r: any) => [
      `"${r.date}"`,
      `"${r.receiptNo}"`,
      `"${r.studentName}"`,
      `"${r.studentIdNumber}"`,
      `"${r.subject || 'General'}"`,
      `"${r.className}"`,
      `"${r.teacherName}"`,
      `"${r.commissionRate}%"`,
      r.collectedAmount,
      r.teacherEarning,
      r.academyProfit
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Teacher_Commission_Report_${period}_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export for Master Reports
  const handleDownloadCSV = () => {
    if (!exportContent?.data || exportContent.data.length === 0) return;
    const items = exportContent.data;
    const headers = Object.keys(items[0]);
    const csvRows = [
      headers.join(','),
      ...items.map((row: any) => headers.map((h: any) => `"${row[h] ?? ''}"`).join(','))
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedReportId}_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const activeStats = commissionData?.activeStats || { totalCollections: 0, teacherEarnings: 0, academyProfit: 0, studentCount: 0, transactionCount: 0 };
  const dailyStats = commissionData?.dailyStats || { totalCollections: 0, teacherEarnings: 0, academyProfit: 0 };
  const weeklyStats = commissionData?.weeklyStats || { totalCollections: 0, teacherEarnings: 0, academyProfit: 0 };
  const monthlyStats = commissionData?.monthlyStats || { totalCollections: 0, teacherEarnings: 0, academyProfit: 0 };

  return (
    <div className="space-y-6">
      {/* Page Title & Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Report Center &amp; Earnings Dashboard</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm">
              Live Audited
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Teacher commission remuneration, academy net profits across Daily, Weekly, and Monthly cycles with WhatsApp exports
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center space-x-2 shrink-0">
          {activeView === 'commission-hub' ? (
            <>
              <button
                type="button"
                onClick={handleSendWhatsAppReport}
                className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all active:scale-95"
              >
                <MessageSquare size={15} />
                <span>Send WhatsApp Report</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCommissionCSV}
                className="px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Download size={14} />
              <span>Download CSV</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="px-3 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Print</span>
          </button>
        </div>
      </div>

      {/* Copy Toast Feedback */}
      {copyNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 size={16} />
            <span>{copyNotice}</span>
          </div>
          <button onClick={() => setCopyNotice(null)} className="text-white/80 hover:text-white">✕</button>
        </div>
      )}

      {/* COLORFUL DASHBOARD METRIC CARDS (Gradient Styling) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Collections Card - Indigo / Blue */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200">Tuition Collections</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <DollarSign size={16} />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black tracking-tight">{formatLKR(activeStats.totalCollections || 0)}</span>
            <p className="text-[11px] text-indigo-200/90 font-medium mt-1 flex items-center gap-1">
              <span>{period === 'daily' ? "Today's Intake" : period === 'weekly' ? 'This Week Intake' : period === 'monthly' ? 'This Month Intake' : 'Total Revenue'}</span>
              <ArrowUpRight size={13} className="text-indigo-300" />
            </p>
          </div>
        </div>

        {/* Teacher Total Commissions Card - Purple / Fuchsia */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-fuchsia-800 text-white shadow-xl shadow-purple-600/20 relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-200">Teacher Earnings (Commission)</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <GraduationCap size={16} />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black tracking-tight">{formatLKR(activeStats.teacherEarnings || 0)}</span>
            <p className="text-[11px] text-purple-200/90 font-medium mt-1 flex items-center gap-1">
              <span>Faculty Remuneration Share</span>
              <span className="font-bold text-white font-mono">
                ({activeStats.totalCollections > 0 ? Math.round((activeStats.teacherEarnings / activeStats.totalCollections) * 100) : 0}%)
              </span>
            </p>
          </div>
        </div>

        {/* Academy Net Profit Card - Emerald / Teal */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200">Academy Net Profit</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Building size={16} />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black tracking-tight">{formatLKR(activeStats.academyProfit || 0)}</span>
            <p className="text-[11px] text-emerald-200/90 font-medium mt-1 flex items-center gap-1">
              <span>Institute Retained Net Margin</span>
              <span className="font-bold text-white font-mono">
                ({activeStats.totalCollections > 0 ? Math.round((activeStats.academyProfit / activeStats.totalCollections) * 100) : 0}%)
              </span>
            </p>
          </div>
        </div>

        {/* Active Students & Sessions Card - Amber / Orange */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-600 to-rose-700 text-white shadow-xl shadow-amber-500/20 relative overflow-hidden flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-200">Active Students &amp; Receipts</span>
            <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Users size={16} />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black tracking-tight">{activeStats.studentCount || 0} <span className="text-sm font-normal opacity-80">Students</span></span>
            <p className="text-[11px] text-amber-200/90 font-medium mt-1">
              {activeStats.transactionCount || 0} class fee payments recorded
            </p>
          </div>
        </div>
      </div>

      {/* Main View Switcher Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveView('commission-hub')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeView === 'commission-hub'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <GraduationCap size={15} />
          <span>Teacher Commission &amp; Academy Profit Hub</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('master-reports')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeView === 'master-reports'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
          }`}
        >
          <FileText size={15} />
          <span>Master Export Reports</span>
        </button>
      </div>

      {/* TAB 1: TEACHER COMMISSION & ACADEMY PROFIT HUB */}
      {activeView === 'commission-hub' && (
        <div className="space-y-6">
          {/* Controls Bar: Multi-Filter by Teacher, Subject/Course, Class and Period */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Filter 1: Teacher Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter size={13} className="text-brand-600" />
                  <span>Select Teacher:</span>
                </label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => {
                    setSelectedTeacherId(e.target.value);
                    setSelectedSubject('ALL');
                    setSelectedClassId('ALL');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                >
                  <option value="ALL">All Faculty Teachers (Institute Wide)</option>
                  {commissionData?.teachers?.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.paymentMethod} {t.paymentRate ? `• ${t.paymentRate}%` : ''} {t.courses?.length > 0 ? `• ${t.courses.length} courses` : ''})
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 2: Subject / Course Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen size={13} className="text-purple-600" />
                  <span>Filter Subject / Course:</span>
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => {
                    setSelectedSubject(e.target.value);
                    setSelectedClassId('ALL');
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 ${
                    selectedSubject !== 'ALL'
                      ? 'border-purple-400 bg-purple-50/50 text-purple-950 focus:ring-purple-500'
                      : 'border-slate-300 bg-white text-slate-900 focus:ring-brand-500'
                  }`}
                >
                  <option value="ALL">All Courses &amp; Subjects</option>
                  {commissionData?.availableSubjects?.map((sub: string) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter 3: Class / Batch Selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={13} className="text-teal-600" />
                  <span>Filter Class / Batch:</span>
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all focus:outline-none focus:ring-2 ${
                    selectedClassId !== 'ALL'
                      ? 'border-teal-400 bg-teal-50/50 text-teal-950 focus:ring-teal-500'
                      : 'border-slate-300 bg-white text-slate-900 focus:ring-brand-500'
                  }`}
                >
                  <option value="ALL">All Classes &amp; Batches</option>
                  {commissionData?.availableClasses
                    ?.filter((c: any) => selectedSubject === 'ALL' || c.subject.toLowerCase() === selectedSubject.toLowerCase())
                    ?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.subject})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Second Row: Period Selector & Quick Reset Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              {/* Daily, Weekly, Monthly Filter Chips */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setPeriod('daily')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    period === 'daily' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Clock size={13} />
                  <span>Daily (Today)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPeriod('weekly')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    period === 'weekly' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Calendar size={13} />
                  <span>Weekly (7D)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPeriod('monthly')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    period === 'monthly' 
                      ? 'bg-emerald-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 size={13} />
                  <span>Monthly</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPeriod('all')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    period === 'all' 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Time
                </button>
              </div>

              {/* Reset Filters Pill */}
              {(selectedTeacherId !== 'ALL' || selectedSubject !== 'ALL' || selectedClassId !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTeacherId('ALL');
                    setSelectedSubject('ALL');
                    setSelectedClassId('ALL');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition-colors self-start sm:self-auto shrink-0"
                >
                  <RotateCcw size={13} />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>

            {/* Active Scope Indicator Badge */}
            {(selectedTeacherId !== 'ALL' || selectedSubject !== 'ALL' || selectedClassId !== 'ALL') && (
              <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Active Audit Scope:</span>
                {selectedTeacherId !== 'ALL' && (
                  <span className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-800 font-bold flex items-center gap-1 text-[11px]">
                    <GraduationCap size={13} />
                    <span>{commissionData?.teachers?.find((t: any) => t.id === selectedTeacherId)?.name || 'Teacher'}</span>
                  </span>
                )}
                {selectedSubject !== 'ALL' && (
                  <span className="px-2.5 py-1 rounded-xl bg-indigo-100 text-indigo-800 font-bold flex items-center gap-1 text-[11px]">
                    <BookOpen size={13} />
                    <span>{selectedSubject}</span>
                    <button onClick={() => setSelectedSubject('ALL')} className="hover:text-indigo-950 ml-0.5">✕</button>
                  </span>
                )}
                {selectedClassId !== 'ALL' && (
                  <span className="px-2.5 py-1 rounded-xl bg-teal-100 text-teal-800 font-bold flex items-center gap-1 text-[11px]">
                    <Layers size={13} />
                    <span>{commissionData?.availableClasses?.find((c: any) => c.id === selectedClassId)?.name || 'Class'}</span>
                    <button onClick={() => setSelectedClassId('ALL')} className="hover:text-teal-950 ml-0.5">✕</button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* SPLIT VISUAL COMPARISON (Two Sides: Teacher Earnings vs Academy Profit) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Side 1: Teacher Earnings & Remuneration */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900 text-white border border-purple-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/40">
                    <GraduationCap size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">Side 1: Remuneration</span>
                    <h3 className="text-base font-black text-white">Teacher Total Earnings (Commission)</h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-purple-500/30 text-purple-200 border border-purple-400/30">
                  {period === 'daily' ? 'DAILY' : period === 'weekly' ? 'WEEKLY' : period === 'monthly' ? 'MONTHLY' : 'ALL TIME'}
                </span>
              </div>

              {/* Dynamic Scope Tag */}
              {(selectedTeacherId !== 'ALL' || selectedSubject !== 'ALL' || selectedClassId !== 'ALL') && (
                <div className="px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-400/20 text-[11px] text-purple-200 font-medium">
                  Auditing: <span className="font-bold text-white">{selectedTeacherId !== 'ALL' ? (commissionData?.teachers?.find((t: any) => t.id === selectedTeacherId)?.name || 'Teacher') : 'All Faculty'}</span>
                  {selectedSubject !== 'ALL' && <span className="font-bold text-purple-300"> • {selectedSubject}</span>}
                  {selectedClassId !== 'ALL' && <span className="font-bold text-teal-300"> • {commissionData?.availableClasses?.find((c: any) => c.id === selectedClassId)?.name}</span>}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 font-medium">Total Payable to Teacher(s):</span>
                  <p className="text-2xl sm:text-3xl font-black text-purple-300 mt-0.5">{formatLKR(activeStats.teacherEarnings || 0)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Commission Share</span>
                  <p className="font-mono text-sm font-black text-emerald-400">
                    {activeStats.totalCollections > 0 ? Math.round((activeStats.teacherEarnings / activeStats.totalCollections) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Quick Period Comparison */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block">DAILY (TODAY)</span>
                  <span className="font-mono font-bold text-white text-xs mt-0.5 block">{formatLKR(dailyStats.teacherEarnings || 0)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block">WEEKLY (7D)</span>
                  <span className="font-mono font-bold text-white text-xs mt-0.5 block">{formatLKR(weeklyStats.teacherEarnings || 0)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block">MONTHLY</span>
                  <span className="font-mono font-bold text-white text-xs mt-0.5 block">{formatLKR(monthlyStats.teacherEarnings || 0)}</span>
                </div>
              </div>
            </div>

            {/* Side 2: Academy Net Profit / Retention */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white border border-teal-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-400/40">
                    <Building size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">Side 2: Profit Retention</span>
                    <h3 className="text-base font-black text-white">Academy Net Profit &amp; Surplus</h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-teal-500/30 text-teal-200 border border-teal-400/30">
                  {period === 'daily' ? 'DAILY' : period === 'weekly' ? 'WEEKLY' : period === 'monthly' ? 'MONTHLY' : 'ALL TIME'}
                </span>
              </div>

              {/* Dynamic Scope Tag */}
              {(selectedTeacherId !== 'ALL' || selectedSubject !== 'ALL' || selectedClassId !== 'ALL') && (
                <div className="px-3 py-1.5 rounded-xl bg-teal-500/15 border border-teal-400/20 text-[11px] text-teal-200 font-medium">
                  Academy Net Surplus From: <span className="font-bold text-white">{selectedTeacherId !== 'ALL' ? (commissionData?.teachers?.find((t: any) => t.id === selectedTeacherId)?.name || 'Teacher') : 'All Faculty'}</span>
                  {selectedSubject !== 'ALL' && <span className="font-bold text-purple-300"> • {selectedSubject}</span>}
                  {selectedClassId !== 'ALL' && <span className="font-bold text-teal-300"> • {commissionData?.availableClasses?.find((c: any) => c.id === selectedClassId)?.name}</span>}
                </div>
              )}

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 font-medium">Net Profit Retained by Academy:</span>
                  <p className="text-2xl sm:text-3xl font-black text-teal-300 mt-0.5">{formatLKR(activeStats.academyProfit || 0)}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Academy Margin</span>
                  <p className="font-mono text-sm font-black text-teal-300">
                    {activeStats.totalCollections > 0 ? Math.round((activeStats.academyProfit / activeStats.totalCollections) * 100) : 0}%
                  </p>
                </div>
              </div>

              {/* Quick Period Comparison */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block">DAILY (TODAY)</span>
                  <span className="font-mono font-bold text-white text-xs mt-0.5 block">{formatLKR(dailyStats.academyProfit || 0)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block">WEEKLY (7D)</span>
                  <span className="font-mono font-bold text-white text-xs mt-0.5 block">{formatLKR(weeklyStats.academyProfit || 0)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-slate-400 font-bold block">MONTHLY</span>
                  <span className="font-mono font-bold text-white text-xs mt-0.5 block">{formatLKR(monthlyStats.academyProfit || 0)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* COURSE & CLASS PERFORMANCE DISTRIBUTION (Multi-Course Breakdown) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Subject / Course Breakdown */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Courses / Subjects Breakdown</h4>
                    <p className="text-[10px] text-slate-500">Tap any subject chip to instantly filter earnings report</p>
                  </div>
                </div>
                {selectedSubject !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedSubject('ALL')}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {commissionData?.breakdownBySubject?.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {commissionData.breakdownBySubject.map((sub: any) => {
                    const isSelected = selectedSubject === sub.subject;
                    return (
                      <div
                        key={sub.subject}
                        onClick={() => setSelectedSubject(isSelected ? 'ALL' : sub.subject)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-purple-50/90 border-purple-400 ring-2 ring-purple-500/20'
                            : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="min-w-0 mr-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">{sub.subject}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700 font-medium shrink-0">
                              {sub.studentCount} Students
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Total: <span className="font-mono font-bold text-slate-800">{formatLKR(sub.totalCollected)}</span>
                          </p>
                        </div>

                        <div className="flex items-center space-x-3 text-right shrink-0">
                          <div>
                            <span className="text-[9px] font-black uppercase text-purple-700 block">Teacher</span>
                            <span className="text-xs font-black font-mono text-purple-700">{formatLKR(sub.teacherEarnings)}</span>
                          </div>
                          <div className="border-l border-slate-200 pl-3">
                            <span className="text-[9px] font-black uppercase text-teal-700 block">Academy</span>
                            <span className="text-xs font-black font-mono text-teal-700">{formatLKR(sub.academyProfit)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No subject breakdown available for this selection.</p>
              )}
            </div>

            {/* Class / Batch Breakdown */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Class Batches Breakdown</h4>
                    <p className="text-[10px] text-slate-500">Tap any class batch to filter its specific earnings</p>
                  </div>
                </div>
                {selectedClassId !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setSelectedClassId('ALL')}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              {commissionData?.breakdownByClass?.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {commissionData.breakdownByClass.map((cls: any) => {
                    const isSelected = selectedClassId === cls.classId;
                    return (
                      <div
                        key={cls.classId}
                        onClick={() => setSelectedClassId(isSelected ? 'ALL' : cls.classId)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-teal-50/90 border-teal-400 ring-2 ring-teal-500/20'
                            : 'bg-slate-50/70 border-slate-200/70 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="min-w-0 mr-2">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">{cls.className}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-bold truncate max-w-[100px] shrink-0">
                              {cls.subject}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {cls.studentCount} Students • Total: <span className="font-mono font-bold text-slate-800">{formatLKR(cls.totalCollected)}</span>
                          </p>
                        </div>

                        <div className="flex items-center space-x-3 text-right shrink-0">
                          <div>
                            <span className="text-[9px] font-black uppercase text-purple-700 block">Teacher</span>
                            <span className="text-xs font-black font-mono text-purple-700">{formatLKR(cls.teacherEarnings)}</span>
                          </div>
                          <div className="border-l border-slate-200 pl-3">
                            <span className="text-[9px] font-black uppercase text-teal-700 block">Academy</span>
                            <span className="text-xs font-black font-mono text-teal-700">{formatLKR(cls.academyProfit)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No class breakdown available for this selection.</p>
              )}
            </div>
          </div>

          {/* DETAILED TRANSACTION & COMMISSION AUDIT TABLE */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span>Class Fee Collections &amp; Teacher Earnings Ledger</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                    {commissionData?.records?.length || 0} Transactions
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Line-by-line revenue share with auto calculated teacher commission vs academy net profit</p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSendWhatsAppReport}
                  className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare size={14} className="text-emerald-600" />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              {commissionLoading ? (
                <div className="py-16 text-center text-xs text-slate-400">Loading commission data...</div>
              ) : commissionData?.records?.length > 0 ? (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-3 px-3.5">Date / Receipt</th>
                      <th className="py-3 px-3.5">Student</th>
                      <th className="py-3 px-3.5">Subject / Course</th>
                      <th className="py-3 px-3.5">Class / Batch</th>
                      <th className="py-3 px-3.5">Teacher &amp; Rate</th>
                      <th className="py-3 px-3.5 text-right">Fee Collected</th>
                      <th className="py-3 px-3.5 text-right font-black text-purple-700">Teacher Commission</th>
                      <th className="py-3 px-3.5 text-right font-black text-teal-700">Academy Profit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {commissionData.records.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <p className="font-bold text-slate-900">{r.date}</p>
                          <span className="font-mono text-[10px] text-slate-400">{r.receiptNo}</span>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <p className="font-bold text-slate-800">{r.studentName}</p>
                          <span className="font-mono text-[10px] text-slate-400">{r.studentIdNumber}</span>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span 
                            onClick={() => setSelectedSubject(r.subject || 'General')}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 cursor-pointer hover:bg-purple-100 transition-colors"
                            title="Click to filter by this subject"
                          >
                            {r.subject || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span 
                            onClick={() => setSelectedClassId(r.classId)}
                            className="font-semibold text-slate-800 hover:text-teal-700 cursor-pointer transition-colors"
                            title="Click to filter by this class"
                          >
                            {r.className}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <p className="font-bold text-slate-900">{r.teacherName}</p>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                            {r.commissionRate}% {r.paymentMethod}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-right font-mono font-bold text-slate-900">
                          {formatLKR(r.collectedAmount)}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-right font-mono font-black text-purple-700 bg-purple-50/30">
                          {formatLKR(r.teacherEarning)}
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap text-right font-mono font-black text-teal-700 bg-teal-50/30">
                          {formatLKR(r.academyProfit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold sticky bottom-0">
                    <tr>
                      <td colSpan={5} className="py-3 px-3.5 text-slate-800 uppercase text-[11px]">
                        Period Total ({period.toUpperCase()})
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-slate-900 font-black">
                        {formatLKR(activeStats.totalCollections || 0)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-purple-800 font-black">
                        {formatLKR(activeStats.teacherEarnings || 0)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-teal-800 font-black">
                        {formatLKR(activeStats.academyProfit || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="py-16 text-center text-xs text-slate-400">
                  No payment records found for the selected teacher, subject, class, and period.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER EXPORT REPORTS */}
      {activeView === 'master-reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Report Selector List */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Available Master Reports</span>
            {reportData?.availableReports?.map((r: any) => (
              <div
                key={r.id}
                onClick={() => setSelectedReportId(r.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedReportId === r.id
                    ? 'border-brand-500 bg-brand-50/60 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{r.name}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Category: {r.category}</p>
              </div>
            ))}
          </div>

          {/* Report Preview Table */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{exportContent?.title || 'Report Preview'}</h3>
                <p className="text-xs text-slate-500">{exportContent?.data?.length || 0} Records ready for export</p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              {exportLoading ? (
                <div className="py-16 text-center text-xs text-slate-400">Loading report data...</div>
              ) : exportContent?.data?.length > 0 ? (
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0">
                    <tr>
                      {Object.keys(exportContent.data[0]).map((col) => (
                        <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exportContent.data.map((row: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        {Object.keys(row).map((col) => (
                          <td key={col} className="py-2.5 px-3 whitespace-nowrap text-slate-800">
                            {typeof row[col] === 'number' && col.includes('Rs') ? formatLKR(row[col]) : String(row[col])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="py-16 text-center text-xs text-slate-400">No records found for this report.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
