import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus, 
  CreditCard, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  GraduationCap,
  X
} from 'lucide-react';
import { apiRequest, formatLKR, formatDate } from '../api';

export const Accounting: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EXPENSES' | 'INCOME' | 'COMMISSIONS'>('OVERVIEW');
  const [expenses, setExpenses] = useState<any[]>([]);
  const [income, setIncome] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Expense Modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    category: 'Rent',
    title: '',
    amount: '',
    paidTo: '',
    paymentMethod: 'Bank Transfer',
    receiptNo: '',
    description: ''
  });

  const fetchAccountingData = async () => {
    setLoading(true);
    try {
      const [sumRes, expRes, incRes, comRes] = await Promise.all([
        apiRequest('/accounting/summary'),
        apiRequest('/accounting/expenses'),
        apiRequest('/accounting/income'),
        apiRequest('/accounting/teacher-commissions')
      ]);
      setSummary(sumRes);
      setExpenses(expRes || []);
      setIncome(incRes || []);
      setCommissions(comRes || []);
    } catch (err) {
      console.error('Accounting fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountingData();
  }, []);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) return;

    try {
      await apiRequest('/accounting/expenses', {
        method: 'POST',
        body: JSON.stringify(expenseForm)
      });
      setIsExpenseModalOpen(false);
      setExpenseForm({
        category: 'Rent',
        title: '',
        amount: '',
        paidTo: '',
        paymentMethod: 'Bank Transfer',
        receiptNo: '',
        description: ''
      });
      fetchAccountingData();
    } catch (err: any) {
      alert(err.message || 'Failed to record expense');
    }
  };

  const handlePayTeacherCommission = async (tch: any) => {
    const confirm = window.confirm(`Confirm commission payout of ${formatLKR(tch.commissionAmount)} to ${tch.teacher.name}?`);
    if (!confirm) return;

    try {
      await apiRequest('/accounting/teacher-commissions/pay', {
        method: 'POST',
        body: JSON.stringify({
          teacherId: tch.teacher.id,
          month: tch.month,
          amount: tch.commissionAmount,
          paymentMethod: 'Bank Transfer'
        })
      });
      alert(`Commission payout recorded successfully for ${tch.teacher.name}`);
      fetchAccountingData();
    } catch (err: any) {
      alert(err.message || 'Failed to process payout');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Class Accounting & Ledger</h1>
          <p className="text-xs text-slate-500 mt-0.5">Comprehensive income, expense bookkeeping, teacher commission calculator, and net profit ledger</p>
        </div>

        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all shrink-0"
        >
          <Plus size={16} />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Financial KPIs Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Income</span>
          <p className="text-2xl font-black text-emerald-600">{formatLKR(summary?.monthlyIncome || 0)}</p>
          <p className="text-[11px] text-slate-500">Today: {formatLKR(summary?.todayIncome || 0)}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Monthly Expenses</span>
          <p className="text-2xl font-black text-rose-600">{formatLKR(summary?.monthlyExpenses || 0)}</p>
          <p className="text-[11px] text-slate-500">Today: {formatLKR(summary?.todayExpenses || 0)}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Operating Income</span>
          <p className="text-2xl font-black text-brand-700">{formatLKR(summary?.monthlyNetIncome || 0)}</p>
          <p className="text-[11px] text-emerald-600 font-semibold">Total Revenue - Expenses</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uncollected Fees</span>
          <p className="text-2xl font-black text-amber-600">{formatLKR(summary?.outstandingFees || 0)}</p>
          <p className="text-[11px] text-slate-500">Tuition receivables</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-100 p-1 rounded-2xl flex items-center space-x-1 border border-slate-200 text-xs font-bold w-fit">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'OVERVIEW' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Breakdown & P&L
        </button>
        <button
          onClick={() => setActiveTab('COMMISSIONS')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'COMMISSIONS' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Teacher Commissions
        </button>
        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'EXPENSES' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Expense Ledger ({expenses.length})
        </button>
        <button
          onClick={() => setActiveTab('INCOME')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'INCOME' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Income Ledger ({income.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & BREAKDOWN */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Breakdown */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-600" />
              <span>Income Breakdown by Category</span>
            </h3>
            <div className="space-y-3">
              {Object.entries(summary?.incomeCategories || {}).map(([cat, amount]: any) => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-800">{cat}</span>
                  <span className="font-bold text-emerald-700">{formatLKR(amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <TrendingDown size={16} className="text-rose-600" />
              <span>Operating Expenses by Category</span>
            </h3>
            <div className="space-y-3">
              {Object.entries(summary?.expenseCategories || {}).map(([cat, amount]: any) => (
                <div key={cat} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-800">{cat}</span>
                  <span className="font-bold text-rose-700">{formatLKR(amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEACHER COMMISSIONS */}
      {activeTab === 'COMMISSIONS' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">Teacher Remuneration & Commission Calculations</h3>
            <p className="text-xs text-slate-500">Automated calculation of teacher shares based on collected student tuition fees and contract rates</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Teacher</th>
                  <th className="py-3 px-4">Subject & Classes</th>
                  <th className="py-3 px-4">Total Tuition Collected</th>
                  <th className="py-3 px-4">Commission Rate</th>
                  <th className="py-3 px-4">Calculated Payout</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {commissions.map((c: any) => (
                  <tr key={c.teacher.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {c.teacher.name}
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {c.classCount} Classes ({c.studentCount} Students)
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {formatLKR(c.totalCollected)}
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {c.commissionRate}%
                    </td>

                    <td className="py-3 px-4 font-black text-brand-700 text-sm">
                      {formatLKR(c.commissionAmount)}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        c.isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {c.isPaid ? 'PAID' : 'PENDING'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {!c.isPaid ? (
                        <button
                          onClick={() => handlePayTeacherCommission(c)}
                          className="px-3 py-1 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition-all"
                        >
                          Process Payout
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Disbursed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EXPENSE LEDGER */}
      {activeTab === 'EXPENSES' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Title / Expense Item</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Paid To</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((e: any) => (
                  <tr key={e.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{e.title}</td>
                    <td className="py-3 px-4 font-black text-rose-700">{formatLKR(e.amount)}</td>
                    <td className="py-3 px-4 text-slate-600">{e.paidTo || 'N/A'}</td>
                    <td className="py-3 px-4 text-slate-500">{e.paymentMethod}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(e.date)}</td>
                    <td className="py-3 px-4 text-slate-400">{e.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: INCOME LEDGER */}
      {activeTab === 'INCOME' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Receipt / Ref</th>
                  <th className="py-3 px-4">Source</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Received By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {income.map((i: any) => (
                  <tr key={i.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                        {i.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{i.receiptNo || 'N/A'}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{i.source || 'General'}</td>
                    <td className="py-3 px-4 font-black text-emerald-700">{formatLKR(i.amount)}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDate(i.date)}</td>
                    <td className="py-3 px-4 text-slate-400">{i.receivedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECORD EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Record Operating Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Expense Category *</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="Rent">Rent (Lease & Hall Rental)</option>
                  <option value="Electricity">Electricity (CEB Bill)</option>
                  <option value="Internet">Internet & Telecom</option>
                  <option value="Printing">Printing & Stationery</option>
                  <option value="Advertising">Advertising & Social Media Marketing</option>
                  <option value="Equipment">Equipment & Audio/Visual</option>
                  <option value="Other Expenses">Other Expenses</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Title / Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CEB Central AC Electricity Bill"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Amount (LKR) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 45000"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-rose-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Paid To</label>
                  <input
                    type="text"
                    placeholder="e.g. Ceylon Electricity Board"
                    value={expenseForm.paidTo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Payment Method</label>
                  <select
                    value={expenseForm.paymentMethod}
                    onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Card">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Voucher / Receipt #</label>
                  <input
                    type="text"
                    placeholder="e.g. CEB-88129"
                    value={expenseForm.receiptNo}
                    onChange={(e) => setExpenseForm({ ...expenseForm, receiptNo: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
