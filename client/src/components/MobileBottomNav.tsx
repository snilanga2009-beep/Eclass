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
  Sparkles,
  Coins
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MobileBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenQuickScan: () => void;
  onOpenQuickPayment: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
  onOpenQuickScan,
  onOpenQuickPayment
}) => {
  const { user, logout, hasRole } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

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
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c121e]/95 backdrop-blur-lg border-t border-slate-800/90 shadow-2xl px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around"
      >
        {/* 1. Home / Dashboard */}
        <button
          onClick={() => handleTabClick(user?.role === 'STUDENT' ? 'student-portal' : user?.role === 'PARENT' ? 'parent-portal' : 'dashboard')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-2xl transition-all ${
            currentTab === 'dashboard' || currentTab === 'student-portal' || currentTab === 'parent-portal'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard size={20} className={currentTab === 'dashboard' || currentTab === 'student-portal' || currentTab === 'parent-portal' ? 'text-indigo-400' : 'text-slate-400'} />
          <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
        </button>

        {/* 2. Students */}
        <button
          onClick={() => handleTabClick('students')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-2xl transition-all ${
            currentTab === 'students'
              ? 'text-purple-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={20} className={currentTab === 'students' ? 'text-purple-400' : 'text-slate-400'} />
          <span className="text-[10px] mt-0.5 tracking-tight">Students</span>
        </button>

        {/* 3. High-Priority Center Action: Attendance (QR Scanner) */}
        <button
          onClick={() => handleTabClick('attendance')}
          className="flex flex-col items-center justify-center -mt-6 group focus:outline-none"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-400 p-[2.5px] shadow-lg shadow-orange-500/40 active:scale-95 transition-transform flex items-center justify-center">
            <div className="w-full h-full rounded-full bg-[#0d1424] flex items-center justify-center text-amber-300">
              <QrCode size={26} className="animate-pulse" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-amber-400 mt-0.5">Attend</span>
        </button>

        {/* 4. Payments */}
        <button
          onClick={() => handleTabClick('payments')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-2xl transition-all ${
            currentTab === 'payments'
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard size={20} className={currentTab === 'payments' ? 'text-emerald-400' : 'text-slate-400'} />
          <span className="text-[10px] mt-0.5 tracking-tight">Payments</span>
        </button>

        {/* 5. More Sheet Trigger */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 px-2 rounded-2xl transition-all ${
            isMoreOpen ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Menu size={20} className={isMoreOpen ? 'text-white' : 'text-slate-400'} />
          <span className="text-[10px] mt-0.5 tracking-tight">More</span>
        </button>
      </nav>

      {/* Slide-Up "More" Sheet on Mobile */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex items-end bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full bg-[#0c121e] border-t border-slate-800 rounded-t-3xl max-h-[85vh] overflow-y-auto p-5 pb-8 space-y-5 animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">All Modules</h3>
                  <p className="text-[10px] text-slate-400">Class Accounting Management System</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
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
                className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2"
              >
                <QrCode size={18} />
                <span>QR Scanner</span>
              </button>

              <button
                onClick={() => {
                  onOpenQuickPayment();
                  setIsMoreOpen(false);
                }}
                className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2"
              >
                <CreditCard size={18} />
                <span>Collect Fee</span>
              </button>
            </div>

            {/* Grid of Other Modules */}
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">System Navigation</p>
              <div className="grid grid-cols-2 gap-2">
                {moreMenuItems.map(item => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`p-3 rounded-2xl text-left flex items-center space-x-2.5 border transition-all ${
                        isActive
                          ? 'bg-slate-800 text-white border-slate-700 shadow-md'
                          : 'bg-slate-900/60 text-slate-300 border-slate-800/80 hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon size={16} className="text-indigo-400 shrink-0" />
                      <span className="text-xs font-semibold truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Profile and Logout */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80"} 
                  alt="" 
                  className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/30"
                />
                <div>
                  <p className="text-xs font-bold text-white leading-tight">{user?.name}</p>
                  <p className="text-[10px] text-indigo-400 font-mono">{user?.role}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  logout();
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
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
