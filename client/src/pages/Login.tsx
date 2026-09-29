import React, { useState } from 'react';
import { 
  Lock, 
  User as UserIcon, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ArrowRight, 
  Building2, 
  ShieldCheck, 
  GraduationCap, 
  CreditCard, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Smartphone,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface LoginProps {
  onLoginSuccess?: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login, parentLogin } = useAuth();
  const [loginMode, setLoginMode] = useState<'staff' | 'parent'>('staff');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [parentPhone, setParentPhone] = useState('077 101 2001');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>('admin');

  // Detect URL parameter on mount to select parent tab if linked from SMS
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('parentPhone') || params.get('phone');
    if (p) {
      setLoginMode('parent');
      setParentPhone(p);
    }
  }, []);

  // Quick preset profiles highlighting Admin + Front Office
  const quickProfiles = [
    {
      id: 'admin',
      role: 'ADMIN' as UserRole,
      title: 'Campus Admin',
      badge: 'Full Operations',
      username: 'admin',
      password: 'password123',
      icon: ShieldCheck,
      color: 'from-blue-600 to-indigo-600',
      border: 'border-blue-500/40',
      glow: 'shadow-blue-500/20',
      description: 'Academics, Classes, Students, Reports'
    },
    {
      id: 'receptionist',
      role: 'RECEPTIONIST' as UserRole,
      title: 'Front Office',
      badge: 'Reception Desk',
      username: 'receptionist',
      password: 'password123',
      icon: Building2,
      color: 'from-amber-500 to-orange-600',
      border: 'border-amber-500/40',
      glow: 'shadow-amber-500/20',
      description: 'Admissions, Counter Payments, Check-in'
    },
    {
      id: 'teacher',
      role: 'TEACHER' as UserRole,
      title: 'Faculty Teacher',
      badge: 'QR Attendance',
      username: 'teacher',
      password: 'password123',
      icon: GraduationCap,
      color: 'from-emerald-500 to-teal-600',
      border: 'border-emerald-500/40',
      glow: 'shadow-emerald-500/20',
      description: 'Fast Camera QR Scan, Marks, Notes'
    },
    {
      id: 'accountant',
      role: 'ACCOUNTANT' as UserRole,
      title: 'Chief Cashier',
      badge: 'Finance & P&L',
      username: 'accountant',
      password: 'password123',
      icon: CreditCard,
      color: 'from-violet-500 to-purple-600',
      border: 'border-purple-500/40',
      glow: 'shadow-purple-500/20',
      description: 'Fee Balances, Receipts, Commissions'
    },
    {
      id: 'superadmin',
      role: 'SUPER_ADMIN' as UserRole,
      title: 'Super Admin',
      badge: 'God Mode',
      username: 'superadmin',
      password: 'password123',
      icon: Sparkles,
      color: 'from-pink-500 to-rose-600',
      border: 'border-rose-500/40',
      glow: 'shadow-rose-500/20',
      description: 'Master Control, Backups, Audit Trail'
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
      setError('Please provide both username and password');
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
      setError(err.message || 'Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleParentSubmit = async (e?: React.FormEvent, overridePhone?: string) => {
    if (e) e.preventDefault();
    const phoneToUse = (overridePhone || parentPhone).trim();
    if (!phoneToUse) {
      setError('Please enter your mobile phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await parentLogin(phoneToUse);
      if (onLoginSuccess) {
        onLoginSuccess('PARENT');
      }
    } catch (err: any) {
      console.error('Parent login error:', err);
      setError(err.message || 'No registered student found for this mobile number. Please contact academy reception.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#080d1a] text-slate-100 overflow-x-hidden relative selection:bg-brand-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header / Branding Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-pink-500 p-[2px] shadow-lg shadow-indigo-500/30">
            <div className="w-full h-full bg-[#0d1424] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base sm:text-lg font-black tracking-tight text-white">Apex CAMS</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase tracking-widest font-mono">
                v2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Tuition ERP & Financial Accounting System</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Secure System Active</span>
          </span>
        </div>
      </header>

      {/* Main Center Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-4 sm:py-8 z-10 w-full max-w-6xl mx-auto">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Quick Role Portals (Admin + Front Office Prominent) */}
          <div className="lg:col-span-6 space-y-5">
            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold">
                <Building2 size={13} />
                <span>Select Your Department or Role</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Class Accounting & Front Office Portal
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto lg:mx-0">
                Sign in to manage tuition fees, student admissions, live 125kHz RFID card attendance, and teacher commission payouts.
              </p>
            </div>

            {/* Quick 1-Click Role Presets Cards */}
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Staff Role Presets (1-Tap Login)</span>
                <span className="text-[10px] text-brand-400 font-normal">Tap to auto-fill</span>
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                      className={`text-left p-3 rounded-2xl border transition-all duration-200 relative overflow-hidden group flex items-start space-x-3 ${
                        isSelected 
                          ? `bg-slate-800/90 ${p.border} ${p.glow} ring-2 ring-indigo-500/50` 
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${p.color} text-white shadow-md shrink-0 group-hover:scale-105 transition-transform`}>
                        <Icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate">{p.title}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center shrink-0">
                              <Check size={10} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block mt-0.5">{p.badge}</span>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">{p.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Parent & Guardian Portal Quick Banner */}
            <div 
              onClick={() => {
                setLoginMode('parent');
                setError(null);
              }}
              className="cursor-pointer p-4 rounded-2xl bg-gradient-to-r from-teal-950/60 to-emerald-950/60 border border-teal-700/50 hover:border-teal-500 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Users size={20} />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-white">Parent & Guardian Portal</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      1-Time Login
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Track your child's live RFID check-in time & fees on mobile</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Right Column: Main Login Form Card */}
          <div className="lg:col-span-6 w-full max-w-md mx-auto">
            <div className="rounded-3xl bg-slate-900/85 backdrop-blur-xl border border-slate-800/90 p-6 sm:p-8 shadow-2xl shadow-black/60 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Login Mode Tabs */}
              <div className="flex p-1 rounded-2xl bg-slate-950 border border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('staff');
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    loginMode === 'staff'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Building2 size={14} />
                  <span>Staff & Faculty</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoginMode('parent');
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                    loginMode === 'parent'
                      ? 'bg-teal-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Users size={14} />
                  <span>Parent & Guardian</span>
                </button>
              </div>

              {/* Header inside Card */}
              {loginMode === 'staff' ? (
                <div className="space-y-1 mb-6 text-center sm:text-left">
                  <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider">Staff Authentication</span>
                  <h2 className="text-2xl font-black text-white tracking-tight">Staff Sign In</h2>
                  <p className="text-xs text-slate-400">
                    Enter your staff username & password to access management modules.
                  </p>
                </div>
              ) : (
                <div className="space-y-1 mb-6 text-center sm:text-left">
                  <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider">Guardian Mobile Access</span>
                  <h2 className="text-2xl font-black text-white tracking-tight">Parent Portal Login</h2>
                  <p className="text-xs text-slate-400">
                    Enter your registered phone number. Stays logged in permanently on your phone!
                  </p>
                </div>
              )}

              {/* Error Alert Box */}
              {error && (
                <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5 animate-in fade-in zoom-in-95 duration-200">
                  <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Authentication Failed</p>
                    <p className="text-[11px] text-rose-300/90 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* STAFF LOGIN FORM */}
              {loginMode === 'staff' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Username / Staff ID
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <UserIcon size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g. admin or receptionist"
                        className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-300">
                        Password
                      </label>
                      <span className="text-[11px] text-brand-400 font-medium hover:underline cursor-pointer">
                        Forgot?
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter account password"
                        className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
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
                        className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Remember this device</span>
                    </label>
                    <span className="text-[11px] text-slate-500 font-mono">Sri Lanka (LKR)</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-indigo-700 hover:from-brand-500 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Authenticating...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In to System</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* PARENT & GUARDIAN PHONE LOGIN FORM */}
              {loginMode === 'parent' && (
                <form onSubmit={handleParentSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300">
                      Parent / Guardian Mobile Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-400 font-bold text-xs">
                        🇱🇰 +94
                      </div>
                      <input
                        type="tel"
                        required
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="e.g. 077 101 2001 or 771012001"
                        className="w-full pl-20 pr-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-mono"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Enter the phone number registered when enrolling your student.
                    </p>
                  </div>

                  {/* 1-Time Permanent Login Guarantee Box */}
                  <div className="p-3 rounded-2xl bg-teal-950/40 border border-teal-800/40 flex items-start space-x-2.5 text-xs text-teal-200">
                    <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-teal-300">1-Time Login Guaranteed</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Once you log in, this PWA keeps you signed in permanently on your Android or iPhone home screen.
                      </p>
                    </div>
                  </div>

                  {/* Submit Parent Login */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-500 hover:to-emerald-600 text-white font-bold text-sm shadow-xl shadow-teal-600/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying Guardian Mobile...</span>
                      </>
                    ) : (
                      <>
                        <span>Open Guardian Portal</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>

                  {/* Demo Parent Numbers Pills */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Quick Demo Parent Numbers (Tap to Test):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { phone: '077 101 2001', label: 'Kasun (Gr.12)' },
                        { phone: '077 102 2002', label: 'Nimali (Gr.12)' },
                        { phone: '077 103 2003', label: 'Tharindu (Gr.13)' },
                        { phone: '077 999 8888', label: 'Dilshan (Gr.12)' }
                      ].map((demo) => (
                        <button
                          key={demo.phone}
                          type="button"
                          onClick={() => {
                            setParentPhone(demo.phone);
                            handleParentSubmit(undefined, demo.phone);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-slate-950 border border-teal-500/30 hover:border-teal-400 text-teal-300 hover:text-white text-[11px] font-mono transition-all flex items-center space-x-1"
                        >
                          <span>{demo.phone}</span>
                          <span className="text-[9px] text-slate-400">({demo.label})</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </form>
              )}

              {/* Bottom Quick Test Credentials Helper for Staff */}
              {loginMode === 'staff' && (
                <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
                  <p className="text-[11px] text-slate-400">
                    Demo Passwords: <code className="text-slate-300 font-mono bg-slate-950 px-1.5 py-0.5 rounded">password123</code>
                  </p>
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Footer System Status */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs text-slate-500 z-10 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-slate-800/50">
        <p>© 2026 Apex Class Accounting & Management System. All rights reserved.</p>
        <p className="font-mono text-[11px] text-slate-500">Node Express • React Vite PWA • 125kHz RFID • LKR</p>
      </footer>
    </div>
  );
};
