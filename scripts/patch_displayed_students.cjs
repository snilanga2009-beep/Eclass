const fs = require('fs');
const path = require('path');

const studentsPath = path.join(__dirname, '..', 'client', 'src', 'pages', 'Students.tsx');
let c = fs.readFileSync(studentsPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Add displayedStudents computed list before table render
const oldFilterBarEnd = `          {/* Class filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none max-w-[160px] truncate"
          >
            <option value="ALL">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>`;

const newFilterBarEnd = `          {/* Class filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none max-w-[160px] truncate"
          >
            <option value="ALL">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Biometrics Face Recognition Filter */}
          <select
            value={faceFilter}
            onChange={(e) => setFaceFilter(e.target.value as any)}
            className={\`px-3 py-2 rounded-xl border text-xs font-bold transition-all focus:outline-none \${
              faceFilter !== 'ALL'
                ? 'bg-purple-50 text-purple-700 border-purple-300 ring-1 ring-purple-400'
                : 'bg-slate-50 text-slate-700 border-slate-200'
            }\`}
          >
            <option value="ALL">All Biometrics</option>
            <option value="ENROLLED">👤 Face Enrolled ✓ ({students.filter(s => s.hasFaceEnrolled).length})</option>
            <option value="MISSING">⚠️ Missing Face ({students.filter(s => !s.hasFaceEnrolled).length})</option>
          </select>
        </div>
      </div>`;

if (c.includes(oldFilterBarEnd)) {
  c = c.replace(oldFilterBarEnd, newFilterBarEnd);
  console.log('Biometrics filter dropdown added');
} else {
  console.log('Filter bar end target not found');
}

// 2. Define displayedStudents right above table
const oldTableStart = `      {/* Desktop Students Data Table (hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">`;

const newTableStart = `      {/* Desktop Students Data Table (hidden on mobile) */}
      {(() => {
        return null;
      })()}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">`;

// Let's define displayedStudents at component body level
const oldStudentsState = `  const [faceFilter, setFaceFilter] = useState<'ALL' | 'ENROLLED' | 'MISSING'>('ALL');`;
const newStudentsState = `  const [faceFilter, setFaceFilter] = useState<'ALL' | 'ENROLLED' | 'MISSING'>('ALL');

  const displayedStudents = students.filter(s => {
    if (faceFilter === 'ENROLLED' && !s.hasFaceEnrolled) return false;
    if (faceFilter === 'MISSING' && s.hasFaceEnrolled) return false;
    return true;
  });`;

if (c.includes(oldStudentsState)) {
  c = c.replace(oldStudentsState, newStudentsState);
  console.log('displayedStudents variable added');
}

// 3. Replace students.length check and students.map for table
c = c.replace(
  `} : students.length === 0 ? (`,
  `} : displayedStudents.length === 0 ? (`
);
c = c.replace(
  `students.map(s => (`,
  `displayedStudents.map(s => (`
);

// 4. Replace students.length and students.map for mobile cards
c = c.replace(
  `} : students.length === 0 ? (\n          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">`,
  `} : displayedStudents.length === 0 ? (\n          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">`
);
c = c.replace(
  `students.map(s => {\n            const rawPhone`,
  `displayedStudents.map(s => {\n            const rawPhone`
);

fs.writeFileSync(studentsPath, c.replace(/\n/g, '\r\n'), 'utf8');
console.log('displayedStudents applied successfully in Students.tsx');
