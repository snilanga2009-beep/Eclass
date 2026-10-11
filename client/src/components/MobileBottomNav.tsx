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
    { id: 'attendance', label: 'Attendance & Roster', icon: Clock, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST'] },
    { id: 'daily-earnings', label: 'Daily Collection', icon: Coins, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'] },
    { id: 'classes', label: 'Classes & Batches', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST'] },
    { id: 'pending-fees', label: 'Pending Fees', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { id: 'accounting', label: 'Accounting & P&L', icon: Calculator, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { id: 'teachers', label: 'Teachers & Faculty', icon: GraduationCap, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
    { id: 'assessments', label: 'Assessments & Exams', icon: Award, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
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

  return (
    <>
      <nav 
        aria-label="Bottom Navigation Bar"
        className={`${navVisibilityClass} bg-slate-900/98 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2 py-1.5 pb-[max(0.4rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none`}
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
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'parent-portal' && parentSubTab === 'overview'
                  ? 'text-teal-400 bg-teal-500/10 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard size={19} strokeWidth={2.2} className={currentTab === 'parent-portal' && parentSubTab === 'overview' ? 'text-teal-400' : 'text-slate-300'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Dashboard</span>
            </button>

            {/* 2. Attendance & Time */}
            <button
              type="button"
              onClick={() => handleParentNav('attendance')}
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'parent-portal' && parentSubTab === 'attendance'
                  ? 'text-teal-400 bg-teal-500/10 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Clock size={19} strokeWidth={2.2} className={currentTab === 'parent-portal' && parentSubTab === 'attendance' ? 'text-teal-400' : 'text-slate-300'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Attendance</span>
            </button>

            {/* 3. Assessments & Student Performance */}
            <button
              type="button"
              onClick={() => handleParentNav('assessments')}
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'parent-portal' && parentSubTab === 'assessments'
                  ? 'text-indigo-400 bg-indigo-500/15 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Award size={19} strokeWidth={2.2} className={currentTab === 'parent-portal' && parentSubTab === 'assessments' ? 'text-indigo-400' : 'text-slate-300'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Exams</span>
            </button>

            {/* 4. Center Action: Child's QR Smart Pass */}
            <button
              type="button"
              onClick={() => handleParentNav('smartpass')}
              className="flex flex-col items-center justify-center -mt-5 group focus:outline-none cursor-pointer"
              title="Student QR ID Pass"
            >
              <div className={`w-12 h-12 rounded-2xl border-2 shadow-lg active:scale-95 transition-all flex items-center justify-center ${
                currentTab === 'parent-portal' && parentSubTab === 'smartpass'
                  ? 'bg-teal-500 border-white text-slate-950'
                  : 'bg-teal-600 hover:bg-teal-500 border-slate-900 text-white'
              }`}>
                <QrCode size={22} strokeWidth={2.3} />
              </div>
              <span className="text-[10px] font-bold text-teal-400 mt-1 leading-none">ID Pass</span>
            </button>

            {/* 5. Tuition Fees & Receipts */}
            <button
              type="button"
              onClick={() => handleParentNav('fees')}
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'parent-portal' && parentSubTab === 'fees'
                  ? 'text-emerald-400 bg-emerald-500/10 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <CreditCard size={19} strokeWidth={2.2} className={currentTab === 'parent-portal' && parentSubTab === 'fees' ? 'text-emerald-400' : 'text-slate-300'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Fees</span>
            </button>

            {/* 6. Study Materials & Classes */}
            <button
              type="button"
              onClick={() => handleParentNav('classes')}
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                (currentTab === 'parent-portal' && parentSubTab === 'classes') || currentTab === 'materials'
                  ? 'text-brand-400 bg-brand-500/10 font-bold'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FolderDown size={19} strokeWidth={2.2} className={(currentTab === 'parent-portal' && parentSubTab === 'classes') || currentTab === 'materials' ? 'text-brand-400' : 'text-slate-300'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Materials</span>
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
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'student-portal' ? 'text-brand-400 bg-brand-500/10 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard size={19} strokeWidth={2.2} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('student-portal')}
              className="flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-xl text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
            >
              <Award size={19} strokeWidth={2.2} />
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
              className="flex flex-col items-center justify-center -mt-5 group focus:outline-none cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-600 border-2 border-slate-900 text-white shadow-lg active:scale-95 transition-transform flex items-center justify-center">
                <QrCode size={22} strokeWidth={2.3} />
              </div>
              <span className="text-[10px] font-bold text-brand-400 mt-1 leading-none">My Pass</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('materials')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'materials' ? 'text-brand-400 bg-brand-500/10 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <FolderDown size={19} strokeWidth={2.2} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Materials</span>
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="flex flex-col items-center justify-center min-w-[56px] min-h-[46px] py-1 px-2 rounded-xl text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
            >
              <LogOut size={19} strokeWidth={2.2} />
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
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'dashboard' ? 'text-white bg-slate-800 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <LayoutDashboard size={19} strokeWidth={2.2} className={currentTab === 'dashboard' ? 'text-brand-400' : 'text-slate-300'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Home</span>
            </button>

            {/* 2. Students */}
            <button
              type="button"
              onClick={() => handleTabClick('students')}
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'students' ? 'text-white bg-slate-800 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Users size={19} strokeWidth={2.2} className={currentTab === 'students' ? 'text-indigo-400' : 'text-slate-300'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Students</span>
            </button>

            {/* 3. Center Action: QR Gate Scanner */}
            <button
              type="button"
              onClick={() => handleTabClick('attendance-scan')}
              className="flex flex-col items-center justify-center -mt-5 group focus:outline-none cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border-2 border-slate-900 text-white shadow-lg active:scale-95 transition-transform flex items-center justify-center">
                <QrCode size={22} strokeWidth={2.3} />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 mt-1 leading-none">Scan QR</span>
            </button>

            {/* 4. Assessments / Exams */}
            <button
              type="button"
              onClick={() => handleTabClick('assessments')}
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'assessments' ? 'text-white bg-slate-800 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Award size={19} strokeWidth={2.2} className={currentTab === 'assessments' ? 'text-amber-400' : 'text-slate-300'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Exams</span>
            </button>

            {/* 5. Payments */}
            <button
              type="button"
              onClick={() => handleTabClick('payments')}
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'payments' ? 'text-white bg-slate-800 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <CreditCard size={19} strokeWidth={2.2} className={currentTab === 'payments' ? 'text-emerald-400' : 'text-slate-300'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">Payments</span>
            </button>

            {/* 6. More Sheet Trigger */}
            <button
              type="button"
              onClick={() => setIsMoreOpen(true)}
              className={`flex flex-col items-center justify-center min-w-[54px] min-h-[46px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isMoreOpen ? 'text-white bg-slate-800 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Menu size={19} strokeWidth={2.2} className={isMoreOpen ? 'text-white' : 'text-slate-300'} />
              <span className="text-[10px] mt-1 tracking-tight leading-none">More</span>
            </button>
          </>
        )}
      </nav>

      {/* Slide-Up "More" Sheet on Mobile/Tablet */}
      {isMoreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full bg-slate-900 border-t border-slate-800 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-8 space-y-5 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <Building2 size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">System Navigation</h3>
                  <p className="text-[10px] text-slate-400">Class Accounting Management System</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  onOpenQuickScan();
                  setIsMoreOpen(false);
                }}
                className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <QrCode size={18} />
                <span>QR Gate Scanner</span>
              </button>

              <button
                onClick={() => {
                  onOpenQuickPayment();
                  setIsMoreOpen(false);
                }}
                className="p-3 rounded-xl bg-blue-950/60 border border-blue-700/60 text-blue-300 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <CreditCard size={18} />
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
                          ? 'bg-slate-800 text-white border-slate-600 font-bold shadow-xs'
                          : 'bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon size={16} className="text-slate-400 shrink-0" />
                      <span className="text-xs truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Profile and Logout */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm border border-slate-700">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{user?.role?.replace('_', ' ')}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  logout();
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
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
