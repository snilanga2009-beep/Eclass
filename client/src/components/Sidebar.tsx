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
  Sparkles,
  Radio,
  Coins
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
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
  gradient: string;
  glow: string;
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

  // Navigation Items with Colorful Themes & Categories
  const navItems: NavItemConfig[] = [
    // MAIN
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER', 'RECEPTIONIST'], 
      category: 'MAIN',
      gradient: 'from-blue-500 to-indigo-600',
      glow: 'shadow-blue-500/25'
    },

    // ACADEMICS
    { 
      id: 'students', 
      label: 'Students Directory', 
      icon: Users, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'TEACHER'], 
      category: 'ACADEMICS',
      gradient: 'from-violet-500 to-purple-600',
      glow: 'shadow-purple-500/25'
    },
    { 
      id: 'classes', 
      label: 'Tuition Classes', 
      icon: BookOpen, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST'], 
      category: 'ACADEMICS',
      gradient: 'from-emerald-500 to-teal-600',
      glow: 'shadow-emerald-500/25'
    },
    { 
      id: 'attendance', 
      label: 'Attendance (QR Scan)', 
      icon: QrCode, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST'], 
      category: 'ACADEMICS',
      gradient: 'from-amber-500 to-orange-500',
      glow: 'shadow-amber-500/25',
      badge: 'LIVE',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    { 
      id: 'teachers', 
      label: 'Faculty & Teachers', 
      icon: GraduationCap, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'], 
      category: 'ACADEMICS',
      gradient: 'from-indigo-500 to-blue-600',
      glow: 'shadow-indigo-500/25'
    },
    { 
      id: 'assessments', 
      label: 'Assessments & Tests', 
      icon: FileText, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER'], 
      category: 'ACADEMICS',
      gradient: 'from-orange-500 to-amber-600',
      glow: 'shadow-orange-500/25'
    },
    { 
      id: 'materials', 
      label: 'Learning Materials', 
      icon: FolderDown, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT'], 
      category: 'ACADEMICS',
      gradient: 'from-pink-500 to-rose-600',
      glow: 'shadow-pink-500/25'
    },

    // FINANCE
    { 
      id: 'daily-earnings', 
      label: 'Daily Collection & Earnings', 
      icon: Coins, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'], 
      category: 'FINANCE',
      gradient: 'from-amber-500 to-emerald-600',
      glow: 'shadow-amber-500/25',
      badge: 'TODAY',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    { 
      id: 'payments', 
      label: 'Fee Cashier & Receipts', 
      icon: CreditCard, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'], 
      category: 'FINANCE',
      gradient: 'from-teal-500 to-emerald-600',
      glow: 'shadow-teal-500/25'
    },
    { 
      id: 'pending-fees', 
      label: 'Pending Defaulters', 
      icon: AlertCircle, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], 
      category: 'FINANCE',
      gradient: 'from-rose-500 to-red-600',
      glow: 'shadow-rose-500/25',
      badge: 'DUE',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    },
    { 
      id: 'accounting', 
      label: 'Accounting & P&L', 
      icon: Calculator, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], 
      category: 'FINANCE',
      gradient: 'from-cyan-500 to-blue-600',
      glow: 'shadow-cyan-500/25'
    },

    // COMMUNICATIONS
    { 
      id: 'messaging', 
      label: 'SMS & WhatsApp Gateway', 
      icon: MessageSquare, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST'], 
      category: 'COMMUNICATIONS',
      gradient: 'from-fuchsia-500 to-purple-600',
      glow: 'shadow-fuchsia-500/25',
      badge: 'text.lk',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    },

    // SYSTEM
    { 
      id: 'reports', 
      label: 'Report Center', 
      icon: BarChart3, 
      roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT'], 
      category: 'SYSTEM',
      gradient: 'from-sky-500 to-indigo-600',
      glow: 'shadow-sky-500/25'
    },
    { 
      id: 'audit', 
      label: 'Audit Trail', 
      icon: ShieldCheck, 
      roles: ['SUPER_ADMIN', 'ADMIN'], 
      category: 'SYSTEM',
      gradient: 'from-slate-400 to-zinc-600',
      glow: 'shadow-slate-500/25'
    },
    { 
      id: 'settings', 
      label: 'System Settings', 
      icon: Settings, 
      roles: ['SUPER_ADMIN', 'ADMIN'], 
      category: 'SYSTEM',
      gradient: 'from-violet-600 to-indigo-800',
      glow: 'shadow-purple-500/25'
    }
  ];

  // Dedicated Student Portal Nav
  if (user?.role === 'STUDENT') {
    navItems.splice(0, navItems.length,
      { 
        id: 'student-portal', 
        label: 'Student Pass & Portal', 
        icon: LayoutDashboard, 
        roles: ['STUDENT'], 
        category: 'PORTAL',
        gradient: 'from-sky-500 to-blue-600',
        glow: 'shadow-sky-500/25'
      },
      { 
        id: 'materials', 
        label: 'My Study Materials', 
        icon: FolderDown, 
        roles: ['STUDENT'], 
        category: 'PORTAL',
        gradient: 'from-pink-500 to-rose-600',
        glow: 'shadow-pink-500/25'
      }
    );
  }

  // Dedicated Parent Portal Nav
  if (user?.role === 'PARENT') {
    navItems.splice(0, navItems.length,
      { 
        id: 'parent-portal', 
        label: 'Guardian Portal', 
        icon: LayoutDashboard, 
        roles: ['PARENT'], 
        category: 'PORTAL',
        gradient: 'from-teal-500 to-emerald-600',
        glow: 'shadow-teal-500/25'
      },
      { 
        id: 'materials', 
        label: 'Class Study Materials', 
        icon: FolderDown, 
        roles: ['PARENT'], 
        category: 'PORTAL',
        gradient: 'from-pink-500 to-rose-600',
        glow: 'shadow-pink-500/25'
      }
    );
  }

  const filteredNavItems = navItems.filter(item => hasRole(item.roles));

  // Category labels and order
  const categories: { key: NavItemConfig['category']; title: string }[] = [
    { key: 'MAIN', title: 'OVERVIEW' },
    { key: 'ACADEMICS', title: 'ACADEMIC MANAGEMENT' },
    { key: 'FINANCE', title: 'FINANCE & CASHIER' },
    { key: 'COMMUNICATIONS', title: 'MESSAGING & ALERTS' },
    { key: 'SYSTEM', title: 'MANAGEMENT & SETUP' },
    { key: 'PORTAL', title: 'PORTAL DASHBOARD' }
  ];

  const handleSelectTab = (id: string) => {
    setCurrentTab(id);
    if (isMobileOpen) {
      setIsMobileOpen(false);
    }
  };

  // Helper for role badge colors
  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'ADMIN':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'ACCOUNTANT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'TEACHER':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'RECEPTIONIST':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'PARENT':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      default:
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-md lg:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-[#0c121e] text-slate-300 border-r border-slate-800/90 shadow-2xl transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand / Logo Header */}
        <div className="flex items-center justify-between h-18 px-4 border-b border-slate-800/80 bg-slate-950/50 backdrop-blur-sm">
          <div 
            className="flex items-center space-x-3 overflow-hidden cursor-pointer group" 
            onClick={() => handleSelectTab('dashboard')}
          >
            {/* Glowing multi-color brand logo badge */}
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-pink-500 p-[1.5px] shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform shrink-0">
              <div className="w-full h-full bg-[#0d1424] rounded-[14px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-pink-400 transition-colors" />
              </div>
            </div>

            {!collapsed && (
              <div className="flex flex-col truncate">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-base tracking-tight leading-tight">Apex CAMS</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-indigo-300 to-pink-400">
                  Tuition ERP 2.0
                </span>
              </div>
            )}
          </div>
          
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
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
                  <div className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
                    <span>{cat.title}</span>
                    <span className="w-8 h-[1px] bg-slate-800" />
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
                          w-full flex items-center space-x-3 px-2.5 py-2 rounded-2xl text-xs font-semibold transition-all group relative
                          ${isActive 
                            ? 'bg-slate-800/90 text-white shadow-lg border border-slate-700/80' 
                            : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'}
                        `}
                        title={collapsed ? item.label : undefined}
                      >
                        {/* Active vertical glow indicator bar */}
                        {isActive && (
                          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b ${item.gradient}`} />
                        )}

                        {/* Colorful Gradient Icon Box */}
                        <div className={`
                          w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200
                          ${isActive 
                            ? `bg-gradient-to-tr ${item.gradient} text-white shadow-md ${item.glow} scale-105` 
                            : `bg-slate-800/80 text-slate-300 group-hover:bg-gradient-to-tr group-hover:${item.gradient} group-hover:text-white group-hover:scale-105`}
                        `}>
                          <Icon size={16} />
                        </div>

                        {/* Label & Badges */}
                        {!collapsed && (
                          <span className={`truncate flex-1 text-left ${isActive ? 'text-white font-bold' : 'group-hover:text-white'}`}>
                            {item.label}
                          </span>
                        )}

                        {!collapsed && item.badge && (
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border flex items-center gap-1 ${
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
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-sm">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} p-2 rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-sm`}>
            <div className="relative shrink-0">
              <img 
                src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80"} 
                alt={user?.name} 
                className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/40"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
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
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
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
