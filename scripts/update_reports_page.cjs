const fs = require('fs');
const path = require('path');

const reportsPath = path.join(__dirname, '..', 'client', 'src', 'pages', 'Reports.tsx');
let code = fs.readFileSync(reportsPath, 'utf8');

// 1. Add attendanceMethodFilter state
if (!code.includes('attendanceMethodFilter')) {
  code = code.replace(
    "const [exportLoading, setExportLoading] = useState(false);",
    "const [exportLoading, setExportLoading] = useState(false);\r\n  const [attendanceMethodFilter, setAttendanceMethodFilter] = useState<string>('ALL');"
  );
}

// 2. Update Fetch Master Export Table to pass method query when reportId is attendance
const oldExportFetch = `  useEffect(() => {
    if (!selectedReportId || activeView !== 'master-reports') return;
    setExportLoading(true);
    apiRequest(\`/reports/export/\${selectedReportId}\`)
      .then(res => setExportContent(res))
      .finally(() => setExportLoading(false));
  }, [selectedReportId, activeView]);`;

const newExportFetch = `  useEffect(() => {
    if (!selectedReportId || activeView !== 'master-reports') return;
    setExportLoading(true);
    const query = selectedReportId === 'attendance' && attendanceMethodFilter !== 'ALL'
      ? \`?method=\${attendanceMethodFilter}\`
      : '';
    apiRequest(\`/reports/export/\${selectedReportId}\${query}\`)
      .then(res => setExportContent(res))
      .finally(() => setExportLoading(false));
  }, [selectedReportId, activeView, attendanceMethodFilter]);`;

code = code.replace(oldExportFetch, newExportFetch);

// 3. In the report preview header, add method filter if selectedReportId === 'attendance'
const oldPreviewHeader = `            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{exportContent?.title || 'Report Preview'}</h3>
                <p className="text-xs text-slate-500">{exportContent?.data?.length || 0} Records ready for export</p>
              </div>
            </div>`;

const newPreviewHeader = `            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{exportContent?.title || 'Report Preview'}</h3>
                <p className="text-xs text-slate-500">{exportContent?.data?.length || 0} Records ready for export</p>
              </div>

              {selectedReportId === 'attendance' && (
                <div className="flex items-center space-x-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Method:</span>
                  <select
                    value={attendanceMethodFilter}
                    onChange={(e) => setAttendanceMethodFilter(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 text-purple-900 focus:outline-none"
                  >
                    <option value="ALL">All Methods</option>
                    <option value="FACE">👤 Face Rec</option>
                    <option value="QR_CODE">📱 QR Pass</option>
                    <option value="BARCODE">⚡ Barcode</option>
                    <option value="RFID">🏷️ 125kHz RFID</option>
                    <option value="MANUAL">✍️ Manual</option>
                  </select>
                </div>
              )}
            </div>`;

code = code.replace(oldPreviewHeader, newPreviewHeader);

fs.writeFileSync(reportsPath, code, 'utf8');
console.log('Reports.tsx updated with attendance method filter');
