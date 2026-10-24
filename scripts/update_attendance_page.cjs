const fs = require('fs');
const path = require('path');

const attPath = path.join(__dirname, '..', 'client', 'src', 'pages', 'Attendance.tsx');
let code = fs.readFileSync(attPath, 'utf8');

// 1. Imports
if (!code.includes('FaceScannerModal')) {
  code = code.replace(
    "import { QRScannerModal } from '../components/QRScannerModal';",
    "import { QRScannerModal } from '../components/QRScannerModal';\r\nimport { FaceScannerModal } from '../components/FaceScannerModal';"
  );
}

if (!code.includes('UserCheck,')) {
  code = code.replace(
    '  BookOpen,\r\n  GraduationCap\r\n} from \'lucide-react\';',
    '  BookOpen,\r\n  GraduationCap,\r\n  UserCheck\r\n} from \'lucide-react\';'
  );
}

// 2. State
if (!code.includes('isFaceScannerModalOpen')) {
  code = code.replace(
    "const [isScannerModalOpen, setIsScannerModalOpen] = useState(autoOpenScanner);",
    "const [isScannerModalOpen, setIsScannerModalOpen] = useState(autoOpenScanner);\r\n  const [isFaceScannerModalOpen, setIsFaceScannerModalOpen] = useState(false);\r\n  const [rosterMethodFilter, setRosterMethodFilter] = useState<string>('ALL');"
  );
}

// 3. filteredRoster
if (!code.includes("if (rosterMethodFilter !== 'ALL'")) {
  code = code.replace(
    "    if (rosterFeeFilter === 'PENDING' && !item.feeInfo?.hasPendingFees) {\r\n      return false;\r\n    }",
    "    if (rosterFeeFilter === 'PENDING' && !item.feeInfo?.hasPendingFees) {\r\n      return false;\r\n    }\r\n    if (rosterMethodFilter !== 'ALL' && (item.method || 'QR_CODE') !== rosterMethodFilter) {\r\n      return false;\r\n    }"
  );
}

// 4. Face Recognition Button in scanner viewport controls
const oldButtons = `              {/* PRIMARY PROMINENT: Dedicated Mobile Camera QR Scanner Popup (Continuous) */}
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsScannerModalOpen(true);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#0055FF] hover:bg-[#0044CC] text-white text-xs sm:text-sm font-bold shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Smartphone size={18} />
                <span>📱 Open Continuous Camera QR Scanner (Popup)</span>
              </button>`;

const newButtons = `              {/* 4TH METHOD: Dedicated Face Recognition Attendance Scanner */}
              {settings.ATTENDANCE_METHOD_FACE !== 'false' && (
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsFaceScannerModalOpen(true);
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 hover:from-purple-600 hover:to-blue-600 text-white text-xs sm:text-sm font-bold shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <UserCheck size={18} />
                  <span>👤 Open Face Recognition Attendance (Webcam / Tablet)</span>
                </button>
              )}

              {/* PRIMARY PROMINENT: Dedicated Mobile Camera QR Scanner Popup (Continuous) */}
              {settings.ATTENDANCE_METHOD_QR !== 'false' && (
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsScannerModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#0055FF] hover:bg-[#0044CC] text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                >
                  <Smartphone size={17} />
                  <span>📱 Open Camera QR Scanner (Popup)</span>
                </button>
              )}`;

if (code.includes(oldButtons)) {
  code = code.replace(oldButtons, newButtons);
}

// 5. Hardware POS breakdown in roster stats
const oldStatsPos = `<div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300"><Radio size={10} className="text-sky-400" /> 125kHz RFID:</span>
                  <span className="font-mono bg-slate-800 px-1.5 py-0.2 rounded font-bold">{rosterData?.stats?.methodsBreakdown?.RFID || 0}</span>
                </div>`;

const newStatsPos = `<div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-slate-300"><Radio size={10} className="text-sky-400" /> 125kHz RFID:</span>
                  <span className="font-mono bg-slate-800 px-1.5 py-0.2 rounded font-bold">{rosterData?.stats?.methodsBreakdown?.RFID || 0}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1 text-purple-300"><UserCheck size={10} className="text-purple-400" /> Face Rec:</span>
                  <span className="font-mono bg-slate-800 px-1.5 py-0.2 rounded font-bold text-purple-300">{rosterData?.stats?.methodsBreakdown?.FACE || 0}</span>
                </div>`;

if (code.includes(oldStatsPos)) {
  code = code.replace(oldStatsPos, newStatsPos);
}

// 6. Roster Method Filter dropdown in toolbar
const oldRosterFilterBlock = `                {/* Fee Status Filter */}
                <select
                  value={rosterFeeFilter}
                  onChange={(e: any) => setRosterFeeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Fee Status</option>
                  <option value="PAID">Fees Clear ✓</option>
                  <option value="PENDING">Fees Pending ⚠️</option>
                </select>`;

const newRosterFilterBlock = `                {/* Fee Status Filter */}
                <select
                  value={rosterFeeFilter}
                  onChange={(e: any) => setRosterFeeFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">All Fee Status</option>
                  <option value="PAID">Fees Clear ✓</option>
                  <option value="PENDING">Fees Pending ⚠️</option>
                </select>

                {/* Method Filter */}
                <select
                  value={rosterMethodFilter}
                  onChange={(e: any) => setRosterMethodFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold text-purple-900 focus:outline-none"
                >
                  <option value="ALL">All Methods</option>
                  <option value="FACE">👤 Face Rec</option>
                  <option value="QR_CODE">📱 QR Pass</option>
                  <option value="BARCODE">⚡ Barcode</option>
                  <option value="RFID">🏷️ 125kHz RFID</option>
                  <option value="MANUAL">✍️ Manual</option>
                </select>`;

if (code.includes(oldRosterFilterBlock)) {
  code = code.replace(oldRosterFilterBlock, newRosterFilterBlock);
}

// 7. Method badge in card view
const oldCardMethodBadge = `{/* Method badge */}
                        {item.method === 'BARCODE' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                            <Zap size={10} className="text-amber-600" />
                            <span>Barcode Gun</span>
                          </span>
                        ) : item.method === 'RFID' ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold flex items-center gap-1">
                            <Radio size={10} className="text-indigo-600" />
                            <span>125kHz RFID</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                            <QrCode size={10} className="text-emerald-600" />
                            <span>QR Pass</span>
                          </span>
                        )}`;

const newCardMethodBadge = `{/* Method badge */}
                        {item.method === 'FACE' ? (
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-bold flex items-center gap-1">
                            <UserCheck size={10} className="text-purple-600" />
                            <span>Face Rec {item.reviewStatus === 'MANUAL_CONFIRMED' ? '(Review ✓)' : ''}</span>
                          </span>
                        ) : item.method === 'BARCODE' ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold flex items-center gap-1">
                            <Zap size={10} className="text-amber-600" />
                            <span>Barcode Gun</span>
                          </span>
                        ) : item.method === 'RFID' ? (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold flex items-center gap-1">
                            <Radio size={10} className="text-indigo-600" />
                            <span>125kHz RFID</span>
                          </span>
                        ) : item.method === 'MANUAL' ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold flex items-center gap-1">
                            <span>✍️ Manual</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                            <QrCode size={10} className="text-emerald-600" />
                            <span>QR Pass</span>
                          </span>
                        )}`;

if (code.includes(oldCardMethodBadge)) {
  code = code.replace(oldCardMethodBadge, newCardMethodBadge);
}

// 8. Method badge in table view
const oldTableMethod = "{item.method === 'BARCODE' ? '⚡ Barcode Gun' : item.method === 'RFID' ? '🏷️ 125kHz RFID' : '📱 QR Pass'}";
const newTableMethod = "{item.method === 'FACE' ? '👤 Face Rec' : item.method === 'BARCODE' ? '⚡ Barcode Gun' : item.method === 'RFID' ? '🏷️ 125kHz RFID' : item.method === 'MANUAL' ? '✍️ Manual' : '📱 QR Pass'}";

code = code.replace(oldTableMethod, newTableMethod);

// 9. Render FaceScannerModal
const oldQrModal = `<QRScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScanSuccess={handlePerformScan}
        selectedClassName={currentClass?.name}
        selectedDate={selectedDate}
        onOpenPaymentModal={onOpenPaymentModal}
      />`;

const newQrModal = `<QRScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        onScanSuccess={handlePerformScan}
        selectedClassName={currentClass?.name}
        selectedDate={selectedDate}
        onOpenPaymentModal={onOpenPaymentModal}
      />

      {/* 4th Method: Dedicated Face Recognition Attendance Scanner Modal */}
      <FaceScannerModal
        isOpen={isFaceScannerModalOpen}
        onClose={() => setIsFaceScannerModalOpen(false)}
        selectedClassId={selectedClassId}
        selectedClassName={currentClass?.name}
        selectedDate={selectedDate}
        onOpenPaymentModal={onOpenPaymentModal}
      />`;

code = code.replace(oldQrModal, newQrModal);

fs.writeFileSync(attPath, code, 'utf8');
console.log('Attendance.tsx updated with FaceScannerModal and method filtering');
