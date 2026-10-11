import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  QrCode, 
  CreditCard, 
  Menu, 
  X, 
  BookOpen, 
  Calculator, 
  GraduationCap, 
  FileText, 
  FolderDown, 
  MessageSquare, 
  BarChart3, 
  ShieldCheck, 
  Settings, 
  LogOut,
  Coins,
  Building2,
  Award,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ParentSubTab } from '../pages/ParentPortal';

interface MobileBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenQuickScan: () => void;
  onOpenQuickPayment: () => void;
  onOpenIDCard?: (studentId: string) => void;
  parentSubTab?: ParentSubTab;
  onSelectParentSubTab?: (subTab: ParentSubTab) => void;
  collapsed?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
  onOpenQuickScan,
  onOpenQuickPayment,
  onOpenIDCard,
  parentSubTab = 'overview',
  onSelectParentSubTab,
  collapsed = false
}) => {
  const { user, logout, hasRole } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';
  const isStudentOrParent = isStudent || isParent;

  const handleTabClick = (tab: string) => {
    if (tab === 'attendance-scan') {
      onOpenQuickScan();
    } else {
      onNavigate(tab);
    }
    setIsMoreOpen(false);
  };

  const handleParentNav = (subTab: ParentSubTab) => {
    if (currentTab !== 'parent-portal') {
      onNavigate('parent-portal');
    }
    if (onSelectParentSubTab) {
      onSelectParentSubTab(subTab);
    }
  };

  const moreMenuItems = [
    { id: 'assessments', label: 'Assessments & Exams', icon: Award, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST', 'ACCOUNTANT'] },
    { id: 'attendance', label: 'Attendance & Roster', icon: Clock, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST'] },
    { id: 'daily-earnings', label: 'Daily Collection', icon: Coins, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'] },
    { id: 'classes', label: 'Classes & Batches', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST'] },
    { id: 'pending-fees', label: 'Pending Fees', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { id: 'accounting', label: 'Accounting & P&L', icon: Calculator, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { id: 'teachers', label: 'Teachers & Faculty', icon: GraduationCap, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
    { id: 'materials', label: 'Learning Materials', icon: FolderDown, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
    { id: 'messaging', label: 'SMS & WhatsApp', icon: MessageSquare, roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'] },
    { id: 'reports', label: 'Report Center', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { id: 'settings', label: 'System Settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] }
  ].filter(item => hasRole(item.roles as any));

  // For Parent & Student users, keep the bottom navigation dock visible across all screen sizes
  // For Staff/Admin users, show on mobile & tablet (< lg) where the sidebar is collapsed into drawer
  const navVisibilityClass = isStudentOrParent
    ? `fixed bottom-0 left-0 right-0 ${collapsed ? 'lg:left-20' : 'lg:left-64'} z-40`
    : 'lg:hidden fixed bottom-0 left-0 right-0 z-40';

  const gridColsClass = isStudent ? 'grid-cols-5' : 'grid-cols-6';

  return (
    <>
      <nav 
        aria-label="Bottom Navigation Bar"
        className={`${navVisibilityClass} bg-white/98 backdrop-blur-md border-t-2 border-blue-100 shadow-[0_-8px_30px_rgba(0,85,255,0.10)] px-1 py-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] grid ${gridColsClass} gap-0.5 items-center select-none`}
      >
        {/* ============================================================ */}
        {/* PARENT APP DEDICATED FOOTER NAVIGATION BAR */}
        {/* ============================================================ */}
        {isParent && (
          <>
            {/* 1. Dashboard Overview */}
            <button
              type="button"
              onClick={() => handleParentNav('overview')}
              className={`flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
                currentTab === 'parent-portal' && parentSubTab === 'overview'
                  ? 'text-white bg-[#0055FF] font-extrabold shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 hover:text-[#0055FF]'
              }`}
            >
              <LayoutDashboard size={18} strokeWidth={2.2} className={currentTab === 'parent-portal' && parentSubTab === 'overview' ? 'text-white' : 'text-[#0055FF]'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-full">Home</span>
            </button>

            {/* 2. Assessments & Student Performance (EXAMS) */}
            <button
              type="button"
              onClick={() => handleParentNav('assessments')}
              className={`flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
                currentTab === 'parent-portal' && parentSubTab === 'assessments'
                  ? 'text-white bg-[#0055FF] font-extrabold shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 hover:text-[#0055FF]'
              }`}
            >
              <Award size={18} strokeWidth={2.2} className={currentTab === 'parent-portal' && parentSubTab === 'assessments' ? 'text-amber-300' : 'text-[#0055FF]'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-full">Exams</span>
            </button>

            {/* 3. Attendance & Time */}
            <button
              type="button"
              onClick={() => handleParentNav('attendance')}
              className={`flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
                currentTab === 'parent-portal' && parentSubTab === 'attendance'
                  ? 'text-white bg-[#0055FF] font-extrabold shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 hover:text-[#0055FF]'
              }`}
            >
              <Clock size={18} strokeWidth={2.2} className={currentTab === 'parent-portal' && parentSubTab === 'attendance' ? 'text-white' : 'text-emerald-600'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-full">Attend</span>
            </button>

            {/* 4. Center Action: Child's QR Smart Pass */}
            <button
              type="button"
              onClick={() => handleParentNav('smartpass')}
              className="flex flex-col items-center justify-center min-w-0 w-full -mt-4 group focus:outline-none cursor-pointer"
              title="Student QR ID Pass"
            >
              <div className={`w-11 h-11 rounded-2xl border-2 shadow-lg active:scale-95 transition-all flex items-center justify-center ${
                currentTab === 'parent-portal' && parentSubTab === 'smartpass'
                  ? 'bg-[#003ECB] border-amber-400 text-white shadow-blue-600/40'
                  : 'bg-[#0055FF] hover:bg-[#0044CC] border-white text-white shadow-blue-600/30'
              }`}>
                <QrCode size={20} strokeWidth={2.3} />
              </div>
              <span className="text-[10px] font-extrabold text-[#0055FF] mt-0.5 leading-none truncate max-w-full">ID Pass</span>
            </button>

            {/* 5. Tuition Fees & Receipts */}
            <button
              type="button"
              onClick={() => handleParentNav('fees')}
              className={`flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
                currentTab === 'parent-portal' && parentSubTab === 'fees'
                  ? 'text-white bg-[#0055FF] font-extrabold shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 hover:text-[#0055FF]'
              }`}
            >
              <CreditCard size={18} strokeWidth={2.2} className={currentTab === 'parent-portal' && parentSubTab === 'fees' ? 'text-white' : 'text-emerald-600'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-full">Fees</span>
            </button>

            {/* 6. Study Materials & Classes */}
            <button
              type="button"
              onClick={() => handleParentNav('classes')}
              className={`flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
                (currentTab === 'parent-portal' && parentSubTab === 'classes') || currentTab === 'materials'
                  ? 'text-white bg-[#0055FF] font-extrabold shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 hover:text-[#0055FF]'
              }`}
            >
              <FolderDown size={18} strokeWidth={2.2} className={(currentTab === 'parent-portal' && parentSubTab === 'classes') || currentTab === 'materials' ? 'text-white' : 'text-[#0055FF]'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-full">Notes</span>
            </button>
          </>
        )}

        {/* ============================================================ */}
        {/* STUDENT APP DEDICATED FOOTER NAVIGATION BAR */}
        {/* ============================================================ */}
        {isStudent && (
          <>
            <button
              type="button"
              onClick={() => onNavigate('student-portal')}
              className={`flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'student-portal' ? 'text-white bg-[#0055FF] font-extrabold shadow-sm' : 'text-slate-600 hover:text-[#0055FF]'
              }`}
            >
              <LayoutDashboard size={18} strokeWidth={2.2} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Home</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('student-portal')}
              className="flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-1 rounded-xl text-[#0055FF] hover:bg-blue-50 font-bold transition-all cursor-pointer"
            >
              <Award size={18} strokeWidth={2.2} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Exams</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenIDCard && user?.studentId) {
                  onOpenIDCard(user.studentId);
                } else {
                  onNavigate('student-portal');
                }
              }}
              className="flex flex-col items-center justify-center min-w-0 w-full -mt-4 group focus:outline-none cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#0055FF] border-2 border-white text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-transform flex items-center justify-center">
                <QrCode size={20} strokeWidth={2.3} />
              </div>
              <span className="text-[10px] font-extrabold text-[#0055FF] mt-0.5 leading-none">My Pass</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('materials')}
              className={`flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-1 rounded-xl transition-all cursor-pointer ${
                currentTab === 'materials' ? 'text-white bg-[#0055FF] font-extrabold shadow-sm' : 'text-slate-600 hover:text-[#0055FF]'
              }`}
            >
              <FolderDown size={18} strokeWidth={2.2} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Notes</span>
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-1 rounded-xl text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
            >
              <LogOut size={18} strokeWidth={2.2} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Logout</span>
            </button>
          </>
        )}

        {/* ============================================================ */}
        {/* STAFF / ADMIN MOBILE & TABLET FOOTER BAR */}
        {/* ============================================================ */}
        {!isStudentOrParent && (
          <>
            {/* 1. Home / Dashboard */}
            <button
              type="button"
              onClick={() => handleTabClick('dashboard')}
              className={`flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
                currentTab === 'dashboard' ? 'text-white bg-[#0055FF] font-extrabold shadow-sm' : 'text-slate-600 hover:text-[#0055FF]'
              }`}
            >
              <LayoutDashboard size={18} strokeWidth={2.2} className={currentTab === 'dashboard' ? 'text-white' : 'text-[#0055FF]'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-full">Home</span>
            </button>

            {/* 2. Students */}
            <button
              type="button"
              onClick={() => handleTabClick('students')}
              className={`flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
                currentTab === 'students' ? 'text-white bg-[#0055FF] font-extrabold shadow-sm' : 'text-slate-600 hover:text-[#0055FF]'
              }`}
            >
              <Users size={18} strokeWidth={2.2} className={currentTab === 'students' ? 'text-white' : 'text-[#0055FF]'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-full">Students</span>
            </button>

            {/* 3. Assessments / Exams */}
            <button
              type="button"
              onClick={() => handleTabClick('assessments')}
              className={`flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
                currentTab === 'assessments' ? 'text-white bg-[#0055FF] font-extrabold shadow-sm' : 'text-slate-600 hover:text-[#0055FF]'
              }`}
            >
              <Award size={18} strokeWidth={2.2} className={currentTab === 'assessments' ? 'text-amber-300' : 'text-[#0055FF]'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-full">Exams</span>
            </button>

            {/* 4. Center Action: QR Gate Scanner */}
            <button
              type="button"
              onClick={() => handleTabClick('attendance-scan')}
              className="flex flex-col items-center justify-center min-w-0 w-full -mt-4 group focus:outline-none cursor-pointer"
            >
              <div className="w-11 h-11 rounded-2xl bg-[#0055FF] hover:bg-[#0044CC] border-2 border-white text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-transform flex items-center justify-center">
                <QrCode size={20} strokeWidth={2.3} />
              </div>
              <span className="text-[10px] font-extrabold text-[#0055FF] mt-0.5 leading-none truncate max-w-full">Scan QR</span>
            </button>

            {/* 5. Payments */}
            <button
              type="button"
              onClick={() => handleTabClick('payments')}
              className={`flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
                currentTab === 'payments' ? 'text-white bg-[#0055FF] font-extrabold shadow-sm' : 'text-slate-600 hover:text-[#0055FF]'
              }`}
            >
              <CreditCard size={18} strokeWidth={2.2} className={currentTab === 'payments' ? 'text-white' : 'text-emerald-600'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-full">Payments</span>
            </button>

            {/* 6. More Sheet Trigger */}
            <button
              type="button"
              onClick={() => setIsMoreOpen(true)}
              className={`flex flex-col items-center justify-center min-w-0 w-full min-h-[46px] py-1 px-0.5 rounded-xl transition-all cursor-pointer ${
                isMoreOpen ? 'text-white bg-[#0055FF] font-extrabold shadow-sm' : 'text-slate-600 hover:text-[#0055FF]'
              }`}
            >
              <Menu size={18} strokeWidth={2.2} className={isMoreOpen ? 'text-white' : 'text-slate-700'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none truncate max-w-full">More</span>
            </button>
          </>
        )}
      </nav>

      {/* Slide-Up "More" Sheet on Mobile/Tablet (Royal Blue + Crisp White) */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end bg-[#002B80]/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full bg-white border-t border-blue-100 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-8 space-y-5 shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0055FF] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">System Navigation</h3>
                  <p className="text-[10px] text-slate-500">Class Accounting Management System</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onOpenQuickScan();
                  setIsMoreOpen(false);
                }}
                className="p-3 rounded-xl bg-[#0055FF] text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <QrCode size={16} />
                <span>Scan QR</span>
              </button>

              <button
                onClick={() => {
                  handleTabClick('assessments');
                }}
                className="p-3 rounded-xl bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Award size={16} />
                <span>Exams</span>
              </button>

              <button
                onClick={() => {
                  onOpenQuickPayment();
                  setIsMoreOpen(false);
                }}
                className="p-3 rounded-xl bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <CreditCard size={16} />
                <span>Collect Fee</span>
              </button>
            </div>

            {/* Grid of Other Modules */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">All Modules</p>
              <div className="grid grid-cols-2 gap-2">
                {moreMenuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`p-3 rounded-xl text-left flex items-center space-x-2.5 border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#0055FF] text-white border-[#0055FF] font-extrabold shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-[#0055FF]'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-white shrink-0' : 'text-[#0055FF] shrink-0'} />
                      <span className="text-xs truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Profile and Logout */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-[#0055FF] text-white font-bold flex items-center justify-center text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{user?.role?.replace('_', ' ')}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  logout();
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
