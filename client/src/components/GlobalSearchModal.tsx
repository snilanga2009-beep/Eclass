import React, { useState, useEffect } from 'react';
import { Search, X, Users, BookOpen, GraduationCap, CreditCard, ChevronRight } from 'lucide-react';
import { apiRequest } from '../api';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudent: (id: string) => void;
  onSelectClass: (id: string) => void;
  onSelectReceipt: (receiptNumber: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectStudent,
  onSelectClass,
  onSelectReceipt
}) => {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Toggle modal
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim() || !isOpen) {
      setStudents([]);
      setClasses([]);
      setPayments([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [stuRes, clsRes, payRes] = await Promise.all([
          apiRequest<any[]>(`/students?search=${encodeURIComponent(query)}`),
          apiRequest<any[]>(`/classes`),
          apiRequest<any[]>(`/payments?search=${encodeURIComponent(query)}`)
        ]);

        const filteredClasses = (clsRes || []).filter((c: any) => 
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.classCode.toLowerCase().includes(query.toLowerCase())
        );

        setStudents(stuRes?.slice(0, 5) || []);
        setClasses(filteredClasses.slice(0, 4));
        setPayments(payRes?.slice(0, 4) || []);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200">
          <Search size={20} className="text-slate-400 mr-3" />
          <input
            type="text"
            placeholder="Search students, classes, parent phones, receipt numbers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent text-slate-800 text-sm focus:outline-none placeholder:text-slate-400"
          />
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && (
            <p className="text-xs text-slate-400 text-center py-4">Searching database...</p>
          )}

          {!loading && !query && (
            <div className="text-center py-8 text-slate-400 text-xs">
              <p>Type student name, student ID, parent phone number, or receipt # to find records instantly.</p>
            </div>
          )}

          {/* Students Section */}
          {students.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users size={13} /> Students ({students.length})
              </p>
              <div className="space-y-1">
                {students.map(s => (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectStudent(s.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-brand-50 cursor-pointer group transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={s.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80"} alt="" className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-semibold text-slate-900 group-hover:text-brand-700">{s.fullName}</p>
                        <p className="text-[10px] text-slate-500">{s.studentIdNumber} • {s.grade} • Phone: {s.phone || s.parentPhone || 'N/A'}</p>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-brand-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Classes Section */}
          {classes.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen size={13} /> Classes ({classes.length})
              </p>
              <div className="space-y-1">
                {classes.map(c => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onSelectClass(c.id);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50 cursor-pointer group transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700">{c.name}</p>
                      <p className="text-[10px] text-slate-500">{c.classCode} • {c.dayOfWeek} {c.startTime}-{c.endTime} • Fee: Rs. {c.monthlyFee}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-emerald-600" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments Section */}
          {payments.length > 0 && (
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CreditCard size={13} /> Payments & Receipts ({payments.length})
              </p>
              <div className="space-y-1">
                {payments.map(p => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectReceipt(p.receiptNumber);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50 cursor-pointer group transition-colors"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-purple-700">Receipt #{p.receiptNumber}</p>
                      <p className="text-[10px] text-slate-500">Amount: Rs. {p.totalAmount.toLocaleString()} • Method: {p.paymentMethod} • Cashier: {p.cashier}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-400 group-hover:text-purple-600" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
