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
  AlertCircle
} from 'lucide-react';
import { apiRequest } from '../api';

export const Settings: React.FC = () => {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testingTextLk, setTestingTextLk] = useState(false);

  useEffect(() => {
    apiRequest('/settings')
      .then(res => {
        const data = res || {};
        if (!data.SMS_PROVIDER) data.SMS_PROVIDER = 'text.lk';
        if (!data.TEXTLK_SENDER_ID) data.TEXTLK_SENDER_ID = 'ApexEdu';
        if (!data.TEXTLK_API_TOKEN) data.TEXTLK_API_TOKEN = 'textlk_live_sec_89218201928301';
        if (!data.TEXTLK_ENDPOINT) data.TEXTLK_ENDPOINT = 'https://app.text.lk/api/v3/sms/send';
        setSettings(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: string) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">System Settings & Configuration</h1>
        <p className="text-xs text-slate-500 mt-0.5">Configure institute branding, receipt currency, text.lk SMS gateway integration, and system backups</p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>Settings saved and applied successfully across all modules.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Database Backup & Export */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Database size={16} className="text-amber-600" />
              <span>Database Backups & Disaster Recovery</span>
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Generate a snapshot JSON file containing all students, classes, attendance records, fee payments, and accounting ledger items.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">Total Entities: 26 Normalized Tables</span>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-brand-50 text-brand-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Download size={14} />
              <span>Download Snapshot</span>
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="lg:col-span-2 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/30 transition-all flex items-center gap-2"
          >
            <Check size={16} />
            <span>Save All Configuration Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
