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
  Clock,
  QrCode,
  Award,
  Phone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { UserRole } from '../types';

interface LoginProps {
  onLoginSuccess?: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login, parentLogin } = useAuth();
  const { settings, instituteName, instituteTagline } = useSettings();

  const [loginMode, setLoginMode] = useState<'parent' | 'staff'>('parent');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [parentPhone, setParentPhone] = useState('077 101 2001');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>('admin');
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
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = params.get('parentPhone') || params.get('phone');
    if (p) {
      setLoginMode('parent');
      setParentPhone(p);
    }
  }, []);

  const quickProfiles = [
    {
      id: 'admin',
      role: 'ADMIN' as UserRole,
      title: 'Campus Admin',
      badge: 'Full Control',
      username: 'admin',
      password: 'password123',
      icon: ShieldCheck,
      iconBg: 'bg-blue-100 text-[#0055FF]'
    },
    {
      id: 'receptionist',
      role: 'RECEPTIONIST' as UserRole,
      title: 'Front Office',
      badge: 'Counter & Scan',
      username: 'receptionist',
      password: 'password123',
      icon: Building2,
      iconBg: 'bg-amber-100 text-amber-600'
    },
    {
      id: 'accountant',
      role: 'ACCOUNTANT' as UserRole,
      title: 'Accountant',
      badge: 'Finance & P&L',
      username: 'accountant',
      password: 'password123',
      icon: CreditCard,
      iconBg: 'bg-emerald-100 text-emerald-600'
    },
    {
      id: 'teacher',
      role: 'TEACHER' as UserRole,
      title: 'Teacher / Faculty',
      badge: 'Classes & Exams',
      username: 'teacher',
      password: 'password123',
      icon: GraduationCap,
      iconBg: 'bg-indigo-100 text-indigo-600'
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
      setError(err.message || 'No registered student record found for this phone number.');
    } finally {
      setLoading(false);
    }
  };

  const currentAcademyName = instituteName || settings.INSTITUTE_NAME || 'Apex Higher Education';
  const currentTagline = instituteTagline || settings.INSTITUTE_TAGLINE || 'Smart Parent Portal & Class Accounting System';

  return (
    <div className="min-h-screen w-full bg-[#0055FF] flex flex-col justify-between text-white overflow-x-hidden select-none">
      {/* Top Bar (Visible on PC & Tablet) */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-8 pt-4 sm:pt-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#5B8DEF] border border-white/30 shadow-md flex items-center justify-center text-white shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm sm:text-base font-extrabold tracking-tight text-white block leading-tight">
              {currentAcademyName}
            </span>
            <span className="text-[11px] text-blue-100 hidden sm:block">
              {currentTagline}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {currentDateTime && (
            <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono text-white bg-white/15 border border-white/20">
              <Clock size={12} />
              <span>{currentDateTime}</span>
            </div>
          )}
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white border border-white/30">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            <span className="text-[11px]">Online</span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center w-full max-w-6xl mx-auto px-0 sm:px-6 lg:px-8 pt-2 lg:py-8 gap-6 lg:gap-12">
        
        {/* ============================================================ */}
        {/* LEFT / TOP HERO SECTION: ROYAL BLUE + PARENT/CHILD ARTWORK */}
        {/* ============================================================ */}
        <div className="w-full lg:w-7/12 flex flex-col items-center lg:items-start text-center lg:text-left px-6 sm:px-0 pt-2 pb-2">
          {/* Iconic App Crest (Matches Screenshot Top Icon) */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[22px] bg-[#5B8DEF] shadow-xl border border-white/30 flex flex-col items-center justify-between pt-3 overflow-hidden mb-3">
            <Users className="w-8 h-8 sm:w-9 sm:h-9 text-white stroke-[2.2]" />
            <div className="w-full bg-[#7BA5F7] py-0.5 text-[9px] font-black tracking-widest text-white uppercase text-center">
              CAMS
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-snug max-w-lg">
            {currentAcademyName}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-md font-medium">
            Parent & Student Performance App • Live Gate Attendance • Exam Rankings • Fee Receipts
          </p>

          {/* Warm Parent & Child Learning SVG Illustration (Matching Uploaded Screenshot) */}
          <div className="w-full max-w-[300px] sm:max-w-[360px] my-3 sm:my-5 flex items-center justify-center">
            <svg viewBox="0 0 420 250" className="w-full h-auto drop-shadow-xl" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Soft Ground Shadow */}
              <ellipse cx="210" cy="228" rx="165" ry="14" fill="#003ECB" />

              {/* Decorative Sparkles / Academic Icons */}
              <circle cx="65" cy="55" r="6" fill="#60A5FA" opacity="0.6" />
              <circle cx="355" cy="45" r="8" fill="#FBBF24" opacity="0.8" />
              <circle cx="210" cy="28" r="5" fill="#93C5FD" opacity="0.7" />

              {/* LEFT FIGURE: STUDENT / CHILD */}
              {/* Crossed Legs */}
              <path d="M95 190 C75 195, 75 218, 115 220 L165 220 C180 218, 180 198, 155 192 Z" fill="#1E293B" />
              {/* Shoes */}
              <rect x="76" y="206" width="28" height="14" rx="7" fill="#FFFBEB" stroke="#1E293B" strokeWidth="2.5" />
              <rect x="155" y="206" width="28" height="14" rx="7" fill="#FFFBEB" stroke="#1E293B" strokeWidth="2.5" />
              {/* Long Dark Hair Back */}
              <path d="M105 70 C80 85, 72 135, 82 165 C95 170, 130 165, 140 150 Z" fill="#0F172A" />
              {/* Cream Sweater Body */}
              <path d="M96 122 C88 135, 88 180, 96 195 L162 195 C170 180, 168 135, 156 122 C142 114, 112 114, 96 122 Z" fill="#FEF3C7" stroke="#1E293B" strokeWidth="2.5" />
              {/* Head & Face */}
              <circle cx="130" cy="92" r="24" fill="#FDBA74" stroke="#1E293B" strokeWidth="2.5" />
              {/* Hair Bangs & Ponytail */}
              <path d="M106 88 C108 68, 148 65, 154 86 C145 78, 122 78, 106 88 Z" fill="#0F172A" />
              <circle cx="104" cy="74" r="7" fill="#FB923C" />
              {/* Eyes & Smile */}
              <circle cx="124" cy="93" r="2.2" fill="#0F172A" />
              <circle cx="139" cy="93" r="2.2" fill="#0F172A" />
              <circle cx="117" cy="99" r="3.5" fill="#F87171" opacity="0.5" />
              <circle cx="144" cy="99" r="3.5" fill="#F87171" opacity="0.5" />
              <path d="M127 101 Q132 106 137 101" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
              {/* Smartphone in Child's Hands */}
              <rect x="132" y="132" width="24" height="36" rx="5" transform="rotate(8 132 132)" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.5" />
              {/* Hands */}
              <circle cx="132" cy="154" r="6" fill="#FDBA74" stroke="#1E293B" strokeWidth="2" />
              <circle cx="152" cy="150" r="6" fill="#FDBA74" stroke="#1E293B" strokeWidth="2" />

              {/* RIGHT FIGURE: PARENT / GUARDIAN */}
              {/* Crossed Legs */}
              <path d="M225 186 C200 192, 202 218, 240 220 L330 220 C358 218, 358 192, 330 186 Z" fill="#334155" stroke="#0F172A" strokeWidth="2.5" />
              {/* White Sneakers */}
              <rect x="202" y="205" width="34" height="15" rx="7.5" fill="#FFFBEB" stroke="#1E293B" strokeWidth="2.5" />
              <rect x="322" y="205" width="34" height="15" rx="7.5" fill="#FFFBEB" stroke="#1E293B" strokeWidth="2.5" />
              {/* Warm Golden-Yellow Sweater Body */}
              <path d="M232 104 C216 118, 218 175, 228 192 L334 192 C345 175, 348 118, 330 104 C308 92, 256 92, 232 104 Z" fill="#FBBF24" stroke="#1E293B" strokeWidth="2.5" />
              {/* Head & Face */}
              <circle cx="276" cy="68" r="26" fill="#FDBA74" stroke="#1E293B" strokeWidth="2.5" />
              {/* Hair */}
              <path d="M250 64 C248 40, 298 36, 304 62 C295 50, 262 50, 250 64 Z" fill="#0F172A" />
              {/* Eyes & Warm Smile */}
              <circle cx="266" cy="70" r="2.3" fill="#0F172A" />
              <circle cx="283" cy="70" r="2.3" fill="#0F172A" />
              <path d="M268 80 Q275 85 282 80" stroke="#0F172A" strokeWidth="2.2" strokeLinecap="round" />
              {/* Tablet in Parent's Hands */}
              <rect x="236" y="126" width="58" height="42" rx="6" transform="rotate(-6 236 126)" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2" />
              {/* Hands */}
              <circle cx="236" cy="152" r="7" fill="#FDBA74" stroke="#1E293B" strokeWidth="2" />
              <circle cx="294" cy="146" r="7" fill="#FDBA74" stroke="#1E293B" strokeWidth="2" />
            </svg>
          </div>

          {/* Desktop Feature Pills */}
          <div className="hidden lg:grid grid-cols-3 gap-3 w-full max-w-lg pt-1">
            <div className="p-3 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-xs">
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <QrCode size={15} className="text-amber-300" />
                <span>RFID & QR Pass</span>
              </div>
              <p className="text-[11px] text-blue-100 mt-0.5">Live arrival timestamps</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-xs">
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <Award size={15} className="text-amber-300" />
                <span>Exam Rankings</span>
              </div>
              <p className="text-[11px] text-blue-100 mt-0.5">Marks, Grades & Ranks</p>
            </div>
            <div className="p-3 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-xs">
              <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                <CreditCard size={15} className="text-amber-300" />
                <span>Fee Receipts</span>
              </div>
              <p className="text-[11px] text-blue-100 mt-0.5">Instant digital invoices</p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT / BOTTOM WHITE CARD: MATCHES UPLOADED SCREENSHOT SHEET */}
        {/* ============================================================ */}
        <div className="w-full lg:w-5/12 max-w-md mx-auto mt-auto lg:my-auto">
          <div className="bg-white text-slate-900 rounded-t-[36px] sm:rounded-[36px] p-6 sm:p-8 shadow-2xl border border-blue-100 space-y-5">
            
            {/* Mode Switcher Pill Buttons (Clean White & Royal Blue Style) */}
            <div className="grid grid-cols-2 gap-2.5 p-1.5 rounded-full bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('parent');
                  setError(null);
                }}
                className={`py-2.5 px-4 rounded-full text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  loginMode === 'parent'
                    ? 'bg-[#0055FF] text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users size={15} />
                <span>Parent App</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMode('staff');
                  setError(null);
                }}
                className={`py-2.5 px-4 rounded-full text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                  loginMode === 'staff'
                    ? 'bg-[#0055FF] text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 size={15} />
                <span>Staff / PC Login</span>
              </button>
            </div>

            {/* Error Alert Box */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5">
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-left">
                  <p className="font-bold">Sign In Notice</p>
                  <p className="text-[11px] text-rose-600 mt-0.5">{error}</p>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* MODE 1: PARENT & GUARDIAN APP LOGIN */}
            {/* ============================================================ */}
            {loginMode === 'parent' && (
              <form onSubmit={handleParentSubmit} className="space-y-4 text-left">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Parent & Student App
                  </h2>
                  <p className="text-xs text-slate-500">
                    Enter your registered mobile number to view attendance, exam marks & fee receipts
                  </p>
                </div>

                {/* Phone Input in Clean White Pill Style */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider pl-1">
                    Parent / Guardian Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#0055FF] font-extrabold text-xs font-mono">
                      <Phone size={15} className="mr-1.5" />
                      <span>+94</span>
                    </div>
                    <input
                      type="tel"
                      required
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      placeholder="077 101 2001"
                      className="w-full pl-20 pr-4 py-3.5 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold font-mono placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0055FF] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Quick 1-Tap Demo Parent Accounts (Styled like the White Outline Buttons in Screenshot) */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                    Quick Demo Parent Accounts (1-Tap Login)
                  </span>
                  <div className="space-y-2">
                    {[
                      { phone: '077 101 2001', label: 'Continue as Kasun’s Parent (Grade 12)' },
                      { phone: '077 102 2002', label: 'Continue as Nimali’s Parent (Grade 12)' }
                    ].map((demo) => (
                      <button
                        key={demo.phone}
                        type="button"
                        onClick={() => {
                          setParentPhone(demo.phone);
                          handleParentSubmit(undefined, demo.phone);
                        }}
                        className="w-full py-3 px-4 rounded-full bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-[#0055FF]/40 text-slate-800 text-xs font-bold transition-all flex items-center justify-center space-x-2.5 shadow-2xs cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#0055FF] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          P
                        </span>
                        <span className="truncate">{demo.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Primary Royal Blue Pill Submit Button (Matches "Create Account" Button in Screenshot) */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-full bg-[#0055FF] hover:bg-[#0044CC] text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Opening Parent App...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone size={17} />
                      <span>Open Parent & Student App</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <p className="text-xs text-slate-500">
                    Are you an Academy Teacher or Admin?{' '}
                    <button
                      type="button"
                      onClick={() => setLoginMode('staff')}
                      className="text-[#0055FF] font-extrabold hover:underline cursor-pointer"
                    >
                      Staff Log in
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* ============================================================ */}
            {/* MODE 2: STAFF / FACULTY / PC TERMINAL LOGIN */}
            {/* ============================================================ */}
            {loginMode === 'staff' && (
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div className="text-center space-y-1">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    Staff & Faculty Sign In
                  </h2>
                  <p className="text-xs text-slate-500">
                    Select a role below or enter your staff credentials
                  </p>
                </div>

                {/* 1-Click Role Selector Pills */}
                <div className="grid grid-cols-2 gap-2">
                  {quickProfiles.map((p) => {
                    const Icon = p.icon;
                    const isSelected = activePreset === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectPreset(p)}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex items-center space-x-2.5 cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/90 border-[#0055FF] ring-2 ring-[#0055FF]/20'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${p.iconBg}`}>
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-500 truncate">{p.badge}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 pl-1">
                      Staff Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <UserIcon size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin"
                        className="w-full pl-11 pr-4 py-3 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#0055FF] focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1 pl-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-11 pr-11 py-3 rounded-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0055FF] focus:bg-white transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs px-1">
                  <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-[#0055FF] focus:ring-[#0055FF]"
                    />
                    <span className="text-xs font-medium">Keep signed in</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Pass: password123</span>
                </div>

                {/* Primary Royal Blue Pill Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 rounded-full bg-[#0055FF] hover:bg-[#0044CC] text-white font-extrabold text-sm shadow-lg shadow-blue-600/30 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <p className="text-xs text-slate-500">
                    Looking for Student Attendance & Marks?{' '}
                    <button
                      type="button"
                      onClick={() => setLoginMode('parent')}
                      className="text-[#0055FF] font-extrabold hover:underline cursor-pointer"
                    >
                      Open Parent App
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* Bottom Policy Links (Matches Screenshot Footer Text) */}
            <div className="pt-3 border-t border-slate-100 text-center text-[11px] text-slate-400 leading-relaxed">
              Protected by <span className="text-[#0055FF] font-semibold">256-Bit SSL Security</span> &amp;{' '}
              <span className="text-[#0055FF] font-semibold">1-Time Permanent Parent Login</span>.
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
