import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  Calendar, 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Printer, 
  RefreshCw, 
  Search, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ShieldCheck, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  ChevronRight, 
  Info, 
  Sparkles, 
  FileText,
  HelpCircle,
  X
} from 'lucide-react';
import { apiRequest, formatLKR, formatDate } from '../api';
import { useAuth } from '../context/AuthContext';

interface DailyEarningsProps {
  onOpenReceipt: (receiptNumber: string) => void;
}

export const DailyEarnings: React.FC<DailyEarningsProps> = ({ onOpenReceipt }) => {
  const { user, hasRole } = useAuth();

  // Selected date (defaults to today)
  const todayStr = new Date().toISOString().substring(0, 10);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'classes' | 'cashiers' | 'denominations'>('transactions');
  const [searchTx, setSearchTx] = useState<string>('');
  const [showRoleGuide, setShowRoleGuide] = useState<boolean>(false);

  // Cash Denomination Calculator for Cashier Drawer Handover
  const [notes, setNotes] = useState<{ [denom: number]: number }>({
    5000: 0,
    1000: 0,
    500: 0,
    100: 0,
    50: 0,
    20: 0
  });

  const handleDenomChange = (denom: number, count: string) => {
    const val = parseInt(count, 10);
    setNotes(prev => ({
      ...prev,
      [denom]: isNaN(val) || val < 0 ? 0 : val
    }));
  };

  const countedCash = Object.entries(notes).reduce((sum, [denom, count]) => {
    return sum + (Number(denom) * Number(count));
  }, 0);

  // Fetch daily collection data
  const fetchReport = (dateToFetch: string) => {
    setLoading(true);
    apiRequest(`/accounting/daily-collection?date=${dateToFetch}`)
      .then(res => {
        setData(res);
      })
      .catch(err => {
        console.error('Failed to load daily report:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport(selectedDate);
  }, [selectedDate]);

  // Quick Date Selectors
  const setQuickDate = (type: 'today' | 'yesterday') => {
    if (type === 'today') {
      setSelectedDate(todayStr);
    } else {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      setSelectedDate(d.toISOString().substring(0, 10));
    }
  };

  // Filtered transactions for search
  const filteredTransactions = (data?.transactions || []).filter((tx: any) => {
    if (!searchTx) return true;
    const q = searchTx.toLowerCase();
    return (
      tx.receiptNumber.toLowerCase().includes(q) ||
      tx.studentName.toLowerCase().includes(q) ||
      tx.studentIdNumber.toLowerCase().includes(q) ||
      (tx.cashier && tx.cashier.toLowerCase().includes(q))
    );
  });

  // Calculate discrepancy between counted cash and system cash
  const systemCashExpected = data?.drawerSettlement?.netCashToHandover || 0;
  const cashDiscrepancy = countedCash - systemCashExpected;

  // Print Daily Handover & Settlement Slip
  const handlePrintSettlement = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Date Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
              <Coins size={12} className="text-emerald-600" />
              <span>Daily Financial Settlement</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {selectedDate === todayStr ? "TODAY'S AUDIT" : 'HISTORICAL REPORT'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Daily Collection & Earnings Report
          </h1>
          <p className="text-xs text-slate-500">
            Real-time cashier counter collections, payment method breakdown, teacher commission shares, and cash drawer handover.
          </p>
        </div>

        {/* Date Selector and Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Date Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              onClick={() => setQuickDate('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDate === todayStr
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setQuickDate('yesterday')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDate !== todayStr && selectedDate === (() => {
                  const d = new Date();
                  d.setDate(d.getDate() - 1);
                  return d.toISOString().substring(0, 10);
                })()
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setSelectedDate('2026-09-08')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDate === '2026-09-08'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-emerald-700 hover:text-emerald-900'
              }`}
            >
              Batch (Sep 8)
            </button>
          </div>

          {/* Custom Date Input */}
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-1.5 rounded-2xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchReport(selectedDate)}
            className="p-2 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>

          {/* Role Access Guide Button */}
          <button
            onClick={() => setShowRoleGuide(true)}
            className="px-3 py-1.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-sm"
          >
            <ShieldCheck size={14} className="text-indigo-600" />
            <span>Role Permissions</span>
          </button>

          {/* Print Settlement Slip Button */}
          <button
            onClick={handlePrintSettlement}
            className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95"
          >
            <Printer size={14} />
            <span>Print Settlement</span>
          </button>
        </div>
      </div>

      {/* Top 4 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Daily Collection */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="relative z-10 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold uppercase tracking-wider text-[11px]">Total Collection</span>
              <span className="p-2 rounded-2xl bg-white/10 text-emerald-400">
                <Coins size={18} />
              </span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">
              {formatLKR(data?.totalCollected || 0)}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[11px] text-slate-300">
              <span>Receipts Issued: <strong>{data?.receiptCount || 0}</strong></span>
              <span className="text-slate-400 font-mono">
                Avg: {formatLKR(data?.receiptCount ? Math.round((data?.totalCollected || 0) / data.receiptCount) : 0)}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Physical Cash in Drawer (Handover Amount) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Cash Drawer (Physical)</span>
            <span className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
              <Wallet size={18} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatLKR(data?.drawerSettlement?.cashCollected || 0)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Petty Cash Out: <strong className="text-rose-600">-{formatLKR(data?.drawerSettlement?.expensesPaidOut || 0)}</strong></span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
              Net: {formatLKR(data?.drawerSettlement?.netCashToHandover || 0)}
            </span>
          </div>
        </div>

        {/* 3. Digital, Bank & Card Collections */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Bank & Card Verified</span>
            <span className="p-2 rounded-2xl bg-blue-50 text-blue-600">
              <CreditCard size={18} />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatLKR(data?.drawerSettlement?.digitalTotal || 0)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Bank: {formatLKR(data?.methods?.bankTransfer || 0)}</span>
            <span>Card/Online: {formatLKR((data?.methods?.card || 0) + (data?.methods?.online || 0))}</span>
          </div>
        </div>

        {/* 4. Teacher Commission vs Academy Share */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Profit Sharing Split</span>
            <span className="p-2 rounded-2xl bg-purple-50 text-purple-600">
              <Building2 size={18} />
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-black text-purple-700">
              {formatLKR(data?.profitSharing?.academyNetShare || 0)}
            </span>
            <span className="text-[10px] text-purple-500 font-bold uppercase">Academy Net</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Teachers (Avg 70%):</span>
            <strong className="text-slate-800">{formatLKR(data?.profitSharing?.teacherCommissions || 0)}</strong>
          </div>
        </div>
      </div>

      {/* Cash Drawer Settlement Slip & Denomination Counter Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-emerald-800/40 text-white shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase">
                Front Office Handover Verification
              </span>
              <span className="text-xs text-slate-300">
                Cashier Counter Shift Close
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              End-of-Day Physical Cash Drawer Settlement
            </h3>
            <p className="text-xs text-slate-400">
              Receptionist counts physical currency notes in the register. Enter counts below to verify 0 discrepancy before handing cash to the Accountant.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">System Expected Cash</p>
              <p className="text-lg font-mono font-bold text-emerald-400">
                {formatLKR(systemCashExpected)}
              </p>
            </div>
            <div className="text-right pl-3 border-l border-white/10">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">Physically Counted</p>
              <p className="text-lg font-mono font-bold text-white">
                {formatLKR(countedCash)}
              </p>
            </div>
          </div>
        </div>

        {/* Currency Denominations Grid (5000, 1000, 500, 100, 50, 20) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[5000, 1000, 500, 100, 50, 20].map(denom => (
            <div key={denom} className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-emerald-300">Rs. {denom}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  = {formatLKR(denom * (notes[denom] || 0))}
                </span>
              </div>
              <input
                type="number"
                min="0"
                placeholder="0 notes"
                value={notes[denom] || ''}
                onChange={(e) => handleDenomChange(denom, e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-white/20 text-white font-mono text-xs focus:outline-none focus:border-emerald-400 text-center"
              />
            </div>
          ))}
        </div>

        {/* Reconciliation Status Alert */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10">
          <div className="flex items-center space-x-2">
            {countedCash === 0 ? (
              <span className="text-xs text-slate-400">
                Enter note counts above to verify drawer handover balance.
              </span>
            ) : cashDiscrepancy === 0 ? (
              <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>PERFECT MATCH: Physical cash matches system records exactly!</span>
              </div>
            ) : (
              <div className={`flex items-center space-x-2 text-xs font-bold ${cashDiscrepancy > 0 ? 'text-amber-300' : 'text-rose-300'}`}>
                <AlertCircle size={16} />
                <span>
                  {cashDiscrepancy > 0 ? `SURPLUS: +${formatLKR(cashDiscrepancy)}` : `SHORTAGE: ${formatLKR(cashDiscrepancy)}`} (Counted {formatLKR(countedCash)} vs Expected {formatLKR(systemCashExpected)})
                </span>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center space-x-3">
            <span>Logged Shift Staff: <strong className="text-white">{user?.name}</strong></span>
            <span>Role: <strong className="text-emerald-400">{user?.role}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Tabs for Detailed Breakdown */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-2 border-b border-slate-200 p-3 sm:px-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'transactions'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <CreditCard size={15} />
            <span>Today's Receipts Ledger</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'transactions' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {data?.receiptCount || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('classes')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'classes'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <BookOpen size={15} />
            <span>Class-by-Class Collections</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'classes' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {data?.byClass?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('cashiers')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'cashiers'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users size={15} />
            <span>Front Office Staff / Cashiers</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'cashiers' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {data?.byCashier?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('denominations')}
            className={`px-4 py-2 rounded-2xl font-bold text-xs transition-all flex items-center space-x-2 shrink-0 ${
              activeTab === 'denominations'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Clock size={15} />
            <span>Hourly Timeline Inflow</span>
          </button>
        </div>

        {/* Tab 1: Today's Receipts Ledger */}
        {activeTab === 'transactions' && (
          <div className="p-4 sm:p-6 space-y-4">
            {/* Search Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-96">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipt #, student name, ID, cashier..."
                  value={searchTx}
                  onChange={(e) => setSearchTx(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="text-xs text-slate-500 font-medium">
                Showing <strong>{filteredTransactions.length}</strong> of {data?.transactions?.length || 0} receipts
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Receipt No</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Class Items</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Cashier</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No transactions recorded on {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx: any) => {
                      const timeStr = tx.paymentDate ? new Date(tx.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {tx.receiptNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {timeStr}
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-slate-900">{tx.studentName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{tx.studentIdNumber}</p>
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            {tx.items?.map((it: any) => `${it.className} (${it.month})`).join(', ') || 'Tuition Fee'}
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900 text-sm">
                            {formatLKR(tx.totalAmount)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              tx.paymentMethod === 'Cash' 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {tx.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 font-medium">
                            {tx.cashier}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => onOpenReceipt(tx.receiptNumber)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 text-xs font-bold transition-all shadow-sm"
                            >
                              View Slip
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Cards View (visible on < md) */}
            <div className="md:hidden space-y-3">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                  No transactions recorded on {selectedDate}.
                </div>
              ) : (
                filteredTransactions.map((tx: any) => {
                  const timeStr = tx.paymentDate ? new Date(tx.paymentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--';
                  return (
                    <div key={tx.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-xs text-slate-900">{tx.receiptNumber}</span>
                          <span className="text-[10px] text-slate-400 ml-2 font-mono">{timeStr}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.paymentMethod === 'Cash' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {tx.paymentMethod}
                        </span>
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-xs text-slate-900">{tx.studentName}</p>
                          <p className="text-[10px] text-slate-500 font-mono">{tx.studentIdNumber}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-slate-900">{formatLKR(tx.totalAmount)}</p>
                          <p className="text-[10px] text-slate-400">Cashier: {tx.cashier}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                          {tx.items?.map((it: any) => it.className).join(', ') || 'Tuition Fee'}
                        </span>
                        <button
                          onClick={() => onOpenReceipt(tx.receiptNumber)}
                          className="px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold shadow-sm"
                        >
                          View Receipt
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Class-by-Class Collections */}
        {activeTab === 'classes' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-y border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Class Name</th>
                    <th className="py-3 px-4">Teacher</th>
                    <th className="py-3 px-4">Students Paid</th>
                    <th className="py-3 px-4">Rate (%)</th>
                    <th className="py-3 px-4">Total Collected</th>
                    <th className="py-3 px-4">Teacher Share</th>
                    <th className="py-3 px-4 text-right">Academy Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {!data?.byClass || data.byClass.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No class collections for {selectedDate}.
                      </td>
                    </tr>
                  ) : (
                    data.byClass.map((cls: any) => (
                      <tr key={cls.classId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {cls.className}
                          <p className="text-[10px] text-slate-400 font-mono font-normal">{cls.classCode}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">
                          {cls.teacherName}
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold text-[10px]">
                            {cls.studentCount} Paid
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {cls.rate}%
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900">
                          {formatLKR(cls.totalCollected)}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-bold">
                          {formatLKR(cls.teacherShare)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-700">
                          {formatLKR(cls.academyShare)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Front Office Staff / Cashiers */}
        {activeTab === 'cashiers' && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {!data?.byCashier || data.byCashier.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-400">
                  No cashier activity recorded on {selectedDate}.
                </div>
              ) : (
                data.byCashier.map((c: any) => (
                  <div key={c.name} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                          {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-xs text-slate-900">{c.name}</p>
                          <p className="text-[10px] text-slate-400">Front Office Cashier</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-bold">
                        {c.receiptCount} receipts
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Physical Cash:</span>
                        <strong className="text-slate-800">{formatLKR(c.cash)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bank / Digital:</span>
                        <strong className="text-slate-800">{formatLKR(c.digital)}</strong>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-200 font-bold">
                        <span className="text-slate-900">Total Shift Collection:</span>
                        <span className="text-emerald-700 font-black">{formatLKR(c.totalCollected)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Hourly Timeline Inflow */}
        {activeTab === 'denominations' && (
          <div className="p-4 sm:p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Peak Payment Collection Hours ({selectedDate})
            </h4>
            <div className="space-y-3">
              {(data?.hourlyBreakdown || []).map((slot: any) => {
                const total = data?.totalCollected || 1;
                const percentage = total > 0 ? Math.round((slot.amount / total) * 100) : 0;
                return (
                  <div key={slot.timeSlot} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{slot.timeSlot}</span>
                      <span className="font-mono text-slate-900">
                        {formatLKR(slot.amount)} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Role Permissions & Privileges Guide Modal ("What is given to each user role") */}
      {showRoleGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    System User Roles & Access Rights Matrix
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detailed role allocation: exactly what features and privileges are given to each user role in the academy.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRoleGuide(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 7 Roles Breakdown Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Super Admin */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-300">SUPER_ADMIN</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">Full Authority</span>
                </div>
                <h4 className="text-sm font-extrabold text-white">Super Administrator</h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                  <li>Complete master access across all modules and settings</li>
                  <li>Database reset, backup, sample seed initialization</li>
                  <li>Security audit logs inspection & IP tracking</li>
                  <li>Global fee overrides, discounts, and staff salary policies</li>
                </ul>
              </div>

              {/* 2. Admin */}
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-indigo-700">ADMIN</span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-800 text-[10px] font-bold">Academic Director</span>
                </div>
                <h4 className="text-sm font-extrabold text-indigo-900">Branch Administrator / Manager</h4>
                <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                  <li>Create and edit tuition classes, rooms, and schedules</li>
                  <li>Teacher hiring, payment rate configuration (e.g. 70%)</li>
                  <li>Student admissions, suspensions, class transfers</li>
                  <li>Generate monthly profit/loss reports and analytics</li>
                </ul>
              </div>

              {/* 3. Accountant */}
              <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-cyan-700">ACCOUNTANT</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-200 text-cyan-800 text-[10px] font-bold">Finance Lead</span>
                </div>
                <h4 className="text-sm font-extrabold text-cyan-900">Head Accountant & Auditor</h4>
                <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                  <li>Daily collection audit and cash drawer handover verification</li>
                  <li>Teacher monthly commission payouts & bank slips</li>
                  <li>Academy expenses logging (rent, utilities, teacher payouts)</li>
                  <li>Defaulter management and pending fee reconciliations</li>
                </ul>
              </div>

              {/* 4. Front Office / Receptionist */}
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-teal-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-teal-700">RECEPTIONIST</span>
                  <span className="px-2 py-0.5 rounded-full bg-teal-200 text-teal-800 text-[10px] font-bold">Front Office Desk</span>
                </div>
                <h4 className="text-sm font-extrabold text-teal-900">Front Office Cashier & Receptionist</h4>
                <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                  <li>Student registration and instant smart QR ID card issuance</li>
                  <li>Tuition fee cashiering and printing 80mm thermal receipts</li>
                  <li>Gate RFID and QR code scanner check-in for arrivals</li>
                  <li>Daily cash drawer balance counting and end-of-shift handover</li>
                </ul>
              </div>

              {/* 5. Teacher */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-700">TEACHER</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold">Academic Faculty</span>
                </div>
                <h4 className="text-sm font-extrabold text-amber-900">Class Lecturer / Teacher</h4>
                <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                  <li>View enrolled students in assigned classes</li>
                  <li>Mark daily attendance and check student arrival status</li>
                  <li>Upload learning materials, lecture notes, and papers</li>
                  <li>View personal monthly commission earnings calculation</li>
                </ul>
              </div>

              {/* 6. Parent */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-700">PARENT</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-bold">Guardian Portal PWA</span>
                </div>
                <h4 className="text-sm font-extrabold text-emerald-900">Guardian / Parent</h4>
                <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                  <li>Real-time attendance logs & gate RFID timestamp alerts</li>
                  <li>Monthly tuition fee ledger and digital payment receipts</li>
                  <li>Student Smart QR Pass for phone backup</li>
                  <li>1-Time login active on Android and iPhone home screen</li>
                </ul>
              </div>

              {/* 7. Student */}
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950 space-y-2.5 md:col-span-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-sky-700">STUDENT</span>
                  <span className="px-2 py-0.5 rounded-full bg-sky-200 text-sky-800 text-[10px] font-bold">Student Pass</span>
                </div>
                <h4 className="text-sm font-extrabold text-sky-900">Student Pass & Study Portal</h4>
                <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                  <li>Digital Student ID Card with encrypted QR Code for scanning</li>
                  <li>Check personal attendance record and upcoming class timetable</li>
                  <li>Download PDF lesson notes and revision papers</li>
                  <li>Check fee payment status and outstanding balances</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowRoleGuide(false)}
                className="px-5 py-2 rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-md"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable End-of-Day Settlement Slip for Thermal / A4 Printout */}
      <div id="receipt-printable-area" className="hidden print:block font-mono text-black p-4 max-w-sm mx-auto text-xs space-y-2">
        <div className="text-center space-y-1 border-b border-black pb-2">
          <h2 className="text-base font-bold uppercase">Apex Academy</h2>
          <p className="text-[10px]">Daily Cashier Drawer Settlement Slip</p>
          <p className="text-[10px]">Date: {selectedDate}</p>
        </div>

        <div className="space-y-1 pt-1">
          <div className="flex justify-between">
            <span>Total Collection:</span>
            <span className="font-bold">{formatLKR(data?.totalCollected || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Receipts Issued:</span>
            <span>{data?.receiptCount || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Cash in Hand:</span>
            <span>{formatLKR(data?.drawerSettlement?.cashCollected || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Petty Expenses Out:</span>
            <span>-{formatLKR(data?.drawerSettlement?.expensesPaidOut || 0)}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-dashed border-black pt-1">
            <span>Net Cash Handover:</span>
            <span>{formatLKR(data?.drawerSettlement?.netCashToHandover || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span>Digital / Bank / POS:</span>
            <span>{formatLKR(data?.drawerSettlement?.digitalTotal || 0)}</span>
          </div>
        </div>

        <div className="pt-4 space-y-6 text-[10px]">
          <div className="border-t border-black pt-1 flex justify-between">
            <span>Handed Over By:</span>
            <span>{user?.name} (Cashier)</span>
          </div>
          <div className="border-t border-black pt-1 flex justify-between">
            <span>Received By:</span>
            <span>____________________ (Accountant)</span>
          </div>
          <div className="border-t border-black pt-1 flex justify-between">
            <span>Approved By:</span>
            <span>____________________ (Director)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
