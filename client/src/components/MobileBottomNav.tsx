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
  Building2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenQuickScan: () => void;
  onOpenQuickPayment: () => void;
  onOpenIDCard?: (studentId: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
  onOpenQuickScan,
  onOpenQuickPayment,
  onOpenIDCard
}) => {
  const { user, logout, hasRole } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isStudent = user?.role === 'STUDENT';
  const isParent = user?.role === 'PARENT';
  const isStudentOrParent = isStudent || isParent;

  const handleTabClick = (tab: string) => {
    if (tab === 'attendance') {
      onOpenQuickScan();
    } else {
      onNavigate(tab);
    }
    setIsMoreOpen(false);
  };

  const moreMenuItems = [
    { id: 'daily-earnings', label: 'Daily Collection', icon: Coins, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'] },
    { id: 'classes', label: 'Classes', icon: BookOpen, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST'] },
    { id: 'pending-fees', label: 'Pending Fees', icon: CreditCard, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { id: 'accounting', label: 'Accounting & P&L', icon: Calculator, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { id: 'teachers', label: 'Teachers', icon: GraduationCap, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
    { id: 'assessments', label: 'Assessments', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'] },
    { id: 'materials', label: 'Materials', icon: FolderDown, roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'] },
    { id: 'messaging', label: 'SMS & WhatsApp', icon: MessageSquare, roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'] },
    { id: 'reports', label: 'Report Center', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
    { id: 'audit', label: 'Audit Trail', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['SUPER_ADMIN', 'ADMIN'] }
  ].filter(item => hasRole(item.roles as any));

  return (
    <>
      {/* Fixed Mobile Bottom Bar (visible on < md) */}
      <nav 
        aria-label="Mobile Bottom Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/98 backdrop-blur-md border-t border-slate-800 shadow-2xl px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around select-none"
      >
        {/* STUDENT DEDICATED BOTTOM BAR */}
        {isStudent && (
          <>
            {/* 1. Student Home */}
            <button
              onClick={() => onNavigate('student-portal')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'student-portal' ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard size={20} className={currentTab === 'student-portal' ? 'text-brand-400' : 'text-slate-400'} />
              <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
            </button>

            {/* 2. My Fees & Receipts */}
            <button
              onClick={() => onNavigate('student-portal')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'student-portal' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="My Fee Records & Receipts"
            >
              <CreditCard size={20} className="text-emerald-400" />
              <span className="text-[10px] mt-0.5 tracking-tight">My Fees</span>
            </button>

            {/* 3. Center Action: My Smart ID Pass */}
            <button
              onClick={() => {
                if (onOpenIDCard && user?.studentId) {
                  onOpenIDCard(user.studentId);
                } else {
                  onNavigate('student-portal');
                }
              }}
              className="flex flex-col items-center justify-center -mt-6 group focus:outline-none cursor-pointer"
              title="My Student QR Pass"
            >
              <div className="w-13 h-13 rounded-full bg-slate-800 border-2 border-brand-500 text-brand-400 shadow-lg active:scale-95 transition-transform flex items-center justify-center">
                <QrCode size={24} />
              </div>
              <span className="text-[10px] font-bold text-brand-400 mt-0.5">My Pass</span>
            </button>

            {/* 4. Study Materials */}
            <button
              onClick={() => onNavigate('materials')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'materials' ? 'text-brand-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderDown size={20} className={currentTab === 'materials' ? 'text-brand-400' : 'text-slate-400'} />
              <span className="text-[10px] mt-0.5 tracking-tight">Materials</span>
            </button>

            {/* 5. Logout */}
            <button
              onClick={() => logout()}
              className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
            >
              <LogOut size={20} />
              <span className="text-[10px] mt-0.5 tracking-tight">Logout</span>
            </button>
          </>
        )}

        {/* PARENT DEDICATED BOTTOM BAR */}
        {isParent && (
          <>
            {/* 1. Parent Home */}
            <button
              onClick={() => onNavigate('parent-portal')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'parent-portal' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard size={20} className={currentTab === 'parent-portal' ? 'text-teal-400' : 'text-slate-400'} />
              <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
            </button>

            {/* 2. Child Fees & Receipts */}
            <button
              onClick={() => onNavigate('parent-portal')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'parent-portal' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Child's Fee Records & Receipts"
            >
              <CreditCard size={20} className="text-emerald-400" />
              <span className="text-[10px] mt-0.5 tracking-tight">Fees</span>
            </button>

            {/* 3. Center Action: Child's QR Pass */}
            <button
              onClick={() => {
                if (onOpenIDCard && user?.studentId) {
                  onOpenIDCard(user.studentId);
                } else {
                  onNavigate('parent-portal');
                }
              }}
              className="flex flex-col items-center justify-center -mt-6 group focus:outline-none cursor-pointer"
              title="Child's QR ID Card"
            >
              <div className="w-13 h-13 rounded-full bg-slate-800 border-2 border-teal-500 text-teal-400 shadow-lg active:scale-95 transition-transform flex items-center justify-center">
                <QrCode size={24} />
              </div>
              <span className="text-[10px] font-bold text-teal-400 mt-0.5">ID Pass</span>
            </button>

            {/* 4. Study Materials */}
            <button
              onClick={() => onNavigate('materials')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'materials' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderDown size={20} className={currentTab === 'materials' ? 'text-teal-400' : 'text-slate-400'} />
              <span className="text-[10px] mt-0.5 tracking-tight">Materials</span>
            </button>

            {/* 5. Logout */}
            <button
              onClick={() => logout()}
              className="flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
            >
              <LogOut size={20} />
              <span className="text-[10px] mt-0.5 tracking-tight">Logout</span>
            </button>
          </>
        )}

        {/* STAFF (SUPER_ADMIN, ADMIN, ACCOUNTANT, TEACHER, RECEPTIONIST) BOTTOM BAR */}
        {!isStudentOrParent && (
          <>
            {/* 1. Home / Dashboard */}
            <button
              onClick={() => handleTabClick('dashboard')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'dashboard' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard size={20} className={currentTab === 'dashboard' ? 'text-white' : 'text-slate-400'} />
              <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
            </button>

            {/* 2. Students */}
            <button
              onClick={() => handleTabClick('students')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'students' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users size={20} className={currentTab === 'students' ? 'text-white' : 'text-slate-400'} />
              <span className="text-[10px] mt-0.5 tracking-tight">Students</span>
            </button>

            {/* 3. High-Priority Center Action: Attendance (QR Gate Scanner) */}
            <button
              onClick={() => handleTabClick('attendance')}
              className="flex flex-col items-center justify-center -mt-6 group focus:outline-none cursor-pointer"
            >
              <div className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-500 border-2 border-slate-900 text-white shadow-lg active:scale-95 transition-transform flex items-center justify-center">
                <QrCode size={24} />
              </div>
              <span className="text-[10px] font-bold text-emerald-400 mt-0.5">Scan</span>
            </button>

            {/* 4. Payments */}
            <button
              onClick={() => handleTabClick('payments')}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                currentTab === 'payments' ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CreditCard size={20} className={currentTab === 'payments' ? 'text-white' : 'text-slate-400'} />
              <span className="text-[10px] mt-0.5 tracking-tight">Payments</span>
            </button>

            {/* 5. More Sheet Trigger */}
            <button
              onClick={() => setIsMoreOpen(true)}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-xl transition-all cursor-pointer ${
                isMoreOpen ? 'text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Menu size={20} className={isMoreOpen ? 'text-white' : 'text-slate-400'} />
              <span className="text-[10px] mt-0.5 tracking-tight">More</span>
            </button>
          </>
        )}
      </nav>

      {/* Slide-Up "More" Sheet on Mobile */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full bg-slate-900 border-t border-slate-800 rounded-t-2xl max-h-[85vh] overflow-y-auto p-5 pb-8 space-y-5 animate-in slide-in-from-bottom duration-300">
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
