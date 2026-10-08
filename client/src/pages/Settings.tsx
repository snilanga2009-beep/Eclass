import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Building, 
  DollarSign, 
  MessageSquare, 
  Database, 
  Check, 
  Download,
  ShieldCheck,
  Radio,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RotateCcw,
  Smartphone,
  Copy,
  Info,
  FileText,
  RefreshCw,
  CreditCard,
  QrCode,
  MessageCircle,
  Upload,
  AlertTriangle,
  ShieldAlert,
  X
} from 'lucide-react';
import { apiRequest, clearAppCache } from '../api';
import { useSettings, DEFAULT_SMS_TEMPLATES } from '../context/SettingsContext';

export const Settings: React.FC = () => {
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [toggleNotice, setToggleNotice] = useState<{ key: string; message: string } | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [testingTextLk, setTestingTextLk] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheNotice, setCacheNotice] = useState<string | null>(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('SMS_TEMPLATE_WELCOME');

  // Database Restore State
  const restoreFileInputRef = React.useRef<HTMLInputElement>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreParsedData, setRestoreParsedData] = useState<any>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState<any>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');

  const handleClearServerCache = async () => {
    setClearingCache(true);
    setCacheNotice(null);
    try {
      const res = await clearAppCache();
      setCacheNotice(res.message);
      setTimeout(() => setCacheNotice(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to clear cache');
    } finally {
      setClearingCache(false);
    }
  };

  useEffect(() => {
    apiRequest('/settings')
      .then(res => {
        const data = res || {};
        if (!data.SMS_PROVIDER) data.SMS_PROVIDER = 'text.lk';
        if (!data.TEXTLK_SENDER_ID) data.TEXTLK_SENDER_ID = 'ApexEdu';
        if (!data.TEXTLK_API_TOKEN) data.TEXTLK_API_TOKEN = 'textlk_live_sec_89218201928301';
        if (!data.TEXTLK_ENDPOINT) data.TEXTLK_ENDPOINT = 'https://app.text.lk/api/v3/sms/send';
        
        // Fill default SMS templates if not already stored
        Object.entries(DEFAULT_SMS_TEMPLATES).forEach(([k, v]) => {
          if (!data[k]) data[k] = v;
        });

        setSettings(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  // Instant toggle persistence to backend
  const handleToggle = async (key: string, nextValue: string, label: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: nextValue }));
    setTogglingKey(key);
    try {
      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify({ [key]: nextValue })
      });
      await refreshSettings();
      setToggleNotice({
        key,
        message: `${label}: Successfully switched to ${nextValue === 'true' ? 'ENABLED (ON)' : 'DISABLED (OFF)'}`
      });
      setTimeout(() => setToggleNotice(null), 4000);
    } catch (err: any) {
      // Revert if error
      setSettings((prev: any) => ({ ...prev, [key]: nextValue === 'true' ? 'false' : 'true' }));
      alert(err.message || 'Failed to update setting');
    } finally {
      setTogglingKey(null);
    }
  };

  const handleSaveAll = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveError(null);
    try {
      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      await refreshSettings();
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestTextLk = async () => {
    setTestingTextLk(true);
    setTestResult(null);
    try {
      const res = await apiRequest('/messaging/test-textlk', {
        method: 'POST',
        body: JSON.stringify({
          apiToken: settings.TEXTLK_API_TOKEN,
          senderId: settings.TEXTLK_SENDER_ID
        })
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Failed to connect to text.lk' });
    } finally {
      setTestingTextLk(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const data = await apiRequest('/settings/backup');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CAMS_Database_Backup_${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
    } catch (err) {
      alert('Failed to generate backup');
    }
  };

  const handleOpenRestorePicker = () => {
    setRestoreError(null);
    setRestoreSuccess(null);
    setRestoreConfirmText('');
    restoreFileInputRef.current?.click();
  };

  const handleRestoreFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    setRestoreError(null);
    setRestoreSuccess(null);
    setRestoreConfirmText('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || typeof parsed !== 'object') {
          throw new Error('File does not contain valid JSON data.');
        }

        if (!Array.isArray(parsed.students) && !Array.isArray(parsed.users)) {
          throw new Error('This JSON file does not appear to be a valid CAMS database backup. Missing student and user records.');
        }

        setRestoreParsedData(parsed);
        setRestoreModalOpen(true);
      } catch (err: any) {
        alert(err.message || 'Failed to read or parse JSON backup file.');
      }
    };
    reader.onerror = () => {
      alert('Failed to read the selected file.');
    };
    reader.readAsText(file);

    // Reset input so user can pick the same file again if needed
    if (e.target) e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (restoreConfirmText.trim().toUpperCase() !== 'RESTORE') {
      setRestoreError('Please type "RESTORE" exactly to confirm.');
      return;
    }

    if (!restoreParsedData) return;

    setRestoring(true);
    setRestoreError(null);

    try {
      const res = await apiRequest('/settings/restore', {
        method: 'POST',
        body: restoreParsedData
      });

      setRestoreSuccess(res.summary || res);
      await refreshSettings();
    } catch (err: any) {
      setRestoreError(err.message || 'Failed to restore database from backup file.');
    } finally {
      setRestoring(false);
    }
  };

  const TEMPLATE_CONFIGS = [
    {
      key: 'SMS_TEMPLATE_WELCOME',
      tabLabel: 'Parent Portal Link',
      badge: 'Registration',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      title: 'Student Registration & Parent Portal SMS',
      desc: 'Dispatched to parent mobile when a student is enrolled or parent portal link is resent.',
      placeholders: [
        { tag: '{institute_name}', label: 'Institute Name' },
        { tag: '{student_name}', label: 'Student Name' },
        { tag: '{student_id}', label: 'Student ID' },
        { tag: '{portal_url}', label: 'Parent Portal URL' }
      ],
      sampleData: {
        '{student_name}': 'Kavindu Perera',
        '{student_id}': 'STU-2026-1042',
        '{portal_url}': 'https://cams.edu/parent/pass/STU-1042'
      }
    },
    {
      key: 'SMS_TEMPLATE_PAYMENT',
      tabLabel: 'Fee Payment Receipt',
      badge: 'Receipt SMS',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'Class Fee Payment Confirmation Receipt SMS',
      desc: 'Sent immediately to the parent phone upon recording a fee payment at the counter.',
      placeholders: [
        { tag: '{institute_name}', label: 'Institute Name' },
        { tag: '{student_name}', label: 'Student Name' },
        { tag: '{student_id}', label: 'Student ID' },
        { tag: '{amount}', label: 'Amount Paid' },
        { tag: '{receipt_no}', label: 'Receipt No' },
        { tag: '{balance}', label: 'Balance Due' }
      ],
      sampleData: {
        '{student_name}': 'Kavindu Perera',
        '{student_id}': 'STU-2026-1042',
        '{amount}': '3,500',
        '{receipt_no}': 'REC-2026-0042',
        '{balance}': '0'
      }
    },
    {
      key: 'SMS_TEMPLATE_ATTENDANCE',
      tabLabel: 'Attendance Alert',
      badge: 'Check-in',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      title: 'Entrance Attendance Check-in SMS Alert',
      desc: 'Configurable SMS dispatched when student card/barcode is scanned at entrance.',
      placeholders: [
        { tag: '{institute_name}', label: 'Institute Name' },
        { tag: '{student_name}', label: 'Student Name' },
        { tag: '{class_name}', label: 'Class Name' },
        { tag: '{status}', label: 'Status' },
        { tag: '{time}', label: 'Time' },
        { tag: '{date}', label: 'Date' }
      ],
      sampleData: {
        '{student_name}': 'Kavindu Perera',
        '{class_name}': '2026 Combined Maths',
        '{status}': 'PRESENT',
        '{time}': '08:15 AM',
        '{date}': new Date().toISOString().substring(0, 10)
      }
    },
    {
      key: 'SMS_TEMPLATE_REMINDER',
      tabLabel: 'Monthly Fee Reminder',
      badge: 'Billing',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
      title: 'Pending Tuition Fee Reminder SMS',
      desc: 'Sent via Messaging Center to parents of students with pending monthly balances.',
      placeholders: [
        { tag: '{institute_name}', label: 'Institute Name' },
        { tag: '{student_name}', label: 'Student Name' },
        { tag: '{class_name}', label: 'Class Name' },
        { tag: '{month}', label: 'Month' },
        { tag: '{balance}', label: 'Balance Due' }
      ],
      sampleData: {
        '{student_name}': 'Kavindu Perera',
        '{class_name}': '2026 Combined Maths',
        '{month}': 'October',
        '{balance}': '3,500'
      }
    },
    {
      key: 'SMS_TEMPLATE_CANCEL',
      tabLabel: 'Class Postponed',
      badge: 'Schedule',
      badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
      title: 'Class Reschedule or Postponement Notice SMS',
      desc: 'Used when rescheduling, postponing, or cancelling a class session.',
      placeholders: [
        { tag: '{institute_name}', label: 'Institute Name' },
        { tag: '{class_name}', label: 'Class Name' },
        { tag: '{date}', label: 'Date' },
        { tag: '{time}', label: 'Time' }
      ],
      sampleData: {
        '{class_name}': '2026 Combined Maths',
        '{date}': '2026-10-05',
        '{time}': '08:00 AM'
      }
    },
    {
      key: 'SMS_TEMPLATE_ANNOUNCE',
      tabLabel: 'General Circular',
      badge: 'Broadcast',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      title: 'General Academy Circular / Announcement SMS',
      desc: 'Default template for broadcasting general circulars to parent mobile numbers.',
      placeholders: [
        { tag: '{institute_name}', label: 'Institute Name' },
        { tag: '{message}', label: 'Message Body' }
      ],
      sampleData: {
        '{message}': "Tomorrow's revision class starts at 8:30 AM in Hall A."
      }
    },
    {
      key: 'WHATSAPP_TEMPLATE_ATTENDANCE',
      tabLabel: 'WhatsApp Attendance',
      badge: 'WhatsApp',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      title: 'WhatsApp Parent Attendance Confirmation Template',
      desc: 'Message formatted with WhatsApp bolding (*) sent to parent when QR is scanned.',
      placeholders: [
        { tag: '{institute_name}', label: 'Institute Name' },
        { tag: '{student_name}', label: 'Student Name' },
        { tag: '{student_id}', label: 'Student ID' },
        { tag: '{class_name}', label: 'Class Name' },
        { tag: '{time}', label: 'Check-in Time' },
        { tag: '{date}', label: 'Date' },
        { tag: '{fee_status}', label: 'Fee Status' }
      ],
      sampleData: {
        '{student_name}': 'Kavindu Perera',
        '{student_id}': 'STU-2026-1042',
        '{class_name}': '2026 Combined Maths',
        '{time}': '08:15 AM',
        '{date}': new Date().toISOString().substring(0, 10),
        '{fee_status}': '✅ Tuition Fee: Fully Settled'
      }
    }
  ];

  const currentTemplate = TEMPLATE_CONFIGS.find(t => t.key === selectedTemplateKey) || TEMPLATE_CONFIGS[0];

  const handleInsertPlaceholder = (placeholder: string) => {
    const currentVal = settings[selectedTemplateKey] !== undefined ? settings[selectedTemplateKey] : ((DEFAULT_SMS_TEMPLATES as any)[selectedTemplateKey] || '');
    const newVal = currentVal + ' ' + placeholder;
    handleChange(selectedTemplateKey, newVal);
  };

  const handleResetTemplate = (key: string) => {
    const defaultText = (DEFAULT_SMS_TEMPLATES as any)[key] || '';
    handleChange(key, defaultText);
  };

  const getLivePreview = (config: typeof currentTemplate) => {
    let text = settings[config.key] !== undefined ? settings[config.key] : ((DEFAULT_SMS_TEMPLATES as any)[config.key] || '');
    const instName = settings.INSTITUTE_NAME || 'Cambridge Academy';
    text = text.replace(/{institute_name}/g, instName);
    Object.entries(config.sampleData).forEach(([placeholder, sampleVal]) => {
      text = text.split(placeholder).join(sampleVal);
    });
    return text;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">System Settings &amp; Configuration</h1>
          <p className="text-xs text-slate-500 mt-0.5">Configure institute branding, receipt currency, text.lk SMS gateway integration, and system backups</p>
        </div>

        <button
          type="button"
          onClick={() => handleSaveAll()}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all flex items-center gap-2 self-start sm:self-auto disabled:opacity-50"
        >
          {saving ? <RefreshCw size={15} className="animate-spin" /> : <Check size={15} />}
          <span>{saving ? 'Saving Changes...' : 'Save All Changes'}</span>
        </button>
      </div>

      {saved && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span className="font-semibold">All settings and templates have been saved successfully to the database.</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle size={16} className="text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {toggleNotice && (
        <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center justify-between gap-2 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-bold">{toggleNotice.message}</span>
          </div>
          <span className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider">Saved to Disk</span>
        </div>
      )}

      <form onSubmit={handleSaveAll} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Institute Branding */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Building size={16} className="text-brand-600" />
            <span>Institute Profile & Branding</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Institute Name</label>
              <input
                type="text"
                value={settings.INSTITUTE_NAME || ''}
                onChange={(e) => handleChange('INSTITUTE_NAME', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tagline</label>
              <input
                type="text"
                value={settings.INSTITUTE_TAGLINE || ''}
                onChange={(e) => handleChange('INSTITUTE_TAGLINE', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Campus Address</label>
              <input
                type="text"
                value={settings.ADDRESS || ''}
                onChange={(e) => handleChange('ADDRESS', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Official Telephone</label>
                <input
                  type="text"
                  value={settings.PHONE || ''}
                  onChange={(e) => handleChange('PHONE', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Official Email</label>
                <input
                  type="email"
                  value={settings.EMAIL || ''}
                  onChange={(e) => handleChange('EMAIL', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Currency & Financial Settings */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-600" />
            <span>Currency & Financial Format</span>
          </h3>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Currency Code</label>
                <input
                  type="text"
                  value={settings.CURRENCY_CODE || 'LKR'}
                  onChange={(e) => handleChange('CURRENCY_CODE', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={settings.CURRENCY_SYMBOL || 'Rs. '}
                  onChange={(e) => handleChange('CURRENCY_SYMBOL', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Academic Year</label>
              <input
                type="text"
                value={settings.ACADEMIC_YEAR || '2026/2027'}
                onChange={(e) => handleChange('ACADEMIC_YEAR', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Standard Student Admission &amp; Registration Fee ({settings.CURRENCY_CODE || 'LKR'})
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={settings.DEFAULT_REGISTRATION_FEE || '1500'}
                  onChange={(e) => handleChange('DEFAULT_REGISTRATION_FEE', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  placeholder="e.g. 1500"
                />
                <div className="flex items-center gap-1 shrink-0">
                  {['1000', '1500', '2000', '0'].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleChange('DEFAULT_REGISTRATION_FEE', amt)}
                      className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-[10px] font-bold text-slate-600 transition-colors"
                    >
                      {amt === '0' ? 'Free' : `Rs.${amt}`}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Pre-filled default registration fee when enrolling new students.</p>
            </div>
          </div>
        </div>

        {/* MASTER NOTIFICATION CONTROLS: SMS ON/OFF & WHATSAPP TOGGLE */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-900/60 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white tracking-wide">
                    Master Notification Controls (SMS &amp; WhatsApp)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Control system-wide SMS dispatch on/off, entrance QR scan alerts, and parent WhatsApp messaging.
                  </p>
                </div>
              </div>
            </div>

            {/* Master SMS ON/OFF Switch */}
            <div className="flex items-center space-x-3 bg-white/10 p-2 sm:p-2.5 rounded-2xl border border-white/15 shrink-0 self-start sm:self-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                System SMS:
              </span>
              <button
                type="button"
                onClick={() => handleToggle('SMS_ENABLED', settings.SMS_ENABLED === 'false' ? 'true' : 'false', 'Master System SMS')}
                disabled={togglingKey === 'SMS_ENABLED'}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                  settings.SMS_ENABLED !== 'false'
                    ? 'bg-emerald-500 text-white ring-2 ring-emerald-300 shadow-emerald-500/30'
                    : 'bg-rose-500 text-white ring-2 ring-rose-300 shadow-rose-500/30'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${settings.SMS_ENABLED !== 'false' ? 'bg-white animate-pulse' : 'bg-white/80'}`}></span>
                <span>
                  {togglingKey === 'SMS_ENABLED' 
                    ? 'SAVING...' 
                    : settings.SMS_ENABLED !== 'false' 
                      ? 'SMS ENABLED (ON)' 
                      : 'SMS DISABLED (OFF)'}
                </span>
              </button>
            </div>
          </div>

          {/* Granular notification triggers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Tuition Fee Receipts SMS */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={14} className="text-emerald-400" />
                  <span>Fee Payment SMS</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('SMS_PAYMENTS_ENABLED', settings.SMS_PAYMENTS_ENABLED === 'false' ? 'true' : 'false', 'Fee Payment SMS')}
                  disabled={togglingKey === 'SMS_PAYMENTS_ENABLED'}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 ${
                    settings.SMS_PAYMENTS_ENABLED !== 'false'
                      ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {togglingKey === 'SMS_PAYMENTS_ENABLED' ? '...' : (settings.SMS_PAYMENTS_ENABLED !== 'false' ? 'ON' : 'OFF')}
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Send official SMS receipt to parent immediately upon fee collection.
              </p>
            </div>

            {/* 2. QR Attendance Scan SMS */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <QrCode size={14} className="text-purple-400" />
                  <span>QR Scan SMS</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('SMS_ATTENDANCE_ENABLED', settings.SMS_ATTENDANCE_ENABLED === 'true' ? 'false' : 'true', 'QR Attendance SMS')}
                  disabled={togglingKey === 'SMS_ATTENDANCE_ENABLED'}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 ${
                    settings.SMS_ATTENDANCE_ENABLED === 'true'
                      ? 'bg-purple-500 text-white shadow-sm ring-1 ring-purple-400'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {togglingKey === 'SMS_ATTENDANCE_ENABLED' ? '...' : (settings.SMS_ATTENDANCE_ENABLED === 'true' ? 'ON' : 'OFF')}
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Send entrance check-in SMS alert when student QR/barcode is scanned.
              </p>
            </div>

            {/* 3. Student Registration Welcome SMS */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone size={14} className="text-teal-400" />
                  <span>Registration SMS</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('SMS_WELCOME_ENABLED', settings.SMS_WELCOME_ENABLED === 'false' ? 'true' : 'false', 'Registration Welcome SMS')}
                  disabled={togglingKey === 'SMS_WELCOME_ENABLED'}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 ${
                    settings.SMS_WELCOME_ENABLED !== 'false'
                      ? 'bg-teal-500 text-white shadow-sm ring-1 ring-teal-400'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {togglingKey === 'SMS_WELCOME_ENABLED' ? '...' : (settings.SMS_WELCOME_ENABLED !== 'false' ? 'ON' : 'OFF')}
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Send welcome SMS with Parent Portal PWA link to newly registered students.
              </p>
            </div>

            {/* 4. WhatsApp Attendance Alert on QR Scan */}
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-emerald-400" />
                  <span>WhatsApp on QR Scan</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('WHATSAPP_ATTENDANCE_ENABLED', settings.WHATSAPP_ATTENDANCE_ENABLED === 'false' ? 'true' : 'false', 'WhatsApp Attendance Alert')}
                  disabled={togglingKey === 'WHATSAPP_ATTENDANCE_ENABLED'}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-50 ${
                    settings.WHATSAPP_ATTENDANCE_ENABLED !== 'false'
                      ? 'bg-emerald-500 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-white/10 text-slate-300 hover:bg-white/20'
                  }`}
                >
                  {togglingKey === 'WHATSAPP_ATTENDANCE_ENABLED' ? '...' : (settings.WHATSAPP_ATTENDANCE_ENABLED !== 'false' ? 'ON' : 'OFF')}
                </button>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Enable WhatsApp parent attendance confirmation card &amp; 1-click delivery on scan.
              </p>
            </div>
          </div>
        </div>

        {/* SMS PROVIDER CONFIGURATION (With text.lk integration) */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <MessageSquare size={16} className="text-purple-600" />
              <span>SMS Gateway Configuration</span>
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              🇱🇰 Sri Lanka SMS Active
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select SMS Provider</label>
              <select
                value={settings.SMS_PROVIDER || 'text.lk'}
                onChange={(e) => handleChange('SMS_PROVIDER', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-900"
              >
                <option value="text.lk">text.lk (Sri Lanka SMS Gateway)</option>
                <option value="Dialog Enterprise">Dialog Enterprise SMS Gateway</option>
                <option value="Textware">Textware Sri Lanka</option>
                <option value="Mobitel mCash">Mobitel SMS Gateway</option>
                <option value="Custom">Custom HTTP Gateway</option>
              </select>
            </div>

            {/* Dedicated text.lk parameters */}
            <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
                  <span>📱 text.lk API Credentials</span>
                </span>
                <span className="text-[10px] text-purple-700 font-mono">v3 REST API</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">text.lk API Bearer Token</label>
                <input
                  type="password"
                  placeholder="e.g. textlk_live_sec_..."
                  value={settings.TEXTLK_API_TOKEN || ''}
                  onChange={(e) => handleChange('TEXTLK_API_TOKEN', e.target.value)}
                  className="w-full px-3.5 py-1.5 rounded-xl border border-purple-200 text-xs font-mono bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Sender ID / Mask</label>
                  <input
                    type="text"
                    placeholder="e.g. ApexEdu"
                    value={settings.TEXTLK_SENDER_ID || 'ApexEdu'}
                    onChange={(e) => handleChange('TEXTLK_SENDER_ID', e.target.value)}
                    className="w-full px-3.5 py-1.5 rounded-xl border border-purple-200 text-xs font-mono font-bold bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">API Endpoint</label>
                  <input
                    type="text"
                    value={settings.TEXTLK_ENDPOINT || 'https://app.text.lk/api/v3/sms/send'}
                    onChange={(e) => handleChange('TEXTLK_ENDPOINT', e.target.value)}
                    className="w-full px-3.5 py-1.5 rounded-xl border border-purple-200 text-xs font-mono bg-white text-slate-500 text-[10px]"
                  />
                </div>
              </div>

              {/* Test Connection Button */}
              <div className="pt-1 flex items-center justify-between">
                <p className="text-[10px] text-slate-500">Supports Dialog, Mobitel, Airtel & Hutch</p>
                <button
                  type="button"
                  onClick={handleTestTextLk}
                  disabled={testingTextLk}
                  className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] transition-all flex items-center gap-1 shadow-sm"
                >
                  <Radio size={12} />
                  <span>{testingTextLk ? 'Testing...' : 'Test text.lk Connection'}</span>
                </button>
              </div>

              {testResult && (
                <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                  testResult.success ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}>
                  {testResult.success ? <CheckCircle2 size={16} className="text-emerald-700 shrink-0" /> : <AlertCircle size={16} className="text-rose-700 shrink-0" />}
                  <span className="text-[11px] font-medium">{testResult.message}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Meta WhatsApp Cloud Phone Number ID</label>
              <input
                type="text"
                value={settings.WHATSAPP_PHONE_NUMBER_ID || ''}
                onChange={(e) => handleChange('WHATSAPP_PHONE_NUMBER_ID', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Custom SMS Notification Templates & Wording */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-sm">
                  <MessageSquare size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 tracking-tight">Custom SMS Notification Templates & Wording</h3>
                  <p className="text-xs text-slate-500">Customize the exact message text and dynamic placeholders dispatched via SMS to parents and students</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-semibold border border-indigo-200">
                <Sparkles size={12} />
                <span>Dynamic Tags Enabled</span>
              </span>
            </div>
          </div>

          {/* Template Selector Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-100 scrollbar-none">
            {TEMPLATE_CONFIGS.map(t => {
              const isActive = selectedTemplateKey === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setSelectedTemplateKey(t.key)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                  }`}
                >
                  <span>{t.tabLabel}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    isActive ? 'bg-white/20 text-white' : t.badgeColor
                  }`}>
                    {t.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Template Editor & Live Phone Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Editor Side */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{currentTemplate.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{currentTemplate.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleResetTemplate(currentTemplate.key)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-medium flex items-center gap-1.5 shrink-0 transition-colors"
                  title="Reset to default system message"
                >
                  <RotateCcw size={12} />
                  <span>Reset Default</span>
                </button>
              </div>

              {/* Placeholder Helper Badges */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                  <span className="flex items-center gap-1">
                    <Info size={13} className="text-brand-600" />
                    <span>Click any tag below to insert into message wording:</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {currentTemplate.placeholders.map(p => (
                    <button
                      key={p.tag}
                      type="button"
                      onClick={() => handleInsertPlaceholder(p.tag)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-brand-400 hover:bg-brand-50 text-slate-700 hover:text-brand-700 text-[11px] font-mono transition-all flex items-center gap-1 group shadow-2xs"
                      title={`Insert ${p.label}`}
                    >
                      <span className="font-semibold text-brand-600 group-hover:scale-110 transition-transform">+</span>
                      <span>{p.tag}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SMS Message Text</label>
                  {(() => {
                    const val = settings[currentTemplate.key] !== undefined ? settings[currentTemplate.key] : ((DEFAULT_SMS_TEMPLATES as any)[currentTemplate.key] || '');
                    const len = val.length;
                    const segments = Math.ceil(len / 160) || 1;
                    return (
                      <span className={`text-[10px] font-mono font-medium ${len > 160 ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>
                        {len} chars • {segments} SMS {segments > 1 ? 'parts' : 'part'} (160 char/part)
                      </span>
                    );
                  })()}
                </div>
                <textarea
                  rows={4}
                  value={settings[currentTemplate.key] !== undefined ? settings[currentTemplate.key] : ((DEFAULT_SMS_TEMPLATES as any)[currentTemplate.key] || '')}
                  onChange={(e) => handleChange(currentTemplate.key, e.target.value)}
                  placeholder="Enter custom SMS template wording..."
                  className="w-full p-3.5 rounded-2xl border border-slate-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-xs text-slate-800 leading-relaxed font-sans transition-all resize-y"
                />
              </div>
            </div>

            {/* Live Phone Preview Mockup Side */}
            <div className="lg:col-span-5 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone size={14} className="text-slate-600" />
                  <span>Live Mobile SMS Preview</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Real-time simulation</span>
              </div>

              {/* Realistic Phone Bubble Mockup */}
              <div className="flex-1 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-4 text-white border border-slate-800 shadow-inner flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-slate-200 uppercase tracking-wide">
                      {settings.TEXTLK_SENDER_ID || 'ApexEdu'}
                    </span>
                  </div>
                  <span className="font-mono">Just Now</span>
                </div>

                <div className="bg-slate-800/90 rounded-2xl rounded-tl-sm p-3.5 text-xs text-slate-100 shadow-md border border-slate-700/60 leading-relaxed font-sans">
                  {getLivePreview(currentTemplate)}
                </div>

                <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                  <span>Mask: <strong>{settings.TEXTLK_SENDER_ID || 'ApexEdu'}</strong></span>
                  <span className="text-emerald-400 font-semibold">Delivered via text.lk</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Database Backup & Disaster Recovery */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Database size={16} className="text-amber-600" />
                <span>Database Backups &amp; Disaster Recovery</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                PostgreSQL &amp; JSON Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Generate a full system snapshot JSON backup file or restore a previous database backup into the active system with automatic PostgreSQL synchronization.
            </p>
          </div>

          {/* Hidden File Input for Backup File Selection */}
          <input
            type="file"
            ref={restoreFileInputRef}
            accept=".json,application/json"
            onChange={handleRestoreFileSelected}
            className="hidden"
          />

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <span className="text-xs text-slate-400">Total Entities: 27 Normalized Tables</span>
            
            <div className="flex items-center space-x-2">
              {/* Restore Backup File Button */}
              <button
                type="button"
                onClick={handleOpenRestorePicker}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 text-xs font-bold flex items-center gap-1.5 border border-amber-500/30 transition-all active:scale-95"
                title="Upload and restore a previous JSON backup file to the system"
              >
                <Upload size={14} className="text-amber-600" />
                <span>Restore Backup File</span>
              </button>

              {/* Download Snapshot Button */}
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/20 transition-all active:scale-95"
              >
                <Download size={14} />
                <span>Download Snapshot</span>
              </button>
            </div>
          </div>
        </div>

        {/* Server Cache & Client Resynchronization */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <RefreshCw size={16} className={`text-brand-600 ${clearingCache ? 'animate-spin' : ''}`} />
                <span>Server Cache &amp; Client Resynchronization</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Live Disk Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Reloads the database directly from disk storage, flushes PWA Service Worker caches, and bypasses browser HTTP cache to guarantee fresh attendance, fees, and student profile changes.
            </p>
            {cacheNotice && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>{cacheNotice}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Zero Downtime Flush</span>
            <button
              type="button"
              onClick={handleClearServerCache}
              disabled={clearingCache}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={14} className={clearingCache ? 'animate-spin' : ''} />
              <span>{clearingCache ? 'Clearing Cache & Resyncing...' : 'Clear Cache & Resync'}</span>
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="lg:col-span-2 flex justify-end">
          <button
            type="button"
            onClick={() => handleSaveAll()}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Check size={16} />}
            <span>{saving ? 'Saving All Settings...' : 'Save All Configuration Changes'}</span>
          </button>
        </div>
      </form>

      {/* RESTORE DATABASE BACKUP MODAL */}
      {restoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center border border-amber-500/30">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Restore Database Backup</h3>
                  <p className="text-[11px] text-slate-500">Verify backup contents before applying to live system</p>
                </div>
              </div>

              {!restoring && (
                <button
                  type="button"
                  onClick={() => {
                    setRestoreModalOpen(false);
                    setRestoreParsedData(null);
                    setRestoreSuccess(null);
                    setRestoreError(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {restoreSuccess ? (
                /* Success View */
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-in zoom-in-95 duration-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-emerald-900">Database Restored Successfully!</h4>
                    <p className="text-xs text-emerald-700 mt-1">
                      All tables have been refreshed and synchronized with PostgreSQL.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-white border border-emerald-100">
                      <span className="text-[10px] text-slate-400 block font-bold">STUDENTS</span>
                      <span className="font-mono font-black text-slate-800 text-sm">{restoreSuccess.studentsCount || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-emerald-100">
                      <span className="text-[10px] text-slate-400 block font-bold">CLASSES</span>
                      <span className="font-mono font-black text-slate-800 text-sm">{restoreSuccess.classesCount || 0}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-emerald-100">
                      <span className="text-[10px] text-slate-400 block font-bold">PAYMENTS</span>
                      <span className="font-mono font-black text-slate-800 text-sm">{restoreSuccess.paymentsCount || 0}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => window.location.reload()}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw size={14} />
                      <span>Reload Application Now</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Confirmation View */
                <>
                  {/* File Metadata Card */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Selected Backup File</span>
                      <p className="text-xs font-black text-slate-800 mt-0.5 truncate max-w-[240px] sm:max-w-xs">
                        {restoreFile?.name || 'database_backup.json'}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-mono font-bold shrink-0">
                      {restoreFile ? `${Math.round(restoreFile.size / 1024)} KB` : ''}
                    </span>
                  </div>

                  {/* Backup Entities Counts Grid */}
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-2">
                      Detected Backup Records
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">STUDENTS</span>
                        <span className="font-mono font-black text-slate-800 text-sm">{restoreParsedData?.students?.length || 0}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">CLASSES</span>
                        <span className="font-mono font-black text-slate-800 text-sm">{restoreParsedData?.classes?.length || 0}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">TEACHERS</span>
                        <span className="font-mono font-black text-slate-800 text-sm">{restoreParsedData?.teachers?.length || 0}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">PAYMENTS</span>
                        <span className="font-mono font-black text-slate-800 text-sm">{restoreParsedData?.payments?.length || 0}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">FEES</span>
                        <span className="font-mono font-black text-slate-800 text-sm">{restoreParsedData?.feeRecords?.length || 0}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">ATTENDANCE</span>
                        <span className="font-mono font-black text-slate-800 text-sm">{restoreParsedData?.attendances?.length || 0}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">USERS</span>
                        <span className="font-mono font-black text-slate-800 text-sm">{restoreParsedData?.users?.length || 0}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block">SETTINGS</span>
                        <span className="font-mono font-black text-slate-800 text-sm">{restoreParsedData?.settings?.length || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Warning Box */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-start gap-2.5">
                    <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">Safety Notice: System Database Overwrite</p>
                      <p className="text-[11px] text-amber-800/90 mt-0.5">
                        Restoring will overwrite existing records with data from this file. A safety copy of your current database will be saved to <code className="bg-amber-100 px-1 rounded font-mono text-[10px]">server/data/backups/</code> prior to applying changes.
                      </p>
                    </div>
                  </div>

                  {restoreError && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{restoreError}</span>
                    </div>
                  )}

                  {/* Confirmation Input */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-black text-slate-700 block">
                      To confirm, type <span className="font-mono text-rose-600 font-black">RESTORE</span> below:
                    </label>
                    <input
                      type="text"
                      value={restoreConfirmText}
                      onChange={(e) => setRestoreConfirmText(e.target.value)}
                      placeholder="Type RESTORE to confirm"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={restoring}
                      onClick={() => {
                        setRestoreModalOpen(false);
                        setRestoreParsedData(null);
                        setRestoreError(null);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      disabled={restoreConfirmText.trim().toUpperCase() !== 'RESTORE' || restoring}
                      onClick={handleConfirmRestore}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:hover:bg-rose-600 text-white text-xs font-black shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition-all"
                    >
                      {restoring ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Restoring Database...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw size={13} />
                          <span>Confirm &amp; Restore Database</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
