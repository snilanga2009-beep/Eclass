const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'client', 'src', 'components', 'StudentProfileModal.tsx');
let code = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

// 1. Ensure ChevronLeft, ChevronRight, and icons are imported
if (!code.includes('ChevronLeft,')) {
  code = code.replace(
    "import {\n  X,",
    "import {\n  X,\n  ChevronLeft,\n  ChevronRight,"
  );
  console.log('ChevronLeft, ChevronRight imported');
}

// 2. Add tabsRef state & scrollTabs helper
const oldRefTarget = `  const profileFileInputRef = useRef<HTMLInputElement>(null);`;
const newRefTarget = `  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const scrollTabs = (direction: 'left' | 'right') => {
    if (tabsRef.current) {
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -220 : 220,
        behavior: 'smooth'
      });
    }
  };`;

if (code.includes(oldRefTarget) && !code.includes('const tabsRef =')) {
  code = code.replace(oldRefTarget, newRefTarget);
  console.log('tabsRef and scrollTabs helper added');
}

// 3. Update Modal Container from fixed p-3 sm:p-6 max-w-4xl to full responsive mobile/desktop
const oldModalContainer = `<div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh]">`;

const newModalContainer = `<div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full h-full sm:h-[92vh] sm:max-w-5xl bg-white rounded-none sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">`;

if (code.includes(oldModalContainer)) {
  code = code.replace(oldModalContainer, newModalContainer);
  console.log('Modal container responsive classes updated');
}

// 4. Overhaul Profile Header and Action Bar so nothing ever collides or overlaps
const oldHeaderBlock = `        {/* Profile Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} />
          </button>

          {loading ? (
            <div className="py-6 text-xs text-slate-400">Loading student details...</div>
          ) : student ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center space-x-4">
                {/* Profile Image & Quick Avatar Controls */}
                <div className="relative group shrink-0">
                  <img 
                    src={getStudentAvatar(student)} 
                    alt={student.fullName} 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/20 shrink-0 shadow-xl bg-slate-800"
                  />
                  {updatingAvatar && (
                    <div className="absolute inset-0 bg-slate-900/70 rounded-2xl flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <button
                    onClick={() => profileFileInputRef.current?.click()}
                    title="Upload Custom Student Photo"
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-md border-2 border-slate-900 transition-transform active:scale-95"
                  >
                    <Camera size={12} />
                  </button>
                  <input
                    type="file"
                    ref={profileFileInputRef}
                    onChange={handleProfileImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{student.fullName}</h2>
                    <button
                      type="button"
                      onClick={handleToggleStatus}
                      disabled={updatingStatus}
                      title="Click to toggle Active / Inactive status"
                      className={\`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm \${
                        student.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                      }\`}
                    >
                      <span className={\`w-2 h-2 rounded-full \${student.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}\`}></span>
                      <span>{student.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                      <span className="text-[10px] opacity-75 font-normal underline ml-0.5">
                        {updatingStatus ? 'Saving...' : 'Switch'}
                      </span>
                    </button>
                  </div>
                  <p className="text-xs text-brand-300 font-mono font-medium mt-0.5">
                    {student.studentIdNumber} • {student.grade} • {student.school || 'Private Candidate'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    {student.phone && <span className="flex items-center gap-1"><Phone size={12} /> {student.phone}</span>}
                    {student.parentPhone && <span className="flex items-center gap-1">Guardian: {student.parentPhone}</span>}
                  </p>

                  {/* 2 Selectable Avatar Icon Quick Toggle (Male / Female) */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 font-semibold">Avatar Icon:</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateProfileAvatar(MALE_STUDENT_AVATAR)}
                      disabled={updatingAvatar}
                      className={\`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all \${
                        student.photo === MALE_STUDENT_AVATAR || (!student.photo && student.gender === 'Male')
                          ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-300 font-bold'
                          : 'bg-white/10 hover:bg-white/20 text-slate-300'
                      }\`}
                      title="Set Male Student Avatar Icon"
                    >
                      <span>👦</span>
                      <span>Male Icon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateProfileAvatar(FEMALE_STUDENT_AVATAR)}
                      disabled={updatingAvatar}
                      className={\`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all \${
                        student.photo === FEMALE_STUDENT_AVATAR || (!student.photo && student.gender === 'Female')
                          ? 'bg-pink-600 text-white shadow-sm ring-1 ring-pink-300 font-bold'
                          : 'bg-white/10 hover:bg-white/20 text-slate-300'
                      }\`}
                      title="Set Female Student Avatar Icon"
                    >
                      <span>👧</span>
                      <span>Female Icon</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-brand-500/30 hover:bg-brand-500/40 text-brand-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-brand-400/30 shadow-sm"
                  title="Add or Change Enrolled Classes"
                >
                  <BookOpen size={14} />
                  <span>Classes ({student.enrollments?.length || 0})</span>
                </button>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-amber-400/30 shadow-sm"
                  title="Edit Student Details & Parent Phone"
                >
                  <Edit3 size={14} />
                  <span>Edit Student</span>
                </button>
                <button
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
                </button>
                <button
                  onClick={() => onOpenIDCard(student.id)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
                >
                  <QrCode size={14} />
                  <span>Student ID Card</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>`;

const newHeaderBlock = `        {/* Profile Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 relative shrink-0 space-y-4">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer z-20"
            title="Close Profile (Esc)"
          >
            <X size={18} />
          </button>

          {loading ? (
            <div className="py-6 text-xs text-slate-400">Loading student details...</div>
          ) : student ? (
            <>
              {/* Row 1: Student Avatar, Name, Status & Contacts */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-10">
                <div className="flex items-start sm:items-center space-x-3.5 min-w-0">
                  {/* Profile Image & Quick Avatar Controls */}
                  <div className="relative group shrink-0">
                    <img 
                      src={getStudentAvatar(student)} 
                      alt={student.fullName} 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/20 shrink-0 shadow-xl bg-slate-800"
                    />
                    {updatingAvatar && (
                      <div className="absolute inset-0 bg-slate-900/70 rounded-2xl flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    <button
                      onClick={() => profileFileInputRef.current?.click()}
                      title="Upload Custom Student Photo"
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-md border-2 border-slate-900 transition-transform active:scale-95 cursor-pointer"
                    >
                      <Camera size={12} />
                    </button>
                    <input
                      type="file"
                      ref={profileFileInputRef}
                      onChange={handleProfileImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-xl font-bold text-white tracking-tight truncate">{student.fullName}</h2>
                      <button
                        type="button"
                        onClick={handleToggleStatus}
                        disabled={updatingStatus}
                        title="Click to toggle Active / Inactive status"
                        className={\`px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-sm \${
                          student.status === 'ACTIVE'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                        }\`}
                      >
                        <span className={\`w-2 h-2 rounded-full \${student.status === 'ACTIVE' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}\`}></span>
                        <span>{student.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                        <span className="text-[9px] opacity-75 font-normal underline ml-0.5">
                          {updatingStatus ? 'Saving...' : 'Switch'}
                        </span>
                      </button>
                    </div>

                    <p className="text-xs text-brand-300 font-mono font-medium mt-1 truncate">
                      {student.studentIdNumber} • <span className="text-white font-semibold">{student.grade}</span> • {student.school || 'Private Candidate'}
                    </p>

                    <div className="text-[11px] text-slate-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      {student.phone && (
                        <span className="flex items-center gap-1 text-slate-300">
                          <Phone size={11} className="text-slate-400" />
                          <span>{student.phone}</span>
                        </span>
                      )}
                      {student.parentPhone && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <span>Guardian:</span>
                          <span className="text-slate-200 font-semibold">{student.parentPhone}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Avatar Icon Quick Toggle (Male / Female) */}
                <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0 bg-white/5 p-1.5 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 font-semibold pl-1">Avatar:</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateProfileAvatar(MALE_STUDENT_AVATAR)}
                    disabled={updatingAvatar}
                    className={\`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer \${
                      student.photo === MALE_STUDENT_AVATAR || (!student.photo && student.gender === 'Male')
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-300 font-bold'
                        : 'bg-white/10 hover:bg-white/20 text-slate-300'
                    }\`}
                    title="Set Male Student Avatar Icon"
                  >
                    <span>👦</span>
                    <span>Male</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateProfileAvatar(FEMALE_STUDENT_AVATAR)}
                    disabled={updatingAvatar}
                    className={\`px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer \${
                      student.photo === FEMALE_STUDENT_AVATAR || (!student.photo && student.gender === 'Female')
                        ? 'bg-pink-600 text-white shadow-sm ring-1 ring-pink-300 font-bold'
                        : 'bg-white/10 hover:bg-white/20 text-slate-300'
                    }\`}
                    title="Set Female Student Avatar Icon"
                  >
                    <span>👧</span>
                    <span>Female</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Dedicated Responsive Action Bar (No Collisions or Text Overlaps) */}
              <div className="p-2 sm:p-2.5 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none flex-wrap">
                {/* 1. Enroll / Update Face Biometrics */}
                <button
                  onClick={() => setIsFaceEnrollOpen(true)}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer shrink-0 \${
                    student.hasFaceEnrolled
                      ? 'bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 hover:text-white border border-purple-400/40'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/30 ring-1 ring-white/20'
                  }\`}
                  title={student.hasFaceEnrolled ? 'Face Enrolled: Update / Re-capture Biometric Template' : 'Enroll Face Recognition Biometrics'}
                >
                  <UserCheck size={14} className={student.hasFaceEnrolled ? 'text-emerald-400' : 'text-purple-200'} />
                  <span>{student.hasFaceEnrolled ? 'Face: Enrolled ✓' : '👤 Enroll Face'}</span>
                </button>

                {/* 2. Assign / Reassign RFID */}
                <button
                  onClick={() => setIsAssignRfidOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-indigo-400/30 shadow-sm cursor-pointer shrink-0"
                  title={student.rfidTag ? \`Current RFID: \${student.rfidTag}\` : 'Assign 125kHz RFID Card'}
                >
                  <Radio size={14} className={student.rfidTag ? 'text-emerald-400' : 'text-slate-300'} />
                  <span>{student.rfidTag ? \`RFID: \${student.rfidTag}\` : 'Assign RFID'}</span>
                </button>

                {/* 3. Edit Student Details */}
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-amber-400/30 shadow-sm cursor-pointer shrink-0"
                  title="Edit Student Details & Parent Phone"
                >
                  <Edit3 size={14} />
                  <span>Edit Details</span>
                </button>

                {/* 4. Enrolled Classes Tab Jump */}
                <button
                  onClick={() => setActiveTab('classes')}
                  className="px-3 py-1.5 rounded-xl bg-brand-500/25 hover:bg-brand-500/40 text-brand-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-brand-400/30 shadow-sm cursor-pointer shrink-0"
                  title="View and Manage Enrolled Classes"
                >
                  <BookOpen size={14} />
                  <span>Classes ({student.enrollments?.length || 0})</span>
                </button>

                {/* 5. Student ID Card Pass */}
                <button
                  onClick={() => onOpenIDCard(student.id)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10 cursor-pointer shrink-0"
                  title="View and Print Student ID Card with QR & Barcode"
                >
                  <QrCode size={14} />
                  <span>ID Card Pass</span>
                </button>
              </div>
            </>
          ) : null}
        </div>`;

if (code.includes(oldHeaderBlock)) {
  code = code.replace(oldHeaderBlock, newHeaderBlock);
  console.log('Profile Header overhaul applied cleanly');
} else {
  console.log('Profile Header target not found');
}

// 5. Overhaul Tab Navigation Strip with Scroll Arrows & Mobile Dropdown
const oldTabStrip = `        {/* Tab Navigation Strip */}
        <div className="flex items-center space-x-1 px-4 py-2 border-b border-slate-200 bg-slate-50 overflow-x-auto scrollbar-none shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={\`
                  flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                  \${isActive 
                    ? 'bg-white text-brand-700 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}
                \`}
              >
                <Icon size={14} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={\`px-1.5 py-0.2 rounded-full text-[10px] font-bold \${
                    isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'
                  }\`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>`;

const newTabStrip = `        {/* Mobile Tab Quick Dropdown (Visible on Phone Screens < sm) */}
        <div className="sm:hidden px-3.5 py-2 bg-slate-100 border-b border-slate-200 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Select Tab:</span>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white shadow-xs focus:ring-2 focus:ring-brand-500"
            >
              {tabs.map(tab => (
                <option key={tab.id} value={tab.id}>
                  {tab.label} {tab.count !== undefined && tab.count > 0 ? \`(\${tab.count})\` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab Navigation Strip (All 10 Tabs with Left/Right Scroll Arrows) */}
        <div className="relative border-b border-slate-200 bg-slate-50 flex items-center shrink-0">
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 transition-colors z-10 shrink-0 cursor-pointer hidden sm:flex items-center justify-center border-r border-slate-200"
            title="Scroll tabs left"
          >
            <ChevronLeft size={16} />
          </button>

          <div
            ref={tabsRef}
            className="flex-1 flex items-center space-x-1 px-3 py-2 overflow-x-auto scroll-smooth scrollbar-none"
          >
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={\`
                    flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer
                    \${isActive 
                      ? 'bg-white text-brand-700 shadow-sm border border-slate-200 font-bold ring-1 ring-brand-500/20' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}
                  \`}
                >
                  <Icon size={14} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={\`px-1.5 py-0.2 rounded-full text-[10px] font-bold \${
                      isActive ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-600'
                    }\`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollTabs('right')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 transition-colors z-10 shrink-0 cursor-pointer hidden sm:flex items-center justify-center border-l border-slate-200"
            title="Scroll tabs right"
          >
            <ChevronRight size={16} />
          </button>
        </div>`;

if (code.includes(oldTabStrip)) {
  code = code.replace(oldTabStrip, newTabStrip);
  console.log('Tab Navigation strip overhauled with Scroll Arrows & Mobile Dropdown');
} else {
  console.log('Tab Strip target not found');
}

fs.writeFileSync(filePath, code.replace(/\n/g, '\r\n'), 'utf8');
console.log('StudentProfileModal.tsx updated successfully');
