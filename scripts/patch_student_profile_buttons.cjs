const fs = require('fs');
const path = require('path');

// 1. Update StudentProfileModal.tsx
const profileModalPath = path.join(__dirname, '..', 'client', 'src', 'components', 'StudentProfileModal.tsx');
let modalCode = fs.readFileSync(profileModalPath, 'utf8').replace(/\r\n/g, '\n');

// A. Add button to top action bar
const oldActionBar = `                <button
                  onClick={() => setIsAssignRfidOpen(true)}
                  className="px-3 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-indigo-400/30 shadow-sm"
                  title={student.rfidTag ? \`Current RFID: \${student.rfidTag}\` : 'Assign 125kHz RFID Card'}
                >
                  <Radio size={14} className={student.rfidTag ? 'text-emerald-400' : 'text-slate-300'} />
                  <span>{student.rfidTag ? \`RFID: \${student.rfidTag}\` : 'Assign RFID'}</span>
                </button>`;

const newActionBar = `                <button
                  onClick={() => setIsFaceEnrollOpen(true)}
                  className="px-3 py-2 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-purple-400/40 shadow-sm"
                  title={student.hasFaceEnrolled ? 'Face Enrolled: Update / Re-capture Biometric Template' : 'Enroll Face Recognition Biometrics'}
                >
                  <UserCheck size={14} className={student.hasFaceEnrolled ? 'text-emerald-400' : 'text-purple-300'} />
                  <span>{student.hasFaceEnrolled ? 'Face: Enrolled ✓' : '👤 Enroll Face'}</span>
                </button>
                <button
                  onClick={() => setIsAssignRfidOpen(true)}
                  className="px-3 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-indigo-400/30 shadow-sm"
                  title={student.rfidTag ? \`Current RFID: \${student.rfidTag}\` : 'Assign 125kHz RFID Card'}
                >
                  <Radio size={14} className={student.rfidTag ? 'text-emerald-400' : 'text-slate-300'} />
                  <span>{student.rfidTag ? \`RFID: \${student.rfidTag}\` : 'Assign RFID'}</span>
                </button>`;

if (modalCode.includes(oldActionBar)) {
  modalCode = modalCode.replace(oldActionBar, newActionBar);
  console.log('Top action bar Enroll Face button added');
} else {
  console.log('Top action bar target not found');
}

// B. Add Face Recognition Biometrics Section in Profile Details Card
const oldDetailsCardEnd = `                          <button
                            onClick={() => setIsAssignRfidOpen(true)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 transition-all"
                          >
                            <Radio size={12} />
                            <span>{student.rfidTag ? 'Reassign Card' : 'Assign Card'}</span>
                          </button>
                        </div>
                      </div>
                    </div>`;

const newDetailsCardEnd = `                          <button
                            onClick={() => setIsAssignRfidOpen(true)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 transition-all"
                          >
                            <Radio size={12} />
                            <span>{student.rfidTag ? 'Reassign Card' : 'Assign Card'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Face Recognition Biometrics Section */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className={\`w-9 h-9 rounded-xl flex items-center justify-center \${
                            student.hasFaceEnrolled ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-slate-200 text-slate-500'
                          }\`}>
                            <UserCheck size={18} />
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Face Recognition Biometrics</span>
                            <span className={\`text-xs font-bold \${student.hasFaceEnrolled ? 'text-emerald-700 flex items-center gap-1' : 'text-slate-500'}\`}>
                              {student.hasFaceEnrolled ? '✓ Biometric Template Enrolled & Active' : 'Not Enrolled Yet'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => setIsFaceEnrollOpen(true)}
                          className={\`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm \${
                            student.hasFaceEnrolled
                              ? 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-900/20'
                          }\`}
                        >
                          <UserCheck size={13} />
                          <span>{student.hasFaceEnrolled ? 'Update Face' : '👤 Enroll Face'}</span>
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Consent-based facial template for touchless gate check-in via PC webcam, Android phone or tablet camera.
                      </p>
                    </div>`;

if (modalCode.includes(oldDetailsCardEnd)) {
  modalCode = modalCode.replace(oldDetailsCardEnd, newDetailsCardEnd);
  console.log('Profile details Face Biometrics section added');
} else {
  console.log('Profile details target not found');
}

fs.writeFileSync(profileModalPath, modalCode.replace(/\n/g, '\r\n'), 'utf8');

// 2. Bump APP_BUILD_VERSION in client/src/main.tsx
const mainPath = path.join(__dirname, '..', 'client', 'src', 'main.tsx');
let mainCode = fs.readFileSync(mainPath, 'utf8').replace(/\r\n/g, '\n');
mainCode = mainCode.replace(/const APP_BUILD_VERSION = '[^']+';/, "const APP_BUILD_VERSION = '2026.10.24.v7';");
fs.writeFileSync(mainPath, mainCode.replace(/\n/g, '\r\n'), 'utf8');
console.log('main.tsx updated with new build version (2026.10.24.v7)');
