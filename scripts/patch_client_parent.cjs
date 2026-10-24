const fs = require('fs');
const path = require('path');

// 1. Patch StudentProfileModal.tsx
const spmPath = path.resolve('client/src/components/StudentProfileModal.tsx');
let spmContent = fs.readFileSync(spmPath, 'utf8');

const oldSpmSuccess = `          onSuccess={(updatedStudent) => {
            setStudent((prev: any) => ({ ...prev, ...updatedStudent }));
          }}`;

const newSpmSuccess = `          onSuccess={(updatedStudent) => {
            setStudent((prev: any) => ({
              ...prev,
              ...updatedStudent,
              parentName: updatedStudent.parentName || updatedStudent.parent?.name || prev?.parentName,
              parentPhone: updatedStudent.parentPhone || updatedStudent.parent?.phone || prev?.parentPhone,
              parent: updatedStudent.parent || (updatedStudent.parentName || updatedStudent.parentPhone ? {
                id: updatedStudent.parentId || prev?.parent?.id,
                name: updatedStudent.parentName || prev?.parent?.name,
                phone: updatedStudent.parentPhone || prev?.parent?.phone,
                whatsapp: updatedStudent.whatsapp || prev?.parent?.whatsapp
              } : prev?.parent)
            }));
            if (student?.id) {
              apiRequest(\`/students/\${student.id}\`)
                .then(fresh => {
                  if (fresh) setStudent(fresh);
                })
                .catch(err => console.warn('Could not refresh student deep profile:', err));
            }
          }}`;

const isSpmCRLF = spmContent.includes('\r\n');
let spmNorm = spmContent.replace(/\r\n/g, '\n');

if (spmNorm.includes(oldSpmSuccess.replace(/\r\n/g, '\n'))) {
  spmNorm = spmNorm.replace(oldSpmSuccess.replace(/\r\n/g, '\n'), newSpmSuccess.replace(/\r\n/g, '\n'));
  fs.writeFileSync(spmPath, isSpmCRLF ? spmNorm.replace(/\n/g, '\r\n') : spmNorm, 'utf8');
  console.log('Patched StudentProfileModal.tsx');
} else {
  console.warn('StudentProfileModal.tsx target not found');
}

// 2. Patch EditStudentModal.tsx
const esmPath = path.resolve('client/src/components/EditStudentModal.tsx');
let esmContent = fs.readFileSync(esmPath, 'utf8');
const isEsmCRLF = esmContent.includes('\r\n');
let esmNorm = esmContent.replace(/\r\n/g, '\n');

const oldEsmFetch = `      // Refresh student details from server to ensure complete enrollments list
      apiRequest<any>(\`/students/\${student.id}\`)
        .then(fresh => {
          if (fresh && Array.isArray(fresh.enrollments)) {
            const freshIds = fresh.enrollments
              .filter((e: any) => e.status !== 'INACTIVE')
              .map((e: any) => e.classId || e.class?.id)
              .filter(Boolean);
            setFormData(prev => ({ ...prev, enrolledClassIds: freshIds }));
          }
        })
        .catch(err => console.warn('Could not refresh student enrollments:', err));`;

const newEsmFetch = `      // Refresh student details from server to ensure complete enrollments list and latest parent details
      apiRequest<any>(\`/students/\${student.id}\`)
        .then(fresh => {
          if (fresh) {
            const freshClassIds = Array.isArray(fresh.enrollments)
              ? fresh.enrollments
                  .filter((e: any) => e.status !== 'INACTIVE')
                  .map((e: any) => e.classId || e.class?.id)
                  .filter(Boolean)
              : undefined;

            setFormData(prev => ({
              ...prev,
              ...(freshClassIds ? { enrolledClassIds: freshClassIds } : {}),
              parentName: prev.parentName || fresh.parentName || fresh.parent?.name || '',
              parentPhone: prev.parentPhone || fresh.parentPhone || fresh.parent?.phone || ''
            }));
          }
        })
        .catch(err => console.warn('Could not refresh student enrollments:', err));`;

if (esmNorm.includes(oldEsmFetch.replace(/\r\n/g, '\n'))) {
  esmNorm = esmNorm.replace(oldEsmFetch.replace(/\r\n/g, '\n'), newEsmFetch.replace(/\r\n/g, '\n'));
  console.log('Patched EditStudentModal.tsx fetch logic');
} else {
  console.warn('EditStudentModal.tsx fetch logic target not found');
}

// Add multi-student sibling badge in Section 2 of EditStudentModal
const oldEsmSection2Notice = `            <p className="text-[11px] text-amber-800 leading-relaxed">
              This mobile number receives automated attendance check-in SMS, fee receipts, and serves as the <strong>Parent Portal PWA Login</strong> phone.
            </p>`;

const newEsmSection2Notice = `            <p className="text-[11px] text-amber-800 leading-relaxed">
              This mobile number receives automated attendance check-in SMS, fee receipts, and serves as the <strong>Parent Portal PWA Login</strong> phone.
            </p>
            <div className="p-2.5 rounded-xl bg-amber-100/70 border border-amber-300/80 flex items-center gap-2 text-[11px] text-amber-900 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
              <span><strong>Siblings & Multi-Student Family:</strong> Multiple students can share the same parent phone number. Both will be linked to this guardian portal account.</span>
            </div>`;

if (esmNorm.includes(oldEsmSection2Notice.replace(/\r\n/g, '\n'))) {
  esmNorm = esmNorm.replace(oldEsmSection2Notice.replace(/\r\n/g, '\n'), newEsmSection2Notice.replace(/\r\n/g, '\n'));
  console.log('Patched EditStudentModal.tsx multi-student notice');
} else {
  console.warn('EditStudentModal.tsx section 2 notice not found');
}

fs.writeFileSync(esmPath, isEsmCRLF ? esmNorm.replace(/\n/g, '\r\n') : esmNorm, 'utf8');

// 3. Patch ParentPortal.tsx
const ppPath = path.resolve('client/src/pages/ParentPortal.tsx');
let ppContent = fs.readFileSync(ppPath, 'utf8');
const isPpCRLF = ppContent.includes('\r\n');
let ppNorm = ppContent.replace(/\r\n/g, '\n');

// 3a. Single child pill if children.length === 1
const oldPpChildBar = `        {/* Multi-Child Selector Bar (When Multiple Siblings share Parent Phone) */}
        {children.length > 1 && (
          <div className="mt-5 pt-4 border-t border-white/20 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-bold text-blue-100 shrink-0 mr-1 flex items-center gap-1">
              <Users size={13} />
              <span>Switch Child ({children.length}):</span>
            </span>
            {children.map(child => {
              const isSelected = selectedChildId === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={\`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer \${
                    isSelected 
                      ? 'bg-white text-[#0055FF] shadow-md ring-2 ring-white' 
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }\`}
                >
                  <span className={\`w-2 h-2 rounded-full \${isSelected ? 'bg-[#0055FF]' : 'bg-emerald-300'}\`} />
                  <span>{child.fullName}</span>
                  <span className={\`text-[10px] px-1.5 py-0.5 rounded font-mono \${isSelected ? 'bg-blue-50 text-[#0055FF]' : 'bg-white/20 text-white'}\`}>
                    {child.grade}
                  </span>
                </button>
              );
            })}
          </div>
        )}`;

const newPpChildBar = `        {/* Multi-Child Selector Bar (When Multiple Siblings share Parent Phone) */}
        {children.length > 1 && (
          <div className="mt-5 pt-4 border-t border-white/20 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <span className="text-xs font-bold text-blue-100 shrink-0 mr-1 flex items-center gap-1">
              <Users size={13} />
              <span>Assigned Children ({children.length}):</span>
            </span>
            {children.map(child => {
              const isSelected = selectedChildId === child.id;
              return (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={\`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer \${
                    isSelected 
                      ? 'bg-white text-[#0055FF] shadow-md ring-2 ring-white' 
                      : 'bg-white/15 text-white hover:bg-white/25'
                  }\`}
                >
                  <span className={\`w-2 h-2 rounded-full \${isSelected ? 'bg-[#0055FF]' : 'bg-emerald-300'}\`} />
                  <span>{child.fullName}</span>
                  <span className={\`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold \${isSelected ? 'bg-blue-50 text-[#0055FF]' : 'bg-white/20 text-white'}\`}>
                    {child.studentIdNumber || child.grade}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {children.length === 1 && (
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2">
            <span className="text-xs text-blue-100 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Assigned Student:</span>
              <strong className="text-white font-bold">{children[0].fullName}</strong>
              <span className="font-mono text-[11px] bg-white/20 px-2 py-0.5 rounded-full text-white font-bold">
                ID: {children[0].studentIdNumber}
              </span>
            </span>
          </div>
        )}`;

if (ppNorm.includes(oldPpChildBar.replace(/\r\n/g, '\n'))) {
  ppNorm = ppNorm.replace(oldPpChildBar.replace(/\r\n/g, '\n'), newPpChildBar.replace(/\r\n/g, '\n'));
  console.log('Patched ParentPortal.tsx child selector bar');
} else {
  console.warn('ParentPortal.tsx child selector bar target not found');
}

// 3b. Overview tab Gate Arrival verification method description
const oldPpOverviewMethod = `{todayAttendance
                        ? \`Verified via \${todayAttendance.method === 'RFID' ? '125kHz RFID Card' : todayAttendance.method} • \${todayAttendance.class?.name || 'Academy Gate'}\`
                        : 'Instant check-in timestamp will appear here as soon as the student taps their card.'}`;

const newPpOverviewMethod = `{todayAttendance
                        ? \`Verified via \${todayAttendance.method === 'RFID' ? '125kHz RFID Card' : todayAttendance.method === 'FACE' ? 'Face Recognition Biometrics' : todayAttendance.method === 'QR_CODE' ? 'QR Code Pass' : todayAttendance.method === 'BARCODE' ? 'Barcode Scanner' : todayAttendance.method} • \${todayAttendance.class?.name || 'Academy Gate'}\`
                        : 'Instant check-in timestamp will appear here as soon as the student checks in (Face, RFID, QR, Barcode).'}`;

if (ppNorm.includes(oldPpOverviewMethod.replace(/\r\n/g, '\n'))) {
  ppNorm = ppNorm.replace(oldPpOverviewMethod.replace(/\r\n/g, '\n'), newPpOverviewMethod.replace(/\r\n/g, '\n'));
  console.log('Patched ParentPortal.tsx overview method description');
} else {
  console.warn('ParentPortal.tsx overview method target not found');
}

// 3c. Attendance tab check-in card badge
const oldPpAttBadge = `{todayAttendance.method === 'RFID' ? '125kHz RFID' : todayAttendance.method}`;
const newPpAttBadge = `{todayAttendance.method === 'RFID' ? '125kHz RFID Card' : todayAttendance.method === 'FACE' ? '👤 Face Recognition' : todayAttendance.method === 'QR_CODE' ? '📱 QR Code' : todayAttendance.method === 'BARCODE' ? '🏷️ Barcode' : todayAttendance.method}`;

if (ppNorm.includes(oldPpAttBadge)) {
  ppNorm = ppNorm.split(oldPpAttBadge).join(newPpAttBadge);
  console.log('Patched ParentPortal.tsx attendance badge');
}

// 3d. Attendance tab table method badge
const oldPpTableMethod = `{att.method === 'RFID' ? '125kHz RFID Tag' : att.method}`;
const newPpTableMethod = `{att.method === 'RFID' ? '125kHz RFID' : att.method === 'FACE' ? '👤 Face Recognition' : att.method === 'QR_CODE' ? '📱 QR Code' : att.method === 'BARCODE' ? '🏷️ Barcode' : att.method}`;

if (ppNorm.includes(oldPpTableMethod)) {
  ppNorm = ppNorm.split(oldPpTableMethod).join(newPpTableMethod);
  console.log('Patched ParentPortal.tsx table method badge');
}

fs.writeFileSync(ppPath, isPpCRLF ? ppNorm.replace(/\n/g, '\r\n') : ppNorm, 'utf8');

// 4. Update main.tsx version to 2026.10.24.v10
const mainPath = path.resolve('client/src/main.tsx');
let mainContent = fs.readFileSync(mainPath, 'utf8');
mainContent = mainContent.replace(
  "const APP_BUILD_VERSION = '2026.10.24.v9';",
  "const APP_BUILD_VERSION = '2026.10.24.v10';"
);
fs.writeFileSync(mainPath, mainContent, 'utf8');
console.log('Updated main.tsx build version to 2026.10.24.v10');

console.log('All client patches successfully applied!');
