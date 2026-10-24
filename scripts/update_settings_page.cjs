const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '..', 'client', 'src', 'pages', 'Settings.tsx');
let code = fs.readFileSync(settingsPath, 'utf8');

if (!code.includes('UserCheck,')) {
  code = code.replace(
    '  ShieldCheck,',
    '  ShieldCheck,\r\n  UserCheck,'
  );
}

const attendanceConfigSection = `
        {/* ATTENDANCE SYSTEM & HARDWARE METHODS CONFIGURATION */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
                <UserCheck size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                  Attendance Methods & Hardware Devices
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enable or disable each of the 4 attendance methods (QR, Barcode, RFID & Face Recognition) and configure late arrival rules.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-[10px] font-black border border-purple-200 uppercase tracking-wider self-start sm:self-auto">
              4 Methods Supported
            </span>
          </div>

          {/* 4 Method Master Toggle Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. QR Code Attendance */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <QrCode size={16} className="text-emerald-600" />
                  <span>QR Code Pass</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('ATTENDANCE_METHOD_QR', settings.ATTENDANCE_METHOD_QR === 'false' ? 'true' : 'false', 'QR Attendance')}
                  disabled={togglingKey === 'ATTENDANCE_METHOD_QR'}
                  className={\`px-3 py-1 rounded-xl text-xs font-extrabold transition-all \${
                    settings.ATTENDANCE_METHOD_QR !== 'false'
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }\`}
                >
                  {togglingKey === 'ATTENDANCE_METHOD_QR' ? '...' : (settings.ATTENDANCE_METHOD_QR !== 'false' ? 'ENABLED' : 'DISABLED')}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Camera scan of student printed ID cards & mobile digital pass.
              </p>
            </div>

            {/* 2. Barcode Reader */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Zap size={16} className="text-amber-600" />
                  <span>Barcode Gun</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('ATTENDANCE_METHOD_BARCODE', settings.ATTENDANCE_METHOD_BARCODE === 'false' ? 'true' : 'false', 'Barcode Attendance')}
                  disabled={togglingKey === 'ATTENDANCE_METHOD_BARCODE'}
                  className={\`px-3 py-1 rounded-xl text-xs font-extrabold transition-all \${
                    settings.ATTENDANCE_METHOD_BARCODE !== 'false'
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }\`}
                >
                  {togglingKey === 'ATTENDANCE_METHOD_BARCODE' ? '...' : (settings.ATTENDANCE_METHOD_BARCODE !== 'false' ? 'ENABLED' : 'DISABLED')}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                USB & Bluetooth 1D/2D laser barcode scanners (keyboard wedge).
              </p>
            </div>

            {/* 3. 125kHz RFID */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Radio size={16} className="text-indigo-600" />
                  <span>125kHz RFID</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('ATTENDANCE_METHOD_RFID', settings.ATTENDANCE_METHOD_RFID === 'false' ? 'true' : 'false', 'RFID Attendance')}
                  disabled={togglingKey === 'ATTENDANCE_METHOD_RFID'}
                  className={\`px-3 py-1 rounded-xl text-xs font-extrabold transition-all \${
                    settings.ATTENDANCE_METHOD_RFID !== 'false'
                      ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }\`}
                >
                  {togglingKey === 'ATTENDANCE_METHOD_RFID' ? '...' : (settings.ATTENDANCE_METHOD_RFID !== 'false' ? 'ENABLED' : 'DISABLED')}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Contactless smart card and keyfob reader hardware.
              </p>
            </div>

            {/* 4. Face Recognition */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck size={16} className="text-purple-600" />
                  <span>Face Recognition</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleToggle('ATTENDANCE_METHOD_FACE', settings.ATTENDANCE_METHOD_FACE === 'false' ? 'true' : 'false', 'Face Recognition')}
                  disabled={togglingKey === 'ATTENDANCE_METHOD_FACE'}
                  className={\`px-3 py-1 rounded-xl text-xs font-extrabold transition-all \${
                    settings.ATTENDANCE_METHOD_FACE !== 'false'
                      ? 'bg-purple-600 text-white shadow-sm ring-1 ring-purple-400'
                      : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                  }\`}
                >
                  {togglingKey === 'ATTENDANCE_METHOD_FACE' ? '...' : (settings.ATTENDANCE_METHOD_FACE !== 'false' ? 'ENABLED' : 'DISABLED')}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Neural face matching on PC USB webcams & Android tablets.
              </p>
            </div>
          </div>

          {/* Granular Biometrics & Late Rule Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Face Match Threshold (Distance)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.20"
                max="0.80"
                value={settings.FACE_MATCH_THRESHOLD || '0.45'}
                onChange={(e) => handleChange('FACE_MATCH_THRESHOLD', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Lower = stricter exact match (Default: 0.45 / 85% similarity).</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Manual Review Threshold
              </label>
              <input
                type="number"
                step="0.01"
                min="0.30"
                max="0.90"
                value={settings.FACE_REVIEW_THRESHOLD || '0.58'}
                onChange={(e) => handleChange('FACE_REVIEW_THRESHOLD', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Prompt staff for 1-tap confirmation if between match & review threshold.</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Late Arrival Grace Period (Minutes)
              </label>
              <input
                type="number"
                min="0"
                max="120"
                value={settings.LATE_THRESHOLD_MINUTES || '15'}
                onChange={(e) => handleChange('LATE_THRESHOLD_MINUTES', e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-mono font-bold bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Mark attendance as LATE if arriving after class startTime + minutes.</p>
            </div>
          </div>
        </div>
`;

if (!code.includes('Attendance Methods & Hardware Devices')) {
  code = code.replace(
    '{/* MASTER NOTIFICATION CONTROLS: SMS ON/OFF & WHATSAPP TOGGLE */}',
    attendanceConfigSection + '\r\n        {/* MASTER NOTIFICATION CONTROLS: SMS ON/OFF & WHATSAPP TOGGLE */}'
  );
}

fs.writeFileSync(settingsPath, code, 'utf8');
console.log('Settings.tsx updated with attendance method admin controls');
