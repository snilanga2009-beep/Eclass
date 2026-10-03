import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  Calendar, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { apiRequest, formatLKR, formatDate } from '../api';
import { Payment } from '../types';

interface PaymentsProps {
  onOpenReceipt: (receiptNumber: string) => void;
  onOpenPaymentModal: () => void;
}

export const Payments: React.FC<PaymentsProps> = ({ onOpenReceipt, onOpenPaymentModal }) => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search,
        method: methodFilter,
        fromDate,
        toDate
      });
      const data = await apiRequest<Payment[]>(`/payments?${query.toString()}`);
      setPayments(data || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [methodFilter, fromDate, toDate]);

  // Real-time synchronization: Auto-refresh on payment or attendance changes
  useEffect(() => {
    const handleDataChanged = () => {
      fetchPayments();
    };
    window.addEventListener('cams-data-changed', handleDataChanged);
    return () => window.removeEventListener('cams-data-changed', handleDataChanged);
  }, [methodFilter, fromDate, toDate]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Tuition Fee Payments</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track student tuition fee collections, cashier receipts, and transaction history</p>
        </div>

        <button
          onClick={onOpenPaymentModal}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/30 transition-all shrink-0"
        >
          <Plus size={16} />
          <span>Collect Fee & Issue Receipt</span>
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Filtered Collections Total</span>
          <p className="text-2xl sm:text-3xl font-black text-white mt-1">{formatLKR(totalCollected)}</p>
        </div>
        <div className="flex items-center space-x-3 text-xs text-slate-300">
          <span>Transactions: <strong className="text-white">{payments.length}</strong></span>
          <span>•</span>
          <span>Currency: <strong className="text-emerald-400">Sri Lankan Rupee (LKR)</strong></span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipt #, student name, student ID, cashier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Card">Card</option>
            <option value="Online Payment">Online</option>
          </select>

          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            placeholder="From Date"
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700"
          />

          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            placeholder="To Date"
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700"
          />
        </div>
      </div>

      {/* Desktop Payments Table (Visible on md and up) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Receipt No</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Amount Paid</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading payments ledger...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No payment records found.</td>
                </tr>
              ) : (
                payments.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-brand-700">
                      {p.receiptNumber}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{p.student?.fullName || 'Student'}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.student?.studentIdNumber}</p>
                    </td>

                    <td className="py-3 px-4 font-extrabold text-slate-900 text-sm">
                      {formatLKR(p.totalAmount)}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {p.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(p.paymentDate)}
                    </td>

                    <td className="py-3 px-4 text-slate-500">
                      {p.cashier}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onOpenReceipt(p.receiptNumber)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-semibold transition-colors"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Touch-Friendly Payment Cards (Visible on mobile < md) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            Loading payments ledger...
          </div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            No payment records found.
          </div>
        ) : (
          payments.map(p => (
            <div 
              key={p.id} 
              className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono font-bold text-xs text-brand-700">{p.receiptNumber}</span>
                  <span className="text-[10px] text-slate-400 ml-2">{formatDate(p.paymentDate)}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  {p.paymentMethod}
                </span>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-900">{p.student?.fullName || 'Student'}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{p.student?.studentIdNumber}</p>
                </div>
                <div className="text-right">
                  <p className="text-base font-black text-slate-900">{formatLKR(p.totalAmount)}</p>
                  <p className="text-[10px] text-slate-400">Cashier: {p.cashier}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => onOpenReceipt(p.receiptNumber)}
                  className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <span>View & Print Thermal Receipt</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
