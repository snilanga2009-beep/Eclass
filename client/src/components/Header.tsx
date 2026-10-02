import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  Shield, 
  Download, 
  QrCode, 
  CreditCard,
  CheckCircle2,
  Clock,
  ChevronDown,
  LogOut,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { apiRequest } from '../api';
import { RolePermissionsModal } from './RolePermissionsModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenSearch: () => void;
  onOpenQuickScan: () => void;
  onOpenQuickPayment: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenSearch,
  onOpenQuickScan,
  onOpenQuickPayment
}) => {
  const { user, switchRole, logout } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [isRoleGuideOpen, setIsRoleGuideOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const availableRoles: { role: UserRole; label: string; desc: string; color: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full system privileges & configuration', color: 'bg-purple-500' },
    { role: 'ADMIN', label: 'Campus Admin', desc: 'Manage students, classes, teachers & finances', color: 'bg-indigo-500' },
    { role: 'ACCOUNTANT', label: 'Chief Accountant', desc: 'Fees, payments, expenses, teacher commissions', color: 'bg-emerald-500' },
    { role: 'TEACHER', label: 'Teacher (Dr. Silva)', desc: 'My classes, QR attendance, tests, materials', color: 'bg-blue-500' },
    { role: 'RECEPTIONIST', label: 'Front Office Receptionist', desc: 'Student registrations, desk fees, fast attendance', color: 'bg-amber-500' },
    { role: 'PARENT', label: 'Parent (Mr. Kalhara)', desc: 'View child attendance, fee receipts, exam marks', color: 'bg-teal-500' },
    { role: 'STUDENT', label: 'Student (Kasun)', desc: 'Personal schedule, study materials, receipts', color: 'bg-rose-500' }
  ];

  // PWA install prompt handler
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Sample in-app notifications
  const notifications = [
    { id: '1', title: 'Fee Payment Received', text: 'Kasun Kalhara paid Rs. 3,500 (REC-2026-0041)', time: '5m ago', unread: true },
    { id: '2', title: 'Today Attendance Completed', text: 'Grade 12 Combined Maths: 42 present, 2 absent', time: '20m ago', unread: true },
    { id: '3', title: 'New Material Uploaded', text: 'Physics Mechanics Notes by Mrs. Menaka Perera', time: '1h ago', unread: false }
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between transition-all">
      {/* Left: Mobile hamburger + Global Search */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Search trigger bar */}
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-3 px-3.5 py-2 rounded-xl bg-slate-100/80 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 text-sm border border-slate-200/60 transition-all w-48 sm:w-72 lg:w-96 shadow-inner"
        >
          <Search size={16} className="text-slate-400 shrink-0" />
          <span className="truncate text-xs sm:text-sm">Search students, classes, payments...</span>
          <kbd className="hidden sm:inline-block ml-auto text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-white border border-slate-300 text-slate-500 shadow-sm">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right: Quick actions, Role Switcher, Notifications, PWA */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Quick QR Attendance Launcher (Staff only) */}
        {user?.role !== 'STUDENT' && user?.role !== 'PARENT' && (
          <>
            <button
              onClick={onOpenQuickScan}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition-all shadow-sm"
              title="Fast QR Camera Attendance"
            >
              <QrCode size={15} />
              <span>Quick Scan</span>
            </button>

            {/* Quick Fee Collection Launcher */}
            <button
              onClick={onOpenQuickPayment}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 text-xs font-semibold transition-all shadow-sm"
              title="Collect Fee & Print Receipt"
            >
              <CreditCard size={15} />
              <span>Collect Fee</span>
            </button>
          </>
        )}

        {/* PWA Install Button if available */}
        {deferredPrompt && (
          <button
            onClick={handleInstallPWA}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 text-xs font-medium transition-all"
            title="Install App as PWA"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Install App</span>
          </button>
        )}

        {/* ROLE SWITCHER DROPDOWN (Allows immediate preview of all 7 roles) */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium transition-all shadow-sm"
            title="Switch User Role"
          >
            <Shield size={14} className="text-amber-400" />
            <span className="font-semibold">{user?.role?.replace('_', ' ')}</span>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Switch Testing Role</p>
                <p className="text-[11px] text-slate-500">Test portals & permission boundaries instantly</p>
              </div>

              <div className="space-y-1">
                {availableRoles.map(item => (
                  <button
                    key={item.role}
                    onClick={() => {
                      switchRole(item.role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center space-x-3 transition-colors ${
                      user?.role === item.role ? 'bg-slate-100 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 leading-tight">{item.label}</p>
                      <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                    </div>
                    {user?.role === item.role && (
                      <CheckCircle2 size={14} className="text-brand-600 shrink-0" />
                    )}
                  </button>
                ))}

                {/* Role Permissions Guide Button */}
                <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                  <button
                    onClick={() => {
                      setRoleMenuOpen(false);
                      setIsRoleGuideOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2.5 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 transition-colors font-semibold text-xs"
                  >
                    <ShieldCheck size={14} className="shrink-0 text-indigo-600" />
                    <span>View Role Permissions Matrix</span>
                  </button>

                  <button
                    onClick={() => {
                      setRoleMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl flex items-center space-x-2.5 text-rose-600 hover:bg-rose-50 transition-colors font-semibold text-xs"
                  >
                    <LogOut size={14} className="shrink-0" />
                    <span>Sign Out to Login Screen</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Sign Out Action Button */}
        <button
          onClick={logout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          title="Sign Out to Login Screen"
        >
          <LogOut size={17} />
        </button>

        {/* In-App Notifications Drawer Toggle */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Notifications</span>
                <span className="text-[11px] text-brand-600 font-medium cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors text-left">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                      <span className="text-[10px] text-slate-400">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Role Permissions Matrix Modal */}
      <RolePermissionsModal
        isOpen={isRoleGuideOpen}
        onClose={() => setIsRoleGuideOpen(false)}
        currentRole={user?.role}
      />
    </header>
  );
};
