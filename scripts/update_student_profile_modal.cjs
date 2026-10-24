const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'client', 'src', 'components', 'StudentProfileModal.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Import FaceEnrollmentModal & UserCheck
if (!code.includes('FaceEnrollmentModal')) {
  code = code.replace(
    "import { AssignRFIDModal } from './AssignRFIDModal';",
    "import { AssignRFIDModal } from './AssignRFIDModal';\r\nimport { FaceEnrollmentModal } from './FaceEnrollmentModal';"
  );
}

if (!code.includes('UserCheck,')) {
  code = code.replace(
    '  User as UserIcon,',
    '  User as UserIcon,\r\n  UserCheck,'
  );
}

// 2. Add isFaceEnrollOpen state
if (!code.includes('isFaceEnrollOpen')) {
  code = code.replace(
    '  const [isAssignRfidOpen, setIsAssignRfidOpen] = useState(false);',
    '  const [isAssignRfidOpen, setIsAssignRfidOpen] = useState(false);\r\n  const [isFaceEnrollOpen, setIsFaceEnrollOpen] = useState(false);'
  );
}

// 3. Add Quick Action button for Face Biometric
const oldQuickActions = `<button
                  onClick={() => setIsAssignRfidOpen(true)}
                  className="px-3 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-indigo-400/30 shadow-sm"
                  title={student.rfidTag ? \`Current RFID: \${student.rfidTag}\` : 'Assign 125kHz RFID Card'}
                >
                  <Radio size={14} className={student.rfidTag ? 'text-emerald-400' : 'text-slate-300'} />
                  <span>{student.rfidTag ? \`RFID: \${student.rfidTag}\` : 'Assign RFID'}</span>
                </button>`;

const newQuickActions = `<button
                  onClick={() => setIsAssignRfidOpen(true)}
                  className="px-3 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-indigo-400/30 shadow-sm"
                  title={student.rfidTag ? \`Current RFID: \${student.rfidTag}\` : 'Assign 125kHz RFID Card'}
                >
                  <Radio size={14} className={student.rfidTag ? 'text-emerald-400' : 'text-slate-300'} />
                  <span>{student.rfidTag ? \`RFID: \${student.rfidTag}\` : 'Assign RFID'}</span>
                </button>
                <button
                  onClick={() => setIsFaceEnrollOpen(true)}
                  className="px-3 py-2 rounded-xl bg-purple-500/30 hover:bg-purple-500/40 text-purple-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-purple-400/30 shadow-sm cursor-pointer"
                  title={student.hasFaceEnrolled ? 'Face Template Enrolled' : 'Enroll Face Recognition'}
                >
                  <UserCheck size={14} className={student.hasFaceEnrolled ? 'text-emerald-400' : 'text-purple-300'} />
                  <span>{student.hasFaceEnrolled ? 'Face: Enrolled ✓' : 'Enroll Face'}</span>
                </button>`;

if (code.includes(oldQuickActions)) {
  code = code.replace(oldQuickActions, newQuickActions);
}

// 4. Add Biometric Card in Details tab
const oldRfidCard = `                          <button
                            onClick={() => setIsAssignRfidOpen(true)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 transition-all"
                          >
                            <Radio size={12} />
                            <span>{student.rfidTag ? 'Reassign Card' : 'Assign Card'}</span>
                          </button>
                        </div>
                      </div>
                    </div>`;

const newRfidCard = `                          <button
                            onClick={() => setIsAssignRfidOpen(true)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 transition-all"
                          >
                            <Radio size={12} />
                            <span>{student.rfidTag ? 'Reassign Card' : 'Assign Card'}</span>
                          </button>
                        </div>

                        {/* Face Recognition Biometrics */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Face Recognition Template</span>
                            {student.hasFaceEnrolled ? (
                              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 inline-flex items-center gap-1 mt-0.5 text-xs">
                                <UserCheck size={12} className="text-purple-600" />
                                <span>Biometric Enrolled ✓ (Consent Verified)</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">No Face Template Enrolled</span>
                            )}
                          </div>
                          <button
                            onClick={() => setIsFaceEnrollOpen(true)}
                            className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <UserCheck size={12} />
                            <span>{student.hasFaceEnrolled ? 'Re-enroll Face' : 'Enroll Face'}</span>
                          </button>
                        </div>
                      </div>
                    </div>`;

if (code.includes(oldRfidCard)) {
  code = code.replace(oldRfidCard, newRfidCard);
}

// 5. Render FaceEnrollmentModal
const oldAssignModal = `{/* Assign 125kHz RFID Card Modal */}`;
const newAssignModal = `{/* Face Recognition Biometric Enrollment Modal */}
      {isFaceEnrollOpen && student && (
        <FaceEnrollmentModal
          isOpen={isFaceEnrollOpen}
          student={student}
          onClose={() => setIsFaceEnrollOpen(false)}
          onEnrolledSuccess={() => {
            setStudent((prev: any) => ({ ...prev, hasFaceEnrolled: true }));
          }}
        />
      )}

      {/* Assign 125kHz RFID Card Modal */}`;

if (code.includes(oldAssignModal)) {
  code = code.replace(oldAssignModal, newAssignModal);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('StudentProfileModal.tsx updated with FaceEnrollmentModal');
