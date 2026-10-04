import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  QrCode, 
  CreditCard, 
  AlertCircle, 
  Calculator, 
  GraduationCap, 
  FileText, 
  FolderDown, 
  MessageSquare, 
  BarChart3, 
  ShieldCheck, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Radio,
  Coins,
  UserCog,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

interface NavItemConfig {
  id: string;
  label: string;
  icon: any;
  roles: UserRole[];
  category: 'MAIN' | 'ACADEMICS' | 'FINANCE' | 'COMMUNICATIONS' | 'SYSTEM' | 'PORTAL';
  iconColor: string;
  badge?: string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  collapsed,
  setCollapsed,
  isMobileOpen,
  setIsMobileOpen
}) => {
  const { user, logout, hasRole } = useAuth();
  const { instituteName, instituteTagline } = useSettings();

  // Navigation Items with Professional Institutional Styling
  const navItems: NavItemConfig[] = [
    // MAIN
    { 
      id: 'dashboard', 
      label: 'Executive Dashboard', 
      icon: LayoutDashboard, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER', 'RECEPTIONIST'], 
      category: 'MAIN',
      iconColor: 'text-brand-400'
    },

    // ACADEMICS
    { 
      id: 'students', 
      label: 'Student Directory', 
      icon: Users, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'TEACHER'], 
      category: 'ACADEMICS',
      iconColor: 'text-indigo-400'
    },
    { 
      id: 'classes', 
      label: 'Tuition Batches & Classes', 
      icon: BookOpen, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST'], 
      category: 'ACADEMICS',
      iconColor: 'text-blue-400'
    },
    { 
      id: 'attendance', 
      label: 'Gate Attendance (QR/RFID)', 
      icon: QrCode, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST'], 
      category: 'ACADEMICS',
      iconColor: 'text-emerald-400',
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    { 
      id: 'attendance-roster', 
      label: "Today's Attended Roster", 
      icon: Users, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST'], 
      category: 'ACADEMICS',
      iconColor: 'text-teal-400',
      badge: 'ROSTER',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40'
    },
    { 
      id: 'teachers', 
      label: 'Faculty & Teachers', 
      icon: GraduationCap, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'], 
      category: 'ACADEMICS',
      iconColor: 'text-sky-400'
    },
    { 
      id: 'assessments', 
      label: 'Assessments & Exams', 
      icon: FileText, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'], 
      category: 'ACADEMICS',
      iconColor: 'text-amber-400'
    },
    { 
      id: 'materials', 
      label: 'Learning Materials', 
      icon: FolderDown, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'], 
      category: 'ACADEMICS',
      iconColor: 'text-slate-300'
    },

    // FINANCE
    { 
      id: 'daily-earnings', 
      label: 'Daily Cash Desk Intake', 
      icon: Coins, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'], 
      category: 'FINANCE',
      iconColor: 'text-emerald-400',
      badge: 'TODAY',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    },
    { 
      id: 'payments', 
      label: 'Counter Payments & POS', 
      icon: CreditCard, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'], 
      category: 'FINANCE',
      iconColor: 'text-emerald-400'
    },
    { 
      id: 'pending-fees', 
      label: 'Outstanding Tuition Dues', 
      icon: AlertCircle, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], 
      category: 'FINANCE',
      iconColor: 'text-amber-400',
      badge: 'DUE',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
    },
    { 
      id: 'accounting', 
      label: 'Accounting & P&L Statement', 
      icon: Calculator, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], 
      category: 'FINANCE',
      iconColor: 'text-teal-400'
    },

    // COMMUNICATIONS
    { 
      id: 'messaging', 
      label: 'SMS & WhatsApp Gateway', 
      icon: MessageSquare, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'], 
      category: 'COMMUNICATIONS',
      iconColor: 'text-purple-400',
      badge: 'GATEWAY',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
    },

    // SYSTEM
    { 
      id: 'reports', 
      label: 'Operations & Audit Reports', 
      icon: BarChart3, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], 
      category: 'SYSTEM',
      iconColor: 'text-blue-400'
    },
    { 
      id: 'audit', 
      label: 'Security Audit Log', 
      icon: ShieldCheck, 
      roles: ['SUPER_ADMIN', 'ADMIN'], 
      category: 'SYSTEM',
      iconColor: 'text-slate-400'
    },
    { 
      id: 'users', 
      label: 'User Accounts & Roles', 
      icon: UserCog, 
      roles: ['SUPER_ADMIN', 'ADMIN'], 
      category: 'SYSTEM',
      iconColor: 'text-indigo-400'
    },
    { 
      id: 'settings', 
      label: 'Institute & System Settings', 
      icon: Settings, 
      roles: ['SUPER_ADMIN', 'ADMIN'], 
      category: 'SYSTEM',
      iconColor: 'text-slate-300'
    }
  ];

  // Dedicated Student Portal Navigation
  if (user?.role === 'STUDENT') {
    navItems.splice(0, navItems.length,
      { 
        id: 'student-portal', 
        label: 'Student Portal & QR Pass', 
        icon: LayoutDashboard, 
        roles: ['STUDENT'], 
        category: 'PORTAL',
        iconColor: 'text-brand-400'
      },
      { 
        id: 'materials', 
        label: 'My Study Materials', 
        icon: FolderDown, 
        roles: ['STUDENT'], 
        category: 'PORTAL',
        iconColor: 'text-slate-300'
      }
    );
  }

  // Dedicated Parent Portal Navigation
  if (user?.role === 'PARENT') {
    navItems.splice(0, navItems.length,
      { 
        id: 'parent-portal', 
        label: 'Guardian Portal', 
        icon: LayoutDashboard, 
        roles: ['PARENT'], 
        category: 'PORTAL',
        iconColor: 'text-emerald-400'
      },
      { 
        id: 'materials', 
        label: 'Class Study Materials', 
        icon: FolderDown, 
        roles: ['PARENT'], 
        category: 'PORTAL',
        iconColor: 'text-slate-300'
      }
    );
  }

  const filteredNavItems = navItems.filter(item => hasRole(item.roles));

  // Category labels and order
  const categories: { key: NavItemConfig['category']; title: string }[] = [
    { key: 'MAIN', title: 'OPERATIONS' },
    { key: 'ACADEMICS', title: 'ACADEMIC MANAGEMENT' },
    { key: 'FINANCE', title: 'FINANCIAL COUNTER & POS' },
    { key: 'COMMUNICATIONS', title: 'PARENT NOTIFICATIONS' },
    { key: 'SYSTEM', title: 'ADMINISTRATION & SETUP' },
    { key: 'PORTAL', title: 'PORTAL ACCESS' }
  ];

  const handleSelectTab = (id: string) => {
    setCurrentTab(id);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-950 text-purple-300 border-purple-800';
      case 'ADMIN':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'ACCOUNTANT':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'TEACHER':
        return 'bg-indigo-950 text-indigo-300 border-indigo-800';
      case 'RECEPTIONIST':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      case 'PARENT':
        return 'bg-teal-950 text-teal-300 border-teal-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Professional Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-300 border-r border-slate-800 shadow-xl transition-all duration-300 ease-in-out select-none
        ${collapsed ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand / Logo Header */}
        <div className="flex items-center justify-between h-18 px-4 border-b border-slate-800 bg-slate-950/70">
          <div 
            className="flex items-center space-x-3 overflow-hidden cursor-pointer group" 
            onClick={() => handleSelectTab('dashboard')}
          >
            {/* Institutional Shield Badge (Professional, no AI rainbow gradients) */}
            <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 text-white flex items-center justify-center shrink-0 group-hover:border-slate-500 transition-colors shadow-sm">
              <Building2 className="w-5 h-5 text-brand-400" />
            </div>

            {!collapsed && (
              <div className="flex flex-col truncate max-w-[155px]">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-sm tracking-tight truncate uppercase">
                    {instituteName || 'Apex Academy'}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                </div>
                <span className="text-[10px] font-semibold text-slate-400 truncate uppercase tracking-wider">
                  {instituteTagline || 'Class Accounting ERP'}
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Categories and Links */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {categories.map(cat => {
            const itemsInCat = filteredNavItems.filter(item => item.category === cat.key);
            if (itemsInCat.length === 0) return null;

            return (
              <div key={cat.key} className="space-y-1">
                {/* Category Section Header */}
                {!collapsed && (
                  <div className="px-3 pt-2.5 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>{cat.title}</span>
                    <span className="w-6 h-[1px] bg-slate-800" />
                  </div>
                )}

                {/* Navigation Items in this Category */}
                <div className="space-y-1">
                  {itemsInCat.map(item => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`
                          w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative cursor-pointer
                          ${isActive 
                            ? 'bg-slate-800 text-white font-bold border-l-4 border-brand-500 shadow-sm' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}
                        `}
                        title={collapsed ? item.label : undefined}
                      >
                        {/* Icon Container with subtle institutional styling */}
                        <div className={`
                          w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors
                          ${isActive 
                            ? 'bg-slate-700/80 text-white' 
                            : `bg-slate-800/80 ${item.iconColor} group-hover:bg-slate-700 group-hover:text-white`}
                        `}>
                          <Icon size={15} />
                        </div>

                        {/* Label & Badges */}
                        {!collapsed && (
                          <span className={`truncate flex-1 text-left ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                            {item.label}
                          </span>
                        )}

                        {!collapsed && item.badge && (
                          <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-md border flex items-center gap-1 ${
                            item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {item.badge === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />}
                            <span>{item.badge}</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer User Profile & Logout */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-xs`}>
            <div className="relative shrink-0">
              <img 
                src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"} 
                alt={user?.name} 
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-700"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate leading-tight">{user?.name}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold border uppercase tracking-wider truncate ${getRoleBadgeStyle(user?.role)}`}>
                    {user?.role?.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )}

            {!collapsed && (
              <button 
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
