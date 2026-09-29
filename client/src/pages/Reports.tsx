import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  FileText, 
  Users, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  CheckCircle2
} from 'lucide-react';
import { apiRequest, formatLKR } from '../api';

export const Reports: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [selectedReportId, setSelectedReportId] = useState('students');
  const [exportContent, setExportContent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiRequest('/reports/dashboard').then(res => setReportData(res));
  }, []);

  useEffect(() => {
    if (!selectedReportId) return;
    setLoading(true);
    apiRequest(`/reports/export/${selectedReportId}`)
      .then(res => setExportContent(res))
      .finally(() => setLoading(false));
  }, [selectedReportId]);

  const handleDownloadCSV = () => {
    if (!exportContent?.data || exportContent.data.length === 0) return;
    const items = exportContent.data;
    const headers = Object.keys(items[0]);
    const csvRows = [
      headers.join(','),
      ...items.map((row: any) => headers.map(h => `"${row[h] ?? ''}"`).join(','))
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedReportId}_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Report Center & Exports</h1>
          <p className="text-xs text-slate-500 mt-0.5">Generate exportable audit-ready spreadsheets, attendance ledgers, and profit & loss statements</p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleDownloadCSV}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download size={14} />
            <span>Download CSV</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Printer size={14} />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Selector List */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Available Master Reports</span>
          {reportData?.availableReports?.map((r: any) => (
            <div
              key={r.id}
              onClick={() => setSelectedReportId(r.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                selectedReportId === r.id
                  ? 'border-brand-500 bg-brand-50/60 shadow-sm'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{r.name}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Category: {r.category}</p>
            </div>
          ))}
        </div>

        {/* Report Preview Table */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">{exportContent?.title || 'Report Preview'}</h3>
              <p className="text-xs text-slate-500">{exportContent?.data?.length || 0} Records ready for export</p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">Loading report data...</div>
            ) : exportContent?.data?.length > 0 ? (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200 sticky top-0">
                  <tr>
                    {Object.keys(exportContent.data[0]).map((col) => (
                      <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {exportContent.data.map((row: any, i: number) => (
                    <tr key={i} className="hover:bg-slate-50/60">
                      {Object.keys(row).map((col) => (
                        <td key={col} className="py-2.5 px-3 whitespace-nowrap text-slate-800">
                          {typeof row[col] === 'number' && col.includes('Rs') ? formatLKR(row[col]) : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-16 text-center text-xs text-slate-400">No records found for this report.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
