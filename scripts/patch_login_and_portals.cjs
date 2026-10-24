const fs = require('fs');
const path = require('path');

// 1. Patch Login.tsx
const loginPath = path.resolve('client/src/pages/Login.tsx');
let loginContent = fs.readFileSync(loginPath, 'utf8');
const isLoginCRLF = loginContent.includes('\r\n');
let loginNorm = loginContent.replace(/\r\n/g, '\n');

// 1a. Set default parentPhone to empty string
loginNorm = loginNorm.replace(
  "const [parentPhone, setParentPhone] = useState('077 101 2001');",
  "const [parentPhone, setParentPhone] = useState('');"
);
loginNorm = loginNorm.replace(
  'placeholder="077 101 2001"',
  'placeholder="e.g. 0771234567"'
);

// 1b. Remove Quick Demo Parent Accounts (1-Tap Login) block
const oldDemoBlock = `                {/* Quick 1-Tap Demo Parent Accounts (Styled like the White Outline Buttons in Screenshot) */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
                    Quick Demo Parent Accounts (1-Tap Login)
                  </span>
                  <div className="space-y-2">
                    {[
                      { phone: '077 101 2001', label: 'Continue as Kasun’s Parent (Grade 12)' },
                      { phone: '077 102 2002', label: 'Continue as Nimali’s Parent (Grade 12)' }
                    ].map((demo) => (
                      <button
                        key={demo.phone}
                        type="button"
                        onClick={() => {
                          setParentPhone(demo.phone);
                          handleParentSubmit(undefined, demo.phone);
                        }}
                        className="w-full py-3 px-4 rounded-full bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-[#0055FF]/40 text-slate-800 text-xs font-bold transition-all flex items-center justify-center space-x-2.5 shadow-2xs cursor-pointer"
                      >
                        <span className="w-5 h-5 rounded-full bg-[#0055FF] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          P
                        </span>
                        <span className="truncate">{demo.label}</span>
                      </button>
                    ))}
                  </div>
                </div>`;

if (loginNorm.includes(oldDemoBlock)) {
  loginNorm = loginNorm.replace(oldDemoBlock, '');
  console.log('Removed Quick Demo Parent Accounts from Login.tsx');
} else {
  // Try regex if whitespace slightly differs
  const demoRegex = /\{\/\* Quick 1-Tap Demo Parent Accounts[\s\S]*?<\/div>\s*<\/div>/;
  if (demoRegex.test(loginNorm)) {
    loginNorm = loginNorm.replace(demoRegex, '');
    console.log('Removed Quick Demo Parent Accounts via regex from Login.tsx');
  } else {
    console.warn('Could not find Quick Demo Parent Accounts block in Login.tsx');
  }
}

fs.writeFileSync(loginPath, isLoginCRLF ? loginNorm.replace(/\n/g, '\r\n') : loginNorm, 'utf8');

// 2. Patch ParentPortal.tsx
const ppPath = path.resolve('client/src/pages/ParentPortal.tsx');
let ppContent = fs.readFileSync(ppPath, 'utf8');
const isPpCRLF = ppContent.includes('\r\n');
let ppNorm = ppContent.replace(/\r\n/g, '\n');

// 2a. Remove fallback to /students slice(0, 2)
const oldPpFetchKids = `  // Fetch linked children for this guardian
  useEffect(() => {
    setLoading(true);
    apiRequest<any[]>('/auth/parent-children')
      .then(kids => {
        if (kids && kids.length > 0) {
          setChildren(kids);
          setSelectedChildId(kids[0].id);
        } else {
          apiRequest<any[]>('/students').then(all => {
            const myKids = (all || []).slice(0, 2);
            setChildren(myKids);
            if (myKids.length > 0) setSelectedChildId(myKids[0].id);
          });
        }
      })
      .catch(() => {
        apiRequest<any[]>('/students').then(all => {
          const myKids = (all || []).slice(0, 2);
          setChildren(myKids);
          if (myKids.length > 0) setSelectedChildId(myKids[0].id);
        });
      })
      .finally(() => setLoading(false));
  }, []);`;

const newPpFetchKids = `  // Fetch linked children strictly for this logged-in guardian only
  useEffect(() => {
    setLoading(true);
    apiRequest<any[]>('/auth/parent-children')
      .then(kids => {
        if (kids && kids.length > 0) {
          setChildren(kids);
          setSelectedChildId(kids[0].id);
        } else {
          setChildren([]);
          setSelectedChildId('');
          setChildData(null);
        }
      })
      .catch((err) => {
        console.warn('Could not load parent children:', err);
        setChildren([]);
        setSelectedChildId('');
        setChildData(null);
      })
      .finally(() => setLoading(false));
  }, []);`;

if (ppNorm.includes(oldPpFetchKids)) {
  ppNorm = ppNorm.replace(oldPpFetchKids, newPpFetchKids);
  console.log('Removed /students fallback from ParentPortal.tsx');
} else {
  console.warn('Could not find oldPpFetchKids in ParentPortal.tsx');
}

// 2b. Add clean empty state if !loading && !childData
const oldPpEmptyFallback = `        </div>
      ) : null}`;

const newPpEmptyFallback = `        </div>
      ) : (
        <div className="py-20 px-6 max-w-lg mx-auto text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
            <Users size={28} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">No Student Linked to Your Account</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              We could not find any active student profile associated with your login mobile number <span className="font-mono font-bold text-slate-800">({user?.phone || 'N/A'})</span>.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Please check with the academy office that your registered mobile number is added to your child's student profile.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
          >
            Check Again
          </button>
        </div>
      )}`;

if (ppNorm.includes(oldPpEmptyFallback)) {
  ppNorm = ppNorm.replace(oldPpEmptyFallback, newPpEmptyFallback);
  console.log('Added empty state for unlinked parents in ParentPortal.tsx');
} else {
  console.warn('Could not find oldPpEmptyFallback in ParentPortal.tsx');
}

fs.writeFileSync(ppPath, isPpCRLF ? ppNorm.replace(/\n/g, '\r\n') : ppNorm, 'utf8');

// 3. Patch StudentPortal.tsx
const spPath = path.resolve('client/src/pages/StudentPortal.tsx');
let spContent = fs.readFileSync(spPath, 'utf8');
const isSpCRLF = spContent.includes('\r\n');
let spNorm = spContent.replace(/\r\n/g, '\n');

// 3a. Remove fallback to /students[0]
const oldSpLoad = `    const loadStudent = async () => {
      try {
        if (user?.studentId) {
          const res = await apiRequest(\`/students/\${user.studentId}\`);
          setProfile(res);
          return;
        }
        const students = await apiRequest<any[]>('/students');
        if (students && students.length > 0) {
          const res = await apiRequest(\`/students/\${students[0].id}\`);
          setProfile(res);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };`;

const newSpLoad = `    const loadStudent = async () => {
      try {
        if (user?.studentId) {
          const res = await apiRequest(\`/students/\${user.studentId}\`);
          setProfile(res);
          return;
        }
        // Strict: only show the logged in student account
        setProfile(null);
      } catch (e) {
        console.error('Failed to load student profile:', e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };`;

if (spNorm.includes(oldSpLoad)) {
  spNorm = spNorm.replace(oldSpLoad, newSpLoad);
  console.log('Removed /students fallback from StudentPortal.tsx');
} else {
  console.warn('Could not find oldSpLoad in StudentPortal.tsx');
}

// 3b. Add clean empty state in StudentPortal if !loading && !profile
const oldSpEmpty = `      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading student portal...</div>
      ) : profile ? (`;

const newSpEmpty = `      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading student portal...</div>
      ) : profile ? (`;

// Check where profile ends in StudentPortal.tsx
const oldSpEnd = `        </div>
      ) : null}`;

const newSpEnd = `        </div>
      ) : (
        <div className="py-20 px-6 max-w-lg mx-auto text-center bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-[#0055FF] border border-blue-200 flex items-center justify-center mx-auto">
            <BookOpen size={28} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Student Profile Not Linked</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Your logged-in user account <span className="font-mono font-bold text-slate-800">(@{user?.username})</span> is not yet connected to a registered student ID.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Please contact academy administration to attach your student record to this login.
            </p>
          </div>
        </div>
      )}`;

if (spNorm.includes(oldSpEnd)) {
  spNorm = spNorm.replace(oldSpEnd, newSpEnd);
  console.log('Added empty state for unlinked students in StudentPortal.tsx');
} else {
  console.warn('Could not find oldSpEnd in StudentPortal.tsx');
}

fs.writeFileSync(spPath, isSpCRLF ? spNorm.replace(/\n/g, '\r\n') : spNorm, 'utf8');

// 4. Patch Header.tsx to hide role preview switcher from parents and students
const headerPath = path.resolve('client/src/components/Header.tsx');
let headerContent = fs.readFileSync(headerPath, 'utf8');
const isHeaderCRLF = headerContent.includes('\r\n');
let headerNorm = headerContent.replace(/\r\n/g, '\n');

const oldHeaderRoleSwitcher = `              {/* Role preview switcher */}
              <div className="px-2 pb-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Preview System Role
                </p>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                  {availableRoles.map(item => (
                    <button
                      key={item.role}
                      onClick={() => {
                        switchRole(item.role);
                        setUserMenuOpen(false);
                      }}
                      className={\`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-xs \${
                        user?.role === item.role 
                          ? 'bg-slate-900 text-white font-semibold' 
                          : 'text-slate-700 hover:bg-slate-100'
                      }\`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className={\`w-2 h-2 rounded-full \${user?.role === item.role ? 'bg-emerald-400' : 'bg-slate-400'}\`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {user?.role === item.role && (
                        <Check size={13} className="text-emerald-400 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>`;

const newHeaderRoleSwitcher = `              {/* Role preview switcher - strictly for Admin testing only */}
              {['SUPER_ADMIN', 'ADMIN'].includes(user?.role || '') && (
                <div className="px-2 pb-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Preview System Role
                  </p>
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {availableRoles.map(item => (
                      <button
                        key={item.role}
                        onClick={() => {
                          switchRole(item.role);
                          setUserMenuOpen(false);
                        }}
                        className={\`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer text-xs \${
                          user?.role === item.role 
                            ? 'bg-slate-900 text-white font-semibold' 
                            : 'text-slate-700 hover:bg-slate-100'
                        }\`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <span className={\`w-2 h-2 rounded-full \${user?.role === item.role ? 'bg-emerald-400' : 'bg-slate-400'}\`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {user?.role === item.role && (
                          <Check size={13} className="text-emerald-400 shrink-0 ml-2" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}`;

if (headerNorm.includes(oldHeaderRoleSwitcher)) {
  headerNorm = headerNorm.replace(oldHeaderRoleSwitcher, newHeaderRoleSwitcher);
  console.log('Restricted role switcher to Admins in Header.tsx');
} else {
  console.warn('Could not find role switcher in Header.tsx');
}

fs.writeFileSync(headerPath, isHeaderCRLF ? headerNorm.replace(/\n/g, '\r\n') : headerNorm, 'utf8');

// 5. Update main.tsx version
const mainPath = path.resolve('client/src/main.tsx');
let mainContent = fs.readFileSync(mainPath, 'utf8');
mainContent = mainContent.replace(
  "const APP_BUILD_VERSION = '2026.10.24.v10';",
  "const APP_BUILD_VERSION = '2026.10.24.v11';"
);
fs.writeFileSync(mainPath, mainContent, 'utf8');
console.log('Updated main.tsx build version to 2026.10.24.v11');

console.log('All patches applied successfully!');
