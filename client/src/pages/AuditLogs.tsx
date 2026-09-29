import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter } from 'lucide-react';
import { apiRequest, formatDate } from '../api';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        action: actionFilter,
        search
      });
      const data = await apiRequest(`/audit?${q.toString()}`);
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Security & Activity Audit Logs</h1>
        <p className="text-xs text-slate-500 mt-0.5">Immutable trace of user authentication, financial transactions, attendance records, and student profile changes</p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search action or user details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none"
        >
          <option value="ALL">All Actions</option>
          <option value="LOGIN">User Logins</option>
          <option value="PAYMENT_RECORD">Payment Processing</option>
          <option value="STUDENT_CREATE">Student Registrations</option>
          <option value="ATTENDANCE_SCAN">Attendance Scans</option>
          <option value="EXPENSE_CREATE">Expense Entries</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0">
              <tr>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">Loading audit trail...</td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">No audit events match your search.</td>
                </tr>
              ) : (
                logs.map((l: any) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-mono font-bold text-[10px]">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900">{l.userName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{l.userRole}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-md">
                      {l.details || 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[10px]">
                      {l.ipAddress || '127.0.0.1'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
