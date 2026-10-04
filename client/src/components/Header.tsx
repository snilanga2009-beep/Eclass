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
  ShieldCheck,
  Key,
  RefreshCw,
  Building,
  User as UserIcon,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { clearAppCache } from '../api';
import { RolePermissionsModal } from './RolePermissionsModal';
import { ChangePasswordModal } from './ChangePasswordModal';

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isRoleGuideOpen, setIsRoleGuideOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [clearingCache, setClearingCache] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Live real-time clock for institute control desk
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentDate(now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const res = await clearAppCache();
      alert(res.message || 'System cache synchronized successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to clear system cache');
    } finally {
      setClearingCache(false);
    }
  };

  const availableRoles: { role: UserRole; label: string; desc: string; badgeClass: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', desc: 'Full institutional control & configuration', badgeClass: 'bg-purple-100 text-purple-800 border-purple-200' },
    { role: 'ADMIN', label: 'Campus Admin', desc: 'Manage students, classes, teachers & finances', badgeClass: 'bg-blue-100 text-blue-800 border-blue-200' },
    { role: 'ACCOUNTANT', label: 'Chief Accountant', desc: 'Tuition fees, expenses, teacher payroll', badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { role: 'TEACHER', label: 'Teacher (Dr. Silva)', desc: 'Assigned classes, QR attendance, study files', badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { role: 'RECEPTIONIST', label: 'Front Desk Receptionist', desc: 'Student registrations, fee collection, gate scan', badgeClass: 'bg-amber-100 text-amber-800 border-amber-200' },
    { role: 'PARENT', label: 'Parent Portal (Kalhara)', desc: 'View child attendance, fee receipts, reports', badgeClass: 'bg-teal-100 text-teal-800 border-teal-200' },
    { role: 'STUDENT', label: 'Student Portal (Kasun)', desc: 'Study schedule, digital pass, fee status', badgeClass: 'bg-slate-100 text-slate-800 border-slate-200' }
  ];

  // PWA install prompt handler
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Sample in-app notifications with realistic institutional events
  const notifications = [
    { id: '1', title: 'Fee Payment Processed', text: 'Kasun Kalhara paid Rs. 3,500 for Combined Mathematics (REC-2026-0041)', time: '5m ago', unread: true },
    { id: '2', title: 'Session Attendance Closed', text: 'Grade 12 Physics: 42 present, 2 absent verified by scanner', time: '20m ago', unread: true },
    { id: '3', title: 'New Academic Material', text: 'Mechanics Module 02 uploaded for Advanced Level batch', time: '1h ago', unread: false }
  ];

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 lg:px-8 flex items-center justify-between transition-all select-none">
      {/* Left: Mobile hamburger + Global Search */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Trigger Bar */}
        <button
          onClick={onOpenSearch}
          className="flex items-center space-x-3 px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100/90 text-slate-500 hover:text-slate-800 text-sm border border-slate-200/90 transition-all w-48 sm:w-72 lg:w-96 shadow-2xs group cursor-pointer"
        >
          <Search size={15} className="text-slate-400 group-hover:text-slate-600 shrink-0 transition-colors" />
          <span className="truncate text-xs font-normal text-slate-500">Search students, receipts, classes...</span>
          <div className="hidden sm:flex items-center ml-auto space-x-1">
            <kbd className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 shadow-2xs">
              Ctrl
            </kbd>
            <kbd className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-500 shadow-2xs">
              K
            </kbd>
          </div>
        </button>
      </div>

      {/* Right: Operational Actions, Clock, User & Role Switcher */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Live System Clock Widget (Desktop only) */}
        {currentTime && (
          <div className="hidden 2xl:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600 text-xs">
            <Clock size={13} className="text-slate-400 shrink-0" />
            <span className="font-medium text-slate-500">{currentDate}</span>
            <span className="font-mono font-semibold text-slate-800">{currentTime}</span>
          </div>
        )}

        {/* Staff Quick Operational Actions */}
        {user?.role !== 'STUDENT' && user?.role !== 'PARENT' && (
          <div className="hidden sm:flex items-center space-x-2">
            {/* Quick QR Attendance Scan */}
            <button
              onClick={onOpenQuickScan}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 border border-emerald-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-98"
              title="Fast Gate QR Scanner"
            >
              <QrCode size={14} className="text-emerald-700" />
              <span>Gate Scan</span>
            </button>

            {/* Quick Fee Collection */}
            <button
              onClick={onOpenQuickPayment}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-800 hover:bg-brand-100/80 border border-brand-200 text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-98"
              title="Collect Tuition Fee & Print Receipt"
            >
              <CreditCard size={14} className="text-brand-700" />
              <span>Collect Fee</span>
            </button>

            {/* Synchronize / Clear Cache */}
            <button
              onClick={handleClearCache}
              disabled={clearingCache}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-98"
              title="Synchronize Database Cache"
            >
              <RefreshCw size={13} className={clearingCache ? 'animate-spin text-brand-600' : 'text-slate-500'} />
              <span className="hidden xl:inline">{clearingCache ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>
        )}

        {/* PWA Install Button if available */}
        {deferredPrompt && (
          <button
            onClick={handleInstallPWA}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 text-xs font-semibold transition-all cursor-pointer"
            title="Install App as Desktop/Mobile PWA"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition-colors cursor-pointer border border-transparent hover:border-slate-200"
            title="System notifications"
          >
            <Bell size={17} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 p-3.5 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">System Activity</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">3 New</span>
                </div>
                <button 
                  onClick={() => setNotificationsOpen(false)}
                  className="text-[11px] text-brand-600 font-medium hover:underline cursor-pointer"
                >
                  Mark all read
                </button>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.map(n => (
                  <div key={n.id} className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition-colors text-left border border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                      <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-snug">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* INSTITUTIONAL USER & ROLE MENU */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2.5 pl-2 pr-2.5 py-1 rounded-lg bg-slate-100/90 hover:bg-slate-200/80 border border-slate-200/90 transition-all cursor-pointer shadow-2xs"
            title="User Profile & Role Control"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-1 ring-slate-300">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">
                {user?.name?.split(' ')[0] || 'User'}
              </span>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight leading-tight mt-0.5">
                {user?.role?.replace('_', ' ')}
              </span>
            </div>
            <ChevronDown size={14} className="text-slate-500 ml-0.5" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-in fade-in slide-in-from-top-1">
              {/* Account summary header */}
              <div className="px-3 py-2.5 border-b border-slate-100 mb-2 bg-slate-50/70 rounded-lg">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email || user?.username || 'admin@apex.lk'}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Active Role:</span>
                  <span className="font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded text-[10px] uppercase">
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Role preview switcher */}
              <div className="px-2 pb-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Preview System Role
                </p>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {availableRoles.map(item => (
                    <button
                      key={item.role}
                      onClick={() => {
                        switchRole(item.role);
                        setUserMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-xs ${
                        user?.role === item.role 
                          ? 'bg-slate-900 text-white font-semibold' 
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className={`w-2 h-2 rounded-full ${user?.role === item.role ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {user?.role === item.role && (
                        <Check size={13} className="text-emerald-400 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Account management buttons */}
              <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setIsRoleGuideOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2.5 text-slate-700 hover:bg-slate-100 transition-colors text-xs font-medium cursor-pointer"
                >
                  <ShieldCheck size={15} className="shrink-0 text-slate-500" />
                  <span>Role Permissions Matrix</span>
                </button>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2.5 text-slate-700 hover:bg-slate-100 transition-colors text-xs font-medium cursor-pointer"
                >
                  <Key size={15} className="shrink-0 text-slate-500" />
                  <span>Change Password</span>
                </button>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg flex items-center space-x-2.5 text-rose-600 hover:bg-rose-50 transition-colors text-xs font-semibold cursor-pointer"
                >
                  <LogOut size={15} className="shrink-0" />
                  <span>Sign Out</span>
                </button>
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

      {/* Change Password Modal for logged-in user */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        username={user?.username}
      />
    </header>
  );
};
