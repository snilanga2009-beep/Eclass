const fs = require('fs');
const path = require('path');

// ============================================================
// 1. UPDATE LOGIN.TSX
// ============================================================
const loginPath = path.join(__dirname, '..', 'client', 'src', 'pages', 'Login.tsx');
let loginCode = fs.readFileSync(loginPath, 'utf8').replace(/\r\n/g, '\n');

// A. Default loginMode to 'staff' if on PC or no parent query param
loginCode = loginCode.replace(
  "const [loginMode, setLoginMode] = useState<'parent' | 'staff'>('parent');",
  `const [loginMode, setLoginMode] = useState<'parent' | 'staff'>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('phone') || new URLSearchParams(window.location.search).get('parentPhone');
      if (p) return 'parent';
      return 'staff';
    }
    return 'staff';
  });`
);

// B. In the Mode Switcher, make Staff button default active and add an Admin & Teacher Help Banner
const oldModeSwitcher = `            {/* Mode Switcher Pill Buttons (Clean White & Royal Blue Style) */}
            <div className="grid grid-cols-2 gap-2.5 p-1.5 rounded-full bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('parent');
                  setError(null);
                }}
                className={\`py-2.5 px-4 rounded-full text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 cursor-pointer \${
                  loginMode === 'parent'
                    ? 'bg-[#0055FF] text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
              >
                <Users size={15} />
                <span>Parent App</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMode('staff');
                  setError(null);
                }}
                className={\`py-2.5 px-4 rounded-full text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 cursor-pointer \${
                  loginMode === 'staff'
                    ? 'bg-[#0055FF] text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
              >
                <Building2 size={15} />
                <span>Staff / PC Login</span>
              </button>
            </div>`;

const newModeSwitcher = `            {/* Mode Switcher Pill Buttons (Clean White & Royal Blue Style) */}
            <div className="grid grid-cols-2 gap-2.5 p-1.5 rounded-full bg-slate-100 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setLoginMode('staff');
                  setError(null);
                }}
                className={\`py-2.5 px-4 rounded-full text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 cursor-pointer \${
                  loginMode === 'staff'
                    ? 'bg-[#0055FF] text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
              >
                <Building2 size={15} />
                <span>Admin & Staff Login</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMode('parent');
                  setError(null);
                }}
                className={\`py-2.5 px-4 rounded-full text-xs font-extrabold transition-all flex items-center justify-center space-x-1.5 cursor-pointer \${
                  loginMode === 'parent'
                    ? 'bg-[#0055FF] text-white shadow-md shadow-blue-500/30'
                    : 'text-slate-600 hover:text-slate-900'
                }\`}
              >
                <Users size={15} />
                <span>Parent App</span>
              </button>
            </div>

            {/* Quick Helper Banner for Admin / Teacher Access */}
            <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100 text-left flex items-start gap-2">
              <ShieldCheck size={16} className="text-[#0055FF] shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-700 leading-snug">
                <strong className="text-slate-900 font-bold">Admin & Teacher Sign In:</strong> Tap <span className="font-mono text-[#0055FF] font-bold">Campus Admin</span> below or enter <span className="font-mono text-slate-900 font-bold">admin</span> / <span className="font-mono text-slate-900 font-bold">password123</span> to manage students, attendance and face recognition.
              </p>
            </div>`;

if (loginCode.includes(oldModeSwitcher)) {
  loginCode = loginCode.replace(oldModeSwitcher, newModeSwitcher);
  console.log('Login.tsx mode switcher updated with Staff/Admin priority');
} else {
  console.log('Login.tsx mode switcher target not found');
}

fs.writeFileSync(loginPath, loginCode.replace(/\n/g, '\r\n'), 'utf8');

// ============================================================
// 2. UPDATE STUDENTS.TSX
// ============================================================
const studentsPath = path.join(__dirname, '..', 'client', 'src', 'pages', 'Students.tsx');
let studentsCode = fs.readFileSync(studentsPath, 'utf8').replace(/\r\n/g, '\n');

// A. Add UserCheck import if not present and FaceEnrollmentModal import
if (!studentsCode.includes("import { FaceEnrollmentModal } from '../components/FaceEnrollmentModal';")) {
  studentsCode = studentsCode.replace(
    "import { AssignRFIDModal } from '../components/AssignRFIDModal';",
    "import { AssignRFIDModal } from '../components/AssignRFIDModal';\nimport { FaceEnrollmentModal } from '../components/FaceEnrollmentModal';"
  );
  console.log('FaceEnrollmentModal imported in Students.tsx');
}

// B. Add UserCheck icon to lucide-react imports
if (!studentsCode.includes('UserCheck,')) {
  studentsCode = studentsCode.replace('UserPlus,', 'UserPlus,\n  UserCheck,');
  console.log('UserCheck icon added in Students.tsx');
}

// C. Add state variables for Face enrollment in Students.tsx
const oldStateBlock = `  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);`;

const newStateBlock = `  // Face Recognition Biometric States
  const [faceEnrollStudent, setFaceEnrollStudent] = useState<any | null>(null);
  const [enrollFaceNowChoice, setEnrollFaceNowChoice] = useState<'NOW' | 'LATER'>('NOW');
  const [faceFilter, setFaceFilter] = useState<'ALL' | 'ENROLLED' | 'MISSING'>('ALL');

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);`;

if (studentsCode.includes(oldStateBlock)) {
  studentsCode = studentsCode.replace(oldStateBlock, newStateBlock);
  console.log('Students.tsx face states added');
}

// D. Update handleAddSubmit to immediately open FaceEnrollmentModal if enrollFaceNowChoice === 'NOW'
const oldSubmitEnd = `      const created = await apiRequest<any>('/students', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setIsAddModalOpen(false);`;

const newSubmitEnd = `      const created = await apiRequest<any>('/students', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setIsAddModalOpen(false);
      // If staff chose to capture face right now, open FaceEnrollmentModal immediately
      if (enrollFaceNowChoice === 'NOW' && created) {
        setFaceEnrollStudent(created);
      }`;

if (studentsCode.includes(oldSubmitEnd)) {
  studentsCode = studentsCode.replace(oldSubmitEnd, newSubmitEnd);
  console.log('Students.tsx handleAddSubmit updated to open FaceEnrollmentModal');
}

// E. Add Face Recognition choice in Register Student Modal form
const oldRfidFormSection = `                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    125kHz RFID Card UID (Optional)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Tap card on USB reader or enter UID (e.g. 0004928172)..."
                      value={formData.rfidTag}
                      onChange={(e) => setFormData({ ...formData, rfidTag: e.target.value })}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold flex items-center gap-1 shrink-0">
                      <Radio size={14} className="text-emerald-500" />
                      <span>Tap Reader</span>
                    </span>
                  </div>
                </div>`;

const newRfidFormSection = `                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    125kHz RFID Card UID (Optional)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Tap card on USB reader or enter UID (e.g. 0004928172)..."
                      value={formData.rfidTag}
                      onChange={(e) => setFormData({ ...formData, rfidTag: e.target.value })}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold flex items-center gap-1 shrink-0">
                      <Radio size={14} className="text-emerald-500" />
                      <span>Tap Reader</span>
                    </span>
                  </div>
                </div>

                {/* Face Recognition Biometrics (Enroll Now vs Add Later) */}
                <div className="sm:col-span-2 p-4 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                      <UserCheck size={16} className="text-purple-600" />
                      <span>Face Recognition Biometrics</span>
                    </span>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900 uppercase tracking-wider">
                      Webcam / Phone Camera
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-900 leading-snug">
                    Would you like to enroll this student's face recognition template now, or register the student and add their face later?
                  </p>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEnrollFaceNowChoice('NOW')}
                      className={\`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer \${
                        enrollFaceNowChoice === 'NOW'
                          ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300'
                          : 'bg-white text-slate-700 hover:bg-purple-100/50 border border-purple-200'
                      }\`}
                    >
                      <Camera size={14} />
                      <span>Enroll Face Now</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEnrollFaceNowChoice('LATER')}
                      className={\`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer \${
                        enrollFaceNowChoice === 'LATER'
                          ? 'bg-purple-600 text-white shadow-md ring-2 ring-purple-300'
                          : 'bg-white text-slate-700 hover:bg-purple-100/50 border border-purple-200'
                      }\`}
                    >
                      <Clock size={14} />
                      <span>Skip / Add Later</span>
                    </button>
                  </div>
                  {enrollFaceNowChoice === 'NOW' ? (
                    <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 pt-0.5">
                      <span>✓ Camera will automatically open to capture face right after clicking "Register Student".</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 pt-0.5">
                      <span>ℹ️ Student will be saved now. You or any teacher can enroll their face later anytime with 1 click.</span>
                    </p>
                  )}
                </div>`;

if (studentsCode.includes(oldRfidFormSection)) {
  studentsCode = studentsCode.replace(oldRfidFormSection, newRfidFormSection);
  console.log('Students.tsx register modal face section added');
}

// F. In the Desktop Table row, add Face status badge next to RFID
const oldTableRowRfid = `                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">{s.studentIdNumber}</span>
                            {s.rfidTag ? (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[9px] font-bold border border-indigo-200 flex items-center gap-0.5" title={\`125kHz RFID: \${s.rfidTag}\`}>
                                <Radio size={9} />
                                <span>{s.rfidTag}</span>
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAssignRfidStudent(s);
                                }}
                                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-500 font-mono text-[9px] font-semibold border border-slate-200 flex items-center gap-0.5 transition-all"
                                title="Click to assign 125kHz RFID Card"
                              >
                                <Radio size={9} />
                                <span>+RFID</span>
                              </button>
                            )}
                          </div>`;

const newTableRowRfid = `                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-mono">{s.studentIdNumber}</span>
                            {s.rfidTag ? (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[9px] font-bold border border-indigo-200 flex items-center gap-0.5" title={\`125kHz RFID: \${s.rfidTag}\`}>
                                <Radio size={9} />
                                <span>{s.rfidTag}</span>
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAssignRfidStudent(s);
                                }}
                                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-500 font-mono text-[9px] font-semibold border border-slate-200 flex items-center gap-0.5 transition-all cursor-pointer"
                                title="Click to assign 125kHz RFID Card"
                              >
                                <Radio size={9} />
                                <span>+RFID</span>
                              </button>
                            )}

                            {/* 1-Click Face Status & Registration Button */}
                            {s.hasFaceEnrolled ? (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFaceEnrollStudent(s);
                                }}
                                className="px-1.5 py-0.5 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[9px] border border-purple-200/80 flex items-center gap-0.5 transition-all cursor-pointer shadow-xs"
                                title="Face Enrolled ✓ - Click to update / re-capture face biometric template"
                              >
                                <UserCheck size={10} className="text-purple-600" />
                                <span>Face: ✓</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFaceEnrollStudent(s);
                                }}
                                className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-purple-600 hover:text-white text-amber-800 font-bold text-[9px] border border-amber-200 hover:border-purple-600 flex items-center gap-0.5 transition-all cursor-pointer shadow-xs"
                                title="Click to enroll face recognition template via webcam or camera"
                              >
                                <UserCheck size={10} />
                                <span>+ Enroll Face</span>
                              </button>
                            )}
                          </div>`;

if (studentsCode.includes(oldTableRowRfid)) {
  studentsCode = studentsCode.replace(oldTableRowRfid, newTableRowRfid);
  console.log('Students.tsx table row face button added');
}

// G. In Mobile Touch Card actions, add 1-click Face button
const oldMobileActions = `                  <button
                    onClick={() => onOpenProfile(s.id)}
                    className="py-2 px-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye size={12} />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => onOpenIDCard(s.id)}
                    className="py-2 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <QrCode size={13} />
                    <span>ID Pass</span>
                  </button>`;

const newMobileActions = `                  <button
                    onClick={() => onOpenProfile(s.id)}
                    className="py-2 px-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <Eye size={12} />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => setFaceEnrollStudent(s)}
                    className={\`py-2 px-1 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer \${
                      s.hasFaceEnrolled
                        ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                    }\`}
                    title={s.hasFaceEnrolled ? 'Update Face' : 'Enroll Face'}
                  >
                    <UserCheck size={12} />
                    <span>{s.hasFaceEnrolled ? 'Face ✓' : '+ Face'}</span>
                  </button>

                  <button
                    onClick={() => onOpenIDCard(s.id)}
                    className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <QrCode size={13} />
                    <span>ID Pass</span>
                  </button>`;

if (studentsCode.includes(oldMobileActions)) {
  studentsCode = studentsCode.replace(oldMobileActions, newMobileActions);
  console.log('Students.tsx mobile touch card face button added');
}

// H. Mount FaceEnrollmentModal at the bottom of Students.tsx
const oldStudentsClosing = `      {/* EDIT STUDENT FULL MODAL */}
      {editingStudent && (
        <EditStudentModal
          isOpen={!!editingStudent}
          student={editingStudent}
          classes={classes}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            fetchStudents();
            setEditingStudent(null);
          }}
        />
      )}
    </div>`;

const newStudentsClosing = `      {/* EDIT STUDENT FULL MODAL */}
      {editingStudent && (
        <EditStudentModal
          isOpen={!!editingStudent}
          student={editingStudent}
          classes={classes}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => {
            fetchStudents();
            setEditingStudent(null);
          }}
        />
      )}

      {/* FACE RECOGNITION BIOMETRIC ENROLLMENT MODAL */}
      {faceEnrollStudent && (
        <FaceEnrollmentModal
          isOpen={!!faceEnrollStudent}
          student={faceEnrollStudent}
          onClose={() => setFaceEnrollStudent(null)}
          onEnrolledSuccess={() => {
            setFaceEnrollStudent(null);
            fetchStudents();
          }}
        />
      )}
    </div>`;

if (studentsCode.includes(oldStudentsClosing)) {
  studentsCode = studentsCode.replace(oldStudentsClosing, newStudentsClosing);
  console.log('FaceEnrollmentModal mounted at bottom of Students.tsx');
}

fs.writeFileSync(studentsPath, studentsCode.replace(/\n/g, '\r\n'), 'utf8');
console.log('Students.tsx patched successfully');
