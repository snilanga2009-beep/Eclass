import React from 'react';
import { 
  ShieldCheck, 
  X, 
  Check, 
  Crown, 
  Briefcase, 
  Calculator, 
  Store, 
  GraduationCap, 
  HeartHandshake, 
  User,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { UserRole } from '../types';

interface RolePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole?: UserRole;
}

interface RoleDefinition {
  role: UserRole;
  title: string;
  badge: string;
  themeColor: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
  description: string;
  icon: any;
  grantedFeatures: string[];
  restrictedFeatures: string[];
}

export const RolePermissionsModal: React.FC<RolePermissionsModalProps> = ({
  isOpen,
  onClose,
  currentRole
}) => {
  if (!isOpen) return null;

  const roleDefinitions: RoleDefinition[] = [
    {
      role: 'SUPER_ADMIN',
      title: 'Super Administrator',
      badge: 'Master Authority',
      themeColor: 'bg-purple-600',
      bgLight: 'bg-purple-50/70',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      description: 'System owner with unrestricted fullstack control, database administration, and security logs.',
      icon: Crown,
      grantedFeatures: [
        'Complete system configuration & settings',
        'Database reset, data seeding & live backups',
        'Audit trail inspection & staff activity logs',
        'Staff user account creation & role assignment',
        'Full accounting, P&L, and commission management',
        'All academic, student, and cashier workflows'
      ],
      restrictedFeatures: []
    },
    {
      role: 'ADMIN',
      title: 'Academy Principal / Branch Admin',
      badge: 'Academic Lead',
      themeColor: 'bg-indigo-600',
      bgLight: 'bg-indigo-50/70',
      borderColor: 'border-indigo-200',
      textColor: 'text-indigo-700',
      description: 'Daily operational leader overseeing teachers, classes, student admissions, and branch performance.',
      icon: Briefcase,
      grantedFeatures: [
        'Class timetabling, subject assignment, and hall allocation',
        'Teacher profiles and commission percentage setting (e.g. 70%)',
        'Student admissions, batch allocation, and profile editing',
        'Daily & monthly revenue collection reports & analytics',
        'SMS & WhatsApp mass broadcast gateway'
      ],
      restrictedFeatures: [
        'System database reset and raw config wipes'
      ]
    },
    {
      role: 'ACCOUNTANT',
      title: 'Chief Accountant & Auditor',
      badge: 'Finance Lead',
      themeColor: 'bg-cyan-600',
      bgLight: 'bg-cyan-50/70',
      borderColor: 'border-cyan-200',
      textColor: 'text-cyan-700',
      description: 'Manages academy cash drawers, expense journals, teacher commission payouts, and fee reconciliations.',
      icon: Calculator,
      grantedFeatures: [
        'Daily Collection & Cash Drawer Handover audit',
        'Teacher commission calculations & bank transfer slips',
        'Pending fee defaulters list & payment reminders',
        'Operational expenses tracking (rent, bills, printing)',
        'Full P&L and monthly balance sheet view'
      ],
      restrictedFeatures: [
        'Class curriculum & exam scheduling',
        'System user management & DB resets'
      ]
    },
    {
      role: 'RECEPTIONIST',
      title: 'Front Office Receptionist & Cashier',
      badge: 'Front Office Counter',
      themeColor: 'bg-teal-600',
      bgLight: 'bg-teal-50/70',
      borderColor: 'border-teal-200',
      textColor: 'text-teal-700',
      description: 'Desk cashier managing counter fee collections, student enrollments, 125kHz RFID cards, and gate attendance.',
      icon: Store,
      grantedFeatures: [
        'Student intake, registration, and photo profile setup',
        'Fast fee collection & instant 80mm thermal receipt printing',
        'Physical currency note denomination count & drawer handover',
        'Gate QR Code & 125kHz RFID card scanner check-in',
        'Print QR Student Smart ID Pass cards',
        'SMS Guardian Portal invite link delivery'
      ],
      restrictedFeatures: [
        'Teacher salary payouts & financial P&L editing',
        'Deleting historical records or audit trail logs'
      ]
    },
    {
      role: 'TEACHER',
      title: 'Academic Lecturer / Teacher',
      badge: 'Faculty',
      themeColor: 'bg-amber-600',
      bgLight: 'bg-amber-50/70',
      borderColor: 'border-amber-200',
      textColor: 'text-amber-700',
      description: 'Conducts classes, monitors student attendance records, grades tests, and inspects personal commission.',
      icon: GraduationCap,
      grantedFeatures: [
        'View enrolled students roster for assigned tuition classes',
        'Mark daily live attendance and view arrival logs',
        'Create assessments, record test marks, and grade progress',
        'Upload PDF lesson notes and revision tutorial materials',
        'Check personal monthly commission earnings calculation'
      ],
      restrictedFeatures: [
        'Collecting tuition fee payments or modifying fee structures',
        'Viewing academy-wide net profits or other teachers’ payouts'
      ]
    },
    {
      role: 'PARENT',
      title: 'Parent & Legal Guardian',
      badge: 'Guardian Portal',
      themeColor: 'bg-emerald-600',
      bgLight: 'bg-emerald-50/70',
      borderColor: 'border-emerald-200',
      textColor: 'text-emerald-700',
      description: 'Mobile PWA portal to monitor children’s live attendance timestamps, fee receipts, and study files.',
      icon: HeartHandshake,
      grantedFeatures: [
        'Live gate RFID & QR arrival/departure timestamps',
        'Attendance rate stats & monthly class calendar logs',
        'Tuition fee status & 1-click downloadable official receipts',
        'Child Digital Smart ID Pass backup on phone',
        'Download class lesson notes & exam tutorial sheets',
        '1-Time permanent login on Android & iPhone home screen'
      ],
      restrictedFeatures: [
        'Internal academy management, other students’ data, or finances'
      ]
    },
    {
      role: 'STUDENT',
      title: 'Academy Student',
      badge: 'Student Pass',
      themeColor: 'bg-sky-600',
      bgLight: 'bg-sky-50/70',
      borderColor: 'border-sky-200',
      textColor: 'text-sky-700',
      description: 'Dedicated student portal with digital ID pass for scanning, schedule, and course materials.',
      icon: User,
      grantedFeatures: [
        'Encrypted Digital QR Smart ID Pass for entrance scanning',
        'Personal timetable, upcoming classes, and room numbers',
        'Download teacher lecture notes, past papers, and slides',
        'View fee payment receipts and balance status',
        'Check personal attendance percentages per subject'
      ],
      restrictedFeatures: [
        'All administrative, financial, and cashier operations'
      ]
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  User Roles & Granted Privileges Matrix
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                  RBAC Security
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Official role delegation chart: exactly what access and features are given to each user role.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-400 hover:text-slate-800 transition-colors shadow-sm"
          >
            <X size={18} />
          </button>
        </div>

        {/* Roles Cards Container */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 touch-scroll-x">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roleDefinitions.map(def => {
              const Icon = def.icon;
              const isCurrent = currentRole === def.role;
              return (
                <div 
                  key={def.role}
                  className={`p-5 rounded-3xl border transition-all ${
                    isCurrent 
                      ? 'ring-2 ring-indigo-500 bg-indigo-50/30 border-indigo-300 shadow-md' 
                      : `${def.bgLight} ${def.borderColor}`
                  }`}
                >
                  {/* Header of Card */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200/80">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-2xl ${def.themeColor} text-white flex items-center justify-center shadow-sm`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{def.title}</h4>
                          {isCurrent && (
                            <span className="px-2 py-0.2 rounded-full bg-indigo-600 text-white text-[9px] font-bold">
                              YOUR ROLE
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${def.textColor}`}>
                          {def.role}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-full bg-white/90 border border-slate-200 text-[10px] font-bold text-slate-700 shadow-sm shrink-0">
                      {def.badge}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 my-3 leading-relaxed">
                    {def.description}
                  </p>

                  {/* Granted Features */}
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-emerald-600" />
                      <span>What Is Given To This Role:</span>
                    </p>
                    <ul className="space-y-1">
                      {def.grantedFeatures.map((feat, idx) => (
                        <li key={idx} className="text-xs text-slate-800 flex items-start space-x-2">
                          <span className="text-emerald-600 font-bold leading-none mt-0.5">•</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Restricted Features if any */}
                  {def.restrictedFeatures.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-200/60 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Lock size={11} className="text-slate-400" />
                        <span>Restricted / Not Accessible:</span>
                      </p>
                      <ul className="space-y-0.5">
                        {def.restrictedFeatures.map((rf, idx) => (
                          <li key={idx} className="text-[11px] text-slate-500 flex items-start space-x-2">
                            <span className="text-slate-400">•</span>
                            <span>{rf}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
          <p className="text-xs text-slate-500">
            Current Session Role: <strong className="text-slate-900">{currentRole}</strong>
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-md hover:bg-slate-800 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
