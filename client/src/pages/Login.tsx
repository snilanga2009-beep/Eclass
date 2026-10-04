import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Building2, 
  ShieldCheck, 
  GraduationCap, 
  CreditCard, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Check,
  Radio,
  Clock,
  Phone,
  HelpCircle,
  Sparkles,
  QrCode,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { UserRole } from '../types';

interface LoginProps {
  onLoginSuccess?: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login, parentLogin } = useAuth();
  const { settings, instituteName, instituteTagline, campusAddress } = useSettings();

  const [loginMode, setLoginMode] = useState<'staff' | 'parent'>('staff');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [parentPhone, setParentPhone] = useState('077 101 2001');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>('admin');

  // Live ticking clock for prestigious academy header
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentDateTime(
        now.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) + ' • ' + now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Detect URL parameter on mount to auto-switch to parent tab if arriving from SMS/WhatsApp
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('parentPhone') || params.get('phone');
    if (p) {
      setLoginMode('parent');
      setParentPhone(p);
    }
  }, []);

  // Executive Role Presets with clean institutional styling
  const quickProfiles = [
    {
      id: 'admin',
      role: 'ADMIN' as UserRole,
      title: 'Campus Admin',
      badge: 'Full Operations',
      username: 'admin',
      password: 'password123',
      icon: ShieldCheck,
      accent: 'border-blue-500/80 bg-blue-950/40 text-blue-400',
      description: 'Academics, Classes, Students, System'
    },
    {
      id: 'receptionist',
      role: 'RECEPTIONIST' as UserRole,
      title: 'Front Office',
      badge: 'Front Desk Counter',
      username: 'receptionist',
      password: 'password123',
      icon: Building2,
      accent: 'border-amber-500/80 bg-amber-950/40 text-amber-400',
      description: 'Admissions, Cashier POS, Gate Check-in'
    },
    {
      id: 'accountant',
      role: 'ACCOUNTANT' as UserRole,
      title: 'Chief Accountant',
      badge: 'Finance & P&L',
      username: 'accountant',
      password: 'password123',
      icon: CreditCard,
      accent: 'border-emerald-500/80 bg-emerald-950/40 text-emerald-400',
      description: 'Tuition Ledgers, Receipts, Expenses'
    },
    {
      id: 'teacher',
      role: 'TEACHER' as UserRole,
      title: 'Senior Faculty',
      badge: 'Classroom & Marks',
      username: 'teacher',
      password: 'password123',
      icon: GraduationCap,
      accent: 'border-indigo-500/80 bg-indigo-950/40 text-indigo-400',
      description: 'QR Attendance, Exams, Learning Materials'
    }
  ];

  const handleSelectPreset = (p: typeof quickProfiles[0]) => {
    setActivePreset(p.id);
    setUsername(p.username);
    setPassword(p.password);
    setError(null);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please provide both staff username and password');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await login(username.trim(), password.trim());
      const selected = quickProfiles.find(p => p.username === username.trim());
      if (onLoginSuccess && selected) {
        onLoginSuccess(selected.role);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid username or password. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleParentSubmit = async (e?: React.FormEvent, overridePhone?: string) => {
    if (e) e.preventDefault();
    const phoneToUse = (overridePhone || parentPhone).trim();
    if (!phoneToUse) {
      setError('Please enter your registered mobile phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await parentLogin(phoneToUse);
      if (onLoginSuccess) {
        onLoginSuccess('PARENT');
      }
    } catch (err: any) {
      console.error('Parent login error:', err);
      setError(err.message || 'No registered student record found for this phone number. Please contact academy front office.');
    } finally {
      setLoading(false);
    }
  };

  const currentAcademyName = instituteName || settings.INSTITUTE_NAME || 'Apex Higher Education Institute';
  const currentTagline = instituteTagline || settings.INSTITUTE_TAGLINE || 'Excellence in Tuition & Academic Mentorship';

  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between text-slate-100 overflow-x-hidden selection:bg-brand-600 selection:text-white">
      
      {/* REAL PHOTOGRAPHIC BACKGROUND IMAGE WITH EXECUTIVE FROSTED OVERLAY */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-100"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=2000&auto=format&fit=crop&q=90')`
        }}
      >
        {/* Multilayered Executive Gradient Overlay: Deep slate/navy tones for crisp contrast and zero generic AI look */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-900/90" />
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[3px]" />
        {/* Subtle architectural grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      {/* TOP INSTITUTIONAL HEADER BAR */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          {/* Institutional Shield Crest */}
          <div className="w-11 h-11 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-lg flex items-center justify-center text-white shrink-0">
            <Building2 className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-white uppercase">
                {currentAcademyName}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-brand-300 border border-slate-700 uppercase tracking-widest font-mono">
                CAMS 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {currentTagline}
            </p>
          </div>
        </div>

        {/* Live System Beacon & Colombo Clock */}
        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono text-slate-300 bg-slate-900/80 border border-slate-700/80">
            <Clock size={12} className="text-slate-400" />
            <span>{currentDateTime}</span>
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px]">System Online</span>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA: TWO EQUAL EXECUTIVE PANELS */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full max-w-7xl mx-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* LEFT PANEL: CAMPUS PORTAL SHOWCASE & HIGHLIGHTS (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Title & Department Indicator */}
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-slate-800/90 border border-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider shadow-sm">
                <ShieldCheck size={14} className="text-brand-400" />
                <span>Front Office & Bursar Management Suite</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
                Class Accounting & Front Office Portal
              </h1>

              <p className="text-sm sm:text-base text-slate-300/90 max-w-2xl leading-relaxed">
                Centralized cloud operations for student admissions, 125kHz RFID gate attendance, tuition fee collections, and automated thermal POS receipt issuance.
              </p>
            </div>

            {/* 4 Core Operational Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 shrink-0 border border-slate-700">
                  <QrCode size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Fast Gate Check-in</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    125kHz RFID card tap & QR pass scanner with instant student fee verification.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-slate-800 text-amber-400 shrink-0 border border-slate-700">
                  <CreditCard size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Counter Fee Collection</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Official sequential receipts (REC-2026-XXXX), admission fee status, and balance dues.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-slate-800 text-blue-400 shrink-0 border border-slate-700">
                  <Smartphone size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">SMS & WhatsApp Gateway</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Real-time parent alerts on student entry, payment receipts, and announcements.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-slate-700 transition-all flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-slate-800 text-purple-400 shrink-0 border border-slate-700">
                  <FileText size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Faculty Accounting</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    Lecturer revenue shares, batch payroll, cash flow forecasting, and audit trail.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick 1-Click Role Presets Bar */}
            <div className="pt-2 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                  Authorized Staff Roles (1-Click Auto-Fill):
                </span>
                <span className="text-[10px] text-brand-400 font-mono">Tap badge to switch user</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {quickProfiles.map((p) => {
                  const Icon = p.icon;
                  const isSelected = loginMode === 'staff' && activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setLoginMode('staff');
                        handleSelectPreset(p);
                      }}
                      className={`text-left p-3 rounded-2xl border transition-all duration-150 cursor-pointer ${
                        isSelected 
                          ? 'bg-slate-800 border-white text-white ring-2 ring-brand-500/60 shadow-lg' 
                          : 'bg-slate-900/70 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className={`p-1.5 rounded-lg ${p.accent}`}>
                          <Icon size={14} />
                        </div>
                        {isSelected && (
                          <span className="w-3.5 h-3.5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[9px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-white truncate">{p.title}</p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.badge}</p>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: AUTHENTICATION SUITE CARD (5 cols on lg) */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <div className="rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-6 sm:p-8 shadow-2xl relative">
              
              {/* Login Mode Toggle Tabs */}
              <div className="flex p-1 rounded-2xl bg-slate-950 border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('staff');
                    setError(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    loginMode === 'staff'
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 size={15} />
                  <span>Staff & Faculty</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('parent');
                    setError(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer ${
                    loginMode === 'parent'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users size={15} />
                  <span>Parent Portal</span>
                </button>
              </div>

              {/* Card Header */}
              {loginMode === 'staff' ? (
                <div className="space-y-1 mb-6 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                      Staff Authentication
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Single Sign-On</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Staff Sign In</h2>
                  <p className="text-xs text-slate-400">
                    Enter your staff username & security password to unlock terminal.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 mb-6 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Parent & Guardian Mobile Access
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">PWA Link</span>
                  </div>
                  <h2 className="text-2xl font-black text-white tracking-tight">Parent Portal Login</h2>
                  <p className="text-xs text-slate-400">
                    Enter your registered phone number for instant access to student attendance & fees.
                  </p>
                </div>
              )}

              {/* Error Alert Box */}
              {error && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in zoom-in-95 duration-200">
                  <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Authentication Notice</p>
                    <p className="text-[11px] text-rose-300/90 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* STAFF LOGIN FORM */}
              {loginMode === 'staff' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                      Username / Staff ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserIcon size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. admin or receptionist"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                        Account Password
                      </label>
                      <span className="text-[11px] text-brand-400 font-medium hover:underline cursor-pointer">
                        Forgot Password?
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center space-x-2 text-slate-400 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                      <span className="text-xs">Keep terminal logged in</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">Sri Lanka (LKR)</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-brand-900/30 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Security Access...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to Terminal</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <div className="pt-2 text-center">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Default Demo Password: <strong className="text-white font-mono bg-slate-800 px-1.5 py-0.5 rounded">password123</strong>
                    </span>
                  </div>
                </form>
              )}

              {/* PARENT & GUARDIAN PHONE LOGIN FORM */}
              {loginMode === 'parent' && (
                <form onSubmit={handleParentSubmit} className="space-y-4">
                  <div className="space-y-1.5 text-left">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                      Parent / Guardian Mobile Phone
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-emerald-400 font-bold text-xs font-mono">
                        🇱🇰 +94
                      </div>
                      <input
                        type="tel"
                        required
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="077 101 2001 or 771012001"
                        className="w-full pl-20 pr-4 py-3 rounded-2xl bg-slate-950 border border-slate-700/80 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Enter the phone number registered when enrolling your student.
                    </p>
                  </div>

                  {/* 1-Time Permanent Login Guarantee Box */}
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 flex items-start space-x-2.5 text-xs text-emerald-200">
                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-300">1-Time Sign In Guaranteed</p>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                        Stays signed in permanently on your phone home screen. View live arrival times, attendance percentages, and monthly fee receipts.
                      </p>
                    </div>
                  </div>

                  {/* Submit Parent Login */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-900/30 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Guardian Phone...</span>
                      </>
                    ) : (
                      <>
                        <span>Open Guardian Portal</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  {/* Quick Demo Parent Numbers */}
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Quick Demo Parent Numbers (Tap to Test):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { phone: '077 101 2001', label: 'Kasun (Gr.12)' },
                        { phone: '077 102 2002', label: 'Nimali (Gr.12)' },
                        { phone: '077 103 2003', label: 'Tharindu (Gr.13)' }
                      ].map((demo) => (
                        <button
                          key={demo.phone}
                          type="button"
                          onClick={() => {
                            setParentPhone(demo.phone);
                            handleParentSubmit(undefined, demo.phone);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-950 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 hover:text-white text-[11px] font-mono transition-all flex items-center space-x-1 cursor-pointer"
                        >
                          <span>{demo.phone}</span>
                          <span className="text-[9px] text-slate-400">({demo.label})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {/* Bottom Security Footer in Card */}
              <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-400" />
                  <span>256-Bit SSL/TLS Security</span>
                </span>
                <span className="font-mono text-slate-500">Port 5000 Active</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* FOOTER SYSTEM STATUS & ACCREDITATION */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800/80">
        <p className="text-slate-400">
          &copy; 2026 {currentAcademyName}. Official Class Accounting &amp; Management System (CAMS).
        </p>
        <p className="font-mono text-[11px] text-slate-500">
          Node Express &bull; React PWA &bull; 125kHz RFID Engine &bull; POS Thermal Standard
        </p>
      </footer>

    </div>
  );
};
