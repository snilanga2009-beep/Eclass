import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Users, 
  FileText,
  AlertCircle,
  ShieldCheck,
  Radio,
  Zap,
  Smartphone,
  ExternalLink,
  Copy,
  Check,
  Terminal,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Info
} from 'lucide-react';
import { apiRequest, formatDate } from '../api';

export const Messaging: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'test-tool'>('test-tool');
  const [templates, setTemplates] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [providerInfo, setProviderInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Broadcast dispatch state
  const [channel, setChannel] = useState<'SMS' | 'WHATSAPP' | 'BOTH'>('BOTH');
  const [targetType, setTargetType] = useState('ALL');
  const [targetId, setTargetId] = useState('');
  const [selectedTemplateCode, setSelectedTemplateCode] = useState('ATTENDANCE_ALERT');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // SMS Live Testing & Diagnostic Tool State
  const [testPhone, setTestPhone] = useState('0771234567');
  const [testToken, setTestToken] = useState('');
  const [testSenderId, setTestSenderId] = useState('TextLKDemo');
  const [testMessage, setTestMessage] = useState(
    'Cambridge Academy SMS Test: Welcome! Your text.lk SMS gateway is connected and delivering live alerts to Sri Lankan mobile networks.'
  );
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [testingSMS, setTestingSMS] = useState(false);
  const [testDiagnosis, setTestDiagnosis] = useState<any>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const fetchMessagingData = async () => {
    setLoading(true);
    try {
      const [tplData, logData, clsData, pData] = await Promise.all([
        apiRequest('/messaging/templates'),
        apiRequest('/messaging/logs'),
        apiRequest('/classes'),
        apiRequest('/messaging/provider')
      ]);
      setTemplates(tplData || []);
      setLogs(logData || []);
      setClasses(clsData || []);
      setProviderInfo(pData || null);

      if (pData?.apiToken) {
        setTestToken(pData.apiToken);
      }
      if (pData?.senderId) {
        setTestSenderId(pData.senderId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessagingData();
  }, []);

  // Quick Preset Messages for Testing
  const selectPreset = (type: string) => {
    const origin = window.location.origin;
    if (type === 'portal') {
      const digits = testPhone.replace(/\D/g, '');
      const num = digits.startsWith('0') ? '94' + digits.substring(1) : digits;
      setTestMessage(
        `Welcome to Cambridge Academy! Track your child's live attendance, RFID check-in times & fee receipts on the Parent Portal PWA: ${origin}/login?phone=${num}&autoLogin=1`
      );
    } else if (type === 'attendance') {
      setTestMessage(
        `Dear Parent, your child Kasun Perera was marked PRESENT for Combined Mathematics today at 08:30 AM via RFID Tap. - Cambridge Academy`
      );
    } else if (type === 'fee') {
      setTestMessage(
        `Thank you! Received tuition fee Rs. 3,500.00 for Kasun Perera (Grade 12 Physics). Receipt #REC-2026-0042. - Cambridge Academy`
      );
    } else if (type === 'ping') {
      setTestMessage(
        `Cambridge Academy SMS Gateway Test: text.lk connectivity verified on Dialog/Mobitel/Airtel/Hutch.`
      );
    }
  };

  // Run Real SMS Dispatch via Live Test Tool
  const handleRunSMSTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      alert('Please enter a recipient mobile number (e.g. 0771234567 or 94771234567)');
      return;
    }

    setTestingSMS(true);
    setTestDiagnosis(null);
    try {
      const res = await apiRequest<any>('/messaging/send-test-sms', {
        method: 'POST',
        body: JSON.stringify({
          phone: testPhone.trim(),
          message: testMessage.trim(),
          apiToken: testToken.trim() || undefined,
          senderId: testSenderId.trim() || undefined,
          saveAsDefault
        })
      });

      setTestDiagnosis(res);
      // Refresh logs & provider info
      fetchMessagingData();
    } catch (err: any) {
      setTestDiagnosis({
        success: false,
        error: err.message || 'Failed to dispatch test SMS'
      });
    } finally {
      setTestingSMS(false);
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setFeedback(null);
    try {
      const res = await apiRequest<any>('/messaging/send', {
        method: 'POST',
        body: JSON.stringify({
          channel,
          targetType,
          targetId: targetType === 'CLASS' ? targetId : undefined,
          templateCode: selectedTemplateCode,
          customMessage: customMessage || undefined
        })
      });
      setFeedback(res.message);
      setCustomMessage('');
      fetchMessagingData();
    } catch (err: any) {
      alert(err.message || 'Dispatch failed');
    } finally {
      setSending(false);
    }
  };

  // Calculate character and segment count (Standard SMS = 160 GSM chars)
  const charCount = testMessage.length;
  const smsSegments = Math.ceil(charCount / 160) || 1;

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">SMS & WhatsApp Gateway</h1>
          <p className="text-xs text-slate-500 mt-0.5">Automate parent notifications, pending fee reminders, and real-time SMS delivery diagnostics</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('test-tool')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'test-tool'
                ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap size={14} />
            <span>SMS Live Test Tool</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'broadcast'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send size={14} />
            <span>Broadcast Campaigns</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Active Gateway Status Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white shadow-lg relative overflow-hidden border border-purple-800/40">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-purple-300 shrink-0">
              <Radio size={24} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-wider text-purple-300 uppercase">Gateway Engine:</span>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200 text-[11px] font-bold">
                  🇱🇰 {providerInfo?.provider || 'text.lk'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                  Live API Connected
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Active Sender ID: <span className="font-mono font-bold text-white bg-white/10 px-1.5 py-0.5 rounded">{testSenderId || 'TextLKDemo'}</span> &bull; 
                Sri Lanka Telco Routes: <span className="text-purple-200 font-semibold">Dialog &bull; Mobitel &bull; Airtel &bull; Hutch</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://text.lk"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-purple-200 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <span>Text.lk Portal</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* TAB 1: SMS LIVE TESTING & DIAGNOSTIC TOOL */}
      {activeTab === 'test-tool' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: SMS Diagnostic Tester Form (7 cols) */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Zap size={16} className="text-purple-600" />
                  <span>Real SMS Live Dispatcher</span>
                </h3>
                <p className="text-[11px] text-slate-500">Test actual outbound delivery directly to your physical mobile phone</p>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 font-mono text-[10px] font-bold">
                API v3 / Live
              </span>
            </div>

            <form onSubmit={handleRunSMSTest} className="space-y-4">
              {/* Recipient Phone Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Recipient Mobile Number *</span>
                  <span className="text-[10px] text-slate-400 font-normal">Supports 077..., +9477..., 9477...</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-slate-400 font-mono select-none">
                    <span>🇱🇰</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="e.g. 0771234567"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Quick Message Presets */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Sparkles size={12} className="text-amber-500" />
                  <span>Quick Message Presets</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => selectPreset('portal')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 text-[11px] font-semibold text-center transition-all"
                  >
                    📱 Parent Portal Link
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreset('attendance')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 text-[11px] font-semibold text-center transition-all"
                  >
                    🔔 RFID Check-in
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreset('fee')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 text-[11px] font-semibold text-center transition-all"
                  >
                    💳 Fee Receipt
                  </button>
                  <button
                    type="button"
                    onClick={() => selectPreset('ping')}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-700 text-[11px] font-semibold text-center transition-all"
                  >
                    ⚡ Gateway Ping
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">SMS Message Body *</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {charCount} chars &bull; {smsSegments} SMS {smsSegments > 1 ? 'segments' : 'part'}
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter message to deliver..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Credentials Overrides (Token & Mask) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-purple-600" />
                    <span>text.lk Credentials Configuration</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Authenticated via text.lk Bearer</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Sender Mask (Sender ID)</label>
                    <input
                      type="text"
                      value={testSenderId}
                      onChange={(e) => setTestSenderId(e.target.value)}
                      placeholder="TextLKDemo"
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-slate-600">API Bearer Token</label>
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="text-[10px] text-purple-600 hover:underline flex items-center gap-0.5"
                      >
                        {showToken ? <EyeOff size={10} /> : <Eye size={10} />}
                        <span>{showToken ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={testToken}
                      onChange={(e) => setTestToken(e.target.value)}
                      placeholder="e.g. 7660|..."
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60">
                  <input
                    type="checkbox"
                    id="saveDefaultToken"
                    checked={saveAsDefault}
                    onChange={(e) => setSaveAsDefault(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <label htmlFor="saveDefaultToken" className="text-xs text-slate-700 cursor-pointer select-none">
                    Save token and sender ID as system default in settings
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={testingSMS}
                className="w-full py-3 rounded-2xl bg-purple-700 hover:bg-purple-800 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-purple-700/25 transition-all flex items-center justify-center gap-2"
              >
                <Zap size={16} className={testingSMS ? 'animate-spin' : ''} />
                <span>{testingSMS ? 'Contacting text.lk Gateway...' : 'Send Real SMS to Mobile Phone Now'}</span>
              </button>
            </form>
          </div>

          {/* Right: Live Diagnostics Console & Troubleshooting Guide (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Result Inspection Box */}
            <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-xs uppercase tracking-wider text-purple-300 flex items-center gap-2">
                  <Terminal size={14} />
                  <span>Gateway Diagnostics Output</span>
                </h3>
                {testDiagnosis && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    testDiagnosis.success 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {testDiagnosis.success ? 'HTTP 200 DELIVERED' : `ERROR ${testDiagnosis.httpStatus || ''}`}
                  </span>
                )}
              </div>

              {testingSMS ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-slate-300">Dispatching packet to text.lk API server...</p>
                  <p className="text-[10px] text-slate-500 font-mono">POST https://app.text.lk/api/v3/sms/send</p>
                </div>
              ) : testDiagnosis ? (
                <div className="space-y-3">
                  <div className={`p-3 rounded-2xl border text-xs ${
                    testDiagnosis.success 
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
                      : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                  }`}>
                    <p className="font-bold">
                      {testDiagnosis.success ? '✔ SMS Delivered to Mobile Network' : '✖ SMS Dispatch Failed'}
                    </p>
                    <p className="text-[11px] mt-0.5 text-slate-300">
                      {testDiagnosis.response?.message || testDiagnosis.error || 'Provider responded with status.'}
                    </p>
                  </div>

                  {/* Diagnostic Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Normalized Recipient</span>
                      <span className="text-emerald-400 font-bold">{testDiagnosis.normalizedPhone || testPhone}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase">Sender Mask</span>
                      <span className="text-purple-300">{testDiagnosis.senderId || testSenderId}</span>
                    </div>
                    {testDiagnosis.response?.data?.uid && (
                      <div className="col-span-2 pt-1 border-t border-slate-800/80">
                        <span className="text-slate-500 block text-[9px] uppercase">Text.lk Message UID</span>
                        <span className="text-indigo-300">{testDiagnosis.response.data.uid}</span>
                      </div>
                    )}
                    {testDiagnosis.response?.data?.cost && (
                      <div>
                        <span className="text-slate-500 block text-[9px] uppercase">SMS Units Charged</span>
                        <span className="text-amber-300">{testDiagnosis.response.data.cost} unit</span>
                      </div>
                    )}
                  </div>

                  {/* Raw Response JSON Viewer */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-slate-400 uppercase font-mono">Raw Provider Payload:</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(JSON.stringify(testDiagnosis, null, 2));
                          setCopiedResponse(true);
                          setTimeout(() => setCopiedResponse(false), 2000);
                        }}
                        className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        {copiedResponse ? <Check size={10} /> : <Copy size={10} />}
                        <span>{copiedResponse ? 'Copied' : 'Copy JSON'}</span>
                      </button>
                    </div>
                    <pre className="p-2.5 rounded-xl bg-black/60 border border-slate-800 text-[10px] font-mono text-purple-200 overflow-x-auto max-h-40 scrollbar-none">
                      {JSON.stringify(testDiagnosis, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500 space-y-2">
                  <Smartphone size={32} className="mx-auto text-slate-600" />
                  <p className="text-xs">Enter your Sri Lankan phone number and click &quot;Send Real SMS&quot; to inspect live gateway diagnostics.</p>
                </div>
              )}
            </div>

            {/* Telco Network Reference & Troubleshooting Notes */}
            <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2.5">
              <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Info size={14} className="text-purple-600" />
                <span>Sri Lanka SMS Delivery Guide</span>
              </h4>
              <ul className="text-[11px] text-slate-600 space-y-1.5 list-disc pl-4">
                <li>
                  <strong>Phone Normalization:</strong> Numbers are automatically converted from <code className="text-purple-700 bg-purple-50 px-1 rounded">077XXXXXXX</code> to international format <code className="text-purple-700 bg-purple-50 px-1 rounded">9477XXXXXXX</code> (without <code className="text-slate-500">+</code>).
                </li>
                <li>
                  <strong>Sender Mask:</strong> <code className="text-indigo-700 bg-indigo-50 px-1 rounded">TextLKDemo</code> is free and pre-approved for all 4 Sri Lankan networks (Dialog, Mobitel, Airtel, Hutch).
                </li>
                <li>
                  <strong>Branded Custom Mask:</strong> To send SMS using your institute name mask (e.g. <code className="font-mono text-slate-800">ApexEdu</code>), register the mask on <a href="https://text.lk" target="_blank" rel="noreferrer" className="text-purple-600 font-semibold underline">text.lk</a> and submit TRCSL verification docs.
                </li>
                <li>
                  <strong>Account Balance:</strong> If messages return HTTP 402 or insufficient balance, top-up SMS credits on your text.lk portal.
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BROADCAST CAMPAIGNS (Original Dispatch Form & Delivery Logs) */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Dispatch Form */}
          <div className="lg:col-span-1 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Send size={16} className="text-brand-600" />
              <span>Send Notification Broadcast</span>
            </h3>

            <form onSubmit={handleSendBroadcast} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Delivery Channel</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setChannel('BOTH')}
                    className={`py-1.5 rounded-lg transition-all ${channel === 'BOTH' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600'}`}
                  >
                    Both
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('WHATSAPP')}
                    className={`py-1.5 rounded-lg transition-all ${channel === 'WHATSAPP' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'}`}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('SMS')}
                    className={`py-1.5 rounded-lg transition-all ${channel === 'SMS' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'}`}
                  >
                    SMS
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Audience</label>
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-medium"
                >
                  <option value="ALL">All Active Students & Guardians</option>
                  <option value="PENDING_FEES">Students with Pending Tuition Fees</option>
                  <option value="CLASS">Specific Class Enrolled Students</option>
                </select>
              </div>

              {targetType === 'CLASS' && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Select Class</label>
                  <select
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="">Choose Class...</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Message Template</label>
                <select
                  value={selectedTemplateCode}
                  onChange={(e) => setSelectedTemplateCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  {templates.map(t => (
                    <option key={t.id} value={t.code}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Custom Message / Override</label>
                <textarea
                  rows={3}
                  placeholder="Leave blank to use default template text..."
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Send size={14} />
                <span>{sending ? 'Dispatching...' : 'Dispatch Notifications'}</span>
              </button>
            </form>
          </div>

          {/* Right: Live Delivery Logs Table */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900">Recent Gateway Delivery Logs</h3>
              <span className="text-xs text-slate-500">{logs.length} Logged Entries</span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Channel</th>
                    <th className="py-2.5 px-3">Recipient</th>
                    <th className="py-2.5 px-3">Message</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.slice(0, 15).map((l: any) => (
                    <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          l.channel === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {l.channel}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-slate-700">
                        {l.recipient}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                        {l.message}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          l.status === 'DELIVERED' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : l.status === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-slate-400 font-mono">
                        {formatDate(l.sentAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Global Delivery Logs (visible when in test-tool tab too) */}
      {activeTab === 'test-tool' && (
        <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock size={16} className="text-slate-500" />
              <span>Gateway Delivery Logs (Live Updates)</span>
            </h3>
            <button
              onClick={fetchMessagingData}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-[350px]">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Message</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.slice(0, 10).map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        l.channel === 'WHATSAPP' ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {l.channel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                      {l.recipient}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {l.type || 'SMS'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-sm truncate" title={l.message}>
                      {l.message}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        l.status === 'DELIVERED' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : l.status === 'FAILED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[10px] text-slate-400 font-mono">
                      {formatDate(l.sentAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
